// Dust in the air: what comes off the rock, and how it gets to the ground.
//
// Nothing here knows what a worker is or what the shop sells. A chip is a shade,
// a place and a velocity, and it stops being one when it lands.

import { P, GRAV, CORE_SIZE } from './config.js';
import { S, floor, pit } from './state.js';
import { at, put, addGrain, surfaceY, colOf } from './grid.js';
import { blocked, overPitMouth, rockEdge, pileOf } from './world.js';
import { bankDust } from './pit.js';

// roughly normal, in about -1.5..1.5, most of it near nothing
export const bell = () => Math.random() + Math.random() + Math.random() - 1.5;

// `land` is where an aimed chip is meant to come down. A chip without one comes
// down wherever it meets the ground, which is what a swept or spilled grain does.
export function spawnChip(x, y, vx, vy, shade = 1, land = null) {
  S.chips.push({ x, y, vx, vy, s: shade, land });
}

// Rock knocked loose is *aimed*. A chip goes off whichever side of the rock it
// was struck from, to a spot on the ground clear of the foot, and is launched on
// the one arc that gets there: the pop is sized to the distance, and the
// sideways speed follows from how long that pop keeps it in the air. Nothing is
// nudged mid-flight and nothing has to be shoved off the rock, so the spray
// reads as a throw rather than a scatter. Where it lands it heaps up on its own,
// to whatever height the sand finds -- there is no ceiling on a bank.
// Everything comes off the rock to the *right*, into the strip of ground that
// belongs to it. Two banks either side meant half the spoil landed on the far
// side of the hill from everything else and somebody had to walk round it; one
// pile, on the side the pit is on, is the whole yard flowing one way.
export function spawnSpoil(px, py, shade, key = 'rock') {
  const p = pileOf(key);
  const near = p ? p.from : rockEdge(1);
  const far = p ? Math.max(near + P, p.to - P * 2) : near + P * 24;
  const land = Math.min(far, near + P * 2 + Math.abs(bell()) * (far - near) * 0.45);
  const v = aim(px, py, land, P);
  spawnChip(px, py, v.vx, v.vy, shade, land);
}

// The one arc from here to there: the pop is sized to the distance, and the
// sideways speed follows from how long that pop keeps it in the air.
//
// It also works from *below* where it is going, which is what the quarry needs:
// thrown off the floor of an open cut, the pop has to lift it over the rim
// before any of the rest applies. That is one number, not another throw.
export function aim(x, y, land, size) {
  const target = S.groundY - size;                     // the line it comes down to
  const climb = Math.max(0, y - target);               // how far up before any of that
  const pop = Math.max(2 + Math.min(4.5, Math.abs(land - x) / 90),
                       Math.sqrt(2 * GRAV * (climb + P * 8)));
  const t = (pop + Math.sqrt(Math.max(0, pop * pop + 2 * GRAV * (target - y)))) / GRAV;
  return { vx: (land - x) / t, vy: -pop };
}

