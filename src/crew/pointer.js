// The pointer: picking a body up off the yard, shaking it, and putting it down.
// It moves them and nothing more: whoever you drop walks back to whatever they
// were doing from wherever you left them.

import { now } from '../clock.js';
import { TOUCH_TARGET, DIZZY_MS, HOVER_SLOW_MS, HURL, HURL_MAX, P, SHAKE_FLING, SHAKE_LIFT, SHAKE_SCATTER, SHAKE_SHED, SHAKE_TURNS, SHAKE_WINDOW, WORKER } from '../config.js';
import { bell, spawnChip } from '../dust.js';
import { throwVel } from '../hands.js';
import { underground } from '../quarry.js';
import { S } from '../state.js';
import { unbook } from '../crew.js';
import { assignDrop } from './assign.js';
import { load } from './hole.js';
import { earn } from '../notices.js';
import { crewView, coarse } from '../prefs.js';
import { inOrb, breakOrb, orbLiftOf } from '../deep/phases.js';
import { PLACES, actPlace, isActView, crewHolding } from '../acts.js';
import { bodyAt, liftBody, dropBody } from '../placebodies.js';

// --- picking somebody up ------------------------------------------------------
export function workerAt(x, y) {
  // A crew the corner's switch has taken out of the picture cannot be put a
  // pointer on either: the click is for the building they were standing in
  // front of, which is why the player hid them.
  if (crewView() === 'hide') return null;
  // On a thumb a cell is small, so the body's reach is the least a finger can
  // land on, whatever the zoom.
  const pad = handPad();
  for (let i = S.workers.length - 1; i >= 0; i--) {
    const w = S.workers[i];
    if (w.inside || underground(w)) continue;
    // where it is drawn: a fighter the constrict's orb holds up, or is
    // letting down, hangs over its spot
    const wy = w.y - orbLiftOf(w) * P;
    if (x < w.x - pad || x > w.x + WORKER + pad) continue;
    if (y < wy - pad || y > wy + WORKER + pad) continue;
    return w;
  }
  return null;
}

export const lifted = () => S.workers.find(w => w.lifted) || null;

// --- the hand in every place ----------------------------------------------------
// The acts' places keep their bodies in their own lists (placebodies.js), and
// the hand takes them up the same way: the body under the pointer in the
// place the camera is in, the one in the hand wherever it is from, and the
// held body put where the cursor is by its own place's way of standing.
// The retraining stays the yard's (`workerAt`, `lifted`): an act's member
// has no station to be dropped on. Its hover says its job (input.js).
const handPad = () => Math.max(P * 1.5, coarse() ? (TOUCH_TARGET / S.zoomShow - WORKER) / 2 : 0);
export function grabAt(x, y) {
  if (!isActView(S.view)) return workerAt(x, y);
  if (crewView() === 'hide') return null;
  return bodyAt(actPlace(S.view).crew, x, y, handPad());
}
export function inHand() {
  const w = lifted();
  if (w) return w;
  for (const pl of Object.values(PLACES)) { const b = pl.crew.list()?.find(o => o.lifted); if (b) return b; }
  return null;
}
export function holdBody(w, x, y) {
  const crew = crewHolding(w);
  if (crew) { crew.hold(w, x, y); return; }
  w.x = x - WORKER / 2;
  w.y = y - WORKER / 2;
}

// With the right button held (`S.crewSight`), the body under the cursor walks
// slow, so it can be caught. The stamp is refreshed on every pointermove, so
// the slow outlives the hover by HOVER_SLOW_MS and no more.
export function hoverAt(x, y) {
  const w = workerAt(x, y);
  if (w && !w.lifted && S.crewSight != null) w.slowUntil = now() + HOVER_SLOW_MS;
  return w;
}

export function lift(w) {
  if (!w) return false;
  const crew = crewHolding(w);
  if (crew) {
    for (const o of S.workers) o.lifted = false;
    for (const pl of Object.values(PLACES)) for (const o of pl.crew.list() || []) o.lifted = false;
    liftBody(crew, w);
    earn('lifted');
    return true;
  }
  // Lifted out of the constrict's orb: free at once, and the orb bursts. The
  // body is taken where it is drawn, and the hand, not the sink, brings it
  // down.
  const up = orbLiftOf(w);
  if (inOrb(w)) breakOrb();
  if (S.orbBurst && S.orbBurst.st === w.station) S.orbBurst.from = 0;
  w.y -= up * P;
  for (const o of S.workers) o.lifted = false;
  w.lifted = true;
  earn('lifted');
  // Read now: a load shaken all the way out is only the feat if there was a
  // whole load to shake.
  w.liftedFull = w.carry > 0 && w.carry >= load(w);
  // The walk is dropped, not the ask: a lever left claimed by a pair of hands
  // now in yours stands everybody else down and the machine never starts.
  w.legs = null;
  w.leg = null;
  w.walking = false;
  // Picked out of the sky: whatever it was hanging off is no longer its
  // business.
  w.aloft = false;
  w.cell = null;
  // a body in the air has claimed nothing and booked nothing
  if (w.claim >= 0) w.claim = -1;
  unbook(w);
  w.walking = false;
  w.legs = null;
  w.brk = null;
  w.say = null;
  return true;
}

