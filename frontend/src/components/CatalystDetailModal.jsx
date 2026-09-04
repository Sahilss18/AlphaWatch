import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  TrendingUp,
  Flame,
  Globe,
  Radio,
  Layers,
  ShieldCheck,
  Target,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  Share2,
  Copy,
  Check
} from 'lucide-react';

export function CatalystDetailModal({ catalyst, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('anatomy');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !catalyst) return null;

  const handleCopyThesis = () => {
    const text = `[AlphaWatch Catalyst Intelligence]
Ticker: ${catalyst.ticker}
Setup: ${catalyst.title} (${catalyst.badge})
Conviction: ${catalyst.score}/100
Thesis: ${catalyst.description}
Targets: ${catalyst.details?.targetRange || 'Dynamic'} | Invalidation: ${catalyst.details?.invalidationLevel || 'Break of baseline'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const details = catalyst.details || {
    darkPoolShare: '64.2%',
    gammaExposure: '+$1.82B GEX',
    ivPercentile: '92nd Percentile',
    flowRatio: '3.4 : 1 (Calls/Puts)',
    expectedMove: '±4.8%',
    invalidationLevel: '$118.50',
    targetRange: '$134.00 – $142.50',
    winRateHistorical: '82% (48 Historical Setups)',
    liquidityVacuum: 'Top 5% Order Thinning Detected',
    macroSync: '+280bps vs S&P 500 Benchmark'
  };

  const timeline = catalyst.timeline || [
    { time: '14 mins ago', event: 'Volume Spike 2.8x standard deviation identified', type: 'vol' },
    { time: '42 mins ago', event: 'Institutional Dark Pool block trade executed (350k shares at vWAP)', type: 'whale' },
    { time: '2 hours ago', event: 'Bollinger Band 72-hour compression broke above 2.4σ upper boundary', type: 'band' },
    { time: 'Visit Checkpoint', event: 'Snapshot baseline locked with zero noise divergence', type: 'base' }
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#090d18] border border-[#1e293b] hover:border-purple-500/50 rounded-3xl shadow-2xl shadow-purple-950/40 overflow-hidden flex flex-col max-h-[92vh] transition-all"
        style={{
          boxShadow: `0 0 50px -10px ${catalyst.glow || 'rgba(132, 0, 255, 0.3)'}`
        }}
      >
        {/* Ambient Top Glow Orbs */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: catalyst.glow || 'rgba(132, 0, 255, 0.5)' }}
        />

        {/* Modal Header */}
        <div className="relative z-10 px-6 py-5 border-b border-[#1e293b]/80 bg-[#0c1220]/70 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center font-mono font-extrabold text-2xl text-white shadow-xl shadow-black/50">
              {catalyst.ticker}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg sm:text-xl font-display font-bold text-slate-100">
                  {catalyst.title}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${catalyst.badgeColor}`}
                >
                  {catalyst.badge}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono mt-1 text-slate-400">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {catalyst.trend} Momentum
                </span>
                <span>•</span>
                <span className="text-purple-300 font-semibold">
                  Conviction Score: {catalyst.score}/100
                </span>
              </div>
            </div>
          </div>

          {/* Close & Share Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyThesis}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
              title="Copy Alpha Thesis"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="relative z-10 px-6 pt-3 border-b border-[#1e293b]/70 bg-[#090d18] flex items-center gap-2 overflow-x-auto scrollbar-none font-mono text-xs">
          <button
            onClick={() => setActiveTab('anatomy')}
            className={`px-4 py-2 rounded-t-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'anatomy'
                ? 'border-purple-500 text-white bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Catalyst Anatomy</span>
          </button>

          <button
            onClick={() => setActiveTab('orderflow')}
            className={`px-4 py-2 rounded-t-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'orderflow'
                ? 'border-purple-500 text-white bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Order Flow & Dark Pool</span>
          </button>

          <button
            onClick={() => setActiveTab('targets')}
            className={`px-4 py-2 rounded-t-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'targets'
                ? 'border-purple-500 text-white bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Targets & Risk Boundary</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-t-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'timeline'
                ? 'border-purple-500 text-white bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Event Timeline</span>
          </button>
        </div>

        {/* Modal Body with Scrollable Area */}
        <div className="relative z-10 p-6 overflow-y-auto space-y-6 text-sm">
          {activeTab === 'anatomy' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Core Alpha Hypothesis Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/20 via-indigo-900/15 to-transparent border border-purple-500/30">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-purple-300 uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Microstructure Synthesis Thesis</span>
                </div>
                <p className="text-slate-200 leading-relaxed font-sans text-sm">
                  {catalyst.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {catalyst.tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-[#131b2f] border border-purple-500/30 text-purple-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 4 Quantitative Factor Gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-[#1e2538]">
                  <span className="text-[10px] text-slate-400 block mb-1">DARK POOL SHARE</span>
                  <span className="text-base font-bold text-amber-400">{details.darkPoolShare}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Off-Exchange Blocks</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-[#1e2538]">
                  <span className="text-[10px] text-slate-400 block mb-1">GAMMA EXPOSURE</span>
                  <span className="text-base font-bold text-purple-400">{details.gammaExposure}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Dealer Hedging Bias</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-[#1e2538]">
                  <span className="text-[10px] text-slate-400 block mb-1">IV PERCENTILE</span>
                  <span className="text-base font-bold text-rose-400">{details.ivPercentile}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Volatility Richness</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-[#1e2538]">
                  <span className="text-[10px] text-slate-400 block mb-1">WIN-RATE STATS</span>
                  <span className="text-base font-bold text-emerald-400">82%</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">48 Similar Setups</span>
                </div>
              </div>

              {/* Execution Rationale */}
              <div className="p-4 rounded-2xl bg-[#0c1220] border border-[#1e2538] space-y-2.5">
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                  Why This Differs From Normal Watchlist Tracking
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Unlike conventional price tracking, the Alpha Catalyst Engine isolates non-random statistical anomalies generated by institutional market makers, dealer gamma flips, and off-book liquidity vacuums before they reflect on retail charts.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'orderflow' && (
            <div className="space-y-4 animate-in fade-in duration-150 font-mono">
              <div className="p-4 rounded-2xl bg-[#0c1220] border border-[#1e2538]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-200">INSTITUTIONAL CALL/PUT FLOW RATIO</span>
                  <span className="text-xs text-cyan-400 font-bold">{details.flowRatio}</span>
                </div>
                {/* Visual Ratio Bar */}
                <div className="w-full h-3 rounded-full bg-rose-500/30 overflow-hidden flex">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '77%' }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                  <span className="text-cyan-400">77% Aggressive Call Buying</span>
                  <span className="text-rose-400">23% Put Hedging</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#0c1220] border border-[#1e2538]">
                  <span className="text-xs font-bold text-slate-200 block mb-2">Liquidity Vacuum Metric</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {details.liquidityVacuum}. Overhead asks have been absorbed by institutional algorithmic sweepers with minimal slippage.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0c1220] border border-[#1e2538]">
                  <span className="text-xs font-bold text-slate-200 block mb-2">Macro Sector Benchmark Sync</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {details.macroSync}. Relative strength divergence confirms intrinsic idiosyncratic alpha rather than broad market beta.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'targets' && (
            <div className="space-y-4 animate-in fade-in duration-150 font-mono">
              <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e2538] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e2538] pb-3">
                  <span className="text-xs text-slate-400">Projected Target Range</span>
                  <span className="text-sm font-bold text-emerald-400">{details.targetRange}</span>
                </div>

                <div className="flex items-center justify-between border-b border-[#1e2538] pb-3">
                  <span className="text-xs text-slate-400">Model Invalidation Level (Stop Basis)</span>
                  <span className="text-sm font-bold text-rose-400">{details.invalidationLevel}</span>
                </div>

                <div className="flex items-center justify-between border-b border-[#1e2538] pb-3">
                  <span className="text-xs text-slate-400">Expected Move Standard Deviation</span>
                  <span className="text-sm font-bold text-purple-300">{details.expectedMove}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Sample Backtest Performance</span>
                  <span className="text-sm font-bold text-cyan-300">{details.winRateHistorical}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-3 animate-in fade-in duration-150 font-mono">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#0c1220] border border-[#1e2538]">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="text-slate-200 font-semibold">{item.event}</span>
                      <span className="text-slate-500 text-[10px]">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 px-6 py-4 border-t border-[#1e293b]/80 bg-[#0c1220]/80 flex items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Zero-Fatigue Alpha Snapshot Synchronized</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all shadow-md shadow-purple-900/40 cursor-pointer"
          >
            Dismiss Dossier
          </button>
        </div>
      </div>
    </div>
  );
}

export default CatalystDetailModal;
