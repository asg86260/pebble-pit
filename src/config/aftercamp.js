// --- act 3: the camp, hand work in the world (track A, 2026-10-18) ---------------
// docs/wave-act3-build.md, track A: the stations worked by dragging their own
// moving parts where they stand, the empty sites and the carry that raises a
// station. Every number below is a voted mock's own guess, carried over in
// world pixels and seconds, for the pace tool to move.
import { P } from './yard.js';

// --- how a station went up before 2026-11-10 ---
// Read only by the migration that read a save of those days
// (2026-10-28-no-stock.js): a station was raised in AFTER_BUILD_PIECES bands
// (config/after.js) of this many loads each. It is built on the yard's works
// now (DESIGN.md, "Act 3 builds through the yard's construction").
export const AFTER_BUILD_A_BAND = 2;       // loads a band took


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
// What a save of 2026-10-28 (v32) kept in a builder's arms for a site's load: a
// grain. Since v33 a load is a unit of its own kind (config/blocks.js, `load`);
// the migration that turns one into the other reads this.
export const AFTER_SITE_LOAD = 1;
