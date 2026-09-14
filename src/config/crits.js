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
// What a crit is worth is CRIT_MULT in config/rungs.js: a whole unit a rung,
// written down, so no two rungs round to one figure (feedback7, item 20).
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
// Those two coins are now the second and third cards of a ladder sold in
// bands (CLAUDE.md, "Decided"): the first card asks dust alone, at what the
// old blue-and-green first rung was worth, and the crops and the ore come on
// as the ladder climbs. The power ladder is three rungs and stays one card.
// Both crit ladders climb at twice a rung rather than the house 1.6 (the
// Ladder Book, 2026-09-12): a crit reaches every station at once, so its
// ladder is the one worth making a wall of.
export const CRIT_CHANCE_COST = 500;   // first rung of the chance ladder, dust
export const CRIT_MULT_COST = 1000;    // and of the damage ladder, dust
export const CRIT_RATE = 2;
