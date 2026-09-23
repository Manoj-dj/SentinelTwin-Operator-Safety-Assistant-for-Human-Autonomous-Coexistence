"""Idempotent baseline seeding run at application startup.

Seeds training resources + knowledge base documents (always), and a small
set of demo operators/machines/trucks/tasks ONLY if the database is
completely empty -- so the API is immediately demoable via `uvicorn
app.main:app --reload` without requiring scripts/generate_synthetic_data.py
to be run first. The full synthetic dataset (30 operators, 20 machines,
8 trucks, 60-90 days of telemetry) is produced separately by that script
for ML training.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.chat import KnowledgeBaseDocument
from app.models.enums import CommunicationStatus, MachineStatus, MachineType, TaskPriority, TaskStatus, TruckState
from app.models.machine import Machine
from app.models.operator import Operator
from app.models.shift import Shift
from app.models.task import Task
from app.models.training import TrainingResource
from app.models.truck import AutonomousTruck
from app.seed.knowledge_base import KNOWLEDGE_BASE_DOCUMENTS
from app.seed.training_resources import TRAINING_RESOURCES

logger = get_logger(__name__)


def seed_training_resources(db: Session) -> None:
    existing_titles = {r.title for r in db.scalars(select(TrainingResource)).all()}
    added = 0
    for item in TRAINING_RESOURCES:
        if item["title"] in existing_titles:
            continue
        db.add(
            TrainingResource(
                title=item["title"],
                description=item["description"],
                category=item["category"],
                resource_type=item["resource_type"],
                url=item["url"],
                estimated_duration_min=item["estimated_duration_min"],
                skill_tags_json=json.dumps(item["skill_tags"]),
                machine_type_relevance_json=json.dumps(item["machine_type_relevance"]),
                is_required=item["is_required"],
            )
        )
        added += 1
    if added:
        db.commit()
        logger.info("Seeded %d training resources", added)


def seed_knowledge_base(db: Session) -> None:
    existing_titles = {d.title for d in db.scalars(select(KnowledgeBaseDocument)).all()}
    added = 0
    for item in KNOWLEDGE_BASE_DOCUMENTS:
        if item["title"] in existing_titles:
            continue
        db.add(
            KnowledgeBaseDocument(
                title=item["title"],
                content=item["content"],
                category=item["category"],
                tags_json=json.dumps(item["tags"]),
            )
        )
        added += 1
    if added:
        db.commit()
        logger.info("Seeded %d knowledge base documents", added)


def seed_minimal_demo_data(db: Session) -> None:
    if db.scalars(select(Operator).limit(1)).first() is not None:
        return  # Already has data (either from a prior run or the full generator).

    logger.info("No operators found -- seeding minimal demo dataset for immediate API usability")

    operators = [
        Operator(employee_code="OP-1001", name="Alex Rivera", role="Loader Operator", experience_years=6, experience_score=78),
        Operator(employee_code="OP-1002", name="Jamie Chen", role="Excavator Operator", experience_years=3, experience_score=58),
        Operator(employee_code="OP-1003", name="Sam Okafor", role="Loader Operator", experience_years=9, experience_score=90),
    ]
    db.add_all(operators)
    db.commit()
    for o in operators:
        db.refresh(o)

    machines = [
        Machine(machine_code="LDR-01", machine_type=MachineType.LOADER, name="Loader 01", site_zone="Zone B",
                status=MachineStatus.ACTIVE, assigned_operator_id=operators[0].id),
        Machine(machine_code="EXC-01", machine_type=MachineType.EXCAVATOR, name="Excavator 01", site_zone="Zone A",
                status=MachineStatus.ACTIVE, assigned_operator_id=operators[1].id),
        Machine(machine_code="LDR-02", machine_type=MachineType.LOADER, name="Loader 02", site_zone="Zone B",
                status=MachineStatus.ACTIVE, assigned_operator_id=operators[2].id),
    ]
    db.add_all(machines)
    db.commit()
    for m in machines:
        db.refresh(m)

    now = datetime.now(timezone.utc)
    trucks = [
        AutonomousTruck(
            truck_code="AHT-07", state=TruckState.RECOVERY, active_mission=True,
            mission_type="HAUL_CRUSHED_AGGREGATE", communication_status=CommunicationStatus.DEGRADED,
            safe_to_approach_confirmed=False, nearby_condition_change=True, recovery_personnel_active=True,
            gps_x=120.5, gps_y=88.2, speed_kmh=0.0, heading_deg=45.0, last_state_change_at=now - timedelta(minutes=6),
        ),
        AutonomousTruck(
            truck_code="AHT-02", state=TruckState.SUSPENDED, active_mission=False,
            mission_type=None, communication_status=CommunicationStatus.OK,
            safe_to_approach_confirmed=True, nearby_condition_change=False, recovery_personnel_active=False,
            gps_x=45.0, gps_y=210.0, speed_kmh=0.0, heading_deg=0.0, last_state_change_at=now - timedelta(hours=1),
        ),
        AutonomousTruck(
            truck_code="AHT-03", state=TruckState.NORMAL, active_mission=True,
            mission_type="HAUL_CRUSHED_AGGREGATE", communication_status=CommunicationStatus.OK,
            safe_to_approach_confirmed=False, nearby_condition_change=False, recovery_personnel_active=False,
            gps_x=300.0, gps_y=150.0, speed_kmh=22.0, heading_deg=180.0, last_state_change_at=now - timedelta(hours=2),
        ),
    ]
    db.add_all(trucks)
    db.commit()

    shifts = [Shift(operator_id=o.id, machine_id=m.id, start_time=now - timedelta(hours=2), shift_type="DAY") for o, m in zip(operators, machines)]
    db.add_all(shifts)
    db.commit()

    tasks = [
        Task(
            title="Load crushed aggregate at Zone B", task_type="LOADING", machine_id=machines[0].id,
            operator_id=operators[0].id, priority=TaskPriority.MEDIUM, site_zone="Zone B",
            start_time=now, expected_duration_min=32, status=TaskStatus.IN_PROGRESS,
            load_cycles_planned=24, weather_condition="DUST", visibility_score=0.75, queue_wait_minutes=8,
        ),
        Task(
            title="Excavate haul road shoulder at Zone A", task_type="EXCAVATION", machine_id=machines[1].id,
            operator_id=operators[1].id, priority=TaskPriority.HIGH, site_zone="Zone A",
            start_time=now + timedelta(minutes=30), expected_duration_min=45, status=TaskStatus.PENDING,
            load_cycles_planned=15, weather_condition="CLEAR", visibility_score=1.0, queue_wait_minutes=3,
        ),
        Task(
            title="Load crushed aggregate at Zone B (second pass)", task_type="LOADING", machine_id=machines[2].id,
            operator_id=operators[2].id, priority=TaskPriority.LOW, site_zone="Zone B",
            start_time=now + timedelta(hours=1), expected_duration_min=28, status=TaskStatus.PENDING,
            load_cycles_planned=20, weather_condition="CLEAR", visibility_score=1.0, queue_wait_minutes=5,
        ),
    ]
    db.add_all(tasks)
    db.commit()

    logger.info("Minimal demo dataset seeded: 3 operators, 3 machines, 3 trucks, 3 tasks, 3 shifts")


def run_all_seeds(db: Session) -> None:
    seed_training_resources(db)
    seed_knowledge_base(db)
    seed_minimal_demo_data(db)
