// Dust in the air: what comes off the rock, and how it gets to the ground.
//
// Nothing here knows what a worker is or what the shop sells. A chip is a shade,
// a place and a velocity, and it stops being one when it lands.

import { P, GRAV, SPOIL_POP, SPOIL_SPIN, SPOIL_SIDE } from './config.js';
import { S, floor, pit } from './state.js';

// roughly normal, in about -1.5..1.5, most of it near nothing
export const bell = () => Math.random() + Math.random() + Math.random() - 1.5;

// `land` is where an aimed chip is meant to come down. A chip without one comes
// down wherever it meets the ground, which is what a swept or spilled grain does.
export function spawnChip(x, y, vx, vy, shade = 1, land = null) {
  S.chips.push({ x, y, vx, vy, s: shade, land });
}

// Rock knocked loose is knocked loose, and that is the whole of it.
//
// It used to be *aimed*. Every grain picked a spot inside the strip of ground
// that belongs to whatever it came off, and was launched on the one arc that
// got there -- so the pile was not somewhere dust happened to end up, it was a
// destination the game chose for each grain before it had left the face. Which
// is a delivery service run by the rock, and it is why the yard tidied itself:
// nothing ever landed anywhere awkward, because nothing was ever allowed to.
//
// Now a grain gets a pop off the face and a little sideways from the blow, and
// where it comes down is wherever the ground is under it when it gets there. The
// heaps that build up are heaps that built up.
//
// Nothing is lost to it. The ground already refuses the three places that are
// not ground -- under the rock, over the mouth of the cut, over the mouth of the
// hole -- and a grain that comes down on one of those is banked rather than
// stranded. See `blocked` in world.js.
export function spawnSpoil(px, py, shade) {
  const pop = SPOIL_POP * (1 + bell() * SPOIL_SPIN);
  spawnChip(px, py, bell() * SPOIL_SIDE, -Math.max(0.5, pop), shade);
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

