// --- crits ----------------------------------------------------------------------
// A crit is a unit of work that counts for several -- one rule at every station,
// and two ladders that reach all of them because the rule does. See "Crits" in
// DESIGN.md, and src/crit.js, which is the whole of the mechanic in one place.
//
// The two rungs everybody expects: how often, and how much. Both run from a base
// the ladder starts on -- there is no off state below level nought -- up to the
// top over `RUNGS` rungs. The numbers are decided in the design; they are here so
// the crit module and the board rows read the one set.
export const CRIT_CHANCE_MIN = 0.10;   // a crit on one swing in ten, at level 0
export const CRIT_CHANCE_MAX = 0.25;   // and one in four at the top of the ladder
export const CRIT_MULT_MIN = 3;        // worth three units of work at level 0
export const CRIT_MULT_MAX = 6;        // and six at the top
export const CRIT_CHANCE_COST = 60;    // first rung, dust, rungCost-shaped like the rest
export const CRIT_MULT_COST = 80;
