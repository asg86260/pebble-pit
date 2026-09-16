import { critChance, critMult } from '../crit.js';
import { S } from '../state.js';
import { tierRows, named } from './tiers.js';

// The bench's luck rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
//
// Crits: two ladders for the whole yard, on the bench because they reach every
// station. See src/crit.js and "Crits" in DESIGN.md.
const CHANCE = tierRows({
  field: 'critChanceLevel',
  unit: '%', does: 'crit',
  value: lvl => Math.round(critChance(lvl) * 100),
  site: 'bench',
  show: () => S.crew > 0,
  bands: named('critchance', 'crit chance')
});

// Whole units off its list, so no rung ever reads "4 -> 4".
const MULT = tierRows({
  field: 'critMultLevel',
  unit: 'x', does: 'crit',
  value: lvl => critMult(lvl),
  site: 'bench',
  show: () => S.crew > 0,
  bands: named('critmult', 'crit damage')
});

export const LUCK_ROWS = [
  ...CHANCE,
  ...MULT
];
