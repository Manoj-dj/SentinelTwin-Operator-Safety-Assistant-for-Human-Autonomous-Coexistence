from __future__ import annotations

from sqlalchemy import select
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.incident import Incident
from app.models.telemetry import TelemetryRecord
from app.schemas.simulation import AnomalyScoreRequest, AnomalyScoreResult, BehaviorAnalysisResult, EfficiencyResult
from app.services import anomaly_service, efficiency_service
from app.schemas.common import SAFETY_DISCLAIMER

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


def _recent_telemetry_for(db: Session, *, machine_id: str | None = None, operator_id: str | None = None, limit: int = 20):
    stmt = select(TelemetryRecord).order_by(TelemetryRecord.timestamp.desc())
    if machine_id:
        stmt = stmt.where(TelemetryRecord.machine_id == machine_id)
    if operator_id:
        stmt = stmt.where(TelemetryRecord.operator_id == operator_id)
    return list(db.scalars(stmt.limit(limit)).all())


@router.get("/machine/{machine_id}/efficiency", response_model=EfficiencyResult)
def machine_efficiency(machine_id: str, db: Session = Depends(get_db)):
    records = _recent_telemetry_for(db, machine_id=machine_id, limit=20)
    if not records:
        raise HTTPException(status_code=404, detail="No telemetry found for this machine")
    latest = records[0]
    baseline = sum(r.machine_efficiency_percentage for r in records[1:]) / max(len(records) - 1, 1) if len(records) > 1 else None

    metrics = efficiency_service.compute_efficiency(
        active_engine_time_min=latest.active_engine_time_min or 1.0,
        idling_time_min=latest.idling_time_min,
        load_cycles=latest.load_cycles,
        planned_load_cycles=latest.planned_load_cycles or 1,
        fuel_used_l=latest.fuel_used_l,
        baseline_efficiency_pct=baseline,
        weather_impacted=latest.weather_condition != "CLEAR",
        queue_delay_min=latest.site_congestion_level * 30,
        safety_event_occurred=latest.safety_alert_triggered,
    )
    return EfficiencyResult(
        entity_id=machine_id,
        entity_type="machine",
        productive_time_min=metrics.productive_time_min,
        machine_efficiency_percentage=metrics.machine_efficiency_percentage,
        idle_percentage=metrics.idle_percentage,
        fuel_efficiency=metrics.fuel_efficiency,
        cycle_efficiency=metrics.cycle_efficiency,
        baseline_comparison_pct=metrics.baseline_comparison_pct,
        trend=metrics.trend,
        grade=metrics.grade,
        insight=metrics.insight,
    )


@router.get("/operator/{operator_id}/efficiency", response_model=EfficiencyResult)
def operator_efficiency(operator_id: str, db: Session = Depends(get_db)):
    records = _recent_telemetry_for(db, operator_id=operator_id, limit=20)
    if not records:
        raise HTTPException(status_code=404, detail="No telemetry found for this operator")
    latest = records[0]
    baseline = sum(r.machine_efficiency_percentage for r in records[1:]) / max(len(records) - 1, 1) if len(records) > 1 else None

    metrics = efficiency_service.compute_efficiency(
        active_engine_time_min=latest.active_engine_time_min or 1.0,
        idling_time_min=latest.idling_time_min,
        load_cycles=latest.load_cycles,
        planned_load_cycles=latest.planned_load_cycles or 1,
        fuel_used_l=latest.fuel_used_l,
        baseline_efficiency_pct=baseline,
        weather_impacted=latest.weather_condition != "CLEAR",
        queue_delay_min=latest.site_congestion_level * 30,
        safety_event_occurred=latest.safety_alert_triggered,
    )
    return EfficiencyResult(
        entity_id=operator_id,
        entity_type="operator",
        productive_time_min=metrics.productive_time_min,
        machine_efficiency_percentage=metrics.machine_efficiency_percentage,
        idle_percentage=metrics.idle_percentage,
        fuel_efficiency=metrics.fuel_efficiency,
        cycle_efficiency=metrics.cycle_efficiency,
        baseline_comparison_pct=metrics.baseline_comparison_pct,
        trend=metrics.trend,
        grade=metrics.grade,
        insight=metrics.insight,
    )


@router.get("/operator/{operator_id}/behavior", response_model=BehaviorAnalysisResult)
def operator_behavior(operator_id: str, db: Session = Depends(get_db)):
    records = _recent_telemetry_for(db, operator_id=operator_id, limit=100)
    anomaly_events = [r for r in records if r.anomaly_label == "ANOMALY"]

    patterns = []
    if any(r.idle_percentage > 35 for r in records):
        patterns.append("Repeated excessive idling with low production cycles")
    if sum(r.harsh_braking_count + r.harsh_acceleration_count for r in records) > 15:
        patterns.append("Elevated frequency of harsh braking/acceleration events")
    if any((r.truck_distance_m or 999) < 10 for r in records):
        patterns.append("Repeated close approaches to autonomous trucks")

    stmt = select(Incident).where(Incident.operator_id == operator_id)
    seatbelt_incidents = [i for i in db.scalars(stmt).all() if i.incident_type.value == "SEATBELT_VIOLATION"]
    if len(seatbelt_incidents) >= 2:
        patterns.append("Repeated seatbelt violations")

    recommended_training = []
    if patterns:
        recommended_training.append("Working Safely Near Autonomous Haul Trucks")
    if seatbelt_incidents:
        recommended_training.append("Seatbelt Compliance and Pre-Start Checklist")

    return BehaviorAnalysisResult(
        operator_id=operator_id,
        anomaly_events_last_7d=len(anomaly_events),
        patterns_detected=patterns or ["No unusual patterns detected in recent telemetry"],
        recommended_training=recommended_training,
        disclaimer=SAFETY_DISCLAIMER,
    )
