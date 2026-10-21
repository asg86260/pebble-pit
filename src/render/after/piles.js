// The camp's piles, yard style (docs/mocks/act3-stations-2026-10-18): the
// things themselves, stacked, and a count over each. Each takes a frame (kit.js)
// and the pile's state (`pileState`: what it shows, what it showed, since
// when), so a log coming on or going off fades. Cells off the frame's ground.

import { P } from '../../config.js';
import { K, W, PALE, MID, DUST, hash, pileAlpha, countAt } from './kit.js';
import { shown } from '../../tween.js';

// The count two cells over a pile's top, at a frame cell (cx, cy), in world px.
// Through the shared counts tween (tween.js, `shown`) by the pile's name, so a
// count taken from or added to runs a good at a time rather than jumping.
function count(d, n, cx, cy, key) { const at = d.world(cx, cy); countAt(at.x, at.y, key ? shown(`after-pile:${key}`, n) : n); }

// A log seen end on: a two-cell square, black rim, a pale cut face, a mid heart.
export function logEnd(d, x, y) { d.r(x, y, 2, 2, K); d.px(x * P + 2, y * P + 2, 2 * P - 4, 2 * P - 4, PALE); d.px(x * P + 5, y * P + 5, 2, 2, MID); }
// Logs, bricked: three on the floor, two on them, one on top.
const SPOTS = [[0, 0], [2, 0], [4, 0], [1, 1], [3, 1], [2, 2]];
export function logPile(d, x, st, cap = SPOTS.length) {
  const m = Math.min(Math.max(st.n, st.prev), cap);
  for (let i = 0; i < m; i++) d.fade(pileAlpha(i, st), () => logEnd(d, x + SPOTS[i][0], -2 - SPOTS[i][1] * 2));
  const shown = Math.min(st.n, cap), top = shown <= 3 ? 1 : shown <= 5 ? 2 : 3;
  count(d, st.n, x + 3, -top * 2 - 2.5, st.key);
}
// Timber: planks six cells long and a cell deep, every other one set in half a cell.
export function plankPile(d, x, st, cap = 6) {
  const m = Math.min(Math.max(st.n, st.prev), cap);
  for (let i = 0; i < m; i++) d.fade(pileAlpha(i, st), () => {
    const y = -1 - i, dx = i % 2 ? 0.5 : 0;
    d.px((x + dx) * P, y * P, 6 * P, P, K); d.px((x + dx) * P + 2, y * P + 2, 6 * P - 4, P - 4, PALE);
  });
  count(d, st.n, x + 3.25, -Math.max(1, Math.min(st.n, cap)) - 2.5, st.key);
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
export function heap(d, cx, R, st, n, tipped = false, pal = DUST) {
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
  count(d, n, cx + 0.5, -1 - top - 3);
}
// Paper: a white stack, a sheet three pixels, every other one ruled pale;
// posters the same with the top one's print showing.
export function sheetPile(d, x, st, cap = 6, print = false) {
  const m = Math.min(Math.max(st.n, st.prev), cap), w = 4 * P;
  for (let i = 0; i < m; i++) d.fade(pileAlpha(i, st), () => {
    const y = -2 - (i + 1) * 3;
    d.px(x * P, y, w, 3, K); d.px(x * P + 2, y, w - 4, 2, i === m - 1 || i % 2 ? W : PALE);
  });
  const shown = Math.min(st.n, cap), topY = -2 - shown * 3;
  if (print && shown > 0) {
    d.fade(pileAlpha(shown - 1, st), () => {
      const y = topY - 4 * P + 3;
      d.px(x * P, y, w, 4 * P, K); d.px(x * P + 2, y + 2, w - 4, 4 * P - 4, W);
      d.px(x * P + 5, y + 5, w - 10, 7, K);
      d.px(x * P + 5, y + 15, w - 10, 2, K); d.px(x * P + 5, y + 19, w - 14, 2, K);
    });
  }
  const top = print && shown > 0 ? topY - 4 * P : topY;
  count(d, st.n, x + 2, top / P - 2.5, st.key);
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
  count(d, st.n, x + 2 + (Math.max(1, Math.min(st.n, cap)) - 1), -9.5, st.key);
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
