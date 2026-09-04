import logging
import math
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.market import MarketSnapshot, StockMetrics, ChangeEvent
from app.models.user import UserVisit, User
from app.models.watchlist import Watchlist, WatchlistStock
from app.services.market_data import MarketDataResult, MarketDataService
from app.services.signal_engine import SignalEngine, EvaluatedSignal
from app.utils.math_helpers import format_duration_away

logger = logging.getLogger(__name__)

class SnapshotService:

    @staticmethod
    def record_snapshot(db: Session, quote: MarketDataResult) -> MarketSnapshot:
        """Persist a live or fallback market snapshot into MySQL."""
        snapshot = MarketSnapshot(
            symbol=quote.symbol,
            price=quote.price,
            previous_close=quote.previous_close,
            change_amount=quote.change_amount,
            change_percent=quote.change_percent,
            day_high=quote.day_high,
            day_low=quote.day_low,
            open_price=quote.open_price,
            volume=quote.volume,
            timestamp=quote.timestamp,
            source=quote.source,
            is_stale=quote.is_stale
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        return snapshot

    @staticmethod
    def get_latest_snapshot(db: Session, symbol: str) -> Optional[MarketSnapshot]:
        """Fetch the most recent persisted snapshot for a ticker."""
        return db.query(MarketSnapshot)\
            .filter(MarketSnapshot.symbol == symbol.upper())\
            .order_by(desc(MarketSnapshot.timestamp))\
            .first()

    @staticmethod
    def get_snapshot_at_or_before(db: Session, symbol: str, target_time: datetime) -> Optional[MarketSnapshot]:
        """Fetch snapshot for a ticker closest to the user's last checkpoint time."""
        snap = db.query(MarketSnapshot)\
            .filter(
                MarketSnapshot.symbol == symbol.upper(),
                MarketSnapshot.timestamp <= target_time
            )\
            .order_by(desc(MarketSnapshot.timestamp))\
            .first()
        
        # If no older snapshot exists, grab the earliest available snapshot
        if not snap:
            snap = db.query(MarketSnapshot)\
                .filter(MarketSnapshot.symbol == symbol.upper())\
                .order_by(MarketSnapshot.timestamp.asc())\
                .first()
        return snap

    @staticmethod
    def get_user_last_visit(db: Session, user_id: str) -> Tuple[Optional[datetime], int, str]:
        """Retrieve user's last visit timestamp and compute time duration away."""
        visit = db.query(UserVisit)\
            .filter(UserVisit.user_id == user_id)\
            .order_by(desc(UserVisit.visited_at))\
            .first()
        
        if visit:
            visited_at = visit.visited_at
            now = datetime.utcnow()
            seconds_away = max(0, int((now - visited_at).total_seconds()))
            formatted_away = format_duration_away(seconds_away)
            return visited_at, seconds_away, formatted_away
        
        # Default fallback: 4 hours ago for initial visit experience
        default_time = datetime.utcnow() - timedelta(hours=4)
        return default_time, 14400, "4 hours ago"

    @staticmethod
    def record_user_visit(db: Session, user_id: str) -> UserVisit:
        """Record a new visit checkpoint for the user."""
        visit = UserVisit(
            user_id=user_id,
            visited_at=datetime.utcnow()
        )
        db.add(visit)
        db.commit()
        db.refresh(visit)
        return visit

    @staticmethod
    def get_sparkline_for_symbol(db: Session, symbol: str, current_price: float, limit: int = 15) -> List[Dict[str, Any]]:
        """Retrieve actual historical snapshot points from MySQL."""
        snapshots = db.query(MarketSnapshot)\
            .filter(MarketSnapshot.symbol == symbol.upper())\
            .order_by(desc(MarketSnapshot.timestamp))\
            .limit(limit)\
            .all()
        
        points = []
        if snapshots:
            for s in reversed(snapshots):
                points.append({
                    "timestamp": s.timestamp,
                    "price": float(s.price)
                })
        else:
            latest = SnapshotService.get_latest_snapshot(db, symbol)
            if latest:
                points.append({"timestamp": latest.timestamp - timedelta(minutes=5), "price": float(latest.previous_close)})
                points.append({"timestamp": latest.timestamp, "price": float(latest.price)})
            else:
                points.append({"timestamp": datetime.utcnow(), "price": current_price})
        
        return points
