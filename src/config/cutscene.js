// --- the cutscenes --------------------------------------------------------------
// The one-time beats are watched: the camera goes to the event, the moment
// plays, the camera comes back. One mechanism (src/cutscene.js) owns the
// camera for the length of a scene; any click skips. No scene zooms (the
// owner's C): the camera glides and holds at the yard's own size. Times are
// wall seconds.
export const CUT_TEAR_S = 6;         // how long the tearing is watched
export const CUT_DROWN_S = 5;        // the drowning runs longer than its gulp, and no longer than its pool takes to read
// The snatch, watched from the plank (DESIGN.md, "From the rescue straight into
// the snatch"), for as long as it plays.
export const CUT_SNATCH_MAX_S = 40;
export const CUT_SNATCH_TAIL_S = 0.5;
// A shield's answer has no length of its own (the net pays out for as long as
// its rate takes, the dome's first hold waits on somebody's walk), so the scene
// ends on the fact plus a tail to see the wreck fly, under a ceiling that is a
// safety and never the design.
export const CUT_SHIELD_TAIL_S = 3;   // after the answer, so the wreck is seen going out along the heap
export const CUT_SHIELD_MAX_S = 30;  // and never longer than this, whatever the answer does
// Letting go. The seat stays on the event, and the yard comes back around it
// over this stretch.
export const CUT_OUT_S = 1.5;
// The first trip down follows her charge at this share of the way a frame
// (abyssintro.js).
export const CUT_GLIDE = 0.12;

// Every scene ends early under a held space bar (src/skip.js). Held, not
// pressed: a tap is the accident of a hand resting on the keyboard. Measured
// on the game's clock, so it does not run down while the yard is held.
export const SKIP_HOLD_MS = 700;

// The first muck (DESIGN.md, "The first muck's scene"): the first body to go
// for the weather's muck after the first storm that left any, watched on its
// last stretch, asking what it is ("?"), not liking it (the yuck), and
// shovelling it up. Short on purpose: the walk in frame is the last
// CUT_MUCK_NEAR cells and every hold below is a beat, not a pause.
export const CUT_MUCK_NEAR = 40;      // cells off its patch when the camera goes to the body
export const CUT_MUCK_LEAD = 0.25;    // the patch sits this share of the frame off center, away from the walker
export const CUT_MUCK_ASK_S = 0.9;    // the "?" over its head, stood at the patch
export const CUT_MUCK_YUCK_S = 1.1;   // then the yuck
export const CUT_MUCK_FADE_S = 0.4;   // a shovelled cell going, in CUT_MUCK_FADE_STEPS held steps
export const CUT_MUCK_FADE_STEPS = 4;
export const CUT_MUCK_TAIL_S = 0.2;   // after the patch is clear and faded, before letting go
export const CUT_MUCK_MAX_S = 10;     // a ceiling, never the design
// Nobody whose job it is has gone for it this long after the storm: one of
// the gang is sent off the rock for the one patch, and walks back after.
export const CUT_MUCK_WAIT_S = 1.5;
// and its patch at least this many cells from it, so the walk over is seen
// rather than a step off the rock's edge
export const CUT_MUCK_PULL_CELLS = 30;

// The snatch's portal waits for the bystanders to have faded out of the
// frame (src/stage.js), never longer than this: nothing may hold the story.
export const STAGE_WAIT_S = 8;

// The first trip down (DESIGN.md, "The first trip down", voted A in
// docs/mocks/abyss-intro-2026-10-12.html): the camera pushes in on him in the
// cage, he calls, it pulls back to her under the portal, she answers,
// charges down to the coil over her station and throws her first blow there.
// The pulls are steps over the deep's own fit, the framing `stepView` holds.
export const ABYSS_CLOSE = 2;         // pushed in on the belly
export const ABYSS_WIDE = 1.25;       // pulled back on her under the portal
export const ABYSS_PUSH_S = 1.2;      // the glide and push onto the belly
export const ABYSS_CALL_S = 1.4;      // held on him, hopping against the ribs
export const ABYSS_HOP_S = 0.25;      // a hop up and a hop down, held each
export const ABYSS_WAIT_S = 3;        // more of him while she is still on her way to the portal, at most
export const ABYSS_WIDE_S = 1;        // the pull back to her
export const ABYSS_ANSWER_S = 0.2;    // into the pull back, she answers
export const ABYSS_MARK_S = 1.1;      // how long a mark stands over a head
export const ABYSS_SWIM_K = 2.5;      // her swim to the portal spot, a hurried share of the swim
export const ABYSS_UNDER = 3;         // cells under the portal's ring she waits at
// The charge is stepped in held poses, each a stride under a body's width so
// no step is a jump.
export const ABYSS_CHARGE_POSE_S = 0.05;
export const ABYSS_CHARGE_PX_S = 330;
export const ABYSS_IMPACT_S = 0.45;   // held on the impact once her blow has landed
export const ABYSS_BLOW_MAX_S = 2.5;  // waiting on her blow, at most
export const ABYSS_BAR_IN_S = 0.45;   // the serpent's bar fading back as the camera lets go
export const ABYSS_MAX_S = 20;        // a ceiling, never the design

// --- held still, letterboxed (the owner's C, docs/mocks/cutscene-focus-2026-10-12.html)
// While a scene holds the yard, flat black bands step in at the top and the
// foot of the window, CUT_BAND_CELLS cells at full, a cell a step; everything
// the scene is not about settles to CUT_RECEDE_INK of its ink over
// CUT_SETTLE_S, the sky and the machines slowing to a stop with it; and the
// camera glides to the scene's spot on an ease over the same stretch and
// holds there. Letting go is CUT_OUT_S, the same in reverse.
export const CUT_BAND_CELLS = 6;
export const CUT_RECEDE_INK = 0.35;
export const CUT_SETTLE_S = 1.6;
