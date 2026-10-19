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
//   2. no zoom step in a held frame: the zoom moves only as a scene's own
//      deliberate move, glided with the pan (`zoom` on a request, below),
//      and between places it changes under the ripple (view.js, `frameOn`);
//   3. one move: a glide is one ease in and out, in x and y and the zoom
//      together, over a time read off the distance -- `stepAim` below;
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
import { setZoomFree, zoomOn } from './world.js';
import { restZoom } from './view.js';

// The one easing every move in a cutscene rides: slow off the mark, slow onto
// the end, quickest halfway.
export const easeInOut = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

// --- where each place may be looked at ------------------------------------------
// Each place once: its left and right, the line the window's foot rests on
// (its floor, and the margin under it), and the top of its sky. The yard's
// sky is the world's own top; the afterlife's is its place's top, so the
// space between the yard and the cloud floor, the road, is framed only by the
// rise that rides up it (`ROAD`). The bands may hang over a limit -- what is
// seen between them may not pass it.
const ofAct = v => ({
  x0: () => actPlace(v).x0(), x1: () => actPlace(v).x1(),
  foot: () => actPlace(v).floor() + actPlace(v).margin, top: () => actPlace(v).top()
});
export const PLACE_LIMITS = {
  yard: { x0: () => 0, x1: () => S.worldW, foot: () => S.worldH, top: () => 0 },
  deep: { x0: () => deepX0(), x1: () => deepX1(), foot: () => deepFloor() + DEEP_FLOOR_MARGIN, top: () => deepTop() },
  after: ofAct('after'),
  hell: ofAct('hell')
};
// The road up from the yard to the afterlife, framed only while the rise is
// ridden (actbeats.js): one column from the yard's floor to heaven's, the gap
// between them included, so the camera can climb it in one shot. Its ceiling
// is not a sky but heaven's own resting window -- the frame the ride ends on
// is the one the afterlife holds, so letting the road go moves nothing.
const ROAD = {
  x0: () => Math.max(PLACE_LIMITS.yard.x0(), PLACE_LIMITS.after.x0()),
  x1: () => Math.min(PLACE_LIMITS.yard.x1(), PLACE_LIMITS.after.x1()),
  foot: () => PLACE_LIMITS.yard.foot(),
  top: () => PLACE_LIMITS.after.top(),
  lo: h => PLACE_LIMITS.after.foot() - h
};
let riding = false;
export const rideRoad = on => { riding = !!on; };
export const ridingRoad = () => riding;
export const limitsOf = (place = S.view) =>
  (riding && (place === 'yard' || place === 'after') ? ROAD : PLACE_LIMITS[place] || PLACE_LIMITS.yard);

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
  const hi = L.foot() - h + band, lo = L.lo ? L.lo(h, band) : L.top() - band;
  return lo > hi ? hi : Math.max(lo, Math.min(hi, y));
}
// Where the window's top rests when nothing lifts it: a height the place's
// framing holds it at (the afterlife's dive, the deep's kill, the opening),
// or the floor on the foot of the window.
export const restY = () => (S.camLockY != null ? S.camLockY : limitsOf().foot() - S.viewH);

// The window that frames `box` in the place on screen, at the zoom on the
// glass `z`: its middle across on the box's middle; up and down, the least
// move off the resting height that puts the box between the bands at full,
// CUT_FRAME_MARGIN clear of both (a box taller than that, or one the scene
// asks to have in the `middle`, is centered between them); then held to the
// place. Worked out at the zoom the move ends on, so a pull in or out lands
// on its own frame.
export function fitBox(box, z = S.zoomShow || S.zoom || 1, middle = false) {
  const viewW = S.W / z, viewH = S.H / z;
  const band = bandCells() * CELL / z, m = CUT_FRAME_MARGIN;
  const rest = S.camLockY != null ? S.camLockY : limitsOf().foot() - viewH;
  const top = rest + band, bottom = rest + viewH - band;
  let dy = 0;
  if (middle || box.h + m * 2 > bottom - top) dy = box.y + box.h / 2 - (top + bottom) / 2;
  else if (box.y - m < top) dy = box.y - m - top;
  else if (box.y + box.h + m > bottom) dy = box.y + box.h + m - bottom;
  return { x: clampX(box.x + box.w / 2 - viewW / 2, viewW), y: clampY(rest + dy, viewH, band), w: viewW, h: viewH };
}

