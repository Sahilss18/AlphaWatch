from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SparklinePoint(BaseModel):
    timestamp: datetime
    price: float

class SignalExplanationPoint(BaseModel):
    point: str
    is_anomaly: bool
    metric_name: str
    observed_value: str
    baseline_value: str

class ScoreBreakdownDetail(BaseModel):
    price_deviation: int = Field(..., description="Points from price deviation (0-40)")
    volume_anomaly: int = Field(..., description="Points from volume expansion (0-25)")
    volatility: int = Field(..., description="Points from standard deviation z-score (0-20)")
    key_level: int = Field(..., description="Points from 52w / channel breakout (0-10)")
    checkpoint: int = Field(..., description="Points from since-last-visit delta (0-5)")
    total: int = Field(..., description="Sum of all score components matching attention_score")
    price_deviation_explanation: str
    volume_anomaly_explanation: str
    volatility_explanation: str
    key_level_explanation: str
    checkpoint_explanation: str

class MarketContextDetail(BaseModel):
    stock_symbol: str
    stock_change_percent: float
    sector_name: str
    sector_change_percent: float
    market_benchmark_name: str
    market_change_percent: float
    classification: str  # STOCK-SPECIFIC, SECTOR-WIDE, MARKET-WIDE, UNKNOWN
    confidence_score: int  # 0 - 100%
    reason: str
    is_stale: bool = False
    data_age_seconds: int = 0

class SignalTimelineEvent(BaseModel):
    status: str  # DETECTED, DEVELOPING, CONFIRMED, FADING, CLOSED
    score: int
    reason: str
    timestamp: datetime
    formatted_time: str

class SignalLifecycleDetail(BaseModel):
    current_status: str  # DETECTED, DEVELOPING, CONFIRMED, FADING, CLOSED
    since_time: datetime
    formatted_since: str
    initial_score: int
    peak_score: int
    current_score: int
    timeline: List[SignalTimelineEvent]

class ExpectedVsActualDetail(BaseModel):
    expected_daily_move_percent: float
    actual_move_percent: float
    deviation_multiple: float
    is_within_expected: bool
    volatility_std_dev: float

class SignalDetailResponse(BaseModel):
    id: Optional[int] = None
    symbol: str
    company_name: str
    signal_type: str  # PRICE_MOVE, VOLUME_ANOMALY, NEW_HIGH, NEW_LOW, BREAKOUT, BREAKDOWN, UNUSUAL_VOLATILITY, GAP_MOVE
    attention_score: int  # 0 - 100
    attention_level: str  # CRITICAL, HIGH, MODERATE, NORMAL
    price: float
    previous_close: float
    percentage_change: float
    absolute_change: float
    since_last_visit_change_percent: Optional[float] = None
    since_last_visit_change_amount: Optional[float] = None
    primary_reason: str
    why_points: List[str]
    why_structured: List[SignalExplanationPoint]
    summary_verdict: str
    
    # Major Upgrades
    score_breakdown: ScoreBreakdownDetail
    market_context: MarketContextDetail
    lifecycle: SignalLifecycleDetail
    expected_vs_actual: ExpectedVsActualDetail
    
    volume: Optional[int] = 0
    average_volume: Optional[int] = 0
    volume_ratio: float
    volatility: float
    is_breakout: bool
    is_52w_high: bool
    is_52w_low: bool
    sparkline: List[SparklinePoint]
    detected_at: datetime
    data_freshness: str  # LIVE, DELAYED, STALE
    is_stale: bool

class SignalsListResponse(BaseModel):
    total_signals: int
    top_attention_budget: List[SignalDetailResponse]
    all_signals: List[SignalDetailResponse]
    quiet_stocks_count: int
    last_evaluated: datetime
