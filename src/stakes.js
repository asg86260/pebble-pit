// The stake is a pile you tap.
//
// To the right of the casino, on the ground, one pile a coin the yard has
// handed out: the purse itself, drawn at the table's own band ladder, so it
// grows and shrinks with what you have, and each grain of it is worth its
// band -- the tray's own rule. Staking is a tap: a tap on a pile sends a
// tenth of the purse streaming off the top of it, over the rim and into the
// funnel, and taps stack. One coin a hand: a tap on another coin's pile
// while a hand stands is a dud knock. Taking it back is a tap on the bowl:
// the whole pot streams home and the purse rises as it lands. The pot is
// what stands in the bowl. See DESIGN.md, "The stake is a heap you carry,
// and the casino has no board".
//
// Owns the three plots, what stands on each, and the streams between them
// and the bowl. casino.js owns the pot once the grains are in the funnel.

import { P, SHADES, someFind, STAKE_COINS, STAKE_GAP, STAKE_ROWS, STAKE_COLS,
         shownFor, STAKE_TAP_SHARE, STAKE_TAP_MIN } from './config.js';
import { S, casino, table, stakes } from './state.js';
import { makePainter } from './painter.js';
import { addGrain, resizeGrid, settleSome, at, put, bottomY, surfaceY, colOf, inside } from './grid.js';
import { purseOf, busy, inHopper, canStake, unstakeGrain, refundGrain, potShade, hopperN, potAt, stopAttract } from './casino.js';
import { sfx } from './audio.js';
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
// the top grain of a column; a wall of the bowl is never a grain
const topGrain = (h, c) => { for (let r = h.rows - 1; r >= 0; r--) if (at(h, c, r) && !(h.fixed && h.fixed(c, r))) return r; return -1; };
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
      a.k = Math.min(1, a.k + dt / (a.ms || HOME_MS));
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
  stepStaking(dt);
  stepUnstaking(dt);
  stepRain(dt);
  stakes.forEach((h, i) => {
    if (!h.grid) return;
    const want = stakeWant(h);
    if (h.n + airborneTo(i) < want) rainIn(dt, h, i, want);
    else if (h.n > want) fadeOut(dt, h, i, want);
    settleSome(h, 2000);
  });
}

// --- the tap ----------------------------------------------------------------------------
// Staking is a tap. A tap on a pile sends a chunk of it into the funnel on
// its own: a tenth of the coin's purse (`STAKE_TAP_SHARE`), never less than
// `STAKE_TAP_MIN` and never more than there is, lifted off the top of the
// pile grain by grain and lobbed over the rim in a stream -- the hoist's own
// arc, the other way -- each grain worth its band, landing in the bowl as
// the stake. Taps stack: five is half the purse, ten is all in. A tap on the
// bowl sends the whole pot back the same way. A stake built a grain a drag
// was a chore; a tap is a decision.
//
// What is in flight is `S.staking` (a chunk still to lift off a pile) and
// `S.unstaking` (the pot on its way home); the purse and the pot move as
// grains land, never before, so a save mid-stream loses nothing.

// The pile or the bowl under a point, for the tap and for the phone's claim
// on a touch there (`dustUnder` in hands.js asks, so a finger on a pile
// never scrolls the yard).
export function stakeUnder(x, y) {
  for (const h of stakes) {
    if (!h.grid || !h.n) continue;
    if (x < h.x || x >= h.x + h.cols * P || y < h.y || y >= h.y + h.rows * P) continue;
    // the pile's own outline, with a cell of air over it so a tap on its crown lands
    if (y >= surfaceY(h, colOf(h, x)) - P) return h;
  }
  return null;
}
export function bowlUnder(x, y) {
  if (!S.casinoOpen || !table.grid || !hopperN()) return false;
  if (x < table.x || x >= table.x + table.cols * P || y < table.y || y >= bottomY(table)) return false;
  const c = colOf(table, x), r = Math.floor((bottomY(table) - y) / P);
  return inside(table, c, r) && !!at(table, c, r) && !(table.fixed && table.fixed(c, r));
}

// What one tap on a pile is worth: a tenth of the purse, floored and capped.
export const tapShare = cur => {
  const purse = purseOf(cur);
  return Math.min(purse, Math.max(STAKE_TAP_MIN, Math.round(purse * STAKE_TAP_SHARE)));
};

