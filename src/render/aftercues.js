// Act 3's hand work, cued in the place itself (after/gestures.js): each
// station's ghost hand on its moving part acting the motion out until it has
// been done a few times, a big bubble's held star and figure, and the heap's
// load in the hand or flying into the notch. One layer of render.js's
// LAYERS, over the place, drawn only with the camera up there.
//
// The hand is drawn at its own pixel, finer than a cell (GESTURE_CUE_DOT): it
// is a pointer over the place, not more of its material, as the mock drew
// it. A mark is the fight numbers' register, a figure over the picture.
// Everything fades by opacity, nothing flashes and nothing shakes; the crit
// is a held star.

import { P, GREY, GESTURE_CUE_ALPHA, GESTURE_CUE_DOT, GESTURE_CUE_TAP_S, GESTURE_CUE_LOOP_S, GESTURE_STAR_HOLD_S, GESTURE_STAR_FADE_S,
         GESTURE_MARK_HOLD_S, GESTURE_MARK_FADE_S, GESTURE_LOAD_FADE_S, GESTURE_SAW_AMP } from '../config.js';
import { ctx } from './ctx.js';
import { S } from '../state.js';
import { gestureView, partsOf, lowestBubble, groveIcons } from '../after/gestures.js';
import { stationParts, afterFloor } from '../after/place.js';
import { drawGroveIcons } from './after/pine.js';
import { K, W, PALE, MID } from './after/kit.js';

const D = GESTURE_CUE_DOT;
const snap = v => Math.round(v / P) * P;
const dsnap = v => Math.round(v / D) * D;
const cell = (x, y, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(snap(x), snap(y), P, P); };
const now = () => S.after.t;

// The ghost hand: a pointing mitten (its point the fingertip) and a fist (its
// point the middle of the grip). '#' its outline, mid, 'o' its fill, paper.
export const HAND = {
  point: { at: [3.5, 0], m: ['...##.....', '..#oo#....', '..#oo#....', '..#oo#....', '..#oo####.', '.##oooooo#',
                             '#o#oooooo#', '#oooooooo#', '.#ooooooo#', '..#oooooo#', '...######.'] },
  grab:  { at: [5, 3.5], m: ['.##.##.##.', '#oo#oo#oo#', '#oooooooo#', '#oooooooo#', '#oooooooo#', '.#ooooooo#', '..#######.'] }
};
export function handOn(g, x, y, pose) {
  const h = HAND[pose], x0 = dsnap(x - h.at[0] * D), y0 = dsnap(y - h.at[1] * D);
  for (let j = 0; j < h.m.length; j++) for (let i = 0; i < h.m[j].length; i++) {
    const ch = h.m[j][i];
    if (ch === '.') continue;
    g.fillStyle = GREY[ch === '#' ? MID : W];
    g.fillRect(x0 + i * D, y0 + j * D, D, D);
  }
}

// A crit's figure, 3 by 5 dots on a paper patch: 'x' and the count.
const FIG = {
  x: ['...', '#.#', '.#.', '#.#', '...'], 0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['###', '..#', '###', '#..', '###'], 3: ['###', '..#', '.##', '..#', '###'], 4: ['#.#', '#.#', '###', '..#', '..#'],
  5: ['###', '#..', '###', '..#', '###'], 6: ['###', '#..', '###', '#.#', '###'], 7: ['###', '..#', '..#', '..#', '..#'],
  8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '###']
};
export function figureOn(g, x, y, n) {
  const chars = ['x', ...String(n)], w = (chars.length * 4 - 1) * D;
  x = dsnap(x); y = dsnap(y);
  g.fillStyle = GREY[W];
  g.fillRect(x - D, y - D, w + D * 2, 5 * D + D * 2);
  g.fillStyle = GREY[K];
  chars.forEach((ch, k) => { const f = FIG[ch]; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (f[j][i] === '#') g.fillRect(x + (k * 4 + i) * D, y + j * D, D, D); });
}
// The impact star: eight thin rays round the struck point.
export function starOn(g, x, y) {
  g.fillStyle = GREY[K];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const n = dx && dy ? 4 : 6, k = dx && dy ? 0.75 : 1;
    for (let s = 0; s < n; s++) { const d = (4 + s) * D; g.fillRect(dsnap(x + dx * d * k) - D / 2, dsnap(y + dy * d * k) - D / 2, D, D); }
  }
}
export const heldInk = (age, hold, fade) => (age < hold ? 1 : Math.max(0, 1 - (age - hold) / fade));
// A crit's star and figure, faded on their own clocks.
export function markOn(g, m, t, cellPx) {
  const age = t - m.at;
  g.globalAlpha = heldInk(age, GESTURE_STAR_HOLD_S, GESTURE_STAR_FADE_S);
  starOn(g, m.x, m.y);
  g.globalAlpha = heldInk(age, GESTURE_MARK_HOLD_S, GESTURE_MARK_FADE_S);
  figureOn(g, m.x + cellPx * 3, m.y - cellPx * 4, m.n);
}

const tapDown = () => (now() % GESTURE_CUE_TAP_S) < GESTURE_CUE_TAP_S * 0.4;
const loop = () => (now() % GESTURE_CUE_LOOP_S) / GESTURE_CUE_LOOP_S;
const mid = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

