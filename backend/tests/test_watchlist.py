from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_watchlist():
    response = client.get("/api/watchlist?user_id=demo-user-001")
    assert response.status_code == 200
    data = response.json()
    assert "pulse" in data
    assert "items" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) > 0
    first_item = data["items"][0]
    assert "symbol" in first_item
    assert "price" in first_item
    assert "attention_score" in first_item
    assert "attention_level" in first_item

def test_add_and_remove_ticker():
    test_symbol = "INTC"
    
    # 1. Add Ticker
    add_resp = client.post("/api/watchlist?user_id=demo-user-001", json={
        "symbol": test_symbol,
        "company_name": "Intel Corporation"
    })
    assert add_resp.status_code in [200, 201]
    assert add_resp.json()["symbol"] == test_symbol

    # 2. Verify ticker in watchlist
    get_resp = client.get("/api/watchlist?user_id=demo-user-001")
    assert get_resp.status_code == 200
    symbols = [item["symbol"] for item in get_resp.json()["items"]]
    assert test_symbol in symbols

    # 3. Remove Ticker
    del_resp = client.delete(f"/api/watchlist/{test_symbol}?user_id=demo-user-001")
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

    # 4. Verify removed
    get_resp_after = client.get("/api/watchlist?user_id=demo-user-001")
    symbols_after = [item["symbol"] for item in get_resp_after.json()["items"]]
    assert test_symbol not in symbols_after

def test_remove_invalid_ticker():
    del_resp = client.delete("/api/watchlist/NONEXISTENT999?user_id=demo-user-001")
    assert del_resp.status_code == 404
