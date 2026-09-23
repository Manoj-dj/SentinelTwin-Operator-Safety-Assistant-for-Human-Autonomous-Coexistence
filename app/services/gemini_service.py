"""Optional Gemini integration behind a swappable interface.

If GEMINI_API_KEY is not set, or the call fails for any reason, callers must
fall back to the local rule-based assistant. This module never raises out of
`generate()` -- it returns None on any failure so the caller can degrade
gracefully.
"""
from __future__ import annotations

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class GeminiService:
    def __init__(self) -> None:
        self._client = None
        self._configured = bool(settings.GEMINI_API_KEY)
        if self._configured:
            try:
                import google.generativeai as genai

                genai.configure(api_key=settings.GEMINI_API_KEY)
                self._client = genai.GenerativeModel(settings.GEMINI_MODEL)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Gemini SDK not available or failed to initialize: %s", exc)
                self._client = None
                self._configured = False

    @property
    def is_configured(self) -> bool:
        return self._configured and self._client is not None

    def generate(self, prompt: str) -> str | None:
        """Return generated text, or None if unavailable/failed."""
        if not self.is_configured:
            return None
        try:
            response = self._client.generate_content(prompt)
            text = getattr(response, "text", None)
            return text.strip() if text else None
        except Exception as exc:  # noqa: BLE001
            logger.warning("Gemini generation failed, falling back to local assistant: %s", exc)
            return None


gemini_service = GeminiService()
