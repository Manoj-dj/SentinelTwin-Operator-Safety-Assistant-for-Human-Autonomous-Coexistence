from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.truck import AutonomousTruck
from app.schemas.common import SAFETY_DISCLAIMER
from app.schemas.safety import RiskEvaluationResult, TransitionRiskRequest
from app.schemas.truck import DigitalTwinTruckView
from app.services import digital_twin_service, incident_service
from app.models.enums import Severity

router = APIRouter(prefix="/api/v1/digital-twin", tags=["digital-twin"])


@router.get("/truck/{truck_id}", response_model=DigitalTwinTruckView)
def get_truck_digital_twin(truck_id: str, db: Session = Depends(get_db)):
    truck = db.get(AutonomousTruck, truck_id)
    if truck is None:
        raise HTTPException(status_code=404, detail="Autonomous truck not found")
    events = digital_twin_service.get_recent_events(db, truck_id)
    return DigitalTwinTruckView(
        truck=truck,
        recent_events=events,
        safety_note=digital_twin_service.get_truck_safety_note(truck),
    )


@router.get("/operator/{operator_id}/nearby-trucks")
def get_nearby_trucks(operator_id: str, db: Session = Depends(get_db)):
    nearby = digital_twin_service.find_nearby_trucks_for_operator(db, operator_id)
    return {
        "operator_id": operator_id,
        "nearby_trucks": [
            {
                "truck_id": item["truck"].id,
                "truck_code": item["truck"].truck_code,
                "state": item["truck"].state,
                "distance_m": item["distance_m"],
                "safety_note": digital_twin_service.get_truck_safety_note(item["truck"]),
                "telemetry_timestamp": item["telemetry_timestamp"],
            }
            for item in nearby
        ],
        "disclaimer": SAFETY_DISCLAIMER,
    }


@router.post("/evaluate-transition-risk", response_model=RiskEvaluationResult)
def evaluate_transition_risk(payload: TransitionRiskRequest, db: Session = Depends(get_db)):
    truck = db.get(AutonomousTruck, payload.truck_id)
    if truck is None:
        raise HTTPException(status_code=404, detail="Autonomous truck not found")

    result = digital_twin_service.evaluate_transition_risk_for_truck(
        db,
        truck=truck,
        distance_m=payload.distance_m,
        visibility_score=payload.visibility_score,
        seatbelt_status=payload.seatbelt_status,
        fatigue_score=payload.fatigue_score,
    )

    incident_id = None
    if result.auto_incident_required:
        incident = incident_service.create_incident(
            db,
            incident_type=result.incident_type,
            severity=result.severity or Severity.HIGH,
            risk_score=result.risk_score,
            machine_id=payload.machine_id,
            operator_id=payload.operator_id,
            truck_id=truck.id,
            context={"factors": result.contributing_factors, "source": "evaluate-transition-risk"},
            recommended_action=result.recommended_action,
        )
        incident_id = incident.id

    return RiskEvaluationResult(
        risk_score=result.risk_score,
        risk_level=result.risk_level,
        truck_id=truck.id,
        truck_state=truck.state.value,
        active_mission=truck.active_mission,
        nearby_condition_change=truck.nearby_condition_change,
        distance_m=payload.distance_m,
        contributing_factors=result.contributing_factors,
        recommended_action=result.recommended_action,
        auto_incident_created=result.auto_incident_required,
        incident_id=incident_id,
        disclaimer=SAFETY_DISCLAIMER,
    )
