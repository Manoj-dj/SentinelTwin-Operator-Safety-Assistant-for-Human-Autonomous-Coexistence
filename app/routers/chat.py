from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.chat import ChatQueryRequest, ChatQueryResponse
from app.services.chatbot_service import handle_chat_query

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


@router.post("/query", response_model=ChatQueryResponse)
def chat_query(payload: ChatQueryRequest, db: Session = Depends(get_db)):
    result = handle_chat_query(
        db,
        operator_id=payload.operator_id,
        machine_id=payload.machine_id,
        truck_id=payload.truck_id,
        message=payload.message,
        conversation_id=payload.conversation_id,
    )
    return ChatQueryResponse(**result)
