import { SHARD_CELL, SPARK_CELL, SPORE_CELL } from './view.js';
import { P } from './yard.js';

// --- nature ------------------------------------------------------------------
// A body works all day and now and then it has to stop; what it leaves is the
// same muck the sky rains down, so the crew shovel it like any other mess.
// How fast a body ambles when it is not going anywhere in particular, in
// pixels per frame. Its own number and NOT a fraction of the walking pace: as
// a share of a commute an idling janitor stood dead still and then scooted a
// few cells in a blink, and raising the crew's boots made loitering frantic.
export const IDLE_PACE = 0.28;
// Frames from a standstill to an amble's full pace, and -- the same number the
// other way -- how long it takes to stop. A body that went from stood still to
// its top speed in one frame and stopped as dead read as a sprite being slid
// about; legs take a step or two to get going. See `amble` in crew/idle.js.
export const AMBLE_RAMP = 18;
export const JANITOR_PROP = 7000;
export let LOO_EVERY = 600000;   // how often a body is about due, on average
export const LOO_SPREAD = 0.55;  // and how much that wanders, either side
export const LOO_MS = 1700;      // how long it takes
// Muck is a depth in cells and never stacks past MUCK_MAX, which is six.
export const LOO_MUCK = 2;       // and how much is left behind

export let SPOIL_POP = 3.2;    // how hard a grain comes off, before the scatter
export let SPOIL_SIDE = 1.3;   // how far sideways the blow throws it
export const BRUSH = 3;          // sweep radius, in cells
export const CORE_SIZE = P * 3;  // a core is a square this big
export const MINE_DELAY = 260;   // pause before a held click starts auto-mining
// How many rungs there are on every ladder in the game: one number, so "how
// far along is this" has one answer wherever it is asked. What changes between
// ladders is what a rung costs and is bought with (config/rungs.js; "The
// ladder" in DESIGN.md).
export const RUNGS = 5;

// How many of one trade a station will ever own, and the size of a full set
// (`kitFull`), which is what makes the machines arrive. One number for both,
// because the ram, the jaw and the tiller take those stations over and a fourth
// helmet would be for a face nobody stands at. The carts are the exception: a
// set is three and there is no ceiling, because carrying is the one station a
// machine never takes off you. See `kitSetOf` and `kitMaxOf` in kit.js.
export const KIT_MAX = 3;
export const WORKER = P * 3;     // worker square size

// How far either way loitering may take a body from the post it is minding,
// and, out of the same number, how far off its post it has to be before it
// counts as having *left*. The second is written as the sum of the first, the
// sway on top of it and a body's width of slack, so a body can never wander
// out past the mark the walk back fires at and be yanked home by a one-frame
// commute -- a janitor on a rubber band, which reads as a stutter.
export const IDLE_ROAM = P * 5;
export const AT_POST = IDLE_ROAM + P + WORKER;

// One doorway, for every building in the yard that has one. A door is measured
// against a person, not the building, so it is what tells you how big the rest
// is. Four and four are the body plus a cell of clearance each way: a body is
// three cells square, and a door it fills to the edges reads as a slot it was
// squeezed through. Even on purpose: every front but the scrubbing house's is
// an even number of cells across, so an even door centers on the lattice.
export const DOOR_W = 4;         // cells across a way in, everywhere in the yard
export const DOOR_H = 4;         // and courses tall
// What a pile may hold before the station behind it stops: the point at which
// the hands *wait*, never how much the game will give you. Each is well short
// of what its strip physically holds (the rock's holds a bit over two thousand
// at this slope, a site's about three hundred), so a chip is never told there
// is nowhere to put it, and a heap fills soon enough that the crew find their
// level. The scrubbing house's and the sky's are here so their output heaps
// under them instead of walking outward over bare ground a grain at a time.
export const PILE_LIMIT = { rock: 700, quarry: 180, farm: 180, scrub: 140, sky: 260 };

// What lands on each strip, so the ground can be marked before anything lands
// on it. A key with no entry holds dust (cell zero), which is what the rock,
// the scrubbing house and any new station pay out; the painter and `drawMark`
// both read it that way.
export const PILE_HOLDS = { quarry: SHARD_CELL, farm: SPORE_CELL, sky: SPARK_CELL };
// What the back of the house may leave lying before it stops, with no recycler
// on: cells of muck over the ground the spout reaches.
export const SCRUB_CLOG = 26;
// No hysteresis on a full pile: a station stops when its pile is full and
// starts the moment there is room for one more, so at the limit the crew mine
// exactly as fast as the crew carry. Any margin is a chore of clearing before
// anybody picks a pick up again.
export const HAUL_MS = 110;      // gap between grains a hauler scoops at pace 0

