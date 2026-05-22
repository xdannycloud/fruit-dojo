import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createBomb, createFruit, scoreHit, slashHitsTarget } from './lib/gameLogic.js';

const GAME_SECONDS = 15;
const MAX_TRAIL = 18;
const GRAVITY = 0.33;
const SPAWN_EVERY_MS = 580;

async function requestGlobalPlays(options) {
  const response = options ? await fetch('/api/plays', options) : await fetch('/api/plays');
  if (!response.ok) throw new Error('Unable to load global plays');
  const data = await response.json();
  const plays = Number.parseInt(data?.plays ?? 0, 10);
  return Number.isFinite(plays) && plays >= 0 ? plays : 0;
}

const createInitialHud = () => ({
  score: 0,
  combo: 1,
  lives: 3,
  timeLeft: GAME_SECONDS,
  status: 'ready',
  message: 'Slice fruit. Dodge bombs. Chain combos.',
});

function drawBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#fff8ed');
  gradient.addColorStop(0.48, '#fffdf8');
  gradient.addColorStop(1, '#eef9ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 12; i += 1) {
    const x = ((i * 173) % width) + 20;
    const y = ((i * 97) % height) + 30;
    ctx.beginPath();
    ctx.arc(x, y, 32 + (i % 4) * 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTrail(ctx, trail) {
  if (trail.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 1; i < trail.length; i += 1) {
    const prev = trail[i - 1];
    const point = trail[i];
    const alpha = i / trail.length;
    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.82})`;
    ctx.lineWidth = 4 + alpha * 12;
    ctx.shadowColor = 'rgba(14, 165, 233, 0.6)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTarget(ctx, target) {
  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.rotate(target.rotation);

  const glow = target.kind === 'bomb' ? 'rgba(239, 68, 68, 0.28)' : `${target.juice}55`;
  ctx.shadowColor = glow;
  ctx.shadowBlur = target.kind === 'bomb' ? 22 : 16;

  ctx.beginPath();
  ctx.arc(0, 0, target.radius * 0.92, 0, Math.PI * 2);
  ctx.fillStyle = target.kind === 'bomb' ? '#111827' : '#ffffff';
  ctx.globalAlpha = target.kind === 'bomb' ? 0.96 : 0.92;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.font = `${target.radius * 1.45}px Apple Color Emoji, Segoe UI Emoji, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(target.emoji, 0, 1);
  ctx.restore();
}

function drawParticles(ctx, particles) {
  particles.forEach((particle) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}


function drawSword(ctx, sword) {
  if (!sword) return;

  ctx.save();
  ctx.translate(sword.x, sword.y);
  ctx.rotate(-0.78);

  // blade glow
  const blade = ctx.createLinearGradient(-8, -76, 8, 18);
  blade.addColorStop(0, 'rgba(255,255,255,0.96)');
  blade.addColorStop(0.45, 'rgba(186,230,253,0.92)');
  blade.addColorStop(1, 'rgba(14,165,233,0.35)');
  ctx.shadowColor = 'rgba(56, 189, 248, 0.75)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = blade;
  ctx.beginPath();
  ctx.moveTo(0, -86);
  ctx.lineTo(11, 10);
  ctx.lineTo(0, 24);
  ctx.lineTo(-11, 10);
  ctx.closePath();
  ctx.fill();

  // sharp white edge
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -78);
  ctx.lineTo(4, 12);
  ctx.stroke();

  // guard
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-25, 22);
  ctx.lineTo(25, 22);
  ctx.stroke();

  // handle
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(0, 24);
  ctx.lineTo(0, 62);
  ctx.stroke();

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  for (let y = 30; y <= 56; y += 9) {
    ctx.beginPath();
    ctx.moveTo(-5, y);
    ctx.lineTo(5, y + 5);
    ctx.stroke();
  }

  ctx.restore();
}

function getCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const source = event.touches?.[0] || event.changedTouches?.[0] || event;
  return {
    x: source.clientX - rect.left,
    y: source.clientY - rect.top,
  };
}

