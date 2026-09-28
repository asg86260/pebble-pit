// The two codes and what the worker keeps of them (docs/wave-cloud.md,
// "Codes"). Only WebCrypto, which a Worker and node both carry, so the
// checks run the same bytes the deploy does.

import { CLOUD_SECRET_LEN, CLOUD_PAIR_LEN, CLOUD_ALPHABET } from '../../src/config/cloud.js';

// The game's alphabet (config/cloud.js), so the two ends cannot disagree on
// what a code may hold.
export const ALPHABET = CLOUD_ALPHABET;

// The shown secret's prefix, and the size of the groups both codes are shown
// in. Presentation only: the input side strips all of it.
const PREFIX = 'PEBBLE';
const SECRET_GROUP = 4;
const PAIR_GROUP = 3;

// AES-GCM's standard nonce, in bytes.
const IV_BYTES = 12;

const enc = new TextEncoder();
const dec = new TextDecoder();

// A random code. Each byte is masked to five bits, which divides 256 evenly,
// so every character is equally likely.
export function draw(len) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = '';
  for (const b of bytes) out += ALPHABET[b & 31];
  return out;
}

// What a player typed, as the code it names: case, the letters that look
// like digits, and the dashes and spaces a shown code carries all fold away.
function fold(s) {
  return String(s ?? '').toUpperCase().replace(/[\s-]/g, '');
}
function digits(s) {
  return s.replace(/O/g, '0').replace(/[IL]/g, '1');
}
const valid = (s, len) => s.length === len && [...s].every(c => ALPHABET.includes(c));

// The prefix is stripped before the look-alikes fold, since folding would
// turn its L into a 1. Anything that is not a well-formed code is null, so
// the routes can refuse it without a database read.
export function normalSecret(s) {
  let t = fold(s);
  if (t.startsWith(PREFIX) && t.length === PREFIX.length + CLOUD_SECRET_LEN) t = t.slice(PREFIX.length);
  t = digits(t);
  return valid(t, CLOUD_SECRET_LEN) ? t : null;
}
export function normalPair(s) {
  const t = digits(fold(s));
  return valid(t, CLOUD_PAIR_LEN) ? t : null;
}

const groups = (s, n) => s.match(new RegExp(`.{1,${n}}`, 'g')).join('-');
export const showSecret = s => `${PREFIX}-${groups(s, SECRET_GROUP)}`;
export const showPair = s => groups(s, PAIR_GROUP);

export async function sha256(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}
export async function sha256hex(text) {
  return [...await sha256(text)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// The secret is at rest only while a pairing is live, and only under a key
// derived from the pair and the pepper together: the database alone, or the
// pair alone, opens nothing.
async function pairKey(pepper, pair) {
  const raw = await sha256(pepper + '/key/' + pair);
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function seal(pepper, pair, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const wrapped = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await pairKey(pepper, pair), enc.encode(secret)));
  return { wrapped, iv };
}

// Null when the key is wrong or the row was tampered with; GCM checks both.
export async function unseal(pepper, pair, wrapped, iv) {
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, await pairKey(pepper, pair), new Uint8Array(wrapped));
    return dec.decode(plain);
  } catch {
    return null;
  }
}
