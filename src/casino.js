// The casino: the one place in the yard that makes nothing.
//
// One table, one pot, and putting a chip down is the spin. You pick how much
// (ten, a hundred, a thousand, or everything) and which of dust, shards or
// spores, and the wheel goes round: even money, doubled or gone. If it came
// off, the pot sits there and you decide again: bank it, or spin again. When
// to stop is the whole game (DESIGN.md).
//
// The wheel waits for the sand: a stake is a pot pouring out of the sky on to
// the ground beside the building, and the wheel turns its idle turn until the
// last grain is lying still, then goes round in earnest. See `pouring` and
// `settledInPile`.

import { CASINO_ODDS, CASINO_SPIN_MS, CASINO_SLICES, CASINO_WIN_SLICES, CASINO_TURNS,
         CASINO_WHEEL, CASINO_KNOCK,
         CASINO_WIN_KNOCK, TABLE_LIFE, TABLE_GRAV, CASINO_CHIPS, CASINO_SAY_MS,
         CASINO_PILE_ONE, CASINO_PILE_BAND, CASINO_PILE_BRIM,
         CASINO_BURST, CASINO_BURSTS, CASINO_BURST_GAP_MS, CASINO_BURST_UP, CASINO_BURST_SIDE,
         P, SHADES, SHARD_CELL, SPORE_CELL, someFind, CASINO_BIG } from './config.js';
import { S, pit, casino, table } from './state.js';
import { noteHand } from './notices.js';
import { makePainter } from './painter.js';
import { addGrain, resizeGrid, settleSome, topRow, at, put, bottomY, surfaceY } from './grid.js';
import { shakeView } from './world.js';
import { now, frames } from './clock.js';
import { spend, bankDust, spendHeld } from './pit.js';
import { buildShop } from './shop.js';
import { rand } from './rng.js';
import { sfx } from './audio.js';

// What is on the table right now: what the last spin left, until the next.
export const pot = () => S.pot ? S.pot.n : 0;

// The wheel is going and nothing you press does anything until it stops.
export const spinning = () => now() < S.spinUntil;

// The chip is down, the spin is owed, and the sand is still on its way. It
// ends on the frame the last grain comes to rest, never on a clock
// (`settledInPile`).
export const pouring = () => !!S.pouring;

// A hand is under way, either half of it.
export const busy = () => pouring() || spinning();

// --- the chip -----------------------------------------------------------------
// `all` is everything you are holding of whatever you stake.
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

// Never gated on the hole having room: the hole does not refuse a grain, the
// first one it cannot take tears the rift (`throughRift` in pit.js), and a
// winnings row dead over a full hole is a bet you won and cannot collect.
export const canBank = () => !!S.pot && !busy() && !S.paying;

export const canStake = cur =>
  S.casinoOpen && !S.pot && !busy() && !S.paying && stakeOf(cur) > 0 && purseOf(cur) >= stakeOf(cur);

// A pot still pouring is a pot you have already bet: the pour is part of the
// spin, not a window before it.
export const canRide = () => !!S.pot && !busy() && !S.paying;

// The chip goes down and the wheel goes round: one gesture, not two.
export function stake(cur) {
  if (!canStake(cur)) return;
  const n = stakeOf(cur);
  if (cur === 'dust') spend(n);
  // Out of the hole first, and off what the rift holds for the rest
  // (`spendHeld` in pit.js).
  else if (cur === 'shard') { S.shards -= n; spendHeld(n, SHARD_CELL); }
  else if (cur === 'spore') { S.spores -= n; spendHeld(n, SPORE_CELL); }
  S.pot = { cur, stake: n, n };
  pour();
}

// The pot rains down beside the building (`trickleIn`); the wheel is promised
// but not yet turning, and `stepCasino` starts it once the heap is lying
// still.
function pour() {
  S.hand = null;                                 // the last one is old news now
  S.pouring = true;
  S.dirty = true;
  buildShop();
}

// --- taking it, or not --------------------------------------------------------

// Banking is the heap going over to the hole grain by grain, one for one:
// every grain that leaves is a grain you watch fly and a grain the hole
// counts when it lands.
export function bank() {
  if (!canBank()) return;
  // What flies is the heap that is there (past the first band, fewer squares
  // than the pot is units), each carrying its share of the number. `left` is
  // the pot itself, paid out to the grain.
  S.paying = { cur: S.pot.cur, left: pot(), grains: Math.max(1, table.n) };
  S.pot = null;
  S.hand = null;                                 // taken: there is nothing to report
  S.dirty = true;
  buildShop();
}

