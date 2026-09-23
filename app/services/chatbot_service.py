"""Operator dashboard chatbot: retrieval-augmented, context-aware, with an
optional Gemini backend and a robust local rule-based fallback.

Safety rule: the assistant never authorizes approach/recovery or claims to
override site procedure. "Can I approach AHT-07?" style questions always
get a conditional, state-explaining answer.
"""
from __future__ import annotations

import json
import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.chat import ChatConversation, ChatMessage
from app.models.enums import TruckState
from app.models.truck import AutonomousTruck
from app.schemas.common import SAFETY_DISCLAIMER
from app.services import dashboard_service, digital_twin_service
from app.services.gemini_service import gemini_service
from app.services.knowledge_base_service import search_knowledge_base

APPROACH_PATTERN = re.compile(r"\bapproach\b|\bcan i (go near|get close|recover)\b", re.IGNORECASE)
NEXT_TASK_PATTERN = re.compile(r"\bnext task\b|\bwhat.*(task|job).*(today|next)\b", re.IGNORECASE)
SAFETY_ALERT_PATTERN = re.compile(r"\bwhy.*(alert|incident|warning)\b", re.IGNORECASE)
EFFICIENCY_PATTERN = re.compile(r"\befficien(cy|t)\b", re.IGNORECASE)
BREAK_PATTERN = re.compile(r"\bbreak\b|\bfatigue\b|\btired\b", re.IGNORECASE)
EXCEPTION_STATE_PATTERN = re.compile(r"\b(exception|recovery|suspended|transitioning|normal|stopped|offline)\b.*(state|mean)|\bwhat does\b", re.IGNORECASE)
TRAINING_PATTERN = re.compile(r"\btraining\b|\bcourse\b|\blearn\b", re.IGNORECASE)
FAILURE_PATTERN = re.compile(r"\bfailure\b|\bmachine health\b|\bbreak(ing)? down\b|\bmaintenance\b", re.IGNORECASE)

TRUCK_CODE_PATTERN = re.compile(r"\b([A-Za-z]{2,4}-\d{1,3})\b")


def _find_truck_by_code_or_id(db: Session, text: str, fallback_truck_id: str | None) -> AutonomousTruck | None:
    match = TRUCK_CODE_PATTERN.search(text)
    if match:
        stmt = select(AutonomousTruck).where(AutonomousTruck.truck_code == match.group(1).upper())
        truck = db.scalars(stmt).first()
        if truck:
            return truck
    if fallback_truck_id:
        return db.get(AutonomousTruck, fallback_truck_id)
    return None


