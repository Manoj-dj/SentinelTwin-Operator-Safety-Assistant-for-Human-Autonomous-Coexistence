from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import CommunicationStatus, TruckState


class AutonomousTruckOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    truck_code: str
    state: TruckState
    active_mission: bool
    mission_type: str | None = None
    communication_status: CommunicationStatus
    safe_to_approach_confirmed: bool
    nearby_condition_change: bool
    recovery_personnel_active: bool
    gps_x: float
    gps_y: float
    speed_kmh: float
    heading_deg: float
    last_state_change_at: datetime
    created_at: datetime
    updated_at: datetime


class TruckStateEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    truck_id: str
    previous_state: str
    new_state: str
    reason: str | None = None
    communication_status: str
    active_mission: bool
    created_at: datetime


class DigitalTwinTruckView(BaseModel):
    truck: AutonomousTruckOut
    recent_events: list[TruckStateEventOut]
    safety_note: str
