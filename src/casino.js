// The casino: the one place in the yard that makes nothing.
//
// Everywhere else, a thing you buy does something for ever after. This takes
// what you have and hands some of it back, and the whole of it is a decision you
// keep making rather than a purchase you make once.
//
// **The building is the machine.** The stake rains out of the sky into the
// hopper on the roof and stands there as a heap -- that heap is the pot. You
// let it go: the hopper floor splits, and a handful of the heap comes out and
// down ten rows of pegs into eleven bins. Every grain flips its own coin at
// every peg, off the seeded rng, so the handful fans out into the bell the bins
// are priced on and the same handful never lands the same way twice. When the
// last grain is still the bins pay into the tray at the foot, a bin a beat from
// the middle outward, each grain carrying its bin's pay -- and what stands in
// the tray is the pot again. Bank it, or hoist it back up to the roof and drop
// it again. When to stop is the game. See DESIGN.md, "The handful".
//
// A handful is `CASINO_HANDFUL` grains whatever the stake, each carrying its
// share of it. That count is what makes this a bet: every grain is a fair draw
// from the bins, and a pour of N pays the mean of N draws, whose spread shrinks
// with the square root of N. Thirty-two pay with a spread of about a third, put
// a grain in a x39 one hand in eight, and lose the median hand.
//
// There was a wheel here, even money, and it is gone: the answer was picked
// first and the wheel aimed at it, so you watched a picture of a decision that
// had already been made. Here nothing is decided until a grain is on a peg.

import { CASINO_CHIPS, CASINO_HANDFUL, CASINO_BINS, CASINO_PEG_ROWS,
         HOPPER_H, GATE_H, GATE_W, CASINO_SIGN_H, BOARD_AIR, PEG_ROW_H, BIN_W, BIN_H, LABEL_H, TRAY_H,
         BOARD_COLS, CASINO_MARGIN, FIELD_H,
         CASINO_FALL_MS, CASINO_PEG_BEAT_MS, CASINO_GRAIN_GAP_MS, CASINO_GATE_MS,
         CASINO_BIN_KNOCK, CASINO_KNOCK, CASINO_WIN_KNOCK, CASINO_SETTLE_HOLD_MS, CASINO_PAY_BEAT_MS,
         CASINO_BURST_AT, CASINO_WIN_MS, CASINO_BURST, CASINO_BURST_GAP_MS, CASINO_BURST_UP, CASINO_BURST_SIDE,
         CASINO_SAY_MS, CASINO_ATTRACT_S, CASINO_FLASH_MS,
         CASINO_PILE_ONE, CASINO_PILE_BAND, CASINO_PILE_BRIM, TABLE_LIFE, TABLE_GRAV,
         P, SHADES, SHARD_CELL, SPORE_CELL, someFind, CASINO_BIG,
         SND_PEG_CENTS, SND_BIN_CENTS, SND_HOIST_CENTS } from './config.js';
import { S, pit, casino, table, tray } from './state.js';
import { noteHand } from './notices.js';
import { makePainter } from './painter.js';
import { addGrain, resizeGrid, settleSome, topRow, at, put, bottomY, surfaceY, fillFlat } from './grid.js';
import { shakeView } from './world.js';
import { now, frames } from './clock.js';
import { spend, bankDust, spendHeld } from './pit.js';
import { buildShop } from './shop.js';
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
export const busy = () => pouring() || letting() || hoisting() || !!S.paying;

// --- the chip -----------------------------------------------------------------
// How much goes down is chosen, not worked out for you. Four chips, and the last
// of them is not a number: `all` is everything you are holding of whatever you
// stake, and it is the one the whole place is really for.
export const purseOf = cur =>
  cur === 'shard' ? S.shards : cur === 'spore' ? S.spores : S.stored;

export const chip = () => CASINO_CHIPS[Math.max(0, Math.min(CASINO_CHIPS.length - 1, S.chip))];
export const chipName = () => (chip() === 'all' ? 'all in' : String(chip()));

