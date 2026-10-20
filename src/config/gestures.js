// --- act 3: the hand work, a motion a station -------------------------------------
// Track B of the act-3 build (docs/mocks/act3-gestures-2026-10-18, the owner's
// "lets build it. we can refine later"). Every station is worked by its own
// motion, and the faster the motion the faster the work, up to a cap; only
// two crits stay, both moments of timing: the pedestal's big bubble and the
// stump's yank. Every number below is the mock's own guess, carried over in
// world pixels and seconds for the pace tool to move.
import { P } from './yard.js';
import { AFTER_ART_SCALE } from './after.js';

// The ghost hand: shown until the motion has been done this many times, faded
// over GESTURE_CUE_FADE_S, at this share of full ink; back after a station
// has stood unworked GESTURE_CUE_IDLE_S (a default the mock does not give).
export const GESTURE_CUE_USES = 3;
export const GESTURE_CUE_FADE_S = 0.8;
export const GESTURE_CUE_ALPHA = 0.6;
export const GESTURE_CUE_IDLE_S = 120;
// A crit's mark: the star held, then faded; the figure held longer.
export const GESTURE_STAR_HOLD_S = 0.3;
export const GESTURE_STAR_FADE_S = 0.3;
export const GESTURE_MARK_HOLD_S = 0.55;
export const GESTURE_MARK_FADE_S = 0.45;

// Every part's grab zone reaches this far past the part drawn, so a part is
// easy to take hold of at the yard's scale (the owner, 2026-10-18).
export const GESTURE_GRAB_SLACK = P;

// The pedestal: a click on a rising speech bubble pops it; the big one pays
// this many lines. A click lands within this slack of a bubble's box.
export const GESTURE_BUBBLE_CRIT = 5;
export const GESTURE_BUBBLE_SLACK = P;

// A tree: the two-person saw across its trunk. The handle travels this far
// either side, no faster than the saw's top speed (px a second), following
// the pointer at this rate; a stroke ends past this share of the travel.
// The travel and the speed are the trunk's art cells, so they grow with it.
export const GESTURE_SAW_AMP = P * 5 * AFTER_ART_SCALE;
export const GESTURE_SAW_VMAX = 220 * AFTER_ART_SCALE;
export const GESTURE_SAW_FOLLOW = 25;
export const GESTURE_SAW_END = 0.8;
export const GESTURE_SAW_EASE = 8;

// A stump: dragged up, a pixel of lift for every 1 / GESTURE_STUMP_DRAG of drag,
// to GESTURE_STUMP_MAX; it follows at this rate and sinks back at this speed
// let go. Held up past the strain height a root snaps every GESTURE_STRAIN_S
// (no crit: the owner, 2026-10-18).
export const GESTURE_STUMP_DRAG = 0.5;
export const GESTURE_STUMP_MAX = P * 3.5;
export const GESTURE_STUMP_FOLLOW = 20;
export const GESTURE_STUMP_SINK = 40;
export const GESTURE_STRAIN_LIFT = P * 2;
export const GESTURE_STRAIN_S = 0.7;

// The saw mill's flywheel: turns a second it counts to at most, the log fed
// a turn, the length of a log, how fast its speed follows the hand, how
// slowly it coasts let go, and the least speed that still cuts.
export const GESTURE_WHEEL_MAX_REV = 2;
export const GESTURE_WHEEL_FEED = 1.6;
export const GESTURE_WHEEL_LOG = 12;
export const GESTURE_WHEEL_EASE = 8;
export const GESTURE_WHEEL_COAST = 0.5;
export const GESTURE_WHEEL_MIN_REV = 0.1;

// The chipper (docs/mocks/act3-chipper-2026-10-18, the chosen control): a
// log dragged into the jaws, then the slot-machine arm pulled down this far
// and held past the share given; while it is held the log feeds at one
// steady speed, cells a second, a log this many cells. Let go, the arm comes
// back up a held pose at a time, a pose every GESTURE_ARM_SPRING_S, and the
// jaws stop.
export const GESTURE_ARM_PULL = P * 6;
export const GESTURE_ARM_HOLD = 0.85;
export const GESTURE_ARM_FEED = 1.4;
export const GESTURE_ARM_LOG = 6;
export const GESTURE_ARM_POSES = 3;
export const GESTURE_ARM_SPRING_S = 0.06;

// The paper mill's vat, stirred: turns a second it counts to at most, turns
// a batch, how fast its speed follows the hand, how fast it stops let go.
export const GESTURE_STIR_MAX_REV = 1.2;
export const GESTURE_STIR_TURNS = 6;
export const GESTURE_STIR_EASE = 6;
export const GESTURE_STIR_COAST = 2;

// The workshop (docs/mocks/act3-workshop-2026-10-18): four nails a sign, two
// taps each (half, then flush), a tap no closer than the swing; a tap off a
// nail does nothing. Once the hand has stopped this long, the joiner at the
// bench taps on its own, at a sign every AFTER_SIGN_S.
export const GESTURE_NAILS = 4;
export const GESTURE_NAIL_TAPS = 2;
export const GESTURE_SWING_S = 0.12;
export const GESTURE_JOINER_WAIT_S = 1.5;

// The press: the bar pulled down by a drag this long, its pull a share a
// second at most, sprung back up at this rate let go; it prints past the
// first share and is set again below the second.
export const GESTURE_BAR_DRAG = P * 8;
export const GESTURE_BAR_RATE = 5;
export const GESTURE_BAR_RETURN = 2.2;
export const GESTURE_BAR_PRINT = 0.97;
export const GESTURE_BAR_RESET = 0.15;
export const GESTURE_BAR_EASE = 8;

// The sawdust heap: a load dragged to the edge tips there; flung toward it
// at least GESTURE_FLING_MIN px a second it flies, and the faster up to
// GESTURE_FLING_MAX the more loads go with it, up to GESTURE_FLING_LOADS. The
// fling is read over the last GESTURE_FLING_WINDOW_S of the drag; a flung load
// falls under this gravity, thrown up this fast, and a load let go short of
// the edge fades back onto the heap over GESTURE_LOAD_FADE_S.
export const GESTURE_FLING_MIN = 80;
export const GESTURE_FLING_MAX = 300;
export const GESTURE_FLING_LOADS = 3;
export const GESTURE_FLING_WINDOW_S = 0.1;
export const GESTURE_FLING_GRAV = 400;
export const GESTURE_FLING_LIFT = 90;
export const GESTURE_LOAD_FADE_S = 0.4;

// The pad (the mock's pad lines): a press of A on the stump lifts it this
// much; the stick's turn counts a stir or a spin past this much push; a flick
// toward the heap's edge is read off its furthest push.
export const GESTURE_PAD_PULL = P * 2;
export const GESTURE_PAD_TURN = 0.5;

// The cue's own drawing (render/aftercues.js): its
// pixel, finer than a cell, as the hand is a pointer over the part and not a
// thing in it; one motion of the ghost hand, and one tap of it.
export const GESTURE_CUE_DOT = 2;
export const GESTURE_CUE_LOOP_S = 1.4;
export const GESTURE_CUE_TAP_S = 0.4;
