"""Demo/simulation scenarios so a future frontend has one-call demos.

Each scenario reuses existing seeded demo entities (created by
app.seed.seed_baseline at startup) where possible, applies a realistic
telemetry/state snapshot, runs the relevant scoring services, persists any
resulting incidents, and broadcasts the outcome over the safety-alerts
WebSocket channel.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import (
    AckStatus,
    CommunicationStatus,
    IncidentType,
    SeatbeltStatus,
    Severity,
    TruckState,
)
from app.models.health import MachineHealthRecord
from app.models.machine import Machine
from app.models.operator import Operator
from app.models.truck import AutonomousTruck
from app.schemas.common import SAFETY_DISCLAIMER
from app.services import fatigue_service, incident_service, machine_health_service, safety_risk_engine
from app.services.collision_service import evaluate_collision_risk
from app.services.websocket_manager import manager

SCENARIO_NAMES = [
    "normal_loading_cycle",
    "seatbelt_violation",
    "state_transition_risk",
    "fatigue_break_alert",
    "machine_health_risk",
    "low_visibility_collision_risk",
]


def _first_operator(db: Session) -> Operator | None:
    return db.scalars(select(Operator).order_by(Operator.created_at.asc())).first()


def _first_machine(db: Session) -> Machine | None:
    return db.scalars(select(Machine).order_by(Machine.created_at.asc())).first()


def _truck_by_code(db: Session, code: str) -> AutonomousTruck | None:
    return db.scalars(select(AutonomousTruck).where(AutonomousTruck.truck_code == code)).first()


def _first_truck(db: Session) -> AutonomousTruck | None:
    return db.scalars(select(AutonomousTruck).order_by(AutonomousTruck.created_at.asc())).first()


async def _broadcast(payload: dict) -> None:
    try:
        await manager.broadcast("safety-alerts", payload)
    except Exception:  # noqa: BLE001
        pass


def _run_scenario_normal_loading_cycle(db: Session) -> dict:
    operator = _first_operator(db)
    machine = _first_machine(db)
    truck = _first_truck(db)
    steps = [{"step": "telemetry", "detail": "Machine loading crushed aggregate, no hazards detected."}]
    result = safety_risk_engine.evaluate_state_transition_risk(
        truck_state=TruckState.NORMAL,
        active_mission=True,
        communication_status=CommunicationStatus.OK,
        distance_m=80.0,
        visibility_score=1.0,
        seatbelt_status=SeatbeltStatus.FASTENED,
    )
    return {
        "scenario_name": "normal_loading_cycle",
        "description": "Baseline healthy loading cycle with an autonomous truck operating normally at safe distance.",
        "steps": steps,
        "resulting_incidents": [],
        "final_risk_summary": {
            "risk_score": result.risk_score,
            "risk_level": result.risk_level,
            "operator_id": operator.id if operator else None,
            "machine_id": machine.id if machine else None,
            "truck_id": truck.id if truck else None,
        },
    }


def _run_scenario_seatbelt_violation(db: Session) -> dict:
    operator = _first_operator(db)
    machine = _first_machine(db)
    truck = _truck_by_code(db, "AHT-07") or _first_truck(db)

    seatbelt_result = safety_risk_engine.evaluate_seatbelt(
        seatbelt_status=SeatbeltStatus.UNFASTENED,
        engine_running=True,
        machine_moving=True,
        nearest_truck_state=truck.state if truck else None,
        distance_to_truck_m=12.0,
    )
    incidents = []
    if seatbelt_result.auto_incident_required and operator and machine:
        incident = incident_service.create_incident(
            db,
            incident_type=IncidentType.SEATBELT_VIOLATION,
            severity=seatbelt_result.severity or Severity.HIGH,
            risk_score=seatbelt_result.risk_score,
            machine_id=machine.id,
            operator_id=operator.id,
            truck_id=truck.id if truck else None,
            context={"scenario": "seatbelt_violation", "factors": seatbelt_result.contributing_factors},
            recommended_action=seatbelt_result.recommended_action,
        )
        incidents.append(incident_service.incident_to_dict(incident))

    return {
        "scenario_name": "seatbelt_violation",
        "description": "Operator seatbelt unfastened while machine moves near a truck in EXCEPTION/RECOVERY.",
        "steps": [
            {"step": "seatbelt_check", "detail": "Seatbelt UNFASTENED detected while engine running and machine moving."}
        ],
        "resulting_incidents": incidents,
        "final_risk_summary": {
            "risk_score": seatbelt_result.risk_score,
            "risk_level": seatbelt_result.risk_level,
        },
    }


def _run_scenario_state_transition_risk(db: Session) -> dict:
    """The flagship AHT-07 scenario described in the project brief."""
    operator = _first_operator(db)
    machine = _first_machine(db)
    truck = _truck_by_code(db, "AHT-07") or _first_truck(db)

    steps = [
        {"step": "mission_active", "detail": "AHT-07 has an active mission."},
        {"step": "communication_condition", "detail": "A communication-related condition occurs."},
        {"step": "state_change", "detail": "Truck transitions to EXCEPTION and stops."},
        {"step": "human_approach", "detail": "A human operator approaches for recovery."},
        {"step": "nearby_condition_change", "detail": "A nearby recovery/support vehicle leaves, changing a relevant condition."},
        {"step": "reevaluation", "detail": "Autonomous system reevaluates conditions; prior mission is still active."},
    ]

    result = safety_risk_engine.evaluate_state_transition_risk(
        truck_state=TruckState.RECOVERY,
        active_mission=True,
        communication_status=CommunicationStatus.DEGRADED,
        distance_m=14.0,
        nearby_condition_change=True,
        recovery_personnel_active=True,
        safe_to_approach_confirmed=False,
        visibility_score=0.9,
        seatbelt_status=SeatbeltStatus.FASTENED,
    )

    incidents = []
    if result.auto_incident_required and operator and machine:
        incident = incident_service.create_incident(
            db,
            incident_type=result.incident_type or IncidentType.STATE_TRANSITION_RISK,
            severity=result.severity or Severity.CRITICAL,
            risk_score=result.risk_score,
            machine_id=machine.id,
            operator_id=operator.id,
            truck_id=truck.id if truck else None,
            context={"scenario": "state_transition_risk", "factors": result.contributing_factors},
            state_before="EXCEPTION",
            state_after="RECOVERY",
            recommended_action=result.recommended_action,
        )
        incidents.append(incident_service.incident_to_dict(incident))

    return {
        "scenario_name": "state_transition_risk",
        "description": (
            "AHT-07 flagship scenario: active mission + communication condition -> EXCEPTION -> human "
            "approaches for recovery -> nearby condition changes -> state transition risk toward NORMAL."
        ),
        "steps": steps,
        "resulting_incidents": incidents,
        "final_risk_summary": {
            "risk_score": result.risk_score,
            "risk_level": result.risk_level,
            "contributing_factors": result.contributing_factors,
            "recommended_action": result.recommended_action,
        },
    }


def _run_scenario_fatigue_break_alert(db: Session) -> dict:
    operator = _first_operator(db)
    result = fatigue_service.evaluate_fatigue(
        continuous_work_hours=8.5,
        hours_since_last_break=3.2,
        harsh_event_count=4,
        productivity_decline_pct=18.0,
        is_night_shift=False,
    )
    return {
        "scenario_name": "fatigue_break_alert",
        "description": "Long continuous shift with no recent break and declining productivity.",
        "steps": [{"step": "fatigue_evaluation", "detail": result.message}],
        "resulting_incidents": [],
        "final_risk_summary": {
            "operator_id": operator.id if operator else None,
            "fatigue_score": result.fatigue_score,
            "fatigue_level": result.fatigue_level,
            "recommended_break_minutes": result.recommended_break_minutes,
            "break_due": result.break_due,
        },
    }


def _run_scenario_machine_health_risk(db: Session) -> dict:
    machine = _first_machine(db)
    result = machine_health_service.evaluate_machine_health(
        engine_hours=8200.0,
        engine_temperature_c=109.0,
        oil_pressure_kpa=180.0,
        coolant_temperature_c=98.0,
        hydraulic_temperature_c=88.0,
        vibration_rms=8.2,
        fault_code_count=3,
        fuel_consumption_change_pct=24.0,
        maintenance_overdue_days=12.0,
        recent_anomaly_count=2,
    )
    health_record = None
    if machine:
        health_record = MachineHealthRecord(
            machine_id=machine.id,
            engine_hours=8200.0,
            engine_temperature_c=109.0,
            oil_pressure_kpa=180.0,
            coolant_temperature_c=98.0,
            hydraulic_temperature_c=88.0,
            vibration_rms=8.2,
            fault_code_count=3,
            fuel_consumption_change_pct=24.0,
            maintenance_overdue_days=12.0,
            recent_anomaly_count=2,
            failure_risk_score=result.failure_risk_score,
            risk_level=result.risk_level,
            likely_subsystem=result.likely_subsystem,
        )
        db.add(health_record)
        db.commit()

    incidents = []
    if result.risk_level in ("HIGH", "CRITICAL") and machine:
        incident = incident_service.create_incident(
            db,
            incident_type=IncidentType.PREDICTED_MACHINE_FAILURE,
            severity=Severity(result.risk_level),
            risk_score=result.failure_risk_score,
            machine_id=machine.id,
            context={"scenario": "machine_health_risk", "factors": result.contributing_factors},
            recommended_action=result.recommended_action,
        )
        incidents.append(incident_service.incident_to_dict(incident))

    return {
        "scenario_name": "machine_health_risk",
        "description": "Elevated engine temperature, low oil pressure, high vibration and overdue maintenance.",
        "steps": [{"step": "health_evaluation", "detail": result.recommended_action}],
        "resulting_incidents": incidents,
        "final_risk_summary": {
            "failure_risk_score": result.failure_risk_score,
            "risk_level": result.risk_level,
            "likely_subsystem": result.likely_subsystem,
        },
    }


def _run_scenario_low_visibility_collision_risk(db: Session) -> dict:
    operator = _first_operator(db)
    machine = _first_machine(db)
    truck = _first_truck(db)

    result = evaluate_collision_risk(
        truck_state=TruckState.NORMAL,
        active_mission=True,
        communication_status=CommunicationStatus.OK,
        distance_m=18.0,
        machine_speed_kmh=8.0,
        truck_speed_kmh=15.0,
        closing=True,
        visibility_score=0.35,
        site_congestion_level=0.6,
        blind_spot=True,
    )
    incidents = []
    if result.auto_incident_required and operator and machine:
        incident = incident_service.create_incident(
            db,
            incident_type=IncidentType.VISIBILITY_HAZARD,
            severity=Severity(result.severity),
            risk_score=result.collision_risk_score,
            machine_id=machine.id,
            operator_id=operator.id,
            truck_id=truck.id if truck else None,
            context={"scenario": "low_visibility_collision_risk", "factors": result.factors},
            recommended_action=result.recommended_action,
        )
        incidents.append(incident_service.incident_to_dict(incident))

    return {
        "scenario_name": "low_visibility_collision_risk",
        "description": "Dust/rain reduces visibility while machine and truck are on a closing path in a congested zone.",
        "steps": [{"step": "collision_evaluation", "detail": result.recommended_action}],
        "resulting_incidents": incidents,
        "final_risk_summary": {
            "collision_risk_score": result.collision_risk_score,
            "severity": result.severity,
            "time_to_proximity_sec": result.time_to_proximity_sec,
        },
    }


_SCENARIO_FUNCS = {
    "normal_loading_cycle": _run_scenario_normal_loading_cycle,
    "seatbelt_violation": _run_scenario_seatbelt_violation,
    "state_transition_risk": _run_scenario_state_transition_risk,
    "fatigue_break_alert": _run_scenario_fatigue_break_alert,
    "machine_health_risk": _run_scenario_machine_health_risk,
    "low_visibility_collision_risk": _run_scenario_low_visibility_collision_risk,
}


def run_scenario(db: Session, scenario_name: str) -> dict:
    if scenario_name not in _SCENARIO_FUNCS:
        raise ValueError(f"Unknown scenario '{scenario_name}'. Valid options: {SCENARIO_NAMES}")
    result = _SCENARIO_FUNCS[scenario_name](db)
    result["disclaimer"] = SAFETY_DISCLAIMER

    payload = {
        "event": "simulation_scenario",
        "scenario_name": scenario_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "final_risk_summary": result["final_risk_summary"],
        "incident_count": len(result["resulting_incidents"]),
    }
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(_broadcast(payload))
        else:
            loop.run_until_complete(_broadcast(payload))
    except RuntimeError:
        pass

    return result
