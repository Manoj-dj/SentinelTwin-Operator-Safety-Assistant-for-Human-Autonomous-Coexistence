from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import AckStatus, Severity
from app.models.incident import Incident
from app.schemas.incident import IncidentAcknowledge, IncidentOut
from app.services.incident_service import acknowledge_incident, incident_to_dict, list_incidents

router = APIRouter(prefix="/api/v1/incidents", tags=["incidents"])


@router.get("")
def get_incidents(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    operator_id: str | None = None,
    machine_id: str | None = None,
    truck_id: str | None = None,
    severity: Severity | None = None,
    ack_status: AckStatus | None = None,
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    items, total = list_incidents(
        db,
        operator_id=operator_id,
        machine_id=machine_id,
        truck_id=truck_id,
        severity=severity,
        ack_status=ack_status,
        offset=offset,
        limit=page_size,
    )
    return {
        "items": [incident_to_dict(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/operator/{operator_id}")
def get_incidents_for_operator(operator_id: str, page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    offset = (page - 1) * page_size
    items, total = list_incidents(db, operator_id=operator_id, offset=offset, limit=page_size)
    return {
        "items": [incident_to_dict(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident_to_dict(incident)


@router.patch("/{incident_id}/acknowledge")
def patch_acknowledge_incident(incident_id: str, payload: IncidentAcknowledge, db: Session = Depends(get_db)):
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    updated = acknowledge_incident(db, incident, notes=payload.notes, resolved=payload.resolved)
    return incident_to_dict(updated)
