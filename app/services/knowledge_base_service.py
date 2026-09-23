"""Local retrieval over knowledge-base documents + training resources using
TF-IDF (scikit-learn). No vector database required.
"""
from __future__ import annotations

from dataclasses import dataclass

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.chat import KnowledgeBaseDocument


@dataclass
class RetrievedDocument:
    id: str
    title: str
    content: str
    category: str
    score: float


def _snippet(content: str, length: int = 240) -> str:
    return content[:length] + ("..." if len(content) > length else "")


def search_knowledge_base(db: Session, query: str, top_k: int = 3) -> list[RetrievedDocument]:
    documents = list(db.scalars(select(KnowledgeBaseDocument)).all())
    if not documents or not query.strip():
        return []

    corpus = [f"{d.title}. {d.content}" for d in documents]
    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        matrix = vectorizer.fit_transform(corpus + [query])
        similarities = cosine_similarity(matrix[-1], matrix[:-1]).flatten()
    except ValueError:
        # Empty vocabulary (e.g. query is all stopwords) -> fallback to keyword match.
        query_lower = query.lower()
        results = []
        for d in documents:
            score = 1.0 if query_lower in d.content.lower() or query_lower in d.title.lower() else 0.0
            if score:
                results.append(RetrievedDocument(d.id, d.title, d.content, d.category, score))
        return sorted(results, key=lambda r: r.score, reverse=True)[:top_k]

    ranked = sorted(zip(documents, similarities), key=lambda x: x[1], reverse=True)
    results = [
        RetrievedDocument(id=d.id, title=d.title, content=_snippet(d.content), category=d.category, score=float(s))
        for d, s in ranked[:top_k]
        if s > 0.02
    ]
    return results
