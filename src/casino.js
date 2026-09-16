// The casino: the one place in the yard that makes nothing.
//
// Everywhere else, a thing you buy does something for ever after. This takes
// what you have and hands some of it back, and the whole of it is a decision you
// keep making rather than a purchase you make once.
//
// **The building is the machine.** A heap of the coin you carry to the hopper
// on the roof pours in and stands there as the pot, at the table's own band
// ladder. You pull the gate lever: the floor splits, the whole pile drains
// into the throat -- into the machine, the way dust goes into the hole -- and
// out of the throat come a handful of pressed pebbles that go down ten rows
// of pegs into eleven bins, each flipping its own coin at every peg off the
// seeded rng, so the handful fans out into the bell the bins are priced on and
// the same handful never lands the same way twice. When the last pebble is
// still the bins pay into the tray at the foot, a bin a beat from the middle
// outward, each pebble carrying its bin's pay -- and what stands in the tray
// is the pot again. Tip it out for the haulers, or wind it back up to the
// roof and drop it again. When to stop is the game. See DESIGN.md, "The
// handful" and "The stake is a heap you carry".
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

import { PILE_LIMIT, CASINO_HANDFUL, CASINO_BINS, CASINO_PEG_ROWS, shownFor,
         HOPPER_H, HOPPER_PROFILE, GATE_H, GATE_W, CASINO_SIGN_H, BOARD_AIR, PEG_ROW_H, BIN_W, EDGE_BIN_W, BIN_H, LABEL_H, TRAY_H,
         BOARD_COLS, CASINO_MARGIN, FIELD_H,
         CASINO_FALL_MS, CASINO_PEG_BEAT_MS, CASINO_GRAIN_GAP_MS, CASINO_GATE_MS,
         CASINO_BIN_KNOCK, CASINO_KNOCK, CASINO_WIN_KNOCK, CASINO_SETTLE_HOLD_MS, CASINO_PAY_BEAT_MS,
         CASINO_BURST_AT, CASINO_WIN_MS, CASINO_BURST, CASINO_BURST_GAP_MS, CASINO_BURST_UP, CASINO_BURST_SIDE,
         CASINO_SAY_MS, CASINO_ATTRACT_S, CASINO_FLASH_MS, CASINO_EVEN_BAND,
         CASINO_PILE_ONE, CASINO_PILE_BAND, CASINO_PILE_BRIM, TABLE_LIFE, TABLE_GRAV,
         P, SHADES, SHARD_CELL, SPORE_CELL, ROCK_CELL, someFind, CASINO_BIG,
         SND_PEG_CENTS, SND_BIN_CENTS, SND_HOIST_CENTS } from './config.js';
import { S, pit, casino, table, tray, floor, stakes } from './state.js';
import { noteHand } from './notices.js';
import { makePainter } from './painter.js';
import { addGrain, resizeGrid, settleSome, settle, at, put, bottomY, surfaceY, fillFlat } from './grid.js';
import { shakeView, blocked } from './world.js';
import { now, frames } from './clock.js';
import { spend, bankDust, spendHeld, payTo } from './pit.js';
import { goHome } from './stakes.js';
import { rand } from './rng.js';
import { sfx } from './audio.js';
import { reducedMotion } from './prefs.js';

// --- reading the table ----------------------------------------------------------
// What the pot is, and nothing about it moves on its own: a pot is what the last
// hand left, until the next one.
export const pot = () => S.pot ? S.pot.n : 0;

// The chip is down and the stake is still on its way into its plot -- or the
// tray is still filling to what the bins paid. Not a wait dressed up as one: it
// is the pot arriving, and it ends on the frame the last grain of it comes to
// rest. Nothing here is on a clock: see `settledIn`.
export const pouring = () => !!S.pouring;

// A hand is on the board: the gate open, grains on the pegs, the bins filling
// or paying.
export const letting = () => !!S.drop;

