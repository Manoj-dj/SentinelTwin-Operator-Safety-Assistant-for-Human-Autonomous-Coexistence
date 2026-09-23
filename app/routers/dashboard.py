from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.operator import Operator
from app.schemas.common import SAFETY_DISCLAIMER
from app.schemas.dashboard import OperatorDashboard
from app.services import dashboard_service, efficiency_service
from app.services.digital_twin_service import get_truck_safety_note
from app.services.incident_service import incident_to_dict

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/operator/{operator_id}", response_model=OperatorDashboard)
def get_operator_dashboard(operator_id: str, db: Session = Depends(get_db)):
    operator = db.get(Operator, operator_id)
    if operator is None:
        raise HTTPException(status_code=404, detail="Operator not found")

    ctx = dashboard_service.build_operator_context(db, operator_id)
    telemetry = ctx["latest_telemetry"]
    machine = ctx["machine"]
    truck = ctx["truck"]
    shift = ctx["active_shift"]

    efficiency_summary = None
    failure_risk = None
    if telemetry is not None:
        metrics = efficiency_service.compute_efficiency(
            active_engine_time_min=telemetry.active_engine_time_min or 1.0,
            idling_time_min=telemetry.idling_time_min,
            load_cycles=telemetry.load_cycles,
            planned_load_cycles=telemetry.planned_load_cycles or 1,
            fuel_used_l=telemetry.fuel_used_l,
            weather_impacted=telemetry.weather_condition != "CLEAR",
            queue_delay_min=telemetry.site_congestion_level * 30,
        )
        efficiency_summary = {
            "machine_efficiency_percentage": metrics.machine_efficiency_percentage,
            "idle_percentage": metrics.idle_percentage,
            "fuel_efficiency": metrics.fuel_efficiency,
            "grade": metrics.grade,
            "trend": metrics.trend,
            "insight": metrics.insight,
        }
        failure_risk = {
            "failure_risk_score": telemetry.failure_risk_score,
            "risk_level": "CRITICAL" if telemetry.failure_risk_score >= 75 else
                          "HIGH" if telemetry.failure_risk_score >= 50 else
                          "MODERATE" if telemetry.failure_risk_score >= 25 else "LOW",
        }

    active_alerts = [incident_to_dict(i) for i in ctx["open_incidents"]]

    quick_actions = []
    if truck is not None:
        quick_actions.append(get_truck_safety_note(truck))
    if ctx["fatigue_result"] and ctx["fatigue_result"].break_due:
        quick_actions.append(f"Take a {ctx['fatigue_result'].recommended_break_minutes}-minute break soon.")
    if active_alerts:
        quick_actions.append(f"Review {len(active_alerts)} open safety alert(s).")
    if not quick_actions:
        quick_actions.append("No immediate actions required. Continue standard operations.")

    return OperatorDashboard(
        operator_id=operator.id,
        operator_name=operator.name,
        active_shift={"id": shift.id, "start_time": shift.start_time, "shift_type": shift.shift_type} if shift else None,
        tasks_today=[
            {
                "id": t.id,
                "title": t.title,
                "task_type": t.task_type,
                "site_zone": t.site_zone,
                "start_time": t.start_time,
                "expected_duration_min": t.expected_duration_min,
                "status": t.status,
                "priority": t.priority,
            }
            for t in ctx["tasks_today"]
        ],
        current_machine={"id": machine.id, "machine_code": machine.machine_code, "name": machine.name} if machine else None,
        nearest_truck={
            "id": truck.id,
            "truck_code": truck.truck_code,
            "state": truck.state,
            "safe_to_approach_confirmed": truck.safe_to_approach_confirmed,
            "safety_note": get_truck_safety_note(truck),
        } if truck else None,
        active_safety_alerts=active_alerts,
        fatigue={
            "fatigue_score": ctx["fatigue_result"].fatigue_score,
            "fatigue_level": ctx["fatigue_result"].fatigue_level,
            "break_due": ctx["fatigue_result"].break_due,
            "message": ctx["fatigue_result"].message,
        } if ctx["fatigue_result"] else None,
        efficiency_summary=efficiency_summary,
        failure_risk=failure_risk,
        recommended_training=ctx["training_recommendations"],
        quick_actions=quick_actions,
        disclaimer=SAFETY_DISCLAIMER,
    )