// However much there is, it is away in about a second and a half.
const FLIGHT_MS = 1700;

function payOutStep(dt) {
  const p = S.paying;
  let n = Math.min(p.grains, Math.max(1, Math.ceil(p.grains * (dt / TRICKLE_MS))));
  const find = potShade(p.cur);
  while (n-- > 0 && p.grains > 0) {
    let x = potAt().x, y = S.groundY - P, v = find ? someFind(find) : 4;
    const c = topmostColumn();                   // off the heap if there is any left
    if (c >= 0) {
      const r = topRow(table, c);
      if (r >= 0) {
        v = at(table, c, r);
        x = table.x + c * P;
        y = bottomY(table) - (r + 1) * P;
        put(table, c, r, 0);
      }
    }
    // Its share of the pot, never less than one; whatever the rounding leaves
    // over rides on the last grain, so the hole is paid the exact pot.
    const worth = p.grains > 1
      ? Math.max(1, Math.min(p.left - (p.grains - 1), Math.round(p.left / p.grains)))
      : p.left;
    p.left -= worth;
    p.grains--;
    S.tableAir.push({
      x, y, s: v, t: 0, worth,
      // Not a ballistic lob: the hole is three thousand pixels away and the
      // arc that gets there under gravity leaves the sky. A thrown line with
      // a hump in it.
      arc: { x0: x, y0: y, x1: pit.x + rand() * Math.min(700, pit.w),
             y1: S.groundY - P * 2, k: 0, high: P * 30 + rand() * P * 30 }
    });
  }
  if (p.grains < 1 && p.left < 1) { S.paying = null; S.dirty = true; }
}

// Put the whole of it back on.
export const ride = () => { if (canRide()) pour(); };

// The bare slices are dealt out round the wheel rather than in one block: a
// wheel with a quarter of it blank in one piece is a wheel you can see the
// answer coming on.
export const sliceKeeps = i => (i * CASINO_WIN_SLICES) % CASINO_SLICES < CASINO_WIN_SLICES;

