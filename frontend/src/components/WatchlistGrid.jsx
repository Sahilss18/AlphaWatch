import React, { useState } from 'react';
import { Trash2, TrendingUp, TrendingDown, Clock, Activity, Plus, Search, Eye } from 'lucide-react';
import {
  formatCurrency,
  formatPercent,
  formatTimeAgo,
  getAttentionLevelStyles,
  getSignalTypeBadge,
  getContextClassificationBadge,
  getLifecycleStatusBadge
} from '../utils/formatters';

export function WatchlistGrid({
  watchlist,
  onOpenAddModal,
  onSelectStock,
  onRemoveStock,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockPendingRemoval, setStockPendingRemoval] = useState(null);

  const items = watchlist?.items || [];

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q)
    );
  });

  const handleConfirmRemove = (e) => {
    e.stopPropagation();
    if (stockPendingRemoval) {
      onRemoveStock(stockPendingRemoval.symbol);
      setStockPendingRemoval(null);
    }
  };

  return (
    <section className="w-full pt-6 pb-10 border-t border-[#1e293b]">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>PORTFOLIO TRACKER</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-100">
            Your watchlist
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Every ticker you track with live market status, context classification, and signal lifecycle state.
          </p>
        </div>

        {/* Search & Add Bar */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter tracked..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded bg-[#0c1220] border border-[#1e293b] text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-36 sm:w-48 transition-all"
            />
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold font-mono tracking-wide transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Grid of Stock Tiles */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#0c1220] border border-dashed border-[#1e293b] rounded-lg p-10 text-center">
          <p className="text-sm text-slate-300 font-mono">
            {items.length === 0
              ? 'Your watchlist is currently empty.'
              : `No tracked tickers match "${searchQuery}".`}
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-500 text-black text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add your first ticker</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((stock) => {
            const isPos = (stock.since_last_visit_change_percent ?? stock.change_percent) > 0;
            const isNeg = (stock.since_last_visit_change_percent ?? stock.change_percent) < 0;
            const styles = getAttentionLevelStyles(stock.attention_level, stock.attention_score);
            const contextBadge = getContextClassificationBadge(stock.context_classification);
            const lifecycleBadge = getLifecycleStatusBadge(stock.lifecycle_status);

            return (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock && onSelectStock(stock.symbol)}
                className="bg-[#0c1220] border border-[#1e293b] hover:border-slate-600 rounded-lg p-4 sm:p-5 transition-all cursor-pointer group hover:bg-[#11192c] relative flex flex-col justify-between"
              >
                {/* Tile Top */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {stock.symbol}
                        </span>
                        {stock.is_stale && (
                          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            STALE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate max-w-[180px]">
                        {stock.name}
                      </p>
                    </div>

                    {/* Attention Badge & Remove Button */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${styles.badge}`}
                      >
                        {stock.attention_score} {stock.attention_level.slice(0, 4)}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStockPendingRemoval(stock);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title={`Remove ${stock.symbol}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Context Classification & Lifecycle Badges */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 font-mono">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${contextBadge.pill}`}>
                      {contextBadge.emoji} {contextBadge.label}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${lifecycleBadge.pill}`}>
                      ● {lifecycleBadge.label}
                    </span>
                  </div>

                  {/* Live Price & Since Last Visit Delta */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-slate-100">
                      {formatCurrency(stock.price)}
                    </span>
                    <div
                      className={`text-xs font-mono font-semibold flex items-center ${
                        isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {isPos ? (
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                      ) : isNeg ? (
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                      ) : null}
                      {formatPercent(stock.since_last_visit_change_percent ?? stock.change_percent)}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    since last visit checkpoint
                  </div>
                </div>

                {/* Badges & Meta Footer */}
                <div className="mt-4 pt-3 border-t border-[#1e293b]/70 flex items-center justify-between text-[11px] font-mono">
                  {/* Signal Tags */}
                  <div className="flex flex-wrap gap-1">
                    {stock.signals && stock.signals.slice(0, 2).map((sigType, i) => {
                      const badge = getSignalTypeBadge(sigType);
                      return (
                        <span
                          key={i}
                          className={`text-[9px] px-1.5 py-0.5 rounded ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      );
                    })}
                  </div>

                  {/* Sync Time */}
                  <div className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatTimeAgo(stock.last_updated)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {stockPendingRemoval && (
        <div
          onClick={() => setStockPendingRemoval(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0c1220] border border-rose-500/40 rounded-lg max-w-sm w-full p-6 shadow-2xl"
          >
            <h3 className="text-lg font-display font-bold text-slate-100">
              Remove {stockPendingRemoval.symbol}?
            </h3>
            <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-200">{stockPendingRemoval.name}</strong> from your active monitored watchlist?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => setStockPendingRemoval(null)}
                className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                className="px-3.5 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors cursor-pointer"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
