import { P } from './yard.js';

// --- the purifier balloon ------------------------------------------------------
// A craft the scrubbing house sells: it rides the sky, takes it in where it is,
// and drops what it catches under itself. See DESIGN.md, "The purifier balloon",
// and src/balloon.js.
export const BALLOON_RUNGS = 3;      // a finite ladder, like every other one
export const BALLOON_DUST = 1200;    // what the first one costs
export const BALLOON_RATE = 1.9;     // and how much steeper each one gets
// World pixels a frame it crosses the yard at. Slower than a body walks: it is a
// thing drifting on the air rather than a thing going somewhere, and a balloon
// that outpaced the crew underneath it would read as a vehicle.
export const BALLOON_PACE = 0.42;
export const BALLOON_LIFT = 0.010;   // and how fast it rises off the mast, in lift a frame
export const BALLOON_W = P * 7;      // the envelope
export const BALLOON_H = P * 9;
export const BALLOON_BASKET = P * 4; // and what hangs under it, which is what a body gets into
// The filter, slung between the envelope and the basket. Wider than the neck
// above it and than the basket below, so it reads as the works of the thing
// rather than as part of either: the air goes in the top and what is caught
// falls out of the bottom.
export const BALLOON_FILTER_W = P * 9;
export const BALLOON_FILTER_H = P * 4;
// How far off its lane a craft floats on its own breath, in pixels either way.
// A balloon holding one height exactly is a balloon on a rail; this is what the
// yard's own two-swings-against-each-other trick buys, and it is derived off the
// clock so there is nothing to save. See `bobOf`.
export const BALLOON_BOB = P * 3;
// What the wind does to its pace: a share either way, so it runs with the
// weather and labours against it. The same number the haze's own creep is on, so
// a gust that leans the sky leans the thing flying through it.
export let BALLOON_WIND = 0.45;
// And its own slow swing on top, so two craft on the same wind are still not
// doing the same thing.
export let BALLOON_SWING = 0.22;
// Pixels a frame a craft climbs when it is going home the only way it goes home:
// up and out of the window. Brisk -- this is a thing leaving, not a thing
// drifting -- but slow enough to be watched going.
export const BALLOON_LEAVE = 1.15;
// Pixels a frame a body under an umbrella comes down at.
//
// Slower than it would fall -- that is what the umbrella is for -- but not by as
// much as it was. A body drifting down from the top of the sky at half a pixel a
// frame is on screen for the best part of a minute, which is a long time to
// watch somebody not arrive. It is a descent, not a hover.
export const BROLLY_FALL = 0.95;
// The cap: wide and shallow. Eleven cells across against the craft's envelope at
// seven, and three rows deep against its nine, so the two shapes are not each
// other at different sizes -- which matters, because the one place an umbrella
// ever appears is directly under a balloon.
export const BROLLY_W = P * 11;
// And how far over the head it rides, which is the length of the stick.
export const BROLLY_STICK = P * 7;
// Where the lanes are, as a share of the sky's own depth. The first craft rides
// high and each one after it a little lower, so a fleet crosses rather than
// passing through itself.
// The first craft's lane, as a share of the sky's depth -- measured to the
// *basket*, which is the bottom of the thing. Everything else hangs above it:
// four cells of basket, four of filter and nine of envelope, which is a hundred
// pixels of craft over the number set here. At a fifth of the way down the crown
// was off the top of the window.
export const BALLOON_LANE_TOP = 0.36;
export const BALLOON_LANE_GAP = 0.16;
export const BALLOON_EDGE = 6;       // cells it turns short of either end of the world
// The craft's own draught. Radial and short: a balloon is *in* the sky, so what
// is near it comes to it and everything else is left alone -- there is no long
// sideways river to avoid, which is the whole reason the house's numbers are as
// complicated as they are.
// How far a craft's mouth reaches into the air around it. Nothing is dragged --
// see `eat` in smog.js -- so this is simply the air the filter is counted as
// being in, and the specks inside it are the ones it takes.
// (No reach here either, for the same reason -- see `eat` in smog.js.)
export const BALLOON_WISP_FROM = 90;  // and how far out the cells drawn in come from
