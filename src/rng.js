// One source of chance for the whole yard.
//
// `Math.random` appears nowhere under src/. Everything draws from `rand()`,
// which is worked out from a seed, so a seeded run does the same thing frame
// for frame (the frames are turned by hand too; see clock.js) and a check
// that fails can be had again. Play is unchanged: the seed on load comes from
// the clock and the platform's entropy, and determinism is only ever asked
// for (`__seed` in hooks.js).
//
// The generator is mulberry32: one 32-bit word of state, a couple of
// multiplies, no dependency. Its period of 2^32 is plenty for a yard that
// draws a few hundred thousand times in thirty seconds.

// The seed after however many draws have been taken since; `seed()` reports
// the seed it was set to, not this.
let state = 0;
let current = 0;

// The clock alone gives two tabs opened in the same millisecond the same yard.
const entropy = () =>
  (Date.now() ^ (Math.random() * 0x100000000)) >>> 0;

// A seed of 0 is a good seed: mulberry32 adds its constant before it mixes,
// so a zero word is not a stuck one.
export function seedRng(n) {
  current = (n >>> 0);
  state = current;
  return current;
}

// Which run this is. A check that fails prints it (report.js).
export const seed = () => current;

// A run of its own. `reset` in persist.js calls it before it builds anything
// and keeps the number in `S.runSeed`; a run seeded on purpose (`seedGame` in
// hooks.js) goes nowhere near this.
export const reseed = () => seedRng(entropy());

// The generator's state rather than the seed: restoring the seed would start
// the stream again, which is a second run sharing a name, not the saved one
// continued. One word, so the save carries it.
export const rngState = () => state >>> 0;
export const setRngState = n => { state = n >>> 0; return state; };

// A number in [0, 1).
export function rand() {
  state = mix(state);
  return draw(state);
}

// One step of mulberry32, and the number a word of it is worth.
const mix = s => (s + 0x6D2B79F5) | 0;
function draw(s) {
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// A stream of its own, for a thing that needs a lot of chance and must not
// spend the yard's: the audio's noise buffer takes a couple of hundred
// thousand draws on the first gesture, and taken from `rand()` they would
// move the browser off the node yard's stream.
export function stream(n) {
  let s = n >>> 0;
  return () => { s = mix(s); return draw(s); };
}

seedRng(entropy());
