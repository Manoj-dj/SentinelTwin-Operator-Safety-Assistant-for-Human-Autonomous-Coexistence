from __future__ import annotations

from pydantic import BaseModel


class ChatQueryRequest(BaseModel):
    operator_id: str
    machine_id: str | None = None
    truck_id: str | None = None
    message: str
    conversation_id: str | None = None


class ChatSource(BaseModel):
    type: str
    id: str
    title: str


class ChatQueryResponse(BaseModel):
    conversation_id: str
    answer: str
    sources: list[ChatSource]
    metrics_referenced: dict
    warnings: list[str]
    used_gemini: bool
    disclaimer: str
