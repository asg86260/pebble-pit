// Hats and falls: the two things gravity does to a body and to what it was
// wearing. Neither of them negotiates with the day's work, which is why both sit
// at the top of the stage list.

import { WORKER, GRAV, HURL_DRAG } from '../config.js';
import { S, floor, pit } from '../state.js';
import { addGrain } from '../grid.js';
import { atStation, blocked } from '../world.js';
import { standTop, rockTop, ways, footing, solidNear, SOLID } from '../route.js';
import { restOnRock } from '../rock.js';
import { JOB_OF } from '../levels.js';
import { now, frames } from '../clock.js';
import { settle, retask } from './commute.js';

// One frame of a knocked-off hat falling. Runs whatever its owner is doing --
// a hat in the air does not wait for the body that lost it to be put down.
export function stepHat(w) {
  const h = w.hatOff;
  if (!h || h.rest) return;
  const f = frames();
  h.vy += GRAV * f;
  h.x += h.vx * f;
  h.y += h.vy * f;
  const floor = standTop(h.x, rockTop);     // the ground, or the hill's outline
  if (h.y >= floor) {
    // It rests where somebody can STAND to pick it up: a cart lying on the
    // hole's mouth has its owner pushing against the lip's clamp for the rest
    // of the run. The same slide the mess makes off loose ground.
    if (footing(h.x) !== SOLID) {
      const at = solidNear(h.x, 200);
      if (at != null) { h.x = at; h.y = standTop(h.x, rockTop); }
    }
    h.y = Math.min(h.y, standTop(h.x, rockTop));
    h.x = Math.round(h.x);
    h.rest = true;
  }
}


// Where a dropped body comes to rest: the highest thing under it, hill
// included. Falling is physics, not routing, so this is the one place that
// asks about the world by x alone; `wayAt` then reads the landing off the
// feet, so a body landed on the hill is on the hill.
//
// Over the mouth of the hole the floor is the pile, which `rockTop` knows
// nothing of. Deliberately NOT the general "whatever way is over this spot":
// a kitted gang mining deep notches fell through them to the ground line
// instead of landing on the neighboring rock the way `standTop` catches them.
const landing = w => {
  const mid = w.x + WORKER / 2;
  const h = ways().hole;
  if (h && mid > h.from && mid < h.to) return standTop(w.x, h.at) - WORKER;
  return standTop(w.x, rockTop) - WORKER;
};

// one frame of that fall, and what happens when it stops
export function fall(w) {
  // The foot is read after the x step, or a body thrown onto the rock stops
  // in the air where the rock was not. Speeds are pixels a frame, gravity
  // pixels a frame a frame, and the drag a proportion of what is left, so it
  // is raised to the frame count instead of multiplied by it.
  const f = frames();
  if (w.vx) {
    w.x += w.vx * f;
    w.vx *= HURL_DRAG ** f;
    // The ends are the WORLD's, not `yardLeft`: that is the first heap, and
    // the farm, the tower and the air filter all stand left of it.
    const lo = floor.x, hi = pit.x + pit.w - WORKER;
    if (w.x < lo) { w.x = lo; w.vx = -w.vx * 0.4; }
    if (w.x > hi) { w.x = hi; w.vx = -w.vx * 0.4; }
    if (Math.abs(w.vx) < 0.05) w.vx = 0;
  }
  const foot = landing(w);
  w.vy += GRAV * f;
  w.y += w.vy * f;
  if (w.y < foot) return;
  w.y = foot;
  w.vy = 0;
  w.vx = 0;
  w.falling = false;
  w.foot = w.footAt = null;        // it climbs to wherever it is standing now
  // and if it was shaken on the way up, it stands there seeing stars first
  if (w.dizzyFor) {
    w.dizzyUntil = now() + w.dizzyFor;
    w.say = { mark: 'dizzy', until: w.dizzyUntil };
    w.dizzyFor = 0;
    w.landedAt = w.x;                       // what it wobbles about
    // Whatever it was carrying lands where the body is standing, hill
    // included.
    if (w.spill) {
      for (let i = 0; i < w.spill; i++) {
        const x = w.x + WORKER / 2;
        if (!restOnRock(x, 1)) addGrain(floor, x, blocked);
      }
      w.spill = 0;
    }
    // The hat is NOT put back on here: the body has to go and get it.
    return;                                 // it is in no state to be given a job
  }
  // A body that lands mid-commute keeps its legs and only re-routes from where
  // it is now: a hand-assignment (`assignDrop`) retasks the body in the air,
  // hat first, and settling it because it came down on the station threw the
  // hat leg away and stood it there bare-headed. A lift drops the walk, so a
  // thrown body never lands walking; only a drop onto a station does. A leg
  // is somewhere to go: `walking` alone is a flag a check can set.
  if (w.walking && w.walkTo != null) { w.route = null; return; }
  // Straight back to it if this is where it works, a walk if not -- unless it
  // fell mid-errand with a claim held, in which case only the stale route is
  // dropped and the mess stage steers it on. Re-tasking that body sends it
  // home across the world and straight back to the same dip, a lap a fall.
  if (atStation(JOB_OF[w.type], w.x + WORKER / 2)) settle(w);
  else if (w.goal === 'muck' && w.muckAt != null) w.route = null;
  else retask(w, w.type);
}
