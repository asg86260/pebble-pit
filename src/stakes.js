// The stake is a heap you carry.
//
// To the right of the casino, on the ground, a row of heaps: for each coin the
// yard has handed out, three in the chip sizes and one bigger heap that is
// the whole purse. Each is a real plot of sand at the table's own band ladder,
// so the thousand is visibly bigger than the hundred; a heap the purse cannot
// cover is not there, so what you can stake is what you can see. You pick one
// up the way you pick up a body -- the right button held, or a finger -- carry
// it to the hopper and let it go over the rim, and it pours in. Anywhere else
// it goes back where it came from. Nothing here is a menu. See DESIGN.md,
// "The stake is a heap you carry, and the casino has no board".
//
// Owns the plots, what stands in each, the lift, the carry and the drop.
// casino.js owns what a stake does once it is in the hopper.

import { P, SHADES, someFind, CASINO_STAKES, STAKE_COINS, STAKE_GAP, STAKE_ROWS,
         stakeCols, shownFor, HOPPER_H, CASINO_KNOCK, CASINO_PILE_BRIM } from './config.js';
import { S, casino, table, stakes } from './state.js';
import { makePainter } from './painter.js';
import { addGrain, resizeGrid, settleSome, at, put, bottomY, surfaceY, fillFlat } from './grid.js';
import { busy, purseOf, canStake, addStake, inHopper, takePot, returnPot, refundPot, potShade, handfulFor } from './casino.js';
import { shakeView } from './world.js';
import { rand } from './rng.js';
import { sfx } from './audio.js';

// --- the plots ------------------------------------------------------------------------
// One a coin a size, dust nearest the building, laid out by world.js. The
// plot is as wide as the band's cone and as tall as the brim's.
export function layStakes() {
  if (!stakes.length) {
    for (const cur of STAKE_COINS) for (const chip of CASINO_STAKES) stakes.push({
      cur, chip, x: 0, y: 0, cols: stakeCols(chip), rows: STAKE_ROWS, p: P,
      grid: null, painter: null, n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null,
      repose: true, pourFrom: null
    });
  }
  let x = Math.round((casino.x + casino.w) / P) * P;
  for (const h of stakes) {
    x += STAKE_GAP * P;
    h.x = x;
    h.y = S.groundY - h.rows * P;
    x += h.cols * P;
  }
}

export function wireStakes() {
  for (const h of stakes) {
    if (!h.painter) h.painter = makePainter(h);
    h.onPut = h.painter.mark;
    resizeGrid(h);
  }
}

// --- what stands there ----------------------------------------------------------------
// A coin the yard has not handed out yet has no heaps: shards once the quarry
// stands, spores once the farm does.
export const coinOpen = cur => cur === 'shard' ? S.quarryOpen : cur === 'spore' ? S.farmOpen : true;

// How much a heap is, in its coin: its chip, or the whole purse.
export const amountOf = h => h.chip === 'all' ? purseOf(h.cur) : h.chip;

// Whether it is there at all: only when the purse covers it, and not while it
// is in your hand.
export const standing = h =>
  coinOpen(h.cur) && amountOf(h) > 0 && purseOf(h.cur) >= amountOf(h) &&
  !(S.carried && S.carried.kind === 'stake' && S.carried.from === stakes.indexOf(h));

// How much sand should be lying on a plot: the band of what the heap is, or
// nothing.
export const stakeWant = h => standing(h) ? shownFor(amountOf(h)) : 0;

// The middle of a plot, where its heap is rained to and where a carried heap
// arcs back to.
export const stakeAt = h => ({ x: h.x + (h.cols * P) / 2, y: h.y + h.rows * P - P * 6 });

// --- the rain ------------------------------------------------------------------------
// A plot is walked to what it should hold, the way the hopper is: rained in
// from the sky -- or from where a heap arrived back -- when the purse covers
// it, lifted off and faded when it does not. The rate is the table's: about a
// second and a half either way.
const TRICKLE_MS = 1500;
const airborneTo = i => S.tableAir.reduce((n, k) => n + (k.lands === 'stake' && k.stake === i ? 1 : 0), 0);

