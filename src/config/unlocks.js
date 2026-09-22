// --- what the yard is bought with ---------------------------------------------
// Dust buys the yard: it is the thing you are making, it arrives constantly,
// and an expensive door is one you can see yourself walking toward. A core
// opens places -- the two grounds and the tower -- because a core is one rock
// finished, the one thing you can only get by seeing a boulder all the way to
// the bottom. The plots come before the quarry: food makes bodies and stone
// makes tools, and a body has to exist before its tool means anything.
export const FARM_CORES = 1;       // the plots, and the first thing a core buys
// One core, not two: a second core is a second rock's worth of *waiting*,
// which nothing the player does can hurry. The dust half carries the weight
// instead ("The grind pass" in DESIGN.md) -- a bill you can push on.
export const QUARRY_CORES = 1;     // and the cut, once the plots are feeding it
// What the *dust* half of a bill is measured against: every place above tier
// one is priced in its own coin and in dust both, so the rock never stops
// being worth digging. See DESIGN.md, "A rung costs the tier's currency and
// dust, both."
export const FARM_DUST = 600;      // the plots, and the first real bill
// Higher and the door sits shown-and-red for hours of a greedy run.
export const QUARRY_DUST = 2000;   // the quarry
export const FILTER_DUST = 3500;    // the air filter

export const LAB_DUST = 12000;     // the lab
export const CASINO_DUST = 15000;  // and the table, which makes nothing
export const OUTHOUSE_DUST = 300;  // and somewhere for the crew to go
// A row shows once you are within this much of affording it: a price you have
// no idea is coming is a price you cannot save for. Lower and a door appears
// with income being spent as it comes, and reads as a wall.
export const UNLOCK_SHOW = 0.7;

// The rock the first core is in. There is no reason for one to turn up in the
// first thing you break, before there is anywhere for it to go.
export const CORE_FROM = 5;
