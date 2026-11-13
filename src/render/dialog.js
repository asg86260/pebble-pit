// A speaker's line, drawn (DESIGN.md, "A dialog system"; the line and its
// clock are dialog.js's): a bubble over the speaker's head with a tail to it,
// the owner's pick A1 (2026-11-01). Over the bands, in screen pixels, in the
// caption's place (render.js's GLASS), faded in and out by opacity.
//
// The bubble is the page's own paper and ink, written past the cutscene's
// recede: the world behind it is drawn pale while a beat holds, the words
// stay sharp, and the page turning over turns the bubble with it. Its box and
// its tail are drawn on one cell, the stroke, so the tail is one shape with
// the box -- its first row lies over the box's own stroke -- and its outline
// steps a whole cell at the taper.
//
// Placed over the head when there is room under the top band (a phone's tall
// window), beside it when not (a wide one), the tip touching the head (the
// crown's top, the face's side) so it never lands on one of the rays round
// God; a speaker past the window's edge speaks from that edge.

// The owner's marks round words (dialog.js, `lineRuns`) are taken out before
// the line is wrapped and measured, so the bubble is the plain line's size;
// a line with none is drawn a row at a time, as it always was. A marked word
// is drawn a letter at a time by its true offset: the wave a sine along the
// word, the shake held poses a pixel either way, the glow a see-through halo
// of the bubble's ink behind the word, swinging in opacity, and bold; a slow
// word fades in on its own after the rest of the line is in. Under reduced
// motion nothing moves or swings and every marked word is only bold.

// REVIEW dialog-built
// REVIEW god-speaks
import { S } from '../state.js';
import { CELL, ACT_CAPTION_FONT_PX, DIALOG_STROKE_PX, DIALOG_PAD_CELLS, DIALOG_WIDE_PX, DIALOG_LINE_PX,
         DIALOG_TAIL, DIALOG_FADE_S, DIALOG_FX as FX } from '../config.js';
import { ctx } from './ctx.js';
import { msg, FACE } from '../lang.js';
import { raw, paper, ink } from '../ink.js';
import { bandCells } from '../shot.js';
import { toScreen } from '../world.js';
import { godHead } from './aftercrowd.js';
import { lineRuns } from '../dialog.js';
import { now } from '../clock.js';
import { reducedMotion } from '../prefs.js';

const FONT = ACT_CAPTION_FONT_PX, U = DIALOG_STROKE_PX;
let seen = null; // cache: the bubble as last drawn, for the checks (`bubbleSeen`)
export const bubbleSeen = () => seen;

// A speaker's head on the window: its middle across, its top, the middle of
// its face (where a tail beside it points), and its half width.
const HEADS = {
  god: () => {
    const g = godHead();
    if (!g) return null;
    const top = toScreen(g.x, g.top), mid = toScreen(g.x, (g.face + g.bottom) / 2);
    return { x: top.x, top: top.y, mid: mid.y, half: g.w / 2 * S.zoomShow };
  }
};
export const headOf = who => (HEADS[who] ? HEADS[who]() : null);

const band = () => Math.round(S.hush * bandCells()) * CELL;
function wrap(text, max) {
  const out = [];
  let cur = '';
  for (const w of text.split(' ')) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && ctx.measureText(next).width > max) { out.push(cur); cur = w; } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

// Where the bubble stands for a line of `w` by `h` px: its top-left, which
// side its tail leaves from, and where across that side the tip points.
export function bubbleAt(who, w, h) {
  const sp = headOf(who);
  if (!sp) return null;
  const L = DIALOG_TAIL.length * U, gut = CELL * 2;
  const lo = band() + CELL, hi = S.H - band() - CELL - h;
  const vy = v => Math.round(Math.max(lo, Math.min(hi, v)));
  const hx = x => Math.round(Math.max(gut, Math.min(S.W - gut - w, x)));
  if (sp.x < 0) return { x: gut + L, y: vy(sp.mid - h / 2), dir: 'left', at: sp.mid, sp };
  if (sp.x > S.W) return { x: S.W - gut - L - w, y: vy(sp.mid - h / 2), dir: 'right', at: sp.mid, sp };
  if (sp.top - L - h >= lo) return { x: hx(sp.x - w / 2), y: Math.round(sp.top - L - h + U), dir: 'down', at: sp.x, sp };
  return { x: hx(sp.x + sp.half + L), y: vy(sp.mid - h / 2), dir: 'left', at: sp.mid, sp };
}

// The tail's cells: paper row by row out from the box, centered on the tip;
// ink every cell beside the paper. `c` across the side, `r` out from it.
function tailCells(span, at, side) {
  const wide = DIALOG_TAIL[0], half = (wide - 1) / 2;
  const c0 = Math.max(half + 2, Math.min(span / U - 3 - half, Math.round((at - side) / U)));
  const paperCells = new Set(), inkCells = new Set(), key = (c, r) => `${c},${r}`;
  DIALOG_TAIL.forEach((k, r) => { for (let i = 0; i < k; i++) paperCells.add(key(c0 - (k - 1) / 2 + i, r)); });
  for (const p of paperCells) {
    const [c, r] = p.split(',').map(Number);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
      if (r + dr >= 0 && !paperCells.has(key(c + dc, r + dr))) inkCells.add(key(c + dc, r + dr));
  }
  return { paperCells, inkCells };
}

const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };

