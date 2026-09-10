// --- crits ----------------------------------------------------------------------
// A crit is a unit of work that counts for several -- one rule at every station,
// and two ladders that reach all of them because the rule does. See "Crits" in
// DESIGN.md, and src/crit.js, which is the whole of the mechanic in one place.
//
// The two rungs everybody expects: how often, and how much. Both run from a base
// the ladder starts on -- there is no off state below level nought -- up to the
// top over `RUNGS` rungs. The numbers are decided in the design; they are here so
// the crit module and the board rows read the one set.
// One in twenty-five at level 0, not one in ten: a crit should be bought, not
// arrive free -- the ladder is where the chance comes from. (wave6-sim, item 10)
export const CRIT_CHANCE_MIN = 0.04;
export const CRIT_CHANCE_MAX = 0.25;   // and one in four at the top of the ladder
export const CRIT_MULT_MIN = 3;        // worth three units of work at level 0
export const CRIT_MULT_MAX = 6;        // and six at the top
// One rung, one whole unit. The ladder used to ease MIN..MAX over the shared
// five rungs and round, so two neighboring rungs could round to the same figure
// and the row read "4 -> 4" -- a purchase that buys nothing it can name. Three
// rungs walk 3, 4, 5, 6 with no repeats, and each rung costs double to make up
// for there being fewer of them. (feedback7, item 20)
export const CRIT_MULT_RUNGS = CRIT_MULT_MAX - CRIT_MULT_MIN;
// The strongest per-rung buy on the board was also its cheapest; the grind pass
// (DESIGN.md) prices the pair against the crew-backed income that actually
// reaches them, not the solo clicking that sees them first. The mult rung
// carries both scalings: wave 7's double-for-fewer-rungs, then the grind
// pass's four-across-the-ladder.
//
// And the pair is priced in the quarry's blue and the farm's green rather than
// in dust alone. A crit reaches every station, so what it asks for should come
// from more than one of them: a rung is a trip to the seam AND a trip to the
// plots, which is a decision, where a heap of dust is only a wait. `billOf`
// appends the dust line at the exchange rate, as it does for every row priced
// in coins -- so the coins here are cut to about half the old dust price and
// the total a rung asks for lands roughly where it did.
export const CRIT_CHANCE_SHARD = 5;    // first rung, rungCost-shaped like the rest
export const CRIT_CHANCE_SPORE = 20;
export const CRIT_MULT_SHARD = 15;
export const CRIT_MULT_SPORE = 45;
