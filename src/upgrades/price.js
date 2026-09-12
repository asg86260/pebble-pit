// What a rung costs and what a coin is worth, on their own so a row file can
// price itself without importing upgrades.js.
//
// upgrades.js strings every row file together, and the station modules
// (scrubhouse.js, apothecary.js) build their ladders at module load. A ladder
// helper that imported upgrades.js for these two would close a cycle --
// upgrades.js -> scrubhouse.js -> tiers.js -> upgrades.js -- and whichever
// module the entry point happened to reach first would find the helper still
// uninitialized. Two leaf definitions, re-exported from upgrades.js so nothing
// that already imports them from there has to move.

import { DUST_PER_SPARK, DUST_PER_SHARD, DUST_PER_SPORE, DUST_PER_CORE } from '../config.js';

// What one rung costs, from what the first one costs.
//
// Half again a rung, so the top of a ladder is about six times the bottom of it.
// The old prices doubled and worse -- 1.9 a level on the swing -- which is the
// arithmetic of a row meant to be bought for ever: the exponent, not the game,
// decides when you stop. A ladder with an end does not need the price to be the
// wall, because the end is the wall, so a rung can stay affordable enough to be
// worth reading all the way up.
export const rungCost = (first, lvl) => Math.round(first * Math.pow(1.6, lvl));

// Sixty to the spark is the line the machines were already sitting on: the
// tiller exactly, the jaw within a rounding. The rest are set against it by how
// hard the thing is to come by, and a core -- of which there are nine in the
// game -- is worth the most of anything. See DUST_PER_SPARK in config.
export const DUST_PER = { spark: DUST_PER_SPARK, shard: DUST_PER_SHARD, spore: DUST_PER_SPORE, core: DUST_PER_CORE };
