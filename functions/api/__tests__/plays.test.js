import { describe, expect, it } from 'vitest';
import { onRequestGet, onRequestPost } from '../plays.js';

function createCounterStore(initial = {}) {
  const values = new Map(Object.entries(initial));

  return {
    async get(key) {
      return values.get(key) ?? null;
    },
    async put(key, value) {
      values.set(key, String(value));
    },
  };
}

async function readJson(response) {
  return response.json();
}

describe('/api/plays', () => {
  it('returns the global plays count from backend storage', async () => {
    const response = await onRequestGet({ env: { FRUIT_DOJO_KV: createCounterStore({ plays: '12' }) } });

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ plays: 12 });
  });

  it('increments and persists the global plays count on POST', async () => {
    const store = createCounterStore({ plays: '12' });

    const response = await onRequestPost({ env: { FRUIT_DOJO_KV: store } });

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ plays: 13 });
    expect(await store.get('plays')).toBe('13');
  });
});
