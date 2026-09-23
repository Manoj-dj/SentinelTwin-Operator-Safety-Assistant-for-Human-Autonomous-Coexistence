from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.enums import AckStatus, IncidentType, Severity


class IncidentCreate(BaseModel):
    machine_id: str | None = None
    operator_id: str | None = None
    truck_id: str | None = None
    incident_type: IncidentType
    severity: Severity
    risk_score: float = 0.0
    context: dict[str, Any] = {}
    state_before: str | None = None
    state_after: str | None = None
    recommended_action: str = ""
    notes: str | None = None


class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    machine_id: str | None = None
    operator_id: str | None = None
    truck_id: str | None = None
    incident_type: IncidentType
    severity: Severity
    risk_score: float
    context: dict[str, Any] = {}
    state_before: str | None = None
    state_after: str | None = None
    recommended_action: str
    ack_status: AckStatus
    acknowledged_at: datetime | None = None
    notes: str | None = None
    created_at: datetime


class IncidentAcknowledge(BaseModel):
    notes: str | None = None
    resolved: bool = False
