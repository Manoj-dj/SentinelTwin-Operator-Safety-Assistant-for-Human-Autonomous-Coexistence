"""Push a stream of simulated telemetry/state events into the running
SentinelTwin API so a frontend (or the WebSocket endpoints) has something
live to display during a demo.

This talks to the HTTP API (POST /api/v1/telemetry) rather than writing to
the database directly, so make sure `uvicorn app.main:app` is already
running before starting this script.

Usage:
    python scripts/run_demo_stream.py --base-url http://localhost:8000 --interval 3
"""
from __future__ import annotations

import argparse
import random
import time

import requests

WEATHER_CHOICES = ["CLEAR", "CLEAR", "RAIN", "DUST", "NIGHT"]


def _fetch_first(base_url: str, path: str, key: str):
    resp = requests.get(f"{base_url}{path}", timeout=5)
    resp.raise_for_status()
    items = resp.json().get("items", [])
    return items[0][key] if items else None


def main(base_url: str, interval: float, iterations: int):
    operator_id = _fetch_first(base_url, "/api/v1/operators?page=1&page_size=1", "id")
    machine_id = _fetch_first(base_url, "/api/v1/machines?page=1&page_size=1", "id")
    truck_id = _fetch_first(base_url, "/api/v1/autonomous-trucks?page=1&page_size=1", "id")

    if not machine_id:
        print("No machines found. Run scripts/seed_demo_data.py or scripts/generate_synthetic_data.py first.")
        return

    rng = random.Random(7)
    print(f"Streaming demo telemetry for machine={machine_id} operator={operator_id} truck={truck_id}")

    for i in range(iterations):
        payload = {
            "operator_id": operator_id,
            "machine_id": machine_id,
            "machine_type": "LOADER",
            "engine_hours": 5000 + i,
            "engine_running": True,
            "machine_speed_kmh": rng.uniform(0, 15),
            "fuel_used_l": rng.uniform(5, 20),
            "fuel_rate_lph": rng.uniform(8, 18),
            "load_cycles": rng.randint(0, 3),
            "planned_load_cycles": 20,
            "idling_time_min": rng.uniform(0, 10),
            "active_engine_time_min": 15,
            "seatbelt_status": rng.choice(["FASTENED", "FASTENED", "FASTENED", "UNFASTENED"]),
            "engine_temperature_c": rng.uniform(78, 100),
            "coolant_temperature_c": rng.uniform(75, 92),
            "oil_pressure_kpa": rng.uniform(230, 320),
            "hydraulic_temperature_c": rng.uniform(60, 85),
            "vibration_rms": rng.uniform(1, 6),
            "fault_code_count": rng.choice([0, 0, 1]),
            "harsh_braking_count": rng.choice([0, 0, 1]),
            "harsh_acceleration_count": rng.choice([0, 0, 1]),
            "gps_x": rng.uniform(0, 500),
            "gps_y": rng.uniform(0, 500),
            "weather_condition": rng.choice(WEATHER_CHOICES),
            "visibility_score": rng.uniform(0.5, 1.0),
            "site_congestion_level": rng.uniform(0.1, 0.7),
            "time_since_shift_start_min": i * (interval / 60.0) * 60,
            "break_minutes_today": rng.uniform(0, 20),
            "nearest_truck_id": truck_id,
            "truck_distance_m": rng.uniform(10, 300),
            "truck_state": rng.choice(["NORMAL", "NORMAL", "STOPPED", "RECOVERY"]),
            "active_mission": True,
            "communication_status": rng.choice(["OK", "OK", "DEGRADED"]),
            "safe_to_approach_confirmed": rng.random() < 0.3,
            "nearby_condition_change": rng.random() < 0.15,
        }
        try:
            resp = requests.post(f"{base_url}/api/v1/telemetry", json=payload, timeout=5)
            resp.raise_for_status()
            data = resp.json()
            print(
                f"[{i+1}/{iterations}] risk={data.get('state_transition_risk_score')} "
                f"anomaly={data.get('anomaly_label')} alert={data.get('safety_alert_triggered')}"
            )
        except requests.RequestException as exc:
            print(f"Request failed: {exc}")
        time.sleep(interval)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stream simulated telemetry into a running SentinelTwin API")
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--interval", type=float, default=3.0, help="Seconds between events")
    parser.add_argument("--iterations", type=int, default=20)
    args = parser.parse_args()
    main(args.base_url, args.interval, args.iterations)
