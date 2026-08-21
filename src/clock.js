// The game's clock.
//
// Everything that asks the time asks here rather than the browser. In play it
// follows the wall exactly, so nothing about the game changes. But a check that
// wants to watch a worker walk the length of the yard can turn the handle
// itself -- a hundred seconds of yard becomes six thousand steps and a few
// milliseconds, instead of a hundred seconds of sitting there.
//
// That is worth more than the speed. A check that sleeps for a second and hopes
// is a check that fails on a slow machine and passes on a fast one; a check that
// runs exactly six hundred steps gets the same answer every time.

// It only ever goes forward. A real frame adds however long the wall says has
// passed, and a turned handle adds whatever it likes on top -- so a check can
// run twenty seconds of yard and the next real frame carries on from there
// rather than snapping back and leaving every timer in the game twenty seconds
// in the future, which looks exactly like the game having seized up.
let t = performance.now();
let wall = performance.now();

export const now = () => t;

// a real frame: however much the wall moved
export function tick() {
  const r = performance.now();
  t += Math.max(0, r - wall);
  wall = r;
}

// a turned handle: however much we say
export function advance(ms) { t += ms; }
