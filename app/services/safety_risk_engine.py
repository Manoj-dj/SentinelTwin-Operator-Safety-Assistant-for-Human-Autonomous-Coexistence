"""State-aware safety risk scoring engine.

This is the flagship logic of SentinelTwin: it explains *why* a nearby
autonomous truck situation is risky, using its operating state, mission,
communication health and environment conditions -- not simplistic
"bubble active/inactive" logic.

IMPORTANT: This module produces decision-support scores only. It never
issues an "approved" or "safe" verdict that overrides site procedure.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.models.enums import (
    CommunicationStatus,
    IncidentType,
    SeatbeltStatus,
    Severity,
    TruckState,
)

SAFETY_DISCLAIMER = (
    "Decision-support only. Does not replace approved site procedures, "
    "certified safety systems, or operator training."
)


def classify_risk(score: float) -> str:
    if score >= 75:
        return "CRITICAL"
    if score >= 50:
        return "HIGH"
    if score >= 25:
        return "MODERATE"
    return "LOW"


@dataclass
class RiskResult:
    risk_score: float
    risk_level: str
    contributing_factors: list[str] = field(default_factory=list)
    recommended_action: str = ""
    auto_incident_required: bool = False
    incident_type: IncidentType | None = None
    severity: Severity | None = None


def _severity_from_level(level: str) -> Severity:
    return {
        "LOW": Severity.LOW,
        "MODERATE": Severity.MODERATE,
        "HIGH": Severity.HIGH,
        "CRITICAL": Severity.CRITICAL,
    }[level]


def evaluate_state_transition_risk(
    *,
    truck_state: TruckState,
    active_mission: bool,
    communication_status: CommunicationStatus,
    distance_m: float | None,
    nearby_condition_change: bool = False,
    recovery_personnel_active: bool = False,
    safe_to_approach_confirmed: bool = False,
    visibility_score: float = 1.0,
    seatbelt_status: SeatbeltStatus | None = None,
    fatigue_score: float | None = None,
) -> RiskResult:
    """Score the risk of approaching / being near an autonomous truck.

    Additive, explainable rule engine. Each contributing rule appends a
    human-readable factor so the API response is auditable.
    """
    score = 0.0
    factors: list[str] = []

    if distance_m is not None:
        if distance_m < 8:
            score += 35
            factors.append(f"Operator is within {distance_m:.1f} m of the truck (critical proximity < 8 m)")
        elif distance_m < 15:
            score += 20
            factors.append(f"Operator is within {distance_m:.1f} m of the truck (< 15 m exclusion guidance)")
        elif distance_m < 30:
            score += 8
            factors.append(f"Operator is within {distance_m:.1f} m of the truck (approaching exclusion zone)")

    if truck_state == TruckState.TRANSITIONING:
        score += 30
        factors.append("Truck is TRANSITIONING: a relevant condition changed and mission may be reevaluated")
    elif truck_state == TruckState.RECOVERY:
        score += 15
        factors.append("Truck is in RECOVERY: personnel/equipment interaction underway")
        if nearby_condition_change:
            score += 25
            factors.append("A nearby condition changed while recovery is active — state transition risk elevated")
    elif truck_state == TruckState.EXCEPTION:
        score += 15
        factors.append("Truck is in EXCEPTION: paused due to a safety/communication/system exception")
    elif truck_state == TruckState.NORMAL:
        if distance_m is not None and distance_m < 15:
            score += 15
            factors.append("Truck is executing an active NORMAL mission and operator is close")
    elif truck_state == TruckState.STOPPED:
        if not safe_to_approach_confirmed:
            score += 20
            factors.append("Truck is STOPPED but safe-to-approach has NOT been explicitly confirmed")
        else:
            score = max(0.0, score - 10)
            factors.append("Truck is STOPPED with safe-to-approach explicitly confirmed")
    elif truck_state == TruckState.SUSPENDED:
        score = max(0.0, score - 15)
        factors.append("Truck mission is SUSPENDED/isolated by approved procedure (safest recovery state)")
    elif truck_state == TruckState.OFFLINE:
        score += 25
        factors.append("Truck telemetry is OFFLINE/unreliable — treat as unknown state, high caution")

    if active_mission and truck_state not in (TruckState.SUSPENDED,):
        score += 10
        factors.append("Truck remains assigned to an active mission")

    if recovery_personnel_active and truck_state != TruckState.RECOVERY:
        score += 5
        factors.append("Recovery personnel are marked active near this truck")

    if communication_status == CommunicationStatus.DEGRADED:
        score += 10
        factors.append("Truck communication status is DEGRADED")
    elif communication_status == CommunicationStatus.LOST:
        score += 20
        factors.append("Truck communication status is LOST")

    if visibility_score is not None and visibility_score < 0.5:
        score += 10
        factors.append(f"Poor visibility conditions (visibility score {visibility_score:.2f})")

    if seatbelt_status == SeatbeltStatus.UNFASTENED:
        score += 10
        factors.append("Operator seatbelt is UNFASTENED")

    if fatigue_score is not None and fatigue_score >= 75:
        score += 8
        factors.append(f"Operator fatigue risk is elevated (score {fatigue_score:.0f})")

    score = max(0.0, min(100.0, score))
    level = classify_risk(score)

    # Recommended action, state-aware.
    if truck_state == TruckState.OFFLINE:
        action = "Telemetry unavailable. Treat state as unknown. Do not approach; contact control room."
    elif truck_state == TruckState.SUSPENDED and safe_to_approach_confirmed and level in ("LOW", "MODERATE"):
        action = (
            "Truck is confirmed suspended/isolated and safe-to-approach is confirmed. "
            "Continue to follow standard approved recovery steps and site policy."
        )
    elif truck_state == TruckState.STOPPED and not safe_to_approach_confirmed:
        action = "Do not approach. Wait for explicit safe-to-approach confirmation via approved procedure."
    elif level in ("HIGH", "CRITICAL") or truck_state in (TruckState.RECOVERY, TruckState.TRANSITIONING):
        action = (
            "Stop approach. Maintain exclusion distance. Confirm approved suspension/isolation "
            "before recovery."
        )
    elif level == "MODERATE":
        action = "Maintain safe distance and situational awareness. Monitor for truck state changes."
    else:
        action = "No immediate action required. Continue standard awareness practices."

    incident_type: IncidentType | None = None
    if level in ("HIGH", "CRITICAL"):
        if truck_state == TruckState.RECOVERY and nearby_condition_change:
            incident_type = IncidentType.RECOVERY_APPROACH_RISK
        elif truck_state == TruckState.TRANSITIONING:
            incident_type = IncidentType.STATE_TRANSITION_RISK
        elif communication_status in (CommunicationStatus.DEGRADED, CommunicationStatus.LOST):
            incident_type = IncidentType.COMMUNICATION_DEGRADED
        else:
            incident_type = IncidentType.PROXIMITY_WARNING

    return RiskResult(
        risk_score=round(score, 1),
        risk_level=level,
        contributing_factors=factors,
        recommended_action=action,
        auto_incident_required=incident_type is not None,
        incident_type=incident_type,
        severity=_severity_from_level(level) if incident_type else None,
    )


def evaluate_seatbelt(
    *,
    seatbelt_status: SeatbeltStatus,
    engine_running: bool,
    machine_moving: bool,
    nearest_truck_state: TruckState | None = None,
    distance_to_truck_m: float | None = None,
) -> RiskResult:
    if seatbelt_status == SeatbeltStatus.FASTENED:
        return RiskResult(risk_score=0.0, risk_level="LOW", contributing_factors=[], recommended_action="No action required.")

    factors = ["Seatbelt is UNFASTENED"]
    severity = Severity.LOW
    score = 20.0

    if engine_running:
        factors.append("Engine is running while seatbelt is unfastened")
        score += 15
        severity = Severity.MODERATE

    if machine_moving:
        factors.append("Machine is in motion while seatbelt is unfastened")
        score += 30
        severity = Severity.HIGH

    critical_states = (TruckState.EXCEPTION, TruckState.RECOVERY, TruckState.TRANSITIONING)
    if (
        nearest_truck_state in critical_states
        and distance_to_truck_m is not None
        and distance_to_truck_m < 30
    ):
        factors.append(
            f"Operator is close ({distance_to_truck_m:.1f} m) to an autonomous truck in {nearest_truck_state.value}"
        )
        score += 35
        severity = Severity.CRITICAL

    score = max(0.0, min(100.0, score))
    action = {
        Severity.LOW: "Fasten seatbelt before continuing operation.",
        Severity.MODERATE: "Fasten seatbelt immediately. Do not operate machine unrestrained.",
        Severity.HIGH: "Stop machine movement. Fasten seatbelt immediately before continuing.",
        Severity.CRITICAL: (
            "Stop immediately, fasten seatbelt, and do not proceed near the autonomous truck "
            "until compliant and truck state is confirmed safe."
        ),
    }[severity]

    return RiskResult(
        risk_score=score,
        risk_level=severity.value,
        contributing_factors=factors,
        recommended_action=action,
        auto_incident_required=True,
        incident_type=IncidentType.SEATBELT_VIOLATION,
        severity=severity,
    )
