import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  Info,
  ExternalLink,
  ShieldCheck,
  Clock,
  Compass,
  Layers,
  Gauge,
  Check,
  CircleDot,
  Circle,
  HelpCircle,
  Calendar
} from 'lucide-react';
import {
  formatCurrency,
  formatPercent,
  getAttentionLevelStyles,
  getSignalTypeBadge,
  getContextClassificationBadge,
  getLifecycleStatusBadge,
} from '../utils/formatters';

// Mini Sparkline SVG Renderer
function MiniSparkline({ points, isPositive }) {
  if (!points || points.length < 2) {
    return <div className="w-20 sm:w-24 h-8 bg-slate-800/40 rounded"></div>;
  }

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const width = 110;
  const height = 32;
  const padding = 3;

  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((p.price - min) / range) * (height - padding * 2) - padding;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(' L ')}`;
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)';

  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={areaD} fill={fillColor} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Lifecycle Stepper Component
const LIFECYCLE_STEPS = ['DETECTED', 'DEVELOPING', 'CONFIRMED', 'FADING', 'CLOSED'];

function LifecycleStepper({ currentStatus, sinceTimeFormatted }) {
  const currentIndex = LIFECYCLE_STEPS.indexOf((currentStatus || 'DETECTED').toUpperCase());
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="bg-[#0c1220] border border-[#1e293b] rounded-lg p-4 font-mono">
      <div className="flex items-center justify-between mb-3 border-b border-[#1e293b] pb-2">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>SIGNAL LIFECYCLE</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Current: <strong className="text-emerald-400">{currentStatus || 'DETECTED'}</strong>
          {sinceTimeFormatted && <span className="text-slate-500 ml-1.5">Since {sinceTimeFormatted}</span>}
        </div>
      </div>

      {/* Stepper Progress Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
        {LIFECYCLE_STEPS.map((step, idx) => {
          const isPassed = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const isUpcoming = idx > activeIdx;

          let stepStyle = 'text-slate-500 border-slate-800 bg-slate-900/40';
          let icon = <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />;

          if (isCurrent) {
            stepStyle = 'text-emerald-300 border-emerald-500/50 bg-emerald-950/30 font-bold shadow-sm shadow-emerald-500/10';
            icon = <CircleDot className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />;
          } else if (isPassed) {
            stepStyle = 'text-slate-300 border-slate-700 bg-[#131c31]';
            icon = <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
          }

          return (
            <div
              key={step}
              className={`flex items-center gap-2 p-2 rounded border text-xs ${stepStyle} transition-all`}
            >
              {icon}
              <span className="truncate">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SignalFeed({
  signals,
  selectedSymbol,
  onSelectStock,
  feedRef,
}) {
  const [expandedSymbol, setExpandedSymbol] = useState(null);
  const [filterLevel, setFilterLevel] = useState('ALL'); // ALL, CRITICAL, HIGH, MODERATE

  const allSignals = signals?.all_signals || [];

  const filteredSignals = allSignals.filter((sig) => {
    if (filterLevel === 'ALL') return true;
    return sig.attention_level.toUpperCase() === filterLevel;
  });

  const toggleExpand = (sym) => {
    setExpandedSymbol((prev) => (prev === sym ? null : sym));
  };

  return (
    <section ref={feedRef} className="w-full pt-4 pb-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>PRIMARY SIGNAL FEED & ATTENTION ENGINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-100">
            What deserves your attention
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Ranked by multi-factor attention score with transparent scoring breakdown, stock vs sector context, and state-machine lifecycle tracking.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#0c1220] p-1 rounded border border-[#1e293b] text-xs font-mono">
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                filterLevel === lvl
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Signals List Rows */}
      {filteredSignals.length === 0 ? (
        <div className="bg-[#0c1220] border border-[#1e293b] rounded-lg p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No {filterLevel !== 'ALL' ? filterLevel : ''} signals active</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-mono">
            Monitored assets are currently within normal historical volatility boundaries.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredSignals.map((sig) => {
            const isExpanded = expandedSymbol === sig.symbol;
            const isPos = sig.percentage_change > 0;
            const styles = getAttentionLevelStyles(sig.attention_level, sig.attention_score);
            const badge = getSignalTypeBadge(sig.signal_type);
            const contextBadge = getContextClassificationBadge(sig.market_context?.classification);
            const lifecycleBadge = getLifecycleStatusBadge(sig.lifecycle?.current_status);

            const scoreBreakdown = sig.score_breakdown || {
              price_deviation: 30,
              volume_anomaly: 20,
              volatility: 15,
              key_level: 8,
              checkpoint: 2,
              total: sig.attention_score,
              price_deviation_explanation: 'Observed price move relative to volatility baseline.',
              volume_anomaly_explanation: 'Volume expansion vs 10-day baseline.',
              volatility_explanation: 'Z-score deviation standard multiples.',
              key_level_explanation: 'Channel test boundary.',
              checkpoint_explanation: 'Change since last user visit.',
            };

            const expVsAct = sig.expected_vs_actual || {
              expected_daily_move_percent: sig.volatility || 2.0,
              actual_move_percent: sig.percentage_change,
              deviation_multiple: Math.abs(sig.percentage_change) / Math.max(0.5, sig.volatility || 2.0),
              is_within_expected: Math.abs(sig.percentage_change) <= (sig.volatility || 2.0),
            };

            const marketCtx = sig.market_context || {
              stock_symbol: sig.symbol,
              stock_change_percent: sig.percentage_change,
              sector_name: 'Semiconductors',
              sector_change_percent: 0.0,
              market_benchmark_name: 'S&P 500',
              market_change_percent: 0.0,
              classification: 'STOCK-SPECIFIC',
              confidence_score: 85,
              reason: 'Divergent movement detected.',
            };

            const lifecycle = sig.lifecycle || {
              current_status: 'CONFIRMED',
              formatted_since: 'Just now',
              timeline: [],
            };

            return (
              <div
                key={sig.symbol}
                className={`bg-[#0c1220] border ${
                  isExpanded ? 'border-emerald-500/60 shadow-xl shadow-emerald-500/5' : styles.border
                } rounded-lg transition-all overflow-hidden`}
              >
                {/* Collapsed / Main Row Bar */}
                <div
                  onClick={() => toggleExpand(sig.symbol)}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-[#131c31]/60 transition-colors"
                >
                  {/* Left: Symbol, Name, Badges & Context */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1">
                    {/* Attention Score Gauge Pill */}
                    <div
                      className={`flex flex-col items-center justify-center w-12 h-12 rounded border ${styles.border} ${styles.bg} shrink-0`}
                    >
                      <span className="font-mono font-extrabold text-sm text-slate-100">
                        {sig.attention_score}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 uppercase -mt-0.5">
                        {sig.attention_level.slice(0, 4)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-base text-slate-100 tracking-tight">
                          {sig.symbol}
                        </span>
                        <span className="text-xs text-slate-400 font-mono truncate max-w-[130px] sm:max-w-[180px]">
                          {sig.company_name}
                        </span>

                        {/* Signal Type Badge */}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${badge.color}`}>
                          {badge.label}
                        </span>

                        {/* Feature 6: Isolated vs Broad Movement Label */}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${contextBadge.pill}`}>
                          {contextBadge.emoji} {contextBadge.label}
                        </span>

                        {/* Lifecycle Badge */}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${lifecycleBadge.pill}`}>
                          ● {lifecycleBadge.label}
                        </span>

                        {sig.is_stale && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            STALE
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-1 line-clamp-1 font-mono">
                        {sig.primary_reason}
                      </p>
                    </div>
                  </div>

                  {/* Right: Sparkline, Prices & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t lg:border-t-0 border-[#1e293b] pt-3 lg:pt-0">
                    {/* Sparkline */}
                    <div className="hidden sm:block">
                      <MiniSparkline points={sig.sparkline} isPositive={isPos} />
                    </div>

                    {/* Price & Change */}
                    <div className="text-right font-mono">
                      <div className="text-sm font-bold text-slate-100">
                        {formatCurrency(sig.price)}
                      </div>
                      <div
                        className={`text-xs font-semibold flex items-center justify-end ${
                          isPos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPos ? (
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                        )}
                        {formatPercent(sig.percentage_change)} ({sig.absolute_change >= 0 ? '+' : ''}
                        {formatCurrency(sig.absolute_change)})
                      </div>
                    </div>

                    {/* Expand Arrow */}
                    <div className="p-1.5 rounded text-slate-400 hover:text-slate-200">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Full Detail Section (3 Major Differentiators & Helpers) */}
                {isExpanded && (
                  <div className="px-5 py-5 border-t border-[#1e293b] bg-[#080d19]/95 space-y-6">
                    {/* Header & Deep Dive Link */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-base font-mono font-bold text-slate-100">
                          {sig.symbol} — {sig.company_name}
                        </span>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          Consolidated anomaly diagnosis & context verification
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStock && onSelectStock(sig.symbol);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 underline transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        <span>Deep Dive Snapshot Ledger</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* SECTION 1: WHY AM I SEEING THIS? */}
                    <div className="bg-[#0c1220] border border-[#1e293b] rounded-lg p-4 font-mono">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">
                        <Info className="w-4 h-4" />
                        <span>WHY AM I SEEING THIS?</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Dynamic Reasoning Points */}
                        <div className="space-y-2">
                          <div className="text-[11px] text-slate-400 uppercase">
                            Observed Anomaly Markers:
                          </div>
                          <ul className="space-y-1.5">
                            {sig.why_points.map((pt, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs text-slate-200"
                              >
                                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Baseline Table */}
                        <div className="bg-[#131c31]/80 p-3 rounded border border-[#1e293b]">
                          <div className="text-[11px] text-slate-400 uppercase mb-2">
                            Baseline vs Observed Metrics:
                          </div>
                          <div className="space-y-1.5 text-xs">
                            {sig.why_structured.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between py-1 border-b border-[#1e293b]/60 last:border-0"
                              >
                                <span className="text-slate-400">{item.metric_name}:</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-100 font-bold">
                                    {item.observed_value}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    (Base: {item.baseline_value})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: ATTENTION SCORE BREAKDOWN (FEATURE 3) */}
                    <div className="bg-[#0c1220] border border-[#1e293b] rounded-lg p-4 font-mono">
                      <div className="flex items-center justify-between mb-3 border-b border-[#1e293b] pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                          <Gauge className="w-4 h-4" />
                          <span>ATTENTION SCORE BREAKDOWN</span>
                        </div>
                        <div className="text-sm font-bold text-slate-100">
                          {scoreBreakdown.total} / 100
                        </div>
                      </div>

                      <div className="space-y-3 text-xs">
                        {/* 1. Price Deviation */}
                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Price Deviation (+{scoreBreakdown.price_deviation})</span>
                            <span className="text-slate-400 text-[11px]">{scoreBreakdown.price_deviation_explanation}</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (scoreBreakdown.price_deviation / 40) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* 2. Volume Anomaly */}
                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Volume Anomaly (+{scoreBreakdown.volume_anomaly})</span>
                            <span className="text-slate-400 text-[11px]">{scoreBreakdown.volume_anomaly_explanation}</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (scoreBreakdown.volume_anomaly / 25) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* 3. Volatility Z-Score */}
                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Volatility (+{scoreBreakdown.volatility})</span>
                            <span className="text-slate-400 text-[11px]">{scoreBreakdown.volatility_explanation}</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-purple-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (scoreBreakdown.volatility / 20) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* 4. Key Level */}
                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Key Level (+{scoreBreakdown.key_level})</span>
                            <span className="text-slate-400 text-[11px]">{scoreBreakdown.key_level_explanation}</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-cyan-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (scoreBreakdown.key_level / 10) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* 5. Checkpoint Delta */}
                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Checkpoint (+{scoreBreakdown.checkpoint})</span>
                            <span className="text-slate-400 text-[11px]">{scoreBreakdown.checkpoint_explanation}</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (scoreBreakdown.checkpoint / 5) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-slate-200 font-bold">
                          <span>TOTAL ATTENTION SCORE</span>
                          <span className="text-emerald-400">{scoreBreakdown.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: MARKET CONTEXT & EXPECTED VS ACTUAL (FEATURE 2 & FEATURE 7) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono">
                      {/* Market Context Box */}
                      <div className="bg-[#0c1220] border border-[#1e293b] rounded-lg p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3 border-b border-[#1e293b] pb-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wide">
                              <Compass className="w-4 h-4" />
                              <span>MARKET CONTEXT</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${contextBadge.pill}`}>
                              {contextBadge.emoji} {contextBadge.label}
                            </span>
                          </div>

                          <div className="space-y-2 text-xs mb-3">
                            <div className="flex justify-between py-1 border-b border-[#1e293b]/60">
                              <span className="text-slate-400">Stock ({marketCtx.stock_symbol}):</span>
                              <span className={`font-bold ${marketCtx.stock_change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatPercent(marketCtx.stock_change_percent)}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#1e293b]/60">
                              <span className="text-slate-400">Sector ({marketCtx.sector_name}):</span>
                              <span className={`font-bold ${marketCtx.sector_change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatPercent(marketCtx.sector_change_percent)}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#1e293b]/60">
                              <span className="text-slate-400">Market ({marketCtx.market_benchmark_name}):</span>
                              <span className={`font-bold ${marketCtx.market_change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatPercent(marketCtx.market_change_percent)}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-300 leading-relaxed bg-[#131c31] p-2.5 rounded border border-[#1e293b]">
                            <strong className="text-slate-100">Context Reason: </strong>
                            {marketCtx.reason}
                          </div>
                        </div>

                        <div className="mt-3 text-[10px] text-slate-500 flex items-center justify-between">
                          <span>Confidence: {marketCtx.confidence_score}%</span>
                          {marketCtx.is_stale && <span className="text-amber-400">Data delayed</span>}
                        </div>
                      </div>

                      {/* Expected vs Actual Move Box */}
                      <div className="bg-[#0c1220] border border-[#1e293b] rounded-lg p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wide mb-3 border-b border-[#1e293b] pb-2">
                            <Activity className="w-4 h-4" />
                            <span>EXPECTED VS ACTUAL MOVEMENT</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center my-3">
                            <div className="bg-[#131c31] p-2.5 rounded border border-[#1e293b]">
                              <div className="text-[10px] text-slate-500 uppercase">Expected Move</div>
                              <div className="text-sm font-bold text-slate-200 mt-1">
                                ±{expVsAct.expected_daily_move_percent.toFixed(2)}%
                              </div>
                            </div>
                            <div className="bg-[#131c31] p-2.5 rounded border border-[#1e293b]">
                              <div className="text-[10px] text-slate-500 uppercase">Actual Move</div>
                              <div className={`text-sm font-bold mt-1 ${expVsAct.actual_move_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatPercent(expVsAct.actual_move_percent)}
                              </div>
                            </div>
                            <div className="bg-[#131c31] p-2.5 rounded border border-[#1e293b]">
                              <div className="text-[10px] text-slate-500 uppercase">Deviation</div>
                              <div className="text-sm font-bold text-amber-400 mt-1">
                                {expVsAct.deviation_multiple.toFixed(2)}×
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed bg-[#131c31] p-2.5 rounded border border-[#1e293b]">
                            {expVsAct.is_within_expected
                              ? `Observed price movement is within the stock's normal statistical ±${expVsAct.expected_daily_move_percent.toFixed(2)}% daily variance envelope.`
                              : `Observed price action has breached the standard deviation boundary by ${expVsAct.deviation_multiple.toFixed(2)}× Sigma.`}
                          </p>
                        </div>

                        <div className="mt-3 text-[10px] text-slate-500">
                          Historical daily standard deviation: ±{expVsAct.volatility_std_dev?.toFixed(2) || expVsAct.expected_daily_move_percent.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: SIGNAL LIFECYCLE STEPPER (FEATURE 1) */}
                    <LifecycleStepper
                      currentStatus={lifecycle.current_status}
                      sinceTimeFormatted={lifecycle.formatted_since}
                    />

                    {/* SECTION 5: SIGNAL EVOLUTION TIMELINE (FEATURE 9) */}
                    {lifecycle.timeline && lifecycle.timeline.length > 0 && (
                      <div className="bg-[#0c1220] border border-[#1e293b] rounded-lg p-4 font-mono">
                        <div className="flex items-center justify-between mb-3 border-b border-[#1e293b] pb-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wide">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>SIGNAL EVOLUTION TIMELINE</span>
                          </div>
                          <span className="text-[10px] text-slate-500">Persisted in MySQL</span>
                        </div>

                        <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                          {lifecycle.timeline.map((event, eIdx) => {
                            const evBadge = getLifecycleStatusBadge(event.status);
                            return (
                              <div key={eIdx} className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-[#0c1220]"></div>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 text-[11px]">{event.formatted_time}</span>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${evBadge.pill}`}>
                                    {event.status}
                                  </span>
                                  <span className="text-slate-300">{event.reason}</span>
                                </div>
                                <span className="text-slate-400 text-[11px] font-bold">
                                  Score {event.score}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Summary Verdict Callout */}
                    <div className="p-3 rounded bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-100 font-semibold">Engine Summary: </strong>
                        {sig.summary_verdict}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