// Whether `box` is inside the window as it stands.
const inWindow = b => b.x >= S.camX && b.y >= S.camY && b.x + b.w <= S.camX + S.viewW && b.y + b.h <= S.camY + S.viewH;

// The one box around every box of `at`: a scene that is about several things
// at once is about all of them. Null for none.
export function union(at) {
  if (!at || !at.length) return null;
  const x = Math.min(...at.map(r => r.x)), y = Math.min(...at.map(r => r.y));
  return { x, y, w: Math.max(...at.map(r => r.x + r.w)) - x, h: Math.max(...at.map(r => r.y + r.h)) - y };
}

// --- the move ---------------------------------------------------------------------
// The aim under way: when its glide began and how long it takes, where the
// window's middle set off from and how wide it was, the zoom it ends on (null:
// the scene leaves the zoom alone), and for a follow the spring's own middle
// and speed. Ephemeral: a reload takes the shot again from its scene.
let aim = null;
let lastBox = null;

// A new move from wherever the camera stands now: the scene's first frame, or
// a box that has changed hands (a beat's next phase). `key` names the move,
// so a scene asking every frame starts a new one only when it changes.
export function newAim(key) { aim = { at: null, key }; }
export function dropAim() { aim = null; lastBox = null; }
export const aiming = () => !!aim;
// The glide done: the frame has arrived on the box.
export const aimArrived = () => !!aim && !!aim.done;
// What the shot holds the window on, for the readout (`__shot`).
export const aimBox = () => lastBox;
// Moving on purpose: under way, or landing this very frame (the last step of
// the glide is still a step of it).
export const aimGliding = () => !!aim && (!aim.done || !!aim.landing);
// The zoom is the shot's while its move carries one: nothing else may glide
// it (world.js, `setZoom`), so a place that re-takes its own zoom every frame
// (the deep's) does not pull it back out from under a held frame.
export const zoomHeld = () => !!aim && aim.zTo != null;

