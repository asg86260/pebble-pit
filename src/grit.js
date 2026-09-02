// Grit: what comes off a thing being hit.
//
// This is not smoke, and the difference is the whole reason the file exists.
// Everything in `puff.js` is a wisp over a roof -- it swells, it drifts, it
// climbs, it hangs about for two and a half seconds -- because that is what
// smoke does. A hammer landing on a joist does the opposite: a few chips leave
// the strike fast, go where they were thrown, fall, and are gone before the
// next swing. Given the smoke system it read as a building site on fire.
//
// So grit is thrown rather than released: an outward-and-up velocity off the
// point of impact, gravity on it from the first frame, one cell the whole way
// (it never grows -- a growing chip is a cloud), and a life short enough that
// a burst has cleared before the next hit lands.
//
// It lives on its own for the same reason `puff` does: it needs the list and
// one length, and every other home for it is a module half the yard imports.

import { P, GRIT_RISE, GRIT_SPREAD, GRIT_GRAV, GRIT_LIFE, GRIT_MOTES } from './config.js';
import { S } from './state.js';
import { rand } from './rng.js';

// One strike's worth: a handful of chips off the point of impact.
//
// `n` is small on purpose. This fires once per hammer blow rather than on a
// timer, so the count here is what one hit throws up, not what a whole build
// site gives off in a second.
export function spawnGrit(x, y, o = {}) {
  const n = o.n || GRIT_MOTES;
  for (let i = 0; i < n; i++) {
    // Thrown out to both sides of the strike, not heaped on it. The sign comes
    // off the loop rather than off `rand`, so a burst is always spread across
    // the blow instead of occasionally landing every chip on one side.
    const dir = i % 2 ? 1 : -1;
    S.grit.push({
      x: x + dir * rand() * P * 0.5,
      y: y + (rand() - 0.5) * P * 0.5,
      // Out and up: the sideways throw is the bigger of the two, because a chip
      // that mostly goes up is a spark and this is not one.
      //
      // A caller may throw softer. Two things make dust at a building site and
      // they are not the same event: a hammer blow throws chips, and the works
      // themselves shed a haze off the ground for as long as they go on. The
      // second wants the same grains at a fraction of the throw, not a second
      // particle system that happens to look similar.
      vx: dir * (o.spread ?? GRIT_SPREAD) * (0.5 + rand()),
      vy: -(o.rise ?? GRIT_RISE) * (0.6 + rand() * 0.8),
      t: 0,
      life: (o.life || GRIT_LIFE) * (0.7 + rand() * 0.6)
    });
  }
}

// Thrown, then let go of: gravity and nothing else. No drift term -- wind on a
// chip that lasts a third of a second is arithmetic nobody can see.
//
// `dt` arrives in MILLISECONDS, the way every other stepper in this game is
// handed it (see `stepSmoke` in lab.js, which divides by a thousand for exactly
// this reason). Taking it for seconds ages a chip a thousand times too fast:
// every one of them spawned and expired inside a single frame, so the list read
// as empty on every frame anybody looked at it and the dust was invisible
// without a single thing being wrong with where it was thrown or how.
const FRAME = 1000 / 60;    // what "per frame" means, for the thrown velocities

export function stepGrit(dt) {
  const secs = dt / 1000;
  const frames = dt / FRAME;
  for (let i = S.grit.length - 1; i >= 0; i--) {
    const g = S.grit[i];
    g.t += secs;
    if (g.t > g.life) { S.grit.splice(i, 1); continue; }
    g.vy += GRIT_GRAV * secs;
    g.x += g.vx * frames;
    g.y += g.vy * frames;
    // A chip stops at the floor. It is thrown from about the height of a
    // hammer head, which is a hand's width off the ground, so without this the
    // whole burst is under the ground line within a few frames -- dust falling
    // through the yard rather than settling on it.
    if (g.y >= S.groundY) S.grit.splice(i, 1);
  }
}
