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


// The pair's speech bubbles (after/bubbles.js; the owner, 2026-10-18): sent
// up at uneven intervals, between these shares of AFTER_BUBBLE_EVERY_S, and
// in mixed sizes -- this share of them half as big again as a small one, and
// the big ones (twice the size, the crit) as often as AFTER_BUBBLE_BIG_EVERY
// says on the average. Inside each a symbol, never a word: a shout, a
// question shouted, a raised fist.
export const AFTER_BUBBLE_GAP = [0.45, 1.6];
export const AFTER_BUBBLE_MID_SHARE = 0.35;
export const AFTER_BUBBLE_MID = 1.5;

// --- act 3 drawing fixes (2026-10-20, the fix list's #13 and #14) ---
// The frame saw's rip teeth (render/after/stations.js, `millBlade`): a
// tooth's width out of the blade, in world grid cells (P), on each grid row
// down the blade, the pattern repeating. A grid cell is the least a tooth
// can be, so with the art at the grid's own size (config/after.js,
// AFTER_ART_SCALE; the owner, 2026-10-26: "machines at 1") a tooth is one
// cell out, a third of a body, every other row, and a stroke of one cell
// shows in the teeth.
export const AFTER_SAW_TEETH = [0, 1];

// --- track C: one carry (DESIGN.md, "One resource system for every act", section 4) ---
// A load the construction shack hands out at its door, as a cell value in a
// member's arms: the lightest shade, a unit of no kind, so it is counted by
// no pile and carried home by no gatherer. The shack's door is its one source.
export const AFTER_SITE_LOAD = 1;
