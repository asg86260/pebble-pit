// The cutscenes: the camera taken to a one-time event, and given back.
//
// This module is the one thing allowed to point the camera, and only while a
// scene runs: the tearing of the rift, the drowning of the pit, and each
// shield's answer (DESIGN.md, "The cutscenes, fleshed out").
//
// A cutscene is a camera, not a stop. The sim keeps stepping and the moment
// plays out whether or not it is watched, so any click skips, and skipping
// releases the camera, never the moment. Nothing is saved but the name of a
// scene cut short, which a reload plays over the event as it now stands.
//
// Letting go is a stretch, not a frame, and it does not go home: the seat
// stays on the event and the zoom and the ground line ease out over CUT_OUT_S.
// The player scrolls away when they are done looking.

import { P, CELL, CUT_TEAR_S, CUT_TEAR_ZOOM, CUT_DROWN_S, CUT_DROWN_ZOOM,
         CUT_SHIELD_ZOOM, CUT_SHIELD_TAIL_S, CUT_SHIELD_MAX_S,
         CUT_SHIELD_FILL, CUT_SHIELD_GROUND, CUT_IN_S, CUT_OUT_S, CUT_GLIDE } from './config.js';
import { S, rift, pit } from './state.js';
import { setZoom, clampCam } from './world.js';
import { reducedMotion } from './prefs.js';
import { KINDS, shieldUp } from './shield.js';

// How long a scene may run, how far in it pulls, and where it looks. `spot`
// is asked every frame where the thing watched moves (the disc grows under
// the tearing); a scene with no `spot` looks where it stood when it started.
// The drowning centers on the near stretch of the hole, where the surface and
// the counter are, since the whole mouth is wider than any window.
const SCENES = {
  tear:  { s: CUT_TEAR_S, zoom: CUT_TEAR_ZOOM, spot: () => rift.x + rift.w / 2 },
  drown: { s: CUT_DROWN_S, zoom: CUT_DROWN_ZOOM, spot: () => pit.x + Math.min(700, pit.w) / 2 },
};
// A shield's answer has no length of its own, so the scene ends on the fact
// (the shield gone, or a held rock set down) plus a tail to see the wreck fly.
// The ceiling is a safety. The pull-in is measured so the span, a rock's
// height over it and a little sky fill the frame.
// Measured across as well as up: a desk's window is wider than any shield, a
// phone stood upright is not, and the tighter of the two fits says how far in.
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
    // it (shield.js, `answer`): whichever finishes second ends the scene.
    return !!c.held && !S.rockHeld && S.rockFall <= 0 && S.intro !== 'rescue';
  }
};
const sceneOf = name => SCENES[name] || SHIELD;

// The zoom step at which a world length fills CUT_SHIELD_FILL of a window
// length. A step is a multiple of the yard's own scale, and the yard's own is
// CELL / P screen pixels a world pixel (`setZoom`), so the bare ratio of the
// two lengths is that much too big a step.
const stepToFill = (world, window) => window * CUT_SHIELD_FILL / (world * CELL / P);

// The triggers are watched, not called: pit.js tears the rift, rift.js
// drowns the pit and shield.js answers a rock without knowing a camera
// exists. For the rift it watches the *gulp starting*, which a restored save
// (its gulp already spent) never shows, so a reload replays nothing; the
// drowned flag says which of the two moments a fresh gulp is.
let sawGulp = 0;
// For a shield it watches the rock *leaving the sky* while a finished shield
// stands: the timber breaks on the frame the rock reaches it, so a camera
// that went on the answer would see a wreck.
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

// Whether the shield standing now is owed a scene. The four that fail answer
// once (`shieldsDone`). The dome answers every rock; only its first hold,
// the one with the rescue in it, is a scene, and `S.rescued` says it has
// had it.
const shieldSceneDue = () =>
  shieldUp() && (KINDS[S.shield.kind].answer !== 'hold' || (S.buried && !S.rescued));

export function stepCutscene(t) {
  if ((S.riftGulp || 0) > sawGulp) play(S.drowned ? 'drown' : 'tear');
  sawGulp = S.riftGulp || 0;
  const falling = S.rockFall > 0 && !S.rockHeld;
  if (falling && !sawFall && !S.cine && shieldSceneDue()) play(S.shield.kind);
  sawFall = falling;
  // A scene the last sitting closed the tab on: the triggers above never fire
  // for it, so the save says which was owed and it plays once over the event
  // as it now stands.
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

  // Own the view every frame, not once: the zoom changes what a centered view
  // is, the disc grows, and the follow or a purchase glide would otherwise
  // wrestle the camera mid-scene. The rescue's own pan is on the same spot.
  S.follow = null;
  // How far let go the scene is: nought while it plays, easing to one on the
  // way out, so the scene's last frame and the yard's first are one picture.
  // Under reduced motion the way out is a cut.
  if (c.out) c.outAt ??= t;
  const out = !c.out ? 0
            : reducedMotion() ? 1
            : ease(Math.min(1, (t - c.outAt) / (CUT_OUT_S * 1000)));
  // And how far in: the zoom and the ground line walk over CUT_IN_S alongside
  // the seat's glide, since a picture that jumps closer and then pans is two
  // moves where one was meant.
  const into = reducedMotion() ? 1
             : ease(Math.min(1, (t - c.at) / (CUT_IN_S * 1000)));
  // The seat's center is what is kept across a zoom change, not its left
  // edge: holding `camX` would slide the event off to the right as the view
  // widens.
  const center = S.camX + S.viewW / 2;
  S.camLockY = null;
  const from = c.from ?? 1;
  const zoom = from + (c.zoom - from) * into;
  setZoom(zoom + (1 - zoom) * out);
  // Under reduced motion the framing is taken on the first frame and kept,
  // so the one thing that moves is the hole.
  const cx = sc.spot ? sc.spot() : c.spotX;
  if (reducedMotion()) c.heldX ??= cx;
  // Glided to, not cut to: setting the seat outright is a jump of a window or
  // more from wherever the player was looking.
  const want = c.heldX ?? cx;
  const at = reducedMotion() ? want : center + (want - center) * CUT_GLIDE;
  S.camX = at - S.viewW / 2;
  S.camTo = null;
  // The ground line low in the frame, the event above it: measured up from
  // the pit floor a close view is all pit. Walked back over the same stretch
  // as the zoom; dropping the difference in one frame is a hitch you feel.
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

// Over or skipped: owed nothing more, and on its way out. The camera is
// still this module's until the way out is walked.
function release() {
  S.cineOwed = null;
  S.cine.out = true;
  S.dirty = true;
}
