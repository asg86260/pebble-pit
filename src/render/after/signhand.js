// MOCK the-sign-station-by-hand
// Throwaway review code, never merged: the owner on the sign station's hand
// work (2026-11-03): "ok i dont like the swinging hammer aspect. what are
// some other ways we can do manual work? lets have a new slate". No hammer of
// any kind. The planks still reach the bench by the one hand (signsmock.js:
// pressed off the timber pile, let go anywhere over the shed, caught into the
// dashed slots), and the made flag is still taken by hand to the rack; what
// changes is how four planks become the flag. Each way is one gesture on a
// big target, and every step of the shaping is the player's own motion:
//
//   hoist   a rope runs from the top of the square over the shed's ceiling
//           to a toggle at the bench's right end. Take the toggle and pull it
//           down: the square's top three rows ride up with it, and a plank
//           cell slides in under them to stand as the pole. A pull to the
//           bottom of the stroke locks a row; let the toggle up and pull again.
//           Three pulls and the cloth is at the top of its pole.
//   heave   the stump's pull (after/stump.js, `strainStep`): take the square
//           and draw it up. Past the strain height it holds, straining, and a
//           row gives every strain, as a root does; keep holding and it climbs
//           to the top.
//   toss    take the square and flick it up (hands.js, `track`/`throwVel`,
//           the hand's own flick): the cloth flies a row up its pole and lands
//           there, held; a slow lift drops back. Three flicks.
//   stack   no square: the dashed slots are the flag's own four parts, the
//           pole's foot, then the cloth row by row from the bottom up. Each
//           plank let go over the shed settles into the next and takes that
//           part's shape as it lands; the landing is the making.
//   glide   heave, with the camera gliding in on the shed (world.js,
//           `setZoomFree`, and the place's held height, `S.camLockY`) the
//           first time a plank is taken off the pile, and back out once the
//           flag is in the rack: the station's own size kept, the view brought
//           to it while the hand works it.
//
// hoist, heave and toss share one shaping (`rise`): the square's top three
// rows are one block, moved whole at their true position, rising a row a
// step; under it, a bottom-row plank cell slides up and across into the
// pole's gap each step. Three steps and every cell is where the flag has it.
// The last one lands and the piece fades into the flag in the sign's slate.
//
// `globalThis.__signHand` is the way; a reset puts it away.

import { S } from '../../state.js';
import { P, GREY, GESTURE_STUMP_DRAG, GESTURE_STRAIN_LIFT, GESTURE_STRAIN_S, THROW_MAX } from '../../config.js';
import { held } from '../../reset.js';
import { ctx } from '../ctx.js';
import { K, W, MID, clamp01 } from './kit.js';
import { goodColor } from './piles.js';
import { groundOf, AP } from '../../after/place.js';
import { strainStep } from '../../after/stump.js';
import { track, throwVel } from '../../hands.js';
import { setZoomFree, clampCam } from '../../world.js';
import { toScreen } from '../../world.js';
import { signsM, wsFrame, HB, FLAG, flag, fillCell, x0 } from './signsmock.js';

held('sign-hand', () => { globalThis.__signHand = null; cam = null; });

const ease = u => u * u * (3 - 2 * u);
const T = () => S.after.t;
// The flag fades in over the plank cells once the last step lands.
const FADE_S = 0.35;
// A row moves to where it is wanted at this rate, a second (the stump's follow).
const FOLLOW = 18;
const Z = 2;          // the bench work at twice the size (round 4's B3-big)
const STEPS_RISE = 3; // rows the block climbs

