import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App.jsx';

describe('Fruit Dojo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    global.fetch = vi.fn(async (url, options = {}) => {
      if (url === '/api/plays' && options.method === 'POST') {
        return { ok: true, json: async () => ({ plays: 43 }) };
      }
      if (url === '/api/plays') {
        return { ok: true, json: async () => ({ plays: 42 }) };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
  });

  it('renders the game title and canvas', async () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /fruit dojo/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('slash-canvas')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('plays')).toHaveTextContent('42'));
  });

  it('starts the game from the start button', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('plays')).toHaveTextContent('42'));
    fireEvent.click(screen.getByRole('button', { name: /start game/i }));

    expect(screen.getByTestId('game-state')).toHaveTextContent(/playing/i);
    expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('plays')).toHaveTextContent('43'));
  });

  it('loads global games played count from the backend on render', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('plays')).toHaveTextContent('42'));
    expect(global.fetch).toHaveBeenCalledWith('/api/plays');
  });

  it('shows the global games played counter as a top-right badge outside the main HUD', async () => {
    render(<App />);

    const plays = screen.getByTestId('plays');
    await waitFor(() => expect(plays).toHaveTextContent('42'));

    expect(plays).toHaveClass('play-counter');
    expect(plays.closest('.hud')).toBeNull();
  });

  it('increments global games played count through the backend when starting', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('plays')).toHaveTextContent('42'));

    fireEvent.click(screen.getByRole('button', { name: /start game/i }));

    await waitFor(() => expect(screen.getByTestId('plays')).toHaveTextContent('43'));
    expect(global.fetch).toHaveBeenCalledWith('/api/plays', { method: 'POST' });
    expect(window.localStorage.getItem('fruit-dojo:plays')).toBeNull();
  });

  it('shows score, combo, timer, and lives HUD', async () => {
    render(<App />);

    expect(screen.getByTestId('score')).toHaveTextContent(/score/i);
    expect(screen.getByTestId('combo')).toHaveTextContent(/combo/i);
    expect(screen.getByTestId('timer')).toHaveTextContent(/time/i);
    expect(screen.getByTestId('lives')).toHaveTextContent(/lives/i);
    await waitFor(() => expect(screen.getByTestId('plays')).toHaveTextContent('42'));
  });

  it('supports deterministic fruit spawning helper', async () => {
    const { createFruit } = await import('../lib/gameLogic.js');
    const fruit = createFruit(0.25, 800, 600);

    expect(fruit.kind).toBe('fruit');
    // Central 30% on 800px screen: 280px to 520px
    expect(fruit.x).toBeGreaterThanOrEqual(280);
    expect(fruit.x).toBeLessThanOrEqual(520);
    expect(fruit.y).toBeGreaterThan(600);
    expect(fruit.vy).toBeLessThan(0);
  });

  it('spawnRange returns central 30% bounds for any width', async () => {
    const { spawnRange } = await import('../lib/gameLogic.js');

    // 800px wide screen: 35% margin = 280px each side
    const r800 = spawnRange(800);
    expect(r800.margin).toBeCloseTo(280);
    expect(r800.spawnWidth).toBeCloseTo(240); // 30% of 800

    // 1200px wide screen: 35% margin = 420px each side
    const r1200 = spawnRange(1200);
    expect(r1200.margin).toBeCloseTo(420);
    expect(r1200.spawnWidth).toBeCloseTo(360); // 30% of 1200

    // Minimum clamped width (320px): 35% margin = 112px each side
    const r320 = spawnRange(320);
    expect(r320.margin).toBeCloseTo(112);
    expect(r320.spawnWidth).toBeCloseTo(96); // 30% of 320
  });

  it('spawns bomb within central 30% area', async () => {
    const { createBomb } = await import('../lib/gameLogic.js');
    const bomb = createBomb(0.5, 800, 600);

    expect(bomb.kind).toBe('bomb');
    expect(bomb.x).toBeGreaterThanOrEqual(280);
    expect(bomb.x).toBeLessThanOrEqual(520);
  });

  it('detects slash hits with radius-based collision', async () => {
    const { slashHitsTarget } = await import('../lib/gameLogic.js');
    const target = { x: 100, y: 100, radius: 32 };
    const trail = [
      { x: 40, y: 100 },
      { x: 80, y: 100 },
      { x: 130, y: 100 },
    ];

    expect(slashHitsTarget(trail, target)).toBe(true);
    expect(slashHitsTarget([{ x: 10, y: 10 }], target)).toBe(false);
  });

  it('cancels animation frame on unmount', async () => {
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = render(<App />);
    await waitFor(() => expect(screen.getByTestId('plays')).toHaveTextContent('42'));
    unmount();
    expect(cancel).toHaveBeenCalled();
    cancel.mockRestore();
  });
});