// A chip you cannot cover is a chip you cannot put down, so the row goes pale
// rather than quietly staking less than it says.
export const stakeOf = cur => chip() === 'all' ? purseOf(cur) : chip();

export function pickChip(d) {
  S.chip = Math.max(0, Math.min(CASINO_CHIPS.length - 1, S.chip + d));
  S.dirty = true;
  buildShop();
}

const inHopper = () => !!S.pot && S.pot.where === 'hopper';
const inTray = () => !!S.pot && S.pot.where === 'tray';

export const canStake = cur =>
  S.casinoOpen && !S.pot && !busy() && stakeOf(cur) > 0 && purseOf(cur) >= stakeOf(cur);

// The pot is standing in the hopper and nothing is moving: the floor can open.
export const canLet = () => inHopper() && !busy();

// A pot can be taken whenever it is standing in the tray and nothing is still
// moving. It used to wait for the hole to have room for the whole of it, from
// when a full hole turned grains away and a pot with nowhere to land was a pot
// lost. The hole does not refuse any more -- the first grain it cannot take
// tears the rift and goes through it, see `throughRift` in pit.js -- so a
// winnings row that stayed dead over a full hole was a bet you had won and
// could not collect, for a rule about sand that no longer holds.
export const canBank = () => inTray() && !busy();

// And putting the same pot back on the roof.
export const canRide = () => inTray() && !busy();

// The chip goes down and the stake comes down: one gesture. What happens now is
// that the pot rains out of the sky into the hopper -- see `trickleIn` -- and
// the let-go opens the moment the heap is lying still.
export function stake(cur) {
  if (!canStake(cur)) return;
  const n = stakeOf(cur);
  if (cur === 'dust') spend(n);
  // Out of the hole first, and off what the rift holds for the rest: a stake is
  // spending like any other. See `spendHeld` in pit.js.
  else if (cur === 'shard') { S.shards -= n; spendHeld(n, SHARD_CELL); }
  else if (cur === 'spore') { S.spores -= n; spendHeld(n, SPORE_CELL); }
  S.pot = { cur, stake: n, n, where: 'hopper' };
  S.hand = null;                                 // the last one is old news now
  S.pouring = true;
  stopAttract();                                 // the machine has a player
  S.dirty = true;
  buildShop();
}

// --- the handful ------------------------------------------------------------------
// How many grains go down the board for this pot: the handful, or the whole pot
// when the pot is smaller than a handful, because a grain cannot carry less
// than one.
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
// column 0 is the left edge of the bins; a grain enters at the middle column,
// and since every row moves it one cell across, its column keeps the parity
// of its row -- which is why a peg stands under every seat it can reach and
// nowhere it cannot, and the pegs draw the odds.
export const START_COL = BOARD_COLS / 2 - 1;
export const seatRow = k => BOARD_AIR + k * PEG_ROW_H - 1;      // where a grain sits on peg row k
export const pegRow = k => BOARD_AIR + k * PEG_ROW_H;           // and where the peg itself is
export const hasPeg = (k, c) => Math.abs(c - START_COL) <= k && ((c - START_COL + k) & 1) === 0;
// Where the field stands in the world.
export const fieldAt = () => ({
  x: casino.x + CASINO_MARGIN * P,
  y: casino.y + (HOPPER_H + GATE_H + CASINO_SIGN_H) * P
});
// The cell a grain in bin b at index i is drawn at: two columns, filled flat
// from the floor, alternating.
export const binCell = (b, i) => [b * BIN_W + (i % BIN_W), FIELD_H + BIN_H - 1 - Math.floor(i / BIN_W)];
// Which bin a field column is over.
const binAt = c => Math.max(0, Math.min(CASINO_BINS.length - 1, Math.floor(c / BIN_W)));