// --- the shared shaping: the block rising, the pole growing under it ----------------------
// The square's cells by role: the block (its top three rows, all four
// columns), the pole's foot (bottom row, first column), and the three feed
// cells (the rest of the bottom row), feed j going to the pole's row 6 - j.
function cellsOf() {
  const M = signsM();
  return M.cells.map(c => ({ ...c, tone: goodColor('plank', M.laid[c.i]) }));
}
// Where feed cell j stands at `p` (0 at its start, 1 home): up its own
// column to the pole's row, then across into the pole.
function feedAt(j, p) {
  const up = ease(clamp01(p * 2)), across = ease(clamp01(p * 2 - 1));
  return { col: j - j * across, row: 6 - j * up };
}
// The piece at `rise` rows (0..3), its box's top left (bx, by) in cells.
function drawRise(d, rise, bx, by) {
  const cells = cellsOf();
  for (const c of cells) {
    if (c.row !== 6 || c.col === 0) continue;
    const f = feedAt(c.col, clamp01(rise - (c.col - 1)));
    fillCell(d, bx + f.col * Z, by + f.row * Z, Z, Z, c.tone);
  }
  for (const c of cells) {
    if (c.row === 6 && c.col === 0) fillCell(d, bx, by + 6 * Z, Z, Z, c.tone);
    else if (c.row < 6) fillCell(d, bx + c.col * Z, by + (c.row - rise) * Z, Z, Z, c.tone);
  }
}
// The made piece: the plank cells fading under the flag fading in.
function drawDone(d, plank) {
  const M = signsM(), h = M.hand.sh, b = HB(), a = clamp01((T() - h.doneAt) / FADE_S);
  if (a < 1) d.fade(1 - a, plank);
  if (a > 0) d.fade(a, () => { const p = d.world(b.x, b.y + FLAG.h * Z); flag(p.x, p.y, M.signV, Z); });
}
const finish = h => { const M = signsM(); h.doneAt = T(); M.step = 4; };
// A step locked: counted as one of the hand's motions (the ghost hand's
// retire), the moment kept for its held mark.
function lock(h) { h.locked++; h.lockAt = T(); signsM().hand.uses++; if (h.locked >= STEPS_RISE) finish(h); }
// Two ticks either side of the block's foot, faded off: the held impact.
function ticks(d, at, bx, by, row, dur = 0.25) {
  const k = (T() - at) / dur;
  if (!(k >= 0 && k < 1)) return;
  const y = (by + row * Z) * P - 2 * Z;
  d.fade(1 - k, () => { d.px((bx - 1) * P - 4, y, 3 * Z, 2 * Z, K); d.px((bx + 4 * Z + 1) * P - 2, y, 3 * Z, 2 * Z, K); });
}
// The block's box on the bench at `rise`, in the world: what hoist's rope ties
// to, and what heave and toss take hold of (a cell's slack round it).
function blockBox(rise, slack = 1) {
  const b = HB(), d = wsFrame(), a = d.world(b.x - slack, b.y + (3 - rise) * Z - slack), e = d.world(b.x + 4 * Z + slack, b.y + 7 * Z + slack);
  return { x: a.x, y: a.y, w: e.x - a.x, h: e.y - a.y };
}
const inBox = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const riseInit = () => ({ locked: 0, rise: 0, want: 0, lockAt: -9, doneAt: null, held: false });
function riseStep(h, dt) { h.rise += (h.want - h.rise) * Math.min(1, dt * FOLLOW); if (Math.abs(h.want - h.rise) < 1e-3) h.rise = h.want; }
function riseDraw(d, h) {
  const b = HB();
  if (h.doneAt != null) { drawDone(d, () => drawRise(d, STEPS_RISE, b.x, b.y)); return; }
  drawRise(d, h.rise, b.x, b.y);
  ticks(d, h.lockAt, b.x, b.y, 6 - h.locked);
}

