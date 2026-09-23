"""Train a RandomForestClassifier for machine failure-risk classification.

Run via: python scripts/train_models.py
Expects data/generated/machine_health.csv (produced by generate_synthetic_data.py).
Classes: LOW, MODERATE, HIGH, CRITICAL (matches machine_health_service buckets).
"""
from __future__ import annotations

import os

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

from app.core.config import settings
from app.core.logging import get_logger
from app.ml.feature_engineering import FAILURE_FEATURE_ORDER

logger = get_logger(__name__)

CLASS_ORDER = ["LOW", "MODERATE", "HIGH", "CRITICAL"]


def train_failure_model() -> dict:
    csv_path = os.path.join(settings.GENERATED_DATA_DIR, "machine_health.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(
            f"{csv_path} not found. Run scripts/generate_synthetic_data.py first."
        )

    df = pd.read_csv(csv_path)
    for col in FAILURE_FEATURE_ORDER:
        if col not in df.columns:
            df[col] = 0.0
    df = df.dropna(subset=["risk_level"])
    df["risk_level"] = pd.Categorical(df["risk_level"], categories=CLASS_ORDER, ordered=True)

    X = df[FAILURE_FEATURE_ORDER].to_numpy()
    y = df["risk_level"].astype(str).to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=settings.RANDOM_SEED, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=250,
        max_depth=10,
        random_state=settings.RANDOM_SEED,
        n_jobs=-1,
        class_weight="balanced",
    )
    # Ensure class order for predict_proba matches CLASS_ORDER as best as possible.
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))

    os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)
    model_path = os.path.join(settings.ML_MODELS_DIR, "failure_model.joblib")
    joblib.dump(model, model_path)

    metrics = {"n_samples": len(df), "accuracy": acc, "classes": list(model.classes_)}
    logger.info("Trained failure risk RandomForestClassifier: %s", metrics)
    return {"model_path": model_path, "metrics": metrics}


if __name__ == "__main__":
    print(train_failure_model())
