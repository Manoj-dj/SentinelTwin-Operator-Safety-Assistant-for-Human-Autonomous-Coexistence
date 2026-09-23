from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import MachineStatus, MachineType


class MachineBase(BaseModel):
    machine_code: str
    machine_type: MachineType = MachineType.LOADER
    name: str
    site_zone: str = "Zone A"
    status: MachineStatus = MachineStatus.ACTIVE
    assigned_operator_id: str | None = None


class MachineCreate(MachineBase):
    pass


class MachineOut(MachineBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