// --- hoist: the rope and its toggle ---------------------------------------------------
// The toggle hangs at the bench's right end, the rope from it up to the
// ceiling, along it, and down to the block's top at the pole's column. Its
// stroke runs from TOG.top to TOG.bottom (rows); a pull to the bottom locks a
// row, and the next pull wants it let back up first.
const TOG = { x: 20, w: 2, top: -13, bottom: -4.5, ceil: -16, rearm: 0.2 };
const strokePx = () => (TOG.bottom - TOG.top) * AP;
const hoist = {
  init: () => ({ ...riseInit(), ty: TOG.top, grabDy: 0, armed: true, py: 0, bornAt: S.after ? T() : 0 }),
  // the toggle and the rope's whole run down the right end, a cell's slack round them
  grab(x, y) {
    const h = signsM().hand.sh, d = wsFrame(), a = d.world(TOG.x - 1, TOG.ceil), e = d.world(TOG.x + TOG.w + 1, h.ty + TOG.w + 1.5);
    return x >= a.x && x <= e.x && y >= a.y && y <= e.y ? 'toggle' : null;
  },
  down(what, x, y) { const h = signsM().hand.sh, ty = wsFrame().world(0, h.ty).y; Object.assign(h, { held: true, grabDy: ty - y, py: y }); return true; },
  move(x, y) { signsM().hand.sh.py = y; },
  up() { signsM().hand.sh.held = false; },
  step(dt) {
    const h = signsM().hand.sh;
    if (h.doneAt != null) { h.ty += (TOG.top - h.ty) * Math.min(1, dt * 8); riseStep(h, dt); return; }
    const top = wsFrame().world(0, TOG.top).y;
    if (h.held) h.ty = TOG.top + Math.max(0, Math.min(strokePx(), h.py + h.grabDy - top)) / AP;
    else h.ty += (TOG.top - h.ty) * Math.min(1, dt * 10);   // let go, it rides back up on the rope
    const k = (h.ty - TOG.top) / (TOG.bottom - TOG.top);
    if (!h.armed && k <= TOG.rearm) h.armed = true;
    if (h.armed && h.held && k >= 0.999) { h.armed = false; lock(h); }
    h.want = h.locked + (h.armed && h.held ? k : 0);
    riseStep(h, dt);
  },
  draw(d) { riseDraw(d, signsM().hand.sh); },
  // the rope and toggle stand from the start, so the bench says what it is
  // worked with before the square is whole; faded off once it is the flag,
  // and back on with the next bench
  under(d) {
    const h = signsM().hand.sh, b = HB(), pole = b.x + Z / 2, rx = TOG.x + TOG.w / 2, top = b.y + (3 - h.rise) * Z;
    const a = h.doneAt == null ? clamp01((T() - h.bornAt) / FADE_S) : 1 - clamp01((T() - h.doneAt) / FADE_S);
    if (a <= 0) return;
    d.fade(a, () => {
      // the rope: down from the ceiling to the block's top, along the ceiling, down to the toggle
      const c = TOG.ceil + 0.2;
      if (top > c + 0.1) d.line(pole, c, pole, top, 2, K);
      d.line(pole, c, rx, c, 2, K);
      d.line(rx, c, rx, h.ty, 2, K);
      // the two pegs it runs over, under the ceiling
      d.r(Math.floor(pole) , TOG.ceil, 1, 1, K); d.r(Math.floor(rx) - 0.5, TOG.ceil, 1, 1, K);
      // the toggle: a ring two cells square, paper through its middle, hung under the rope
      d.r(TOG.x, h.ty, TOG.w, TOG.w, K);
      d.px(TOG.x * P + 3, h.ty * P + 3, TOG.w * P - 6, TOG.w * P - 6, W);
    });
  },
  cue(u) {
    const d = wsFrame(), x = d.world(TOG.x + TOG.w / 2, 0).x;
    const y0 = d.world(0, TOG.top + 1).y, y1 = d.world(0, TOG.bottom + 1).y;
    const k = u < 0.15 ? 0 : u < 0.75 ? ease((u - 0.15) / 0.6) : 1;
    return { x, y: y0 + (y1 - y0) * k, pose: 'grab' };
  },
  at() { const h = signsM().hand.sh, d = wsFrame(); return d.world(TOG.x + TOG.w / 2, h.ty + 1); },
  busy: () => signsM().hand.sh.held
};

