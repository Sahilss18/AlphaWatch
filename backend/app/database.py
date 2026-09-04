import os
import tempfile
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import StaticPool
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

db_url = settings.DATABASE_URL
engine = None

# Determine writable directory for SQLite fallback (essential for Vercel/Lambda serverless /tmp)
temp_dir = tempfile.gettempdir()
sqlite_fallback_path = os.path.join(temp_dir, "signal_watch.db")
sqlite_fallback_url = f"sqlite:///{sqlite_fallback_path.replace(os.sep, '/')}"

try:
    if "mysql" in db_url.lower() and "localhost" not in db_url.lower():
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False,
            connect_args={"connect_timeout": 3}
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to external MySQL database.")
    elif "sqlite" in db_url.lower():
        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=False
        )
    else:
        # If localhost MySQL is specified on cloud or connection failed
        raise ConnectionError("Localhost database not reachable in cloud serverless environment.")
except Exception as e:
    logger.warning(f"Using serverless SQLite database fallback ({sqlite_fallback_url}): {e}")
    engine = create_engine(
        sqlite_fallback_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
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
