// The two of them's wardrobe (DESIGN.md, "What the two of them wear"): the
// numbers its drawing and its picker are made of. The items themselves are
// rows of data in src/wardrobe.js.

// Face, neck and pattern marks are laid in this many world pixels, the rim's
// own weight: the body's white middle is fourteen pixels, less than three
// cells, so a mark on it cannot sit on the cell grid (the owner accepted the
// mock's two-pixel marks, 2026-10-16).
export const WARD_UNIT = 2;
// The marks' grid on the middle: seven units across and down.
export const WARD_GRID = 7;

// The two greys an item may be drawn in, as rungs of the yard's ramp (GREY,
// config/palette.js): a mid grey, and a pale one near the paper.
export const WARD_GREY = 5;
export const WARD_PALE = 2;
// And in the deep, as rungs of its own capped ramp (render/deeptones.js,
// `GREYS`): the deep's paper is the black, so its pale is the dark one.
export const WARD_DEEP_GREY = 8;
export const WARD_DEEP_PALE = 4;

// How often the moving things change pose, a second: a cape's or a scarf's
// tail as the body walks, a balloon's bob, a flag's wave.
export const WARD_STEP_HZ = 4;
export const WARD_BOB_HZ = 1.2;
export const WARD_WAVE_HZ = 3;
// How long a body stood still between two steps still counts as walking.
export const WARD_STILL_S = 0.25;

// A roll of the dice on the picker: none (or plain) is this many times as
// likely as any one item, so a roll is not a costume party.
export const WARD_NONE_ODDS = 2;

// The picker's close-up: how many screen pixels a world pixel is, and how
// wide and tall it is in world pixels (room over the square for a flag or a
// balloon, and behind it for a cape). Where the page is too narrow for that
// and the fields beside it, a world pixel is a screen pixel less.
export const WARD_BIG = 3;
export const WARD_BIG_W = 64;
export const WARD_BIG_H = 60;
// A tile of the picker's grid (option A of
// docs/mocks/wardrobe-expansion-2026-10-16): the bare square wearing one
// item, this many world pixels wide and tall at this many screen pixels a
// world pixel, its feet this far over the tile's bottom.
export const WARD_TILE_W = 36;
export const WARD_TILE_H = 50;
export const WARD_TILE_K = 2;
export const WARD_TILE_FOOT = 5;
// How strong a locked item is drawn on the close-up while it is tried on.
export const WARD_TRY_ALPHA = 0.35;

// Who the two of them are (DESIGN.md, "Who you are"): the longest name the
// player may give either square, in characters. The narrow places a name
// stands are the story card's one line and the phone's sheet; "sqhusband",
// the longest role word, is nine.
export const NAME_MAX = 12;
// The pad's key grid under the name row: columns are half keys, so a key is
// two and the home rows can sit offset like a keyboard's.
export const NAME_GRID_COLS = 20;

