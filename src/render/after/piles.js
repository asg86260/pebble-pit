// The camp's piles, yard style (docs/mocks/act3-stations-2026-10-18): the
// things themselves, stacked; the counted piles, the workshop's sign rack
// among them, as plots of blocks, each brought and taken by a body or the
// hand and never faded. The sawdust heap takes a frame (kit.js) and the
// pile's state (`pileState`: what it shows, what it showed, since when).
// Cells off the frame's ground.

import { P, GREY, AFTER_COUNT_LIFT, AFTER_BLOCK, AFTER_PILES } from '../../config.js';
import { ctx } from '../ctx.js';
import { AFTER_LOG_ROLL_S } from '../../config.js';
import { units, colX, rowY, tagOf } from '../../after/ground.js';
import { AP } from '../../after/place.js';
import { SPLIT_S } from './pine.js';
import { K, W, PALE, MID, DUST, hash, pileAlpha, pileState, countAt, pendingCounts, clamp01, inView } from './kit.js';
import { shown } from '../../tween.js';
import { themed } from '../../ink.js'; // MOCK

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
export function goodBlock(x, y, kind, seed = 1) {
  if (goodsLook()) { mockBlock(x, y, kind, seed); return; } // MOCK
  const t = BLOCK_TONES[kind], z = AFTER_BLOCK[kind] * AP;
  ctx.fillStyle = GREY[t.seam]; ctx.fillRect(x, y, z, z);
  ctx.fillStyle = GREY[t.tone]; ctx.fillRect(x, y, z - 1, z - 1);
}
// Every good on the act's ground (after/ground.js), piles and open floor
// alike, each block where the heap rule has it: one drawing for all of them,
// so a pile is only where its blocks stand. No count: the pile is the count.
// A unit still arriving is drawn along its way there, whole, at its true
// position: a felled log faded in over the trunk and sliding off to rest,
// slowing, over AFTER_LOG_ROLL_S; a good let go of falling under the yard's
// gravity from where it was let go (ground.js, `fallTag`).
export function drawGround(t) {
  for (const u of units()) {
    const z = u.z * AP;
    let x = colX(u.c0), y = rowY(u.r0 + u.z), a = 1;
    const tg = tagOf(u.ai);
    if (tg && tg.fall != null) {
      const k = tg.fall > 0 ? clamp01((t - tg.at) / tg.fall) : 1, bot = rowY(u.r0);
      y = (tg.y0 ?? bot) + (bot - (tg.y0 ?? bot)) * k * k - z;
    } else if (tg && tg.x0 != null && tg.at != null) {
      const since = t - tg.at;
      if (since < -SPLIT_S) continue;
      const r = clamp01(since / AFTER_LOG_ROLL_S), e = 1 - (1 - r) * (1 - r);
      x = tg.x0 + (x - tg.x0) * e;
      a = clamp01((since + SPLIT_S) / SPLIT_S);
    }
    if (!inView(x - z, z * 3)) continue;
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * a;
    goodBlock(Math.round(x), Math.round(y), u.kind, seedOf(u.ai)); // MOCK: seed
    ctx.globalAlpha = was;
  }
}

