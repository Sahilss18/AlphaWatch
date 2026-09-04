from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime
import asyncio

from app.database import get_db
from app.config import get_settings
from app.services.market_data import MarketDataService, MarketDataResult
from app.services.snapshot_service import SnapshotService
from app.services.signal_engine import SignalEngine
from app.models.market import MarketSnapshot, StockMetrics
from app.schemas.market import (
    MarketSummaryResponse,
    TickerMarqueeItem,
    MarketSearchResultItem,
    StockHistoryResponse,
    StockHistorySnapshot
)

router = APIRouter(tags=["Market Data"])
settings = get_settings()

TICKER_MARQUEE_SYMBOLS = [
    "NVDA", "AAPL", "PLTR", "MSFT", "SMCI", "ARM", "TSLA", "AMD", "COIN", "META", "GOOGL", "AVGO"
]

@router.get("/market/summary", response_model=MarketSummaryResponse)
async def get_market_summary(db: Session = Depends(get_db)):
    """Retrieve market overview and ticker marquee data."""
    market_svc = MarketDataService.get_instance()
    tickers: List[TickerMarqueeItem] = []
    
    gainers = 0
    losers = 0
    unchanged = 0
    total_pct = 0.0

    quotes = await asyncio.gather(*[market_svc.get_live_quote(sym) for sym in TICKER_MARQUEE_SYMBOLS])

    for idx, sym in enumerate(TICKER_MARQUEE_SYMBOLS):
        quote = quotes[idx]
        if not quote:
            snap = SnapshotService.get_latest_snapshot(db, sym)
            if snap:
                quote = MarketDataResult(
                    symbol=sym,
                    price=float(snap.price),
                    previous_close=float(snap.previous_close),
                    change_amount=float(snap.change_amount),
                    change_percent=float(snap.change_percent),
                    timestamp=snap.timestamp,
                    is_stale=True,
                    source="mysql"
                )
            else:
                continue

        dir_label = "positive" if quote.change_percent > 0.05 else ("negative" if quote.change_percent < -0.05 else "neutral")
        if dir_label == "positive":
            gainers += 1
        elif dir_label == "negative":
            losers += 1
        else:
            unchanged += 1

        total_pct += quote.change_percent

        att_score = min(99, max(10, int(abs(quote.change_percent) * 15)))

        tickers.append(TickerMarqueeItem(
            symbol=sym,
            price=quote.price,
            change_percent=quote.change_percent,
            change_amount=quote.change_amount,
            direction=dir_label,
            attention_score=att_score
        ))

    avg_change = round(total_pct / len(tickers), 2) if tickers else 0.0
    sentiment = "BULLISH" if avg_change > 0.3 else ("BEARISH" if avg_change < -0.3 else "MIXED")

    return MarketSummaryResponse(
        total_tracked=len(tickers),
        tickers=tickers,
        gainers_count=gainers,
        losers_count=losers,
        unchanged_count=unchanged,
        market_sentiment=sentiment,
        average_change_percent=avg_change,
        last_updated=datetime.utcnow()
    )

@router.get("/market/search/{query}", response_model=List[MarketSearchResultItem])
async def search_market_symbols(query: str):
    """Search for stock symbols by ticker or company name."""
    market_svc = MarketDataService.get_instance()
    results = await market_svc.search(query)
    return [MarketSearchResultItem(**r) for r in results]

@router.get("/market/{symbol}")
async def get_market_quote(symbol: str, db: Session = Depends(get_db)):
    """Retrieve quote for a single symbol."""
    sym = symbol.upper().strip()
    market_svc = MarketDataService.get_instance()
    quote = await market_svc.get_live_quote(sym)
    if not quote:
        snap = SnapshotService.get_latest_snapshot(db, sym)
        if snap:
            return {
                "symbol": sym,
                "price": float(snap.price),
                "previous_close": float(snap.previous_close),
                "change_amount": float(snap.change_amount),
                "change_percent": float(snap.change_percent),
                "last_updated": snap.timestamp,
                "is_stale": True,
                "source": "mysql_cached"
            }
        raise HTTPException(status_code=404, detail=f"Quote not found for {sym}")
    
    return {
        "symbol": sym,
        "price": quote.price,
        "previous_close": quote.previous_close,
        "change_amount": quote.change_amount,
        "change_percent": quote.change_percent,
        "day_high": quote.day_high,
        "day_low": quote.day_low,
        "last_updated": quote.timestamp,
        "is_stale": quote.is_stale,
        "source": quote.source
    }

@router.get("/history/{symbol}", response_model=StockHistoryResponse)
async def get_stock_history(
    symbol: str,
    user_id: str = Query(default=settings.DEMO_USER_ID),
    limit: int = Query(default=20, ge=5, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve recent snapshots and last visit comparison for a stock."""
    sym = symbol.upper().strip()
    market_svc = MarketDataService.get_instance()

    quote = await market_svc.get_live_quote(sym)
    comp_name = await market_svc.get_company_name(sym)
    metrics = await market_svc.get_stock_metrics(sym)

    snaps = db.query(MarketSnapshot)\
        .filter(MarketSnapshot.symbol == sym)\
        .order_by(desc(MarketSnapshot.timestamp))\
        .limit(limit)\
        .all()

    last_visit_time, _, _ = SnapshotService.get_user_last_visit(db, user_id)
    last_visit_snap = SnapshotService.get_snapshot_at_or_before(db, sym, last_visit_time) if last_visit_time else None

    current_price = quote.price if quote else (float(snaps[0].price) if snaps else 100.0)
    last_visit_p = float(last_visit_snap.price) if last_visit_snap else (quote.previous_close if quote else None)

    since_visit_pct = None
    if last_visit_p and last_visit_p > 0:
        since_visit_pct = round(((current_price - last_visit_p) / last_visit_p) * 100, 2)

    history_list: List[StockHistorySnapshot] = []
    if snaps:
        for s in snaps:
            history_list.append(StockHistorySnapshot(
                id=s.id,
                price=float(s.price),
                previous_close=float(s.previous_close),
                change_percent=float(s.change_percent),
                volume=s.volume or 0,
                timestamp=s.timestamp,
                is_stale=s.is_stale
            ))
    else:
        history_list.append(StockHistorySnapshot(
            id=1,
            price=current_price,
            previous_close=current_price * 0.98,
            change_percent=2.04,
            volume=int(metrics.get("average_volume_10d", 15000000)),
            timestamp=datetime.utcnow(),
            is_stale=False
        ))

    prev_close = quote.previous_close if quote else (float(snaps[0].previous_close) if snaps else current_price)
    day_change_pct = quote.change_percent if quote else (float(snaps[0].change_percent) if snaps else 0.0)

    return StockHistoryResponse(
        symbol=sym,
        company_name=comp_name,
        current_price=current_price,
        previous_close=prev_close,
        day_change_percent=day_change_pct,
        last_visit_price=last_visit_p,
        since_last_visit_change_percent=since_visit_pct,
        historical_snapshots=history_list,
        volatility=float(metrics.get("volatility_daily", 1.8) or 1.8),
        average_volume=int(metrics.get("average_volume_10d", 20000000) or 20000000),
        week_52_high=float(metrics.get("week_52_high", 0) or 0) or None,
        week_52_low=float(metrics.get("week_52_low", 0) or 0) or None
    )
