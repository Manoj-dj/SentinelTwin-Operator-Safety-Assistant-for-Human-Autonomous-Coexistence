from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.operator import Operator
from app.repositories.base import count_all, get_by_id, list_all
from app.schemas.common import PaginatedResponse
from app.schemas.operator import OperatorOut

router = APIRouter(prefix="/api/v1/operators", tags=["operators"])


@router.get("", response_model=PaginatedResponse[OperatorOut])
def list_operators(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    offset = (page - 1) * page_size
    items = list_all(db, Operator, offset=offset, limit=page_size, order_by=Operator.name)
    total = count_all(db, Operator)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{operator_id}", response_model=OperatorOut)
def get_operator(operator_id: str, db: Session = Depends(get_db)):
    operator = get_by_id(db, Operator, operator_id)
    if operator is None:
        raise HTTPException(status_code=404, detail="Operator not found")
    return operator
