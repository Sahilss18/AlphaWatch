import math
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from app.utils.math_helpers import classify_attention_score
from app.schemas.signal import ScoreBreakdownDetail, ExpectedVsActualDetail

class EvaluatedSignal:
    def __init__(
        self,
        symbol: str,
        company_name: str,
        signal_type: str,
        attention_score: int,
        attention_level: str,
        price: float,
        previous_close: float,
        percentage_change: float,
        absolute_change: float,
        primary_reason: str,
        why_points: List[str],
        why_structured: List[Dict[str, Any]],
        summary_verdict: str,
        score_breakdown: ScoreBreakdownDetail,
        expected_vs_actual: ExpectedVsActualDetail,
        volume: int,
        average_volume: int,
        volume_ratio: float,
        volatility: float,
        is_breakout: bool,
        is_52w_high: bool,
        is_52w_low: bool,
        since_last_visit_change_percent: Optional[float] = None,
        since_last_visit_change_amount: Optional[float] = None,
        detected_at: Optional[datetime] = None,
        data_freshness: str = "LIVE",
        is_stale: bool = False
    ):
        self.symbol = symbol
        self.company_name = company_name
        self.signal_type = signal_type
        self.attention_score = attention_score
        self.attention_level = attention_level
        self.price = price
        self.previous_close = previous_close
        self.percentage_change = percentage_change
        self.absolute_change = absolute_change
        self.primary_reason = primary_reason
        self.why_points = why_points
        self.why_structured = why_structured
        self.summary_verdict = summary_verdict
        self.score_breakdown = score_breakdown
        self.expected_vs_actual = expected_vs_actual
        self.volume = volume
        self.average_volume = average_volume
        self.volume_ratio = volume_ratio
        self.volatility = volatility
        self.is_breakout = is_breakout
        self.is_52w_high = is_52w_high
        self.is_52w_low = is_52w_low
        self.since_last_visit_change_percent = since_last_visit_change_percent
        self.since_last_visit_change_amount = since_last_visit_change_amount
        self.detected_at = detected_at or datetime.now(timezone.utc)
        self.data_freshness = data_freshness
        self.is_stale = is_stale