// --- heave: the stump's strain ----------------------------------------------------------
// Drawn up past the strain height (GESTURE_STRAIN_LIFT, the drag scaled as
// the stump's by GESTURE_STUMP_DRAG), the block stands half a row up and
// strains; every GESTURE_STRAIN_S held there a row gives (`strainStep`, the
// stump's own rule), and the hand still up, the next starts straining.
const heave = {
  init: () => ({ ...riseInit(), y0: 0, lift: 0, strain: 0 }),
  grab(x, y) { const h = signsM().hand.sh; return inBox(x, y, blockBox(h.rise, 1.5)) ? 'block' : null; },
  down(what, x, y) { const h = signsM().hand.sh; Object.assign(h, { held: true, y0: y, lift: 0, strain: 0 }); return true; },
  move(x, y) { const h = signsM().hand.sh; h.lift = Math.max(0, (h.y0 - y) * GESTURE_STUMP_DRAG); },
  up() { const h = signsM().hand.sh; Object.assign(h, { held: false, lift: 0, strain: 0 }); },
  step(dt) {
    const h = signsM().hand.sh;
    if (h.doneAt == null) {
      if (strainStep(h, dt, h.held, h.lift)) lock(h);
      h.want = h.doneAt != null ? STEPS_RISE : h.locked + (h.held ? 0.5 * clamp01(h.lift / GESTURE_STRAIN_LIFT) : 0);
    }
    riseStep(h, dt);
  },
  draw(d) {
    const h = signsM().hand.sh, b = HB();
    riseDraw(d, h);
    // straining: two marks at the block's foot coming in as the strain builds
    if (h.doneAt == null && h.held && h.lift >= GESTURE_STRAIN_LIFT) {
      const k = clamp01(h.strain / GESTURE_STRAIN_S), y = (b.y + (6 - h.locked) * Z) * P;
      d.fade(0.25 + 0.75 * k, () => { for (const s of [-1, 1]) d.px((b.x + (s < 0 ? -1 : 4 * Z) ) * P + (s < 0 ? 0 : 2), y - Z * P / 2, P - 2, 2, MID); });
    }
  },
  cue(u) {
    const h = signsM().hand.sh, r = blockBox(h.rise, 0);
    const k = u < 0.15 ? 0 : u < 0.55 ? ease((u - 0.15) / 0.4) : 1;
    return { x: r.x + r.w / 2, y: r.y + AP * Z - k * AP * 5, pose: 'grab' };
  },
  at() { const h = signsM().hand.sh, r = blockBox(h.rise, 0); return { x: r.x + r.w / 2, y: r.y + AP * Z }; },
  busy: () => signsM().hand.sh.held
};

// --- toss: the hand's flick -------------------------------------------------------------
// Held, the block lifts a little toward the hand; let go on a flick upward
// (the hand's own flick: `throwVel`, past a share of the hardest throw) it
// flies a row up, over and down onto its new row, and holds there a beat.
const TOSS = { lift: 0.3, liftPx: 40, min: 0.25, fly: 0.34, over: 0.7 };
const toss = {
  init: () => ({ ...riseInit(), y0: 0, dy: 0, fly: null }),
  grab(x, y) { const h = signsM().hand.sh; return !h.fly && inBox(x, y, blockBox(h.rise, 1.5)) ? 'block' : null; },
  down(what, x, y) { const h = signsM().hand.sh; Object.assign(h, { held: true, y0: y, dy: 0 }); track(x, y); return true; },
  move(x, y) { const h = signsM().hand.sh; h.dy = Math.max(0, h.y0 - y); track(x, y); },
  up() {
    const h = signsM().hand.sh, { vy } = throwVel();
    h.held = false;
    if (vy <= -TOSS.min * THROW_MAX && h.locked < STEPS_RISE) h.fly = { at: T(), from: h.rise, to: h.locked + 1 };
  },
  step(dt) {
    const h = signsM().hand.sh;
    if (h.fly) {
      const u = clamp01((T() - h.fly.at) / TOSS.fly);
      // up past the row and back down onto it: a toss's arc, on the act's clock
      h.rise = h.fly.from + (h.fly.to - h.fly.from) * u + Math.sin(u * Math.PI) * TOSS.over;
      h.want = h.rise;
      if (u >= 1) { h.rise = h.want = h.fly.to; h.fly = null; lock(h); }
      return;
    }
    if (h.doneAt == null) h.want = h.locked + (h.held ? TOSS.lift * clamp01(h.dy / TOSS.liftPx) : 0);
    riseStep(h, dt);
  },
  draw(d) { riseDraw(d, signsM().hand.sh); },
  cue(u) {
    const h = signsM().hand.sh, r = blockBox(h.rise, 0), x = r.x + r.w / 2, y = r.y + AP * Z;
    // pressed, held a beat, then flicked up fast
    if (u < 0.45) return { x, y, pose: 'grab' };
    const k = clamp01((u - 0.45) / 0.12);
    return { x, y: y - k * AP * 7, pose: k < 1 ? 'grab' : 'point' };
  },
  at() { const h = signsM().hand.sh, r = blockBox(h.rise, 0); return { x: r.x + r.w / 2, y: r.y + AP * Z }; },
  busy: () => signsM().hand.sh.held || !!signsM().hand.sh.fly
};

