// Hell's coins as the boards spend them (DESIGN.md, "Acts 3 and 4", act 4,
// "Ladders in bands"): brimstone banked at the landing's store, and bars
// stocked at the anvil, counted in two bands -- low (dross, cinder iron) and
// high (copper, glass). The adamant's bars are the cage's and are never a
// coin. `purse` (words.js) and `take` (upgrades.js) ask here for these three
// and nothing else, so the yard's coins never read hell's facts.

import { S } from '../state.js';
import { HELL_TIERS } from '../config.js';

export const HELL_COINS = ['brimstone', 'lowbar', 'highbar'];
export const isHellCoin = money => HELL_COINS.includes(money);

const oresOf = band => HELL_TIERS.filter(t => t.band === band).map(t => t.ore);

// What the act holds of a coin; none before it begins.
export function hellPurse(money) {
  const h = S.hell;
  if (!h) return 0;
  if (money === 'brimstone') return h.brimstone;
  return oresOf(money).reduce((n, ore) => n + (h.bars[ore] || 0), 0);
}

// Taken off the store: a band's bars from its lowest ore first, so the newer
// seam's bars are left for the tool they are wanted for.
export function takeHell(money, n) {
  const h = S.hell;
  if (!h || !n) return;
  if (money === 'brimstone') { h.brimstone = Math.max(0, h.brimstone - n); return; }
  let left = n;
  for (const ore of oresOf(money)) {
    const k = Math.min(left, h.bars[ore] || 0);
    h.bars[ore] -= k;
    left -= k;
  }
}
