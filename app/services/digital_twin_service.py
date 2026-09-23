"""Digital Twin / state-visibility layer for autonomous trucks.

SentinelTwin never controls or overrides the autonomous truck. This service
only reads and explains truck state to nearby human operators.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import CommunicationStatus, SeatbeltStatus, TruckState
from app.models.telemetry import TelemetryRecord
from app.models.truck import AutonomousTruck, TruckStateEvent
from app.services.safety_risk_engine import SAFETY_DISCLAIMER, evaluate_state_transition_risk

STATE_EXPLANATIONS = {
    TruckState.NORMAL: "Executing an active mission under normal autonomous operation.",
    TruckState.EXCEPTION: "Paused due to a safety, communication, or system exception.",
    TruckState.RECOVERY: "Personnel or equipment recovery interaction is underway near this truck.",
    TruckState.TRANSITIONING: "A relevant environmental or safety condition changed; the system may reevaluate its mission.",
    TruckState.STOPPED: "Confirmed stopped. Only treat as safe to approach if explicitly confirmed.",
    TruckState.SUSPENDED: "Mission isolated/suspended by approved procedure. Safest state for recovery.",
    TruckState.OFFLINE: "No reliable telemetry available. Treat as unknown state with high caution.",
}


def get_truck_safety_note(truck: AutonomousTruck) -> str:
    base = STATE_EXPLANATIONS.get(truck.state, "Unknown state.")
    if truck.state == TruckState.STOPPED and not truck.safe_to_approach_confirmed:
        base += " Safe-to-approach has NOT been confirmed -- do not approach."
    if truck.state == TruckState.SUSPENDED and truck.safe_to_approach_confirmed:
        base += " Safe-to-approach is confirmed for this suspended state."
    return base


def get_recent_events(db: Session, truck_id: str, limit: int = 10) -> list[TruckStateEvent]:
    stmt = (
        select(TruckStateEvent)
        .where(TruckStateEvent.truck_id == truck_id)
        .order_by(TruckStateEvent.created_at.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


def find_nearby_trucks_for_operator(db: Session, operator_id: str, max_distance_m: float = 200.0):
    """Return the most recent telemetry record's nearby-truck context for an operator."""
    stmt = (
        select(TelemetryRecord)
        .where(TelemetryRecord.operator_id == operator_id)
        .order_by(TelemetryRecord.timestamp.desc())
        .limit(1)
    )
    latest = db.scalars(stmt).first()
    if latest is None or latest.nearest_truck_id is None:
        return []
    truck = db.get(AutonomousTruck, latest.nearest_truck_id)
    if truck is None:
        return []
    if latest.truck_distance_m is not None and latest.truck_distance_m > max_distance_m:
        return []
    return [
        {
            "truck": truck,
            "distance_m": latest.truck_distance_m,
            "telemetry_timestamp": latest.timestamp,
        }
    ]


def evaluate_transition_risk_for_truck(
    db: Session,
    *,
    truck: AutonomousTruck,
    distance_m: float,
    visibility_score: float = 1.0,
    seatbelt_status: SeatbeltStatus = SeatbeltStatus.FASTENED,
    fatigue_score: float | None = None,
):
    return evaluate_state_transition_risk(
        truck_state=truck.state,
        active_mission=truck.active_mission,
        communication_status=truck.communication_status,
        distance_m=distance_m,
        nearby_condition_change=truck.nearby_condition_change,
        recovery_personnel_active=truck.recovery_personnel_active,
        safe_to_approach_confirmed=truck.safe_to_approach_confirmed,
        visibility_score=visibility_score,
        seatbelt_status=seatbelt_status,
        fatigue_score=fatigue_score,
    )


__all__ = ["SAFETY_DISCLAIMER", "get_truck_safety_note", "get_recent_events",
           "find_nearby_trucks_for_operator", "evaluate_transition_risk_for_truck"]
