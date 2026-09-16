// The casino: the one place in the yard that makes nothing.
//
// Everywhere else, a thing you buy does something for ever after. This takes
// what you have and hands some of it back, and the whole of it is a decision you
// keep making rather than a purchase you make once.
//
// **The building is the machine, and the stake is a share you hold.** Pull
// the arm and hold it: pebbles pour out of the purse into the funnel on the
// roof for as long as it is held, a slice of what you own a second, and the
// pile is the stake -- the sign counts it. Let go and it stays; hold again
// and more pours on top. Tap the sign and the floor splits: the whole pile
// drains into the throat -- into the machine, the way dust goes into the
// hole -- and out of the throat come a handful of pressed pebbles that go
// down ten rows of pegs into eleven bins, each flipping its own coin at
// every peg off the seeded rng, so the handful fans out into the bell the
// bins are priced on and the same handful never lands the same way twice.
// When the last pebble is still the bins that hold one pay -- the middle
// five in pebbles by their multiple, the outer six in crops, ore or sparks
// by worth -- and the pay falls out of each bin through the foot and out of
// the hatch on to the ground in its own kinds, for the crew to carry. No board, no
// chip, no number to set: a flick is a small bet and a long pull is the
// farm. See DESIGN.md, "The handful" and "The pour".
//
// A handful is `CASINO_HANDFUL` pebbles whatever the stake, each carrying its
// share of it. That count is what makes this a bet: every pebble is a fair
// draw from the bins, and a hand of N pays the mean of N draws, whose spread
// shrinks with the square root of N. Sixteen pay with a spread near half, put
// a pebble in a x39 one hand in thirty-odd, and lose the median hand.
//
// There was a wheel here, even money, and it is gone: the answer was picked
// first and the wheel aimed at it, so you watched a picture of a decision that
// had already been made. Here nothing is decided until a grain is on a peg.

import { CASINO_HANDFUL, CASINO_BINS, CASINO_PEG_ROWS, POUR_SHARE, POUR_MIN, PILE_LIMIT, shownFor,
         HOPPER_H, HOPPER_PROFILE, GATE_H, GATE_W, CASINO_SIGN_H, BOARD_AIR, PEG_ROW_H, BIN_W, EDGE_BIN_W, BIN_H, LABEL_H, FOOT_H,
         BOARD_COLS, CASINO_MARGIN, FIELD_H,
         CASINO_FALL_MS, CASINO_PEG_BEAT_MS, CASINO_GRAIN_GAP_MS,
         CASINO_BIN_KNOCK, CASINO_KNOCK, CASINO_WIN_KNOCK, CASINO_SETTLE_HOLD_MS, CASINO_PAY_BEAT_MS,
         CASINO_BURST_AT, CASINO_WIN_MS, CASINO_BURST, CASINO_BURST_GAP_MS, CASINO_BURST_UP, CASINO_BURST_SIDE,
         CASINO_SAY_MS, CASINO_ATTRACT_S, CASINO_FLASH_MS, CASINO_EVEN_BAND,
         CASINO_PILE_ONE, CASINO_PILE_BAND, CASINO_PILE_BRIM, TABLE_LIFE, TABLE_GRAV,
         P, SHADES, SHARD_CELL, SPORE_CELL, SPARK_CELL, ROCK_CELL, someFind, CASINO_BIG,
         SND_PEG_CENTS, SND_BIN_CENTS } from './config.js';
import { S, casino, table, floor } from './state.js';
import { noteHand } from './notices.js';
import { makePainter } from './painter.js';
import { addGrain, resizeGrid, settleSome, settle, at, put, bottomY, surfaceY, fillFlat } from './grid.js';
import { shakeView, blocked } from './world.js';
import { now, frames } from './clock.js';
import { LEVER_SWING_MS } from './config.js';
import { spend, bankDust } from './pit.js';
import { DUST_PER } from './upgrades/price.js';
import { rand } from './rng.js';
import { sfx } from './audio.js';
import { reducedMotion } from './prefs.js';

// --- reading the table ----------------------------------------------------------
// What the pot is, and nothing about it moves on its own: a pot is what the last
// hand left, until the next one.
export const pot = () => S.pot ? S.pot.n : 0;

// The stake is still on its way into the funnel. Not a wait dressed up as
// one: it is the pot arriving, and it ends on the frame the last grain of it
// comes to rest. Nothing here is on a clock: see `settledIn`.
export const pouring = () => !!S.pouring;

// A hand is on the board: the gate open, grains on the pegs, the bins filling
// or paying.
export const letting = () => !!S.drop;

// The arm is held down: the stake is pouring.
export const holding = () => !!S.holding;

// A hand is under way, any part of it: the stake coming down, the handful on
// the pegs, the bins paying. The sign is dead for the whole of it. The last
// pay still running out of the foot is not a hand: the next stake pours
// while it lands.
export const busy = () => pouring() || letting();

// --- the stake -----------------------------------------------------------------------
// Pebbles only: the purse the stake comes out of, and the pot it stands as in
// the hopper. (`where` is always the hopper now; it stays on the pot for the
// saves that wrote it.)
export const purseOf = () => S.stored;
export const inHopper = () => !!S.pot && S.pot.where === 'hopper';

// The hold. While the arm is held, pebbles pour out of the purse into the
// funnel at `POUR_SHARE` of the purse a second -- the purse as it stood when
// the arm was pressed, held flat for the whole hold, so a purse empties in
// 1/POUR_SHARE seconds rather than crawling as a share of what is left; a
// second hold reads the purse again -- never less than `POUR_MIN` a second
// and never past what the purse holds: the stake grows by whole
// pebbles as the fraction adds up, the funnel rains in toward its picture
// of the stake (`trickleIn`), and each grain of the rain carries its share,
// spent out of the purse as it lands (`spendStake`). So the purse is never
// poured below zero -- a pebble is only ever committed while there is one
// unspent to cover it -- and a save mid-pour keeps what was committed.
export const canHold = () => S.casinoOpen && !letting() && purseOf() - (S.pot ? S.pot.owed : 0) > 0;
export function holdArm(on) {
  if (on && !canHold()) return false;
  if (on === !!S.holding) return true;
  S.holding = !!on;
  S.pourAcc = 0;
  S.pourAt = on ? Math.max(POUR_SHARE * purseOf(), POUR_MIN) : 0;
  if (on) { stopAttract(); S.hand = null; }
  // let go, the arm springs back up over its swing
  else S.leverPulled = { key: 'casino-gate', at: now() - LEVER_SWING_MS };
  S.shopStale = true;
  return true;
}
export const pourRate = () => S.holding ? S.pourAt : Math.max(POUR_SHARE * purseOf(), POUR_MIN);
function stepHold(dt) {
  if (!S.holding) return;
  if (!canHold()) { holdArm(false); return; }
  S.pourAcc += pourRate() * (dt / 1000);
  const whole = Math.floor(S.pourAcc);
  if (!whole) return;
  S.pourAcc -= whole;
  if (!S.pot) S.pot = { cur: 'dust', stake: 0, n: 0, owed: 0, where: 'hopper' };
  const add = Math.min(whole, purseOf() - S.pot.owed);
  S.pot.stake += add;
  S.pot.owed += add;
  S.pouring = true;
  S.shopStale = true;
}