// A grain about to go down the pegs: its column and row on the face, in cells
// (negative rows are the gate and the sign band above the field), its ten
// coins, and its shade. It starts in the gate.
const makeGrain = (s, demo = false) => ({
  c: START_COL, r: -(GATE_H + CASINO_SIGN_H), k: 0, seat: false, beat: 0, acc: 0,
  path: drawPath(), s, demo, landed: false
});

// Let it go. The floor splits from the middle and a handful of the heap comes
// out grain by grain, each drawing its path as it leaves. What is left of the
// heap once the handful has gone lifts off and fades, because it was the
// picture of the pot and the pot is on the board now.
export function letGo() {
  if (!canLet()) return;
  S.drop = {
    at: now(), lastSent: -Infinity, sent: 0, handful: handfulFor(S.pot.n),
    grains: [], bins: CASINO_BINS.map(() => []),
    stage: 'drop', holdAt: 0, payAt: 0, payIdx: 0, paid: 0, edge: false, payFrom: null
  };
  S.hand = null;
  S.dirty = true;
  buildShop();
}

// One grain out of the gate. The heap is taken from the bottom over the
// opening -- the two columns the floor is open at, then the nearest column with
// a grain on the floor -- so what you see is the heap draining into the gap
// rather than being skimmed off the top. The rest of the column comes down a
// row by the sand's own rules.
const gateCols = () => {
  const mid = table.cols / 2;
  return [mid - GATE_W / 2, mid + GATE_W / 2 - 1].map(Math.floor);
};
function takeFromHopper() {
  const [g0, g1] = gateCols();
  for (let d = 0; d < table.cols; d++) {
    for (const c of d ? [g0 - d, g1 + d] : [g0, g1]) {
      if (c < 0 || c >= table.cols) continue;
      const v = at(table, c, 0);
      if (v) { put(table, c, 0, 0); return v; }
    }
  }
  // nothing on the floor anywhere: the topmost grain there is
  const c = topmostColumn(table);
  if (c < 0) return 0;
  const r = topRow(table, c);
  const v = at(table, c, r);
  put(table, c, r, 0);
  return v;
}

function sendGrains(dt) {
  const d = S.drop;
  if (d.sent >= d.handful) return;
  const t = now();
  if (t - d.at < CASINO_GATE_MS) return;                  // the floor is still opening
  if (t - d.lastSent < CASINO_GRAIN_GAP_MS) return;
  const v = takeFromHopper();
  if (!v) return;                                         // the heap has not slid in yet
  d.grains.push(makeGrain(v));
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
        const outer = Math.abs(g.c - START_COL) === CASINO_PEG_ROWS - 1;
        if (outer && (right === (g.c < START_COL))) flashEdge(g.c < START_COL ? 0 : CASINO_BINS.length - 1, false);
      }
      g.c += right ? 1 : -1;
      g.r++;
      g.k++;
      continue;
    }
    // below the pegs: down into the bin, on to whatever is lying in it
    const b = binAt(g.c);
    const floor = FIELD_H + BIN_H - 1 - Math.floor(bins[b].length / BIN_W);
    if (g.r < floor) g.r++;
    if (g.r >= floor) { g.landed = true; onLand(g, b); }
  }
}

// The peg lit on the beat, the grain on it black: one flash, then gone.
function flashPeg(g) {
  const fx = S.tableFx;
  fx.pegs = fx.pegs.filter(p => now() - p.at < CASINO_FLASH_MS);
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
  d.bins[b].push(g.s);
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
  const grains = d.bins[b];
  const f = fieldAt();
  d.paid += grains.length * CASINO_BINS[b] * grainWorth();
  d.payFrom = b;
  grains.forEach((s, i) => {
    const [c, r] = binCell(b, i);
    S.tableAir.push({
      x: f.x + c * P, y: f.y + r * P,
      vx: 0, vy: 0.6 + rand() * 0.4, t: 0, s, lands: 'tray'
    });
  });
  grains.length = 0;
}

