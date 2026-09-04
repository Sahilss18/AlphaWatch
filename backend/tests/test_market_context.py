import asyncio
from unittest.mock import patch
from app.services.market_context import MarketContextService
from app.services.market_data import MarketDataResult

def test_stock_specific_classification():
    """Stock moves -5.2%, Sector moves +0.2%, Market moves +0.4% -> STOCK-SPECIFIC."""
    quotes = {
        "NVDA": MarketDataResult("NVDA", 100.0, 105.48, -5.48, -5.2),
        "AMD": MarketDataResult("AMD", 100.0, 99.8, 0.2, 0.2),
        "ARM": MarketDataResult("ARM", 100.0, 99.8, 0.2, 0.2),
        "SPY": MarketDataResult("SPY", 500.0, 498.0, 2.0, 0.4)
    }

    ctx = asyncio.run(MarketContextService.evaluate_context(
        symbol="NVDA",
        stock_change_percent=-5.2,
        all_quotes=quotes
    ))

    assert ctx.classification == "STOCK-SPECIFIC"
    assert ctx.confidence_score >= 70
    assert "NVDA" in ctx.reason
    assert "underperforming" in ctx.reason or "significantly" in ctx.reason

def test_sector_wide_classification():
    """Stock moves -5.2%, Sector moves -4.7%, Market moves -0.8% -> SECTOR-WIDE."""
    quotes = {
        "NVDA": MarketDataResult("NVDA", 100.0, 105.48, -5.48, -5.2),
        "AMD": MarketDataResult("AMD", 100.0, 104.7, -4.7, -4.7),
        "ARM": MarketDataResult("ARM", 100.0, 104.7, -4.7, -4.7),
        "SPY": MarketDataResult("SPY", 500.0, 504.0, -4.0, -0.8)
    }

    ctx = asyncio.run(MarketContextService.evaluate_context(
        symbol="NVDA",
        stock_change_percent=-5.2,
        all_quotes=quotes
    ))

    assert ctx.classification == "SECTOR-WIDE"
    assert ctx.confidence_score >= 70
    assert "in line with" in ctx.reason

def test_market_wide_classification():
    """Stock moves -3.1%, Sector moves -3.5%, Market moves -3.0% -> MARKET-WIDE."""
    quotes = {
        "NVDA": MarketDataResult("NVDA", 100.0, 103.2, -3.2, -3.1),
        "AMD": MarketDataResult("AMD", 100.0, 103.5, -3.5, -3.5),
        "ARM": MarketDataResult("ARM", 100.0, 103.5, -3.5, -3.5),
        "SPY": MarketDataResult("SPY", 500.0, 515.5, -15.5, -3.0)
    }

    ctx = asyncio.run(MarketContextService.evaluate_context(
        symbol="NVDA",
        stock_change_percent=-3.1,
        all_quotes=quotes
    ))

    assert ctx.classification == "MARKET-WIDE"
    assert ctx.confidence_score >= 65
    assert "broadly aligned" in ctx.reason

def test_unknown_context_insufficient_data():
    """When no quotes or benchmark data exist -> Valid classification returned."""
    ctx = asyncio.run(MarketContextService.evaluate_context(
        symbol="UNKNOWN_SYM",
        stock_change_percent=2.5,
        all_quotes={}
    ))
    assert ctx.classification in ["UNKNOWN", "STOCK-SPECIFIC", "SECTOR-WIDE", "MARKET-WIDE"]
    assert 0 <= ctx.confidence_score <= 100

def test_stale_contextual_data_penalty():
    """When contextual data is stale (>600s), confidence score is reduced."""
    quotes = {
        "NVDA": MarketDataResult("NVDA", 100.0, 105.0, -5.0, -5.0, is_stale=True),
        "SPY": MarketDataResult("SPY", 500.0, 500.0, 0.0, 0.0, is_stale=True)
    }

    ctx = asyncio.run(MarketContextService.evaluate_context(
        symbol="NVDA",
        stock_change_percent=-5.0,
        all_quotes=quotes,
        is_stale=True,
        data_age_seconds=800
    ))

    assert ctx.is_stale is True
    assert ctx.confidence_score <= 75
