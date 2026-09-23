"""Train an IsolationForest anomaly detector on synthetic telemetry.

Run via: python scripts/train_models.py
Expects data/generated/telemetry.csv (produced by generate_synthetic_data.py).
"""
from __future__ import annotations

import os

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from app.core.config import settings
from app.core.logging import get_logger
from app.ml.feature_engineering import ANOMALY_FEATURE_ORDER

logger = get_logger(__name__)


def train_anomaly_model() -> dict:
    csv_path = os.path.join(settings.GENERATED_DATA_DIR, "telemetry.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(
            f"{csv_path} not found. Run scripts/generate_synthetic_data.py first."
        )

    df = pd.read_csv(csv_path)
    for col in ANOMALY_FEATURE_ORDER:
        if col not in df.columns:
            df[col] = 0.0
    df = df.fillna(0.0)

    X = df[ANOMALY_FEATURE_ORDER].to_numpy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.06,
        random_state=settings.RANDOM_SEED,
        n_jobs=-1,
    )
    model.fit(X_scaled)

    os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)
    model_path = os.path.join(settings.ML_MODELS_DIR, "anomaly_model.joblib")
    scaler_path = os.path.join(settings.ML_MODELS_DIR, "anomaly_scaler.joblib")
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    predictions = model.predict(X_scaled)
    anomaly_rate = float((predictions == -1).mean())
    metrics = {"n_samples": len(df), "anomaly_rate": anomaly_rate}
    logger.info("Trained IsolationForest anomaly model: %s", metrics)
    return {"model_path": model_path, "metrics": metrics}


if __name__ == "__main__":
    print(train_anomaly_model())
