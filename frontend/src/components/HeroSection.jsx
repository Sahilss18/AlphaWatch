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
    <section className="relative pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-[#1e293b]/80 bg-gradient-to-b from-[#0c1220]/60 to-transparent">
      <div className="max-w-7xl mx-auto">
        {/* Visit Checkpoint Meta Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold tracking-wide mb-6">
          <History className="w-3.5 h-3.5" />
          <span>CHECKPOINT: SINCE YOUR LAST VISIT — {timeAwayText.toUpperCase()}</span>
          <button
            onClick={onRecordCheckpoint}
            disabled={isRecordingCheckpoint}
            className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-[10px] text-emerald-300 hover:text-white border border-emerald-500/40 transition-all cursor-pointer"
            title="Set a new checkpoint right now"
          >
            {isRecordingCheckpoint ? 'Setting...' : 'Set Fresh Checkpoint'}
          </button>
        </div>

        {/* Headline */}
        <div className="max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-slate-100 leading-[1.15]">
            Markets don't need narrating.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              They need what changed.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed max-w-3xl">
            Signal/Watch compares new market snapshots against your last visit and surfaces only the moves worth your attention — ranked by attention score, explained with mathematical baselines, and stripped of noise.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onScrollToSignals}
              className="flex items-center gap-2 px-5 py-3 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>View today's signals</span>
              <ArrowDown className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-5 py-3 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:border-slate-600 text-slate-200 font-medium text-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Add ticker</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
