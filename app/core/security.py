"""Minimal security helpers.

This hackathon prototype does not implement full authentication. This module
provides a seam so real auth (JWT / API keys / SSO) can be added later
without touching route handlers, plus helpers to keep secrets out of logs.
"""
from __future__ import annotations

from app.core.config import settings


def mask_secret(value: str | None, visible: int = 4) -> str:
    """Return a masked representation of a secret value, safe for logging."""
    if not value:
        return "<not-set>"
    if len(value) <= visible:
        return "*" * len(value)
    return value[:visible] + "*" * (len(value) - visible)


def is_gemini_configured() -> bool:
    return bool(settings.GEMINI_API_KEY)
