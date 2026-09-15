import { critChance, critMult } from '../crit.js';
import { S } from '../state.js';
import { tierRows, named } from './tiers.js';

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
  site: 'bench',
  // Once there is a crew to swing: the pair used to wait on both coins it was
  // priced in, and the first card is dust now.
  show: () => S.crew > 0,
  bands: named('critchance', 'crit chance')
});

// And what a crit is worth: whole units off its list (config/rungs.js),
// so no rung ever reads "4 -> 4" (feedback7, item 20). It was a flat row that
// asked the third band's coins from its first rung, on the argument that a
// whole unit of crit is the strongest rung on the bench; it is a band ladder
// like every other now, and keeps its steeper rate instead.
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
