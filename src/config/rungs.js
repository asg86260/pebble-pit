// What each count ladder reads at each rung, written down.
//
// A count used to be a whole unit a rung -- one pixel, one grain, one spore --
// so every count ladder was a straight line, and the player asked for each
// rung to be worth more than the last: carry 1, 2, 4, 6, 10; the pick 1, 2,
// 4, 8. The three examples given were three different curves, and at four
// rungs a curve rounded to whole units cannot be told from a list -- and
// cannot be made to say the numbers the player has in mind. So a list it is:
// rung nought first, then a value a rung, the last of them the top. See
// DESIGN.md, "A rung is a step up, not a step along".
//
// Every list is one longer than `LADDER` -- a value for standing at the foot
// and one for each rung -- and test/ladders.test.mjs says so, so a list a
// rung short is a red check rather than a ladder that stops early. The last
// entry is the spark rung's, on the bench as at the grounds: every ladder is a
// rung a coin, dust, then spore, then shard, then everything.
//
// The rates -- the swings, the walks, tending, the cut's pace -- are not here.
// They ease from a base to a top over the ladder and already climb faster
// each rung, being kept in milliseconds and read per second.
//
// Each entry is a dial in the ladder book (ladders.html) and on the dev
// panel: `RUNG_KNOBS` below hands a knob a rung to `TUNABLE`.

export const CARRY_PX = [1, 2, 4, 6, 10];     // pixels you can carry
export const PICK_PX = [1, 2, 4, 8, 12];      // pixels your own swing takes
export const ROCKHAND_PX = [1, 2, 3, 5, 8];   // pixels a rockhand's swing takes
export const HAUL_LOAD = [1, 3, 6, 10, 16];   // grains a hauler carries
export const CROP_SPORES = [1, 2, 4, 6, 10];  // spores a cut off a ripe plot
export const SEAM_SHARE = [1, 1.5, 2, 3, 4];  // a dig's share of the handful a bench
export const DOSES = [1, 2, 3, 5, 8];         // bodies a brew reaches
export const CRIT_MULT = [3, 4, 5, 6, 8];     // what a crit is worth, in units of work

// A list read at a rung: the foot below nought, the top past the end. A save
// from a longer ladder reads as the top rather than as a rung nothing agrees
// with, the same clamp every ladder makes on read.
export const rungValue = (list, lvl) => list[Math.max(0, Math.min(list.length - 1, lvl | 0))];

const LISTS = {
  CARRY_PX: ['carry', CARRY_PX], PICK_PX: ['your pick', PICK_PX],
  ROCKHAND_PX: ['digger pick', ROCKHAND_PX], HAUL_LOAD: ['hauler load', HAUL_LOAD],
  CROP_SPORES: ['spores a cut', CROP_SPORES], SEAM_SHARE: ['a dig, share', SEAM_SHARE],
  DOSES: ['doses a brew', DOSES], CRIT_MULT: ['crit damage', CRIT_MULT]
};

// A knob a rung, for the ladder book and the dev panel. The key names the
// list and the rung -- `CARRY_PX[2]` -- so what the book copies out reads as
// the line to change.
export const RUNG_KNOBS = Object.entries(LISTS).flatMap(([key, [label, list]]) =>
  list.map((_, i) => ({
    key: `${key}[${i}]`, label: `${label}, rung ${i}`,
    min: 0, max: 200, step: key === 'SEAM_SHARE' ? 0.25 : 1,
    get: () => list[i], set: v => { list[i] = v; }
  })));
