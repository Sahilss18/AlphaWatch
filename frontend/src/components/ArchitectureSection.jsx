import React from 'react';
import { Cpu, ArrowRight, Database, Server, RefreshCw, Layout, Layers } from 'lucide-react';

export function ArchitectureSection() {
  const steps = [
    { label: 'Finnhub Live API', icon: Server, desc: 'Real market quote ingestion' },
    { label: 'FastAPI Service', icon: Cpu, desc: 'REST layer & rate caching' },
    { label: 'Snapshot Diff Engine', icon: RefreshCw, desc: 'Time checkpoint comparison' },
    { label: 'Signal Scorer', icon: Layers, desc: 'Z-score & volume anomaly math' },
    { label: 'MySQL Persistence', icon: Database, desc: 'Audit snapshots & change events' },
    { label: 'React Terminal UI', icon: Layout, desc: 'Interactive responsive dashboard' },
  ];

  const features = [
    {
      title: 'SNAPSHOT DIFFING',
      desc: "Every market snapshot is timestamped and compared against the user's previous visit rather than simply comparing against the previous tick.",
    },
    {
      title: 'SIGNAL SCORING',
      desc: 'Price movement, volume anomaly, and historical volatility combine into an explainable 0–100 attention score.',
    },
    {
      title: 'GRACEFUL DEGRADATION',
      desc: 'If external market feeds fail or rate-limit, the last valid MySQL snapshot is served with an explicit stale-data indicator.',
    },
    {
      title: 'SCOPED USER PERSISTENCE',
      desc: 'Each user’s tracked symbols, visit checkpoints, and anomaly events are persisted cleanly with relational foreign keys.',
    },
  ];

  return (
    <section className="w-full py-10 border-t border-[#1e293b]">
      <div className="flex items-center gap-2 text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-1">
        <Cpu className="w-4 h-4" />
        <span>TECHNICAL SYSTEM SPECIFICATION</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-100">
        System Architecture
      </h2>
      <p className="text-sm text-slate-400 mt-1 max-w-2xl mb-8">
        End-to-end data pipeline from exchange feeds to responsive client interface.
      </p>

      {/* Visual Pipeline Flow */}
      <div className="bg-[#0c1220] border border-[#1e293b] p-6 rounded-lg mb-8 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[750px] gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === steps.length - 1;
            return (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center text-center p-3 rounded bg-[#131c31] border border-[#1e293b] flex-1">
                  <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-200">
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">
                    {step.desc}
                  </span>
                </div>
                {!isLast && (
                  <ArrowRight className="w-4 h-4 text-emerald-500/70 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Architecture Deep Dive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feat, i) => (
          <div
            key={i}
            className="p-4 rounded border border-[#1e293b] bg-[#0c1220]/60"
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{feat.title}</span>
            </div>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              {feat.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
