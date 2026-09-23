# SentinelTwin

**Operator Safety Assistant for Human-Autonomous Coexistence** — a decision-support Digital Twin that gives human operators visibility into autonomous haul truck state, so they know *what's changing nearby* before they act.

> Built for a Caterpillar hackathon. Backend only (FastAPI + SQLAlchemy + SQLite). No frontend code is included.

---

## The problem: the Safety-State Visibility Gap

The common (wrong) framing of this problem is "an autonomous truck might randomly move near a person." It doesn't — autonomous haul trucks behave deterministically, governed by missions, safety conditions, communication health, exclusion zones, and operating modes.

The real risk is that **a nearby human doesn't know**:

1. The truck's current operating state.
2. The safety/communication conditions influencing that state.
3. Which nearby changes could trigger a state transition.
4. Whether the truck has been *explicitly* confirmed safe to approach.

**Example:** Autonomous truck `AHT-07` has an active mission. A communication condition occurs and it transitions to `EXCEPTION` and stops. A human operator approaches for recovery. A nearby support vehicle then leaves the area, changing a relevant condition. The autonomous system reevaluates — and because its prior mission is still active, it may transition from `EXCEPTION`/`RECOVERY` back toward `NORMAL`. **The danger isn't random movement — it's the operator's lack of visibility into a pending state transition.**

SentinelTwin's flagship logic (`app/services/safety_risk_engine.py`) detects and explains exactly this scenario.

## What SentinelTwin does — and does not — do

**Does:**
- Surfaces autonomous truck state, mission, and communication health to nearby operators.
- Scores state-transition, collision-interaction, seatbelt, fatigue, and machine-failure risk with explainable, rule-based factors.
- Auto-logs audit-ready incidents when risk crosses thresholds.
- Predicts task duration and machine efficiency, detects unusual operating patterns (ML), and recommends training.
- Answers operator questions via a retrieval-augmented chatbot (local fallback, optional Gemini).
- Simulates edge/in-cab inference for critical alerts even when connectivity is degraded.

**Does not:**
- Control, override, or issue movement commands to the autonomous truck.
- Authorize approach or recovery — every safety-relevant response defers to approved site procedure.
- Replace certified safety systems, site procedures, or operator training/certification.
- Claim ML anomaly/failure signals are certainties — they are framed as "review recommended" / "predicted risk," never confirmed facts.

**Disclaimer:** SentinelTwin is a decision-support prototype. It does not replace approved site procedures, certified safety systems, or operator training. This disclaimer is echoed in relevant API responses (`disclaimer` field) and the chatbot.

## Architecture

```
                        ┌────────────────────────────┐
                        │   Future React Frontend     │  (not built here)
                        └─────────────┬────────────────┘
                                      │ REST + WebSocket
                        ┌─────────────▼────────────────┐
                        │        FastAPI app           │
                        │  app/main.py (lifespan, CORS)│
                        └─────────────┬────────────────┘
              ┌───────────────────────┼────────────────────────┐
              ▼                       ▼                        ▼
      ┌───────────────┐     ┌────────────────────┐    ┌──────────────────┐
      │   Routers      │     │      Services        │    │   ML (app/ml)     │
      │ (thin, typed)  │────▶│ safety_risk_engine   │───▶│ IsolationForest    │
      │ 20+ modules    │     │ digital_twin_service │    │ RandomForest x2    │
      └───────┬────────┘     │ fatigue/efficiency   │    │ (joblib artifacts) │
              │              │ machine_health       │    └──────────────────┘
              │              │ chatbot/gemini       │
              │              │ edge_risk_engine     │
              │              │ websocket_manager    │
              │              └─────────┬────────────┘
              ▼                        ▼
      ┌───────────────────────────────────────────┐
      │   SQLAlchemy models  →  SQLite (data/*.db) │
      └───────────────────────────────────────────┘
```

Edge simulation: `POST /api/v1/edge/evaluate-telemetry` runs the same deterministic rule checks a real in-cab gateway could run locally, then syncs results to the backend — demonstrating that critical alerts don't require a live cloud connection.

## Feature list → hackathon requirements

