// Which half the player is looking at, and the glide between them.
//
// The yard and the deep are one game on one clock, and the view is only
// where the camera is: the sim never reads it (docs/wave-serpent.md, "The two
// views"). Going between them is a camera move, never a cut. The camera
// closes on the surface at the shaft until the surface is all there is, the
// frame is black, the camera is carried to the same surface seen from the
// other side, and it opens out of it. Under reduced motion the two framings
// follow one another with nothing between.
//
// The deep is framed whole, floor to ceiling: its way home is the underside
// of the surface, so a window too short to show it is pulled back until it
// does, rather than leaving the one way out off the top of the screen.

import { S } from './state.js';
import { CELL, P, VIEW_GLIDE_S, VIEW_GLIDE_ZOOM, DEEP_H, DEEP_ROOF, DEEP_SURFACE, DEEP_FLOOR_MARGIN } from './config.js';
import { clampCam, setZoom } from './world.js';
import { deepTop, deepFloor, mouthX } from './deep/place.js';
import { abyssLine } from './pit.js';
import { reducedMotion } from './prefs.js';

export const inDeep = () => S.view === 'deep';
// A glide is running: the pointer waits for it, and the picture draws
// whichever half the camera is in.
export const gliding = () => S.viewTo != null;

// The yard's own zoom, the one `resize` sets.
const yardZoom = () => CELL / P;

// The deep's: the yard's, or less if the window is too short to hold the
// deep from its floor to the roof over its ceiling. Snapped down to a whole
// number of device pixels a cell, the rule `setZoom` keeps, so the fit is
// never rounded back up past the window.
function deepZoom() {
  const need = DEEP_H + DEEP_ROOF + DEEP_FLOOR_MARGIN;
  const k = Math.min(1, S.H / (need * yardZoom()));
  const unit = CELL * S.dpr;
  return Math.max(1, Math.floor(unit * k)) / unit;
}
const zoomOf = v => (v === 'deep' ? deepZoom() : 1);

// Where each half is looked at from: the floor of the deep on the bottom of
// the window (world.js, `clampCam`), and in the yard the pit floor there as
// always. Across, both open on the shaft.
function frameOn(v) {
  S.view = v;
  S.camLockY = null;
  setZoom(zoomOf(v));
  S.camX = mouthX() - S.viewW / 2;
  S.camTo = null;
  clampCam();
}

// The point the glide closes on, on each side of the surface.
const surfaceOf = v => ({ x: mouthX(), y: v === 'deep' ? deepTop() + DEEP_SURFACE : abyssLine() });

// The camera's middle, where the glide set out from and where the far half
// opens: module state, being a glide in progress, which a reload does not
// keep (S.viewTo is not saved either).
let from = null, to = null;

function start(v) {
  if (S.view === v || gliding()) return;
  if (reducedMotion()) { frameOn(v); return; }
  if (S.view === 'yard') keepYard();
  S.viewTo = v;
  S.viewFade = 0;
  S.follow = null;
  from = { x: S.camX + S.viewW / 2, y: S.camY + S.viewH / 2 };
  to = null;
}

// The camera the yard's sky is laid out against. Clouds, the smog's band and
// the rain live on the glass of the yard's window, and the rain's wash moves
// real dust, so while the deep is on screen -- or the camera is on its way
// there -- the yard's sky goes on being laid out against the window the yard
// was left in, not against a camera in the deep. A yard reloaded in the deep
// has no such window, and is given the one it opens on at the shaft.
let yardCam = null;
const keepYard = () => { yardCam = { x: S.camX, y: S.camY, w: S.viewW, h: S.viewH }; };
export function skyCam() {
  if (S.view !== 'deep' && !gliding()) return { x: S.camX, y: S.camY, w: S.viewW, h: S.viewH };
  if (yardCam) return yardCam;
  const z = yardZoom(), w = S.W / z, h = S.H / z;
  return { x: Math.max(0, mouthX() - w / 2), y: S.worldH - h, w, h };
}

export const goDeep = () => start('deep');
export const goUp = () => start('yard');

// Straight there, for scenes and checks (`__view`).
export function setView(v) {
  if (S.view === 'yard' && v === 'deep' && !gliding()) keepYard();
  S.viewTo = null;
  S.viewFade = 0;
  from = to = null;
  frameOn(v === 'deep' ? 'deep' : 'yard');
}

// In and out of the black on one curve, so the camera does not lurch at
// either end of it.
const ease = k => k * k * (3 - 2 * k);

export function stepView(c) {
  if (gliding()) { glide(c.dt); return; }
  // Held every frame, since a resize or a scene's zoom lets go of it.
  if (S.view !== 'deep') return;
  const z = deepZoom();
  if (S.zoom !== z * yardZoom()) setZoom(z);
  if (S.camLockY != null) S.camLockY = null;
  clampCam();
}

function glide(dt) {
  S.viewFade = Math.min(1, S.viewFade + dt / (VIEW_GLIDE_S * 1000));
  const k = S.viewFade;
  // The move to the far half is made under the black, at the middle.
  if (k >= 0.5 && S.view !== S.viewTo) {
    frameOn(S.viewTo);
    to = { x: S.camX + S.viewW / 2, y: S.camY + S.viewH / 2 };
  }
  if (k >= 1) {
    frameOn(S.viewTo);
    if (S.view === 'yard') yardCam = null;
    S.viewTo = null;
    S.viewFade = 0;
    from = to = null;
    return;
  }
  // How far in: nothing at either end, all the way at the black.
  const into = ease(k < 0.5 ? k * 2 : (1 - k) * 2);
  const home = k < 0.5 ? from : to;
  if (!home) return;
  const at = surfaceOf(S.view);
  const base = zoomOf(S.view);
  setZoom(base + (base * VIEW_GLIDE_ZOOM - base) * into);
  const cx = home.x + (at.x - home.x) * into, cy = home.y + (at.y - home.y) * into;
  S.camX = cx - S.viewW / 2;
  S.camLockY = cy - S.viewH / 2;
  clampCam();
}

// How black the frame is: nothing at either end of a glide, all of it at the
// middle, where the camera changes halves.
export const viewDark = () => (gliding() ? 1 - Math.abs(S.viewFade * 2 - 1) : 0);
