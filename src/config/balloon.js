import { P } from './yard.js';

// --- the purifier balloon ------------------------------------------------------
// A craft the scrubbing house sells: it rides the sky, takes it in where it is,
// and drops what it catches under itself. See DESIGN.md, "The purifier balloon",
// and src/balloon.js.
export const BALLOON_RUNGS = 3;      // a finite ladder, like every other one
export const BALLOON_DUST = 1200;    // what the first one costs
export const BALLOON_RATE = 1.9;     // and how much steeper each one gets
// World pixels a frame it crosses the yard at. Slower than a body walks: a
// balloon that outpaced the crew underneath it would read as a vehicle.
export const BALLOON_PACE = 0.42;
export const BALLOON_LIFT = 0.010;   // and how fast it rises off the mast, in lift a frame
export const BALLOON_W = P * 7;      // the envelope
export const BALLOON_H = P * 9;
export const BALLOON_BASKET = P * 4; // and what hangs under it, which is what a body gets into
// The filter, slung between the envelope and the basket. Wider than both so it
// reads as the works of the thing rather than as part of either.
export const BALLOON_FILTER_W = P * 9;
export const BALLOON_FILTER_H = P * 4;
// How far off its lane a craft floats on its own breath, in pixels either way;
// derived off the clock so there is nothing to save. See `bobOf`.
export const BALLOON_BOB = P * 3;
// What the wind does to its pace: a share either way. The same number the
// haze's own creep is on, so a gust that leans the sky leans the thing flying
// through it.
export let BALLOON_WIND = 0.45;
// Its own slow swing on top, so two craft on the same wind are still not doing
// the same thing.
export let BALLOON_SWING = 0.22;
// Pixels a frame a craft climbs when it is going home, up and out of the
// window. Brisk, but slow enough to be watched going.
export const BALLOON_LEAVE = 1.15;
// Pixels a frame a body under an umbrella comes down at: a descent, not a
// hover. Half a pixel a frame from the top of the sky is the best part of a
// minute watching somebody not arrive.
export const BROLLY_FALL = 0.95;
// The cap: wide and shallow, so it is not the envelope at another size. The one
// place an umbrella ever appears is directly under a balloon.
export const BROLLY_W = P * 11;
// And how far over the head it rides, which is the length of the stick.
export const BROLLY_STICK = P * 7;
// The lanes, as a share of the sky's depth, measured to the *basket*: a hundred
// pixels of craft hang above the number set here, and at a fifth of the way
// down the crown was off the top of the window. Each craft after the first
// rides a little lower, so a fleet crosses rather than passing through itself.
export const BALLOON_LANE_TOP = 0.36;
export const BALLOON_LANE_GAP = 0.16;
export const BALLOON_EDGE = 6;       // cells it turns short of either end of the world
// No reach or draught: a balloon is *in* the sky, so what is near it comes to
// it and nothing is dragged (`eat` in smog.js).
export const BALLOON_WISP_FROM = 90;  // and how far out the cells drawn in come from
