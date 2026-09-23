"""Telemetry ingestion endpoint. This is the core Digital Twin data path:
every submitted telemetry record is scored for efficiency, state-transition
risk, collision risk, fatigue, anomaly and failure risk, persisted, and
broadcast over WebSockets. Safety-relevant results may auto-create
incidents.
"""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import (
    CommunicationStatus,
    IncidentType,
    SeatbeltStatus,
    Severity,
    TruckState,
)
from app.models.telemetry import TelemetryRecord
from app.schemas.telemetry import TelemetryIn, TelemetryOut
from app.services import anomaly_service, efficiency_service, fatigue_service, incident_service, machine_health_service
from app.services.safety_risk_engine import evaluate_seatbelt, evaluate_state_transition_risk
from app.services.websocket_manager import manager

router = APIRouter(prefix="/api/v1/telemetry", tags=["telemetry"])


def _safe_enum(enum_cls, value, default):
    try:
        return enum_cls(value)
    except (ValueError, TypeError):
        return default


@router.post("", response_model=TelemetryOut, status_code=201)
def ingest_telemetry(payload: TelemetryIn, db: Session = Depends(get_db)):
    active_minutes = max(payload.active_engine_time_min, 1.0)
    hours_elapsed = max(active_minutes / 60.0, 1 / 60.0)

    efficiency = efficiency_service.compute_efficiency(
        active_engine_time_min=active_minutes,
        idling_time_min=payload.idling_time_min,
        load_cycles=payload.load_cycles,
        planned_load_cycles=payload.planned_load_cycles or 1,
        fuel_used_l=payload.fuel_used_l,
        weather_impacted=payload.weather_condition != "CLEAR",
        queue_delay_min=payload.site_congestion_level * 30,
    )

    continuous_hours = payload.time_since_shift_start_min / 60.0
    hours_since_break = max(0.0, continuous_hours - (payload.break_minutes_today / 60.0))
    fatigue_result = fatigue_service.evaluate_fatigue(
        continuous_work_hours=continuous_hours,
        hours_since_last_break=hours_since_break,
        harsh_event_count=payload.harsh_braking_count + payload.harsh_acceleration_count,
        self_reported_fatigue=payload.self_reported_fatigue,
    )

    transition_result = None
    if payload.truck_state:
        transition_result = evaluate_state_transition_risk(
            truck_state=_safe_enum(TruckState, payload.truck_state, TruckState.OFFLINE),
            active_mission=payload.active_mission,
            communication_status=_safe_enum(CommunicationStatus, payload.communication_status, CommunicationStatus.OK),
            distance_m=payload.truck_distance_m,
            nearby_condition_change=payload.nearby_condition_change,
            recovery_personnel_active=payload.recovery_personnel_active,
            safe_to_approach_confirmed=payload.safe_to_approach_confirmed,
            visibility_score=payload.visibility_score,
            seatbelt_status=_safe_enum(SeatbeltStatus, payload.seatbelt_status, SeatbeltStatus.FASTENED),
            fatigue_score=fatigue_result.fatigue_score,
        )

    failure_result = machine_health_service.evaluate_machine_health(
        engine_hours=payload.engine_hours,
        engine_temperature_c=payload.engine_temperature_c,
        oil_pressure_kpa=payload.oil_pressure_kpa,
        coolant_temperature_c=payload.coolant_temperature_c,
        hydraulic_temperature_c=payload.hydraulic_temperature_c,
        vibration_rms=payload.vibration_rms,
        fault_code_count=payload.fault_code_count,
    )

    anomaly_features = {
        "fuel_used_per_hour": payload.fuel_used_l / hours_elapsed,
        "load_cycles_per_hour": payload.load_cycles / hours_elapsed,
        "idle_minutes_per_hour": payload.idling_time_min / hours_elapsed,
        "idle_percentage": efficiency.idle_percentage,
        "engine_temperature_c": payload.engine_temperature_c,
        "hydraulic_temperature_c": payload.hydraulic_temperature_c,
        "vibration_rms": payload.vibration_rms,
        "harsh_braking_count": payload.harsh_braking_count,
        "harsh_acceleration_count": payload.harsh_acceleration_count,
        "seatbelt_violations_count": 1 if payload.seatbelt_status == "UNFASTENED" else 0,
        "time_since_shift_started_min": payload.time_since_shift_start_min,
        "operator_fatigue_score": fatigue_result.fatigue_score,
        "visibility_score": payload.visibility_score,
        "distance_to_nearest_truck_m": payload.truck_distance_m,
        "safety_risk_score": transition_result.risk_score if transition_result else 0.0,
    }
    anomaly_result = anomaly_service.score_telemetry(anomaly_features)

    seatbelt_result = evaluate_seatbelt(
        seatbelt_status=_safe_enum(SeatbeltStatus, payload.seatbelt_status, SeatbeltStatus.FASTENED),
        engine_running=payload.engine_running,
        machine_moving=payload.machine_speed_kmh > 0.5,
        nearest_truck_state=_safe_enum(TruckState, payload.truck_state, None) if payload.truck_state else None,
        distance_to_truck_m=payload.truck_distance_m,
    )

    safety_alert_triggered = False
    incident_type_value = None

    if seatbelt_result.auto_incident_required:
        safety_alert_triggered = True
        incident_type_value = IncidentType.SEATBELT_VIOLATION.value
        incident_service.create_incident(
            db,
            incident_type=IncidentType.SEATBELT_VIOLATION,
            severity=seatbelt_result.severity or Severity.MODERATE,
            risk_score=seatbelt_result.risk_score,
            machine_id=payload.machine_id,
            operator_id=payload.operator_id,
            truck_id=payload.nearest_truck_id,
            context={"factors": seatbelt_result.contributing_factors, "source": "telemetry_ingest"},
            recommended_action=seatbelt_result.recommended_action,
        )

    if transition_result and transition_result.auto_incident_required:
        safety_alert_triggered = True
        incident_type_value = incident_type_value or (transition_result.incident_type.value if transition_result.incident_type else None)
        incident_service.create_incident(
            db,
            incident_type=transition_result.incident_type or IncidentType.PROXIMITY_WARNING,
            severity=transition_result.severity or Severity.HIGH,
            risk_score=transition_result.risk_score,
            machine_id=payload.machine_id,
            operator_id=payload.operator_id,
            truck_id=payload.nearest_truck_id,
            context={"factors": transition_result.contributing_factors, "source": "telemetry_ingest"},
            state_before=payload.truck_state,
            recommended_action=transition_result.recommended_action,
        )

    if fatigue_result.fatigue_level in ("HIGH", "CRITICAL"):
        safety_alert_triggered = True
        incident_type_value = incident_type_value or IncidentType.FATIGUE_RISK.value
        incident_service.create_incident(
            db,
            incident_type=IncidentType.FATIGUE_RISK,
            severity=Severity.HIGH if fatigue_result.fatigue_level == "HIGH" else Severity.CRITICAL,
            risk_score=fatigue_result.fatigue_score,
            machine_id=payload.machine_id,
            operator_id=payload.operator_id,
            context={"factors": fatigue_result.contributing_factors, "source": "telemetry_ingest"},
            recommended_action=fatigue_result.message,
        )

    record = TelemetryRecord(
        **payload.model_dump(),
        state_transition_risk_score=transition_result.risk_score if transition_result else 0.0,
        collision_interaction_risk_score=0.0,
        fatigue_score=fatigue_result.fatigue_score,
        machine_efficiency_percentage=efficiency.machine_efficiency_percentage,
        idle_percentage=efficiency.idle_percentage,
        fuel_efficiency=efficiency.fuel_efficiency,
        anomaly_label=anomaly_result.anomaly_label,
        anomaly_score=anomaly_result.anomaly_score,
        failure_risk_score=failure_result.failure_risk_score,
        safety_alert_triggered=safety_alert_triggered,
        incident_type=incident_type_value,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    payload_for_ws = {
        "event": "telemetry_update",
        "machine_id": record.machine_id,
        "operator_id": record.operator_id,
        "safety_alert_triggered": safety_alert_triggered,
        "state_transition_risk_score": record.state_transition_risk_score,
        "failure_risk_score": record.failure_risk_score,
        "anomaly_label": record.anomaly_label,
    }
    channels = [f"machine:{record.machine_id}"]
    if record.operator_id:
        channels.append(f"operator:{record.operator_id}")
    if safety_alert_triggered:
        channels.append("safety-alerts")

    async def _broadcast():
        try:
            await manager.broadcast_many(channels, payload_for_ws)
        except Exception:  # noqa: BLE001
            pass

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(_broadcast())
    except RuntimeError:
        pass

    return record


@router.get("/machine/{machine_id}/latest", response_model=TelemetryOut)
def get_latest_telemetry(machine_id: str, db: Session = Depends(get_db)):
    stmt = (
        select(TelemetryRecord)
        .where(TelemetryRecord.machine_id == machine_id)
        .order_by(TelemetryRecord.timestamp.desc())
        .limit(1)
    )
    record = db.scalars(stmt).first()
    if record is None:
        raise HTTPException(status_code=404, detail="No telemetry found for this machine")
    return record
