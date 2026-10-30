// The stump pulled: roots, cracks, the held jerk and the dirt (DESIGN.md,
// "Act 3's grove, rebuilt", call 10 and "The tree, drawn": the signed-off
// F3a-1, "the earth gives", with its thicker roots).
// REVIEW grove-the-woodcutter-pulls-a-stump
//
// A stump is one whole log block on its plot, in the tone picked when its
// acorn went in. Taken hold of -- by the hand (after/gestures.js) or by a
// woodcutter's hands (after/stump.js, `pullStep`) -- it comes up as far as it
// is lifted, and its roots show under it as far as it is up: each thick where
// it leaves the block, tapering and branching down, in the log's darkest
// tone. The root about to go pulls taut, straight down to the ground, past
// STUMP_TAUT of its strain; a snapped root leaves only its stub. The soil
// cracks either side as the work goes, a crack more for each share of it,
// each inking in and fading out by opacity. Each snap holds the stump a cell
// higher for STUMP_JERK_S (the held jerk, no shake) and throws STUMP_DIRT
// clods of dirt off the break, whole cells that fly, fall and fade as they
// fall, never resting: particles, not goods (the owner, 2026-10-30: "just
// have them fade out when they fall. no by product"), drawn as a pure
// function of when the snap was and each clod's hash.
//
// The woodcutter's hands: an arm out from its body's near side to the
// stump's, a fist on it, following the stump up; the last root out, the
// stump swung up onto its head, where it is carried as any log
// (render/after.js, `drawLoad`), so it is never anywhere it was not.
//
// Called by render/after/pine.js after the plots, over the soil bed, under
// the members. Art on the grid, motion smooth: the stump and its roots are
// one drawing of whole cells laid at the lift's true position.

// REVIEW grove-built

import { P, GREY, AFTER_TREE, AFTER_DIG_CLICKS, AFTER_PULL, GESTURE_STRAIN_S, STUMP_ROOTS, STUMP_TAUT, STUMP_CRACKS, STUMP_CRACK_STEP,
         STUMP_CRACK_IN_S, STUMP_CRACK_OUT_S, STUMP_JERK_S, STUMP_DIRT, STUMP_DIRT_VX, STUMP_DIRT_UP, STUMP_DIRT_GRAV } from '../../config.js';
import { S } from '../../state.js';
import { ctx } from '../ctx.js';
import { K, SOIL, toneOf, now, inView, clamp01, hash } from './kit.js';
import { goodTone } from './piles.js';
import { trees } from '../../after/grove.js';
import { plotX, groundOf, AP } from '../../after/place.js';
import { gestureView } from '../../after/gestures.js';
import { pullable, PULL_HOLDS } from '../../after/stump.js';

const { c0: C0, w: TW, stump: SH, logs: LOGS } = AFTER_TREE;
const ROOT = 3;   // the log's darkest tone, the roots' (a stump is never it)
const fl = () => groundOf('grove');
const ink = tone => (typeof tone === 'number' ? GREY[tone] : tone);
const fill = (tone, x, y, w, h) => { ctx.fillStyle = ink(tone); ctx.fillRect(x, y, w, h); };
const ease = u => u * u * (3 - 2 * u);
const LOG = i => goodTone('log', i || 0);
const stumpTone = p => LOG(p.tones ? p.tones[LOGS] : 0);