// The wrapped `rows` of a marked line, from (x, y) down, `lh` a row: unmarked
// stretches a string at a time, marked letters one at a time with their
// effect. `fxs` is the effect of each letter of `plain`, the rows' source;
// `u` seconds since the line went up.
function drawMarked(rows, plain, fxs, x, y, lh, u, a, INK) {
  const calm = reducedMotion(), t = now() / 1000;
  let at = 0;
  rows.forEach((row, r) => {
    at = Math.max(at, plain.indexOf(row, at));
    const cy = y + r * lh, left = k => x + ctx.measureText(row.slice(0, k)).width;
    // the glow's halo first, behind its word
    for (let k = 0; k < row.length;) {
      if (fxs[at + k] !== 'glow') { k++; continue; }
      let e = k;
      while (e < row.length && fxs[at + e] === 'glow') e++;
      const swing = calm ? 0.5 : 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * FX.glowHz);
      ctx.globalAlpha = a * (FX.glowA[0] + (FX.glowA[1] - FX.glowA[0]) * swing);
      ctx.fillStyle = INK;
      const x0 = left(k);
      ctx.fillRect(Math.round(x0 - 2), cy - 1, Math.round(left(e) - x0 + 4), lh - 1);
      k = e;
    }
    ctx.fillStyle = INK;
    for (let k = 0; k < row.length;) {
      const fx = fxs[at + k];
      if (!fx) {
        let e = k;
        while (e < row.length && !fxs[at + e]) e++;
        ctx.globalAlpha = a;
        ctx.fillText?.(row.slice(k, e), left(k), cy);
        k = e;
        continue;
      }
      const i = at + k, ch = row[k];
      let dx = 0, dy = 0, o = 1;
      if (!calm && fx === 'wave') dy = -Math.sin(t * Math.PI * 2 * FX.waveHz + i * FX.waveStep) * FX.waveH;
      if (!calm && fx === 'shake') {
        const n = Math.floor(t / FX.shakeHoldS);
        dx = Math.round(hash(i, n) * 2 - 1) * FX.shake; dy = Math.round(hash(n, i) * 2 - 1) * FX.shake;
      }
      if (fx === 'slow') o = Math.max(0, Math.min(1, (u - DIALOG_FADE_S) / FX.slowS));
      ctx.globalAlpha = a * o;
      const px = left(k);
      ctx.fillText?.(ch, px + dx, cy + dy);
      // a glowing word, or any marked one held still, is bold: struck again a pixel over
      if (fx === 'glow' || calm) ctx.fillText?.(ch, px + dx + 1, cy + dy);
      k++;
    }
    at += row.length;
  });
  ctx.globalAlpha = a;
}

// A line with a speaker: `{ id, args, a, u, who }` (actbeats.js, `actCaption`).
export function drawLine(c) {
  ctx.save();
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.globalAlpha = c.a;
  ctx.font = `${FONT}px ${FACE}`;
  const pad = CELL * DIALOG_PAD_CELLS, lh = FONT + DIALOG_LINE_PX;
  const runs = lineRuns(c.args ? msg(c.id, c.args) : msg(c.id));
  const plain = runs.map(n => n.text).join(''), marked = runs.some(n => n.fx);
  const lines = wrap(plain, Math.min(S.W - CELL * 8, DIALOG_WIDE_PX));
  // a whole number of cells across and down, so the box's corners and the
  // tail's cells sit on one lattice
  const more = U * 6;
  const w = Math.ceil((Math.max(...lines.map(s => ctx.measureText(s).width)) + pad * 2 + more) / U) * U;
  const h = Math.ceil((lines.length * lh + pad * 2 - DIALOG_LINE_PX) / U) * U;
  const b = bubbleAt(c.who, w, h);
  if (b) {
    const { x, y } = b, PAPER = raw(paper), INK = raw(ink);
    // the box, its corners notched a cell
    ctx.fillStyle = INK;
    ctx.fillRect(x + U, y, w - U * 2, h);
    ctx.fillRect(x, y + U, w, h - U * 2);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + U * 2, y + U, w - U * 4, h - U * 2);
    ctx.fillRect(x + U, y + U * 2, w - U * 2, h - U * 4);
    // the tail, out of the side toward the head
    const down = b.dir === 'down';
    const { paperCells, inkCells } = tailCells(down ? w : h, b.at, down ? x : y);
    const cell = (c2, r) => (down ? [x + c2 * U, y + h - U + r * U]
      : b.dir === 'left' ? [x - r * U, y + c2 * U] : [x + w - U + r * U, y + c2 * U]);
    for (const [set, tone] of [[inkCells, INK], [paperCells, PAPER]]) {
      ctx.fillStyle = tone;
      for (const p of set) { const [c2, r] = p.split(',').map(Number); const [px, py] = cell(c2, r); ctx.fillRect(px, py, U, U); }
    }
    // the words, and a still wedge in the corner: there is a click to go on
    ctx.fillStyle = INK;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    if (marked) drawMarked(lines, plain, runs.flatMap(n => n.text.split('').map(() => n.fx)), x + pad, y + pad, lh, c.u || 0, c.a, INK);
    else lines.forEach((s, k) => ctx.fillText?.(s, x + pad, y + pad + k * lh));
    const mx = x + w - pad / 2 - U * 5, my = y + h - pad / 2 - U * 3;
    for (let r = 0; r < 3; r++) ctx.fillRect(Math.round(mx) + r * U, Math.round(my) + r * U, (5 - 2 * r) * U, U);
    seen = { x, y, w, h, dir: b.dir, at: b.at, head: b.sp };
  }
  ctx.restore();
  ctx.fillStyle = '#000';
}
