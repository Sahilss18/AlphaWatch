import math
from typing import List, Tuple
from datetime import datetime

def format_duration_away(seconds: int) -> str:
    """Format duration in seconds into a friendly human string."""
    if seconds < 60:
        return f"{seconds} seconds ago"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    hours = minutes // 60
    remaining_mins = minutes % 60
    if hours < 24:
        if remaining_mins == 0:
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        return f"{hours} hour{'s' if hours != 1 else ''} {remaining_mins} min ago"
    days = hours // 24
    remaining_hours = hours % 24
    if remaining_hours == 0:
        return f"{days} day{'s' if days != 1 else ''} ago"
    return f"{days} day{'s' if days != 1 else ''} {remaining_hours} hr ago"

def calculate_std_dev(values: List[float]) -> float:
    """Calculate sample standard deviation."""
    if not values or len(values) < 2:
        return 1.8  # Default fallback volatility
    mean = sum(values) / len(values)
    variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
    return math.sqrt(variance)

def classify_attention_score(score: int) -> Tuple[str, str]:
    """
    Classify normalized attention score (0-100) into Level and Hex/Color token.
    90-100: CRITICAL
    70-89: HIGH
    40-69: MODERATE
    0-39: NORMAL
    """
    clamped = max(0, min(100, int(score)))
    if clamped >= 90:
        return "CRITICAL", "#ef4444"  # Red / High alert
    elif clamped >= 70:
        return "HIGH", "#f97316"      # Orange / High attention
    elif clamped >= 40:
        return "MODERATE", "#eab308"  # Yellow / Moderate
    else:
        return "NORMAL", "#10b981"    # Green / Quiet Normal

def safe_float(val, default: float = 0.0) -> float:
    """Safely convert value to float."""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default
