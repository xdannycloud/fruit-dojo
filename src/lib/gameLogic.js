let nextId = 1;

// Spawn range: objects launch from the central 30% of the screen width (very center-focused).
// A 35% margin on each side keeps fruit/bombs tightly concentrated in the middle.
const SPAWN_MARGIN_RATIO = 0.35;

const FRUITS = [
  { emoji: '🍉', name: 'watermelon', color: '#16a34a', juice: '#ef4444', points: 10 },
  { emoji: '🍊', name: 'orange', color: '#f97316', juice: '#fb923c', points: 12 },
  { emoji: '🍓', name: 'strawberry', color: '#e11d48', juice: '#f43f5e', points: 14 },
  { emoji: '🥝', name: 'kiwi', color: '#65a30d', juice: '#84cc16', points: 16 },
  { emoji: '🍋', name: 'lemon', color: '#eab308', juice: '#fde047', points: 12 },
];

/**
 * Returns the left margin and the spawnable width for a given screen width.
 * Objects always spawn in the central 30% (SPAWN_MARGIN_RATIO on each side).
 * @param {number} safeWidth - clamped screen width
 * @returns {{ margin: number, spawnWidth: number }}
 */
export function spawnRange(safeWidth) {
  const margin = safeWidth * SPAWN_MARGIN_RATIO;
  return { margin, spawnWidth: safeWidth - margin * 2 };
}

export function createFruit(randomValue = Math.random(), width = 800, height = 600) {
  const safeWidth = Math.max(width, 320);
  const safeHeight = Math.max(height, 320);
  const fruit = FRUITS[Math.floor(randomValue * FRUITS.length) % FRUITS.length];
  const { margin, spawnWidth } = spawnRange(safeWidth);
  const x = margin + randomValue * spawnWidth;
  const arc = (randomValue - 0.5) * 7;

  return {
    id: nextId++,
    kind: 'fruit',
    ...fruit,
    x,
    y: safeHeight + 54,
    vx: arc,
    vy: -(13 + randomValue * 5.5),
    radius: 30 + randomValue * 8,
    rotation: randomValue * Math.PI * 2,
    spin: (randomValue - 0.5) * 0.24,
    sliced: false,
  };
}

export function createBomb(randomValue = Math.random(), width = 800, height = 600) {
  const safeWidth = Math.max(width, 320);
  const safeHeight = Math.max(height, 320);
  const { margin, spawnWidth } = spawnRange(safeWidth);
  return {
    id: nextId++,
    kind: 'bomb',
    emoji: '💣',
    name: 'bomb',
    color: '#111827',
    juice: '#f97316',
    points: -50,
    x: margin + randomValue * spawnWidth,
    y: safeHeight + 54,
    vx: (randomValue - 0.5) * 6,
    vy: -(12 + randomValue * 4),
    radius: 32,
    rotation: randomValue * Math.PI * 2,
    spin: (randomValue - 0.5) * 0.2,
    sliced: false,
  };
}

export function slashHitsTarget(trail, target) {
  if (!trail || trail.length === 0 || !target) return false;
  const radius = target.radius || 28;
  return trail.some((point) => {
    const dx = point.x - target.x;
    const dy = point.y - target.y;
    return Math.hypot(dx, dy) <= radius;
  });
}

export function scoreHit(target, combo = 1) {
  if (target.kind === 'bomb') return { scoreDelta: -80, livesDelta: -1, combo: 0 };
  const multiplier = Math.min(5, Math.max(1, combo));
  return {
    scoreDelta: target.points * multiplier,
    livesDelta: 0,
    combo: combo + 1,
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