// A grain of the stake landing in the bowl: its share comes out of the
// purse there and then, and the pot grows by it.
function spendStake(n) {
  if (!S.pot || n <= 0) return;
  const take = Math.min(n, S.pot.owed, purseOf());
  spend(take);
  S.pot.owed -= take;
  S.pot.n += take;
  S.shopStale = true;
}
// What the next grain issued toward the bowl carries: an even share of what
// is still owed over the grains still to come, the remainder on the last.
const owedInAir = () => S.tableAir.reduce((n, k) => n + (k.lands === 'hopper' && k.worth ? k.worth : 0), 0);
function stakeShare(toGo) {
  if (!S.pot || !S.pot.owed) return 0;
  const left = Math.max(0, S.pot.owed - owedInAir());
  return toGo > 1 ? Math.min(left, Math.max(1, Math.round(left / toGo))) : left;
}

// The drop. The sign is the button, and only while a stake stands still in
// the funnel with the arm let go: a tap opens the floor.
export const canDrop = () => inHopper() && S.pot.stake > 0 && !busy() && !holding();
export function dropIt() {
  if (!canDrop()) return false;
  S.signPressed = now();
  openGate();
  return true;
}

// --- the handful ------------------------------------------------------------------
// How many pebbles come out of the throat for this pot: the handful, or the
// whole pot when the pot is smaller than a handful, because a pebble cannot
// carry less than one. The hopper's pile is the pot's band, and the whole of
// it drains into the machine; the pebbles are what the machine presses out
// of it.
export const handfulFor = n => Math.max(1, Math.min(CASINO_HANDFUL, Math.floor(n)));

// What one grain of the handful carries: its share of the stake. This is the
// one number in the building that is not one, and the hole is paid the exact
// sum however the rounding falls (see `settleHand`).
export const grainWorth = () => S.pot ? S.pot.stake / handfulFor(S.pot.stake) : 0;

// The bins pay from the middle outward, a bin a beat: the half bins first
// and the good bins last, so the box climbs as the hand settles. You already
// know what is in the edge bins; the machine makes you wait for them.
const PAY_ORDER = (() => {
  const mid = Math.floor(CASINO_BINS.length / 2);
  const out = [mid];
  for (let d = 1; mid - d >= 0 || mid + d < CASINO_BINS.length; d++) {
    if (mid - d >= 0) out.push(mid - d);
    if (mid + d < CASINO_BINS.length) out.push(mid + d);
  }
  return out;
})();

// Ten coins, one a peg row: true is a step to the right.
const drawPath = () => {
  const path = [];
  for (let r = 0; r < CASINO_PEG_ROWS; r++) path.push(rand() < 0.5);
  return path;
};

// Which bin a path ends in: the count of rights, since every left cancels one.
export const binOf = path => path.filter(Boolean).length;

// What a bin pays for the pebbles in it, by kind: a number is a multiple
// on pebbles, rounded to the nearest whole pebble; a coin's name converts
// the pebbles' worth to that coin at the yard's exchange, and never less
// than one coin for a bin with anything in it. Nothing pays a fraction of
// a grain.
export function binPay(b, pebbles, worth) {
  if (!pebbles) return { kind: 'dust', n: 0 };
  const pay = CASINO_BINS[b], share = pebbles * worth;
  if (typeof pay === 'number') return { kind: 'dust', n: Math.round(share * pay) };
  return { kind: pay, n: Math.max(1, Math.round(share / DUST_PER[pay])) };
}
// ...and what that is worth in pebbles, for the box and the fairness sum.
export const worthOf = ({ kind, n }) => kind === 'dust' ? n : n * DUST_PER[kind];

// A whole hand dealt at once, off the rng, without the sim: the bins each
// pebble lands in and what they pay on a stake, by worth. This is the
// arithmetic the cascade walks; `test/handful.test.mjs` deals thousands of
// these to hold the spread the design hangs on.
export function dealHand(stakeN) {
  const grains = handfulFor(stakeN);
  const worth = stakeN / grains;
  const bins = CASINO_BINS.map(() => 0);
  for (let i = 0; i < grains; i++) bins[binOf(drawPath())]++;
  const pays = bins.map((n, b) => binPay(b, n, worth));
  const paid = pays.reduce((sum, p) => sum + worthOf(p), 0);
  return { grains, bins, pays, paid, mult: paid / stakeN };
}

// The face, in cells: where a grain starts and where the pegs stand. Field
// column 0 is the left edge of the first bin; a grain enters over the middle
// bin and every row moves it half a bin across, so ten rows reach the outer
// bins exactly and a grain's column is always over the slot of the bin its
// coins add up to. A peg stands under every seat a grain can reach and nowhere
// it cannot, so the pegs draw the odds.
// A bin's place on the field: the two edge bins are wider than the rest, so a
// bin is looked up rather than multiplied. A grain enters over the middle of
// the middle bin's slot.
const EDGE = b => b === 0 || b === CASINO_BINS.length - 1;
export const binW = b => EDGE(b) ? EDGE_BIN_W : BIN_W;
export const binLeft = b => (b ? EDGE_BIN_W + (b - 1) * BIN_W : 0);
export const slotW = b => binW(b) - 1;                           // the wall is the last cell
export const STEP = BIN_W / 2;                                   // cells across, a row
export const START_COL = binLeft(Math.floor(CASINO_BINS.length / 2)) + (slotW(1) - 1) / 2;
export const seatRow = k => BOARD_AIR + k * PEG_ROW_H - 1;      // where a grain sits on peg row k
export const pegRow = k => BOARD_AIR + k * PEG_ROW_H;           // and where the peg itself is
export const hasPeg = (k, c) => {
  const d = c - START_COL;
  return d % STEP === 0 && Math.abs(d) <= k * STEP && ((d / STEP + k) & 1) === 0;
};
// Where the field stands in the world.
export const fieldAt = () => ({
  x: casino.x + CASINO_MARGIN * P,
  y: casino.y + (HOPPER_H + GATE_H + CASINO_SIGN_H) * P
});
// Which bin a field column is over, and the slot column within it: a bin is
// its slot and the wall on its right.
const binAt = c => {
  for (let b = CASINO_BINS.length - 1; b > 0; b--) if (c >= binLeft(b)) return b;
  return 0;
};
const slotCol = c => Math.min(slotW(binAt(c)) - 1, c - binLeft(binAt(c)));

