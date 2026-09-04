import pytest
from app.database import SessionLocal
from app.services.signal_lifecycle_service import SignalLifecycleService
from app.models.market import SignalLifecycle, SignalLifecycleEvent
from app.services.watchlist_service import WatchlistService

def test_lifecycle_state_transitions_and_deduplication():
    db = SessionLocal()
    try:
        user, watchlist = WatchlistService.ensure_demo_user(db, "demo-user-001")
        test_sym = "NVDA_TEST_LIFECYCLE"

        # 1. DETECTED state (score 62)
        lc1 = SignalLifecycleService.get_or_update_lifecycle(
            db=db,
            watchlist_id=watchlist.id,
            symbol=test_sym,
            attention_score=62,
            primary_reason="Initial anomaly detected"
        )
        assert lc1.current_status == "DETECTED"
        assert lc1.current_score == 62
        assert len(lc1.timeline) >= 1

        # 2. DEVELOPING state (score rises to 74)
        lc2 = SignalLifecycleService.get_or_update_lifecycle(
            db=db,
            watchlist_id=watchlist.id,
            symbol=test_sym,
            attention_score=74,
            primary_reason="Movement accelerates"
        )
        assert lc2.current_status == "DEVELOPING"
        assert lc2.current_score == 74

        # 3. CONFIRMED state (score rises to 91 with breakout)
        lc3 = SignalLifecycleService.get_or_update_lifecycle(
            db=db,
            watchlist_id=watchlist.id,
            symbol=test_sym,
            attention_score=91,
            primary_reason="Multiple indicators agree with high volume",
            is_breakout=True,
            volume_ratio=2.5
        )
        assert lc3.current_status == "CONFIRMED"
        assert lc3.peak_score == 91

        # 4. Deduplication: Same score 91 and confirmed state should NOT create duplicate events
        events_before = len(lc3.timeline)
        lc3_repeat = SignalLifecycleService.get_or_update_lifecycle(
            db=db,
            watchlist_id=watchlist.id,
            symbol=test_sym,
            attention_score=91,
            primary_reason="Score unchanged"
        )
        assert len(lc3_repeat.timeline) == events_before

        # 5. FADING state (score drops to 52)
        lc4 = SignalLifecycleService.get_or_update_lifecycle(
            db=db,
            watchlist_id=watchlist.id,
            symbol=test_sym,
            attention_score=52,
            primary_reason="Momentum waning"
        )
        assert lc4.current_status == "FADING"

        # 6. CLOSED state (score decays to 22)
        lc5 = SignalLifecycleService.get_or_update_lifecycle(
            db=db,
            watchlist_id=watchlist.id,
            symbol=test_sym,
            attention_score=22,
            primary_reason="Normal baseline restored"
        )
        assert lc5.current_status == "CLOSED"

        # Clean up test rows
        db.query(SignalLifecycleEvent).filter(SignalLifecycleEvent.symbol == test_sym).delete()
        db.query(SignalLifecycle).filter(SignalLifecycle.symbol == test_sym).delete()
        db.commit()

    finally:
        db.close()
