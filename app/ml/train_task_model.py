"""Train a RandomForestRegressor to predict task_duration_actual_min.

Run via: python scripts/train_models.py
Expects data/generated/tasks.csv (produced by generate_synthetic_data.py).
"""
from __future__ import annotations

import os

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

from app.core.config import settings
from app.core.logging import get_logger
from app.ml.feature_engineering import TASK_FEATURE_ORDER

logger = get_logger(__name__)

WEATHER_PENALTY = {"CLEAR": 0.0, "RAIN": 0.15, "DUST": 0.12, "FOG": 0.2, "NIGHT": 0.1}


def train_task_model() -> dict:
    csv_path = os.path.join(settings.GENERATED_DATA_DIR, "tasks.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(
            f"{csv_path} not found. Run scripts/generate_synthetic_data.py first."
        )

    df = pd.read_csv(csv_path)
    df["weather_penalty"] = df["weather_condition"].map(WEATHER_PENALTY).fillna(0.0)
    for col in TASK_FEATURE_ORDER:
        if col not in df.columns:
            df[col] = 0.0
    df = df.dropna(subset=["task_duration_actual_min"])

    X = df[TASK_FEATURE_ORDER].to_numpy()
    y = df["task_duration_actual_min"].to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=settings.RANDOM_SEED
    )

    model = RandomForestRegressor(
        n_estimators=250,
        max_depth=12,
        random_state=settings.RANDOM_SEED,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred))

    os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)
    model_path = os.path.join(settings.ML_MODELS_DIR, "task_duration_model.joblib")
    joblib.dump(model, model_path)

    metrics = {"n_samples": len(df), "mae_minutes": mae}
    logger.info("Trained task duration RandomForestRegressor: %s", metrics)
    return {"model_path": model_path, "metrics": metrics}


if __name__ == "__main__":
    print(train_task_model())
