// Act 3's counted piles: strips of the act's one ground (after/ground.js;
// DESIGN.md, "One resource system for every act"), as a yard station's pile
// is a strip of its floor -- the saw mill's logs and timber, the forestry
// shack's logs, the workshop's timber and signs. A block set down on one
// falls, rolls off the heap's side and rests by the heap rule every block on
// the ground settles by (grid.js, `stepBlock`), and a block is only ever
// taken off the top.
//
// The pile's count is its strip's units of its good, read off the cells
// (ground.js, `countOf`) and stored nowhere. Below is the pile's interface its
// bodies, the saw and the bench use, and the landing the place hands the
// one chain.

import { S, afterGround as G } from '../state.js';
import { AFTER_PILES, AFTER_LOG_TIMBER, AFTER_PILE_SETTLE_S, KINDS } from '../config.js';
import { colOf, cellOf, kindOf } from '../grid.js';
import { afterX0, afterX1, stationDoor, buildPileAt, AP } from './place.js';
import { bedLand, sawdustCount, pourSawdust, heapPlot } from './mill.js';
import { PILED, stripOf, slotTop, slotNear, colX, rowY, units, counted, uncovered, takeAt, putIn, putSomewhere, putBeside,
         standGround, settleGround, countOf, fallTag } from './ground.js';
import { secs } from './util.js';

export { PILED };
export const isPiled = what => what in AFTER_PILES;

// --- the one interface ---------------------------------------------------------------
export const pileCount = what => countOf(what);
// Every good the camp holds as a number a card or a bill reads: a pile's units,
// the sawdust heap's grains, zero for anything else.
// Every count the camp holds, by name: what a card or a check reads at a glance.
export const goodsRead = () => Object.fromEntries([...PILED, 'sawdust'].map(w => [w, goodCount(w)]));
export const goodCount = what => (what === 'sawdust' ? sawdustCount() : isPiled(what) ? countOf(what) : 0);
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
// The highest block of pile `what` that may be taken now (a unit of the
// ground: its cell, kind and size), or null with the pile bare.
export function topBlock(what) {
  const t = S.after && stripOf(what) ? tops(what) : [];
  return t.length ? t.reduce((b, u) => (u.r0 > b.r0 ? u : b)) : null;
}
// Where a block set down on pile `what` with no x comes to rest: its middle's
// world x, and the world y of the surface under it.
export function dropSpot(what) {
  const s = stripOf(what), c = s.c0 + dropCol(what) * s.z;
  return { at: dropX(what), top: rowY(slotTop(c, s.z)) };
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
// count ({ what, n }), a good lying at an x ({ kind, x }), the log the
// sawyer held, laid at the saw mill's door ({ kind, near: 'mill' }), or a
// load on a site's strip ({ kind: 'load', site, at }, `at` its place across).
export function standPiles() {
  if (!S.after) return;
  const lay = Array.isArray(S.after.lay) ? S.after.lay : [];
  S.after.lay = [];
  heapPlot();                                  // the heap's saved grains read back now, before anything is laid on them
  standGround(lay.map(item => () => {
    if (!item || typeof item !== 'object') return;
    if (item.what === 'sawdust') pourSawdust(Math.max(0, Math.floor(+item.n || 0)));
    else if (isPiled(item.what)) standPile(item.what, Math.max(0, Math.floor(+item.n || 0)));
    else if (item.kind === 'load' && item.site) putSomewhere(cellOf('load'), buildPileAt(item.site) + (((item.at | 0) % 6) * 2 + 1) * AP);
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

// Act 3's landing, as data the place hands the one chain (game.js,
// `stepChips`): its bounds and its surfaces in order -- the saw's bed, then
// the ground, a pile being only a strip of it. `ch` is a chip of S.chips
// whose x, y are a block's middle, one frame on.
const half = ch => KINDS[ch.kind].size * AP / 2;
export const AFTER_LANDING = {
  // kept inside the place
  clamp(ch) {
    if (!KINDS[ch.kind]) return;
    const h = half(ch), lo = afterX0() + h, hi = afterX1() - h;
    if (ch.x < lo) { ch.x = lo; ch.vx = Math.abs(ch.vx) * 0.6; }
    if (ch.x > hi) { ch.x = hi; ch.vx = -Math.abs(ch.vx) * 0.3; }
  },
  surfaces: [
    // the act begun again under it: nowhere left to land
    ch => (!S.after || !G.grid || !KINDS[ch.kind] ? 1 : 0),
    // a log let go over the saw mill's bed, set down there (mill.js)
    ch => (ch.vy > 0 && bedLand(ch) ? 1 : 0),
    // once its foot comes down on the ground's top under it, set down there --
    // on a pile of its kind with room, into it; on a pile of another good, on its
    // mound; on a pile full, beside it; on open ground, where it falls, to roll by the heap
    // rule. It keeps its own cell value (kind and shade) down.
    ch => {
      if (ch.vy <= 0) return 0;
      const k = KINDS[ch.kind], h = half(ch);
      const slot = slotNear(colOf(G, ch.x - h + AP / 2), k.size);
      const top = slot >= 0 ? rowY(slotTop(slot, k.size)) : rowY(0);
      if (ch.y + h < top) return 0;
      // a good let go of, come down where its foot is (ground.js, `fallTag`)
      fallTag(landUnit(ch.kind, ch.x, kindOf(ch.s) === ch.kind ? ch.s : cellOf(ch.kind)), ch.y + h);
      return 1;
    }
  ]
};
// A unit of `kind` come down at world x (its middle): into the pile under it
// if that is its good's and has room; a good of another kind on the pile lies
// on the mound by the heap rule, a unit among the pile's own (not counted for
// it, and carried home from the top by a body); a pile full beside it; open
// ground where it fell. Its bottom-left cell, or -1 with nowhere to lie.
export function landUnit(kind, x, v = cellOf(kind)) {
  const c = Math.max(0, Math.min(G.cols - 1, colOf(G, x)));
  for (const what of PILED) {
    const s = stripOf(what);
    if (!s || c < s.c0 || c >= s.c1) continue;
    if (s.kind !== kind || pileRoom(what) > 0) {
      const ai = putIn(v, Math.max(colX(s.c0), Math.min(colX(s.c1) - 1, x)));
      if (ai >= 0) return ai;
    }
    return putBeside(v, x);
  }
  return putSomewhere(v, x);
}
