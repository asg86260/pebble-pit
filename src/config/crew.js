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
export const AMBLE_RAMP = 36;
export const JANITOR_PROP = 7000;
export let LOO_EVERY = 600000;   // how often a body is about due, on average
export const LOO_SPREAD = 0.55;  // and how much that wanders, either side
export const LOO_MS = 1700;      // how long it takes
// Muck is a depth in cells and never stacks past MUCK_MAX, which is six.
export const LOO_MUCK = 2;       // and how much is left behind

export let SPOIL_POP = 3.2;    // how hard a grain comes off, before the scatter
export let SPOIL_SIDE = 1.3;   // how far sideways the blow throws it
export const BRUSH = 3;          // sweep radius, in cells
export const MINE_DELAY = 260;   // pause before a held click starts auto-mining
export const TOSS_DELAY = 260;   // and before a held hand starts throwing (hold to toss)
export const TOSS_NEAR = P * 20;  // how far either side a held hand reaches for a grain, and how far off a pile's end it still works the pile
// How many rungs there are on every ladder in the game: one number, so "how
// far along is this" has one answer wherever it is asked. What changes between
// ladders is what a rung costs and is bought with (config/rungs.js; "The
// ladder" in DESIGN.md).
export const RUNGS = 5;

// How many helmets the rock will ever own, and the size of a full set
// (`kitFull`), which is what makes the ram arrive. One number for both,
// because the ram takes the rock over and a fourth helmet would be for a face
// nobody stands at. The carts have a set of three and no ceiling, because
// carrying is the one station a machine never takes off you; the lamps and
// brims are a hat a body and wait on `MACHINE_HATS`. See `kitSetOf` and
// `kitMaxOf` in kit.js.
export const KIT_MAX = 3;
// The set the drill and the tiller wait for: hats bought at the cut and at the
// plots before either machine can be had. The lamps and brims have no ceiling
// of their own -- a hat for every body the station holds -- so the set is what
// is left to choose. Five is the whole cut (`QUARRY_BENCH_MAX`), so the drill
// takes a cut that is fully lamped, and five of the farm's seven plots, so the
// tiller comes a little before the last furrow is broken. Both machines are
// gated on their station's two ladders topped as well, the last band of each
// the spark's, and a yard that far along has its benches and most plots.
export const MACHINE_HATS = 5;
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
// squeezed through. Even on purpose: every front but the air filter's is
// an even number of cells across, so an even door centers on the lattice.
export const DOOR_W = 4;         // cells across a way in, everywhere in the yard
export const DOOR_H = 4;         // and courses tall
// What a pile may hold before the station behind it stops: the point at which
// the hands *wait*, never how much the game will give you. Each is well short
// of what its strip physically holds (the rock's holds a bit over two thousand
// at this slope, a site's about three hundred), so a chip is never told there
// is nowhere to put it, and a heap fills soon enough that the crew find their
// level. The air filter's and the sky's are here so their output heaps
// under them instead of walking outward over bare ground a grain at a time.
// The casino has none: a paid hand heaps in its own tray and goes to the
// hole by air.
export const PILE_LIMIT = { rock: 700, quarry: 180, farm: 180, sky: 260 };

// What lands on each strip, so the ground can be marked before anything lands
// on it. A key with no entry holds dust (cell zero), which is what the rock
// and any new station pay out; the painter and `drawMark`
// both read it that way.
export const PILE_HOLDS = { quarry: SHARD_CELL, farm: SPORE_CELL, sky: SPARK_CELL };
// No hysteresis on a full pile: a station stops when its pile is full and
// starts the moment there is room for one more, so at the limit the crew mine
// exactly as fast as the crew carry. Any margin is a chore of clearing before
// anybody picks a pick up again.
// The gap between grains a hauler scoops, one figure a rung of the pace
// ladder, written down like every other ladder (config/rungs.js). It falls by
// about a quarter a rung, so a rung bought for the walk is felt at the heap
// too: the load grows up the carry ladder at the same time, and on the eased
// curve this replaced, which flattened at thirty, a top-rung hauler stood
// scooping for nearly half of every trip. Read through `scoopMs` in levels.js;
// the belt divides the same figure by what it is worth.
export const HAUL_SCOOP_MS = [110, 81, 60, 45, 33, 24, 18, 13, 10];

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
// Your own throw at the hole (`tossAtHole`) peaks at this share of the way
// there, never lower than a hauler's: a handful from the far end of the
// yard sails over the rock rather than into it.
export const HAND_ARC = 0.3;

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
  { key: 'PILE_LIMIT.sky', label: 'star pile holds', min: 4, max: 600, step: 4,
    get: () => PILE_LIMIT.sky, set: v => { PILE_LIMIT.sky = v; } }
];

