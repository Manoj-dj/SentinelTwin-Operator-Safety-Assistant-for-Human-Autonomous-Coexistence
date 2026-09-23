"""Generic repository helpers shared by services/routers.

Kept intentionally thin: most business logic lives in the services layer.
This module just centralizes common get/list/paginate patterns so routers
and services don't duplicate SQLAlchemy query boilerplate.
"""
from __future__ import annotations

from typing import Any, Sequence, Type, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

ModelT = TypeVar("ModelT")


def get_by_id(db: Session, model: Type[ModelT], entity_id: str) -> ModelT | None:
    return db.get(model, entity_id)


def list_all(
    db: Session,
    model: Type[ModelT],
    *,
    offset: int = 0,
    limit: int = 50,
    order_by: Any | None = None,
    filters: Sequence[Any] = (),
) -> list[ModelT]:
    stmt = select(model)
    for f in filters:
        stmt = stmt.where(f)
    if order_by is not None:
        stmt = stmt.order_by(order_by)
    stmt = stmt.offset(offset).limit(limit)
    return list(db.scalars(stmt).all())


def count_all(db: Session, model: Type[ModelT], *, filters: Sequence[Any] = ()) -> int:
    from sqlalchemy import func

    stmt = select(func.count()).select_from(model)
    for f in filters:
        stmt = stmt.where(f)
    return db.scalar(stmt) or 0


def create(db: Session, instance: ModelT) -> ModelT:
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance
