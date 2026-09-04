from fastapi.testclient import TestClient
from app.main import app
from app.services.market_data import MarketDataResult
from app.services.signal_engine import SignalEngine

client = TestClient(app)

def test_stale_signal_flagging():
    sig = SignalEngine.evaluate_stock(
        symbol="TEST",
        company_name="Test Corp",
        current_price=150.0,
        previous_close=148.0,
        is_stale=True,
        data_source="mysql_fallback"
    )
    assert sig.is_stale is True
    assert sig.data_freshness == "STALE"

def test_market_summary_endpoint():
    response = client.get("/api/market/summary")
    assert response.status_code == 200
    data = response.json()
    assert "tickers" in data
    assert len(data["tickers"]) > 0
    assert "market_sentiment" in data

def test_record_visit_checkpoint():
    response = client.post("/api/visit?user_id=demo-user-001")
    assert response.status_code == 200
    data = response.json()
    assert "visited_at" in data
    assert "user_id" in data
    assert data["user_id"] == "demo-user-001"
