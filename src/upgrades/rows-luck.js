import { CRIT_CHANCE_COST, CRIT_MULT_COST } from '../config.js';
import { critChance, critMult } from '../crit.js';
import { S } from '../state.js';
import { rungCost } from '../upgrades.js';

// The bench's luck rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const LUCK_ROWS = [
  // Crits: two ladders for the whole yard, on the bench because they reach every
  // station -- one rule, one home. See src/crit.js and "Crits" in DESIGN.md.
  //
  // Named to the shop's grammar (see DESIGN.md "The shop's language"): a rung is
  // a bare noun for the quantity, and the section heading -- "a lucky swing" --
  // says what it is a swing of. So "chance" (how often a crit comes up) and
  // "power" (how much it is worth), not the "lucky strike" / "heavy hit" the
  // build first shipped.
  {
    key: 'critchance',
    kind: 'rung', site: 'bench',
    name: 'chance',
    unit: '%',
    rung: () => S.critChanceLevel,
    from: () => Math.round(critChance(S.critChanceLevel) * 100),
    to: () => Math.round(critChance(S.critChanceLevel + 1) * 100),
    cost: () => rungCost(CRIT_CHANCE_COST, S.critChanceLevel),
    buy: () => S.critChanceLevel++,
    show: () => true
  },
  {
    key: 'critmult',
    kind: 'rung', site: 'bench',
    name: 'power',
    unit: 'x',
    rung: () => S.critMultLevel,
    from: () => critMult(S.critMultLevel),
    to: () => critMult(S.critMultLevel + 1),
    cost: () => rungCost(CRIT_MULT_COST, S.critMultLevel),
    buy: () => S.critMultLevel++,
    show: () => true
  }
];
