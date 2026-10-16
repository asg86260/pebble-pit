// The books: what the yard is actually earning, a second at a time. The
// record is income.js's, written where each coin lands; this file is the
// board that reads it.

import { msg } from './lang.js';
import { STATS_OVER_S, STATS_TREND_STEPS } from './config.js';
import { S } from './state.js';
import { MARK } from './words.js';
import { fmt, sayPlayed } from './words.js';
import { bookRate, bookGot, bookTrend, overNow } from './income.js';
import { arrowsFor } from './words.js';
import { AIR_TREND_STEPS } from './config.js';
import { airReadout, airSides, airTrend, skyKindCounts, muckLeft } from './smog.js';
import { doing } from './crewboard.js';
import { JOB, JOB_OF, jobSaid } from './jobs.js';
import { showWindow } from './modal.js';
import { registerBoard } from './boardrows.js';
import { storyLine } from './wardrobe.js';

// What the books show, in board order. A currency appears once you have seen
// one.
const BOOKS = [
  { key: 'dust',  name: msg('books-dust'), mark: 'dust',  seen: () => true },
  { key: 'shard', name: msg('books-shard'), mark: 'shard', seen: () => S.seenShard },
  { key: 'spore', name: msg('books-spore'), mark: 'spore', seen: () => S.seenSpore },
  { key: 'spark', name: msg('books-spark'), mark: 'spark', seen: () => S.seenSpark }
];

// The toggle's steps, round and round. A saved window that is not on the list
// steps to the first.
export const nextOver = over => STATS_OVER_S[(STATS_OVER_S.indexOf(over) + 1) % STATS_OVER_S.length];
// Never the letter s for a second (test/wave5-boards.test.mjs); half a minute is
// half a minute.
const sayOver = over => msg('books-over-min', { n: over < 60 ? (over / 60 === 0.5 ? '½' : (over / 60).toFixed(1)) : Math.round(over / 60) });

// Two figures of precision, and never a decimal point on something in the
// hundreds: a spark an hour and a thousand dust a second share this column.
const say = v =>
  v === 0 ? '0' :
  v < 1 ? v.toFixed(2) :
  v < 10 ? v.toFixed(1) :
  String(Math.round(v));

// --- the board ----------------------------------------------------------------
// Every row is a readout in the shape every other board uses; `read` takes the
// cursor and the hover off in the stylesheet. A row's `note` is the dim line
// under it on the ledger. A name given as a function is read each time it is
// shown: a line that names the two of them, who are named after the board
// is built.
const readout = (key, name, price, show, note) =>
  ({ key, get name() { return typeof name === 'function' ? name() : name; }, price, note, read: true,
     dead: () => false, cost: () => 0, buy: () => {}, show });

