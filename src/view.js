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
import { CELL, P, VIEW_GLIDE_S, SHAFT_HAND_FADE_S, DEEP_H, DEEP_SURFACE, DEEP_FLOOR_MARGIN } from './config.js';
import { clampCam, setZoom, setZoomNow, yardCell } from './world.js';
import { portalX, portalCircle, deepPortal, deepX0, deepX1, deepFloor } from './deep/place.js';
import { reducedMotion } from './prefs.js';
import { dropLift } from './cutscene.js';
import { smoothstep as ease } from './motion.js';
import { actPlace, placeOpen, isActView } from './acts.js';
import { portalEnd } from './portals.js';

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
// `rest` asks for the fit alone, with no hold pulling it in.
function deepZoom(rest = false) {
  const need = DEEP_H - DEEP_SURFACE - P * 2 + DEEP_FLOOR_MARGIN;
  // Against the desk's cell, not the yard's: a phone draws the yard smaller
  // (`yardCell`) but the deep stays the size it is, so its share of the yard's
  // zoom is scaled up by the difference.
  const fit = Math.min(1, S.H / (need * CELL / P));
  const k = (rest ? fit : held ?? fit) * (CELL / yardCell());
  const unit = yardCell() * S.dpr;
  return Math.max(1, Math.floor(unit * k)) / unit;
}
// A zoom the deep is held at in place of its fit, for a look pulled in on
// one thing (`__deepZoom`): the deep re-takes its zoom every frame, so a
// setZoom from outside lasts one frame.
// Null lets go. Never saved, and nothing in the game sets it.
let held = null;
export const holdDeepZoom = k => { held = k; if (S.view === 'deep') setZoomNow(deepZoom()); };
// The hold on the deep's zoom let go, for a scene stood up afresh
// (scenesheet.js): one stood in the middle of a held look otherwise kept it,
// pulled in, for every scene after.
export function letGoDeepFrame() {
  held = null;
  if (S.view === 'deep' && !gliding()) setZoomNow(deepZoom());
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
// A place's own zoom, as a share of the yard's: what a cutscene's zoom move
// is a share of (shot.js, `stepAim`), so "twice as close" in the deep is
// twice the deep's fit.
export const restZoom = (v = S.view) => zoomOf(v);

// Where each half is looked at from: the floor of the deep on the bottom of
// the window (world.js, `clampCam`), and in the yard the pit floor there as
// always. Across, each opens on its own end of the portal.
// The zoom is cut, not glided: a place framed afresh is either a straight
// cut (a scene, a check) or the ripple's landing, where the far place's
// picture already covers the glass at that place's zoom -- so the step
// between two places' zooms happens under the ripple, never in a held frame
// (the owner's call 1, 2026-10-18).
const openX = v => (v === 'deep' ? deepPortal().x : isActView(v) ? actPlace(v).open() : portalX());
function frameOn(v, x = openX(v)) {
  S.view = v;
  S.camLockY = null;
  dropLift();
  setZoomNow(zoomOf(v));
  S.camX = x - S.viewW / 2;
  S.camTo = null;
  clampCam();
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
  const cx = x, zoom = yardZoom() * placeZoom(v);
  const viewW = S.W / zoom, viewH = S.H / zoom;
  const x0 = pl.x0();
  const camX = Math.max(x0, Math.min(cx - viewW / 2, Math.max(x0, pl.x1() - viewW)));
  return { zoom, viewW, viewH, camX, camY: pl.floor() + pl.margin - viewH };
}

export function deepGlass() {
  if (S.view === 'deep' && !gliding()) return { x0: S.camX, x1: S.camX + S.viewW };
  const c = deepCamera();
  return { x0: c.camX, x1: c.camX + c.viewW };
}

// The top edge of the deep's own frame, in world pixels: where a tall window
// shows water over the deep's ceiling. Off the fit alone, so a kill's pull or
// a scene's pull does not move what is measured against it (deep/fauna.js).
export const deepRestTop = () => deepFloor() + DEEP_FLOOR_MARGIN - S.H / (yardZoom() * deepZoom(true));

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
// The rise that rides up the road (actbeats.js) holds the yard's sky where
// the yard was left too, while the camera is still in the yard: the yard's
// clouds drop away below with its ground rather than ride up the glass.
let yardCam = null, skyHeld = false;
const keepYard = () => { yardCam = { x: S.camX, y: S.camY, w: S.viewW, h: S.viewH }; };
export function holdSky(on) {
  if (on && !skyHeld && S.view === 'yard') keepYard();
  skyHeld = !!on;
}
export function skyCam() {
  if (S.view === 'yard' && !(skyHeld && yardCam)) return { x: S.camX, y: S.camY, w: S.viewW, h: S.viewH };
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
let through = null, via = null, glides = 0, landX = null;
export const glideNo = () => glides;
// The act portal the glide under way goes by, or null (heaven's gates stand
// open for it, portals.js).
export const glidingBy = () => (gliding() ? via : null);
// The ring a glide opens out of or closes onto, in `place`: the wizards'
// portal's ends, or an act portal's (portals.js).
function ringIn(place, how = via) {
  if (how) return portalEnd(how, place);
  return place === 'deep' ? deepPortal() : portalCircle();
}
// A place's camera as numbers, framed on `x`: what `frameOn(place, x)` makes.
const cameraOf = (place, x) => (place === 'deep' ? deepCamera(x) : placeCamera(place, x));
// Where a glide frames the place it lands in: the x it was sent to (a
// cutscene's box over there, so it lands on its own frame and nothing moves
// after), else the ring's own end.
const landOn = place => (landX != null ? landX : ringIn(place).x);

// Through to `v` by the portal `how` (null: the wizards'). Going in, the
// nearer place is where the camera already is and the farther is drawn in the
// growing ring; coming back, the nearer is put back first and the farther
// drawn over it, shrinking onto the ring. `x`, if given, is where `v` is to
// be framed across. False if `v` is not across that portal from here, or a
// glide is under way.
function start(v, how = null, x = null) {
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
  through = inner; via = how; glides++; landX = x;
  const at = place => (place === v && x != null ? x : ringIn(place).x);
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
export const travel = (v, key, x = null) => start(v, key, x);
// The last arrival by an act portal, read once: the place and the portal.
let arrivedVia = null;
export function arrivedThrough() { const was = arrivedVia; arrivedVia = null; return was; }

// Over into the place next to this one with the camera left exactly where it
// is: the rise riding up the road out of the yard into the afterlife, where
// the window has climbed out of one place and into the other by itself, so
// there is no ripple to hide anything and nothing to frame afresh. The
// yard's window is kept on the way out, as a ripple keeps it.
export function crossTo(v) {
  if (S.view === v || gliding()) return;
  if (S.view === 'yard' && !skyHeld) keepYard();
  S.view = v;
}

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
  if (gliding()) { glide(c.dt); return; }
  if (S.portalRound && S.portalHand > 0) S.portalHand = Math.max(0, S.portalHand - c.dt / (SHAFT_HAND_FADE_S * 1000));
  // A save left in the deep from before the portal comes back to the yard,
  // and one left in an act's place by a build with that act on, read by one
  // with it off.
  if (S.view === 'deep' && !canGoDown()) { setView('yard'); return; }
  if (isActView(S.view)) {
    if (!placeOpen(S.view)) { setView('yard'); return; }
    // Held every frame, as the deep's is: a resize lets go of it.
    setZoom(placeZoom(S.view));
    clampCam();
    return;
  }
  // Held every frame, since a resize lets go of it; while a cutscene's move
  // holds the zoom the deep's own is refused (world.js, `setZoom`).
  if (S.view !== 'deep') return;
  setZoom(deepZoom());
  S.camLockY = null;
  clampCam();
}

function glide(dt) {
  if (posed) dt = 0;
  S.viewFade = Math.min(1, S.viewFade + dt / (VIEW_GLIDE_S * 1000));
  if (S.viewFade < 1) return;
  if (!through) through = S.viewTo === 'yard' ? 'deep' : S.viewTo;
  if (S.viewTo === through) { frameOn(through, landOn(through)); landed = through === 'deep'; }
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
  const inner = cameraOf(through, down ? landOn(through) : ringIn(through).x);
  const cam = down ? { camX: S.camX, camY: S.camY, zoom: S.zoom } : inner;
  const cx = (c.x - cam.camX) * cam.zoom, cy = (c.y - cam.camY) * cam.zoom;
  const far = Math.max(...[[0, 0], [S.W, 0], [0, S.H], [S.W, S.H]]
    .map(([x, y]) => Math.hypot(x - cx, y - cy))) + P * 8;
  const e = ease(S.viewFade);
  return { cx, cy, r: far * (down ? e : 1 - e), inner: through, cam: inner, no: glides };
}
