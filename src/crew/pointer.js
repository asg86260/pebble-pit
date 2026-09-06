// The pointer: picking a body up off the yard, shaking it, and putting it down.
// Extracted verbatim from crew.js; behavior unchanged. Owns workerAt (the
// hit-test), lifted, lift, drop, and the shake (shedLoad, flingHat, shakeHeld).
// It leans on one spine helper, unbook, imported from crew.js; input.js, hooks.js
// and report.js reach workerAt/lift/lifted/drop/shakeHeld through crew.js's
// re-export. stepHat, landing and fall stay in the spine (the STAGES call them).

import { now } from '../clock.js';
import { DIZZY_MS, HOVER_PAUSE_MS, HURL, HURL_MAX, P, SHAKE_FLING, SHAKE_LIFT, SHAKE_SCATTER, SHAKE_SHED, SHAKE_TURNS, SHAKE_WINDOW, WORKER } from '../config.js';
import { bell, spawnChip } from '../dust.js';
import { throwVel } from '../hands.js';
import { indoors } from '../lab.js';
import { underground } from '../quarry.js';
import { inHouse } from '../scrubhouse.js';
import { S } from '../state.js';
import { unbook } from '../crew.js';

// --- picking somebody up ------------------------------------------------------
// You can pick a body up and put it down somewhere else, and that is all it
// does: it does not put them on a job, it does not take them off one, it moves
// them. Whoever you drop walks back to whatever they were doing from wherever
// you left them.
//
// So it is a toy, and it is meant to be. The one thing it is *for* is that
// these are people now -- they have names and ages and a record of what they
// have shifted -- and a yard full of people you can only address as a number on
// a roster is a yard that says so and does not mean it.

// The right button, held. The left one is the whole game -- swinging, sweeping,
// catching -- and a body is eighteen pixels moving about on top of the dust you
// are trying to sweep, so anything that competes for a left-press competes with
// the thing you do most. And a press-and-hold is no good either: they walk.
export function workerAt(x, y) {
  const pad = P * 1.5;
  for (let i = S.workers.length - 1; i >= 0; i--) {
    const w = S.workers[i];
    if (w.inside || indoors(w) || inHouse(w) || underground(w)) continue;
    if (x < w.x - pad || x > w.x + WORKER + pad) continue;
    if (y < w.y - pad || y > w.y + WORKER + pad) continue;
    return w;
  }
  return null;
}

export const lifted = () => S.workers.find(w => w.lifted) || null;

// wave7-crew: the cursor resting on a body holds it still, so its card is read
// off somebody standing. Called from input.js on every pointermove; the stamp
// is refreshed for as long as the cursor stays, so the pause outlives the hover
// by HOVER_PAUSE_MS and no more. A plain worker field, like `looUntil`: per
// frame hover state, dropped by `keepOf` on save the way every other clock is.
export function hoverAt(x, y) {
  const w = workerAt(x, y);
  if (w && !w.lifted) w.pauseUntil = now() + HOVER_PAUSE_MS;
  return w;
}

export function lift(w) {
  if (!w) return false;
  for (const o of S.workers) o.lifted = false;
  w.lifted = true;
  // An errand it was in the middle of is dropped, and the lever it was walking
  // to goes back into the pile of things wanting doing. Without this, picking up
  // the one body on its way to a lever would leave the ask claimed for ever by a
  // pair of hands that is now in yours: the dispatcher sees somebody already on
  // their way and stands everybody else down, and the machine never starts.
  //
  // The *ask* is not cancelled, only the walk. What you asked for is still what
  // you want, and somebody else can go.
  w.legs = null;
  w.leg = null;
  w.walking = false;
  // Picked out of the sky. Whatever it was hanging off is no longer its
  // business, and it is not aloft any more either -- it is in your hand, and
  // what happens when you let go is what happens to anything you let go of.
  w.aloft = false;
  w.cell = null;
  // whatever it was in the middle of, it is not any more: a body in the air has
  // claimed nothing and booked nothing
  if (w.claim >= 0) w.claim = -1;
  unbook(w);
  w.walking = false;
  w.legs = null;
  w.brk = null;
  w.say = null;
  S.dirty = true;
  return true;
}