// A tap on a pile: a chunk of that coin joins what is already on its way.
// Refused -- a hand on the board, another coin's pot standing -- the pile
// gives the dud knock and nothing moves.
export function tapStake(h) {
  const i = stakes.indexOf(h);
  if (!canStake(h.cur) || purseOf(h.cur) <= 0) { sfx('dud', { x: stakeAt(h).x }); return false; }
  const share = tapShare(h.cur);
  if (S.staking && S.staking.stake === i) S.staking.left += share;
  else S.staking = { cur: h.cur, stake: i, left: share };
  stopAttract();
  return true;
}

// A tap on the bowl: the whole pot goes home. Only with a pot standing and
// nothing moving; a tap mid-hand is nothing.
export function tapBowl() {
  if (!inHopper() || busy() || !hopperN()) return false;
  S.unstaking = { cur: S.pot.cur, stake: stakes.indexOf(stakeOf(S.pot.cur)) };
  return true;
}

// A tap anywhere: the pile or the bowl under it, worked. The same call the
// pointer makes on a desk and at a finger's release on a phone.
export function casinoTap(x, y) {
  if (!S.casinoOpen) return false;
  const h = stakeUnder(x, y);
  if (h) return tapStake(h);
  if (bowlUnder(x, y)) return tapBowl();
  return false;
}

// One grain off the top of a plot, for the streams.
function liftTop(plot) {
  const c = topmostColumn(plot);
  if (c < 0) return null;
  const r = topGrain(plot, c);
  const v = at(plot, c, r);
  put(plot, c, r, 0);
  return { x: plot.x + c * P, y: bottomY(plot) - (r + 1) * P, s: v };
}

// The stream a tap set going: grains off the pile, over the rim, into the
// bowl -- the hoist's lob the other way. The rate is the hoist's. A grain's
// worth is the pile's grain worth, the last one whatever is left; the purse
// is spent as each lands (`stakeGrain`, called by the landing in casino.js).
function stepStaking(dt) {
  const st = S.staking;
  if (!st) return;
  const h = stakes[st.stake];
  if (!h || !h.grid || st.left <= 0 || !canStake(st.cur)) { S.staking = null; return; }
  const worth = stakeGrainWorth(h);
  const grains = Math.ceil(st.left / worth);
  let n = Math.min(grains, Math.max(1, Math.ceil(grains * (dt / STREAM_MS))));
  while (n-- > 0 && st.left > 0) {
    const g = liftTop(h);
    if (!g) break;                                 // the pile has not caught up: next frame
    const w = Math.min(worth, st.left);
    st.left -= w;
    S.tableAir.push({
      x: g.x, y: g.y, s: g.s, t: 0, lands: 'hopper', cur: st.cur, worth: w,
      arc: { x0: g.x, y0: g.y, x1: potAt().x + (rand() - 0.5) * P * 8, y1: table.y - P * 3,
             k: 0, high: P * 12 + rand() * P * 6, ms: STREAM_FLIGHT_MS }
    });
  }
  if (st.left <= 0) S.staking = null;
}

// The pot going home: grains off the top of the bowl, each taking its share
// of the pot with it (`unstakeGrain`), arcing to the pile and paying the
// purse as they land (`refundGrain`, in `stepRain`).
function stepUnstaking(dt) {
  const u = S.unstaking;
  if (!u) return;
  if (!S.pot || !hopperN()) { S.unstaking = null; return; }
  const grains = hopperN();
  let n = Math.min(grains, Math.max(1, Math.ceil(grains * (dt / STREAM_MS))));
  while (n-- > 0 && S.pot && hopperN()) {
    const worth = Math.max(1, Math.min(S.pot.n, Math.round(S.pot.n / Math.max(1, hopperN()))));
    const g = liftTop(table);
    if (!g) break;
    unstakeGrain(worth);
    goHome(g, u.cur, worth, STREAM_FLIGHT_MS);
  }
  if (!S.pot || !hopperN()) { S.unstaking = null; if (S.pot) S.pot = null; }
}
const STREAM_MS = 1500;
const STREAM_FLIGHT_MS = 1700;

// The arc home: to the middle of the pile of its coin, paying the purse on
// landing what the grain took with it. A grain refused at the rim goes home
// too, worth nothing, since nothing was spent for it.
export function goHome(g, cur, worth, ms = HOME_MS) {
  const h = stakeOf(cur);
  const i = stakes.indexOf(h);
  const to = stakeAt(h);
  S.tableAir.push({
    x: g.x, y: g.y, s: g.s, t: 0, lands: 'stake', stake: i, worth,
    arc: { x0: g.x, y0: g.y, x1: to.x + (rand() - 0.5) * P * 8, y1: to.y - P * 8, k: 0, high: P * 10, ms }
  });
}
