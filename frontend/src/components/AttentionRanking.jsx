import React from 'react';
import { Flame, ArrowDown, ChevronRight } from 'lucide-react';
import { getAttentionLevelStyles, formatPercent, getContextClassificationBadge } from '../utils/formatters';

export function AttentionRanking({ topSignals, onSelectSignal, onViewAllSignals }) {
  if (!topSignals || topSignals.length === 0) return null;

  const displayList = topSignals.slice(0, 4);

  return (
    <div className="w-full bg-[#0c1220] border border-[#1e293b] rounded-lg p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 tracking-wider uppercase">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>TOP ATTENTION BUDGET</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-500">
            Top prioritized anomalies (0–100)
          </span>
          {onViewAllSignals && (
            <button
              onClick={onViewAllSignals}
              className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <span>View all signals</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {displayList.map((sig, idx) => {
          const styles = getAttentionLevelStyles(sig.attention_level, sig.attention_score);
          const isPos = sig.percentage_change > 0;
          const contextBadge = getContextClassificationBadge(sig.market_context?.classification);

          // Build concise anomaly descriptor
          let anomalyDesc = 'Elevated attention';
          if (sig.market_context?.classification === 'STOCK-SPECIFIC') {
            anomalyDesc = 'Stock-specific anomaly';
          } else if (sig.market_context?.classification === 'SECTOR-WIDE') {
            anomalyDesc = 'Sector-wide movement';
          } else if (sig.signal_type === 'VOLUME_ANOMALY') {
            anomalyDesc = 'Volume anomaly';
          } else if (sig.signal_type === 'BREAKOUT') {
            anomalyDesc = 'Developing breakout';
          } else if (sig.signal_type === 'NEW_HIGH') {
            anomalyDesc = '52-week high breakout';
          } else if (sig.signal_type === 'NEW_LOW') {
            anomalyDesc = '52-week low test';
          }

          return (
            <div
              key={sig.symbol}
              onClick={() => onSelectSignal && onSelectSignal(sig.symbol)}
              className={`p-3.5 rounded border ${styles.border} bg-[#131c31] hover:bg-[#19243d] transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500 group-hover:text-slate-300">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-mono font-bold text-base text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {sig.symbol}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[110px]">
                      {sig.company_name}
                    </span>
                  </div>
                </div>

                {/* Score Pill */}
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded font-mono font-extrabold text-xs ${styles.badge}`}>
                    {sig.attention_score}
                  </span>
                </div>
              </div>

              {/* Anomaly & Context Descriptor */}
              <div className="mt-3 pt-2.5 border-t border-[#1e293b]/70 flex items-center justify-between text-xs font-mono">
                <span className="text-[11px] text-slate-300 truncate">
                  {anomalyDesc}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatPercent(sig.percentage_change)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
