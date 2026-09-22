import { P } from './yard.js';

// --- the purifier balloon ------------------------------------------------------
// A craft the air filter sells: it goes up into the clouds and travels from one
// to the next, drawing each in, and brings what it catches home to its post.
// See DESIGN.md, "The balloons ride the clouds", and src/balloon.js.
export const BALLOON_RUNGS = 3;      // a finite ladder, like every other one
export const BALLOON_DUST = 1200;    // what the first one costs
export const BALLOON_RATE = 1.9;     // and how much steeper each one gets
export const BALLOON_W = P * 11;     // the envelope
export const BALLOON_H = P * 13;
export const BALLOON_BASKET = P * 4; // and what hangs under it, which is what a body gets into
// The filter, slung between the envelope's neck and the basket.
export const BALLOON_FILTER_W = P * 7;
export const BALLOON_FILTER_H = P * 4;
// How far a craft hanging under a cloud sways on its own breath, in pixels
// either way; derived off the clock so there is nothing to save. See `bobOf`.
export const BALLOON_BOB = P * 2;
// The row of posts, one a craft, to the right of the filter's dial: cells of
// air between the dial and the first craft, and between one craft's filter box
// and the next.
export const BALLOON_MAST_GAP = 2;
// The widest part of a craft, which is what the posts are spaced by.
export const BALLOON_SPAN = Math.max(BALLOON_W, BALLOON_FILTER_W);
// The smallest a craft is drawn, as a share of its size, however far back a
// sheet it is among: at a far sheet's own size it was a speck.
export const BALLOON_MIN_SIZE = 0.55;
// The trips, in seconds: up off the post into the sky and back down to it, one
// cloud to the next, and how long it hangs under each. The ups and downs are
// clocks the yard keeps whatever the view; where the craft is drawn along the
// way is worked out from them.
export const BALLOON_CLIMB_S = 7;
export const BALLOON_TRAVEL_S = 6;
export const BALLOON_DWELL_S = 14;
// Cells of sky between a cloud's base and the crown of the envelope hanging
// under it: room for the stream the craft draws down out of the cloud.
export const BALLOON_HANG = 6;
// The stream a working craft draws down out of its cloud (craftair.js): cells
// a second at the bare fan over a clean sky, and how much more at the brim, so
// a filthy sky is a thick stream and a clean one a trickle; how many cells
// either side of the line it is gathered from at the cloud, narrowing to the
// vent; and pixels a second it comes down at.
export const DRAWIN_PER_S = 12;
export const DRAWIN_MURK = 3;
export const DRAWIN_WIDE = 1;
export const DRAWIN_PACE = 30;
