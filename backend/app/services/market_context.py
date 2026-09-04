import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.market_data import MarketDataService, MarketDataResult
from app.schemas.signal import MarketContextDetail

logger = logging.getLogger(__name__)

SECTOR_MAP = {
    # Semiconductors
    "NVDA": "Semiconductors",
    "AMD": "Semiconductors",
    "ARM": "Semiconductors",
    "SMCI": "Semiconductors",
    "AVGO": "Semiconductors",
    "INTC": "Semiconductors",
    "TSM": "Semiconductors",
    "MU": "Semiconductors",
    "QCOM": "Semiconductors",
    
    # Mega-Cap Tech
    "AAPL": "Mega-Cap Tech",
    "MSFT": "Mega-Cap Tech",
    "GOOGL": "Mega-Cap Tech",
    "GOOG": "Mega-Cap Tech",
    "META": "Mega-Cap Tech",
    "AMZN": "Mega-Cap Tech",
    
    # Automotive & EV
    "TSLA": "Automotive & EV",
    "RIVN": "Automotive & EV",
    "LCID": "Automotive & EV",
    "F": "Automotive & EV",
    "GM": "Automotive & EV",
    
    # Enterprise Software & AI
    "PLTR": "Enterprise Software & AI",
    "SNOW": "Enterprise Software & AI",
    "AI": "Enterprise Software & AI",
    "CRM": "Enterprise Software & AI",
    "ORCL": "Enterprise Software & AI",
    "PATH": "Enterprise Software & AI",
    
    # Fintech & Crypto
    "COIN": "Fintech & Crypto",
    "MARA": "Fintech & Crypto",
    "RIOT": "Fintech & Crypto",
    "MSTR": "Fintech & Crypto",
    "HOOD": "Fintech & Crypto"
}

