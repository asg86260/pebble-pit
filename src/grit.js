// Grit: what comes off a thing being hit. Not smoke: a wisp swells, drifts and
// hangs about, and a hammer on a joist does the opposite, so given the smoke
// system a site read as on fire. Grit is thrown rather than released: an
// outward-and-up velocity, gravity from the first frame, one cell the whole
// way (a growing chip is a cloud), and a life short enough that a burst has
// cleared before the next hit. A leaf for the same reason `puff` is.

import { P, GRIT_RISE, GRIT_SPREAD, GRIT_GRAV, GRIT_LIFE, GRIT_MOTES } from './config.js';
import { S } from './state.js';
import { rand } from './rng.js';

// One strike's worth. `n` is what one hit throws up, since this fires once a
// hammer blow rather than on a timer.
export function spawnGrit(x, y, o = {}) {
  const n = o.n || GRIT_MOTES;
  for (let i = 0; i < n; i++) {
    // The sign comes off the loop rather than `rand`, so a burst is always
    // spread across the blow instead of occasionally all on one side.
    const dir = i % 2 ? 1 : -1;
    S.grit.push({
      x: x + dir * rand() * P * 0.5,
      y: y + (rand() - 0.5) * P * 0.5,
      // Out and up, the sideways throw the bigger: a chip that mostly goes up
      // is a spark. A caller may throw softer: the works shedding a haze wants
      // the same grains at a fraction of the throw, not a second particle
      // system.
      vx: dir * (o.spread ?? GRIT_SPREAD) * (0.5 + rand()),
      vy: -(o.rise ?? GRIT_RISE) * (0.6 + rand() * 0.8),
      t: 0,
      life: (o.life || GRIT_LIFE) * (0.7 + rand() * 0.6)
    });
  }
}

// Thrown, then let go of: gravity and nothing else. No drift term; wind on a
// chip that lasts a third of a second is arithmetic nobody can see.
//
// `dt` arrives in MILLISECONDS like every other stepper. Taken for seconds a
// chip ages a thousand times too fast and the whole burst spawns and expires
// inside one frame, so the list reads empty and the dust is invisible with
// nothing wrong about where it was thrown.
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
    // A chip stops at the floor: it is thrown from about hammer height, so
    // without this the burst is under the ground line within a few frames.
    if (g.y >= S.groundY) S.grit.splice(i, 1);
  }
}
