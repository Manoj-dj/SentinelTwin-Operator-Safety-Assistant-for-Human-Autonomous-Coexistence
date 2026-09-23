from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.utils.ids import new_id
from app.utils.time_utils import utcnow


class TelemetryRecord(Base):
    __tablename__ = "telemetry_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("tel_"))
    timestamp: Mapped[datetime] = mapped_column(default=utcnow, index=True)

    operator_id: Mapped[str | None] = mapped_column(String, ForeignKey("operators.id"), nullable=True, index=True)
    machine_id: Mapped[str] = mapped_column(String, ForeignKey("machines.id"), index=True)
    machine_type: Mapped[str] = mapped_column(String, default="LOADER")

    # Machine operating telemetry
    engine_hours: Mapped[float] = mapped_column(Float, default=0.0)
    engine_running: Mapped[bool] = mapped_column(Boolean, default=True)
    machine_speed_kmh: Mapped[float] = mapped_column(Float, default=0.0)
    fuel_used_l: Mapped[float] = mapped_column(Float, default=0.0)
    fuel_rate_lph: Mapped[float] = mapped_column(Float, default=0.0)
    load_cycles: Mapped[int] = mapped_column(Integer, default=0)
    planned_load_cycles: Mapped[int] = mapped_column(Integer, default=0)
    idling_time_min: Mapped[float] = mapped_column(Float, default=0.0)
    active_engine_time_min: Mapped[float] = mapped_column(Float, default=0.0)
    seatbelt_status: Mapped[str] = mapped_column(String, default="FASTENED")

    engine_temperature_c: Mapped[float] = mapped_column(Float, default=85.0)
    coolant_temperature_c: Mapped[float] = mapped_column(Float, default=80.0)
    oil_pressure_kpa: Mapped[float] = mapped_column(Float, default=300.0)
    hydraulic_temperature_c: Mapped[float] = mapped_column(Float, default=70.0)
    vibration_rms: Mapped[float] = mapped_column(Float, default=2.0)
    fault_code_count: Mapped[int] = mapped_column(Integer, default=0)
    harsh_braking_count: Mapped[int] = mapped_column(Integer, default=0)
    harsh_acceleration_count: Mapped[int] = mapped_column(Integer, default=0)

    gps_x: Mapped[float] = mapped_column(Float, default=0.0)
    gps_y: Mapped[float] = mapped_column(Float, default=0.0)

    weather_condition: Mapped[str] = mapped_column(String, default="CLEAR")
    visibility_score: Mapped[float] = mapped_column(Float, default=1.0)
    site_congestion_level: Mapped[float] = mapped_column(Float, default=0.2)

    shift_id: Mapped[str | None] = mapped_column(String, ForeignKey("shifts.id"), nullable=True)
    time_since_shift_start_min: Mapped[float] = mapped_column(Float, default=0.0)
    break_minutes_today: Mapped[float] = mapped_column(Float, default=0.0)
    self_reported_fatigue: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Autonomous truck context
    nearest_truck_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("autonomous_trucks.id"), nullable=True, index=True
    )
    truck_distance_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    truck_speed_kmh: Mapped[float | None] = mapped_column(Float, nullable=True)
    truck_heading_deg: Mapped[float | None] = mapped_column(Float, nullable=True)
    truck_state: Mapped[str | None] = mapped_column(String, nullable=True)
    active_mission: Mapped[bool] = mapped_column(Boolean, default=False)
    mission_type: Mapped[str | None] = mapped_column(String, nullable=True)
    communication_status: Mapped[str] = mapped_column(String, default="OK")
    safe_to_approach_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    nearby_condition_change: Mapped[bool] = mapped_column(Boolean, default=False)
    recovery_personnel_active: Mapped[bool] = mapped_column(Boolean, default=False)
    truck_gps_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    truck_gps_y: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Derived / labels
    state_transition_risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    collision_interaction_risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    fatigue_score: Mapped[float] = mapped_column(Float, default=0.0)
    machine_efficiency_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    idle_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    fuel_efficiency: Mapped[float] = mapped_column(Float, default=0.0)
    anomaly_label: Mapped[str] = mapped_column(String, default="NORMAL")
    anomaly_score: Mapped[float] = mapped_column(Float, default=0.0)
    failure_risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    task_duration_actual_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    safety_alert_triggered: Mapped[bool] = mapped_column(Boolean, default=False)
    incident_type: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(default=utcnow)
