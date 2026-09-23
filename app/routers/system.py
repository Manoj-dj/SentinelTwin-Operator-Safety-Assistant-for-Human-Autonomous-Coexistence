from __future__ import annotations

import os
from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.enums import AckStatus
from app.models.incident import Incident
from app.models.machine import Machine
from app.models.operator import Operator
from app.models.telemetry import TelemetryRecord
from app.models.truck import AutonomousTruck
from app.schemas.common import SAFETY_DISCLAIMER
from app.schemas.dashboard import SystemSummary
from app.seed.demo_scenarios import DEMO_SCENARIOS

router = APIRouter(tags=["system"])


@router.get("/health")
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@router.get("/api/v1/system/summary", response_model=SystemSummary)
def system_summary(db: Session = Depends(get_db)):
    operators = db.scalar(select(func.count()).select_from(Operator)) or 0
    machines = db.scalar(select(func.count()).select_from(Machine)) or 0
    trucks_list = list(db.scalars(select(AutonomousTruck)).all())
    open_incidents = db.scalar(
        select(func.count()).select_from(Incident).where(Incident.ack_status != AckStatus.RESOLVED)
    ) or 0
    telemetry_records = db.scalar(select(func.count()).select_from(TelemetryRecord)) or 0
    trucks_by_state = dict(Counter(t.state.value for t in trucks_list))

    ml_models_available = {
        "anomaly_model": os.path.exists(os.path.join(settings.ML_MODELS_DIR, "anomaly_model.joblib")),
        "task_duration_model": os.path.exists(os.path.join(settings.ML_MODELS_DIR, "task_duration_model.joblib")),
        "failure_model": os.path.exists(os.path.join(settings.ML_MODELS_DIR, "failure_model.joblib")),
    }

    return SystemSummary(
        operators=operators,
        machines=machines,
        autonomous_trucks=len(trucks_list),
        open_incidents=open_incidents,
        telemetry_records=telemetry_records,
        trucks_by_state=trucks_by_state,
        ml_models_available=ml_models_available,
        gemini_configured=bool(settings.GEMINI_API_KEY),
        disclaimer=SAFETY_DISCLAIMER,
    )


@router.get("/api/v1/system/demo-scenarios")
def demo_scenarios():
    return {"scenarios": DEMO_SCENARIOS, "disclaimer": SAFETY_DISCLAIMER}
