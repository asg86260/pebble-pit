// Hats and falls: the two things gravity does to a body and to what it was
// wearing. Neither of them negotiates with the day's work, which is why both sit
// at the top of the stage list.

import { WORKER, GRAV, HURL_DRAG } from '../config.js';
import { S, floor, pit } from '../state.js';
import { addGrain } from '../grid.js';
import { yardLeft, atStation, blocked } from '../world.js';
import { standTop, rockTop, ways, footing, solidNear, SOLID } from '../route.js';
import { restOnRock } from '../rock.js';
import { JOB_OF } from '../upgrades.js';
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
    // It rests where somebody can STAND to pick it up. A cart flung over the
    // mouth of the hole would otherwise lie on the opening's own line -- fresh
    // air with a surface reading -- and its owner would walk to the lip and
    // push against the clamp for the rest of the run. The same slide the mess
    // makes off loose ground: to the nearest solid footing, and only then down.
    if (footing(h.x) !== SOLID) {
      const at = solidNear(h.x, 200);
      if (at != null) { h.x = at; h.y = standTop(h.x, rockTop); }
    }
    h.y = Math.min(h.y, standTop(h.x, rockTop));
    h.x = Math.round(h.x);
    h.rest = true;
  }
  S.dirty = true;
}


// Where a dropped body comes to rest: the highest thing under it, hill included.
//
// Falling is physics and not routing, so this is the one place that still asks
// about the world by x alone -- a body in the air is not on any way, and what
// stops it is whatever it hits. Throw somebody at the hill and they land on the
// hill; throw them past it and they land on the ground.
//
// Landing on the hill is then a body standing on the hill, because `wayAt` asks
// how high the feet are and gets its answer from where the fall put them. So the
// next errand routes down a flank and walks off, rather than the body being
// dropped back to the ground line the moment it is given something to do.
// ...on the hill or the ground as it always did -- except over the mouth of
// the hole, where the floor is the pile. `rockTop` knows nothing of the hole,
// so a body falling over the mouth landed at the ground line: inside the pile
// when the pile stood proud of it, in mid-air over the mouth when it did not.
// Landed inside the pile, it read as standing on the yard, and its next route
// to the patch ten pixels away went back across the yard and up the near
// ladder -- the reported lap out along the pile, down to "ground level", back
// to the yard and out again.
//
// Deliberately NOT the general "whatever way is over this spot": that was
// tried, and a kitted gang mining deep notches fell through them to the ground
// line instead of landing on the neighbouring rock the way `standTop` has
// always caught them, and the rock's own throughput dropped by a quarter. The
// hill keeps its old landing to the pixel; only the mouth changes.
const landing = w => {
  const mid = w.x + WORKER / 2;
  const h = ways().hole;
  if (h && mid > h.from && mid < h.to) return standTop(w.x, h.at) - WORKER;
  return standTop(w.x, rockTop) - WORKER;
};

// one frame of that fall, and what happens when it stops
export function fall(w) {
  // It travels while it falls now, and the ground it is going to land on is
  // whatever is under it *there* -- so the foot is read after the step, not
  // before it, or a body thrown onto the rock would stop in the air where the
  // rock was not.
  // Falling, in frames rather than in frames' worth of arithmetic. Speeds are
  // pixels a frame and gravity is pixels a frame a frame, so both are stepped by
  // however long this frame was; the drag is a proportion of what is left, so it
  // is raised to that power instead. At sixty all three come out exactly as they
  // were written.
  const f = frames();
  if (w.vx) {
    w.x += w.vx * f;
    w.vx *= HURL_DRAG ** f;
    // The yard has ends. A body thrown at one bumps off it rather than sailing
    // out of the world and walking back in from nowhere.
    const lo = yardLeft(), hi = pit.x + pit.w - WORKER;
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
    // Whatever it was carrying, on the ground under it.
    // Shaken loose, and it lands where the body is standing -- which, for a
    // rockhand, is on top of the hill. The rock is a surface now, so what a shaken
    // body drops there stays there instead of walking eighty columns out from
    // under the footprint to find ground that would take it.
    if (w.spill) {
      for (let i = 0; i < w.spill; i++) {
        const x = w.x + WORKER / 2;
        if (!restOnRock(x, 1)) addGrain(floor, x, blocked);
      }
      w.spill = 0;
    }
    // And its hat where it fell, to be picked up when the stars clear. It is
    // NOT put back on here: the body has to go and get it, the same as it has
    // to walk everywhere else.
    S.dirty = true;                         // the hat is on its own arc already
    return;                                 // it is in no state to be given a job
  }
  // Straight back to it if this is where it works, and a walk if it is not --
  // unless it fell in the middle of a shovelling errand, in which case the
  // errand is still its and it picks the trip up from where it came down.
  //
  // Falls are routine now, not catastrophes: a full pit's pile undulates, and a
  // body crossing it steps off a two-cell dip and lands a body's height lower
  // on the same pile. Re-tasking on every landing sent that body home across
  // half the world, its claim still held so nobody else could take the patch,
  // and its errand marched it straight back to the same dip -- a lap of the
  // yard per fall, for ever, which from outside is "the whole crew is stuck".
  // The mess stage steers a body with a claim on every frame, so all a landing
  // has to do is drop the stale route and let it.
  if (atStation(JOB_OF[w.type], w.x + WORKER / 2)) settle(w);
  else if (w.goal === 'muck' && w.muckAt != null) w.route = null;
  else retask(w, w.type);
}
