// Which half the player is looking at, and the ripple between them.
//
// The yard and the deep are one game on one clock, and the view is only
// where the camera is: the sim never reads it (docs/wave-serpent.md, "The two
// views"). Going between them is a ripple out of the wizards' portal
// (DESIGN.md, "The way between the halves"): the camera never moves. Going
// down, rings go out from the portal as the yard sees it and the deep is
// drawn inside the leading one, until it has swept the whole window; going
// up, the ring draws back into the portal and the yard is left. Each half is
// drawn with its own camera (render.js, `draw`), so neither moves while the
// other shows through. Under reduced motion the two framings follow one
// another with nothing between.
//
// The deep fills the window: water from the top edge to its floor, the
// roster in the band under that, and no surface or sky over it.
//
// Acts 3 and 4 add two places (acts.js, `PLACES`): the afterlife above the
// yard's sky and hell under the deep's floor, each framed by its own camera
// the way the deep is, its floor on the foot of the window. The way into
// each is a portal of the acts' own (portals.js): heaven's between the yard
// and the afterlife, hell's between the deep and hell. A portal is the
// camera's way, never a body's: bodies walk the road (the cloud stair, the
// slit in the deep's floor), and the view follows them by the ripple. Every
// way between two places is the same ripple: the nearer the yard of the two
// (`OUTER`) is the one the camera stands in while the farther shows through
// the ring, opening out of the near end going in and closing onto the far
// end coming back. `goPlace` is the straight cut for scenes and checks.

import { S } from './state.js';
import { CELL, P, VIEW_GLIDE_S, SHAFT_HAND_FADE_S, DEEP_H, DEEP_SURFACE, DEEP_FLOOR_MARGIN, KILL_ZOOM } from './config.js';
import { clampCam, setZoom, yardCell } from './world.js';
import { portalX, portalCircle, deepPortal, deepX0, deepX1, deepFloor, deepTop } from './deep/place.js';
import { reducedMotion } from './prefs.js';
import { dropLift } from './cutscene.js';
import { smoothstep as ease } from './motion.js';
import { actPlace, placeOpen, isActView } from './acts.js';
import { portalEnd } from './portals.js';
import { afterEnd, zoomAt, pullAt, topAt } from './after/sky.js';

// Each farther place and the nearer one it is reached from: the deep and the
// afterlife off the yard, hell off the deep.
const OUTER = { deep: 'yard', after: 'yard', hell: 'deep' };

export const inDeep = () => S.view === 'deep';
// A glide is running: the pointer waits for it.
export const gliding = () => S.viewTo != null;

// The yard's own zoom, the one `resize` sets.
const yardZoom = () => yardCell() / P;

// The deep's: the yard's, or less if the window is too short to hold the
// deep's water from under its surface to the floor. Snapped down to a whole
// number of device pixels a cell, the rule `setZoom` keeps, so the fit is
// never rounded back up past the window.
// `rest` asks for the fit alone, no hold, kill or shot pulling it in.
function deepZoom(rest = false) {
  const need = DEEP_H - DEEP_SURFACE - P * 2 + DEEP_FLOOR_MARGIN;
  // Against the desk's cell, not the yard's: a phone draws the yard smaller
  // (`yardCell`) but the deep stays the size it is, so its share of the yard's
  // zoom is scaled up by the difference.
  const fit = Math.min(1, S.H / (need * CELL / P));
  const k = (rest ? fit : (held ?? fit) * (1 + KILL_ZOOM * killIn) * (shot ? shot.k : 1)) * (CELL / yardCell());
  const unit = yardCell() * S.dpr;
  return Math.max(1, Math.floor(unit * k)) / unit;
}
// How far the kill has the deep's frame pulled in, 0..1 (`killFrame`).
let killIn = 0;

