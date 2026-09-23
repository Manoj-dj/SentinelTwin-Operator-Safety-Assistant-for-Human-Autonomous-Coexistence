from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.shift import BreakRecord
from app.schemas.shift import BreakCreate, BreakOut

router = APIRouter(prefix="/api/v1/breaks", tags=["breaks"])


@router.post("", response_model=BreakOut, status_code=201)
def create_break(payload: BreakCreate, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    record = BreakRecord(
        shift_id=payload.shift_id,
        operator_id=payload.operator_id,
        start_time=now,
        end_time=now + timedelta(minutes=payload.duration_min) if payload.duration_min else None,
        duration_min=payload.duration_min,
        break_type=payload.break_type,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/operator/{operator_id}/today")
def get_breaks_today(operator_id: str, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    stmt = (
        select(BreakRecord)
        .where(BreakRecord.operator_id == operator_id, BreakRecord.start_time >= start_of_day)
        .order_by(BreakRecord.start_time.asc())
    )
    records = list(db.scalars(stmt).all())
    total_minutes = sum(r.duration_min or 0 for r in records)
    return {"operator_id": operator_id, "breaks": records, "total_break_minutes_today": total_minutes}
