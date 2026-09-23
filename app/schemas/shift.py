from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ShiftOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    operator_id: str
    machine_id: str | None = None
    start_time: datetime
    end_time: datetime | None = None
    shift_type: str
    created_at: datetime


class BreakCreate(BaseModel):
    shift_id: str
    operator_id: str
    break_type: str = "SHORT_BREAK"
    duration_min: float | None = None


class BreakOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    shift_id: str
    operator_id: str
    start_time: datetime
    end_time: datetime | None = None
    duration_min: float | None = None
    break_type: str
    created_at: datetime


class FatigueEvaluationRequest(BaseModel):
    operator_id: str
    continuous_work_hours: float
    hours_since_last_break: float
    harsh_event_count: int = 0
    productivity_decline_pct: float = 0.0
    is_night_shift: bool = False
    self_reported_fatigue: float | None = None
    recent_high_risk_alerts: int = 0


class FatigueEvaluationResult(BaseModel):
    operator_id: str
    fatigue_score: float
    fatigue_level: str
    contributing_factors: list[str]
    recommended_break_minutes: int
    break_due: bool
    manager_escalation: bool
    message: str
    disclaimer: str