// A bin is a plot of sand of its own -- its slot's columns and six rows -- so
// what lands in it heaps by the yard's rules: a x39 bin with two grains shows
// two grains and a middle bin shows a heap. Eleven of them, remade for each
// hand.
// A bin holds pebbles, and a pebble is two cells square (`PEBBLE`), so a bin
// is a plot of pebble-sized cells: two across a five-cell slot, and five deep
// -- more than the slot is drawn, so a hand that puts most of its pebbles in
// one bin stands proud of the rim rather than waiting over it for ever.
export const PEBBLE = 2;
const binCols = b => Math.max(1, Math.floor(slotW(b) / PEBBLE));
const makeBin = b => ({
  x: 0, y: 0, cols: binCols(b), rows: CASINO_HANDFUL, p: P * PEBBLE, grid: new Uint8Array(binCols(b) * CASINO_HANDFUL),
  n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null, repose: true
});
const makeBins = () => CASINO_BINS.map((_, b) => makeBin(b));

// A grain about to go down the pegs: its column and row on the face, in cells
// (negative rows are the gate and the sign band above the field), its ten
// coins, and its shade. It starts in the gate.
const makeGrain = (s, demo = false) => ({
  c: START_COL, r: -(GATE_H + CASINO_SIGN_H), trail: [],
  k: 0, seat: false, beat: 0, acc: 0, path: drawPath(), s, demo, landed: false
});

// Let it go. The floor splits from the middle and a handful of the heap comes
// out grain by grain, each drawing its path as it leaves. What is left of the
// heap once the handful has gone lifts off and fades, because it was the
// picture of the pot and the pot is on the board now.
function openGate() {
  S.drop = {
    hopperAt: hopperN(),                          // what stood in the bowl, for the sign running down
    at: now(), lastSent: -Infinity, sent: 0, handful: handfulFor(S.pot.stake), drained: 0, shade: 0,
    // the stake the hand went down for, and what one pebble of it carries:
    // the pot shrinks bin by bin as each pays out, so a save mid-pay comes
    // back with only the unpaid bins' pebbles in the funnel
    stake: S.pot.stake, worth: grainWorth(),
    grains: [], bins: makeBins(),
    // what the bins have paid so far, by kind, and its worth in pebbles
    stage: 'drop', holdAt: 0, payAt: 0, payIdx: 0, paid: 0, pays: { dust: 0, spore: 0, shard: 0, spark: 0 }, edge: false, payFrom: null
  };
  S.hand = null;
  S.shopStale = true;
}

// One grain out of the gate. The heap is taken from the bottom over the
// opening -- the two columns the floor is open at, then the nearest column with
// a grain on the floor -- so what you see is the heap draining into the gap
// rather than being skimmed off the top. The rest of the column comes down a
// row by the sand's own rules.
// The columns the floor is open at: the one the handful enters the field at
// -- the hopper's middle, a wall in from the field's -- and its neighbors.
const gateCols = () => {
  const mid = START_COL + CASINO_MARGIN - 1;
  const out = [];
  for (let c = mid - Math.floor((GATE_W - 1) / 2); c <= mid + Math.ceil((GATE_W - 1) / 2); c++) out.push(c);
  return out;
};
function takeFromHopper() {
  const gate = gateCols();
  for (let d = 0; d < table.cols; d++) {
    const cols = d ? [gate[0] - d, gate[gate.length - 1] + d] : gate;
    for (const c of cols) {
      if (c < 0 || c >= table.cols || wallAt(c, 0)) continue;
      const v = at(table, c, 0);
      if (v) { put(table, c, 0, 0); return v; }
    }
  }
  // nothing on the floor anywhere: the topmost grain there is
  const c = topmostColumn(table);
  if (c < 0) return 0;
  const r = topGrain(table, c);
  const v = at(table, c, r);
  put(table, c, r, 0);
  return v;
}

// The gate is open: every frame the grains on the floor over the throat drop
// through it, into the machine -- gone from view because they are inside,
// never because they faded -- and the heap above sags into the gap at the
// sand's own pace. The whole pile goes in, however big the stake. The pebbles
// are pressed out of the throat separately: the first once the first sand has
// gone through, and one every `CASINO_GRAIN_GAP_MS` after, sixteen whatever
// the pile was, so a big stake is a longer drain and the same cascade.
function drainGate(d) {
  for (const c of gateCols()) {
    if (wallAt(c, 0)) continue;
    const v = at(table, c, 0);
    if (!v) continue;
    put(table, c, 0, 0);
    d.drained++;
    if (!d.shade) d.shade = v;
  }
  // and the funnel tips toward the throat: a grain lying on a step slides in
  // along it when the cell beside it is free, the way the sand board's floor
  // tipped toward its gate, because the sand's own rules only take a grain
  // down a drop and a step's outer cells have none -- and the whole pile has
  // to go in.
  const mid = Math.floor(table.cols / 2);
  for (let r = 0; r < table.rows; r++) {
    for (let c = mid - 1; c > 0; c--) {
      const v = at(table, c - 1, r);
      if (v && !wallAt(c - 1, r) && !at(table, c, r) && !wallAt(c, r)) { put(table, c - 1, r, 0); put(table, c, r, v); }
    }
    for (let c = mid; c < table.cols - 1; c++) {
      const v = at(table, c + 1, r);
      if (v && !wallAt(c + 1, r) && !at(table, c, r) && !wallAt(c, r)) { put(table, c + 1, r, 0); put(table, c, r, v); }
    }
  }
}

function sendGrains(dt) {
  const d = S.drop;
  if (d.sent >= d.handful || !d.drained) return;
  const t = now();
  if (t - d.lastSent < CASINO_GRAIN_GAP_MS) return;
  d.grains.push(makeGrain(d.shade || 1));
  d.sent++;
  d.lastSent = t;
}

