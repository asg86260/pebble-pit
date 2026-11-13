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

// The line types in a letter at a time (dialog.js, `lineTyping`), each
// letter fading in over its own short time, never popping; the bubble is
// sized to the whole plain line -- the owner's marks taken out -- before the
// first letter, so it never grows. A line all in with no marks is drawn a row
// at a time, as it always was. A marked letter moves by its true offset: the
// wave a sine along the word, the shake held poses a pixel either way (the
// nervous letters each on a clock of their own), the tone run a smooth swing
// from the ink toward the paper and back along the word, the pulse a slow
// swell, the drop a fall onto its place, the boom big as it lands and held at
// its size and bold. Under reduced motion the line is whole at once, nothing
// moves or changes tone, and every marked word is only bold.

// REVIEW dialog-built
// REVIEW god-speaks
import { S } from '../state.js';
import { CELL, ACT_CAPTION_FONT_PX, DIALOG_STROKE_PX, DIALOG_PAD_CELLS, DIALOG_WIDE_PX, DIALOG_LINE_PX,
         DIALOG_TAIL, DIALOG_FX as FX } from '../config.js';
import { ctx } from './ctx.js';
import { msg, FACE } from '../lang.js';
import { raw, paper, ink } from '../ink.js';
import { bandCells } from '../shot.js';
import { toScreen } from '../world.js';
import { godHead } from './aftercrowd.js';
import { lineTyping, letterFade } from '../dialog.js';
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
const hex = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
// Between two colors, `k` of the way: the tone run moves smoothly, never a step.
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + A.map((v, j) => Math.round(v + (B[j] - v) * k).toString(16).padStart(2, '0')).join(''); };
const ease = k => 1 - (1 - k) ** 2;

// The typed line `ty` in its wrapped `rows`, from (x, y) down, `lh` a row,
// `u` seconds up (all in when `full`): letters all in and unmarked a string
// at a time, the rest a letter at a time with their fade and effect.
function drawWords(ty, rows, x, y, lh, u, full, a, INK) {
  const { letters, plain, at: born } = ty;
  const calm = reducedMotion(), t = now() / 1000, fh = lh - DIALOG_LINE_PX;
  const fade = i => (full ? 1 : Math.max(0, Math.min(1, (u - born[i]) / letterFade(letters[i].fx))));
  let at = 0;
  rows.forEach((row, r) => {
    at = Math.max(at, plain.indexOf(row, at));
    const cy = y + r * lh, left = k => x + ctx.measureText(row.slice(0, k)).width;
    const still = k => !letters[at + k].fx && fade(at + k) >= 1;
    for (let k = 0; k < row.length;) {
      if (still(k)) {
        let e = k;
        while (e < row.length && still(e)) e++;
        ctx.globalAlpha = a;
        ctx.fillStyle = INK;
        ctx.fillText?.(row.slice(k, e), left(k), cy);
        k = e;
        continue;
      }
      const i = at + k, ch = row[k], { fx } = letters[i], o = fade(i);
      k++;
      if (o <= 0 || ch === ' ') continue;
      // how long it has been in, for the effects that play as it arrives
      const age = full ? 99 : u - born[i], come = Math.min(1, age / letterFade(fx));
      let dx = 0, dy = 0, sz = 1, tone = INK;
      if (!calm) {
        if (fx === 'wave') dy = -Math.sin(t * Math.PI * 2 * FX.waveHz + i * FX.waveStep) * FX.waveH;
        if (fx === 'shake') {
          const n = Math.floor(t / FX.shakeHoldS);
          dx = Math.round(hash(i, n) * 2 - 1) * FX.shake; dy = Math.round(hash(n, i) * 2 - 1) * FX.shake;
        }
        // each letter its own clock, so no two move together
        if (fx === 'nervous') {
          const hold = FX.nervousHoldS[0] + hash(i, 7) * (FX.nervousHoldS[1] - FX.nervousHoldS[0]);
          const n = Math.floor((t + hash(i, 3)) / hold);
          dx = Math.round(hash(i, n) * 2 - 1) * FX.nervous; dy = Math.round(hash(n + 5, i) * 2 - 1) * FX.nervous;
        }
        if (fx === 'tone') {
          const p = (t * FX.toneHz + i * FX.toneStep) / FX.toneRun;
          tone = raw(mix(ink, paper, FX.toneReach * (0.5 - 0.5 * Math.cos(p * Math.PI * 2))));
        }
        if (fx === 'pulse') sz = 1 + FX.pulse * (0.5 - 0.5 * Math.cos(t * Math.PI * 2 * FX.pulseHz));
        // falling from over its place, quicker as it comes, and landed
        if (fx === 'drop') dy = -FX.dropH * (1 - come) ** 2;
        // big as it comes in, down to its size and held: a landing, not a shake
        if (fx === 'boom') sz = 1 + (FX.boomK - 1) * (1 - ease(come));
      }
      // a boom word, or any marked one held still, is bold: struck again a pixel over
      const bold = fx === 'boom' || (calm && !!fx);
      const px = left(k - 1), cw = ctx.measureText(ch).width;
      ctx.globalAlpha = a * o;
      ctx.fillStyle = tone;
      if (sz !== 1) {
        ctx.save();
        ctx.translate(px + cw / 2 + dx, cy + fh / 2 + dy); ctx.scale(sz, sz);
        ctx.fillText?.(ch, -cw / 2, -fh / 2);
        if (bold) ctx.fillText?.(ch, -cw / 2 + 1 / sz, -fh / 2);
        ctx.restore();
      } else {
        ctx.fillText?.(ch, px + dx, cy + dy);
        if (bold) ctx.fillText?.(ch, px + dx + 1, cy + dy);
      }
    }
    at += row.length;
  });
  ctx.globalAlpha = a;
  ctx.fillStyle = INK;
}

// A line with a speaker: `{ id, args, a, u, full, who }` (actbeats.js, `actCaption`).
export function drawLine(c) {
  ctx.save();
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.globalAlpha = c.a;
  ctx.font = `${FONT}px ${FACE}`;
  const pad = CELL * DIALOG_PAD_CELLS, lh = FONT + DIALOG_LINE_PX;
  const ty = lineTyping(c.args ? msg(c.id, c.args) : msg(c.id));
  const full = !!c.full || reducedMotion(), plainLine = full && !ty.runs.some(n => n.fx);
  const lines = wrap(ty.plain, Math.min(S.W - CELL * 8, DIALOG_WIDE_PX));
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
    if (plainLine) lines.forEach((s, k) => ctx.fillText?.(s, x + pad, y + pad + k * lh));
    else drawWords(ty, lines, x + pad, y + pad, lh, c.u || 0, full, c.a, INK);
    // the wedge once the line is all in
    const mx = x + w - pad / 2 - U * 5, my = y + h - pad / 2 - U * 3;
    if (full) for (let r = 0; r < 3; r++) ctx.fillRect(Math.round(mx) + r * U, Math.round(my) + r * U, (5 - 2 * r) * U, U);
    seen = { x, y, w, h, dir: b.dir, at: b.at, head: b.sp };
  }
  ctx.restore();
  ctx.fillStyle = '#000';
}
