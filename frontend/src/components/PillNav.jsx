import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export const PillNav = ({
  items = [
    { label: 'Intelligence', href: '#signals' },
    { label: 'Watchlist', href: '#watchlist' },
    { label: 'Pulse', href: '#pulse' },
    { label: 'Alpha Radar', href: '#radar' }
  ],
  activeHref = '#signals',
  className = '',
  ease = 'power2.out',
  baseColor = '#0b0f19',
  pillColor = '#121829',
  hoveredPillTextColor = '#ffffff',
  pillTextColor = '#94a3b8'
}) => {
  const circleRefs = useRef([]);
  const tlRefs = useRef([]);
  const activeTweenRefs = useRef([]);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle, index) => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        if (w === 0 || h === 0) return;

        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 4;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector('.pill-label');
        const white = pill.querySelector('.pill-label-hover');

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(circle, { scale: 1.25, xPercent: -50, duration: 1.5, ease, overwrite: 'auto' }, 0);

        if (label) {
          tl.to(label, { y: -(h + 6), duration: 1.5, ease, overwrite: 'auto' }, 0);
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 20), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 1.5, ease, overwrite: 'auto' }, 0);
        }

        tlRefs.current[index] = tl;
      });
    };

    layout();

    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    return () => window.removeEventListener('resize', onResize);
  }, [items, ease]);

  const handleEnter = i => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.28,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLeave = i => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.22,
      ease,
      overwrite: 'auto'
    });
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        className="relative flex items-center rounded-full p-[3px] border border-[#1e2538] shadow-lg shadow-black/40 backdrop-blur-xl"
        style={{
          background: baseColor,
          height: '38px'
        }}
      >
        <ul role="menubar" className="list-none flex items-stretch m-0 p-0 h-full gap-1">
          {items.map((item, i) => {
            const isActive = activeHref === item.href;

            const pillStyle = {
              background: isActive
                ? 'linear-gradient(135deg, rgba(132, 0, 255, 0.3), rgba(6, 182, 212, 0.25))'
                : pillColor,
              color: isActive ? '#ffffff' : pillTextColor,
              border: isActive
                ? '1px solid rgba(132, 0, 255, 0.55)'
                : '1px solid rgba(255, 255, 255, 0.05)'
            };

            return (
              <li key={item.href} role="none" className="flex h-full">
                <a
                  role="menuitem"
                  href={item.href}
                  className="relative overflow-hidden inline-flex items-center justify-center h-full px-3.5 rounded-full text-xs font-mono font-medium tracking-wide no-underline cursor-pointer select-none transition-colors"
                  style={pillStyle}
                  onMouseEnter={() => handleEnter(i)}
                  onMouseLeave={() => handleLeave(i)}
                >
                  {/* Expanding Hover Circle */}
                  <span
                    className="hover-circle absolute left-1/2 bottom-0 rounded-full z-[1] block pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, #8400ff, #06b6d4)',
                      willChange: 'transform'
                    }}
                    aria-hidden="true"
                    ref={el => {
                      circleRefs.current[i] = el;
                    }}
                  />

                  {/* Dual Label Stack */}
                  <span className="label-stack relative inline-block leading-none z-[2]">
                    <span
                      className="pill-label relative z-[2] inline-block leading-none"
                      style={{ willChange: 'transform' }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="pill-label-hover absolute left-0 top-0 z-[3] inline-block font-bold leading-none"
                      style={{
                        color: hoveredPillTextColor,
                        willChange: 'transform, opacity'
                      }}
                      aria-hidden="true"
                    >
                      {item.label}
                    </span>
                  </span>

                  {isActive && (
                    <span
                      className="absolute left-1/2 -bottom-[5px] -translate-x-1/2 w-2 h-2 rounded-full z-[4]"
                      style={{ background: '#8400ff' }}
                      aria-hidden="true"
                    />
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PillNav;
