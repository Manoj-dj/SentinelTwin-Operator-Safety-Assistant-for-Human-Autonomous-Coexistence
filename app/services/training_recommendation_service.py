"""Rules mapping operator context (incidents, fatigue, idling, quiz scores)
to recommended training resources with a priority.
"""
from __future__ import annotations

import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import IncidentType
from app.models.incident import Incident
from app.models.training import OperatorTrainingProgress, TrainingResource

TITLE_TRIGGERS = {
    "state_transition": "Working Safely Near Autonomous Haul Trucks",
    "seatbelt": "Seatbelt Compliance and Pre-Start Checklist",
    "fatigue": "Fatigue Management and Break Protocol",
    "idling": "Fuel-Efficient Loading Cycles",
    "visibility": "Dust, Rain and Low-Visibility Quarry Operations",
}


def _resource_by_title(db: Session, title: str) -> TrainingResource | None:
    stmt = select(TrainingResource).where(TrainingResource.title == title)
    return db.scalars(stmt).first()


def recommend_training_for_operator(
    db: Session,
    operator_id: str,
    *,
    lookback_days: int = 30,
    idle_percentage: float | None = None,
    fatigue_score: float | None = None,
) -> list[dict]:
    recommendations: list[dict] = []

    stmt = select(Incident).where(Incident.operator_id == operator_id).order_by(Incident.timestamp.desc()).limit(50)
    incidents = list(db.scalars(stmt).all())

    transition_count = sum(
        1 for i in incidents if i.incident_type in (
            IncidentType.STATE_TRANSITION_RISK, IncidentType.RECOVERY_APPROACH_RISK, IncidentType.PROXIMITY_WARNING
        )
    )
    seatbelt_count = sum(1 for i in incidents if i.incident_type == IncidentType.SEATBELT_VIOLATION)
    visibility_count = sum(1 for i in incidents if i.incident_type == IncidentType.VISIBILITY_HAZARD)

    def add(title: str, reason: str, priority: str):
        resource = _resource_by_title(db, title)
        if resource:
            recommendations.append({
                "resource_id": resource.id,
                "title": resource.title,
                "reason": reason,
                "priority": priority,
            })

    if transition_count >= 2:
        add(
            TITLE_TRIGGERS["state_transition"],
            f"{transition_count} repeated state-transition/proximity alerts in recent history",
            "HIGH",
        )
    if seatbelt_count >= 1:
        add(
            TITLE_TRIGGERS["seatbelt"],
            f"{seatbelt_count} seatbelt compliance incident(s) recorded",
            "HIGH" if seatbelt_count >= 2 else "MEDIUM",
        )
    if fatigue_score is not None and fatigue_score >= 60:
        add(
            TITLE_TRIGGERS["fatigue"],
            f"Elevated fatigue score ({fatigue_score:.0f})",
            "HIGH" if fatigue_score >= 85 else "MEDIUM",
        )
    if idle_percentage is not None and idle_percentage >= 35:
        add(
            TITLE_TRIGGERS["idling"],
            f"Excessive idle percentage ({idle_percentage:.0f}%)",
            "MEDIUM",
        )
    if visibility_count >= 1:
        add(
            TITLE_TRIGGERS["visibility"],
            f"{visibility_count} visibility-hazard incident(s) recorded",
            "MEDIUM",
        )

    # Escalate priority for any resource with a low quiz score on record.
    progress_stmt = select(OperatorTrainingProgress).where(
        OperatorTrainingProgress.operator_id == operator_id,
        OperatorTrainingProgress.quiz_score.isnot(None),
        OperatorTrainingProgress.quiz_score < 60,
    )
    low_score_progress = list(db.scalars(progress_stmt).all())
    low_score_resource_ids = {p.resource_id for p in low_score_progress}
    for rec in recommendations:
        if rec["resource_id"] in low_score_resource_ids:
            rec["priority"] = "HIGH"
            rec["reason"] += "; prior quiz score below passing threshold"

    if not recommendations:
        resource = _resource_by_title(db, "Working Safely Near Autonomous Haul Trucks")
        if resource:
            recommendations.append({
                "resource_id": resource.id,
                "title": resource.title,
                "reason": "Baseline recommended safety refresher",
                "priority": "LOW",
            })

    return recommendations
