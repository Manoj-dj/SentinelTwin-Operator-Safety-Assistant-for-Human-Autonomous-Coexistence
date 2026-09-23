"""Unusual operating-pattern detection using IsolationForest (with heuristic fallback).

IMPORTANT: a statistical anomaly is not a confirmed unsafe condition. All
responses use "unusual pattern detected; review recommended" framing.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field

import joblib
import numpy as np

from app.core.config import settings
from app.core.logging import get_logger
from app.ml.feature_engineering import ANOMALY_FEATURE_ORDER, anomaly_features_to_vector

logger = get_logger(__name__)

_MODEL_PATH = os.path.join(settings.ML_MODELS_DIR, "anomaly_model.joblib")
_SCALER_PATH = os.path.join(settings.ML_MODELS_DIR, "anomaly_scaler.joblib")
_cache: dict[str, object] = {}


def _load():
    if "model" in _cache:
        return _cache["model"], _cache.get("scaler")
    model = None
    scaler = None
    if os.path.exists(_MODEL_PATH):
        try:
            model = joblib.load(_MODEL_PATH)
            if os.path.exists(_SCALER_PATH):
                scaler = joblib.load(_SCALER_PATH)
            logger.info("Loaded IsolationForest anomaly model from %s", _MODEL_PATH)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to load anomaly model, using heuristic fallback: %s", exc)
            model = None
    _cache["model"] = model
    _cache["scaler"] = scaler
    return model, scaler


@dataclass
class AnomalyResult:
    anomaly_label: str
    anomaly_score: float
    contributing_factors: list[str] = field(default_factory=list)
    recommended_action: str = ""
    model_source: str = "heuristic"


# Reasonable "normal" bounds used both for heuristic fallback and for
# generating human-readable explanations even when the ML model is used.
_NORMAL_RANGES = {
    "fuel_used_per_hour": (2.0, 25.0),
    "load_cycles_per_hour": (3.0, 20.0),
    "idle_minutes_per_hour": (0.0, 20.0),
    "idle_percentage": (0.0, 35.0),
    "engine_temperature_c": (70.0, 100.0),
    "hydraulic_temperature_c": (50.0, 85.0),
    "vibration_rms": (0.0, 5.5),
    "harsh_braking_count": (0.0, 3.0),
    "harsh_acceleration_count": (0.0, 3.0),
    "seatbelt_violations_count": (0.0, 0.0),
    "distance_to_nearest_truck_m": (10.0, 500.0),
}

_LABELS = {
    "fuel_used_per_hour": "fuel consumption per hour",
    "load_cycles_per_hour": "load cycles per hour",
    "idle_minutes_per_hour": "idle minutes per hour",
    "idle_percentage": "idle percentage",
    "engine_temperature_c": "engine temperature",
    "hydraulic_temperature_c": "hydraulic temperature",
    "vibration_rms": "vibration RMS",
    "harsh_braking_count": "harsh braking events",
    "harsh_acceleration_count": "harsh acceleration events",
    "seatbelt_violations_count": "seatbelt violations",
    "distance_to_nearest_truck_m": "distance to nearest autonomous truck",
}


def _explain(features: dict) -> list[str]:
    factors = []
    for key, (lo, hi) in _NORMAL_RANGES.items():
        val = features.get(key)
        if val is None:
            continue
        label = _LABELS.get(key, key)
        if key == "distance_to_nearest_truck_m":
            if val < lo:
                factors.append(f"Unusually close repeated approach to autonomous truck ({val:.1f} m)")
            continue
        if val > hi:
            factors.append(f"{label.capitalize()} unusually high ({val:.1f}, normal < {hi:.0f})")
        elif val < lo:
            factors.append(f"{label.capitalize()} unusually low ({val:.1f}, normal > {lo:.0f})")

    if features.get("idle_percentage", 0) > 35 and features.get("load_cycles_per_hour", 99) < 4:
        factors.append("Excessive idling combined with low production cycles")
    if features.get("fuel_used_per_hour", 0) > 20 and features.get("load_cycles_per_hour", 99) < 5:
        factors.append("Fuel consumption unusually high relative to production output")
    if features.get("seatbelt_violations_count", 0) > 0:
        factors.append("Repeated seatbelt violations recorded in window")
    return factors


def score_telemetry(features: dict) -> AnomalyResult:
    model, scaler = _load()
    factors = _explain(features)

    if model is not None:
        try:
            vec = np.array([anomaly_features_to_vector(features)])
            if scaler is not None:
                vec = scaler.transform(vec)
            raw_score = model.decision_function(vec)[0]  # higher = more normal
            prediction = model.predict(vec)[0]  # -1 = anomaly, 1 = normal
            anomaly_score = round(float(-raw_score), 4)
            label = "ANOMALY" if prediction == -1 else "NORMAL"
            if label == "NORMAL" and not factors:
                factors = ["No unusual pattern detected across monitored features"]
            return AnomalyResult(
                anomaly_label=label,
                anomaly_score=anomaly_score,
                contributing_factors=factors,
                recommended_action=_recommend(label, factors),
                model_source="isolation_forest",
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Anomaly model inference failed, falling back to heuristic: %s", exc)

    # Heuristic fallback: simple bound-violation count as pseudo-score.
    violation_count = len(factors)
    anomaly_score = round(min(violation_count / 5.0, 1.0), 3)
    label = "ANOMALY" if violation_count >= 2 else "NORMAL"
    if not factors:
        factors = ["No unusual pattern detected across monitored features"]
    return AnomalyResult(
        anomaly_label=label,
        anomaly_score=anomaly_score,
        contributing_factors=factors,
        recommended_action=_recommend(label, factors),
        model_source="heuristic_fallback",
    )


def _recommend(label: str, factors: list[str]) -> str:
    if label == "NORMAL":
        return "No review required. Continue standard monitoring."
    return (
        "Unusual pattern detected; review recommended. This is a statistical signal, not a "
        "confirmed unsafe condition -- a supervisor or maintenance review should verify context."
    )
