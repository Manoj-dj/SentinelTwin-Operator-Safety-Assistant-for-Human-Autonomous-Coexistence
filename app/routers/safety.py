from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import AckStatus, Severity
from app.models.incident import Incident
from app.models.truck import AutonomousTruck
from app.schemas.common import SAFETY_DISCLAIMER
from app.schemas.safety import OperatorSafetySummary, RiskEvaluationResult, SafetyEvaluationRequest
from app.services import incident_service
from app.services.safety_risk_engine import evaluate_seatbelt, evaluate_state_transition_risk

router = APIRouter(prefix="/api/v1/safety", tags=["safety"])


@router.post("/evaluate", response_model=RiskEvaluationResult)
def evaluate_safety(payload: SafetyEvaluationRequest, db: Session = Depends(get_db)):
    truck = db.get(AutonomousTruck, payload.truck_id) if payload.truck_id else None

    seatbelt_result = evaluate_seatbelt(
        seatbelt_status=payload.seatbelt_status,
        engine_running=payload.engine_running,
        machine_moving=payload.machine_moving,
        nearest_truck_state=truck.state if truck else None,
        distance_to_truck_m=payload.distance_to_truck_m,
    )

    transition_result = None
    if truck is not None and payload.distance_to_truck_m is not None:
        transition_result = evaluate_state_transition_risk(
            truck_state=truck.state,
            active_mission=truck.active_mission,
            communication_status=truck.communication_status,
            distance_m=payload.distance_to_truck_m,
            nearby_condition_change=truck.nearby_condition_change,
            recovery_personnel_active=truck.recovery_personnel_active,
            safe_to_approach_confirmed=truck.safe_to_approach_confirmed,
            visibility_score=payload.visibility_score,
            seatbelt_status=payload.seatbelt_status,
            fatigue_score=payload.fatigue_score,
        )

    # Take the higher-risk of the two evaluations as the combined result.
    candidates = [r for r in (seatbelt_result, transition_result) if r is not None]
    primary = max(candidates, key=lambda r: r.risk_score)
    combined_factors = list(dict.fromkeys(seatbelt_result.contributing_factors + (transition_result.contributing_factors if transition_result else [])))

    incident_id = None
    if primary.auto_incident_required:
        incident = incident_service.create_incident(
            db,
            incident_type=primary.incident_type or (seatbelt_result.incident_type if seatbelt_result.auto_incident_required else None),
            severity=primary.severity or Severity.MODERATE,
            risk_score=primary.risk_score,
            machine_id=payload.machine_id,
            operator_id=payload.operator_id,
            truck_id=payload.truck_id,
            context={"factors": combined_factors, "source": "safety/evaluate"},
            recommended_action=primary.recommended_action,
        )
        incident_id = incident.id

    return RiskEvaluationResult(
        risk_score=primary.risk_score,
        risk_level=primary.risk_level,
        truck_id=payload.truck_id,
        truck_state=truck.state.value if truck else None,
        active_mission=truck.active_mission if truck else None,
        nearby_condition_change=truck.nearby_condition_change if truck else None,
        distance_m=payload.distance_to_truck_m,
        contributing_factors=combined_factors,
        recommended_action=primary.recommended_action,
        auto_incident_created=incident_id is not None,
        incident_id=incident_id,
        disclaimer=SAFETY_DISCLAIMER,
    )


@router.get("/operator/{operator_id}/summary", response_model=OperatorSafetySummary)
def operator_safety_summary(operator_id: str, db: Session = Depends(get_db)):
    stmt = (
        select(Incident)
        .where(Incident.operator_id == operator_id, Incident.ack_status != AckStatus.RESOLVED)
        .order_by(Incident.timestamp.desc())
    )
    incidents = list(db.scalars(stmt).all())

    severity_rank = {Severity.LOW: 0, Severity.MODERATE: 1, Severity.HIGH: 2, Severity.CRITICAL: 3}
    highest = max(incidents, key=lambda i: severity_rank[i.severity], default=None)

    return OperatorSafetySummary(
        operator_id=operator_id,
        open_incidents=len(incidents),
        highest_open_severity=highest.severity.value if highest else None,
        recent_incident_types=[i.incident_type.value for i in incidents[:5]],
        current_risk_level=highest.severity.value if highest else "LOW",
        disclaimer=SAFETY_DISCLAIMER,
    )