// --- who has hold of a stump ------------------------------------------------------------
// The hand's record (after/gestures.js), read, never kept.
const handRec = () => (gestureView() || []).find(r => r.key === 'stump') || null;
// A woodcutter with its hands on plot i's stump now, or null.
const pullerOf = i => (S.after ? S.after.bodies.find(b => b.dig && b.target === i && b.pull && b.pull.i === i && PULL_HOLDS.includes(b.pull.ph)) : null) || null;
// How plot i's stump is held: `lift` px up, `strain` 0..1 of the root's,
// and the body pulling, if one is (the hand first, as its motion is the
// player's own).
function holdOf(i) {
  const g = handRec();
  if (g && g.i === i && (g.grab || g.lift > 0)) return { lift: g.lift, strain: g.grab ? clamp01(g.strain / GESTURE_STRAIN_S) : 0, body: null };
  const w = pullerOf(i);
  if (w) return { lift: w.pull.lift, strain: w.pull.ph === 'strain' ? clamp01(w.pull.strain / GESTURE_STRAIN_S) : 0, body: w };
  return { lift: 0, strain: 0, body: null };
}
// Every snap still remembered: the hand's last and each woodcutter's, as
// { i, k, at }.
function snaps() {
  const out = [], g = handRec();
  if (g && g.snap != null) out.push({ i: g.snapI, k: g.snapK, at: g.snap });
  if (S.after) for (const b of S.after.bodies) if (b.pull && b.pull.snap != null) out.push({ i: b.pull.snapI, k: b.pull.snapK, at: b.pull.snap });
  return out;
}
const lastSnap = (i, t) => snaps().filter(s => s.i === i && s.at <= t).reduce((a, s) => (!a || s.at > a.at ? s : a), null);

// --- the cracks --------------------------------------------------------------------------
// Each plot's cracks' ink, 0..1 a crack a side, eased toward the count the
// work has come to: drawing state only, so a crack fades in and out rather
// than popping. Keyed by the act's plots, seen afresh with a new act.
let cracksFor = null; // page: the plots the cracks below were seen for
const crackInk = []; // page: per plot, { t, a: [ink a crack] }
function cracks(i, bx, want, t) {
  const plots = trees();
  if (cracksFor !== plots) { cracksFor = plots; crackInk.length = 0; }
  let c = crackInk[i];
  if (!c || t < c.t) c = crackInk[i] = { t, a: new Array(STUMP_CRACKS).fill(0) };
  const dt = Math.min(0.1, t - c.t);
  c.t = t;
  const n = Math.ceil(clamp01(want) * STUMP_CRACKS - 1e-6), was = ctx.globalAlpha;
  for (let k = 0; k < STUMP_CRACKS; k++) {
    const to = k < n ? 1 : 0;
    c.a[k] = to > c.a[k] ? Math.min(1, c.a[k] + dt / STUMP_CRACK_IN_S) : Math.max(0, c.a[k] - dt / STUMP_CRACK_OUT_S);
    if (c.a[k] <= 0) continue;
    ctx.globalAlpha = was * c.a[k];
    for (const col of [C0 - 1 - k * STUMP_CRACK_STEP, C0 + TW + k * STUMP_CRACK_STEP]) fill(K, bx + col * AP, fl() - AP, AP, AP);
  }
  ctx.globalAlpha = was;
}

// --- the dirt ----------------------------------------------------------------------------
// A snap's clods: off the soil at the snapped root's top, each up and out by
// its hash, falling under STUMP_DIRT_GRAV, whole at the top of its flight and
// faded to nothing by the time it is back down to the soil it left.
function clods(s, t) {
  const age = t - s.at, roots = STUMP_ROOTS[s.k];
  if (age < 0 || !roots) return;
  const x0 = plotX(s.i) + (C0 + roots[0][0] + 0.5) * AP, y0 = fl() - AP, was = ctx.globalAlpha;
  for (let j = 0; j < STUMP_DIRT; j++) {
    const h1 = hash(s.at * 7 + j), h2 = hash(s.at * 13 + j * 3);
    const vx = (h1 - 0.5) * STUMP_DIRT_VX, vy = STUMP_DIRT_UP[0] + h2 * STUMP_DIRT_UP[1], life = 2 * vy / STUMP_DIRT_GRAV;
    if (age >= life) continue;
    const half = life / 2, a = age < half ? 1 : 1 - (age - half) / half;
    const x = x0 + vx * age, y = y0 - vy * age + STUMP_DIRT_GRAV * age * age / 2;
    ctx.globalAlpha = was * a;
    fill(toneOf(SOIL, j, s.k, s.at), Math.round(x - AP / 2), Math.round(y - AP / 2), AP, AP);
  }
  ctx.globalAlpha = was;
}

