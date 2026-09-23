"""Generate a full synthetic SentinelTwin dataset: operators, machines,
autonomous trucks, 60-90 days of telemetry, tasks, shifts/breaks, incidents,
and machine health signals.

Writes to the SQLite database AND to CSV files under data/generated/ so the
ML training scripts (scripts/train_models.py) have flat feature tables to
train on.

Usage:
    python scripts/generate_synthetic_data.py [--reset]

--reset drops and recreates all tables before generating (useful when
re-running after schema changes). Without --reset, existing rows are left
in place and new synthetic rows are appended.
"""
from __future__ import annotations

import argparse
import json
import os
import random
import sys
from datetime import datetime, timedelta, timezone

# Allow running as `python scripts/generate_synthetic_data.py` from repo root.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.database import Base, SessionLocal, engine, init_db  # noqa: E402
from app.core.logging import get_logger  # noqa: E402
from app.models.enums import (  # noqa: E402
    CommunicationStatus,
    MachineStatus,
    MachineType,
    TaskPriority,
    TaskStatus,
    TruckState,
)
from app.models.health import MachineHealthRecord  # noqa: E402
from app.models.machine import Machine  # noqa: E402
from app.models.operator import Operator  # noqa: E402
from app.models.shift import BreakRecord, Shift  # noqa: E402
from app.models.task import Task  # noqa: E402
from app.models.telemetry import TelemetryRecord  # noqa: E402
from app.models.truck import AutonomousTruck  # noqa: E402
from app.services import efficiency_service, fatigue_service, machine_health_service, safety_risk_engine  # noqa: E402
from app.services.incident_service import create_incident  # noqa: E402

logger = get_logger(__name__)

FIRST_NAMES = ["Alex", "Jamie", "Sam", "Taylor", "Jordan", "Casey", "Morgan", "Riley", "Drew", "Quinn",
               "Avery", "Cameron", "Reese", "Skyler", "Rowan", "Dakota", "Emerson", "Harley", "Peyton", "Finley",
               "Blake", "Charlie", "Elliot", "Hayden", "Jules", "Kendall", "Logan", "Marley", "Nico", "Sage"]
LAST_NAMES = ["Rivera", "Chen", "Okafor", "Nguyen", "Smith", "Garcia", "Patel", "Kowalski", "Silva", "Johansson",
              "Kim", "Brown", "Dubois", "Novak", "Haddad", "Fischer", "Ivanov", "Costa", "Andersen", "Yamamoto",
              "Osei", "Fontaine", "Ramirez", "Schulz", "Larsen", "Petrov", "Diallo", "Moretti", "Sato", "Wallace"]

MACHINE_TYPES = [MachineType.LOADER, MachineType.EXCAVATOR, MachineType.DOZER, MachineType.GRADER]
ZONES = ["Zone A", "Zone B", "Zone C", "Zone D"]
WEATHER_CHOICES = ["CLEAR", "CLEAR", "CLEAR", "RAIN", "DUST", "FOG", "NIGHT"]


def _rng(seed: int) -> random.Random:
    return random.Random(seed)


def generate_operators(db, rng: random.Random, count: int) -> list[Operator]:
    operators = []
    for i in range(count):
        name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
        exp_years = round(rng.uniform(0.5, 15), 1)
        exp_score = min(95, 30 + exp_years * 5 + rng.uniform(-10, 10))
        op = Operator(
            employee_code=f"OP-{2000 + i}",
            name=name,
            role=rng.choice(["Loader Operator", "Excavator Operator", "Dozer Operator", "Grader Operator"]),
            experience_years=exp_years,
            experience_score=round(max(10, min(99, exp_score)), 1),
            certification_level=rng.choice(["STANDARD", "ADVANCED", "SENIOR"]),
        )
        db.add(op)
        operators.append(op)
    db.commit()
    for o in operators:
        db.refresh(o)
    logger.info("Generated %d operators", len(operators))
    return operators


