"""Verifies the flagship state-transition risk logic and acceptance criteria
item #10: a confirmed SUSPENDED + safe-to-approach truck must score lower
risk than an unsuspended EXCEPTION/RECOVERY truck in a comparable
situation.
"""
from __future__ import annotations

from app.models.enums import CommunicationStatus, SeatbeltStatus, TruckState
from app.services.safety_risk_engine import evaluate_state_transition_risk


def test_recovery_with_nearby_condition_change_is_high_or_critical():
    result = evaluate_state_transition_risk(
        truck_state=TruckState.RECOVERY,
        active_mission=True,
        communication_status=CommunicationStatus.DEGRADED,
        distance_m=14.0,
        nearby_condition_change=True,
        recovery_personnel_active=True,
        safe_to_approach_confirmed=False,
        visibility_score=0.9,
        seatbelt_status=SeatbeltStatus.FASTENED,
    )
    assert result.risk_level in ("HIGH", "CRITICAL")
    assert result.auto_incident_required
    assert any("recovery" in f.lower() or "condition" in f.lower() for f in result.contributing_factors)


def test_suspended_confirmed_is_lower_risk_than_recovery():
    suspended_result = evaluate_state_transition_risk(
        truck_state=TruckState.SUSPENDED,
        active_mission=False,
        communication_status=CommunicationStatus.OK,
        distance_m=14.0,
        safe_to_approach_confirmed=True,
        visibility_score=1.0,
        seatbelt_status=SeatbeltStatus.FASTENED,
    )
    recovery_result = evaluate_state_transition_risk(
        truck_state=TruckState.RECOVERY,
        active_mission=True,
        communication_status=CommunicationStatus.DEGRADED,
        distance_m=14.0,
        nearby_condition_change=True,
        recovery_personnel_active=True,
        safe_to_approach_confirmed=False,
        visibility_score=0.9,
        seatbelt_status=SeatbeltStatus.FASTENED,
    )
    assert suspended_result.risk_score < recovery_result.risk_score
    assert suspended_result.risk_level in ("LOW", "MODERATE")


def test_offline_truck_is_treated_with_high_caution():
    result = evaluate_state_transition_risk(
        truck_state=TruckState.OFFLINE,
        active_mission=True,
        communication_status=CommunicationStatus.LOST,
        distance_m=50.0,
    )
    assert result.risk_score > 25
    assert "offline" in result.recommended_action.lower() or "unknown" in result.recommended_action.lower()
