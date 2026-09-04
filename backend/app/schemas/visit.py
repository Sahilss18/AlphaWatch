from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VisitRecordRequest(BaseModel):
    user_id: Optional[str] = None

class VisitRecordResponse(BaseModel):
    user_id: str
    visited_at: datetime
    previous_visit_at: Optional[datetime] = None
    seconds_since_last_visit: int
    formatted_duration_away: str
    message: str
