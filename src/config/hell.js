// --- act 4: hell -----------------------------------------------------------------
// DESIGN.md, "Acts 3 and 4: the afterlife and hell", act 4: the mine and the
// forge (the owner's call 4, 2026-10-17). The loop is built on placeholder
// art; nothing in a released build reaches it while HELL_ON is false. A
// number the spec gives is the spec's; every other is a default chosen to
// stand the loop up, marked so in its comment, for the tuning pass.
import { P } from './yard.js';

// The switch for the act (DESIGN.md, "Held-back flags"), set by the build:
// `VITE_HELL=1`, which no build sets yet. Act 4 is reached through act 3's
// ghost road, so it is never on without the afterlife (acts.js, `hellOn`). A
// dev build and the node yard stand it whatever this says, as they do the
// deep; `__actsOn(true, false)` plays a build with act 3 alone.
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
export const HELL_ON = env.VITE_HELL === '1';

// --- where it is -----------------------------------------------------------------
// A descending run of chambers under the deep's floor, each lower and further
// right than the last, laid out inside one hollow. Defaults, all of them.
export const HELL_GAP = P * 20;            // world px of rock between the deep's floor and hell's roof (default; the shaft's)
export const HELL_H = P * 130;             // hell's roof to its floor (default; the deep's)
export const HELL_W = P * 520;             // across (default; the deep's)
export const HELL_FLOOR_MARGIN = P * 9;    // the floor stands this far up off the window's foot (default)
export const HELL_FLOOR_CELLS = 6;         // the placeholder floor's depth, in cells (default)

// --- the chain: five ores, five tools, five barriers -----------------------------
// The spec's table, a row a chamber, top to bottom; every name a working
// name and a key, not a word (the player's words are the owner's, in
// locales/en.ftl). A chamber's ore yields to the tool of the tier before it;
// its bars make the tool its barrier yields to; behind the barrier is the
// next ore. The run's size is call 4, open (five recommended, four without
// the chains): everything that counts chambers, barriers or wall beats reads
// this table's length, so dropping a row is the whole change. `band` is which
// of the ladders' bar coins the row's bars count as (HELL_BAND_COINS); the
// adamant's are the cage's own and spent only at the anvil.
export const HELL_TIERS = [
  { ore: 'dross',    tool: 'dross-pick',  barrier: 'rubble',    band: 'lowbar' },
  { ore: 'cinder',   tool: 'iron-pick',   barrier: 'bone-wall', band: 'lowbar' },
  { ore: 'copper',   tool: 'alloy-pick',  barrier: 'lava-gate', band: 'highbar' },
  { ore: 'obsidian', tool: 'glass-pick',  barrier: 'chains',    band: 'highbar' },
  { ore: 'adamant',  tool: 'adamant-pick', barrier: 'cage',     band: null }
];
// Blows each barrier takes to come down, one a row of HELL_TIERS (the spec's
// "a written table, one a barrier"). Defaults.
export const BARRIER_BLOWS = [120, 200, 320, 480, 700];
// Strokes at the anvil a tool takes. Default.
export const TOOL_STROKES = 24;

// --- the run, laid out (cells of P) ----------------------------------------------
// Chamber i stands HELL_X_IN + i * (CHAMBER_W + CHAMBER_GAP) cells in from
// hell's left, its floor CHAMBER_STEP cells lower than the one before, the
// last chamber's floor on hell's own. The passage to the next chamber runs
// level off a chamber's floor through the gap and out onto a ledge in the
// next one's left wall, CHAMBER_STEP up, and a ladder goes down off the
// ledge; the seam is that left wall under the ledge. All defaults.
export const HELL_X_IN = 12;               // cells from hell's left to the landing's left wall
export const CHAMBER_W = 88;               // a chamber's floor, across
export const CHAMBER_GAP = 12;             // the rock between two chambers, the passage's length
export const CHAMBER_H = 40;               // a chamber's floor to its roof
export const CHAMBER_STEP = 14;            // each chamber's floor this much under the last's
export const PASS_H = 12;                  // the passage's height, and so a barrier's
export const LADDER_AT = 5;                // the ledge's ladder, in from the chamber's left wall
export const FACE_H = 10;                  // the seam face's height off the floor
export const SEAM_MAX = 9;                 // how deep a face cuts back into the wall before it stops moving
export const LUMPS_A_CELL = 6;             // lumps off a face for it to move back a cell
export const VENT_AT = 22;                 // the vent, in from the left wall
export const FURNACE_AT = 40;              // the furnace's left side, in from the left wall
export const FURNACE_W = 8;
export const FURNACE_H = 10;
export const ANVIL_AT = 58;                // the anvil, the landing's alone
export const STORE_AT = 66;                // the landing's store: brimstone banked, bars and water stocked
export const ROAD_AT = 30;                 // the road's ladder down into the landing, in from its left wall
export const SPOIL_AT = 76;                // a chamber's spoil heap, the barrier's pieces carried aside
export const BARRIER_IN = 2;               // a barrier stands this far into the gap
export const BARRIER_W = 6;                // and this wide
export const CAGE_AT = 58;                 // the cage, in the last chamber, standing where a barrier cannot
export const CAGE_W = 14;
export const CAGE_H = 20;
export const CAGE_SPOIL_AT = 30;           // the cage room's spoil heap, clear of the cage

