import pytest
from app.services.signal_engine import SignalEngine

def test_score_breakdown_components_sum_correctly():
    """Verify that the 5 score breakdown components add up exactly to the attention_score."""
    for pct, vol in [(5.8, 2.1), (0.4, 1.8), (12.5, 3.5), (-8.2, 1.5), (0.0, 2.0)]:
        sig = SignalEngine.evaluate_stock(
            symbol="NVDA",
            company_name="NVIDIA Corp",
            current_price=100.0 * (1.0 + pct / 100.0),
            previous_close=100.0,
            metrics={"volatility_daily": vol, "average_volume_10d": 50000000}
        )

        breakdown = sig.score_breakdown
        assert breakdown is not None
        sum_components = (
            breakdown.price_deviation +
            breakdown.volume_anomaly +
            breakdown.volatility +
            breakdown.key_level +
            breakdown.checkpoint
        )
        assert sum_components == breakdown.total
        assert breakdown.total == sig.attention_score
        assert 5 <= sig.attention_score <= 99

def test_score_breakdown_explanations():
    """Verify human-readable explanations are generated dynamically."""
    sig = SignalEngine.evaluate_stock(
        symbol="NVDA",
        company_name="NVIDIA Corp",
        current_price=94.20,
        previous_close=100.0,
        metrics={"volatility_daily": 2.1, "average_volume_10d": 40000000}
    )
    b = sig.score_breakdown
    assert len(b.price_deviation_explanation) > 0
    assert len(b.volume_anomaly_explanation) > 0
    assert len(b.volatility_explanation) > 0
    assert len(b.key_level_explanation) > 0
    assert len(b.checkpoint_explanation) > 0
