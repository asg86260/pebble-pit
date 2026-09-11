// The casino: the one place in the yard that makes nothing.
//
// Everywhere else, a thing you buy does something for ever after. This takes
// what you have and hands some of it back, and the whole of it is a decision you
// keep making rather than a purchase you make once.
//
// **The building is the machine.** The stake pours out of the sky into a tray
// on the roof and stands there as a heap -- that heap is the pot, one grain a
// dust. You call a slot, one of seven along the foot of the building, and let it
// go: the tray floor gives way and the whole heap drains through a field of pegs
// on the building's face, settled by the same falling-sand rules the yard and
// the hole use, with the pegs as cells that never move. What lands in the slot
// you called is paid at that slot's rate and flies to the hole grain by grain;
// what lands anywhere else lifts off and fades. Then the next hand is a new chip.
//
// Nothing about where the sand goes is decided in advance. The one thing that
// is picked is where the floor opens -- one of a handful of places along the
// tray, chosen when you let go and drawn as a hole in the roof -- and the sand
// does the rest on its own. See DESIGN.md, "The sand board".
//
// There was a wheel here, even money, and it is gone: a building with a wheel
// and a board in it is two buildings, and the board is the one that uses the
// sand.

import { CASINO_KNOCK, CASINO_WIN_KNOCK, TABLE_LIFE, TABLE_GRAV, CASINO_CHIPS, CASINO_SAY_MS,
         CASINO_PILE_ONE, CASINO_PILE_BAND, CASINO_PILE_BRIM,
         TRAY_H, CASINO_SIGN_H, BOARD_AIR, PEG_ROWS, PEG_ROW_H, SLOT_H, SLOTS, SLOT_W, SLOT_PITCH,
         BOARD_COLS, BOARD_ROWS, GATES, GATE_W, SLOT_RATES, GATE_DROP_V,
         P, SHADES, SHARD_CELL, SPORE_CELL, ROCK_CELL, someFind, CASINO_BIG } from './config.js';
import { S, pit, casino, table, board } from './state.js';
import { noteHand } from './notices.js';
import { makePainter } from './painter.js';
import { addGrain, resizeGrid, settleSome, at, put, bottomY, surfaceY, fillFlat } from './grid.js';
import { shakeView } from './world.js';
import { now, frames } from './clock.js';
import { spend, bankDust, spendHeld, pitRoom } from './pit.js';
import { buildShop } from './shop.js';
import { rand } from './rng.js';

// What is on the roof right now, and nothing about it moves on its own: a pot
// is what the last chip put there, until it is let go.
export const pot = () => S.pot ? S.pot.n : 0;

// The chip is down and the stake is still on its way to the roof. This is not a
// wait dressed up as one -- it is the pot arriving, which is the thing the hand
// is about, and it ends on the frame the last grain of it comes to rest.
// Nothing here is on a clock: see `settledInPile`.
export const pouring = () => !!S.pouring;

// The floor is open and the sand is going through the pegs.
export const letting = () => !!S.gate;

// The columns the floor is open at.
export const gateCols = () => {
  if (!S.gate) return [];
  const out = [];
  for (let c = S.gate.at; c < S.gate.at + GATE_W; c++) if (c >= 0 && c < table.cols) out.push(c);
  return out;
};

// A hand is under way, any part of it: the stake is coming down, the sand is
// going through the board, the slots you did not call are lifting off, or the
// one you did is on its way to the hole. Between the chip going down and the
// board standing empty the only thing you can press is the call, and only until
// you let go.
export const busy = () => pouring() || letting() || !!S.clearing || !!S.paying;

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

// --- the call -----------------------------------------------------------------
// Which slot the sand has to land in for you to be paid. A setting, like the
// chip: it stays called from hand to hand, and it can be moved right up until
// the floor opens.
export const slot = () => Math.max(0, Math.min(SLOTS - 1, S.slot));
export const slotName = () => String(slot() + 1);
export const rateOf = k => SLOT_RATES[Math.max(0, Math.min(SLOTS - 1, k))];

export function pickSlot(d) {
  if (letting()) return;
  S.slot = Math.max(0, Math.min(SLOTS - 1, S.slot + d));
  S.dirty = true;
  buildShop();
}

export const canStake = cur =>
  S.casinoOpen && !S.pot && !busy() && stakeOf(cur) > 0 && purseOf(cur) >= stakeOf(cur);

