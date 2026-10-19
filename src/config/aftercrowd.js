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

// --- the level's three zones (DESIGN.md, "The level, the two crowds and the flags") ---
// Left to right: the workshops, the union's camp, God's camp, this many cells
// of open floor between each. Every member and carrier walks it, so it is
// the act's pace as much as its picture: at 40 cells the strike no longer
// comes inside test/after-playthrough's stretch, and at 120 the speech burns
// each sign before it wins anyone. Wider wants the pace moved with it.
export const AFTER_ZONE_GAP = 24;
// The union's camp's floor, in cells, the pedestal at its middle: room for
// its crowd round and behind the pair (the crowd itself is not built yet).
export const AFTER_UNION_W = 32;

// --- the sky's frame ----------------------------------------------------------------
// The sky is laid out off the window the place has at rest (after/sky.js),
// God's square from its top down to his foot in the cloud; a sky too short
// for half a God-cell a sky cell is laid out at a cell that fits SKY_FIT.
export const SKY_FIT = 87;
// God's crowd stands round his throne in the cloud floor (DESIGN.md, "God's
// camp stands in the clouds", G1): rows of souls from its back, at his foot,
// to its front, each a floor point seen through the depth camera
// (after/sky.js). `back` and `front` are the rows' depths, in near layers;
// `hb` and `hf` its half-width there as drawn, in sky cells, so it keeps
// its size against God's at any window; `pitch`
// a soul's spacing across a row, in souls; `rows` the step from a row to the
// one behind it, in souls; and `aisle` the cells kept clear either side of
// the line up its middle. A soul is `soul` cells across at the near layer
// and 1/d of that deeper, never under `least`, a share `short` of its back
// row a cell shorter.
// As support rises it empties from the front: a soul stands while
// (1 - share) * `keep` - its frontness (0 the back row, 1 the front) *
// `fore` - a fixed chance * `luck`
// + `base` is over 0, and fades as that falls through the last `soft` of
// it -- support's share is eased, so a soul fades rather than pops.
export const GOD_CROWD = { back: 2.88, front: 1.5, hb: 84, hf: 88, pitch: 0.94, rows: 0.7, aisle: 4, soul: 3, least: 2, short: 0.35,
                           keep: 1.4, fore: 0.8, luck: 0.6, base: 0.25, soft: 0.25 };
// A sign stands in God's crowd by its rank: rank 0 the front row, rank
// SIGN_DEEP or more the back.
export const GOD_SIGN_DEEP = 40;
// A column bobs a cell for a tick, column i on the ticks where
// (i * mul + tick) % every is 0 (the mock's band).
export const SKY_BOB = { every: 13, mul: 5 };
export const SKY_TICK_S = 0.25;            // the mock's tick: every pose in the sky held this long

export const SKY_SUPPORT_EASE = 0.8;       // support's share a second the drawing eases toward the sim's
// A member won by a sign (docs/mocks/act3-level-2026-10-19, a3level): a
// soul lifts out of the sign's plane over `lift` ticks, darkening toward the
// union's ink, orbits the sign a turn and a half in `orbit` ticks (a step of
// an eighth of a turn every `step`), then drifts across to the union's camp
// over `drift` ticks, arcing up `arc` sky cells at its middle, and fades by
// opacity over the last `fade` of the way. At most `most` in the sky at once.
export const SKY_WON = { lift: 6, orbit: 24, step: 2, drift: 80, arc: 18, fade: 0.15, most: 24 };

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
// He stands in his camp GOD_DEPTH near layers deep (after/sky.js), drawn as a
// giant seen from afar: a God-cell is the largest of GOD_CELLS px that fits
// GOD_FIT cells in the sky; a sky cell is half of one. He is a light source
// on either page (raw tones, src/ink.js).
export const GOD_CELLS = [9, 6, 4, 3];
export const GOD_FIT = 52;
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
// getting there over `move` of them, at these shares of his crowd's front
// either side of him. Its spot is `w` cells across the half against a soul
// `soul` cells across, scaled to the crowd's front row (a flattened disc,
// `flat` as tall); warned, it moves onto the mark over AFTER_GAZE_SETTLE_S
// and narrows on it in three steps (`narrow`) over the rest of the warning;
// the speech chars the board to ink in held steps over AFTER_BURN_S, and it
// fades.
export const GAZE = { sweep: [-0.5, -0.26, 0.28, -0.02, -0.17, 0.4, 0.12, -0.38], hold: 8, move: 5,
                      w: 16, narrow: [12, 9, 6], flat: 0.35, soul: 5, w0: 8, body: 0.7, bodyDark: 0.35, spot: 0.8, spotDark: 0.5 };
