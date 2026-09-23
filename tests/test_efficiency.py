from __future__ import annotations

from app.services.efficiency_service import compute_efficiency


def test_efficiency_basic_calculation():
    result = compute_efficiency(
        active_engine_time_min=100.0,
        idling_time_min=20.0,
        load_cycles=18,
        planned_load_cycles=20,
        fuel_used_l=50.0,
    )
    assert result.machine_efficiency_percentage == 80.0
    assert result.idle_percentage == 20.0
    assert result.cycle_efficiency == 90.0


def test_external_factors_softens_grade_not_hides_it():
    result = compute_efficiency(
        active_engine_time_min=100.0,
        idling_time_min=45.0,
        load_cycles=8,
        planned_load_cycles=20,
        fuel_used_l=50.0,
        weather_impacted=True,
        queue_delay_min=20.0,
    )
    assert "weather" in result.insight.lower() or "queue" in result.insight.lower()
    assert result.external_factors
