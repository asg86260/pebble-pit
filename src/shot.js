// The shot: the one thing that moves the camera while a cutscene holds
// (DESIGN.md, "One camera for every cutscene, and a bench to watch them on").
//
// A cutscene does not point the camera. It says, each frame, what must be
// seen -- a box in the world, and whether that box is to be gone to and held
// (`glide`) or kept with as it moves (`follow`) -- and the shot does the rest
// the same way for every one of them. There used to be six cameras, each with
// its own ease, its own chase and its own clamp, and a cutscene that crossed
// from one's ground into another's got the seams.
//
// The five rules, and where each is kept:
//   1. the bands are up for the whole hold: cutscene.js, `stepHush`;
//   2. no zoom step in a held frame: the shot never sets the zoom, and
//      between places it changes under the ripple (view.js, `frameOn`);
//   3. one move: a glide is one ease in and out, in x and y together, over a
//      time read off the distance -- `stepAim` below;
//   4. the box is fitted between the bands and the frame held inside the
//      place's limits, never under its floor or over its sky -- `fitBox`
//      and `PLACE_LIMITS`, which world.js `clampCam` reads too;
//   5. a place change frames the far side first: the act beats send the
//      ripple to where the box will be over there (actbeats.js, `hop`).

import { S } from './state.js';
import { CELL, CUT_BAND_SHARE, CUT_FRAME_MARGIN, CUT_PAN_PX_S, CUT_SETTLE_S, CUT_PAN_MAX_S,
         CUT_FOLLOW_K, DEEP_FLOOR_MARGIN } from './config.js';
import { deepX0, deepX1, deepFloor, deepTop } from './deep/place.js';
import { actPlace } from './acts.js';
import { frameMs } from './clock.js';
import { reducedMotion } from './prefs.js';

// The one easing every move in a cutscene rides: slow off the mark, slow onto
// the end, quickest halfway.
export const easeInOut = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

// --- where each place may be looked at ------------------------------------------
// Each place once: its left and right, the line the window's foot rests on
// (its floor, and the margin under it), and the top of its sky. The yard's
// sky is the world's own top; the afterlife's is its place's top, so the
// space between the yard and the cloud floor, which neither draws, is never
// framed. The bands may hang over a limit -- what is seen between them may
// not pass it.
const ofAct = v => ({
  x0: () => actPlace(v).x0(), x1: () => actPlace(v).x1(),
  foot: () => actPlace(v).floor() + actPlace(v).margin, top: () => actPlace(v).top()
});
export const PLACE_LIMITS = {
  yard: { x0: () => 0, x1: () => S.worldW, foot: () => S.worldH, top: () => 0 },
  deep: { x0: deepX0, x1: deepX1, foot: () => deepFloor() + DEEP_FLOOR_MARGIN, top: deepTop },
  after: ofAct('after'),
  hell: ofAct('hell')
};
export const limitsOf = (place = S.view) => PLACE_LIMITS[place] || PLACE_LIMITS.yard;

// How many cells deep each band stands at full: a share of the window's
// height, in whole cells of the window's grid; and in the world's pixels at
// the zoom on the glass, since the bands are drawn on the glass.
export const bandCells = () => Math.max(1, Math.round(S.H * CUT_BAND_SHARE / CELL));
export const bandWorld = () => bandCells() * CELL / (S.zoomShow || S.zoom || 1);

// The left edge a window `w` wide may stand at in `place`.
export function clampX(x, w = S.viewW, place = S.view) {
  const L = limitsOf(place), x0 = L.x0();
  return Math.max(x0, Math.min(x, Math.max(x0, L.x1() - w)));
}
// The window's top held to `place`: what shows between bands `band` deep
// stays between the place's sky and its floor. A window taller than the place
// keeps its floor.
export function clampY(y, h = S.viewH, band = 0, place = S.view) {
  const L = limitsOf(place);
  const hi = L.foot() - h + band, lo = L.top() - band;
  return lo > hi ? hi : Math.max(lo, Math.min(hi, y));
}
// Where the window's top rests when nothing lifts it: a height the place's
// framing holds it at (the afterlife's dive, the deep's kill, the opening),
// or the floor on the foot of the window.
export const restY = () => (S.camLockY != null ? S.camLockY : limitsOf().foot() - S.viewH);

