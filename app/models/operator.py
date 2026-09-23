from __future__ import annotations

from datetime import datetime

from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.utils.ids import new_id
from app.utils.time_utils import utcnow


class Operator(Base):
    __tablename__ = "operators"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("op_"))
    employee_code: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="Machine Operator")
    experience_years: Mapped[float] = mapped_column(Float, default=1.0)
    experience_score: Mapped[float] = mapped_column(Float, default=50.0)
    certification_level: Mapped[str] = mapped_column(String, default="STANDARD")

    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
