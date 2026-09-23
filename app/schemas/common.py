from __future__ import annotations

from typing import Generic, List, TypeVar

from pydantic import BaseModel

T = TypeVar("T")

SAFETY_DISCLAIMER = (
    "SentinelTwin is a decision-support prototype. It does not replace approved "
    "site procedures, certified autonomous safety systems, or operator training. "
    "It does not control or override any autonomous vehicle."
)


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int


class Message(BaseModel):
    detail: str