// --- a grain on the pegs ------------------------------------------------------------
// One cell of fall: down the gate and the sign band, on to the first peg, a
// beat, then off it -- one cell down and one across in the same step, so it
// reads as a bounce -- and on to the next, ten times, and then down into its
// bin. The beat and the fall are both written in time, so a slow frame does not
// slow the machine.
const worldOf = g => { const f = fieldAt(); return { x: f.x + g.c * P, y: f.y + g.r * P }; };

function stepGrain(g, dt, bins, onPeg, onLand) {
  if (g.landed) return;
  if (g.seat) {
    g.beat -= dt;
    if (g.beat > 0) return;
    g.seat = false;
    g.acc = 0;
  }
  g.acc += dt;
  while (g.acc >= CASINO_FALL_MS && !g.landed && !g.seat) {
    g.acc -= CASINO_FALL_MS;
    g.trail = [[g.c, g.r], g.trail[0]].filter(Boolean);   // the last two cells it left, for the trail
    if (g.k < CASINO_PEG_ROWS) {
      const seat = seatRow(g.k);
      if (g.r < seat) {
        g.r++;
        if (g.r === seat) { g.seat = true; g.beat = CASINO_PEG_BEAT_MS; onPeg(g); }
        continue;
      }
      // off the peg: the coin says which way
      const right = g.path[g.k];
      // The near miss is drawn: a grain at the outermost peg of the last row
      // falling inward was one coin from the x39.
      if (g.k === CASINO_PEG_ROWS - 1) {
        const outer = Math.abs(g.c - START_COL) === (CASINO_PEG_ROWS - 1) * STEP;
        if (outer && (right === (g.c < START_COL))) flashEdge(g.c < START_COL ? 0 : CASINO_BINS.length - 1, false);
      }
      g.c += right ? STEP : -STEP;
      g.r++;
      g.k++;
      continue;
    }
    // below the pegs: down to the bin's rim, and in at the top of its slot,
    // where the bin's own sand rules take it the rest of the way. A slot full
    // to the rim keeps the grain waiting over it, which nothing ever fills.
    if (g.r < FIELD_H) { g.r++; continue; }
    const b = binAt(g.c), bin = bins[b], col = Math.min(bin.cols - 1, Math.floor(slotCol(g.c) / PEBBLE));
    if (at(bin, col, bin.rows - 1)) break;
    put(bin, col, bin.rows - 1, g.s);
    g.landed = true;
    onLand(g, b);
  }
}

// The peg lit on the beat, the grain on it black: one flash, then gone.
function flashPeg(g) {
  const fx = S.tableFx;
  fx.pegs = fx.pegs.filter(p => now() - p.at < CASINO_PEG_BEAT_MS);
  fx.pegs.push({ c: g.c, r: g.r + 1, at: now() });
}
// And a x39 bin's dividers: white for a beat. `loud` is a grain in it; a near
// miss is the same flash without the sound.
function flashEdge(side, loud) {
  S.tableFx.edge = { side, at: now(), loud };
}

// Every peg is a hit: the peg flashes, and a short hard tick sounds, its pitch
// stepping up a row at a time so the stream falling through ten rows rises
// toward the bins the way a plinko's clatter climbs.
function pegHit(g) {
  flashPeg(g);
  sfx('peg-hit', { x: worldOf(g).x, cents: g.k * SND_PEG_CENTS });
}

// The bins take the grain with a thud, pitched by bin -- low in the middle,
// higher toward the edges -- and a x39 is its own event: the dividers flash,
// the knock is the big one, and the sign goes to a strobe on the spot, four
// seconds before the sum comes in.
function binHit(g, b) {
  const d = S.drop;
  const mid = Math.floor(CASINO_BINS.length / 2);
  const edge = b === 0 || b === CASINO_BINS.length - 1;
  const x = worldOf(g).x;
  if (edge) {
    d.edge = true;
    flashEdge(b, true);
    S.tableFx.strobeAt = now();
    shakeView(CASINO_WIN_KNOCK);
    sfx('edge-hit', { x, big: true });
  } else {
    shakeView(CASINO_BIN_KNOCK);
    sfx('bin-thud', { x, cents: Math.abs(b - mid) * SND_BIN_CENTS });
  }
}

// --- the bins paying -----------------------------------------------------------------
// When the last grain is still there is a held beat with the board full and
// quiet, and then the bins that hold a pebble pay from the middle outward, a
// bin a beat -- an empty bin never inverts its foot, sounds or pays. What a
// bin pays falls out of it: down through the foot to the floor of the
// building and out of the hatch in a lob on to the strip, where it heaps as
// the pile the haulers carry. Nothing waits in a tray. A pebble bin's pebbles
// go down each carrying its share of the pay; a converting bin's pay goes
// down in its own coin, one grain a coin. A full strip holds the bin: its
// foot stays lit and its pebbles stay in it until the haulers make room.
function payBin(b) {
  const d = S.drop;
  const bin = d.bins[b];
  const f = fieldAt();
  const pay = binPay(b, bin.n, d.worth);
  d.pays[pay.kind] += pay.n;
  d.paid += worthOf(pay);
  d.payFrom = b;
  // the pot is paid out bin by bin: what these pebbles were worth leaves the
  // funnel's ledger, so a save mid-pay puts back only what has not paid
  const spent = Math.min(S.pot.stake, Math.round(bin.n * d.worth));
  S.pot.stake -= spent;
  S.pot.n = Math.min(S.pot.n, S.pot.stake);
  // the pebbles in the bin, bottom row first, each the one that falls
  const cellsOut = [];
  for (let r = 0; r < bin.rows; r++)
    for (let c = 0; c < bin.cols; c++) {
      const v = at(bin, c, r);
      if (!v) continue;
      put(bin, c, r, 0);
      cellsOut.push({ x: f.x + (binLeft(b) + c * PEBBLE) * P, y: f.y + (FIELD_H + BIN_H - (r + 1) * PEBBLE) * P, s: v });
    }
  let grains;
  if (pay.kind === 'dust') {
    // the pebbles, each carrying an even share of the pay, the remainder on
    // the last, so the ground is paid the exact pot
    grains = cellsOut.map((g, i) => {
      const left = pay.n - Math.floor(pay.n / cellsOut.length) * i;
      const worth = i === cellsOut.length - 1 ? left : Math.floor(pay.n / cellsOut.length);
      return { ...g, worth, big: true };
    });
  } else {
    // the coin itself, one grain a coin, out of the pebbles' own cells
    grains = [];
    for (let i = 0; i < pay.n; i++) {
      const g = cellsOut[i % cellsOut.length];
      grains.push({ x: g.x + (i >= cellsOut.length ? (rand() - 0.5) * P * PEBBLE : 0), y: g.y, s: someFind(COIN_CELL[pay.kind]), worth: 1, big: true });
    }
  }
  const strip = casinoStrip();
  for (const g of grains) {
    if (S.tableAir.length >= IN_AIR) { for (let w = g.worth; w > 0; w--) bankDust(strip ? strip.from : g.x, g.s); continue; }
    S.tableAir.push({
      x: g.x, y: g.y, s: g.s, worth: g.worth, big: g.big, t: 0, vx: 0, vy: 0.4 + rand() * 0.4, lands: 'strip',
      // down through the foot to the building's floor, then out of the hatch
      floorY: S.groundY - P,
      then: { x1: strip.from + (strip.to - strip.from) * (0.25 + rand() * 0.5), y1: S.groundY - P,
              high: P * 4 + rand() * P * 4, ms: CHUTE_MS }
    });
  }
}