// A zoom the deep is held at in place of its fit, for a look pulled in on
// one thing (`__deepZoom`): the deep re-takes its zoom every frame, so a
// setZoom from outside lasts one frame.
// Null lets go. Never saved, and nothing in the game sets it.
let held = null;
export const holdDeepZoom = k => { held = k; if (S.view === 'deep') setZoom(deepZoom()); };
// Every hold on the deep's framing let go -- a zoom held, the kill's pull,
// a scene's shot -- for a scene stood up afresh (scenesheet.js): the kill's
// pull is let go by the finale as it ends, and a scene stood in the middle
// of it otherwise kept it, pulled in, for every scene after.
export function letGoDeepFrame() {
  held = null; killIn = 0; killY = null; shot = null;
  if (S.view === 'deep' && !gliding()) setZoom(deepZoom());
}
// An act's place (acts.js): the yard's zoom, or less if the window is too
// short to hold the place from its top to its floor and the floor's margin
// -- the deep's fit, without the deep's holds, which no act has yet.
// The afterlife is the exception: it is drawn at the yard's own zoom, so a
// body is the size it was in the yard, and nothing above its floor strip
// needs fitting at rest -- the dive lifts the frame to the throne itself.
function placeZoom(v) {
  if (v === 'after') return 1;
  const pl = actPlace(v);
  const fit = Math.min(1, S.H / ((pl.h + pl.margin) * CELL / P)) * (CELL / yardCell());
  const unit = yardCell() * S.dpr;
  return Math.max(1, Math.floor(unit * fit)) / unit;
}
const zoomOf = v => (v === 'deep' ? deepZoom() : isActView(v) ? placeZoom(v) : 1);

// --- the afterlife's camera (track B) ------------------------------------------------
// Act 3's camera zooms as it pans (docs/mocks/act3-skycrowd-2026-10-18): at
// 1x from the grove to where the act opens, then panning right it turns
// toward God and goes in on his face (after/sky.js, `zoomAt`, `topAt`). The
// zoom is read off where the window's middle stands, never the other way
// about, so a pan, a resize and the zoom that follows them all agree: the
// middle is the one fact, and the zoom and the window's left and top are
// worked out from it. The middle is held at the last window the place has,
// so the dive never runs past God.
export { afterEnd };
// The zoom as `setZoom` keeps it, whole device pixels a cell, worked out
// without setting it (for `placeCamera`).
function snapped(k) {
  const unit = yardCell() * S.dpr;
  return yardZoom() * Math.max(1, Math.round(unit * k)) / unit;
}
// The afterlife framed off its window's middle, held there. The lift is
// the dive's own: a height held by anything else is left alone at rest.
let lifted = false;
function frameAfter() {
  const cx = Math.min(S.camX + S.viewW / 2, afterEnd());
  const k = placeZoom('after') * zoomAt(cx);
  if (Math.abs(S.zoom - snapped(k)) > 1e-9) setZoom(k);
  S.camX = cx - S.viewW / 2;
  if (pullAt(cx) > 0) { S.camLockY = topAt(cx, S.zoom / yardZoom()); lifted = true; }
  else if (lifted) { S.camLockY = null; lifted = false; }
  clampCam();
}

// Where each half is looked at from: the floor of the deep on the bottom of
// the window (world.js, `clampCam`), and in the yard the pit floor there as
// always. Across, each opens on its own end of the portal.
const openX = v => (v === 'deep' ? deepPortal().x : isActView(v) ? actPlace(v).open() : portalX());
function frameOn(v, x = openX(v)) {
  S.view = v;
  S.camLockY = null;
  dropLift();
  setZoom(zoomOf(v));
  S.camX = x - S.viewW / 2;
  S.camTo = null;
  clampCam();
  if (v === 'after') frameAfter();
}

// The deep's camera as numbers, for drawing it through the ripple while the
// yard's camera is the one standing: the framing `frameOn('deep')` makes,
// worked out without making it.
export function deepCamera(x = openX('deep')) {
  const zoom = yardZoom() * deepZoom();
  const viewW = S.W / zoom, viewH = S.H / zoom;
  const x0 = deepX0();
  const camX = Math.max(x0, Math.min(x - viewW / 2, Math.max(x0, deepX1() - viewW)));
  return { zoom, viewW, viewH, camX, camY: deepFloor() + DEEP_FLOOR_MARGIN - viewH };
}

