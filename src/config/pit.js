import { P } from './yard.js';

export let LOOSE_DEEP = 3;

export let BANK_SLOPE = 1.5;
// The hole is given, not dug: PIT_W_MAX across and PIT_H down from the first
// frame. A hole bought a dig at a time made the pit the ceiling on everything
// else in the game.
//
// **What it holds is a third of what it did**, so it tears in step with
// ABYSS_AT (config/rift.js), cut from a million to 300,000. The cut is in
// the depth, hole and heap alike, because the width is what the yard is laid
// out along (the deep under it, the rift's seat, the world's end). A third of
// 276 and 150 is 92 and 50, off the cell grid; of the whole-cell pairs that
// keep the hole two thirds of the height, 84 and 48 come nearest a third of
// the old count: 12,722 grains of 37,566 (`capacityAt` in pit.js counts it).
export const PIT_H = 84;         // the pit is one fixed hole, in world pixels: this deep
// What the world reserves under the ground line, and the floor of the window
// sits on it. Not the hole's depth: the quarry's deepest cut and the window's
// framing were laid out on this, and the ground under a shallower hole is
// ground. At least PIT_H and the quarry's last bench (a check holds both).
export const GROUND_DEEP = 276;
// This much room above the brim. Once the hole is full the pile keeps going,
// heaping up over the mouth -- but only over the mouth: the plot of sand is
// only as wide as the hole, so it can rise but never get out onto the ground.
export const PIT_HEAP = 48;
// Inside the hole the pile is level, because a hole fills up. Above the brim
// it is a heap: highest at the lip, where it is tipped in, leaning away down
// the length of the hole; without that the near end fills to the top and
// stops dead, a wall rather than a pile.
export const PIT_HEAP_SLOPE = 0.12;   // rows of surplus lost per column along
export const PIT_W_MAX = 3600;   // and this wide, six hundred cells of it
// What a grain in the pile is drawn at. **One size, for ever.** At two pixels
// the pile stops reading as dust and is a flat grey slab with a diagonal top,
// and it bought nothing in speed either (0.09 ms a frame for the whole pile).
// What holds the overflow is **the rift**, where dust costs nothing to keep
// because nothing about it is drawn. See `## The rift` in DESIGN.md.
export const PIT_GRAINS = [P];
export const PIT_PAD = 18;       // cells of ground past its far edge, so you can see the end

// The dev panel's rows for the knobs above, beside the bindings because an
// imported `let` is read-only; config.js gathers every file's rows into TUNABLE.
export const PIT_KNOBS = [
  { key: 'BANK_SLOPE', label: 'pile slope', min: 0.4, max: 4, step: 0.1,
    get: () => BANK_SLOPE, set: v => { BANK_SLOPE = v; } },
  { key: 'LOOSE_DEEP', label: 'scatter depth', min: 1, max: 12, step: 1,
    get: () => LOOSE_DEEP, set: v => { LOOSE_DEEP = v; } }
];

// A bill handed back is tossed into the hole as at most this many grains in
// the air, each carrying its share, so a refund of thousands is one toss.
export const REFUND_FLECKS = 40;