// Where extra sand for the tray comes from while the bins are paying: the chute
// under the bin that just paid, so a x39 sprouts from where its grain fell.
const chuteAt = () => {
  const f = fieldAt();
  const b = S.drop?.payFrom ?? Math.floor(CASINO_BINS.length / 2);
  return { x: f.x + (b * BIN_W + rand() * BIN_W) * P, y: f.y + (FIELD_H + BIN_H) * P };
};

// The hand is paid. What is in the tray is the pot, the box says the multiple,
// and it is felt: a hand that pays more than it took is the burst, one that
// pays less is the dud, and dead even is quiet.
function settleHand() {
  const d = S.drop;
  const cur = S.pot.cur, stake = S.pot.stake;
  const paid = Math.round(d.paid);
  const mult = paid / stake;
  const won = paid > stake ? true : paid < stake ? false : null;
  S.pot = paid > 0 ? { cur, stake, n: paid, where: 'tray' } : null;
  S.pouring = !!S.pot;                           // the tray walks to what the pot says
  S.drop = null;
  S.hand = { won, mult, n: paid, cur, at: now(), bursts: 0,
             fountains: won ? CASINO_BURST_AT.filter(k => mult > k).length : 0, edge: d.edge };
  if (d.edge && won) { S.hand.fountains = CASINO_BURST_AT.length; S.tableFx.strobeAt = now() + CASINO_WIN_MS; }
  // the notices read the difference: fifty thousand up or fifty thousand down
  noteHand(paid >= stake, Math.abs(paid - stake), CASINO_BIG);
  shakeView(CASINO_KNOCK);
  const x = casino.x + casino.w / 2;
  if (won) sfx('jackpot', { x, big: true });
  else if (won === false) sfx('dud', { x });
  S.dirty = true;
  buildShop();
}

