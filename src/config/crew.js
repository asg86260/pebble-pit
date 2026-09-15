import { SHARD_CELL, SPARK_CELL, SPORE_CELL } from './view.js';
import { P } from './yard.js';

// --- nature ------------------------------------------------------------------
// A body works all day and now and then it has to stop. It puts down what it is
// doing, says so, goes, and gets back to work -- and what it leaves is the same
// muck the sky rains down, so the crew have to shovel it like any other mess.
// The yard makes its own work, which is the joke and also the point: a bigger
// crew is more hands and a bigger mess.
// Rare, and properly scattered. Every ten minutes or so per body, give or take
// half of that -- often enough that you see it happen and remember the yard is
// staffed by people, rare enough that it is never the thing you are dealing
// with. A whole crew is still one of them every couple of minutes between them,
// which is plenty.
// How long a janitor leans on one spot before wandering to another. Waiting for
// somebody to make a mess is most of its day, so it is the idle you see most of
// in this yard, and it is worth more than standing still.
// How fast a body ambles when it is not going anywhere in particular, in pixels
// per frame. It is its own number and NOT a fraction of the walking pace, which
// is what it used to be: an idling janitor chased its new leaning-spot at nearly
// half of a commute -- a hundred pixels a second -- so it stood dead still for
// several seconds and then scooted a few cells in a blink. Stuck, then vibrating,
// which is exactly how it read. An amble is a speed, not a discount on walking,
// and raising the crew's boots should not make loitering frantic.
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
// Muck is a depth in cells and never stacks past MUCK_MAX, which is six. This
// was fifty-five -- nine times deeper than the sky can rain -- so one body
// leaving one behind buried a column and took the whole crew a minute to shift.
export const LOO_MUCK = 2;       // and how much is left behind

export let SPOIL_POP = 3.2;    // how hard a grain comes off, before the scatter
export const SPOIL_SPIN = 0.5;   // and how much of that is a coin toss
export let SPOIL_SIDE = 1.3;   // how far sideways the blow throws it
export const BRUSH = 3;          // sweep radius, in cells
export const CORE_SIZE = P * 3;  // a core is a square this big
export const MINE_DELAY = 260;   // pause before a held click starts auto-mining
// Your swing's pace, what you carry and what your pick takes, at each rung,
// are lists in config/rungs.js -- and what each rung costs.
// How many rungs there are on every ladder in the game.
//
// One number, because "how far along is this" should be one question with one
// answer wherever it is asked: five on the strength, five on the swing, five on
// the pickaxe. What changes between them is what a rung costs and what it is
// bought with, which is the tier -- see "The ladder" in DESIGN.md.
export const RUNGS = 5;

// And how many of one trade a station will ever own. A shorter ladder than the
// rest on purpose: kit is the one thing you buy that a *body* has to wear, so
// its ceiling is the answer to "how many of this station's hands are the good
// ones" rather than "how far up is this number". Three of five on the rock,
// three of five in the cut -- enough that a full set is worth finishing and
// short enough that finishing it is a thing you do rather than a thing you keep
// paying for.
//
// It is also what makes the machines arrive. A machine is gated behind a full
// set -- see `kitFull` -- and a full set used to mean a hat for every pair of
// hands the station could hold, which is a bill that grows with the station and
// a gate that receded as you walked at it. A set is three now, and the ram, the
// jaw, the tiller and the belt are things you can actually get to.
//
// Three of the four stop there as well as start there: the ceiling and the set
// are one number, because the ram, the jaw and the tiller take those stations
// over and a fourth helmet would be a helmet for a face nobody stands at. The
// carts are the exception -- a set is still three, and there is no ceiling over
// it, because carrying is the one station a machine never takes off you. See
// `kitSetOf` and `kitMaxOf` in kit.js, which are the two halves this used to be.
export const KIT_MAX = 3;
export const WORKER = P * 3;     // worker square size

// How far either way loitering may take a body from the post it is minding, and
// -- out of the same number -- how far off its post it has to be before it
// counts as having *left*, which is the only thing a walk back is for. They are
// written here together because they are one measurement, and here rather than
// beside IDLE_PACE because the second of them is a body wide.
//
// They were two numbers and they disagreed. The idle picks a new spot to lean on
// up to five cells either way and sways a cell on top of that; the walk back to
// the post fired at anything over a body's width, which is three. So the
// loitering did exactly what it is for, ambled out past three cells, and was
// yanked back inside by a single frame of commute -- fifteen frames at
// IDLE_PACE and then a fourteen-pixel snap, over and over, for as long as you
// watched. That is not a janitor drifting about its shed, it is a janitor on a
// rubber band; and the only reason it was hard to name is that the snap is one
// frame and your eye reads it as a stutter rather than as a walk.
//
// So the mark a walk fires at is everything the idle can honestly do -- the
// wander, the sway on top of it, and a body's width of slack -- and the two
// cannot drift apart again, because the second is written as the sum of the
// first and the things that ride on it.
export const IDLE_ROAM = P * 5;
export const AT_POST = IDLE_ROAM + P + WORKER;

