// The camp's cards: what each of act 3's stations sells, and the buying
// (DESIGN.md, "Acts 3 and 4", act 3; the owner's settled calls, 2026-10-18).
//
// No bands and no ladders up here (call 12, settled: act 3 is outside the
// eight-rungs rule). A card sells its jobs' seats and two or three short
// named upgrades, each a change on screen, paid in rebel, timber and the
// yard's coins (AFTER_UPGRADES): bought once, but for the grove's
// plots, a plot a press. A worker is bought on the pedestal's recruit row
// out of the souls won; a station's members are put on
// through the roster under it (after/roster.js), each job holding one to
// start, and a seat row a job buys it room for one more (AFTER_SEAT_BILLS,
// the owner, 2026-10-20). The construction shack sells
// every station, all of them on its board and priced from the start, each
// raised a piece at a time once bought (build.js).
//
// A bill names the act's coins (rebel, timber: `S.after`) and the
// yard's (dust, crops, ore, sparks: DESIGN.md, "The yard pays too"), so a
// row here is bought through the one `buy` (upgrades.js), each coin paid
// through `take` and its place's purse (words.js): the act's coins come off
// `S.after`, the yard's off the yard, its counter dropping as they leave. The
// yard's are lifted off the pile and fly up to the thin patch in the cloud
// floor (`flyFrom`), and come out of it as motes that arc to the station
// bought (`paid`; `S.after.coins`, drawn by render/aftercoins.js). The cards keep the
// yard's shape -- `rung`, `rungs`, `from`, `to`, `bill`, `show`, `dead` -- and the yard's
// board draws them as it draws any row: the pointer at a station opens its
// board as it does the yard's (each card is a row of the station table,
// after/stations.js; the yard's sheet, its posts' shelf then its upgrades'),
// the yard's purse and marks know the act's coins (words.js).

import { S } from '../state.js';
import { msg } from '../lang.js';
import { P, AFTER_UPGRADES, AFTER_JOBS, AFTER_JOB_POST, AFTER_SEAT_BILLS, AFTER_BUILDS,
         AFTER_CARDS, AFTER_YARD_COINS, AFTER_TAG_ORDER, AFTER_PATCH_AT,
         AFTER_COIN_MOTES, AFTER_COIN_UNDER_S, AFTER_COIN_STAGGER_S, AFTER_COIN_SPREAD, AFTER_COIN_LIFE_S,
         AFTER_SEED_BILLS, AFTER_SELFSEED_BILLS, /* MOCK grove */ AFTER_RECRUIT_COST0, AFTER_RECRUIT_RATE, MEET_MEMBERS, SLOW_SHARE, STRIKE_SHARE, AFTER_BOARD_SLOTS, SHADES, SHARD_CELL, SPORE_CELL, SPARK_CELL, FIND_TONES, SCALE_SHADE, SCALE_SPREAD } from '../config.js';
import { registerBoard, openBoardByKey } from '../boardrows.js';
import { purse, leftText } from '../words.js';
import { payTo } from '../pit.js';
import { upCount, built, raising, seatKey, seatsBought } from './levels.js';
import { crewAt, spareMembers } from './bodies.js';
import { clearPlot } from './grove.js';
import { raiseStation, placeOrder, orderedOf, onOrderLanded } from './build.js';
import { stationBox, plotX, groveX1, afterFloor, afterX0, floorAt, AP } from './place.js';
import { union, won, ready, hire, support } from './union.js';
import { setCrowdAt } from './stations.js';

// --- the purse ---------------------------------------------------------------------------
const isYardCoin = coin => AFTER_YARD_COINS.includes(coin);
// What the camp holds of a coin: the yard's purse knows the act's coins
// (words.js `purse`: rebel on the act, timber the chain's stock).
export const afterPurse = coin => purse(coin);
// The act's coin's name, a plain label until the owner words it.
export const rebelSaid = () => msg('after-coin-rebel');

