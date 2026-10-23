// State a module keeps between frames, outside `S`, and how to clear it.
//
// `S` is what a new game blanks and a load reads back; anything a module
// holds for itself (a timer, a pending scroll, a cache keyed by the yard) is
// invisible to both, so it outlives the game it belonged to and a check goes
// red only after some other check (docs/wave-tests.md, step 2). A module
// that keeps such a thing says so once, here, with what clearing it means;
// a new game (`reset` in persist.js) and a load (`restore`, but for the
// checks' warm reload) clear them all.
// test/held-state.test.mjs holds every module-level `let` in the game to be
// registered here or marked `// cache:` on its line.

const HELD = new Map();

export const held = (name, clear) => { HELD.set(name, clear); };
export const resetHeld = () => { for (const clear of HELD.values()) clear(); };
