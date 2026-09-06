// The shock a crit leaves behind: one ring and a scatter of specks.
//
// A crit is already the loudest thing a body does -- it throws its spoil up as a
// fountain instead of tossing it on the heap (see `critToss` in dust.js) -- and
// that part of it is *real*: those are the grains the work turned up, and they
// land and bank like any other dust. What was missing was the blow. A taller
// throw reads as a taller throw; it does not read as something hitting hard.
//
// So a crit also lets go of a shockwave and a handful of specks. **Neither is
// dust and neither is counted.** This yard's oldest rule is that one grain is one
// dust and the pile is the dust, so anything drawn for effect has to be plainly
// not a grain: the ring is an outline nothing else in the game has, and the
// specks fly out, slow, and wink out in half a second without ever landing.
//
// It lives on its own for the same reason `grit.js` and `puff.js` do: it needs a
// list and one length, and every other home for it is a module half the yard
// already imports.
//
// It is not grit, and the difference is why this is not a fourth caller of
// `spawnGrit`. Grit is chips off a hammer: it has gravity on it and it dies the
// moment it reaches the ground line. A crit happens down the cut and on the farm
// as well as at the rock, and a quarrier stands well below the ground line -- so
// every speck of a crit down there would have been culled on the frame it was
// thrown. What a crit gives off is not debris falling; it is the blow itself
// going outward.

import { P, CRIT_RING_MS, CRIT_RING_R, CRIT_MOTES,
         CRIT_MOTE_LIFE, CRIT_MOTE_SPEED, CRIT_MOTE_DRAG } from './config.js';
import { S } from './state.js';
import { now } from './clock.js';
import { rand } from './rng.js';

// One crit landing. `power` is the crit's multiplier -- the size of what just
// happened -- and everything here is measured in it: a three-times blow throws a
// ring you notice and a six-times one throws a ring that crosses the yard.
//
// **One blow, one shock.** `critToss` is called once per grain the crit turned
// up -- three to six times for one hit, and at the rock from a different cell
// each time, because a swing takes a patch of cells and each one throws its own
// grain. So the guard cannot be "the same point": it is the same *frame* at the
// same *place of work*, which is exactly what one blow is. `where` is the pile
// key the grains are being thrown onto ('rock', 'quarry', 'farm'), which the
// caller already has and which no two stations share.
//
// Two bodies critting at one station inside a sixtieth of a second land one ring
// between them. That is a shape nobody can see the join in, and it is the right
// side to err on: a ring per grain was a stack of six rings drawn on top of each
// other, which is one thick ring that outstays every other.
export function shockAt(x, y, power = 3, where = '') {
  const at = now();
  const last = S.shocks[S.shocks.length - 1];
  if (last && last.at === at && last.where === where) return;
  S.shocks.push({ x, y, at, power, where, t: 0 });
  for (let i = 0; i < Math.round(CRIT_MOTES * power); i++) {
    // Out in every direction, on its own speed. Spread by the loop rather than
    // by chance, so a burst is always a ring of specks instead of occasionally
    // being a clump on one side.
    const a = (i + rand()) / Math.round(CRIT_MOTES * power) * Math.PI * 2;
    const v = CRIT_MOTE_SPEED * (0.6 + rand() * 0.8);
    S.shockMotes.push({
      x: x + Math.cos(a) * P, y: y + Math.sin(a) * P,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      t: 0, life: CRIT_MOTE_LIFE * (0.7 + rand() * 0.6)
    });
  }
  S.dirty = true;
}

// `dt` arrives in MILLISECONDS, the way every other stepper in this game is
// handed it. Taking it for seconds ages a ring a thousand times over inside one
// frame, which is the bug `stepGrit` carries a paragraph about.
const FRAME = 1000 / 60;    // what "per frame" means, for the thrown velocities

export function stepShocks(dt) {
  const secs = dt / 1000, frames = dt / FRAME;
  for (let i = S.shocks.length - 1; i >= 0; i--) {
    const s = S.shocks[i];
    s.t += secs;
    if (s.t * 1000 >= CRIT_RING_MS) S.shocks.splice(i, 1);
  }
  for (let i = S.shockMotes.length - 1; i >= 0; i--) {
    const m = S.shockMotes[i];
    m.t += secs;
    if (m.t > m.life) { S.shockMotes.splice(i, 1); continue; }
    m.x += m.vx * frames;
    m.y += m.vy * frames;
    // The blow spends itself: a speck leaves fast and is barely moving by the
    // time it goes, which is what makes the burst read as one push outward
    // rather than as a cloud drifting away.
    const drag = Math.pow(CRIT_MOTE_DRAG, frames);
    m.vx *= drag;
    m.vy *= drag;
  }
  if (S.shocks.length || S.shockMotes.length) S.dirty = true;
}

// How far through its run a ring is, nought to one -- what the drawing is a
// function of, and the only thing outside this file needs to know about one.
export const shockAge = s => Math.min(1, (s.t * 1000) / CRIT_RING_MS);

// And how far it has got, in world pixels: the reach is per point of the crit's
// multiplier, so the ring says how big the thing that happened was. Eased out
// hard -- most of the reach in the first third of the run -- because a blow
// spends itself at once; a ring that grows evenly reads as an announcement, not
// a slam.
export const shockReach = s => {
  const k = shockAge(s);
  return CRIT_RING_R * s.power * (1 - Math.pow(1 - k, 3));
};
