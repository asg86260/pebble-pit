// The stake is dust you sweep.
//
// To the right of the casino, on the ground, one pile a coin the yard has
// handed out: the purse itself, drawn at the table's own band ladder, so it
// grows and shrinks with what you have, and each grain of it is worth its
// band -- the tray's own rule. Staking is the ordinary sweep: the left button
// on a desk, a finger on dust on a phone, picks grains up off the pile the
// way it picks up any dust in the yard, and grains let go over the hopper's
// rim fall into the funnel and become stake. One coin a hand: grains of
// another coin dropped over the rim slide off and arc home. Taking it back is
// the same sweep out of the bowl, dropped anywhere: the grains arc home and
// the purse rises. The pot is what stands in the bowl. See DESIGN.md, "The
// stake is a heap you carry, and the casino has no board".
//
// Owns the three plots, what stands on each, and what a swept grain of them
// does when it lands. casino.js owns the pot once the grains are in the
// funnel; hands.js does the sweeping.

import { P, SHADES, someFind, STAKE_COINS, STAKE_GAP, STAKE_ROWS, STAKE_COLS,
         shownFor, HOPPER_H } from './config.js';
import { S, casino, table, stakes } from './state.js';
import { makePainter } from './painter.js';
import { addGrain, resizeGrid, settleSome, at, put, bottomY, surfaceY } from './grid.js';
import { purseOf, busy, inHopper, stakeGrain, refundGrain, potShade, hopperN } from './casino.js';
import { rand } from './rng.js';

