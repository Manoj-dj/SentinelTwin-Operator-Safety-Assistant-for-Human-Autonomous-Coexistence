"""Incident creation/query/acknowledgement service."""
from __future__ import annotations

import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import AckStatus, IncidentType, Severity
from app.models.incident import Incident
from app.utils.time_utils import utcnow


def create_incident(
    db: Session,
    *,
    incident_type: IncidentType,
    severity: Severity,
    risk_score: float,
    machine_id: str | None = None,
    operator_id: str | None = None,
    truck_id: str | None = None,
    context: dict[str, Any] | None = None,
    state_before: str | None = None,
    state_after: str | None = None,
    recommended_action: str = "",
    notes: str | None = None,
    commit: bool = True,
) -> Incident:
    """Create an incident.

    `commit=False` lets bulk/batch callers (e.g. the synthetic data
    generator) add many incidents and commit once at the end, instead of
    forcing a disk fsync per row -- which is both slow and, on some
    filesystems (notably WSL's DrvFs mounts under /mnt/*), prone to
    intermittent "disk I/O error" failures under high commit frequency.
    """
    incident = Incident(
        machine_id=machine_id,
        operator_id=operator_id,
        truck_id=truck_id,
        incident_type=incident_type,
        severity=severity,
        risk_score=risk_score,
        context_json=json.dumps(context or {}),
        state_before=state_before,
        state_after=state_after,
        recommended_action=recommended_action,
        ack_status=AckStatus.OPEN,
        notes=notes,
    )
    db.add(incident)
    if commit:
        db.commit()
        db.refresh(incident)
    return incident


def incident_to_dict(incident: Incident) -> dict[str, Any]:
    return {
        "id": incident.id,
        "timestamp": incident.timestamp,
        "machine_id": incident.machine_id,
        "operator_id": incident.operator_id,
        "truck_id": incident.truck_id,
        "incident_type": incident.incident_type,
        "severity": incident.severity,
        "risk_score": incident.risk_score,
        "context": json.loads(incident.context_json) if incident.context_json else {},
        "state_before": incident.state_before,
        "state_after": incident.state_after,
        "recommended_action": incident.recommended_action,
        "ack_status": incident.ack_status,
        "acknowledged_at": incident.acknowledged_at,
        "notes": incident.notes,
        "created_at": incident.created_at,
    }


def list_incidents(
    db: Session,
    *,
    operator_id: str | None = None,
    machine_id: str | None = None,
    truck_id: str | None = None,
    severity: Severity | None = None,
    ack_status: AckStatus | None = None,
    offset: int = 0,
    limit: int = 50,
) -> tuple[list[Incident], int]:
    from sqlalchemy import func

    stmt = select(Incident)
    count_stmt = select(func.count()).select_from(Incident)
    filters = []
    if operator_id:
        filters.append(Incident.operator_id == operator_id)
    if machine_id:
        filters.append(Incident.machine_id == machine_id)
    if truck_id:
        filters.append(Incident.truck_id == truck_id)
    if severity:
        filters.append(Incident.severity == severity)
    if ack_status:
        filters.append(Incident.ack_status == ack_status)
    for f in filters:
        stmt = stmt.where(f)
        count_stmt = count_stmt.where(f)
    stmt = stmt.order_by(Incident.timestamp.desc()).offset(offset).limit(limit)
    total = db.scalar(count_stmt) or 0
    return list(db.scalars(stmt).all()), total


def acknowledge_incident(db: Session, incident: Incident, *, notes: str | None, resolved: bool) -> Incident:
    incident.ack_status = AckStatus.RESOLVED if resolved else AckStatus.ACKNOWLEDGED
    incident.acknowledged_at = utcnow()
    if notes:
        incident.notes = notes
    db.commit()
    db.refresh(incident)
    return incident
