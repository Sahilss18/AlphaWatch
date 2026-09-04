import httpx
import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from app.config import get_settings

logger = logging.getLogger(__name__)

class MarketDataResult:
    def __init__(
        self,
        symbol: str,
        price: float,
        previous_close: float,
        change_amount: float,
        change_percent: float,
        day_high: Optional[float] = None,
        day_low: Optional[float] = None,
        open_price: Optional[float] = None,
        volume: Optional[int] = 0,
        timestamp: Optional[datetime] = None,
        is_stale: bool = False,
        source: str = "finnhub"
    ):
        self.symbol = symbol.upper()
        self.price = round(price, 4)
        self.previous_close = round(previous_close, 4)
        self.change_amount = round(change_amount, 4)
        self.change_percent = round(change_percent, 4)
        self.day_high = round(day_high, 4) if day_high is not None else None
        self.day_low = round(day_low, 4) if day_low is not None else None
        self.open_price = round(open_price, 4) if open_price is not None else None
        self.volume = volume or 0
        self.timestamp = timestamp or datetime.utcnow()
        self.is_stale = is_stale
        self.source = source

class BaseMarketDataProvider:
    """Interface for market data providers."""
    async def get_quote(self, symbol: str) -> Optional[MarketDataResult]:
        raise NotImplementedError
        
    async def get_company_profile(self, symbol: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    async def get_metrics(self, symbol: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    async def search_symbols(self, query: str) -> List[Dict[str, str]]:
        raise NotImplementedError

class FinnhubMarketDataProvider(BaseMarketDataProvider):
    """Real market data provider implementation using Finnhub REST API."""

    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.client = httpx.AsyncClient(timeout=8.0)
        self.last_successful_call: Optional[datetime] = None
        self.last_api_error: Optional[str] = None
        self.is_connected: bool = False

    async def get_quote(self, symbol: str) -> Optional[MarketDataResult]:
        symbol = symbol.upper().strip()
        url = f"{self.base_url}/quote"
        params = {"symbol": symbol, "token": self.api_key}

        try:
            resp = await self.client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                # Finnhub returns {'c': 0, 'd': null, ...} for invalid/non-existent symbols
                current_price = float(data.get("c", 0) or 0)
                prev_close = float(data.get("pc", 0) or 0)
                
                if current_price > 0 and prev_close > 0:
                    change_amount = float(data.get("d", 0) or (current_price - prev_close))
                    change_percent = float(data.get("dp", 0) or ((change_amount / prev_close) * 100))
                    
                    self.last_successful_call = datetime.utcnow()
                    self.is_connected = True
                    self.last_api_error = None

                    return MarketDataResult(
                        symbol=symbol,
                        price=current_price,
                        previous_close=prev_close,
                        change_amount=change_amount,
                        change_percent=change_percent,
                        day_high=float(data.get("h", current_price)),
                        day_low=float(data.get("l", current_price)),
                        open_price=float(data.get("o", prev_close)),
                        volume=0,  # Quote endpoint doesn't return day volume; filled via metrics or snapshot
                        timestamp=datetime.utcnow(),
                        is_stale=False,
                        source="finnhub_live"
                    )
                else:
                    logger.warning(f"Finnhub returned empty/zero quote for {symbol}: {data}")
            else:
                self.last_api_error = f"HTTP {resp.status_code}: {resp.text}"
                logger.error(f"Finnhub quote API error for {symbol}: {self.last_api_error}")
        except Exception as e:
            self.last_api_error = str(e)
            logger.error(f"Exception fetching quote for {symbol}: {e}")
        
        return None

    async def get_company_profile(self, symbol: str) -> Optional[Dict[str, Any]]:
        symbol = symbol.upper().strip()
        url = f"{self.base_url}/stock/profile2"
        params = {"symbol": symbol, "token": self.api_key}

        try:
            resp = await self.client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                if data and "name" in data:
                    return {
                        "symbol": symbol,
                        "name": data.get("name") or symbol,
                        "industry": data.get("finnhubIndustry", "Technology"),
                        "market_cap": data.get("marketCapitalization", 0),
                        "logo": data.get("logo", ""),
                        "currency": data.get("currency", "USD")
                    }
        except Exception as e:
            logger.warning(f"Could not fetch profile for {symbol}: {e}")
        return None

    async def get_metrics(self, symbol: str) -> Optional[Dict[str, Any]]:
        symbol = symbol.upper().strip()
        url = f"{self.base_url}/stock/metric"
        params = {"symbol": symbol, "metric": "all", "token": self.api_key}

        try:
            resp = await self.client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                metrics = data.get("metric", {})
                raw_vol = float(metrics.get("3MonthADReturnStd", 0) or 0)
                if raw_vol > 10.0:
                    daily_vol = round(raw_vol / 15.8745, 2)  # annualized / sqrt(252)
                elif raw_vol > 0.0:
                    daily_vol = round(raw_vol, 2)
                else:
                    daily_vol = 2.0

                return {
                    "average_volume_10d": int(metrics.get("10DayAverageTradingVolume", 0) * 1000000 if metrics.get("10DayAverageTradingVolume") else 0),
                    "average_volume_3m": int(metrics.get("3MonthAverageTradingVolume", 0) * 1000000 if metrics.get("3MonthAverageTradingVolume") else 0),
                    "week_52_high": float(metrics.get("52WeekHigh", 0) or 0),
                    "week_52_low": float(metrics.get("52WeekLow", 0) or 0),
                    "volatility_daily": daily_vol,
                }
        except Exception as e:
            logger.warning(f"Could not fetch metrics for {symbol}: {e}")
        return None

    async def search_symbols(self, query: str) -> List[Dict[str, str]]:
        if not query or len(query.strip()) < 1:
            return []
        url = f"{self.base_url}/search"
        params = {"q": query.strip().upper(), "token": self.api_key}

        try:
            resp = await self.client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data.get("result", [])[:10]:
                    sym = item.get("symbol", "")
                    # Filter for clean tickers without complicated sub-dots if possible
                    if "." not in sym or len(results) < 5:
                        results.append({
                            "symbol": sym,
                            "description": item.get("description", sym),
                            "type": item.get("type", "Common Stock"),
                            "display_symbol": item.get("displaySymbol", sym)
                        })
                return results
        except Exception as e:
            logger.error(f"Error searching symbols for '{query}': {e}")
        return []

class MarketDataService:
    """High level service coordinating providers, cache, and fallbacks."""

    _instance = None

    def __init__(self):
        settings = get_settings()
        self.provider: BaseMarketDataProvider = FinnhubMarketDataProvider(
            api_key=settings.MARKET_API_KEY,
            base_url=settings.MARKET_API_URL
        )
        self.quote_cache: Dict[str, Dict[str, Any]] = {}
        self.profile_cache: Dict[str, Dict[str, Any]] = {}
        self.metrics_cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl_seconds = 30  # 30-second quote cache for performance and rate limit protection

    @classmethod
    def get_instance(cls) -> 'MarketDataService':
        if cls._instance is None:
            cls._instance = MarketDataService()
        return cls._instance

    async def get_live_quote(self, symbol: str) -> Optional[MarketDataResult]:
        symbol = symbol.upper().strip()
        now = time.time()

        # Check in-memory cache
        if symbol in self.quote_cache:
            entry = self.quote_cache[symbol]
            if (now - entry["cached_at"]) < self.cache_ttl_seconds:
                return entry["result"]

        # Call real market API provider
        result = await self.provider.get_quote(symbol)
        if result:
            self.quote_cache[symbol] = {
                "cached_at": now,
                "result": result
            }
            return result
        
        # If live call fails, check expired cache
        if symbol in self.quote_cache:
            stale_entry = self.quote_cache[symbol]["result"]
            stale_entry.is_stale = True
            stale_entry.source = "cache_fallback"
            return stale_entry

        return None

    async def get_company_name(self, symbol: str) -> str:
        symbol = symbol.upper().strip()
        if symbol in self.profile_cache:
            return self.profile_cache[symbol].get("name", symbol)

        profile = await self.provider.get_company_profile(symbol)
        if profile and profile.get("name"):
            self.profile_cache[symbol] = profile
            return profile["name"]
        
        # Well known defaults fallback
        defaults = {
            "NVDA": "NVIDIA Corporation",
            "AAPL": "Apple Inc.",
            "PLTR": "Palantir Technologies Inc.",
            "MSFT": "Microsoft Corporation",
            "SMCI": "Super Micro Computer Inc.",
            "ARM": "Arm Holdings plc",
            "TSLA": "Tesla Inc.",
            "AMD": "Advanced Micro Devices Inc.",
            "COIN": "Coinbase Global Inc.",
            "META": "Meta Platforms Inc.",
            "GOOGL": "Alphabet Inc.",
            "AVGO": "Broadcom Inc."
        }
        return defaults.get(symbol, symbol)

    async def get_stock_metrics(self, symbol: str) -> Dict[str, Any]:
        symbol = symbol.upper().strip()
        if symbol in self.metrics_cache:
            return self.metrics_cache[symbol]

        metrics = await self.provider.get_metrics(symbol)
        if metrics:
            self.metrics_cache[symbol] = metrics
            return metrics
        
        # Default baseline if metrics endpoint unavailable
        defaults = {
            "NVDA": {"volatility_daily": 2.45, "average_volume_10d": 48500000, "week_52_high": 235.0, "week_52_low": 85.0},
            "AAPL": {"volatility_daily": 1.25, "average_volume_10d": 55000000, "week_52_high": 245.0, "week_52_low": 165.0},
            "PLTR": {"volatility_daily": 3.80, "average_volume_10d": 62000000, "week_52_high": 75.0, "week_52_low": 20.0},
            "MSFT": {"volatility_daily": 1.15, "average_volume_10d": 22000000, "week_52_high": 468.0, "week_52_low": 385.0},
            "SMCI": {"volatility_daily": 5.60, "average_volume_10d": 18000000, "week_52_high": 122.0, "week_52_low": 18.0},
            "ARM":  {"volatility_daily": 3.20, "average_volume_10d": 14000000, "week_52_high": 188.0, "week_52_low": 95.0},
            "TSLA": {"volatility_daily": 3.40, "average_volume_10d": 85000000, "week_52_high": 360.0, "week_52_low": 138.0},
            "AMD":  {"volatility_daily": 2.75, "average_volume_10d": 52000000, "week_52_high": 185.0, "week_52_low": 115.0},
            "COIN": {"volatility_daily": 4.50, "average_volume_10d": 12000000, "week_52_high": 340.0, "week_52_low": 140.0},
        }
        res = defaults.get(symbol, {"volatility_daily": 2.0, "average_volume_10d": 15000000, "week_52_high": 200.0, "week_52_low": 100.0})
        self.metrics_cache[symbol] = res
        return res

    async def search(self, query: str) -> List[Dict[str, str]]:
        return await self.provider.search_symbols(query)

    def get_feed_status(self) -> Dict[str, Any]:
        if isinstance(self.provider, FinnhubMarketDataProvider):
            last_call = self.provider.last_successful_call
            if last_call:
                age = (datetime.utcnow() - last_call).total_seconds()
                if age < 120:
                    return {
                        "feed_status": "LIVE",
                        "is_live": True,
                        "is_stale": False,
                        "last_snapshot_time": last_call,
                        "data_age_seconds": int(age),
                        "data_source": "Finnhub Live Market Stream",
                        "market_open": True,
                        "message": "Live feed connected and active"
                    }
                elif age < 900:
                    return {
                        "feed_status": "DELAYED",
                        "is_live": False,
                        "is_stale": True,
                        "last_snapshot_time": last_call,
                        "data_age_seconds": int(age),
                        "data_source": "Finnhub Cached Snapshot",
                        "market_open": False,
                        "message": f"Data delayed — last received {int(age//60)} minutes ago"
                    }
            
            return {
                "feed_status": "OFFLINE",
                "is_live": False,
                "is_stale": True,
                "last_snapshot_time": last_call,
                "data_age_seconds": int((datetime.utcnow() - last_call).total_seconds()) if last_call else 9999,
                "data_source": "Database Fallback Snapshots",
                "market_open": False,
                "message": "Market feed unavailable. Serving persisted local snapshots."
            }
        
        return {
            "feed_status": "OFFLINE",
            "is_live": False,
            "is_stale": True,
            "last_snapshot_time": None,
            "data_age_seconds": 9999,
            "data_source": "None",
            "market_open": False,
            "message": "No market provider configured"
        }
