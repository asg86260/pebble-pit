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

// A real frame: however much the wall moved, unless the game is being held.
//
// The wall is read either way. A pause that stopped reading it would come back
// having missed however long you were away and add the lot in one go, which is
// every timer in the yard firing at once -- the same thing a long tab-out would
// do if `dt` were not clamped.
export function tick(held) {
  const r = performance.now();
  if (!held) t += Math.max(0, r - wall);
  wall = r;
}

// a turned handle: however much we say
export function advance(ms) { t += ms; }

// --- how long this frame was, in frames -------------------------------------
//
// Everything in this game that *counts* has always been on the clock: how fast a
// rock comes apart, how long research takes, how quickly the sky fouls. What was
// not on the clock was everything that *moves*. Walking, falling, climbing, the
// rain coming down, the clouds, the shake -- all of them were written as pixels
// a frame, which is a speed only if the frames arrive at one rate. On a machine
// drawing thirty they arrive at half of it, and the yard walked at half speed
// while its clocks kept perfect time: a body took twice as long to reach a job
// that was still finishing exactly when it always did.
//
// So the frame says how long it was, in units of the sixtieth of a second the
// game was tuned in, and every per-frame speed is multiplied by it. At sixty
// this is exactly one and nothing anywhere changes -- which is worth saying,
// because it means the entire suite of checks, all of which run at a fixed
// sixtieth, is testing the same numbers it always tested.
const TUNED = 1000 / 60;
let scale = 1;

// Capped, and not for tidiness: `dt` is already clamped to a tenth of a second
// upstream, and a body that moved six frames' worth in one go would step through
// a wall it should have been stopped by. Everything that moves here does so in
// whole steps that check where they are going, so the cap is what keeps a hitch
// from putting somebody on the wrong side of something.
export const frames = () => scale;
export function setFrames(dt) {
  scale = Math.max(0, Math.min(3, dt / TUNED));
}
