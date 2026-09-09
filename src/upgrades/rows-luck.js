import { CRIT_CHANCE_SHARD, CRIT_CHANCE_SPORE, CRIT_MULT_SHARD, CRIT_MULT_SPORE,
         CRIT_MULT_RUNGS } from '../config.js';
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
    // Blue and green, because a crit lands at every station and so should be
    // owed to more than one of them. The dust line comes off the exchange rate
    // in billOf; see config/crits.js.
    bill: () => [['shard', rungCost(CRIT_CHANCE_SHARD, S.critChanceLevel)],
                 ['spore', rungCost(CRIT_CHANCE_SPORE, S.critChanceLevel)]],
    buy: () => S.critChanceLevel++,
    show: () => true
  },
  {
    key: 'critmult',
    kind: 'rung', site: 'bench',
    name: 'power',
    unit: 'x',
    rung: () => S.critMultLevel,
    // One whole unit a rung -- 3, 4, 5, 6 over three rungs -- so no rung ever
    // reads "4 -> 4". The costs doubled to make up for there being fewer of
    // them; see config/crits.js. (feedback7, item 20)
    rungs: () => CRIT_MULT_RUNGS,
    from: () => critMult(S.critMultLevel),
    to: () => critMult(S.critMultLevel + 1),
    bill: () => [['shard', rungCost(CRIT_MULT_SHARD, S.critMultLevel)],
                 ['spore', rungCost(CRIT_MULT_SPORE, S.critMultLevel)]],
    buy: () => S.critMultLevel++,
    show: () => true
  }
];
