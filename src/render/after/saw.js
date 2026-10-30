// The saw, its strokes and the sawdust (DESIGN.md, "Act 3's grove, rebuilt",
// calls 7 to 9 and "The saw"; track B, taken from the signed-off mock W-2
// with heft and F1). One hand saw: a closed grip of ink round a paper cell, a
// blade deep at the heel and tapering to the toe, its back a line of ink and
// its teeth under its odd cells. The same drawing is the hand's, lying across
// every grown trunk a log's height up, and the woodcutter's, carried at its
// side between jobs and held up at the felling cut while it saws.
//
// The hand's saw lies with its grip on the shack's side and its blade across
// the trunk toward the fall, shown in the cut and hidden in the wood not yet
// cut (`drawSaw`, in the grove, under everything standing in front of it). The
// woodcutter's is drawn over the members (`drawHeldSaws`, from the cues'
// layer, render/aftercues.js), since it is in a body's hand: at the cut, the
// stroke the body's own (after/bodies.js `sawPose`), the slide smeared and
// only the blade ever crossing the trunk; between jobs, tilted at its side.
//
// Sawdust is not a good (the owner, 2026-10-30: "just have them fade out
// when they fall. no by product"): each bite throws its specks off the kerf's
// far mouth, and each falls under gravity and fades to nothing as it falls,
// never resting. A speck's flight is a pure function of the bite (when and on
// which plot, kept on the body or the hand's record) and its own hash, so a
// reload mid-throw carries on.
//
// Art on the grid, motion smooth: the saw is one drawing of whole cells on its
// own sheet, laid at its true position; each speck is a whole cell.

// REVIEW grove-built
import { PULL_HOLDS } from '../../after/stump.js';

import { P, GREY, TREE_CHOPS, AFTER_TREE, AFTER_SAW, AFTER_SAW_HEFT, AFTER_SAWDUST, AFTER_SAW_SMEAR, AFTER_SAW_CARRY,
         AFTER_SAW_FADE_S } from '../../config.js';
import { S } from '../../state.js';
import { AFTER_JOB } from '../../jobs.js';
import { ctx } from '../ctx.js';
import { themed } from '../../ink.js';
import { plotX, groundOf, AP } from '../../after/place.js';
import { trees, standing } from '../../after/grove.js';
import { gestureView, handSawAt } from '../../after/gestures.js';
import { sawPose, bodyInk } from '../../after/bodies.js';
import { deepAt } from '../../after/sky.js';
import { K, W, PALE, now, inView, clamp01, hash } from './kit.js';
import { goodTone } from './piles.js';

const { c0: C0, w: TW, stump: SH } = AFTER_TREE;
const H = AFTER_SAW_HEFT, BODY = 3 * P;
const fl = () => groundOf('tree');
const ink = tone => (typeof tone === 'number' ? GREY[tone] : tone);

