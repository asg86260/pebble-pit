// REVIEW bodies-
// Gravity and the hand, in every place: the fall, the stars after a shaking,
// and the slow walk under a held right button. A leaf the yard's stages
// (crew/step.js, crew/falls.js) and the acts' engine (placebodies.js) both
// call, so it imports nothing of either.

import { GRAV, HURL_DRAG, WOBBLE, WOBBLE_BEAT, HOVER_SLOW } from '../config.js';
import { now } from '../clock.js';
import { sfx } from '../audio.js';

// --- the fall, in every place -------------------------------------------------
// One fall for every body in every place: the yard's crew and an act's own
// list alike (placebodies.js). The flick off the place's walls, gravity, the
// foot read after the x step, the thud and the stars are written here once;
// the place answers in its own frame (`ground`), since a yard body's x is its
// left edge and y its top, and an act body's x its middle and y its feet:
//
//   land(w)    its floor under the body, and its x range: { y, x0, x1 }
//   mid(w)     the body's middle, for the thud
//   down(w)    what a body that has come down forgets (the yard: its climber)
//   spill(w)   what a shaken body's hands held, put down where it stands
//   landed(w)  back to its work from there
//   sink(w)    true when the place took the falling body some other way
//
// `f` is the frame in sixtieths of a second, as the yard's speeds are written:
// the yard passes `frames()`, a place its seconds times sixty. The sink is the
// deep's water under the world, and only the yard has one: hell lies under
// the deep, so an "off the world sinks" rule shared by every place would
// drown every ghost let go.
export function fallIn(w, f, ground) {
  if (ground.sink?.(w)) return;
  // The foot is read after the x step, or a body thrown onto the rock stops
  // in the air where the rock was not. Speeds are pixels a frame, gravity
  // pixels a frame a frame, and the drag a proportion of what is left, so it
  // is raised to the frame count instead of multiplied by it.
  if (w.vx) {
    const at = ground.land(w);
    w.x += w.vx * f;
    w.vx *= HURL_DRAG ** f;
    if (w.x < at.x0) { w.x = at.x0; w.vx = -w.vx * 0.4; }
    if (w.x > at.x1) { w.x = at.x1; w.vx = -w.vx * 0.4; }
    if (Math.abs(w.vx) < 0.05) w.vx = 0;
  }
  const foot = ground.land(w).y;
  w.vy = (w.vy || 0) + GRAV * f;
  w.y += w.vy * f;
  if (w.y < foot) return;
  w.y = foot;
  w.vy = 0;
  w.vx = 0;
  w.falling = false;
  sfx('body-land', { x: ground.mid(w) });
  ground.down?.(w);
  // and if it was shaken on the way up, it stands there seeing stars first
  if (w.dizzyFor) {
    w.dizzyUntil = now() + w.dizzyFor;
    w.say = { mark: 'dizzy', until: w.dizzyUntil };
    w.dizzyFor = 0;
    w.landedAt = w.x;                       // what it wobbles about
    ground.spill?.(w);
    // The hat is NOT put back on here: the body has to go and get it.
    return;                                 // it is in no state to be given a job
  }
  ground.landed(w);
}

// Seeing stars, in every place: rocking about where it landed until they
// clear. 1 while it rocks (the place stands it on its floor), 2 on the frame
// they clear (the place sends it back to work), 0 with no stars.
export function stars(w, t) {
  if (w.dizzyUntil && t < w.dizzyUntil) {
    w.x = w.landedAt + Math.sin(t / 1000 * WOBBLE_BEAT + (w.ph || 0)) * WOBBLE;
    return 1;
  }
  if (!w.dizzyUntil) return 0;
  w.dizzyUntil = 0;
  w.x = Math.round(w.landedAt);
  w.landedAt = null;
  return 2;
}

// A body under the cursor with the right button held walks slow, in every
// place: it moves on HOVER_SLOW of the frames, spread evenly (`slowOwed`),
// and stands through the rest. True on a frame it stands.
export function slowed(w, t) {
  if (!(w.slowUntil > t)) return false;
  w.slowOwed = (w.slowOwed || 0) + HOVER_SLOW;
  if (w.slowOwed >= 1) { w.slowOwed -= 1; return false; }
  return true;
}