// --- minding a mess -----------------------------------------------------------
// A body about to step in somebody's leavings stops and says so before going
// around. The cooldown is per body, so a crowd crossing a fouled yard does not
// gridlock into a queue of retching statues.
export let GROSS_MS = 1200;           // how long the stop lasts
export let GROSS_COOLDOWN_MS = 8000;  // before the same body minds again
// Holding the right button looks at the crew (the owner's A, 2026-10-08,
// docs/mocks/crew-sight-2026-10-08.html): everything behind the crew's plane
// is veiled pale, SIGHT_VEIL of white over it, coming in over SIGHT_IN_MS in
// SIGHT_STEPS held steps, and each body wears a thin ring. A body under
// the cursor walks at HOVER_SLOW of its pace, for HOVER_SLOW_MS after the
// cursor was last on it.
export let HOVER_SLOW = 0.4;
export let HOVER_SLOW_MS = 300;
export const SIGHT_VEIL = 0.7;
export const SIGHT_IN_MS = 400;
export const SIGHT_STEPS = 4;
// the ring round each body: this thick, this clear of the body's edge, in px
export const SIGHT_RING = 2;
export const SIGHT_GAP = 2;
CREW_KNOBS.push(
  { key: 'GROSS_MS', label: 'yuck stop', min: 200, max: 5000, step: 100,
    get: () => GROSS_MS, set: v => { GROSS_MS = v; } },
  { key: 'GROSS_COOLDOWN_MS', label: 'yuck cooldown', min: 1000, max: 60000, step: 500,
    get: () => GROSS_COOLDOWN_MS, set: v => { GROSS_COOLDOWN_MS = v; } },
  { key: 'HOVER_SLOW', label: 'hover slow, pace', min: 0.1, max: 1, step: 0.05,
    get: () => HOVER_SLOW, set: v => { HOVER_SLOW = v; } },
  { key: 'HOVER_SLOW_MS', label: 'hover slow, after', min: 50, max: 2000, step: 50,
    get: () => HOVER_SLOW_MS, set: v => { HOVER_SLOW_MS = v; } });

// --- the faded crew -----------------------------------------------------------
// The corner's crew switch set to fade (prefs.js, `crewView`): how much of the ink a
// body keeps when the player has asked for the yard to be read rather than
// watched. A late yard is a crowd, and the buildings behind it are the thing
// you are trying to look at.
export let CREW_FADE = 0.4;
CREW_KNOBS.push(
  { key: 'CREW_FADE', label: 'faded crew', min: 0.1, max: 1, step: 0.05,
    get: () => CREW_FADE, set: v => { CREW_FADE = v; } });

// --- the seat pips ------------------------------------------------------------
// A station's counter is a pip a seat (roster.js). A pip is two cells with a
// cell between, so a row of five is narrower than the old badge and count
// were wide by less than one button. Past `SEAT_SHRINK` seats the row would
// be wider than the station it hangs under, so the pips drop to a cell with a
// cell between and wrap every `SEAT_ROW`, with the count written over them.
export const SEAT_PIP = P * 2;
export const SEAT_GAP = P;
export const SEAT_PIP_SMALL = P;
export const SEAT_GAP_SMALL = P;
export const SEAT_SHRINK = 12;
export const SEAT_ROW = 20;
// The rule between the specialists' row and the regular seats: the air it sits
// in, and its own thickness.
export const SEAT_SEP = P * 2;
export const SEAT_RULE = 2;
// The empty seat's outline: the boards' bill-line grey, mapped by ink.js on
// the dark page like every other gray.
export const SEAT_EMPTY_INK = '#8c8c8c';
// A body sent off has no seat to walk away from (it carries where it stands),
// so its pip empties on a clock: three held thirds over this long.
export const SEAT_LEAVE_MS = 600;
// A counter with no seat cap (the rock's diggers, the house's carriers, the
// garage's forklifts) draws a pip a body, at full size, and holds each row to
// this many; the rest are written after the row as "+N", in room this wide.
export const SEAT_CROWD_ROW = 12;
export const SEAT_PLUS_W = P * 6;
