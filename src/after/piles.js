// Act 3's counted piles: strips of the act's one ground (after/ground.js;
// DESIGN.md, "One resource system for every act"), as a yard station's pile
// is a strip of its floor -- the saw mill's logs and timber, the forestry
// shack's logs, the workshop's timber and signs. A block set down on one
// falls, rolls off the heap's side and rests by the heap rule every block on
// the ground settles by (grid.js, `stepBlock`), and a block is only ever
// taken off the top.
//
// The pile's count is its strip's units of its good, read off the cells
// after every write into `S.after.stock` (ground.js, `survey`): a copy, kept
// until its last readers read the cells. Below is the pile's interface its
// bodies, the saw and the bench use, and the hand's adapter over the ground.

import { S, afterGround as G } from '../state.js';
import { AFTER_PILES, AFTER_LOG_TIMBER, AFTER_PILE_SETTLE_S, KINDS } from '../config.js';
import { colOf, cellOf } from '../grid.js';
import { afterX0, afterX1, stationDoor, AP } from './place.js';
import { pileGrid } from './art.js';
import { bedLand } from './mill.js';
import { PILED, stripOf, slotTop, slotNear, colX, rowY, units, counted, uncovered, takeAt, takeTopOf, putIn, putSomewhere, putBeside,
         standGround, settleGround, ledger, lying, groundVersion } from './ground.js';
import { secs } from './util.js';

export { PILED };
export const isPiled = what => what in AFTER_PILES;

// --- the one interface ---------------------------------------------------------------
export const pileCount = what => S.after.stock[what];
export const pileBrim = what => AFTER_PILES[what].brim;
export const pileRoom = what => pileBrim(what) - pileCount(what);
// What a pile's supply sets down at once: the saw's cut is a log's timber,
// every other pile is set down on a block at a time.
const SUPPLY = { timber: AFTER_LOG_TIMBER };
// At its brim: no room for what its supply sets down at once, so the supply
// stops and the pile wears the pile-full mark -- one test for both, so a
// stopped saw is never unmarked.
export const pileFull = what => !!S.after && pileRoom(what) < (SUPPLY[what] || 1);

// Where on its strip a block is set down when nobody says where, as a slot of
// the strip counted from its left: the slot nearest the strip's middle that
// still has room under its ceiling, so a pile set down on by its bodies
// stands as one heap; a pile fed from its near side (`near`, the timber mound
// off the saw mill's chute) the first slot from that side with room, so a
// block slides off the chute onto the mound rather than across it.
export function dropCol(what) {
  const s = stripOf(what);
  if (!s || !G.grid) return 0;
  const n = (s.c1 - s.c0) / s.z, mid = Math.floor(n / 2);
  const order = AFTER_PILES[what].near ? [...Array(n).keys()]
    : [...Array(n).keys()].sort((p, q) => Math.abs(p - mid) - Math.abs(q - mid) || p - q);
  for (const j of order) {
    const c = s.c0 + j * s.z, top = slotTop(c, s.z);
    let room = true;
    for (let i = c; i < c + s.z; i++) if (top + s.z > G.ceiling(i)) room = false;
    if (room) return j;
  }
  return order[0];
}
const dropX = what => { const s = stripOf(what); return colX(s.c0 + dropCol(what) * s.z) + s.z * AP / 2; };

// The blocks of pile `what` that may be taken now: each slot's top, its good.
function tops(what) {
  const s = stripOf(what);
  return units().filter(u => u.c0 >= s.c0 && u.c0 < s.c1 && counted(u) && uncovered(u.ai));
}
// A block taken off pile `what`: the top of the slot under world x, or of the
// nearest slot with one; with no x, the highest top. False with the pile bare.
export function takeBlock(what, x = null) {
  if (!S.after || pileCount(what) <= 0) return false;
  const t = tops(what);
  if (!t.length) return false;
  const mid = u => colX(u.c0) + u.z * AP / 2;
  const pick = x == null ? t.reduce((b, u) => (u.r0 > b.r0 ? u : b))
    : t.reduce((b, u) => (Math.abs(mid(u) - x) < Math.abs(mid(b) - x) ? u : b));
  return !!takeAt(pick.ai);
}
// A block set down on pile `what` at world x (where its drop is with no x):
// it lands on the heap there and rolls where the heap rule takes it, inside
// the strip. False with the pile at its brim or its heap at its ceiling.
export function setBlock(what, x = null) {
  if (!S.after || pileRoom(what) <= 0) return false;
  const s = stripOf(what);
  const at = x == null ? dropX(what) : Math.max(colX(s.c0), Math.min(colX(s.c1) - 1, x));
  return putIn(cellOf(s.kind), at) >= 0;
}
// `n` blocks off the top of pile `what` (a bill, a joining): how many came.
export function takeBlocks(what, n) {
  let k = 0;
  while (k < n && takeBlock(what)) k++;
  ledger().bulk += k;
  return k;
}

