from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.machine import Machine
from app.repositories.base import count_all, get_by_id, list_all
from app.schemas.common import PaginatedResponse
from app.schemas.machine import MachineOut

router = APIRouter(prefix="/api/v1/machines", tags=["machines"])


@router.get("", response_model=PaginatedResponse[MachineOut])
def list_machines(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    offset = (page - 1) * page_size
    items = list_all(db, Machine, offset=offset, limit=page_size, order_by=Machine.machine_code)
    total = count_all(db, Machine)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{machine_id}", response_model=MachineOut)
def get_machine(machine_id: str, db: Session = Depends(get_db)):
    machine = get_by_id(db, Machine, machine_id)
    if machine is None:
        raise HTTPException(status_code=404, detail="Machine not found")
    return machine