// --- the aura (render/wardaura.js; the owner's vote on
// docs/mocks/wardrobe-aura-2026-10-16) ---------------------------------------------
// The particles change pose this many times a second, held between (the
// mock's own frames).
export const WARD_AURA_FPS = 12;
// How long a body's walk is remembered, in seconds: the particles it leaves
// behind (motes, prints, petals, embers) stand where it was when each was
// born, and the longest of them lives under this.
export const WARD_AURA_KEEP_S = 3;
// How far apart the two of them's particles are, as a seed: the same aura on
// both is not the same particles in step.
export const WARD_AURA_SEED = 17;
// And their turning things (the orbit, the scales), in radians.
export const WARD_AURA_TURN = 2.1;
// Each aura's numbers, in seconds and world pixels off the body's top-left
// (its square is WORKER across): `n` particles, each living `life`, `seed`
// its own throw of the dice; `rung` a tone on the yard's grey ramp (GREY),
// `rungs` how many rungs on it a particle may be drawn darker; `in` and
// `out` the shares of a life spent fading in and out; `back` the share drawn
// behind the body.
export const WARD_AURAS = {
  // lift off the body, drift and thin away
  'dust-motes': { n: 4, life: 2.4, seed: 1, spread: 30, sway: 3, top: 2, band: 14, rise: 10, rung: 4, rungs: 3, back: 0.5 },
  // shaken off the sides to the ground: three walking, one standing
  'pebble-bits': { n: 3, life: 0.9, seed: 2, jitter: 3, from: 6, band: 6, fall: 0.6, rung: 7, rungs: 3, in: 0.08 },
  // rings rising off the shoulders, wobbling a unit
  bubbles: { n: 3, life: 2.2, seed: 3, lag: 0.4, off: 5, jitter: 3, wobble: 9, from: 10, rise: 28, in: 0.15, out: 0.3, rung: 6 },
  // one pixel round the middle on a flat ellipse, two fading behind it
  'orbiting-pixel': { speed: 2.6, trail: [1, 0.5, 0.22], gap: 0.3, rx: 15, ry: 4, mid: 8, rung: 10 },
  // a point fades in, holds a plus, fades out, rests
  'sparkle-glints': { n: 2, life: 1.9, seed: 4, up: 0.7, r: 14, rr: 5, squash: 0.8, mid: 8, in: 0.15, hold: 0.55, out: 0.3, rung: 9 },
  // a print a step, right foot and left, walking only
  footprints: { step: 0.3, life: 2.4, below: 2, feet: [11, 3], rung: 6 },
  // a cloud a beat behind over the head, bobbing; drops to the head
  'rain-cloud': { lag: 0.4, bob: 1.2, over: 18, inset: 1, rows: ['..####..', '.######.', '########'], rung: 3, rungs: 3,
                  drops: 3, dropLife: 0.55, seed: 5, dropIn: 2, dropSpan: 12, dropTo: 3, dropLen: 3, out: 0.3, dropRung: 7 },
  // falling from over the head, swaying and turning, a moment on the ground
  'falling-petals': { n: 3, life: 2.8, seed: 6, back: 0.4, from: -5, spread: 28, over: 12, below: 1, sway: 4, swayHz: 7,
                      turnHz: 4, land: 0.8, in: 0.1, out: 0.15, rung: 5, rungs: 2 },
  // four scales round the body, each edge-on a moment on its own clock
  'scale-swirl': { n: 4, speed: 1.8, rx: 14, ry: 3, mid: 7, bobHz: 1.1, bob: 3, every: 0.52, edge: 0.13, size: 4, rung: 7 },
  // the level-up's embers, small: from the feet on a turn, cooling
  embers: { n: 4, life: 1.7, seed: 7, lag: 0.5, turn: 4.2, spread: 2, r: 10, grow: 5, foot: 2, rise: 34, in: 0.1, out: 0.3 },
  // --- the expansion's (the owner's vote on docs/mocks/wardrobe-expansion-2026-10-16)
  // three flies looping round the body on their own clocks, darting, wings
  // up and down a frame each
  flies: { n: 3, speed: 2.6, step: 0.9, dartHz: 1.7, dart: 1.3, phase: 2.1, r: 11, rr: 3, rHz: 2.3, mid: 4,
           loop: 6, lift: 2, sink: 3, flapHz: 12, rung: 10, wing: 4 },
  // the yuck mark's risers, small: three wavy lines rising off the top
  stink: { at: [-3, 8, 19], life: 1.9, seed: 11, from: 2, rise: 14, in: 0.2, out: 0.45, units: 4, gap: 3,
           wave: 1.3, waveHz: 6, travel: 0.9, thin: 0.18, rung: 6 },
  // a cascade over the head: a high throw one way, a low pass back
  'juggling-balls': { n: 3, period: 1.3, size: 4, from: 4, high: 24, low: 5, half: 14, throw: 0.62, rung: 10, odd: 6 },
  // a bubble off the head, swelling to a ring and popping into four specks
  'potion-fizz': { n: 2, life: 1.6, seed: 12, at: 5, spread: 8, from: 2, rise: 18, grow: 0.45, ring: 0.75, fly: 4, in: 0.1, rung: 7 },
  // the dizzy mark's two stars round the head, made pluses
  'dizzy-stars': { speed: 6.25, r: 12, ry: 3, over: 7, rung: 10 },
  // now and then a star streaks down past the head, four fading behind it
  'shooting-star': { every: 2.8, for: 0.75, from: [34, -26], by: [-46, 30], trail: 4, gap: 0.035, in: 0.1, out: 0.25,
                     thin: 0.2, rung: 10 },
  // two of the sky's birds circling overhead, wings swapping V and caret
  'flock-overhead': { n: 2, speed: 1.4, step: 0.3, r: 16, ry: 3, over: 14, apart: 4, flapHz: 5, rung: 7 },
  // walking, three dashes behind, their lengths swapping a frame each
  'speed-lines': { rows: [[4, 8, 12], [9, 12, 6], [14, 6, 10]], gap: 3, hz: 12, ink: 0.8, rung: 6 },
  // the gold set's: a ring over the head breathing by opacity, two motes off it
  'gold-halo': { over: 12, rows: ['..#####..', '##.....##', '##.....##', '..#####..'], back: 2, breath: 0.15, breathHz: 1.3,
                 motes: 2, life: 2.2, seed: 8, spread: 12, sway: 2, swayHz: 5, lift: 2, rise: 12 },
};
// The embers' tones as they cool, first to last: a rung of the yard's grey
// ramp or of its purple (PURPLE); the deep's are its own list, read as the
// yard's rungs seen turned over (render/deeptones.js), so the cooling still
// reads as cooling on the black.
export const WARD_AURA_EMBERS = {
  yard: [['grey', 10], ['purple', 10], ['grey', 6], ['purple', 12], ['grey', 4]],
  deep: [['grey', 10], ['purple', 12], ['grey', 6], ['purple', 9], ['grey', 4]],
};

