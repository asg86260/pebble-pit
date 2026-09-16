import { APOTHECARY_W } from './apothecary.js';
import { CASINO_W, OUTHOUSE_W, SHACK_W, TOWER_W } from './buildings.js';
import { FARM_GAP, FARM_PLOTS_MAX } from './farm.js';
import { HOUSE_COLS, HOUSE_CUBE } from './house.js';
import { heapBase } from './piles.js';
import { BRIDGE_RUN, QUARRY_W } from './quarry.js';

import { SCRUB_W } from './scrub.js';
import { BOARD_W } from './notices.js';
import { BENCH_W, P } from './yard.js';

export const TO_LEDGE = 636;     // rock center to the lip of the pit
// The rock is the only thing on this side, so the ground is its spoil's: the
// pile runs out toward the lip and stops a sweep short of it.
export const ROCK_PILE_TO = 576; // and how far right the rock's own spoil may reach
export const PILE_GAP = 0;       // bare ground kept between a pile and the next station
// Bare ground kept between a station and the *start* of its own pile, so the
// heap stands off the thing that made it instead of burying it. The farm's
// heap has to clear its fence, not just its last plot, which is why it is
// more than FARM_GATE; the quarry's clears the far ramp of the bridge, which
// comes down well past the mouth. The rock has ROCK_CLEAR for the same job.
export const PILE_STANDOFF = { farm: P * 9, quarry: P * 12 };

// --- where everything stands ----------------------------------------------------
//
// The yard laid out as a list of requirements rather than a list of answers:
// each site declares only what it owns, and placement is a walk. A hand-typed
// offset a site is true only for as long as nothing either side of it
// changes, and a strip clamped against a neighbor it was not placed beside
// comes back inverted, which hangs the yard at boot.
//
//   w         its own widest FUTURE self, not its width today. The farm reserves
//             room for every plot it will ever have, so breaking new ground
//             never shoves the lab along.
//   standoff  bare ground between the site and the near end of its own heap.
//   pile      whose heap that is, or null for a site that makes nothing. The
//             heap's WIDTH is never declared -- it is `heapBase(key) * P`, the
//             width that key's own limit needs at `BANK_SLOPE`, so the ground
//             reserved and the ground used cannot disagree.
//   side      which side of the site its heap lies on. 'right' means toward the
//             rock, which is where a body throwing already aims. The scrubbing
//             house is the exception: its spout is on the left wall, so a strip
//             laid the usual way round would put the heap inside the building.
//
// In yard order, walking LEFT from the rock, which is the order the cores open
// them in. Adding a station is a row: its spot is reserved from the moment the
// table names it, whether or not it has been bought.
// One gap between every pair of neighboring sites, and it is BARE ground:
// nothing of either neighbor stands in it. What a site hangs off its left side
// is its own furniture (`hang`, below) and is padded for by the site that owns
// it, the way a heap is; the gap is what is left over, and it is left over
// everywhere. A gap a site cannot be right about a yard whose order changes
// with what you buy (`siteOrder` in world.js).
export const STATION_GAP = P * 24;
// The bare ground between the tower's wall and the near end of the star's
// ground under it. See the tower's row below.
export const SUN_GAP = P * 3;

// A shack is a course taller than a plain shed, and wears an eave; what tells
// the two apart is the detail each carries (drawFarmShed / drawQuarryShed in
// render/sites.js).
export const SHACK_RISE = P;

// Where each trade's kit stand is put down, as bare ground LEFT of the station
// it belongs to. `kitX` in world.js seats the stand off these, and the walk
// below pads each site's left side by them, so the stand a body walks to and
// the ground reserved for it are one number.
//
// The quarry's clears the bridge: a trestle standing on the ramp is a trestle
// about to fall over. The farm's clears the first plot and whoever is stooping
// over it. The rest stand clear of a door.
export const KIT_OUT = {
  shack: P * 6, outhouse: P * 6, quarry: BRIDGE_RUN + P * 5,
  farm: P * 18, apothecary: P * 6, tower: P * 8
};
// A stand's slab is drawn from a cell left of its x (drawKitStands, render/
// crew.js), so its reach is one more cell than where it is put down.
export const STAND_REACH = P;
// The farthest thing a site with a kit stand hangs off its left side is the
// stand: the sheds (SHED_GAP + a shed's width, nine cells), the farm's fence
// post (FARM_GATE, six) and the bridge's near ramp (BRIDGE_RUN, eleven) all
// fall inside it.
const kitHang = key => KIT_OUT[key] + STAND_REACH;
export const SHACK_EAVE = P / 2;   // how far a roof hangs past its own wall

