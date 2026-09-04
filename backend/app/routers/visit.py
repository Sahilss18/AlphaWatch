from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.config import get_settings
from app.services.snapshot_service import SnapshotService
from app.schemas.visit import VisitRecordRequest, VisitRecordResponse
from app.utils.math_helpers import format_duration_away

router = APIRouter(tags=["User Visits & Checkpoints"])
settings = get_settings()

@router.post("/visit", response_model=VisitRecordResponse)
def record_visit(
    payload: VisitRecordRequest = None,
    user_id: str = Query(default=settings.DEMO_USER_ID),
    db: Session = Depends(get_db)
):
    """
    Record a new visit checkpoint.
    Allows testing 'Since your last visit' by establishing a fresh baseline.
    """
    target_user_id = (payload.user_id if payload and payload.user_id else user_id)
    prev_time, prev_seconds, prev_formatted = SnapshotService.get_user_last_visit(db, target_user_id)
    
    new_visit = SnapshotService.record_user_visit(db, target_user_id)

    return VisitRecordResponse(
        user_id=target_user_id,
        visited_at=new_visit.visited_at,
        previous_visit_at=prev_time,
        seconds_since_last_visit=prev_seconds,
        formatted_duration_away=prev_formatted,
        message=f"New checkpoint recorded at {new_visit.visited_at.isoformat()} UTC."
    )

@router.get("/visit/last")
def get_last_visit(
    user_id: str = Query(default=settings.DEMO_USER_ID),
    db: Session = Depends(get_db)
):
    """Retrieve the user's previous visit time and away duration."""
    last_time, seconds_away, formatted_away = SnapshotService.get_user_last_visit(db, user_id)
    return {
        "user_id": user_id,
        "last_visit_at": last_time,
        "seconds_since_last_visit": seconds_away,
        "formatted_duration_away": formatted_away
    }
