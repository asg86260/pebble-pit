// --- between rocks ----------------------------------------------------------
// The last pixel of a boulder is the end of a long job, so it gets a beat. The
// crew take five on the bare ground, and the next rock comes down out of the sky
// rather than being there the next time you look.
export let DANCE_MS = 5000;    // how long the crew celebrate a finished rock
// Hops a second at the base rate, which each move then takes its own multiple of
// -- see MOVES in crew.js. It was 2.6, which is a bounce every three hundred and
// eighty milliseconds: too quick to read as a body doing something and quick
// enough to read as a body juddering. A dance you can count is a dance.
//
// Then it was 1.5, and it was still not a dance you could count: the moves take
// their own multiples of this and the quick ones are over one, so the hop and
// the spin came out at two and a half a second measured off the running game --
// a body crossing three cells, which is its own height, and back, twice a
// second. That is a wing beat, not a celebration. This is the number the crew
// are actually counted at: the quick moves land a shade over one a second, which
// is a body jumping for joy, and the step half that.
// ...and 0.9 was too slow from the other side: at a beat a second a body hangs
// at the top of a hop and drifts down out of it, which reads as floating rather
// than as jumping. People bounce when they are pleased; they do not levitate.
// Half again as fast puts the quick moves near one and a half a second, still
// well under the `DANCE_BUZZ` pace that reads as a fault.
export const DANCE_BEAT = 1.4;
// How fast a dancing body travels, in world pixels a frame at the tuned rate --
// the same units every other pace in this file is in, so it is comparable with
// them: a brisk amble, quicker than loitering (IDLE_PACE) and well under a
// commute. It used to be six hundredths of a cell a frame with no frame time in
// it at all, which is a thirtieth of this and got slower the better your screen.
// And the ground it covers keeps up: a body bouncing quicker on the spot while
// still ambling between marks at the old stroll is two speeds in one animation.
export const JIG_PACE = 2.3;
// The pace at which a bouncing body stops reading as pleased with itself and
// starts reading as faulty. Measured rather than felt: at two and a half
// crossings of its own height a second the yard looked like it was buzzing,
// which is what the first two versions of this dance were. Named here so the
// check that guards it can move with the tempo instead of pinning a number that
// was right for one value of `DANCE_BEAT`.
export const DANCE_BUZZ = 2.5;
// How far up a new rock starts. It used to be this number flat, and this number
// is most of the way up a window rather than off the top of one -- so the rock
// appeared out of nothing in the middle of the sky and fell the second half of
// the way. It comes in over the top edge now, which means the drop is measured
// against the window rather than being one number: a tall window has to be
// cleared by more than a short one. This is the least it will ever be, for a
// window so short that the top edge is nearer than this.
export const ROCK_DROP = 620;    // world pixels above its place that a new rock starts
export const ROCK_DROP_CLEAR = 72;  // and how far above the top edge it waits, out of sight
// How long a body stays pointed at after you pick its name off the house board.
// Long enough to find it on a screen with a dozen of them moving, short enough
// that it is gone before you have stopped looking for it.
export const POINT_MS = 3200;

export const DROP_GRAV = 0.7;    // a boulder comes down heavier than a chip does
export const JOLT_GRAINS = 30;   // grains the landing shakes off the banks
// And the view is knocked about by it. A rock coming down out of the sky used
// to arrive in silence: a few grains hopped off the banks and nothing else in
// the yard admitted anything had happened. The view rocks and settles, which is
// the only thing in the game that says how heavy the thing is.
export let SHAKE_LAND = 15;      // world pixels the landing throws the view
export const SHAKE_RATE = 0.9;   // radians a frame it rocks through
export const SHAKE_DECAY = 0.87; // and how much of the throw is left each frame
// Nothing is standing under it when it lands. The crew get out of the footprint
// while the last rock's celebration is on, and a body still in it once the rock
// is in the air walks out at a pace nobody walks anywhere else.
export const DUCK_PACE = 2.4;    // pixels a frame out from under a falling rock
// A stopped crew is not a frozen crew. When the pile is full the rock hands stand
// down and shift about on the spot -- slowly, and nothing like the dance, which
// is a hop a second and goes places.
export const IDLE_BEAT = 0.9;    // radians a second a stood-down rockhand sways through
export const IDLE_STRIDE = 0.37; // and how much slower it paces than it sways

// What a rockhand's body does on top of the ground it is standing on. Both ride
// over `climbTo`'s answer rather than into it -- they are what the body is
// doing, and easing them would damp them into nothing -- so they are also the
// two things that can move a rockhand further in one frame than a climb can.
//
// That makes them the bound `route.test.mjs` holds the walk over the hill to.
// It held it to a typed 12, which is a number nobody could have derived: a
// climb is a cell a frame and the drive alone is nearly a cell and a half, so
// the real ceiling was always over fourteen and the check was passing on the
// margin the yard's layout happened to leave. Moving the shack closed that
// margin and it read 13. A bound worth asserting comes out of the numbers that
// produce it.
export const SWING_BOB = 1.2;    // pixels either way a working rockhand rocks through
export const SWING_DRIVE = 1.4;  // cells a swing drives the body down at full lunge

// --- breaks -------------------------------------------------------------------
// What a body does during the standing about. None of it makes, spends or moves
// anything, and none of it ever happens to somebody who was working: a break is
// only ever taken by a body that had already stopped. See break.js.
//
// The gap between them is long, and most of the time nothing happens at all. A
// yard where everybody is always smoking is a yard where nobody is ever just
// standing there, and the standing there is the thing this is decorating rather
// than replacing -- so a body that has been about a while gets a *chance* at a
// break rather than a turn at one, and a stopped crew is mostly a stopped crew
// with one of them, now and then, doing something.
export const BREAK_WAIT = 24000;  // typical gap before a stood-about body gets a turn
export const BREAK_ODDS = 0.35;   // and how often a turn comes to anything
export const BREAK_LIFE = 6000;   // roughly how long one lasts
export const BREAK_BEAT = 900;    // between a puff, a note or a word
export const BREAK_NEAR = 96;     // world pixels: how far a conversation carries

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const ROCK_KNOBS = [
  { key: 'DANCE_MS', label: 'the dance', min: 0, max: 12000, step: 250,
    get: () => DANCE_MS, set: v => { DANCE_MS = v; } },
  { key: 'SHAKE_LAND', label: 'landing shake', min: 0, max: 40, step: 1,
    get: () => SHAKE_LAND, set: v => { SHAKE_LAND = v; } }
];

// --- wave7-ui -----------------------------------------------------------------
// The pickaxe ladder: three rungs, each worth a whole pixel of bite. The eased
// fractional curve read as noise on the row ("1.4 -> 1.7 px"); a whole pixel a
// rung is a purchase you can see land, so there are fewer rungs and each is
// dearer -- see rows-rock.js, where the bases are eight times what they were.
export const ROCKHAND_RUNGS = 3;