// --- the drawing ------------------------------------------------------------------------
// The saw's cells [x, y, tone, sx, sy, sw, sh] off its heel, where the blade
// meets the grip on the blade's edge: the blade along x 0 up, a cell of it
// in row -1 to as deep as AFTER_SAW.depth says, a pixel of ink along its back;
// the teeth in row 0, under every other cell from the heel; the grip the
// square behind the heel, ink round a paper cell. Drawn pointing right; laid
// mirrored to point left.
function sawCells() {
  const out = [], g = AFTER_SAW.grip;
  for (let y = -g; y < 0; y++) for (let x = -g; x < 0; x++) out.push([x, y, x === -Math.ceil(g / 2) && y === -Math.ceil(g / 2) ? W : K]);
  AFTER_SAW.depth.forEach((h, x) => {
    for (let k = 1; k <= h; k++) out.push([x, -k, PALE]);
    out.push([x, -h, K, 0, 0, AP, 1]);
    if (x % 2 === 0) out.push([x, 0, K]);
  });
  return out;
}
const SPRITES = themed(new Map());   // cleared on a theme change
function sprite(id, cells) {
  if (SPRITES.has(id)) return SPRITES.get(id);
  const cv = typeof document === 'undefined' ? null : document.createElement('canvas');
  if (!cv) return null;
  const x0 = Math.min(...cells.map(c => c[0])), y0 = Math.min(...cells.map(c => c[1]));
  const x1 = Math.max(...cells.map(c => c[0])), y1 = Math.max(...cells.map(c => c[1]));
  cv.width = (x1 - x0 + 1) * AP; cv.height = (y1 - y0 + 1) * AP;
  const g = cv.getContext('2d');
  if (!g) return null;
  for (const [x, y, tone, sx, sy, sw, sh] of cells) {
    g.fillStyle = ink(tone);
    if (sw) g.fillRect((x - x0) * AP + sx, (y - y0) * AP + sy, sw, sh);
    else g.fillRect((x - x0) * AP, (y - y0) * AP, AP, AP);
  }
  const out = { cv, ox: -x0 * AP, oy: -y0 * AP };
  SPRITES.set(id, out);
  return out;
}
const SAW = () => sprite('saw', sawCells());
// The saw with its point (ax, ay) off the heel laid at world (x, y), turned
// th about it, pointing left with `left`, at ink a.
function laySaw(x, y, { th = 0, left = true, ax = 0, ay = 0, a = 1 } = {}) {
  const sp = SAW();
  if (!sp || a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  if (left) ctx.scale(-1, 1);
  ctx.rotate(th);
  ctx.drawImage(sp.cv, -sp.ox - ax, -sp.oy - ay);
  ctx.restore();
}

// --- the hand's saw, across each grown trunk -------------------------------------------
// The cells of the trunk cut so far from the saw's side, as pine.js opens its
// kerf: a cell a quarter of the strokes.
const cutCells = p => Math.ceil(Math.min(1, (p.chops || 0) / TREE_CHOPS) * TW);
// Whether a woodcutter is sawing plot i with its own saw: the hand's lying
// there makes way for it.
export const workedBy = i => (S.after?.bodies || []).some(b => b.job === AFTER_JOB.CUT && b.sawing && b.target === i);
// Each plot's lying saw's ink, eased in and out (fade, never pop). Drawing
// state only.
const sawInk = []; // page: each plot's lying saw's ink last frame
let inkAt = null;  // page: the act clock it was eased to
function inkOf(i, want, dt) {
  const was = sawInk[i] ?? want;
  return (sawInk[i] = clamp01(was + Math.sign(want - was) * Math.min(Math.abs(want - was), dt / AFTER_SAW_FADE_S)));
}
let inkFor = null; // page: the act the inks were eased for
function lyingSaws(t) {
  // A new act, or its clock run back (a new game, a scene stood up): every
  // saw simply there or not, as on the page's first sight of the grove.
  if (inkAt == null || t < inkAt || inkFor !== S.after.begun) { sawInk.length = 0; inkFor = S.after.begun; }
  const dt = inkAt == null || t < inkAt ? 0 : t - inkAt;
  inkAt = t;
  const hand = (gestureView() || []).find(r => r.key === 'tree');
  trees().forEach((p, i) => {
    const mine = hand && hand.on === i, want = standing(p) && (!workedBy(i) || (mine && (hand.grab || hand.s))) ? 1 : 0;
    const a = inkOf(i, want, dt);
    if (a <= 0 || !inView(plotX(i) - AP * 12, AP * 30)) return;
    const at = handSawAt(i, mine ? hand.s : 0), x0 = plotX(i) + C0 * AP, n = cutCells(p);
    // Hidden in the wood: the blade where the trunk is not cut yet, and the
    // teeth all across the trunk (they are in the cut, under its line).
    ctx.save();
    ctx.beginPath();
    ctx.rect(at.heel - AP * 20, at.edge - AP * 6, AP * 40, AP * 9);
    if (n < TW) ctx.rect(x0, at.edge - AP * 4, (TW - n) * AP, AP * 4);
    ctx.rect(x0, at.edge, TW * AP, AP);
    ctx.clip('evenodd');
    laySaw(at.heel, at.edge, { a });
    ctx.restore();
  });
}

// --- the sawdust ------------------------------------------------------------------------
// A bite's specks, `n` of them: flung toward the fall out of the kerf's far
// mouth on plot i's trunk, a share of AFTER_SAWDUST's throw each by its hash,
// falling and fading to nothing over its life; held off the floor.
function specks(d, t) {
  const age = t - d.at, { vx, vy, grav, life } = AFTER_SAWDUST;
  if (age < 0 || age >= life) return;
  const x0 = plotX(d.i) + C0 * AP - AP, y0 = fl() - SH * AP - AP, floor = fl() - AP, was = ctx.globalAlpha;
  ctx.globalAlpha = was * (1 - age / life);
  for (let k = 0; k < d.n; k++) {
    const h1 = hash(d.at * 37.1 + k * 7.7 + d.i * 3.3), h2 = hash(d.at * 11.3 + k * 4.1 + d.i * 9.7);
    const x = x0 - (vx[0] + h1 * (vx[1] - vx[0])) * age;
    const y = Math.min(floor, y0 - (vy[0] + h2 * (vy[1] - vy[0])) * age + grav * age * age / 2);
    ctx.fillStyle = goodTone('plank', 1 + Math.floor(h2 * 3));
    ctx.fillRect(Math.round(x), Math.round(y), AP, AP);
  }
  ctx.globalAlpha = was;
}
function sawdust(t) {
  const hand = (gestureView() || []).find(r => r.key === 'tree');
  for (const d of hand?.dust || []) specks(d, t);
  for (const b of S.after?.bodies || []) if (b.bite) specks(b.bite, t);
}

// In the grove (render/after/pine.js, after the trees): the hand's saws and
// every bite's sawdust.
export function drawSaw() {
  if (!S.after) return;
  const t = now();
  lyingSaws(t);
  sawdust(t);
}

// --- the woodcutter's saw ---------------------------------------------------------------
// Over the members (render/aftercues.js): each woodcutter's saw once it is
// handed over, faded with the body as it steps out of the crowd or into it.
export function drawHeldSaws() {
  const a = S.after;
  if (!a || !a.sawHanded) return;
  for (const w of a.bodies) {
    if (w.job !== AFTER_JOB.CUT || w.state !== 'work' || !inView(w.x - AP * 14, AP * 28)) continue;
    const ink0 = bodyInk(w) * (1 - (w.lifted ? 0 : deepAt(w.x)));
    if (ink0 <= 0) continue;
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * ink0;
    const left = w.x - P, top = w.y - BODY;
    if (w.sawing) {
      // Held up at the felling cut, an arm up to its grip, the blade along
      // the cut; the hand a pixel off the body's front, `s` of the stroke in.
      const pose = sawPose(w), edge = fl() - SH * AP, hy = edge - AP / 2;
      const heelAt = s => left - 1 - s * H.travel * AP - AP / 2;
      ctx.fillStyle = GREY[K];
      ctx.fillRect(Math.round(left + AP / 2), Math.round(hy), AP / 2, Math.round(top - hy + 2));
      if (pose.smear) laySaw(heelAt(pose.smear === 'in' ? 0 : 1), edge, { a: AFTER_SAW_SMEAR });
      laySaw(heelAt(pose.s), edge);
    } else {
      // Carried at its side by the grip, the blade forward and tilted up (the
      // tilt is in the drawing's own turn, so it points up either way it faces).
      // With its hands on a stump (track C's pull) the blade is turned away
      // behind it, never over the stump it pulls.
      const pulling = !!w.dig && !!w.pull && PULL_HOLDS.includes(w.pull.ph);
      const back = w.face < 0 && !pulling;
      laySaw(pulling ? left + BODY + AP / 2 : left + BODY / 2 + (back ? AP : -AP), top - AP, { th: -AFTER_SAW_CARRY, left: back, ax: -AP / 2, ay: -AP / 2 });
    }
    ctx.globalAlpha = was;
  }
}
