from fastapi.testclient import TestClient
from app.main import app
from app.services.signal_engine import SignalEngine

client = TestClient(app)

def test_get_signals_with_differentiators():
    response = client.get("/api/signals?user_id=demo-user-001")
    assert response.status_code == 200
    data = response.json()
    assert "total_signals" in data
    assert "top_attention_budget" in data
    assert "all_signals" in data
    assert len(data["all_signals"]) > 0

    first_sig = data["all_signals"][0]
    assert "symbol" in first_sig
    assert "attention_score" in first_sig
    assert "primary_reason" in first_sig
    assert "why_points" in first_sig
    assert len(first_sig["why_points"]) >= 2
    assert "sparkline" in first_sig

    # Verify Major Product Differentiators
    assert "score_breakdown" in first_sig
    sb = first_sig["score_breakdown"]
    assert "price_deviation" in sb
    assert "volume_anomaly" in sb
    assert "volatility" in sb
    assert "key_level" in sb
    assert "checkpoint" in sb
    assert sb["total"] == first_sig["attention_score"]

    assert "market_context" in first_sig
    mc = first_sig["market_context"]
    assert mc["classification"] in ["STOCK-SPECIFIC", "SECTOR-WIDE", "MARKET-WIDE", "UNKNOWN"]
    assert 0 <= mc["confidence_score"] <= 100

    assert "lifecycle" in first_sig
    lc = first_sig["lifecycle"]
    assert lc["current_status"] in ["DETECTED", "DEVELOPING", "CONFIRMED", "FADING", "CLOSED"]

    assert "expected_vs_actual" in first_sig
    eva = first_sig["expected_vs_actual"]
    assert "expected_daily_move_percent" in eva
    assert "actual_move_percent" in eva
    assert "deviation_multiple" in eva

def test_symbol_sub_endpoints():
    sym = "NVDA"
    # Lifecycle endpoint
    res_lc = client.get(f"/api/signals/{sym}/lifecycle?user_id=demo-user-001")
    assert res_lc.status_code == 200
    assert "current_status" in res_lc.json()

    # Context endpoint
    res_ctx = client.get(f"/api/signals/{sym}/context?user_id=demo-user-001")
    assert res_ctx.status_code == 200
    assert "classification" in res_ctx.json()

    # Score breakdown endpoint
    res_sb = client.get(f"/api/signals/{sym}/score-breakdown?user_id=demo-user-001")
    assert res_sb.status_code == 200
    assert "total" in res_sb.json()

def test_adaptive_volatility_scoring():
    # Stock A: High baseline volatility (6%), moves 4% -> Should be lower attention / normal
    sig_a = SignalEngine.evaluate_stock(
        symbol="STKA",
        company_name="Stock A High Vol",
        current_price=104.0,
        previous_close=100.0,
        metrics={"volatility_daily": 6.0, "average_volume_10d": 10000000}
    )

    # Stock B: Low baseline volatility (1%), moves 4% -> Should be high attention / breakout
    sig_b = SignalEngine.evaluate_stock(
        symbol="STKB",
        company_name="Stock B Low Vol",
        current_price=104.0,
        previous_close=100.0,
        metrics={"volatility_daily": 1.0, "average_volume_10d": 10000000}
    )

    # Stock B's attention score should be higher because a 4% move on 1% normal vol is significant (4-sigma)
    assert sig_b.attention_score > sig_a.attention_score
    assert sig_b.attention_level in ["CRITICAL", "HIGH"]
