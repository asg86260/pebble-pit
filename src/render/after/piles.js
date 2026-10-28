// The camp's piles, yard style (docs/mocks/act3-stations-2026-10-18): the
// things themselves, stacked; the counted piles, the workshop's sign rack
// among them, as plots of blocks, each brought and taken by a body or the
// hand and never faded. The sawdust heap takes a frame (kit.js) and the
// pile's state (`pileState`: what it shows, what it showed, since when).
// Cells off the frame's ground.

import { P, GREY, AFTER_COUNT_LIFT, AFTER_BLOCK, AFTER_PILES } from '../../config.js';
import { ctx } from '../ctx.js';
import { at, bottomY } from '../../grid.js';
import { plotOf } from '../../after/piles.js';
import { AP } from '../../after/place.js';
import { K, W, PALE, MID, DUST, hash, pileAlpha, pileState, countAt, pendingCounts } from './kit.js';
import { shown } from '../../tween.js';

// A pile's count, standing on the pile: its plate's foot AFTER_COUNT_LIFT
// over the pile's top `top` (world px), across from `x`. Through the shared
// counts tween (tween.js, `shown`) by the pile's name, so a count taken from
// or added to runs a good at a time rather than jumping. An empty pile has no
// count, as an empty kit stand in the yard has none (roster.js, `kitStands`):
// the count fades on with the pile's first good and off with its last, never
// a zero standing over bare floor.
export function countOver(x, top, n, key) {
  const a = pileAlpha(0, pileState(`count:${key}`, Math.round(n) > 0 ? 1 : 0));
  if (a <= 0) return;
  countAt(x, top - AFTER_COUNT_LIFT, shown(`after-pile:${key}`, n));
  const c = pendingCounts()[pendingCounts().length - 1];
  c.a = a; c.foot = true;
}
// The same off a frame: across from cell cx, over the pile's top at row `top`.
function count(d, n, cx, top, key) { const at = d.world(cx, top); countOver(at.x, at.y, n, key); }

// --- the counted piles as blocks (DESIGN.md, "Act 3's goods are blocks, and
// bodies carry every one"; the voted mock, mock-log-split round 28) ---------
// A good's block: one flat tone, the darkest good's the log's and timber
// pale, a pixel short of its square on its right and bottom so its seam tone
// shows there. Laid on a pile, the pile's shape is that seam tone filled
// solid behind its blocks, so the pixel between two is a seam, not a hole.
// The block's size is the good's (config/afterpiles.js); x, y its top left
// in world px, free (a carried or falling block is laid where it truly is).
// A sign is the camp's black board, as it is planted, its seam the paper
// between two in the rack.
export const BLOCK_TONES = { log: { tone: MID, seam: K }, plank: { tone: PALE, seam: MID }, sign: { tone: K, seam: W } };
export function goodBlock(x, y, kind) {
  const t = BLOCK_TONES[kind], z = AFTER_BLOCK[kind] * AP;
  ctx.fillStyle = GREY[t.seam]; ctx.fillRect(x, y, z, z);
  ctx.fillStyle = GREY[t.tone]; ctx.fillRect(x, y, z - 1, z - 1);
}
// A counted pile, as its plot holds it (after/piles.js): each block where
// the sand rules have it. No count: the pile is the count.
export function blockPile(what) {
  const b = plotOf(what), kind = AFTER_PILES[what].good, foot = bottomY(b);
  for (let c = 0; c < b.cols; c++) for (let r = 0; r < b.rows; r++) if (at(b, c, r)) goodBlock(b.x + c * b.p, foot - (r + 1) * b.p, kind);
}
// A heap of grains, in the sawdust's tones a cell, growing as a triangle from
// its middle column `cx`, `R` cells high at its brim. `st` counts cells.
const HEAPS = {};
export function heapCells(R) {
  if (HEAPS[R]) return HEAPS[R];
  const cells = [];
  for (let j = 0; j <= R; j++) for (let dx = -R; dx <= R; dx++) if (Math.abs(dx) + j <= R) cells.push([dx, j]);
  cells.sort((a, b) => (Math.abs(a[0]) + a[1]) - (Math.abs(b[0]) + b[1]) || a[1] - b[1] || a[0] - b[0]);
  return (HEAPS[R] = cells);
}
export function heap(d, cx, R, st, n, tipped = false, pal = DUST, key = st.key) {
  const cells = heapCells(R);
  const full = Math.min(st.n, st.prev), to = Math.min(cells.length, Math.max(st.n, st.prev));
  let top = 0;
  for (let i = 0; i < to; i++) {
    const [dx, j] = cells[i];
    const shift = tipped && j >= R / 2 ? 1 : 0;
    const tone = pal[Math.floor(hash((cx + dx) * 3.3 + j * 17.9) * pal.length)];
    if (i < full) { d.c(cx + dx + shift, -1 - j, tone); top = Math.max(top, j); }
    else d.fade(pileAlpha(i, st), () => d.c(cx + dx + shift, -1 - j, tone));
  }
  count(d, n, cx + 0.5, -1 - top, key);
}

// --- a station's loads, while it is raised (pile a, docs/mocks/act3-unbuilt-2026-10-18)
// Planks six cells long stacked staggered, as the timber pile stacks them,
// and two-cell blocks beside and on top: a builder's heap that visibly loses
// a load as each band goes up. Slots in the pile's cells, its left column at
// x and row -1 standing on the floor; a block's y is its top row.
export const BUILD_SLOTS = [
  { x: 0, y: -1, k: 'plank' }, { x: 0.5, y: -2, k: 'plank' }, { x: 7, y: -2, k: 'block' }, { x: 9, y: -2, k: 'block' },
  { x: 0, y: -3, k: 'plank' }, { x: 8, y: -4, k: 'block' }, { x: 0.5, y: -4, k: 'plank' }, { x: 2, y: -6, k: 'block' }
];
export const plankAt = (d, x, y, w = 6) => { d.px(x * P, y * P, w * P, P, K); d.px(x * P + 2, y * P + 2, w * P - 4, P - 4, PALE); };
export const blockAt = (d, x, y) => { d.r(x, y, 2, 2, K); d.px(x * P + 2, y * P + 2, 2 * P - 4, 2 * P - 4, MID); d.px(x * P + 4, y * P + 4, 4, 4, W); };
// The pile, each slot that `lies(i)` says is on it: whole from the moment a
// carrier sets it down until a builder takes it up, never faded, since a
// body's hands bring it and take it away.
export function buildPile(d, x, lies) {
  BUILD_SLOTS.forEach((s, i) => {
    if (lies(i)) (s.k === 'plank' ? plankAt(d, x + s.x, s.y) : blockAt(d, x + s.x, s.y));
  });
}
