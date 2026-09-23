"""Smoke tests hitting the major API surfaces to catch wiring errors."""
from __future__ import annotations


def _first_id(client, path):
    resp = client.get(path)
    assert resp.status_code == 200
    items = resp.json().get("items", [])
    return items[0]["id"] if items else None


def test_operators_and_machines_listing(client):
    assert client.get("/api/v1/operators").status_code == 200
    assert client.get("/api/v1/machines").status_code == 200
    assert client.get("/api/v1/autonomous-trucks").status_code == 200


def test_operator_dashboard(client):
    operator_id = _first_id(client, "/api/v1/operators?page=1&page_size=1")
    resp = client.get(f"/api/v1/dashboard/operator/{operator_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["operator_id"] == operator_id
    assert "disclaimer" in body


def test_digital_twin_truck_view(client):
    truck_id = _first_id(client, "/api/v1/autonomous-trucks?page=1&page_size=1")
    resp = client.get(f"/api/v1/digital-twin/truck/{truck_id}")
    assert resp.status_code == 200
    assert "safety_note" in resp.json()


def test_evaluate_transition_risk_endpoint(client):
    truck_id = _first_id(client, "/api/v1/autonomous-trucks?page=1&page_size=1")
    resp = client.post(
        "/api/v1/digital-twin/evaluate-transition-risk",
        json={"truck_id": truck_id, "distance_m": 10.0},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "risk_score" in body
    assert body["risk_level"] in ("LOW", "MODERATE", "HIGH", "CRITICAL")


def test_training_resources_endpoint(client):
    resp = client.get("/api/v1/training/resources")
    assert resp.status_code == 200
    assert len(resp.json()["items"]) >= 8


def test_knowledge_base_search(client):
    resp = client.get("/api/v1/knowledge-base/search", params={"q": "seatbelt"})
    assert resp.status_code == 200
    assert "results" in resp.json()


def test_run_all_demo_scenarios(client):
    for scenario in [
        "normal_loading_cycle",
        "seatbelt_violation",
        "state_transition_risk",
        "fatigue_break_alert",
        "machine_health_risk",
        "low_visibility_collision_risk",
    ]:
        resp = client.post(f"/api/v1/simulation/run-scenario/{scenario}")
        assert resp.status_code == 200, f"scenario {scenario} failed: {resp.text}"
        assert resp.json()["scenario_name"] == scenario


def test_anomaly_score_endpoint(client):
    resp = client.post(
        "/api/v1/ml/anomaly/score",
        json={
            "machine_id": "test-machine",
            "fuel_used_per_hour": 30.0,
            "load_cycles_per_hour": 1.0,
            "idle_minutes_per_hour": 45.0,
            "idle_percentage": 75.0,
            "engine_temperature_c": 85.0,
            "hydraulic_temperature_c": 70.0,
            "vibration_rms": 2.0,
            "harsh_braking_count": 0,
            "harsh_acceleration_count": 0,
            "seatbelt_violations_count": 0,
            "time_since_shift_started_min": 120.0,
            "operator_fatigue_score": 20.0,
            "visibility_score": 1.0,
            "distance_to_nearest_truck_m": 200.0,
            "safety_risk_score": 10.0,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["anomaly_label"] in ("NORMAL", "ANOMALY")


def test_edge_evaluate_telemetry(client):
    resp = client.post(
        "/api/v1/edge/evaluate-telemetry",
        json={
            "machine_id": "test-machine",
            "connectivity_status": "OFFLINE",
            "seatbelt_status": "UNFASTENED",
            "engine_running": True,
            "machine_moving": True,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["processed_locally"] is True
    assert any(a["alert_type"] == "SEATBELT_VIOLATION" for a in body["alerts"])