| Requirement | Implementation |
|---|---|
| A. Daily Task Dashboard | `routers/dashboard.py`, `routers/tasks.py` |
| B.1 Seatbelt compliance | `services/safety_risk_engine.py::evaluate_seatbelt` |
| B.2 Proximity / state-transition hazard (flagship) | `services/safety_risk_engine.py::evaluate_state_transition_risk` |
| B.3 Incident logging | `models/incident.py`, `services/incident_service.py`, `routers/incidents.py` |
| C. Operator Training Hub | `models/training.py`, `services/training_recommendation_service.py`, `routers/training.py` |
| D. Unusual Behavior Detection (IsolationForest) | `app/ml/train_anomaly_model.py`, `services/anomaly_service.py` |
| E. Task Time Estimation (RandomForestRegressor) | `app/ml/train_task_model.py`, `services/task_prediction_service.py` |
| F. Machine Efficiency Insights | `services/efficiency_service.py`, `routers/analytics.py` |
| G. Fatigue / Break Alerts | `services/fatigue_service.py`, `routers/fatigue.py`, `routers/breaks.py` |
| H. Collision Risk | `services/collision_service.py`, `routers/collision.py` |
| I. Predictive Machine Failure (rule + RandomForestClassifier) | `services/machine_health_service.py`, `app/ml/train_failure_model.py` |
| J. AI Assistant Chatbot (TF-IDF retrieval + optional Gemini) | `services/chatbot_service.py`, `services/knowledge_base_service.py`, `services/gemini_service.py` |
| J.1 Edge AI simulation | `services/edge_risk_engine.py`, `routers/edge.py` |
| Real-time | `services/websocket_manager.py`, `routers/websocket.py` |
| Demo scenarios | `services/simulation_service.py`, `routers/simulation.py` |

## Stack

Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite, scikit-learn (IsolationForest, RandomForest), pandas/numpy, joblib, pytest. Gemini (`google-generativeai`) is optional.

## Folder structure

```
SentinelTwin/
├── app/
│   ├── main.py                 # FastAPI app, lifespan, router wiring
│   ├── core/                   # config, database, logging, security
│   ├── models/                 # SQLAlchemy models (17 entities) + enums
│   ├── schemas/                # Pydantic v2 request/response schemas
│   ├── repositories/           # thin generic CRUD helpers
│   ├── services/                # all business logic (safety, fatigue, ML wrappers, chatbot...)
│   ├── ml/                      # feature engineering + training scripts + models/ (artifacts)
│   ├── utils/                   # id/time helpers
│   ├── seed/                    # training resources, KB docs, demo scenario metadata, startup seeding
│   └── routers/                  # thin FastAPI routers (20+ modules)
├── scripts/                     # generate_synthetic_data, seed_demo_data, train_models, run_demo_stream
├── tests/                        # pytest suite
├── data/{generated,models}/      # synthetic CSVs + trained model artifacts (gitignored)
├── requirements.txt, .env.example, README.md, pytest.ini
```

## Setup

### 1. Create a virtual environment

**Windows PowerShell:**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

