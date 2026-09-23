from __future__ import annotations

from datetime import datetime

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import MachineStatus, MachineType
from app.utils.ids import new_id
from app.utils.time_utils import utcnow


class Machine(Base):
    __tablename__ = "machines"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("mc_"))
    machine_code: Mapped[str] = mapped_column(String, unique=True, index=True)
    machine_type: Mapped[MachineType] = mapped_column(SAEnum(MachineType), default=MachineType.LOADER)
    name: Mapped[str] = mapped_column(String)
    site_zone: Mapped[str] = mapped_column(String, default="Zone A")
    status: Mapped[MachineStatus] = mapped_column(SAEnum(MachineStatus), default=MachineStatus.ACTIVE)
    assigned_operator_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("operators.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
