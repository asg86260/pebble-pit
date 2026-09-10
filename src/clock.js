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
import { CLOCK_LEAP_MS } from './config.js';

let t = performance.now();
let wall = performance.now();

export const now = () => t;

// Back to the start of a run.
//
// The hand above starts wherever the wall happened to be when the page loaded,
// and that is right for play: it only ever has to go forward. It is wrong for a
// run you want to have again. Some of the yard is worked out from the time
// itself rather than from how much of it has passed -- the wind over the yard is
// a wave read off `now()`, and so is anything else with a phase -- so two runs
// of the same seed that start at different times are two different yards, and no
// amount of seeding the chance fixes it. Reseeding without this gave the same
// draws in a yard leaning a different way.
//
// So a seeded run starts the clock as well as the chance: `seedGame` in hooks.js
// calls this before it clears the yard, and the pair of them is what "the same
// run" means. Nothing in play calls it -- the player's clock is never wound
// back, and this is why the comment above still holds where it matters.
export function restart(at = 0) { t = at; wall = performance.now(); }

// A real frame: however much the wall moved, up to one leap, unless the game
// is being held.
//
// The leap is the whole of it. A hidden window gets no frames -- the browser
// stops calling `requestAnimationFrame` -- so the first frame back sees a wall
// that has moved by however long you were away. This used to add the lot to
// `t` in one go while `dt` downstream was clamped to a tenth of a second: the
// yard did no work for the hour and every deadline measured against `now()` --
// a dose, a spin, a break, the next boulder -- fired on the frame you came
// back. Capping the clock at the same tenth that caps `dt` makes the two halves
// of the frame say the same thing, and what they say is that a hidden window
// is a pause: the yard stands where you left it, and so does everything you
// paid for. Nothing is owed for the time away and nothing is taken for it.
//
// A held frame adds nothing at all, and that is the same rule seen from the
// other side: a pause is a gap the wall moved across and the clock did not.
// The wall is still read on every frame, held or hidden, so that the frame
// after a pause measures itself from the pause's end rather than from its
// start -- otherwise the first frame back would be one long leap for however
// long the space bar was down, which is the very thing the cap is here to stop.
export function tick(held) {
  const r = performance.now();
  if (!held) t += Math.min(CLOCK_LEAP_MS, Math.max(0, r - wall));
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
// How long the frame just drawn actually was, in milliseconds. `frames()` is
// that same length as a multiple of the sixtieth the game was tuned in, which is
// the right shape for a per-frame speed and the wrong one for anything reasoning
// about instants on the clock. The dance needs the latter: whether a beat can be
// over before a given moment is a question about how far apart two frames are.
export const frameMs = () => scale * TUNED;
export function setFrames(dt) {
  scale = Math.max(0, Math.min(3, dt / TUNED));
}
