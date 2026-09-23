"""Application configuration loaded from environment variables (.env)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App metadata
    APP_NAME: str = "SentinelTwin"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'data' / 'sentineltwin.db').as_posix()}"

    # Reproducibility
    RANDOM_SEED: int = 42

    # Synthetic data generation
    SYNTHETIC_DAYS: int = 75
    TELEMETRY_INTERVAL_MIN: int = 15
    NUM_OPERATORS: int = 30
    NUM_MACHINES: int = 20
    NUM_TRUCKS: int = 8

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # ML artifact paths
    ML_MODELS_DIR: str = str(BASE_DIR / "data" / "models")
    GENERATED_DATA_DIR: str = str(BASE_DIR / "data" / "generated")

    # Gemini (optional)
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Fatigue / safety thresholds (tunable without code changes)
    BREAK_DUE_HOURS: float = 2.0

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
