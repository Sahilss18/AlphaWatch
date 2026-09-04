import React, { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import {
  Trash2,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  Plus,
  Search,
  Sparkles,
  Zap
} from 'lucide-react';
import {
  formatCurrency,
  formatPercent,
  formatTimeAgo,
  getAttentionLevelStyles,
  getSignalTypeBadge,
  getContextClassificationBadge,
  getLifecycleStatusBadge
} from '../utils/formatters';

const DEFAULT_PARTICLE_COUNT = 10;
const DEFAULT_SPOTLIGHT_RADIUS = 360;
const DEFAULT_GLOW_COLOR = '132, 0, 255';

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'bento-particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.7);
    pointer-events: none;
    z-index: 50;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = radius => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

const BentoStockCard = ({
  children,
  className = '',
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  onClick
}) => {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;

    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * (width || 250), Math.random() * (height || 200), glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 80,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });

        gsap.to(clone, {
          opacity: 0.25,
          duration: 1.2,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
      }, index * 80);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();
    };

    const handleClick = e => {
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.35) 0%, rgba(${glowColor}, 0.15) 35%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 40;
      `;

      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('click', handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, clickEffect, glowColor]);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`${className} relative overflow-hidden`}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
    >
      {children}
    </div>
  );
};

const WatchlistSpotlight = ({
  containerRef,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}) => {
  const spotlightRef = useRef(null);

  useEffect(() => {
    if (disableAnimations || !containerRef?.current) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'watchlist-global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 700px;
      height: 700px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.14) 0%,
        rgba(${glowColor}, 0.07) 18%,
        rgba(${glowColor}, 0.03) 30%,
        rgba(${glowColor}, 0.01) 50%,
        transparent 70%
      );
      z-index: 30;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = e => {
      if (!spotlightRef.current || !containerRef.current) return;

      const section = containerRef.current;
      const rect = section.getBoundingClientRect();
      const mouseInside =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      const cards = containerRef.current.querySelectorAll('.watchlist-bento-card');

      if (!mouseInside) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
        cards.forEach(card => {
          card.style.setProperty('--glow-intensity', '0');
        });
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach(card => {
        const cardElement = card;
        const cardRect = cardElement.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });

      const targetOpacity =
        minDistance <= proximity
          ? 0.85
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.85
            : 0;

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.4,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      containerRef.current?.querySelectorAll('.watchlist-bento-card').forEach(card => {
        card.style.setProperty('--glow-intensity', '0');
      });
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [containerRef, disableAnimations, spotlightRadius, glowColor]);

  return null;
};

export function WatchlistGrid({
  watchlist,
  onOpenAddModal,
  onSelectStock,
  onRemoveStock,
  glowColor = DEFAULT_GLOW_COLOR,
  spotlightRadius = 380,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  clickEffect = true
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockPendingRemoval, setStockPendingRemoval] = useState(null);
  const containerRef = useRef(null);

  const items = watchlist?.items || [];

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.context_classification?.toLowerCase().includes(q)
    );
  });

  const handleConfirmRemove = (e) => {
    e.stopPropagation();
    if (stockPendingRemoval) {
      onRemoveStock(stockPendingRemoval.symbol);
      setStockPendingRemoval(null);
    }
  };

  return (
    <section className="w-full pt-6 pb-12 border-t border-[#1e293b]/70 relative" ref={containerRef}>
      <style>
        {`
          .watchlist-bento-section {
            --glow-x: 50%;
            --glow-y: 50%;
            --glow-intensity: 0;
            --glow-radius: ${spotlightRadius}px;
            --glow-color: ${glowColor};
          }

          .watchlist-bento-card {
            background-color: #0b0f19;
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
          }

          .watchlist-bento-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(25, 10, 48, 0.5), 0 0 25px rgba(${glowColor}, 0.2);
          }

          .card--border-glow::after {
            content: '';
            position: absolute;
            inset: 0;
            padding: 1.5px;
            background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
                rgba(${glowColor}, calc(var(--glow-intensity) * 0.85)) 0%,
                rgba(${glowColor}, calc(var(--glow-intensity) * 0.4)) 35%,
                transparent 65%);
            border-radius: inherit;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            pointer-events: none;
            opacity: 1;
            transition: opacity 0.25s ease;
            z-index: 10;
          }

          .bento-particle::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: rgba(${glowColor}, 0.3);
            border-radius: 50%;
            z-index: -1;
          }

          /* Custom sleek scrollbar for watchlist container */
          .watchlist-scroll-container::-webkit-scrollbar {
            width: 6px;
          }
          .watchlist-scroll-container::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.4);
            border-radius: 9999px;
          }
          .watchlist-scroll-container::-webkit-scrollbar-thumb {
            background: rgba(132, 0, 255, 0.35);
            border-radius: 9999px;
          }
          .watchlist-scroll-container::-webkit-scrollbar-thumb:hover {
            background: rgba(132, 0, 255, 0.65);
          }
        `}
      </style>

      {/* Global Interactive Spotlight for Watchlist */}
      {enableSpotlight && (
        <WatchlistSpotlight
          containerRef={containerRef}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      {/* Section Header with Stats & Search Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PORTFOLIO WATCHLIST RADAR</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-100">
              Active Watchlist
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-xs font-semibold">
              {filteredItems.length} {filteredItems.length === 1 ? 'Ticker' : 'Tickers'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Interactive Magic Bento grid with real-time delta tracking, attention budgeting, and zero-fatigue baseline checkpoints.
          </p>
        </div>

        {/* Controls: Search & Add */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-full bg-[#0c1220]/80 border border-[#222d42] text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 w-44 sm:w-56 transition-all"
            />
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold font-mono tracking-wide transition-all shadow-md shadow-purple-900/30 active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Ticker</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#0b0f19]/70 border border-dashed border-[#1e2538] rounded-2xl p-10 text-center backdrop-blur-sm">
          <p className="text-sm text-slate-300 font-mono">
            {items.length === 0
              ? 'Your watchlist is currently empty.'
              : `No tracked tickers match "${searchQuery}".`}
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-purple-900/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add your first ticker</span>
          </button>
        </div>
      ) : (
        /* Scrollable Bento Grid Viewport */
        <div className="watchlist-scroll-container max-h-[640px] overflow-y-auto pr-1.5 -mr-1.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 watchlist-bento-section">
            {filteredItems.map((stock) => {
              const delta = stock.since_last_visit_change_percent ?? stock.change_percent ?? 0;
              const isPos = delta > 0;
              const isNeg = delta < 0;
              const styles = getAttentionLevelStyles(stock.attention_level, stock.attention_score);
              const contextBadge = getContextClassificationBadge(stock.context_classification);
              const lifecycleBadge = getLifecycleStatusBadge(stock.lifecycle_status);

              const cardStyle = {
                '--glow-x': '50%',
                '--glow-y': '50%',
                '--glow-intensity': '0',
                '--glow-radius': `${spotlightRadius}px`
              };

              return (
                <BentoStockCard
                  key={stock.symbol}
                  onClick={() => onSelectStock && onSelectStock(stock.symbol)}
                  className={`watchlist-bento-card group relative p-5 rounded-2xl border border-[#1e2538] backdrop-blur-md cursor-pointer flex flex-col justify-between min-h-[210px] ${
                    enableBorderGlow ? 'card--border-glow' : ''
                  }`}
                  style={cardStyle}
                  particleCount={enableStars ? 8 : 0}
                  glowColor={glowColor}
                  clickEffect={clickEffect}
                >
                  {/* Top: Header Symbol & Actions */}
                  <div className="relative z-20">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xl text-slate-100 group-hover:text-purple-300 transition-colors">
                            {stock.symbol}
                          </span>
                          {stock.is_stale && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              STALE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono truncate max-w-[170px] sm:max-w-[200px] mt-0.5">
                          {stock.name}
                        </p>
                      </div>

                      {/* Attention Badge & Quick Trash */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${styles.badge}`}
                        >
                          {stock.attention_score} {stock.attention_level?.slice(0, 4)}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStockPendingRemoval(stock);
                          }}
                          className="p-1 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title={`Remove ${stock.symbol}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Context Classification & Lifecycle Badges */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${contextBadge.pill}`}>
                        {contextBadge.emoji} {contextBadge.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${lifecycleBadge.pill}`}>
                        ● {lifecycleBadge.label}
                      </span>
                    </div>

                    {/* Price & Since Last Visit Delta */}
                    <div className="mt-4 flex items-baseline justify-between">
                      <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                        {formatCurrency(stock.price)}
                      </span>
                      <div
                        className={`text-xs font-mono font-bold flex items-center px-2 py-0.5 rounded-md ${
                          isPos
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : isNeg
                            ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                            : 'text-slate-400 bg-slate-800/40 border border-slate-700/40'
                        }`}
                      >
                        {isPos ? (
                          <TrendingUp className="w-3.5 h-3.5 mr-1" />
                        ) : isNeg ? (
                          <TrendingDown className="w-3.5 h-3.5 mr-1" />
                        ) : null}
                        {formatPercent(delta)}
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      since last visit checkpoint
                    </div>
                  </div>

                  {/* Footer Meta & Signals */}
                  <div className="mt-4 pt-3 border-t border-[#1e2538]/80 flex items-center justify-between text-[11px] font-mono relative z-20">
                    <div className="flex flex-wrap gap-1">
                      {stock.signals && stock.signals.slice(0, 2).map((sigType, i) => {
                        const badge = getSignalTypeBadge(sigType);
                        return (
                          <span
                            key={i}
                            className={`text-[9px] px-1.5 py-0.5 rounded ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        );
                      })}
                    </div>

                    <div className="text-slate-500 text-[10px] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatTimeAgo(stock.last_updated)}</span>
                    </div>
                  </div>
                </BentoStockCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {stockPendingRemoval && (
        <div
          onClick={() => setStockPendingRemoval(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0b0f19] border border-rose-500/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl shadow-rose-950/40"
          >
            <h3 className="text-lg font-display font-bold text-slate-100">
              Remove {stockPendingRemoval.symbol}?
            </h3>
            <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-200">{stockPendingRemoval.name}</strong> from your active monitored watchlist?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => setStockPendingRemoval(null)}
                className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors cursor-pointer"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default WatchlistGrid;
