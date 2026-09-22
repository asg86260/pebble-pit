// The books: what the yard is actually earning, a second at a time, measured
// off the counters rather than computed from the rates on paper.
//
// Only what came in: each reading keeps the step up in a counter and throws
// away the step down, so a purchase is not negative production and a plain
// balance can stand in for an income. A window, not an easing: an eased
// average reads high for a while after the thing making it has stopped, which
// is exactly when you are looking at the board.
//
// The window is each currency's own. A fixed one is the wrong length for every
// coin at once: thirty seconds is a hundred arrivals of dust and two of ore, so
// the ore row read 0.07, then 0.13, then 0.07 with nothing in the yard having
// changed -- the lumps either side of the edge, not the rate. Each currency
// reaches back as far as it needs to have STATS_ARRIVALS arrivals behind it, no
// less than the short window and no more than the long one, so a streaming coin
// stays live and a rare one stops flickering. A player who would rather read
// every row over the same stretch picks one of STATS_OVER_S on the board
// (`booksOver`), and then that is the window, lumps and all.

import { STATS_WINDOW_S, STATS_WINDOW_MAX_S, STATS_ARRIVALS, STATS_SAMPLE_S,
         STATS_FLOOR, STATS_OVER_S } from './config.js';
import { S } from './state.js';
import { MARK } from './words.js';
import { fmt } from './words.js';

// What the books watch, in board order. Dust is read off `banked` because it
// has a lifetime total; the rest are balances. A currency appears once you
// have seen one.
const BOOKS = [
  { key: 'dust',  name: 'pebbles', mark: 'dust',  count: () => S.banked, seen: () => true },
  { key: 'core',  name: 'cores',  mark: 'core',  count: () => S.cores,  seen: () => S.seenCore },
  { key: 'shard', name: 'ore',     mark: 'shard', count: () => S.shards, seen: () => S.seenShard },
  { key: 'spore', name: 'crops',   mark: 'spore', count: () => S.spores, seen: () => S.seenSpore },
  { key: 'spark', name: 'sparks', mark: 'spark', count: () => S.sparks, seen: () => S.seenSpark }
];

// The window: one entry per reading. Kept off `S` because half a minute of a
// game you were not playing is not a rate, and a saved window would read as
// one.
const ring = [];
let last = null, lastAt = 0;

// A yard that has been re-made: the window is dropped, or the last yard's
// gains would go on being divided by the seconds of the new one.
const restarted = vals => BOOKS.some(b => vals[b.key] < last[b.key]);

export function resetBooks() {
  ring.length = 0;
  last = null;
  lastAt = 0;
}

// One reading, a couple of times a second; every frame would be a thousand
// entries in the ring for no more truth than forty give.
export function sampleBooks(now) {
  const vals = read();
  if (!last) { last = vals; lastAt = now; return; }
  if (restarted(vals)) { resetBooks(); last = vals; lastAt = now; return; }
  const dt = (now - lastAt) / 1000;
  if (dt < STATS_SAMPLE_S) return;

  const gain = {};
  // Only the step up (see the head of this file).
  for (const b of BOOKS) gain[b.key] = Math.max(0, vals[b.key] - last[b.key]);
  ring.push({ at: now, dt, gain });
  last = vals;
  lastAt = now;

  const cut = now - Math.max(STATS_WINDOW_MAX_S, ...STATS_OVER_S) * 1000;
  while (ring.length && ring[0].at <= cut) ring.shift();
}

const read = () => Object.fromEntries(BOOKS.map(b => [b.key, b.count() || 0]));

// Walk back from now over one currency's window and hand back what came in
// and the seconds it came in over. Auto stops once there are both a short
// window's seconds and STATS_ARRIVALS arrivals behind it; a picked window
// stops at its length. With no key it is the whole ring.
function windowOf(key) {
  const over = S.booksOver || 0;
  let span = 0, got = 0, seen = 0;
  for (let i = ring.length - 1; i >= 0; i--) {
    const e = ring[i];
    if (key != null && over > 0 && span + e.dt > over) break;
    const g = key == null ? 0 : e.gain[key] || 0;
    span += e.dt;
    got += g;
    if (g > 0) seen++;
    if (key != null && over <= 0 && span >= STATS_WINDOW_S && seen >= STATS_ARRIVALS) break;
  }
  return { span, got };
}

// Per second, divided by the span the window actually covers rather than its
// nominal length: a young yard has ten seconds of readings, and dividing them
// by thirty would report a third of the truth.
export function bookRate(key) {
  const { span, got } = windowOf(key);
  if (span <= 0) return 0;
  const rate = got / span;
  return rate < STATS_FLOOR ? 0 : rate;
}

// How far back a currency's window reaches, in seconds; with nothing named,
// how long the books have been watching.
export const bookSpan = key => windowOf(key).span;

// The toggle's steps: auto, then each fixed window, then round again. A saved
// window that is not on the list (an older build's) steps to the first.
const OVERS = [0, ...STATS_OVER_S];
export const nextOver = over => OVERS[(OVERS.indexOf(over) + 1) % OVERS.length];
const sayOver = over => over > 0 ? `${Math.round(over / 60)} min` : 'auto';

// Two figures of precision, and never a decimal point on something in the
// hundreds: a core an hour and a thousand dust a second share this column.
const say = v =>
  v === 0 ? '0' :
  v < 1 ? v.toFixed(2) :
  v < 10 ? v.toFixed(1) :
  String(Math.round(v));