// --- the plots ------------------------------------------------------------------------
// One a coin, dust nearest the building, laid out by world.js. Each plot is
// the brim's cone wide and tall.
export function layStakes() {
  if (!stakes.length) {
    for (const cur of STAKE_COINS) stakes.push({
      cur, x: 0, y: 0, cols: STAKE_COLS, rows: STAKE_ROWS, p: P,
      grid: null, painter: null, n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null,
      repose: true
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
// A coin the yard has not handed out yet has no pile: shards once the quarry
// stands, spores once the farm does.
export const coinOpen = cur => cur === 'shard' ? S.quarryOpen : cur === 'spore' ? S.farmOpen : true;
export const stakeOf = cur => stakes.find(h => h.cur === cur) || null;

// How much sand should be lying on a plot: the purse's band, or nothing.
export const stakeWant = h => coinOpen(h.cur) && purseOf(h.cur) > 0 ? shownFor(purseOf(h.cur)) : 0;

// What one grain of a pile is worth: its share of the purse, and never less
// than one. Whatever the rounding leaves rides on the last grains, the way
// the tray's rule pays the hole the exact pot.
export const stakeGrainWorth = h => Math.max(1, Math.round(purseOf(h.cur) / Math.max(1, stakeWant(h))));

// The middle of a plot, where its pile is rained to and where a grain of it
// comes home to.
export const stakeAt = h => ({ x: h.x + (h.cols * P) / 2, y: h.y + h.rows * P - P * 6 });

// --- the rain ------------------------------------------------------------------------
// A plot is walked to what it should hold, the way the hopper is: rained in
// from the sky when the purse has grown, lifted off and faded when it has
// shrunk. The rate is the table's: about a second and a half either way.
const TRICKLE_MS = 1500;
const airborneTo = i => S.tableAir.reduce((n, k) => n + (k.lands === 'stake' && k.stake === i ? 1 : 0), 0);

function rainIn(dt, h, i, want) {
  const have = h.n + airborneTo(i);
  let n = Math.min(want - have, Math.max(1, Math.ceil((want - have) * (dt / TRICKLE_MS))));
  const find = potShade(h.cur);
  const at0 = stakeAt(h);
  while (n-- > 0) {
    const shade = find ? someFind(find) : 1 + Math.floor(rand() * SHADES.length);
    // over the middle of the plot, so the pile cones up rather than spreads
    S.tableAir.push({ x: at0.x + (rand() - 0.5) * P * (h.cols / 2), y: h.y - P * 20 - rand() * P * 10,
                      vx: (rand() - 0.5) * 0.3, vy: 0.9 + rand() * 0.8, t: 0, s: shade, lands: 'stake', stake: i });
  }
}

let drainAt = 0;
const topGrain = (h, c) => { for (let r = h.rows - 1; r >= 0; r--) if (at(h, c, r)) return r; return -1; };
function topmostColumn(h) {
  let best = -1, high = -1;
  for (let i = 0; i < h.cols; i++) {
    const c = (drainAt + i) % h.cols;
    const r = topGrain(h, c);
    if (r > high) { high = r; best = c; }
  }
  drainAt = (drainAt + 7) % Math.max(1, h.cols);
  return best;
}
function fadeOut(dt, h, i, want) {
  const over = h.n - want;
  let n = Math.min(over, Math.max(1, Math.ceil(over * (dt / TRICKLE_MS))));
  while (n-- > 0) {
    const c = topmostColumn(h);
    if (c < 0) break;
    const r = topGrain(h, c);
    const v = at(h, c, r);
    put(h, c, r, 0);
    S.tableAir.push({ x: h.x + c * P, y: bottomY(h) - (r + 1) * P, vx: (rand() - 0.5) * 0.35,
                      vy: -(0.3 + rand() * 0.5), up: true, fade: true, t: 0, s: v, stake: i });
  }
}

// The rain toward the plots, and the grains arcing home: it is the casino's
// air, but it lands here, on the plot it was sent to, so casino.js need know
// nothing of the piles. A grain coming home from the hopper pays the purse
// as it lands, which is what the pile then grows by.
const TABLE_GRAV = 0.05;
const HOME_MS = 700;
function stepRain(dt) {
  const f = dt / (1000 / 60);
  for (let i = S.tableAir.length - 1; i >= 0; i--) {
    const k = S.tableAir[i];
    if (k.lands !== 'stake') continue;
    if (k.arc) {
      const a = k.arc;
      a.k = Math.min(1, a.k + dt / HOME_MS);
      k.x = a.x0 + (a.x1 - a.x0) * a.k;
      k.y = a.y0 + (a.y1 - a.y0) * a.k - Math.sin(a.k * Math.PI) * a.high;
      if (a.k < 1) continue;
      k.arc = null; k.vx = 0; k.vy = 0.5;
    }
    k.vy += TABLE_GRAV * f;
    k.x += k.vx * f;
    k.y += k.vy * f;
    const h = stakes[k.stake];
    if (!h || !h.grid) { S.tableAir.splice(i, 1); continue; }
    const c = Math.max(0, Math.min(h.cols - 1, Math.round((k.x - h.x) / P)));
    if (k.y < surfaceY(h, c)) continue;
    if (k.worth) refundGrain(h.cur, k.worth);
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
    else if (h.n > want) fadeOut(dt, h, i, want);
    settleSome(h, 2000);
  });
}

// --- the sweep ------------------------------------------------------------------------
// The plots a sweep may take from besides the ground: the piles, and the
// hopper's bowl while a pot stands in it and nothing is moving. Each says
// what a grain lifted off it is, so the grain knows where it belongs when it
// comes down: the pile's coin and worth, or the hopper's.
export function sweepablePlots() {
  if (!S.casinoOpen) return [];
  const out = stakes.filter(h => h.grid && h.n).map(h => ({ plot: h, cur: h.cur, from: 'stake', worth: () => stakeGrainWorth(h) }));
  if (inHopper() && !busy() && hopperN() > 0) {
    out.push({ plot: table, cur: S.pot.cur, from: 'hopper', worth: () => hopperGrainWorth(), fixed: table.fixed });
  }
  return out;
}
// A grain swept out of the bowl takes its share of the pot with it, the
// rounding riding on the last: the pot is what stands in the bowl.
const hopperGrainWorth = () => Math.max(1, Math.min(S.pot.n, Math.round(S.pot.n / Math.max(1, hopperN()))));

// Somewhere over the funnel's mouth: between its walls, at or below the rim.
export const overRim = (x, y) =>
  x >= casino.x && x < casino.x + casino.w && y >= casino.y - P && y < casino.y + HOPPER_H * P;

// A grain of a pile, or of the hopper, coming down: into the funnel and the
// pot if it is over the rim and the pot will have it; home to its pile
// otherwise -- off the rim if it was refused, off the ground wherever else it
// fell. True when the grain has been dealt with. Called by the chip loop for
// every grain that carries a coin, before the ground gets it.
export function landStakeChip(ch, onGround) {
  if (ch.vy > 0 && overRim(ch.x, ch.y) && ch.y >= casino.y - P) {
    if (stakeGrain(ch.cur, ch.worth, ch.from)) { addGrain(table, ch.x, null, ch.s); return true; }
    goHome(ch, 0);
    return true;
  }
  if (!onGround) return false;
  goHome(ch, ch.from === 'hopper' ? ch.worth : 0);
  return true;
}
// The arc home: to the middle of the pile of its coin, paying the purse on
// landing what a hopper grain took with it.
function goHome(ch, worth) {
  const h = stakeOf(ch.cur);
  const i = stakes.indexOf(h);
  const to = stakeAt(h);
  S.tableAir.push({
    x: ch.x, y: ch.y, s: ch.s, t: 0, lands: 'stake', stake: i, worth,
    arc: { x0: ch.x, y0: ch.y, x1: to.x + (rand() - 0.5) * P * 8, y1: to.y - P * 8, k: 0, high: P * 10 }
  });
}

// The tooltip's word for a pile: the purse it is.
export const stakeName = h => {
  const mark = h.cur === 'shard' ? 'ore' : h.cur === 'spore' ? 'crops' : 'pebbles';
  return `your ${mark}: ${purseOf(h.cur)} -- sweep some into the funnel to stake it`;
};
export function stakeUnder(x, y) {
  for (const h of stakes) {
    if (!h.grid || !h.n) continue;
    if (x < h.x || x >= h.x + h.cols * P || y < h.y || y >= h.y + h.rows * P) continue;
    const c = Math.floor((x - h.x) / P), r = Math.floor((bottomY(h) - y) / P);
    if (r >= 0 && r < h.rows && at(h, c, r)) return h;
  }
  return null;
}
