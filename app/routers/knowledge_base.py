from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.chat import KnowledgeBaseDocument
from app.services.knowledge_base_service import search_knowledge_base

router = APIRouter(prefix="/api/v1/knowledge-base", tags=["knowledge-base"])


@router.get("/search")
def search(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    results = search_knowledge_base(db, q, top_k=5)
    return {
        "query": q,
        "results": [
            {
                "document": {
                    "id": r.id,
                    "title": r.title,
                    "content": r.content,
                    "category": r.category,
                },
                "relevance_score": r.score,
                "snippet": r.content,
            }
            for r in results
        ],
    }
