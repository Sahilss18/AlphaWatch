from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class HealthResponse(BaseModel):
    status: str
    database: str
    market_api: str
    timestamp: datetime
    version: str

class APIStatusResponse(BaseModel):
    feed_status: str  # LIVE, DELAYED, OFFLINE
    is_live: bool
    is_stale: bool
    last_snapshot_time: Optional[datetime]
    data_age_seconds: int
    data_source: str
    market_open: bool
    message: str
