// The camp's piles, yard style (docs/mocks/act3-stations-2026-10-18): the
// things themselves, stacked; the counted piles as plots of blocks, the
// sign rack with a count over it. The sign rack and the heap each take a
// frame (kit.js) and the pile's state (`pileState`: what it shows, what it
// showed, since when), so a sign coming on or going off fades. Cells off the
// frame's ground.

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
export const BLOCK_TONES = { log: { tone: MID, seam: K }, plank: { tone: PALE, seam: MID } };
export function goodBlock(x, y, kind, nb = null) {
  if (goodsLook()) { mockBlock(x, y, kind, nb || LONE); return; } // MOCK
  const t = BLOCK_TONES[kind], z = AFTER_BLOCK[kind] * AP;
  ctx.fillStyle = GREY[t.seam]; ctx.fillRect(x, y, z, z);
  ctx.fillStyle = GREY[t.tone]; ctx.fillRect(x, y, z - 1, z - 1);
}
// A counted pile, as its plot holds it (after/piles.js): each block where
// the sand rules have it. No count: the pile is the count.
export function blockPile(what) {
  const b = plotOf(what), kind = AFTER_PILES[what].good, foot = bottomY(b);
  const has = (c, r) => c >= 0 && c < b.cols && r >= 0 && r < b.rows && !!at(b, c, r); // MOCK
  for (let c = 0; c < b.cols; c++) for (let r = 0; r < b.rows; r++) if (at(b, c, r)) goodBlock(b.x + c * b.p, foot - (r + 1) * b.p, kind,
    { l: has(c - 1, r), r: has(c + 1, r), t: has(c, r + 1), b: has(c, r - 1) }); // MOCK
}

// --- MOCK: what the goods look like (mock-goods-look, never merged) ---------
// `globalThis.__goodsLook` picks a drawing ('a', 'b', 'c'); unset, the real
// one above. Every option keeps the block's size and place and paints only
// inside it. `nb` names which sides have a block of the pile against them
// (a lone block, carried or thrown or laid, has none).
export const goodsLook = () => globalThis.__goodsLook || null; // MOCK
const LONE = { l: false, r: false, t: false, b: false }; // MOCK
const rect = (x, y, w, h, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(x, y, w, h); }; // MOCK
// a cell of the block, (i, j) cells in from its top left // MOCK
const cellAt = (x, y, i, j, tone, w = 1, h = 1) => rect(x + i * AP, y + j * AP, w * AP, h * AP, tone); // MOCK
// The sign's face, in its own cells: the lettering, two strokes. // MOCK
const LETTERS = [[1, 1, 2, 1], [1, 2, 1, 1]]; // MOCK
function mockBlock(x, y, kind, nb) { // MOCK
  const n = AFTER_BLOCK[kind], z = n * AP, L = goodsLook(); // MOCK
  if (L === 'a') { // MOCK
    // A: the voted hairline, on every side. The pile is the seam tone; each // MOCK
    // block's face is inset a pixel from every edge it owns: its right and // MOCK
    // bottom always, its left and top where no block stands against them, // MOCK
    // so the seam between two is one pixel and so is the pile's outer edge. // MOCK
    const T = { log: [MID, K], plank: [PALE, MID], sign: [W, K] }[kind]; // MOCK
    const l = nb.l ? 0 : 1, t = nb.t ? 0 : 1; // MOCK
    rect(x, y, z, z, T[1]); rect(x + l, y + t, z - 1 - l, z - 1 - t, T[0]); // MOCK
    if (kind === 'log') cellAt(x, y, 1, 1, PALE, 2, 2); // MOCK  the end-grain
    if (kind === 'sign') for (const [i, j, w, h] of LETTERS) cellAt(x, y, i, j, K, w, h); // MOCK
    return; // MOCK
  } // MOCK
  if (L === 'b') { // MOCK
    // B: ground gaps. A log's and a sign's face is its block less its right // MOCK
    // column and bottom row, so a cell of bare ground stands between any // MOCK
    // two and round the pile's edge alike. Timber, too small to give up a // MOCK
    // cell, is a plank edge-on: its face over its shadow, row on row. // MOCK
    if (kind === 'plank') { cellAt(x, y, 0, 0, PALE, 2, 1); cellAt(x, y, 0, 1, MID, 2, 1); return; } // MOCK
    if (kind === 'log') { cellAt(x, y, 0, 0, MID, 3, 3); cellAt(x, y, 1, 1, PALE); return; } // MOCK
    cellAt(x, y, 0, 0, PALE, 3, 3); cellAt(x, y, 0, 0, K, 3, 1); cellAt(x, y, 1, 2, K); return; // MOCK
  } // MOCK
  if (L === 'c') { // MOCK
    // C: no seam; each good's shape is its own edge. A log is cut round: // MOCK
    // its four corner cells left bare, its heart pale. Timber is sawn // MOCK
    // square, a mid cell its sawn corner. A sign is a board on its post // MOCK
    // stub: three rows of face, the post a cell wide under it. // MOCK
    if (kind === 'log') { // MOCK
      cellAt(x, y, 1, 0, MID, 2, 1); cellAt(x, y, 0, 1, MID, 4, 2); cellAt(x, y, 1, 3, MID, 2, 1); // MOCK
      cellAt(x, y, 1, 1, PALE, 2, 2); return; // MOCK
    } // MOCK
    if (kind === 'plank') { cellAt(x, y, 0, 0, PALE, 2, 2); cellAt(x, y, 1, 1, MID); return; } // MOCK
    cellAt(x, y, 0, 0, K, 4, 3); cellAt(x, y, 1, 1, W, 2, 1); cellAt(x, y, 1, 3, K, 2, 1); return; // MOCK
  } // MOCK
} // MOCK
// Each option's sawdust: the heap's grain tones, a cell each. // MOCK
export const MOCK_DUST = { a: DUST, b: [PALE, W, PALE, PALE, W], c: [MID, MID, PALE, MID, MID] }; // MOCK
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

// Signs: a board on a post, stood in a row.
export function sign(d, x, y) {
  d.r(x, y, 4, 3, K); d.px(x * P + 2, y * P + 2, 4 * P - 4, 3 * P - 4, W);
  d.px(x * P + 6, y * P + 7, 12, 2, K); d.px(x * P + 6, y * P + 11, 8, 2, K);
  d.r(x + 1.5, y + 3, 1, 3, K);
}
export function signPile(d, x, st, cap = 3) {
  const m = Math.min(Math.max(st.n, st.prev), cap);
  for (let i = 0; i < m; i++) d.fade(pileAlpha(i, st), () => sign(d, x + i * 2, -6 - (i % 2)));
  count(d, st.n, x + 2 + (Math.max(1, Math.min(st.n, cap)) - 1), -7, st.key);
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
// The pile, each slot at the ink `alpha(i)` gives (fading on as it is set
// down and off as it is taken).
export function buildPile(d, x, alpha) {
  BUILD_SLOTS.forEach((s, i) => {
    const a = alpha(i);
    if (a > 0) d.fade(a, () => (s.k === 'plank' ? plankAt(d, x + s.x, s.y) : blockAt(d, x + s.x, s.y)));
  });
}
