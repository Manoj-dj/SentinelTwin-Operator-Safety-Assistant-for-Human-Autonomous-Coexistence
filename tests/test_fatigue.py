from __future__ import annotations

from app.services.fatigue_service import evaluate_fatigue


def test_low_fatigue_for_fresh_shift():
    result = evaluate_fatigue(continuous_work_hours=1.0, hours_since_last_break=0.5)
    assert result.fatigue_level == "LOW"
    assert not result.break_due


def test_high_fatigue_matches_example_scenario():
    result = evaluate_fatigue(
        continuous_work_hours=8.5,
        hours_since_last_break=3.2,
        harsh_event_count=4,
        productivity_decline_pct=18.0,
    )
    assert result.fatigue_level in ("HIGH", "CRITICAL")
    assert result.break_due
    assert result.recommended_break_minutes > 0


def test_critical_fatigue_triggers_escalation():
    result = evaluate_fatigue(
        continuous_work_hours=12.0,
        hours_since_last_break=6.0,
        harsh_event_count=10,
        productivity_decline_pct=30.0,
        is_night_shift=True,
        recent_high_risk_alerts=3,
    )
    assert result.fatigue_level == "CRITICAL"
    assert result.manager_escalation
