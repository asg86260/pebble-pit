// --- what the yard is bought with ---------------------------------------------
// Every building used to cost cores, and a core is one whole rock. So the
// opening was four rocks of watching a number climb to three with nothing to do
// about it but swing, and the rarest thing in the game was spent on doors.
//
// Dust buys the yard now: it is the thing you are making, it arrives constantly,
// and an expensive door is one you can see yourself walking towards. A core buys
// the one thing you cannot get any other way -- see the tower.
// The plots come before the quarry. Food makes bodies and stone makes tools, and a
// body has to exist before its tool means anything -- so green is strength and
// blue is gear, in that order.
// What the two grounds cost to open, and they are back to being cores.
//
// "A core opens places" is the sentence the whole tier table is built on, and
// for a while these two were the exception -- priced in dust, because they came
// early and a core felt like a lot to ask. What that actually bought was two
// places you could stumble into without noticing, on a currency that was already
// pouring in, and a fourth tier whose one job -- buildings -- had two of its
// buildings taken off it.
//
// A core is one rock finished. Two of them for the two grounds is a real bill
// paid in the one thing you can only get by seeing a boulder all the way to the
// bottom, and it makes opening the plots something you went and earned rather
// than something that happened while you were looking elsewhere.
export const FARM_CORES = 1;       // the plots, and the first thing a core buys
// Whether a shield's failure is what opens the next door -- the props the
// farm, the net the quarry, the arch the tower, and each the kit of the
// trade that made it (DESIGN.md, "The shields are the spine"). Off while the
// pacing is being played with (2026-09-14): the doors are priced in cores
// and dust alone, and the shields still stand and fail in their order but
// open nothing. `shieldOpened` in shield.js is the one place that reads it.
export const SHIELD_GATES = false;
// One core, not two: a second core is a second rock's worth of *waiting*, which
// nothing the player does can hurry. The dust half carries the weight instead
// (see "The grind pass" in DESIGN.md) -- a bill you can push on.
export const QUARRY_CORES = 1;     // and the cut, once the plots are feeding it
// Still here, and still what the *dust* half of a bill is measured against:
// every place above tier one is priced in its own coin and in dust both, so the
// rock never stops being worth digging. See DESIGN.md, "A rung costs the tier's
// currency and dust, both."
export const FARM_DUST = 600;      // the plots, and the first real bill
// Two thousand, from six by way of four: the door sat shown-and-red for two and
// a half hours of a greedy run at six (critics 2026-09-10, B9), and still too
// long at four.
export const QUARRY_DUST = 2000;   // the quarry
export const SCRUB_DUST = 3500;    // the scrubbing house

export const LAB_DUST = 12000;     // the lab
export const LAB_SPORES = 100;      // and a taste of the ground it multiplies
export const CASINO_DUST = 15000;  // and the table, which makes nothing
export const OUTHOUSE_DUST = 900;  // and somewhere for the crew to go
// A row shows once you are within this much of affording it. Nothing here is
// revealed by a counter passing a mark nobody can see, and a price you have no
// idea is coming is a price you cannot save for.
// Seven tenths, from a half: at a half the quarry's door appeared at three
// thousand dust with income being spent as it came, and read as a wall
// (critics B9).
export const UNLOCK_SHOW = 0.7;

// The rock the first core is in. There is no reason for one to turn up in the
// first thing you break, before there is anywhere for it to go: four rocks of
// the yard being a yard, and then something comes out of one that never has
// before.
export const CORE_FROM = 5;