// Let go of. It falls -- properly, under the same gravity everything else in
// this yard falls under, rather than being lowered on a wire -- and picks its
// job up again where it lands.
//
// Nothing is reassigned either way. If it came down on its own station it is
// already at work; if it came down anywhere else it walks back. A body dropped
// down the far end of the yard is a body with a walk ahead of it, which is the
// entire joke and the entire point.
// Thrown, not lowered. A body leaves your hand with whatever you were doing with
// your hand -- the same flick the dust is thrown with, off the same trail of
// cursor samples, so a hand that had stopped moving before it let go drops the
// body where it stands and a hand still travelling sends it.
//
// A share of the flick rather than all of it, and capped: a person is heavier
// than a grain, and a body flung the length of the yard is a body with a very
// long walk back. It is a toy, and a toy that punishes you for playing with it
// is not one.
export function drop(w) {
  if (!w) return;
  const v = throwVel();
  w.lifted = false;
  w.falling = true;
  w.vx = Math.max(-HURL_MAX, Math.min(HURL_MAX, v.vx * HURL));
  w.vy = Math.max(-HURL_MAX, Math.min(HURL_MAX, v.vy * HURL));
  // Shaken about rather than thrown: it lands not knowing which way is up. The
  // count is taken while it is in your hand -- see `shakeHeld` -- and spent
  // here, so one shaking is one dizzy spell however long you keep hold of it.
  if (w.shook >= SHAKE_TURNS) {
    w.dizzyFor = DIZZY_MS;
    // Shaken hard enough and it lets go of everything.
    //
    // What it was carrying goes on the ground where it lands rather than into
    // the pit -- it was never banked, and a load that survives being turned
    // upside down is a load nobody would believe in. The hat comes off with it,
    // and lands where the body lands: it is a thing on a head, not a property of
    // the body, and this is the one moment in the game that makes that visible.
    // Whatever is still in its hands when you let go -- most of it has already
    // been shaken out by now, see `shakeHeld`; this is the remainder.
    w.spill = w.carry || 0;
    w.carry = 0;
    // and the shades of it go with the count. `load` says what colour each
    // grain in a pair of hands is, so it is not a separate thing that happens
    // to be near the count -- it is the count, written out. Left standing here
    // it was a body holding nothing and still naming a shade for it, which is
    // the one shape of untidiness that eventually gets read.
    w.load = [];
    // The hat usually left the head mid-shake -- see `shakeHeld` -- but a
    // shaking finished in the very gesture of letting go still costs it, flung
    // from where the hand is the same way.
    if (w.trained) flingHat(w, v.vx * 4);
  }
  w.shook = 0;
  w.turnedAt = 0;
  w.lastDir = 0;
  S.dirty = true;
}