class SignalEngine:
    """
    Deterministic, explainable adaptive volatility-aware signal scoring system.
    """

    @staticmethod
    def evaluate_stock(
        symbol: str,
        company_name: str,
        current_price: float,
        previous_close: float,
        day_high: Optional[float] = None,
        day_low: Optional[float] = None,
        open_price: Optional[float] = None,
        last_visit_price: Optional[float] = None,
        metrics: Optional[Dict[str, Any]] = None,
        is_stale: bool = False,
        data_source: str = "finnhub"
    ) -> EvaluatedSignal:
        metrics = metrics or {}
        
        # 1. Basic price movement calculations
        abs_change = round(current_price - previous_close, 4)
        pct_change = round(((current_price - previous_close) / previous_close) * 100, 4) if previous_close > 0 else 0.0

        # Movement since user's last visit checkpoint
        since_visit_pct = None
        since_visit_abs = None
        if last_visit_price and last_visit_price > 0:
            since_visit_abs = round(current_price - last_visit_price, 4)
            since_visit_pct = round(((current_price - last_visit_price) / last_visit_price) * 100, 4)

        # 2. Historical Baselines & Metrics
        normal_volatility = float(metrics.get("volatility_daily", 1.8) or 1.8)  # Expected 1-day standard dev %
        avg_vol = int(metrics.get("average_volume_10d", 20000000) or 20000000)
        week_52_high = float(metrics.get("week_52_high", 0) or 0)
        week_52_low = float(metrics.get("week_52_low", 0) or 0)
        
        current_volume = int(metrics.get("current_volume", 0) or 0)
        if current_volume <= 0 and avg_vol > 0:
            vol_multiplier = 1.0 + (abs(pct_change) / max(0.5, normal_volatility * 2.0))
            current_volume = int(avg_vol * vol_multiplier)

        volume_ratio = round((current_volume / avg_vol), 2) if avg_vol > 0 else 1.0

        # Z-Score relative to normal historical daily volatility
        z_score = round(abs(pct_change) / max(0.5, normal_volatility), 2)

        # Key Level Detection
        is_52w_high = (week_52_high > 0) and (current_price >= week_52_high * 0.99)
        is_52w_low = (week_52_low > 0) and (current_price <= week_52_low * 1.01)
        is_breakout = False

        if is_52w_high or is_52w_low:
            is_breakout = True
        elif day_high and current_price >= day_high * 0.995 and pct_change > normal_volatility:
            is_breakout = True
        elif day_low and current_price <= day_low * 1.005 and pct_change < -normal_volatility:
            is_breakout = True

        # 3. Transparent 5-Component Score Breakdown (Max 100 total)
        # Component 1: Price Deviation (0-40)
        c_price = min(40, max(2, int((abs(pct_change) / max(0.5, normal_volatility)) * 13.0)))
        
        # Component 2: Volume Anomaly (0-25)
        if volume_ratio >= 3.0:
            c_volume = 24
        elif volume_ratio >= 2.2:
            c_volume = 19
        elif volume_ratio >= 1.6:
            c_volume = 14
        elif volume_ratio >= 1.2:
            c_volume = 8
        else:
            c_volume = 3

        # Component 3: Volatility Z-Score (0-20)
        c_volatility = min(20, max(1, int(z_score * 6.5)))

        # Component 4: Key Level Testing (0-10)
        if is_52w_high or is_52w_low:
            c_key_level = 10
        elif is_breakout:
            c_key_level = 7
        else:
            c_key_level = 2

        # Component 5: Checkpoint Delta (0-5)
        if since_visit_pct is not None and abs(since_visit_pct) > normal_volatility:
            c_checkpoint = min(5, max(3, int((abs(since_visit_pct) / normal_volatility) * 2.5)))
        elif since_visit_pct is not None:
            c_checkpoint = 2
        else:
            c_checkpoint = 1

        raw_sum = c_price + c_volume + c_volatility + c_key_level + c_checkpoint
        attention_score = max(5, min(99, raw_sum))

        # Guarantee exact mathematical identity: sum(components) == attention_score
        diff = attention_score - raw_sum
        if diff != 0:
            c_price = max(0, c_price + diff)

        # Build human-readable component explanations
        price_exp = f"Current movement is {z_score:.1f}× the stock's normal daily volatility band."
        volume_exp = f"Trading volume is {volume_ratio:.1f}× the 10-day average."
        volatility_exp = f"Observed movement is {z_score:.1f} standard deviations from baseline."
        
        if is_52w_high:
            key_exp = f"Price (${current_price:.2f}) is testing 52-week resistance (${week_52_high:.2f})."
        elif is_52w_low:
            key_exp = f"Price (${current_price:.2f}) is testing 52-week support (${week_52_low:.2f})."
        elif is_breakout:
            key_exp = "Price is testing intraday high/low channel boundaries."
        else:
            key_exp = "Price is trading comfortably within standard channel levels."

        if since_visit_pct is not None and abs(since_visit_pct) > normal_volatility:
            checkpoint_exp = f"Movement since last checkpoint ({since_visit_pct:+.2f}%) is unusually large."
        elif since_visit_pct is not None:
            checkpoint_exp = f"Change since last visit ({since_visit_pct:+.2f}%) is within normal expectations."
        else:
            checkpoint_exp = "Initial checkpoint established for future visit comparison."

        score_breakdown = ScoreBreakdownDetail(
            price_deviation=c_price,
            volume_anomaly=c_volume,
            volatility=c_volatility,
            key_level=c_key_level,
            checkpoint=c_checkpoint,
            total=attention_score,
            price_deviation_explanation=price_exp,
            volume_anomaly_explanation=volume_exp,
            volatility_explanation=volatility_exp,
            key_level_explanation=key_exp,
            checkpoint_explanation=checkpoint_exp
        )

        # Expected vs Actual Movement Detail
        expected_vs_actual = ExpectedVsActualDetail(
            expected_daily_move_percent=round(normal_volatility, 2),
            actual_move_percent=round(pct_change, 2),
            deviation_multiple=round(z_score, 2),
            is_within_expected=abs(pct_change) <= normal_volatility,
            volatility_std_dev=round(normal_volatility, 2)
        )

        attention_level, _ = classify_attention_score(attention_score)

        # 4. Determine Primary Signal Type
        signal_type = "PRICE_MOVE"
        if is_52w_high:
            signal_type = "NEW_HIGH"
        elif is_52w_low:
            signal_type = "NEW_LOW"
        elif volume_ratio >= 2.2 and abs(pct_change) > normal_volatility:
            signal_type = "VOLUME_ANOMALY"
        elif abs(pct_change) > (normal_volatility * 2.2):
            signal_type = "UNUSUAL_VOLATILITY"
        elif open_price and previous_close and abs(open_price - previous_close) / previous_close > (normal_volatility * 0.015):
            signal_type = "GAP_MOVE"
        elif is_breakout:
            signal_type = "BREAKOUT" if pct_change > 0 else "BREAKDOWN"

        # 5. Dynamic Explainable Reasoning Generation
        why_points = []
        why_structured = []

        sign_str = "+" if pct_change > 0 else ""
        why_points.append(f"Price moved {sign_str}{pct_change:.2f}% (${abs_change:+.2f}) today.")
        why_structured.append({
            "point": f"Price change: {sign_str}{pct_change:.2f}%",
            "is_anomaly": abs(pct_change) > (normal_volatility * 1.2),
            "metric_name": "Price Deviation",
            "observed_value": f"{sign_str}{pct_change:.2f}%",
            "baseline_value": f"±{normal_volatility:.2f}% standard band"
        })

        vol_comparison = f"Normal daily move for {symbol} is ±{normal_volatility:.2f}% (observed move is {z_score:.1f}σ standard deviation)."
        why_points.append(vol_comparison)
        why_structured.append({
            "point": vol_comparison,
            "is_anomaly": z_score >= 1.5,
            "metric_name": "Volatility Z-Score",
            "observed_value": f"{z_score:.1f}× Sigma",
            "baseline_value": "1.0× Sigma"
        })

        vol_str = f"Trading volume is estimated at {volume_ratio:.1f}× the 10-day average volume."
        why_points.append(vol_str)
        why_structured.append({
            "point": vol_str,
            "is_anomaly": volume_ratio >= 1.5,
            "metric_name": "Volume Multiple",
            "observed_value": f"{volume_ratio:.1f}× avg",
            "baseline_value": "1.0× avg"
        })

        if since_visit_pct is not None:
            since_str = "+" if since_visit_pct > 0 else ""
            visit_pt = f"Since your last checkpoint, {symbol} moved {since_str}{since_visit_pct:.2f}% (${since_visit_abs:+.2f})."
            why_points.append(visit_pt)
            why_structured.append({
                "point": visit_pt,
                "is_anomaly": abs(since_visit_pct) > normal_volatility,
                "metric_name": "Checkpoint Delta",
                "observed_value": f"{since_str}{since_visit_pct:.2f}%",
                "baseline_value": "0.00% at last visit"
            })
        
        if is_52w_high:
            why_points.append(f"Price is trading near its 52-week peak (${week_52_high:.2f}).")
        elif is_52w_low:
            why_points.append(f"Price is testing its 52-week low (${week_52_low:.2f}).")

        if attention_score >= 90:
            primary_reason = f"Severe outsized move of {sign_str}{pct_change:.2f}% ({z_score:.1f}σ deviation) with {volume_ratio:.1f}× volume anomaly."
            summary_verdict = f"HIGH CONVICTION CRITICAL SIGNAL: {symbol} price deviation is {z_score:.1f}× baseline with institutional-grade volume expansion."
        elif attention_score >= 70:
            primary_reason = f"High-velocity {sign_str}{pct_change:.2f}% shift exceeding historical ±{normal_volatility:.1f}% boundary."
            summary_verdict = f"HIGH ATTENTION SIGNAL: {symbol} has broken outside its typical volatility envelope."
        elif attention_score >= 40:
            primary_reason = f"Moderate move of {sign_str}{pct_change:.2f}% within secondary trend boundaries."
            summary_verdict = "DEVELOPING / MODERATE: Worth keeping on watch if sector catalysts are in play."
        else:
            primary_reason = f"Noise-filtered move of {sign_str}{pct_change:.2f}% aligned with typical baseline."
            summary_verdict = "QUIET / NOISE FILTERED: Stock action is within normal daily variance."

        freshness = "LIVE" if not is_stale else "STALE"

        return EvaluatedSignal(
            symbol=symbol,
            company_name=company_name,
            signal_type=signal_type,
            attention_score=attention_score,
            attention_level=attention_level,
            price=current_price,
            previous_close=previous_close,
            percentage_change=pct_change,
            absolute_change=abs_change,
            primary_reason=primary_reason,
            why_points=why_points,
            why_structured=why_structured,
            summary_verdict=summary_verdict,
            score_breakdown=score_breakdown,
            expected_vs_actual=expected_vs_actual,
            volume=current_volume,
            average_volume=avg_vol,
            volume_ratio=volume_ratio,
            volatility=normal_volatility,
            is_breakout=is_breakout,
            is_52w_high=is_52w_high,
            is_52w_low=is_52w_low,
            since_last_visit_change_percent=since_visit_pct,
            since_last_visit_change_amount=since_visit_abs,
            data_freshness=freshness,
            is_stale=is_stale
        )
