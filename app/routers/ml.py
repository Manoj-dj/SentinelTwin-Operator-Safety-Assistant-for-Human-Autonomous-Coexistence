from __future__ import annotations

from fastapi import APIRouter

from app.schemas.common import SAFETY_DISCLAIMER
from app.schemas.simulation import AnomalyScoreRequest, AnomalyScoreResult
from app.services import anomaly_service

router = APIRouter(prefix="/api/v1/ml", tags=["ml"])


@router.post("/anomaly/score", response_model=AnomalyScoreResult)
def score_anomaly(payload: AnomalyScoreRequest):
    features = {
        "fuel_used_per_hour": payload.fuel_used_per_hour,
        "load_cycles_per_hour": payload.load_cycles_per_hour,
        "idle_minutes_per_hour": payload.idle_minutes_per_hour,
        "idle_percentage": payload.idle_percentage,
        "engine_temperature_c": payload.engine_temperature_c,
        "hydraulic_temperature_c": payload.hydraulic_temperature_c,
        "vibration_rms": payload.vibration_rms,
        "harsh_braking_count": payload.harsh_braking_count,
        "harsh_acceleration_count": payload.harsh_acceleration_count,
        "seatbelt_violations_count": payload.seatbelt_violations_count,
        "time_since_shift_started_min": payload.time_since_shift_started_min,
        "operator_fatigue_score": payload.operator_fatigue_score,
        "visibility_score": payload.visibility_score,
        "distance_to_nearest_truck_m": payload.distance_to_nearest_truck_m,
        "safety_risk_score": payload.safety_risk_score,
    }
    result = anomaly_service.score_telemetry(features)
    return AnomalyScoreResult(
        machine_id=payload.machine_id,
        anomaly_label=result.anomaly_label,
        anomaly_score=result.anomaly_score,
        contributing_factors=result.contributing_factors,
        recommended_action=result.recommended_action,
        model_source=result.model_source,
        disclaimer=SAFETY_DISCLAIMER,
    )
