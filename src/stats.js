// The books: what the yard is actually earning, a second at a time. The
// record is income.js's, written where each coin lands; this file is the
// board that reads it.

import { STATS_OVER_S, STATS_TREND_STEPS } from './config.js';
import { S } from './state.js';
import { MARK } from './words.js';
import { fmt } from './words.js';
import { bookRate, bookGot, bookTrend, overNow } from './income.js';
import { arrowsFor } from './words.js';
import { AIR_TREND_STEPS } from './config.js';
import { airReadout, airSides, airTrend, skyKindCounts, muckLeft } from './smog.js';
import { doing } from './crewboard.js';
import { JOB, JOB_OF, jobSaid } from './jobs.js';
import { showWindow } from './modal.js';
import { registerBoard } from './boardrows.js';

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
// Every row is a readout in the shape every other board uses; `read` takes the
// cursor and the hover off in the stylesheet. A row's `note` is the dim line
// under it on the ledger.
const readout = (key, name, price, show, note) =>
  ({ key, name, price, note, read: true, dead: () => false, cost: () => 0, buy: () => {}, show });

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

// --- income, a second -------------------------------------------------------------
// The rate, its arrow against the window before, and under it the window's sum.
const lastWords = over =>
  over < 60 ? 'the last half minute' : over === 60 ? 'the last minute' : `the last ${Math.round(over / 60)} minutes`;
const arrowOf = coin => {
  const t = bookTrend(coin);
  return t == null ? '' : arrowsFor(t, STATS_TREND_STEPS) + ' ';
};
const INCOME_ROWS = BOOKS.map(b => readout(`rate${b.key}`, b.name,
  // The number and its coin; that it is a rate is the heading's to say, once.
  () => `${arrowOf(b.key)}${MARK[b.mark]} ${say(bookRate(b.key))}`,
  () => b.seen(),
  // Said even when nothing came in, so the line does not come and go.
  () => { const n = bookGot(b.key); return `${n > 0 ? fmt(n) : 'nothing'} in ${lastWords(overNow())}`; }));

// --- the sky ----------------------------------------------------------------------
// What the air filter's arrow says, and why: the two sides of it over the same
// minute, how full the sky is, and what put it there.
const perMin = v => say(Math.max(0, v) * 60);
// The sky's motes by what kicked them up (`SMOG_TINTS` names the kinds).
const DIRT = [
  { kind: 'mach',  name: 'from the machines' },
  { kind: 'dust',  name: 'from the rock' },
  { kind: 'shard', name: 'from the quarry' },
  { kind: 'spore', name: 'from the farm' }
];
const dirtShare = kind => {
  const k = skyKindCounts();
  const all = Object.values(k).reduce((a, b) => a + b, 0);
  return all ? (k[kind] || 0) / all : 0;
};
const sayPct = v => `${Math.round(v * 100)}%`;
// A countdown to a full sky, as a clock, off the same minute as the arrow so
// the two cannot disagree; nothing to count while the house is winning, which
// is the reading worth playing for.
const sayDue = () => {
  const { up, down } = airSides();
  const { haze, cap } = airReadout();
  const net = up - down;
  if (net <= 0) return 'not at this rate';
  return `${MARK.time} ${sayClock(Math.max(0, cap - haze) / net * 1000)}`;
};
const seenSky = () => S.seenAir;
const SKY_ROWS = [
  readout('skytrend', 'pollution', () => arrowsFor(airTrend() * 60, AIR_TREND_STEPS), seenSky),
  readout('skyup', 'put up, a minute', () => perMin(airSides().up), seenSky),
  readout('skydown', 'taken out, a minute', () => perMin(airSides().down), seenSky),
  readout('skyhaze', 'the sky is', () => `${sayPct(airReadout().share)} full`, seenSky),
  readout('skydue', 'full in', sayDue, seenSky),
  ...DIRT.map(d => readout(`sky${d.kind}`, d.name, () => sayPct(dirtShare(d.kind)),
                           () => seenSky() && dirtShare(d.kind) >= 0.01)),
  readout('skyrains', 'showers weathered', () => fmt(S.rains || 0), () => seenSky() && S.rains >= 1),
  readout('skymuck', 'muck lying about', () => fmt(muckLeft()), () => seenSky() && muckLeft() > 0)
];

// --- the crew ---------------------------------------------------------------------
// How many, doing what, and who is best at it. The jobs are the stations a
// player hires for, in the words a player uses, one line a station; the spare
// hands putting a building up are nobody's station and are not counted here.
// The words are jobs.js's (`jobSaid`), the one place a job is spelled.
const JOBS_SHOWN = [JOB.ROCK, JOB.QUARRY, JOB.HAUL, JOB.FARM, JOB.JANITOR, JOB.PURIFY, JOB.STIR, JOB.WIZARD];
const headcount = job => S.workers.filter(w => JOB_OF[w.type] === job).length;
// At it, or not: walking there, on a break, at home and nothing much are all
// not at it, and telling them apart was more lines than it was worth. The
// doing is the crew card's own word (`doing` in crewboard.js), so the two
// boards cannot disagree.
const NOT_AT_IT = new Set(['on a break', 'at home', 'walking there', 'heading home', 'nothing much',
                           'in your hand', 'in mid-air']);
