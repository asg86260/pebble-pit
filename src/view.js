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

import { S } from './state.js';
import { CELL, P, VIEW_GLIDE_S, DEEP_H, DEEP_SURFACE, DEEP_FLOOR_MARGIN, KILL_ZOOM } from './config.js';
import { clampCam, setZoom } from './world.js';
import { portalX, portalCircle, deepPortal, deepX0, deepX1, deepFloor, deepTop } from './deep/place.js';
import { reducedMotion } from './prefs.js';

export const inDeep = () => S.view === 'deep';
// A glide is running: the pointer waits for it.
export const gliding = () => S.viewTo != null;

// The yard's own zoom, the one `resize` sets.
const yardZoom = () => CELL / P;

// The deep's: the yard's, or less if the window is too short to hold the
// deep's water from under its surface to the floor. Snapped down to a whole
// number of device pixels a cell, the rule `setZoom` keeps, so the fit is
// never rounded back up past the window.
function deepZoom() {
  const need = DEEP_H - DEEP_SURFACE - P * 2 + DEEP_FLOOR_MARGIN;
  const k = (held ?? Math.min(1, S.H / (need * yardZoom()))) * (1 + KILL_ZOOM * killIn) * (shot ? shot.k : 1);
  const unit = CELL * S.dpr;
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
const zoomOf = v => (v === 'deep' ? deepZoom() : 1);

// Where each half is looked at from: the floor of the deep on the bottom of
// the window (world.js, `clampCam`), and in the yard the pit floor there as
// always. Across, each opens on its own end of the portal.
const openX = v => (v === 'deep' ? deepPortal().x : portalX());
function frameOn(v) {
  S.view = v;
  S.camLockY = null;
  setZoom(zoomOf(v));
  S.camX = openX(v) - S.viewW / 2;
  S.camTo = null;
  clampCam();
}

// The deep's camera as numbers, for drawing it through the ripple while the
// yard's camera is the one standing: the framing `frameOn('deep')` makes,
// worked out without making it.
export function deepCamera() {
  const zoom = yardZoom() * deepZoom();
  const viewW = S.W / zoom, viewH = S.H / zoom;
  const x0 = deepX0();
  const camX = Math.max(x0, Math.min(openX('deep') - viewW / 2, Math.max(x0, deepX1() - viewW)));
  return { zoom, viewW, viewH, camX, camY: deepFloor() + DEEP_FLOOR_MARGIN - viewH };
}

// The kill's frame (snatch.js): the deep's own, closer by `k` of KILL_ZOOM
// (held in `deepZoom`, which the deep re-takes every frame), its middle on
// `x`, which the beat glides on an ease; the floor stays at the foot of it
// (`clampCam`). `k` 0 is the deep's frame.
export function killFrame(k, x) {
  killIn = k;
  if (S.view !== 'deep') return;
  setZoom(deepZoom());
  S.camX = x - S.viewW / 2;
  clampCam();
}

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
  const rest = deepFloor() + DEEP_FLOOR_MARGIN - S.viewH;
  const y = shot.y == null ? rest : Math.max(deepTop(), Math.min(rest, shot.y - S.viewH / 2));
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
  if (S.view !== 'deep') return { x: S.camX, y: S.camY, w: S.viewW, h: S.viewH };
  if (yardCam) return yardCam;
  const z = yardZoom(), w = S.W / z, h = S.H / z;
  return { x: Math.max(0, portalX() - w / 2), y: S.worldH - h, w, h };
}

// Back to the yard's own window, the one it was left in, with no glide.
function backToYard() {
  frameOn('yard');
  if (yardCam) { S.camX = yardCam.x; clampCam(); }
}

function start(v) {
  if (S.view === v || gliding()) return;
  if (v === 'deep' && !canGoDown()) return;
  posed = false;
  if (reducedMotion()) { if (v === 'deep') { keepYard(); frameOn('deep'); landed = true; } else backToYard(); return; }
  // The yard is the half standing through the whole ripple: going down it
  // is where the camera already is, going up it is put back first and the
  // deep drawn over it, shrinking.
  if (v === 'deep') keepYard();
  else backToYard();
  S.viewTo = v;
  S.viewFade = 0;
  S.follow = null;
}

export const goDeep = () => start('deep');
export const goUp = () => start('yard');

// Straight there, for scenes and checks (`__view`).
export function setView(v) {
  posed = false;
  if (S.view === 'yard' && v === 'deep' && !gliding()) keepYard();
  S.viewTo = null;
  S.viewFade = 0;
  frameOn(v === 'deep' ? 'deep' : 'yard');
}

const ease = k => k * k * (3 - 2 * k);

export function stepView(c) {
  // A scene's framing outlives no scene: a new game or a read save drops
  // the shot, and its framing with it.
  if (shot && !S.shot) shot = null;
  if (gliding()) { glide(c.dt); return; }
  // A save left in the deep from before the portal comes back to the yard.
  if (S.view === 'deep' && !canGoDown()) { setView('yard'); return; }
  // Held every frame, since a resize or a scene's zoom lets go of it.
  if (S.view !== 'deep') return;
  if (shot) { frameShot(); return; }
  const z = deepZoom();
  if (S.zoom !== z * yardZoom()) setZoom(z);
  if (S.camLockY != null) S.camLockY = null;
  clampCam();
}

function glide(dt) {
  if (posed) dt = 0;
  S.viewFade = Math.min(1, S.viewFade + dt / (VIEW_GLIDE_S * 1000));
  if (S.viewFade < 1) return;
  if (S.viewTo === 'deep') { frameOn('deep'); landed = true; }
  else yardCam = null;
  S.viewTo = null;
  S.viewFade = 0;
}

// The ripple, in screen pixels, while a glide runs: its middle and how far
// its leading ring has gone -- nothing to past the window's farthest corner
// going down, back again going up. Down it opens out of the yard's end of
// the portal as the yard's camera sees it; up it draws back into the deep's
// end as the deep's camera sees it, so the deep closes onto the circle that
// was pressed. Null when there is no glide.
export function ripple() {
  if (!gliding()) return null;
  const down = S.viewTo === 'deep';
  const c = down ? portalCircle() : deepPortal();
  const cam = down ? { camX: S.camX, camY: S.camY, zoom: S.zoom } : deepCamera();
  const cx = (c.x - cam.camX) * cam.zoom, cy = (c.y - cam.camY) * cam.zoom;
  const far = Math.max(...[[0, 0], [S.W, 0], [0, S.H], [S.W, S.H]]
    .map(([x, y]) => Math.hypot(x - cx, y - cy))) + P * 8;
  const e = ease(S.viewFade);
  return { cx, cy, r: far * (down ? e : 1 - e) };
}