export const AFTER_GAZE_SETTLE_S = 0.9;
export const AFTER_BURN_S = 4;
// A sign is a flag (a3flag, emblem 1): the union's ink, `w` by `h` of its
// plane's flag cells, the raised fist in paper `x` cells in and `y` down,
// flying off a pole a flag cell wide, its foot `up` flag cells over its
// plane's top. It ripples in held steps: a column a third of a flag cell
// wide, its drop a sine along the flag, one of `phases` poses a tick, `amp`
// flag cells at most.
export const SKY_FLAG = { w: 13, h: 11, x: 2, y: 1, up: 3, phases: 12, amp: 0.6,
  fist: ['..X.X.X..', '.XXXXXXX.', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXX.', '.XXXXXX..', '..XXXX...', '..XXXX...', '..XXXX...'] };
// A poster on the fence at the crowd's front: the flag turned, a paper sheet
// `w` by `h` sky cells with the fist in ink on it, flat, on a pole down to
// the bank, its foot `up` cells over the near plane's top.
export const SKY_POSTER = { w: 11, h: 13, x: 1, y: 2, up: 2 };
// A sign's aura: a faint disc of the union's ink, `r` of the flag's width
// across the half and `pad` cells more, breathing a cell every `breath`
// ticks, at `disc` opacity (`discDark` on the dark page), and a ring of ink
// squares on its rim (a sky cell each), a square every other
// of `per` a cell of radius, turning half a square every `turn` ticks, at
// `ring` opacity.
export const SKY_AURA = { r: 0.9, pad: 2, breath: 4, disc: 0.14, discDark: 0.2, ring: 0.6, per: 1.2, turn: 2 };

// --- souls drifting up from the camp ---------------------------------------------------------
export const SKY_DRIFT = { every: [2.5, 4.5], life: 14, rise: 22 };

// --- the depth camera (DESIGN.md, "The camps are far apart for the eye") -----------------
// The camera only slides. A thing at depth d (the near layer, where the
// workshops and the union's camp stand, at 1) slides 1/d as fast as the
// camera and is drawn 1/d its size, its foot AFTER_HORIZON / d cells under
// the horizon: the near layer's floor is AFTER_HORIZON cells under it.
export const AFTER_HORIZON = 12;
// God's camp stands this many near layers deep, its throne's floor x
// GOD_FAR windows (at rest) past the union's camp's right end: far enough
// that his layer and the union's would only meet past the window's right
// edge, so the union's camp is always left of the throne.
export const GOD_DEPTH = 3;
export const GOD_FAR = 1.3;

// --- the cloud floor (take A2) ---------------------------------------------------------
// Billows on the ground plane seen through one camera (docs/mocks/
// act3-clouds-2026-10-19, a3cloudfloor3): a camera `f` cells from the
// screen and `cam` units over the plane; the near layer AFTER_HORIZON cells
// under the horizon stands at depth `f * cam / AFTER_HORIZON`. A billow is a
// dome on a lattice `lx` across by `lz` deep, odd rows `row` of a cell
// over, jittered `jit`, radius `r` of a cell, `ez` as deep as wide,
// standing `amp` high and `puff` round; a share `vary` of them are bigger.
// Its lit cap is the circle `cap` (x, z, radius) of its own radius. Near the
// feet they are pressed to `low` of their height, rising to whole between
// depths `rise`; past a row `rowmin` cells deep the rows stop thinning and
// only narrow. It rolls `roll` units toward the viewer a second, traced a
// tick at a time (SKY_TICK_S), held between, and slid row by row with the
// camera between traces; a pan of more than `margin` of the window since
// the last trace traces it again.
export const CLOUD_FLOOR = { f: 130, cam: 0.86, cap: [0.1, 0.17, 0.95], vary: 0.15, ez: 1.35, lx: 0.36, lz: 0.45,
                             jit: 0.3, r: [0.48, 0.62], amp: [0.21, 0.3], puff: 0.4, row: 0.5, roll: 0.024,
                             low: 0.3, rise: [2.5, 9], rowmin: 1.6, far: 400, margin: 0.25 };
// A lip of billow over a body's feet: as high as `h` of its size, round
// tops `w` of it across, its line ink from `ink` cells of body up, mid below.
export const CLOUD_LIP = { h: 0.4, w: 0.31, sink: 0.15, ink: 6, least: 4 };
// The throne's bottom step's lip, in sky cells high.
export const CLOUD_LIP_THRONE = 2.4;

// --- the sky's ranges (take S3, taller) ----------------------------------------------
// Three ranges of cloud, far to near, each a skyline of value noise over
// position and time, cut at a floor so a range dips out in places: how tall
// it may stand (`A`, a share of the sky from the window's top to the
// horizon; the mock's were 0.76, 0.54 and 0.35, and the owner asked for
// them taller), its heads' radius `R` a head every `S` cells,
// its drift in cells a second, whether its line is the far tone, and its
// lit cap's depth. `seed` fixes the sky; `weather` leans it calm (0) to
// towering (1), swinging `swing` either way over `period` seconds. It is
// worked out every `step` seconds and each frame shows the step behind
// blended into the step ahead.
export const CLOUD_SKY = {
  seed: 7, weather: 0.5, swing: 0.3, period: 1800, step: 2,
  ranges: [
    { A: 1.0, R: 9, S: 10, drift: 0.04, far: 1, cap: 5 },
    { A: 0.72, R: 12, S: 13, drift: 0.08, far: 1, cap: 7 },
    { A: 0.48, R: 16, S: 17, drift: 0.14, far: 0, cap: 9 }]
};
// A sky cell's role (0 open sky, 1 lit, 2 shade, 3 near line, 4 far line,
// 5 a lit top's first cells by night) as one of the act's four tones, by
// page: by day white tops over a pale body and a line no darker than mid;
// by night tops catching a grey light over bodies sunk into the night.
export const CLOUD_SKY_TONES = { light: ['paper', 'paper', 'pale', 'mid', 'pale', 'paper'],
                                 dark: ['paper', 'pale', 'paper', 'ink', 'mid', 'mid'] };
