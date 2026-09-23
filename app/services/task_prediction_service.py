"""Task duration estimation using RandomForestRegressor, with heuristic fallback."""
from __future__ import annotations

import os
from dataclasses import dataclass, field

import joblib
import numpy as np

from app.core.config import settings
from app.core.logging import get_logger
from app.ml.feature_engineering import TASK_FEATURE_ORDER

logger = get_logger(__name__)

_MODEL_PATH = os.path.join(settings.ML_MODELS_DIR, "task_duration_model.joblib")
_cache: dict[str, object] = {}


def _load():
    if "model" in _cache:
        return _cache["model"]
    model = None
    if os.path.exists(_MODEL_PATH):
        try:
            model = joblib.load(_MODEL_PATH)
            logger.info("Loaded task duration model from %s", _MODEL_PATH)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to load task duration model, using heuristic fallback: %s", exc)
    _cache["model"] = model
    return model


@dataclass
class TaskPredictionResult:
    predicted_duration_min: float
    confidence_range_min: tuple[float, float]
    delay_risk: str
    primary_reasons: list[str] = field(default_factory=list)
    truck_arrival_impact_min: float | None = None
    model_source: str = "heuristic"


WEATHER_PENALTY = {"CLEAR": 0.0, "RAIN": 0.15, "DUST": 0.12, "FOG": 0.2, "NIGHT": 0.1}


def _heuristic(
    *,
    expected_duration_min: float,
    load_cycles_planned: int,
    idling_time_min: float,
    visibility_score: float,
    queue_wait_minutes: float,
    operator_experience_score: float,
    fatigue_score: float,
    autonomous_truck_availability: float,
    site_congestion_level: float,
    weather_condition: str,
) -> tuple[float, list[str]]:
    duration = expected_duration_min
    reasons = []

    weather_penalty = WEATHER_PENALTY.get(weather_condition, 0.0)
    if weather_penalty:
        duration *= 1 + weather_penalty
        reasons.append(f"{weather_condition.title()} conditions add delay risk")

    if visibility_score < 0.6:
        duration *= 1.1
        reasons.append("Reduced visibility slows cycle pace")

    if queue_wait_minutes > 10:
        duration += queue_wait_minutes * 0.6
        reasons.append(f"Autonomous truck queue wait of {queue_wait_minutes:.0f} min")

    if site_congestion_level > 0.5:
        duration *= 1 + (site_congestion_level - 0.5) * 0.3
        reasons.append("Elevated site congestion")

    if operator_experience_score < 40:
        duration *= 1.08
        reasons.append("Lower operator experience score")

    if fatigue_score > 60:
        duration *= 1.05
        reasons.append("Elevated operator fatigue risk")

    if autonomous_truck_availability < 0.5:
        duration += (1 - autonomous_truck_availability) * 15
        reasons.append("Limited autonomous truck availability")

    idle_ratio = idling_time_min / max(expected_duration_min, 1.0)
    if idle_ratio > 0.25:
        duration *= 1.1
        reasons.append("High idling time relative to planned duration")

    return duration, reasons


def predict_task_duration(
    *,
    expected_duration_min: float,
    load_cycles_planned: int,
    engine_hours: float = 0.0,
    avg_fuel_rate_lph: float = 10.0,
    idling_time_min: float = 5.0,
    visibility_score: float = 1.0,
    queue_wait_minutes: float = 5.0,
    operator_experience_score: float = 60.0,
    fatigue_score: float = 20.0,
    autonomous_truck_availability: float = 0.8,
    site_congestion_level: float = 0.2,
    weather_condition: str = "CLEAR",
) -> TaskPredictionResult:
    model = _load()
    model_source = "heuristic"

    if model is not None:
        try:
            weather_penalty = WEATHER_PENALTY.get(weather_condition, 0.0)
            features = np.array([[
                load_cycles_planned,
                engine_hours,
                avg_fuel_rate_lph,
                idling_time_min,
                visibility_score,
                queue_wait_minutes,
                operator_experience_score,
                fatigue_score,
                autonomous_truck_availability,
                site_congestion_level,
                weather_penalty,
            ]])
            predicted = float(model.predict(features)[0])
            _, reasons = _heuristic(
                expected_duration_min=expected_duration_min,
                load_cycles_planned=load_cycles_planned,
                idling_time_min=idling_time_min,
                visibility_score=visibility_score,
                queue_wait_minutes=queue_wait_minutes,
                operator_experience_score=operator_experience_score,
                fatigue_score=fatigue_score,
                autonomous_truck_availability=autonomous_truck_availability,
                site_congestion_level=site_congestion_level,
                weather_condition=weather_condition,
            )
            model_source = "random_forest_regressor"
        except Exception as exc:  # noqa: BLE001
            logger.warning("Task duration model inference failed, using heuristic: %s", exc)
            predicted, reasons = _heuristic(
                expected_duration_min=expected_duration_min,
                load_cycles_planned=load_cycles_planned,
                idling_time_min=idling_time_min,
                visibility_score=visibility_score,
                queue_wait_minutes=queue_wait_minutes,
                operator_experience_score=operator_experience_score,
                fatigue_score=fatigue_score,
                autonomous_truck_availability=autonomous_truck_availability,
                site_congestion_level=site_congestion_level,
                weather_condition=weather_condition,
            )
    else:
        predicted, reasons = _heuristic(
            expected_duration_min=expected_duration_min,
            load_cycles_planned=load_cycles_planned,
            idling_time_min=idling_time_min,
            visibility_score=visibility_score,
            queue_wait_minutes=queue_wait_minutes,
            operator_experience_score=operator_experience_score,
            fatigue_score=fatigue_score,
            autonomous_truck_availability=autonomous_truck_availability,
            site_congestion_level=site_congestion_level,
            weather_condition=weather_condition,
        )

    delay_ratio = predicted / max(expected_duration_min, 1.0)
    if delay_ratio >= 1.35:
        delay_risk = "HIGH"
    elif delay_ratio >= 1.15:
        delay_risk = "MEDIUM"
    else:
        delay_risk = "LOW"

    margin = predicted * 0.15
    truck_impact = queue_wait_minutes if queue_wait_minutes > 5 else None

    return TaskPredictionResult(
        predicted_duration_min=round(predicted, 1),
        confidence_range_min=(round(predicted - margin, 1), round(predicted + margin, 1)),
        delay_risk=delay_risk,
        primary_reasons=reasons or ["No significant delay factors identified"],
        truck_arrival_impact_min=truck_impact,
        model_source=model_source,
    )