// --- MOCK: what the goods look like (mock-goods-look2, never merged) --------
// The owner, 2026-10-27: "lets add some variety to each resource instead of a
// border. similar to act 1". No seam: each block is mottled cell by cell as
// act 1's dust is. Act 1's mechanism, reused: a grain carries its shade in
// its cell (grid.js; picked by `shadeNear` as it is made) and keeps it
// through every slump, sweep, throw and landing. Here a block carries its
// shade (1..6) the same way (after/piles.js `setBlock`, the hand's motes and
// chips `s`), and its cells pick their tones off it with act 3's own per-cell
// hash (kit.js `hash`, as the sawdust heap and the soil pick theirs). Seeded
// off the block, never its place, so it keeps its pattern as it moves.
// `globalThis.__goodsLook` picks the option; unset, the real drawing above.
export const goodsLook = () => globalThis.__goodsLook || null; // MOCK
// Each good's own palette, rungs of GREY light to dark. The act's four are // MOCK
// 0 paper, 3 pale, 6 mid, 10 ink; the rest are added, each with one role: // MOCK
// 2 sawdust's light grain, 4 timber's shade, 5 timber's dark grain, 7 the // MOCK
// log's shade, 8 the log's bark, 9 the sign's board; 1 (b only) sawdust's // MOCK
// palest grain. A sign is the dark good, as the flag it becomes is ink. // MOCK
const PAL = { // MOCK
  a: { log: [6, 7, 8], plank: [3, 4, 5], sign: [9, 10] }, // MOCK
  b: { log: [6, 7, 8], plank: [3, 4, 5], sign: [8, 9, 10] }, // MOCK
  c: { log: [6, 7, 8], plank: [3, 4, 5], sign: [9, 10] } // MOCK
}; // MOCK
const KIND_SEED = { log: 11.3, plank: 23.9, sign: 37.1 }; // MOCK
let into = null; // MOCK  the block's own sheet while it is painted
const cell = (x, y, i, j, g) => { into.fillStyle = GREY[g]; into.fillRect(x + i * AP, y + j * AP, AP, AP); }; // MOCK
// A block is painted once on its own sheet, a pixel a world px, and laid at // MOCK
// its true position whole (CLAUDE.md, "Art on the grid, motion smooth"): // MOCK
// cells laid one by one at a carried block's fractional x leave a // MOCK
// hairline between each. Dropped when the page turns (ink.js, `themed`). // MOCK
const SHEETS = themed(new Map()); // MOCK
function mockBlock(x, y, kind, seed) { // MOCK
  const s = Math.max(1, Math.min(6, Math.round(seed) || 1)), key = `${goodsLook()}|${kind}|${s}`; // MOCK
  let sheet = SHEETS.get(key); // MOCK
  if (!sheet) { // MOCK
    const z = AFTER_BLOCK[kind] * AP; // MOCK
    sheet = document.createElement('canvas'); sheet.width = sheet.height = z; // MOCK
    into = sheet.getContext('2d'); paintBlock(0, 0, kind, s); into = null; // MOCK
    SHEETS.set(key, sheet); // MOCK
  } // MOCK
  const was = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; // MOCK
  ctx.drawImage(sheet, x, y); ctx.imageSmoothingEnabled = was; // MOCK
} // MOCK
function paintBlock(x, y, kind, s) { // MOCK
  const L = goodsLook(), pal = PAL[L][kind], n = AFTER_BLOCK[kind], last = pal.length - 1; // MOCK
  // the block's own base, its shade read along its good's palette: two // MOCK
  // blocks side by side mostly differ in tone, and that is their edge // MOCK
  const base = Math.round((s - 1) / 5 * last); // MOCK
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { // MOCK
    const h = hash(s * 7.31 + KIND_SEED[kind] + i * 13.1 + j * 7.7); // MOCK
    let k = base; // MOCK
    if (L === 'b') { // MOCK
      // strong: a cell in two a step off, and the block leaning a step // MOCK
      // darker toward its bottom right // MOCK
      k += h < 0.25 ? -1 : h > 0.75 ? 1 : 0; // MOCK
      if (i + j >= n) k += hash(s * 3.7 + i * 5.3 + j * 9.1) < 0.6 ? 1 : 0; // MOCK
    } else k += h < 0.12 ? -1 : h > 0.88 ? 1 : 0; // MOCK  subtle: a cell in four off
    cell(x, y, i, j, pal[Math.max(0, Math.min(last, k))]); // MOCK
  } // MOCK
  if (L !== 'c') return; // MOCK
  // c: the mottle and a mark of what the good is, a step off the block's // MOCK
  // base: a log's end-grain, timber's grain along its top row, a sign's // MOCK
  // lettering in ink // MOCK
  const off = base > 0 ? pal[base - 1] : pal[Math.min(last, base + 1)]; // MOCK
  if (kind === 'log') { cell(x, y, 1, 1, off); cell(x, y, 2, 2, off); } // MOCK
  else if (kind === 'plank') { cell(x, y, 0, 0, off); cell(x, y, 1, 0, off); } // MOCK
  else { cell(x, y, 1, 1, W); cell(x, y, 2, 1, W); cell(x, y, 1, 2, W); } // MOCK  paper lettering on the dark board
} // MOCK
// Each option's sawdust: the heap's grain tones, a cell each (kit.js DUST is // MOCK
// pale flecked mid); here lighter than timber, 2 flecked pale and 4, and // MOCK
// b's speckled wider, down to 1. // MOCK
export const MOCK_DUST = { a: [2, PALE, 2, 2, 4], b: [1, 2, PALE, 2, 4, 1], c: [2, PALE, 2, 2, 4] }; // MOCK
// A block a body carries or lays has no cell to keep a shade in: seeded off // MOCK
// what holds it (its id, its place in the load), so it holds while held. // MOCK
export const seedOf = (id, k = 0) => 1 + ((((Number(id) || 0) * 3 + k * 5) % 6) + 6) % 6; // MOCK
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
