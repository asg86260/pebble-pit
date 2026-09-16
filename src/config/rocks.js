// --- between rocks ----------------------------------------------------------
// The last pixel of a boulder is the end of a long job, so it gets a beat. The
// crew take five on the bare ground, and the next rock comes down out of the
// sky rather than being there the next time you look.
export let DANCE_MS = 5000;    // how long the crew celebrate a finished rock
// Hops a second at the base rate, which each move then takes its own multiple
// of (MOVES in crew.js). The quick moves land near one and a half a second,
// well under the `DANCE_BUZZ` pace that reads as a fault; slower and a body
// hangs at the top of a hop and drifts down, which reads as floating.
export const DANCE_BEAT = 1.4;
// How fast a dancing body travels, in world pixels a frame at the tuned rate,
// the same units as every other pace here: a brisk amble, quicker than
// loitering (IDLE_PACE) and well under a commute. It keeps up with the bounce,
// or a body bouncing quick while strolling between marks is two speeds in one
// animation.
export const JIG_PACE = 2.3;
// The pace at which a bouncing body stops reading as pleased with itself and
// starts reading as faulty, in crossings of its own height a second. Measured
// rather than felt, and named so the check that guards it can move with the
// tempo instead of pinning a number right for one value of `DANCE_BEAT`.
export const DANCE_BUZZ = 2.5;
// How far up a new rock starts. It comes in over the top edge, so the drop is
// measured against the window; this is the least it will ever be, for a
// window so short that the top edge is nearer than this.
export const ROCK_DROP = 620;    // world pixels above its place that a new rock starts
export const ROCK_DROP_CLEAR = 72;  // and how far above the top edge it waits, out of sight
// How long a body stays pointed at after you pick its name off the house board.
// Long enough to find it on a screen with a dozen of them moving, short enough
// that it is gone before you have stopped looking for it.
export const POINT_MS = 3200;

export const DROP_GRAV = 0.7;    // a boulder comes down heavier than a chip does
export const JOLT_GRAINS = 30;   // grains the landing shakes off the banks
// The view rocks and settles under a landing, which is the only thing in the
// game that says how heavy the thing is.
export let SHAKE_LAND = 15;      // world pixels the landing throws the view
export const SHAKE_RATE = 0.9;   // radians a frame it rocks through
export const SHAKE_DECAY = 0.87; // and how much of the throw is left each frame
// And so does the crew. The hop is one parabola over the beat below; the
// height is in cells and is scaled by the same rock-size factor the shake is.
// It is drawn, not simulated -- `w.y` never moves, so the walk, the falls and
// the drop zone see nothing -- which is why a hop can be this short and still
// never leave a body somewhere it did not walk to.
export let LAND_HOP_MS = 240;    // how long a body is off its feet after a landing
export let LAND_HOP_H = 1.5;     // cells the hop peaks at, for a first-sized rock
// Nothing is standing under it when it lands. After every rock but the first
// the next is on its way the moment the footprint is empty, so the crew *run*
// out of it -- a pace nobody moves at anywhere else.
export const DUCK_PACE = 6;      // pixels a frame out from under a falling rock
// How long the yard waits for them before the rock comes anyway: the rock is
// made the frame the footprint is clear, and this is the backstop for a body
// that cannot get out, kept short because the gap between rocks is dead air.
export const ROCK_GAP_MS = 1000;
// How fast a rockhand shuffles along the layer it is working, between swings.
// Not a walk: a hand that is off the layer walks back to it at COMMUTE_PACE.
// A faster shuffle has the whole gang mosey the width of the hill to the last
// few cells, a wait that reads as the rock being finished.
export const ROCKHAND_WALK = 0.5;   // pixels a frame along the row
// A stopped crew is not a frozen crew. When the pile is full the rock hands
// stand down and shift about on the spot, slowly and nothing like the dance.
export const IDLE_BEAT = 0.9;    // radians a second a stood-down rockhand sways through
export const IDLE_STRIDE = 0.37; // and how much slower it paces than it sways

// What a rockhand's body does on top of the ground it is standing on. Both
// ride over `climbTo`'s answer rather than into it (easing them would damp
// them into nothing), so they are the two things that can move a rockhand
// further in one frame than a climb can, and the bound `route.test.mjs` holds
// the walk over the hill to comes out of them rather than a typed number.
export const SWING_BOB = 1.2;    // pixels either way a working rockhand rocks through
export const SWING_DRIVE = 1.4;  // cells a swing drives the body down at full lunge

// --- breaks -------------------------------------------------------------------
// What a body does during the standing about. None of it makes, spends or
// moves anything, and none of it ever happens to somebody who was working. See
// break.js. A body that has been about a while gets a *chance* at a break
// rather than a turn at one, so a stopped crew is mostly a stopped crew with
// one of them, now and then, doing something.
export const BREAK_WAIT = 24000;  // typical gap before a stood-about body gets a turn
export const BREAK_ODDS = 0.35;   // and how often a turn comes to anything
export const BREAK_LIFE = 6000;   // roughly how long one lasts
export const BREAK_BEAT = 900;    // between a puff, a note or a word
export const BREAK_NEAR = 96;     // world pixels: how far a conversation carries

// The dev panel's rows for the knobs above, beside the bindings because an
// imported `let` is read-only; config.js gathers every file's rows into TUNABLE.
export const ROCK_KNOBS = [
  { key: 'DANCE_MS', label: 'the dance', min: 0, max: 12000, step: 250,
    get: () => DANCE_MS, set: v => { DANCE_MS = v; } },
  { key: 'SHAKE_LAND', label: 'landing shake', min: 0, max: 40, step: 1,
    get: () => SHAKE_LAND, set: v => { SHAKE_LAND = v; } },
  { key: 'LAND_HOP_MS', label: 'landing hop', min: 0, max: 1000, step: 20,
    get: () => LAND_HOP_MS, set: v => { LAND_HOP_MS = v; } },
  { key: 'LAND_HOP_H', label: 'landing hop height', min: 0, max: 4, step: 0.25,
    get: () => LAND_HOP_H, set: v => { LAND_HOP_H = v; } }
];
