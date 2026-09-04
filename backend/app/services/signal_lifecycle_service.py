import logging
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.market import SignalLifecycle, SignalLifecycleEvent
from app.schemas.signal import SignalLifecycleDetail, SignalTimelineEvent

logger = logging.getLogger(__name__)

class SignalLifecycleService:
    """
    Manages state machine transitions, event persistence, and timeline history for signals.
    Lifecycle: DETECTED -> DEVELOPING -> CONFIRMED -> FADING -> CLOSED
    """

    @staticmethod
    def determine_status(
        current_score: int,
        previous_status: Optional[str] = None,
        is_breakout: bool = False,
        volume_ratio: float = 1.0
    ) -> str:
        """
        Determines the state machine status based on attention score and trend.
        """
        if current_score >= 80:
            if previous_status in ("DEVELOPING", "CONFIRMED") or (is_breakout and volume_ratio >= 1.8):
                return "CONFIRMED"
            return "DEVELOPING"
        elif current_score >= 70:
            if previous_status == "DETECTED":
                return "DEVELOPING"
            elif previous_status == "CONFIRMED":
                return "CONFIRMED"
            return "DEVELOPING"
        elif current_score >= 60:
            if previous_status in ("CONFIRMED", "DEVELOPING"):
                return "FADING"
            return "DETECTED"
        elif current_score >= 40:
            if previous_status in ("CONFIRMED", "DEVELOPING", "FADING"):
                return "FADING"
            return "CLOSED"
        else:
            return "CLOSED"

    @staticmethod
    def get_or_update_lifecycle(
        db: Session,
        watchlist_id: int,
        symbol: str,
        attention_score: int,
        primary_reason: str,
        is_breakout: bool = False,
        volume_ratio: float = 1.0
    ) -> SignalLifecycleDetail:
        sym = symbol.upper().strip()
        now = datetime.now(timezone.utc)

        # 1. Query existing active lifecycle for this symbol & watchlist
        lifecycle = db.query(SignalLifecycle)\
            .filter(SignalLifecycle.watchlist_id == watchlist_id, SignalLifecycle.symbol == sym)\
            .order_by(desc(SignalLifecycle.detected_at))\
            .first()

        previous_status = lifecycle.status if lifecycle else None
        target_status = SignalLifecycleService.determine_status(
            current_score=attention_score,
            previous_status=previous_status,
            is_breakout=is_breakout,
            volume_ratio=volume_ratio
        )

        if not lifecycle:
            # First time signal is recorded
            lifecycle = SignalLifecycle(
                watchlist_id=watchlist_id,
                symbol=sym,
                status=target_status,
                initial_score=attention_score,
                peak_score=attention_score,
                current_score=attention_score,
                detected_at=now,
                updated_at=now,
                closed_at=now if target_status == "CLOSED" else None
            )
            db.add(lifecycle)
            db.commit()
            db.refresh(lifecycle)

            # Insert initial lifecycle event
            event = SignalLifecycleEvent(
                lifecycle_id=lifecycle.id,
                symbol=sym,
                from_status=None,
                to_status=target_status,
                score=attention_score,
                reason=f"Signal {target_status.lower()}: Score {attention_score}",
                timestamp=now
            )
            db.add(event)
            db.commit()

        else:
            # Existing lifecycle found
            if target_status != lifecycle.status:
                old_status = lifecycle.status
                lifecycle.status = target_status
                lifecycle.peak_score = max(lifecycle.peak_score, attention_score)
                lifecycle.current_score = attention_score
                lifecycle.updated_at = now
                if target_status == "CLOSED":
                    lifecycle.closed_at = now

                db.commit()

                # Add state transition event (deduplicated)
                event = SignalLifecycleEvent(
                    lifecycle_id=lifecycle.id,
                    symbol=sym,
                    from_status=old_status,
                    to_status=target_status,
                    score=attention_score,
                    reason=f"Transitioned to {target_status.lower()}: Score {attention_score}",
                    timestamp=now
                )
                db.add(event)
                db.commit()
            else:
                # Deduplication: score update only, no duplicate event logged
                lifecycle.peak_score = max(lifecycle.peak_score, attention_score)
                lifecycle.current_score = attention_score
                lifecycle.updated_at = now
                db.commit()

        # Fetch timeline events for this lifecycle
        events = db.query(SignalLifecycleEvent)\
            .filter(SignalLifecycleEvent.lifecycle_id == lifecycle.id)\
            .order_by(SignalLifecycleEvent.timestamp.asc())\
            .all()

        timeline_items: List[SignalTimelineEvent] = []
        for ev in events:
            timeline_items.append(SignalTimelineEvent(
                status=ev.to_status,
                score=ev.score,
                reason=ev.reason,
                timestamp=ev.timestamp,
                formatted_time=ev.timestamp.strftime("%I:%M %p")
            ))

        # If timeline has only 1 event and signal is CONFIRMED, synthesize previous progression for richness if needed
        since_time = lifecycle.detected_at or now
        formatted_since = since_time.strftime("%I:%M %p")

        return SignalLifecycleDetail(
            current_status=lifecycle.status,
            since_time=since_time,
            formatted_since=formatted_since,
            initial_score=lifecycle.initial_score,
            peak_score=lifecycle.peak_score,
            current_score=lifecycle.current_score,
            timeline=timeline_items
        )
