// The camp's piles, yard style (docs/mocks/act3-stations-2026-10-18): the
// things themselves, stacked; the counted piles, the workshop's sign rack
// among them, as plots of blocks, each brought and taken by a body or the
// hand and never faded. The sawdust heap takes a frame (kit.js) and the
// pile's state (`pileState`: what it shows, what it showed, since when).
// Cells off the frame's ground.

import { P, AFTER_COUNT_LIFT, AFTER_BLOCK, KINDS, AFTER_GOODS_DARK } from '../../config.js';
import { ctx } from '../ctx.js';
import { AFTER_LOG_ROLL_S } from '../../config.js';
import { units, colX, rowY, tagOf } from '../../after/ground.js';
import { AP } from '../../after/place.js';
import { SPLIT_S } from './pine.js';
import { DUST, hash, pileAlpha, pileState, countAt, pendingCounts, clamp01, inView } from './kit.js';
import { shown } from '../../tween.js';
import { kindOf, toneOf } from '../../grid.js';
import { darkPage, raw } from '../../ink.js';

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
// bodies carry every one") ---------------------------------------------------
// A good's block: one flat square of the tone its unit was born with, one of
// its good's four colors (its kind's palette, config/palette.js AFTER_GOODS), no seam: the tones
// told apart are what keeps two blocks of a pile countable. `v` is the unit's
// cell value (grid.js, `cellOf`); a value of another kind, or none, is the
// good's first tone. The block's size is the good's (config/afterpiles.js);
// x, y its top left in world px, free (a carried or falling block is laid
// where it truly is).
// A good's tone `i` as the page shows it: on the dark page its lifted twin,
// drawn raw so the page's map does not squeeze the four back together.
const DARK_RAW = Object.fromEntries(Object.entries(AFTER_GOODS_DARK).map(([k, l]) => [k, l.map(raw)]));
export const goodTone = (kind, i) => (darkPage && DARK_RAW[kind] ? DARK_RAW[kind][i] : KINDS[kind].palette[i]);
export const goodColor = (kind, v) => goodTone(kind, kindOf(v) && kindOf(v).key === kind ? toneOf(v) : 0);
export function goodBlock(x, y, kind, v) {
  const z = AFTER_BLOCK[kind] * AP;
  ctx.fillStyle = goodColor(kind, v); ctx.fillRect(x, y, z, z);
}
// Every good on the act's ground (after/ground.js), piles and open floor
// alike, each block where the heap rule has it: one drawing for all of them,
// so a pile is only where its blocks stand. No count: the pile is the count.
// A unit still arriving is drawn along its way there, whole, at its true
// position: a felled log faded in over the trunk and sliding off to rest,
// slowing, over AFTER_LOG_ROLL_S; a good let go of falling under the yard's
// gravity from where it was let go (ground.js, `fallTag`).
export function drawGround(t) {
  const us = units();
  for (const u of us) {
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
    goodBlock(Math.round(x), Math.round(y), u.kind, u.v);
    ctx.globalAlpha = was;
  }
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

