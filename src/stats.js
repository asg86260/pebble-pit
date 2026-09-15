// The books: what the yard is actually earning, a second at a time.
//
// Every other number on every other board is a figure the game computes about
// itself -- what a plot should yield, what a bench should get through, what a
// rung would add. None of them is what the yard *did*: a farm with nobody on it
// yields its full rate on paper, a quarry whose haulers are queueing at the pit
// does not, and the difference between the two is the whole of what a player is
// deciding about when they move a body. So these are measured. The books watch
// the counters and know nothing about what makes them move.
//
// **Only what came in.** A rate is what the yard *made*, so a purchase is not
// negative production: spending forty thousand dust would otherwise read as the
// yard running backwards for half a minute. Each reading takes the step up in a
// counter and throws away the step down, which is also what makes the same rule
// work for the four currencies that have no lifetime total to read -- there is
// no `banked` for stone.
//
// **A window, not an easing.** Thirty seconds of gains divided by thirty
// seconds. An eased average has a tail of unknown length and reads high for a
// while after the thing making it has stopped, which is exactly the moment you
// are looking at the board to find out whether it stopped.

import { STATS_WINDOW_S, STATS_SAMPLE_S, STATS_FLOOR } from './config.js';
import { S } from './state.js';
import { MARK } from './upgrades.js';
import { fmt } from './board.js';

// What the books watch, in the order they are read on the board, and the word
// the yard calls each of them by. Dust is read off `banked` -- every grain ever
// put in the hole -- because it is the one that has a lifetime total; the rest
// are balances, and the positive-step rule below is what makes a balance safe to
// read as an income.
//
// A currency appears once you have seen one, which is the rule the counter over
// the pit and the purse beside every board already go by: nothing in this game
// names a thing you have not met.
const BOOKS = [
  { key: 'dust',  name: 'pebbles', mark: 'dust',  count: () => S.banked, seen: () => true },
  { key: 'core',  name: 'cores',  mark: 'core',  count: () => S.cores,  seen: () => S.seenCore },
  { key: 'shard', name: 'ore',     mark: 'shard', count: () => S.shards, seen: () => S.seenShard },
  { key: 'spore', name: 'crops',   mark: 'spore', count: () => S.spores, seen: () => S.seenSpore },
  { key: 'spark', name: 'sparks', mark: 'spark', count: () => S.sparks, seen: () => S.seenSpark }
];

// The window itself: one entry per reading, each holding when it was taken and
// what came in since the one before it. Kept here rather than on `S` because a
// reload has no recent past to come back to -- half a minute of a game you were
// not playing is not a rate, and a saved window would read as one.
const ring = [];
let last = null, lastAt = 0;

// A yard that has been re-made. Every counter is back to nothing, and the
// readings taken of the old one are about a game that no longer exists -- and
// the drop itself must not be mistaken for anything, which the positive-step
// rule would already see to. This is about the *window*: gains from before a
// reset would go on being divided by the seconds since, and the books would
// report the last yard's earnings for half a minute of the new one.
const restarted = vals => BOOKS.some(b => vals[b.key] < last[b.key]);

export function resetBooks() {
  ring.length = 0;
  last = null;
  lastAt = 0;
}

// One reading, a couple of times a second. Every frame would be a sample per
// sixtieth for counters that move a handful of times a second -- a thousand
// entries in the ring for no more truth than forty give.
export function sampleBooks(now) {
  const vals = read();
  if (!last) { last = vals; lastAt = now; return; }
  if (restarted(vals)) { resetBooks(); last = vals; lastAt = now; return; }
  const dt = (now - lastAt) / 1000;
  if (dt < STATS_SAMPLE_S) return;

  const gain = {};
  // Only the step up. See the head of this file: a purchase is not negative
  // production, and dropping the step down is what lets a plain balance stand
  // in for an income.
  for (const b of BOOKS) gain[b.key] = Math.max(0, vals[b.key] - last[b.key]);
  ring.push({ at: now, dt, gain });
  last = vals;
  lastAt = now;

  // and the entries that have fallen out of the back of the window
  const cut = now - STATS_WINDOW_S * 1000;
  while (ring.length && ring[0].at <= cut) ring.shift();
}

const read = () => Object.fromEntries(BOOKS.map(b => [b.key, b.count() || 0]));

// What one of them is coming in at, per second.
//
// Divided by the span the window actually covers rather than by the window's
// full length. A yard forty seconds old has ten seconds of readings in it, and
// dividing ten seconds of earnings by thirty would report a third of the truth
// for the first half minute of every game -- which is the half minute a new
// player is most likely to be reading this board in.
export function bookRate(key) {
  let span = 0, got = 0;
  for (const e of ring) { span += e.dt; got += e.gain[key] || 0; }
  if (span <= 0) return 0;
  const rate = got / span;
  return rate < STATS_FLOOR ? 0 : rate;
}

