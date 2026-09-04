import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Sun, Moon, ShieldAlert, Wifi, Clock, Plus } from 'lucide-react';
import { formatTimeAgo } from '../utils/formatters';

export function TopNav({
  apiStatus,
  isRefreshing,
  onRefresh,
  theme,
  onToggleTheme,
  onOpenAddModal,
  lastRefreshedAt
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusBadge = () => {
    const status = apiStatus?.feed_status || 'LIVE';
    if (status === 'LIVE') {
      return (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">LIVE FEED CONNECTED</span>
          <span className="sm:hidden">LIVE</span>
        </div>
      );
    }
    if (status === 'DELAYED') {
      return (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-mono font-medium">
          <span className="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          <span className="hidden sm:inline">DATA DELAYED ({apiStatus?.data_age_seconds ? Math.floor(apiStatus.data_age_seconds / 60) : 15}m)</span>
          <span className="sm:hidden">DELAYED</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono font-medium">
        <span className="inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        <span className="hidden sm:inline">FEED OFFLINE (FALLBACK)</span>
        <span className="sm:hidden">OFFLINE</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1e293b] dark:border-[#1e293b] bg-[#0c1220]/90 dark:bg-[#0c1220]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-black font-mono font-bold text-base tracking-tighter">
            S/W
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-wider text-slate-100">
                SIGNAL<span className="text-emerald-400">/</span>WATCH
              </span>
              <span className="hidden md:inline-block px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                v1.0
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-mono -mt-0.5">
              Intelligent Attention & Anomaly Engine
            </p>
          </div>
        </div>

        {/* Right Actions & Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Badge */}
          {getStatusBadge()}

          {/* Clock & Sync Meta */}
          <div className="hidden lg:flex flex-col items-end text-[11px] font-mono text-slate-400 px-2 border-r border-slate-800">
            <div className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{currentTime.toLocaleTimeString()} UTC</span>
            </div>
            <span className="text-[10px] text-slate-500">
              Synced {formatTimeAgo(lastRefreshedAt)}
            </span>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold tracking-wide transition-all shadow-sm hover:shadow-emerald-500/25 active:scale-95 cursor-pointer"
            title="Add stock ticker"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Ticker</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 cursor-pointer'
            }`}
            title="Refresh market data now"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