def generate_machines(db, rng: random.Random, count: int, operators: list[Operator]) -> list[Machine]:
    machines = []
    for i in range(count):
        mtype = rng.choice(MACHINE_TYPES)
        machine = Machine(
            machine_code=f"{mtype.value[:3]}-{100 + i}",
            machine_type=mtype,
            name=f"{mtype.value.title()} {100 + i}",
            site_zone=rng.choice(ZONES),
            status=MachineStatus.ACTIVE,
            assigned_operator_id=rng.choice(operators).id if operators else None,
        )
        db.add(machine)
        machines.append(machine)
    db.commit()
    for m in machines:
        db.refresh(m)
    logger.info("Generated %d machines", len(machines))
    return machines


def generate_trucks(db, rng: random.Random, count: int) -> list[AutonomousTruck]:
    trucks = []
    now = datetime.now(timezone.utc)
    state_weights = [
        (TruckState.NORMAL, 0.55),
        (TruckState.STOPPED, 0.12),
        (TruckState.SUSPENDED, 0.1),
        (TruckState.EXCEPTION, 0.08),
        (TruckState.TRANSITIONING, 0.05),
        (TruckState.RECOVERY, 0.05),
        (TruckState.OFFLINE, 0.05),
    ]
    for i in range(count):
        state = rng.choices([s for s, _ in state_weights], weights=[w for _, w in state_weights])[0]
        active_mission = state not in (TruckState.SUSPENDED,) and rng.random() > 0.1
        comm = rng.choices(
            [CommunicationStatus.OK, CommunicationStatus.DEGRADED, CommunicationStatus.LOST],
            weights=[0.8, 0.15, 0.05],
        )[0]
        safe_confirmed = state in (TruckState.STOPPED, TruckState.SUSPENDED) and rng.random() > 0.4
        truck = AutonomousTruck(
            truck_code=f"AHT-{i + 1:02d}",
            state=state,
            active_mission=active_mission,
            mission_type="HAUL_CRUSHED_AGGREGATE" if active_mission else None,
            communication_status=comm,
            safe_to_approach_confirmed=safe_confirmed,
            nearby_condition_change=rng.random() < 0.1,
            recovery_personnel_active=state == TruckState.RECOVERY,
            gps_x=rng.uniform(0, 500),
            gps_y=rng.uniform(0, 500),
            speed_kmh=0.0 if state in (TruckState.STOPPED, TruckState.SUSPENDED, TruckState.EXCEPTION) else rng.uniform(5, 30),
            heading_deg=rng.uniform(0, 360),
            last_state_change_at=now - timedelta(minutes=rng.uniform(1, 240)),
        )
        db.add(truck)
        trucks.append(truck)
    db.commit()
    for t in trucks:
        db.refresh(t)
    logger.info("Generated %d autonomous trucks", len(trucks))
    return trucks


def generate_shifts_and_breaks(db, rng: random.Random, operators, machines, days: int):
    shifts_by_day: dict[int, list[Shift]] = {}
    now = datetime.now(timezone.utc)
    for day_offset in range(days):
        day_start = now - timedelta(days=days - day_offset)
        day_shifts = []
        for operator in operators:
            if rng.random() < 0.15:
                continue  # operator off that day
            machine = rng.choice(machines)
            shift_type = rng.choices(["DAY", "NIGHT"], weights=[0.75, 0.25])[0]
            start_hour = 6 if shift_type == "DAY" else 18
            start_time = day_start.replace(hour=start_hour, minute=0, second=0, microsecond=0)
            duration_hours = rng.uniform(8, 11)
            shift = Shift(
                operator_id=operator.id,
                machine_id=machine.id,
                start_time=start_time,
                end_time=start_time + timedelta(hours=duration_hours),
                shift_type=shift_type,
            )
            db.add(shift)
            day_shifts.append((shift, machine, shift_type, duration_hours))
        shifts_by_day[day_offset] = day_shifts
    db.commit()

    # Breaks: most shifts get 1-2 short breaks; a minority get none (fatigue risk episodes).
    for day_offset, day_shifts in shifts_by_day.items():
        for shift, _machine, _stype, duration_hours in day_shifts:
            db.refresh(shift)
            if rng.random() < 0.12:
                continue  # no break taken -> fatigue risk episode
            num_breaks = rng.choice([1, 1, 2])
            for _ in range(num_breaks):
                offset_hours = rng.uniform(1.5, max(2, duration_hours - 1))
                break_start = shift.start_time + timedelta(hours=offset_hours)
                duration_min = rng.choice([10, 15, 20, 30])
                db.add(
                    BreakRecord(
                        shift_id=shift.id,
                        operator_id=shift.operator_id,
                        start_time=break_start,
                        end_time=break_start + timedelta(minutes=duration_min),
                        duration_min=duration_min,
                        break_type=rng.choice(["SHORT_BREAK", "MEAL_BREAK"]),
                    )
                )
    db.commit()
    logger.info("Generated shifts and breaks for %d days", days)
    return shifts_by_day


