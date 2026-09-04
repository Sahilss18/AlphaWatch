import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Sun, Moon, ShieldAlert, Wifi, Clock, Plus, Sparkles, ChevronRight } from 'lucide-react';
import { formatTimeAgo } from '../utils/formatters';

export function TopNav({
  apiStatus,
  isRefreshing,
  onRefresh,
  theme,
  onToggleTheme,
  onOpenAddModal,
  onRecordCheckpoint,
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
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">LIVE STREAM</span>
          <span className="sm:hidden">LIVE</span>
        </div>
      );
    }
    if (status === 'DELAYED') {
      return (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-mono font-medium">
          <span className="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          <span className="hidden sm:inline">DELAYED ({apiStatus?.data_age_seconds ? Math.floor(apiStatus.data_age_seconds / 60) : 15}m)</span>
          <span className="sm:hidden">DELAYED</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono font-medium">
        <span className="inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        <span className="hidden sm:inline">FEED OFFLINE (FALLBACK)</span>
        <span className="sm:hidden">OFFLINE</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1e293b]/70 bg-[#080c16]/80 backdrop-blur-xl shadow-2xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & AlphaWatch Logo */}
        <div className="flex items-center gap-6">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 flex items-center justify-center rounded-lg overflow-hidden bg-slate-900/60 border border-slate-700/60 p-0.5 group-hover:border-cyan-500/50 transition-all shadow-md shadow-cyan-500/10">
              <img
                src="/alphawatch-logo-transparent.png"
                alt="AlphaWatch AW Logo"
                className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-xl tracking-wide text-white group-hover:text-cyan-400 transition-colors">
                  Alpha<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Watch</span>
                </span>
                <span className="hidden md:inline-block px-1.5 py-0.2 rounded bg-indigo-500/20 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">
                  PRO
                </span>
              </div>
              <span className="hidden md:block text-[10px] text-slate-400 font-mono tracking-tight -mt-0.5">
                Market Intelligence Terminal
              </span>
            </div>
          </a>

          {/* Flowbase-style Navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#signals" className="hover:text-white transition-colors">Intelligence</a>
            <a href="#matrix" className="hover:text-purple-300 transition-colors">Matrix</a>
            <a href="#watchlist" className="hover:text-white transition-colors">Watchlist</a>
            <a href="#pulse" className="hover:text-white transition-colors">Pulse & Health</a>
            <a href="#architecture" className="hover:text-slate-200 transition-colors text-slate-400">Architecture</a>
          </nav>
        </div>

        {/* Right Actions & Flowbase style CTA Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Status Badge */}
          {getStatusBadge()}

          {/* Quick Add Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#151d30] hover:bg-[#1c2742] border border-[#273553] text-slate-200 text-xs font-semibold tracking-wide transition-all shadow-sm hover:border-slate-500 active:scale-95 cursor-pointer"
            title="Add stock ticker"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Ticker</span>
          </button>

          {/* Flowbase-style "Try For Free / Checkpoint" Pill Button */}
          {onRecordCheckpoint && (
            <button
              onClick={onRecordCheckpoint}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-slate-100 text-[#090d16] font-semibold text-xs tracking-tight shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              title="Set new visit baseline"
            >
              <span>Sync Checkpoint</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-full border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 cursor-pointer'
            }`}
            title="Refresh market data now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

