// The yard's income, as a running record: what came into the hole, a coin at
// a time, written down where it lands (`earned`, called by the pit) rather
// than guessed from a balance going up. A balance goes up for things that are
// not income -- a bill handed back, a hook -- and a guess that counts those
// reads a refund of five hundred ore as a quarry for minutes afterwards.
//
// The record is a ring of buckets, one every STATS_SAMPLE_S, holding the
// longest window the board offers. A rate over any window is then only a sum
// and a division: what came in over the last N seconds, over N -- or over the
// seconds the record actually holds, for a yard younger than N.
//
// Kept off `S`: minutes of a game you were not playing are not a rate, and a
// saved record would read as one.

import { STATS_SAMPLE_S, STATS_FLOOR, STATS_OVER_S, STATS_OVER_DEFAULT } from './config.js';
import { S } from './state.js';

export const COINS = ['dust', 'core', 'shard', 'spore', 'spark'];

const KEEP_S = Math.max(...STATS_OVER_S);
const ring = [];                   // { at, dt, got: { coin: n } }, oldest first
let open = {};                     // what has come in since the last bucket closed
let lastAt = null;
let lastBanked = 0;

export function resetBooks() {
  ring.length = 0;
  open = {};
  lastAt = null;
  lastBanked = S.banked || 0;
}

// A coin into the hole. Called by the pit and nobody else, so every way a
// coin can come in is counted once.
export function earned(coin, n) {
  if (!(n > 0)) return;
  open[coin] = (open[coin] || 0) + n;
}

// Closes a bucket every STATS_SAMPLE_S; every frame would be tens of
// thousands of buckets for no more truth.
export function sampleBooks(now) {
  // A yard re-made or another save read: `banked` only ever climbs within one
  // yard, so going down means the record is somebody else's.
  if ((S.banked || 0) < lastBanked) resetBooks();
  lastBanked = S.banked || 0;
  if (lastAt == null) { lastAt = now; open = {}; return; }
  const dt = (now - lastAt) / 1000;
  if (dt < STATS_SAMPLE_S) return;
  ring.push({ at: now, dt, got: open });
  open = {};
  lastAt = now;
  const cut = now - KEEP_S * 1000;
  while (ring.length && ring[0].at <= cut) ring.shift();
}

// How far back a window of `over` seconds reaches in the record: its length,
// or the whole record while the record is shorter.
function take(over) {
  let span = 0;
  const got = {};
  for (let i = ring.length - 1; i >= 0; i--) {
    const b = ring[i];
    if (span + b.dt > over + 1e-6) break;
    span += b.dt;
    for (const c in b.got) got[c] = (got[c] || 0) + b.got[c];
  }
  return { span, got };
}

// The window the board is set to. A saved one that is not on the list (an
// older build's) reads as the default.
export const overNow = () => STATS_OVER_S.includes(S.booksOver) ? S.booksOver : STATS_OVER_DEFAULT;

// A coin's income a second, over the window the board is set to.
export function bookRate(coin, over = overNow()) {
  const { span, got } = take(over);
  if (span <= 0) return 0;
  const rate = (got[coin] || 0) / span;
  return rate < STATS_FLOOR ? 0 : rate;
}

// The seconds a rate is actually divided by.
export const bookSpan = (over = overNow()) => take(over).span;