// --- the yard's coins coming up ---------------------------------------------------------
// The thin patch in the cloud floor the yard's coins come up through, on the
// ground there (it may lie on a ramp between two shelves).
export const patchAt = () => { const x = afterX0() + AFTER_PATCH_AT * P; return { x, y: floorAt(x) }; };
// Where a bought row's coins land: over the station's roof, or over the
// middle of the grove's ground.
const landAt = key => {
  if (key === 'grove') return { x: (plotX(0) + groveX1()) / 2, y: afterFloor() - AP * 8 };
  const b = stationBox(key);
  return { x: b.x + b.w / 2, y: b.y - P * 2 };
};
// A mote's tone, the yard's grain it stands for: a grey of the dust's run, or
// a find's tone of its kind, stepped by the mote's place in its run so a
// handful is a speckle the way a heap is.
const FIND_BASE = { spore: SPORE_CELL, shard: SHARD_CELL, spark: SPARK_CELL };
// A scale is no grain of the yard's: its mote is in a scale's own shade, stepped
// either side of it as the deep deals them (deep/scales.js, `shadeNear`).
const toneOf = (coin, i) => (coin === 'dust' ? 1 + (i % SHADES.length)
  : coin === 'scale' ? SCALE_SHADE + (i % (2 * SCALE_SPREAD + 1)) - SCALE_SPREAD
  : FIND_BASE[coin] + (i % FIND_TONES));
// The motes that come out of the patch after the yard's grains, each stamped
// with when it comes out and where it lands. `buy` has already taken the
// coins (the grains rising to `flyFrom`); this is the show that follows.
// Motes that have landed are cleared here, the one place the list is written.
function paid(u, bill) {
  const a = S.after;
  const patch = patchAt(), to = landAt(u.lands || u.card);
  a.coins = (a.coins || []).filter(m => a.t - m.at < AFTER_COIN_LIFE_S);
  let k = 0;
  for (const [coin, n] of bill.filter(([c, n]) => isYardCoin(c) && n > 0)) {
    for (let i = 0; i < Math.min(n, AFTER_COIN_MOTES); i++, k++) {
      const off = ((k * 7) % (2 * AFTER_COIN_SPREAD + 1)) - AFTER_COIN_SPREAD;
      a.coins.push({ v: toneOf(coin, i), x0: patch.x + off * P, y0: patch.y, tx: to.x, ty: to.y,
                     at: a.t + AFTER_COIN_UNDER_S + k * AFTER_COIN_STAGGER_S });
    }
  }
}

// Whether a station's card is up: its station standing.
export const cardOpen = card => built(card);

// What every row up here carries for the yard's board: its bill written the
// act's coins first, its place (the yard's boards being shut is not about
// it), the patch the yard's grains rise to and the motes that follow.
const ACT_ROW = { coinOrder: AFTER_TAG_ORDER, place: 'after', flyFrom: () => patchAt(), paid };

// --- the named upgrades ----------------------------------------------------------------------
const UP_NAMES = {
  'after-podium': () => msg('after-row-podium'), 'after-axe': () => msg('after-row-axe'),
  'after-plot': () => msg('after-row-plot'), 'after-grow': () => msg('after-row-grow'),
  'after-tree': () => msg('after-row-tree'), 'after-stumps': () => msg('after-row-stumps'),
  'after-blade': () => msg('after-row-blade'),
  'after-bench': () => msg('after-row-bench'), 'after-signreach': () => msg('after-row-signreach')
};
// What a purchase does beyond counting itself: a plot cleared and a sapling
// set in it; the axe owed to its beat (rebel.js, `axeDue`).
const UP_DOES = {
  'after-plot': () => clearPlot(),
  'after-axe': () => { S.after.axeBought = true; }
};
// A row with `marks` (the podium ladder) opens each rung when the union's
// support reaches its mark, a share of the strike's: dead until then, saying
// the share it waits on.
const markOf = key => AFTER_UPGRADES[key].marks?.[upCount(key)];
const waitsOn = key => { const m = markOf(key); return m != null && support() < m * STRIKE_SHARE; };

// --- orders ----------------------------------------------------------------------------
// A bill paid in timber is an order, carried (DESIGN.md, "Act 3's goods are
// blocks, and bodies carry every one", settled 2026-10-27): bought, its
// blocks are spoken for on the mound and carried to the station it is for
// (build.js), and its effect lands when the last is set down there. Until
// then the row waits on its carrying, greyed with the board's own word for a
// thing going up, so no rung is bought twice. A bill with no timber lands at
// once, as before.
const timberOn = bill => bill.reduce((n, [c, k]) => n + (c === 'timber' ? k : 0), 0);
const LAND = {};   // each row's effect, by key: what a landed order runs
onOrderLanded(key => LAND[key]?.());
const carrying = key => orderedOf(key) > 0;
function orderOr(key, card, bill) {
  const n = timberOn(bill);
  if (n > 0) placeOrder(key, card, n); else LAND[key]();
}

