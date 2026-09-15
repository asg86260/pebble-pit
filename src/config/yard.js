export const P = 6;              // pixel size, in world units
// How big a cell is drawn, in screen pixels. This is the whole of the zoom:
// the picture never scales to fit a window, so turning it down shows more
// yard at once rather than rearranging anything. A cell still has to be a
// whole number of *device* pixels, so the screen's own ratio is rounded
// against this rather than against P.
export let CELL = 5;
export const TARGET = 1000000;   // dust in the hole: the whole point
// The place is built once and never moves. The pit floor sits on the bottom of
// the viewport, the ground line a fixed height above it, and the rock, the
// bench and the lip keep their distances; a bigger window is only more sky
// and more ground. A shorter window loses sky off the top, which is the part
// with nothing in it.
export const SKY = 1998;         // world above the ground line, so any window has sky
// Every world coordinate below is a whole number of cells away from the last,
// SKY included: a cell is a whole number of device pixels, so a world position
// half a cell off lands the rock's rows between device pixels and the canvas
// antialiases a hairline into every seam. 1998 is 333 cells; 2000 was not a
// whole number of any.
// Every site stands on the one ground line, measured out from the rock. The
// world runs away to the left as sites are unlocked; the pit is the one fixed
// end, out to the right.
// Rock center to the thing in the sky: out past the tower, at the far end of
// the walk, because the tower is what calls it down and what makes the body
// that can reach it, so a wizard coming out of the tower door has a few steps
// to take rather than the length of the yard. See meteor.js.
export const TO_SKY = -3468;
export const SKY_UP = 460;       // and how far above the ground line it hangs
export const SKY_R = 46;
export const TO_FARM = -2106;    // rock center to the near edge of the farm
export const TO_QUARRY = -1434;  // rock center to the mouth of the quarry
// The bench stands just off the rock's left flank, in the middle of the strip
// between the rock's apron and the crew's block: where somebody lives is
// further from the rock than where they buy a pick. The biggest rock is
// measured off the bench and stops growing a hand's width clear of it, so
// moving the bench out brings the last rock in with it.
export const TO_BENCH = -336;    // rock center to the bench
export const BENCH_W = P * 12;   // and how wide it stands
export const TO_LAB = -2334;     // rock center to the lab, at the far end

// --- the hidden window's clock ------------------------------------------------
// The most the game's clock may move in one frame, in milliseconds. A frame
// that arrives after a long gap (the window hidden, the machine asleep) is not
// a long frame: `dt` in game.js is clamped to this so nothing walks through a
// wall, and `tick` in clock.js advances `now()` by no more than the same
// amount so nothing measured against a moment on the clock resolves the
// instant you come back. One number, read in both places, is what keeps the
// two halves of the frame agreeing that a hidden window is a pause. Six
// frames: a hitch that long is felt, and anything longer reads as time that
// did not happen.
export let CLOCK_LEAP_MS = 100;

// The ground's texture, below the line: 0 plain, 1 a dot a tile, 2 a diagonal
// hatch, 3 strata, 4 a stipple. One mark is one cell; GROUND_TILE cells to a
// repeat; GROUND_INK is how dark a mark is against the white.
export let GROUND_TEXTURE = 2;
export let GROUND_TILE = 6;
export let GROUND_INK = 0.05;

// The dev panel's rows for the knobs above, beside the bindings because an
// imported `let` is read-only; config.js gathers every file's rows into TUNABLE.
export const YARD_KNOBS = [
  { key: 'GROUND_TEXTURE', label: 'ground texture', min: 0, max: 4, step: 1,
    get: () => GROUND_TEXTURE, set: v => { GROUND_TEXTURE = v; } },
  { key: 'GROUND_TILE', label: 'ground tile', min: 2, max: 12, step: 1,
    get: () => GROUND_TILE, set: v => { GROUND_TILE = v; } },
  { key: 'GROUND_INK', label: 'ground ink', min: 0.05, max: 1, step: 0.01,
    get: () => GROUND_INK, set: v => { GROUND_INK = v; } },
  { key: 'CELL', label: 'zoom', min: 3, max: 10, step: 1, layout: true,
    get: () => CELL, set: v => { CELL = v; } },
  { key: 'CLOCK_LEAP_MS', label: 'clock leap ms', min: 17, max: 1000, step: 1,
    get: () => CLOCK_LEAP_MS, set: v => { CLOCK_LEAP_MS = v; } }
];
