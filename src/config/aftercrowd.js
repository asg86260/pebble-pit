// --- act 3: the sky, God and the camera (track B) ---------------------------------
// The sky redrawn flat (DESIGN.md, "The sky, redrawn flat"; the owner's votes,
// docs/mocks/act3-sky-flat-2026-10-19, a3gaze the cumulative one). Every
// number the mock gives is the mock's: lengths in sky cells (render/
// aftercrowd.js, `h`: half a God-cell, or less where the sky is too short to
// hold the mock's layout), times in the mock's ticks of a quarter second.
import { P } from './yard.js';

// The members waiting stand in the camp from here to the pedestal
// (after/place.js, `campSpot`).
export const OURS_X0 = P * 14;

// --- the sky's frame ----------------------------------------------------------------
// The crowd stands from its bands' tops down to a cloud bank this far up off
// the floor, worked out off the window the place has at rest (after/sky.js),
// so the dive magnifies the sky rather than laying it out again.
export const SKY_BANK = P * 17;
// The sky cells from God's square's top down to the bank in the mock, so a
// sky too short for half a God-cell a cell is laid out at a cell that fits.
export const SKY_FIT = 87;
// The bands of the mass, furthest first, as many as are listed; the last is
// the near band, whose souls a member walks out of. Each: its top, a share
// of the sky from the window's top to the bank (the mock's 84 and 97 of
// 109); a soul a flat square `n` cells across, packed with no gaps, its
// column's top up to `up` cells over the band's own; its tone, one of act
// 3's four by name; its parallax rate; and how it sinks as support rises --
// from `from` of the way to the strike over `span` more, its top down to
// `to` cells over the bank, fading out over the last `fade` of it, stopping
// `cap` of the way (the near band's low strip at the strike).
export const SKY_BANDS = [
  { top: 0.77, n: 3, up: 2, tone: 'pale', rate: 0.7, seed: 11, from: 0, span: 0.75, to: 2, fade: 0.15, cap: 1 },
  { top: 0.89, n: 5, up: 2, tone: 'mid', rate: 0.8, seed: 23, from: 0.25, span: 0.75, to: 4, fade: 0, cap: 0.9 }
];
// The bands' tops, read by the sky's frame (after/sky.js).
export const SKY_TOPS = SKY_BANDS.map(b => b.top);
// A column bobs a cell for a tick, column i on the ticks where
// (i * mul + tick) % every is 0 (the mock's band).
export const SKY_BOB = { every: 13, mul: 5 };
export const SKY_BANK_RATE = 0.9;          // the cloud bank's own parallax
export const SKY_SIGN_RATE = 0.85;         // the signs and posters, standing in the near band
// The layers' pan reaches this far past the window either side, so a band
// is never seen to end.
export const SKY_EDGE = P * 34;
export const SKY_TICK_S = 0.25;            // the mock's tick: every pose in the sky held this long

export const SKY_SUPPORT_EASE = 0.8;       // support's share a second the drawing eases toward the sim's
// A member walking out: a near soul at the band's top inks, holds, then
// rises a cell a tick and fades; at most this many a frame.
export const SKY_JOIN = { hold: 0.5, fade: 1.2, most: 3 };

// --- the crowd's life: the rings ----------------------------------------------------------
// A rally: a sign or poster lifts a cell and a ring runs out from it through
// both bands, lifting the squares it passes; the throne's roar ducks them and
// a grumble lifts them a cell. Each ring's width and jump in a band scale by
// the band's parallax rate.
export const SKY_RALLY = { every: [6, 9], speed: 320, life: 8, lift: 1.2 };
export const SKY_ROAR = { every: 6.5, speed: 380, life: 6, mouth: 1.6, bubble: 1.9 };
export const SKY_GRUMBLE = { every: [2.3, 3.3], speed: 220, reach: 420, bubble: 1.2 };
export const SKY_RING_W = [16, 70];        // a ring's half-width, px, plus this times the band's rate
export const SKY_RING_LIFT = [3, 12];      // its jump, px, plus this times the band's rate

