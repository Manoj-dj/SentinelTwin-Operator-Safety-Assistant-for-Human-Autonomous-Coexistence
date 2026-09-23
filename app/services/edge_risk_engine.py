"""Edge AI / edge-analytics simulation.

Demonstrates that critical alerts CAN be computed close to the machine
(in-cab gateway / edge device) even when cloud connectivity is degraded or
offline. This module is pure/deterministic and does not touch the database
so it can run "on the edge" -- results are synced to the backend by the
caller (see routers/edge.py).

This simulates edge inference; it does not implement or claim to be a
certified onboard safety control system.
"""
from __future__ import annotations

from app.models.enums import ConnectivityStatus, SeatbeltStatus, TruckState
from app.schemas.edge import EdgeAlert, EdgeTelemetryEvent
from app.services import fatigue_service, machine_health_service, safety_risk_engine


def evaluate_edge_event(event: EdgeTelemetryEvent) -> list[EdgeAlert]:
    alerts: list[EdgeAlert] = []

    # 1. Seatbelt check
    seatbelt_result = safety_risk_engine.evaluate_seatbelt(
        seatbelt_status=event.seatbelt_status,
        engine_running=event.engine_running,
        machine_moving=event.machine_moving,
        nearest_truck_state=TruckState(event.truck_state) if event.truck_state else None,
        distance_to_truck_m=event.truck_distance_m,
    )
    if seatbelt_result.auto_incident_required:
        alerts.append(
            EdgeAlert(
                alert_type="SEATBELT_VIOLATION",
                severity=seatbelt_result.risk_level,
                message=seatbelt_result.recommended_action,
            )
        )

    # 2. Proximity / state-transition risk
    if event.truck_id and event.truck_distance_m is not None and event.truck_state:
        try:
            truck_state_enum = TruckState(event.truck_state)
        except ValueError:
            truck_state_enum = TruckState.OFFLINE
        transition_result = safety_risk_engine.evaluate_state_transition_risk(
            truck_state=truck_state_enum,
            active_mission=event.active_mission,
            communication_status=_safe_comm_status(event.communication_status),
            distance_m=event.truck_distance_m,
            nearby_condition_change=event.nearby_condition_change,
            safe_to_approach_confirmed=event.safe_to_approach_confirmed,
            visibility_score=event.visibility_score,
            seatbelt_status=event.seatbelt_status,
        )
        if transition_result.risk_level in ("HIGH", "CRITICAL"):
            alerts.append(
                EdgeAlert(
                    alert_type="STATE_TRANSITION_RISK",
                    severity=transition_result.risk_level,
                    message=transition_result.recommended_action,
                )
            )

    # 3. Fatigue / break rule
    if event.continuous_work_hours is not None and event.hours_since_last_break is not None:
        fatigue_result = fatigue_service.evaluate_fatigue(
            continuous_work_hours=event.continuous_work_hours,
            hours_since_last_break=event.hours_since_last_break,
        )
        if fatigue_result.fatigue_level in ("HIGH", "CRITICAL"):
            alerts.append(
                EdgeAlert(
                    alert_type="FATIGUE_RISK",
                    severity=fatigue_result.fatigue_level,
                    message=fatigue_result.message,
                )
            )

    # 4. Machine failure threshold check
    if event.engine_temperature_c is not None and event.oil_pressure_kpa is not None:
        health_result = machine_health_service.evaluate_machine_health(
            engine_hours=0.0,
            engine_temperature_c=event.engine_temperature_c,
            oil_pressure_kpa=event.oil_pressure_kpa,
            coolant_temperature_c=event.coolant_temperature_c or 80.0,
            hydraulic_temperature_c=event.hydraulic_temperature_c or 70.0,
            vibration_rms=event.vibration_rms or 2.0,
            fault_code_count=event.fault_code_count or 0,
        )
        if health_result.risk_level in ("HIGH", "CRITICAL"):
            alerts.append(
                EdgeAlert(
                    alert_type="PREDICTED_MACHINE_FAILURE",
                    severity=health_result.risk_level,
                    message=health_result.recommended_action,
                )
            )

    if event.connectivity_status == ConnectivityStatus.OFFLINE and not alerts:
        alerts.append(
            EdgeAlert(
                alert_type="CONNECTIVITY_NOTICE",
                severity="LOW",
                message="Operating offline: alerts computed locally on edge device and will sync when reconnected.",
            )
        )

    return alerts


def _safe_comm_status(value: str):
    from app.models.enums import CommunicationStatus

    try:
        return CommunicationStatus(value)
    except ValueError:
        return CommunicationStatus.OK
