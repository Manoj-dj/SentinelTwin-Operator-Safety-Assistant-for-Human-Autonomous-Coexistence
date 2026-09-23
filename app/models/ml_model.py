from __future__ import annotations

from datetime import datetime

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.utils.ids import new_id
from app.utils.time_utils import utcnow


class MLModelRun(Base):
    __tablename__ = "ml_model_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("mlrun_"))
    model_name: Mapped[str] = mapped_column(String, index=True)
    model_version: Mapped[str] = mapped_column(String, default="1.0.0")
    trained_at: Mapped[datetime] = mapped_column(default=utcnow)
    metrics_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    artifact_path: Mapped[str] = mapped_column(String, default="")

    created_at: Mapped[datetime] = mapped_column(default=utcnow)
