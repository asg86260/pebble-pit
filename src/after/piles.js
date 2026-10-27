// Act 3's counted piles, each a grid.js plot whose cell is one block
// (DESIGN.md, "Act 3's goods are blocks, and bodies carry every one"): the
// saw mill's logs and timber, the forestry shack's logs. A block set down
// falls, rolls off the heap's side and slumps into a gap by the sand rules
// every grid in the game settles by (the casino's bins the precedent), and
// a block taken off the top lets the heap slump.
//
// The pile is the stock. The save keeps the count (`S.after.stock`, a number
// a pile) and nothing else; the plot holds exactly that many cells at all
// times because every write to those three counts goes through this file --
// a block taken here comes off the plot and the count together, and one set
// down lands on both. verify.js holds it to that. The plots are never saved:
// a read save stands each one back up from its count, settled to rest before
// the first frame (`standPiles`), so a save carries no grid.

import { S } from '../state.js';
import { AFTER_PILES, AFTER_PILE_SETTLE_S, AFTER_LOG_TIMBER, AFTER_GOODS_FOOT, AFTER_LAY_GAP } from '../config.js';
import { addGrain, put, topRow, settle, settleSome, colOf } from '../grid.js';
import { pilePlace, pileOwner, pileMid, pileAt, groundOf, AP } from './place.js';
import { layGood } from './grove.js';
import { secs } from './util.js';

// The stock keys that are plots.
export const PILED = Object.keys(AFTER_PILES);
export const isPiled = what => what in AFTER_PILES;

// The plots, kept on the act's state but out of its save: not enumerable, so
// the saver's JSON.stringify of `S.after` passes them by, and a save read
// over a blank (placesave.js) comes back without them to be stood up again.
function plots() {
  const a = S.after;
  if (!Object.prototype.hasOwnProperty.call(a, 'piles')) Object.defineProperty(a, 'piles', { value: {}, writable: true, configurable: true, enumerable: false });
  return a.piles;
}
// Where a block is set down when nobody says where: the plot's middle
// column, so a pile set down on by its bodies stands as one heap, not
// against a side.
const dropX = b => b.x + Math.floor(b.cols / 2) * b.p + b.p / 2;
const rest = b => { while (settle(b)) { /* until nothing moves */ } };

// A pile stood up from its count: each block set down on the middle column
// and let come to rest before the next, so a read save's heap stands as the
// same blocks set down one by one would have left it. A count past the brim
// (a save from before the brims, or before timber halved) keeps the brim;
// the rest are laid on the floor beside the pile, where a gatherer carries
// them home as room comes (bodies.js, `gather`): nothing a player held is lost.
function stand(what) {
  const g = pilePlace(what), a = S.after;
  const b = { ...g, grid: new Uint8Array(g.cols * g.rows), n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null, repose: false, settleAt: 0, t: 0 };
  const had = Math.max(0, Math.floor(+a.stock[what] || 0)), keep = Math.min(had, AFTER_PILES[what].brim);
  for (let i = 0; i < keep; i++) { addGrain(b, dropX(b), undefined, 1, true); rest(b); }
  a.stock[what] = keep;
  if (had > keep) layOver(what, had - keep);
  return b;
}
function layOver(what, n) {
  const key = pileOwner(what), kind = AFTER_PILES[what].good, x0 = pileMid(key, what);
  const away = x0 < pileAt(key, what) ? -1 : 1, step = (AFTER_GOODS_FOOT[kind] + AFTER_LAY_GAP) * AP;
  for (let k = 0; k < n; k++) layGood(kind, x0 + away * (k % 4) * step, groundOf(key));
}
// Pile `what`'s plot, stood up from its count the first time it is asked.
export const plotOf = what => plots()[what] || (plots()[what] = stand(what));
// Every pile stood up again from its count: a save just read, or the act begun.
export function standPiles() {
  if (!S.after) return;
  plots();
  S.after.piles = {};
  for (const what of PILED) plotOf(what);
}

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

// A block taken off pile `what`: the top of the column under world x, or of
// the nearest column with one in it; with no x, off the top of the heap.
// False with the pile bare.
export function takeBlock(what, x = null) {
  if (pileCount(what) <= 0) return false;
  const b = plotOf(what);
  let col = -1;
  if (x == null) {
    for (let c = 0, hi = -1; c < b.cols; c++) { const r = topRow(b, c); if (r > hi) { hi = r; col = c; } }
  } else {
    const at = Math.max(0, Math.min(b.cols - 1, colOf(b, x)));
    for (let d = 0; d < b.cols && col < 0; d++) {
      if (at - d >= 0 && topRow(b, at - d) >= 0) col = at - d;
      else if (at + d < b.cols && topRow(b, at + d) >= 0) col = at + d;
    }
  }
  if (col < 0) return false;
  put(b, col, topRow(b, col), 0);
  S.after.stock[what] -= 1;
  return true;
}
// A block set down on pile `what` at world x (its middle column with no x):
// it falls there and rolls where the sand rules take it. False with the pile
// at its brim.
export function setBlock(what, x = null) {
  if (pileRoom(what) <= 0) return false;
  const b = plotOf(what);
  if (!addGrain(b, x ?? dropX(b), undefined, 1, true)) return false;
  S.after.stock[what] += 1;
  return true;
}
// `n` blocks off the top of pile `what` (a bill, a joining): how many came.
export function takeBlocks(what, n) {
  let k = 0;
  while (k < n && takeBlock(what)) k++;
  return k;
}

// One frame of the piles: a pass of the sand rules over each every
// AFTER_PILE_SETTLE_S, so a block set down is seen rolling to rest.
export function stepPiles(c) {
  const dt = secs(c);
  for (const what of PILED) {
    const b = plotOf(what);
    if (!b.awakeN) { b.t = 0; continue; }
    for (b.t += dt; b.t >= AFTER_PILE_SETTLE_S; b.t -= AFTER_PILE_SETTLE_S) settleSome(b, b.cols * b.rows);
  }
}
