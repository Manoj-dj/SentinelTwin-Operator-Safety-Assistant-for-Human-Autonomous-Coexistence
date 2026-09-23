from __future__ import annotations

from app.models.enums import ConnectivityStatus, SeatbeltStatus
from pydantic import BaseModel


class EdgeTelemetryEvent(BaseModel):
    machine_id: str
    operator_id: str | None = None
    connectivity_status: ConnectivityStatus = ConnectivityStatus.ONLINE

    seatbelt_status: SeatbeltStatus = SeatbeltStatus.FASTENED
    engine_running: bool = True
    machine_moving: bool = False

    truck_id: str | None = None
    truck_distance_m: float | None = None
    truck_state: str | None = None
    active_mission: bool = False
    nearby_condition_change: bool = False
    safe_to_approach_confirmed: bool = False
    communication_status: str = "OK"

    continuous_work_hours: float | None = None
    hours_since_last_break: float | None = None

    engine_temperature_c: float | None = None
    oil_pressure_kpa: float | None = None
    coolant_temperature_c: float | None = None
    hydraulic_temperature_c: float | None = None
    vibration_rms: float | None = None
    fault_code_count: int | None = None

    visibility_score: float = 1.0


class EdgeAlert(BaseModel):
    alert_type: str
    severity: str
    message: str


class EdgeEvaluationResult(BaseModel):
    connectivity_status: ConnectivityStatus
    alerts: list[EdgeAlert]
    processed_locally: bool
    synced_to_backend: bool
    disclaimer: str
