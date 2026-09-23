from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TelemetryIn(BaseModel):
    operator_id: str | None = None
    machine_id: str
    machine_type: str = "LOADER"

    engine_hours: float = 0.0
    engine_running: bool = True
    machine_speed_kmh: float = 0.0
    fuel_used_l: float = 0.0
    fuel_rate_lph: float = 0.0
    load_cycles: int = 0
    planned_load_cycles: int = 0
    idling_time_min: float = 0.0
    active_engine_time_min: float = 0.0
    seatbelt_status: str = "FASTENED"

    engine_temperature_c: float = 85.0
    coolant_temperature_c: float = 80.0
    oil_pressure_kpa: float = 300.0
    hydraulic_temperature_c: float = 70.0
    vibration_rms: float = 2.0
    fault_code_count: int = 0
    harsh_braking_count: int = 0
    harsh_acceleration_count: int = 0

    gps_x: float = 0.0
    gps_y: float = 0.0

    weather_condition: str = "CLEAR"
    visibility_score: float = 1.0
    site_congestion_level: float = 0.2

    shift_id: str | None = None
    time_since_shift_start_min: float = 0.0
    break_minutes_today: float = 0.0
    self_reported_fatigue: float | None = None

    nearest_truck_id: str | None = None
    truck_distance_m: float | None = None
    truck_speed_kmh: float | None = None
    truck_heading_deg: float | None = None
    truck_state: str | None = None
    active_mission: bool = False
    mission_type: str | None = None
    communication_status: str = "OK"
    safe_to_approach_confirmed: bool = False
    nearby_condition_change: bool = False
    recovery_personnel_active: bool = False
    truck_gps_x: float | None = None
    truck_gps_y: float | None = None


class TelemetryOut(TelemetryIn):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    state_transition_risk_score: float
    collision_interaction_risk_score: float
    fatigue_score: float
    machine_efficiency_percentage: float
    idle_percentage: float
    fuel_efficiency: float
    anomaly_label: str
    anomaly_score: float
    failure_risk_score: float
    task_duration_actual_min: float | None = None
    safety_alert_triggered: bool
    incident_type: str | None = None
    created_at: datetime
