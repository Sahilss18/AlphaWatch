from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class WatchlistStockCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20, description="Stock ticker symbol (e.g. NVDA)")
    company_name: Optional[str] = Field(None, description="Optional company name override")

class WatchlistItemResponse(BaseModel):
    symbol: str
    name: str
    price: float
    previous_close: float
    change_amount: float
    change_percent: float
    since_last_visit_price: Optional[float] = None
    since_last_visit_change_percent: Optional[float] = None
    since_last_visit_change_amount: Optional[float] = None
    attention_score: int
    attention_level: str  # CRITICAL, HIGH, MODERATE, NORMAL
    signals: List[str]
    context_classification: Optional[str] = "STOCK-SPECIFIC"
    lifecycle_status: Optional[str] = "CONFIRMED"
    volume: Optional[int] = 0
    average_volume: Optional[int] = 0
    volume_ratio: Optional[float] = 1.0
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    volatility_baseline: Optional[float] = 1.8
    last_updated: datetime
    is_stale: bool
    data_age_seconds: int

class WatchlistPulseResponse(BaseModel):
    aggregate_deviation_percent: float
    direction: str  # UP, DOWN, FLAT
    tracked_count: int
    flagged_count: int
    critical_count: int
    high_count: int
    moderate_count: int
    normal_count: int
    volume_anomalies_count: int
    quiet_stocks_count: int
    last_visit_time: Optional[datetime] = None
    time_since_last_visit_seconds: int
    time_since_last_visit_formatted: str

class WatchlistHealthResponse(BaseModel):
    tracked_count: int
    critical_count: int
    high_count: int
    moderate_count: int
    normal_count: int
    watchlist_volatility_pct: int
    unusual_activity_pct: int
    context_health_status: str
    summary_verdict: str
    last_evaluated: datetime

class WatchlistSummaryResponse(BaseModel):
    watchlist_id: int
    watchlist_name: str
    pulse: WatchlistPulseResponse
    health: Optional[WatchlistHealthResponse] = None
    items: List[WatchlistItemResponse]
