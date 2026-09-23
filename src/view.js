// Which half the player is looking at, and the glide between them.
//
// The yard and the deep are one game on one clock, and the view is only
// where the camera is: the sim never reads it (docs/wave-serpent.md, "The two
// views"). Going between them is a camera move, never a cut. The deep's
// water is the drowned pit's liquid carried on under its surface
// (render/abyssfield.js), so the camera closes on the pit's liquid until it
// fills the frame, is carried to the same cells of that liquid seen in the
// deep -- the same picture -- and opens out of it while the deep's roof,
// light, serpent and stations fade in over the water. Going up is the same
// the other way. Under reduced motion the two framings follow one another
// with nothing between.
//
// The deep is framed whole, floor to ceiling: its way home is the underside
// of the surface, so a window too short to show it is pulled back until it
// does, rather than leaving the one way out off the top of the screen.

import { S, pit } from './state.js';
import { CELL, P, VIEW_GLIDE_S, VIEW_GLIDE_ZOOM, DEEP_H, DEEP_ROOF, DEEP_FLOOR_MARGIN } from './config.js';
import { clampCam, setZoom } from './world.js';
import { mouthX, waterShift } from './deep/place.js';
import { abyssLine, pitDepth } from './pit.js';
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

// The point the glide closes on: the middle of the pit's liquid, clear of
// its surface and its floor, and in the deep the same cells of the same
// liquid. At the turn both halves are framed on it at one zoom, so the two
// frames are one picture.
function focusOf(v) {
  const y = (abyssLine() + P * 4 + S.groundY + pitDepth()) / 2;
  return { x: pit.x + pit.w / 2, y: v === 'deep' ? y - waterShift() : y };
}
// How far in at the turn, as a share of the yard's own zoom: at least
// VIEW_GLIDE_ZOOM, and far enough that the frame holds nothing but the
// liquid, so no bank, sky or floor is in the picture being handed over.
function peakZoom() {
  const w = S.W / yardZoom(), h = S.H / yardZoom();
  const roomW = Math.max(P, pit.w - P * 4), roomH = Math.max(P, pitDepth() - P * 10);
  return Math.max(VIEW_GLIDE_ZOOM, w / roomW, h / roomH);
}

// The camera's middle, where the glide set out from and where the far half
// opens: module state, being a glide in progress, which a reload does not
// keep (S.viewTo is not saved either).
let from = null, to = null;

// A glide held where it is, for a scene that wants a shot of its middle
// (scenes.js, `glideAt`): the yard runs on, the glide's own clock does not.
// Let go by the next glide or the next framing.
let posed = false;
export const poseGlide = () => { posed = true; };

function start(v) {
  if (S.view === v || gliding()) return;
  posed = false;
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
  posed = false;
  if (S.view === 'yard' && v === 'deep' && !gliding()) keepYard();
  S.viewTo = null;
  S.viewFade = 0;
  from = to = null;
  frameOn(v === 'deep' ? 'deep' : 'yard');
}

// In and out on one curve, so the camera does not lurch at either end.
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
  if (posed) dt = 0;
  S.viewFade = Math.min(1, S.viewFade + dt / (VIEW_GLIDE_S * 1000));
  const k = S.viewFade;
  // The move to the far half is made at the turn, where both frame the same
  // liquid.
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
  // How far in: nothing at either end, all the way at the turn.
  const into = ease(k < 0.5 ? k * 2 : (1 - k) * 2);
  const home = k < 0.5 ? from : to;
  if (!home) return;
  const at = focusOf(S.view);
  const base = zoomOf(S.view);
  setZoom(base + (peakZoom() - base) * into);
  const cx = home.x + (at.x - home.x) * into, cy = home.y + (at.y - home.y) * into;
  S.camX = cx - S.viewW / 2;
  S.camLockY = cy - S.viewH / 2;
  clampCam();
}

// How much of the deep is drawn over its water: all of it, except in a
// glide, where it fades in as the camera opens out of the water on the way
// down and out as it closes in on the way up. The water itself is never
// faded: it is the picture the glide hands over on.
export function deepFade() {
  if (!gliding() || S.view !== 'deep') return 1;
  const k = S.viewFade;
  return S.viewTo === 'deep' ? ease(Math.max(0, Math.min(1, (k - 0.5) * 2)))
                             : 1 - ease(Math.min(1, k * 2));
}