function rainIn(dt, h, i, want) {
  const have = h.n + airborneTo(i);
  let n = Math.min(want - have, Math.max(1, Math.ceil((want - have) * (dt / TRICKLE_MS))));
  const find = potShade(h.cur);
  const at0 = stakeAt(h);
  while (n-- > 0) {
    const shade = find ? someFind(find) : 1 + Math.floor(rand() * SHADES.length);
    const from = h.pourFrom
      ? { x: h.pourFrom.x + (rand() - 0.5) * P * 4, y: h.pourFrom.y + (rand() - 0.5) * P * 2 }
      : { x: at0.x + (rand() - 0.5) * P * (h.cols - 2), y: h.y - P * 20 - rand() * P * 10 };
    S.tableAir.push({ x: from.x, y: from.y, vx: (rand() - 0.5) * 0.3, vy: 0.9 + rand() * 0.8,
                      t: 0, s: shade, lands: 'stake', stake: i });
  }
}

let drainAt = 0;
function topmostColumn(h) {
  let best = -1, high = -1;
  for (let i = 0; i < h.cols; i++) {
    const c = (drainAt + i) % h.cols;
    let r = -1;
    for (let rr = h.rows - 1; rr >= 0; rr--) if (at(h, c, rr)) { r = rr; break; }
    if (r > high) { high = r; best = c; }
  }
  drainAt = (drainAt + 7) % Math.max(1, h.cols);
  return best;
}
function fadeOut(dt, h, want) {
  const over = h.n - want;
  let n = Math.min(over, Math.max(1, Math.ceil(over * (dt / TRICKLE_MS))));
  while (n-- > 0) {
    const c = topmostColumn(h);
    if (c < 0) break;
    let r = -1;
    for (let rr = h.rows - 1; rr >= 0; rr--) if (at(h, c, rr)) { r = rr; break; }
    const v = at(h, c, r);
    put(h, c, r, 0);
    S.tableAir.push({ x: h.x + c * P, y: bottomY(h) - (r + 1) * P, vx: (rand() - 0.5) * 0.35,
                      vy: -(0.3 + rand() * 0.5), up: true, fade: true, t: 0, s: v });
  }
}

// The rain in the air toward the plots: it is the casino's air, but it lands
// here, on the plot it was sent to, so casino.js need know nothing of the
// heaps. A grain going the other way (fading off) is casino.js's.
const TABLE_GRAV = 0.05;
function stepRain(dt) {
  const f = dt / (1000 / 60);
  for (let i = S.tableAir.length - 1; i >= 0; i--) {
    const k = S.tableAir[i];
    if (k.lands !== 'stake') continue;
    k.vy += TABLE_GRAV * f;
    k.x += k.vx * f;
    k.y += k.vy * f;
    const h = stakes[k.stake];
    if (!h || !h.grid) { S.tableAir.splice(i, 1); continue; }
    const c = Math.max(0, Math.min(h.cols - 1, Math.round((k.x - h.x) / P)));
    if (k.y < surfaceY(h, c)) continue;
    addGrain(h, k.x, null, k.s);
    S.tableAir.splice(i, 1);
  }
}

export function stepStakes(dt) {
  if (!S.casinoOpen) return;
  stepRain(dt);
  stakes.forEach((h, i) => {
    if (!h.grid) return;
    const want = stakeWant(h);
    if (h.n + airborneTo(i) < want) rainIn(dt, h, i, want);
    else if (h.n > want) fadeOut(dt, h, want);
    if (h.n >= want) h.pourFrom = null;
    settleSome(h, 2000);
  });
  if (S.carried && S.carried.returning) stepReturn(dt);
}

// --- the lift --------------------------------------------------------------------------
// Which heap is under a point: the cells of its cone, asked the way dust is.
export function stakeUnder(x, y) {
  if (!S.casinoOpen) return null;
  for (const h of stakes) {
    if (!h.grid || !h.n) continue;
    if (x < h.x || x >= h.x + h.cols * P || y < h.y || y >= h.y + h.rows * P) continue;
    const c = Math.floor((x - h.x) / P), r = Math.floor((bottomY(h) - y) / P);
    if (r >= 0 && r < h.rows && at(h, c, r)) return h;
  }
  return null;
}

// And the pot in the hopper: sand in the bowl, under the point.
export function potUnder(x, y) {
  if (!S.casinoOpen || !inHopper() || !table.grid) return false;
  if (x < table.x || x >= table.x + table.cols * P || y < table.y || y >= table.y + table.rows * P) return false;
  const c = Math.floor((x - table.x) / P), r = Math.floor((bottomY(table) - y) / P);
  const v = at(table, c, r);
  return !!v && !(table.fixed && table.fixed(c, r));
}

