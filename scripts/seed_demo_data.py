"""Idempotent baseline seeding CLI (training resources, knowledge base, and
a minimal demo dataset). This is the same seeding logic that runs
automatically on API startup -- this script exists so it can also be run
standalone/explicitly, e.g. in CI or after wiping the database.

For the FULL synthetic dataset (30 operators, 20 machines, 8 trucks, 60-90
days of telemetry) used to train ML models, use
scripts/generate_synthetic_data.py instead.

Usage:
    python scripts/seed_demo_data.py
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, init_db  # noqa: E402
from app.core.logging import get_logger  # noqa: E402
from app.seed.seed_baseline import run_all_seeds  # noqa: E402

logger = get_logger(__name__)


def main():
    init_db()
    db = SessionLocal()
    try:
        run_all_seeds(db)
        logger.info("Baseline + minimal demo data seeded successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
