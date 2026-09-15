import { P } from './yard.js';

export let LOOSE_DEEP = 3;

export let BANK_SLOPE = 1.5;
// The hole is given, not dug: PIT_W_MAX across and PIT_H down from the first
// frame. A hole bought a dig at a time made the pit the ceiling on everything
// else in the game. PIT_H is what the world reserves under the ground line,
// and the floor of the window sits on it.
export const PIT_H = 276;        // the pit is one fixed hole, in world pixels: this deep
// This much room above the brim. Once the hole is full the pile keeps going,
// heaping up over the mouth -- but only over the mouth: the plot of sand is
// only as wide as the hole, so it can rise but never get out onto the ground.
export const PIT_HEAP = 150;
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
