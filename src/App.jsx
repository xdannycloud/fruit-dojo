import React, { useCallback, useEffect, useRef, useState } from 'react';
import Controls from './components/Controls.jsx';
import Pet from './components/Pet.jsx';
import ThoughtBubble from './components/ThoughtBubble.jsx';
import { pickThought } from './lib/thoughts.js';

const MOOD_RESTORE_MS = 1400;
const IDLE_BUBBLE_MIN = 4500;
const IDLE_BUBBLE_MAX = 8000;

export default function App() {
  const [focusMode, setFocusMode] = useState(false);
  const [mood, setMood] = useState('idle');
  const [bubbles, setBubbles] = useState([]);
  const nextIdRef = useRef(0);
  const moodTimerRef = useRef(null);

  const restMood = focusMode ? 'focused' : 'idle';

  useEffect(() => {
    setMood((prev) => (prev === 'excited' ? prev : restMood));
  }, [restMood]);

  const spawnBubble = useCallback((text, x, y) => {
    const id = ++nextIdRef.current;
    setBubbles((prev) => [...prev.slice(-5), { id, text, x, y }]);
  }, []);

  const expireBubble = useCallback((id) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleStageClick = useCallback(
    (event) => {
      if (event.target.closest('[data-no-bubble]')) return;
      const thought = pickThought(focusMode ? 'focus' : 'excited');
      spawnBubble(thought, event.clientX, event.clientY - 28);
      setMood('excited');
      if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
      moodTimerRef.current = setTimeout(() => {
        setMood(focusMode ? 'focused' : 'idle');
      }, MOOD_RESTORE_MS);
    },
    [focusMode, spawnBubble]
  );

  useEffect(() => () => clearTimeout(moodTimerRef.current), []);

  useEffect(() => {
    let timer;
    const schedule = () => {
      const delay =
        IDLE_BUBBLE_MIN + Math.random() * (IDLE_BUBBLE_MAX - IDLE_BUBBLE_MIN);
      timer = setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const x = focusMode ? w * 0.82 : w * (0.3 + Math.random() * 0.4);
        const y = focusMode ? h * 0.74 : h * (0.3 + Math.random() * 0.4);
        spawnBubble(pickThought(focusMode ? 'focus' : 'idle'), x, y);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [focusMode, spawnBubble]);

  const toggleFocus = useCallback(() => setFocusMode((v) => !v), []);

  return (
    <div className={`app ${focusMode ? 'app--focus' : ''}`}>
      <Controls
        focusMode={focusMode}
        onToggleFocus={toggleFocus}
        mood={mood}
      />

      <main
        className="stage"
        onClick={handleStageClick}
        data-testid="stage"
        aria-label="Pet play area. Click to give the pet a thought."
      >
        <div className="stage__grid" aria-hidden="true" />
        <Pet mood={mood} focusMode={focusMode} />
        <div className="bubbles" aria-live="polite" aria-atomic="false">
          {bubbles.map((b) => (
            <ThoughtBubble
              key={b.id}
              id={b.id}
              text={b.text}
              x={b.x}
              y={b.y}
              onExpire={expireBubble}
            />
          ))}
        </div>

        <section className="card" data-no-bubble>
          <h2 className="card__title">What is this?</h2>
          <p className="card__body">
            A tiny coding-agent pet that follows your cursor like a laser pointer
            chases a cat. Click anywhere to share a thought. Flip{' '}
            <strong>Focus mode</strong> to make it settle in and crunch.
          </p>
          <ul className="card__list">
            <li>Pointer-following with smooth easing</li>
            <li>Mood reacts to clicks</li>
            <li>Bubbles surface what the agent is "thinking"</li>
          </ul>
        </section>
      </main>

      <footer className="footer" data-no-bubble>
        <span>Built with React + Vite. Pair-programmed by Claude Code and Codex.</span>
      </footer>
    </div>
  );
}
