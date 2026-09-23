"""Machine/operator efficiency metrics.

Deliberately avoids blaming operators for delays attributable to weather,
queueing or safety events -- those are surfaced as separate context so a
low raw efficiency number isn't misread as poor operator performance.
"""
from __future__ import annotations

from dataclasses import dataclass, field


def grade_from_percentage(pct: float) -> str:
    if pct >= 85:
        return "A"
    if pct >= 70:
        return "B"
    if pct >= 50:
        return "C"
    return "D"


@dataclass
class EfficiencyMetrics:
    productive_time_min: float
    machine_efficiency_percentage: float
    idle_percentage: float
    fuel_efficiency: float
    cycle_efficiency: float
    baseline_comparison_pct: float
    trend: str
    grade: str
    insight: str
    external_factors: list[str] = field(default_factory=list)


def compute_efficiency(
    *,
    active_engine_time_min: float,
    idling_time_min: float,
    load_cycles: int,
    planned_load_cycles: int,
    fuel_used_l: float,
    baseline_efficiency_pct: float | None = None,
    weather_impacted: bool = False,
    queue_delay_min: float = 0.0,
    safety_event_occurred: bool = False,
) -> EfficiencyMetrics:
    active = max(active_engine_time_min, 0.0001)
    productive = max(active - idling_time_min, 0.0)
    efficiency_pct = (productive / active) * 100
    idle_pct = (idling_time_min / active) * 100
    fuel_eff = (load_cycles / fuel_used_l) if fuel_used_l > 0 else 0.0
    cycle_eff = (load_cycles / planned_load_cycles * 100) if planned_load_cycles > 0 else 0.0

    baseline = baseline_efficiency_pct if baseline_efficiency_pct is not None else efficiency_pct
    baseline_diff = efficiency_pct - baseline
    if baseline_diff > 3:
        trend = "IMPROVING"
    elif baseline_diff < -3:
        trend = "DECLINING"
    else:
        trend = "STABLE"

    external_factors = []
    if weather_impacted:
        external_factors.append("weather/visibility conditions")
    if queue_delay_min > 10:
        external_factors.append(f"{queue_delay_min:.0f} min autonomous truck queue delay")
    if safety_event_occurred:
        external_factors.append("an active safety event")

    grade = grade_from_percentage(efficiency_pct)
    # Soften grading impact when external, non-operator factors dominate the shortfall.
    if external_factors and grade in ("C", "D") and efficiency_pct >= 35:
        grade = "C" if grade == "D" else grade

    if external_factors:
        insight = (
            f"Efficiency is {efficiency_pct:.0f}% ({trend.lower()}); shortfall is partly attributable to "
            f"{', '.join(external_factors)}, not solely operator performance."
        )
    elif trend == "DECLINING":
        insight = f"Efficiency has declined to {efficiency_pct:.0f}% versus baseline {baseline:.0f}%. Review cycle patterns."
    elif trend == "IMPROVING":
        insight = f"Efficiency improved to {efficiency_pct:.0f}%, above baseline {baseline:.0f}%. Good performance."
    else:
        insight = f"Efficiency is stable at {efficiency_pct:.0f}%, in line with baseline."

    return EfficiencyMetrics(
        productive_time_min=round(productive, 1),
        machine_efficiency_percentage=round(efficiency_pct, 1),
        idle_percentage=round(idle_pct, 1),
        fuel_efficiency=round(fuel_eff, 3),
        cycle_efficiency=round(cycle_eff, 1),
        baseline_comparison_pct=round(baseline_diff, 1),
        trend=trend,
        grade=grade,
        insight=insight,
        external_factors=external_factors,
    )