// One doorway, for every building in the yard that has one.
//
// They were all different: two cells by three at the school, three by three at
// the scrubbing house, three by five at the casino, four by four at the crew's
// own rooms, and nothing at all on the lab. Six buildings, five answers, and the
// school's was small enough that a body walking into it looked like a body
// walking into a wall. A door is the one part of a building that is measured
// against a person rather than against the building, so it is the one part that
// has no business changing from building to building: it is what tells you how
// big the rest of it is.
//
// Four wide and four tall, and both numbers are the body. A body is three cells
// square and stands on the bottom three courses, so three of anything is exactly
// a body and no more -- a door a body fills to the edges reads as a slot it was
// squeezed through. One cell of clearance each way is a way in: a cell of daylight
// either side, and a cell over the head, which is also where a hat goes.
//
// Even on purpose. Every front here is an even number of cells across except the
// scrubbing house's, so an even door centres on the lattice at the school, at the
// lab and in a room of the crew's house, and lands half a cell off the scrubbing
// house's middle column -- which is one building out of five, at its foot, three
// world units, under a tower whose own axis is unmoved. An odd door would have
// put three of the five off instead.
export const DOOR_W = 4;         // cells across a way in, everywhere in the yard
export const DOOR_H = 4;         // and courses tall
// A rockhand's swing at each rung is a list in config/rungs.js.
// The yard runs from the mouth of the quarry to the lip of the pit, and heaped to
// the brim it holds about 10,100 grains -- the slope of the banks decides it,
// and it was measured, not guessed. The crew down tools a little short of that,
// so a chip is never told there is nowhere to put it. Two rocks' worth of spoil
// on the ground and everybody stops: another body on the rock is more dust
// lying about, and somebody still has to move it.
// What a pile may hold before the station behind it stops. The rock's strip
// holds a bit over two thousand grains at this slope, so it stops well short of
// physically full -- a chip is never told there is nowhere to put it, and a rock
// is more than one pile's worth, so a body on the rock is only worth having if
// somebody is carrying. The sites deal in ones, so theirs are counted in ones.
// A site's strip is 420px, which is 35 bodies across and holds about 300 of them
// heaped. Twelve was a guess and it was a bad one: a station that stops after
// twelve is a station that is stopped nearly all the time. These are the same
// fraction of what the ground actually holds as the rock's is.
//
// The rock's own was 1400 and is half that now. A pile that big is most of a
// rock lying on the ground: it took a long time to build, a long time to clear,
// and for most of that time the yard was one enormous heap with a stopped gang
// standing over it. Seven hundred fills sooner, so the crew find their level
// sooner and the ground beside the rock reads as a working bank rather than as
// a second hill. It costs nothing: the limit is when the rock hands *wait*, not how
// much dust the game will ever give you.
// The scrubbing house is in here now, and it is the reason the recycler stopped
// spraying the yard. Its spout paid on to bare ground, and bare ground takes a
// scatter and no more -- so every grain it made walked outward looking for a
// column with room and ended up somewhere down the walk. Dust the house makes
// heaps under the house, like everything else in this yard, and when the heap is
// full the house stops until somebody carries it away.
// The sky is in here too. What the wizards knock off the star falls four hundred
// pixels and lands under it, and until it had a strip of its own it landed on
// bare ground -- which takes a scatter and no more, so a star's worth of sparks
// spread themselves along the walk a grain at a time instead of heaping where
// they fell. It is a station like any other: it piles, and when the pile is full
// the wizards stop until somebody has carried it away.
export const PILE_LIMIT = { rock: 700, quarry: 180, farm: 180, scrub: 140, sky: 260 };

// Item 8 of feedback5 took the station crates out, and with them the two
// constants that lived here: CRATE_H, the height of a crate's sides, and CRATED,
// which said whose strip stood in one. A strip is bare ground with a heap on it
// again -- see `bankCeiling` in world.js, and `heapBase` in config/piles.js for
// what now keeps a station able to reach its own limit.

