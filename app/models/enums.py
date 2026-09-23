"""Shared enums used across models, schemas and services."""
from __future__ import annotations

import enum


class MachineType(str, enum.Enum):
    EXCAVATOR = "EXCAVATOR"
    LOADER = "LOADER"
    DOZER = "DOZER"
    GRADER = "GRADER"


class TruckState(str, enum.Enum):
    NORMAL = "NORMAL"
    EXCEPTION = "EXCEPTION"
    RECOVERY = "RECOVERY"
    TRANSITIONING = "TRANSITIONING"
    STOPPED = "STOPPED"
    SUSPENDED = "SUSPENDED"
    OFFLINE = "OFFLINE"


class CommunicationStatus(str, enum.Enum):
    OK = "OK"
    DEGRADED = "DEGRADED"
    LOST = "LOST"


class SeatbeltStatus(str, enum.Enum):
    FASTENED = "FASTENED"
    UNFASTENED = "UNFASTENED"


class Severity(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentType(str, enum.Enum):
    SEATBELT_VIOLATION = "SEATBELT_VIOLATION"
    PROXIMITY_WARNING = "PROXIMITY_WARNING"
    STATE_TRANSITION_RISK = "STATE_TRANSITION_RISK"
    RECOVERY_APPROACH_RISK = "RECOVERY_APPROACH_RISK"
    COMMUNICATION_DEGRADED = "COMMUNICATION_DEGRADED"
    VISIBILITY_HAZARD = "VISIBILITY_HAZARD"
    FATIGUE_RISK = "FATIGUE_RISK"
    EXCESSIVE_IDLING = "EXCESSIVE_IDLING"
    UNUSUAL_OPERATION_PATTERN = "UNUSUAL_OPERATION_PATTERN"
    PREDICTED_MACHINE_FAILURE = "PREDICTED_MACHINE_FAILURE"
    TASK_DELAY_RISK = "TASK_DELAY_RISK"


class AckStatus(str, enum.Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class TrainingResourceType(str, enum.Enum):
    VIDEO = "VIDEO"
    PDF_MANUAL = "PDF_MANUAL"
    SOP = "SOP"
    CHECKLIST = "CHECKLIST"
    QUIZ = "QUIZ"
    SIMULATION_GUIDE = "SIMULATION_GUIDE"


class TrainingProgressStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class WeatherCondition(str, enum.Enum):
    CLEAR = "CLEAR"
    RAIN = "RAIN"
    DUST = "DUST"
    FOG = "FOG"
    NIGHT = "NIGHT"


class TaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DELAYED = "DELAYED"
    CANCELLED = "CANCELLED"


class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class ConnectivityStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    DEGRADED = "DEGRADED"
    OFFLINE = "OFFLINE"


class MachineStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    IDLE = "IDLE"
    MAINTENANCE = "MAINTENANCE"
    OFFLINE = "OFFLINE"
