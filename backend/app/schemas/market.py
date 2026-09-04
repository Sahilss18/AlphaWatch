from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TickerMarqueeItem(BaseModel):
    symbol: str
    price: float
    change_percent: float
    change_amount: float
    direction: str  # positive, negative, neutral
    attention_score: int

class MarketSearchResultItem(BaseModel):
    symbol: str
    description: str
    type: str
    display_symbol: str

class MarketSummaryResponse(BaseModel):
    total_tracked: int
    tickers: List[TickerMarqueeItem]
    gainers_count: int
    losers_count: int
    unchanged_count: int
    market_sentiment: str  # BULLISH, BEARISH, MIXED
    average_change_percent: float
    last_updated: datetime

class StockHistorySnapshot(BaseModel):
    id: int
    price: float
    previous_close: float
    change_percent: float
    volume: Optional[int] = 0
    timestamp: datetime
    is_stale: bool

class StockHistoryResponse(BaseModel):
    symbol: str
    company_name: str
    current_price: float
    previous_close: Optional[float] = None
    day_change_percent: Optional[float] = None
    last_visit_price: Optional[float] = None
    since_last_visit_change_percent: Optional[float] = None
    historical_snapshots: List[StockHistorySnapshot]
    volatility: float
    average_volume: int
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
