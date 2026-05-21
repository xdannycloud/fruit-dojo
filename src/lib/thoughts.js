export const IDLE_THOUGHTS = [
  'add tests',
  'ship it',
  'refactor?',
  'lgtm',
  'commit?',
  'TODO: docs',
  'good catch',
  'merge?',
  'cache me',
  'nit',
  'wow',
  'looks good!',
];

export const FOCUS_THOUGHTS = [
  'deep work',
  'flow state',
  'shhh…',
  'compiling…',
  'one more test',
  'thinking…',
  'almost there',
];

export const EXCITED_THOUGHTS = [
  'yes!',
  'ship it!',
  'wheee',
  '+1',
  '✨',
  'lfg',
];

export function pickThought(kind = 'idle') {
  const pool =
    kind === 'focus' ? FOCUS_THOUGHTS :
    kind === 'excited' ? EXCITED_THOUGHTS :
    IDLE_THOUGHTS;
  return pool[Math.floor(Math.random() * pool.length)];
}
