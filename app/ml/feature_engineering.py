"""Shared feature extraction so training scripts and live services agree
on feature order/semantics.
"""
from __future__ import annotations

ANOMALY_FEATURE_ORDER = [
    "fuel_used_per_hour",
    "load_cycles_per_hour",
    "idle_minutes_per_hour",
    "idle_percentage",
    "engine_temperature_c",
    "hydraulic_temperature_c",
    "vibration_rms",
    "harsh_braking_count",
    "harsh_acceleration_count",
    "seatbelt_violations_count",
    "time_since_shift_started_min",
    "operator_fatigue_score",
    "visibility_score",
    "distance_to_nearest_truck_m",
    "safety_risk_score",
]

TASK_FEATURE_ORDER = [
    "load_cycles_planned",
    "engine_hours",
    "avg_fuel_rate_lph",
    "idling_time_min",
    "visibility_score",
    "queue_wait_minutes",
    "operator_experience_score",
    "fatigue_score",
    "autonomous_truck_availability",
    "site_congestion_level",
    "weather_penalty",
]

FAILURE_FEATURE_ORDER = [
    "engine_hours",
    "engine_temperature_c",
    "oil_pressure_kpa",
    "coolant_temperature_c",
    "hydraulic_temperature_c",
    "vibration_rms",
    "fault_code_count",
    "fuel_consumption_change_pct",
    "maintenance_overdue_days",
    "recent_anomaly_count",
]


def anomaly_features_to_vector(features: dict) -> list[float]:
    return [float(features.get(k) or 0.0) for k in ANOMALY_FEATURE_ORDER]