def _get_or_create_conversation(db: Session, operator_id: str, machine_id: str | None, truck_id: str | None, conversation_id: str | None) -> ChatConversation:
    if conversation_id:
        conv = db.get(ChatConversation, conversation_id)
        if conv:
            return conv
    conv = ChatConversation(operator_id=operator_id, machine_id=machine_id, truck_id=truck_id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def _local_answer(db: Session, message: str, context: dict, truck: AutonomousTruck | None) -> tuple[str, list[str]]:
    """Rule-based, context-aware fallback answer. Returns (answer, warnings)."""
    warnings: list[str] = []

    if APPROACH_PATTERN.search(message):
        if truck is None:
            return (
                "I don't have current telemetry for that truck, so its status is unknown. "
                "Do not approach until you confirm status via approved procedure and radio/control room contact.",
                ["Truck telemetry unavailable"],
            )
        note = digital_twin_service.get_truck_safety_note(truck)
        if truck.state == TruckState.OFFLINE:
            answer = (
                f"{truck.truck_code} telemetry is OFFLINE, so its current status is unknown. "
                "Do not approach. Treat this conservatively and contact the control room before any action."
            )
        elif truck.safe_to_approach_confirmed and truck.state in (TruckState.SUSPENDED, TruckState.STOPPED):
            answer = (
                f"{truck.truck_code} is currently {truck.state.value} with safe-to-approach explicitly confirmed. "
                f"{note} I cannot authorize your approach -- continue to follow your site's approved recovery procedure."
            )
        else:
            answer = (
                f"{truck.truck_code} is currently {truck.state.value}. {note} "
                "Safe-to-approach has not been confirmed, so you should not approach. "
                "I cannot authorize approach or recovery -- follow your site's approved procedure."
            )
        return answer, warnings

    if NEXT_TASK_PATTERN.search(message):
        tasks = context.get("tasks_today") or []
        if not tasks:
            return "You have no tasks scheduled for today in the system yet.", warnings
        next_task = tasks[0]
        return (
            f"Your next task is '{next_task.title}' ({next_task.task_type}) in {next_task.site_zone}, "
            f"starting at {next_task.start_time.strftime('%H:%M')}, expected duration "
            f"{next_task.expected_duration_min:.0f} minutes.",
            warnings,
        )

    if SAFETY_ALERT_PATTERN.search(message):
        incidents = context.get("open_incidents") or []
        if not incidents:
            return "You have no open safety alerts currently on record.", warnings
        top = incidents[0]
        return (
            f"Your most recent open alert is a {top.incident_type.value} incident with {top.severity.value} "
            f"severity (risk score {top.risk_score:.0f}). Recommended action: {top.recommended_action}",
            warnings,
        )

    if EFFICIENCY_PATTERN.search(message):
        telemetry = context.get("latest_telemetry")
        if telemetry is None:
            return "I don't have recent telemetry to assess your efficiency yet.", warnings
        reasons = []
        if telemetry.idle_percentage and telemetry.idle_percentage > 30:
            reasons.append(f"idle time is {telemetry.idle_percentage:.0f}%")
        if telemetry.weather_condition != "CLEAR":
            reasons.append(f"{telemetry.weather_condition.lower()} conditions")
        if telemetry.site_congestion_level and telemetry.site_congestion_level > 0.5:
            reasons.append("elevated site congestion (truck queueing)")
        reason_text = ", ".join(reasons) if reasons else "no major external factors identified"
        return (
            f"Current machine efficiency is {telemetry.machine_efficiency_percentage:.0f}%. "
            f"Contributing factors: {reason_text}. Efficiency shortfalls from queueing or weather "
            "are operational factors, not necessarily a reflection of your performance.",
            warnings,
        )

    if BREAK_PATTERN.search(message):
        fatigue_result = context.get("fatigue_result")
        if fatigue_result is None:
            return "I don't have enough shift data yet to assess break timing.", warnings
        return fatigue_result.message, warnings

    if EXCEPTION_STATE_PATTERN.search(message):
        for state in TruckState:
            if state.value.lower() in message.lower():
                return f"{state.value}: {digital_twin_service.STATE_EXPLANATIONS[state]}", warnings
        return (
            "Autonomous truck states are: NORMAL, EXCEPTION, RECOVERY, TRANSITIONING, STOPPED, "
            "SUSPENDED, and OFFLINE. Ask about a specific state for details.",
            warnings,
        )

    if TRAINING_PATTERN.search(message):
        recs = context.get("training_recommendations") or []
        if not recs:
            return "No specific training is currently recommended beyond your standard curriculum.", warnings
        titles = "; ".join(f"{r['title']} ({r['priority']})" for r in recs[:3])
        return f"Recommended training based on your recent activity: {titles}.", warnings

    if FAILURE_PATTERN.search(message):
        machine = context.get("machine")
        telemetry = context.get("latest_telemetry")
        if telemetry is None or machine is None:
            return "I don't have recent machine health telemetry to assess failure risk.", warnings
        level = "elevated" if telemetry.failure_risk_score >= 50 else "low"
        return (
            f"Predicted maintenance risk for {machine.name} is currently {level} "
            f"(score {telemetry.failure_risk_score:.0f}/100). This is a predicted risk signal, not a "
            "certainty -- inspection is recommended if the score is elevated.",
            warnings,
        )

    return (
        "I can help with your tasks, safety alerts, truck states, efficiency, fatigue/breaks, "
        "training, and machine health. Could you rephrase your question with more detail?",
        warnings,
    )


def _build_context_snapshot(context: dict) -> dict:
    """A small, serializable snapshot of context (for the API response's metrics_referenced)."""
    telemetry = context.get("latest_telemetry")
    truck = context.get("truck")
    fatigue_result = context.get("fatigue_result")
    return {
        "latest_telemetry_timestamp": telemetry.timestamp.isoformat() if telemetry else None,
        "machine_efficiency_percentage": telemetry.machine_efficiency_percentage if telemetry else None,
        "failure_risk_score": telemetry.failure_risk_score if telemetry else None,
        "truck_id": truck.id if truck else None,
        "truck_state": truck.state.value if truck else None,
        "open_incidents_count": len(context.get("open_incidents") or []),
        "fatigue_score": fatigue_result.fatigue_score if fatigue_result else None,
        "tasks_today_count": len(context.get("tasks_today") or []),
    }


def handle_chat_query(
    db: Session,
    *,
    operator_id: str,
    machine_id: str | None,
    truck_id: str | None,
    message: str,
    conversation_id: str | None,
) -> dict:
    conversation = _get_or_create_conversation(db, operator_id, machine_id, truck_id, conversation_id)

    context = dashboard_service.build_operator_context(db, operator_id)
    truck = _find_truck_by_code_or_id(db, message, truck_id or (context["truck"].id if context.get("truck") else None))

    kb_results = search_knowledge_base(db, message, top_k=3)
    local_answer, warnings = _local_answer(db, message, context, truck)

    used_gemini = False
    answer = local_answer
    if gemini_service.is_configured:
        kb_context_text = "\n\n".join(f"[{r.title}] {r.content}" for r in kb_results)
        metrics_snapshot = _build_context_snapshot(context)
        prompt = (
            "You are SentinelTwin, an operator-safety decision-support assistant on a quarry site "
            "with human-operated machines working near autonomous haul trucks. "
            "You must NEVER authorize approaching or recovering an autonomous truck, and must always "
            "defer to approved site procedure and certified safety systems. "
            "Be concise and operator-friendly.\n\n"
            f"Relevant knowledge base excerpts:\n{kb_context_text}\n\n"
            f"Operator context metrics: {json.dumps(metrics_snapshot, default=str)}\n\n"
            f"Local rule-based draft answer (you may improve wording but must preserve its safety meaning): "
            f"{local_answer}\n\n"
            f"Operator question: {message}\n\nAnswer:"
        )
        gemini_answer = gemini_service.generate(prompt)
        if gemini_answer:
            answer = gemini_answer
            used_gemini = True

    if APPROACH_PATTERN.search(message) or SAFETY_ALERT_PATTERN.search(message):
        warnings.append(SAFETY_DISCLAIMER)

    sources = [{"type": "knowledge_base", "id": r.id, "title": r.title} for r in kb_results]

    user_msg = ChatMessage(conversation_id=conversation.id, role="user", content=message, used_gemini=False)
    assistant_msg = ChatMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=answer,
        sources_json=json.dumps(sources),
        used_gemini=used_gemini,
    )
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()

    return {
        "conversation_id": conversation.id,
        "answer": answer,
        "sources": sources,
        "metrics_referenced": _build_context_snapshot(context),
        "warnings": warnings,
        "used_gemini": used_gemini,
        "disclaimer": SAFETY_DISCLAIMER,
    }