// The deep's columns the glass spans, in world pixels: the camera's own view
// while the deep is on screen, else the view it rests at on the way down
// (the meal's newcomers swim in from just off it, deep/meals.js).
// An act's camera as numbers, the same way (`deepCamera`): the framing
// `frameOn(v)` makes, worked out without making it, for whatever draws the
// place while another place's camera stands (a glide, once one is built).
export function placeCamera(v, x = actPlace(v).open()) {
  const pl = actPlace(v);
  // The afterlife's zoom and lift off where its middle stands (`frameAfter`).
  const cx = v === 'after' ? Math.min(x, afterEnd()) : x;
  const e = v === 'after' ? pullAt(cx) : 0;
  const zoom = v === 'after' ? snapped(placeZoom(v) * zoomAt(cx)) : yardZoom() * placeZoom(v);
  const viewW = S.W / zoom, viewH = S.H / zoom;
  const x0 = pl.x0();
  const camX = Math.max(x0, Math.min(cx - viewW / 2, Math.max(x0, pl.x1() - viewW)));
  return { zoom, viewW, viewH, camX, camY: e > 0 ? topAt(cx, zoom / yardZoom()) : pl.floor() + pl.margin - viewH };
}

export function deepGlass() {
  if (S.view === 'deep' && !gliding()) return { x0: S.camX, x1: S.camX + S.viewW };
  const c = deepCamera();
  return { x0: c.camX, x1: c.camX + c.viewW };
}

// The top edge of the deep's own frame, in world pixels: where a tall window
// shows water over the deep's ceiling. Off the fit alone, so a kill's pull or
// a scene's shot does not move what is measured against it (deep/fauna.js).
export const deepRestTop = () => deepFloor() + DEEP_FLOOR_MARGIN - S.H / (yardZoom() * deepZoom(true));

// The kill's frame (snatch.js): the deep's own, closer by `k` of KILL_ZOOM
// (held in `deepZoom`, which the deep re-takes every frame), its middle on
// `x`, which the beat glides on an ease; the floor stays at the foot of it
// (`clampCam`). `k` 0 is the deep's frame.
// With `y`, the frame's middle is held at that height as well, for the
// finale's way up (finale.js), the floor let go of; null keeps it on the floor.
let killY = null;
export function killFrame(k, x, y = null) {
  killIn = k;
  killY = y;
  if (S.view !== 'deep') return;
  setZoom(deepZoom());
  S.camX = x - S.viewW / 2;
  S.camLockY = y == null ? null : liftedY(y);
  clampCam();
}
const liftedY = y => {
  const rest = deepFloor() + DEEP_FLOOR_MARGIN - S.viewH;
  return Math.max(deepTop(), Math.min(rest, y - S.viewH / 2));
};

// A scene's framing of the deep (cutscene.js, `stepDeepShot`): pulled in by
// `k` over the deep's fit, its middle on (x, y), and `w` how much of that
// height is kept against the deep's own (the floor at the foot of the
// window), so a way out can ease the one into the other. The deep re-takes
// its framing every frame, so the scene's is held here and re-taken with it.
// Null lets go. Never saved: a reload plays the scene again.
let shot = null;
export function holdDeepShot(f) {
  shot = f;
  if (S.view === 'deep' && !gliding()) frameShot();
}
function frameShot() {
  setZoom(deepZoom());
  if (!shot) { S.camLockY = null; clampCam(); return; }
  // Held between the deep's top and its floor at the foot of the window. A
  // window taller than the deep has no such room, and is held at the floor:
  // clamped to the top instead, the first frame of a scene jumped the whole
  // picture up off the framing the way down arrived on.
  const rest = deepFloor() + DEEP_FLOOR_MARGIN - S.viewH;
  const top = Math.min(deepTop(), rest);
  const y = shot.y == null ? rest : Math.max(top, Math.min(rest, shot.y - S.viewH / 2));
  S.camLockY = rest + (y - rest) * (shot.w ?? 1);
  S.camX = shot.x - S.viewW / 2;
  S.camTo = null;
  clampCam();
}

// The way down arriving: the ripple has swept the window and the deep is
// framed. An edge, read once by `arrived` (cutscene.js, `cameraCues`): the
// first trip down's scene waits on it, and a straight cut there (`setView`,
// for scenes and checks) is not a trip.
let landed = false;
export function arrived() { const was = landed; landed = false; return was; }

// A glide held where it is, for a scene that wants a shot of its middle
// (scenes.js, `glideAt`): the yard runs on, the glide's own clock does not.
// Let go by the next glide or the next framing.
let posed = false;
export const poseGlide = () => { posed = true; };

