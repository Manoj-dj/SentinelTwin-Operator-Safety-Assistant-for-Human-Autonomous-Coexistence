"""Timezone-aware datetime helpers. All timestamps stored in UTC."""
from __future__ import annotations

from datetime import datetime, timezone


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
