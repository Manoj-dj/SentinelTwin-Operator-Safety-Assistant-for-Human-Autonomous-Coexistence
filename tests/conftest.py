from __future__ import annotations

import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Use an isolated temp SQLite DB for the test session, set BEFORE importing
# app modules so app.core.config picks it up.
_TMP_DB = os.path.join(tempfile.gettempdir(), "sentineltwin_test.db")
if os.path.exists(_TMP_DB):
    os.remove(_TMP_DB)
os.environ.setdefault("DATABASE_URL", f"sqlite:///{_TMP_DB}")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import SessionLocal, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.seed.seed_baseline import run_all_seeds  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _setup_database():
    init_db()
    db = SessionLocal()
    try:
        run_all_seeds(db)
    finally:
        db.close()
    yield


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
