// The fangs held, on a plate in the furnace's brick over its door (config
// FANG_PLATE; the owner's option B, docs/mocks/fang-counter-2026-10-16):
// the fang's mark, a ×, and the count, in black on a mortar frame. Drawn over
// the furnace (render/deep.js, `drawCrusher`) in the deep's own tones, so the
// deep's turning over brings it out right on both pages.
//
// The plate is cells, the words screen pixels: the words are measured at the
// camera's zoom and the plate cut round them to the next whole cell, so it
// always holds them and never sits off the grid.

import { now } from '../clock.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { P, FANG_MARK, FANG_PLATE, NUM_FONT, NUM_FONT_PX } from '../config.js';
import { CRUSHER_SPRITES } from '../deep/sprites.js';
import { PURPLES, TONE, breathAt } from './deeptones.js';
import { drawable, widthOf, GH } from './numfont.js';
import { held as onReset } from '../reset.js';

// Where the plate may go, read off the furnace's drawing: the brick face
// between the top ledge and the door's arch, centered on the door.
const FURNACE = CRUSHER_SPRITES.rest;
const LEDGE = FURNACE.findIndex(row => row.includes('####'));
const ARCH = FURNACE.findIndex((row, r) => r > LEDGE + 1 && /#{4,}/.test(row.slice(3, -3)));
const archCols = [...FURNACE[ARCH]].map((ch, c) => (ch === '#' ? c : -1)).filter(c => c > 2 && c < FURNACE[ARCH].length - 3);
const DOOR_AXIS = (Math.min(...archCols) + Math.max(...archCols) + 1) / 2;   // a column edge, in cells
const FACE_L = FURNACE[LEDGE + 1].indexOf('#') + 1;
const FACE_R = FURNACE[LEDGE + 1].lastIndexOf('#');                          // exclusive
const FACE_ROWS = ARCH - LEDGE - 1;

// The words' tones: the brick's pale at a count, the mortar's at none.
const lit = n => (n > 0 ? TONE.pale : TONE.ground);

// What the plate shows at time `t` (ms): whether it stands, the counts to
// draw with their opacity (two while one cross-fades over the other) and
// their ink, and how lit its frame is. Kept here and never saved: a yard
// loaded with fangs in hand simply shows them. The first fang seen while the
// page watches fades the plate in, its count coming up from none.
let seenWas = null, held = 0, was = null, at = -Infinity, firstAt = -Infinity;   // held: the plate's count and fade
onReset('fangplate-plate', () => { seenWas = null; held = 0; was = null; at = -Infinity; firstAt = -Infinity; });
export function fangPlate(t = now()) {
  const n = S.fangs | 0, seen = !!S.seenFang;
  if (seenWas === null || !seen) { seenWas = seen; held = n; was = null; }
  else if (!seenWas) { seenWas = true; firstAt = t; held = 0; }
  if (!seen) return { shown: 0, faces: [], glint: 0 };
  if (n !== held) { was = held; held = n; at = t; }
  const k = Math.min(1, Math.max(0, (t - at) / 1000 / FANG_PLATE.fadeS));
  const faces = was != null && k < 1
    ? [{ n: was, a: 1 - k, ink: lit(was) }, { n: held, a: k, ink: lit(held) }]
    : [{ n: held, a: 1, ink: lit(held) }];
  const rising = held > (was ?? held);
  const g = rising ? Math.max(0, 1 - (t - at) / 1000 / FANG_PLATE.glintS) : 0;
  const shown = Math.min(1, Math.max(0, (t - firstAt) / 1000 / FANG_PLATE.fadeS));
  return { shown, faces, glint: g };
}

// The words' size in screen pixels, for a count of `n`.
const words = n => {
  const str = `×${drawable(String(n))}`;
  const markW = FANG_MARK[0].length * FANG_PLATE.markPx, markH = FANG_MARK.length * FANG_PLATE.markPx;
  return { str, markW, markH, w: markW + FANG_PLATE.gapPx + widthOf(str, NUM_FONT_PX), h: Math.max(markH, GH * NUM_FONT_PX) };
};

// The plate's cells for the words at a zoom of `z` screen pixels a world
// pixel: its rect in the furnace's cells, kept to the brick face.
export function plateCells(n, z) {
  const cell = P * z, wd = words(n);
  const w = Math.min(FACE_R - FACE_L, Math.ceil((wd.w + 2 * FANG_PLATE.padPx) / cell) + 2);
  const h = Math.min(FACE_ROWS, Math.ceil((wd.h + 2 * FANG_PLATE.padPx) / cell) + 2);
  const c = Math.max(FACE_L, Math.min(FACE_R - w, Math.round(DOOR_AXIS - w / 2)));
  return { c, r: ARCH - h, w, h };
}

// One mark or glyph, a pixel at a time, in device pixels.
function paint(rows, x, y, px) {
  rows.forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') ctx.fillRect(x + i * px, y + r * px, px, px); });
}
function drawWords(n, left, mid, u) {
  const wd = words(n), mpx = Math.max(1, Math.round(FANG_PLATE.markPx * u)), npx = Math.max(1, Math.round(NUM_FONT_PX * u));
  paint(FANG_MARK, left, Math.round(mid - FANG_MARK.length * mpx / 2), mpx);
  let x = left + FANG_MARK[0].length * mpx + Math.round(FANG_PLATE.gapPx * u);
  const top = Math.round(mid - GH * npx / 2);
  for (const ch of wd.str) {
    paint(NUM_FONT[ch], x, top, npx);
    x += (NUM_FONT[ch][0].length + 1) * npx;
  }
}

// Drawn in the furnace's transform, its top-left at (x, y) in world pixels.
export function drawFangPlate(x, y, t = now()) {
  const p = fangPlate(t);
  if (!(p.shown > 0)) return;
  const m = ctx.getTransform(), u = S.dpr || 1, z = m.a / u;
  const top = Math.max(...p.faces.map(f => f.n));
  const pc = plateCells(top, z);
  const px0 = x + pc.c * P, py0 = y + pc.r * P, pw = pc.w * P, ph = pc.h * P;
  const alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * p.shown;
  ctx.fillStyle = TONE.ground;
  ctx.fillRect(px0, py0, pw, ph);
  ctx.fillStyle = TONE.hole;
  ctx.fillRect(px0 + P, py0 + P, pw - 2 * P, ph - 2 * P);
  if (p.glint > 0) {
    // the frame catching the light: the top edges' own tone over the mortar
    ctx.globalAlpha = alpha * p.shown * p.glint;
    ctx.fillStyle = PURPLES[breathAt()];
    ctx.fillRect(px0, py0, pw, P); ctx.fillRect(px0, py0 + ph - P, pw, P);
    ctx.fillRect(px0, py0 + P, P, ph - 2 * P); ctx.fillRect(px0 + pw - P, py0 + P, P, ph - 2 * P);
  }
  // the words, in device pixels, centered in the black
  const cx = m.a * (px0 + pw / 2) + m.e, cy = m.d * (py0 + ph / 2) + m.f;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const f of p.faces) {
    const w = Math.round(words(f.n).w * u);
    ctx.globalAlpha = alpha * p.shown * f.a;
    ctx.fillStyle = f.ink;
    drawWords(f.n, Math.round(cx - w / 2), Math.round(cy), u);
  }
  ctx.setTransform(m);
  ctx.globalAlpha = alpha;
}
