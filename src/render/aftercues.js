// Act 3's hand work, cued in the place itself (after/gestures.js): each
// station's ghost hand on its moving part acting the motion out until it has
// been done a few times, and again, faint, while the pointer is over the part
// (DESIGN.md, "Act 3's goods are blocks", rule 3: one hand, and the material
// is the progress, so no strip, tag or path); a big bubble's held star and
// figure. One layer
// of render.js's LAYERS, over the place, drawn only with the camera up there.
//
// The hand is drawn at its own pixel, finer than a cell (GESTURE_CUE_DOT): it
// is a pointer over the place, not more of its material, as the mock drew
// it. A mark is the fight numbers' register, a figure over the picture.
// Everything fades by opacity, nothing flashes and nothing shakes; the crit
// is a held star.

import { P, GREY, GESTURE_CUE_ALPHA, GESTURE_CUE_HOVER, GESTURE_CUE_DOT, GESTURE_CUE_TAP_S, GESTURE_CUE_LOOP_S, GESTURE_STAR_HOLD_S, GESTURE_STAR_FADE_S,
         GESTURE_MARK_HOLD_S, GESTURE_MARK_FADE_S, GESTURE_SAW_AMP } from '../config.js';
import { ctx } from './ctx.js';
import { S } from '../state.js';
import { gestureView, partsOf, lowestBubble, groveIcons } from '../after/gestures.js';
import { AP } from '../after/place.js';
import { bedWants } from '../after/mill.js';
import { stripBox } from '../after/ground.js';
import { drawGroveIcons } from './after/pine.js';
// track B: the trunk's cue on the hand saw, and the woodcutter's saw drawn
// over the members, in its hand
import { handSawAt } from '../after/gestures.js';
import { trees, standing } from '../after/grove.js';
import { drawHeldSaws, workedBy } from './after/saw.js';
import { K, W, MID } from './after/kit.js';

const D = GESTURE_CUE_DOT;
const snap = v => Math.round(v / P) * P;
const dsnap = v => Math.round(v / D) * D;
const now = () => S.after.t;

// The ghost hand: a pointing mitten (its point the fingertip) and a fist (its
// point the middle of the grip). '#' its outline, mid, 'o' its fill, paper.
export const HAND = {
  point: { at: [3.5, 0], m: ['...##.....', '..#oo#....', '..#oo#....', '..#oo#....', '..#oo####.', '.##oooooo#',
                             '#o#oooooo#', '#oooooooo#', '.#ooooooo#', '..#oooooo#', '...######.'] },
  grab:  { at: [5, 3.5], m: ['.##.##.##.', '#oo#oo#oo#', '#oooooooo#', '#oooooooo#', '#oooooooo#', '.#ooooooo#', '..#######.'] }
};
export function handOn(g, x, y, pose, z = D, line = GREY[MID]) {
  const h = HAND[pose], x0 = Math.round((x - h.at[0] * z) / z) * z, y0 = Math.round((y - h.at[1] * z) / z) * z;
  for (let j = 0; j < h.m.length; j++) for (let i = 0; i < h.m[j].length; i++) {
    const ch = h.m[j][i];
    if (ch === '.') continue;
    g.fillStyle = ch === '#' ? line : GREY[W];
    g.fillRect(x0 + i * z, y0 + j * z, z, z);
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

// Where each station's ghost hand is now and how it is held, acting its
// motion out on the part; null where there is nothing to show it on.
function cueAt(key, r) {
  const u = loop(), turn = u * 2 * Math.PI;
  if (key === 'pedestal') {
    const b = lowestBubble(), box = partsOf('pedestal').box;
    return b ? { x: b.x + b.w / 2, y: b.y + b.h + (tapDown() ? D * 2 : 0), pose: 'point' } : { x: box.x + box.w / 2, y: box.y + P + (tapDown() ? D * 2 : 0), pose: 'point' };
  }
  // track B: the trunk's cue (F1): the ghost hand on the grip of the saw
  // lying across a grown trunk -- the one the hand last took, else the first
  // grown that no woodcutter is sawing with its own -- acting its stroke out
  // end to end. No icon over a tree.
  if (key === 'tree') {
    const list = trees(), free = k => standing(list[k]) && !workedBy(k);
    const i = r.on != null && free(r.on) ? r.on : list.findIndex((p, k) => free(k));
    if (i < 0) return null;
    const s = Math.sin(turn) * GESTURE_SAW_AMP, g = handSawAt(i, s).grip;
    return { x: g.x, y: g.y, pose: 'grab' };
  }
  if (key === 'stump') {
    const c = groveIcons().find(k => k.kind === 'shovel');
    if (!c) return null;
    const b = partsOf('stump', c.i).stump;
    return { x: b.x + b.w / 2, y: b.y - Math.round(u * 3) * P, pose: 'grab' };
  }
  if (key === 'mill') {
    // With the bed bare and nobody at the saw, a log first: the hand pressed
    // on the log pile, carried over and let go on the bed (after/mill.js);
    // then the wheel turned.
    const bed = bedWants();
    if (bed) {
      const b = stripBox('logs'), k = Math.min(1, u * 1.4), half = b.size * AP / 2, x0 = b.x + half, y0 = b.bottom - half;
      return { x: x0 + (bed.x - x0) * k, y: y0 + (bed.y - y0) * k - Math.sin(k * Math.PI) * P * 4, pose: 'grab' };
    }
    const w = partsOf('mill').wheel;
    return { x: w.x + Math.cos(turn) * w.r, y: w.y + Math.sin(turn) * w.r, pose: 'grab' };
  }
  if (key === 'workshop') {
    const nails = partsOf('workshop').nails, k = r.nails.findIndex(n => n < 2);
    const n = nails[Math.max(0, k)];
    return { x: n.x + n.w / 2, y: n.y + (tapDown() ? D * 2 : 0), pose: 'point' };
  }
  return null;
}

// The hand's ink each station drew last frame, by key (0 where none): read by
// the browser check (src/selftest/aftergestures.js), so it is a fact about
// the drawing.
let shown = {};   // cache: what the last frame drew, rewritten whole each draw
export const cueShown = () => shown;
// A scripted cursor (a scene playing the hand: scenes.js, 'after-mill-hand'):
// drawn over the place as the ghost hand is, and the ghost kept off while it is.
export const demoHand = { x: 0, y: 0, pose: null };

export function drawAfterCues() {
  const view = gestureView();
  if (!view) return;
  const t = now();
  drawHeldSaws();   // track B
  drawGroveIcons();
  shown = {};
  for (const r of view) {
    // One hand: the first uses' cue, or the same hand faint while the
    // pointer is over the part, the stronger of the two; never while held.
    const ink = r.open && !r.held && !demoHand.pose ? Math.max(r.cueA, (r.hintA || 0) * GESTURE_CUE_HOVER) * GESTURE_CUE_ALPHA : 0;
    const at = ink > 0.01 && cueAt(r.key, r);
    shown[r.key] = at ? ink : 0;
    if (at && at.x >= S.camX - P * 4 && at.x <= S.camX + S.viewW + P * 4) { ctx.globalAlpha = ink; handOn(ctx, at.x, at.y, at.pose); }
    for (const m of r.marks) markOn(ctx, m, t, P);
  }
  ctx.globalAlpha = 1;
  if (demoHand.pose) handOn(ctx, demoHand.x, demoHand.y, demoHand.pose, P / 2, '#000');
}