// The answer is picked first and the wheel is *aimed* at it: six whole turns
// and then a slice of the right color under the pointer. A wheel that decided
// when it stopped would be a wheel you could watch for a tell.
function spin() {
  S.hand = null;                                 // the last one is old news now
  S.spinWon = rand() < CASINO_ODDS;

  // a slice of the color it is going to land on, picked at random among them
  const want = [];
  for (let i = 0; i < CASINO_SLICES; i++) if (sliceKeeps(i) === S.spinWon) want.push(i);
  const slice = want[Math.floor(rand() * want.length)];
  const step = (Math.PI * 2) / CASINO_SLICES;
  // the pointer is at the top, so the wheel has to turn until that slice's
  // middle is under it
  const land = -(slice + 0.5) * step - Math.PI / 2;

  S.spinFrom = S.wheel;
  S.spinTo = S.spinFrom + CASINO_TURNS * Math.PI * 2 +
             ((land - S.spinFrom) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  S.spinAt = now();
  S.spinUntil = S.spinAt + CASINO_SPIN_MS;
  S.dirty = true;
  buildShop();
}

// Where the wheel is this frame: off its mark quickly, dragging down to a stop.
// While the stake is pouring there is a pot on the table, so it turns the
// slow idle turn: a wheel sitting dead still while sand rains down beside it
// reads as one that missed the chip going down.
function wheelAt(dt) {
  if (!spinning()) {
    if (S.spinUntil) return S.spinTo;            // exactly on its mark
    return S.wheel + (S.pot ? CASINO_WHEEL : 0) * (dt / 1000);
  }
  const k = Math.min(1, (now() - S.spinAt) / CASINO_SPIN_MS);
  const ease = 1 - Math.pow(1 - k, 3.4);         // out-cubic and a bit
  return S.spinFrom + (S.spinTo - S.spinFrom) * ease;
}

// --- the pot, standing on the ground ------------------------------------------
// The heap beside the building IS the pot: a real plot of sand, settled by the
// same code the yard and the hole use, one grain a unit up to the first band
// and a reading off the ladder in `shownFor` past it. It walks *left* past the
// building as it fills, because `addGrain` looks outward for the nearest
// column that will take one and the casino's own footprint is barred.
export const potAt = () => ({
  x: Math.round((casino.x + casino.w + P * 6) / P) * P,
  y: Math.round(S.groundY / P) * P
});

// The ground the pot may not stand on: the building itself.
const underCasino = c => {
  const x = table.x + c * P;
  return x + P > casino.x && x < casino.x + casino.w;
};

// Sand here stands up steeply, so without a ceiling a pot poured on one spot
// goes up as a spire off the top of the window. Capped at the building's own
// height and a third, it reaches its height and walks sideways. The ceiling
// trades height for width one for one; the bands are what keep the footprint
// down.
const TABLE_HIGH = 20;               // cells: the building's own height and a third

export function wireTable() {
  if (!table.painter) table.painter = makePainter(table);
  table.onPut = table.painter.mark;
  table.blocked = underCasino;
  table.ceiling = () => TABLE_HIGH;
  table.repose = true;                 // a heap on the ground stands up
  resizeGrid(table);
}

// --- the bands ----------------------------------------------------------------
// Up to `CASINO_PILE_ONE` the heap is the pot itself, one grain a unit. Past
// that it is a *reading*: the pot doubles on every ride and would run off the
// end of the ground long before it ran out of numbers, so a tenfold pot is
// `CASINO_PILE_BAND` more grains, on the log of the pot so nothing jumps, and
// never more than the brim. A double is about three hundred more grains
// wherever you are on the ladder, so a win is always visibly more sand.
export const shownFor = n =>
  n <= CASINO_PILE_ONE ? Math.max(0, Math.floor(n))
    : Math.min(CASINO_PILE_BRIM,
               Math.round(CASINO_PILE_ONE +
                          CASINO_PILE_BAND * Math.log10(n / CASINO_PILE_ONE)));

// What one grain of the heap is worth. Lives in the picture only: `payOutStep`
// pays the hole the exact pot however the rounding falls.
export const grainWorth = () => pot() / Math.max(1, tableWant());

// The band, and never more than the ground will hold. The wheel waits on the
// heap reaching this number, so a ground that refused a grain with no way to
// say so would be a wheel that never went round: the first grain refused sets
// `capped`, and clearing the plot forgets it.
export const tableWant = () => Math.min(shownFor(pot()), table.capped ?? Infinity);

// --- the trickle --------------------------------------------------------------
// The plot is walked toward what the pot says rather than set to it, over
// about a second and a half whatever the size. Every grain of the heap is
// seen: `IN_AIR` is a backstop the brim puts out of reach.
const TRICKLE_MS = 1500;
const IN_AIR = 24000;

// Grains on their way down count as arrived for deciding how many more to
// send, or the trickle keeps issuing sand for sand already in the air.
const airborne = () => S.tableAir.reduce((n, k) => n + (k.lands ? 1 : 0), 0);

// What the wheel waits on: three facts about the ground, not a length of time.
//
//   nothing left to send    the heap holds what the pot says, or as much as
//                           the ground will take (`tableWant`)
//   nothing in the air      every grain sent has landed
//   nothing still moving    the grid puts a column to sleep the moment a pass
//                           moves nothing, so a settled heap has no awake
//                           columns (grid.js)
export const settledInPile = () =>
  !S.paying && airborne() === 0 && table.n >= tableWant() && !table.awakeN;

function trickleIn(dt, cur) {
  const want = tableWant();
  const have = table.n + airborne();
  let n = Math.min(want - have, Math.max(1, Math.ceil((want - have) * (dt / TRICKLE_MS))));
  const find = potShade(cur);
  const at = potAt();
  while (n-- > 0) {
    const shade = find ? someFind(find) : 1 + Math.floor(rand() * SHADES.length);
    if (S.tableAir.length < IN_AIR) {
      S.tableAir.push({
        x: at.x + (rand() - 0.5) * P * 20,
        // A little way up, not the top of the plot: the grid stands eighty
        // cells tall, and a grain starting up there spends two seconds
        // falling before it is anything to look at.
        y: S.groundY - P * 30 - rand() * P * 14,
        vx: (rand() - 0.5) * 0.3,
        vy: 0.9 + rand() * 0.8,
        t: 0, s: shade, lands: true
      });
    // and the ones that are not worth a falling square still go in across a
    // spread of ground rather than all down one column
    } else if (!addGrain(table, at.x + (rand() - 0.5) * P * 20, table.blocked, shade)) {
      table.capped = table.n;
      break;
    }
  }
}

// Grains lifted off the top of the heap one at a time, fading on the way up:
// the pot *leaving*, not a number set to zero.
function drainOut(dt) {
  const want = tableWant();
  let n = Math.min(table.n - want, Math.max(1, Math.ceil((table.n - want) * (dt / TRICKLE_MS))));
  while (n-- > 0) {
    const c = topmostColumn();
    if (c < 0) break;
    const r = topRow(table, c);
    if (r < 0) break;
    const v = at(table, c, r);
    put(table, c, r, 0);
    if (S.tableAir.length < IN_AIR) S.tableAir.push({
      x: table.x + c * P,
      y: bottomY(table) - (r + 1) * P,
      vx: (rand() - 0.5) * 0.35,
      vy: -(0.3 + rand() * 0.5),
      up: true, fade: true,            // it goes, and it goes by fading out
      t: 0, s: v
    });
  }
}

// The tallest column with anything in it, so a heap comes apart from the top
// rather than being eaten from one end. Where it starts looking walks, so the
// same side is not always the one that goes first.
let drainAt = 0;
function topmostColumn() {
  let best = -1, high = -1;
  for (let i = 0; i < table.cols; i++) {
    const c = (drainAt + i) % table.cols;
    const r = topRow(table, c);
    if (r > high) { high = r; best = c; }
  }
  drainAt = (drainAt + 7) % table.cols;
  return best;
}

export function stepTable(dt) {
  if (!S.casinoOpen || !table.grid) return;
  if (table.capped != null && table.n < table.capped) table.capped = null;   // room again
  if (S.paying) payOutStep(dt);
  else if (table.n + airborne() < tableWant()) trickleIn(dt, S.pot?.cur);
  else if (table.n > tableWant()) drainOut(dt);
  settleSome(table, 6000);
}

// The tone the heap is made of, which is the tone of whatever was staked.
export const potShade = cur =>
  cur === 'shard' ? SHARD_CELL : cur === 'spore' ? SPORE_CELL : 0;

// One frame of the grains in the air: they rise, they fall, they land in the
// plot or they fade out.
export function stepSparks(dt) {
  const f = frames();
  for (let i = S.tableAir.length - 1; i >= 0; i--) {
    const k = S.tableAir[i];
    if (!k.up) k.vy += TABLE_GRAV * f;
    k.x += k.vx * f;
    k.y += k.vy * f;
    k.t += dt / 1000;
    // A grain on its way to the hole: along its arc, and into the pile when
    // it gets there. The one that is actually worth something.
    if (k.arc) {
      const a = k.arc;
      a.k = Math.min(1, a.k + dt / FLIGHT_MS);
      k.x = a.x0 + (a.x1 - a.x0) * a.k;
      k.y = a.y0 + (a.y1 - a.y0) * a.k - Math.sin(a.k * Math.PI) * a.high;
      if (a.k >= 1) {
        // One square off the heap is worth its band, and the hole takes the
        // whole of it: down there the pile *is* the dust.
        for (let w = k.worth ?? 1; w > 0; w--) if (!bankDust(a.x1, k.s)) break;
        S.tableAir.splice(i, 1);
      }
      continue;
    }

    // A grain coming down is the pot arriving: it becomes a grain in the plot.
    if (k.lands) {
      const c = Math.max(0, Math.min(table.cols - 1, Math.round((k.x - table.x) / P)));
      if (k.y >= surfaceY(table, c)) {
        // the ground would not take it: that is as much as this bit of yard
        // holds, and the rest of the pot stays a number on the board
        if (!addGrain(table, k.x, table.blocked, k.s)) table.capped = table.n;
        S.tableAir.splice(i, 1);
      }
      continue;
    }
    // A rising one goes until its time is up, because what it is doing is
    // leaving; a plain falling one is scenery and stops at the ground.
    if (k.t > TABLE_LIFE || (!k.up && k.y >= S.groundY - P)) S.tableAir.splice(i, 1);
  }
}

// The wheel turns while there is a pot on the table and spins while a ride is
// being settled: the rows say what the numbers are and this says whether
// anything is happening.
export function stepCasino(dt) {
  if (!S.casinoOpen) return;
  stepSparks(dt);
  // The spin is paid on the frame the last grain of the stake comes to rest.
  if (S.pouring && settledInPile()) { S.pouring = false; spin(); }
  const fast = spinning();
  S.wheel = wheelAt(dt);
  if (!fast && S.spinUntil) {                    // it has just come to rest
    S.spinUntil = 0;
    const cur = S.pot?.cur;
    const was = S.pot?.n || 0;
    if (S.spinWon) S.pot = { ...S.pot, n: was * 2 };
    else S.pot = null;
    // the stop is felt as well as seen -- and a win is felt harder
    shakeView(S.spinWon ? CASINO_WIN_KNOCK : CASINO_KNOCK);
    // The sand is the plot's business now (`stepTable`). The result is said
    // over the building for a few seconds, because you are usually somewhere
    // else in the yard.
    S.hand = { won: S.spinWon, n: S.spinWon ? pot() : 0, cur, at: now(), bursts: 0 };
    noteHand(S.spinWon, S.hand.n || S.pot?.n || 0, CASINO_BIG);
    // and it is felt: a fountain out of the wheel, or a dud
    if (S.spinWon) sfx('jackpot', { x: casino.x + casino.w / 2, big: true, hard: 1 });
    else sfx('dud', { x: casino.x + casino.w / 2 });   // and the sign goes out: see drawSign
    S.dirty = true;
    buildShop();
  }
  // A win's fountains go up a beat apart: three bursts read as a celebration,
  // one reads as a hiccup.
  if (S.hand?.won && S.hand.bursts < CASINO_BURSTS &&
      now() - S.hand.at >= S.hand.bursts * CASINO_BURST_GAP_MS) { burst(); S.hand.bursts++; }
  if (S.hand && now() - S.hand.at > CASINO_SAY_MS) { S.hand = null; S.dirty = true; }
}

// The middle of the wheel, the same arithmetic the drawing uses, so the
// squares leave the hole and not the roof.
const wheelAtXY = () => ({ x: casino.x + casino.w / 2, y: casino.y + casino.h * 0.62 });

// A fountain of squares out of the wheel: scenery, worth nothing, landing
// nowhere, in every shade the yard has so they read as confetti against the
// sky and the block both.
function burst() {
  const { x, y } = wheelAtXY();
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

// what the yard should be showing over the building, if anything
export const saying = () => S.hand ? (S.hand.won ? 'won' : 'lost') : null;

// --- the board ---------------------------------------------------------------
// Three rows to put something down and two to decide what happens to it,
// never both sets at once. A stake row is priced like any other row (this
// much, out of your hands, now); the two decisions carry what they would pay
// instead, which is the number the decision is about.
const STAKES = [
  // Named by the coin: three cards all reading STAKE differed by a seven-pixel
  // mark in the price column.
  { key: 'stakedust', name: 'stake pebbles', cur: 'dust' },
  { key: 'stakeshard', name: 'stake ore', cur: 'shard' },
  { key: 'stakespore', name: 'stake crops', cur: 'spore' }
];

const seen = cur => cur === 'shard' ? S.seenShard : cur === 'spore' ? S.seenSpore : true;

export const CASINO_UPGRADES = [
  // A dial, like the roster's job rows: a setting between two buttons, not a
  // purchase.
  {
    key: 'chip',
    name: 'chips',
    dial: true,
    value: chipName,
    less: () => pickChip(-1),
    more: () => pickChip(1),
    lo: () => S.chip <= 0,
    hi: () => S.chip >= CASINO_CHIPS.length - 1,
    show: () => S.casinoOpen && !S.pot && !busy() && !S.paying
  },
  // Written like a price but not a purchase: it does not go through the
  // buying machinery. `stake` takes what it takes, and the row is dead when
  // it could not.
  ...STAKES.map(t => ({
    key: t.key,
    name: t.name,
    price: () => `${MARKOF(t.cur)} ${stakeOf(t.cur)}`,
    cost: () => stakeOf(t.cur),
    currency: t.cur,
    dead: () => !canStake(t.cur),
    buy: () => stake(t.cur),
    // A row for a currency you have never seen names a thing you have not
    // met, the rule every board keeps.
    show: () => S.casinoOpen && !S.pot && !busy() && !S.paying && seen(t.cur)
  })),
  {
    key: 'bank',
    name: 'bank it',
    price: () => `${MARKOF(S.pot?.cur)} ${pot()}`,
    cost: () => 0,
    // the sand is still coming down or the wheel is going: either way the pot
    // stays where it is
    dead: () => !canBank(),
    buy: bank,
    show: () => S.casinoOpen && !!S.pot
  },
  {
    key: 'ride',
    name: 'spin again',
    // What it is worth if it comes off. The odds are not written anywhere: a
    // percentage on a row would turn a wheel into a spreadsheet.
    //
    price: () => `${MARKOF(S.pot?.cur)} ${pot() * 2}`,
    cost: () => 0,
    // the sand is still coming down, or the wheel is going: either way the
    // decision has been made and there is nothing left to press
    dead: () => !canRide(),
    buy: ride,
    show: () => S.casinoOpen && !!S.pot
  }
];

// the mark of whatever is on the table, written the way the boards write marks
const MARKOF = cur => `<i class="${cur || 'dust'}"></i>`;

export const CASINO_SECTIONS = [
  { title: 'the table', keys: ['chip', 'stakedust', 'stakeshard', 'stakespore'] },
  { title: 'winnings', keys: ['bank', 'ride'] }
];
