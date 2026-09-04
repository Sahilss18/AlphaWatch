import React, { useRef, useEffect, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export const Shuffle = ({
  text = '',
  className = '',
  style = {},
  shuffleDirection = 'right',
  duration = 0.35,
  maxDelay = 0,
  ease = 'power3.out',
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'span',
  textAlign = 'left',
  onShuffleComplete,
  shuffleTimes = 2,
  animationMode = 'evenodd',
  loop = false,
  loopDelay = 0,
  stagger = 0.03,
  scrambleCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*',
  colorFrom,
  colorTo,
  triggerOnce = true,
  respectReducedMotion = true,
  triggerOnHover = true
}) => {
  const containerRef = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const wrappersRef = useRef([]);
  const tlRef = useRef(null);
  const playingRef = useRef(false);
  const hoverHandlerRef = useRef(null);

  const userHasFont = useMemo(
    () => Boolean((style && style.fontFamily) || (className && /font[-[]/i.test(className))),
    [style, className]
  );

  const scrollTriggerStart = useMemo(() => {
    const startPct = (1 - threshold) * 100;
    const mm = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin || '');
    const mv = mm ? parseFloat(mm[1]) : 0;
    const mu = mm ? mm[2] || 'px' : 'px';
    const sign = mv === 0 ? '' : mv < 0 ? `-=${Math.abs(mv)}${mu}` : `+=${mv}${mu}`;
    return `top ${startPct}%${sign}`;
  }, [threshold, rootMargin]);

  // Wait for font to load properly
  useEffect(() => {
    if ('fonts' in document) {
      if (document.fonts.status === 'loaded') {
        setFontsLoaded(true);
      } else {
        document.fonts.ready.then(() => setFontsLoaded(true));
      }
    } else {
      setFontsLoaded(true);
    }
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current || !text || !fontsLoaded) return;

      if (respectReducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setIsReady(true);
        onShuffleComplete?.();
        return;
      }

      const el = containerRef.current;
      const computedFont = userHasFont
        ? style.fontFamily || getComputedStyle(el).fontFamily || "'Press Start 2P', monospace"
        : "'Press Start 2P', monospace";

      const teardown = () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
        if (wrappersRef.current.length) {
          wrappersRef.current = [];
        }
        playingRef.current = false;
      };

      const removeHover = () => {
        if (hoverHandlerRef.current && containerRef.current) {
          containerRef.current.removeEventListener('mouseenter', hoverHandlerRef.current);
          hoverHandlerRef.current = null;
        }
      };

      const build = () => {
        teardown();
        el.innerHTML = '';
        wrappersRef.current = [];

        const rolls = Math.max(1, Math.floor(shuffleTimes));
        const rand = set => set.charAt(Math.floor(Math.random() * set.length)) || 'X';
        const isVertical = shuffleDirection === 'up' || shuffleDirection === 'down';

        // Split text by words
        const words = text.split(/(\s+)/);

        words.forEach(word => {
          if (!word) return;

          // Handle spaces
          if (/^\s+$/.test(word)) {
            const spaceSpan = document.createElement('span');
            spaceSpan.style.display = 'inline-block';
            spaceSpan.style.width = '0.55em';
            spaceSpan.innerHTML = '&nbsp;';
            el.appendChild(spaceSpan);
            return;
          }

          const wordContainer = document.createElement('span');
          wordContainer.className = 'shuffle-word inline-flex flex-nowrap items-baseline';
          wordContainer.style.display = 'inline-flex';
          wordContainer.style.whiteSpace = 'nowrap';

          for (let i = 0; i < word.length; i++) {
            const char = word[i];

            // Outer wrapper with overflow hidden
            const wrap = document.createElement('span');
            wrap.className = 'shuffle-char-wrap inline-block overflow-hidden align-baseline select-none';
            wrap.style.display = 'inline-block';
            wrap.style.overflow = 'hidden';
            wrap.style.verticalAlign = 'baseline';
            wrap.style.fontFamily = computedFont;

            // Inner sliding track
            const inner = document.createElement('span');
            inner.className = 'shuffle-char-inner inline-flex items-center transform-gpu will-change-transform';
            inner.style.display = isVertical ? 'flex' : 'inline-flex';
            inner.style.flexDirection = isVertical ? 'column' : 'row';
            inner.style.whiteSpace = 'nowrap';
            inner.style.fontFamily = computedFont;

            // Target final character
            const targetChar = document.createElement('span');
            targetChar.className = 'shuffle-cell inline-flex items-center justify-center';
            targetChar.textContent = char;
            targetChar.style.fontFamily = computedFont;
            targetChar.setAttribute('data-orig', '1');

            // Add roll iterations
            const rollChars = [];
            for (let r = 0; r < rolls; r++) {
              const rollCell = document.createElement('span');
              rollCell.className = 'shuffle-cell inline-flex items-center justify-center';
              rollCell.textContent = scrambleCharset ? rand(scrambleCharset) : char;
              rollCell.style.fontFamily = computedFont;
              rollChars.push(rollCell);
            }

            // Assemble track sequence based on direction
            if (shuffleDirection === 'right' || shuffleDirection === 'down') {
              // Sliding from negative offset into 0
              rollChars.forEach(rc => inner.appendChild(rc));
              inner.appendChild(targetChar);
            } else {
              // Sliding forward into target
              inner.appendChild(targetChar);
              rollChars.forEach(rc => inner.appendChild(rc));
            }

            wrap.appendChild(inner);
            wordContainer.appendChild(wrap);
            wrappersRef.current.push({ wrap, inner, char, rolls });
          }

          el.appendChild(wordContainer);
        });

        // Now calculate measured dimensions cleanly after attaching to DOM
        wrappersRef.current.forEach(({ wrap, inner, rolls }) => {
          const cells = inner.querySelectorAll('.shuffle-cell');
          if (!cells.length) return;

          // Measure single cell size
          const sampleCell = cells[0];
          const rect = sampleCell.getBoundingClientRect();
          const cellW = Math.max(12, Math.ceil(rect.width || 18));
          const cellH = Math.max(16, Math.ceil(rect.height || 24));

          // Set fixed uniform dimensions on cell items
          cells.forEach(cell => {
            cell.style.width = `${cellW}px`;
            cell.style.height = `${cellH}px`;
            cell.style.lineHeight = `${cellH}px`;
          });

          wrap.style.width = `${cellW}px`;
          wrap.style.height = `${cellH}px`;

          const steps = rolls;
          let startX = 0;
          let finalX = 0;
          let startY = 0;
          let finalY = 0;

          if (shuffleDirection === 'right') {
            startX = -steps * cellW;
            finalX = 0;
          } else if (shuffleDirection === 'left') {
            startX = 0;
            finalX = -steps * cellW;
          } else if (shuffleDirection === 'down') {
            startY = -steps * cellH;
            finalY = 0;
          } else if (shuffleDirection === 'up') {
            startY = 0;
            finalY = -steps * cellH;
          }

          if (!isVertical) {
            gsap.set(inner, { x: startX, y: 0, force3D: true });
            inner.setAttribute('data-start-x', String(startX));
            inner.setAttribute('data-final-x', String(finalX));
          } else {
            gsap.set(inner, { x: 0, y: startY, force3D: true });
            inner.setAttribute('data-start-y', String(startY));
            inner.setAttribute('data-final-y', String(finalY));
          }

          if (colorFrom) inner.style.color = colorFrom;
        });
      };

      const inners = () => wrappersRef.current.map(w => w.inner);

      const play = () => {
        const strips = inners();
        if (!strips.length) return;

        playingRef.current = true;
        const isVertical = shuffleDirection === 'up' || shuffleDirection === 'down';

        const tl = gsap.timeline({
          smoothChildTiming: true,
          repeat: loop ? -1 : 0,
          repeatDelay: loop ? loopDelay : 0,
          onComplete: () => {
            playingRef.current = false;
            if (colorTo) gsap.set(strips, { color: colorTo });
            onShuffleComplete?.();
            armHover();
          }
        });

        const addTween = (targets, at) => {
          const vars = {
            duration,
            ease,
            force3D: true,
            stagger: animationMode === 'evenodd' ? stagger : 0
          };

          if (isVertical) {
            vars.y = (i, t) => parseFloat(t.getAttribute('data-final-y') || '0');
          } else {
            vars.x = (i, t) => parseFloat(t.getAttribute('data-final-x') || '0');
          }

          tl.to(targets, vars, at);
          if (colorFrom && colorTo) tl.to(targets, { color: colorTo, duration, ease }, at);
        };

        if (animationMode === 'evenodd') {
          const odd = strips.filter((_, i) => i % 2 === 1);
          const even = strips.filter((_, i) => i % 2 === 0);
          const oddTotal = duration + Math.max(0, odd.length - 1) * stagger;
          const evenStart = odd.length ? oddTotal * 0.6 : 0;
          if (odd.length) addTween(odd, 0);
          if (even.length) addTween(even, evenStart);
        } else {
          strips.forEach(strip => {
            const d = Math.random() * maxDelay;
            const vars = {
              duration,
              ease,
              force3D: true
            };
            if (isVertical) {
              vars.y = parseFloat(strip.getAttribute('data-final-y') || '0');
            } else {
              vars.x = parseFloat(strip.getAttribute('data-final-x') || '0');
            }
            tl.to(strip, vars, d);
          });
        }

        tlRef.current = tl;
      };

      const armHover = () => {
        if (!triggerOnHover || !containerRef.current) return;
        removeHover();
        const handler = () => {
          if (playingRef.current) return;
          build();
          play();
        };
        hoverHandlerRef.current = handler;
        containerRef.current.addEventListener('mouseenter', handler);
      };

      const create = () => {
        build();
        play();
        armHover();
        setIsReady(true);
      };

      const st = ScrollTrigger.create({
        trigger: el,
        start,
        once: triggerOnce,
        onEnter: create
      });

      return () => {
        st.kill();
        removeHover();
        teardown();
        setIsReady(false);
      };
    },
    {
      dependencies: [
        text,
        duration,
        maxDelay,
        ease,
        scrollTriggerStart,
        fontsLoaded,
        shuffleDirection,
        shuffleTimes,
        animationMode,
        loop,
        loopDelay,
        stagger,
        scrambleCharset,
        colorFrom,
        colorTo,
        triggerOnce,
        respectReducedMotion,
        triggerOnHover,
        onShuffleComplete,
        userHasFont
      ],
      scope: containerRef
    }
  );

  const Tag = tag || 'span';
  const commonStyle = useMemo(
    () => ({
      fontFamily: style.fontFamily || "'Press Start 2P', monospace",
      textAlign,
      ...style
    }),
    [style, textAlign]
  );

  return (
    <Tag
      ref={containerRef}
      className={`inline-block whitespace-normal break-words will-change-transform ${
        isReady ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-200 ${className}`}
      style={commonStyle}
    >
      {text}
    </Tag>
  );
};

export default Shuffle;
