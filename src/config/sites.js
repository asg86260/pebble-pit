import { APOTHECARY_W } from './apothecary.js';
import { CASINO_W, OUTHOUSE_W, SHACK_W, TOWER_W } from './buildings.js';
import { FARM_GAP, FARM_PLOTS_MAX } from './farm.js';
import { HOUSE_COLS, HOUSE_CUBE } from './house.js';
import { heapBase } from './piles.js';
import { QUARRY_W } from './quarry.js';
import { LAB_W, SCHOOL_W } from './school.js';
import { SCRUB_W } from './scrub.js';
import { BENCH_W, P } from './yard.js';
import { BUILDBENCH_W } from './build.js';

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
// --- Track F2: the yard's furniture ------------------------------------------
// One gap between every pair of neighbouring sites, and the whole of the yard's
// spacing.
//
// Every row here used to carry a `gap` of its own -- eleven numbers between 60
// and 240, each measured by hand against whatever happened to stand beside it
// when it was written. The near end of the walk was the cramped end: the bench,
// the settlement, the closet and the school stood 60 to 102 apart, close enough
// to read as one long building, while the far end had 240 of bare ground
// between the apothecary and the lab. Eleven numbers cannot be right about a
// yard whose order changes with what you buy (see `siteOrder` in world.js) --
// a gap measured against the lab is a guess the moment the farm is standing
// there instead.
//
// So there is one. It is wide enough to clear the widest thing a site hangs off
// its own left-hand side -- the farmhands' kit stand, eighteen cells out from
// the first plot -- because that stand is furniture belonging to the site
// behind it and may not end up inside the next site along.
export const STATION_GAP = P * 20;
// And the bare ground between the tower's wall and the near end of the star's
// ground under it. See the tower's row below: the star is the tower's business,
// so the ground it drops its rind on is reserved by the tower's own slot.
export const SUN_GAP = P * 3;

// A shack is a course taller than it was, and wears an eave. Item 1 of
// feedback5: the sheds beside the cut and the field read as meagre -- a black
// box with a slot in it, at the two sites you spend the most time looking at.
// The presence is the extra course and the lip; what tells them apart is the
// detail each one carries (see drawFarmShed / drawQuarryShed in render/sites.js).
export const SHACK_RISE = P;
export const SHACK_EAVE = P / 2;   // how far a roof hangs past its own wall

export const SITES = [
  // The rockhands' hut, and the first thing along from the rock: it is the one
  // building that belongs to the station that was always there. Its ground is
  // reserved from the moment this row names it, like everybody's, so the bench
  // and the whole walk behind it stand one shack further out whether or not
  // anybody has bought one -- and the rock, which is measured off whatever is
  // nearest rather than off the bench by name, is exactly the size it was.
  { key: 'shack',    w: () => SHACK_W,                     standoff: 0,  pile: null },
  { key: 'bench',    w: () => BENCH_W,                     standoff: 0,  pile: null },
  // wave7b-build: the construction bench, standing right beside the work bench
  // -- where you buy a thing and where somebody is hired to build it are next
  // to each other. Its ground is reserved from the start like everybody's.
  { key: 'buildbench', w: () => BUILDBENCH_W,              standoff: 0,  pile: null },
  { key: 'house',    w: () => HOUSE_COLS * HOUSE_CUBE,     standoff: 0,  pile: null },
  { key: 'outhouse', w: () => OUTHOUSE_W,                  standoff: 0,  pile: null },
  { key: 'school',   w: () => SCHOOL_W,                    standoff: 0,  pile: null },
  { key: 'quarry',   w: () => QUARRY_W,                    standoff: PILE_STANDOFF.quarry, pile: 'quarry' },
  { key: 'farm',     w: () => (FARM_PLOTS_MAX - 1) * FARM_GAP, standoff: PILE_STANDOFF.farm, pile: 'farm' },
  { key: 'apothecary', w: () => APOTHECARY_W,             standoff: 0,  pile: null },
  // The lab had a row here. It is deleted, and a building that is gone must not
  // go on holding ground: left in the table it kept its own width plus a
  // station's padding of empty yard, which is a hole in the walk where a
  // building used to be. See DESIGN.md, "The lab is deleted".
  { key: 'scrub',    w: () => SCRUB_W,                     standoff: P,  pile: 'scrub',  side: 'left' },
  { key: 'casino',   w: () => CASINO_W,                    standoff: 0,  pile: null },
  // The tower carries the star's ground on its own far side, which is what puts
  // the star beside it (item 10). A wizard is made in the tower and flies from
  // it to the star, so the two are one station in everything but where they
  // stand -- and the rind the star drops has to land on ground somebody has
  // reserved, or it walks the yard looking for a column with room in it.
  { key: 'tower',    w: () => TOWER_W,                     standoff: SUN_GAP, pile: 'sky', side: 'left' }
];

// Every site gets the same pad of ground on its heap side, whether or not it
// has a heap to stand there (station-pad prototype). The pad is DERIVED, not
// tuned: the widest thing any site actually parks beside itself -- its heap at
// full width plus the standoff that keeps the heap off its wall. One number,
// measured off real content, so the yard's rhythm is even by construction:
// wall to wall, every pair of neighbours is SLOT_PAD + STATION_GAP apart.
export const SLOT_PAD = Math.max(...SITES.filter(r => r.pile)
  .map(r => r.standoff + heapBase(r.pile) * P));

// The bare ground between the rock's centre and the far edge of the first site
// along. Measured from `S.cx` rather than from the rock's edge, because the rock
// changes size and the yard does not rearrange itself around it.
export const TO_FIRST_SITE = 264;

// Bare ground kept past the last building, at the far end of the walk, before
// the world runs out. Somewhere for the camera to stop and for the casino to
// stand clear of the edge rather than against it.
export const YARD_MARGIN = P * 10;

// How much ground there is to the left of the rock -- which is the whole of the
// yard, since everything but the hole is laid out leftwards from the boulder.
//
// It was 3678, measured by hand, and it was a guess about content nobody had
// written yet. Track F1 widened the apothecary from 24 cells to 68 -- a hut, a
// bookshelf and four pots, which is the shape that station has to be -- and the
// walk ran 204 pixels off the left-hand end of the world: the casino stood at
// x = -204, half of it outside the ground and none of it reachable, because the
// view may not scroll past nought. Nothing warned about it except a check that
// happened to ask.
//
// So the ground is as wide as the table says it needs to be, and the next
// station that grows moves the world's edge instead of walking through it. The
// sum is what `placeSites` in world.js spends on one pass: every site's own
// width, the standoff to its heap and the heap itself, with one STATION_GAP
// between each pair -- and it does not depend on the ORDER the walk visits them
// in, which is what makes it safe to work out here while the order is a thing
// the player decides by buying.
//
// It is a `const` worked out once at load, not a function: `S.worldW` and
// `floor.cols` are measured off it, and a world whose width could change under a
// standing yard is a world where every grain on the ground is in a column that
// means something else. Growing it at all is a migration -- see `floorShift` in
// persist.js, which slides a save's dust across by however many columns the
// world gained on its left.
const WALK = SITES.reduce((n, row) => n + row.w() + SLOT_PAD, 0)
  + STATION_GAP * (SITES.length - 1);
export const GROUND_LEFT = Math.round((YARD_MARGIN + WALK + TO_FIRST_SITE) / P) * P;
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