// And what lands on each of those strips, which is the one thing about a heap
// that nowhere else in the game says out loud. Every other fact about a strip is
// worked out -- where it is comes off the walk in `placeSites`, how wide it is
// off `PILE_LIMIT` -- but what a station pays out in was only ever known by the
// station itself, at the moment it threw. So the ground could not be marked
// before anything landed on it, which is exactly when a player wants to know
// whose ground it is.
//
// A key with no entry here holds dust, which is what the rock and the scrubbing
// house pay out and what a new station pays out until it is given a find of its
// own -- so this is one line to add, not a thing to remember. Cell zero means
// dust; the painter and `drawMark` both already read it that way.
export const PILE_HOLDS = { quarry: SHARD_CELL, farm: SPORE_CELL, sky: SPARK_CELL };
// And what the back of it may leave lying before it stops, with no recycler on:
// cells of muck over the ground the spout reaches. It is the same rule wearing
// the other coat -- a house nobody clears up after fills its own yard and jams.
export const SCRUB_CLOG = 26;
// There is no hysteresis on a full pile, and it turns out there should not be.
// Any at all is a chore: at 0.95 you had to clear seventy grains before anybody
// picked up a pick again, and a sweep of the brush lifts a handful. A station
// stops when its pile is full and starts the moment there is room for one more,
// so at the limit the crew mine exactly as fast as the crew carry. That is not
// a stutter, it is the yard finding its level.
export const HAUL_MS = 110;      // gap between grains a hauler scoops at pace 0
// Hauler walking speed carrying a load, px per frame.
//
// Was 0.9, which is 54 pixels a second: most of a minute to cross a yard four
// thousand wide, before anything is bought. A body that slow does not read as
// somebody walking to work, it reads as somebody who has been paused. The whole
// ladder above it is unchanged -- every multiplier still multiplies this -- so
// what moved is where the ladder starts, not how far it goes.
// (The walk at each rung is a list in config/rungs.js now, in px/s.)

// What each ladder's rungs cost is written a rung at a time in config/rungs.js;
// what a body costs over a run is below.
// The house was 60 at 1.45x, and a full playthrough said bodies were the
// bottleneck of the whole run: the seventeenth cost 15,800 and the twenty-fifth
// 447,000, hours of a yard's income for one hauler, when every later station
// wants two or three more of them. At 45 and 1.30x the tenth is 480, the
// twentieth 6,600 and the thirtieth 90,000 -- still a decision that late, no
// longer a wall (critics 2026-09-10, B1 and the house note; playthrough 09-11).
export const HOUSE_COST0 = 45;          // the first house
export const HOUSE_RATE = 1.30;         // and how much steeper each body gets
export const HAUL_EMPTY = 1.6;   // and how much quicker it walks with its hands free

// --- tipping a load into the hole ---------------------------------------------
// A hauler used to empty its cart as one act: every grain left the same point
// at the same instant on the same arc, differing only in where it came down.
// A dozen identical parabolas out of one pixel is a spray from a nozzle, not a
// body turning a barrow over -- and it is the one moment in the game where you
// watch the yard's whole day's work actually go somewhere.
//
// So the throw is a hand's throw: the peak varies grain by grain and the load
// does not leave from a single point. None of it changes where anything lands
// or what anything is worth -- `bell` still picks the spot and the count is
// untouched -- and none of it needs anything remembered, which is why the
// spill is made of the grains' own arcs rather than of a queue on the worker.
export const TOSS_RISE = 70;         // world px the average grain peaks at
export const TOSS_RISE_VARY = 0.55;  // share of that it varies by, either way
export const TOSS_SPREAD = P * 2;    // how far apart the hands let go

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const CREW_KNOBS = [
  { key: 'LOO_EVERY', label: 'nature calls', min: 4000, max: 300000, step: 1000,
    get: () => LOO_EVERY, set: v => { LOO_EVERY = v; } },
  { key: 'SPOIL_POP', label: 'spoil pop', min: 0.5, max: 8, step: 0.1,
    get: () => SPOIL_POP, set: v => { SPOIL_POP = v; } },
  { key: 'SPOIL_SIDE', label: 'spoil spread', min: 0, max: 5, step: 0.1,
    get: () => SPOIL_SIDE, set: v => { SPOIL_SIDE = v; } },
  // The piles are fields of one object rather than bindings of their own, so
  // their pairs read and write a field. Same row, same door.
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

// --- wave7-crew ---------------------------------------------------------------
// A body about to step in somebody's leavings stops and says so before going
// around. Long enough to read, short enough not to jam an errand -- and the
// cooldown is per body, so a crowd crossing a fouled yard does not gridlock
// into a queue of retching statues.
export let GROSS_MS = 1200;           // how long the stop lasts
export let GROSS_COOLDOWN_MS = 8000;  // before the same body minds again
// Hovering the cursor over a body holds it still, so the card over its head is
// read off somebody standing rather than somebody walking away. Refreshed while
// hovered, so it is really "this long after the cursor leaves".
export let HOVER_PAUSE_MS = 900;
CREW_KNOBS.push(
  { key: 'GROSS_MS', label: 'yuck stop', min: 200, max: 5000, step: 100,
    get: () => GROSS_MS, set: v => { GROSS_MS = v; } },
  { key: 'GROSS_COOLDOWN_MS', label: 'yuck cooldown', min: 1000, max: 60000, step: 500,
    get: () => GROSS_COOLDOWN_MS, set: v => { GROSS_COOLDOWN_MS = v; } },
  { key: 'HOVER_PAUSE_MS', label: 'hover hold', min: 100, max: 5000, step: 100,
    get: () => HOVER_PAUSE_MS, set: v => { HOVER_PAUSE_MS = v; } });