// A pile's count stood up from a number (an older save's, handed over by the
// one-ground migration; a grant): set down a block at a time at its drop,
// let come to rest before the next, so the heap stands as blocks set down one
// by one would leave it. Past the brim, or past the ceiling, the rest are
// laid on the open ground beside the strip, where a gatherer carries them
// home as room comes: nothing a player held is lost.
export function standPile(what, n) {
  const s = stripOf(what);
  if (!s) return;
  for (let k = 0; k < n; k++) {
    if (!setBlock(what)) putBeside(cellOf(s.kind), dropX(what));
    settleAll();
  }
}
function settleAll() { for (let i = 0; i < 400 && settleGround(); i++) { /* to rest */ } }

// Every pile stood up again: the act begun, or a save just read. `lay` the
// list an older save handed over (after/index.js, `S.after.lay`): a pile's
// count ({ what, n }), a good lying at an x ({ kind, x }), or the log the
// sawyer held, laid at the saw mill's door ({ kind, near: 'mill' }).
export function standPiles() {
  if (!S.after) return;
  const lay = Array.isArray(S.after.lay) ? S.after.lay : [];
  S.after.lay = [];
  standGround(lay.map(item => () => {
    if (!item || typeof item !== 'object') return;
    if (isPiled(item.what)) standPile(item.what, Math.max(0, Math.floor(+item.n || 0)));
    else if (KINDS[item.kind] && Number.isFinite(item.x)) putSomewhere(cellOf(item.kind), item.x + KINDS[item.kind].size * AP / 2);
    else if (KINDS[item.kind] && item.near === 'mill') putSomewhere(cellOf(item.kind), stationDoor('mill'));
  }));
}

// One frame of the ground: a pass of the heap rule every AFTER_PILE_SETTLE_S,
// so a block set down is seen rolling to rest.
export function stepPiles(c) {
  if (!G.grid) return;
  if (!G.awakeN) { G.t = 0; return; }
  for (G.t += secs(c); G.t >= AFTER_PILE_SETTLE_S; G.t -= AFTER_PILE_SETTLE_S) settleGround();
}

// --- each pile as a plot of blocks (TEMP: step 4 retires the readers) --------------
// A counted pile as its old plot was shaped, a cell a block, `p` a block's
// width, its bottom row on its strip's ground: the saw's lift and the
// mound's drop (mill.js), the hand work's cue, the dev hooks and the checks
// still read it. One object an act state, filled from the cells whenever
// they have changed, a cell set for every block of its good in the strip.
const VIEWS = new WeakMap(); // cache: each act state's pile views, filled off the ground's cells
export function plotOf(what) {
  let vs = VIEWS.get(S.after);
  if (!vs) VIEWS.set(S.after, (vs = {}));
  const s = stripOf(what);
  if (!s) return null;
  let v = vs[what];
  if (!v) {
    const cols = (s.c1 - s.c0) / s.z, rows = Math.max(pileGrid(what).rows, AFTER_PILES[what].brim), p = s.z * AP;
    v = vs[what] = { x: colX(s.c0), y: 0, cols, rows, p, grid: new Uint8Array(cols * rows), n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null, at: -1 };
  }
  if (v.at !== groundVersion() && G.grid) {
    v.at = groundVersion();
    v.y = rowY(G.fixed && G.grid ? groundRow(s.c0) : 0) - v.rows * v.p;
    v.grid.fill(0);
    for (const u of units()) {
      if (u.c0 < s.c0 || u.c0 >= s.c1 || !counted(u)) continue;
      const c = (u.c0 - s.c0) / s.z;
      let r = Math.max(0, Math.min(v.rows - 1, Math.round((u.r0 - groundRow(u.c0)) / s.z)));
      for (let k = 0; k < v.rows && v.grid[r * v.cols + c]; k++) r = (r + 1) % v.rows;
      v.grid[r * v.cols + c] = 1;
    }
  }
  return v;
}
// The row a column's terrain tops out at: the first a unit may stand in.
const groundRow = c => { let r = 0; while (r < G.rows && G.fixed(c, r)) r++; return r; };