// The window the rates are taken over, pressed to step to the next. A
// signpost's press: nothing is bought, and it carries no pushpin.
const OVER_ROW = {
  key: 'ratesover',
  name: msg('books-over'),
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
  over < 60 ? msg('books-last-half') : over === 60 ? msg('books-last-one') : msg('books-last-mins', { n: Math.round(over / 60) });
const arrowOf = coin => {
  const t = bookTrend(coin);
  return t == null ? '' : arrowsFor(t, STATS_TREND_STEPS) + ' ';
};
const INCOME_ROWS = BOOKS.map(b => readout(`rate${b.key}`, b.name,
  // The number and its coin; that it is a rate is the heading's to say, once.
  () => `${arrowOf(b.key)}${MARK[b.mark]} ${say(bookRate(b.key))}`,
  () => b.seen(),
  // Said even when nothing came in, so the line does not come and go.
  () => { const n = bookGot(b.key); return msg('books-got', { n: n > 0 ? fmt(n) : msg('books-nothing'), over: lastWords(overNow()) }); }));

// --- the sky ----------------------------------------------------------------------
// What the air filter's arrow says, and why: the two sides of it over the same
// minute, how full the sky is, and what put it there.
const perMin = v => say(Math.max(0, v) * 60);
// The sky's motes by what kicked them up (`SMOG_TINTS` names the kinds).
const DIRT = [
  { kind: 'mach',  name: msg('books-dirt-mach') },
  { kind: 'dust',  name: msg('books-dirt-dust') },
  { kind: 'shard', name: msg('books-dirt-shard') },
  { kind: 'spore', name: msg('books-dirt-spore') }
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
  if (net <= 0) return msg('books-due-never');
  return `${MARK.time} ${sayClock(Math.max(0, cap - haze) / net * 1000)}`;
};
const seenSky = () => S.seenAir;
const SKY_ROWS = [
  readout('skytrend', msg('books-sky-trend'), () => arrowsFor(airTrend() * 60, AIR_TREND_STEPS), seenSky),
  readout('skyup', msg('books-sky-up'), () => perMin(airSides().up), seenSky),
  readout('skydown', msg('books-sky-down'), () => perMin(airSides().down), seenSky),
  readout('skyhaze', msg('books-sky-haze'), () => msg('books-sky-full', { pct: sayPct(airReadout().share) }), seenSky),
  readout('skydue', msg('books-sky-due'), sayDue, seenSky),
  ...DIRT.map(d => readout(`sky${d.kind}`, d.name, () => sayPct(dirtShare(d.kind)),
                           () => seenSky() && dirtShare(d.kind) >= 0.01)),
  readout('skyrains', msg('books-sky-rains'), () => fmt(S.rains || 0), () => seenSky() && S.rains >= 1),
  readout('skymuck', msg('books-sky-muck'), () => fmt(muckLeft()), () => seenSky() && muckLeft() > 0)
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
const NOT_AT_IT = new Set(['crew-where-resting', 'crew-where-home', 'crew-now-to', 'crew-now-home', 'crew-now-idle',
                           'crew-where-lifted', 'crew-where-falling'].map(id => msg(id)));
const NOW_IS = [
  { key: 'working', name: msg('books-working'), is: w => !NOT_AT_IT.has(doing(w)) },
  { key: 'idle',    name: msg('books-idle'),    is: w => NOT_AT_IT.has(doing(w)) }
];
const nowIs = key => { const n = NOW_IS.find(x => x.key === key); return S.workers.filter(n.is).length; };
// The records every body keeps (crew/records.js), best of the crew standing.
const BEST = [
  { field: 'mined',    name: msg('books-best-mined') },
  { field: 'quarried', name: msg('books-best-quarried') },
  { field: 'farmed',   name: msg('books-best-farmed') },
  { field: 'stored',   name: msg('books-best-stored') },
  { field: 'tidied',   name: msg('books-best-tidied') }
];
const best = field => S.workers.reduce((b, w) => ((w[field] || 0) > (b ? b[field] || 0 : 0) ? w : b), null);
// `lived` is a body's own clock, kept by the crew. Minutes under an hour,
// hours after.
const eldest = () => S.workers.reduce((n, w) => Math.max(n, w.lived || 0), 0);
const sayTime = ms =>
  ms >= 3600000 ? msg('books-hours', { n: Math.round(ms / 360000) / 10 }) : msg('books-mins', { n: Math.round(ms / 60000) });
const hasCrew = () => S.workers.length > 0;
const CREW_ROWS = [
  ...JOBS_SHOWN.map(j => readout(`crew${j}`, jobSaid(j), () => String(headcount(j)),
                                 () => headcount(j) > 0)),
  ...NOW_IS.map(n => readout(`now${n.key}`, n.name, () => String(nowIs(n.key)), hasCrew)),
  ...BEST.map(r => readout(`best${r.field}`, r.name,
                           () => { const w = best(r.field); return w ? `${w.name} · ${fmt(w[r.field])}` : ''; },
                           () => !!best(r.field))),
  readout('tallyeldest', msg('books-eldest'), () => `${MARK.time} ${sayTime(eldest())}`,
          () => eldest() >= 60000)
];

// --- the tally ------------------------------------------------------------------
// Lifetime totals, read straight off `S`; nothing here is measured or eased.
// Named once you have met the thing.
const TALLY = [
  { key: 'rocks',  name: msg('books-tally-rocks'),
    count: () => S.boulderNo - 1, seen: () => S.boulderNo >= 2 },
  { key: 'banked', name: msg('books-tally-banked'), mark: 'dust',
    count: () => S.banked, seen: () => S.banked > 0 },
  { key: 'ore',    name: msg('books-tally-ore'), mark: 'shard',
    count: () => S.quarryTotal, seen: () => S.seenShard },
  // Income over the whole game, refunds kept out, as the rates count it.
  ...BOOKS.filter(b => b.key !== 'dust').map(b => ({
    key: `earned${b.key}`, name: msg('books-tally-earned', { coin: b.name }), mark: b.mark,
    count: () => S.earnedTotal[b.key] || 0, seen: () => b.seen() && (S.earnedTotal[b.key] || 0) > 0 })),
  { key: 'rift',   name: msg('books-tally-rift'), mark: 'dust',
    count: () => S.riftAte, seen: () => S.riftOpen },
  { key: 'brews',  name: msg('books-tally-brews'),
    count: () => S.brews, seen: () => S.brews >= 1 },
  { key: 'hats',   name: msg('books-tally-hats'),
    count: () => S.wizardHats, seen: () => S.wizardHats >= 1 },
  { key: 'crew',   name: msg('books-tally-crew'),
    count: () => S.crew, seen: () => S.crew >= 1 },
  { key: 'notes',  name: msg('books-tally-notes'),
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
  readout('tallyunder', () => storyLine('books-tally-under-who', 'books-tally-under', 'sqouse'), () => `${MARK.time} ${sayClock(S.buriedMs)}`,
          () => S.buried),
  readout('tallysaved', () => storyLine('books-tally-saved-who', 'books-tally-saved', 'sqouse'), () => `${MARK.time} ${sayClock(S.buriedMs)}`,
          () => S.rescued),
  // The record of the endless serpent (DESIGN.md, "Endless serpent"), shown
  // once it has risen past the story's.
  readout('tallyserpent', msg('books-tally-serpent'), () => `${S.serpentBest | 0}`,
          () => (S.serpentBest | 0) > 1)
];

// The books in the window (modal.js): every sheet, side by side. Each sheet
// is built on its own, so a column holds a whole sheet.
export const BOOK_ROWS = [OVER_ROW, ...INCOME_ROWS, ...SKY_ROWS, ...CREW_ROWS, ...TALLY_ROWS];
export const BOOK_SECTIONS = [
  { title: msg('books-sect-income'), keys: [OVER_ROW, ...INCOME_ROWS].map(u => u.key) },
  { title: msg('books-sect-sky'), keys: SKY_ROWS.map(u => u.key) },
  { title: msg('books-sect-crew'), keys: CREW_ROWS.map(u => u.key) },
  { title: msg('books-sect-tally'), keys: TALLY_ROWS.map(u => u.key) }
];

// The board at the noticeboard: what you glance at in passing, the rates. The
// way into the books window is off the board for now -- most of what the
// sheets say is not worth a player's glance -- so the window is reached only
// from the dev panel (`__window('books')`) until it is cut down.
export const OPEN_ROW = {
  key: 'openbooks',
  name: msg('books-open'),
  sign: true,
  price: () => '▸',
  dead: () => false,
  cost: () => 0,
  bill: () => [],
  buy: () => showWindow('books'),
  show: () => true
};
// How long this yard has been played, on its own line over every section: a
// section with no title draws no heading (style.css), so the line stands
// apart by the gap above the first heading rather than under a word of its own.
const PLAYTIME_ROW = readout('playtime', msg('books-playtime'), () => `${MARK.time} ${sayPlayed(S.playedS)}`, () => true);
export const STATS_UPGRADES = [PLAYTIME_ROW, ...INCOME_ROWS];
export const STATS_SECTIONS = [
  { title: '', keys: [PLAYTIME_ROW.key] },
  { title: msg('books-sect-income'), keys: INCOME_ROWS.map(u => u.key) }
];

// --- the eased per-minute rates ----------------------------------------------
// Smoothed, because a raw per-second count of something that arrives in lumps
// reads as noise.

const WATCH = ['banked', 'shards', 'spores'];
const EASE = 0.25;                         // how fast the reading follows reality

export const rates = { banked: 0, shards: 0, spores: 0 };
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

const snapshot = () => ({ banked: S.banked, shards: S.shards, spores: S.spores });

registerBoard('stats', { rows: () => STATS_UPGRADES, sections: () => STATS_SECTIONS, ledger: true });