const upRow = key => {
  const { card, bills } = AFTER_UPGRADES[key];
  const bill = () => bills[Math.min(upCount(key), bills.length - 1)].map(([c, n]) => [c, n]);
  LAND[key] = () => { S.after.ups[key] = upCount(key) + 1; S.after.upAt[key] = S.after.t; UP_DOES[key]?.(); };
  return {
    key, name: UP_NAMES[key](), card, ...ACT_ROW,
    rung: () => upCount(key), rungs: () => bills.length, bill,
    show: () => cardOpen(card),
    dead: () => waitsOn(key) || carrying(key),
    waits: () => (carrying(key) ? msg('card-building') : waitsOn(key) ? msg('after-wait-support', { share: Math.round(markOf(key) * 100) }) : null),
    buy: () => orderOr(key, card, bill())
  };
};

// --- the seats ---------------------------------------------------------------------------
// A row a job: a seat more at its station, a bill a seat (AFTER_SEAT_BILLS),
// the roster under the station drawing the seats and its + stopping at them.
export const JOB_NAMES = {
  woodcutter: () => msg('after-job-woodcutter'), sawyer: () => msg('after-job-sawyer'), joiner: () => msg('after-job-joiner')
};
const seatRow = job => {
  const key = seatKey(job), card = AFTER_JOB_POST[job];
  const bill = () => AFTER_SEAT_BILLS[Math.min(seatsBought(job), AFTER_SEAT_BILLS.length - 1)].map(([c, n]) => [c, n]);
  LAND[key] = () => { S.after.ups[key] = seatsBought(job) + 1; S.after.upAt[key] = S.after.t; };
  return {
    key, name: msg('after-row-seat', { job: JOB_NAMES[job]() }), card, seat: job, ...ACT_ROW,
    rung: () => seatsBought(job), rungs: () => AFTER_SEAT_BILLS.length, bill,
    show: () => cardOpen(card),
    dead: () => carrying(key),
    waits: () => (carrying(key) ? msg('card-building') : null),
    buy: () => orderOr(key, card, bill())
  };
};

// --- the shack: every station ------------------------------------------------------------
// On the board from the act's first frame, each with its price; one that
// needs another standing first is dead until then, saying which.
const BUILD_NAMES = {
  mill: () => msg('after-build-mill'), workshop: () => msg('after-build-workshop')
};
const WAITS = { workshop: () => msg('after-wait-mill') };
const needsMet = st => { const n = AFTER_BUILDS[st].needs; return !n.length || n.some(k => built(k)); };
const buildRow = st => ({
  key: `after-build-${st}`, name: BUILD_NAMES[st](), card: 'shack', lands: st, ...ACT_ROW,
  // A station standing stays on the shack's board, done, whatever the
  // finished-rows switch says: the board is the list of what the camp has.
  keep: true,
  rung: () => (built(st) || raising(st) ? 1 : 0), rungs: () => 1,
  bill: () => AFTER_BUILDS[st].bill.map(([c, n]) => [c, n]),
  show: () => !!S.after,
  dead: () => !needsMet(st),
  waits: () => (needsMet(st) ? null : WAITS[st]()),
  buy: () => { raiseStation(st); }
});

// --- the recruit ----------------------------------------------------------------------------
// A worker bought out of the souls won (union.js, `hire`), endless as the
// yard's house is and priced the same way; it walks out to the podium and
// waits there, agitating, for the roster's plus. Its line counts the won
// waiting and the idle, the two numbers a hire is a choice between.
const RECRUIT = 'after-recruit';
const recruits = () => (S.after && S.after.ups[RECRUIT]) || 0;
const recruitLine = () => msg('after-recruit-ready', { ready: ready(), idle: spareMembers() });
const recruitRow = {
  key: RECRUIT, name: msg('after-row-recruit'), card: 'pedestal', ...ACT_ROW, repeats: true, from: recruits,
  bill: () => [['rebel', Math.round(AFTER_RECRUIT_COST0 * Math.pow(AFTER_RECRUIT_RATE, recruits()))]],
  show: () => !!S.after,
  dead: () => ready() < 1,
  // Greyed for want of a soul, not of rebel: it says so, and how one is won.
  waits: () => (ready() < 1 ? msg('after-recruit-none') : null),
  get blurb() { return S.after ? recruitLine() : ''; },
  buy: () => { if (hire()) { S.after.ups[RECRUIT] = recruits() + 1; S.after.upAt[RECRUIT] = S.after.t; } }
};

