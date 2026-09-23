"""Edge AI / edge analytics simulation endpoint.

Demonstrates that critical alerts can be computed close to the machine
(in-cab gateway) even under degraded/offline connectivity. Results are
still synced/persisted to the backend when the request reaches this API --
in a real deployment, an edge device would queue and forward events when
connectivity is restored.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import IncidentType, Severity
from app.schemas.common import SAFETY_DISCLAIMER
from app.schemas.edge import EdgeEvaluationResult, EdgeTelemetryEvent
from app.services import incident_service
from app.services.edge_risk_engine import evaluate_edge_event

router = APIRouter(prefix="/api/v1/edge", tags=["edge"])

_ALERT_TO_INCIDENT_TYPE = {
    "SEATBELT_VIOLATION": IncidentType.SEATBELT_VIOLATION,
    "STATE_TRANSITION_RISK": IncidentType.STATE_TRANSITION_RISK,
    "FATIGUE_RISK": IncidentType.FATIGUE_RISK,
    "PREDICTED_MACHINE_FAILURE": IncidentType.PREDICTED_MACHINE_FAILURE,
}


@router.post("/evaluate-telemetry", response_model=EdgeEvaluationResult)
def evaluate_telemetry_at_edge(event: EdgeTelemetryEvent, db: Session = Depends(get_db)):
    alerts = evaluate_edge_event(event)

    for alert in alerts:
        incident_type = _ALERT_TO_INCIDENT_TYPE.get(alert.alert_type)
        if incident_type is None or alert.severity not in ("HIGH", "CRITICAL"):
            continue
        incident_service.create_incident(
            db,
            incident_type=incident_type,
            severity=Severity(alert.severity),
            risk_score=90.0 if alert.severity == "CRITICAL" else 65.0,
            machine_id=event.machine_id,
            operator_id=event.operator_id,
            truck_id=event.truck_id,
            context={"source": "edge_evaluation", "connectivity_status": event.connectivity_status.value},
            recommended_action=alert.message,
        )

    return EdgeEvaluationResult(
        connectivity_status=event.connectivity_status,
        alerts=alerts,
        processed_locally=True,
        synced_to_backend=True,
        disclaimer=SAFETY_DISCLAIMER
        + " Edge evaluation simulates in-cab/gateway inference and is not a certified onboard safety control system.",
    )
