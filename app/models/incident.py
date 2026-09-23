from __future__ import annotations

from datetime import datetime

from sqlalchemy import Enum as SAEnum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import AckStatus, IncidentType, Severity
from app.utils.ids import new_id
from app.utils.time_utils import utcnow


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("inc_"))
    timestamp: Mapped[datetime] = mapped_column(default=utcnow, index=True)

    machine_id: Mapped[str | None] = mapped_column(String, ForeignKey("machines.id"), nullable=True, index=True)
    operator_id: Mapped[str | None] = mapped_column(String, ForeignKey("operators.id"), nullable=True, index=True)
    truck_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("autonomous_trucks.id"), nullable=True, index=True
    )

    incident_type: Mapped[IncidentType] = mapped_column(SAEnum(IncidentType), index=True)
    severity: Mapped[Severity] = mapped_column(SAEnum(Severity), index=True)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)

    context_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    state_before: Mapped[str | None] = mapped_column(String, nullable=True)
    state_after: Mapped[str | None] = mapped_column(String, nullable=True)
    recommended_action: Mapped[str] = mapped_column(Text, default="")

    ack_status: Mapped[AckStatus] = mapped_column(SAEnum(AckStatus), default=AckStatus.OPEN)
    acknowledged_at: Mapped[datetime | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(default=utcnow)