// The hand is paid: the last bin's pay is on its way out of the foot. The
// box says the multiple, and it is felt: a hand that pays more than it
// took is the burst, one that pays less is the dud, and dead even is quiet.
function settleHand() {
  const d = S.drop;
  const stake = d.stake;
  const paid = Math.round(d.paid);
  const mult = paid / stake;
  // A hand within the even band is even: quiet, and the box says so. Past it a
  // win is a win and a dud a dud, so the box and the fanfare never disagree.
  const won = Math.abs(mult - 1) < CASINO_EVEN_BAND ? null : paid > stake;
  S.pot = null;
  S.pouring = false;
  S.drop = null;
  S.hand = { won, mult, n: paid, stake, cur: 'dust', pays: { ...d.pays }, at: now(), bursts: 0,
             fountains: won ? CASINO_BURST_AT.filter(k => mult > k).length : 0, edge: d.edge };
  if (d.edge && won) { S.hand.fountains = CASINO_BURST_AT.length; S.tableFx.strobeAt = now() + CASINO_WIN_MS; }
  // the notices read the difference: fifty thousand up or fifty thousand down
  noteHand(paid >= stake, Math.abs(paid - stake), CASINO_BIG);
  shakeView(CASINO_KNOCK);
  const x = casino.x + casino.w / 2;
  if (won) sfx('jackpot', { x, big: true });
  else if (won === false) sfx('dud', { x });
  S.shopStale = true;
}

// One frame of the hand on the board.
function stepDrop(dt) {
  const d = S.drop;
  const t = now();
  if (d.stage === 'drop') {
    drainGate(d);                                          // the throat is open from the frame of the tap
    sendGrains(dt);
    for (const g of d.grains) stepGrain(g, dt, d.bins, pegHit, binHit);
    // and the bins heap what has landed in them, a row a frame
    for (const bin of d.bins) settle(bin);
    // the hand settles on four facts: the hopper drained, nothing left to
    // send, nothing on the pegs, and no column of a bin still moving
    if (hopperN() === 0 && d.sent >= d.handful && d.grains.every(g => g.landed) && d.bins.every(bin => !bin.awakeN)) {
      d.stage = 'hold'; d.holdAt = t; d.grains = [];
    }
    return;
  }
  if (d.stage === 'hold') {
    if (t - d.holdAt >= CASINO_SETTLE_HOLD_MS) { d.stage = 'pay'; d.payAt = t - CASINO_PAY_BEAT_MS; }
    return;
  }
  // paying, a bin a beat -- the bins with a pebble in them, the rest never
  // come up -- and the hand settles when the last has paid. A full strip
  // holds the bin due, its foot lit, until the haulers make room.
  while (d.payIdx < PAY_ORDER.length && !d.bins[PAY_ORDER[d.payIdx]].n) d.payIdx++;
  d.held = d.payIdx < PAY_ORDER.length && t - d.payAt >= CASINO_PAY_BEAT_MS && !chuteOpen();
  if (d.payIdx < PAY_ORDER.length && t - d.payAt >= CASINO_PAY_BEAT_MS && chuteOpen()) {
    payBin(PAY_ORDER[d.payIdx++]);
    d.payAt = t;
  }
  // and a beat after the last bin comes up, so its foot has its beat too
  if (d.payIdx >= PAY_ORDER.length && t - d.payAt >= CASINO_PAY_BEAT_MS) settleHand();
}

// --- the machine selling itself ------------------------------------------------------
// A casino nobody is at is not dark. Every so often one grain drops from the
// hopper, ticks its way down to a bin, then lifts and fades -- a demonstration
// with nothing riding on it, and from the far end of the yard the only moving
// thing out past the lab. It stops the moment a chip is down.
function stepAttract(dt) {
  if (!S.casinoOpen || S.pot || S.drop || S.paying || S.holding) return;
  const t = now();
  if (!S.attract) S.attract = { grain: null, next: t + CASINO_ATTRACT_S * 1000 };
  const a = S.attract;
  if (!a.grain) {
    if (t < a.next) return;
    a.grain = makeGrain(1 + Math.floor(rand() * SHADES.length), true);
    return;
  }
  stepGrain(a.grain, dt, DEMO_BINS, pegHit, g => {
    const { x, y } = worldOf(g);
    S.tableAir.push({ x, y, vx: (rand() - 0.5) * 0.35, vy: -(0.3 + rand() * 0.5), up: true, fade: true, t: 0, s: g.s });
    for (const bin of DEMO_BINS) if (bin.n) fillFlat(bin, 0);
    a.grain = null;
    a.next = now() + CASINO_ATTRACT_S * 1000;
  });
}
// The demonstration grain lands in bins of its own, emptied as it leaves.
const DEMO_BINS = makeBins();
export function stopAttract() {
  const g = S.attract?.grain;
  if (g) {
    const { x, y } = worldOf(g);
    S.tableAir.push({ x, y, vx: 0, vy: -(0.3 + rand() * 0.5), up: true, fade: true, t: 0, s: g.s });
  }
  S.attract = null;
}

