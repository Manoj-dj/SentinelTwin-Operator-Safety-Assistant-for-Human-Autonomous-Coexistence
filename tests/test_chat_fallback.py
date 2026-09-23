"""Verifies the chatbot works with the local rule-based fallback when no
Gemini API key is configured (the default in a hackathon/test environment).
"""
from __future__ import annotations

from app.core.config import settings


def test_gemini_not_configured_by_default():
    assert not settings.GEMINI_API_KEY


def test_chat_query_uses_local_fallback(client):
    operators = client.get("/api/v1/operators?page=1&page_size=1").json()["items"]
    assert operators, "Expected at least one seeded operator"
    operator_id = operators[0]["id"]

    resp = client.post(
        "/api/v1/chat/query",
        json={"operator_id": operator_id, "message": "What is my next task?"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["used_gemini"] is False
    assert body["answer"]
    assert "disclaimer" in body


def test_chat_approach_question_never_authorizes():
    from app.core.database import SessionLocal
    from app.services.chatbot_service import handle_chat_query

    db = SessionLocal()
    try:
        from sqlalchemy import select
        from app.models.operator import Operator

        operator = db.scalars(select(Operator)).first()
        assert operator is not None

        result = handle_chat_query(
            db,
            operator_id=operator.id,
            machine_id=None,
            truck_id=None,
            message="Can I approach AHT-07?",
            conversation_id=None,
        )
        lowered = result["answer"].lower()
        assert "cannot authorize" in lowered or "do not approach" in lowered or "not approach" in lowered
    finally:
        db.close()