export default function App() {
  const canvasRef = useRef(null);
  const animationRef = useRef(0);
  const lastTimeRef = useRef(0);
  const spawnRef = useRef(0);
  const startedAtRef = useRef(0);
  const targetsRef = useRef([]);
  const particlesRef = useRef([]);
  const trailRef = useRef([]);
  const swordRef = useRef(null);
  const pointerDownRef = useRef(false);
  const hudRef = useRef(createInitialHud());
  const [hud, setHud] = useState(createInitialHud);
  const [plays, setPlays] = useState(0);

  const syncHud = useCallback((patch) => {
    hudRef.current = { ...hudRef.current, ...patch };
    setHud(hudRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;

    requestGlobalPlays()
      .then((globalPlays) => {
        if (!cancelled) setPlays(globalPlays);
      })
      .catch(() => {
        if (!cancelled) setPlays(0);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const incrementGlobalPlays = useCallback(() => {
    requestGlobalPlays({ method: 'POST' })
      .then(setPlays)
      .catch(() => setPlays((current) => current));
  }, []);

  const resetGame = useCallback(() => {
    targetsRef.current = [];
    particlesRef.current = [];
    trailRef.current = [];
    spawnRef.current = 0;
    startedAtRef.current = performance.now();
    incrementGlobalPlays();
    syncHud({
      score: 0,
      combo: 1,
      lives: 3,
      timeLeft: GAME_SECONDS,
      status: 'playing',
      message: 'Go! Slice through fruit for combos.',
    });
  }, [incrementGlobalPlays, syncHud]);

  const spawnBurst = useCallback((target, amount = 12) => {
    const particles = Array.from({ length: amount }, (_, index) => {
      const angle = (Math.PI * 2 * index) / amount;
      const speed = 2.5 + Math.random() * 4;
      return {
        x: target.x,
        y: target.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: target.kind === 'bomb' ? '#f97316' : target.juice,
        life: 42,
        maxLife: 42,
      };
    });
    particlesRef.current.push(...particles);
  }, []);

  const handleSlashPoint = useCallback(
    (point) => {
      swordRef.current = point;
      trailRef.current = [...trailRef.current.slice(-MAX_TRAIL + 1), { ...point, age: 0 }];
      if (hudRef.current.status !== 'playing') return;

      targetsRef.current = targetsRef.current.filter((target) => {
        if (target.sliced || !slashHitsTarget(trailRef.current, target)) return true;

        target.sliced = true;
        spawnBurst(target, target.kind === 'bomb' ? 22 : 14);
        const result = scoreHit(target, hudRef.current.combo);
        const nextLives = Math.max(0, hudRef.current.lives + result.livesDelta);
        const nextScore = Math.max(0, hudRef.current.score + result.scoreDelta);
        const message =
          target.kind === 'bomb'
            ? 'Boom! Bombs break your combo.'
            : `+${result.scoreDelta} ${target.name} slash!`;

        syncHud({
          score: nextScore,
          combo: result.combo,
          lives: nextLives,
          status: nextLives === 0 ? 'game over' : 'playing',
          message,
        });
        return false;
      });
    },
    [spawnBurst, syncHud]
  );

  const handlePointerDown = useCallback(
    (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      pointerDownRef.current = true;
      handleSlashPoint(getCanvasPoint(canvas, event));
    },
    [handleSlashPoint]
  );

  const handlePointerMove = useCallback(
    (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      event.preventDefault();
      handleSlashPoint(getCanvasPoint(canvas, event));
    },
    [handleSlashPoint]
  );

  const handlePointerUp = useCallback(() => {
    pointerDownRef.current = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext?.('2d');

    const tick = (now) => {
      const delta = Math.min(32, now - (lastTimeRef.current || now));
      lastTimeRef.current = now;

      if (canvas && ctx) {
        const deviceRatio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const nextWidth = Math.max(320, Math.floor(rect.width * deviceRatio));
        const nextHeight = Math.max(320, Math.floor(rect.height * deviceRatio));
        if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
          canvas.width = nextWidth;
          canvas.height = nextHeight;
        }

        ctx.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);
        drawBackground(ctx, rect.width, rect.height);

        if (hudRef.current.status === 'playing') {
          const elapsed = (now - startedAtRef.current) / 1000;
          const timeLeft = Math.max(0, Math.ceil(GAME_SECONDS - elapsed));
          if (timeLeft !== hudRef.current.timeLeft) syncHud({ timeLeft });
          if (timeLeft === 0) syncHud({ status: 'game over', message: 'Time! Nice slicing.' });

          spawnRef.current += delta;
          if (spawnRef.current >= SPAWN_EVERY_MS) {
            spawnRef.current = 0;
            const randomValue = Math.random();
            const shouldBomb = Math.random() > 0.82;
            targetsRef.current.push(
              shouldBomb
                ? createBomb(randomValue, rect.width, rect.height)
                : createFruit(randomValue, rect.width, rect.height)
            );
          }
        }

        targetsRef.current = targetsRef.current
          .map((target) => ({
            ...target,
            x: target.x + target.vx,
            y: target.y + target.vy,
            vy: target.vy + GRAVITY,
            rotation: target.rotation + target.spin,
          }))
          .filter((target) => {
            const missed = target.kind === 'fruit' && target.y > rect.height + 70 && !target.sliced;
            if (missed && hudRef.current.status === 'playing') {
              syncHud({
                combo: 1,
                message: 'Fruit escaped. Combo reset — keep slicing.',
              });
            }
            return target.y < rect.height + 95 && target.x > -100 && target.x < rect.width + 100;
          });

        particlesRef.current = particlesRef.current
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.12,
            life: particle.life - 1,
          }))
          .filter((particle) => particle.life > 0);

        trailRef.current = trailRef.current
          .map((point) => ({ ...point, age: point.age + 1 }))
          .filter((point) => point.age < 16);

        targetsRef.current.forEach((target) => drawTarget(ctx, target));
        drawParticles(ctx, particlesRef.current);
        drawTrail(ctx, trailRef.current);
        drawSword(ctx, swordRef.current);
      }

      animationRef.current = window.requestAnimationFrame(tick);
    };

    animationRef.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationRef.current);
  }, [syncHud]);

  const isPlaying = hud.status === 'playing';

  return (
    <div className="game-shell">
      <header className="game-header">
        <div>
          <p className="eyebrow">Browser Game Demo</p>
          <h1>Fruit Dojo</h1>
          <p className="subtitle">挥动武士刀切水果、躲炸弹、叠 combo，适合直接分享试玩。</p>
        </div>
        <div className="header-actions">
          <div className="play-counter" data-testid="plays" aria-label="Global games played">
            <strong>Games Played</strong>
            <span>{plays}</span>
          </div>
          <button className="primary-button" type="button" onClick={resetGame}>
            {isPlaying ? 'Restart' : 'Start Game'}
          </button>
        </div>
      </header>

      <section className="game-card" aria-label="Fruit Dojo game area">
        <div className="hud">
          <div data-testid="score"><strong>Score</strong><span>{hud.score}</span></div>
          <div data-testid="combo"><strong>Combo</strong><span>x{Math.max(1, hud.combo - 1)}</span></div>
          <div data-testid="timer"><strong>Time</strong><span>{hud.timeLeft}s</span></div>
          <div data-testid="lives"><strong>Lives</strong><span>{'❤️'.repeat(hud.lives) || '—'}</span></div>
        </div>

        <canvas
          ref={canvasRef}
          className="slash-canvas sword-cursor"
          data-testid="slash-canvas"
          width="960"
          height="600"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          aria-label="Slice fruit by moving the katana cursor across the canvas"
        />

        {hud.status === 'game over' && (
          <div className="final-score-card" data-testid="final-score" role="status" aria-live="polite">
            <p className="final-score-kicker">Final Score</p>
            <strong>{hud.score}</strong>
            <span>{hud.score >= 900 ? 'Dojo master run ✨' : 'Nice slicing — run it back.'}</span>
          </div>
        )}

        <div className="game-overlay" aria-live="polite">
          <span className={`state state--${hud.status.replace(' ', '-')}`} data-testid="game-state">
            {hud.status}
          </span>
          <p>{hud.message}</p>
          {!isPlaying && <p className="hint">点击 Start Game，移动鼠标/手指挥刀切水果。</p>}
        </div>
      </section>
    </div>
  );
}

