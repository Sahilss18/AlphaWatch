import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Clock, Activity, Shield, BarChart3, Loader2 } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatPercent, formatTimeAgo, formatLargeNumber } from '../utils/formatters';

export function StockDetailModal({ symbol, isOpen, onClose }) {
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !symbol) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    api.getStockHistory(symbol)
      .then((data) => {
        if (isMounted) setHistoryData(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load stock history');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol, isOpen]);

  if (!isOpen || !symbol) return null;

  const isPos = (historyData?.since_last_visit_change_percent || 0) >= 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0c1220] border border-[#1e293b] rounded-lg max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#1e293b]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold text-slate-100">
                {symbol}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {historyData?.company_name || 'Loading...'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Historical snapshot diffing & volatility envelope
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 font-mono text-xs gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Retrieving persisted snapshots & historical metrics...</span>
          </div>
        ) : error ? (
          <div className="p-4 my-6 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            {error}
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {/* Price Delta Comparison Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-[#131c31] border border-[#1e293b] p-3.5 rounded">
                <div className="text-xs text-slate-400">Current Price</div>
                <div className="text-lg font-bold text-slate-100 mt-1">
                  {formatCurrency(historyData?.current_price)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Live Exchange</div>
              </div>

              <div className="bg-[#131c31] border border-[#1e293b] p-3.5 rounded">
                <div className="text-xs text-slate-400">Today's Move</div>
                <div
                  className={`text-lg font-bold flex items-center mt-1 ${
                    (historyData?.day_change_percent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {(historyData?.day_change_percent || 0) >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  )}
                  {formatPercent(historyData?.day_change_percent)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">vs Prev Close</div>
              </div>

              <div className="bg-[#131c31] border border-[#1e293b] p-3.5 rounded">
                <div className="text-xs text-slate-400">Last Checkpoint</div>
                <div className="text-lg font-bold text-slate-200 mt-1">
                  {historyData?.last_visit_price ? formatCurrency(historyData.last_visit_price) : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Recorded Visit Price</div>
              </div>

              <div className="bg-[#131c31] border border-[#1e293b] p-3.5 rounded">
                <div className="text-xs text-slate-400">Since Checkpoint</div>
                <div
                  className={`text-lg font-bold flex items-center mt-1 ${
                    isPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPos ? (
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  )}
                  {formatPercent(historyData?.since_last_visit_change_percent)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Net away delta</div>
              </div>
            </div>

            {/* Baseline Parameters & Boundaries */}
            <div className="bg-[#080d19] border border-[#1e293b] p-4 rounded text-xs font-mono space-y-2">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Statistical Envelope Parameters</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400">
                <div>
                  <span className="text-slate-500 block text-[10px]">Normal Daily Vol:</span>
                  <span className="text-slate-200 font-bold">±{historyData?.volatility?.toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Avg 10D Volume:</span>
                  <span className="text-slate-200 font-bold">{formatLargeNumber(historyData?.average_volume)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">52-Week High:</span>
                  <span className="text-slate-200 font-bold">{historyData?.week_52_high ? formatCurrency(historyData.week_52_high) : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">52-Week Low:</span>
                  <span className="text-slate-200 font-bold">{historyData?.week_52_low ? formatCurrency(historyData.week_52_low) : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Historical Snapshots Table */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Persisted Snapshot Audit Trail ({historyData?.historical_snapshots?.length || 0})</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Stored in MySQL</span>
              </div>

              <div className="border border-[#1e293b] rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-[#131c31] text-slate-400 border-b border-[#1e293b]">
                      <th className="py-2 px-3 font-semibold">Snapshot ID</th>
                      <th className="py-2 px-3 font-semibold">Price</th>
                      <th className="py-2 px-3 font-semibold">Prev Close</th>
                      <th className="py-2 px-3 font-semibold">Day Change</th>
                      <th className="py-2 px-3 font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/60">
                    {historyData?.historical_snapshots?.map((s) => {
                      const sPos = s.change_percent >= 0;
                      return (
                        <tr key={s.id} className="hover:bg-[#131c31]/40 transition-colors">
                          <td className="py-2 px-3 text-slate-500 font-bold">#{s.id}</td>
                          <td className="py-2 px-3 text-slate-100 font-bold">{formatCurrency(s.price)}</td>
                          <td className="py-2 px-3 text-slate-400">{formatCurrency(s.previous_close)}</td>
                          <td className={`py-2 px-3 font-semibold ${sPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatPercent(s.change_percent)}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px]">
                            {new Date(s.timestamp).toLocaleTimeString()} ({formatTimeAgo(s.timestamp)})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