// --- pouring out --------------------------------------------------------------------
// The pay lands on the ground at the building's left, in its own kinds, where
// it heaps as a real pile the haulers carry in like any heap: a grain off a
// bin lands as the pebbles it is worth, and a coin as a grain of that coin.
// The counter moves as the haulers' loads land in the hole. A win is
// collected, not credited. The strip has a limit, and a bin holds while it
// is full: a pot has to have somewhere to land, with the waiting visible.
const casinoStrip = () => S.piles.find(p => p.key === 'casino');
const toStrip = () => S.tableAir.reduce((n, k) => n + (k.lands === 'strip' ? (k.worth || 1) : 0), 0);
export const chuteOpen = () =>
  !!casinoStrip() && (S.pileCount?.casino || 0) + toStrip() < PILE_LIMIT.casino;
export const payLeft = () => S.paying ? Object.values(S.paying.left).reduce((n, v) => n + v, 0) : 0;
// The hatch in the foot's left wall is open while anything is on its way out
// of it.
export const hatchOpen = () => !!S.paying || S.tableAir.some(k => k.lands === 'strip');

// However much there is, it is away in about a second and a half: the rate
// every trickle here runs at.
const TRICKLE_MS = 1500;
const IN_AIR = 24000;
const CHUTE_MS = 700;
const COIN_CELL = { spore: SPORE_CELL, shard: SHARD_CELL, spark: SPARK_CELL };

// What a save caught in the air: the pay that had left the bins and not
// landed comes back owed (`S.paying`, written as what was flying) and runs
// out of the hatch on to the strip from where it was going -- the bins it
// left are empty and the sand in them was never saved. The grain count is
// only how many throws the pebbles are split across.
function payOutStep(dt) {
  const p = S.paying;
  const strip = casinoStrip();
  const coins = p.left.spore + p.left.shard + p.left.spark;
  const grains = coins + (p.left.dust > 0 ? Math.max(1, Math.min(p.grains, p.left.dust)) : 0);
  let n = Math.min(grains, Math.max(1, Math.ceil(grains * (dt / TRICKLE_MS))));
  while (n-- > 0 && payLeft() > 0 && chuteOpen()) {
    const kind = ['spark', 'shard', 'spore'].find(k => p.left[k] > 0);
    const x = casino.x, y = S.groundY - P;
    let v = kind ? someFind(COIN_CELL[kind]) : 1 + Math.floor(rand() * SHADES.length), worth = 1;
    if (kind) p.left[kind]--;
    else {
      const left = p.left.dust, throws = Math.max(1, Math.min(p.grains, left));
      worth = throws > 1 ? Math.max(1, Math.min(left - (throws - 1), Math.round(left / throws))) : left;
      p.left.dust -= worth;
      p.grains = Math.max(1, p.grains - 1);
    }
    S.tableAir.push({
      x, y, s: v, t: 0, worth, big: true, lands: 'strip',
      // into the middle half of the strip, so a grain that walks to the nearest
      // column with room stays on the ground the survey counts as the casino's
      arc: { x0: x, y0: y, x1: strip.from + (strip.to - strip.from) * (0.25 + rand() * 0.5),
             y1: S.groundY - P, k: 0, high: P * 4 + rand() * P * 4, ms: CHUTE_MS }
    });
  }
  if (payLeft() <= 0) S.paying = null;
}

// --- the two plots ---------------------------------------------------------------------
// Both are walled: a heap stands up to the rim and then walks sideways, so an
// all-in is a full hopper rather than a spire. Where the stake rains to: the
// middle of the hopper, from a little way up.
export const potAt = () => ({
  x: Math.round((table.x + table.cols * P / 2) / P) * P,
  y: Math.round(table.y / P) * P
});

// The funnel's walls: how far in from each side the wall stands at a row,
// counting the grid's rows up from the floor, so the profile's first entry
// is the rim. A wall is a fixed cell in the plot -- never a grain, never
// moving, and the ground the sand heaps against.
export const wallAt = (c, r) => {
  const inset = HOPPER_PROFILE[HOPPER_H - 1 - r] || 0;
  return c < inset || c >= table.cols - inset;
};
const WALL_CELLS = HOPPER_PROFILE.reduce((n, inset) => n + inset * 2, 0);
// The grains in the hopper: the plot's count less the walls, which it counts.
export const hopperN = () => Math.max(0, table.n - WALL_CELLS);
function layWalls() {
  fillFlat(table, 0);
  for (let r = 0; r < table.rows; r++)
    for (let c = 0; c < table.cols; c++) if (wallAt(c, r)) put(table, c, r, ROCK_CELL);
}

export function wireTable() {
  if (!table.painter) table.painter = makePainter(table);
  table.onPut = table.painter.mark;
  table.blocked = null;
  table.ceiling = () => HOPPER_H;
  // Flat, not heaped: a grain on a step of the funnel's wall only slides
  // where there is a real drop beside it, and on a three-cell step there is
  // none, so a heaped bowl coated its slopes instead of filling. Sand in a
  // hopper lies level, and level fills from the throat up.
  table.repose = false;
  table.fixed = wallAt;
  resizeGrid(table);
  layWalls();
}
// The sand itself is never saved: a reset or a reload starts the building
// empty, and a pot comes back pouring into whichever plot it stood in.
export function clearCasino() {
  if (table.grid) layWalls();
  table.capped = null;
  S.tableFx = { pegs: [], edge: null, strobeAt: 0 };
}

// --- the bands ----------------------------------------------------------------
// How much sand a pot puts in its plot. Up to `CASINO_PILE_ONE` it is the pot
// itself, one grain a unit: ten is ten grains and a hand that pays double is
// visibly twice the sand. Past that the heap is a *reading* of the pot rather
// than a count of it -- a tenfold pot for `CASINO_PILE_BAND` more grains, on
// the log of the pot so nothing jumps, and never more than the brim. See
// config/casino.js for the ladder itself.
export { shownFor };

// How much sand should be standing in the hopper: the handful. The hopper's
// picture of the pot IS the grains that will fall -- a chip of ten is ten
// grains, everything else is `CASINO_HANDFUL`, each worth its share -- so when
// the gate opens every grain in the bowl goes down the board and nothing is
// left to lift off. A heap of the pot's band stood there once, and the rest
// of it fading when the handful left read as staked sand vanishing. While a
// hand is being sent it is the handful less what the gate has let out. Never more than the plot will actually hold:
// the brim is inside what it takes, so that clause is a backstop, but the hand
// waits on the heap reaching this number, and a plot that refused a grain with
// no way to say so would be a hand that never came.
export const tableWant = () => {
  if (!inHopper() || S.drop) return 0;
  return Math.min(shownFor(S.pot.stake), table.capped ?? Infinity);
};

