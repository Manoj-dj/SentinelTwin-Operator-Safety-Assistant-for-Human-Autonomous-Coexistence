from __future__ import annotations

from datetime import datetime

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.utils.ids import new_id
from app.utils.time_utils import utcnow


class Shift(Base):
    __tablename__ = "shifts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("sh_"))
    operator_id: Mapped[str] = mapped_column(String, ForeignKey("operators.id"), index=True)
    machine_id: Mapped[str | None] = mapped_column(String, ForeignKey("machines.id"), nullable=True)
    start_time: Mapped[datetime] = mapped_column(default=utcnow, index=True)
    end_time: Mapped[datetime | None] = mapped_column(nullable=True)
    shift_type: Mapped[str] = mapped_column(String, default="DAY")

    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class BreakRecord(Base):
    __tablename__ = "break_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("brk_"))
    shift_id: Mapped[str] = mapped_column(String, ForeignKey("shifts.id"), index=True)
    operator_id: Mapped[str] = mapped_column(String, ForeignKey("operators.id"), index=True)
    start_time: Mapped[datetime] = mapped_column(default=utcnow)
    end_time: Mapped[datetime | None] = mapped_column(nullable=True)
    duration_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    break_type: Mapped[str] = mapped_column(String, default="SHORT_BREAK")

    created_at: Mapped[datetime] = mapped_column(default=utcnow)
