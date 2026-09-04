from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from app.database import get_db
from app.services.market_data import MarketDataService
from app.schemas.common import HealthResponse, APIStatusResponse

router = APIRouter(tags=["Health & Status"])

@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    # Verify database connection
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    # Market data status
    market_svc = MarketDataService.get_instance()
    market_status = "active" if market_svc.provider else "inactive"

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        database=db_status,
        market_api=market_status,
        timestamp=datetime.utcnow(),
        version="1.0.0"
    )

@router.get("/status", response_model=APIStatusResponse)
def api_status():
    market_svc = MarketDataService.get_instance()
    status_dict = market_svc.get_feed_status()
    return APIStatusResponse(**status_dict)
