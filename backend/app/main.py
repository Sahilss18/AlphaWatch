import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import engine, Base, SessionLocal
from app.routers import (
    health_router,
    watchlist_router,
    signals_router,
    market_router,
    visit_router
)
from app.services.watchlist_service import WatchlistService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("signal_watch")
settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event: create tables, seed demo user and initial watchlist."""
    logger.info("Initializing Signal/Watch database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified.")

        # Ensure demo user and initial watchlist exist
        db = SessionLocal()
        try:
            user, watchlist = WatchlistService.ensure_demo_user(db, settings.DEMO_USER_ID)
            logger.info(f"Demo user initialized: {user.name} (Watchlist ID: {watchlist.id})")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error during startup database initialization: {e}")

    yield

    logger.info("Shutting down Signal/Watch backend.")

app = FastAPI(
    title="SIGNAL/WATCH API",
    description="Intelligent Market Watchlist API with Adaptive Signal Scoring & Snapshot Diffing",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health_router, prefix="/api")
app.include_router(watchlist_router, prefix="/api")
app.include_router(signals_router, prefix="/api")
app.include_router(market_router, prefix="/api")
app.include_router(visit_router, prefix="/api")

@app.get("/")
def root():
    return {
        "app": "SIGNAL/WATCH — Smart Market Watchlist",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs",
        "api_prefix": "/api"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
