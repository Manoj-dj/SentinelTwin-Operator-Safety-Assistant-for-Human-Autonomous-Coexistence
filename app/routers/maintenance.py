from __future__ import annotations

from sqlalchemy import select
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.health import MachineHealthRecord, MaintenanceRecommendation
from app.schemas.common import SAFETY_DISCLAIMER
from app.schemas.health import MachineHealthInput, MachineHealthResult, MaintenanceRecommendationOut
from app.services import machine_health_service
from app.services.dashboard_service import get_latest_telemetry

router = APIRouter(tags=["machine-health"])


@router.get("/api/v1/health/machine/{machine_id}/risk", response_model=MachineHealthResult)
def get_machine_health_risk(machine_id: str, db: Session = Depends(get_db)):
    telemetry = get_latest_telemetry(db, machine_id=machine_id)
    if telemetry is None:
        raise HTTPException(status_code=404, detail="No telemetry found for this machine")

    result = machine_health_service.evaluate_machine_health(
        engine_hours=telemetry.engine_hours,
        engine_temperature_c=telemetry.engine_temperature_c,
        oil_pressure_kpa=telemetry.oil_pressure_kpa,
        coolant_temperature_c=telemetry.coolant_temperature_c,
        hydraulic_temperature_c=telemetry.hydraulic_temperature_c,
        vibration_rms=telemetry.vibration_rms,
        fault_code_count=telemetry.fault_code_count,
    )
    return MachineHealthResult(
        machine_id=machine_id,
        failure_risk_score=result.failure_risk_score,
        risk_level=result.risk_level,
        likely_subsystem=result.likely_subsystem,
        contributing_factors=result.contributing_factors,
        recommended_action=result.recommended_action,
        maintenance_priority=result.maintenance_priority,
        model_source=result.model_source,
        disclaimer=SAFETY_DISCLAIMER,
    )


@router.post("/api/v1/health/predict", response_model=MachineHealthResult)
def predict_machine_health(payload: MachineHealthInput, db: Session = Depends(get_db)):
    result = machine_health_service.evaluate_machine_health(
        engine_hours=payload.engine_hours,
        engine_temperature_c=payload.engine_temperature_c,
        oil_pressure_kpa=payload.oil_pressure_kpa,
        coolant_temperature_c=payload.coolant_temperature_c,
        hydraulic_temperature_c=payload.hydraulic_temperature_c,
        vibration_rms=payload.vibration_rms,
        fault_code_count=payload.fault_code_count,
        fuel_consumption_change_pct=payload.fuel_consumption_change_pct,
        maintenance_overdue_days=payload.maintenance_overdue_days,
        recent_anomaly_count=payload.recent_anomaly_count,
    )

    health_record = MachineHealthRecord(
        machine_id=payload.machine_id,
        engine_hours=payload.engine_hours,
        engine_temperature_c=payload.engine_temperature_c,
        oil_pressure_kpa=payload.oil_pressure_kpa,
        coolant_temperature_c=payload.coolant_temperature_c,
        hydraulic_temperature_c=payload.hydraulic_temperature_c,
        vibration_rms=payload.vibration_rms,
        fault_code_count=payload.fault_code_count,
        fuel_consumption_change_pct=payload.fuel_consumption_change_pct,
        maintenance_overdue_days=payload.maintenance_overdue_days,
        recent_anomaly_count=payload.recent_anomaly_count,
        failure_risk_score=result.failure_risk_score,
        risk_level=result.risk_level,
        likely_subsystem=result.likely_subsystem,
    )
    db.add(health_record)
    db.commit()
    db.refresh(health_record)

    if result.risk_level in ("HIGH", "CRITICAL"):
        db.add(
            MaintenanceRecommendation(
                machine_id=payload.machine_id,
                health_record_id=health_record.id,
                priority=result.maintenance_priority,
                subsystem=result.likely_subsystem,
                recommendation=result.recommended_action,
            )
        )
        db.commit()

    return MachineHealthResult(
        machine_id=payload.machine_id,
        failure_risk_score=result.failure_risk_score,
        risk_level=result.risk_level,
        likely_subsystem=result.likely_subsystem,
        contributing_factors=result.contributing_factors,
        recommended_action=result.recommended_action,
        maintenance_priority=result.maintenance_priority,
        model_source=result.model_source,
        disclaimer=SAFETY_DISCLAIMER,
    )


@router.get("/api/v1/maintenance/recommendations")
def list_maintenance_recommendations(machine_id: str | None = None, db: Session = Depends(get_db)):
    stmt = select(MaintenanceRecommendation).order_by(MaintenanceRecommendation.created_at.desc())
    if machine_id:
        stmt = stmt.where(MaintenanceRecommendation.machine_id == machine_id)
    items = list(db.scalars(stmt.limit(100)).all())
    return {"items": items, "disclaimer": SAFETY_DISCLAIMER}
