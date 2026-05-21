import { useEffect, useRef } from 'react';

/**
 * Tracks the pointer position on `window` and writes it to a ref without
 * re-rendering. Returns a ref of { x, y, active }.
 */
export function useCursorTracker() {
  const positionRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const onMove = (e) => {
      positionRef.current.x = e.clientX;
      positionRef.current.y = e.clientY;
      positionRef.current.active = true;
    };
    const onLeave = () => {
      positionRef.current.active = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return positionRef;
}
