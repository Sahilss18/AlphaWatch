import React from 'react';
import { ArrowDown, Plus, CheckCircle2, History, Sparkles } from 'lucide-react';

export function HeroSection({
  watchlistPulse,
  onScrollToSignals,
  onOpenAddModal,
  onRecordCheckpoint,
  isRecordingCheckpoint
}) {
  const timeAwayText = watchlistPulse?.time_since_last_visit_formatted || '4 hours ago';

  return (
    <section className="relative pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-[#1e293b]/60 bg-gradient-to-b from-[#0c1220]/40 to-transparent">
      <div className="max-w-7xl mx-auto">
        {/* Visit Checkpoint Meta Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-mono font-semibold tracking-wide mb-6 backdrop-blur-md">
          <History className="w-3.5 h-3.5 text-cyan-400" />
          <span>CHECKPOINT: SINCE YOUR LAST VISIT — {timeAwayText.toUpperCase()}</span>
          <button
            onClick={onRecordCheckpoint}
            disabled={isRecordingCheckpoint}
            className="ml-2 px-2 py-0.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-[10px] text-cyan-200 hover:text-white border border-cyan-500/40 transition-all cursor-pointer"
            title="Set a new checkpoint right now"
          >
            {isRecordingCheckpoint ? 'Setting...' : 'Set Fresh Checkpoint'}
          </button>
        </div>

        {/* Headline */}
        <div className="max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-white leading-[1.12]">
            Markets don't need narrating.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400">
              They need what changed.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            AlphaWatch compares live market snapshots against your last checkpoint and surfaces only the alpha signals worth your attention — ranked by attention score, explained with mathematical baselines, and stripped of noise.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onScrollToSignals}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold text-sm transition-all shadow-lg shadow-cyan-500/25 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
              <span>Explore Alpha Signals</span>
              <ArrowDown className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-600 text-slate-200 font-medium text-sm transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>+ Add Ticker</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

