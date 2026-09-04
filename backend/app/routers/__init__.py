from app.routers.health import router as health_router
from app.routers.watchlist import router as watchlist_router
from app.routers.signals import router as signals_router
from app.routers.market import router as market_router
from app.routers.visit import router as visit_router

__all__ = [
    "health_router",
    "watchlist_router",
    "signals_router",
    "market_router",
    "visit_router",
]
