from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Enum as SAEnum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import TrainingResourceType
from app.utils.ids import new_id
from app.utils.time_utils import utcnow


class TrainingResource(Base):
    __tablename__ = "training_resources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("trn_"))
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String, default="SAFETY")
    resource_type: Mapped[TrainingResourceType] = mapped_column(
        SAEnum(TrainingResourceType), default=TrainingResourceType.SOP
    )
    url: Mapped[str] = mapped_column(String, default="")
    estimated_duration_min: Mapped[float] = mapped_column(Float, default=15.0)
    skill_tags_json: Mapped[str] = mapped_column(Text, default="[]")
    machine_type_relevance_json: Mapped[str] = mapped_column(Text, default="[]")
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class OperatorTrainingProgress(Base):
    __tablename__ = "operator_training_progress"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("otp_"))
    operator_id: Mapped[str] = mapped_column(String, ForeignKey("operators.id"), index=True)
    resource_id: Mapped[str] = mapped_column(String, ForeignKey("training_resources.id"), index=True)
    status: Mapped[str] = mapped_column(String, default="NOT_STARTED")
    quiz_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    priority: Mapped[str] = mapped_column(String, default="NORMAL")

    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
