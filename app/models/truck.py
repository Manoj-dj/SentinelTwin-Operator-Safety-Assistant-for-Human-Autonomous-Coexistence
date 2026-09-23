from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Enum as SAEnum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import CommunicationStatus, TruckState
from app.utils.ids import new_id
from app.utils.time_utils import utcnow


class AutonomousTruck(Base):
    __tablename__ = "autonomous_trucks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("aht_"))
    truck_code: Mapped[str] = mapped_column(String, unique=True, index=True)
    state: Mapped[TruckState] = mapped_column(SAEnum(TruckState), default=TruckState.NORMAL)
    active_mission: Mapped[bool] = mapped_column(Boolean, default=True)
    mission_type: Mapped[str | None] = mapped_column(String, nullable=True)
    communication_status: Mapped[CommunicationStatus] = mapped_column(
        SAEnum(CommunicationStatus), default=CommunicationStatus.OK
    )
    safe_to_approach_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    nearby_condition_change: Mapped[bool] = mapped_column(Boolean, default=False)
    recovery_personnel_active: Mapped[bool] = mapped_column(Boolean, default=False)

    gps_x: Mapped[float] = mapped_column(Float, default=0.0)
    gps_y: Mapped[float] = mapped_column(Float, default=0.0)
    speed_kmh: Mapped[float] = mapped_column(Float, default=0.0)
    heading_deg: Mapped[float] = mapped_column(Float, default=0.0)

    last_state_change_at: Mapped[datetime] = mapped_column(default=utcnow)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)


class TruckStateEvent(Base):
    __tablename__ = "truck_state_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("tse_"))
    truck_id: Mapped[str] = mapped_column(String, ForeignKey("autonomous_trucks.id"), index=True)
    previous_state: Mapped[str] = mapped_column(String)
    new_state: Mapped[str] = mapped_column(String)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    communication_status: Mapped[str] = mapped_column(String, default="OK")
    active_mission: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(default=utcnow, index=True)