// Everything in this game ends up in the hole and the hole has a limit -- but
// that is the win's problem, not the call's: a win the hole will not take waits
// in its slot until there is room (see `stepTable`), the same as a core the
// hole refuses waits on the ground by the lip.
export const canLet = () => !!S.pot && !busy();

// The chip goes down and the sand comes down: one gesture. Putting something on
// the roof and then having to press a second thing to see it arrive is a form,
// not a bet -- but the bet itself is the call, and that stays yours to change
// until you let it go.
export function stake(cur) {
  if (!canStake(cur)) return;
  const n = stakeOf(cur);
  if (cur === 'dust') spend(n);
  // Out of the hole first, and off what the rift holds for the rest: a stake is
  // spending like any other. See `spendHeld` in pit.js.
  else if (cur === 'shard') { S.shards -= n; spendHeld(n, SHARD_CELL); }
  else if (cur === 'spore') { S.spores -= n; spendHeld(n, SPORE_CELL); }
  S.pot = { cur, stake: n, n };
  S.hand = null;                                 // the last one is old news now
  S.pouring = true;
  S.dirty = true;
  buildShop();
}

// Let it go. The floor opens somewhere along the tray -- picked now, and drawn,
// so what you are watching is the thing deciding -- and the tray stops heaping
// so the sand runs to the hole in it like sand through a glass.
export function letGo() {
  if (!canLet()) return;
  S.gate = { at: GATES[Math.floor(rand() * GATES.length)], since: now() };
  S.hand = null;
  table.repose = false;
  S.dirty = true;
  buildShop();
}

// --- the tray, on the roof ----------------------------------------------------
// Where the stake rains to: the middle of the tray, from a little way up.
export const potAt = () => ({
  x: Math.round((casino.x + casino.w / 2) / P) * P,
  y: Math.round(table.y / P) * P
});

export function wireTable() {
  if (!table.painter) table.painter = makePainter(table);
  table.onPut = table.painter.mark;
  table.blocked = null;
  // A heap on the roof stands up to the rim and no further: past that it walks
  // sideways, which is what a tray is for.
  table.ceiling = () => TRAY_H;
  table.repose = !letting();
  resizeGrid(table);
}

// --- the board, on the face ---------------------------------------------------
// Rows count up from the floor of the grid. The slots are the bottom `SLOT_H`
// rows, with a wall of fixed cells between each pair; the pegs stand above
// them, a row every `PEG_ROW_H`, on the slot pitch and staggered half a pitch
// each row; and there is a band of air at the top for the sheet to fan out in.
const pegCells = [];
{
  const top = SLOT_H;
  for (let j = 0; j < PEG_ROWS; j++) {
    const r = top + j * PEG_ROW_H + 1;
    const off = j % 2 ? SLOT_PITCH / 2 + 1 : 1;
    for (let c = off; c < BOARD_COLS; c += SLOT_PITCH) pegCells.push([c, r]);
  }
  for (let k = 0; k < SLOTS - 1; k++)
    for (let r = 0; r < SLOT_H; r++) pegCells.push([k * SLOT_PITCH + SLOT_W, r]);
}
export const PEGS = pegCells;
const isPeg = (c, r) => at(board, c, r) === ROCK_CELL;

// Which slot a column belongs to, or -1 for a wall. A grain that comes to rest
// on top of a wall is nobody's.
export const slotOf = c => (c % SLOT_PITCH === SLOT_W ? -1 : Math.floor(c / SLOT_PITCH));
export const slotCols = k => Array.from({ length: SLOT_W }, (_, i) => k * SLOT_PITCH + i).filter(c => c < BOARD_COLS);

// What is lying in the board, pegs and walls aside.
export const boardGrains = () => board.n - PEGS.length;
export const inSlot = k => {
  let n = 0;
  for (const c of slotCols(k)) for (let r = 0; r < board.rows; r++) if (at(board, c, r) && !isPeg(c, r)) n++;
  return n;
};
export const slotCounts = () => Array.from({ length: SLOTS }, (_, k) => inSlot(k));

// The sand itself is never saved: a reset or a reload starts the building
// empty, and a pot that was on the roof comes back pouring on to it again.
export function clearCasino() {
  if (table.grid) fillFlat(table, 0);
  if (board.grid) { fillFlat(board, 0); for (const [c, r] of PEGS) put(board, c, r, ROCK_CELL); }
  table.capped = null;
  table.repose = true;
}