// How long the books have been watching, in seconds -- the honest denominator
// above, which is also what a check asks for when it wants to know the window is
// running at all.
export const bookSpan = () => ring.reduce((t, e) => t + e.dt, 0);

// A rate, in as many figures as it is worth. A core an hour and a thousand dust
// a second are both read off this column, and the same number of decimals
// cannot be right for both: two figures of precision, and never a decimal point
// on something in the hundreds.
const say = v =>
  v === 0 ? '0' :
  v < 1 ? v.toFixed(2) :
  v < 10 ? v.toFixed(1) :
  String(Math.round(v));

// --- the board ----------------------------------------------------------------
// Rows in the shape every other board uses -- a name, and one thing on the right
// of it -- so the sheet lines up with the rest of them and nothing here needed a
// second kind of row inventing. They are readouts, not purchases: `read` takes
// the cursor and the hover off in the stylesheet, and there is no click on them,
// the same way the pollution arrow on the scrubbing house works.
export const STATS_UPGRADES = BOOKS.map(b => ({
  key: `rate${b.key}`,
  name: b.name,
  // The mark and the rate, over a clock. Seconds are a clock everywhere on these
  // boards now -- see `secondsMark` in upgrades.js -- and this column is the one
  // that would have printed the most of them.
  // The number and its coin; that it is a rate is the heading's to say
  // ("income, a second"), once, rather than a clock on every line.
  price: () => `${MARK[b.mark]} ${say(bookRate(b.key))}`,
  read: true,
  dead: () => false,
  cost: () => 0,
  buy: () => {},
  show: () => b.seen()
}));

// --- the tally ------------------------------------------------------------------
// What the yard has done, all told. The income rows say what is coming in
// this half minute and the record (on the held sheet) says which moments have
// happened; neither is allowed a lifetime total, and the yard has kept a
// dozen of them since the first rock without saying one back. These are those
// counters, read straight off `S` -- nothing here is measured or eased, and
// nothing here is new: every one of them was already being counted, most of
// them for a notice.
//
// Named once you have met the thing, which is the rule the books and the
// counter already go by: a yard that has never seen the cut is not told it has
// dug no ore. The names are the yard's own words for each, in the same voice as
// the income rows above them.
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

// The eldest body's time on the payroll, on the clock every bill is read off.
// `lived` is a body's own clock, kept by the crew -- the same reading the
// hour-on-one-clock notice waits for. Minutes under an hour, hours after, in
// the short form a clock price uses.
const eldest = () => S.workers.reduce((n, w) => Math.max(n, w.lived || 0), 0);
const sayTime = ms =>
  ms >= 3600000 ? `${Math.round(ms / 360000) / 10} h` : `${Math.round(ms / 60000)} min`;

// The clock over the one under the rock, read as a stopwatch -- minutes and
// seconds, hours in front once there are any -- because it is a time you are
// racing rather than a bill you are paying, and a player watching it wants to
// see it move. Two rows for the one number: while they are under it is still
// running, and once they are out it is what the rescue took. The second name
// is the ending sheet's word for it, so the two agree.
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

// One list for the board: the books' own rows and the tally, so the two places
// that already read `STATS_UPGRADES` (board.js, shop.js) get both without
// being told there is a second kind.
STATS_UPGRADES.push(...TALLY_UPGRADES);

export const STATS_SECTIONS = [
  { title: 'income, a second', keys: STATS_UPGRADES.filter(u => u.key.startsWith('rate')).map(u => u.key) },
  { title: 'the tally', keys: TALLY_UPGRADES.map(u => u.key) }
];

// --- what the books are reading ------------------------------------------------
// Smoothed, because a raw per-second count of something that arrives in lumps
// reads as noise.
//
// This lived at the bottom of lab.js, which it never had anything to do with:
// what the yard earns a minute is the books' business, and the books are here.
// It moved when the lab was deleted -- see DESIGN.md, "The lab is deleted".

// All of these only ever go up: a rate is what the operation *made*, and reading
// it off the balance meant a big purchase showed as forty thousand dust a minute
// of negative production.
const WATCH = ['banked', 'shards', 'spores', 'cores'];
const EASE = 0.25;                         // how fast the reading follows reality

export const rates = { banked: 0, shards: 0, spores: 0, cores: 0 };
let lastBooks = null, lastBooksAt = 0;

// after a reset the books are meaningless: a counter going to zero is not a
// negative rate
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
