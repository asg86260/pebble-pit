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
         GESTURE_MARK_HOLD_S, GESTURE_MARK_FADE_S, GESTURE_LOAD_FADE_S, GESTURE_SAW_AMP,
         GESTURE_WHEEL_LOG, GESTURE_ARM_LOG, GESTURE_STIR_TURNS, GESTURE_BAR_DRAG, GESTURE_BAR_PRINT,
         HANDWORK_DOTS, HANDWORK_DOT_RUN, HANDWORK_PATH_OUT, HANDWORK_HINT_LOOP_S, HANDWORK_HINT_POINT, HANDWORK_LOG_ARC, HANDWORK_LOG_SHARE,
         HANDWORK_HAND_DOT, HANDWORK_STRIP_DROP, HANDWORK_STRIP_H, HANDWORK_TAG_PX, HANDWORK_TAG_PAD, HANDWORK_DONE_S } from '../config.js';
import { ctx } from './ctx.js';
import { S } from '../state.js';
import { msg, FACE } from '../lang.js';
import { smoothstep, lerp } from '../motion.js';
import { crispText } from './crisptext.js';
import { gestureView, partsOf, lowestBubble, groveIcons, HANDWORK_KEYS } from '../after/gestures.js';
import { stationParts, stationBox, groundOf } from '../after/place.js';
import { drawGroveIcons } from './after/pine.js';
import { grips } from './after/stations.js';
import { K, W, PALE, MID, FOUR } from './after/kit.js';

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
// `dot` its pixel: the cue's fine one, or the hand work's hint's a game cell.
export function handOn(g, x, y, pose, dot = D) {
  const h = HAND[pose], put = dot === D ? dsnap : Math.round, x0 = put(x - h.at[0] * dot), y0 = put(y - h.at[1] * dot);
  for (let j = 0; j < h.m.length; j++) for (let i = 0; i < h.m[j].length; i++) {
    const ch = h.m[j][i];
    if (ch === '.') continue;
    g.fillStyle = GREY[ch === '#' ? MID : W];
    g.fillRect(x0 + i * dot, y0 + j * dot, dot, dot);
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
  if (ld.mode === 'gone') { x = edge; y = groundOf('chipper') + (t - ld.at) * P * 12; a = Math.max(0, 1 - (t - ld.at) / GESTURE_LOAD_FADE_S); }
  else if (ld.mode === 'back') a = Math.max(0, 1 - (t - ld.at) / GESTURE_LOAD_FADE_S);
  ctx.globalAlpha = a;
  for (let k = 0; k < Math.min(4, ld.n * 2); k++) cell(x + (k % 2) * P, y - Math.floor(k / 2) * P, k % 3 ? PALE : MID);
}

// A log off the chipper's pile in the hand, on its way to the jaws: six
// cells side on, its end grain pale, in a paper rim so it reads over ink.
function heldLog(x, y, a = 1) {
  const x0 = snap(x - P * 3), y0 = snap(y - P);
  ctx.globalAlpha = a;
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

// --- the hand work, shown in the world (DESIGN.md, "Act 3's hand work and
// hand carrying", take B) ----------------------------------------------------
// Hovered, a dotted ghost of a hand-worked part's motion loops round it, the pointing hand on where to take it and then the
// grabbing hand playing the motion through (motion.js's curve); and a strip
// under the station fills with the unit in the gesture's own units, a verb
// on a tag under it. Each fades by its own share (after/gestures.js).

// The motion's path, world points: `legs` the grab's way, each a list of
// points, the dotted ghost laid along them, and where the hand points first.
const arcPts = (c, rx, ry, a0, a1, n) => Array.from({ length: n }, (_, i) => { const a = lerp(a0, a1, i / (n - 1)); return { x: c.x + Math.cos(a) * rx, y: c.y + Math.sin(a) * ry }; });
const hopPts = (a, b, lift, n) => Array.from({ length: n }, (_, i) => { const k = i / (n - 1); return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * lift }; });
const TURN_SPAN = Math.PI * 5 / 3;                      // a turn's ghost: most of the way round, so its head shows
function motionOf(key, r) {
  const g = grips(key), N = HANDWORK_DOTS;
  if (!g) return null;
  if (key === 'mill') {
    const a0 = Math.atan2(g.knob.y - g.hub.y, g.knob.x - g.hub.x);
    return { point: g.knob, legs: [{ hand: arcPts(g.hub, g.reach, g.reach, a0, a0 + TURN_SPAN, N), dots: arcPts(g.hub, g.reach + HANDWORK_PATH_OUT, g.reach + HANDWORK_PATH_OUT, a0, a0 + TURN_SPAN, N) }] };
  }
  if (key === 'papermill') {
    const v = stationParts('papermill').vat, a0 = Math.PI / 2;
    return { point: arcPts(v, v.rx, v.ry, a0, a0, 2)[0], legs: [{ hand: arcPts(v, v.rx, v.ry, a0, a0 + TURN_SPAN, N), dots: arcPts(v, v.rx + HANDWORK_PATH_OUT, v.ry + HANDWORK_PATH_OUT, a0, a0 + TURN_SPAN, N) }] };
  }
  if (key === 'press') {
    const line = n => Array.from({ length: n }, (_, i) => ({ x: g.knob.x, y: g.knob.y + GESTURE_BAR_DRAG * i / (n - 1) }));
    const dots = Math.round(GESTURE_BAR_DRAG / P) + 1;
    return { point: g.knob, legs: [{ hand: line(dots), dots: line(dots).map(q => ({ x: q.x + HANDWORK_PATH_OUT * 2, y: q.y })) }] };
  }
  if (key === 'chipper') {
    // a log off the pile into the jaws, then the arm down; with a log in, the arm alone
    const p = stationParts('chipper'), a0 = Math.atan2(g.up.y - g.pivot.y, g.up.x - g.pivot.x), a1 = Math.atan2(g.down.y - g.pivot.y, g.down.x - g.pivot.x);
    const reach = Math.hypot(g.up.x - g.pivot.x, g.up.y - g.pivot.y), turn = a1 > a0 ? a1 - 2 * Math.PI : a1;
    const arm = { hand: arcPts(g.pivot, reach, reach, a0, turn, N / 2), dots: arcPts(g.pivot, reach + HANDWORK_PATH_OUT, reach + HANDWORK_PATH_OUT, a0, turn, N / 2) };
    if (r.log === 'in') return { point: g.up, legs: [arm] };
    const from = { x: p.pile.x + p.pile.w / 2, y: p.pile.y }, to = mid(p.mouth);
    return { point: from, log: true, legs: [{ hand: hopPts(from, to, HANDWORK_LOG_ARC, N), dots: hopPts(from, to, HANDWORK_LOG_ARC, N) }, arm] };
  }
  return null;
}
// Along a list of points, k of the way.
function along(pts, k) {
  const u = Math.min(pts.length - 1, Math.max(0, k * (pts.length - 1))), i = Math.min(pts.length - 2, Math.floor(u)), f = u - i;
  return { x: lerp(pts[i].x, pts[i + 1].x, f), y: lerp(pts[i].y, pts[i + 1].y, f) };
}
// The dots, a game cell each on the cells' grid, one of ink running along
// them, and a head of three rows at the end pointing on.
function dotted(pts, t) {
  const run = Math.floor(t * HANDWORK_DOT_RUN) % pts.length;
  pts.forEach((q, i) => { if (i !== run) cell(q.x - P / 2, q.y - P / 2, MID); });
  const q = pts[run];
  for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) cell(q.x - P + i * P, q.y - P + j * P, K);
  const a = pts[pts.length - 1], b = pts[pts.length - 2];
  const dx = Math.sign(Math.round(a.x - b.x)), dy = Math.sign(Math.round(a.y - b.y));
  for (let k = 0; k < 3; k++) for (let j = -k; j <= k; j++)
    cell(a.x + dx * (3 - k) * P + (dy ? j * P : 0) - P / 2, a.y + dy * (3 - k) * P + (dx ? j * P : 0) - P / 2, K);
}
function drawGhost(key, r, t) {
  const m = motionOf(key, r);
  if (!m) return;
  ctx.globalAlpha = r.hintA;
  for (const leg of m.legs) dotted(leg.dots, t);
  // the loop: the hand pointing where to take hold, then grabbing and
  // playing the motion through, a leg after another
  const u = (t % HANDWORK_HINT_LOOP_S) / HANDWORK_HINT_LOOP_S;
  if (u < HANDWORK_HINT_POINT) { ctx.globalAlpha = r.hintA; handOn(ctx, m.point.x, m.point.y, 'point', HANDWORK_HAND_DOT); return; }
  const k = (u - HANDWORK_HINT_POINT) / (1 - HANDWORK_HINT_POINT);
  const split = m.legs.length > 1 ? HANDWORK_LOG_SHARE : 1;
  const leg = k < split ? 0 : 1, kk = leg === 0 ? k / split : (k - split) / (1 - split);
  const at = along(m.legs[leg].hand, smoothstep(kk));
  if (m.log && leg === 0) heldLog(at.x, at.y, r.hintA);
  ctx.globalAlpha = r.hintA;
  handOn(ctx, at.x, at.y, 'grab', HANDWORK_HAND_DOT);
}
// The unit so far, in the gesture's own units: the log fed cell by cell, the
// chipper's load and then its feed, the vat's turns, the bar's pull a drag
// cell a segment; full a moment after a unit is made.
function unitOf(key, r, t) {
  let n = 0, of = 1, verb = 'handwork-spin';
  if (key === 'mill') { n = Math.floor(r.prog); of = GESTURE_WHEEL_LOG; }
  if (key === 'chipper') { of = GESTURE_ARM_LOG; n = Math.floor(r.prog); verb = r.log === 'in' ? 'handwork-hold' : 'handwork-drag'; }
  if (key === 'papermill') { n = Math.floor(r.prog); of = GESTURE_STIR_TURNS; verb = 'handwork-stir'; }
  if (key === 'press') { of = Math.round(GESTURE_BAR_DRAG / P); n = r.printed ? of : Math.floor(Math.min(1, r.k / GESTURE_BAR_PRINT) * of + 1e-6); verb = 'handwork-pull'; }
  if (r.lastUse != null && t - r.lastUse < HANDWORK_DONE_S) n = of;
  return { n: Math.min(n, of), of, verb };
}
const TAG_TONES = FOUR.map(i => GREY[i]);
function drawStrip(key, r, u) {
  const b = stationBox(key), y = groundOf(key) + HANDWORK_STRIP_DROP, H = HANDWORK_STRIP_H;
  ctx.globalAlpha = r.stripA;
  ctx.fillStyle = GREY[W]; ctx.fillRect(b.x - P, y - P, b.w + P * 2, H + P * 2);
  const sw = Math.floor((b.w - (u.of - 1) * P) / u.of / P) * P, x0 = b.x + Math.floor((b.w - (u.of * sw + (u.of - 1) * P)) / 2 / P) * P;
  for (let i = 0; i < u.of; i++) { ctx.fillStyle = GREY[i < u.n ? K : PALE]; ctx.fillRect(x0 + i * (sw + P), y, sw, H); }
  // the verb, paper on an ink tag under the strip's left end
  const font = `${HANDWORK_TAG_PX}px ${FACE}`, label = msg(u.verb);
  ctx.font = font;
  const tw = Math.ceil(ctx.measureText ? ctx.measureText(label).width || 0 : 0), ty = y + H + P;
  const tagW = snap(tw + HANDWORK_TAG_PAD * 2 + P / 2), tagH = snap(HANDWORK_TAG_PX + HANDWORK_TAG_PAD * 2 + P / 2);
  ctx.fillStyle = GREY[W]; ctx.fillRect(b.x - P * 2, ty - P, tagW + P * 2, tagH + P * 2);   // a paper rim, as the strip's, off the cloud under it
  ctx.fillStyle = GREY[K]; ctx.fillRect(b.x - P, ty, tagW, tagH);
  crispText(ctx, label, b.x - P + HANDWORK_TAG_PAD, ty + HANDWORK_TAG_PAD, font, GREY[W], 'left', GREY[K], TAG_TONES);
}
// What the hand work showed last frame, by station: read by the browser
// check (src/selftest/aftergestures.js) so it is a fact about the drawing.
let shown = {};   // cache: what the last frame drew, rewritten whole each draw
export const handworkShown = () => shown;
function drawHandwork(view, t) {
  shown = {};
  for (const r of view) {
    if (!HANDWORK_KEYS.includes(r.key) || !r.open) continue;
    const u = unitOf(r.key, r, t);
    shown[r.key] = { hintA: r.hintA, stripA: r.stripA, n: u.n, of: u.of, verb: u.verb };
    if (r.stripA > 0.001) drawStrip(r.key, r, u);
    if (r.hintA > 0.001) drawGhost(r.key, r, t);
  }
  ctx.globalAlpha = 1;
}

export function drawAfterCues() {
  const view = gestureView();
  if (!view) return;
  const t = now();
  drawGroveIcons();
  drawHandwork(view, t);
  for (const r of view) {
    // the first-uses ghost hand gives way to the hover's
    const over = r.hintA || 0;
    if (r.open && r.cueA > 0.01 && !r.held && over < 1) {
      const at = cueAt(r.key, r);
      if (at && at.x >= S.camX - P * 4 && at.x <= S.camX + S.viewW + P * 4) { ctx.globalAlpha = r.cueA * GESTURE_CUE_ALPHA * (1 - over); handOn(ctx, at.x, at.y, at.pose); }
    }
    for (const m of r.marks) markOn(ctx, m, t, P);
    if (r.key === 'heap' && r.load) drawLoad(r.load, t);
    if (r.key === 'chipper' && r.log === 'held') heldLog(r.lx, r.ly);
  }
  ctx.globalAlpha = 1;
}
