from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.task import Task
from app.models.truck import AutonomousTruck
from app.repositories.base import count_all, list_all
from app.schemas.common import PaginatedResponse
from app.schemas.task import TaskDurationPrediction, TaskOut
from app.services import dashboard_service, digital_twin_service
from app.services.task_prediction_service import predict_task_duration

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.get("", response_model=PaginatedResponse[TaskOut])
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    operator_id: str | None = None,
    machine_id: str | None = None,
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    filters = []
    if operator_id:
        filters.append(Task.operator_id == operator_id)
    if machine_id:
        filters.append(Task.machine_id == machine_id)
    items = list_all(db, Task, offset=offset, limit=page_size, order_by=Task.start_time.desc(), filters=filters)
    total = count_all(db, Task, filters=filters)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/operator/{operator_id}/today")
def get_tasks_today(operator_id: str, db: Session = Depends(get_db)):
    tasks = dashboard_service.get_tasks_today(db, operator_id)
    results = []
    for task in tasks:
        nearby = digital_twin_service.find_nearby_trucks_for_operator(db, operator_id)
        truck_info = nearby[0] if nearby else None
        summary = (
            f"{task.title}. "
            + (f"Next autonomous truck expected nearby ({truck_info['distance_m']:.0f} m). " if truck_info else "")
            + f"Expected duration: {task.expected_duration_min:.0f} minutes."
        )
        results.append({
            "task": task,
            "truck_arrival_window_min": None,
            "expected_wait_min": task.queue_wait_minutes,
            "predicted_completion_min": task.expected_duration_min + task.queue_wait_minutes,
            "delay_risk": "MEDIUM" if task.queue_wait_minutes > 10 or task.visibility_score < 0.6 else "LOW",
            "delay_reason": task.delay_reason,
            "weather_visibility_note": f"{task.weather_condition}, visibility {task.visibility_score:.2f}",
            "summary_text": summary,
        })
    return {"operator_id": operator_id, "tasks": results}


@router.post("/{task_id}/predict-duration", response_model=TaskDurationPrediction)
def predict_duration(task_id: str, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    truck_availability = 0.8
    trucks = list(db.query(AutonomousTruck).all())
    if trucks:
        available = sum(1 for t in trucks if t.state.value in ("NORMAL", "STOPPED", "SUSPENDED"))
        truck_availability = available / len(trucks)

    result = predict_task_duration(
        expected_duration_min=task.expected_duration_min,
        load_cycles_planned=task.load_cycles_planned,
        visibility_score=task.visibility_score,
        queue_wait_minutes=task.queue_wait_minutes,
        autonomous_truck_availability=truck_availability,
        weather_condition=task.weather_condition,
    )
    return TaskDurationPrediction(
        task_id=task.id,
        predicted_duration_min=result.predicted_duration_min,
        confidence_range_min=result.confidence_range_min,
        delay_risk=result.delay_risk,
        primary_reasons=result.primary_reasons,
        truck_arrival_impact_min=result.truck_arrival_impact_min,
        model_source=result.model_source,
    )


@router.get("/{task_id}/status", response_model=TaskOut)
def get_task_status(task_id: str, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