// --- God -----------------------------------------------------------------------------------
// Behind the whole crowd, high in the sky's middle (after/sky.js lays him
// out). A God-cell is the largest of GOD_CELLS px that fits GOD_FIT cells in
// the sky; a sky cell is half of one. He is a light source on either page
// (raw tones, src/ink.js).
export const GOD_CELLS = [9, 6, 4, 3];
export const GOD_FIT = 52;
export const GOD_RATE = 0.62;              // his parallax walking toward the camp
export const GOD_OPEN_AT = 0.62;           // where across the window he stands when the act opens
export const GOD_UP = 0.03;                // his crown's spikes this share of the sky down off the window's top, and 19 cells
// His square, its outline, the crown's ring over it and its points (x off
// the square's left, height), the eyes' lids, the mouth and the hands, in
// sky cells off the square's top left: the mock's.
export const GOD_N = 40;
export const GOD_EDGE = 2;
export const GOD_CROWN = { up: 8, rx: 1, ry: 3, points: [[2, 4], [10, 6], [18, 8], [20, 8], [28, 6], [36, 4]] };
export const GOD_EYES = { x: [6, 24], y: 14, w: 10 };
export const GOD_HAND = { w: 6, rest: -6 };   // a hand's square, and its rest on the seat this far over it
// The block throne: a back up to his cheeks, a broad seat under him, and a
// stepped base under the seat, a soul's width out a step down into the crowd.
export const GOD_THRONE = { backTop: 14, backHalf: 30, seatHalf: 36, seatH: 8, baseHalf: 40, step: 4 };
// His rays: runs of square cells from his middle, every other one short,
// turning a step a tick, shortening as support rises; fainter on the dark page.
export const GOD_RAYS = { n: 16, r: 36, long: 40, short: 24, cell: 2, turn: 0.05, dark: 0.6 };
// His breath (a cell up and down), and the pupils looking round, in ticks.
export const GOD_IDLE = { breath: 8, look: 6 };

// --- the line and the blessing ------------------------------------------------------------
// He takes turns: PHASE ticks blessing the line, then PHASE glaring round the
// crowd while the line waits on its steps. A soul starts up out of the
// crowd every GAP ticks, a step every `climb` ticks; on the top step it is
// blessed for BLESS ticks (the hands in over the first `in` of it, the light
// from `light` to `out`, the hands back by the end), then walks off a cell a
// tick along the seat and down the base's side. Its load fades in his hands.
export const TITHE = { phase: 64, gap: 16, climb: 8, bless: 12, soul: 4, offset: 10,
                       in: 0.25, light: 0.25, out: 0.75, back: 0.7, slow: 0.6 };

// --- the gaze and the burning speech ----------------------------------------------------------
// A cone of his light from his eyes to a round spot on the crowd, each edge
// GAZE edge grey. Glaring, it sweeps the crowd: a point every `hold` ticks,
// getting there over `move` of them, at these shares of the window either
// side of him. Its spot is `w` cells across the half (a flattened disc,
// `flat` as tall); warned, it moves onto the mark over AFTER_GAZE_SETTLE_S
// and narrows on it in three steps (`narrow`) over the rest of the warning;
// the speech chars the board to ink in held steps over AFTER_BURN_S, and it
// fades.
export const GAZE = { sweep: [-0.5, -0.26, 0.28, -0.02, -0.17, 0.4, 0.12, -0.38], hold: 8, move: 5,
                      w: 16, narrow: [12, 9, 6], flat: 0.6, w0: 8, body: 0.7, bodyDark: 0.35, spot: 0.8, spotDark: 0.5 };
export const AFTER_GAZE_SETTLE_S = 0.9;
export const AFTER_BURN_S = 4;
export const SKY_SIGN = { w: 60, h: 36, cell: 3 };
export const SKY_POSTER = { w: 42, h: 60, cell: 3 };

// --- souls drifting up from the camp ---------------------------------------------------------
export const SKY_DRIFT = { every: [2.5, 4.5], life: 14, rise: 22 };

// --- the camera -------------------------------------------------------------------------------
// Panning right of where the act opens zooms in toward God, the square of an
// ease of the way to the end of the pan, to this, and pulls his face to this
// share of the window's height.
export const AFTER_ZOOM_MAX = 1.8;
export const AFTER_FOCUS_AT = 0.42;