// --- the yard's hand on the ground (TEMP: step 3's one hand replaces it) ------------
// Act 3's goods as the yard's hand asks a place for them (acts.js, `plots`;
// hands.js): picked up as act 1's dust is, a press and hold over them,
// anywhere on the ground, a pile's strip or open floor alike, and thrown the
// same way. The hand never writes a cell itself: what it takes and what
// lands go through the ground's doors, so each pile stays its count.
const nearOf = (u, x, y) => {
  const w = u.z * AP, x0 = colX(u.c0), top = rowY(u.r0 + u.z);
  const dx = Math.max(x0 - x, 0, x - (x0 + w)), dy = Math.max(top - y, 0, y - (top + w));
  return Math.hypot(dx, dy);
};
export const AFTER_PLOTS = {
  // The ground under (x, y) when a good lies within `reach` px of it: { b,
  // kind }, the kind the hand holds if one of those is near, else the
  // nearest's. Null over bare ground.
  at(x, y, reach = 0) {
    if (!S.after || !G.grid) return null;
    const held = S.held && S.motes[0] ? S.motes[0].kind : null;
    let best = null, d0 = Infinity;
    for (const u of units()) {
      const d = nearOf(u, x, y);
      if (d > reach) continue;
      const score = d + (held && u.kind !== held ? 1e6 : 0);
      if (score < d0) { d0 = score; best = u; }
    }
    return best ? { b: G, kind: best.kind } : null;
  },
  // A press over a heap takes the top of the column under it, never a block
  // with another resting on it (the owner, 2026-10-28: "grabbing from a pile
  // always grabs the bottom one, which leads to jank").
  take: (spot, c) => !!takeTopOf(c, spot.kind),
  // The goods of `kind` lying free within `reach` px of (x, y), nearest first,
  // and one taken up through the ground's door: the old lying list's shape.
  lyingNear: (x, y, reach, kind) => lying().filter(q => q.kind === kind && q.free && Math.abs(q.x + q.w / 2 - x) <= reach + q.w)
    .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x)),
  lift: q => !!takeAt(q.id),
  // A thrown block, `ch` a chip of S.chips whose x, y are the block's middle,
  // one frame on: kept inside the place; let go over the saw's bed, set down
  // there (mill.js); else, once its foot comes down on the ground's top under
  // it, set down there -- on a pile of its kind with room, into it; on a pile
  // full or of another good, beside it; on open ground, where it falls, to
  // roll by the heap rule. True once it is down.
  land(ch) {
    if (!S.after || !G.grid) return true;    // the act begun again under it: nowhere left to land
    const k = KINDS[ch.kind];
    if (!k) return true;
    const half = k.size * AP / 2, lo = afterX0() + half, hi = afterX1() - half;
    if (ch.x < lo) { ch.x = lo; ch.vx = Math.abs(ch.vx) * 0.6; }
    if (ch.x > hi) { ch.x = hi; ch.vx = -Math.abs(ch.vx) * 0.3; }
    if (ch.vy <= 0) return false;
    if (bedLand(ch)) return true;           // a log let go over the saw mill's bed (mill.js)
    const slot = slotNear(colOf(G, ch.x - half + AP / 2), k.size);
    const top = slot >= 0 ? rowY(slotTop(slot, k.size)) : rowY(0);
    if (ch.y + half < top) return false;
    landUnit(ch.kind, ch.x);
    return true;
  }
};
// A unit of `kind` come down at world x (its middle): into the pile under it
// if that is its good's and has room, else beside it, else where it fell.
export function landUnit(kind, x) {
  const c = Math.max(0, Math.min(G.cols - 1, colOf(G, x))), v = cellOf(kind);
  for (const what of PILED) {
    const s = stripOf(what);
    if (!s || c < s.c0 || c >= s.c1) continue;
    if (s.kind === kind && setBlock(what, x)) return true;
    return putBeside(v, x) >= 0;
  }
  return putSomewhere(v, x) >= 0;
}

// Every hand-off through the doors since the act was stood up: each pile's
// net, and the blocks lifted off in bulk (a bill once was). Read by the rule
// that no pile's count moves but through a body, a hand or a tool
// (verify.js, rule 24).
export const pileLedger = () => (S.after ? ledger() : null);
