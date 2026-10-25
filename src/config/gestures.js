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

// --- act 3's hand work, shown in the world (DESIGN.md, "Act 3's hand work and
// hand carrying", take B, the owner's vote 2026-10-20) ----------------------
// The ghost of the motion: a dotted path round the part, a dot a game cell,
// HANDWORK_DOTS of them, a cell of ink running along them HANDWORK_DOT_RUN
// dots a second, the path HANDWORK_PATH_OUT outside the part's own reach;
// one loop of the hand every HANDWORK_HINT_LOOP_S, pointing for the first
// HANDWORK_HINT_POINT of it, then grabbing and playing the motion. It fades
// over HANDWORK_HINT_S, out once the part is being worked and back once it
// stands still: below HANDWORK_IDLE_SPEED of its cap it is not.
export const HANDWORK_DOTS = 28;
export const HANDWORK_DOT_RUN = 12;
export const HANDWORK_PATH_OUT = P * 2;
export const HANDWORK_HINT_LOOP_S = 2.6;
export const HANDWORK_HINT_POINT = 0.3;
export const HANDWORK_HINT_S = 0.4;
export const HANDWORK_IDLE_SPEED = 0.05;
// The hint's hand, the cue's own drawing (render/aftercues.js, HAND) at a
// game cell a pixel, as the mock drew it.
export const HANDWORK_HAND_DOT = P;
// The chipper's ghost: the log's arc off the pile into the jaws this high
// over the straight line, and its share of the loop's grab before the arm.
export const HANDWORK_LOG_ARC = P * 8;
export const HANDWORK_LOG_SHARE = 0.5;
// The strip under the station: HANDWORK_STRIP_DROP under the floor line,
// HANDWORK_STRIP_H deep, its segments a game cell apart, on a paper rim; the
// verb's tag under it, its type HANDWORK_TAG_PX, padded a cell. It fades over
// HANDWORK_STRIP_S, and a finished unit holds full for HANDWORK_DONE_S.
export const HANDWORK_STRIP_DROP = P * 2;
export const HANDWORK_STRIP_H = P * 2;
export const HANDWORK_TAG_PX = 18;
export const HANDWORK_TAG_PAD = P;
export const HANDWORK_STRIP_S = 0.3;
export const HANDWORK_DONE_S = 0.8;