// --- the woodcutter's arm ------------------------------------------------------------------
// An arm out from the body's near side, a cell under its top, to (hx, hy) on
// the stump, `reach` of the way there while it takes hold: a line of ink
// dots as the mock's woodcutter reaches its saw, and a fist where it holds.
function arm(w, hx, hy, reach = 1) {
  const sx = w.x - P, sy = w.y - 3 * P + P;
  const ex = sx + (hx - sx) * reach, ey = sy + (hy - sy) * reach;
  const n = Math.max(1, Math.ceil(Math.hypot(ex - sx, ey - sy) / 3));
  for (let j = 0; j <= n; j++) fill(K, Math.round(sx + (ex - sx) * j / n - 1), Math.round(sy + (ey - sy) * j / n - 1), 3, 3);
  if (reach >= 1) fill(K, Math.round(ex - AP / 2), Math.round(ey - AP / 2), AP / 2 + 1, AP);
}

// --- a stump -----------------------------------------------------------------------------
// Plot i's stump where it is held, its roots under it, and the hands on it.
function stump(p, i, t) {
  const bx = plotX(i), g = fl(), hold = holdOf(i), s = lastSnap(i, t), z = TW * AP, x = bx + C0 * AP;
  const w = hold.body, hoist = w && w.pull.ph === 'hoist';
  const jerk = s && t - s.at < STUMP_JERK_S ? AP : 0;
  const up = Math.round(hold.lift) + jerk, foot = g - up, dug = p.dug || 0;
  if (hoist) {
    // the last root gone: the stump swung up off its roots onto the head it
    // is carried on, arcing a little over, where the load is drawn from here on
    const k = ease(clamp01(w.pull.t / AFTER_PULL.hoist)), x1 = w.x - P + 1.5 * P - z / 2, y1 = w.y - 3 * P - z;
    const y0 = g - Math.round(hold.lift) - AP - z;
    const sx = Math.round(x + (x1 - x) * k), sy = Math.round(y0 + (y1 - y0) * k - Math.sin(Math.PI * k) * AP * 2);
    fill(stumpTone(p), sx, sy, z, z);
    arm(w, sx + z, sy + z / 2);
    return;
  }
  // the roots: snapped ones their stubs, the one under strain taut past
  // STUMP_TAUT, each shown only above the ground
  STUMP_ROOTS.forEach((cells, k) => {
    const live = k >= dug, taut = live && k === dug && hold.strain > STUMP_TAUT;
    for (const [c, d] of cells) {
      if (!live && d > 0) continue;
      const cx = x + c * AP;
      if (taut) { if (d === 0) fill(LOG(ROOT), cx, foot, AP, Math.max(0, g - foot)); continue; }
      const cy = foot + d * AP, h = Math.min(AP, g - cy);
      if (h > 0) fill(LOG(ROOT), cx, cy, AP, h);
    }
  });
  fill(stumpTone(p), x, foot - z, z, z);
  // the woodcutter's hands on the stump's near side, low, as it takes hold
  if (w) arm(w, x + z, foot - AP, w.pull.ph === 'grip' ? clamp01(w.pull.t / AFTER_PULL.grip) : 1);
}

export function drawStumpPull() {
  if (!S.after) return;
  const t = now(), list = trees();
  list.forEach((p, i) => {
    const bx = plotX(i);
    if (p.fell != null || !inView(bx - AP * 30, AP * 60)) return;
    // the cracks the work has come to, faded out once it stops or is done
    const hold = pullable(p) ? holdOf(i) : null;
    cracks(i, bx, hold ? ((p.dug || 0) + hold.strain) / AFTER_DIG_CLICKS : 0, t);
    if (pullable(p)) stump(p, i, t);
  });
  for (const s of snaps()) if (s.i != null && list[s.i]) clods(s, t);
}
