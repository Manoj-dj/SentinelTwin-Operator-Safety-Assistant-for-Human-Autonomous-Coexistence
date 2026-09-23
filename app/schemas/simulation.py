from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class ScenarioResult(BaseModel):
    scenario_name: str
    description: str
    steps: list[dict[str, Any]]
    resulting_incidents: list[dict[str, Any]]
    final_risk_summary: dict[str, Any]
    disclaimer: str


class AnomalyScoreRequest(BaseModel):
    machine_id: str
    fuel_used_per_hour: float
    load_cycles_per_hour: float
    idle_minutes_per_hour: float
    idle_percentage: float
    engine_temperature_c: float
    hydraulic_temperature_c: float
    vibration_rms: float
    harsh_braking_count: int
    harsh_acceleration_count: int
    seatbelt_violations_count: int
    time_since_shift_started_min: float
    operator_fatigue_score: float
    visibility_score: float
    distance_to_nearest_truck_m: float | None
    safety_risk_score: float


class AnomalyScoreResult(BaseModel):
    machine_id: str
    anomaly_label: str
    anomaly_score: float
    contributing_factors: list[str]
    recommended_action: str
    model_source: str
    disclaimer: str


class EfficiencyResult(BaseModel):
    entity_id: str
    entity_type: str
    productive_time_min: float
    machine_efficiency_percentage: float
    idle_percentage: float
    fuel_efficiency: float
    cycle_efficiency: float
    baseline_comparison_pct: float
    trend: str
    grade: str
    insight: str


class BehaviorAnalysisResult(BaseModel):
    operator_id: str
    anomaly_events_last_7d: int
    patterns_detected: list[str]
    recommended_training: list[str]
    disclaimer: str
