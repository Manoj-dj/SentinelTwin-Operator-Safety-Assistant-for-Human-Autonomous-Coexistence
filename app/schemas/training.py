from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import TrainingResourceType


class TrainingResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    category: str
    resource_type: TrainingResourceType
    url: str
    estimated_duration_min: float
    skill_tags: list[str]
    machine_type_relevance: list[str]
    is_required: bool
    created_at: datetime


class TrainingProgressUpdate(BaseModel):
    operator_id: str
    status: str = "IN_PROGRESS"
    quiz_score: float | None = None


class TrainingProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    operator_id: str
    resource_id: str
    status: str
    quiz_score: float | None = None
    completed_at: datetime | None = None
    priority: str
    created_at: datetime
    updated_at: datetime


class TrainingRecommendation(BaseModel):
    resource: TrainingResourceOut
    reason: str
    priority: str
