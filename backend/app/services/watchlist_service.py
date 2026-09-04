import logging
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.user import User, UserVisit
from app.models.watchlist import Watchlist, WatchlistStock
from app.models.market import MarketSnapshot, StockMetrics, ChangeEvent
from app.services.market_data import MarketDataService, MarketDataResult
from app.services.signal_engine import SignalEngine, EvaluatedSignal
from app.services.snapshot_service import SnapshotService
from app.services.market_context import MarketContextService
from app.services.signal_lifecycle_service import SignalLifecycleService
from app.schemas.watchlist import (
    WatchlistItemResponse,
    WatchlistPulseResponse,
    WatchlistHealthResponse,
    WatchlistSummaryResponse
)
from app.schemas.signal import (
    SignalDetailResponse,
    SignalsListResponse,
    SparklinePoint,
    SignalExplanationPoint,
    ScoreBreakdownDetail,
    MarketContextDetail,
    SignalLifecycleDetail,
    ExpectedVsActualDetail
)

logger = logging.getLogger(__name__)

DEFAULT_SEED_SYMBOLS = [
    ("NVDA", "NVIDIA Corp"),
    ("AAPL", "Apple Inc"),
    ("PLTR", "Palantir Technologies Inc"),
    ("MSFT", "Microsoft Corporation"),
    ("SMCI", "Super Micro Computer Inc"),
    ("ARM", "Arm Holdings plc"),
    ("TSLA", "Tesla Inc"),
    ("AMD", "Advanced Micro Devices Inc"),
    ("COIN", "Coinbase Global Inc"),
]

