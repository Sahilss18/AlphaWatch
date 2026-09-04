import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

const POPULAR_SUGGESTIONS = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'PLTR', name: 'Palantir Technologies' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'COIN', name: 'Coinbase Global' },
];

export function AddTickerModal({ isOpen, onClose, onAddSuccess }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSearchResults([]);
      setErrorMessage('');
      setSuccessMessage('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setErrorMessage('');
      try {
        const results = await api.searchSymbols(query.trim());
        setSearchResults(results || []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleAdd = async (symbol, name) => {
    setIsAdding(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await onAddSuccess(symbol, name);
      setSuccessMessage(`Successfully added ${symbol} to watchlist!`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || `Failed to add ${symbol}.`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      handleAdd(query.trim().toUpperCase(), null);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0c1220] border border-[#1e293b] rounded-lg max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
          <div>
            <h3 className="text-lg font-display font-bold text-slate-100">
              Add Stock Ticker
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Monitor real-time snapshot diffs & anomaly alerts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleManualSubmit} className="mt-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search ticker (e.g. NVDA, AAPL, PLTR)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2.5 rounded bg-[#131c31] border border-[#1e293b] focus:border-emerald-500 focus:outline-none text-sm font-mono text-slate-100 placeholder:text-slate-500"
            />
            {query && (
              <button
                type="submit"
                disabled={isAdding}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-mono transition-all disabled:opacity-50 cursor-pointer"
              >
                {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
              </button>
            )}
          </div>
        </form>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mt-3 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mt-3 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Search Results / Suggestions */}
        <div className="mt-4 max-h-60 overflow-y-auto pr-1">
          {isSearching ? (
            <div className="flex items-center justify-center py-8 text-xs font-mono text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Querying exchange catalog...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400 uppercase mb-1">
                Search Results:
              </div>
              {searchResults.map((item) => (
                <div
                  key={item.symbol}
                  className="p-2.5 rounded bg-[#131c31] border border-[#1e293b] hover:border-slate-600 flex items-center justify-between transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-100 group-hover:text-emerald-400">
                        {item.display_symbol || item.symbol}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 truncate max-w-xs">
                      {item.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAdd(item.symbol, item.description)}
                    disabled={isAdding}
                    className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-mono transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Track</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase mb-2">
                Popular High-Velocity Tickers:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug.symbol}
                    onClick={() => handleAdd(sug.symbol, sug.name)}
                    disabled={isAdding}
                    className="p-2 rounded bg-[#131c31] border border-[#1e293b] hover:border-emerald-500/50 hover:bg-[#19243d] text-left transition-all group flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-slate-200 group-hover:text-emerald-400">
                        {sug.symbol}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                        {sug.name}
                      </div>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
