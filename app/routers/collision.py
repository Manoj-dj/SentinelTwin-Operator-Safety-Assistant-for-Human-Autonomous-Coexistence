from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import Severity
from app.models.truck import AutonomousTruck
from app.schemas.common import SAFETY_DISCLAIMER
from app.schemas.safety import CollisionEvaluationRequest, CollisionEvaluationResult
from app.services import incident_service
from app.services.collision_service import evaluate_collision_risk
from app.models.enums import IncidentType

router = APIRouter(prefix="/api/v1/collision", tags=["collision"])


@router.post("/evaluate", response_model=CollisionEvaluationResult)
def evaluate_collision(payload: CollisionEvaluationRequest, db: Session = Depends(get_db)):
    truck = db.get(AutonomousTruck, payload.truck_id)
    if truck is None:
        raise HTTPException(status_code=404, detail="Autonomous truck not found")

    result = evaluate_collision_risk(
        truck_state=truck.state,
        active_mission=truck.active_mission,
        communication_status=truck.communication_status,
        distance_m=payload.distance_m,
        machine_speed_kmh=payload.machine_speed_kmh,
        truck_speed_kmh=payload.truck_speed_kmh,
        closing=payload.closing,
        visibility_score=payload.visibility_score,
        site_congestion_level=payload.site_congestion_level,
        blind_spot=payload.blind_spot,
        fatigue_score=payload.fatigue_score,
        seatbelt_status=payload.seatbelt_status,
    )

    incident_id = None
    if result.auto_incident_required:
        incident = incident_service.create_incident(
            db,
            incident_type=IncidentType.PROXIMITY_WARNING,
            severity=Severity(result.severity),
            risk_score=result.collision_risk_score,
            machine_id=payload.machine_id,
            operator_id=payload.operator_id,
            truck_id=payload.truck_id,
            context={"factors": result.factors, "source": "collision/evaluate"},
            recommended_action=result.recommended_action,
        )
        incident_id = incident.id

    return CollisionEvaluationResult(
        collision_risk_score=result.collision_risk_score,
        severity=result.severity,
        time_to_proximity_sec=result.time_to_proximity_sec,
        factors=result.factors,
        recommended_action=result.recommended_action,
        auto_incident_created=incident_id is not None,
        incident_id=incident_id,
        disclaimer=SAFETY_DISCLAIMER,
    )
