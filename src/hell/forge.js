// The furnaces and the anvil (DESIGN.md, "Acts 3 and 4", act 4, "The chain:
// five ores, five tools, five barriers", smelting and the forge).
//
// A furnace stands in every open chamber, its heat its chamber's depth: it
// melts ore of its tier or below, and the haulers only ever bring it such
// (bodies.js). It burns a brimstone every FURNACE_BURN_S while lit, warms
// while it burns and cools once the fuel is gone, and only a hot furnace
// smelts; one that runs out goes out and waits for a stoker to light it
// again. Bars land on its tray and are carried up the run to the anvil's
// stock (`S.hell.bars`), which is also what the boards spend.
//
// The anvil, in the landing, turns the tool the forge has (`S.hell.tool`, 0
// the yard's pick) and a tier's bars into the next tool: the recipe
// (TOOL_RECIPES) is taken off the stock when the smith starts, and the tool
// is done after TOOL_STROKES of the smith's held strokes. Tier III is the
// alloy, copper and cinder iron at once; the top two take black water, the
// quench. A new tool reaches each face in a body's hands before its swing
// changes (bodies.js, `faces[i].tool`).

import { S } from '../state.js';
import { HELL_TIERS, FURNACE_FUEL_MAX, FURNACE_BURN_S, FURNACE_WARM_S, ORE_A_BAR, SMELT_S, TRAY_MAX,
         TOOL_RECIPES, TOOL_STROKES } from '../config.js';
import { hellValue } from './levels.js';

const sum = o => Object.values(o).reduce((n, v) => n + v, 0);
export const hopperCount = f => sum(f.hopper);
export const trayCount = f => sum(f.tray);
export const furnaceHot = f => f.warm >= 1;

// The ore a furnace in chamber `i` would smelt next: the deepest it can melt
// with a bar's worth in the hopper.
function nextOre(i, f) {
  for (let t = i; t >= 0; t--) {
    const ore = HELL_TIERS[t].ore;
    if ((f.hopper[ore] || 0) >= ORE_A_BAR) return ore;
  }
  return null;
}

// A stoker's brimstone into furnace `i`: lights it whether or not there was
// room, and is taken only if there was. True if it was taken.
export function stoke(i) {
  const f = S.hell.furnaces[i];
  f.lit = true;
  if (f.fuel >= FURNACE_FUEL_MAX) return false;
  f.fuel++;
  return true;
}

function stepFurnaces(dt) {
  const h = S.hell, pace = hellValue('hellfurnace');
  for (let i = 0; i <= h.chamber; i++) {
    const f = h.furnaces[i];
    if (f.lit && f.fuel > 0) {
      f.warm = Math.min(1, f.warm + dt / FURNACE_WARM_S);
      f.burn += dt;
      while (f.burn >= FURNACE_BURN_S && f.fuel > 0) { f.burn -= FURNACE_BURN_S; f.fuel--; }
      if (f.fuel <= 0) { f.lit = false; f.burn = 0; }
    } else {
      f.lit = false;
      f.warm = Math.max(0, f.warm - dt / FURNACE_WARM_S);
    }
    if (!furnaceHot(f) || trayCount(f) >= TRAY_MAX) continue;
    const ore = nextOre(i, f);
    if (!ore) { f.prog = 0; continue; }
    f.prog += dt * pace / SMELT_S;
    if (f.prog < 1) continue;
    f.prog = 0;
    f.hopper[ore] -= ORE_A_BAR;
    f.tray[ore] = (f.tray[ore] || 0) + 1;
    h.smelted[ore] = (h.smelted[ore] || 0) + 1;
  }
}

// --- the anvil ---------------------------------------------------------------
// What the next tool asks, or null past the last.
export const nextRecipe = () => TOOL_RECIPES[S.hell.tool] || null;
const stocked = (h, r) => Object.entries(r).every(([k, n]) => (k === 'water' ? h.water : h.bars[k] || 0) >= n);
export const recipeReady = () => { const r = nextRecipe(); return !!r && stocked(S.hell, r); };

// One of the smith's strokes at the anvil: starts the next tool when its
// recipe is stocked, else works the one on it. What it did, as a word:
// 'idle', 'start', 'stroke' or 'done'.
export function strikeAnvil() {
  const h = S.hell;
  if (!h.forge) {
    const r = nextRecipe();
    if (!r || !stocked(h, r)) return 'idle';
    for (const [k, n] of Object.entries(r)) { if (k === 'water') h.water -= n; else h.bars[k] -= n; }
    h.forge = { tier: h.tool + 1, strokes: 0 };
    return 'start';
  }
  if (++h.forge.strokes < TOOL_STROKES) return 'stroke';
  h.tool = Math.max(h.tool, h.forge.tier);
  h.forge = null;
  return 'done';
}

// One frame of the furnaces. The anvil moves only under the smith's hand
// (bodies.js).
export function stepForge(c) {
  stepFurnaces(c.dt / 1000);
}

// The tool tier the forge has made, 0 the yard's own pick.
export const toolTier = () => (S.hell ? S.hell.tool : 0);
