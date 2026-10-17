// --- act 4: hell -----------------------------------------------------------------
// DESIGN.md, "Acts 3 and 4: the afterlife and hell (design, not built)", act 4:
// the mine and the forge (the owner's call 4, 2026-10-17). The scaffold only:
// the place stands and steps, and nothing a player can reach plays in it. A
// number the spec gives is the spec's; every other is a default chosen to
// stand the scaffold up, marked so in its comment.
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
// right than the last. The scaffold stands it as one hollow the run will be
// laid out in. Defaults, all of them.
export const HELL_GAP = P * 20;            // world px of rock between the deep's floor and hell's roof (default; the shaft's)
export const HELL_H = P * 130;             // hell's roof to its floor (default; the deep's)
export const HELL_W = P * 520;             // across (default; the deep's)
export const HELL_FLOOR_MARGIN = P * 9;    // the floor stands this far up off the window's foot (default)
export const HELL_OPEN_AT = 0.2;           // the camera opens over the landing, a share of the width (default)
export const HELL_FLOOR_CELLS = 6;         // the placeholder floor's depth, in cells (default)

// --- the chain: five ores, five tools, five barriers -----------------------------
// The spec's table, a row a chamber, top to bottom; every name a working
// name and a key, not a word (the player's words are the owner's, in
// locales/en.ftl, when they are built). A chamber's ore yields to the tool of
// the tier before it; its bars make the tool its barrier yields to; behind the
// barrier is the next ore. The run's size is call 4, open (five recommended,
// four without the chains): everything that counts chambers, barriers or wall
// beats reads this table's length, so dropping a row is the whole change.
export const HELL_TIERS = [
  { ore: 'dross',    tool: 'dross-pick',  barrier: 'rubble' },
  { ore: 'cinder',   tool: 'iron-pick',   barrier: 'bone-wall' },
  { ore: 'copper',   tool: 'alloy-pick',  barrier: 'lava-gate' },
  { ore: 'obsidian', tool: 'glass-pick',  barrier: 'chains' },
  { ore: 'adamant',  tool: 'adamant-pick', barrier: 'cage' }
];
// Blows each barrier takes to come down, one a row of HELL_TIERS (the spec's
// "a written table, one a barrier"). Defaults.
export const BARRIER_BLOWS = [120, 200, 320, 480, 700];
// Strokes at the anvil a tool takes. Default.
export const TOOL_STROKES = 24;

// --- ladders in bands ------------------------------------------------------------
// Every hell card's bands: brimstone; then brimstone and low bars (dross,
// iron); then brimstone, low and high bars (copper, glass); then low bars,
// high bars and a spark carried down from the yard. The spec's.
export const HELL_BANDS = [['brimstone'], ['brimstone', 'low'], ['brimstone', 'low', 'high'], ['low', 'high', 'spark']];

// --- the placeholder backdrop ----------------------------------------------------
// A black hollow on a dark floor, no red (red is the sparks'). Rungs of the
// one grey ramp (palette.js, GREY), the floor's cells picking among them.
export const HELL_FLOOR_TONES = [8, 9, 8, 7, 9, 8];
