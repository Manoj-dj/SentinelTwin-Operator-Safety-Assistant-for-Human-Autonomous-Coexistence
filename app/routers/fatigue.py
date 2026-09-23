from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import SAFETY_DISCLAIMER
from app.schemas.shift import FatigueEvaluationRequest, FatigueEvaluationResult
from app.services import dashboard_service, fatigue_service

router = APIRouter(prefix="/api/v1/fatigue", tags=["fatigue"])


@router.get("/operator/{operator_id}", response_model=FatigueEvaluationResult)
def get_operator_fatigue(operator_id: str, db: Session = Depends(get_db)):
    telemetry = dashboard_service.get_latest_telemetry(db, operator_id=operator_id)
    if telemetry is None:
        raise HTTPException(status_code=404, detail="No telemetry found for this operator")

    continuous_hours = (telemetry.time_since_shift_start_min or 0) / 60.0
    hours_since_break = max(0.0, continuous_hours - (telemetry.break_minutes_today or 0) / 60.0)
    result = fatigue_service.evaluate_fatigue(
        continuous_work_hours=continuous_hours,
        hours_since_last_break=hours_since_break,
        harsh_event_count=telemetry.harsh_braking_count + telemetry.harsh_acceleration_count,
        self_reported_fatigue=telemetry.self_reported_fatigue,
    )
    return FatigueEvaluationResult(
        operator_id=operator_id,
        fatigue_score=result.fatigue_score,
        fatigue_level=result.fatigue_level,
        contributing_factors=result.contributing_factors,
        recommended_break_minutes=result.recommended_break_minutes,
        break_due=result.break_due,
        manager_escalation=result.manager_escalation,
        message=result.message,
        disclaimer=SAFETY_DISCLAIMER,
    )


@router.post("/evaluate", response_model=FatigueEvaluationResult)
def evaluate_fatigue(payload: FatigueEvaluationRequest):
    result = fatigue_service.evaluate_fatigue(
        continuous_work_hours=payload.continuous_work_hours,
        hours_since_last_break=payload.hours_since_last_break,
        harsh_event_count=payload.harsh_event_count,
        productivity_decline_pct=payload.productivity_decline_pct,
        is_night_shift=payload.is_night_shift,
        self_reported_fatigue=payload.self_reported_fatigue,
        recent_high_risk_alerts=payload.recent_high_risk_alerts,
    )
    return FatigueEvaluationResult(
        operator_id=payload.operator_id,
        fatigue_score=result.fatigue_score,
        fatigue_level=result.fatigue_level,
        contributing_factors=result.contributing_factors,
        recommended_break_minutes=result.recommended_break_minutes,
        break_due=result.break_due,
        manager_escalation=result.manager_escalation,
        message=result.message,
        disclaimer=SAFETY_DISCLAIMER,
    )
