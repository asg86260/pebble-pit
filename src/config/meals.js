// The serpent eats to heal (DESIGN.md, "The serpent eats to heal"): its heal
// is banked as it accrues and lands in one lump when it swallows a creature
// that has swum in from the left. Times are seconds; the creatures
// themselves are drawn in render/fish.js.

// The wait from one meal to the next, chosen afresh each meal between the
// two so it is not a clock a player can count.
export let MEAL_MIN_S = 6;
export let MEAL_MAX_S = 12;
// A meal, back from its landing: the creature swims in, goes in the mouth,
// and the swallow runs to the belly, where the bank lands. The three add to
// less than MEAL_MIN_S, so a creature is never in the water before the last
// meal has landed.
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

export const MEAL_KNOBS = [
  { key: 'MEAL_MIN_S', label: 'meal wait, at least s', min: 4.9, max: 20, step: 0.5,
    get: () => MEAL_MIN_S, set: v => { MEAL_MIN_S = Math.min(v, MEAL_MAX_S); } },
  { key: 'MEAL_MAX_S', label: 'meal wait, at most s', min: 4.9, max: 30, step: 0.5,
    get: () => MEAL_MAX_S, set: v => { MEAL_MAX_S = Math.max(v, MEAL_MIN_S); } },
];

// The deep's stream (the owner's C, docs/mocks/deep-flow-2026-10-03.html): the
// eight creatures crossing the glass both ways at three depths, far to near --
// how big a cell is against the deep's own, how fast they cross (screen pixels
// a second), how much of the camera's pan they follow, and what share of the
// stream each depth is. One sets off every FLOW_EVERY_S on average, from off
// the glass. A giant crosses far behind everything every FLOW_GIANT_S.
export const FLOW_EVERY_S = 2.2;
export const FLOW_CELL = [0.35, 0.55, 0.85];
export const FLOW_SPEED = [14, 26, 42];
export const FLOW_PARALLAX = [0.25, 0.55, 0.85];
export const FLOW_SHARE = [0.45, 0.35, 0.2];
export const FLOW_MARGIN = 160;       // screen pixels off the glass a crossing starts and ends
export const FLOW_GIANT_S = 60;
export const FLOW_GIANT_SPEED = 9;
