import pytest
from app.database import engine, Base, SessionLocal
from app.services.watchlist_service import WatchlistService
from app.config import get_settings

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Ensure tables are created and demo user exists before tests run."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        settings = get_settings()
        WatchlistService.ensure_demo_user(db, settings.DEMO_USER_ID)
    finally:
        db.close()
    yield
