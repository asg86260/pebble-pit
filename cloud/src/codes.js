// The two codes and what the worker keeps of them (docs/wave-cloud.md,
// "Codes"). The text of a code -- drawing, reading, showing -- is the game's
// own src/codes.js, so a code the sheet accepts is one the worker reads the
// same way. What is here is the worker's alone: hashes, the pairing's sealed
// secret, and a comparison that takes the same time however close a guess is.
// Only WebCrypto, which a Worker and node both carry.

export { draw, normalSecret, normalPair, showSecret, showPair } from '../../src/codes.js';

// AES-GCM's standard nonce, in bytes: a fact of the cipher, not a setting.
const IV_BYTES = 12;

const enc = new TextEncoder();
const dec = new TextDecoder();

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

// Whether two secrets match, in time that does not depend on where they
// differ: both are hashed first, so the loop is always over 32 bytes and
// every byte is read.
export async function sameSecret(a, b) {
  const [x, y] = await Promise.all([sha256(String(a ?? '')), sha256(String(b ?? ''))]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
