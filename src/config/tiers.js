import { RUNGS } from './crew.js';

// --- a ladder sold as four cards ----------------------------------------------
// The farm and the quarry each sell two twelve-rung ladders, and a twelve-pip
// row is a row nobody reads. So a ladder is broken into bands of three, each
// band its own card with its own name: the card you can see is the band you are
// on, and finishing one retires it and shows the next. See DESIGN.md, "What the
// two grounds sell".
//
// Three and four rather than any other pair, and they are here rather than
// written into the helper because the shape of a ladder is a number about the
// game, not a fact about the code that builds one.
export const TIER_BAND = 3;                       // rungs to a card
export const TIER_BANDS = 4;                      // cards to a ladder
export const TIER_RUNGS = TIER_BAND * TIER_BANDS; // twelve, all told
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
export const LADDER = TIER_BAND * LADDER_BANDS;    // nine rungs, all told
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
export const MULT_MAX = {
  swing: RUNGS, haul: RUNGS,
  tend: TIER_BAND, quarry: TIER_BAND, crop: TIER_BAND, seam: TIER_BAND
};
