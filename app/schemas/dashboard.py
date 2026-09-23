from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class OperatorDashboard(BaseModel):
    operator_id: str
    operator_name: str
    active_shift: dict[str, Any] | None
    tasks_today: list[dict[str, Any]]
    current_machine: dict[str, Any] | None
    nearest_truck: dict[str, Any] | None
    active_safety_alerts: list[dict[str, Any]]
    fatigue: dict[str, Any] | None
    efficiency_summary: dict[str, Any] | None
    failure_risk: dict[str, Any] | None
    recommended_training: list[dict[str, Any]]
    quick_actions: list[str]
    disclaimer: str


class SystemSummary(BaseModel):
    operators: int
    machines: int
    autonomous_trucks: int
    open_incidents: int
    telemetry_records: int
    trucks_by_state: dict[str, int]
    ml_models_available: dict[str, bool]
    gemini_configured: bool
    disclaimer: str
