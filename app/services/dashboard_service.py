"""Builds the operator context package: recent telemetry, active alerts,
task schedule, truck states, incidents. Reused by both the dashboard router
and the chatbot service.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import AckStatus, TaskStatus
from app.models.incident import Incident
from app.models.machine import Machine
from app.models.operator import Operator
from app.models.shift import Shift
from app.models.task import Task
from app.models.telemetry import TelemetryRecord
from app.models.truck import AutonomousTruck
from app.services import fatigue_service
from app.services.training_recommendation_service import recommend_training_for_operator


def get_latest_telemetry(db: Session, operator_id: str | None = None, machine_id: str | None = None) -> TelemetryRecord | None:
    stmt = select(TelemetryRecord).order_by(TelemetryRecord.timestamp.desc())
    if operator_id:
        stmt = stmt.where(TelemetryRecord.operator_id == operator_id)
    if machine_id:
        stmt = stmt.where(TelemetryRecord.machine_id == machine_id)
    return db.scalars(stmt.limit(1)).first()


def get_active_shift(db: Session, operator_id: str) -> Shift | None:
    stmt = (
        select(Shift)
        .where(Shift.operator_id == operator_id, Shift.end_time.is_(None))
        .order_by(Shift.start_time.desc())
    )
    return db.scalars(stmt).first()


def get_tasks_today(db: Session, operator_id: str) -> list[Task]:
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    stmt = (
        select(Task)
        .where(
            Task.operator_id == operator_id,
            Task.start_time >= start_of_day,
            Task.start_time < end_of_day,
        )
        .order_by(Task.start_time.asc())
    )
    return list(db.scalars(stmt).all())


def get_open_incidents(db: Session, operator_id: str | None = None, machine_id: str | None = None, limit: int = 10) -> list[Incident]:
    stmt = select(Incident).where(Incident.ack_status != AckStatus.RESOLVED)
    if operator_id:
        stmt = stmt.where(Incident.operator_id == operator_id)
    if machine_id:
        stmt = stmt.where(Incident.machine_id == machine_id)
    stmt = stmt.order_by(Incident.timestamp.desc()).limit(limit)
    return list(db.scalars(stmt).all())


def build_operator_context(db: Session, operator_id: str) -> dict:
    """Build a compact context package used by both the dashboard and chatbot."""
    operator = db.get(Operator, operator_id)
    latest_telemetry = get_latest_telemetry(db, operator_id=operator_id)
    machine = db.get(Machine, latest_telemetry.machine_id) if latest_telemetry else None
    truck = db.get(AutonomousTruck, latest_telemetry.nearest_truck_id) if latest_telemetry and latest_telemetry.nearest_truck_id else None
    tasks_today = get_tasks_today(db, operator_id)
    open_incidents = get_open_incidents(db, operator_id=operator_id)
    active_shift = get_active_shift(db, operator_id)

    fatigue_result = None
    if latest_telemetry:
        continuous_hours = (latest_telemetry.time_since_shift_start_min or 0) / 60.0
        fatigue_result = fatigue_service.evaluate_fatigue(
            continuous_work_hours=continuous_hours,
            hours_since_last_break=max(0.0, continuous_hours - (latest_telemetry.break_minutes_today or 0) / 60.0),
            self_reported_fatigue=latest_telemetry.self_reported_fatigue,
            recent_high_risk_alerts=len(open_incidents),
        )

    training_recs = recommend_training_for_operator(
        db,
        operator_id,
        idle_percentage=latest_telemetry.idle_percentage if latest_telemetry else None,
        fatigue_score=fatigue_result.fatigue_score if fatigue_result else None,
    )

    return {
        "operator": operator,
        "latest_telemetry": latest_telemetry,
        "machine": machine,
        "truck": truck,
        "tasks_today": tasks_today,
        "open_incidents": open_incidents,
        "active_shift": active_shift,
        "fatigue_result": fatigue_result,
        "training_recommendations": training_recs,
    }
