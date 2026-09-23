"""Collision / interaction-risk decision support.

Combines proximity, truck state/mission, communication, visibility,
congestion, blind spot, fatigue and seatbelt state into a single explainable
score. Decision support only -- never a movement command.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.models.enums import CommunicationStatus, SeatbeltStatus, TruckState
from app.services.safety_risk_engine import classify_risk, evaluate_state_transition_risk


@dataclass
class CollisionResult:
    collision_risk_score: float
    severity: str
    time_to_proximity_sec: float | None
    factors: list[str] = field(default_factory=list)
    recommended_action: str = ""
    auto_incident_required: bool = False


def evaluate_collision_risk(
    *,
    truck_state: TruckState,
    active_mission: bool,
    communication_status: CommunicationStatus,
    distance_m: float,
    machine_speed_kmh: float = 0.0,
    truck_speed_kmh: float = 0.0,
    closing: bool = True,
    visibility_score: float = 1.0,
    site_congestion_level: float = 0.2,
    blind_spot: bool = False,
    fatigue_score: float | None = None,
    seatbelt_status: SeatbeltStatus = SeatbeltStatus.FASTENED,
) -> CollisionResult:
    base = evaluate_state_transition_risk(
        truck_state=truck_state,
        active_mission=active_mission,
        communication_status=communication_status,
        distance_m=distance_m,
        visibility_score=visibility_score,
        seatbelt_status=seatbelt_status,
        fatigue_score=fatigue_score,
    )

    score = base.risk_score
    factors = list(base.contributing_factors)

    relative_speed_kmh = machine_speed_kmh + truck_speed_kmh if closing else abs(machine_speed_kmh - truck_speed_kmh)
    time_to_proximity_sec = None
    if closing and relative_speed_kmh > 0.5:
        relative_speed_mps = relative_speed_kmh / 3.6
        time_to_proximity_sec = round(distance_m / relative_speed_mps, 1)
        if time_to_proximity_sec < 10:
            score += 25
            factors.append(f"Closing speed implies proximity in ~{time_to_proximity_sec:.0f}s")
        elif time_to_proximity_sec < 30:
            score += 10
            factors.append(f"Closing speed implies proximity in ~{time_to_proximity_sec:.0f}s")

    if blind_spot:
        score += 15
        factors.append("Machine/operator is in a known blind-spot zone")

    if site_congestion_level > 0.6:
        score += 8
        factors.append(f"High site congestion level ({site_congestion_level:.2f})")

    score = max(0.0, min(100.0, score))
    severity = classify_risk(score)

    if severity in ("HIGH", "CRITICAL"):
        action = (
            "Stop machine movement. Increase separation distance immediately. "
            "Do not proceed until the interaction risk clears per site procedure."
        )
    elif severity == "MODERATE":
        action = "Reduce speed, increase awareness, and prepare to stop if distance decreases further."
    else:
        action = "No immediate action required. Maintain standard awareness."

    return CollisionResult(
        collision_risk_score=round(score, 1),
        severity=severity,
        time_to_proximity_sec=time_to_proximity_sec,
        factors=factors,
        recommended_action=action,
        auto_incident_required=severity in ("HIGH", "CRITICAL"),
    )
