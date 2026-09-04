import React from 'react';
import { Terminal, Database, ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#1e293b] bg-[#060911] py-8 text-xs font-mono text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
            S/W
          </div>
          <span className="text-slate-300 font-semibold font-display">
            SIGNAL/WATCH — Smart Market Watchlist
          </span>
        </div>

        {/* Center System Status Badges */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            <Database className="w-3 h-3 text-emerald-400" /> MySQL ORM Active
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            <Terminal className="w-3 h-3 text-cyan-400" /> FastAPI Engine v1.0
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            <ShieldCheck className="w-3 h-3 text-amber-400" /> Snapshot Diffing Online
          </span>
        </div>

        {/* Right copyright */}
        <div className="text-slate-500 text-[11px]">
          Built for high-signal market intelligence & noise suppression.
        </div>
      </div>
    </footer>
  );
}
