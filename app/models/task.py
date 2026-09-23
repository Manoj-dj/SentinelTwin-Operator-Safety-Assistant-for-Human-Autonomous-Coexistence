from __future__ import annotations

from datetime import datetime

from sqlalchemy import Enum as SAEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import TaskPriority, TaskStatus
from app.utils.ids import new_id
from app.utils.time_utils import utcnow


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("task_"))
    title: Mapped[str] = mapped_column(String)
    task_type: Mapped[str] = mapped_column(String, default="LOADING")
    machine_id: Mapped[str] = mapped_column(String, ForeignKey("machines.id"), index=True)
    operator_id: Mapped[str] = mapped_column(String, ForeignKey("operators.id"), index=True)
    priority: Mapped[TaskPriority] = mapped_column(SAEnum(TaskPriority), default=TaskPriority.MEDIUM)
    site_zone: Mapped[str] = mapped_column(String, default="Zone A")
    start_time: Mapped[datetime] = mapped_column(default=utcnow, index=True)
    expected_duration_min: Mapped[float] = mapped_column(Float, default=30.0)
    status: Mapped[TaskStatus] = mapped_column(SAEnum(TaskStatus), default=TaskStatus.PENDING)

    load_cycles_planned: Mapped[int] = mapped_column(Integer, default=20)
    predicted_completion_time: Mapped[datetime | None] = mapped_column(nullable=True)
    delay_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    weather_condition: Mapped[str] = mapped_column(String, default="CLEAR")
    visibility_score: Mapped[float] = mapped_column(Float, default=1.0)
    queue_wait_minutes: Mapped[float] = mapped_column(Float, default=5.0)
    actual_duration_min: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