// --- the faces -------------------------------------------------------------------
// Blows a lump takes, by how far the tool is above the seam's tier: its own
// tool slowly, the tier below's fast. A tool under the seam rings off. Defaults.
export const LUMP_BLOWS = [6, 3, 2, 1];
// Lumps lying loose at a face before the miners stop and wait for a hauler:
// the face's pile-full mark. Default.
export const FACE_LOOSE_MAX = 12;

// --- brimstone -------------------------------------------------------------------
// The vents crust over on their own clock, any tool gathers it. Defaults.
export const VENT_CRUST_S = 4;             // a crust every this many seconds at each open vent
export const VENT_CRUST_MAX = 16;          // and no more lying round one

// --- the furnaces ----------------------------------------------------------------
// Heat by depth: chamber i's furnace melts ore of tier i or below. It burns a
// brimstone every FURNACE_BURN_S while lit, warms over FURNACE_WARM_S and
// cools as fast once the fuel is gone; only a hot furnace smelts. Defaults.
export const FURNACE_FUEL_MAX = 12;
export const HOPPER_MAX = 12;
export const FURNACE_BURN_S = 6;
export const FURNACE_WARM_S = 3;
export const ORE_A_BAR = 2;                // lumps that make a bar
export const TRAY_MAX = 8;                 // bars on a furnace's tray before it stops for a hauler

// --- the anvil -------------------------------------------------------------------
// Tool t + 1 is made from tool t and this many bars, by ore; `water` is the
// black water the top two are quenched in. Tier III is the alloy, copper and
// cinder iron at once. Defaults (the counts), the spec's (the shape).
export const TOOL_RECIPES = [
  { dross: 4 },
  { cinder: 6 },
  { copper: 6, cinder: 4 },
  { obsidian: 8, water: 2 },
  { adamant: 10, water: 3 }
];

// --- black water (PLACEHOLDER SOURCE) --------------------------------------------
// The spec has it carried down from the abyss by a ghost. Until the road is
// built it is a count row bought with sparks, a barrel a press, set down at
// the road's foot and carried to the anvil from there. Defaults.
export const WATER_SPARKS = 40;
export const WATER_ROAD_MAX = 6;           // barrels waiting at the road's foot, at most

// --- the ghosts ------------------------------------------------------------------
// The muster's members, a job each in order: the n-th to come down takes the
// n-th job. The wall gang is miners taken off their faces (`S.hell.gang`,
// from the gang card), at most GANG_MAX. Defaults.
export const HELL_JOBS = ['miner', 'stoker', 'hauler', 'smith', 'miner', 'hauler', 'miner',
                          'stoker', 'miner', 'hauler', 'miner', 'miner', 'hauler', 'miner'];
export const GANG_MAX = 8;
export const GHOST_WALK = P * 9;           // px/s along a floor (default)
export const GHOST_CLIMB = P * 5;          // px/s up or down a ladder (default)
export const MUSTER_EVERY_S = 2;           // one down the road this often while the muster is short (default)
export const GHOST_FADE_S = 1;             // a ghost coming down fades in over this (default)
export const ROAD_SPAWN_UP = 16;           // cells above hell's roof a ghost starts down the road (default)
export const GANG_STAND = 2;               // cells short of a barrier the gang stands (default)
export const WALL_RATE = 1;                // hits/s a gang member swings at a barrier (default)

