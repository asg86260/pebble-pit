import { S } from '../state.js';
import { haulCap, haulSpeed } from '../upgrades.js';
import { HAUL_CARRY_COST, HAUL_PACE_COST } from '../config.js';
import { tierRows, named } from './tiers.js';

// The bench's crew rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
//
// Two ladders in bands (CLAUDE.md, "Decided"): what a hauler carries, and how
// fast it walks. Each was two -- load then a harness, pace then boots -- and
// two rows over one number read as the same thing for sale twice. One ladder
// each now, to the top the pair reached; what a load is at each rung is
// HAUL_LOAD in config/rungs.js.
const CARRY = tierRows({
  field: 'haulCarryLevel',
  unit: 'px', does: 'carry',
  value: lvl => haulCap(lvl),
  first: HAUL_CARRY_COST,
  site: 'bench',
  show: () => S.crew > 0,
  bands: named('haulcarry', 'hauler carry')
});

const PACE = tierRows({
  field: 'haulPaceLevel',
  unit: 'px/s', pct: true, does: 'walk',
  value: lvl => haulSpeed(lvl) * 60,
  first: HAUL_PACE_COST,
  site: 'bench',
  show: () => S.crew > 0,
  bands: named('haulpace', 'hauler speed')
});

export const CREW_ROWS = [...CARRY, ...PACE];
