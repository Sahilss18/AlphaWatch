import React, { useState, useRef } from 'react';
import { useMarketData } from './hooks/useMarketData';
import { useTheme } from './hooks/useTheme';
import { TopNav } from './components/TopNav';
import { TickerMarquee } from './components/TickerMarquee';
import { HeroSection } from './components/HeroSection';
import { WatchlistPulse } from './components/WatchlistPulse';
import { AttentionRanking } from './components/AttentionRanking';
import { SignalFeed } from './components/SignalFeed';
import { QuietStocksSummary } from './components/QuietStocksSummary';
import { WatchlistGrid } from './components/WatchlistGrid';
import { DataReliabilitySection } from './components/DataReliabilitySection';
import { ArchitectureSection } from './components/ArchitectureSection';
import { Footer } from './components/Footer';
import { AddTickerModal } from './components/AddTickerModal';
import { StockDetailModal } from './components/StockDetailModal';
import LiquidEther from './components/LiquidEther';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

export function App() {
  const {
    watchlist,
    signals,
    marketSummary,
    apiStatus,
    isLoading,
    isRefreshing,
    error,
    lastRefreshedAt,
    refreshData,
    addTicker,
    removeTicker,
    recordVisitCheckpoint,
  } = useMarketData();

  const { theme, toggleTheme } = useTheme();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStockForDetail, setSelectedStockForDetail] = useState(null);
  const [isRecordingCheckpoint, setIsRecordingCheckpoint] = useState(false);

  const signalFeedRef = useRef(null);

  const scrollToSignals = () => {
    signalFeedRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRecordCheckpoint = async () => {
    setIsRecordingCheckpoint(true);
    try {
      await recordVisitCheckpoint();
    } finally {
      setIsRecordingCheckpoint(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      {/* Interactive LiquidEther Background Canvas */}
      <div className="absolute top-0 left-0 right-0 h-[650px] pointer-events-none z-0 overflow-hidden opacity-90">
        <div style={{ width: '100%', height: 650, position: 'relative' }}>
          <LiquidEther
            colors={[ '#5227FF', '#FF9FFC', '#B497CF' ]}
            mouseForce={20}
            cursorSize={100}
            isViscous
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
            color0="#5227FF"
            color1="#FF9FFC"
            color2="#B497CF"
          />
        </div>
      </div>

      {/* Tech Grid Accent Overlay */}
      <div className="fixed inset-0 bg-tech-grid opacity-50 pointer-events-none z-0"></div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top Navigation */}
        <TopNav
          apiStatus={apiStatus}
          isRefreshing={isRefreshing}
          onRefresh={refreshData}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onRecordCheckpoint={handleRecordCheckpoint}
          lastRefreshedAt={lastRefreshedAt}
        />

        {/* Scrolling Ticker Marquee */}
        <TickerMarquee
          marketSummary={marketSummary}
          onSelectTicker={(sym) => setSelectedStockForDetail(sym)}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* Global Error Banner */}
          {error && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={refreshData}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && !watchlist ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                <Loader2 className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <div className="text-center font-mono">
                <h3 className="text-sm font-bold text-slate-200">
                  Initializing AlphaWatch Engine...
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Connecting to live market feeds & calculating snapshot diffs
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Hero Banner Section */}
              <HeroSection
                watchlistPulse={watchlist?.pulse}
                onScrollToSignals={scrollToSignals}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onRecordCheckpoint={handleRecordCheckpoint}
                isRecordingCheckpoint={isRecordingCheckpoint}
              />

              {/* Watchlist Pulse & Health Component */}
              <div id="pulse">
                <WatchlistPulse pulse={watchlist?.pulse} health={watchlist?.health} />
              </div>

              {/* Top Attention Budget */}
              <AttentionRanking
                topSignals={signals?.top_attention_budget}
                onSelectSignal={(sym) => setSelectedStockForDetail(sym)}
                onViewAllSignals={scrollToSignals}
              />

              {/* What Deserves Your Attention - Signals Feed */}
              <div id="signals" ref={signalFeedRef}>
                <SignalFeed
                  signals={signals}
                  selectedSymbol={selectedStockForDetail}
                  onSelectStock={(sym) => setSelectedStockForDetail(sym)}
                  feedRef={signalFeedRef}
                />
              </div>

              {/* Noise Suppression Summary */}
              <QuietStocksSummary pulse={watchlist?.pulse} />

              {/* Full Watchlist Grid */}
              <div id="watchlist">
                <WatchlistGrid
                  watchlist={watchlist}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onSelectStock={(sym) => setSelectedStockForDetail(sym)}
                  onRemoveStock={removeTicker}
                />
              </div>

              {/* Data Reliability Section */}
              <DataReliabilitySection />

              {/* Architecture Explanation Section */}
              <div id="architecture">
                <ArchitectureSection />
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Add Stock Modal */}
      <AddTickerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSuccess={addTicker}
      />

      {/* Stock Deep Dive Detail Modal */}
      <StockDetailModal
        symbol={selectedStockForDetail}
        isOpen={!!selectedStockForDetail}
        onClose={() => setSelectedStockForDetail(null)}
      />
    </div>
  );
}

export default App;

