export const formatCurrency = (val, decimals = 2) => {
  if (val === null || val === undefined || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
};

export const formatPercent = (val, includeSign = true) => {
  if (val === null || val === undefined || isNaN(val)) return '0.00%';
  const sign = includeSign && val > 0 ? '+' : '';
  return `${sign}${Number(val).toFixed(2)}%`;
};

export const formatLargeNumber = (num) => {
  if (!num || isNaN(num)) return '0';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return num.toString();
};

export const formatTimeAgo = (dateInput) => {
  if (!dateInput) return 'just now';
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now - date) / 1000));

  if (diffSec < 45) return 'just now';
  if (diffSec < 90) return '1 min ago';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 7200) return '1 hr ago';
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hrs ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
};

export const getAttentionLevelStyles = (level, score) => {
  const normLevel = (level || '').toUpperCase();
  if (normLevel === 'CRITICAL' || score >= 90) {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/30 dark:border-rose-800/60',
      badge: 'bg-rose-500 text-white',
      glow: 'glow-border-red',
      dot: 'bg-rose-500',
      label: 'CRITICAL',
    };
  }
  if (normLevel === 'HIGH' || score >= 70) {
    return {
      bg: 'bg-amber-500/10 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30 dark:border-amber-800/60',
      badge: 'bg-amber-500 text-black font-semibold',
      glow: 'glow-border-amber',
      dot: 'bg-amber-500',
      label: 'HIGH',
    };
  }
  if (normLevel === 'MODERATE' || score >= 40) {
    return {
      bg: 'bg-yellow-500/10 dark:bg-yellow-950/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-500/20 dark:border-yellow-800/40',
      badge: 'bg-yellow-500/20 text-yellow-500 dark:text-yellow-300',
      glow: '',
      dot: 'bg-yellow-400',
      label: 'MODERATE',
    };
  }
  return {
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20 dark:border-emerald-800/30',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    glow: '',
    dot: 'bg-emerald-500',
    label: 'NORMAL',
  };
};

export const getSignalTypeBadge = (signalType) => {
  switch (signalType) {
    case 'VOLUME_ANOMALY':
      return { label: 'VOLUME ANOMALY', color: 'bg-amber-500/15 text-amber-500 border border-amber-500/30' };
    case 'NEW_HIGH':
      return { label: '52W HIGH', color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' };
    case 'NEW_LOW':
      return { label: '52W LOW', color: 'bg-rose-500/15 text-rose-400 border border-rose-500/30' };
    case 'BREAKOUT':
      return { label: 'BREAKOUT', color: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' };
    case 'BREAKDOWN':
      return { label: 'BREAKDOWN', color: 'bg-rose-500/15 text-rose-400 border border-rose-500/30' };
    case 'UNUSUAL_VOLATILITY':
      return { label: 'HIGH VOLATILITY', color: 'bg-purple-500/15 text-purple-400 border border-purple-500/30' };
    case 'GAP_MOVE':
      return { label: 'GAP OPEN', color: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' };
    default:
      return { label: 'PRICE MOVE', color: 'bg-slate-500/15 text-slate-400 border border-slate-500/30' };
  }
};

export const getContextClassificationBadge = (classification) => {
  const norm = (classification || 'UNKNOWN').toUpperCase();
  switch (norm) {
    case 'STOCK-SPECIFIC':
      return {
        label: 'STOCK-SPECIFIC',
        pill: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        dot: 'bg-rose-500',
        emoji: '🔴',
      };
    case 'SECTOR-WIDE':
      return {
        label: 'SECTOR-WIDE',
        pill: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        dot: 'bg-amber-500',
        emoji: '🟠',
      };
    case 'MARKET-WIDE':
      return {
        label: 'MARKET-WIDE',
        pill: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
        dot: 'bg-blue-400',
        emoji: '🔵',
      };
    default:
      return {
        label: 'UNKNOWN',
        pill: 'bg-slate-700/40 text-slate-400 border border-slate-700',
        dot: 'bg-slate-400',
        emoji: '⚪',
      };
  }
};

export const getLifecycleStatusBadge = (status) => {
  const norm = (status || 'DETECTED').toUpperCase();
  switch (norm) {
    case 'CONFIRMED':
      return {
        label: 'CONFIRMED',
        pill: 'bg-rose-500/15 text-rose-300 border border-rose-500/40',
        dot: 'bg-rose-500',
      };
    case 'DEVELOPING':
      return {
        label: 'DEVELOPING',
        pill: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
        dot: 'bg-amber-500',
      };
    case 'DETECTED':
      return {
        label: 'DETECTED',
        pill: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40',
        dot: 'bg-cyan-400',
      };
    case 'FADING':
      return {
        label: 'FADING',
        pill: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
        dot: 'bg-yellow-400',
      };
    case 'CLOSED':
      return {
        label: 'CLOSED',
        pill: 'bg-slate-800 text-slate-400 border border-slate-700',
        dot: 'bg-slate-500',
      };
    default:
      return {
        label: norm,
        pill: 'bg-slate-800 text-slate-300 border border-slate-700',
        dot: 'bg-slate-400',
      };
  }
};