// One frame of the shot on `box`: the window's top-left it asks for this
// frame, which the caller writes through `clampCam`. Not a chase: a share of
// the gap a frame is quick at the start and still sliding when the thing it
// went to see happens. Under reduced motion the frame is taken at once.
//
// `how` is the rest of the scene's request: `zoom`, a zoom to move to as a
// share of the place's own, glided on the same curve and the same clock as
// the pan; `middle`, the box centered between the bands rather than let in
// by the least move; `s`, the fewest seconds the move may take, for a scene
// whose story wants a slower pull than the distance does; `zs`, for a follow,
// the seconds the zoom takes on its own clock while the frame keeps with the
// box (the rise, whose zoom goes from the yard's to heaven's over the whole
// ride, not over the glide that starts it); and `key`, which starts a new
// move when it changes. A move is under way until its pan and its zoom have
// both landed.
export function stepAim(t, box, move = 'glide', how = {}) {
  if (!aim || (how.key !== undefined && aim.key !== how.key)) newAim(how.key);
  lastBox = box;
  if (aim.at == null) {
    aim.at = t;
    aim.from = { x: S.camX + S.viewW / 2, y: S.camY + S.viewH / 2, w: S.viewW };
    aim.zFrom = S.zoomShow || S.zoom || 1;
    aim.zTo = how.zoom != null ? zoomOn(restZoom() * how.zoom) : null;
    aim.zs = how.zs > 0 ? how.zs * 1000 : null;
    aim.middle = !!how.middle;
    const end = fitBox(box, aim.zTo ?? aim.zFrom, aim.middle);
    // Its top speed, halfway along an ease in and out, is twice the average,
    // held under CUT_PAN_PX_S so a long way reads as a pan and not a whip --
    // within reason (CUT_PAN_MAX_S). A zoom is a pan of the window's
    // corners, so the way is the farthest any corner goes.
    const dx = end.x + end.w / 2 - aim.from.x, dy = end.y + end.h / 2 - aim.from.y;
    const dw = (end.w - aim.from.w) / 2, dh = dw * S.H / S.W;
    const d = Math.hypot(Math.abs(dx) + Math.abs(dw), Math.abs(dy) + Math.abs(dh));
    aim.ms = 1000 * Math.max(CUT_SETTLE_S, how.s || 0, Math.min(CUT_PAN_MAX_S, 2 * d / CUT_PAN_PX_S));
    // A moving box already in the window, at the zoom it is to be kept at,
    // is not gone to but kept with from here: a glide's ease out of rest
    // would let a walker it was already on walk off the edge of it.
    const zoomed = aim.zTo != null && Math.abs(aim.zTo - aim.zFrom) > 1e-9;
    if (move === 'follow' && (!zoomed || aim.zs) && inWindow(box)) aim.ms = 0;
    aim.done = false;
    aim.pos = null;
  }
  const k = reducedMotion() || !aim.ms ? 1 : Math.min(1, (t - aim.at) / aim.ms);
  const e = easeInOut(k);
  // The zoom on its own clock, when it has one, else the pan's.
  const kz = aim.zs == null ? k : reducedMotion() ? 1 : Math.min(1, (t - aim.at) / aim.zs);
  // The zoom first, so the window is its size for this frame: the window's
  // width is what moves evenly, so its corners ride the same curve as its
  // middle.
  if (aim.zTo != null) {
    const z = kz >= 1 ? aim.zTo : 1 / (1 / aim.zFrom + (1 / aim.zTo - 1 / aim.zFrom) * easeInOut(kz));
    if (Math.abs(z - S.zoomShow) > 1e-9) setZoomFree(z);
  }
  // A zoom on its own clock is fitted at the size it has now, so the box is
  // kept between the bands all the way and not only where the zoom ends.
  const want = fitBox(box, aim.zs == null ? aim.zTo ?? S.zoomShow : S.zoomShow, aim.middle);
  // A follow that is to come to rest on a window of its own as its box lands
  // (the rise, onto the afterlife's resting frame as they stand on its
  // floor): the window's top eased from the box's frame to that one by
  // `toward.k`, asked afresh every frame.
  if (how.toward) want.y += (how.toward.y - want.y) * Math.max(0, Math.min(1, how.toward.k));
  const to = { x: want.x + want.w / 2, y: want.y + want.h / 2 };
  let at;
  if (k < 1) {
    at = { x: aim.from.x + (to.x - aim.from.x) * e, y: aim.from.y + (to.y - aim.from.y) * e };
  } else if (move === 'follow' && !reducedMotion()) {
    at = spring(to);
  } else {
    at = to;
  }
  const landed = k >= 1 && kz >= 1;
  aim.landing = landed && !aim.done;
  if (landed) aim.done = true;
  aim.last = to;
  return { x: at.x - S.viewW / 2, y: at.y - S.viewH / 2 };
}

// The follow: a critically damped spring on the frame's middle. It takes over
// from the glide where the glide ends, moving at the box's own pace, so the
// hand-over is not felt; a box that starts or stops is eased into, never
// jerked after.
function spring(to) {
  const dt = Math.max(1e-3, frameMs() / 1000);
  // From where the glide left the window, at rest, as the ease leaves it: a
  // box that jumped on the frame the glide landed is gone to by the spring,
  // never cut to.
  if (!aim.pos) {
    aim.pos = { x: S.camX + S.viewW / 2, y: S.camY + S.viewH / 2 };
    aim.vel = { x: 0, y: 0 };
  }
  // Aimed ahead of the box by its own speed times the time a spring this
  // stiff trails a steady pace (2 / sqrt(k)): a box walking steadily is
  // ridden on its middle, not a second behind it, and only its starts and
  // stops are eased. A box faster than a pan is led no further than a pan
  // goes, so a jump is a step the spring takes at its own pace, not a whip.
  const k = CUT_FOLLOW_K, c = 2 * Math.sqrt(k), was = aim.last || to;
  for (const a of ['x', 'y']) {
    const v = Math.max(-CUT_PAN_PX_S, Math.min(CUT_PAN_PX_S, (to[a] - was[a]) / dt));
    aim.vel[a] += (k * (to[a] + v * c / k - aim.pos[a]) - c * aim.vel[a]) * dt;
    aim.pos[a] += aim.vel[a] * dt;
  }
  return aim.pos;
}
