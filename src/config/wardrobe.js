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
// tail as the body walks, a tail's wag, a balloon's bob, a flag's wave.
export const WARD_STEP_HZ = 4;
export const WARD_WAG_HZ = 2;
export const WARD_BOB_HZ = 1.2;
export const WARD_WAVE_HZ = 3;
// How long a body stood still between two steps still counts as walking.
export const WARD_STILL_S = 0.25;

// A roll of the dice on the picker: none (or plain) is this many times as
// likely as any one item, so a roll is not a costume party.
export const WARD_NONE_ODDS = 2;

// The picker's close-up: how many screen pixels a world pixel is, and how
// tall it is in world pixels (room over the two of them for a flag or a
// balloon); and the crowd strip under it, at the yard's own scale, in screen
// pixels.
export const WARD_BIG = 3;
export const WARD_BIG_H = 60;
export const WARD_STRIP_H = 46;
// The strip's crowd: how many crew walk it with the two of them, and the
// pace they walk at (world pixels a second).
export const WARD_CROWD = 8;
export const WARD_CROWD_PACE = [10, 22];
