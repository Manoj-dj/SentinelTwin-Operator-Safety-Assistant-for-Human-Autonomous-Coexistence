from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.training import OperatorTrainingProgress, TrainingResource
from app.schemas.training import (
    TrainingProgressOut,
    TrainingProgressUpdate,
    TrainingRecommendation,
    TrainingResourceOut,
)
from app.services import dashboard_service
from app.services.training_recommendation_service import recommend_training_for_operator

router = APIRouter(tags=["training"])


def _resource_to_out(resource: TrainingResource) -> TrainingResourceOut:
    return TrainingResourceOut(
        id=resource.id,
        title=resource.title,
        description=resource.description,
        category=resource.category,
        resource_type=resource.resource_type,
        url=resource.url,
        estimated_duration_min=resource.estimated_duration_min,
        skill_tags=json.loads(resource.skill_tags_json or "[]"),
        machine_type_relevance=json.loads(resource.machine_type_relevance_json or "[]"),
        is_required=resource.is_required,
        created_at=resource.created_at,
    )


@router.get("/api/v1/training/resources")
def list_training_resources(category: str | None = None, db: Session = Depends(get_db)):
    stmt = select(TrainingResource)
    if category:
        stmt = stmt.where(TrainingResource.category == category)
    resources = list(db.scalars(stmt).all())
    return {"items": [_resource_to_out(r) for r in resources]}


@router.get("/api/v1/training/resources/{resource_id}", response_model=TrainingResourceOut)
def get_training_resource(resource_id: str, db: Session = Depends(get_db)):
    resource = db.get(TrainingResource, resource_id)
    if resource is None:
        raise HTTPException(status_code=404, detail="Training resource not found")
    return _resource_to_out(resource)


@router.get("/api/v1/training/operator/{operator_id}/recommendations")
def get_training_recommendations(operator_id: str, db: Session = Depends(get_db)):
    ctx = dashboard_service.build_operator_context(db, operator_id)
    fatigue_score = ctx["fatigue_result"].fatigue_score if ctx["fatigue_result"] else None
    idle_pct = ctx["latest_telemetry"].idle_percentage if ctx["latest_telemetry"] else None
    recs = recommend_training_for_operator(db, operator_id, idle_percentage=idle_pct, fatigue_score=fatigue_score)

    results = []
    for rec in recs:
        resource = db.get(TrainingResource, rec["resource_id"])
        if resource is None:
            continue
        results.append(TrainingRecommendation(resource=_resource_to_out(resource), reason=rec["reason"], priority=rec["priority"]))
    return {"operator_id": operator_id, "recommendations": results}


@router.post("/api/v1/training/{resource_id}/progress", response_model=TrainingProgressOut)
def update_training_progress(resource_id: str, payload: TrainingProgressUpdate, db: Session = Depends(get_db)):
    resource = db.get(TrainingResource, resource_id)
    if resource is None:
        raise HTTPException(status_code=404, detail="Training resource not found")

    stmt = select(OperatorTrainingProgress).where(
        OperatorTrainingProgress.operator_id == payload.operator_id,
        OperatorTrainingProgress.resource_id == resource_id,
    )
    progress = db.scalars(stmt).first()
    if progress is None:
        progress = OperatorTrainingProgress(operator_id=payload.operator_id, resource_id=resource_id)
        db.add(progress)

    progress.status = payload.status
    if payload.quiz_score is not None:
        progress.quiz_score = payload.quiz_score
        progress.priority = "HIGH" if payload.quiz_score < 60 else "NORMAL"
    if payload.status == "COMPLETED":
        progress.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(progress)
    return progress


@router.get("/api/v1/training/operator/{operator_id}/progress")
def get_training_progress(operator_id: str, db: Session = Depends(get_db)):
    stmt = select(OperatorTrainingProgress).where(OperatorTrainingProgress.operator_id == operator_id)
    items = list(db.scalars(stmt).all())
    return {"operator_id": operator_id, "progress": items}
