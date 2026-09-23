// What a rung costs and what a coin is worth, on their own so a row file can
// price itself without importing upgrades.js: the station modules build their
// ladders at module load, and a helper that imported upgrades.js for these
// would close a cycle (upgrades.js -> filter.js -> tiers.js ->
// upgrades.js) and find itself uninitialized. Re-exported from upgrades.js.

import { S } from '../state.js';
import { DUST_PER_SPARK, DUST_PER_SHARD, DUST_PER_SPORE, DUST_PER_CORE, DUST_PER_SCALE } from '../config.js';

// Half again a rung, so the top of a ladder is about six times the bottom. A
// ladder with an end does not need the price to be the wall. `rate` is the
// Ladder Book's knob.
export const RUNG_RATE = 1.6;
export const rungCost = (first, lvl, rate = RUNG_RATE) => Math.round(first * Math.pow(rate, lvl));

// Set against the spark by how hard each coin is to come by (DUST_PER_SPARK in
// config). The scale is the deep's coin, set against dust like the rest, so
// a bill in scales converts to the yard's coins by the same rule.
export const DUST_PER = { spark: DUST_PER_SPARK, shard: DUST_PER_SHARD, spore: DUST_PER_SPORE, core: DUST_PER_CORE,
                          scale: DUST_PER_SCALE };

// Where each coin comes from, and whether that place exists yet: a bill in a
// coin the yard has no source for is a word the player has not met. Spore and
// shard read the grounds' own flags rather than `seenSpore`/`seenShard`,
// because a ground that stands and has not yielded yet is still a place to go
// and get the coin from. Dust is always there. The words a card says while it
// waits (`coinNeeds`) sit beside the flag so the two cannot disagree.
const COIN_FROM = {
  spore: { open: () => !!S.farmOpen,   needs: 'needs crops' },
  shard: { open: () => !!S.quarryOpen, needs: 'needs a quarry' },
  core:  { open: () => !!S.seenCore,   needs: 'needs a core' },
  spark: { open: () => !!S.seenSpark,  needs: 'needs a spark' },
  // The serpent's, and there is none to be had until it has taken him.
  scale: { open: () => !!S.snatched,   needs: 'needs a scale' }
};
export const coinOpen = coin => !COIN_FROM[coin] || COIN_FROM[coin].open();
export const coinsOpen = coins => coins.every(coinOpen);

// What a card is waiting on, in words, or nothing. A ladder card cannot leave
// the board when its bill reaches a coin the yard has not met (the rungs
// bought are on it), so it stands greyed with its price up, and the words are
// the reason for a test to read (`tierRows`; `refresh` in shop.js).
export const coinNeeds = coins => COIN_FROM[coins.find(c => !coinOpen(c))]?.needs || '';