// The window that frames `box` in the place on screen: its middle across on
// the box's middle; up and down, the least move off the resting height that
// puts the box between the bands at full, CUT_FRAME_MARGIN clear of both (a
// box taller than that is centered between them); then held to the place.
export function fitBox(box) {
  const band = bandWorld(), m = CUT_FRAME_MARGIN, rest = restY();
  const top = rest + band, bottom = rest + S.viewH - band;
  let dy = 0;
  if (box.h + m * 2 > bottom - top) dy = box.y + box.h / 2 - (top + bottom) / 2;
  else if (box.y - m < top) dy = box.y - m - top;
  else if (box.y + box.h + m > bottom) dy = box.y + box.h + m - bottom;
  return { x: clampX(box.x + box.w / 2 - S.viewW / 2), y: clampY(rest + dy, S.viewH, band) };
}

// --- the move ---------------------------------------------------------------------
// The aim under way: when its glide began and how long it takes, where the
// window's middle set off from, and for a follow the spring's own middle and
// speed. Ephemeral: a reload takes the shot again from its scene.
let aim = null;
let lastBox = null;

// A new move from wherever the camera stands now: the scene's first frame, or
// a box that has changed hands (a beat's next phase).
export function newAim() { aim = { at: null }; }
export function dropAim() { aim = null; lastBox = null; }
export const aiming = () => !!aim;
// The glide done: the frame has arrived on the box.
export const aimArrived = () => !!aim && !!aim.done;
// What the shot holds the window on, for the readout (`__shot`).
export const aimBox = () => lastBox;
export const aimGliding = () => !!aim && !aim.done;

// One frame of the shot on `box`: the window's top-left it asks for this
// frame, which the caller writes through `clampCam`. Not a chase: a share of
// the gap a frame is quick at the start and still sliding when the thing it
// went to see happens. Under reduced motion the frame is taken at once.
export function stepAim(t, box, move = 'glide') {
  if (!aim) newAim();
  lastBox = box;
  const want = fitBox(box);
  const to = { x: want.x + S.viewW / 2, y: want.y + S.viewH / 2 };
  if (aim.at == null) {
    aim.at = t;
    aim.from = { x: S.camX + S.viewW / 2, y: S.camY + S.viewH / 2 };
    // Its top speed, halfway along an ease in and out, is twice the average,
    // held under CUT_PAN_PX_S so a long way reads as a pan and not a whip --
    // within reason (CUT_PAN_MAX_S).
    const d = Math.hypot(to.x - aim.from.x, to.y - aim.from.y);
    aim.ms = 1000 * Math.max(CUT_SETTLE_S, Math.min(CUT_PAN_MAX_S, 2 * d / CUT_PAN_PX_S));
    aim.done = false;
    aim.pos = null;
  }
  const k = reducedMotion() ? 1 : Math.min(1, (t - aim.at) / aim.ms);
  let at;
  if (k < 1) {
    const e = easeInOut(k);
    at = { x: aim.from.x + (to.x - aim.from.x) * e, y: aim.from.y + (to.y - aim.from.y) * e };
  } else if (move === 'follow' && !reducedMotion()) {
    at = spring(to);
  } else {
    at = to;
  }
  if (k >= 1 && !aim.done) aim.done = true;
  aim.last = to;
  return { x: at.x - S.viewW / 2, y: at.y - S.viewH / 2 };
}

// The follow: a critically damped spring on the frame's middle. It takes over
// from the glide where the glide ends, moving at the box's own pace, so the
// hand-over is not felt; a box that starts or stops is eased into, never
// jerked after.
function spring(to) {
  const dt = Math.max(1e-3, frameMs() / 1000);
  if (!aim.pos) {
    const was = aim.last || to;
    aim.pos = { ...to };
    aim.vel = { x: (to.x - was.x) / dt, y: (to.y - was.y) / dt };
    return aim.pos;
  }
  const k = CUT_FOLLOW_K, c = 2 * Math.sqrt(k);
  for (const a of ['x', 'y']) {
    aim.vel[a] += (k * (to[a] - aim.pos[a]) - c * aim.vel[a]) * dt;
    aim.pos[a] += aim.vel[a] * dt;
  }
  return aim.pos;
}
