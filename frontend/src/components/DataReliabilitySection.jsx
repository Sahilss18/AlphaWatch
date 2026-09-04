import React from 'react';
import { ShieldCheck, Database, EyeOff, Scale, Server, Clock } from 'lucide-react';

export function DataReliabilitySection() {
  const principles = [
    {
      icon: EyeOff,
      title: 'No Fake "Live" Guarantees',
      desc: 'If external market feeds delay or hit provider rate boundaries, the UI explicitly flags DATA DELAYED or STALE rather than manufacturing false real-time certainty.',
    },
    {
      icon: Scale,
      title: 'Adaptive Volatility baselines',
      desc: 'Moves are never evaluated on blunt arbitrary thresholds (e.g. 5%). A 4% move on a 1% normal stock triggers high attention, while on a 6% stock it is quiet.',
    },
    {
      icon: Database,
      title: 'Persistent MySQL Snapshots',
      desc: 'Every quote and user visit checkpoint is timestamped and stored in MySQL, enabling true mathematical diffing across hours or days away.',
    },
    {
      icon: Clock,
      title: 'Rate-Limit Shielding',
      desc: 'Intelligent in-memory caching and tiered refresh intervals ensure the app never abuses upstream exchange bandwidth or triggers 429 throttling.',
    },
  ];

  return (
    <section className="w-full py-10 border-t border-[#1e293b]">
      <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-1">
        <ShieldCheck className="w-4 h-4" />
        <span>DATA INTEGRITY ARCHITECTURE</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-100">
        How it stays honest
      </h2>
      <p className="text-sm text-slate-400 mt-1 max-w-2xl mb-8">
        Designed from the ground up for mathematical transparency, explainability, and rigorous data reliability.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {principles.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-[#0c1220] border border-[#1e293b] p-5 rounded-lg flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-sm text-slate-200">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