const NOW_IS = [
  { key: 'working', name: 'working', is: w => !NOT_AT_IT.has(doing(w)) },
  { key: 'idle',    name: 'idle',    is: w => NOT_AT_IT.has(doing(w)) }
];
const nowIs = key => { const n = NOW_IS.find(x => x.key === key); return S.workers.filter(n.is).length; };
// The records every body keeps (crew/records.js), best of the crew standing.
const BEST = [
  { field: 'mined',    name: 'most off the rock' },
  { field: 'quarried', name: 'most ore mined' },
  { field: 'farmed',   name: 'most crops farmed' },
  { field: 'stored',   name: 'most into the hole' },
  { field: 'tidied',   name: 'most muck cleared' }
];
const best = field => S.workers.reduce((b, w) => ((w[field] || 0) > (b ? b[field] || 0 : 0) ? w : b), null);
// `lived` is a body's own clock, kept by the crew. Minutes under an hour,
// hours after.
const eldest = () => S.workers.reduce((n, w) => Math.max(n, w.lived || 0), 0);
const sayTime = ms =>
  ms >= 3600000 ? `${Math.round(ms / 360000) / 10} h` : `${Math.round(ms / 60000)} min`;
const hasCrew = () => S.workers.length > 0;
const CREW_ROWS = [
  ...JOBS_SHOWN.map(j => readout(`crew${j}`, jobSaid(j), () => String(headcount(j)),
                                 () => headcount(j) > 0)),
  ...NOW_IS.map(n => readout(`now${n.key}`, n.name, () => String(nowIs(n.key)), hasCrew)),
  ...BEST.map(r => readout(`best${r.field}`, r.name,
                           () => { const w = best(r.field); return w ? `${w.name} · ${fmt(w[r.field])}` : ''; },
                           () => !!best(r.field))),
  readout('tallyeldest', 'longest on one clock', () => `${MARK.time} ${sayTime(eldest())}`,
          () => eldest() >= 60000)
];

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
  // Income over the whole game, refunds kept out, as the rates count it.
  ...BOOKS.filter(b => b.key !== 'dust').map(b => ({
    key: `earned${b.key}`, name: `${b.name} earned`, mark: b.mark,
    count: () => S.earnedTotal[b.key] || 0, seen: () => b.seen() && (S.earnedTotal[b.key] || 0) > 0 })),
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

// The clock over the one under the rock, read as a stopwatch because it is a
// time you are racing. Two rows for the one number: still running while they
// are under, what the rescue took once they are out.
export const sayClock = ms => {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return s >= 3600 ? `${Math.floor(s / 3600)}:${mm}:${ss}` : `${mm}:${ss}`;
};

const TALLY_ROWS = [
  ...TALLY.map(t => readout(`tally${t.key}`, t.name,
                            () => `${t.mark ? MARK[t.mark] + ' ' : ''}${fmt(t.count() || 0)}`,
                            () => t.seen())),
  readout('tallyunder', 'sqwife under the rock for', () => `${MARK.time} ${sayClock(S.buriedMs)}`,
          () => S.buried),
  readout('tallysaved', 'sqwife saved in', () => `${MARK.time} ${sayClock(S.buriedMs)}`,
          () => S.rescued)
];

// The books in the window (modal.js): every sheet, side by side. Each sheet
// is built on its own, so a column holds a whole sheet.
export const BOOK_ROWS = [OVER_ROW, ...INCOME_ROWS, ...SKY_ROWS, ...CREW_ROWS, ...TALLY_ROWS];
export const BOOK_SECTIONS = [
  { title: 'income, a second', keys: [OVER_ROW, ...INCOME_ROWS].map(u => u.key) },
  { title: 'the sky', keys: SKY_ROWS.map(u => u.key) },
  { title: 'the crew', keys: CREW_ROWS.map(u => u.key) },
  { title: 'the tally', keys: TALLY_ROWS.map(u => u.key) }
];

// The board at the noticeboard: what you glance at in passing, the rates. The
// way into the books window is off the board for now -- most of what the
// sheets say is not worth a player's glance -- so the window is reached only
// from the dev panel (`__window('books')`) until it is cut down.
export const OPEN_ROW = {
  key: 'openbooks',
  name: 'open the books',
  sign: true,
  price: () => '▸',
  dead: () => false,
  cost: () => 0,
  bill: () => [],
  buy: () => showWindow('books'),
  show: () => true
};
export const STATS_UPGRADES = [...INCOME_ROWS];
export const STATS_SECTIONS = [
  { title: 'income, a second', keys: STATS_UPGRADES.map(u => u.key) }
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

registerBoard('stats', { rows: () => STATS_UPGRADES, sections: () => STATS_SECTIONS, ledger: true });