// The way down is the wizards' portal (DESIGN.md, "Two crews and a
// portal"): until it stands, the deep runs unseen.
export const canGoDown = () => !!S.portalOpen;

// The camera the yard's sky is laid out against. Clouds, the smog's band and
// the rain live on the glass of the yard's window, and the rain's wash moves
// real dust, so while the deep is on screen the yard's sky goes on being laid
// out against the window the yard was left in. A yard reloaded in the deep
// has no such window, and is given the one it opens on at the portal.
let yardCam = null;
const keepYard = () => { yardCam = { x: S.camX, y: S.camY, w: S.viewW, h: S.viewH }; };
export function skyCam() {
  if (S.view === 'yard') return { x: S.camX, y: S.camY, w: S.viewW, h: S.viewH };
  if (yardCam) return yardCam;
  const z = yardZoom(), w = S.W / z, h = S.H / z;
  return { x: Math.max(0, portalX() - w / 2), y: S.worldH - h, w, h };
}

// Back to the yard's own window, the one it was left in, with no glide.
function backToYard() {
  frameOn('yard');
  if (yardCam) { S.camX = yardCam.x; clampCam(); }
}

// The glide under way: the farther of its two places (the one drawn through
// the ring), the portal it goes by (null: the wizards'), and a count of
// glides, so the picture frozen for one (render.js) is never another's. This
// session's only: a reload mid-glide lands in the nearer place, where
// `S.view` already is.
let through = null, via = null, glides = 0;
export const glideNo = () => glides;
// The ring a glide opens out of or closes onto, in `place`: the wizards'
// portal's ends, or an act portal's (portals.js).
function ringIn(place, how = via) {
  if (how) return portalEnd(how, place);
  return place === 'deep' ? deepPortal() : portalCircle();
}
// A place's camera as numbers, framed on `x`: what `frameOn(place, x)` makes.
const cameraOf = (place, x) => (place === 'deep' ? deepCamera(x) : placeCamera(place, x));

// Through to `v` by the portal `how` (null: the wizards'). Going in, the
// nearer place is where the camera already is and the farther is drawn in the
// growing ring; coming back, the nearer is put back first and the farther
// drawn over it, shrinking onto the ring. False if `v` is not across that
// portal from here, or a glide is under way.
function start(v, how = null) {
  if (S.view === v || gliding()) return false;
  const inward = OUTER[v] === S.view;
  const inner = inward ? v : S.view, outer = OUTER[inner];
  if (!outer || (!inward && v !== outer)) return false;
  // The wizards' portal joins the yard and the deep alone; an act's its own two.
  if (!how && inner !== 'deep') return false;
  if (inner === 'deep' && !canGoDown()) return false;
  if (isActView(inner) && !placeOpen(inner)) return false;
  // The hands over the wizards' portal have told what they had to once the
  // player has gone down and come back up by their own click or key
  // (render/shaftway.js); an act portal's hands are portals.js's.
  if (!how) { if (inward) S.portalDown = true; else if (S.portalDown) S.portalRound = true; }
  posed = false;
  through = inner; via = how; glides++;
  const at = place => ringIn(place).x;
  if (inward && S.view === 'yard') keepYard();
  if (reducedMotion()) {
    if (inward) frameOn(inner, at(inner));
    else if (!how && outer === 'yard') backToYard();
    else frameOn(outer, at(outer));
    landed = inward && inner === 'deep';
    if (how) arrivedVia = { place: v, via: how };
    return true;
  }
  if (!inward) { if (!how && outer === 'yard') backToYard(); else frameOn(outer, at(outer)); }
  S.viewTo = v;
  S.viewFade = 0;
  S.follow = null;
  return true;
}

// The wizards' way, from the yard down and from the deep up, and nowhere else.
export const goDeep = () => { if (S.view === 'yard') start('deep'); };
export const goUp = () => { if (S.view === 'deep') start('yard'); };
// Through an act's portal (portals.js): to `v` by the portal `key`. True if
// the glide started.
export const travel = (v, key) => start(v, key);
// The last arrival by an act portal, read once: the place and the portal.
let arrivedVia = null;
export function arrivedThrough() { const was = arrivedVia; arrivedVia = null; return was; }

