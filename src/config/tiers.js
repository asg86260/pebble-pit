// --- a ladder is a rung a coin -----------------------------------------------
// Every ladder in the yard is one card, and every rung on it is a new bill:
// dust, then dust and crops, then dust, crops and ore -- the order the run
// hands its coins out -- and at the two grounds a fourth rung that asks
// everything the yard makes, sparks included. A band is one rung now, so the
// bands rule and the ladder are the same statement. See DESIGN.md, "Every
// ladder is sold in bands" and "The spark band is the top of the ladder".
//
// The width of a band is a number about the game, not a fact about the code
// that builds a ladder, which is why it lives here. It was three, then two:
// a nine-rung ladder was nine trips to the board with a builder to watch
// between each, and two rungs to a card was still a second press that asked
// the same coins for a smaller step. The length is this one number; what a
// rung is worth is written so the tops hold whatever the length is -- a rate
// eases to the same top in as many steps as there are, and a count's unit a
// rung is what a whole band used to add (DESIGN.md, "A ladder is six rungs"
// and its as-built note).
export const TIER_BAND = 1;                       // rungs to a card's group
export const TIER_BANDS = 4;                      // groups on a ground's ladder
export const TIER_RUNGS = TIER_BAND * TIER_BANDS; // four, all told
// The rung before the spark one: the last a scene or a check climbs to when it
// wants a ladder short of its spark rung.
export const TIER_OWN = TIER_RUNGS - TIER_BAND;

// And every other ladder in the yard: the same card, the same four groups. The
// bench's fourth rung asks the spark too (2026-09-14): every ladder is a rung
// a coin, and the coins are the same four everywhere.
export const LADDER_BANDS = 4;                    // groups on an ordinary ladder
export const LADDER = TIER_BAND * LADDER_BANDS;    // four rungs, all told
// The coins each group adds to the dust, first to last.
// Not the core: nine exist in the game and they open places, and a fourth rung
// on every ladder priced in them was thirty-two cores for one rung of crit.
export const BAND_COINS = [[], ['spore'], ['spore', 'shard'], ['spore', 'shard', 'spark']];