// --- the trickle --------------------------------------------------------------
// Sand does not arrive all at once. It comes down and piles up, and the pile
// growing is the thing worth watching -- so a plot is walked toward what the
// pot says rather than set to it. The rate is worked out from how far there is
// to go, so ten grains trickle and three hundred pour, and either is issued
// over about a second and a half.
//
// Grains already on their way count as arrived for the purpose of deciding how
// many more to send; without that the trickle keeps issuing sand for sand that
// is already in the air, and the heap ends up a handful over the pot.
const airborneTo = plot => S.tableAir.reduce((n, k) => n + (k.lands === plot ? 1 : 0), 0);

// **The dust is settled in its pile**, which is what the hand waits on and is
// three facts about the ground rather than a length of time: nothing left to
// send, nothing in the air, and no column of the heap still moving -- the grid
// puts a column to sleep the moment a pass over it moves nothing, so a heap
// that has found its angle has no awake columns at all (see grid.js). A pot of
// ten settles in a blink and a pot of a thousand takes as long as it takes.
const grainsIn = plot => plot === table ? hopperN() : plot.n;
const settledIn = (plot, want, name) =>
  airborneTo(name) === 0 && grainsIn(plot) >= want && !plot.awakeN;
export const settledInPile = () =>
  inHopper() ? settledIn(table, tableWant(), 'hopper') : true;


function trickleIn(dt, plot, name, want, from) {
  const have = grainsIn(plot) + airborneTo(name);
  let n = Math.min(want - have, Math.max(1, Math.ceil((want - have) * (dt / TRICKLE_MS))));
  const find = 0;
  let toGo = want - have;
  while (n-- > 0) {
    const shade = find ? someFind(find) : 1 + Math.floor(rand() * SHADES.length);
    const { x, y } = from();
    // a grain of the stake carries its share of what the purse still owes
    const worth = name === 'hopper' ? stakeShare(toGo--) : 0;
    if (S.tableAir.length < IN_AIR) {
      S.tableAir.push({ x, y, vx: (rand() - 0.5) * 0.3, vy: 0.9 + rand() * 0.8, t: 0, s: shade, lands: name, worth });
    } else if (addGrain(plot, x, null, shade)) {
      if (worth) spendStake(worth);
    } else {
      plot.capped = grainsIn(plot);
      break;
    }
  }
}

// Out of the sky a little way up rather than from the top of the world: high
// enough to read as coming down and near enough that the heap grows while you
// are watching it.
// Poured into the middle of the funnel, over the spout, rather than across
// the whole rim: a grain that lands in the middle of a wide upper step has no
// drop beside it and stays there, and a handful rained across the rim stood
// as a scatter on the slopes instead of a heap in the throat.
const skyOver = () => ({ x: potAt().x + (rand() - 0.5) * P * GATE_W * 4, y: table.y - P * 24 - rand() * P * 10 });

// And going the other way: grains lifted off the top of the heap, one at a
// time, each fading out on its way up. A pot that vanished in a frame was a
// number being set to zero; this is it *leaving*.
function drainOut(dt, plot, want) {
  const over = grainsIn(plot) - want;
  let n = Math.min(over, Math.max(1, Math.ceil(over * (dt / TRICKLE_MS))));
  while (n-- > 0) {
    const c = topmostColumn(plot);
    if (c < 0) break;
    const r = topGrain(plot, c);
    if (r < 0) break;
    const v = at(plot, c, r);
    put(plot, c, r, 0);
    if (S.tableAir.length < IN_AIR) S.tableAir.push({
      x: plot.x + c * P,
      y: bottomY(plot) - (r + 1) * P,
      vx: (rand() - 0.5) * 0.35,
      vy: -(0.3 + rand() * 0.5),
      up: true, fade: true, t: 0, s: v
    });
  }
}

// The topmost grain in a column, walls aside, or -1: `topRow` finds the
// topmost cell, and in the funnel's outer columns that is the wall with
// nothing on it.
const topGrain = (plot, c) => {
  for (let r = plot.rows - 1; r >= 0; r--)
    if (at(plot, c, r) && !(plot.fixed && plot.fixed(c, r))) return r;
  return -1;
};

// The tallest column with a grain in it, so a heap comes apart from the top
// rather than being eaten from one end. Where it starts looking walks, so the
// same side is not always the one that goes first.
let drainAt = 0;
function topmostColumn(plot) {
  let best = -1, high = -1;
  for (let i = 0; i < plot.cols; i++) {
    const c = (drainAt + i) % plot.cols;
    const r = topGrain(plot, c);
    if (r > high) { high = r; best = c; }
  }
  drainAt = (drainAt + 7) % Math.max(1, plot.cols);
  return best;
}

// One frame of the funnel: it walks to what it should hold, and settles.
export function stepTable(dt) {
  if (!S.casinoOpen || !table.grid) return;
  if (table.capped != null && hopperN() < table.capped) table.capped = null;   // room again
  if (S.paying) payOutStep(dt);
  const hw = tableWant();
  // the hopper: the stake raining in. Not while a hand is on the board: what
  // leaves the hopper then leaves through the gate, and only through the gate.
  if (!S.drop) {
    if (hopperN() + airborneTo('hopper') < hw) trickleIn(dt, table, 'hopper', hw, skyOver);
    else if (hopperN() > hw) drainOut(dt, table, hw);
    // the picture is at its band with nothing in the air and something
    // still owed -- the rounding of the shares, or a bowl that took no
    // more -- so the rest is spent for the grains standing there
    else if (S.pot && S.pot.owed > 0 && airborneTo('hopper') === 0) spendStake(S.pot.owed);
  }
  settleSome(table, 6000);
}

