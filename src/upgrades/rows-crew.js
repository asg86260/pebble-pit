import { S } from '../state.js';
import { haulCap, haulSpeed } from '../upgrades.js';
import { HAUL_CARRY_COST, HAUL_PACE_COST } from '../config.js';
import { tierRows } from './tiers.js';

// The bench's crew rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
//
// Two ladders in bands (CLAUDE.md, "Decided"): what a hauler carries, and how
// fast it walks. Each was two -- load then a harness, pace then boots -- and
// two rows over one number read as the same thing for sale twice. One ladder
// each now, to the top the pair reached; see HAUL_CARRY_STEP in config.
const CARRY = tierRows({
  field: 'haulCarryLevel',
  unit: 'px', does: 'carry',
  value: lvl => haulCap(lvl),
  first: HAUL_CARRY_COST,
  site: 'bench',
  show: () => S.crew > 0,
  bands: [
    { key: 'haulcarry',  name: 'hauler carry' },
    { key: 'haulcarry2', name: 'hauler carry II' },
    { key: 'haulcarry3', name: 'hauler carry III' }
  ]
});

const PACE = tierRows({
  field: 'haulPaceLevel',
  unit: 'px/s', pct: true, does: 'walk',
  value: lvl => haulSpeed(lvl) * 60,
  first: HAUL_PACE_COST,
  site: 'bench',
  show: () => S.crew > 0,
  bands: [
    { key: 'haulpace',  name: 'hauler speed' },
    { key: 'haulpace2', name: 'hauler speed II' },
    { key: 'haulpace3', name: 'hauler speed III' }
  ]
});

export const CREW_ROWS = [...CARRY, ...PACE];
