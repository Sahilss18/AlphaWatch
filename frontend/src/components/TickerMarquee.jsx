import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';

export function TickerMarquee({ marketSummary, onSelectTicker }) {
  const tickers = marketSummary?.tickers || [];

  if (tickers.length === 0) {
    return (
      <div className="w-full bg-[#080d19] border-y border-[#1e293b] py-2 px-4 text-xs font-mono text-slate-500 flex items-center justify-center">
        <span>Connecting to live exchange stream...</span>
      </div>
    );
  }

  // Duplicate ticker list to ensure uninterrupted infinite marquee loop
  const marqueeItems = [...tickers, ...tickers];

  return (
    <div className="w-full bg-[#080d19] border-y border-[#1e293b] py-2 overflow-hidden select-none">
      <div className="flex animate-marquee items-center gap-8">
        {marqueeItems.map((item, idx) => {
          const isPos = item.change_percent > 0;
          const isNeg = item.change_percent < 0;

          return (
            <div
              key={`${item.symbol}-${idx}`}
              onClick={() => onSelectTicker && onSelectTicker(item.symbol)}
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/60 px-2 py-0.5 rounded transition-colors group"
            >
              <span className="font-mono font-bold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">
                {item.symbol}
              </span>
              <span className="font-mono text-xs text-slate-400">
                {formatCurrency(item.price)}
              </span>
              <div
                className={`flex items-center text-xs font-mono font-semibold ${
                  isPos
                    ? 'text-emerald-400'
                    : isNeg
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {isPos ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : isNeg ? (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                ) : (
                  <Minus className="w-3 h-3 mr-0.5" />
                )}
                {formatPercent(item.change_percent)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
