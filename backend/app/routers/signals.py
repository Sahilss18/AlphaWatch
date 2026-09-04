from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import get_settings
from app.services.watchlist_service import WatchlistService
from app.services.market_data import MarketDataService, MarketDataResult
from app.services.signal_engine import SignalEngine
from app.services.snapshot_service import SnapshotService
from app.services.market_context import MarketContextService
from app.services.signal_lifecycle_service import SignalLifecycleService
from app.schemas.signal import (
    SignalsListResponse,
    SignalDetailResponse,
    SparklinePoint,
    SignalExplanationPoint,
    SignalLifecycleDetail,
    MarketContextDetail,
    ScoreBreakdownDetail
)

router = APIRouter(prefix="/signals", tags=["Signals & Attention Engine"])
settings = get_settings()

@router.get("", response_model=SignalsListResponse)
async def get_signals(
    user_id: str = Query(default=settings.DEMO_USER_ID),
    db: Session = Depends(get_db)
):
    """Retrieve ranked signals feed with Top Attention budget, Market Context, and Signal Lifecycle."""
    return await WatchlistService.get_signals_feed(db=db, user_id=user_id)

async def _get_evaluated_symbol_signal(db: Session, symbol: str, user_id: str) -> SignalDetailResponse:
    sym = symbol.upper().strip()
    user, watchlist = WatchlistService.ensure_demo_user(db, user_id)
    market_svc = MarketDataService.get_instance()
    
    quote = await market_svc.get_live_quote(sym)
    if not quote:
        db_snap = SnapshotService.get_latest_snapshot(db, sym)
        if not db_snap:
            raise HTTPException(status_code=404, detail=f"No market data available for symbol {sym}")
        quote = MarketDataResult(
            symbol=sym,
            price=float(db_snap.price),
            previous_close=float(db_snap.previous_close),
            change_amount=float(db_snap.change_amount),
            change_percent=float(db_snap.change_percent),
            timestamp=db_snap.timestamp,
            is_stale=True,
            source="mysql_fallback"
        )

    last_visit_time, _, _ = SnapshotService.get_user_last_visit(db, user_id)
    last_visit_snap = SnapshotService.get_snapshot_at_or_before(db, sym, last_visit_time) if last_visit_time else None
    last_visit_price = float(last_visit_snap.price) if last_visit_snap else quote.previous_close

    metrics = await market_svc.get_stock_metrics(sym)
    comp_name = await market_svc.get_company_name(sym)

    sig = SignalEngine.evaluate_stock(
        symbol=sym,
        company_name=comp_name,
        current_price=quote.price,
        previous_close=quote.previous_close,
        day_high=quote.day_high,
        day_low=quote.day_low,
        open_price=quote.open_price,
        last_visit_price=last_visit_price,
        metrics=metrics,
        is_stale=quote.is_stale,
        data_source=quote.source
    )

    context = await MarketContextService.evaluate_context(
        symbol=sym,
        stock_change_percent=quote.change_percent,
        all_quotes={sym: quote},
        is_stale=quote.is_stale
    )

    lifecycle = SignalLifecycleService.get_or_update_lifecycle(
        db=db,
        watchlist_id=watchlist.id,
        symbol=sym,
        attention_score=sig.attention_score,
        primary_reason=sig.primary_reason,
        is_breakout=sig.is_breakout,
        volume_ratio=sig.volume_ratio
    )

    sparkline_data = SnapshotService.get_sparkline_for_symbol(db, sym, quote.price)
    spark_points = [SparklinePoint(timestamp=p["timestamp"], price=p["price"]) for p in sparkline_data]
    why_items = [SignalExplanationPoint(**w) for w in sig.why_structured]

    return SignalDetailResponse(
        symbol=sig.symbol,
        company_name=sig.company_name,
        signal_type=sig.signal_type,
        attention_score=sig.attention_score,
        attention_level=sig.attention_level,
        price=sig.price,
        previous_close=sig.previous_close,
        percentage_change=sig.percentage_change,
        absolute_change=sig.absolute_change,
        since_last_visit_change_percent=sig.since_last_visit_change_percent,
        since_last_visit_change_amount=sig.since_last_visit_change_amount,
        primary_reason=sig.primary_reason,
        why_points=sig.why_points,
        why_structured=why_items,
        summary_verdict=sig.summary_verdict,
        score_breakdown=sig.score_breakdown,
        market_context=context,
        lifecycle=lifecycle,
        expected_vs_actual=sig.expected_vs_actual,
        volume=sig.volume,
        average_volume=sig.average_volume,
        volume_ratio=sig.volume_ratio,
        volatility=sig.volatility,
        is_breakout=sig.is_breakout,
        is_52w_high=sig.is_52w_high,
        is_52w_low=sig.is_52w_low,
        sparkline=spark_points,
        detected_at=sig.detected_at,
        data_freshness=sig.data_freshness,
        is_stale=sig.is_stale
    )

@router.get("/{symbol}", response_model=SignalDetailResponse)
async def get_symbol_signal(
    symbol: str,
    user_id: str = Query(default=settings.DEMO_USER_ID),
    db: Session = Depends(get_db)
):
    """Retrieve full consolidated signal analysis for a specific symbol."""
    return await _get_evaluated_symbol_signal(db, symbol, user_id)

@router.get("/{symbol}/lifecycle", response_model=SignalLifecycleDetail)
async def get_symbol_lifecycle(
    symbol: str,
    user_id: str = Query(default=settings.DEMO_USER_ID),
    db: Session = Depends(get_db)
):
    """Retrieve state machine lifecycle and transition timeline for a specific symbol."""
    signal = await _get_evaluated_symbol_signal(db, symbol, user_id)
    return signal.lifecycle

@router.get("/{symbol}/context", response_model=MarketContextDetail)
async def get_symbol_market_context(
    symbol: str,
    user_id: str = Query(default=settings.DEMO_USER_ID),
    db: Session = Depends(get_db)
):
    """Retrieve stock vs sector vs market benchmark context classification for a symbol."""
    signal = await _get_evaluated_symbol_signal(db, symbol, user_id)
    return signal.market_context

@router.get("/{symbol}/score-breakdown", response_model=ScoreBreakdownDetail)
async def get_symbol_score_breakdown(
    symbol: str,
    user_id: str = Query(default=settings.DEMO_USER_ID),
    db: Session = Depends(get_db)
):
    """Retrieve mathematical 5-component breakdown and explanations for a symbol's attention score."""
    signal = await _get_evaluated_symbol_signal(db, symbol, user_id)
    return signal.score_breakdown