// Straight there, for scenes and checks (`__view`). An act's place only with
// its act on; anything else is the yard.
export function setView(v) {
  posed = false;
  const to = v === 'deep' || (isActView(v) && placeOpen(v)) ? v : 'yard';
  if (S.view === 'yard' && to !== 'yard' && !gliding()) keepYard();
  S.viewTo = null;
  S.viewFade = 0;
  frameOn(to);
}

// Into an act's place, straight there (the dev panel's buttons, `__goPlace`):
// the road in is the act's to build. Refused with the act off or a glide
// under way; the view it ends on, either way.
export function goPlace(v) {
  if (!isActView(v) || !placeOpen(v) || gliding()) return S.view;
  setView(v);
  return S.view;
}


export function stepView(c) {
  // A scene's framing outlives no scene: a new game or a read save drops
  // the shot, and its framing with it.
  if (shot && !S.shot) shot = null;
  if (gliding()) { glide(c.dt); return; }
  if (S.portalRound && S.portalHand > 0) S.portalHand = Math.max(0, S.portalHand - c.dt / (SHAFT_HAND_FADE_S * 1000));
  // A save left in the deep from before the portal comes back to the yard,
  // and one left in an act's place by a build with that act on, read by one
  // with it off.
  if (S.view === 'deep' && !canGoDown()) { setView('yard'); return; }
  if (isActView(S.view)) {
    if (!placeOpen(S.view)) { setView('yard'); return; }
    // Held every frame, as the deep's is: a resize lets go of it. The
    // afterlife's is read off where the window's middle stands.
    if (S.view === 'after') { frameAfter(); return; }
    const z = placeZoom(S.view);
    if (S.zoom !== z * yardZoom()) setZoom(z);
    clampCam();
    return;
  }
  // Held every frame, since a resize or a scene's zoom lets go of it.
  if (S.view !== 'deep') return;
  if (shot) { frameShot(); return; }
  const z = deepZoom();
  if (S.zoom !== z * yardZoom()) setZoom(z);
  S.camLockY = killY != null ? liftedY(killY) : null;
  clampCam();
}

function glide(dt) {
  if (posed) dt = 0;
  S.viewFade = Math.min(1, S.viewFade + dt / (VIEW_GLIDE_S * 1000));
  if (S.viewFade < 1) return;
  if (!through) through = S.viewTo === 'yard' ? 'deep' : S.viewTo;
  if (S.viewTo === through) { frameOn(through, ringIn(through).x); landed = through === 'deep'; }
  else if (S.viewTo === 'yard') yardCam = null;
  if (via) arrivedVia = { place: S.viewTo, via };
  S.viewTo = null;
  S.viewFade = 0;
}

// The ripple, in screen pixels, while a glide runs: its middle and how far
// its leading ring has gone -- nothing to past the window's farthest corner
// going down, back again going up. Down it opens out of the yard's end of
// the portal as the yard's camera sees it; up it draws back into the deep's
// end as the deep's camera sees it, so the deep closes onto the circle that
// was pressed. Null when there is no glide.
// `inner` is the place shown through the ring and `cam` its camera, framed
// where the glide lands in it, so the picture in the ring is the one the view
// arrives on; `no` says which glide it is.
export function ripple() {
  if (!gliding()) return null;
  // A glide with no record of its far place (a scene's, or a caller from
  // before the acts) is the wizards' way, as it always was.
  if (!through) { through = S.viewTo === 'yard' ? 'deep' : S.viewTo; via = null; }
  const down = S.viewTo === through;
  const c = ringIn(down ? OUTER[through] : through);
  const inner = cameraOf(through, ringIn(through).x);
  const cam = down ? { camX: S.camX, camY: S.camY, zoom: S.zoom } : inner;
  const cx = (c.x - cam.camX) * cam.zoom, cy = (c.y - cam.camY) * cam.zoom;
  const far = Math.max(...[[0, 0], [S.W, 0], [0, S.H], [S.W, S.H]]
    .map(([x, y]) => Math.hypot(x - cx, y - cy))) + P * 8;
  const e = ease(S.viewFade);
  return { cx, cy, r: far * (down ? e : 1 - e), inner: through, cam: inner, no: glides };
}
