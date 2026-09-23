from __future__ import annotations

from pydantic import BaseModel

from app.models.enums import SeatbeltStatus, TruckState


class SeatbeltEvaluationRequest(BaseModel):
    machine_id: str
    operator_id: str
    seatbelt_status: SeatbeltStatus
    engine_running: bool
    machine_moving: bool
    nearest_truck_state: TruckState | None = None
    distance_to_truck_m: float | None = None


class TransitionRiskRequest(BaseModel):
    machine_id: str | None = None
    operator_id: str | None = None
    truck_id: str
    distance_m: float
    visibility_score: float = 1.0
    seatbelt_status: SeatbeltStatus = SeatbeltStatus.FASTENED
    fatigue_score: float | None = None


class SafetyEvaluationRequest(BaseModel):
    machine_id: str
    operator_id: str
    truck_id: str | None = None
    seatbelt_status: SeatbeltStatus = SeatbeltStatus.FASTENED
    engine_running: bool = True
    machine_moving: bool = False
    distance_to_truck_m: float | None = None
    visibility_score: float = 1.0
    fatigue_score: float | None = None


class RiskEvaluationResult(BaseModel):
    risk_score: float
    risk_level: str
    truck_id: str | None = None
    truck_state: str | None = None
    active_mission: bool | None = None
    nearby_condition_change: bool | None = None
    distance_m: float | None = None
    contributing_factors: list[str]
    recommended_action: str
    auto_incident_created: bool
    incident_id: str | None = None
    disclaimer: str


class CollisionEvaluationRequest(BaseModel):
    machine_id: str
    operator_id: str | None = None
    truck_id: str
    distance_m: float
    machine_speed_kmh: float = 0.0
    truck_speed_kmh: float = 0.0
    closing: bool = True
    visibility_score: float = 1.0
    site_congestion_level: float = 0.2
    blind_spot: bool = False
    fatigue_score: float | None = None
    seatbelt_status: SeatbeltStatus = SeatbeltStatus.FASTENED


class CollisionEvaluationResult(BaseModel):
    collision_risk_score: float
    severity: str
    time_to_proximity_sec: float | None = None
    factors: list[str]
    recommended_action: str
    auto_incident_created: bool
    incident_id: str | None = None
    disclaimer: str


class OperatorSafetySummary(BaseModel):
    operator_id: str
    open_incidents: int
    highest_open_severity: str | None
    recent_incident_types: list[str]
    current_risk_level: str | None
    disclaimer: str