// --- a barrier's pieces ----------------------------------------------------------
// Each cell knocked loose falls to the floor and lies there as spoil until
// a hauler carries it to the heap. Defaults.
export const PIECE_FALL = P * 60;          // px/s/s
export const SPOIL_HEAP_ROW = 8;           // spoil pieces a row of the heap, drawn

// --- the flare -------------------------------------------------------------------
// A vent breaks out on its chamber's clock, warned FLARE_WARN_S ahead, and
// burns FLARE_BURN_S across its whole chamber: the face crusts with FLARE_CRUST blows of slag, the
// barrier the same, the furnace goes out (its fuel and its ore kept), and
// FLARE_BRIMSTONE crust lands round the vent. Deeper is oftener. Never an
// item taken. Defaults.
export const FLARE_EVERY_S = [90, 75, 60, 50, 40];
export const FLARE_FIRST_S = 40;           // the first flare in a chamber this long after it opens
export const FLARE_WARN_S = 4;
export const FLARE_BURN_S = 3;
export const FLARE_CRUST = 6;
export const FLARE_BRIMSTONE = 4;

// --- ladders in bands ------------------------------------------------------------
// Every hell card is one ladder of eight in `tierRows` bands, led by
// brimstone (the dust band's place): then low bars (dross, cinder iron:
// crops'), then low and high bars (copper, glass: ore's), then a spark
// carried down from the yard on top. The coins each band adds to the lead,
// and what each asks a rung, written (the deep's way, SCALE_RUNG_COINS).
// Defaults (the amounts), the spec's (the bands).
export const HELL_BAND_COINS = [[], ['lowbar'], ['lowbar', 'highbar'], ['lowbar', 'highbar', 'spark']];
export const HELL_RUNG_COINS = {
  lowbar:  [0, 0, 2, 3, 4, 6, 8, 10],
  highbar: [0, 0, 0, 0, 2, 3, 4, 6],
  spark:   [0, 0, 0, 0, 0, 0, 20, 40]
};
const BRIM = [4, 6, 9, 12, 16, 20, 25, 30];
// The ladders, as LADDERS (config/rungs.js) reads them: a value for the foot
// and one a rung in the row's unit, and brimstone a rung. Defaults.
export const HELL_LADDERS = {
  hellface:    { value: [0.5, 0.6, 0.7, 0.85, 1, 1.2, 1.4, 1.7, 2], dust: BRIM },     // hits/s, a miner's swing
  hellfurnace: { value: [1, 1.15, 1.3, 1.5, 1.75, 2, 2.3, 2.6, 3], dust: BRIM },     // x, a furnace's pace
  hellanvil:   { value: [1, 1.2, 1.4, 1.7, 2, 2.4, 2.8, 3.3, 4], dust: BRIM },       // hits/s, the smith's strokes
  hellmuster:  { value: [2, 3, 4, 5, 6, 8, 10, 12, 14], dust: BRIM }                // ghosts down the road
};
// A bar at the furnace's foot pace takes this long. Default.
export const SMELT_S = 8;

// --- the placeholder look --------------------------------------------------------
// Black hollows in grey rock, no red (red is the sparks'). Rungs of the one
// grey ramp (palette.js, GREY), the cells picking among them by a fixed hash.
export const HELL_FLOOR_TONES = [8, 9, 8, 7, 9, 8];
export const HELL_ROCK_TONES = [8, 8, 7, 8, 9, 8];
// Each ore's vein, a grey of its own, light to dark down the run. Defaults.
export const HELL_ORE_TONES = [4, 5, 3, 1, 0];
// The barriers' tones, one a row. Defaults.
export const HELL_BARRIER_TONES = [[5, 6, 4], [1, 2, 1], [9, 10, 9], [8, 10, 7], [3, 2, 4]];
export const HEAT_SHIMMER_S = 1.6;         // a floor's heat flickers through its tones on this period (default)
export const SWING_HOLD_S = 0.25;          // a click's swing holds its pose this long (default)
