// --- a ladder is a rung a coin -----------------------------------------------
// Every ladder in the yard is one card, and every rung on it is a new bill:
// dust, then dust and crops, then dust, crops and ore -- the order the run
// hands its coins out -- and last a rung that asks everything the yard makes,
// sparks included. Two rungs to a coin, so the card is pressed twice before
// the bill deepens. See DESIGN.md, "Every ladder is sold in bands" and "The
// spark band is the top of the ladder".
//
// The width of a band is a number about the game, not a fact about the code
// that builds a ladder, which is why it lives here. The length is this one
// number; what a rung is worth is a written list in `config/rungs.js`, as
// long as the ladder, so a change here is a change there too.
export const TIER_BAND = 2;                       // rungs to a card's group
export const TIER_BANDS = 4;                      // groups on a ground's ladder
export const TIER_RUNGS = TIER_BAND * TIER_BANDS; // eight, all told
// The rung before the spark one: the last a scene or a check climbs to when it
// wants a ladder short of its spark rung.
export const TIER_OWN = TIER_RUNGS - TIER_BAND;

// And every other ladder in the yard: the same card, the same four groups, the
// same coins everywhere.
export const LADDER_BANDS = 4;                    // groups on an ordinary ladder
export const LADDER = TIER_BAND * LADDER_BANDS;    // eight rungs, all told
// The coins each group adds to the dust, first to last. Not the core: nine
// exist in the game and they open places.
export const BAND_COINS = [[], ['spore'], ['spore', 'shard'], ['spore', 'shard', 'spark']];