// The tray on its way back up to the hopper for a drop again.
export const hoisting = () => !!S.hoisting;

// A hand is under way, any part of it: the stake coming down, the handful on
// the pegs, the bins paying, the tray going up or over. Chip, let-go, bank and
// drop-again are all dead for the whole of it.
export const busy = () => pouring() || letting() || hoisting() || !!S.paying || !!S.staking || !!S.unstaking;

// --- the stake -----------------------------------------------------------------
// What you can stake is what you can see: a pile of each coin -- the purse
// itself, at the band ladder -- stands on the ground beside the building
// (stakes.js), and what you sweep off it into the funnel is the stake. The
// purse each comes out of.
export const purseOf = cur =>
  cur === 'shard' ? S.shards : cur === 'spore' ? S.spores : S.stored;

export const inHopper = () => !!S.pot && S.pot.where === 'hopper';
export const inTray = () => !!S.pot && S.pot.where === 'tray';

// A grain may go in while no hand is on the board and the pot has no other
// coin in it: one coin a hand, because a mixed pot would need a mixed tray
// and a mixed pay, and the refusal at the rim is one rule and it is visible.
// The hopper still walking to the last grain's worth is no bar: a sweep is
// many grains a second, and each is a stake. Nor is a banked pot still
// running out of the chute or lying on the strip for the haulers: banking
// ends the hand, and the pile on the ground is the crew's business, not the
// next stake's. (The arm waits for the tray to empty; the stake does not.)
export const canStake = cur =>
  S.casinoOpen && !letting() && !hoisting() && (!S.pot || (inHopper() && S.pot.cur === cur));

// The pot is standing in the hopper and nothing is moving: the floor can open.
export const canLet = () => inHopper() && !busy();

// A pot can be tipped out whenever it is standing in the tray and nothing is
// still moving. Where it goes is the ground beside the building, and that
// ground has a limit: the chute holds while the casino's strip is full (see
// `chuteOpen`), and the pot waits in the tray until the haulers have made
// room -- a pot has to have somewhere to land, with the waiting visible.
export const canBank = () => inTray() && !busy();

// And putting the same pot back on the roof.
export const canRide = () => inTray() && !busy();

// A grain let go over the rim, carrying its band's worth: it comes out of the
// purse there and then -- lifted out of the hole to the funnel, so the purse
// is seen leaving -- and joins the pot standing in the bowl. A grain that was
// swept out of the bowl and dropped back brings its share back with it; the
// purse was never paid. The bowl walks to the pot's band (`trickleIn`) and
// the arm is live the moment it is lying still. False when the pot will not
// have it: another coin, or a hand under way.
export function stakeGrain(cur, worth, from) {
  if (!canStake(cur)) return false;
  let take = worth;
  if (from !== 'hopper') {
    take = Math.min(worth, purseOf(cur));
    if (take <= 0) return false;
    if (cur === 'dust') { payTo(potAt().x, potAt().y - P * 4); spend(take); payTo(); }
    // Out of the hole first, and off what the rift holds for the rest: a stake
    // is spending like any other. See `spendHeld` in pit.js.
    else if (cur === 'shard') { S.shards -= take; spendHeld(take, SHARD_CELL); }
    else if (cur === 'spore') { S.spores -= take; spendHeld(take, SPORE_CELL); }
  }
  const on = S.pot ? S.pot.n : 0;
  S.pot = { cur, stake: on + take, n: on + take, where: 'hopper' };
  S.hand = null;                                 // the last one is old news now
  S.pouring = true;
  stopAttract();                                 // the machine has a player
  S.shopStale = true;
  return true;
}

