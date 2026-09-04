import { P } from './yard.js';

export let LOOSE_DEEP = 3;

export let BANK_SLOPE = 1.5;
// The hole is given, not dug. It is PIT_W_MAX across and PIT_H down from the
// first frame -- the hole the yard has always been drawn around.
//
// It used to be bought a dig at a time, from a scrape to the whole thing, and
// that made a hole in the ground the ceiling on everything else in the game:
// what you could hold was what you had dug, so every price was really a
// statement about how much pit you had bought first, and a row you could not
// afford was as often a row you had nowhere to put. The pit is scenery with a
// number in it. Making it the gate on the things the game is actually about was
// the tail wagging the dog.
//
// PIT_H is what the world reserves under the ground line, and the floor of the
// window sits on it.
export const PIT_H = 276;        // the pit is one fixed hole, in world pixels: this deep
// And this much room above the brim. Once the hole itself is full the pile keeps
// going, heaping up over the mouth rather than stopping dead at the ground line
// -- but only over the mouth: it is the same plot of sand, which is only as wide
// as the hole, so it can rise but it can never get out onto the ground.
export const PIT_HEAP = 150;
// And how the surplus lies. Inside the hole the pile is level, because a hole
// fills up. Above the brim it is a heap: highest at the lip, where it is tipped
// in, leaning away down the length of the hole. Without that it fills the near
// end to the very top and stops dead, which is a wall rather than a pile.
export const PIT_HEAP_SLOPE = 0.12;   // rows of surplus lost per column along
export const PIT_W_MAX = 3600;   // and this wide, six hundred cells of it
// What a grain in the pile is drawn at. **One size, for ever.**
//
// It listed three for a while -- six pixels, then three, then two -- and red
// bought the steps down: the same dust in smaller pieces, so the hole held four
// times as much and then nine. The machinery worked exactly as designed and the
// design was wrong. At two pixels the pile stops reading as dust at all; it is a
// flat grey slab with a diagonal top, and buying a bigger number by making every
// grain invisible is buying the number and throwing away the thing.
//
// It did not even pay for itself. Measured on a pressed hole with two hundred
// thousand dust in it, the whole pile costs 0.09 ms a frame to settle and draw
// against a budget of 16.7 -- so the finer grain was never bought back in speed
// either. It spent the rarest currency in the game to make the yard uglier.
//
// What holds the overflow now is **the rift**, where dust costs nothing to keep
// because nothing about it is drawn. The hole holds what the hole holds, at full
// size: 37,566 grains, and every one of them looks like dust. See `## The rift`
// in DESIGN.md.
export const PIT_GRAINS = [P];
export const PIT_PAD = 18;       // cells of ground past its far edge, so you can see the end

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const PIT_KNOBS = [
  { key: 'BANK_SLOPE', label: 'pile slope', min: 0.4, max: 4, step: 0.1,
    get: () => BANK_SLOPE, set: v => { BANK_SLOPE = v; } },
  { key: 'LOOSE_DEEP', label: 'scatter depth', min: 1, max: 12, step: 1,
    get: () => LOOSE_DEEP, set: v => { LOOSE_DEEP = v; } }
];