// The heap comes up off the ground under the pointer, and the ground where it
// stood goes bare. Not while a hand is pouring, falling, paying or hoisting.
export function liftStake(h, x, y) {
  if (!h || busy() || S.carried || !standing(h)) return false;
  S.carried = { kind: 'stake', cur: h.cur, n: amountOf(h), grains: h.n, from: stakes.indexOf(h),
                x, y, returning: null };
  fillFlat(h, 0);
  return true;
}

// The pot in the hopper, whole, lifted out again before the lever.
export function liftPot(x, y) {
  if (S.carried) return false;
  const took = takePot();
  if (!took) return false;
  S.carried = { kind: 'pot', cur: took.cur, n: took.n, grains: handfulFor(took.n), from: -1, x, y, returning: null };
  return true;
}

// Somewhere over the hopper: its rim, and the air a little above it.
export const overRim = (x, y) =>
  x >= casino.x && x < casino.x + casino.w && y >= casino.y - P * 8 && y < casino.y + HOPPER_H * P;

// Let go. Over the rim a heap pours in and raises the stake; a heap of another
// coin bounces off with the dud knock; anywhere else it goes back where it
// came from, the same arc back to its spot. A lifted pot goes back into the
// hopper over the rim, and to the purse anywhere else.
export function dropCarried(x, y) {
  const c = S.carried;
  if (!c || c.returning) return false;
  c.x = x; c.y = y;
  if (c.kind === 'pot') {
    if (overRim(x, y)) returnPot(c.cur, c.n, { x, y });
    else refundPot(c.cur, c.n, { x, y });
    S.carried = null;
    return true;
  }
  if (overRim(x, y) && canStake(c.cur) && addStake(c.cur, c.n, { x, y })) {
    S.carried = null;
    return true;
  }
  if (overRim(x, y)) { shakeView(CASINO_KNOCK); sfx('dud', { x }); }
  // back to its spot
  const home = stakeAt(stakes[c.from]);
  c.returning = { x0: x, y0: y, x1: home.x, y1: home.y - P * 10, k: 0 };
  return true;
}
const RETURN_MS = 600;
function stepReturn(dt) {
  const c = S.carried, r = c.returning;
  r.k = Math.min(1, r.k + dt / RETURN_MS);
  c.x = r.x0 + (r.x1 - r.x0) * r.k;
  c.y = r.y0 + (r.y1 - r.y0) * r.k - Math.sin(r.k * Math.PI) * P * 12;
  if (r.k >= 1) {
    // home: the heap rains back on to its plot from where it landed
    const h = stakes[c.from];
    if (h) h.pourFrom = { x: c.x, y: c.y };
    S.carried = null;
  }
}

// A carried heap when the hand shuts -- a save, a cutscene, a reset -- goes
// back to its spot at once, and a lifted pot back to the hopper.
export function putDownCarried() {
  const c = S.carried;
  if (!c) return;
  if (c.kind === 'pot') returnPot(c.cur, c.n, null);
  S.carried = null;
}

// The heap in your hand, for the tooltip and the drawing: the cone it stood
// as, and its coin.
export const carriedName = () => {
  const c = S.carried;
  if (!c) return null;
  const mark = c.cur === 'shard' ? 'ore' : c.cur === 'spore' ? 'crops' : 'pebbles';
  return c.kind === 'pot' ? `the pot: ${c.n} ${mark}` : `a stake: ${c.n} ${mark}`;
};
export const stakeName = h => {
  const mark = h.cur === 'shard' ? 'ore' : h.cur === 'spore' ? 'crops' : 'pebbles';
  return `a stake: ${amountOf(h)} ${mark}${h.chip === 'all' ? ' (all in)' : ''}`;
};

// The cone a carried heap is drawn as: the rows of a heap of `grains` at the
// yard's slope, bottom row first, each as a width in cells.
export function carriedCone(c) {
  const g = Math.max(1, Math.min(CASINO_PILE_BRIM, c.grains || shownFor(c.n)));
  const h = Math.max(1, Math.ceil(Math.sqrt(g)));
  const rows = [];
  for (let i = 0; i < h; i++) rows.push(Math.max(1, 2 * (h - i) - 1));
  return rows;
}
export const carriedShade = c => potShade(c.cur) || 0;
