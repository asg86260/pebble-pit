// The cutscenes: the camera taken to a one-time event, and given back.
//
// There are exactly two -- the tearing of the rift and the drowning of the pit
// -- and they share one mechanism because the alternative is two hand-cut
// camera grabs, which is how the old rule got written: "the collapse does NOT
// take the camera" (game.js) was aimed at an ad-hoc grab that stole the frame
// from everything else pointing the view. This module is the one thing allowed
// to point it, and only while a scene runs.
//
// A cutscene is a camera, not a stop. The yard keeps walking, the sim keeps
// stepping, the moment plays out in the world at full flair whether or not it
// is being watched -- so any click skips, and skipping releases the camera,
// never the moment. Nothing here is saved: a reload mid-scene comes back to a
// yard that has already had its event, which is the same bargain the tearing's
// own gulp strikes.

import { CUT_TEAR_S, CUT_TEAR_ZOOM, CUT_DROWN_S, CUT_DROWN_ZOOM } from './config.js';
import { S, rift, pit } from './state.js';
import { lookAt, setZoom, clampCam } from './world.js';
import { reducedMotion } from './prefs.js';

// The triggers are watched rather than called: pit.js tears the rift and
// rift.js drowns the pit without either knowing a camera exists, and this
// notices. What it watches is the *gulp starting* -- the one thing both
// transitions do on the frame they happen and nothing else ever does -- so a
// restored save, which always comes back with its gulp already spent, replays
// nothing. Which of the two moments a fresh gulp is, the drowned flag says.
let sawGulp = 0;

const play = (name, s, zoom) => {
  S.cine = { name, at: 0, s, zoom, backX: S.camX + S.viewW / 2 };
  S.cineOwed = name;               // until it has been seen through: see `release`
  S.dirty = true;
};

export const cutsceneRunning = () => !!S.cine;

// Any click while a scene runs lands here first -- see `input.js`.
export function skipCutscene() {
  if (!S.cine) return false;
  release();
  return true;
}

export function stepCutscene(t) {
  if ((S.riftGulp || 0) > sawGulp) {
    if (S.drowned) play('drown', CUT_DROWN_S, CUT_DROWN_ZOOM);
    else play('tear', CUT_TEAR_S, CUT_TEAR_ZOOM);
  }
  sawGulp = S.riftGulp || 0;
  // A scene the last sitting closed the tab on. The gulp is spent by the time a
  // save is read, so the trigger above never fires for it; the save says which
  // scene was owed and it plays once, over the hole as it now stands
  // (critics 2026-09-10, C14).
  if (S.cineOwed && !S.cine) {
    if (S.cineOwed === 'drown') play('drown', CUT_DROWN_S, CUT_DROWN_ZOOM);
    else play('tear', CUT_TEAR_S, CUT_TEAR_ZOOM);
  }

  const c = S.cine;
  if (!c) return;
  if (!c.at) c.at = t;
  if (t - c.at >= c.s * 1000) { release(); return; }

  // Own the view for the length of it, every frame rather than once: the zoom
  // changes what a centered view is, the disc grows, and the follow or a
  // purchase glide would otherwise wrestle the camera mid-scene.
  S.follow = null;
  setZoom(c.zoom);
  // The tearing is framed on the disc; the drowning on the whole mouth, which
  // is wider than any window, so it centers on the near stretch of the hole
  // where the surface and the counter are.
  //
  // The zoom is one call and the view is set, not glided, so the scene is
  // already watched from a still seat -- except that the disc grows under the
  // tearing and its center creeps with it. Under reduced motion the framing is
  // taken on the scene's first frame and kept, so the one thing that moves is
  // the hole; letting go at the end is a `lookAt`, which is a cut under the same
  // preference.
  const cx = c.name === 'tear' ? rift.x + rift.w / 2
                               : pit.x + Math.min(700, pit.w) / 2;
  if (reducedMotion()) c.heldX ??= cx;
  // Glided to, not cut to: the design says 'glide to the pit mouth, pull in
  // a step', and the frame set the seat outright on the scene's first frame
  // -- a jump of a window or more from wherever the player was looking
  // (critics 2026-09-10, C16). The same ease the camera's own glide uses, so
  // the way in matches the way out; under reduced motion it is the cut it was.
  const want = (c.heldX ?? cx) - S.viewW / 2;
  S.camX = reducedMotion() ? want : S.camX + (want - S.camX) * 0.12;
  S.camTo = null;
  // The ground line low in the frame, the event above it -- the same framing
  // rule the intro keeps, for the same reason: measured up from the pit floor
  // a close view is all pit.
  S.camLockY = S.groundY - S.viewH * 0.62;
  clampCam();
}

function release() {
  S.cineOwed = null;
  const back = S.cine ? S.cine.backX : null;
  S.cine = null;
  S.camLockY = null;
  setZoom(1);
  if (back != null) lookAt(back);   // glide home rather than snap
  S.dirty = true;
}
