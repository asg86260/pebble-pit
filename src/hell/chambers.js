// The run of chambers and the heat (DESIGN.md, "Acts 3 and 4", act 4, "The
// place: a run of chambers down to the cage room" and "The pressure: the
// heat").
//
// The chambers are laid out in place.js; the deepest open is
// `S.hell.chamber`, moved on by a barrier's fall (barriers.js). What this
// file runs is hell's own clock and the flare: each open chamber's vent breaks
// out on its own clock, deeper oftener (FLARE_EVERY_S), warned FLARE_WARN_S
// ahead, and burns FLARE_BURN_S. The burst crusts the chamber's face and its
// barrier with slag that takes blows to clear, puts its furnace out (its fuel,
// its ore and its bars kept) and lays brimstone round the vent -- a setback
// that costs time and never takes ore, bars or tools away. Bodies at a
// burning chamber's face or barrier step back until it passes (bodies.js).
//
// Not built: the stair cut a flight a trip (`S.hell.flights` stands at 0),
// vent caps and furnace shielding, and whether the flares are Satan's (call 4).

import { S } from '../state.js';
import { HELL_TIERS, FLARE_EVERY_S, FLARE_FIRST_S, FLARE_WARN_S, FLARE_BURN_S, FLARE_CRUST,
         FLARE_BRIMSTONE, VENT_CRUST_MAX } from '../config.js';

// How many chambers the run has: the table's length, so call 4's choice of
// four or five is one row of config.
export const chamberCount = () => HELL_TIERS.length;
// The deepest chamber open, 0 the landing.
export const chamberReached = () => (S.hell ? S.hell.chamber : 0);

// Chamber i's flare, warned and burning, on hell's clock.
export const flareWarning = i => {
  const h = S.hell, f = h?.flares[i];
  return !!f && f.next > 0 && h.clock >= f.next - FLARE_WARN_S && h.clock < f.next;
};
export const flareBurning = i => { const h = S.hell, f = h?.flares[i]; return !!f && h.clock < f.until; };

function burst(i) {
  const h = S.hell;
  h.faces[i].crust += FLARE_CRUST;
  if (i < h.walls.length) h.walls[i].crust += FLARE_CRUST;
  const f = h.furnaces[i];
  f.lit = false;
  f.warm = 0;
  h.vents[i].crust = Math.min(VENT_CRUST_MAX + FLARE_BRIMSTONE, h.vents[i].crust + FLARE_BRIMSTONE);
  h.flareCount++;
}

// One frame of hell's clock and the flares.
export function stepChambers(c) {
  const h = S.hell;
  h.clock += c.dt / 1000;
  for (let i = 0; i <= h.chamber; i++) {
    const f = h.flares[i];
    // A chamber's first flare is set from the frame it is first stepped open.
    if (!f.next) { f.next = h.clock + FLARE_FIRST_S + i * 7; continue; }
    if (h.clock < f.next) continue;
    burst(i);
    f.until = h.clock + FLARE_BURN_S;
    f.next = h.clock + FLARE_EVERY_S[Math.min(i, FLARE_EVERY_S.length - 1)];
  }
}
