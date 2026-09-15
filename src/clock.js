// The game's clock.
//
// Everything that asks the time asks here rather than the browser. In play it
// follows the wall; a check turns the handle itself, so a hundred seconds of
// yard is six thousand steps and a few milliseconds, and the same answer every
// time.

// It only ever goes forward. A turned handle adds on top of the wall, so the
// next real frame carries on rather than snapping back and leaving every
// timer in the future, which looks exactly like the game having seized up.
import { CLOCK_LEAP_MS } from './config.js';

let t = performance.now();
let wall = performance.now();

export const now = () => t;

// Back to the start of a run. Some of the yard is read off `now()` itself
// rather than off elapsed time (the wind is a wave with a phase), so two runs
// of one seed started at different times are two different yards; `seedGame`
// in hooks.js calls this with the seed. Nothing in play calls it.
export function restart(at = 0) { t = at; wall = performance.now(); }

// A real frame: however much the wall moved, up to one leap, unless the game
// is being held.
//
// A hidden window gets no frames, so the first frame back sees a wall that
// moved by however long you were away. The leap caps the clock at the same
// tenth of a second that caps `dt` downstream, so the two halves of the frame
// agree that a hidden window is a pause; otherwise every deadline measured
// against `now()` fires on the frame you come back. A held frame adds nothing.
// The wall is still read on a held frame so the frame after a pause measures
// from the pause's end, not its start.
export function tick(held) {
  const r = performance.now();
  if (!held) t += Math.min(CLOCK_LEAP_MS, Math.max(0, r - wall));
  wall = r;
}

// a turned handle: however much we say
export function advance(ms) { t += ms; }

// --- how long this frame was, in frames -------------------------------------
//
// Every per-frame speed is multiplied by the frame's length in sixtieths of a
// second, so a machine drawing thirty walks at full speed. At sixty this is
// exactly one, so the checks, which run at a fixed sixtieth, test the same
// numbers they always did.
const TUNED = 1000 / 60;
let scale = 1;

// Capped: everything that moves does so in whole steps that check where they
// are going, and a body that moved six frames' worth in one go would step
// through a wall.
export const frames = () => scale;
// The frame's length in milliseconds, for anything reasoning about instants
// on the clock (the dance asks whether a beat can be over before a moment).
export const frameMs = () => scale * TUNED;
export function setFrames(dt) {
  scale = Math.max(0, Math.min(3, dt / TUNED));
}
