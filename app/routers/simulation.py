from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.simulation import ScenarioResult
from app.services.simulation_service import SCENARIO_NAMES, run_scenario

router = APIRouter(prefix="/api/v1/simulation", tags=["simulation"])


@router.post("/run-scenario/{scenario_name}", response_model=ScenarioResult)
def run_demo_scenario(scenario_name: str, db: Session = Depends(get_db)):
    if scenario_name not in SCENARIO_NAMES:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown scenario '{scenario_name}'. Valid options: {SCENARIO_NAMES}",
        )
    result = run_scenario(db, scenario_name)
    return ScenarioResult(**result)
