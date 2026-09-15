// --- crits ----------------------------------------------------------------------
// A crit is a unit of work that counts for several -- one rule at every station
// (src/crit.js; "Crits" in DESIGN.md). Nothing is declared here: the chance and
// the worth at each rung, and what each rung costs, are lists in
// config/rungs.js. The pair is priced in the quarry's blue and the farm's green
// because a crit reaches every station, so a rung is a trip to the seam AND a
// trip to the plots, which is a decision where a heap of dust is only a wait.
