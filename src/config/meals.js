// The serpent eats to heal (DESIGN.md, "The serpent heals whole: a phase is a
// window"): when a phase's window has run, it swallows the next creature to
// reach its mouth and heals to full. Times are seconds; the creatures
// themselves are drawn in render/fish.js.

// A meal, back from its landing: the creature swims in, goes in the mouth,
// and the swallow runs to the belly, where the heal lands. The three add to
// less than the shortest window (SERPENT_WINDOW), so a creature is never
// swimming in before the last meal has landed.
export const MEAL_SWIM_S = 2.8;
export const MEAL_GULP_S = 0.8;
export const MEAL_SWALLOW_S = 2.4;
// How far behind the mouth a creature starts its swim, in cells, and how much
// of the wait to the next meal it may start in.
export const MEAL_SWIM_CELLS = 44;   // at least: it starts off the glass if the glass reaches further
// The jaws (the owner's A, docs/mocks/heal-eat-2026-09-30.html): hinged this
// many cells back from the tip, they swing apart until each stands MEAL_GAPE
// cells off the mouth's line at the tip, starting this long before the
// creature is at the mouth; they shut as it is all in.
export const MEAL_JAW_LEAD_S = 0.7;
export const MEAL_JAW_OPEN_S = 0.5;
export const MEAL_JAW_SHUT_S = 0.25;
export const MEAL_GAPE = 5;
export const MEAL_HINGE = 10;
// A creature is squeezed to this share of its height by the time it is in.
export const MEAL_SQUEEZE = 0.55;
// The swallow's swelling on the neck: its half length in cells and how far it
// stands off the hide, for a creature of length 1; a longer one swells more.
export const MEAL_SWELL_LEN = 2.6;
export const MEAL_SWELL = 2.4;
// The heal landing (the owner's pick, B's crosses): purple crosses lift off
// the length of the body, the nearest the belly first, each rising
// MEAL_CROSS_RISE cells over MEAL_CROSS_S as it fades; gone in MEAL_AURA_S.
export const MEAL_AURA_S = 1.8;
export const MEAL_CROSSES = 60;
export const MEAL_CROSS_S = 0.6;
export const MEAL_CROSS_RISE = 8;

// The meal's knobs are the windows' (SERPENT_WINDOW, config/deep.js).
export const MEAL_KNOBS = [];

// The deep's stream (the owner's C, docs/mocks/deep-flow-2026-10-03.html): the
// eight creatures crossing the glass both ways at three depths, far to near --
// how big a cell is against the deep's own, how fast they cross (screen pixels
// a second), how much of the camera's pan they follow, and what share of the
// stream each depth is. One sets off every FLOW_EVERY_S on average, from off
// the glass. A giant crosses far behind everything every FLOW_GIANT_S.
export const FLOW_EVERY_S = 24;
export const FLOW_CELL = [0.35, 0.55, 0.85];
export const FLOW_SPEED = [5, 9, 14];
export const FLOW_PARALLAX = [0.25, 0.55, 0.85];
export const FLOW_SHARE = [0.55, 0.45, 0];   // the near depth is the world's stream, below
export const FLOW_MARGIN = 160;       // screen pixels off the glass a crossing starts and ends
export const FLOW_GIANT_S = 300;   // longer than its crossing (the glass and twice the margin, at FLOW_GIANT_SPEED)
export const FLOW_GIANT_SPEED = 6;
// The near creatures swim the world, not the glass, so the serpent can take
// one that is passing (DESIGN.md, "The serpent eats to heal"): one sets off
// every FLOW_NEAR_EVERY_S from FLOW_NEAR_OUT beyond a wall of the deep, at
// FLOW_NEAR_SPEED world pixels a second, somewhere in the FLOW_NEAR_BAND over
// the coil's middle. Dense enough that one is always near the mouth when a
// meal is due.
export const FLOW_NEAR_EVERY_S = 14;
export const FLOW_NEAR_SPEED = 24;
export const FLOW_NEAR_AWAY = 4;       // every this-many-th swims away from the mouth
export const FLOW_NEAR_JITTER = 0.4;   // how far a start strays from its slot
export const FLOW_KINDS = 8;           // the creatures render/fish.js draws
export const FLOW_NEAR_OUT = 200;
export const FLOW_NEAR_BAND = 150;
