import React, { useState } from 'react';
import {
  Radar,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  Cpu,
  Flame,
  Globe,
  Radio,
  ArrowUpRight,
  Filter,
  BarChart3,
  Layers
} from 'lucide-react';

const RADAR_FACTORS = [
  {
    id: 'all',
    label: 'All Catalysts',
    icon: Sparkles,
    color: 'text-purple-400'
  },
  {
    id: 'momentum',
    label: 'Momentum Breakouts',
    icon: Zap,
    color: 'text-cyan-400'
  },
  {
    id: 'whales',
    label: 'Institutional Flow',
    icon: Flame,
    color: 'text-amber-400'
  },
  {
    id: 'volatility',
    label: 'Volatility Spikes',
    icon: TrendingUp,
    color: 'text-rose-400'
  },
  {
    id: 'macro',
    label: 'Macro & Sector Sync',
    icon: Globe,
    color: 'text-emerald-400'
  }
];

const MOCK_RADAR_INSIGHTS = [
  {
    id: 1,
    category: 'momentum',
    title: 'Multi-Factor Momentum Squeeze',
    ticker: 'NVDA',
    score: 96,
    trend: '+4.8%',
    badge: 'HIGH CONVICTION',
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    description: 'Volume breakout 2.8x 20-day baseline accompanied by institutional call block purchases.',
    tags: ['AI Hardware', 'RSI Bullish Divergence', '99th Percentile Volume'],
    glow: 'rgba(6, 182, 212, 0.25)'
  },
  {
    id: 2,
    category: 'whales',
    title: 'Dark Pool Accumulation Detected',
    ticker: 'AAPL',
    score: 92,
    trend: '+2.1%',
    badge: 'WHALE FLOW',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    description: 'Statistically anomalous block trades executed at session vWAP baseline without retail slippage.',
    tags: ['Dark Pool', 'Accumulation Zone', 'Low Noise'],
    glow: 'rgba(245, 158, 11, 0.22)'
  },
  {
    id: 3,
    category: 'volatility',
    title: 'Bollinger Compression Breakout',
    ticker: 'TSLA',
    score: 89,
    trend: '+6.4%',
    badge: 'VOLATILITY SPIKE',
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    description: 'Volatility expansion following 72-hour consolidation. Rapid mean-reversion risk mitigated.',
    tags: ['EV Sector', 'Mean Reversion', 'Breakout 2.4σ'],
    glow: 'rgba(244, 63, 94, 0.25)'
  },
  {
    id: 4,
    category: 'macro',
    title: 'Sector Relative Strength Rotation',
    ticker: 'MSFT',
    score: 91,
    trend: '+1.9%',
    badge: 'SECTOR ALPHA',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    description: 'Enterprise cloud basket outperforming S&P 500 benchmark by +240bps on positive IT enterprise spend.',
    tags: ['Cloud Computing', 'Macro Hedge', 'Zero Noise'],
    glow: 'rgba(16, 185, 129, 0.25)'
  },
  {
    id: 5,
    category: 'momentum',
    title: 'Gamma Squeeze Acceleration',
    ticker: 'AMD',
    score: 88,
    trend: '+5.2%',
    badge: 'GAMMA SURGE',
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    description: 'Options dealer delta rehedging triggering upward mechanical price chase into Friday expiration.',
    tags: ['Semiconductors', 'Gamma Flip', 'Heavy Calls'],
    glow: 'rgba(132, 0, 255, 0.25)'
  },
  {
    id: 6,
    category: 'whales',
    title: 'Clean Baseline Delta Checkpoint',
    ticker: 'GOOGL',
    score: 85,
    trend: '+1.4%',
    badge: 'STEADY DRIFT',
    badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    description: 'Zero noisy false breakouts since your visit checkpoint. Consistent upward price trajectory.',
    tags: ['Search AI', 'Low Fatigue', 'Baseline Target'],
    glow: 'rgba(99, 102, 241, 0.22)'
  }
];

export function AlphaRadarTerminal({ onSelectStock }) {
  const [selectedFactor, setSelectedFactor] = useState('all');
  const [hoveredCard, setHoveredCard] = useState(null);

  const filteredInsights =
    selectedFactor === 'all'
      ? MOCK_RADAR_INSIGHTS
      : MOCK_RADAR_INSIGHTS.filter(item => item.category === selectedFactor);

  return (
    <section id="radar" className="w-full pt-10 pb-16 border-t border-[#1e293b]/70 relative overflow-hidden">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/20 via-cyan-500/15 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>REAL-TIME MULTI-FACTOR RADAR</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-slate-100">
              Alpha Catalyst Matrix
            </h2>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-semibold">
              Live Feed
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Continuously synthesizing cross-asset order flow, volatility surfaces, and macro sector momentum into high-conviction signals. Click any card for full telemetry.
          </p>
        </div>

        {/* Live Terminal Badge */}
        <div className="flex items-center gap-3 bg-[#0c1220]/90 border border-[#1e2538] px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div className="font-mono text-xs">
            <span className="text-slate-400">Scanner Engine: </span>
            <span className="text-emerald-400 font-bold">120 SPS (Signals/Sec)</span>
          </div>
        </div>
      </div>

      {/* Interactive Catalyst Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none relative z-10">
        {RADAR_FACTORS.map(factor => {
          const Icon = factor.icon;
          const isSelected = selectedFactor === factor.id;
          return (
            <button
              key={factor.id}
              onClick={() => setSelectedFactor(factor.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap shadow-sm ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400 shadow-lg shadow-purple-900/40 scale-105'
                  : 'bg-[#0d1220]/80 hover:bg-[#151c2e] border border-[#1e2538] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${factor.color}`} />
              <span>{factor.label}</span>
            </button>
          );
        })}
      </div>

      {/* Glowing Holographic Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
        {filteredInsights.map(insight => {
          const isHovered = hoveredCard === insight.id;

          return (
            <div
              key={insight.id}
              onClick={() => onSelectStock && onSelectStock(insight.ticker)}
              onMouseEnter={() => setHoveredCard(insight.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative bg-[#0b0f19]/90 border border-[#1e2538] hover:border-purple-500/60 rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 shadow-xl overflow-hidden flex flex-col justify-between cursor-pointer select-none"
              style={{
                boxShadow: isHovered
                  ? `0 12px 35px -5px ${insight.glow}, 0 0 25px rgba(132, 0, 255, 0.25)`
                  : 'none'
              }}
            >
              {/* Radial Top Glow Accent */}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-40 pointer-events-none transition-opacity duration-300 group-hover:opacity-90"
                style={{ background: insight.glow }}
              />

              <div>
                {/* Header: Ticker & Score */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center font-mono font-extrabold text-base text-white shadow-inner group-hover:border-cyan-400 group-hover:text-cyan-300 transition-colors">
                      {insight.ticker}
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                        {insight.title}
                      </span>
                      <div className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{insight.trend} Momentum</span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Gauge */}
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono font-extrabold text-purple-300">
                      {insight.score}/100
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">Conviction</span>
                  </div>
                </div>

                {/* Badge Tag */}
                <div className="mb-3">
                  <span
                    className={`inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${insight.badgeColor}`}
                  >
                    {insight.badge}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed font-sans opacity-90 mb-4">
                  {insight.description}
                </p>
              </div>

              {/* Footer Tags & Deep Dive Prompt */}
              <div className="pt-3 border-t border-[#1e2538]/70 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {insight.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#131a2b] border border-[#232f4a] text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1 text-slate-400 group-hover:text-cyan-300 font-mono text-[10px] transition-colors">
                  <span>Deep-dive</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default AlphaRadarTerminal;