class WatchlistService:

    @staticmethod
    def ensure_demo_user(db: Session, user_id: str = "demo-user-001") -> Tuple[User, Watchlist]:
        """Ensure demo user, primary watchlist, and initial seed stocks exist."""
        from app.database import Base
        try:
            user = db.query(User).filter(User.id == user_id).first()
        except Exception:
            db.rollback()
            Base.metadata.create_all(bind=db.get_bind())
            user = db.query(User).filter(User.id == user_id).first()

        if not user:
            user = User(
                id=user_id,
                name="Demo User",
                email="demo@signalwatch.io"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Check for user visits; if none, seed an initial visit 4 hours ago
        visit = db.query(UserVisit).filter(UserVisit.user_id == user_id).first()
        if not visit:
            visit = UserVisit(
                user_id=user_id,
                visited_at=datetime.now(timezone.utc) - timedelta(hours=4)
            )
            db.add(visit)
            db.commit()

        # Primary watchlist
        watchlist = db.query(Watchlist).filter(Watchlist.user_id == user_id).first()
        if not watchlist:
            watchlist = Watchlist(
                user_id=user_id,
                name="Core Tech & Semis"
            )
            db.add(watchlist)
            db.commit()
            db.refresh(watchlist)

        # Seed initial stocks if watchlist is empty
        stock_count = db.query(WatchlistStock).filter(WatchlistStock.watchlist_id == watchlist.id).count()
        if stock_count == 0:
            for sym, name in DEFAULT_SEED_SYMBOLS:
                ws = WatchlistStock(
                    watchlist_id=watchlist.id,
                    symbol=sym,
                    company_name=name
                )
                db.add(ws)
            db.commit()

        return user, watchlist

    @staticmethod
    async def get_watchlist_summary(db: Session, user_id: str = "demo-user-001") -> WatchlistSummaryResponse:
        """Fetch all watchlist items with live market data, since-visit deltas, and health metrics."""
        user, watchlist = WatchlistService.ensure_demo_user(db, user_id)
        market_service = MarketDataService.get_instance()

        stocks = db.query(WatchlistStock)\
            .filter(WatchlistStock.watchlist_id == watchlist.id)\
            .order_by(WatchlistStock.created_at.asc())\
            .all()

        last_visit_time, seconds_away, formatted_away = SnapshotService.get_user_last_visit(db, user_id)

        symbols = [s.symbol.upper() for s in stocks]
        all_fetch_symbols = list(dict.fromkeys(symbols + ["SPY"]))
        quotes_tasks = [market_service.get_live_quote(sym) for sym in all_fetch_symbols]
        metrics_tasks = [market_service.get_stock_metrics(sym) for sym in symbols]
        
        raw_quotes, metrics_results = await asyncio.gather(
            asyncio.gather(*quotes_tasks),
            asyncio.gather(*metrics_tasks)
        )

        quotes_map: Dict[str, MarketDataResult] = {}
        for idx, sym in enumerate(all_fetch_symbols):
            q = raw_quotes[idx]
            if q:
                quotes_map[sym] = q

        quotes_results = [quotes_map.get(sym) for sym in symbols]

        items: List[WatchlistItemResponse] = []
        total_deviation = 0.0
        flagged_count = 0
        critical_count = 0
        high_count = 0
        moderate_count = 0
        normal_count = 0
        volume_anomalies_count = 0
        total_volatility_score = 0

        for idx, s in enumerate(stocks):
            sym = s.symbol.upper()
            quote = quotes_results[idx]
            metrics = metrics_results[idx]
            
            if not quote:
                db_snap = SnapshotService.get_latest_snapshot(db, sym)
                if db_snap:
                    quote = MarketDataResult(
                        symbol=sym,
                        price=float(db_snap.price),
                        previous_close=float(db_snap.previous_close),
                        change_amount=float(db_snap.change_amount),
                        change_percent=float(db_snap.change_percent),
                        day_high=float(db_snap.day_high) if db_snap.day_high else None,
                        day_low=float(db_snap.day_low) if db_snap.day_low else None,
                        open_price=float(db_snap.open_price) if db_snap.open_price else None,
                        volume=db_snap.volume or 0,
                        timestamp=db_snap.timestamp,
                        is_stale=True,
                        source="mysql_fallback"
                    )
                else:
                    quote = market_service.get_fallback_baseline_quote(sym)

            quotes_map[sym] = quote
            SnapshotService.record_snapshot(db, quote)

            last_visit_snap = SnapshotService.get_snapshot_at_or_before(db, sym, last_visit_time) if last_visit_time else None
            last_visit_price = float(last_visit_snap.price) if last_visit_snap else quote.previous_close
            comp_name = s.company_name or sym

            signal: EvaluatedSignal = SignalEngine.evaluate_stock(
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

            # Evaluate Market Context & Lifecycle
            context: MarketContextDetail = await MarketContextService.evaluate_context(
                symbol=sym,
                stock_change_percent=quote.change_percent,
                all_quotes=quotes_map,
                is_stale=quote.is_stale
            )

            lifecycle: SignalLifecycleDetail = SignalLifecycleService.get_or_update_lifecycle(
                db=db,
                watchlist_id=watchlist.id,
                symbol=sym,
                attention_score=signal.attention_score,
                primary_reason=signal.primary_reason,
                is_breakout=signal.is_breakout,
                volume_ratio=signal.volume_ratio
            )

            signals_list = [signal.signal_type]
            if signal.volume_ratio >= 1.8:
                signals_list.append("VOLUME_ANOMALY")
                volume_anomalies_count += 1
            if signal.is_52w_high:
                signals_list.append("NEW_HIGH")
            if signal.is_52w_low:
                signals_list.append("NEW_LOW")
            if signal.is_breakout:
                signals_list.append("BREAKOUT")

            if signal.attention_score >= 85:
                critical_count += 1
                flagged_count += 1
            elif signal.attention_score >= 70:
                high_count += 1
                flagged_count += 1
            elif signal.attention_score >= 40:
                moderate_count += 1
            else:
                normal_count += 1

            total_deviation += signal.percentage_change
            total_volatility_score += min(100, int(signal.expected_vs_actual.deviation_multiple * 35))
            data_age = int((datetime.now(timezone.utc) - quote.timestamp.replace(tzinfo=timezone.utc) if quote.timestamp.tzinfo is None else datetime.now(timezone.utc) - quote.timestamp).total_seconds())

            items.append(WatchlistItemResponse(
                symbol=sym,
                name=comp_name,
                price=quote.price,
                previous_close=quote.previous_close,
                change_amount=quote.change_amount,
                change_percent=quote.change_percent,
                since_last_visit_price=last_visit_price,
                since_last_visit_change_percent=signal.since_last_visit_change_percent,
                since_last_visit_change_amount=signal.since_last_visit_change_amount,
                attention_score=signal.attention_score,
                attention_level=signal.attention_level,
                signals=list(set(signals_list)),
                context_classification=context.classification,
                lifecycle_status=lifecycle.current_status,
                volume=signal.volume,
                average_volume=signal.average_volume,
                volume_ratio=signal.volume_ratio,
                day_high=quote.day_high,
                day_low=quote.day_low,
                week_52_high=float(metrics.get("week_52_high", 0) or 0) or None,
                week_52_low=float(metrics.get("week_52_low", 0) or 0) or None,
                volatility_baseline=signal.volatility,
                last_updated=quote.timestamp,
                is_stale=quote.is_stale,
                data_age_seconds=data_age
            ))

        items.sort(key=lambda x: x.attention_score, reverse=True)

        tracked_count = len(items)
        avg_dev = round(total_deviation / tracked_count, 2) if tracked_count > 0 else 0.0
        direction = "UP" if avg_dev > 0.05 else ("DOWN" if avg_dev < -0.05 else "FLAT")

        pulse = WatchlistPulseResponse(
            aggregate_deviation_percent=avg_dev,
            direction=direction,
            tracked_count=tracked_count,
            flagged_count=flagged_count,
            critical_count=critical_count,
            high_count=high_count,
            moderate_count=moderate_count,
            normal_count=normal_count,
            volume_anomalies_count=volume_anomalies_count,
            quiet_stocks_count=normal_count,
            last_visit_time=last_visit_time,
            time_since_last_visit_seconds=seconds_away,
            time_since_last_visit_formatted=formatted_away
        )

        # Watchlist Health Calculation
        volatility_meter = min(100, max(15, int(total_volatility_score / max(1, tracked_count))))
        elevated_count = critical_count + high_count
        unusual_meter = min(100, int((elevated_count / max(1, tracked_count)) * 100))
        
        if critical_count >= 2 or unusual_meter >= 60:
            health_context = "SECTOR VOLATILITY ELEVATED"
            summary_health = "Elevated sector dispersion with multiple critical conviction signals active."
        elif elevated_count > 0:
            health_context = "STOCK DIVERGENCE ACTIVE"
            summary_health = "Selective stock-specific moves active against moderate baseline."
        else:
            health_context = "MARKET BENCHMARK CALM"
            summary_health = "Watchlist volatility is low; all tracked symbols within normal boundaries."

        health = WatchlistHealthResponse(
            tracked_count=tracked_count,
            critical_count=critical_count,
            high_count=high_count,
            moderate_count=moderate_count,
            normal_count=normal_count,
            watchlist_volatility_pct=volatility_meter,
            unusual_activity_pct=unusual_meter,
            context_health_status=health_context,
            summary_verdict=summary_health,
            last_evaluated=datetime.now(timezone.utc)
        )

        return WatchlistSummaryResponse(
            watchlist_id=watchlist.id,
            watchlist_name=watchlist.name,
            pulse=pulse,
            health=health,
            items=items
        )

    @staticmethod
    async def get_signals_feed(db: Session, user_id: str = "demo-user-001") -> SignalsListResponse:
        """Fetch all signals ranked by attention score, with Score Breakdown, Market Context, and Lifecycle."""
        user, watchlist = WatchlistService.ensure_demo_user(db, user_id)
        market_service = MarketDataService.get_instance()

        stocks = db.query(WatchlistStock)\
            .filter(WatchlistStock.watchlist_id == watchlist.id)\
            .all()

        last_visit_time, _, _ = SnapshotService.get_user_last_visit(db, user_id)

        symbols = [s.symbol.upper() for s in stocks]
        all_fetch_symbols = list(dict.fromkeys(symbols + ["SPY"]))
        quotes_tasks = [market_service.get_live_quote(sym) for sym in all_fetch_symbols]
        metrics_tasks = [market_service.get_stock_metrics(sym) for sym in symbols]
        
        raw_quotes, metrics_results = await asyncio.gather(
            asyncio.gather(*quotes_tasks),
            asyncio.gather(*metrics_tasks)
        )

        quotes_map: Dict[str, MarketDataResult] = {}
        for idx, sym in enumerate(all_fetch_symbols):
            q = raw_quotes[idx]
            if q:
                quotes_map[sym] = q

        quotes_results = [quotes_map.get(sym) for sym in symbols]

        signals_list: List[SignalDetailResponse] = []
        quiet_count = 0

        for idx, s in enumerate(stocks):
            sym = s.symbol.upper()
            quote = quotes_results[idx]
            metrics = metrics_results[idx]

            if not quote:
                db_snap = SnapshotService.get_latest_snapshot(db, sym)
                if db_snap:
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
                else:
                    quote = market_service.get_fallback_baseline_quote(sym)

            quotes_map[sym] = quote
            last_visit_snap = SnapshotService.get_snapshot_at_or_before(db, sym, last_visit_time) if last_visit_time else None
            last_visit_price = float(last_visit_snap.price) if last_visit_snap else quote.previous_close

            comp_name = s.company_name or sym

            sig: EvaluatedSignal = SignalEngine.evaluate_stock(
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

            # Context & Lifecycle
            context: MarketContextDetail = await MarketContextService.evaluate_context(
                symbol=sym,
                stock_change_percent=quote.change_percent,
                all_quotes=quotes_map,
                is_stale=quote.is_stale
            )

            lifecycle: SignalLifecycleDetail = SignalLifecycleService.get_or_update_lifecycle(
                db=db,
                watchlist_id=watchlist.id,
                symbol=sym,
                attention_score=sig.attention_score,
                primary_reason=sig.primary_reason,
                is_breakout=sig.is_breakout,
                volume_ratio=sig.volume_ratio
            )

            if sig.attention_score < 40:
                quiet_count += 1

            sparkline_data = SnapshotService.get_sparkline_for_symbol(db, sym, quote.price)
            spark_points = [SparklinePoint(timestamp=p["timestamp"], price=p["price"]) for p in sparkline_data]
            why_items = [SignalExplanationPoint(**w) for w in sig.why_structured]

            signals_list.append(SignalDetailResponse(
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
            ))

        signals_list.sort(key=lambda x: x.attention_score, reverse=True)
        top_budget = signals_list[:4]

        return SignalsListResponse(
            total_signals=len(signals_list),
            top_attention_budget=top_budget,
            all_signals=signals_list,
            quiet_stocks_count=quiet_count,
            last_evaluated=datetime.now(timezone.utc)
        )

    @staticmethod
    async def get_watchlist_health(db: Session, user_id: str = "demo-user-001") -> WatchlistHealthResponse:
        """Fetch dedicated Watchlist Health metrics."""
        summary = await WatchlistService.get_watchlist_summary(db, user_id)
        if summary.health:
            return summary.health
        return WatchlistHealthResponse(
            tracked_count=len(summary.items),
            critical_count=summary.pulse.critical_count,
            high_count=summary.pulse.high_count,
            moderate_count=summary.pulse.moderate_count,
            normal_count=summary.pulse.normal_count,
            watchlist_volatility_pct=75,
            unusual_activity_pct=50,
            context_health_status="NORMAL",
            summary_verdict="Watchlist monitored.",
            last_evaluated=datetime.now(timezone.utc)
        )

    @staticmethod
    async def add_stock_to_watchlist(db: Session, symbol: str, company_name: Optional[str] = None, user_id: str = "demo-user-001") -> WatchlistStock:
        """Add ticker to watchlist, persist snapshot, and fetch metadata."""
        user, watchlist = WatchlistService.ensure_demo_user(db, user_id)
        clean_sym = symbol.upper().strip()

        existing = db.query(WatchlistStock)\
            .filter(WatchlistStock.watchlist_id == watchlist.id, WatchlistStock.symbol == clean_sym)\
            .first()
        if existing:
            return existing

        market_service = MarketDataService.get_instance()
        if not company_name:
            company_name = await market_service.get_company_name(clean_sym)

        stock = WatchlistStock(
            watchlist_id=watchlist.id,
            symbol=clean_sym,
            company_name=company_name
        )
        db.add(stock)
        db.commit()
        db.refresh(stock)

        quote = await market_service.get_live_quote(clean_sym)
        if not quote:
            quote = market_service.get_fallback_baseline_quote(clean_sym)
        
        SnapshotService.record_snapshot(db, quote)
        
        return stock

    @staticmethod
    def remove_stock_from_watchlist(db: Session, symbol: str, user_id: str = "demo-user-001") -> bool:
        """Remove stock from user's watchlist."""
        user, watchlist = WatchlistService.ensure_demo_user(db, user_id)
        clean_sym = symbol.upper().strip()

        stock = db.query(WatchlistStock)\
            .filter(WatchlistStock.watchlist_id == watchlist.id, WatchlistStock.symbol == clean_sym)\
            .first()
        if stock:
            db.delete(stock)
            db.commit()
            return True
        return False
