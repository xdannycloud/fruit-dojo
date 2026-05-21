import React, { useEffect, useRef } from 'react';
import { useCursorTracker } from '../hooks/useCursorTracker.js';

const FOLLOW_EASE = 0.12;
const FOCUS_HOME = { xRatio: 0.88, yRatio: 0.82 };

export default function Pet({ mood, focusMode }) {
  const cursorRef = useCursorTracker();
  const petRef = useRef(null);
  const eyesRef = useRef(null);
  const stateRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0 });

  useEffect(() => {
    let rafId;
    const tick = () => {
      const el = petRef.current;
      if (!el) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const target = focusMode
        ? {
            x: window.innerWidth * FOCUS_HOME.xRatio,
            y: window.innerHeight * FOCUS_HOME.yRatio,
          }
        : cursorRef.current.active
        ? { x: cursorRef.current.x + 36, y: cursorRef.current.y + 36 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

      const s = stateRef.current;
      s.lastX = s.x;
      s.lastY = s.y;
      s.x += (target.x - s.x) * FOLLOW_EASE;
      s.y += (target.y - s.y) * FOLLOW_EASE;

      const dx = s.x - s.lastX;
      const tilt = Math.max(-14, Math.min(14, dx * 2.4));
      el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) translate(-50%, -50%) rotate(${tilt}deg)`;

      if (eyesRef.current && cursorRef.current.active && !focusMode) {
        const ex = Math.max(-2, Math.min(2, (cursorRef.current.x - s.x) / 60));
        const ey = Math.max(-2, Math.min(2, (cursorRef.current.y - s.y) / 60));
        eyesRef.current.style.transform = `translate(${ex}px, ${ey}px)`;
      } else if (eyesRef.current) {
        eyesRef.current.style.transform = 'translate(0,0)';
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [cursorRef, focusMode]);

  return (
    <div
      ref={petRef}
      className={`pet pet--${mood} ${focusMode ? 'pet--focus' : ''}`}
      role="img"
      aria-label={`Cursor agent pet, mood: ${mood}${focusMode ? ', focus mode' : ''}`}
      data-testid="pet"
      data-mood={mood}
    >
      <div className="pet__shadow" aria-hidden="true" />
      <svg
        className="pet__body"
        viewBox="0 0 80 80"
        width="72"
        height="72"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="petGradient" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6d28d9" />
          </radialGradient>
        </defs>
        <ellipse cx="40" cy="46" rx="28" ry="26" fill="url(#petGradient)" />
        <path
          className="pet__antenna"
          d="M40 18 Q42 8 48 6"
          stroke="#a78bfa"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="49" cy="5" r="3" fill="#fbbf24" className="pet__spark" />
        <g ref={eyesRef} className="pet__eyes">
          <circle cx="31" cy="44" r="4" fill="#0f0f1a" />
          <circle cx="49" cy="44" r="4" fill="#0f0f1a" />
          <circle cx="32.5" cy="42.5" r="1.2" fill="#fff" />
          <circle cx="50.5" cy="42.5" r="1.2" fill="#fff" />
        </g>
        <path
          className="pet__mouth"
          d={
            mood === 'excited'
              ? 'M33 55 Q40 64 47 55'
              : mood === 'focused'
              ? 'M33 57 L47 57'
              : 'M34 56 Q40 60 46 56'
          }
          stroke="#0f0f1a"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="26" cy="52" r="2" fill="#fda4af" opacity="0.7" />
        <circle cx="54" cy="52" r="2" fill="#fda4af" opacity="0.7" />
      </svg>
    </div>
  );
}