// One frame of the hand on the board.
function stepDrop(dt) {
  const d = S.drop;
  const t = now();
  if (d.stage === 'drop') {
    sendGrains(dt);
    for (const g of d.grains) stepGrain(g, dt, d.bins, pegHit, binHit);
    if (d.sent >= d.handful && d.grains.every(g => g.landed)) { d.stage = 'hold'; d.holdAt = t; d.grains = []; }
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
  const bins = CASINO_BINS.map(() => []);
  stepGrain(a.grain, dt, bins, pegHit, g => {
    const { x, y } = worldOf(g);
    S.tableAir.push({ x, y, vx: (rand() - 0.5) * 0.35, vy: -(0.3 + rand() * 0.5), up: true, fade: true, t: 0, s: g.s });
    a.grain = null;
    a.next = now() + CASINO_ATTRACT_S * 1000;
  });
}
function stopAttract() {
  const g = S.attract?.grain;
  if (g) {
    const { x, y } = worldOf(g);
    S.tableAir.push({ x, y, vx: 0, vy: -(0.3 + rand() * 0.5), up: true, fade: true, t: 0, s: g.s });
  }
  S.attract = null;
}

// --- taking it, or dropping it again -------------------------------------------------
// Taking it is not a number moving from one counter to another. The pot is sand
// in the tray at the far end of the yard and the hole is at the other end, so
// what banking looks like is the whole of it going over: grain by grain, off
// the tray, up over the works in a long arc, and down into the hole where
// everything else in this game ends up. Every grain that leaves is a grain the
// hole counts when it lands -- nothing is added at this end and nothing arrives
// that did not set off.
export function bank() {
  if (!canBank()) return;
  // What flies is the heap that is there -- which past the first band is fewer
  // squares than the pot is units -- and each of them carries its share of the
  // number. `left` is the pot itself and it is paid out to the grain.
  S.paying = { cur: S.pot.cur, left: pot(), grains: Math.max(1, tray.n) };
  S.pot = null;
  S.hand = null;                                 // taken: there is nothing to report
  S.dirty = true;
  buildShop();
}

// Put the whole of it back on the roof. The tray's grains lift in a rising arc
// up the face of the building and drop into the hopper, sounding the pour's
// tick in reverse, and the pot stands there as the stake for the next handful.
// A player who watches their winnings climb back up to the roof knows exactly
// what they are about to risk, which is the whole of the bet.
export function ride() {
  if (!canRide()) return;
  S.pot = { ...S.pot, stake: S.pot.n, where: 'hopper' };
  S.hoisting = { grains: Math.max(1, tray.n), lifted: 0 };
  S.hand = null;
  S.dirty = true;
  buildShop();
}

// However much there is, it is away in about a second and a half: the rate
// every trickle here runs at.
const TRICKLE_MS = 1500;
const FLIGHT_MS = 1700;
const IN_AIR = 24000;

function hoistStep(dt) {
  const h = S.hoisting;
  let n = Math.min(tray.n, Math.max(1, Math.ceil(h.grains * (dt / TRICKLE_MS))));
  while (n-- > 0) {
    const c = topmostColumn(tray);
    if (c < 0) break;
    const r = topRow(tray, c);
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
    S.dirty = true;
  }
}

function payOutStep(dt) {
  const p = S.paying;
  let n = Math.min(p.grains, Math.max(1, Math.ceil(p.grains * (dt / TRICKLE_MS))));
  const find = potShade(p.cur);
  while (n-- > 0 && p.grains > 0) {
    let x = tray.x + tray.cols * P / 2, y = S.groundY - P, v = find ? someFind(find) : 4;
    const c = topmostColumn(tray);                 // off the heap if there is any left
    if (c >= 0) {
      const r = topRow(tray, c);
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
    S.tableAir.push({
      x, y, s: v, t: 0, worth,
      // Not a ballistic lob: the hole is three thousand pixels away and the arc
      // that gets there under gravity is one that leaves the sky. This is a
      // thrown line with a hump in it, which is what a long throw looks like.
      arc: { x0: x, y0: y, x1: pit.x + rand() * Math.min(700, pit.w),
             y1: S.groundY - P * 2, k: 0, high: P * 30 + rand() * P * 30, ms: FLIGHT_MS }
    });
  }
  if (p.grains < 1 && p.left < 1) { S.paying = null; S.dirty = true; }
}

// --- the two plots ---------------------------------------------------------------------
// Both are walled: a heap stands up to the rim and then walks sideways, so an
// all-in is a full hopper rather than a spire. Where the stake rains to: the
// middle of the hopper, from a little way up.
export const potAt = () => ({
  x: Math.round((table.x + table.cols * P / 2) / P) * P,
  y: Math.round(table.y / P) * P
});

export function wireTable() {
  if (!table.painter) table.painter = makePainter(table);
  table.onPut = table.painter.mark;
  table.blocked = null;
  table.ceiling = () => HOPPER_H;
  table.repose = true;
  resizeGrid(table);
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
  if (table.grid) fillFlat(table, 0);
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
export const shownFor = n =>
  n <= CASINO_PILE_ONE ? Math.max(0, Math.floor(n))
    : Math.min(CASINO_PILE_BRIM,
               Math.round(CASINO_PILE_ONE +
                          CASINO_PILE_BAND * Math.log10(n / CASINO_PILE_ONE)));

// How much sand should be standing in the hopper: the pot's band while the pot
// is on the roof, less what the gate has already let out while a hand is being
// sent, and nothing once the handful is away -- the rest was the picture of a
// pot that is on the board now. Never more than the plot will actually hold:
// the brim is inside what it takes, so that clause is a backstop, but the hand
// waits on the heap reaching this number, and a plot that refused a grain with
// no way to say so would be a hand that never came.
export const tableWant = () => {
  if (!inHopper()) return 0;
  const band = Math.min(shownFor(pot()), table.capped ?? Infinity);
  return !S.drop ? band
    : S.drop.stage !== 'drop' || S.drop.sent >= S.drop.handful ? 0
    : Math.max(0, band - S.drop.sent);
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
const settledIn = (plot, want, name) =>
  airborneTo(name) === 0 && plot.n >= want && !plot.awakeN;
export const settledInPile = () =>
  !S.paying && !S.hoisting &&
  (inHopper() ? settledIn(table, tableWant(), 'hopper') : inTray() ? settledIn(tray, trayWant(), 'tray') : true);

export const potShade = cur =>
  cur === 'shard' ? SHARD_CELL : cur === 'spore' ? SPORE_CELL : 0;

function trickleIn(dt, plot, name, want, from) {
  const have = plot.n + airborneTo(name);
  let n = Math.min(want - have, Math.max(1, Math.ceil((want - have) * (dt / TRICKLE_MS))));
  const find = potShade(S.pot?.cur);
  while (n-- > 0) {
    const shade = find ? someFind(find) : 1 + Math.floor(rand() * SHADES.length);
    const { x, y } = from();
    if (S.tableAir.length < IN_AIR) {
      S.tableAir.push({ x, y, vx: (rand() - 0.5) * 0.3, vy: 0.9 + rand() * 0.8, t: 0, s: shade, lands: name });
    } else if (!addGrain(plot, x, null, shade)) {
      plot.capped = plot.n;
      break;
    }
  }
}

// Out of the sky a little way up rather than from the top of the world: high
// enough to read as coming down and near enough that the heap grows while you
// are watching it.
const skyOver = () => ({
  x: potAt().x + (rand() - 0.5) * P * (table.cols - 2),
  y: table.y - P * 24 - rand() * P * 10
});

// And going the other way: grains lifted off the top of the heap, one at a
// time, each fading out on its way up. A pot that vanished in a frame was a
// number being set to zero; this is it *leaving*.
function drainOut(dt, plot, want) {
  let n = Math.min(plot.n - want, Math.max(1, Math.ceil((plot.n - want) * (dt / TRICKLE_MS))));
  while (n-- > 0) {
    const c = topmostColumn(plot);
    if (c < 0) break;
    const r = topRow(plot, c);
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

// The tallest column with anything in it, so a heap comes apart from the top
// rather than being eaten from one end. Where it starts looking walks, so the
// same side is not always the one that goes first.
let drainAt = 0;
function topmostColumn(plot) {
  let best = -1, high = -1;
  for (let i = 0; i < plot.cols; i++) {
    const c = (drainAt + i) % plot.cols;
    const r = topRow(plot, c);
    if (r > high) { high = r; best = c; }
  }
  drainAt = (drainAt + 7) % Math.max(1, plot.cols);
  return best;
}

// One frame of the two plots: each walks to what it should hold, and settles.
export function stepTable(dt) {
  if (!S.casinoOpen || !table.grid || !tray.grid) return;
  if (table.capped != null && table.n < table.capped) table.capped = null;   // room again
  if (tray.capped != null && tray.n < tray.capped) tray.capped = null;
  if (S.paying) payOutStep(dt);
  if (S.hoisting) hoistStep(dt);
  const hw = tableWant(), tw = trayWant();
  // the hopper: the stake raining in, or the rest of a let-go heap leaving. Not
  // while the tray is being hoisted into it -- that is the pour, the other way up.
  if (!S.hoisting) {
    if (table.n + airborneTo('hopper') < hw) trickleIn(dt, table, 'hopper', hw, skyOver);
    else if (table.n > hw) drainOut(dt, table, hw);
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
        // One square off the heap is worth its band, and the hole takes the
        // whole of it: down there the pile *is* the dust, and that rule outranks
        // the reading over here.
        for (let w = k.worth ?? 1; w > 0; w--) if (!bankDust(a.x1, k.s)) break;
        S.tableAir.splice(i, 1);
      }
      continue;
    }
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
        if (!addGrain(plot, k.x, null, k.s)) plot.capped = plot.n;
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
  if (S.pouring && settledInPile()) { S.pouring = false; S.dirty = true; buildShop(); }
  if (S.drop) stepDrop(dt);
  stepAttract(dt);
  // A win's fountains go up a beat apart rather than all at once: three bursts
  // read as a celebration, one reads as a hiccup.
  if (S.hand?.won && S.hand.bursts < S.hand.fountains &&
      now() - S.hand.at >= S.hand.bursts * CASINO_BURST_GAP_MS) { burst(); S.hand.bursts++; }
  if (S.hand && now() - S.hand.at > CASINO_SAY_MS) { S.hand = null; S.dirty = true; }
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

// --- the board ---------------------------------------------------------------
// Three rows to put something down, one to let it go, and two to decide what
// happens to what came back -- and never both sets at once: a table with a pot
// on it is not a table you can stake at.
//
// A stake row is priced like any other row on any other board -- a mark and a
// number -- because that is exactly what it is: this much, out of your hands,
// now. The decisions are not priced at all, so they carry what they are about.
const STAKES = [
  // Named by the coin: three cards all reading STAKE differed by a seven-pixel
  // mark in the price column (critics 2026-09-10, C6).
  { key: 'stakedust', name: 'stake pebbles', cur: 'dust' },
  { key: 'stakeshard', name: 'stake ore', cur: 'shard' },
  { key: 'stakespore', name: 'stake crops', cur: 'spore' }
];

const seen = cur => cur === 'shard' ? S.seenShard : cur === 'spore' ? S.seenSpore : true;

// the mark of whatever is on the table, written the way the boards write marks
const MARKOF = cur => `<i class="${cur || 'dust'}"></i>`;

export const CASINO_UPGRADES = [
  // How much goes down, on a dial rather than as four rows a currency. It is the
  // one row on this board that spends nothing, exactly like the roster's job
  // rows: a setting between two buttons, not a purchase.
  {
    key: 'chip',
    name: 'chips',
    dial: true,
    value: chipName,
    less: () => pickChip(-1),
    more: () => pickChip(1),
    lo: () => S.chip <= 0,
    hi: () => S.chip >= CASINO_CHIPS.length - 1,
    show: () => S.casinoOpen && !S.pot && !busy()
  },
  // A stake is written like a price -- a mark and a number, this much out of
  // your hands, now -- but it is not a purchase and it does not go through the
  // buying machinery: `stake` takes what it takes, and the row is dead when it
  // could not.
  ...STAKES.map(t => ({
    key: t.key,
    name: t.name,
    price: () => `${MARKOF(t.cur)} ${stakeOf(t.cur)}`,
    cost: () => stakeOf(t.cur),
    currency: t.cur,
    dead: () => !canStake(t.cur),
    buy: () => stake(t.cur),
    // A row for a currency you have never seen is a row naming a thing you have
    // not met, which is the one rule every board in this game keeps.
    show: () => S.casinoOpen && !S.pot && !busy() && seen(t.cur)
  })),
  // Let it go: the floor opens and the handful comes down. It carries the pot,
  // which is what is going down the board and the number the decision is
  // about; what it might come back as is written on the bins.
  {
    key: 'letgo',
    name: 'let it go',
    price: () => `${MARKOF(S.pot?.cur)} ${pot()}`,
    cost: () => 0,
    dead: () => !canLet(),
    buy: letGo,
    show: () => S.casinoOpen && inHopper()
  },
  {
    key: 'bank',
    name: 'bank it',
    price: () => `${MARKOF(S.pot?.cur)} ${pot()}`,
    cost: () => 0,
    dead: () => !canBank(),
    buy: bank,
    show: () => S.casinoOpen && inTray()
  },
  {
    key: 'ride',
    name: 'drop again',
    // What goes back up to the roof, which is what the next hand is played for.
    price: () => `${MARKOF(S.pot?.cur)} ${pot()}`,
    cost: () => 0,
    dead: () => !canRide(),
    buy: ride,
    show: () => S.casinoOpen && inTray()
  }
];

export const CASINO_SECTIONS = [
  { title: 'the hopper', keys: ['chip', 'stakedust', 'stakeshard', 'stakespore', 'letgo'] },
  { title: 'the tray', keys: ['bank', 'ride'] }
];