export const SITES = [
  // The rockhands' hut, the first thing along from the rock. Its ground is
  // reserved from the moment this row names it, so the whole walk stands one
  // shack further out whether or not anybody has bought one, and the rock,
  // measured off whatever is nearest, is exactly the size it was.
  { key: 'shack',    w: () => SHACK_W,                     standoff: 0,  pile: null,
    hang: () => kitHang('shack') },
  { key: 'bench',    w: () => BENCH_W,                     standoff: 0,  pile: null },
  // The settlement owns the ground the noticeboard stands on. The board is
  // furniture rather than a station (seated in world.js) and has no slot of
  // its own, so the house pads its rock side by the board's own width, the
  // way a site with a heap pads by its heap, and the board is centered in a
  // gap with a walk's worth of ground round it.
  { key: 'house',    w: () => HOUSE_COLS * HOUSE_CUBE,     standoff: 0,  pile: null,
    furniture: () => BOARD_W },
  { key: 'outhouse', w: () => OUTHOUSE_W,                  standoff: 0,  pile: null,
    hang: () => kitHang('outhouse') },
  { key: 'quarry',   w: () => QUARRY_W,                    standoff: PILE_STANDOFF.quarry, pile: 'quarry',
    hang: () => kitHang('quarry') },
  { key: 'farm',     w: () => (FARM_PLOTS_MAX - 1) * FARM_GAP, standoff: PILE_STANDOFF.farm, pile: 'farm',
    hang: () => kitHang('farm') },
  { key: 'apothecary', w: () => APOTHECARY_W,             standoff: 0,  pile: null,
    hang: () => kitHang('apothecary') },
  // The lab has no row: a building that is gone must not go on holding ground.
  // See DESIGN.md, "The lab is deleted".
  { key: 'scrub',    w: () => SCRUB_W,                     standoff: P,  pile: 'scrub',  side: 'left' },
  { key: 'casino',   w: () => CASINO_W,                    standoff: 0,  pile: null },
  // The tower carries the star's ground on its own far side, which is what
  // puts the star beside it: the rind the star drops has to land on ground
  // somebody has reserved, or it walks the yard looking for a column with room.
  { key: 'tower',    w: () => TOWER_W,                     standoff: SUN_GAP, pile: 'sky', side: 'left',
    hang: () => kitHang('tower') }
];

// The ground a site owns beside itself for its heap: the heap at full width
// plus the standoff that keeps it off the wall, and nothing for a site that
// makes nothing. DERIVED, not tuned, and measured off the site's OWN content,
// so the bare ground between one drawn thing and the next is STATION_GAP
// everywhere by construction. A piece of furniture (the house's noticeboard)
// is padded the same way, by what it is.
export const padOf = row =>
  row.pile ? row.standoff + heapBase(row.pile) * P :
  row.furniture ? row.furniture() : 0;

// The ground a site owns on its LEFT for what it hangs there -- its kit stand,
// its shed, its fence post -- past whatever its pad already reserves on that
// side. A site whose heap lies to its left has ground there already, and its
// stand sits in it. This is what keeps STATION_GAP bare: the walk steps past
// the hang before it steps the gap.
export const hangOf = row => {
  const hang = row.hang ? row.hang() : 0;
  return row.side === 'left' ? Math.max(0, hang - padOf(row)) : hang;
};

// How wide the rock is ever allowed to get, and how much bare ground it keeps
// off the building on its flank. Ahead of the walk because the walk has to
// know them: the first site along stands where the biggest rock leaves room
// for it, the one spacing in the yard measured against something that grows.
//
// Rocks go on for ever, so they must stop growing at some point or rock ninety
// would fill the sky. They plateau at about what the twelfth was.
export const ROCK_W_MAX = 92;
// The ground the biggest rock keeps clear of its flank SLOT. Fourteen is the
// ram's parking space, not a hand's width: the ram stands off the flank
// building by RAM_CLEAR and is spriteW(RAM), eleven cells, long, and
// `ramTargetX` (rock.js) parks it no nearer the flank than that, so a slot
// any closer puts the machine and its tender's post inside the boulder. The
// hut stands nearer than this (SHACK_CLEAR; `shackSpot`, world.js) and only
// reaches the slot at the biggest rock. shack.test.mjs holds this against the
// ram's real width.
export const ROCK_FLANK_CLEAR = P * 14;

// The bare ground between the rock's center and the near wall of the first
// site along. Measured from `S.cx` rather than from the rock's edge, because
// the rock changes size and the yard does not rearrange itself around it.
// Derived: the room the rock actually needs and no more. Any closer and the
// rock quietly stops growing short of its own ceiling; any further and the
// shack stands out in the yard for no reason. The shack has no heap, so
// nothing of its own stands in the rock's clear ground; a first site that
// threw toward the rock would need its `padOf` added here.
export const TO_FIRST_SITE = (ROCK_W_MAX / 2) * P + ROCK_FLANK_CLEAR;

// Bare ground kept past the last building, at the far end of the walk, before
// the world runs out: somewhere for the camera to stop and for the casino to
// stand clear of the edge.
export const YARD_MARGIN = P * 10;

// How much ground there is to the left of the rock, which is the whole of the
// yard. As wide as the table says it needs to be, so the next station that
// grows moves the world's edge instead of walking through it (the view may not
// scroll past nought, so a building past the edge is unreachable). The sum is
// what `placeSites` in world.js spends on one pass, and it does not depend on
// the ORDER the walk visits them in, which is what makes it safe to work out
// here while the order is a thing the player decides by buying.
//
// A `const` worked out once at load, not a function: `S.worldW` and
// `floor.cols` are measured off it, and a world whose width could change under
// a standing yard is a world where every grain on the ground is in a column
// that means something else. Growing it at all is a migration -- see
// `floorShift` in persist.js.
const WALK = SITES.reduce((n, row) => n + row.w() + padOf(row) + hangOf(row), 0)
  + STATION_GAP * (SITES.length - 1);
export const GROUND_LEFT = Math.round((YARD_MARGIN + WALK + TO_FIRST_SITE) / P) * P;
export const ROCK_W = 44;        // the rock is a hill: this wide in cells at rock 1
export const ROCK_H = 20;        // and this tall
export const ROCK_GROW_W = 3;    // each rock is a little broader than the last
export const ROCK_GROW_H = 1.4;  // and a little higher
export const ROCK_SINK = 0;      // its foot sits on the ground line, like everything else
export const ROCK_SKY = 520;     // sky kept clear above the ground line, for the rock
// ROCK_W_MAX is up with the walk, which is measured off it -- see TO_FIRST_SITE.
export const ROCK_H_MAX = 42;
export const ROCK_CLEAR = 24;    // bare ground kept either side of the rock, so the spoil stands off it