**Mac/Linux/WSL:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Using [uv](https://github.com/astral-sh/uv) instead (Linux/WSL):**
```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### 2. Install requirements

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env      # Mac/Linux/WSL
copy .env.example .env    # Windows PowerShell
```
All defaults work out of the box with zero required edits (SQLite, no Gemini key).

### 4. Generate synthetic data (for ML training)

```bash
python scripts/generate_synthetic_data.py
```
This creates 30 operators, 20 machines, 8 autonomous trucks, and ~60-90 days of telemetry/tasks/incidents, written both to SQLite and to `data/generated/*.csv`. Pass `--reset` to drop and recreate all tables first.

> **Note:** the API itself works immediately without this step — `app/seed/seed_baseline.py` seeds a small demo dataset (3 operators/machines/trucks + tasks) automatically on first startup so you can explore `/docs` right away. Run the generator when you want the full ML-training dataset.

### 5. Train ML models

```bash
python scripts/train_models.py
```
Trains and saves `data/models/anomaly_model.joblib` (IsolationForest), `task_duration_model.joblib` (RandomForestRegressor), and `failure_model.joblib` (RandomForestClassifier). **If these artifacts are missing, the API does not crash** — every ML-backed service falls back to an explainable rule/heuristic implementation.

### 6. Run the API

```bash
uvicorn app.main:app --reload
```

### 7. Open the docs

Visit **http://localhost:8000/docs** (Swagger UI) or **http://localhost:8000/redoc**.

### 8. Run tests

```bash
pytest
```

## Optional: Gemini setup

By default, `GEMINI_API_KEY` is empty and the chatbot (`POST /api/v1/chat/query`) uses a robust local rule-based assistant over retrieved knowledge-base context — no external calls, no cost. To enable Gemini-phrased answers:

```bash
# in .env
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-1.5-flash
```

If the key is invalid or the call fails for any reason, the chatbot automatically falls back to the local assistant (`used_gemini: false` in the response) — it never breaks the endpoint.

## Demo scenarios

Six one-call scenarios exist so a frontend (or curl) can trigger a complete, realistic outcome instantly:

```bash
curl -X POST http://localhost:8000/api/v1/simulation/run-scenario/state_transition_risk
```

Valid scenario names: `normal_loading_cycle`, `seatbelt_violation`, `state_transition_risk` (the flagship AHT-07 scenario), `fatigue_break_alert`, `machine_health_risk`, `low_visibility_collision_risk`. List them via `GET /api/v1/system/demo-scenarios`.

## API endpoint summary

All routes are under `/api/v1` except `/health`. Full interactive list: `/docs`.

- **System:** `/health`, `/system/summary`, `/system/demo-scenarios`
- **Operators/Machines/Trucks:** `/operators`, `/machines`, `/autonomous-trucks` (+ `/{id}`)
- **Dashboard:** `/dashboard/operator/{operator_id}`
- **Tasks:** `/tasks`, `/tasks/operator/{id}/today`, `/tasks/{id}/predict-duration`, `/tasks/{id}/status`
- **Telemetry / Digital Twin:** `/telemetry`, `/telemetry/machine/{id}/latest`, `/digital-twin/truck/{id}`, `/digital-twin/operator/{id}/nearby-trucks`, `/digital-twin/evaluate-transition-risk`
- **Safety / Collision / Incidents:** `/safety/evaluate`, `/safety/operator/{id}/summary`, `/collision/evaluate`, `/incidents`, `/incidents/{id}`, `/incidents/{id}/acknowledge`, `/incidents/operator/{id}`
- **Edge:** `/edge/evaluate-telemetry`
- **Analytics / ML:** `/analytics/machine/{id}/efficiency`, `/analytics/operator/{id}/efficiency`, `/analytics/operator/{id}/behavior`, `/ml/anomaly/score`
- **Fatigue / Breaks:** `/fatigue/operator/{id}`, `/fatigue/evaluate`, `/breaks`, `/breaks/operator/{id}/today`
- **Machine health:** `/health/machine/{id}/risk`, `/health/predict`, `/maintenance/recommendations`
- **Training / Knowledge base:** `/training/resources`, `/training/resources/{id}`, `/training/operator/{id}/recommendations`, `/training/{id}/progress`, `/training/operator/{id}/progress`, `/knowledge-base/search`
- **Chat:** `/chat/query`
- **Simulation:** `/simulation/run-scenario/{name}`
- **WebSockets:** `/ws/operator/{id}`, `/ws/machine/{id}`, `/ws/safety-alerts`

## Example curl commands

**Operator dashboard:**
```bash
OPERATOR_ID=$(curl -s http://localhost:8000/api/v1/operators?page=1\&page_size=1 | python -c "import sys,json;print(json.load(sys.stdin)['items'][0]['id'])")
curl http://localhost:8000/api/v1/dashboard/operator/$OPERATOR_ID
```

**State-transition risk evaluation:**
```bash
TRUCK_ID=$(curl -s "http://localhost:8000/api/v1/autonomous-trucks?page=1&page_size=1" | python -c "import sys,json;print(json.load(sys.stdin)['items'][0]['id'])")
curl -X POST http://localhost:8000/api/v1/digital-twin/evaluate-transition-risk \
  -H "Content-Type: application/json" \
  -d "{\"truck_id\": \"$TRUCK_ID\", \"distance_m\": 12.0}"
```

**Edge telemetry evaluation:**
```bash
curl -X POST http://localhost:8000/api/v1/edge/evaluate-telemetry \
  -H "Content-Type: application/json" \
  -d '{"machine_id": "demo-machine", "connectivity_status": "OFFLINE", "seatbelt_status": "UNFASTENED", "engine_running": true, "machine_moving": true}'
```

**Chatbot query:**
```bash
curl -X POST http://localhost:8000/api/v1/chat/query \
  -H "Content-Type: application/json" \
  -d "{\"operator_id\": \"$OPERATOR_ID\", \"message\": \"Can I approach AHT-07?\"}"
```

**Run a demo scenario:**
```bash
curl -X POST http://localhost:8000/api/v1/simulation/run-scenario/state_transition_risk
```

## Safety disclaimer

SentinelTwin is a decision-support prototype built for a hackathon. It does not control, override, or issue commands to any autonomous vehicle. It does not replace approved site procedures, certified autonomous safety systems, or operator training and certification. All risk scores, ML predictions, and chatbot responses are decision-support signals only and require human judgment and adherence to site policy.

## Future integration notes

- **Product Link / VisionLink telemetry adapter:** replace `scripts/generate_synthetic_data.py` and the `POST /telemetry` ingestion shape with a real adapter mapping VisionLink/PLE payloads to `TelemetryIn`.
- **Real GPS / RTLS / UWB:** swap synthetic `gps_x`/`gps_y`/`truck_distance_m` for real positioning feeds; the risk engines already treat distance as an external input.
- **Certified CAT autonomy state feed:** replace `AutonomousTruck` state writes (currently manual/synthetic) with a read-only subscription to the certified autonomy system's state broadcast — SentinelTwin should remain read-only with respect to truck control.
- **PostgreSQL / TimescaleDB:** `app/core/database.py` uses a single `DATABASE_URL`; swapping to Postgres/Timescale is a connection-string change plus revisiting SQLite-specific `connect_args`.
- **Kafka / Redis:** `app/services/websocket_manager.py` exposes a narrow connect/disconnect/broadcast interface designed to be backed by a pub-sub layer later without changing router code.
- **Edge gateway deployment:** `app/services/edge_risk_engine.py` has no database or network dependency and could be extracted to run standalone on an in-cab gateway, syncing results to this backend when connectivity allows.
