// The two cloud codes as text (DESIGN.md, "Cloud saves"; docs/wave-cloud.md,
// "Codes"): drawing one, reading one as a hand typed it, and showing one.
// One module for the game, the sheet and the worker alike -- the worker
// imports it by path, as it does config/cloud.js -- so the three can never
// read the same code three ways. Pure text and `crypto.getRandomValues`,
// which every place the game or the worker runs has.

import {
  CLOUD_ALPHABET, CLOUD_SECRET_LEN, CLOUD_PAIR_LEN, CLOUD_SECRET_PREFIX,
  CLOUD_SECRET_GROUP, CLOUD_PAIR_GROUP
} from './config/cloud.js';

// A random code. Each byte is masked to five bits, which divides 256 evenly,
// so every character is equally likely. No fallback to Math.random: a code
// from a guessable source would be worse than no code.
export function draw(len) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = '';
  for (const b of bytes) out += CLOUD_ALPHABET[b & 31];
  return out;
}

// What a player typed, as the characters it names: case, spaces and dashes
// gone, the secret's prefix dropped, and the letters a hand confuses with
// digits folded into them. The prefix goes before the fold, because PEBBLE
// has an L in it.
export function fold(code) {
  let c = String(code ?? '').toUpperCase().replace(/[\s-]/g, '');
  if (c.length === CLOUD_SECRET_PREFIX.length + CLOUD_SECRET_LEN && c.startsWith(CLOUD_SECRET_PREFIX))
    c = c.slice(CLOUD_SECRET_PREFIX.length);
  return c.replace(/O/g, '0').replace(/[IL]/g, '1');
}

const valid = (c, len) => c.length === len && [...c].every(ch => CLOUD_ALPHABET.includes(ch));
// A well-formed code, or null, so a caller can refuse one without asking
// anybody.
export function normalSecret(code) { const c = fold(code); return valid(c, CLOUD_SECRET_LEN) ? c : null; }
export function normalPair(code) { const c = fold(code); return valid(c, CLOUD_PAIR_LEN) ? c : null; }

const groups = (c, n) => (c.match(new RegExp(`.{1,${n}}`, 'g')) || []).join('-');
export const showSecret = c => `${CLOUD_SECRET_PREFIX}-${groups(c, CLOUD_SECRET_GROUP)}`;
export const showPair = c => groups(c, CLOUD_PAIR_GROUP);

// A pairing code as the box shows it while it is typed: only characters a
// code can hold, no more of them than a code has, and the dash put in where
// it is shown.
export function typedPair(text) {
  const bare = [...fold(text)].filter(ch => CLOUD_ALPHABET.includes(ch)).join('').slice(0, CLOUD_PAIR_LEN);
  return showPair(bare);
}
