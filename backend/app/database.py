import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

db_url = settings.DATABASE_URL
engine = None

# Attempt primary database connection (e.g. MySQL) with fallback to SQLite if host is unreachable
try:
    if "mysql" in db_url.lower():
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False,
            connect_args={"connect_timeout": 4}
        )
        # Verify connection immediately
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to MySQL database.")
    else:
        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False} if "sqlite" in db_url else {},
            echo=False
        )
except Exception as e:
    logger.warning(f"Could not connect to database ({db_url}): {e}. Initializing embedded SQLite database fallback.")
    engine = create_engine(
        "sqlite:///./signal_watch.db",
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
