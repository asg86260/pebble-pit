import { CRIT_CHANCE_COST, CRIT_MULT_COST, CRIT_MULT_RUNGS, CRIT_RATE, BAND_COINS } from '../config.js';
import { critChance, critMult } from '../crit.js';
import { S } from '../state.js';
import { rungCost, DUST_PER, coinsOpen } from './price.js';
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
  first: CRIT_CHANCE_COST, rate: CRIT_RATE,
  site: 'bench',
  // Once there is a crew to swing: the pair used to wait on both coins it was
  // priced in, and the first card is dust now.
  show: () => S.crew > 0,
  bands: named('critchance', 'crit chance')
});

export const LUCK_ROWS = [
  ...CHANCE,
  {
    key: 'critmult',
    kind: 'rung', site: 'bench',
    name: 'crit damage',
    unit: 'x',
    does: 'crit',
    rung: () => S.critMultLevel,
    // One whole unit a rung -- 3, 4, 5, 6 over three rungs -- so no rung ever
    // reads "4 -> 4". (feedback7, item 20)
    rungs: () => CRIT_MULT_RUNGS,
    from: () => critMult(S.critMultLevel),
    to: () => critMult(S.critMultLevel + 1),
    // The one three-rung ladder priced past dust: a whole unit of crit is the
    // strongest rung on the bench, so it asks the third card's coins from its
    // first (the Ladder Book, 2026-09-12).
    bill: () => { const dust = rungCost(CRIT_MULT_COST, S.critMultLevel, CRIT_RATE);
                  return [['dust', dust], ...BAND_COINS[2].map(c => [c, Math.max(1, Math.round(dust / DUST_PER[c]))])]; },
    cost: () => rungCost(CRIT_MULT_COST, S.critMultLevel, CRIT_RATE),
    buy: () => S.critMultLevel++,
    // ...and so it waits on the plots and the quarry, like any card priced
    // in their coins (see coinsOpen).
    show: () => S.crew > 0 && coinsOpen(BAND_COINS[2])
  }
];
