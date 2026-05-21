import React, { useEffect } from 'react';

export default function ThoughtBubble({ id, text, x, y, onExpire, lifespan = 2200 }) {
  useEffect(() => {
    const timer = setTimeout(() => onExpire(id), lifespan);
    return () => clearTimeout(timer);
  }, [id, lifespan, onExpire]);

  return (
    <div
      className="bubble"
      style={{ left: x, top: y }}
      role="status"
      aria-live="polite"
    >
      <span className="bubble__text">{text}</span>
    </div>
  );
}
