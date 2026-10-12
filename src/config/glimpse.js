// The serpent's glimpses on the drowned pit's surface (src/glimpse.js): now
// and then a bit of it shows above the liquid and goes back under. A picture
// only; nothing in the yard reads it. Every timing below is in seconds of the
// glimpse's own clock, and every reach in cells, as the mock wrote them
// (docs/mocks/surface-serpent-2026-10-12.html on mock/surface-serpent).

// Which comes next is drawn by weight, then it waits its own interval, drawn
// evenly between the two ends, counted from the end of the one before (or
// from the drowning, for the first). The watcher is the most pointed of the
// three, so it is both picked less often and waited for longer.
export const GLIMPSE_KINDS = ['hump', 'fin', 'watcher'];
export const GLIMPSE_WEIGHT = { hump: 2, fin: 2, watcher: 1 };
export const GLIMPSE_GAP_S = { hump: [40, 90], fin: [45, 100], watcher: [70, 150] };
export const GLIMPSE_LEN_S = { hump: 14, fin: 13, watcher: 15 };

// Everything moves in held steps of this long: no tweened motion.
export const GLIMPSE_STEP_S = 1 / 8;

// Where one may come up: this many cells in from either lip, and this many
// clear of a landing grain stream, the shaft at the mouth and the portal's
// tear, so a grain's notch and the glimpse's rings never pile up. A spot is
// drawn at random this many times before the glimpse waits RETRY and asks
// again.
export const GLIMPSE_LIP = 6;
export const GLIMPSE_CLEAR = 6;
export const GLIMPSE_TRIES = 16;
export const GLIMPSE_RETRY_S = 5;

// Foam and rings, a raised cell of pale grey darkening a tone a step (rungs of
// ABYSS_TONES): a white notch on the liquid's top cell would vanish into the
// white above it and read as a dip.
export const GLIMPSE_FOAM = 10;
export const GLIMPSE_FOAM_DIM = 9;      // foam at rest, a rung darker
export const GLIMPSE_RING = [10, 10, 9, 8, 6, 4];
export const GLIMPSE_RING_STEP = 0.3;    // a ring runs out a cell this often
export const GLIMPSE_RING_LAG = 0.9;     // and the second follows the first by this
export const GLIMPSE_RING_HEAP = 0.5;    // the liquid heaped a cell where it closed, this long
export const GLIMPSE_BROW_DARK = 6;      // a scale's brow in shadow, a rung of ABYSS_TONES
export const GLIMPSE_BUBBLE = 9;         // a bubble climbing, a rung of ABYSS_TONES

// A. The hump: a coil's back rising through the surface, rolling along it a
// short way and sinking.
export const GLIMPSE_HUMP = {
  bulgeAt: 0.75, bulgeW: 4,        // the surface bulging over nine columns before it breaks
  riseAt: 2, riseStep: 0.8,        // rising a row a step
  rollAt: 4.4, sinkAt: 8.4, goneAt: 10.8,
  creep: 0.6, creepFor: 8.8,       // the hump creeps a cell this often
  slide: 0.3,                      // and the scales slide through it twice as fast
  halfW: [0, 3, 4, 5],             // half its width at each height
  round: 0.6,                      // how round its shoulders are
  blotW: 7, blotDeep: 8,           // the stars put out over the body under the surface
  ringW: 3,
};

// B. The fin: a line of the crest's spikes cutting across the surface.
export const GLIMPSE_FIN = {
  spikes: [3, 2, 3, 2, 2, 1, 1],   // each spike's height, front to tail
  apart: 2,                        // cells between spikes
  bow: 2,                          // how far ahead of the front spike the bow wave runs
  bowAt: 0.6, foamAt: 1.2,         // the bow wave heaping, then its foam
  upAt: 1.2, upStep: 0.2,          // the spikes up one by one
  goAt: 2, cross: 0.2, crossFor: 6.4,   // crossing a cell this often
  sinkAt: 8.6, sinkLag: 0.15, sinkStep: 0.2,  // under front first
  bowEnd: 8.6,
  wakeEnd: 9.6, wakeBack: 12, wakeLen: 8, wakeStep: 0.2,
  wake: [10, 10, 9, 8, 7, 6, 5],   // the wake's foam, fading a rung a step
  blotBack: 14, blotDeep: 5,
  ringsAt: 9.8, ringBack: 6, ringW: 7,
};

// C. The watcher: the top of the head breaking, the eye open on the nearest
// body on the lip, a blink, and back under, away from them.
export const GLIMPSE_WATCHER = {
  bubbleLag: 0.6, bubbleStep: 0.25, bubbleDeep: 10,   // three bubbles, a cell a step
  bulgeAt: 2, bulgeW: 3,
  upAt: 3.6, fullAt: 4.0, dropAt: 10.8, goneAt: 11.6,
  rollAt: 10, roll: 0.4,           // rolling back under a cell this often
  halfW: 3,
  blotFrom: 0.5, blotW: 5, blotDeep: 6,
  eyeOpen: 4.6, eyeWide: 4.85, eyeShut: 9.6, eyeGone: 9.85,
  blinkAt: 7.4, blinkEnd: 7.6, turnAt: 6.4,
};
