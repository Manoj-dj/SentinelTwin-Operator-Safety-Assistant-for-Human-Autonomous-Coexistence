"""Predictive machine-failure risk: rule-based, with optional ML classifier blend.

Output is explicitly framed as "predicted maintenance risk" / "inspection
recommended" -- never a certainty claim.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field

import joblib
import numpy as np

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_MODEL_PATH = os.path.join(settings.ML_MODELS_DIR, "failure_model.joblib")
_model_cache: dict[str, object] = {}


def _load_model():
    if "model" in _model_cache:
        return _model_cache["model"]
    if os.path.exists(_MODEL_PATH):
        try:
            _model_cache["model"] = joblib.load(_MODEL_PATH)
            logger.info("Loaded failure risk ML model from %s", _MODEL_PATH)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to load failure model, using rule-based fallback: %s", exc)
            _model_cache["model"] = None
    else:
        _model_cache["model"] = None
    return _model_cache["model"]


def classify_risk(score: float) -> str:
    if score >= 75:
        return "CRITICAL"
    if score >= 50:
        return "HIGH"
    if score >= 25:
        return "MODERATE"
    return "LOW"


@dataclass
class FailureRiskResult:
    failure_risk_score: float
    risk_level: str
    likely_subsystem: str
    contributing_factors: list[str] = field(default_factory=list)
    recommended_action: str = ""
    maintenance_priority: str = "LOW"
    model_source: str = "rule_based"


def _rule_based_score(
    *,
    engine_temperature_c: float,
    oil_pressure_kpa: float,
    coolant_temperature_c: float,
    hydraulic_temperature_c: float,
    vibration_rms: float,
    fault_code_count: int,
    fuel_consumption_change_pct: float,
    maintenance_overdue_days: float,
    recent_anomaly_count: int,
) -> tuple[float, list[str], dict[str, float]]:
    score = 0.0
    factors: list[str] = []
    subsystem_scores = {"engine": 0.0, "hydraulic": 0.0, "cooling": 0.0, "drivetrain": 0.0}

    if engine_temperature_c > 105:
        score += 20
        subsystem_scores["engine"] += 20
        factors.append(f"Engine temperature critical ({engine_temperature_c:.0f} C)")
    elif engine_temperature_c > 95:
        score += 10
        subsystem_scores["engine"] += 10
        factors.append(f"Engine temperature elevated ({engine_temperature_c:.0f} C)")

    if oil_pressure_kpa < 200:
        score += 20
        subsystem_scores["engine"] += 20
        factors.append(f"Oil pressure low ({oil_pressure_kpa:.0f} kPa)")
    elif oil_pressure_kpa < 250:
        score += 10
        subsystem_scores["engine"] += 10
        factors.append(f"Oil pressure below normal ({oil_pressure_kpa:.0f} kPa)")

    if coolant_temperature_c > 100:
        score += 15
        subsystem_scores["cooling"] += 15
        factors.append(f"Coolant temperature critical ({coolant_temperature_c:.0f} C)")
    elif coolant_temperature_c > 90:
        score += 8
        subsystem_scores["cooling"] += 8
        factors.append(f"Coolant temperature elevated ({coolant_temperature_c:.0f} C)")

    if hydraulic_temperature_c > 90:
        score += 15
        subsystem_scores["hydraulic"] += 15
        factors.append(f"Hydraulic temperature critical ({hydraulic_temperature_c:.0f} C)")
    elif hydraulic_temperature_c > 80:
        score += 8
        subsystem_scores["hydraulic"] += 8
        factors.append(f"Hydraulic temperature elevated ({hydraulic_temperature_c:.0f} C)")

    if vibration_rms > 7:
        score += 15
        subsystem_scores["drivetrain"] += 15
        factors.append(f"Vibration RMS high ({vibration_rms:.1f})")
    elif vibration_rms > 4:
        score += 8
        subsystem_scores["drivetrain"] += 8
        factors.append(f"Vibration RMS above normal ({vibration_rms:.1f})")

    fault_contrib = min(fault_code_count * 8.0, 20.0)
    if fault_contrib:
        score += fault_contrib
        subsystem_scores["drivetrain"] += fault_contrib
        factors.append(f"{fault_code_count} active fault code(s)")

    overdue_contrib = min(maintenance_overdue_days * 0.5, 15.0)
    if overdue_contrib:
        score += overdue_contrib
        factors.append(f"Maintenance overdue by {maintenance_overdue_days:.0f} day(s)")

    anomaly_contrib = min(recent_anomaly_count * 5.0, 15.0)
    if anomaly_contrib:
        score += anomaly_contrib
        factors.append(f"{recent_anomaly_count} recent unusual-pattern detection(s)")

    if fuel_consumption_change_pct > 20:
        score += 10
        factors.append(f"Fuel consumption increased {fuel_consumption_change_pct:.0f}% versus baseline")

    return max(0.0, min(100.0, score)), factors, subsystem_scores


def evaluate_machine_health(
    *,
    engine_hours: float,
    engine_temperature_c: float,
    oil_pressure_kpa: float,
    coolant_temperature_c: float,
    hydraulic_temperature_c: float,
    vibration_rms: float,
    fault_code_count: int,
    fuel_consumption_change_pct: float = 0.0,
    maintenance_overdue_days: float = 0.0,
    recent_anomaly_count: int = 0,
) -> FailureRiskResult:
    rule_score, factors, subsystem_scores = _rule_based_score(
        engine_temperature_c=engine_temperature_c,
        oil_pressure_kpa=oil_pressure_kpa,
        coolant_temperature_c=coolant_temperature_c,
        hydraulic_temperature_c=hydraulic_temperature_c,
        vibration_rms=vibration_rms,
        fault_code_count=fault_code_count,
        fuel_consumption_change_pct=fuel_consumption_change_pct,
        maintenance_overdue_days=maintenance_overdue_days,
        recent_anomaly_count=recent_anomaly_count,
    )

    model_source = "rule_based"
    final_score = rule_score
    model = _load_model()
    if model is not None:
        try:
            features = np.array(
                [[
                    engine_hours,
                    engine_temperature_c,
                    oil_pressure_kpa,
                    coolant_temperature_c,
                    hydraulic_temperature_c,
                    vibration_rms,
                    fault_code_count,
                    fuel_consumption_change_pct,
                    maintenance_overdue_days,
                    recent_anomaly_count,
                ]]
            )
            proba = model.predict_proba(features)[0]
            class_midpoints = {"LOW": 12.5, "MODERATE": 37.5, "HIGH": 62.5, "CRITICAL": 87.5}
            # Map weights by model.classes_ order (sklearn sorts string labels
            # alphabetically, which is NOT the same as LOW..CRITICAL severity order).
            weights = np.array([class_midpoints.get(str(c), 50.0) for c in model.classes_])
            ml_score = float(np.dot(proba, weights))
            final_score = round((rule_score * 0.5) + (ml_score * 0.5), 1)
            model_source = "rule_based+ml_blend"
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failure model inference failed, using rule-based score only: %s", exc)

    level = classify_risk(final_score)
    likely_subsystem = max(subsystem_scores, key=subsystem_scores.get) if any(subsystem_scores.values()) else "unknown"

    priority_map = {"LOW": "LOW", "MODERATE": "MEDIUM", "HIGH": "HIGH", "CRITICAL": "URGENT"}
    action_map = {
        "LOW": "No immediate action. Continue standard maintenance schedule.",
        "MODERATE": f"Inspection recommended for {likely_subsystem} subsystem at next scheduled stop.",
        "HIGH": f"Schedule near-term inspection of {likely_subsystem} subsystem. Predicted maintenance risk is elevated.",
        "CRITICAL": (
            f"Predicted maintenance risk is CRITICAL for {likely_subsystem} subsystem. "
            "Recommend immediate inspection before continued operation."
        ),
    }

    return FailureRiskResult(
        failure_risk_score=round(final_score, 1),
        risk_level=level,
        likely_subsystem=likely_subsystem,
        contributing_factors=factors,
        recommended_action=action_map[level],
        maintenance_priority=priority_map[level],
        model_source=model_source,
    )
