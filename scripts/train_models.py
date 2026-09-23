"""Train all three ML models (anomaly, task duration, failure risk) from the
CSVs produced by scripts/generate_synthetic_data.py.

Usage:
    python scripts/train_models.py
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.logging import get_logger  # noqa: E402
from app.ml.train_anomaly_model import train_anomaly_model  # noqa: E402
from app.ml.train_failure_model import train_failure_model  # noqa: E402
from app.ml.train_task_model import train_task_model  # noqa: E402

logger = get_logger(__name__)


def main():
    results = {}
    for name, fn in (
        ("anomaly_model", train_anomaly_model),
        ("task_duration_model", train_task_model),
        ("failure_model", train_failure_model),
    ):
        try:
            results[name] = fn()
            logger.info("%s trained successfully: %s", name, results[name]["metrics"])
        except FileNotFoundError as exc:
            logger.error("%s: %s", name, exc)
            results[name] = {"error": str(exc)}
        except Exception as exc:  # noqa: BLE001
            logger.exception("%s training failed", name)
            results[name] = {"error": str(exc)}

    print("\n=== Training summary ===")
    for name, result in results.items():
        print(f"{name}: {result}")


if __name__ == "__main__":
    main()
