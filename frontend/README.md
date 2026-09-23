# SentinelTwin Frontend

React + TypeScript operator dashboard for the SentinelTwin FastAPI backend — the Digital Twin / safety-state visibility layer for human operators working near autonomous haul trucks. This app is a pure client: every number it shows comes from the real backend contracts in `../app/routers/*.py` and `../app/schemas/*.py`, read directly from source rather than guessed.

## What this is / is not

- **Is:** a read/write client against the real SentinelTwin API — dashboards, live safety state, tasks, incidents, training, machine health, analytics, and an operator Copilot chat.
- **Is not:** a control surface for the autonomous truck. No button here moves, stops, or authorizes an autonomous vehicle. Every safety-relevant screen carries the disclaimer: *"Decision-support prototype. Follow approved site procedures and certified CAT safety systems."*

## Architecture

```
src/
├── api/            Axios client + typed request/response modules, one per backend domain, plus websocket.ts
├── contexts/        AppStateContext (selected operator/machine/truck, UI prefs), ToastContext
├── hooks/           React Query hooks per domain + useWebSocketChannel/useSafetyAlerts
├── lib/             utils, constants (design tokens/route map), queryKeys, geometry, safetyAlerts logic
├── components/      layout, ui, safety, dashboard, tasks, analytics, incidents, training, health, copilot, demo
├── pages/           one file per route
├── routes/          React Router config (lazy-loaded pages)
└── styles/          Tailwind + CSS custom properties (design tokens, light/dark)
```

State model:
- **Server state** (everything from the API) lives in React Query, with query keys centralized in `lib/queryKeys.ts` and per-domain stale times (live safety ~10-15s + WebSocket push, dashboard ~20-30s, training ~5min, historical analytics ~60s).
- **Client UI state** (selected operator/machine/truck, sidebar/copilot open, sound alert preference) lives in `AppStateContext` and persists to `localStorage` — never anything sensitive.

## Setup

### 1. Start the backend first

From the repository root (`SentinelTwin/`), in a separate terminal:

```bash
# if not already done: pip install -r requirements.txt, generate data, train models -- see root README.md
uvicorn app.main:app --reload
```

Confirm it's up at `http://localhost:8000/docs`.

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | REST base URL |
| `VITE_WS_BASE_URL` | `ws://localhost:8000` | WebSocket base URL |
| `VITE_ENABLE_DEMO_FALLBACK` | `false` | Reserved flag surfaced in Settings; the app does not use mock data for any endpoint that exists on the backend regardless of this flag |

No API keys belong here. Gemini is called only by the FastAPI backend (`app/services/gemini_service.py`); the frontend only ever talks to `/api/v1/chat/query`.

### 4. Run the dev server

```bash
npm run dev
```

Open `http://localhost:5173`.

### 5. Build / lint / test

```bash
npm run build   # tsc -b && vite build -- strict TypeScript, must be clean
npm run lint
npm run test    # vitest run
```

## API integration

Every endpoint the UI calls was read directly from the backend source before the corresponding `src/api/*.ts` module was written — see the type definitions in `src/api/types.ts`, which mirror the Pydantic schemas field-for-field (snake_case preserved on purpose, matched consistently rather than mixed with camelCase view models). Notable contract quirks handled explicitly:

- `GET /api/v1/incidents`, `GET /api/v1/tasks/operator/{id}/today`, and `GET /api/v1/training/resources` return hand-built dicts rather than their typed Pydantic model — the frontend types match those literal shapes, not the nearest-sounding schema.
- The backend has **no endpoint to fetch prior chat history** — only `POST /api/v1/chat/query`, which accepts an optional `conversation_id` for server-side context continuity. `useChatThread` keeps the visible thread in local component state and threads `conversation_id` through follow-up calls.
- `POST /api/v1/digital-twin/evaluate-transition-risk` and `POST /api/v1/collision/evaluate` **create incidents as a side effect** on HIGH/CRITICAL results. The UI never calls these automatically/on a timer — only on an explicit "Evaluate transition risk" click — to avoid spamming the incident log.
- The backend does not expose a historical time-series endpoint for efficiency, fatigue, or anomaly scores — only current snapshots (plus a `baseline_comparison_pct` delta for efficiency). Rather than fabricate a fake 30-day trend line, the Analytics screen shows real current values, a real current-vs-baseline comparison, and trend direction/labels the backend actually computes.