def _pick_truck_context(rng: random.Random, trucks: list[AutonomousTruck], high_risk_episode: bool):
    if not trucks:
        return None
    truck = rng.choice(trucks)
    if high_risk_episode:
        # Force a flagship-style high-risk configuration for a slice of records.
        distance = rng.uniform(5, 20)
        state = rng.choice([TruckState.RECOVERY, TruckState.TRANSITIONING, TruckState.EXCEPTION])
        nearby_change = state == TruckState.RECOVERY
        comm = rng.choice([CommunicationStatus.DEGRADED, CommunicationStatus.LOST, CommunicationStatus.OK])
        safe_confirmed = False
    else:
        distance = rng.uniform(15, 400)
        state = truck.state
        nearby_change = truck.nearby_condition_change and rng.random() < 0.3
        comm = truck.communication_status
        safe_confirmed = truck.safe_to_approach_confirmed
    return {
        "truck": truck,
        "distance": distance,
        "state": state,
        "nearby_change": nearby_change,
        "comm": comm,
        "safe_confirmed": safe_confirmed,
    }


def generate_telemetry_and_tasks(db, rng: random.Random, operators, trucks, shifts_by_day, days: int, interval_min: int):
    telemetry_rows = []
    task_rows = []
    incident_count = 0

    for day_offset, day_shifts in shifts_by_day.items():
        for shift, machine, shift_type, duration_hours in day_shifts:
            operator_id = shift.operator_id
            n_points = max(1, int((duration_hours * 60) / interval_min))

            cumulative_engine_hours = rng.uniform(500, 9000)
            cumulative_fuel = 0.0
            cumulative_cycles = 0
            planned_cycles_total = rng.randint(60, 140)
            base_fault_count = rng.choice([0, 0, 0, 1, 2])
            maintenance_overdue = rng.choice([0, 0, 5, 15, 25])
            weather = rng.choice(WEATHER_CHOICES) if shift_type == "DAY" else "NIGHT"
            visibility = {"CLEAR": 1.0, "RAIN": 0.6, "DUST": 0.55, "FOG": 0.35, "NIGHT": 0.65}[weather]
            high_risk_episode = rng.random() < 0.06

            harsh_brake_total = 0
            harsh_accel_total = 0
            seatbelt_violation_total = 0

            # Task for this shift
            task_start = shift.start_time + timedelta(minutes=rng.uniform(0, 20))
            expected_duration = rng.uniform(20, 60)
            queue_wait = rng.uniform(1, 25)
            task = Task(
                title=f"{rng.choice(['Load crushed aggregate', 'Excavate haul road shoulder', 'Grade access road', 'Clear stockpile'])} at {machine.site_zone}",
                task_type=rng.choice(["LOADING", "EXCAVATION", "GRADING", "CLEARING"]),
                machine_id=machine.id,
                operator_id=operator_id,
                priority=rng.choice(list(TaskPriority)),
                site_zone=machine.site_zone,
                start_time=task_start,
                expected_duration_min=round(expected_duration, 1),
                status=TaskStatus.COMPLETED if day_offset < days - 1 else rng.choice([TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS]),
                load_cycles_planned=rng.randint(10, 30),
                weather_condition=weather,
                visibility_score=visibility,
                queue_wait_minutes=round(queue_wait, 1),
            )

            for point in range(n_points):
                ts = shift.start_time + timedelta(minutes=point * interval_min)
                time_since_start = point * interval_min

                fuel_rate = rng.uniform(6, 22)
                fuel_delta = fuel_rate * (interval_min / 60.0)
                cumulative_fuel += fuel_delta
                cumulative_engine_hours += interval_min / 60.0

                idle_chance = rng.random()
                is_idle_period = idle_chance < (0.35 if high_risk_episode else 0.15)
                idling_time = interval_min * rng.uniform(0.4, 1.0) if is_idle_period else interval_min * rng.uniform(0, 0.2)
                active_engine_time = interval_min

                cycles_this_period = 0 if is_idle_period else rng.randint(0, 3)
                cumulative_cycles += cycles_this_period

                harsh_brake = rng.choices([0, 1, 2], weights=[0.85, 0.12, 0.03])[0]
                harsh_accel = rng.choices([0, 1, 2], weights=[0.85, 0.12, 0.03])[0]
                harsh_brake_total += harsh_brake
                harsh_accel_total += harsh_accel

                seatbelt_unfastened = rng.random() < (0.04 if not high_risk_episode else 0.15)
                if seatbelt_unfastened:
                    seatbelt_violation_total += 1
                seatbelt_status = "UNFASTENED" if seatbelt_unfastened else "FASTENED"
                machine_speed = 0.0 if is_idle_period else rng.uniform(2, 18)

                engine_temp = rng.uniform(75, 95) if not high_risk_episode else rng.uniform(90, 112)
                coolant_temp = rng.uniform(75, 90) if not high_risk_episode else rng.uniform(88, 102)
                oil_pressure = rng.uniform(260, 340) if not high_risk_episode else rng.uniform(170, 260)
                hydraulic_temp = rng.uniform(55, 78) if not high_risk_episode else rng.uniform(78, 95)
                vibration = rng.uniform(1, 4.5) if not high_risk_episode else rng.uniform(4, 9)
                fault_codes = base_fault_count + (rng.choice([0, 1]) if high_risk_episode else 0)

                truck_ctx = _pick_truck_context(rng, trucks, high_risk_episode and rng.random() < 0.4)

                fatigue_result = fatigue_service.evaluate_fatigue(
                    continuous_work_hours=time_since_start / 60.0,
                    hours_since_last_break=min(time_since_start / 60.0, rng.uniform(0, 4)),
                    harsh_event_count=harsh_brake_total + harsh_accel_total,
                    productivity_decline_pct=max(0, rng.uniform(-5, 25) if time_since_start > 300 else 0),
                    is_night_shift=(shift_type == "NIGHT"),
                )

                transition_risk_score = 0.0
                collision_risk_score = 0.0
                truck_fields = {}
                if truck_ctx:
                    truck = truck_ctx["truck"]
                    result = safety_risk_engine.evaluate_state_transition_risk(
                        truck_state=truck_ctx["state"],
                        active_mission=truck.active_mission,
                        communication_status=truck_ctx["comm"],
                        distance_m=truck_ctx["distance"],
                        nearby_condition_change=truck_ctx["nearby_change"],
                        recovery_personnel_active=truck.recovery_personnel_active,
                        safe_to_approach_confirmed=truck_ctx["safe_confirmed"],
                        visibility_score=visibility,
                        seatbelt_status=seatbelt_status,
                        fatigue_score=fatigue_result.fatigue_score,
                    )
                    transition_risk_score = result.risk_score
                    collision_risk_score = min(100.0, result.risk_score * rng.uniform(0.6, 1.0))
                    truck_fields = {
                        "nearest_truck_id": truck.id,
                        "truck_distance_m": round(truck_ctx["distance"], 1),
                        "truck_speed_kmh": truck.speed_kmh,
                        "truck_heading_deg": truck.heading_deg,
                        "truck_state": truck_ctx["state"].value,
                        "active_mission": truck.active_mission,
                        "mission_type": truck.mission_type,
                        "communication_status": truck_ctx["comm"].value,
                        "safe_to_approach_confirmed": truck_ctx["safe_confirmed"],
                        "nearby_condition_change": truck_ctx["nearby_change"],
                        "recovery_personnel_active": truck.recovery_personnel_active,
                        "truck_gps_x": truck.gps_x,
                        "truck_gps_y": truck.gps_y,
                    }

                    if result.auto_incident_required and rng.random() < 0.5:
                        create_incident(
                            db,
                            incident_type=result.incident_type,
                            severity=result.severity,
                            risk_score=result.risk_score,
                            machine_id=machine.id,
                            operator_id=operator_id,
                            truck_id=truck.id,
                            context={"factors": result.contributing_factors, "source": "synthetic_generation"},
                            recommended_action=result.recommended_action,
                            commit=False,
                        )
                        incident_count += 1

                if seatbelt_unfastened:
                    seatbelt_result = safety_risk_engine.evaluate_seatbelt(
                        seatbelt_status="UNFASTENED",
                        engine_running=True,
                        machine_moving=machine_speed > 0.5,
                        nearest_truck_state=truck_ctx["state"] if truck_ctx else None,
                        distance_to_truck_m=truck_ctx["distance"] if truck_ctx else None,
                    )
                    if seatbelt_result.auto_incident_required and rng.random() < 0.7:
                        create_incident(
                            db,
                            incident_type=seatbelt_result.incident_type,
                            severity=seatbelt_result.severity,
                            risk_score=seatbelt_result.risk_score,
                            machine_id=machine.id,
                            operator_id=operator_id,
                            context={"factors": seatbelt_result.contributing_factors, "source": "synthetic_generation"},
                            recommended_action=seatbelt_result.recommended_action,
                            commit=False,
                        )
                        incident_count += 1

                efficiency = efficiency_service.compute_efficiency(
                    active_engine_time_min=active_engine_time,
                    idling_time_min=idling_time,
                    load_cycles=cumulative_cycles,
                    planned_load_cycles=max(planned_cycles_total, 1),
                    fuel_used_l=max(cumulative_fuel, 0.1),
                )

                failure_result = machine_health_service.evaluate_machine_health(
                    engine_hours=cumulative_engine_hours,
                    engine_temperature_c=engine_temp,
                    oil_pressure_kpa=oil_pressure,
                    coolant_temperature_c=coolant_temp,
                    hydraulic_temperature_c=hydraulic_temp,
                    vibration_rms=vibration,
                    fault_code_count=fault_codes,
                    maintenance_overdue_days=maintenance_overdue,
                )

                anomaly_signal = (
                    is_idle_period and cycles_this_period == 0 and rng.random() < 0.3
                ) or (seatbelt_violation_total > 0 and rng.random() < 0.2) or high_risk_episode and rng.random() < 0.4
                anomaly_score = rng.uniform(0.5, 1.0) if anomaly_signal else rng.uniform(0.0, 0.3)
                anomaly_label = "ANOMALY" if anomaly_signal else "NORMAL"

                record = {
                    "timestamp": ts,
                    "operator_id": operator_id,
                    "machine_id": machine.id,
                    "machine_type": machine.machine_type.value,
                    "engine_hours": round(cumulative_engine_hours, 2),
                    "engine_running": True,
                    "machine_speed_kmh": round(machine_speed, 1),
                    "fuel_used_l": round(cumulative_fuel, 2),
                    "fuel_rate_lph": round(fuel_rate, 2),
                    "load_cycles": cumulative_cycles,
                    "planned_load_cycles": planned_cycles_total,
                    "idling_time_min": round(idling_time, 1),
                    "active_engine_time_min": active_engine_time,
                    "seatbelt_status": seatbelt_status,
                    "engine_temperature_c": round(engine_temp, 1),
                    "coolant_temperature_c": round(coolant_temp, 1),
                    "oil_pressure_kpa": round(oil_pressure, 1),
                    "hydraulic_temperature_c": round(hydraulic_temp, 1),
                    "vibration_rms": round(vibration, 2),
                    "fault_code_count": fault_codes,
                    "harsh_braking_count": harsh_brake,
                    "harsh_acceleration_count": harsh_accel,
                    "gps_x": rng.uniform(0, 500),
                    "gps_y": rng.uniform(0, 500),
                    "weather_condition": weather,
                    "visibility_score": round(visibility, 2),
                    "site_congestion_level": round(rng.uniform(0.1, 0.8), 2),
                    "shift_id": shift.id,
                    "time_since_shift_start_min": time_since_start,
                    "break_minutes_today": round(rng.uniform(0, 30), 1),
                    "self_reported_fatigue": rng.choice([None, None, None, rng.uniform(0, 8)]),
                    **{k: v for k, v in truck_fields.items()},
                    "state_transition_risk_score": round(transition_risk_score, 1),
                    "collision_interaction_risk_score": round(collision_risk_score, 1),
                    "fatigue_score": fatigue_result.fatigue_score,
                    "machine_efficiency_percentage": efficiency.machine_efficiency_percentage,
                    "idle_percentage": efficiency.idle_percentage,
                    "fuel_efficiency": efficiency.fuel_efficiency,
                    "anomaly_label": anomaly_label,
                    "anomaly_score": round(anomaly_score, 3),
                    "failure_risk_score": failure_result.failure_risk_score,
                    "task_duration_actual_min": None,
                    "safety_alert_triggered": transition_risk_score >= 50 or seatbelt_unfastened,
                    "incident_type": None,
                }
                db.add(TelemetryRecord(**record))

                # CSV row for ML training carries the DB fields PLUS the
                # ANOMALY_FEATURE_ORDER-named features, computed the same way
                # the live /api/v1/telemetry ingestion endpoint computes them,
                # so the trained model's feature space matches inference time.
                row_hours_elapsed = max(interval_min / 60.0, 1 / 60.0)
                csv_row = {
                    **record,
                    "fuel_used_per_hour": round(fuel_delta / row_hours_elapsed, 3),
                    "load_cycles_per_hour": round(cycles_this_period / row_hours_elapsed, 3),
                    "idle_minutes_per_hour": round(idling_time / row_hours_elapsed, 3),
                    "seatbelt_violations_count": 1 if seatbelt_unfastened else 0,
                    "time_since_shift_started_min": time_since_start,
                    "operator_fatigue_score": fatigue_result.fatigue_score,
                    "distance_to_nearest_truck_m": truck_fields.get("truck_distance_m"),
                    "safety_risk_score": round(transition_risk_score, 1),
                }
                telemetry_rows.append(csv_row)

            # Task actuals derived post-hoc with realistic delay factors.
            weather_penalty = {"CLEAR": 0.0, "RAIN": 0.15, "DUST": 0.12, "FOG": 0.2, "NIGHT": 0.1}[weather]
            actual_duration = expected_duration * (1 + weather_penalty) + queue_wait * 0.5 + rng.uniform(-5, 10)
            task.actual_duration_min = round(max(5, actual_duration), 1)
            task_row = {
                "task_type": task.task_type,
                "load_cycles_planned": task.load_cycles_planned,
                "engine_hours": round(cumulative_engine_hours, 2),
                "avg_fuel_rate_lph": round(cumulative_fuel / max(duration_hours, 0.1), 2),
                "idling_time_min": round(sum(r["idling_time_min"] for r in telemetry_rows[-n_points:]), 1) if n_points else 0.0,
                "visibility_score": visibility,
                "queue_wait_minutes": task.queue_wait_minutes,
                "operator_experience_score": next((o.experience_score for o in operators if o.id == operator_id), 50.0),
                "fatigue_score": fatigue_result.fatigue_score,
                "autonomous_truck_availability": round(rng.uniform(0.3, 1.0), 2),
                "site_congestion_level": round(rng.uniform(0.1, 0.8), 2),
                "weather_condition": weather,
                "task_duration_actual_min": task.actual_duration_min,
            }
            task_rows.append(task_row)
            db.add(task)

            # Machine health snapshot for this shift.
            db.add(
                MachineHealthRecord(
                    machine_id=machine.id,
                    engine_hours=round(cumulative_engine_hours, 2),
                    engine_temperature_c=round(engine_temp, 1),
                    oil_pressure_kpa=round(oil_pressure, 1),
                    coolant_temperature_c=round(coolant_temp, 1),
                    hydraulic_temperature_c=round(hydraulic_temp, 1),
                    vibration_rms=round(vibration, 2),
                    fault_code_count=fault_codes,
                    fuel_consumption_change_pct=round(rng.uniform(-10, 30), 1),
                    maintenance_overdue_days=maintenance_overdue,
                    recent_anomaly_count=sum(1 for r in telemetry_rows[-n_points:] if r["anomaly_label"] == "ANOMALY") if n_points else 0,
                    failure_risk_score=failure_result.failure_risk_score,
                    risk_level=failure_result.risk_level,
                    likely_subsystem=failure_result.likely_subsystem,
                    contributing_factors_json=json.dumps(failure_result.contributing_factors),
                )
            )

        db.commit()

    logger.info("Generated %d telemetry rows, %d tasks, %d incidents", len(telemetry_rows), len(task_rows), incident_count)
    return telemetry_rows, task_rows


