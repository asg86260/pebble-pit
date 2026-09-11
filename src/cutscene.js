// The cutscenes: the camera taken to a one-time event, and given back.
//
// There were exactly two -- the tearing of the rift and the drowning of the
// pit -- and they shared one mechanism because the alternative was two
// hand-cut camera grabs, which is how the old rule got written: "the collapse
// does NOT take the camera" (game.js) was aimed at an ad-hoc grab that stole
// the frame from everything else pointing the view. This module is the one
// thing allowed to point it, and only while a scene runs. The shields' five
// answers are scenes too now (DESIGN.md, "The cutscenes, fleshed out"): each
// is the dearest thing the player has bought so far going off, and it was
// going off in the corner of the window if the view was on the farm.
//
// A cutscene is a camera, not a stop. The yard keeps walking, the sim keeps
// stepping, the moment plays out in the world at full flair whether or not it
// is being watched -- so any click skips, and skipping releases the camera,
// never the moment. Nothing here is saved but the name of a scene cut short:
// a reload mid-scene comes back to a yard that has already had its event, and
// plays the scene it was owed over the event as it now stands.

import { P, CUT_TEAR_S, CUT_TEAR_ZOOM, CUT_DROWN_S, CUT_DROWN_ZOOM,
         CUT_SHIELD_ZOOM, CUT_SHIELD_TAIL_S, CUT_SHIELD_MAX_S,
         CUT_SHIELD_FILL, CUT_SHIELD_GROUND } from './config.js';
import { S, rift, pit } from './state.js';
import { lookAt, setZoom, clampCam } from './world.js';
import { reducedMotion } from './prefs.js';
import { KINDS, shieldUp } from './shield.js';

// What each scene is: how long it may run, how far in it pulls, where it
// looks, and -- for the ones whose length the game decides -- the fact that
// says it is over. `spot` is asked every frame where the thing being watched
// moves (the disc grows under the tearing); a scene with no `spot` looks at
// where it was stood when it started.
//
// The tearing is framed on the disc; the drowning on the whole mouth, which
// is wider than any window, so it centers on the near stretch of the hole
// where the surface and the counter are. A shield is framed on its span.
const SCENES = {
  tear:  { s: CUT_TEAR_S, zoom: CUT_TEAR_ZOOM, spot: () => rift.x + rift.w / 2 },
  drown: { s: CUT_DROWN_S, zoom: CUT_DROWN_ZOOM, spot: () => pit.x + Math.min(700, pit.w) / 2 },
};
// A shield's answer has no length of its own: the net pays out for as long as
// its rate takes, the jack holds and then shoves, the dome's first hold waits
// on somebody's walk out from under. So the scene ends on the fact -- the
// shield gone, or a held rock set down on the ground -- and a tail after it
// to see the wreck fly out along the heap. The ceiling is a safety.
//
// The pull-in is measured against the shield rather than fixed: the span, a
// rock's height over it and a little sky fill the frame, so the arch's crown
// is in the picture and the timber's lid is close. The ground sits low, since
// everything watched here happens above it.
const SHIELD = {
  s: CUT_SHIELD_MAX_S, tail: CUT_SHIELD_TAIL_S, ground: CUT_SHIELD_GROUND,
  zoom: () => {
    const s = S.shield;
    if (!s) return 1;
    // the rock over the span -- and, for the jack, as far up as the rams shove it
    const over = S.gh + (KINDS[s.kind].push || 0) / P + 4;
    return Math.min(CUT_SHIELD_ZOOM, S.H * CUT_SHIELD_FILL / ((s.h + over) * P));
  },
  over: c => {
    if (!S.shield) return true;                  // it broke: the four that fail
    if (S.rockHeld) c.held = true;               // it has hold of it
    return !!c.held && !S.rockHeld && S.rockFall <= 0;   // and has let it down
  }
};
const sceneOf = name => SCENES[name] || SHIELD;

// The triggers are watched rather than called: pit.js tears the rift,
// rift.js drowns the pit and shield.js answers a rock without any of them
// knowing a camera exists, and this notices. For the rift it watches the
// *gulp starting* -- the one thing both transitions do on the frame they
// happen and nothing else ever does -- so a restored save, which always comes
// back with its gulp already spent, replays nothing. Which of the two moments
// a fresh gulp is, the drowned flag says.
let sawGulp = 0;
// For a shield it watches the rock *leaving the sky* while a finished shield
// stands: the timber breaks on the frame the rock reaches it, so a camera
// that went on the answer would see a wreck. Going on the fall, the glide in
// happens under the rock and the view is stood on the span before the two
// meet.
let sawFall = false;

const play = name => {
  const sc = sceneOf(name);
  const zoom = typeof sc.zoom === 'function' ? sc.zoom() : sc.zoom;
  S.cine = { name, at: 0, s: sc.s, zoom, backX: S.camX + S.viewW / 2,
             spotX: S.shield ? S.shield.x + S.shield.w / 2 : S.camX + S.viewW / 2 };
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

// Whether the shield standing now is one whose answer is still owed a scene.
// The four that fail can only answer once -- a failed kind goes into
// `shieldsDone` and its row never returns. The dome answers every rock after
// the first; only its first hold, the one with the rescue in it, is a scene,
// and `S.rescued` is the fact that says it has had it.
const shieldSceneDue = () =>
  shieldUp() && (KINDS[S.shield.kind].answer !== 'hold' || (S.buried && !S.rescued));

export function stepCutscene(t) {
  if ((S.riftGulp || 0) > sawGulp) play(S.drowned ? 'drown' : 'tear');
  sawGulp = S.riftGulp || 0;
  const falling = S.rockFall > 0 && !S.rockHeld;
  if (falling && !sawFall && !S.cine && shieldSceneDue()) play(S.shield.kind);
  sawFall = falling;
  // A scene the last sitting closed the tab on. The gulp is spent by the time a
  // save is read, so the trigger above never fires for it; the save says which
  // scene was owed and it plays once, over the hole as it now stands
  // (critics 2026-09-10, C14). A shield's answer is saved mid-answer and
  // resumes, so the owed scene plays over the answer as it stands.
  if (S.cineOwed && !S.cine) play(S.cineOwed);

  const c = S.cine;
  if (!c) return;
  const sc = sceneOf(c.name);
  if (!c.at) c.at = t;
  if (t - c.at >= c.s * 1000) { release(); return; }
  if (sc.over) {
    if (!c.overAt && sc.over(c)) c.overAt = t;
    if (c.overAt && t - c.overAt >= sc.tail * 1000) { release(); return; }
  }

  // Own the view for the length of it, every frame rather than once: the zoom
  // changes what a centered view is, the disc grows, and the follow or a
  // purchase glide would otherwise wrestle the camera mid-scene. The rescue's
  // own pan (`startRescue`) is one of the things overruled here: it is on the
  // same spot anyway.
  S.follow = null;
  setZoom(c.zoom);
  // The zoom is one call and the view is set, not glided, so the scene is
  // already watched from a still seat -- except that the disc grows under the
  // tearing and its center creeps with it. Under reduced motion the framing is
  // taken on the scene's first frame and kept, so the one thing that moves is
  // the hole; letting go at the end is a `lookAt`, which is a cut under the same
  // preference.
  const cx = sc.spot ? sc.spot() : c.spotX;
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
  S.camLockY = S.groundY - S.viewH * (sc.ground || 0.62);
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
