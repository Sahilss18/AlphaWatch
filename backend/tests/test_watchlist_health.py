from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_watchlist_health():
    response = client.get("/api/watchlist/health?user_id=demo-user-001")
    assert response.status_code == 200
    data = response.json()
    assert "tracked_count" in data
    assert "critical_count" in data
    assert "high_count" in data
    assert "moderate_count" in data
    assert "normal_count" in data
    assert "watchlist_volatility_pct" in data
    assert "unusual_activity_pct" in data
    assert "context_health_status" in data
    assert "summary_verdict" in data
    assert 0 <= data["watchlist_volatility_pct"] <= 100
    assert 0 <= data["unusual_activity_pct"] <= 100
