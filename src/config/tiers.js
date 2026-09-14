import { RUNGS } from './crew.js';

// --- a ladder sold as four cards ----------------------------------------------
// The farm and the quarry each sell two ladders as four cards, and a card is
// a band of the ladder with its own bill: the pips you can see are grouped by
// band, and the bill deepens as the groups fill. See DESIGN.md, "What the two
// grounds sell" and "Every ladder is sold in bands".
//
// Two and four rather than any other pair, and they are here rather than
// written into the helper because the shape of a ladder is a number about the
// game, not a fact about the code that builds one. The band was three, and a
// nine-rung ladder was nine trips to the board with a builder to watch between
// each; a rung has a size, a ladder has a length, and the length is this one
// number (DESIGN.md, "A ladder is six rungs"). Rates ease to the same tops
// over whatever the length is; counts keep a whole unit a rung and their tops
// move with it.
export const TIER_BAND = 2;                       // rungs to a card
export const TIER_BANDS = 4;                      // cards to a ladder
export const TIER_RUNGS = TIER_BAND * TIER_BANDS; // eight, all told
// The last band is the multiplier over the ladder rather than more of the
// ladder's own field, so the field itself only ever climbs this far.
export const TIER_OWN = TIER_RUNGS - TIER_BAND;

// And every other ladder in the yard: the same cards, three of them. Dust
// only on the first, dust and crops on the second, dust, crops and ore on the
// third -- the order the run hands its coins out -- and no fourth, because the
// grounds' fourth card is the old lab multiplier and nothing else ever had
// one. See DESIGN.md, "Every ladder is sold in bands". `RUNGS` (five) is what
// is left to the two crew multipliers and the tower's spark ladders, which are
// outside that rule by decision.
export const LADDER_BANDS = 3;                    // cards to an ordinary ladder
export const LADDER = TIER_BAND * LADDER_BANDS;    // six rungs, all told
// The coins each card adds to the dust, first card to last.
export const BAND_COINS = [[], ['spore'], ['spore', 'shard']];

// How far up each multiplier goes, by the field it multiplies.
//
// `levelOf` clamped every one of them at `RUNGS` when there were four and they
// were the lab's. There are six now and they are not all the same length: the
// crew's two are still ladders in their own right and keep their five rungs,
// and the four station ones are the last band of a longer ladder, so they end
// where a band ends. One table read in the one place `levelOf` clamps -- a cap
// only half the game knows about is a row that says 3 of 3 and can still be
// bought.
// `swing` and `haul` were here at RUNGS; their rows are gone (rows-mult.js).
export const MULT_MAX = {
  tend: TIER_BAND, quarry: TIER_BAND, crop: TIER_BAND, seam: TIER_BAND
};
