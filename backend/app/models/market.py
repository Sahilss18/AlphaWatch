from sqlalchemy import Column, String, DateTime, Integer, Numeric, BigInteger, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False, index=True)
    price = Column(Numeric(14, 4), nullable=False)
    previous_close = Column(Numeric(14, 4), nullable=False)
    change_amount = Column(Numeric(14, 4), nullable=False)
    change_percent = Column(Numeric(8, 4), nullable=False)
    day_high = Column(Numeric(14, 4), nullable=True)
    day_low = Column(Numeric(14, 4), nullable=True)
    open_price = Column(Numeric(14, 4), nullable=True)
    volume = Column(BigInteger, nullable=True, default=0)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    source = Column(String(50), nullable=False, default="finnhub")
    is_stale = Column(Boolean, nullable=False, default=False)

class StockMetrics(Base):
    __tablename__ = "stock_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False, unique=True, index=True)
    sector = Column(String(100), nullable=True)
    average_volume = Column(BigInteger, nullable=True, default=0)
    volatility = Column(Numeric(8, 4), nullable=True, default=1.8000)  # typical % daily standard dev
    week_52_high = Column(Numeric(14, 4), nullable=True)
    week_52_low = Column(Numeric(14, 4), nullable=True)
    resistance_level = Column(Numeric(14, 4), nullable=True)
    support_level = Column(Numeric(14, 4), nullable=True)
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

class ChangeEvent(Base):
    __tablename__ = "change_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)  # PRICE_MOVE, VOLUME_ANOMALY, NEW_HIGH, NEW_LOW, BREAKOUT, BREAKDOWN, UNUSUAL_VOLATILITY, GAP_MOVE
    old_value = Column(Numeric(14, 4), nullable=True)
    new_value = Column(Numeric(14, 4), nullable=True)
    percentage_change = Column(Numeric(8, 4), nullable=False)
    attention_score = Column(Integer, nullable=False, index=True)
    attention_level = Column(String(20), nullable=False)  # CRITICAL, HIGH, MODERATE, NORMAL
    reason = Column(Text, nullable=False)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    watchlist = relationship("Watchlist", back_populates="change_events")

class SignalLifecycle(Base):
    __tablename__ = "signal_lifecycles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="DETECTED")  # DETECTED, DEVELOPING, CONFIRMED, FADING, CLOSED
    initial_score = Column(Integer, nullable=False)
    peak_score = Column(Integer, nullable=False)
    current_score = Column(Integer, nullable=False)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    closed_at = Column(DateTime, nullable=True)

    events = relationship("SignalLifecycleEvent", back_populates="lifecycle", cascade="all, delete-orphan", order_by="SignalLifecycleEvent.timestamp.desc()")

class SignalLifecycleEvent(Base):
    __tablename__ = "signal_lifecycle_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lifecycle_id = Column(Integer, ForeignKey("signal_lifecycles.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    from_status = Column(String(30), nullable=True)
    to_status = Column(String(30), nullable=False)
    score = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    lifecycle = relationship("SignalLifecycle", back_populates="events")
