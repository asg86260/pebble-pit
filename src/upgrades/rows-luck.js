import { CRIT_CHANCE_COST, CRIT_MULT_COST, CRIT_MULT_RUNGS } from '../config.js';
import { critChance, critMult } from '../crit.js';
import { S } from '../state.js';
import { rungCost } from '../upgrades.js';
import { tierRows } from './tiers.js';

// The bench's luck rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
//
// Crits: two ladders for the whole yard, on the bench because they reach every
// station -- one rule, one home. See src/crit.js and "Crits" in DESIGN.md.
//
// Named to the shop's grammar (see DESIGN.md "The shop's language"): a rung is
// a bare noun for the quantity, and the section heading -- "lucky swings" --
// says what the quantity is of. The chance ladder is in bands (CLAUDE.md,
// "Decided"), and its cards are the charms a miner carries for luck; the
// power ladder is three whole units and stays one card, in dust.
const CHANCE = tierRows({
  field: 'critChanceLevel',
  unit: '%', does: 'crit',
  value: lvl => Math.round(critChance(lvl) * 100),
  first: CRIT_CHANCE_COST,
  site: 'bench',
  // Once there is a crew to swing: the pair used to wait on both coins it was
  // priced in, and the first card is dust now.
  show: () => S.crew > 0,
  bands: [
    { key: 'critchance',  name: 'lucky charm' },
    { key: 'critchance2', name: "rabbit's foot" },
    { key: 'critchance3', name: 'found horseshoe' }
  ]
});

export const LUCK_ROWS = [
  ...CHANCE,
  {
    key: 'critmult',
    kind: 'rung', site: 'bench',
    name: 'power',
    unit: 'x',
    does: 'crit',
    rung: () => S.critMultLevel,
    // One whole unit a rung -- 3, 4, 5, 6 over three rungs -- so no rung ever
    // reads "4 -> 4". (feedback7, item 20)
    rungs: () => CRIT_MULT_RUNGS,
    from: () => critMult(S.critMultLevel),
    to: () => critMult(S.critMultLevel + 1),
    cost: () => rungCost(CRIT_MULT_COST, S.critMultLevel),
    buy: () => S.critMultLevel++,
    show: () => S.crew > 0
  }
];
