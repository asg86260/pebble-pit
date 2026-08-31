// One source of chance for the whole yard.
//
// Every wobble in this game -- where a mote of air starts, which way a fly
// turns, whether a break is a cigarette or a sit-down, which slice the wheel
// stops on -- used to be its own call to `Math.random()`, and there were a
// hundred and sixty-six of them. That is fine while you are playing: a yard that
// is different every time you open it is the point. It is not fine while you are
// checking, because a check that runs a busy yard for thirty seconds and then
// looks at it is looking at a different yard every run. The cost was paid in
// tolerance bands -- a check that wants to say "the hauler got there" says "the
// hauler got within forty pixels" instead, because it has to hold for every yard
// the chance could have built -- and in the three checks that failed under load
// and passed on the next run, which is the worst kind of failure there is: you
// cannot bisect it, you cannot reproduce it, and after a while you stop reading
// it.
//
// So: one generator, and `Math.random` appears nowhere under src/ any more.
// Everything draws from `rand()`, and `rand()` is a number worked out from a
// seed. Give the same seed and the yard does the same thing, frame for frame,
// because the frames are already turned by hand (see clock.js) and now the
// chance is too.
//
// Play is unchanged, and that is deliberate: the seed on load is taken from the
// clock and from the platform's own entropy, so opening the game gives a fresh
// yard exactly as before. Determinism is something a check asks for -- `__seed`
// in hooks.js -- and never something the player gets handed.
//
// The generator is mulberry32: one 32-bit word of state, four lines of
// arithmetic, no dependency. It is not cryptography and is not trying to be.
// What it has to be is fast enough that a hundred and sixty-six call sites in a
// sixty-frame-a-second loop do not notice it, and even enough that a check
// reading a distribution -- how the motes spread across the sky, how the finds
// scatter through the heap -- reads the same shape it read from `Math.random`.
// Mulberry32 passes gjrand and is a couple of multiplies; sfc32 is the other
// obvious pick and has a wider state, but a wider state is only worth having
// when you need a period past 2^32 draws, and thirty seconds of yard is a few
// hundred thousand.

// The word the whole yard's chance is worked out from. It is not the seed: it is
// the seed after however many draws have been taken since, which is why `seed()`
// below reports the seed it was set to rather than this.
let state = 0;
let current = 0;

// A seed from nothing in particular: the clock, and whatever the platform's own
// `Math.random` has to offer. Both, because the clock alone gives two tabs
// opened in the same millisecond the same yard.
const entropy = () =>
  (Date.now() ^ (Math.random() * 0x100000000)) >>> 0;

// Start the whole yard's chance again from a known place. A seed of 0 is a
// perfectly good seed and is kept as one -- mulberry32 adds its constant before
// it mixes, so a zero word is not a stuck one.
export function seedRng(n) {
  current = (n >>> 0);
  state = current;
  return current;
}

// Which run this is. A check that fails prints it (see report.js), and the run
// it names can be had again.
export const seed = () => current;

// A run of its own, out of the platform's entropy. This is what "a new game"
// means down here: `reset` in persist.js calls it before it builds anything, and
// writes the number it gets back into `S.runSeed`, so the yard a player is
// looking at is a yard that can be named and had again. A run started from a
// seed on purpose -- `seedGame` in hooks.js -- goes nowhere near this.
export const reseed = () => seedRng(entropy());

// The generator's state, rather than the seed it started from.
//
// A seed alone does not describe where a run has got to: it describes where the
// run began, and a game saved an hour in has taken some hundreds of thousands of
// draws since. Restoring the seed would start the whole stream again, which is
// not continuing a run -- it is beginning a second one that happens to share a
// name. Mulberry32 is one 32-bit word, so the whole of "where the chance has got
// to" fits in a number the save can carry, and a reload picks the stream up
// exactly where the tab was closed.
export const rngState = () => state >>> 0;
export const setRngState = n => { state = n >>> 0; return state; };

// The draw itself, in the shape everything already expects: a number in [0, 1).
export function rand() {
  state = (state + 0x6D2B79F5) | 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

seedRng(entropy());
