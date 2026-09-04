import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
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

# Ensure schema exists on module load (critical for serverless where lifespan may not fire)
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized.")
except Exception as e:
    logger.warning(f"Database schema initialization deferred: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event: ensure demo user and initial watchlist."""
    logger.info("Initializing Signal/Watch database tables...")
    try:
        Base.metadata.create_all(bind=engine)
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

# Global exception handler for transparency
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"{type(exc).__name__}: {str(exc)}",
            "path": request.url.path
        }
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under both /api and root to handle any proxy/rewrite topology
for router in [health_router, watchlist_router, signals_router, market_router, visit_router]:
    app.include_router(router, prefix="/api")
    app.include_router(router)

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
