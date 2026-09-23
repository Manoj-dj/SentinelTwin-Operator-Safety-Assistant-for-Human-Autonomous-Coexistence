from __future__ import annotations


def test_health_check(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"


def test_system_summary(client):
    resp = client.get("/api/v1/system/summary")
    assert resp.status_code == 200
    body = resp.json()
    assert "operators" in body
    assert "disclaimer" in body


def test_demo_scenarios_listed(client):
    resp = client.get("/api/v1/system/demo-scenarios")
    assert resp.status_code == 200
    names = [s["name"] for s in resp.json()["scenarios"]]
    assert "state_transition_risk" in names
    assert len(names) == 6
