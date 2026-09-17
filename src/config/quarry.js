import { P } from './yard.js';

// The bridge over the quarry: a ramp up, a flat deck over the mouth, a ramp
// down, and the crew walk every bit of it. A rise of four cells over a run of
// eleven is 19.98 degrees, as close to twenty as this lattice gets with both
// ends on a whole cell. Here rather than in world.js because the yard's
// spacing has to know how far the near ramp reaches (`KIT_OUT` in sites.js),
// and config cannot read world.js.
export const BRIDGE_RISE = P * 4;
export const BRIDGE_RUN = P * 11;

// --- the quarry ---------------------------------------------------------------
// A mouth in the ground away to the left. Crew walk in, are gone a while, and
// come back out with a shard. The trip time is the whole of the mechanic.
export const QUARRY_W = 156;       // the mouth, in world pixels
export const QUARRY_H = 126;      // and how deep the first cut goes
// A fresh quarry is two benches of standing room, so the third body down there
// is a thing you buy: every bench taken out is another step down the wall you
// can see from the rim.
export const QUARRY_BENCH0 = 2;    // bodies a fresh quarry has room for
export const QUARRY_BENCH_MAX = 5; // and the deepest it is ever worked

export const LIP_GANG = 6;
export const QUARRY_DEEPEN = P * 4;  // how much further down each one goes
// Spores, because the farm feeds the cut, priced against a farm that mints
// them by the hundred; level with the farm's `PLOT_COST`, since a place row on
// either ground should cost like a place you open once the yard is running.
export const BENCH_COST = 100;      // spores for the first of them
// And the cut's own stone beside the spores: the next bench is cut out of
// the ground the gang is already bringing up. A minute or so of a fresh cut.
export const BENCH_SHARDS = 25;     // shards for that same first bench
export const BENCH_RATE = 1.7;     // and how much steeper each one gets

// What each rung of the cut's two ladders is worth and costs is written a rung
// at a time in config/rungs.js: the pace in trips a minute, the dig as a share
// of the handful a bench.
// A worked cut, not a hole somebody cut with a square: both walls come down in
// benches and the floor they leave is uneven. A pattern rather than a scatter,
// worked out once and kept, so it is the same quarry every time you look.
// Each bench is [how far in, how far down], as a share of the mouth. The drops
// are normalized, so they always land the last one exactly on the floor.
export const QUARRY_NEAR_BENCH = [[0.00, 0.30], [0.05, 0.22], [0.03, 0.20], [0.03, 0.28]];
export const QUARRY_FAR_BENCH = [[0.00, 0.36], [0.04, 0.24], [0.03, 0.22], [0.02, 0.18]];
export const QUARRY_FLOOR_STEP = 4;   // cells of floor per stretch
export const QUARRY_FLOOR_JAG = [0, 1, 2, 1, 0, 2, 1, 0];  // and cells of relief on each
// How often a quarrier swings, as opposed to how often the face gives anything
// up: a quarry should look busy whether or not it is being productive.
export const QUARRY_SWING = 620;
export const QUARRY_SHUFFLE = 0.35;   // and how fast it works along the face
// --- what the quarry is for ------------------------------------------------------
// The stone is *in the ground*, scattered through the cells of the cut, and a
// swing either turns some up or does not. A dig is a bounded thing you finish,
// worth exactly CUT_SEAM a bench -- `findShards` deals the scatter rather than
// rolling it, so the amount never drifts and a dig never ends owing you any.
// What a dig actually takes is this plus the walking between cells, which is
// meant to be: a cut is worked by people crossing it, not by a number filling.
export let CUT_DIG_MS = 16000;   // to get from the surface to the bottom, at pace 0
// The least one cell of that is worth, at pace nought, whatever the cut's size
// makes of the share above. This is the jaw's clock and the rate the pocket
// below is solved against, not a swing anybody sees.
export const CUT_SWING_MIN = 60;

// --- the pocket ---------------------------------------------------------------
// A body's swing is a beat you can see, and it takes a pocket of the course
// rather than a cell: at a cell a swing the pick never landed on anything and
// the gang read as a blur over a sinking floor (DESIGN.md, "The cut is worked
// in pockets"). The beat at pace nought, the ladder shortening it through
// `paceShare` down to the floor, and past the floor the pocket widens instead
// so the ground still comes out at the ladder's rate.
export let CUT_BEAT_MS = 2600;
export let CUT_BEAT_MIN = 400;
// Cells a swing takes: the one under the pick and its neighbors on the same
// course. A blaster's swing takes twice this.
export let CUT_POCKET = 3;
// Pockets a body works along its course before it looks for more ground: a
// run is one walk, where picking again after every cell is darting about.
export let CUT_RUN = 4;
// The blaster's swing fires a crit's ring at this power -- a third of a crit's.
export let CUT_BLAST_POWER = 1;
// The seam is a figure per DIG, so what a dig takes sets the rate, and nine
// tenths of a dig is shuffle. Measured: a small gang on a fresh cut at
// twenty-five to thirty a minute, the deepest cut near seventy. Blue is the
// coin both grounds wait on, since the cut is deepened with spores and the
// plots are broken with shards. A dial, because the right figure is one to
// find by playing.
export let CUT_SEAM = 24;          // shards in the ground, per bench of depth
export const QUARRY_WALK = 1.1;    // a quarrier's walking speed, px per frame
// How fast it steps between the cells of its own face, which is a shuffle and
// not a journey: slower than walking. A dig takes as long as digging takes;
// what makes it affordable is that a body picks a cell from the few nearest
// it. The shuffles are nine tenths of a quarrier's frames, which is why the
// pace ladder divides this (`paceShare` in quarry.js).
export let CUT_STEP = 0.6;

// The dev panel's rows for the knobs above, beside the bindings because an
// imported `let` is read-only; config.js gathers every file's rows into TUNABLE.
export const QUARRY_KNOBS = [
  { key: 'CUT_DIG_MS', label: 'a dig takes', min: 3000, max: 120000, step: 1000,
    get: () => CUT_DIG_MS, set: v => { CUT_DIG_MS = v; } },
  { key: 'CUT_STEP', label: 'pace along a face', min: 0.1, max: 3, step: 0.05,
    get: () => CUT_STEP, set: v => { CUT_STEP = v; } },
  { key: 'CUT_BEAT_MS', label: 'a swing, pace 0', min: 200, max: 3000, step: 50,
    get: () => CUT_BEAT_MS, set: v => { CUT_BEAT_MS = v; } },
  { key: 'CUT_BEAT_MIN', label: 'a swing, at least', min: 100, max: 1500, step: 50,
    get: () => CUT_BEAT_MIN, set: v => { CUT_BEAT_MIN = v; } },
  { key: 'CUT_POCKET', label: 'cells a swing', min: 1, max: 9, step: 1,
    get: () => CUT_POCKET, set: v => { CUT_POCKET = v; } },
  { key: 'CUT_RUN', label: 'pockets a run', min: 1, max: 12, step: 1,
    get: () => CUT_RUN, set: v => { CUT_RUN = v; } },
  { key: 'CUT_BLAST_POWER', label: 'a blaster\'s ring', min: 0, max: 3, step: 0.5,
    get: () => CUT_BLAST_POWER, set: v => { CUT_BLAST_POWER = v; } },
  { key: 'CUT_SEAM', label: 'shards a bench', min: 1, max: 60, step: 1,
    get: () => CUT_SEAM, set: v => { CUT_SEAM = v; } }
];
