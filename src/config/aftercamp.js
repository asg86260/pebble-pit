// --- act 3: the camp, hand work in the world (track A, 2026-10-18) ---------------
// docs/wave-act3-build.md, track A: the stations worked by dragging their own
// moving parts where they stand, the empty sites and the carry that raises a
// station. Every number below is a voted mock's own guess, carried over in
// world pixels and seconds, for the pace tool to move.
import { P } from './yard.js';

// --- raising a station (docs/mocks/act3-unbuilt-2026-10-18, pile a) ---
// Ordered on the shack, members carry its loads onto its spot as a pile of
// planks and blocks; the first two stay on as builders and the station's
// bands fade in from the floor up, each taking two loads off the pile, until
// the pile is gone. A load is set down, and picked up, over a beat.
export const AFTER_BUILD_A_BAND = 2;       // loads a band takes
export const AFTER_BUILD_CARRIERS = 4;     // members out of the camp to carry a station's loads
export const AFTER_BUILD_BUILDERS = 2;     // ...of whom this many stay to build
export const AFTER_BUILD_DROP_S = 0.5;     // a load set down on the pile
export const AFTER_BUILD_LAY_S = 0.4;      // a load laid into a band
export const AFTER_BUILD_HOLD_S = 1;       // the pile stands complete this long before the first band

// A plain click this many cells up off the floor over God's crowd opens its
// status board (track C's 'crowd'): its near rows and the mass behind them.
export const CROWD_CLICK_ROWS = 40;
