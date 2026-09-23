from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MachineHealthInput(BaseModel):
    machine_id: str
    engine_hours: float
    engine_temperature_c: float
    oil_pressure_kpa: float
    coolant_temperature_c: float
    hydraulic_temperature_c: float
    vibration_rms: float
    fault_code_count: int
    fuel_consumption_change_pct: float = 0.0
    maintenance_overdue_days: float = 0.0
    recent_anomaly_count: int = 0


class MachineHealthResult(BaseModel):
    machine_id: str
    failure_risk_score: float
    risk_level: str
    likely_subsystem: str
    contributing_factors: list[str]
    recommended_action: str
    maintenance_priority: str
    model_source: str
    disclaimer: str


class MaintenanceRecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    machine_id: str
    health_record_id: str | None = None
    priority: str
    subsystem: str
    recommendation: str
    status: str
    created_at: datetime