// --- the expansion's head pieces (render/wardheads.js; the owner's vote on
// docs/mocks/wardrobe-expansion-2026-10-16) ------------------------------------------
// Each one's numbers, in seconds and world pixels: `h` how tall it stands
// over the head, for what rides over it; `rung` a tone on the grey ramp.
export const WARD_HEADS = {
  // hops every `every` seconds, a wing beating while it is up
  bird: { h: 12, every: 3.4, hop: 0.55, high: 3, flapHz: 10, stepHz: 4, rung: 7 },
  // the tassel swings with the step
  mortarboard: { h: 10, stepHz: 4, rung: 6 },
  // tips itself every `every` seconds: lifted and leaned
  bowler: { h: 8, every: 3.6, tip: 0.8, high: 4 },
  'hard-hat': { h: 6, rung: 5 },
  // a ring a radius round the middle, see-through, two glints, one bubble
  'diving-bowl': { h: 8, r: 14, edge: 1.1, ink: 0.9, rung: 5, glint: 2, life: 1.7, seed: 13, wobble: 8, rise: 12,
                   in: 0.15, out: 0.4, bubble: 6 },
  // the serpent's crest made small (render/serpent.js): a spike every other
  // unit along the top from the front and down the back, every other spike
  // a unit taller, `tall` units at the most, shortening to its end; in the
  // crest's own purple, a rung of the abyss's magic ramp (ABYSS_MAGIC_TONES)
  'serpent-comb': { h: 6, tall: 3, top: 5, down: 2, rung: 9 },
};

// --- the lamp's light (render/lamplight.js; the owner, 2026-10-16: "lamp
// light all the time") ----------------------------------------------------------------
// A wedge out of the front of a lamp hat, the way the body faces: `reach`
// world pixels long, `from` half its height at the lamp and `spread` more
// a pixel out, leaning `tilt` down a pixel out; in the yard a rung of its
// grey ramp, in the deep a rung of the deep's. It fades in and out over
// `fade` seconds as the lamp goes on and comes off.
export const LAMP_CONE = { reach: 36, from: 2, spread: 0.28, tilt: 0.12, rung: 2, deepRung: 2, fade: 0.6 };