// Nothing up here is for sale before the act has begun.
const inAct = u => ({ ...u, show: () => !!S.after && u.show() });
export const AFTER_ROWS = [
  ...AFTER_JOBS.map(seatRow),
  ...Object.keys(AFTER_UPGRADES).map(upRow),
  ...Object.keys(AFTER_BUILDS).map(buildRow)
].map(inAct);
// First on the pedestal's board; its line is a getter, so it is not spread.
AFTER_ROWS.unshift(recruitRow);
// MOCK grove: the seed row on the grove's board (the owner: "lets have the
// first seeds cost prev resources"): a bundle of acorns a press, carried in
// from the gates to the seed basket by a worker (after/grovemock.js); its
// bills in the earlier acts' coins, deepening band by band as every bill
// does (AFTER_SEED_BILLS). Shown only while the grove mock stands.
const SEED = 'after-seed'; // MOCK grove
const seedsBought = () => (S.after && S.after.ups[SEED]) || 0; // MOCK grove
AFTER_ROWS.push({ key: SEED, name: msg('after-row-seed'), get card() { return globalThis.__groveMock ? 'grove' : null; }, ...ACT_ROW, repeats: true, from: seedsBought, // MOCK grove  on the grove's board only while the mock stands
  bill: () => AFTER_SEED_BILLS[Math.min(seedsBought(), AFTER_SEED_BILLS.length - 1)].map(([c, n]) => [c, n]), // MOCK grove
  show: () => !!S.after && !!globalThis.__groveMock && cardOpen('grove'), // MOCK grove
  buy: () => { S.after.ups[SEED] = seedsBought() + 1; S.after.upAt[SEED] = S.after.t; globalThis.__groveSeedBought?.(); } }); // MOCK grove
// MOCK grove: trees grow their own seed, a ladder of four rungs, each the
// chance a felled tree's crown drops an acorn (AFTER_SELFSEED_CHANCE), bought
// as the grove's named upgrades are (`upRow`: a bill with timber an order
// carried, `orderOr`).
const SELF = 'after-selfseed'; // MOCK grove
export const selfRungs = () => Math.min(AFTER_SELFSEED_BILLS.length, (S.after && S.after.ups[SELF]) || 0); // MOCK grove  rungs bought
LAND[SELF] = () => { S.after.ups[SELF] = selfRungs() + 1; S.after.upAt[SELF] = S.after.t; }; // MOCK grove
AFTER_ROWS.push({ key: SELF, name: msg('after-row-selfseed'), get card() { return globalThis.__groveMock ? 'grove' : null; }, ...ACT_ROW, // MOCK grove
  rung: () => selfRungs(), rungs: () => AFTER_SELFSEED_BILLS.length, // MOCK grove
  bill: () => AFTER_SELFSEED_BILLS[Math.min(selfRungs(), AFTER_SELFSEED_BILLS.length - 1)].map(([c, n]) => [c, n]), // MOCK grove
  show: () => !!S.after && !!globalThis.__groveMock && cardOpen('grove'), // MOCK grove
  dead: () => carrying(SELF), waits: () => (carrying(SELF) ? msg('card-building') : null), // MOCK grove
  buy: () => orderOr(SELF, 'grove', AFTER_SELFSEED_BILLS[Math.min(selfRungs(), AFTER_SELFSEED_BILLS.length - 1)]) }); // MOCK grove
export const afterRow = key => AFTER_ROWS.find(u => u.key === key) || null;

// --- buying ------------------------------------------------------------------------------
export const afterMaxed = u => !!u.rung && u.rung() >= u.rungs();
export const afterBill = u => (u.bill ? u.bill() : []);

