"""Explainable operator fatigue-risk engine.

This is a decision-support score, NOT a medical assessment or diagnosis.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.core.config import settings


def classify_fatigue(score: float) -> str:
    if score >= 85:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 40:
        return "MODERATE"
    return "LOW"


@dataclass
class FatigueResult:
    fatigue_score: float
    fatigue_level: str
    contributing_factors: list[str] = field(default_factory=list)
    recommended_break_minutes: int = 0
    break_due: bool = False
    manager_escalation: bool = False
    message: str = ""


def evaluate_fatigue(
    *,
    continuous_work_hours: float,
    hours_since_last_break: float,
    harsh_event_count: int = 0,
    productivity_decline_pct: float = 0.0,
    is_night_shift: bool = False,
    self_reported_fatigue: float | None = None,
    recent_high_risk_alerts: int = 0,
) -> FatigueResult:
    score = 0.0
    factors: list[str] = []

    contrib = min(continuous_work_hours * 6.0, 40.0)
    score += contrib
    if continuous_work_hours >= 6:
        factors.append(f"{continuous_work_hours:.1f} continuous work hours")

    contrib = min(hours_since_last_break * 8.0, 25.0)
    score += contrib
    if hours_since_last_break >= 2:
        factors.append(f"No recorded break for {hours_since_last_break:.1f} hours")

    contrib = min(harsh_event_count * 2.0, 15.0)
    score += contrib
    if harsh_event_count > 0:
        factors.append(f"Rising harsh-operation events ({harsh_event_count} recorded)")

    decline = max(productivity_decline_pct, 0.0)
    contrib = min(decline * 0.5, 15.0)
    score += contrib
    if decline > 0:
        factors.append(f"Productivity has fallen {decline:.0f}% from shift baseline")

    if is_night_shift:
        score += 10
        factors.append("Operating during night shift hours")

    if self_reported_fatigue is not None:
        # Expect a 0-10 self-reported scale.
        contrib = min(max(self_reported_fatigue, 0.0) * 2.0, 20.0)
        score += contrib
        if self_reported_fatigue >= 5:
            factors.append(f"Operator self-reported fatigue level {self_reported_fatigue:.0f}/10")

    if recent_high_risk_alerts > 0:
        contrib = min(recent_high_risk_alerts * 3.0, 10.0)
        score += contrib
        factors.append(f"{recent_high_risk_alerts} recent high-risk safety alert(s)")

    score = max(0.0, min(100.0, score))
    level = classify_fatigue(score)

    break_minutes = {"LOW": 0, "MODERATE": 10, "HIGH": 15, "CRITICAL": 25}[level]
    break_due = hours_since_last_break >= settings.BREAK_DUE_HOURS or level in ("HIGH", "CRITICAL")
    escalate = level == "CRITICAL"

    if level == "LOW":
        message = "Fatigue risk LOW. No action required beyond standard break schedule."
    else:
        factor_text = ", ".join(factors) if factors else "multiple contributing factors"
        rec = (
            f"Take a {break_minutes}-minute approved break"
            + (" and complete a safety check-in." if level in ("HIGH", "CRITICAL") else ".")
        )
        message = f"Fatigue risk {level}: {factor_text}. Recommendation: {rec}"

    return FatigueResult(
        fatigue_score=round(score, 1),
        fatigue_level=level,
        contributing_factors=factors,
        recommended_break_minutes=break_minutes,
        break_due=break_due,
        manager_escalation=escalate,
        message=message,
    )