export function wireBoard() {
  if (!board.painter) board.painter = makePainter(board);
  board.onPut = board.painter.mark;
  board.blocked = null;
  board.ceiling = null;
  board.repose = false;                 // a slot fills flat, like the hole
  board.fixed = isPeg;
  resizeGrid(board);
  // the pegs and the walls, back in place if the grid was remade
  for (const [c, r] of PEGS) if (at(board, c, r) !== ROCK_CELL) put(board, c, r, ROCK_CELL);
}

// --- the bands ----------------------------------------------------------------
// How much sand a pot puts on the roof. Up to `CASINO_PILE_ONE` it is the pot
// itself, one grain a unit. Past that the heap is a *reading* of the pot rather
// than a count of it -- a tenfold pot for `CASINO_PILE_BAND` more grains, on the
// log of the pot so nothing jumps, and never more than the brim. See config.js.
export const shownFor = n =>
  n <= CASINO_PILE_ONE ? Math.max(0, Math.floor(n))
    : Math.min(CASINO_PILE_BRIM,
               Math.round(CASINO_PILE_ONE +
                          CASINO_PILE_BAND * Math.log10(n / CASINO_PILE_ONE)));

// How much sand should be standing in the tray: the band, and never more than
// the tray will actually hold. The brim is inside what the tray takes, so the
// second clause is a backstop -- but the hand waits on the heap reaching this
// number, so a tray that refused a grain with no way to say so would be a hand
// that never came. The first grain refused sets the mark, and clearing the tray
// forgets it again.
export const tableWant = () => S.pot ? Math.min(shownFor(pot()), table.capped ?? Infinity) : 0;

// What one grain is worth: one, below the first band, and its share of the pot
// above it. It lives in the picture only -- the hole is paid the exact pot's
// share however the rounding falls (see `settleHand`).
export const grainWorth = () => pot() / Math.max(1, tableWant());

// --- the trickle --------------------------------------------------------------
// Sand does not arrive all at once. It comes down out of the sky and piles up in
// the tray, and the pile growing is the thing worth watching -- so the tray is
// walked towards what the pot says rather than set to it. The rate is worked out
// from how far there is to go, so ten grains trickle and four hundred pour, and
// either is issued over about a second and a half.
const TRICKLE_MS = 1500;
const IN_AIR = 24000;

// Grains already on their way down to the tray count as arrived for the purpose
// of deciding how many more to send.
const airborne = () => S.tableAir.reduce((n, k) => n + (k.lands === 'tray' ? 1 : 0), 0);
const falling = () => S.tableAir.reduce((n, k) => n + (k.lands === 'board' ? 1 : 0), 0);

// The stake is standing in the tray: nothing left to send, nothing in the air,
// and no column of the heap still moving -- three facts about the ground rather
// than a length of time, which is what makes it an event and not a timer.
export const settledInPile = () =>
  airborne() === 0 && table.n >= tableWant() && !table.awakeN;

// And the board has taken the whole of the pour: the tray is empty, nothing is
// between the gate and the pegs, and nothing on the face is still moving.
export const settledInBoard = () =>
  table.n === 0 && falling() === 0 && !board.awakeN;

export const potShade = cur =>
  cur === 'shard' ? SHARD_CELL : cur === 'spore' ? SPORE_CELL : 0;

function trickleIn(dt, cur) {
  const want = tableWant();
  const have = table.n + airborne();
  let n = Math.min(want - have, Math.max(1, Math.ceil((want - have) * (dt / TRICKLE_MS))));
  const find = potShade(cur);
  const to = potAt();
  while (n-- > 0) {
    const shade = find ? someFind(find) : 1 + Math.floor(rand() * SHADES.length);
    if (S.tableAir.length < IN_AIR) {
      S.tableAir.push({
        x: to.x + (rand() - 0.5) * P * (table.cols - 2),
        // Out of the sky a little way up rather than from the top of the world:
        // high enough to read as coming down and near enough that the heap grows
        // while you are watching it.
        y: to.y - P * 24 - rand() * P * 10,
        vx: (rand() - 0.5) * 0.3,
        vy: 0.9 + rand() * 0.8,
        t: 0, s: shade, lands: 'tray'
      });
    } else if (!addGrain(table, to.x, null, shade)) {
      table.capped = table.n;
      break;
    }
  }
}

