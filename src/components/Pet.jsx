import React, { useEffect, useRef } from 'react';
import { useCursorTracker } from '../hooks/useCursorTracker.js';

const FOLLOW_EASE = 0.095;
const FOCUS_HOME = { xRatio: 0.84, yRatio: 0.76 };

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
        ? { x: cursorRef.current.x + 54, y: cursorRef.current.y + 44 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

      const s = stateRef.current;
      s.lastX = s.x;
      s.lastY = s.y;
      s.x += (target.x - s.x) * FOLLOW_EASE;
      s.y += (target.y - s.y) * FOLLOW_EASE;

      const dx = s.x - s.lastX;
      const dy = s.y - s.lastY;
      const speed = Math.min(1, Math.hypot(dx, dy) / 18);
      const tilt = Math.max(-7, Math.min(7, dx * 0.85));
      const squashX = 1 + speed * 0.035;
      const squashY = 1 - speed * 0.022;
      const lift = Math.max(-3, Math.min(3, -dy * 0.1));
      el.style.transform = `translate3d(${s.x}px, ${s.y + lift}px, 0) translate(-50%, -50%) rotate(${tilt}deg) scale(${squashX}, ${squashY})`;

      if (eyesRef.current && cursorRef.current.active && !focusMode) {
        const ex = Math.max(-3.6, Math.min(3.6, (cursorRef.current.x - s.x) / 42));
        const ey = Math.max(-2.4, Math.min(2.4, (cursorRef.current.y - s.y) / 52));
        eyesRef.current.style.transform = `translate(${ex}px, ${ey}px)`;
      } else if (eyesRef.current) {
        eyesRef.current.style.transform = 'translate(0,0)';
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [cursorRef, focusMode]);

  const mouthPath =
    mood === 'excited'
      ? 'M73 104 C82 119 98 119 107 104'
      : mood === 'focused'
      ? 'M76 106 C84 111 96 111 104 106'
      : 'M75 105 C82 116 98 116 105 105';

  return (
    <div
      ref={petRef}
      className={`pet pet--${mood} ${focusMode ? 'pet--focus' : ''}`}
      role="img"
      aria-label={`Pixar-style glowing orb cursor companion, mood: ${mood}${focusMode ? ', focus mode' : ''}`}
      data-testid="pet"
      data-mood={mood}
    >
      <div className="pet__floor-shadow" aria-hidden="true" />
      <svg
        className="pet__body"
        viewBox="0 0 180 180"
        width="164"
        height="164"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="outerCeramic" cx="35%" cy="21%" r="88%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="42%" stopColor="#f8fafc" />
            <stop offset="74%" stopColor="#dce4ec" />
            <stop offset="100%" stopColor="#aeb9c4" />
          </radialGradient>
          <radialGradient id="faceGlass" cx="40%" cy="24%" r="78%">
            <stop offset="0%" stopColor="#f7f8f5" stopOpacity="0.96" />
            <stop offset="44%" stopColor="#dfe4e1" stopOpacity="0.94" />
            <stop offset="78%" stopColor="#bcc5c4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8f9a9d" stopOpacity="0.88" />
          </radialGradient>
          <radialGradient id="warmLamp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffdf2" stopOpacity="0" />
            <stop offset="54%" stopColor="#fff3ba" stopOpacity="0.1" />
            <stop offset="70%" stopColor="#ffe38b" stopOpacity="0.94" />
            <stop offset="100%" stopColor="#fff1b8" stopOpacity="0.05" />
          </radialGradient>
          <linearGradient id="ringStroke" x1="42" x2="138" y1="39" y2="139">
            <stop offset="0%" stopColor="#fff9d6" />
            <stop offset="45%" stopColor="#ffeaa7" />
            <stop offset="100%" stopColor="#ffd875" />
          </linearGradient>
          <radialGradient id="eyeInk" cx="34%" cy="24%" r="70%">
            <stop offset="0%" stopColor="#2d3748" />
            <stop offset="45%" stopColor="#0b0f19" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          <filter id="ringGlow" x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 1  0 0.82 0 0 0.66  0 0 0.25 0 0.22  0 0 0 0.85 0" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="ceramicDepth" x="-35%" y="-35%" width="170%" height="180%">
            <feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#64748b" floodOpacity="0.23" />
          </filter>
          <filter id="softInner" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#8792a0" floodOpacity="0.26" />
          </filter>
        </defs>

        <ellipse className="pet__ground" cx="88" cy="162" rx="58" ry="9" fill="#64748b" opacity="0.08" />

        <path
          className="pet__shell"
          d="M90 23C122 23 148 49.4 148 82.2C148 112.8 126.2 137.4 96.2 139.7H63.8C43.8 137.4 31 124.2 31 105.6V82.2C31 49.4 57.5 23 90 23Z"
          fill="url(#outerCeramic)"
          filter="url(#ceramicDepth)"
        />
        <path
          className="pet__base-squish"
          d="M42 121C51 136 69 143 95 142C121 141 136 131 142 116C141 136 123 151 91 151C59 151 40 140 42 121Z"
          fill="#8794a0"
          opacity="0.24"
        />
        <path
          className="pet__outer-highlight"
          d="M48 75C50 45 72 30 99 32"
          fill="none"
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.52"
        />
        <path
          className="pet__right-rim"
          d="M133 52C145 72 144 102 130 121"
          fill="none"
          stroke="#b7c1ca"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.24"
        />

        <circle className="pet__lamp-fill" cx="90" cy="82" r="48" fill="url(#warmLamp)" filter="url(#ringGlow)" />
        <circle className="pet__ring" cx="90" cy="82" r="48" fill="none" stroke="url(#ringStroke)" strokeWidth="11" filter="url(#ringGlow)" />
        <circle className="pet__face" cx="90" cy="82" r="38.5" fill="url(#faceGlass)" filter="url(#softInner)" />
        <path
          className="pet__face-gloss"
          d="M102 43C117 48 127 60 130 74C119 72 108 64 101 54C98 50 98 46 102 43Z"
          fill="#ffffff"
          opacity="0.36"
        />
        <path
          className="pet__face-soft-light"
          d="M62 69C67 52 82 45 99 47"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.38"
        />

        <g ref={eyesRef} className="pet__eyes">
          <ellipse className="pet__eye pet__eye--left" cx="72" cy="82" rx="8.2" ry="11" fill="url(#eyeInk)" />
          <ellipse className="pet__eye pet__eye--right" cx="108" cy="82" rx="8.2" ry="11" fill="url(#eyeInk)" />
          <circle cx="75.2" cy="76" r="3" fill="#ffffff" opacity="0.88" />
          <circle cx="111.2" cy="76" r="3" fill="#ffffff" opacity="0.88" />
          <circle cx="77.4" cy="83.8" r="1.3" fill="#dbeafe" opacity="0.45" />
          <circle cx="113.4" cy="83.8" r="1.3" fill="#dbeafe" opacity="0.45" />
        </g>
        <path className="pet__mouth" d={mouthPath} stroke="#141414" strokeWidth="5.4" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}
