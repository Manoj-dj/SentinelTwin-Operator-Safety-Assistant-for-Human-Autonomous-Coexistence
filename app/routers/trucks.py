from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.truck import AutonomousTruck
from app.repositories.base import count_all, get_by_id, list_all
from app.schemas.common import PaginatedResponse
from app.schemas.truck import AutonomousTruckOut

router = APIRouter(prefix="/api/v1/autonomous-trucks", tags=["autonomous-trucks"])


@router.get("", response_model=PaginatedResponse[AutonomousTruckOut])
def list_trucks(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    offset = (page - 1) * page_size
    items = list_all(db, AutonomousTruck, offset=offset, limit=page_size, order_by=AutonomousTruck.truck_code)
    total = count_all(db, AutonomousTruck)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{truck_id}", response_model=AutonomousTruckOut)
def get_truck(truck_id: str, db: Session = Depends(get_db)):
    truck = get_by_id(db, AutonomousTruck, truck_id)
    if truck is None:
        raise HTTPException(status_code=404, detail="Autonomous truck not found")
    return truck