// --- the gate -----------------------------------------------------------------
// The tray floor is open at `S.gate`: every frame the bottom cell of each column
// over the hole drops out and falls the short way to the top of the board. The
// rest of the heap runs down into the gap by the sand's own rules, so the pour
// is the tray draining rather than a number being moved.
function drainGate() {
  for (const c of gateCols()) {
    const v = at(table, c, 0);
    if (!v) continue;
    put(table, c, 0, 0);
    S.tableAir.push({
      x: table.x + c * P, y: bottomY(table) - P,
      vx: 0, vy: GATE_DROP_V, t: 0, s: v, lands: 'board'
    });
  }
}

// The floor tips toward the hole. A grain lying on the tray floor runs a cell
// toward the gate each frame if the cell is free, and the heap above it comes
// down by the sand's own rules -- so the whole of the pot goes through the one
// hole, like sand through a glass, and where the hole is decides where the
// sheet comes down. It used to tear open outward from the gate instead, and
// that spread the pour over the whole board whatever the gate: every call paid
// about the same, which is not a bet.
function tipToGate() {
  const from = S.gate.at, to = S.gate.at + GATE_W - 1;
  // right to left on the gate's left, left to right on its right, so a row of
  // grains moves as a row rather than the nearest one blocking the rest
  for (let c = from - 1; c >= 0; c--) {
    const v = at(table, c, 0);
    if (v && !at(table, c + 1, 0)) { put(table, c, 0, 0); put(table, c + 1, 0, v); }
  }
  for (let c = to + 1; c < table.cols; c++) {
    const v = at(table, c, 0);
    if (v && !at(table, c - 1, 0)) { put(table, c, 0, 0); put(table, c - 1, 0, v); }
  }
}

// A grain that has fallen to the top of the board goes in at the top and comes
// down the pegs by the settle rules -- not `addGrain`, which would put it at the
// foot of its column, under every peg. A column full to the top does not take
// one: the grain spills to the nearest column that will, the way a heap
// spreads, and if there is none within reach it waits above the board and the
// settle clears the way. An edge gate fills its two slots to the brim, and a
// grain that only ever tried its own column hung in the air for good.
function enterBoard(k) {
  const c0 = Math.max(0, Math.min(board.cols - 1, Math.round((k.x - board.x) / P)));
  const top = board.rows - 1;
  for (let d = 0; d <= SPILL_REACH; d++) {
    for (const c of d ? [c0 - d, c0 + d] : [c0]) {
      if (c < 0 || c >= board.cols || at(board, c, top)) continue;
      put(board, c, top, k.s);
      return true;
    }
  }
  k.y = board.y - P; k.vy = 0;
  return false;
}
const SPILL_REACH = 8;                 // columns either side a grain will spill to: a slot and a half

// --- the hand settling --------------------------------------------------------
// The board has taken the whole pour. What is in the called slot is the win,
// paid at the slot's rate on the pot's share each grain carries; everything else
// lifts off. Both leave the board grain by grain -- the win over the works to the
// hole, the rest up and gone -- and the hand is over when the face is empty.
function settleHand() {
  const k = slot();
  const counts = slotCounts();
  const total = Math.max(1, boardGrains());
  const won = counts[k];
  const cur = S.pot.cur;
  const paid = Math.round(pot() * (won / total) * rateOf(k));
  S.paying = paid > 0 ? { cur, left: paid, grains: won, cols: slotCols(k) } : null;
  S.clearing = true;
  S.hand = { won: paid >= S.pot.stake, n: paid, cur, at: now(), rate: rateOf(k), slot: k, counts };
  noteHand(paid >= S.pot.stake, paid >= S.pot.stake ? paid : S.pot.stake, CASINO_BIG);
  shakeView(paid >= S.pot.stake ? CASINO_WIN_KNOCK : CASINO_KNOCK);
  S.pot = null;
  S.gate = null;
  table.capped = null;
  table.repose = true;
  S.dirty = true;
  buildShop();
}

// The win going over: grains lifted off the called slot and thrown across the
// yard, each carrying its share of what was paid. The rate is the same as
// everything else here -- however much there is, it is away in about a second
// and a half.
const FLIGHT_MS = 1700;

