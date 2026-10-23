// What a check is made of, the same in both tiers (docs/wave-tests.md, step 3):
// test/helpers.mjs and src/selftest/kit.js import these rather than each
// writing its own.

export const ok = (cond, what, detail = '') => ({ pass: !!cond, what, detail });

// Waits for `fact()` a frame at a time, turning each frame with `frame` (the
// tier's: a game frame in the node yard, a drawn frame on the page), up to
// `frames` of them. True when the fact came, false when it never did; a check
// asserts on the answer, so a wait that times out fails where it is read
// rather than hanging. This is what replaces a sleep: a sleep is a guess at
// how long a thing takes, and a slow machine makes every guess wrong.
export async function until(fact, frame, frames = 120) {
  for (let i = 0; i < frames; i++) {
    if (fact()) return true;
    await frame();
  }
  return !!fact();
}
