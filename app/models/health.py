from __future__ import annotations

from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.utils.ids import new_id
from app.utils.time_utils import utcnow


class MachineHealthRecord(Base):
    __tablename__ = "machine_health_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("mhr_"))
    machine_id: Mapped[str] = mapped_column(String, ForeignKey("machines.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(default=utcnow, index=True)

    engine_hours: Mapped[float] = mapped_column(Float, default=0.0)
    engine_temperature_c: Mapped[float] = mapped_column(Float, default=85.0)
    oil_pressure_kpa: Mapped[float] = mapped_column(Float, default=300.0)
    coolant_temperature_c: Mapped[float] = mapped_column(Float, default=80.0)
    hydraulic_temperature_c: Mapped[float] = mapped_column(Float, default=70.0)
    vibration_rms: Mapped[float] = mapped_column(Float, default=2.0)
    fault_code_count: Mapped[int] = mapped_column(Integer, default=0)
    fuel_consumption_change_pct: Mapped[float] = mapped_column(Float, default=0.0)
    maintenance_overdue_days: Mapped[float] = mapped_column(Float, default=0.0)
    recent_anomaly_count: Mapped[int] = mapped_column(Integer, default=0)

    failure_risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String, default="LOW")
    likely_subsystem: Mapped[str] = mapped_column(String, default="unknown")
    contributing_factors_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class MaintenanceRecommendation(Base):
    __tablename__ = "maintenance_recommendations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("mnt_"))
    machine_id: Mapped[str] = mapped_column(String, ForeignKey("machines.id"), index=True)
    health_record_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("machine_health_records.id"), nullable=True
    )
    priority: Mapped[str] = mapped_column(String, default="LOW")
    subsystem: Mapped[str] = mapped_column(String, default="unknown")
    recommendation: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String, default="OPEN")

    created_at: Mapped[datetime] = mapped_column(default=utcnow)