// The heap's load where the hand has it, flying, or falling through the
// notch and fading.
function drawLoad(ld, t) {
  const edge = stationParts('heap').edge;
  let x = ld.x, y = ld.y, a = 1;
  if (ld.mode === 'gone') { x = edge; y = afterFloor() + (t - ld.at) * P * 12; a = Math.max(0, 1 - (t - ld.at) / GESTURE_LOAD_FADE_S); }
  else if (ld.mode === 'back') a = Math.max(0, 1 - (t - ld.at) / GESTURE_LOAD_FADE_S);
  ctx.globalAlpha = a;
  for (let k = 0; k < Math.min(4, ld.n * 2); k++) cell(x + (k % 2) * P, y - Math.floor(k / 2) * P, k % 3 ? PALE : MID);
}

// A log off the chipper's pile in the hand, on its way to the jaws: six
// cells side on, its end grain pale, in a paper rim so it reads over ink.
function heldLog(x, y) {
  const x0 = snap(x - P * 3), y0 = snap(y - P);
  ctx.globalAlpha = 1;
  ctx.fillStyle = GREY[W]; ctx.fillRect(x0 - 2, y0 - 2, P * 6 + 4, P * 2 + 4);
  ctx.fillStyle = GREY[K]; ctx.fillRect(x0, y0, P * 6, P * 2);
  ctx.fillStyle = GREY[PALE]; ctx.fillRect(x0 + 2, y0 + 2, P - 2, P * 2 - 4);
}

// Where each station's ghost hand is now and how it is held, acting its
// motion out on the part; null where there is nothing to show it on.
function cueAt(key, r) {
  const u = loop(), turn = u * 2 * Math.PI;
  if (key === 'pedestal') {
    const b = lowestBubble(), box = partsOf('pedestal').box;
    return b ? { x: b.x + b.w / 2, y: b.y + b.h + (tapDown() ? D * 2 : 0), pose: 'point' } : { x: box.x + box.w / 2, y: box.y + P + (tapDown() ? D * 2 : 0), pose: 'point' };
  }
  if (key === 'tree') {
    const icon = groveIcons().find(c => c.kind === 'saw');
    if (r.i == null) return icon ? { x: icon.x, y: icon.y + (tapDown() ? D * 2 : 0), pose: 'point' } : null;
    const b = partsOf('tree', r.i).sawBox;
    return { x: b.x + P * 2 + Math.sin(turn) * GESTURE_SAW_AMP, y: b.y + b.h / 2, pose: 'grab' };
  }
  if (key === 'stump') {
    const c = groveIcons().find(k => k.kind === 'shovel');
    if (!c) return null;
    const b = partsOf('stump', c.i).stump;
    return { x: b.x + b.w / 2, y: b.y - Math.round(u * 3) * P, pose: 'grab' };
  }
  if (key === 'mill') { const w = partsOf('mill').wheel; return { x: w.x + Math.cos(turn) * w.r, y: w.y + Math.sin(turn) * w.r, pose: 'grab' }; }
  if (key === 'papermill') { const v = partsOf('papermill').vat; return { x: v.x + Math.cos(turn) * v.rx, y: v.y + Math.sin(turn) * v.ry, pose: 'grab' }; }
  if (key === 'chipper') {
    const p = partsOf('chipper');
    if (r.log !== 'in') { const a = mid(p.pile), b = mid(p.mouth); return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, pose: 'grab' }; }
    return { x: p.arm.x + p.arm.w / 2, y: p.arm.y + Math.round(u * 3) * P, pose: 'grab' };
  }
  if (key === 'workshop') {
    const nails = partsOf('workshop').nails, k = r.nails.findIndex(n => n < 2);
    const n = nails[Math.max(0, k)];
    return { x: n.x + n.w / 2, y: n.y + (tapDown() ? D * 2 : 0), pose: 'point' };
  }
  if (key === 'press') { const h = partsOf('press').handle; return { x: h.x + h.w / 2, y: h.y + P + Math.round(u * 3) * P, pose: 'grab' }; }
  if (key === 'heap') {
    const p = partsOf('heap'), a = mid(p.heap);
    return { x: a.x + (p.edge - a.x) * u, y: p.heap.y, pose: 'grab' };
  }
  return null;
}

export function drawAfterCues() {
  const view = gestureView();
  if (!view) return;
  const t = now();
  drawGroveIcons();
  for (const r of view) {
    if (r.open && r.cueA > 0.01 && !r.held) {
      const at = cueAt(r.key, r);
      if (at && at.x >= S.camX - P * 4 && at.x <= S.camX + S.viewW + P * 4) { ctx.globalAlpha = r.cueA * GESTURE_CUE_ALPHA; handOn(ctx, at.x, at.y, at.pose); }
    }
    for (const m of r.marks) markOn(ctx, m, t, P);
    if (r.key === 'heap' && r.load) drawLoad(r.load, t);
    if (r.key === 'chipper' && r.log === 'held') heldLog(r.lx, r.ly);
  }
  ctx.globalAlpha = 1;
}
