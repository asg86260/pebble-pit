import { APOTHECARY_W } from './apothecary.js';
import { CASINO_W, OUTHOUSE_W, TOWER_W } from './buildings.js';
import { FARM_GAP, FARM_PLOTS_MAX } from './farm.js';
import { HOUSE_COLS, HOUSE_CUBE } from './house.js';
import { QUARRY_W } from './quarry.js';
import { LAB_W, SCHOOL_W } from './school.js';
import { SCRUB_W } from './scrub.js';
import { BENCH_W, P } from './yard.js';

export const TO_LEDGE = 636;     // rock centre to the lip of the pit
// The rock is the only thing left on this side, so the ground the bench and the
// lab used to stand on is its spoil's now: the pile runs out towards the lip and
// stops a sweep short of it, rather than ending in a stretch of bare ground.
export const ROCK_PILE_TO = 576; // and how far right the rock's own spoil may reach
export const PILE_GAP = 0;       // bare ground kept between a pile and the next station
// And bare ground kept between a station and the *start* of its own pile, so
// the heap stands off the thing that made it instead of burying it. The farm
// clears its last plot; the quarry clears the far ramp of the bridge, which
// comes down well past the mouth. The rock has ROCK_CLEAR for the same job.
// The farm's own heap has to clear its fence, not just its last plot, which is
// why this is more than FARM_GATE rather than measured off the plots.
export const PILE_STANDOFF = { farm: P * 9, quarry: P * 12 };
// Ground running away to the left of everything. This is what the town has to
// spread into: every building out that way is placed as an offset back from the
// rock, so the last one along was standing four cells from the end of the world
// with the casino almost against its wall. Widened so the far end of the walk
// has somewhere to be.

// --- where everything stands ----------------------------------------------------
//
// The yard laid out as a list of requirements rather than a list of answers.
//
// Every site used to carry its own `TO_` offset: a distance from the rock,
// measured once by hand and then true only for as long as nothing either side
// of it changed. Two lists had to agree -- these offsets, and the pile strips in
// `refreshPiles` -- and they agreed only because whoever wrote them had picked
// numbers that happened to leave room. When they stopped agreeing, `heap()`
// clamped the far end of a strip against a neighbour it had not placed, and a
// strip came back with its end left of its start. A yard with an inverted strip
// hangs at boot, which is what the first attempt at this did.
//
// So: each site declares only what it owns, and placement is a walk.
//
//   w         its own widest FUTURE self, not its width today. The farm reserves
//             room for every plot it will ever have, so breaking new ground
//             never shoves the lab along. This is what "required spacing for
//             future growth" means.
//   standoff  bare ground between the site and the near end of its own heap.
//   pile      whose heap that is, or null for a site that makes nothing. The
//             heap's WIDTH is never declared -- it is `heapBase(key) * P`, the
//             width that key's own limit needs at `BANK_SLOPE`, so the ground
//             reserved and the ground used cannot disagree.
//   gap       bare ground between this site's leftmost extent and whatever comes
//             next along. This is the number that says "do not build on top of
//             me", and it is the only spacing anybody has to think about when
//             adding a station.
//   side      which side of the site its heap lies on. 'right' means towards the
//             rock, which is where a body throwing already aims. The scrubbing
//             house is the exception: its spout is on the left wall, so a strip
//             laid the usual way round would put the heap inside the building.
//
// In yard order, walking LEFT from the rock -- which is the order you meet them
// in as the cores open them, and the order they are read out in here.
//
// Adding a station is a row. Its spot is reserved from the moment the table
// names it, whether or not it has been bought, so "place it in the next open
// spot" is true by construction rather than by arithmetic at purchase time.
export const SITES = [
  { key: 'bench',    w: () => BENCH_W,                     standoff: 0,  pile: null,     gap: 60 },
  { key: 'house',    w: () => HOUSE_COLS * HOUSE_CUBE,     standoff: 0,  pile: null,     gap: 102 },
  { key: 'outhouse', w: () => OUTHOUSE_W,                  standoff: 0,  pile: null,     gap: 102 },
  { key: 'school',   w: () => SCHOOL_W,                    standoff: 0,  pile: null,     gap: 96 },
  { key: 'quarry',   w: () => QUARRY_W,                    standoff: PILE_STANDOFF.quarry, pile: 'quarry', gap: 234 },
  { key: 'farm',     w: () => (FARM_PLOTS_MAX - 1) * FARM_GAP, standoff: PILE_STANDOFF.farm, pile: 'farm', gap: 132 },
  { key: 'apothecary', w: () => APOTHECARY_W,             standoff: 0,  pile: null,     gap: 240 },
  { key: 'lab',      w: () => LAB_W,                       standoff: 0,  pile: null,     gap: 138 },
  { key: 'scrub',    w: () => SCRUB_W,                     standoff: P,  pile: 'scrub',  gap: 210, side: 'left' },
  { key: 'casino',   w: () => CASINO_W,                    standoff: 0,  pile: null,     gap: 168 },
  { key: 'tower',    w: () => TOWER_W,                     standoff: 0,  pile: null,     gap: 66 }
];

// The bare ground between the rock's centre and the far edge of the first site
// along. Measured from `S.cx` rather than from the rock's edge, because the rock
// changes size and the yard does not rearrange itself around it.
export const TO_FIRST_SITE = 264;

export const GROUND_LEFT = 3678;
export const ROCK_W = 44;        // the rock is a hill: this wide in cells at rock 1
export const ROCK_H = 20;        // and this tall
export const ROCK_GROW_W = 3;    // each rock is a little broader than the last
export const ROCK_GROW_H = 1.4;  // and a little higher
export const ROCK_SINK = 0;      // its foot sits on the ground line, like everything else
export const ROCK_SKY = 520;     // sky kept clear above the ground line, for the rock
// Rocks go on for ever, so they must stop growing at some point or rock ninety
// would fill the sky. They plateau at about what the twelfth was.
export const ROCK_W_MAX = 92;
export const ROCK_H_MAX = 42;
export const ROCK_CLEAR = 24;    // bare ground kept either side of the rock, so the spoil stands off it
// A bank may stand this many cells high per cell of distance from the apron.
// Without it the apron is a cliff the sand cannot slump over, and the bank
// stands up against the rock as a sheer wall however tall it gets. 1.5 is the
// angle the sand finds on its own, so both faces of a heap read the same.
// How deep dust may lie on ground that is nobody's pile. Enough that anything you
// put down stays put and settles like sand; not enough that the bare yard becomes
// somewhere to store it.
//
// A `let`, and a row in TUNABLE, because it is now the ceiling on a great deal
// more ground than it used to be: the rock's clearance and the whole run out
// past the left-hand end of the yard are bare ground like any other, and how
// deep a scatter reads across all of it is a thing to look at rather than guess.