// --- the board ----------------------------------------------------------------
// The window the rates are taken over, pressed to step to the next. A
// signpost's press: nothing is bought, and it carries no pushpin.
const OVER_ROW = {
  key: 'ratesover',
  name: 'averaged over',
  sign: true,
  price: () => sayOver(S.booksOver || 0),
  dead: () => false,
  cost: () => 0,
  bill: () => [],
  buy: () => { S.booksOver = nextOver(S.booksOver || 0); },
  show: () => true
};

// Rows in the shape every other board uses. They are readouts, not purchases:
// `read` takes the cursor and the hover off in the stylesheet.
export const STATS_UPGRADES = BOOKS.map(b => ({
  key: `rate${b.key}`,
  name: b.name,
  // The number and its coin; that it is a rate is the heading's to say, once.
  price: () => `${MARK[b.mark]} ${say(bookRate(b.key))}`,
  read: true,
  dead: () => false,
  cost: () => 0,
  buy: () => {},
  show: () => b.seen()
}));

// --- the tally ------------------------------------------------------------------
// Lifetime totals, read straight off `S`; nothing here is measured or eased.
// Named once you have met the thing.
const TALLY = [
  { key: 'rocks',  name: 'rocks cleared',
    count: () => S.boulderNo - 1, seen: () => S.boulderNo >= 2 },
  { key: 'banked', name: 'pebbles banked', mark: 'dust',
    count: () => S.banked, seen: () => S.banked > 0 },
  { key: 'ore',    name: 'ore dug', mark: 'shard',
    count: () => S.quarryTotal, seen: () => S.seenShard },
  { key: 'rift',   name: 'through the rift', mark: 'dust',
    count: () => S.riftAte, seen: () => S.riftOpen },
  { key: 'brews',  name: 'batches brewed',
    count: () => S.brews, seen: () => S.brews >= 1 },
  { key: 'hats',   name: 'hats finished',
    count: () => S.wizardHats, seen: () => S.wizardHats >= 1 },
  { key: 'crew',   name: 'on the payroll',
    count: () => S.crew, seen: () => S.crew >= 1 },
  { key: 'notes',  name: 'notices earned',
    count: () => S.won.length, seen: () => S.won.length >= 1 }
];

// `lived` is a body's own clock, kept by the crew. Minutes under an hour,
// hours after.
const eldest = () => S.workers.reduce((n, w) => Math.max(n, w.lived || 0), 0);
const sayTime = ms =>
  ms >= 3600000 ? `${Math.round(ms / 360000) / 10} h` : `${Math.round(ms / 60000)} min`;

// The clock over the one under the rock, read as a stopwatch because it is a
// time you are racing. Two rows for the one number: still running while they
// are under, what the rescue took once they are out.
export const sayClock = ms => {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return s >= 3600 ? `${Math.floor(s / 3600)}:${mm}:${ss}` : `${mm}:${ss}`;
};

const TALLY_UPGRADES = [
  ...TALLY.map(t => ({
    key: `tally${t.key}`,
    name: t.name,
    price: () => `${t.mark ? MARK[t.mark] + ' ' : ''}${fmt(t.count() || 0)}`,
    read: true,
    dead: () => false,
    cost: () => 0,
    buy: () => {},
    show: () => t.seen()
  })),
  { key: 'tallyeldest',
    name: 'longest on one clock',
    price: () => `${MARK.time} ${sayTime(eldest())}`,
    read: true,
    dead: () => false,
    cost: () => 0,
    buy: () => {},
    show: () => eldest() >= 60000 },
  { key: 'tallyunder',
    name: 'sqwife under the rock for',
    price: () => `${MARK.time} ${sayClock(S.buriedMs)}`,
    read: true,
    dead: () => false,
    cost: () => 0,
    buy: () => {},
    show: () => S.buried },
  { key: 'tallysaved',
    name: 'sqwife saved in',
    price: () => `${MARK.time} ${sayClock(S.buriedMs)}`,
    read: true,
    dead: () => false,
    cost: () => 0,
    buy: () => {},
    show: () => S.rescued }
];

// One list, so board.js and shop.js get every kind without being told.
STATS_UPGRADES.unshift(OVER_ROW);
STATS_UPGRADES.push(...TALLY_UPGRADES);

export const STATS_SECTIONS = [
  { title: 'income, a second', keys: STATS_UPGRADES.filter(u => u.key.startsWith('rate')).map(u => u.key) },
  { title: 'the tally', keys: TALLY_UPGRADES.map(u => u.key) }
];

// --- the eased per-minute rates ----------------------------------------------
// Smoothed, because a raw per-second count of something that arrives in lumps
// reads as noise.

const WATCH = ['banked', 'shards', 'spores', 'cores'];
const EASE = 0.25;                         // how fast the reading follows reality

export const rates = { banked: 0, shards: 0, spores: 0, cores: 0 };
let lastBooks = null, lastBooksAt = 0;

// A counter going to zero on a reset is not a negative rate.
export function resetRates() {
  lastBooks = null;
  for (const k of WATCH) rates[k] = 0;
}

export function sampleRates(now) {
  if (!lastBooks) { lastBooks = snapshot(); lastBooksAt = now; return; }
  const dt = now - lastBooksAt;
  if (dt < 500) return;                    // often enough to feel live, rarely enough to be steady

  const nowVals = snapshot();
  for (const k of WATCH) {
    const perMin = (nowVals[k] - lastBooks[k]) * 60000 / dt;
    rates[k] += (perMin - rates[k]) * EASE;
    if (Math.abs(rates[k]) < 0.001) rates[k] = 0;
  }
  lastBooks = nowVals;
  lastBooksAt = now;
}

const snapshot = () => ({ banked: S.banked, shards: S.shards, spores: S.spores, cores: S.cores });