// --- stack: the slots are the flag's parts ------------------------------------------------
// Slot 0 the pole's foot (a column of four), slots 1 to 3 the cloth's rows
// with the pole's top, bottom row first. A plank caught settles into its
// slot, its four cells moving from the 2x2 it fell as into the part's line.
const STACK_FLY = 0.3;
const partCells = k => (k === 0 ? [0, 1, 2, 3].map(q => [0, 3 + q]) : [0, 1, 2, 3].map(q => [q, 3 - k]));
const stack = {
  init: () => ({ doneAt: null }),
  slot(k) { const b = HB(); return k === 0 ? { x: b.x, y: b.y + 3 * Z, w: Z, h: 4 * Z } : { x: b.x, y: b.y + (3 - k) * Z, w: 4 * Z, h: Z }; },
  // where the ghost hand and the driver let a plank go: over the next part
  benchAt() {
    const M = signsM(), k = M.laid.findIndex(v => v == null), s = stack.slot(Math.max(0, k)), b = HB();
    return wsFrame().world(b.x + 2 * Z, Math.min(s.y + s.h / 2, b.y + 4 * Z));
  },
  landed() { const M = signsM(); if (M.laid.every(v => v != null) && M.hand.sh.doneAt == null) { M.hand.sh.doneAt = T() + STACK_FLY; M.step = 4; } M.hand.uses++; },
  step() {},
  grab: () => null,
  draw(d) {
    const M = signsM(), h = M.hand, b = HB(), t = T();
    const plank = () => M.laid.forEach((v, k) => {
      if (v == null) return;
      const f = h.fly[k], u = f ? ease(clamp01((t - f.at) / STACK_FLY)) : 1;
      partCells(k).forEach(([c, r], q) => {
        const sx = f ? f.x + (q % 2) : 0, sy = f ? f.y + Math.floor(q / 2) : 0, tx = b.x + c * Z, ty = b.y + r * Z;
        const w = 1 + (Z - 1) * u;
        fillCell(d, f ? sx + (tx - sx) * u : tx, f ? sy + (ty - sy) * u : ty, w, w, goodColor('plank', v));
      });
    });
    if (h.sh.doneAt != null && t >= h.sh.doneAt) drawDone(d, plank); else plank();
  },
  cue: () => null,
  at: () => null,
  busy: () => false
};

export const SHAPERS = { hoist, heave, toss, stack, glide: heave };
// The way up now, while the hand mock stands at its twice-size bench.
export const shaper = () => (globalThis.__signsMock === 'b4' && SHAPERS[globalThis.__signHand]) || null;
export const shaperZ = Z;

// --- glide: the camera in on the shed while it is worked ---------------------------------
// In from the first plank taken off the pile, back out once the flag is in
// the rack: the zoom on the glass eased (world.js, `setZoomFree`, the aim's
// own unsnapped zoom) about a middle that travels from where the window was
// to the shed's, and the height held there (`S.camLockY`, a place's held
// height). Nothing else moves the camera while it is in.
const CAM = { in: 2.5, s: 0.7, midUp: 9 };
let cam = null; // page: the glide's state, from its first plank to its flag racked
export function stepGlide(want, dt) {
  if (globalThis.__signHand !== 'glide') return;
  if (!cam) {
    if (!want) return;
    cam = { k: 0, z0: S.zoomShow, c0: { x: S.camX + S.viewW / 2, y: S.camY + S.viewH / 2 } };
    window.__unpin?.();
  }
  cam.k = clamp01(cam.k + (want ? 1 : -1) * dt / CAM.s);
  const e = ease(cam.k), c1 = { x: x0() + 15.5 * AP, y: groundOf('workshop') - CAM.midUp * AP };
  setZoomFree(cam.z0 + (cam.z0 * CAM.in - cam.z0) * e);
  const mx = cam.c0.x + (c1.x - cam.c0.x) * e, my = cam.c0.y + (c1.y - cam.c0.y) * e;
  S.camTo = null;
  S.camX = mx - S.viewW / 2;
  S.camLockY = cam.k > 0 ? my - S.viewH / 2 : null;
  clampCam();
  if (!want && cam.k <= 0) cam = null;
}
// for the shot tools: a world point on the glass
export const onGlass = w => (w ? toScreen(w.x, w.y) : null);