def _machine_health_rows_from_db(db) -> list[dict]:
    from sqlalchemy import select

    rows = []
    for record in db.scalars(select(MachineHealthRecord)).all():
        rows.append({
            "engine_hours": record.engine_hours,
            "engine_temperature_c": record.engine_temperature_c,
            "oil_pressure_kpa": record.oil_pressure_kpa,
            "coolant_temperature_c": record.coolant_temperature_c,
            "hydraulic_temperature_c": record.hydraulic_temperature_c,
            "vibration_rms": record.vibration_rms,
            "fault_code_count": record.fault_code_count,
            "fuel_consumption_change_pct": record.fuel_consumption_change_pct,
            "maintenance_overdue_days": record.maintenance_overdue_days,
            "recent_anomaly_count": record.recent_anomaly_count,
            "risk_level": record.risk_level,
        })
    return rows


def main(reset: bool = False):
    rng = _rng(settings.RANDOM_SEED)
    os.makedirs(settings.GENERATED_DATA_DIR, exist_ok=True)

    if reset:
        logger.info("Resetting database (dropping and recreating all tables)")
        Base.metadata.drop_all(bind=engine)
    init_db()

    db = SessionLocal()
    try:
        operators = generate_operators(db, rng, settings.NUM_OPERATORS)
        machines = generate_machines(db, rng, settings.NUM_MACHINES, operators)
        trucks = generate_trucks(db, rng, settings.NUM_TRUCKS)
        shifts_by_day = generate_shifts_and_breaks(db, rng, operators, machines, settings.SYNTHETIC_DAYS)
        telemetry_rows, task_rows = generate_telemetry_and_tasks(
            db, rng, operators, trucks, shifts_by_day, settings.SYNTHETIC_DAYS, settings.TELEMETRY_INTERVAL_MIN
        )
        health_rows = _machine_health_rows_from_db(db)

        pd.DataFrame(telemetry_rows).to_csv(os.path.join(settings.GENERATED_DATA_DIR, "telemetry.csv"), index=False)
        pd.DataFrame(task_rows).to_csv(os.path.join(settings.GENERATED_DATA_DIR, "tasks.csv"), index=False)
        pd.DataFrame(health_rows).to_csv(os.path.join(settings.GENERATED_DATA_DIR, "machine_health.csv"), index=False)

        logger.info("Synthetic data generation complete. CSVs written to %s", settings.GENERATED_DATA_DIR)
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate SentinelTwin synthetic dataset")
    parser.add_argument("--reset", action="store_true", help="Drop and recreate all tables first")
    args = parser.parse_args()
    main(reset=args.reset)
