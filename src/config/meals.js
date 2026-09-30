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
export const MEAL_SWIM_S = 3.4;
export const MEAL_GULP_S = 0.55;
export const MEAL_SWALLOW_S = 0.85;
// How far behind the mouth a creature starts its swim, in cells, and how much
// of the wait to the next meal it may start in.
export const MEAL_SWIM_CELLS = 44;
// The jaws start to open this long before the creature is at the mouth, and
// how wide they go, in cells at the tip.
export const MEAL_JAW_LEAD_S = 0.9;
export const MEAL_JAW_OPEN_S = 0.5;
export const MEAL_GAPE = 2.4;
// The swallow's swelling on the neck: its half length in cells and how far it
// stands off the hide, for a creature of length 1; a longer one swells more.
export const MEAL_SWELL_LEN = 2.6;
export const MEAL_SWELL = 1.6;
// The heal landing at the belly: a ring of purple running out along the hide
// and gone in this long.
export const MEAL_RING_S = 1.3;
export const MEAL_RING_REACH = 42;

export const MEAL_KNOBS = [
  { key: 'MEAL_MIN_S', label: 'meal wait, at least s', min: 4.9, max: 20, step: 0.5,
    get: () => MEAL_MIN_S, set: v => { MEAL_MIN_S = Math.min(v, MEAL_MAX_S); } },
  { key: 'MEAL_MAX_S', label: 'meal wait, at most s', min: 4.9, max: 30, step: 0.5,
    get: () => MEAL_MAX_S, set: v => { MEAL_MAX_S = Math.max(v, MEAL_MIN_S); } },
];
