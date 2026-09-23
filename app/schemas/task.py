from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import TaskPriority, TaskStatus


class TaskBase(BaseModel):
    title: str
    task_type: str = "LOADING"
    machine_id: str
    operator_id: str
    priority: TaskPriority = TaskPriority.MEDIUM
    site_zone: str = "Zone A"
    start_time: datetime
    expected_duration_min: float = 30.0
    load_cycles_planned: int = 20
    weather_condition: str = "CLEAR"
    visibility_score: float = 1.0
    queue_wait_minutes: float = 5.0


class TaskCreate(TaskBase):
    pass


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: TaskStatus
    predicted_completion_time: datetime | None = None
    delay_reason: str | None = None
    actual_duration_min: float | None = None
    created_at: datetime
    updated_at: datetime


class TaskDashboardItem(BaseModel):
    task: TaskOut
    truck_arrival_window_min: float | None = None
    expected_wait_min: float | None = None
    predicted_completion_min: float | None = None
    delay_risk: str = "LOW"
    delay_reason: str | None = None
    weather_visibility_note: str | None = None
    summary_text: str


class TaskDurationPrediction(BaseModel):
    task_id: str
    predicted_duration_min: float
    confidence_range_min: tuple[float, float]
    delay_risk: str
    primary_reasons: list[str]
    truck_arrival_impact_min: float | None = None
    model_source: str
