// Act 3's hand work, cued in the place itself (after/gestures.js): what of it
// is not on a card (render/aftercard.js). The pedestal's ghost hand at the
// lowest bubble and a big bubble's held star and figure, since the bubbles
// are popped where they rise; and the heap's load, flung on its card, flying
// over the station itself into the notch. One layer of render.js's LAYERS,
// over the place, drawn only with the camera up there.
//
// The hand is drawn at its own pixel, finer than a cell (GESTURE_CUE_DOT): it
// is a pointer over the place, not more of its material, as the mock drew
// it. A mark is the fight numbers' register, a figure over the picture.
// Everything fades by opacity, nothing flashes and nothing shakes; the crit
// is a held star.

import { P, GREY, GESTURE_CUE_ALPHA, GESTURE_CUE_DOT, GESTURE_CUE_TAP_S, GESTURE_STAR_HOLD_S, GESTURE_STAR_FADE_S,
         GESTURE_MARK_HOLD_S, GESTURE_MARK_FADE_S, GESTURE_LOAD_FADE_S } from '../config.js';
import { ctx } from './ctx.js';
import { S } from '../state.js';
import { gestureView, partsOf, lowestBubble } from '../after/gestures.js';
import { stationParts } from '../after/place.js';

const D = GESTURE_CUE_DOT;
const snap = v => Math.round(v / P) * P;
const dsnap = v => Math.round(v / D) * D;
const cell = (x, y, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(snap(x), snap(y), P, P); };
const now = () => S.after.t;

// The ghost hand: a pointing mitten (its point the fingertip) and a fist (its
// point the middle of the grip). '#' its outline, 'o' its fill. The card
// draws the same hands (render/aftercard.js).
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
    g.fillStyle = GREY[ch === '#' ? 8 : 1];
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
  g.fillStyle = GREY[0];
  g.fillRect(x - D, y - D, w + D * 2, 5 * D + D * 2);
  g.fillStyle = GREY[10];
  chars.forEach((ch, k) => { const f = FIG[ch]; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (f[j][i] === '#') g.fillRect(x + (k * 4 + i) * D, y + j * D, D, D); });
}
// The impact star: eight thin rays round the struck point.
export function starOn(g, x, y) {
  g.fillStyle = GREY[10];
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

// The heap's load over the station: its way along the card from where it
// was taken to the edge, as a share of the heap's way to the notch, arched
// over the heap; through the notch, falling and fading.
function drawLoad(ld, t) {
  const p = stationParts('heap'), x0 = p.heap.x + p.heap.w / 2, x1 = p.edge, top = p.heap.y;
  const edge = partsOf('heap').edge, f = Math.max(0, Math.min(1, (ld.x - ld.x0) / Math.max(1, edge - ld.x0)));
  let x = x0 + f * (x1 - x0), y = top - P - Math.sin(Math.PI * f) * P * 3, a = 1;
  if (ld.mode === 'gone') { x = x1; y = p.notch.y + (t - ld.at) * P * 12; a = Math.max(0, 1 - (t - ld.at) / GESTURE_LOAD_FADE_S); }
  else if (ld.mode === 'back') a = Math.max(0, 1 - (t - ld.at) / GESTURE_LOAD_FADE_S);
  ctx.globalAlpha = a;
  for (let k = 0; k < Math.min(4, ld.n * 2); k++) cell(x + (k % 2) * P, y - Math.floor(k / 2) * P, k % 3 ? 4 : 5);
}

export function drawAfterCues() {
  const view = gestureView();
  if (!view) return;
  const t = now();
  for (const r of view) {
    if (r.key === 'pedestal' && r.open && r.cueA > 0.01) {
      const b = lowestBubble(), box = partsOf('pedestal').box;
      ctx.globalAlpha = r.cueA * GESTURE_CUE_ALPHA;
      if (b) handOn(ctx, b.x + b.w / 2, b.y + b.h + (tapDown() ? D * 2 : 0), 'point');
      else handOn(ctx, box.x + box.w / 2, box.y + P + (tapDown() ? D * 2 : 0), 'point');
    }
    for (const m of r.marks) if (!m.card) markOn(ctx, m, t, P);
    if (r.key === 'heap' && r.load && r.load.mode !== 'held') drawLoad(r.load, t);
  }
  ctx.globalAlpha = 1;
}