// Let go of: it falls under the same gravity as everything else, thrown with
// the same flick the dust is thrown with, and picks its job up again where it
// lands. A share of the flick, capped: a body flung the length of the yard has
// a very long walk back.
export function drop(w) {
  if (!w) return;
  const v = throwVel();
  if (crewHolding(w)) { dropBody(w, v); return; }
  w.lifted = false;
  w.falling = true;
  // A drop onto a station with room is a retraining, not a throw: no hurl, so
  // it comes down where you put it. Anywhere else falls through to the throw.
  if (assignDrop(w)) {
    w.vx = 0;
    w.vy = 0;
  } else {
    w.vx = Math.max(-HURL_MAX, Math.min(HURL_MAX, v.vx * HURL));
    w.vy = Math.max(-HURL_MAX, Math.min(HURL_MAX, v.vy * HURL));
  }
  // The shake count is taken in the hand (`shakeHeld`) and spent here, so one
  // shaking is one dizzy spell however long you keep hold of it.
  if (w.shook >= SHAKE_TURNS) {
    w.dizzyFor = DIZZY_MS;
    earn('dizzy');
    // Whatever is still in its hands (most of it was shaken out already) goes
    // on the ground where it lands, never into the pit: it was never banked.
    w.spill = w.carry || 0;
    w.carry = 0;
    // `load` is the count written out in shades, and goes with it.
    w.load = [];
    // A shaking finished in the very gesture of letting go still costs the hat.
    if (w.trained) flingHat(w, v.vx * 4);
  }
  w.shook = 0;
  w.turnedAt = 0;
  w.lastDir = 0;
}

// --- shaking somebody ---------------------------------------------------------
// A shaking is direction changes, not speed: a throw goes one way, a shaking
// goes both. The changes are counted and they lapse, so four inside the
// window is a shaking and four spread over a minute of carrying is not.

// What comes out of somebody being shaken: chips, leaving the hands where the
// hands actually are with a share of their travel, and falling from there.
function shedLoad(w, dx) {
  const out = Math.min(w.carry, SHAKE_SHED);
  for (let i = 0; i < out; i++) {
    // Off the top of the load, so a grain that comes out is drawn as the thing
    // it is.
    const shade = w.load?.length ? w.load.pop() : 1;
    spawnChip(w.x + WORKER / 2, w.y + WORKER / 2,
              dx * SHAKE_FLING + bell() * SHAKE_SCATTER,
              -SHAKE_LIFT + bell() * 0.4, shade);
  }
  w.carry -= out;
  if (w.liftedFull && w.carry <= 0) earn('shookload');
}

// The hat leaves the head as a thing in flight. Not a chip (a chip banks
// itself; a hat has a kind and an owner walking back for it), so it keeps its
// own arc on `w.hatOff` and `stepHat` flies it down to the surface.
function flingHat(w, dx) {
  if (w.hatOff) return;                     // one head, one hat, one arc
  // `of` is the whole identity, which station's kit this is; the mark to draw
  // is derived from it.
  // The engine is bolted to the cart, so a forklift comes off in one piece.
  w.hatOff = { of: w.kitOf, rest: false,
               x: w.x, y: w.y - P,
               vx: Math.max(-HURL_MAX, Math.min(HURL_MAX, dx * SHAKE_FLING * 2 + bell())),
               vy: -SHAKE_LIFT * 1.4 + bell() * 0.4 };
  w.trained = false;
  earn('hatoff');
}
export function shakeHeld(w, dx) {
  if (!w || Math.abs(dx) < 1) return;
  // An act's body wears no hat and sheds nothing in the air: its turns are
  // counted, and its place's engine spends them on the drop (placebodies.js).
  const act = !!crewHolding(w);
  const dir = Math.sign(dx);
  const t = now();
  if (t - (w.turnedAt || 0) > SHAKE_WINDOW) w.shook = 0;   // lapsed: start again
  if (w.lastDir && dir !== w.lastDir) {
    w.shook = (w.shook || 0) + 1;
    w.turnedAt = t;
    if (act) { w.lastDir = dir; return; }
    // Stars while you are still shaking it; `drop` carries the same spell on
    // past the landing.
    if (w.shook >= SHAKE_TURNS) {
      w.say = { mark: 'dizzy', until: t + DIZZY_MS };
      // The hat comes off NOW, in the air, not on the ground when the body
      // lands.
      if (w.trained) flingHat(w, dx);
    }
    // Nothing comes loose until the shaking is half established, or an
    // ordinary jostle costs dust. Half of SHAKE_TURNS, so the knob moves both.
    if (w.carry > 0 && w.shook > SHAKE_TURNS / 2) shedLoad(w, dx);
  }
  w.lastDir = dir;
}