function payOutStep(dt) {
  const p = S.paying;
  let n = Math.min(p.grains, Math.max(1, Math.ceil((p.grains * dt) / TRICKLE_MS)));
  const find = potShade(p.cur);
  while (n-- > 0 && p.grains > 0) {
    let x = casino.x + casino.w / 2, y = S.groundY - P, v = find ? someFind(find) : 4;
    const c = topmostColumn(p.cols);           // off the slot, if there is any left in it
    if (c >= 0) {
      const r = topGrain(c);
      v = at(board, c, r);
      x = board.x + c * P;
      y = bottomY(board) - (r + 1) * P;
      put(board, c, r, 0);
    }
    // Its share of what was paid, and never less than one: whatever the
    // rounding leaves over rides on the last grain, so the hole is paid the
    // exact figure rather than the figure give or take the arithmetic.
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
             y1: S.groundY - P * 2, k: 0, high: P * 30 + rand() * P * 30 }
    });
  }
  if (p.grains < 1 && p.left < 1) { S.paying = null; S.dirty = true; }
}

// The slots you did not call: their grains lift off the board one at a time,
// each fading out on its way up. A pot that vanished in a frame was a number
// being set to zero; this is it *leaving*.
function clearStep(dt) {
  const keep = S.paying ? S.paying.cols : [];
  const cols = [];
  for (let c = 0; c < board.cols; c++) if (!keep.includes(c)) cols.push(c);
  const left = cols.reduce((n, c) => n + colGrains(c), 0);
  if (left === 0) { if (!S.paying) S.clearing = false; return; }
  let n = Math.min(left, Math.max(1, Math.ceil((left * dt) / TRICKLE_MS)));
  while (n-- > 0) {
    const c = topmostColumn(cols);
    if (c < 0) break;
    const r = topGrain(c);
    const v = at(board, c, r);
    put(board, c, r, 0);
    S.tableAir.push({
      x: board.x + c * P,
      y: bottomY(board) - (r + 1) * P,
      vx: (rand() - 0.5) * 0.35,
      vy: -(0.3 + rand() * 0.5),
      up: true, fade: true, t: 0, s: v
    });
  }
}

// The topmost grain in a column, pegs and walls aside, or -1. `topRow` finds
// the topmost *cell*, and in a peg column that is a peg with the grains lying
// under it -- so a slot read that way emptied down to one grain a column and
// stopped.
const topGrain = c => {
  for (let r = board.rows - 1; r >= 0; r--) if (at(board, c, r) && !isPeg(c, r)) return r;
  return -1;
};

// grains in a column, pegs and walls aside
const colGrains = c => {
  let n = 0;
  for (let r = 0; r < board.rows; r++) if (at(board, c, r) && !isPeg(c, r)) n++;
  return n;
};

// The tallest column with a grain in it, among these, so a heap comes apart
// from the top rather than being eaten from one end. Where it starts looking
// walks, so the same side is not always the one that goes first.
let drainAt = 0;
function topmostColumn(cols) {
  let best = -1, high = -1;
  for (let i = 0; i < cols.length; i++) {
    const c = cols[(drainAt + i) % cols.length];
    const r = topGrain(c);
    if (r > high) { high = r; best = c; }
  }
  drainAt = (drainAt + 7) % Math.max(1, cols.length);
  return best;
}

// --- one frame ------------------------------------------------------------------
export function stepTable(dt) {
  if (!S.casinoOpen || !table.grid || !board.grid) return;
  if (table.capped != null && table.n < table.capped) table.capped = null;
  if (S.pouring && table.n + airborne() < tableWant()) trickleIn(dt, S.pot?.cur);
  if (letting()) { drainGate(); tipToGate(); }
  // A pot has to have somewhere to land: the win waits in its slot while the
  // hole is full, and a full hole is a reason to dig rather than a hand you lose.
  if (S.paying && pitRoom() >= S.paying.left) payOutStep(dt);
  if (S.clearing) clearStep(dt);
  settleSome(table, 6000);
  settleSome(board, 6000);
}

