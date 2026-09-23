"""Static metadata describing the 6 demo scenarios, exposed via
GET /api/v1/system/demo-scenarios so a future frontend can list them without
hard-coding names.
"""
from __future__ import annotations

DEMO_SCENARIOS = [
    {
        "name": "normal_loading_cycle",
        "title": "Normal Loading Cycle",
        "description": "Baseline healthy loading cycle with an autonomous truck operating normally at safe distance.",
        "expected_outcome": "LOW risk, no incidents.",
    },
    {
        "name": "seatbelt_violation",
        "title": "Seatbelt Violation",
        "description": "Operator seatbelt unfastened while machine moves near a truck in EXCEPTION/RECOVERY.",
        "expected_outcome": "HIGH/CRITICAL seatbelt incident auto-logged.",
    },
    {
        "name": "state_transition_risk",
        "title": "State Transition Risk (AHT-07 flagship scenario)",
        "description": "Active mission + communication condition -> EXCEPTION -> human approaches for recovery -> nearby condition changes -> pending transition toward NORMAL.",
        "expected_outcome": "HIGH/CRITICAL state-transition risk incident auto-logged.",
    },
    {
        "name": "fatigue_break_alert",
        "title": "Fatigue / Break Alert",
        "description": "Long continuous shift with no recent break and declining productivity.",
        "expected_outcome": "HIGH fatigue score with recommended break.",
    },
    {
        "name": "machine_health_risk",
        "title": "Machine Health Risk",
        "description": "Elevated engine temperature, low oil pressure, high vibration and overdue maintenance.",
        "expected_outcome": "HIGH/CRITICAL predicted maintenance risk, maintenance recommendation logged.",
    },
    {
        "name": "low_visibility_collision_risk",
        "title": "Low Visibility Collision Risk",
        "description": "Dust/rain reduces visibility while machine and truck are on a closing path in a congested zone.",
        "expected_outcome": "MODERATE/HIGH collision interaction risk.",
    },
]
