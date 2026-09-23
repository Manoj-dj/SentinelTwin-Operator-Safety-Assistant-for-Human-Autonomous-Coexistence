from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.utils.ids import new_id
from app.utils.time_utils import utcnow


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("conv_"))
    operator_id: Mapped[str] = mapped_column(String, ForeignKey("operators.id"), index=True)
    machine_id: Mapped[str | None] = mapped_column(String, ForeignKey("machines.id"), nullable=True)
    truck_id: Mapped[str | None] = mapped_column(String, ForeignKey("autonomous_trucks.id"), nullable=True)

    started_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("msg_"))
    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("chat_conversations.id"), index=True)
    role: Mapped[str] = mapped_column(String, default="user")
    content: Mapped[str] = mapped_column(Text, default="")
    sources_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    used_gemini: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class KnowledgeBaseDocument(Base):
    __tablename__ = "knowledge_base_documents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: new_id("kb_"))
    title: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String, default="GENERAL")
    tags_json: Mapped[str] = mapped_column(Text, default="[]")

    created_at: Mapped[datetime] = mapped_column(default=utcnow)
