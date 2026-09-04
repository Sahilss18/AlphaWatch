import React from 'react';
import { Terminal, Database, ShieldCheck, Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#1e293b]/70 bg-[#060911]/90 py-8 text-xs font-mono text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-900 border border-slate-700/60 p-0.5 flex items-center justify-center">
            <img
              src="/alphawatch-logo-transparent.png"
              alt="AlphaWatch"
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <span className="text-slate-200 font-semibold font-display text-sm tracking-wide">
            AlphaWatch — Market Intelligence Platform
          </span>
        </div>

        {/* Center System Status Badges */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <Database className="w-3 h-3 text-cyan-400" /> MySQL ORM Active
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <Terminal className="w-3 h-3 text-indigo-400" /> FastAPI Engine v1.0
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Snapshot Diffing Online
          </span>
        </div>

        {/* Right copyright */}
        <div className="text-slate-400 text-[11px]">
          AlphaWatch © {new Date().getFullYear()} — Built for high-signal intelligence.
        </div>
      </div>
    </footer>
  );
}