// --- shaking somebody ---------------------------------------------------------
// Waggling a held body back and forth is a different act from throwing it, and
// the difference is direction changes rather than speed: a throw goes one way,
// a shaking goes both. So the changes are counted, and they lapse -- four of
// them inside three-quarters of a second is a shaking, four spread over a minute
// of carrying somebody about is just carrying somebody about.
// What comes out of somebody being shaken, and where it goes.
//
// It used to be laid straight into the floor grid at the body's own column: the
// grains simply appeared on the ground, fully settled, however high up you were
// holding the body and however hard you were waving it. Which is not a load
// coming out of somebody's arms, it is a heap being drawn under them -- and the
// game already had the thing this wanted. Everything else loose in this yard is
// a chip: a shade with a place and a velocity, falling under the same gravity,
// landing where it meets the ground. A rockhand's spoil is one, a hauler's tip is
// one, the load a stood-down body drops is one.
//
// So this is one too. Each grain leaves the hands where the hands actually are,
// carrying a share of the hand's own travel plus a scatter, and falls from
// there. Shake somebody high over the yard and their load rains down from up
// there; shake them hard and it goes further; shake them gently and it drops
// round their feet. Nothing about that had to be written -- it is what falling
// already does.
function shedLoad(w, dx) {
  const out = Math.min(w.carry, SHAKE_SHED);
  for (let i = 0; i < out; i++) {
    // Off the top of the load, which is what is nearest the top of the pile in
    // its arms -- so a grain that comes out is drawn as the thing it is, the
    // same as it is drawn on the way in.
    const shade = w.load?.length ? w.load.pop() : 1;
    spawnChip(w.x + WORKER / 2, w.y + WORKER / 2,
              dx * SHAKE_FLING + bell() * SHAKE_SCATTER,
              -SHAKE_LIFT + bell() * 0.4, shade);
  }
  w.carry -= out;
  S.dirty = true;
}

// The hat leaves the head as a thing in flight: a share of the hand's travel,
// a kick upward, and gravity from there. It is not a chip -- a chip is a grain
// and banks itself; a hat has a kind and an owner walking back for it -- so it
// keeps its own little arc on `w.hatOff` and `stepHat` flies it down to the
// surface, rock outline included, where it lies until the body comes round.
function flingHat(w, dx) {
  if (w.hatOff) return;                     // one head, one hat, one arc
  // `of` is the whole identity -- which station's kit this is -- and the mark
  // to draw is derived from it, the way it is everywhere else. `kind` used to
  // store `w.trained`, which has been a boolean since the kit table: every
  // dropped thing drew as the helmet fallback, and a knocked-off CART lying on
  // the ground as a little hat was the visible half of that.
  w.hatOff = { of: w.kitOf, rest: false,
               x: w.x, y: w.y - P,
               vx: Math.max(-HURL_MAX, Math.min(HURL_MAX, dx * SHAKE_FLING * 2 + bell())),
               vy: -SHAKE_LIFT * 1.4 + bell() * 0.4 };
  w.trained = false;
  S.dirty = true;
}
export function shakeHeld(w, dx) {
  if (!w || Math.abs(dx) < 1) return;
  const dir = Math.sign(dx);
  const t = now();
  if (t - (w.turnedAt || 0) > SHAKE_WINDOW) w.shook = 0;   // lapsed: start again
  if (w.lastDir && dir !== w.lastDir) {
    w.shook = (w.shook || 0) + 1;
    w.turnedAt = t;
    // Stars while you are still shaking it, not only once it lands. The whole
    // gesture is something you do and watch, so the yard should answer during
    // it: the moment it has been turned about enough to count, it starts seeing
    // them, and `drop` carries the same spell on past the landing.
    if (w.shook >= SHAKE_TURNS) {
      w.say = { mark: 'dizzy', until: t + DIZZY_MS };
      // And the hat comes off NOW, not when the body lands -- flung from the
      // hand with the same motion the shed grains take, falling under the same
      // gravity, resting where it comes down. It used to appear on the ground
      // wherever the body happened to land, which is the same teleport the
      // shaken-out dust used to make; a hat is a thing in the air like any
      // other, and you should see it go.
      if (w.trained) flingHat(w, dx);
    }
    // Nothing comes loose until the shaking is half established. Grains used to
    // fly from the very first change of direction, so an ordinary jostle while
    // carrying somebody about already cost them dust; now the first few turns
    // are just a body being waved, and only a shaking that is clearly becoming
    // one starts to shed. Half of SHAKE_TURNS, derived, so tuning the knob
    // moves both thresholds together.
    if (w.carry > 0 && w.shook > SHAKE_TURNS / 2) shedLoad(w, dx);
  }
  w.lastDir = dir;
}