// A grain swept out of the bowl takes its share of the pot with it: the pot
// is what stands in the bowl. Nothing is paid back until it lands somewhere
// -- back in the bowl, or home on its pile (`refundGrain`).
export function unstakeGrain(worth) {
  if (!inHopper()) return;
  S.pot.n = Math.max(0, S.pot.n - worth);
  S.pot.stake = S.pot.n;
  if (S.pot.n === 0) { S.pot = null; S.hand = null; }
  S.pouring = true;                              // the bowl walks to the pot again
  S.shopStale = true;
}

// A grain of the pot come home to its pile: the purse rises by what it
// carried, into the hole where the purse lives, as it lands.
export function refundGrain(cur, worth) {
  const find = potShade(cur);
  for (let w = 0; w < worth; w++) bankDust(pit.x + rand() * Math.min(700, pit.w), find ? someFind(find) : 1 + Math.floor(rand() * SHADES.length));
  S.shopStale = true;
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

// The bins pay from the middle outward, a bin a beat: the half bins first so
// the tray fills slowly, and the good bins last so it jumps when they land. You
// already know what is in the edge bins; the machine makes you wait for them.
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

// A whole hand dealt at once, off the rng, without the sim: the bins each grain
// lands in and what they pay on a stake. This is the arithmetic the cascade
// walks; `test/handful.test.mjs` deals two thousand of these to hold the spread
// the design hangs on.
export function dealHand(stakeN) {
  const grains = handfulFor(stakeN);
  const worth = stakeN / grains;
  const bins = CASINO_BINS.map(() => 0);
  for (let i = 0; i < grains; i++) bins[binOf(drawPath())]++;
  const paid = bins.reduce((sum, n, b) => sum + n * CASINO_BINS[b] * worth, 0);
  return { grains, bins, paid, mult: paid / stakeN };
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
export function letGo() {
  if (!canLet()) return;
  S.drop = {
    at: now(), lastSent: -Infinity, sent: 0, handful: handfulFor(S.pot.n), drained: 0, shade: 0,
    grains: [], bins: makeBins(),
    stage: 'drop', holdAt: 0, payAt: 0, payIdx: 0, paid: 0, edge: false, payFrom: null
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
// quiet, and then the bins pay from the middle outward, a bin a beat. Each
// grain runs down out of its bin into the tray carrying its bin's pay, and the
// tray fills toward what has been paid so far the way the hopper always has --
// a x39 grain arriving is a heap that sprouts, a half bin is two grains going
// in and one coming out the other side -- so the box over the building and the
// tray tell the same story at the same moment.
function payBin(b) {
  const d = S.drop;
  const bin = d.bins[b];
  const f = fieldAt();
  d.paid += bin.n * CASINO_BINS[b] * grainWorth();
  d.payFrom = b;
  for (let c = 0; c < bin.cols; c++)
    for (let r = 0; r < bin.rows; r++) {
      const s = at(bin, c, r);
      if (!s) continue;
      put(bin, c, r, 0);
      S.tableAir.push({
        x: f.x + (binLeft(b) + c * PEBBLE) * P, y: f.y + (FIELD_H + BIN_H - (r + 1) * PEBBLE) * P,
        vx: 0, vy: 0.6 + rand() * 0.4, t: 0, s, big: true, lands: 'tray'
      });
    }
}

// Where extra sand for the tray comes from while the bins are paying: the chute
// under the bin that just paid, so a x39 sprouts from where its grain fell.
const chuteAt = () => {
  const f = fieldAt();
  const b = S.drop?.payFrom ?? Math.floor(CASINO_BINS.length / 2);
  return { x: f.x + (binLeft(b) + rand() * slotW(b)) * P, y: f.y + (FIELD_H + BIN_H) * P };
};

// The hand is paid. What is in the tray is the pot, the box says the multiple,
// and it is felt: a hand that pays more than it took is the burst, one that
// pays less is the dud, and dead even is quiet.
function settleHand() {
  const d = S.drop;
  const cur = S.pot.cur, stake = S.pot.stake;
  const paid = Math.round(d.paid);
  const mult = paid / stake;
  // A hand within the even band is even: quiet, and the box says so. Past it a
  // win is a win and a dud a dud, so the box and the fanfare never disagree.
  const won = Math.abs(mult - 1) < CASINO_EVEN_BAND ? null : paid > stake;
  S.pot = paid > 0 ? { cur, stake, n: paid, where: 'tray' } : null;
  S.pouring = !!S.pot;                           // the tray walks to what the pot says
  S.drop = null;
  S.hand = { won, mult, n: paid, stake, cur, at: now(), bursts: 0,
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
    if (t - d.at >= CASINO_GATE_MS) drainGate(d);           // once the floor has opened
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
  // paying, a bin a beat, and the hand settles when the last has landed
  if (d.payIdx < PAY_ORDER.length && t - d.payAt >= CASINO_PAY_BEAT_MS) {
    payBin(PAY_ORDER[d.payIdx++]);
    d.payAt = t;
  }
  if (d.payIdx >= PAY_ORDER.length && airborneTo('tray') === 0) settleHand();
}

// --- the machine selling itself ------------------------------------------------------
// A casino nobody is at is not dark. Every so often one grain drops from the
// hopper, ticks its way down to a bin, then lifts and fades -- a demonstration
// with nothing riding on it, and from the far end of the yard the only moving
// thing out past the lab. It stops the moment a chip is down.
function stepAttract(dt) {
  if (!S.casinoOpen || S.pot || S.drop || S.paying || S.hoisting) return;
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

// --- taking it, or dropping it again -------------------------------------------------
// Banking is a heap on the ground, and the crew carries it in. The chute
// opens the tray's floor and the paid sand runs out of the foot of the
// building on to the casino's strip, where it heaps as a real pile of the
// staked coin: a tray grain is worth its band, and it lands as that many
// grains, so what lies on the ground IS the pot, and the counter moves as the
// haulers' loads land in the hole. A win is collected, not credited -- it was
// the one thing in the yard still credited rather than carried.
export function bank() {
  if (!canBank()) return;
  // `left` is the pot itself and it is paid out to the grain, however the
  // rounding of a grain's worth falls.
  S.paying = { cur: S.pot.cur, left: pot(), grains: Math.max(1, tray.n) };
  S.pot = null;
  S.hand = null;                                 // taken: there is nothing to report
  S.shopStale = true;
}

// The casino's strip, and whether the chute may let another grain out on to
// it: what lies there plus what is already in the air toward it has to stay
// under the strip's limit, or the ground would refuse a grain and the hole
// would be paid for a grain nobody carried.
const casinoStrip = () => S.piles.find(p => p.key === 'casino');
const toStrip = () => S.tableAir.reduce((n, k) => n + (k.lands === 'strip' ? (k.worth || 1) : 0), 0);
export const chuteOpen = () =>
  !!casinoStrip() && (S.pileCount?.casino || 0) + toStrip() < PILE_LIMIT.casino;

// Put the whole of it back on the roof. The tray's grains lift in a rising arc
// up the face of the building and drop into the hopper, sounding the pour's
// tick in reverse, and the pot stands there as the stake for the next handful.
// A player who watches their winnings climb back up to the roof knows exactly
// what they are about to risk, which is the whole of the bet.
export function ride() {
  if (!canRide()) return;
  S.pot = { ...S.pot, stake: S.pot.n, where: 'hopper' };
  // The whole of the tray's picture goes up: the hopper's picture is the same
  // band, and every grain of it will drain into the machine.
  S.hoisting = { grains: Math.max(1, tray.n), lifted: 0 };
  S.hand = null;
  S.shopStale = true;
}

// However much there is, it is away in about a second and a half: the rate
// every trickle here runs at.
const TRICKLE_MS = 1500;
const FLIGHT_MS = 1700;
const IN_AIR = 24000;

function hoistStep(dt) {
  const h = S.hoisting;
  let n = Math.min(tray.n, h.grains - h.lifted, Math.max(1, Math.ceil(h.grains * (dt / TRICKLE_MS))));
  while (n-- > 0) {
    const c = topmostColumn(tray);
    if (c < 0) break;
    const r = topGrain(tray, c);
    const v = at(tray, c, r);
    put(tray, c, r, 0);
    h.lifted++;
    const x = tray.x + c * P, y = bottomY(tray) - (r + 1) * P;
    sfx('hoist-tick', { x, cents: Math.round((h.lifted / h.grains) * SND_HOIST_CENTS) });
    S.tableAir.push({
      x, y, s: v, t: 0, lands: 'hopper',
      // up the face and over the rim: a lob that clears the hopper's wall and
      // comes down inside it
      arc: { x0: x, y0: y, x1: table.x + rand() * table.cols * P, y1: table.y - P * 3,
             k: 0, high: P * 8 + rand() * P * 6, ms: FLIGHT_MS }
    });
  }
  if (tray.n === 0 && airborneTo('hopper') === 0) {
    S.hoisting = false;
    S.pouring = true;                            // and the hopper walks to what the pot says
  }
}

function payOutStep(dt) {
  const p = S.paying;
  const strip = casinoStrip();
  let n = Math.min(p.grains, Math.max(1, Math.ceil(p.grains * (dt / TRICKLE_MS))));
  const find = potShade(p.cur);
  while (n-- > 0 && p.grains > 0 && chuteOpen()) {
    let x = tray.x, y = S.groundY - P, v = find ? someFind(find) : 4;
    const c = topmostColumn(tray);                 // off the heap if there is any left
    if (c >= 0) {
      const r = topGrain(tray, c);
      if (r >= 0) {
        v = at(tray, c, r);
        x = tray.x + c * P;
        y = bottomY(tray) - (r + 1) * P;
        put(tray, c, r, 0);
      }
    }
    // Its share of the pot, and never less than one: whatever the rounding
    // leaves over rides on the last grain off the heap, so the hole is paid the
    // exact pot rather than the exact pot give or take the arithmetic.
    const worth = p.grains > 1
      ? Math.max(1, Math.min(p.left - (p.grains - 1), Math.round(p.left / p.grains)))
      : p.left;
    p.left -= worth;
    p.grains--;
    // out of the hatch in the foot's left wall and a short lob on to the strip
    S.tableAir.push({
      x, y, s: v, t: 0, worth, lands: 'strip',
      // into the middle half of the strip, so a grain that walks to the nearest
      // column with room stays on the ground the survey counts as the casino's
      arc: { x0: x, y0: y, x1: strip.from + (strip.to - strip.from) * (0.25 + rand() * 0.5),
             y1: S.groundY - P, k: 0, high: P * 4 + rand() * P * 4, ms: CHUTE_MS }
    });
  }
  if (p.grains < 1 && p.left < 1) { S.paying = null; }
}
const CHUTE_MS = 700;

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
export function wireTray() {
  if (!tray.painter) tray.painter = makePainter(tray);
  tray.onPut = tray.painter.mark;
  tray.blocked = null;
  tray.ceiling = () => TRAY_H;
  tray.repose = true;
  resizeGrid(tray);
}

// The sand itself is never saved: a reset or a reload starts the building
// empty, and a pot comes back pouring into whichever plot it stood in.
export function clearCasino() {
  for (const h of stakes) if (h.grid) fillFlat(h, 0);
  if (table.grid) layWalls();
  if (tray.grid) fillFlat(tray, 0);
  table.capped = null;
  tray.capped = null;
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
  return Math.min(shownFor(pot()), table.capped ?? Infinity);
};

// And the tray: the pot's band while the pot stands in it, or the band of what
// the bins have paid so far while they are paying.
export const trayWant = () => {
  const want = inTray() ? shownFor(pot())
    : S.drop && S.drop.stage === 'pay' ? shownFor(Math.round(S.drop.paid))
    : 0;
  return Math.min(want, tray.capped ?? Infinity);
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
  !S.paying && !S.hoisting &&
  (inHopper() ? settledIn(table, tableWant(), 'hopper') : inTray() ? settledIn(tray, trayWant(), 'tray') : true);

export const potShade = cur =>
  cur === 'shard' ? SHARD_CELL : cur === 'spore' ? SPORE_CELL : 0;

function trickleIn(dt, plot, name, want, from) {
  const have = grainsIn(plot) + airborneTo(name);
  let n = Math.min(want - have, Math.max(1, Math.ceil((want - have) * (dt / TRICKLE_MS))));
  const find = potShade(S.pot?.cur);
  while (n-- > 0) {
    const shade = find ? someFind(find) : 1 + Math.floor(rand() * SHADES.length);
    const { x, y } = from();
    if (S.tableAir.length < IN_AIR) {
      S.tableAir.push({ x, y, vx: (rand() - 0.5) * 0.3, vy: 0.9 + rand() * 0.8, t: 0, s: shade, lands: name });
    } else if (!addGrain(plot, x, null, shade)) {
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

// One frame of the two plots: each walks to what it should hold, and settles.
export function stepTable(dt) {
  if (!S.casinoOpen || !table.grid || !tray.grid) return;
  if (table.capped != null && hopperN() < table.capped) table.capped = null;   // room again
  if (tray.capped != null && tray.n < tray.capped) tray.capped = null;
  if (S.paying) payOutStep(dt);
  if (S.hoisting) hoistStep(dt);
  const hw = tableWant(), tw = trayWant();
  // the hopper: the stake raining in, or the rest of a let-go heap leaving. Not
  // while the tray is being hoisted into it -- that is the pour, the other way up.
  // ...and not while a hand is on the board: what leaves the hopper then
  // leaves through the gate, and only through the gate.
  if (!S.hoisting && !S.drop) {
    if (hopperN() + airborneTo('hopper') < hw) trickleIn(dt, table, 'hopper', hw, skyOver);
    else if (hopperN() > hw) drainOut(dt, table, hw);
  }
  // the tray: the bins' pay sprouting toward the band, or a half bin's other
  // grain leaving; and a banked pot is lifted by `payOutStep`, not here
  if (!S.paying && !S.hoisting) {
    if (tray.n + airborneTo('tray') < tw) trickleIn(dt, tray, 'tray', tw, chuteAt);
    else if (tray.n > tw) drainOut(dt, tray, tw);
  }
  settleSome(table, 6000);
  settleSome(tray, 6000);
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
        // One square off the tray is worth its band, and on the ground it is
        // that many grains: the pile IS the pot, for the haulers to carry. The
        // chute holds while the strip is full, so the ground takes them; a
        // grain it still refuses goes to the hole rather than nowhere.
        if (k.lands === 'strip') {
          for (let w = k.worth ?? 1; w > 0; w--) if (!addGrain(floor, a.x1, blocked, k.s)) bankDust(a.x1, k.s);
          sfx('grain-land', { x: a.x1 });
          S.tableAir.splice(i, 1);
          continue;
        }
        // A pot lifted out of the hopper and let go on the ground goes back to
        // the purse the way banking used to: over the works and into the hole,
        // and down there the pile *is* the dust.
        for (let w = k.worth ?? 1; w > 0; w--) if (!bankDust(a.x1, k.s)) break;
        S.tableAir.splice(i, 1);
      }
      continue;
    }
    if (k.lands === 'stake') continue;          // the heaps' rain: stakes.js lands it
    if (!k.up) k.vy += TABLE_GRAV * f;
    k.x += k.vx * f;
    k.y += k.vy * f;
    k.t += dt / 1000;
    // A grain coming down into a plot is one of the pot arriving: it stops
    // being a thing in the air and becomes a grain in the heap, which is what
    // makes the heap grow as you watch rather than appear.
    if (k.lands === 'hopper' || k.lands === 'tray') {
      const plot = k.lands === 'hopper' ? table : tray;
      const c = Math.max(0, Math.min(plot.cols - 1, Math.round((k.x - plot.x) / P)));
      if (k.y >= surfaceY(plot, c)) {
        // a grain of a pile arriving is the stake: the purse is spent as it
        // lands, and one the pot will not have (the hand shut on the way)
        // goes home unspent
        if (k.cur && !stakeGrain(k.cur, k.worth, 'stake')) { goHome(k, k.cur, 0); S.tableAir.splice(i, 1); continue; }
        if (!addGrain(plot, k.x, null, k.s)) plot.capped = grainsIn(plot);
        sfx(k.lands === 'hopper' ? 'hopper-land' : 'tray-tick', { x: k.x });
        S.tableAir.splice(i, 1);
      }
      continue;
    }
    // A rising one goes until its time is up, because what it is doing is
    // leaving; a plain falling one is scenery and stops at the ground.
    if (k.t > TABLE_LIFE || (!k.up && k.y >= S.groundY - P)) S.tableAir.splice(i, 1);
  }
}

// The hand, frame by frame: the stake settling in its plot, the handful on the
// pegs, the bins paying, the tray hoisted, and the machine's own demonstration
// when nobody is at it.
export function stepCasino(dt) {
  if (!S.casinoOpen) return;
  stepSparks(dt);
  // The pot is standing in its plot: the pour is over, and the decision is open.
  if (S.pouring && settledInPile()) { S.pouring = false; S.shopStale = true; }
  if (S.drop) stepDrop(dt);
  stepAttract(dt);
  // A win's fountains go up a beat apart rather than all at once: three bursts
  // read as a celebration, one reads as a hiccup.
  if (S.hand?.won && S.hand.bursts < S.hand.fountains &&
      now() - S.hand.at >= S.hand.bursts * CASINO_BURST_GAP_MS) { burst(); S.hand.bursts++; }
  if (S.hand && now() - S.hand.at > CASINO_SAY_MS) { S.hand = null; }
}

// The top of the tray, which is where the news comes out of.
const trayTop = () => ({ x: tray.x + tray.cols * P / 2, y: tray.y });

// A fountain of squares out of the tray: up hard, out a little, and down under
// gravity, fading as they go. They are scenery -- worth nothing, landing
// nowhere -- in every shade the yard has, so they read as confetti against the
// sky and against the block both.
function burst() {
  const { x, y } = trayTop();
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
  S.drop && S.drop.stage === 'pay' ? S.drop.paid / S.pot.stake : S.hand ? S.hand.mult : null;
// And what the hand has come to in the staked coin, up or down, counting with
// it: a player who did not watch reads what was won or lost, not only by how
// much it was multiplied.
export const shownChange = () =>
  S.drop && S.drop.stage === 'pay' ? Math.round(S.drop.paid) - S.pot.stake
    : S.hand ? S.hand.n - S.hand.stake : null;
export const shownCur = () => S.drop && S.drop.stage === 'pay' ? S.pot.cur : S.hand ? S.hand.cur : null;
// The bin paying this beat, for its foot to say so.
export const payingBin = () =>
  S.drop && S.drop.stage === 'pay' && S.drop.payFrom != null && now() - S.drop.payAt < CASINO_PAY_BEAT_MS
    ? S.drop.payFrom : null;

// --- no board ------------------------------------------------------------------
// The casino sells nothing from a shelf. The chip and the stake are heaps you
// carry (`stakes.js`); the gate, the chute and the crank are levers on the
// building (levers.js). The two lists stay, empty, for everything that walks
// every board and expects a station to answer.
export const CASINO_UPGRADES = [];
export const CASINO_SECTIONS = [];
