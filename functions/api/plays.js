const COUNTER_KEY = 'plays';

function parseCount(value) {
  const count = Number.parseInt(value ?? '0', 10);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

async function readPlays(env) {
  const stored = await env.FRUIT_DOJO_KV.get(COUNTER_KEY);
  return parseCount(stored);
}

function requireStore(env) {
  if (!env?.FRUIT_DOJO_KV) {
    throw new Error('FRUIT_DOJO_KV binding is not configured');
  }
  return env.FRUIT_DOJO_KV;
}

export async function onRequestGet({ env }) {
  try {
    requireStore(env);
    const plays = await readPlays(env);
    return json({ plays });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

export async function onRequestPost({ env }) {
  try {
    const store = requireStore(env);
    const plays = (await readPlays(env)) + 1;
    await store.put(COUNTER_KEY, String(plays));
    return json({ plays });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
