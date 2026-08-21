// Dust in the air: what comes off the rock, and how it gets to the ground.
//
// Nothing here knows what a worker is or what the shop sells. A chip is a shade,
// a place and a velocity, and it stops being one when it lands.

import { P, GRAV, CORE_SIZE } from './config.js';
import { S, floor, pit } from './state.js';
import { at, put, addGrain, surfaceY, colOf } from './grid.js';
import { blocked, overPitMouth, rockEdge } from './world.js';
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
export function spawnSpoil(px, py, shade) {
  const side = px < S.cx ? -1 : 1;                     // off the nearer side of the rock
  const land = rockEdge(side) + side * (P * 6 + Math.abs(bell()) * P * 12);
  const v = aim(px, py, land, P);
  spawnChip(px, py, v.vx, v.vy, shade, land);
}

// the one arc from here to there: the pop is sized to the distance, and the
// sideways speed follows from how long that pop keeps it in the air
export function aim(x, y, land, size) {
  const drop = Math.max(P, S.groundY - size - y);
  const pop = 2 + Math.min(4.5, Math.abs(land - x) / 90);
  const t = (pop + Math.sqrt(pop * pop + 2 * GRAV * drop)) / GRAV;
  return { vx: (land - x) / t, vy: -pop };
}

