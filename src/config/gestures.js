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

// The stump as drawn (render/after/pine.js), a rigid block that never
// stretches, on the sim's own lift, strain and roots above. A rope from the
// stump's top to the hand, this many px wide, bowed out this many art cells
// when slack and straightening in this many held poses as the lift nears the
// strain height; faded in and out on the grab over this long.
export const STUMP_ROPE_W = 4;
export const STUMP_ROPE_SLACK = 1.5;
export const STUMP_ROPE_POSES = 3;
export const STUMP_ROPE_FADE_S = 0.15;
// Under strain the stump rocks in its hole, a held
// tilt (degrees) per share of each strain, tipped on the corner it leans to;
// a root given lifts it this many art px, risen over STUMP_RISE_S. Out, it
// rips up this many art cells over STUMP_RIP_S, eased, turned to the throw
// angle, held STUMP_HANG_S, and fades over STUMP_GONE_FADE_S.
export const STUMP_ROCK_DEG = [0, -3, 0, 3, -2, 2];
export const STUMP_GIVE = 2;
export const STUMP_RISE_S = 0.15;
export const STUMP_RIP_UP = 3;
export const STUMP_RIP_S = 0.18;
export const STUMP_THROW_DEG = 6;
export const STUMP_HANG_S = 0.2;
export const STUMP_GONE_FADE_S = 0.5;
// What comes up with it: clods of soil thrown as it rips, up at
// these speeds (px a second) under this gravity, fading over STUMP_CLOD_S;
// the hole left, fading over STUMP_HOLE_S; the sapling set in the hole only
// once the stump has gone, STUMP_SAPLING_WAIT_S after it came out.
export const STUMP_CLODS = 6;
export const STUMP_CLOD_V = [90, 170];
export const STUMP_CLOD_SPREAD = 70;
export const STUMP_CLOD_GRAV = 600;
export const STUMP_CLOD_S = 0.6;
export const STUMP_HOLE_S = 1.6;
export const STUMP_SAPLING_WAIT_S = 0.9;

// The saw mill's flywheel: turns a second it counts to at most, the log fed
// a turn, the length of a log, how fast its speed follows the hand, how
// slowly it coasts let go, and the least speed that still cuts.
export const GESTURE_WHEEL_MAX_REV = 2;
export const GESTURE_WHEEL_FEED = 1.6;
export const GESTURE_WHEEL_LOG = 12;
export const GESTURE_WHEEL_EASE = 8;
export const GESTURE_WHEEL_COAST = 0.5;
export const GESTURE_WHEEL_MIN_REV = 0.1;


// The workshop (docs/mocks/act3-workshop-2026-10-18): four nails a sign, two
// taps each (half, then flush), a tap no closer than the swing; a tap off a
// nail does nothing. Once the hand has stopped this long, the joiner at the
// bench taps on its own, at a sign every AFTER_SIGN_S.
export const GESTURE_NAILS = 4;
export const GESTURE_NAIL_TAPS = 2;
export const GESTURE_SWING_S = 0.12;
export const GESTURE_JOINER_WAIT_S = 1.5;


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

// The same hand again while the pointer is over a part (DESIGN.md, "Act 3's
// goods are blocks", rule 3): at GESTURE_CUE_HOVER of the cue's own ink, so it
// reads as a reminder rather than the first lesson, faded in and out over
// GESTURE_HOVER_S; gone the moment the part is taken hold of.
export const GESTURE_CUE_HOVER = 0.6;
export const GESTURE_HOVER_S = 0.4;
