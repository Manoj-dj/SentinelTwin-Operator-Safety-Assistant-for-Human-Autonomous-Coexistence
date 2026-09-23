from __future__ import annotations

from app.models.enums import SeatbeltStatus, TruckState
from app.services.safety_risk_engine import evaluate_seatbelt


def test_seatbelt_fastened_is_no_risk():
    result = evaluate_seatbelt(
        seatbelt_status=SeatbeltStatus.FASTENED,
        engine_running=True,
        machine_moving=True,
    )
    assert result.risk_score == 0.0
    assert result.risk_level == "LOW"
    assert not result.auto_incident_required


def test_seatbelt_unfastened_engine_running_is_moderate():
    result = evaluate_seatbelt(
        seatbelt_status=SeatbeltStatus.UNFASTENED,
        engine_running=True,
        machine_moving=False,
    )
    assert result.auto_incident_required
    assert result.risk_level in ("MODERATE", "HIGH")


def test_seatbelt_unfastened_moving_near_exception_truck_is_critical():
    result = evaluate_seatbelt(
        seatbelt_status=SeatbeltStatus.UNFASTENED,
        engine_running=True,
        machine_moving=True,
        nearest_truck_state=TruckState.EXCEPTION,
        distance_to_truck_m=10.0,
    )
    assert result.risk_level == "CRITICAL"
    assert result.auto_incident_required
