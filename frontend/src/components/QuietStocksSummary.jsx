import React from 'react';
import { CheckCircle2, ShieldCheck, Filter, BellOff } from 'lucide-react';

export function QuietStocksSummary({ pulse }) {
  const tracked = pulse?.tracked_count || 0;
  const critical = pulse?.critical_count || 0;
  const high = pulse?.high_count || 0;
  const moderate = pulse?.moderate_count || 0;
  const quiet = pulse?.quiet_stocks_count || 0;

  const attentionTotal = critical + high;

  return (
    <div className="w-full bg-[#080d19] border border-[#1e293b] rounded-lg p-4 sm:p-5 my-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
          <BellOff className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-display text-slate-100">
              Noise Suppression Filter Active
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-emerald-400 border border-slate-700">
              {quiet} quiet asset{quiet !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5 max-w-xl">
            AlphaWatch continuously monitors your entire portfolio. Assets moving within normal daily volatility parameters are intentionally suppressed from alert feeds to prevent notification fatigue.
          </p>
        </div>
      </div>

      {/* Summary Pills */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs shrink-0">
        <div className="px-2.5 py-1 rounded bg-[#131c31] border border-[#1e293b] text-slate-300">
          <strong className="text-slate-100">{tracked}</strong> monitored
        </div>
        <div className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <strong className="text-amber-300">{attentionTotal}</strong> attention
        </div>
        <div className="px-2.5 py-1 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
          <strong className="text-yellow-300">{moderate}</strong> moderate
        </div>
        <div className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <strong className="text-emerald-300">{quiet}</strong> normal
        </div>
      </div>
    </div>
  );
}
