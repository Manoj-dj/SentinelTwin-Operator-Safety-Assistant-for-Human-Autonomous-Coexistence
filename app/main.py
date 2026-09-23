"""SentinelTwin FastAPI application entrypoint.

SentinelTwin is a decision-support Digital Twin / state-visibility layer for
human operators working near autonomous haul trucks. It does not control or
override any autonomous vehicle, and does not replace approved site
procedures, certified safety systems, or operator training.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import SessionLocal, init_db
from app.core.logging import configure_logging, get_logger
from app.routers import (
    analytics,
    breaks,
    chat,
    collision,
    dashboard,
    digital_twin,
    edge,
    fatigue,
    incidents,
    knowledge_base,
    machines,
    maintenance,
    ml,
    operators,
    safety,
    simulation,
    system,
    tasks,
    telemetry,
    training,
    trucks,
    websocket,
)
from app.seed.seed_baseline import run_all_seeds

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    init_db()
    db = SessionLocal()
    try:
        run_all_seeds(db)
    except Exception as exc:  # noqa: BLE001
        logger.error("Baseline seeding failed (API will still start): %s", exc)
    finally:
        db.close()

    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not set -- chatbot will use local rule-based fallback only")

    logger.info("Startup complete.")
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title="SentinelTwin",
    description=(
        "Operator Safety Assistant for Human-Autonomous Coexistence. "
        "Decision-support prototype only -- does not control or override autonomous vehicles, "
        "and does not replace approved site procedures, certified safety systems, or operator training."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error. This is a hackathon prototype."})


# Routers
app.include_router(system.router)
app.include_router(operators.router)
app.include_router(machines.router)
app.include_router(trucks.router)
app.include_router(dashboard.router)
app.include_router(tasks.router)
app.include_router(telemetry.router)
app.include_router(digital_twin.router)
app.include_router(safety.router)
app.include_router(collision.router)
app.include_router(incidents.router)
app.include_router(edge.router)
app.include_router(analytics.router)
app.include_router(ml.router)
app.include_router(fatigue.router)
app.include_router(breaks.router)
app.include_router(maintenance.router)
app.include_router(training.router)
app.include_router(knowledge_base.router)
app.include_router(chat.router)
app.include_router(simulation.router)
app.include_router(websocket.router)
