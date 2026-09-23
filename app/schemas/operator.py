from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OperatorBase(BaseModel):
    employee_code: str
    name: str
    role: str = "Machine Operator"
    experience_years: float = 1.0
    experience_score: float = 50.0
    certification_level: str = "STANDARD"


class OperatorCreate(OperatorBase):
    pass


class OperatorOut(OperatorBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
