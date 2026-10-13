import { S } from '../state.js';
import { haulCap, haulSpeed } from '../levels.js';
import { tierRows, named } from './tiers.js';
import { msg } from '../lang.js';

// The bench's crew rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
//
// Two ladders in bands (CLAUDE.md, "Decided"): what a hauler carries, and how
// fast it walks. What each rung is worth and costs is in config/rungs.js.
const CARRY = tierRows({
  field: 'haulCarryLevel',
  unit: 'px', does: msg('does-carry'),
  value: lvl => haulCap(lvl),
  site: 'bench',
  show: () => S.crew > 0,
  bands: named('haulcarry', msg('row-haulcarry'))
});

const PACE = tierRows({
  field: 'haulPaceLevel',
  unit: 'px/s', pct: true, does: msg('does-walk'),
  value: lvl => haulSpeed(lvl) * 60,
  site: 'bench',
  show: () => S.crew > 0,
  bands: named('haulpace', msg('row-haulpace'))
});

export const CREW_ROWS = [...CARRY, ...PACE];