// --- the boards ----------------------------------------------------------------------------
// A card's rows, and its planks (tabs choice A, the owner, 2026-10-18): its
// jobs' seats' shelf, its heading counting the members at work there, then
// its upgrades'; the shack one shelf, every station in camp order. Registered
// under `after-<card>` (boardrows.js), the key of the card's station row.
const jobsAt = card => AFTER_JOBS.filter(j => AFTER_JOB_POST[j] === card);
const sectionsOf = card => {
  if (card === 'shack') return [{ key: 'after-build', title: msg('after-sect-build'), keys: Object.keys(AFTER_BUILDS).map(s => `after-build-${s}`) }];
  const rows = AFTER_ROWS.filter(u => u.card === card);
  return [{ key: `after-${card}-seats`, title: msg('after-sect-seats'), keys: rows.filter(u => u.seat).map(u => u.key),
            heads: () => jobsAt(card).reduce((n, j) => n + crewAt(j), 0) },
          { key: `after-${card}`, title: msg('after-sect-card'), keys: rows.filter(u => !u.seat).map(u => u.key) }]
    .filter(s => s.keys.length);
};
// A station not yet built has no board (after/stations.js): its build is
// sold by the sign in its lot and on the shack's board.
export const afterBoard = card => ({ rows: AFTER_ROWS.filter(u => u.card === card), sections: sectionsOf(card) });
// Each board's title, the ground it stands over and the click that opens it
// are its station row's (after/stations.js, in the one station table).
for (const card of AFTER_CARDS)
  registerBoard(`after-${card}`, { rows: () => afterBoard(card).rows, sections: () => afterBoard(card).sections,
                                   slots: AFTER_BOARD_SLOTS });

// --- the crowd's board -----------------------------------------------------------------------
// God's crowd sells nothing: its board is readings (a ledger, as the yard's
// books are), how the union stands against the throne -- the share of God's
// yard won, the members, each gate and how near, and when the throne next
// speaks. Read live off the sim every frame it is open.
const pctSaid = v => msg('after-crowd-pct', { n: Math.floor(v * 100) });
// A gate's reading: reached, or how far along toward it.
const gateSays = (k, have, want, say) => () =>
  (S.after && S.after.gate > k ? msg('after-crowd-reached') : msg('after-crowd-of', { have: say(have()), want: say(want) }));
const readout = (key, name, price) => ({ key, name, price, read: true, show: () => !!S.after,
                                         dead: () => false, cost: () => 0, buy: () => {} });
// Seconds to the throne's next speech, or null while none is set.
export const speechIn = () => { const sp = S.after?.speech; return sp ? Math.max(0, sp.next - S.after.t) : null; };
export const CROWD_ROWS = [
  readout('after-crowd-share', msg('after-crowd-share'), () => pctSaid(S.after ? support() : 0)),
  readout('after-crowd-members', msg('after-crowd-members'), () => String(S.after ? union() : 0)),
  readout('after-crowd-speech', msg('after-crowd-speech'), () => { const s = speechIn(); return s == null ? msg('after-crowd-none') : leftText(s * 1000); }),
  readout('after-crowd-meeting', msg('after-crowd-meeting'), gateSays(0, () => won(), MEET_MEMBERS, String)),
  readout('after-crowd-slowdown', msg('after-crowd-slowdown'), gateSays(1, () => support(), SLOW_SHARE, pctSaid)),
  readout('after-crowd-strike', msg('after-crowd-strike'), gateSays(2, () => support(), STRIKE_SHARE, pctSaid))
];
const CROWD_SECTIONS = [
  { key: 'after-crowd', title: msg('after-sect-crowd'), keys: ['after-crowd-share', 'after-crowd-members', 'after-crowd-speech'] },
  { key: 'after-gates', title: msg('after-sect-gates'), keys: ['after-crowd-meeting', 'after-crowd-slowdown', 'after-crowd-strike'] }
];
registerBoard('after-crowd', { rows: () => CROWD_ROWS, sections: () => CROWD_SECTIONS, ledger: true });

// Opens a board in the yard's sheet by its card (the pad's Y, the scenes):
// `key` a card of AFTER_CARDS or 'crowd', `at` the world point the crowd's
// board stands over (null: over God as drawn). True when it opened; false
// with no page to open it on (the node checks).
export function openAfterBoard(key, at = null) {
  if (!S.after || !(AFTER_CARDS.includes(key) || key === 'crowd')) return false;
  if (key === 'crowd') setCrowdAt(at);
  return openBoardByKey(`after-${key}`);
}