// What a body costs over a run. Bodies are the bottleneck of a whole run, and
// every later station wants two or three more of them: at 45 and 1.30x the
// tenth is 480, the twentieth 6,600 and the thirtieth 90,000, a decision that
// late but not a wall.
export const HOUSE_COST0 = 45;          // the first house
export const HOUSE_RATE = 1.30;         // and how much steeper each body gets
export const HAUL_EMPTY = 1.6;   // and how much quicker it walks with its hands free

// --- tipping a load into the hole ---------------------------------------------
// The throw is a hand's throw: the peak varies grain by grain and the load does
// not leave from a single point, or a dozen identical parabolas out of one
// pixel read as a nozzle. Nothing here changes where anything lands or what it
// is worth, and nothing is remembered: the spill is made of the grains' own
// arcs.
export const TOSS_RISE = 70;         // world px the average grain peaks at
export const TOSS_RISE_VARY = 0.55;  // share of that it varies by, either way
export const TOSS_SPREAD = P * 2;    // how far apart the hands let go

// The dev panel's rows for the knobs above, beside the bindings because an
// imported `let` is read-only; config.js gathers every file's rows into TUNABLE.
export const CREW_KNOBS = [
  { key: 'LOO_EVERY', label: 'nature calls', min: 4000, max: 300000, step: 1000,
    get: () => LOO_EVERY, set: v => { LOO_EVERY = v; } },
  { key: 'SPOIL_POP', label: 'spoil pop', min: 0.5, max: 8, step: 0.1,
    get: () => SPOIL_POP, set: v => { SPOIL_POP = v; } },
  { key: 'SPOIL_SIDE', label: 'spoil spread', min: 0, max: 5, step: 0.1,
    get: () => SPOIL_SIDE, set: v => { SPOIL_SIDE = v; } },
  // The piles are fields of one object rather than bindings of their own, so
  // their pairs read and write a field.
  { key: 'PILE_LIMIT.rock', label: 'rock pile holds', min: 50, max: 3000, step: 50,
    get: () => PILE_LIMIT.rock, set: v => { PILE_LIMIT.rock = v; } },
  { key: 'PILE_LIMIT.quarry', label: 'quarry pile holds', min: 4, max: 400, step: 4,
    get: () => PILE_LIMIT.quarry, set: v => { PILE_LIMIT.quarry = v; } },
  { key: 'PILE_LIMIT.farm', label: 'farm pile holds', min: 4, max: 400, step: 4,
    get: () => PILE_LIMIT.farm, set: v => { PILE_LIMIT.farm = v; } },
  { key: 'PILE_LIMIT.scrub', label: 'house pile holds', min: 4, max: 400, step: 4,
    get: () => PILE_LIMIT.scrub, set: v => { PILE_LIMIT.scrub = v; } },
  { key: 'PILE_LIMIT.sky', label: 'star pile holds', min: 4, max: 600, step: 4,
    get: () => PILE_LIMIT.sky, set: v => { PILE_LIMIT.sky = v; } }
];

// --- minding a mess -----------------------------------------------------------
// A body about to step in somebody's leavings stops and says so before going
// around. The cooldown is per body, so a crowd crossing a fouled yard does not
// gridlock into a queue of retching statues.
export let GROSS_MS = 1200;           // how long the stop lasts
export let GROSS_COOLDOWN_MS = 8000;  // before the same body minds again
// Hovering the cursor over a body holds it still, so the card over its head is
// read off somebody standing. Refreshed while hovered, so it is really "this
// long after the cursor leaves".
export let HOVER_PAUSE_MS = 900;
CREW_KNOBS.push(
  { key: 'GROSS_MS', label: 'yuck stop', min: 200, max: 5000, step: 100,
    get: () => GROSS_MS, set: v => { GROSS_MS = v; } },
  { key: 'GROSS_COOLDOWN_MS', label: 'yuck cooldown', min: 1000, max: 60000, step: 500,
    get: () => GROSS_COOLDOWN_MS, set: v => { GROSS_COOLDOWN_MS = v; } },
  { key: 'HOVER_PAUSE_MS', label: 'hover hold', min: 100, max: 5000, step: 100,
    get: () => HOVER_PAUSE_MS, set: v => { HOVER_PAUSE_MS = v; } });