## WebSocket details

The backend exposes three routes (`app/routers/websocket.py`): `/ws/operator/{operator_id}`, `/ws/machine/{machine_id}`, `/ws/safety-alerts`. The server only ever pushes JSON when a telemetry POST or a simulation run triggers a broadcast — it does not echo client messages and implements no ping/pong protocol.

`src/api/websocket.ts` (`ChannelSocket`) implements reconnect with exponential backoff (1s → 30s cap), a client-side heartbeat frame (harmlessly ignored by the server, keeps proxies from closing idle connections), and clean teardown on unmount. `useSafetyAlerts` (mounted once in `AppShell`) is the single global subscription to `/ws/safety-alerts`: LOW/MODERATE-derived alerts become a toast, HIGH/CRITICAL become the persistent `SafetyBanner`, and either kind invalidates the relevant React Query caches so screens refetch instead of going stale. There is no polling fallback needed beyond React Query's own `refetchInterval` on the affected queries, which continues to work even if the socket is down.

## Routes

| Path | Screen |
|---|---|
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Command-center dashboard |
| `/live-safety` | Digital Twin / state-transition flagship screen |
| `/tasks` | Daily task board + queue context |
| `/analytics` | Efficiency / behavior / fatigue / machine-health tabs |
| `/incidents` | Incident log + audit detail |
| `/training` | Training hub + learning path |
| `/machine-health` | Predicted maintenance risk |
| `/chat` | Full Operator Copilot page |
| `/settings` | Connection info, default selections, demo scenarios |

## Demo scenarios

`Settings` → **Demo scenarios** calls the real `POST /api/v1/simulation/run-scenario/{name}` endpoint for all six backend scenarios (`normal_loading_cycle`, `seatbelt_violation`, `state_transition_risk`, `fatigue_break_alert`, `machine_health_risk`, `low_visibility_collision_risk`). Results shown are exactly what the backend returned — the small "Demo Mode" badge (bottom-left, on desktop) exists so a reviewer knows these are simulated runs against real backend logic, not fabricated frontend data.

## Troubleshooting

**"Backend unavailable" banner / network errors everywhere:** the FastAPI server isn't running or CORS is blocking the request. Start it with `uvicorn app.main:app --reload` from the repo root. The backend's default `CORS_ORIGINS` (`app/core/config.py`) already includes `http://localhost:5173`, so no backend change should be needed for local dev on the default Vite port.

**Dashboard/Live Safety show empty states even though the backend is up:** the database may have no operators/machines/trucks yet. Run `python scripts/seed_demo_data.py` (minimal dataset) or `python scripts/generate_synthetic_data.py` (full dataset) from the repo root, or just open `Settings` and run a demo scenario.

**WebSocket badge stuck on "CONNECTING"/"DEGRADED":** confirm `VITE_WS_BASE_URL` matches the backend's actual host/port and that nothing (a corporate proxy, an ad blocker) is blocking `ws://` connections.

## Design system notes

The visual language (Caterpillar-yellow accent, deep charcoal, high-contrast status colors, rounded industrial cards) is **original and only brand-inspired** — it does not use Caterpillar's logo, trademarked iconography, or page layouts. The SentinelTwin logo mark (`src/components/layout/Logo.tsx`) is an original inline SVG: an abstract shield silhouette with two overlapping hexagonal "signal" nodes representing the human-operator / autonomous-truck twin-state relationship. All status is communicated with color **plus** an icon and text label (never color alone), targeting WCAG AA contrast, and the layout is responsive from 1280px desktop down through tablet and mobile breakpoints.
