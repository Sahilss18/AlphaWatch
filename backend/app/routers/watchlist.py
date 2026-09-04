from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import get_settings
from app.services.watchlist_service import WatchlistService
from app.schemas.watchlist import (
    WatchlistStockCreate,
    WatchlistSummaryResponse,
    WatchlistItemResponse,
    WatchlistHealthResponse
)

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])
settings = get_settings()

@router.get("", response_model=WatchlistSummaryResponse)
async def get_watchlist(
    user_id: str = Query(default=settings.DEMO_USER_ID),
    db: Session = Depends(get_db)
):
    """Retrieve user's watchlist with live market snapshot diffs and pulse deviation."""
    return await WatchlistService.get_watchlist_summary(db=db, user_id=user_id)

@router.get("/health", response_model=WatchlistHealthResponse)
async def get_watchlist_health(
    user_id: str = Query(default=settings.DEMO_USER_ID),
    db: Session = Depends(get_db)
):
    """Retrieve compact Watchlist Health metrics: volatility meter, unusual activity meter, and sector context."""
    return await WatchlistService.get_watchlist_health(db=db, user_id=user_id)

@router.post("", status_code=status.HTTP_201_CREATED)
async def add_ticker(
    payload: WatchlistStockCreate,
    user_id: str = Query(default=settings.DEMO_USER_ID),
    db: Session = Depends(get_db)
):
    """Add a stock ticker to user's watchlist."""
    stock = await WatchlistService.add_stock_to_watchlist(
        db=db,
        symbol=payload.symbol,
        company_name=payload.company_name,
        user_id=user_id
    )
    return {
        "success": True,
        "message": f"Successfully added {stock.symbol} to watchlist",
        "symbol": stock.symbol,
        "company_name": stock.company_name
    }

@router.delete("/{symbol}")
def remove_ticker(
    symbol: str,
    user_id: str = Query(default=settings.DEMO_USER_ID),
    db: Session = Depends(get_db)
):
    """Remove a stock ticker from user's watchlist."""
    removed = WatchlistService.remove_stock_from_watchlist(db=db, symbol=symbol, user_id=user_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symbol {symbol.upper()} not found in your watchlist"
        )
    return {
        "success": True,
        "message": f"Successfully removed {symbol.upper()} from watchlist"
    }
