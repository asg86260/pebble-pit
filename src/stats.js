// The books: what the yard is actually earning, a second at a time. The
// record is income.js's, written where each coin lands; this file is the
// board that reads it.

import { STATS_OVER_S } from './config.js';
import { S } from './state.js';
import { MARK } from './words.js';
import { fmt } from './words.js';
import { bookRate, overNow } from './income.js';

// What the books show, in board order. A currency appears once you have seen
// one.
const BOOKS = [
  { key: 'dust',  name: 'pebbles', mark: 'dust',  seen: () => true },
  { key: 'core',  name: 'cores',   mark: 'core',  seen: () => S.seenCore },
  { key: 'shard', name: 'ore',     mark: 'shard', seen: () => S.seenShard },
  { key: 'spore', name: 'crops',   mark: 'spore', seen: () => S.seenSpore },
  { key: 'spark', name: 'sparks',  mark: 'spark', seen: () => S.seenSpark }
];

// The toggle's steps, round and round. A saved window that is not on the list
// steps to the first.
export const nextOver = over => STATS_OVER_S[(STATS_OVER_S.indexOf(over) + 1) % STATS_OVER_S.length];
// Never the letter s for a second (test/wave5-boards.test.mjs); half a minute is
// half a minute.
const sayOver = over => over < 60 ? `${over / 60 === 0.5 ? '½' : (over / 60).toFixed(1)} min` : `${Math.round(over / 60)} min`;

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
  price: () => sayOver(overNow()),
  dead: () => false,
  cost: () => 0,
  bill: () => [],
  buy: () => { S.booksOver = nextOver(overNow()); },
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