// One frame of the grains in the air: they rise, they fall, they land in a
// plot or the hole, or they fade out.
export function stepSparks(dt) {
  const f = frames();
  for (let i = S.tableAir.length - 1; i >= 0; i--) {
    const k = S.tableAir[i];
    // A grain on its way somewhere along an arc: to the hole, where it is worth
    // something, or over the hopper's rim, where it becomes a grain coming down.
    if (k.arc) {
      const a = k.arc;
      a.k = Math.min(1, a.k + dt / a.ms);
      k.x = a.x0 + (a.x1 - a.x0) * a.k;
      k.y = a.y0 + (a.y1 - a.y0) * a.k - Math.sin(a.k * Math.PI) * a.high;
      if (a.k >= 1) {
        if (k.lands === 'hopper') { k.arc = null; k.vx = 0; k.vy = 0.5; continue; }
        // One square off the tray is worth its share of the pay, and on the
        // ground it is that many grains of its kind: the pile IS the pay, for
        // the haulers to carry. A grain the ground still refuses goes to the
        // hole rather than nowhere.
        if (k.lands === 'strip') {
          for (let w = k.worth ?? 1; w > 0; w--) if (!addGrain(floor, a.x1, blocked, k.s)) bankDust(a.x1, k.s);
          sfx('grain-land', { x: a.x1 });
          S.tableAir.splice(i, 1);
          continue;
        }
        for (let w = k.worth ?? 1; w > 0; w--) if (!bankDust(a.x1, k.s)) break;
        S.tableAir.splice(i, 1);
      }
      continue;
    }
    if (!k.up) k.vy += TABLE_GRAV * f;
    k.x += k.vx * f;
    k.y += k.vy * f;
    k.t += dt / 1000;
    // A grain of the pay falling through the foot: at the building's floor
    // it goes out of the hatch in a lob on to the strip.
    if (k.then && k.y >= k.floorY) {
      k.arc = { x0: k.x, y0: k.floorY, ...k.then, k: 0 };
      k.then = null;
      continue;
    }
    // A grain coming down into a plot is one of the pot arriving: it stops
    // being a thing in the air and becomes a grain in the heap, which is what
    // makes the heap grow as you watch rather than appear.
    if (k.lands === 'hopper') {
      const plot = table;
      const c = Math.max(0, Math.min(plot.cols - 1, Math.round((k.x - plot.x) / P)));
      if (k.y >= surfaceY(plot, c)) {
        // a grain of the stake arriving: the purse is spent as it lands
        if (k.worth) spendStake(k.worth);
        if (!addGrain(plot, k.x, null, k.s)) plot.capped = grainsIn(plot);
        sfx('hopper-land', { x: k.x });
        S.tableAir.splice(i, 1);
      }
      continue;
    }
    if (k.lands === 'strip') continue;      // on its way through the foot; it lands off its arc
    // A rising one goes until its time is up, because what it is doing is
    // leaving; a plain falling one is scenery and stops at the ground.
    if (k.t > TABLE_LIFE || (!k.up && k.y >= S.groundY - P)) S.tableAir.splice(i, 1);
  }
}

// The hand, frame by frame: the stake settling in its plot, the handful on the
// pegs, the bins paying out of the foot, and the machine's own demonstration
// when nobody is at it.
export function stepCasino(dt) {
  if (!S.casinoOpen) return;
  stepSparks(dt);
  stepHold(dt);
  // The pot is standing in its plot: the pour is over, and the decision is open.
  if (S.pouring && !S.holding && settledInPile()) { S.pouring = false; S.shopStale = true; }
  if (S.drop) stepDrop(dt);
  stepAttract(dt);
  // A win's fountains go up a beat apart rather than all at once: three bursts
  // read as a celebration, one reads as a hiccup.
  if (S.hand?.won && S.hand.bursts < S.hand.fountains &&
      now() - S.hand.at >= S.hand.bursts * CASINO_BURST_GAP_MS) { burst(); S.hand.bursts++; }
  if (S.hand && now() - S.hand.at > CASINO_SAY_MS) { S.hand = null; }
}

// The top of the foot, which is where the news comes out of.
const footTop = () => ({ x: casino.x + casino.w / 2, y: casino.y + casino.h - FOOT_H * P });

// A fountain of squares out of the foot: up hard, out a little, and down under
// gravity, fading as they go. They are scenery -- worth nothing, landing
// nowhere -- in every shade the yard has, so they read as confetti against the
// sky and against the block both.
function burst() {
  const { x, y } = footTop();
  for (let i = 0; i < CASINO_BURST; i++) {
    const a = (rand() - 0.5) * Math.PI * 0.9;            // a fan, mostly up
    const v = CASINO_BURST_UP * (0.6 + rand() * 0.6);
    S.tableAir.push({
      x: x + (rand() - 0.5) * P * 4, y,
      vx: Math.sin(a) * v * CASINO_BURST_SIDE, vy: -Math.cos(a) * v,
      // two cells a square and mostly black: a one-cell grey square in the air
      // is a mote, and the yard is full of those
      fade: true, big: true, t: 0, s: rand() < 0.7 ? 1 : 1 + Math.floor(rand() * SHADES.length)
    });
  }
}

// Whether the machine may flash, strobe or knock right now: the motion
// setting. With motion off the pegs still click and the bins still fill.
export const mayFlash = () => !reducedMotion();

// what the yard should be showing over the building, if anything
export const saying = () => S.hand ? (S.hand.won ? 'won' : S.hand.won === false ? 'lost' : 'even') : null;

// The multiple the box over the building shows: the settled hand's, or the
// count so far while the bins are paying, to a tenth.
export const shownMult = () =>
  S.drop && S.drop.stage === 'pay' ? S.drop.paid / S.drop.stake : S.hand ? S.hand.mult : null;
// And what the hand has come to in the staked coin, up or down, counting with
// it: a player who did not watch reads what was won or lost, not only by how
// much it was multiplied.
export const shownChange = () =>
  S.drop && S.drop.stage === 'pay' ? Math.round(S.drop.paid) - S.drop.stake
    : S.hand ? S.hand.n - S.hand.stake : null;
// What the hand has paid so far, by kind, for the box to list.
export const shownPays = () =>
  S.drop && S.drop.stage === 'pay' ? S.drop.pays : S.hand ? S.hand.pays : null;
// The bin paying this beat, for its foot to say so -- or the bin held at a
// full strip, lit until it can pay.
export const payingBin = () => {
  const d = S.drop;
  if (!d || d.stage !== 'pay') return null;
  if (d.held) return PAY_ORDER[d.payIdx];
  return d.payFrom != null && now() - d.payAt < CASINO_PAY_BEAT_MS ? d.payFrom : null;
};

// --- no board ------------------------------------------------------------------
// The casino sells nothing from a shelf. The chip and the stake are heaps you
// carry (`stakes.js`); the gate, the chute and the crank are levers on the
// building (levers.js). The two lists stay, empty, for everything that walks
// every board and expects a station to answer.
export const CASINO_UPGRADES = [];
export const CASINO_SECTIONS = [];
