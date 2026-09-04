import React from 'react';
import { Radio, Zap, Activity, CheckCircle2, ShieldAlert, HeartPulse, Layers } from 'lucide-react';
import { formatPercent } from '../utils/formatters';

export function WatchlistPulse({ pulse, health }) {
  const deviation = pulse?.aggregate_deviation_percent ?? 0.0;
  const isPos = deviation > 0;
  const isNeg = deviation < 0;

  const trackedCount = pulse?.tracked_count ?? 9;
  const criticalCount = pulse?.critical_count ?? health?.critical_count ?? 2;
  const highCount = pulse?.high_count ?? health?.high_count ?? 2;
  const moderateCount = pulse?.moderate_count ?? health?.moderate_count ?? 1;
  const normalCount = pulse?.normal_count ?? health?.normal_count ?? 4;
  const volAnomalies = pulse?.volume_anomalies_count ?? 0;

  const volatilityPct = health?.watchlist_volatility_pct ?? 78;
  const unusualPct = health?.unusual_activity_pct ?? 61;
  const contextStatus = health?.context_health_status ?? 'SECTOR VOLATILITY ELEVATED';

  return (
    <div className="w-full space-y-4">
      {/* Primary Pulse & Aggregate Deviation Bar */}
      <div className="w-full bg-[#0c1220] border border-[#1e293b] rounded-lg p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Background Radar Visual */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none hidden sm:flex items-center justify-end pr-8">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-emerald-500 animate-radar"></div>
            <div className="absolute inset-3 rounded-full border border-emerald-500/40"></div>
            <div className="absolute inset-8 rounded-full border border-emerald-500/20"></div>
            <Radio className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Aggregate Deviation Metric */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>WATCHLIST PULSE — AGGREGATE DEVIATION</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span
                className={`text-4xl sm:text-5xl font-display font-extrabold tracking-tight ${
                  isPos
                    ? 'text-emerald-400'
                    : isNeg
                    ? 'text-rose-400'
                    : 'text-slate-200'
                }`}
              >
                {formatPercent(deviation)}
              </span>
              <span className="text-sm font-mono text-slate-400">
                vs last visit checkpoint
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1 font-mono">
              Aggregate directional delta across all {trackedCount} monitored watchlist assets.
            </p>
          </div>

          {/* Right: Quick Breakdown Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#131c31] border border-[#1e293b] p-3 rounded text-center">
              <div className="text-xs font-mono text-slate-400">Tracked</div>
              <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">{trackedCount}</div>
              <div className="text-[10px] text-slate-500 font-mono">total assets</div>
            </div>

            <div className="bg-[#131c31] border border-amber-500/30 p-3 rounded text-center">
              <div className="text-xs font-mono text-amber-400 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" /> Flagged
              </div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">{criticalCount + highCount}</div>
              <div className="text-[10px] text-slate-500 font-mono">attention &gt; 70</div>
            </div>

            <div className="bg-[#131c31] border border-cyan-500/30 p-3 rounded text-center">
              <div className="text-xs font-mono text-cyan-400 flex items-center justify-center gap-1">
                <Activity className="w-3 h-3" /> Volume
              </div>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{volAnomalies}</div>
              <div className="text-[10px] text-slate-500 font-mono">unusual flow</div>
            </div>

            <div className="bg-[#131c31] border border-emerald-500/20 p-3 rounded text-center">
              <div className="text-xs font-mono text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Quiet
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{normalCount}</div>
              <div className="text-[10px] text-slate-500 font-mono">noise filtered</div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE 5: WATCHLIST HEALTH COMPONENT */}
      <div className="w-full bg-[#0c1220] border border-[#1e293b] rounded-lg p-5 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-[#1e293b] pb-3 gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wide">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>WATCHLIST HEALTH SUMMARY</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">{trackedCount} tracked:</span>
            <span className="text-rose-400 font-bold">{criticalCount} critical</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-bold">{highCount} high</span>
            <span className="text-slate-600">•</span>
            <span className="text-yellow-400 font-bold">{moderateCount} moderate</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-bold">{normalCount} normal</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Volatility Meter */}
          <div className="bg-[#131c31] p-3.5 rounded border border-[#1e293b]">
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Watchlist Volatility</span>
              <strong className="text-emerald-400">{volatilityPct}%</strong>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${volatilityPct}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Dispersion vs historical normal</span>
          </div>

          {/* Unusual Activity Meter */}
          <div className="bg-[#131c31] p-3.5 rounded border border-[#1e293b]">
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Unusual Activity</span>
              <strong className="text-amber-400">{unusualPct}%</strong>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${unusualPct}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Assets with elevated attention</span>
          </div>

          {/* Context Status */}
          <div className="bg-[#131c31] p-3.5 rounded border border-[#1e293b] flex flex-col justify-between">
            <div className="text-[11px] text-slate-400 uppercase">Context Diagnosis</div>
            <div className="text-xs font-bold text-cyan-300 mt-1 truncate">
              {contextStatus}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {health?.summary_verdict || 'Real-time market sector analysis.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
