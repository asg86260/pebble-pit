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
//
// Letting go is a stretch, not a frame, and it does not go home. The first
// cut of this put the zoom back and dropped the held height in one frame and
// then glided the seat to wherever the player had been looking -- which read
// as a snap, and took the view off the one thing it had just made a fuss
// about. Now the seat stays on the event and the zoom and the ground line
// ease out to the yard's own over CUT_OUT_S, the way the opening lets go of
// its pair; the player scrolls away when they are done looking.

import { P, CELL, CUT_TEAR_S, CUT_TEAR_ZOOM, CUT_DROWN_S, CUT_DROWN_ZOOM,
         CUT_SHIELD_ZOOM, CUT_SHIELD_TAIL_S, CUT_SHIELD_MAX_S,
         CUT_SHIELD_FILL, CUT_SHIELD_GROUND, CUT_IN_S, CUT_OUT_S, CUT_GLIDE } from './config.js';
import { S, rift, pit } from './state.js';
import { setZoom, clampCam } from './world.js';
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
// A shield's answer has no length of its own: the net pays out for as long as its
// rate takes, the dome's first hold waits on somebody's walk out from under. So
// the scene ends on the fact -- the
// shield gone, or a held rock set down on the ground -- and a tail after it
// to see the wreck fly out along the heap. The ceiling is a safety.
//
// The pull-in is measured against the shield rather than fixed: the span, a
// rock's height over it and a little sky fill the frame, so the arch's crown
// is in the picture and the timber's lid is close. The ground sits low, since
// everything watched here happens above it.
//
// Measured across as well as up. The height alone was right on a desk, where
// any window is wider than a shield, and wrong on a phone stood upright, where
// none is: the arch's feet stood off both sides of the frame and the dome's
// ring ran out of the picture. Whichever of the two is the tighter fit says
// how far in the view goes.
const SHIELD = {
  s: CUT_SHIELD_MAX_S, tail: CUT_SHIELD_TAIL_S, ground: CUT_SHIELD_GROUND,
  zoom: () => {
    const s = S.shield;
    if (!s) return 1;
    // the span, the rock over it, and a little sky
    const up = (s.h + S.gh + 4) * P;
    // and the span across, or the rock if it is the wider thing coming down
    const across = Math.max(s.w, S.gw * P);
    return Math.min(CUT_SHIELD_ZOOM, stepToFill(up, S.H), stepToFill(across, S.W));
  },
  over: c => {
    if (!S.shield) return true;                  // it broke: the four that fail
    if (S.rockHeld) c.held = true;               // it has hold of it
    // ...and has let it down, and the two of them have had their beat under
    // it: the rock is set down while they stand there (shield.js, `answer`),
    // so whichever finishes second is the end of the scene.
    return !!c.held && !S.rockHeld && S.rockFall <= 0 && S.intro !== 'rescue';
  }
};
const sceneOf = name => SCENES[name] || SHIELD;

// The zoom step at which a world length fills CUT_SHIELD_FILL of a window
// length. A step is a multiple of the yard's own scale, and the yard's own is
// CELL / P screen pixels a world pixel (`setZoom`), so the bare ratio of the
// two lengths is that much too big a step.
const stepToFill = (world, window) => window * CUT_SHIELD_FILL / (world * CELL / P);

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
  S.cine = { name, at: 0, s: sc.s, zoom, from: S.zoom,
             spotX: S.shield ? S.shield.x + S.shield.w / 2 : S.camX + S.viewW / 2 };
  S.cineOwed = name;               // until it has been seen through: see `release`
  S.dirty = true;
};

// A scene on its way out has let go as far as the player is concerned: the
// click that would have skipped it lands in the yard instead.
export const cutsceneRunning = () => !!S.cine && !S.cine.out;

// Any click while a scene runs lands here first -- see `input.js`.
export function skipCutscene() {
  if (!cutsceneRunning()) return false;
  release();
  return true;
}

const ease = k => 1 - Math.pow(1 - k, 3);

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
  if (!c.out) {
    if (t - c.at >= c.s * 1000) release();
    else if (sc.over) {
      if (!c.overAt && sc.over(c)) c.overAt = t;
      if (c.overAt && t - c.overAt >= sc.tail * 1000) release();
    }
  }

  // Own the view for the length of it, every frame rather than once: the zoom
  // changes what a centered view is, the disc grows, and the follow or a
  // purchase glide would otherwise wrestle the camera mid-scene. The rescue's
  // own pan (`startRescue`) is one of the things overruled here: it is on the
  // same spot anyway.
  S.follow = null;
  // How far let go the scene is: nought while it plays, easing to one over the
  // way out. The zoom and the ground line are walked between the scene's
  // framing and the yard's own along it, so the last frame of the scene and
  // the first frame of the yard having its view back are the same picture.
  // Under reduced motion the way out is the cut it was.
  if (c.out) c.outAt ??= t;
  const out = !c.out ? 0
            : reducedMotion() ? 1
            : ease(Math.min(1, (t - c.outAt) / (CUT_OUT_S * 1000)));
  // And how far in it is: the zoom and the ground line walk from the yard's
  // own to the scene's over CUT_IN_S, alongside the seat's glide, for the
  // same reason the way out is a stretch -- the first cut of this put the
  // zoom on in one frame while the seat was still sliding over, and a
  // picture that jumps closer and then pans is two moves where one was
  // meant. Under reduced motion it is the cut it was.
  const into = reducedMotion() ? 1
             : ease(Math.min(1, (t - c.at) / (CUT_IN_S * 1000)));
  // The seat's center is what is kept across a zoom change, not its left
  // edge: the view widens as it pulls out, and holding `camX` would slide the
  // event off to the right of the frame.
  const center = S.camX + S.viewW / 2;
  S.camLockY = null;
  const from = c.from ?? 1;
  const zoom = from + (c.zoom - from) * into;
  setZoom(zoom + (1 - zoom) * out);
  // The disc grows under the tearing and its center creeps with it. Under
  // reduced motion the framing is taken on the scene's first frame and kept,
  // so the one thing that moves is the hole.
  const cx = sc.spot ? sc.spot() : c.spotX;
  if (reducedMotion()) c.heldX ??= cx;
  // Glided to, not cut to: the design says 'glide to the pit mouth, pull in
  // a step', and the frame set the seat outright on the scene's first frame
  // -- a jump of a window or more from wherever the player was looking
  // (critics 2026-09-10, C16). The same ease the camera's own glide uses;
  // under reduced motion it is the cut it was.
  const want = c.heldX ?? cx;
  const at = reducedMotion() ? want : center + (want - center) * CUT_GLIDE;
  S.camX = at - S.viewW / 2;
  S.camTo = null;
  // The ground line low in the frame, the event above it -- the same framing
  // rule the intro keeps, for the same reason: measured up from the pit floor
  // a close view is all pit. It is walked back to the yard's own height over
  // the same stretch the zoom is, for the intro's reason too: dropping the
  // difference in one frame is a hitch you feel.
  const close = S.groundY - S.viewH * (sc.ground || 0.62);
  const rest = S.worldH - S.viewH;
  S.camLockY = rest + (close - rest) * into * (1 - out);
  clampCam();
  if (out >= 1) {
    S.cine = null;
    S.camLockY = null;
    setZoom(1);
    S.dirty = true;
  }
}

// The scene is over, or skipped: it is owed nothing more and starts its way
// out. The camera is still this module's until the way out is walked.
function release() {
  S.cineOwed = null;
  S.cine.out = true;
  S.dirty = true;
}