class MarketContextService:
    """
    Evaluates contextual market dynamics: Stock-Specific vs Sector-Wide vs Market-Wide.
    """

    @staticmethod
    def get_sector_for_symbol(symbol: str, industry_fallback: Optional[str] = None) -> str:
        sym = symbol.upper().strip()
        if sym in SECTOR_MAP:
            return SECTOR_MAP[sym]
        if industry_fallback and len(industry_fallback.strip()) > 0:
            return industry_fallback.strip()
        return "General Equities"

    @staticmethod
    async def evaluate_context(
        symbol: str,
        stock_change_percent: float,
        all_quotes: Optional[Dict[str, MarketDataResult]] = None,
        is_stale: bool = False,
        data_age_seconds: int = 0
    ) -> MarketContextDetail:
        sym = symbol.upper().strip()
        market_service = MarketDataService.get_instance()
        
        # 1. Determine Sector
        sector_name = MarketContextService.get_sector_for_symbol(sym)

        # 2. Fetch or lookup Market Benchmark (S&P 500 via SPY quote)
        spy_quote = None
        if all_quotes and "SPY" in all_quotes:
            spy_quote = all_quotes["SPY"]
        else:
            try:
                spy_quote = await market_service.get_live_quote("SPY")
            except Exception as e:
                logger.warning(f"Could not fetch SPY benchmark quote: {e}")

        market_benchmark_name = "S&P 500"
        market_change_percent = 0.0
        has_market_data = False

        if spy_quote:
            market_change_percent = spy_quote.change_percent
            has_market_data = True
        elif all_quotes and len(all_quotes) > 0:
            # Fallback benchmark to average of active watchlist universe
            valid_changes = [q.change_percent for q in all_quotes.values() if q is not None]
            if valid_changes:
                market_change_percent = round(sum(valid_changes) / len(valid_changes), 2)
                has_market_data = True
                market_benchmark_name = "Market Universe"

        # 3. Compute Sector Average %
        sector_quotes = []
        if all_quotes:
            for s, q in all_quotes.items():
                if q and MarketContextService.get_sector_for_symbol(s) == sector_name:
                    sector_quotes.append(q.change_percent)

        if sector_quotes:
            sector_change_percent = round(sum(sector_quotes) / len(sector_quotes), 2)
            has_sector_data = True
        else:
            # Sector contains only current stock
            sector_change_percent = stock_change_percent
            has_sector_data = True

        # 4. Classification & Confidence Scoring
        if not has_market_data and not has_sector_data:
            return MarketContextDetail(
                stock_symbol=sym,
                stock_change_percent=stock_change_percent,
                sector_name=sector_name,
                sector_change_percent=sector_change_percent,
                market_benchmark_name=market_benchmark_name,
                market_change_percent=market_change_percent,
                classification="UNKNOWN",
                confidence_score=20,
                reason="Insufficient contextual market data.",
                is_stale=is_stale,
                data_age_seconds=data_age_seconds
            )

        diff_stock_sector = abs(stock_change_percent - sector_change_percent)
        diff_stock_market = abs(stock_change_percent - market_change_percent)
        diff_sector_market = abs(sector_change_percent - market_change_percent)

        # Classification Logic
        if diff_stock_sector >= 2.0 and diff_stock_market >= 1.5:
            classification = "STOCK-SPECIFIC"
            confidence = min(96, max(72, int(70 + (diff_stock_sector * 4.5))))
            
            if stock_change_percent > sector_change_percent and stock_change_percent > market_change_percent:
                reason = f"{sym} ({stock_change_percent:+.2f}%) is significantly outperforming both its sector ({sector_name} {sector_change_percent:+.2f}%) and the broader market ({market_benchmark_name} {market_change_percent:+.2f}%)."
            elif stock_change_percent < sector_change_percent and stock_change_percent < market_change_percent:
                reason = f"{sym} ({stock_change_percent:+.2f}%) is significantly underperforming both its sector ({sector_name} {sector_change_percent:+.2f}%) and the broader market ({market_benchmark_name} {market_change_percent:+.2f}%)."
            else:
                reason = f"{sym} is moving significantly against both its sector ({sector_name}) and the broader market."

        elif diff_stock_sector < 2.0 and diff_sector_market >= 1.2:
            classification = "SECTOR-WIDE"
            confidence = min(94, max(70, int(68 + (diff_sector_market * 5.0))))
            reason = f"{sym} is moving broadly in line with {sector_name} ({sector_change_percent:+.2f}%), which is diverging from the overall market ({market_benchmark_name} {market_change_percent:+.2f}%)."

        elif diff_stock_sector < 2.0 and diff_stock_market < 2.0 and diff_sector_market < 1.5:
            classification = "MARKET-WIDE"
            confidence = min(92, max(65, int(68 + (max(0.4, abs(market_change_percent)) * 4.0))))
            reason = f"{sym}'s movement ({stock_change_percent:+.2f}%) is broadly aligned with both its sector ({sector_name} {sector_change_percent:+.2f}%) and the overall market ({market_benchmark_name} {market_change_percent:+.2f}%)."

        else:
            # Relative dominance tie-breaker
            if diff_stock_sector > diff_sector_market:
                classification = "STOCK-SPECIFIC"
                confidence = 74
                reason = f"{sym} is exhibiting idiosyncratic divergence from {sector_name} baseline."
            else:
                classification = "SECTOR-WIDE"
                confidence = 72
                reason = f"{sym} is moving in tandem with broader {sector_name} industry trend."

        # Penalty if data is stale
        if is_stale or data_age_seconds > 600:
            confidence = max(35, confidence - 20)

        return MarketContextDetail(
            stock_symbol=sym,
            stock_change_percent=stock_change_percent,
            sector_name=sector_name,
            sector_change_percent=sector_change_percent,
            market_benchmark_name=market_benchmark_name,
            market_change_percent=market_change_percent,
            classification=classification,
            confidence_score=confidence,
            reason=reason,
            is_stale=is_stale,
            data_age_seconds=data_age_seconds
        )
