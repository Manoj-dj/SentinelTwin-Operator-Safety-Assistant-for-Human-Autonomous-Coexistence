from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class KnowledgeBaseDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    content: str
    category: str
    tags: list[str]
    created_at: datetime


class KnowledgeBaseSearchResult(BaseModel):
    document: KnowledgeBaseDocumentOut
    relevance_score: float
    snippet: str