// One frame of the grains in the air: they rise, they fall, they land in the
// tray or the board, or they fade out, or they arrive at the hole.
export function stepSparks(dt) {
  const f = frames();
  for (let i = S.tableAir.length - 1; i >= 0; i--) {
    const k = S.tableAir[i];
    if (!k.up && k.lands !== 'board') k.vy += TABLE_GRAV * f;
    k.x += k.vx * f;
    k.y += k.vy * f;
    k.t += dt / 1000;
    // A grain on its way to the hole: along its arc, and into the pile when it
    // gets there. This is the one that is actually worth something.
    if (k.arc) {
      const a = k.arc;
      a.k = Math.min(1, a.k + dt / FLIGHT_MS);
      k.x = a.x0 + (a.x1 - a.x0) * a.k;
      k.y = a.y0 + (a.y1 - a.y0) * a.k - Math.sin(a.k * Math.PI) * a.high;
      if (a.k >= 1) {
        // One square off the slot is worth its share, and the hole takes the
        // whole of it: down there the pile *is* the dust.
        for (let w = k.worth ?? 1; w > 0; w--) if (!bankDust(a.x1, k.s)) break;
        S.tableAir.splice(i, 1);
      }
      continue;
    }
    // A grain coming down out of the sky is one of the pot arriving: it stops
    // being a thing in the air and becomes a grain in the tray.
    if (k.lands === 'tray') {
      const c = Math.max(0, Math.min(table.cols - 1, Math.round((k.x - table.x) / P)));
      if (k.y >= surfaceY(table, c)) {
        if (!addGrain(table, k.x, null, k.s)) table.capped = table.n;
        S.tableAir.splice(i, 1);
      }
      continue;
    }
    // A grain out of the gate: the short fall to the top of the board, and in.
    if (k.lands === 'board') {
      if (k.y >= board.y - P && enterBoard(k)) S.tableAir.splice(i, 1);
      continue;
    }
    // A rising one goes until its time is up, because what it is doing is
    // leaving; a plain falling one is scenery and stops at the ground.
    if (k.t > TABLE_LIFE || (!k.up && k.y >= S.groundY - P)) S.tableAir.splice(i, 1);
  }
}

export function stepCasino(dt) {
  if (!S.casinoOpen) return;
  stepSparks(dt);
  // The stake is standing in the tray: the pour is over, and the call is yours
  // until you let it go.
  if (S.pouring && settledInPile()) { S.pouring = false; S.dirty = true; buildShop(); }
  // The board has taken the lot: what is in the called slot is the answer.
  if (letting() && settledInBoard()) settleHand();
  if (S.hand && now() - S.hand.at > CASINO_SAY_MS) { S.hand = null; S.dirty = true; }
}

// what the yard should be showing over the building, if anything
export const saying = () => S.hand ? (S.hand.won ? 'won' : 'lost') : null;

// --- the board ---------------------------------------------------------------
// Three rows to put something down, one to call, one to let it go. A stake row
// is priced like any other row on any other board -- a mark and a number --
// because that is exactly what it is: this much, out of your hands, now. The
// call is a dial, and letting go is not priced at all: it carries what the
// called slot would pay if the whole pour landed in it, which is the number the
// decision is about.
const STAKES = [
  { key: 'stakedust', name: 'stake', cur: 'dust' },
  { key: 'stakeshard', name: 'stake', cur: 'shard' },
  { key: 'stakespore', name: 'stake', cur: 'spore' }
];

const seen = cur => cur === 'shard' ? S.seenShard : cur === 'spore' ? S.seenSpore : true;

// the mark of whatever is on the roof, written the way the boards write marks
const MARKOF = cur => `<i class="${cur || 'dust'}"></i>`;

export const CASINO_UPGRADES = [
  // How much goes down, on a dial rather than as four rows a currency. It is a
  // setting between two buttons, not a purchase.
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
  // The call: which slot, one to seven, left to right along the foot of the
  // building. The rate it pays is written on the slot itself.
  {
    key: 'slot',
    name: 'call',
    dial: true,
    value: () => `${slotName()} (x${rateOf(slot())})`,
    less: () => pickSlot(-1),
    more: () => pickSlot(1),
    lo: () => S.slot <= 0 || letting(),
    hi: () => S.slot >= SLOTS - 1 || letting(),
    show: () => S.casinoOpen
  },
  {
    key: 'letgo',
    name: 'let it go',
    // What it is worth if the whole of it lands where you called, which is the
    // number the decision is about. The odds are on the board.
    price: () => `${MARKOF(S.pot?.cur)} ${Math.floor(pot() * rateOf(slot()))}`,
    cost: () => 0,
    // the sand is still coming down, or the floor is already open, or the hole
    // could not take the best of it: either way there is nothing to press
    dead: () => !canLet(),
    buy: letGo,
    show: () => S.casinoOpen && !!S.pot
  }
];

export const CASINO_SECTIONS = [
  { title: 'the roof', keys: ['chip', 'stakedust', 'stakeshard', 'stakespore'] },
  { title: 'the call', keys: ['slot', 'letgo'] }
];
