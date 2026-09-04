import React, { useRef, useEffect, useState, useCallback } from 'react';

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

export const Shuffle = ({
  text = '',
  className = '',
  style = {},
  duration = 0.45,
  stagger = 0.02,
  scrambleCharset = DEFAULT_CHARSET,
  triggerOnHover = true,
  tag = 'span',
  onShuffleComplete
}) => {
  const [displayText, setDisplayText] = useState(text);
  const isAnimatingRef = useRef(false);
  const frameRef = useRef(null);

  const startScramble = useCallback(() => {
    if (!text) return;
    isAnimatingRef.current = true;
    const length = text.length;
    const startTime = performance.now();
    const totalDuration = (duration + length * stagger) * 1000;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / totalDuration);

      let result = '';
      for (let i = 0; i < length; i++) {
        const char = text[i];
        if (char === ' ') {
          result += ' ';
          continue;
        }

        const charStartTime = i * stagger * 1000;
        const charDuration = duration * 1000;
        const charElapsed = elapsed - charStartTime;

        if (charElapsed <= 0) {
          // Hasn't started resolving yet, show random glyph
          result += scrambleCharset[Math.floor(Math.random() * scrambleCharset.length)];
        } else if (charElapsed < charDuration) {
          // In active shuffle phase
          result += scrambleCharset[Math.floor(Math.random() * scrambleCharset.length)];
        } else {
          // Successfully resolved to real character
          result += char;
        }
      }

      setDisplayText(result);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayText(text);
        isAnimatingRef.current = false;
        onShuffleComplete?.();
      }
    };

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(animate);
  }, [text, duration, stagger, scrambleCharset, onShuffleComplete]);

  useEffect(() => {
    startScramble();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [startScramble]);

  const handleMouseEnter = () => {
    if (triggerOnHover && !isAnimatingRef.current) {
      startScramble();
    }
  };

  const Tag = tag || 'span';

  return (
    <Tag
      className={`inline-block select-none transition-colors duration-150 ${className}`}
      style={style}
      onMouseEnter={handleMouseEnter}
    >
      {displayText}
    </Tag>
  );
};

export default Shuffle;
