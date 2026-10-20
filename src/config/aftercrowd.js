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
// God's camp stands on a stage (the owner, 2026-10-20: "the stage should go
// from the throne to the main plane"): its top a trapezoid from `back` cells
// behind his foot forward to the line the main plane's stations stand on,
// `hb` and `hf` across the half there, in the mock's cells at `mx` sky cells
// a cell, so it keeps its size against his throne at any window; a face
// `side` across down each slanted edge. Its front stands on the main plane
// `gap` cells clear of the union's crowd at its widest (after/sky.js,
// `godFront`).
// The open sky between the union's slice of the window and God's, cells:
// at no pan that shows both does his reach into theirs (after/sky.js,
// `godFront`).
export const AFTER_SLICE_GAP = 8;
export const GOD_STAGE = { mx: 1.25, back: 4, hb: 150, hf: 165, side: 3, gap: 6 };
// God's crowd on the stage at a giant's scale: rows from the back to the
// front, a soul `n` cells across (stage cells), from the first at the back to
// the second at the front; `gap` cells between souls in a row, each row
// stepping back `rows` of its soul; each soul jittered `jit` cells across and
// a share `lift` of them a row up; `margin` cells kept off the stage's edge;
// a body of the sim's among them no wider than `fileFill` of a file's
// spacing. As
// support rises it empties from the front: a soul stands while (1 - share)
// * `keep` - its frontness (0 the back row, 1 the front) * `fore` - a fixed
// chance * `luck` + `base` is over 0, and fades as that falls through the
// last `soft` of it -- support's share is eased, so a soul fades rather
// than pops.
export const GOD_CROWD = { n: [4, 8], gap: 2, rows: 1.1, jit: 1, lift: 0.4, margin: 3, fileFill: 0.7,
                           keep: 1.4, fore: 0.8, luck: 0.6, base: 0.25, soft: 0.25 };
// A sign stands on the stage by its rank: rank 0 the front row, rank
// SIGN_DEEP or more the back; its flag `flag` stage cells tall from the back
// to the front, a carrier's no taller than `carried`.
export const GOD_SIGN_DEEP = 40;
export const GOD_FLAG = { n: [7, 10], carried: 7 };
// A body out on the way, cells across at the near layer (1/d of it deeper):
// the mock's carrier, a little under a soul.
export const WALK_BODY = 2.7;
export const SKY_TICK_S = 0.25;            // the mock's tick: every pose in the sky held this long

export const SKY_SUPPORT_EASE = 0.8;       // support's share a second the drawing eases toward the sim's
// A member won by a sign (docs/mocks/act3-level-2026-10-19, a3level): a
// soul lifts out of the sign's plane over `lift` ticks, darkening toward the
// union's ink, orbits the sign a turn and a half in `orbit` ticks (a step of
// an eighth of a turn every `step`), then walks back to the union's camp
// over `drift` ticks -- the first `top` of it over the stage to its front
// corner, the next `down` down the plinth, the rest across the cloud -- and
// fades by opacity over the last `fade` of the way. At most `most` at once.
export const SKY_WON = { lift: 6, orbit: 24, step: 2, drift: 80, top: 0.2, down: 0.1, fade: 0.15, most: 24 };
// A sign newly planted fades in over this.
export const SIGN_FADE_S = 0.6;

// --- the crowd's life: the rings ----------------------------------------------------------
// A rally: a sign or poster lifts a cell and a ring runs out from it through
// the crowd, lifting the squares it passes. Its width and jump scale by the
// band's parallax rate.
export const SKY_RALLY = { every: [6, 9], speed: 320, life: 8, lift: 1.2 };
// God talks (the owner, 2026-10-20: "lets just have him talking"): a loud
// phrase every `every` seconds of SKY_ROAR, a mutter between them on
// SKY_GRUMBLE's clock, each with its bubble held `bubble` seconds.
export const SKY_ROAR = { every: 6.5, life: 6, bubble: 1.9 };
export const SKY_GRUMBLE = { every: [2.3, 3.3], bubble: 1.2 };
// A phrase is syllables a `beat` of ticks apart -- `loud`, `soft` or `big`
// of them (the speech's own, as it burns; `mutter` for a mutter) -- his mouth open `open` ticks on
// each. Every syllable sends a wave out of his mouth: rings round his head,
// then down his throne and out across his crowd from his foot at `speed` sky
// cells a second, its front lying flat on the stage (`flat` as deep as it is
// wide). A soul hops the moment the front reaches it, `hop` sky cells up and
// down over `hopS` seconds -- `bigHop` for the speech's -- a mutter's waves
// dying out over `reach` of the crowd's half. A front fades out over its last
// `fade` of the crowd's half. The rings round his head reach
// `head` sky cells out past his square. `cell` sky cells a cell of a front,
// a front `deep` cells deep.
export const GOD_TALK = { beat: 2, open: 1, loud: 5, mutter: 2, big: 6, speed: 200, flat: 0.3, hop: 2, bigHop: 3, hopS: 0.3,
                          reach: 0.45, head: 26, cell: 2, deep: 2, fade: 0.55, unlit: 0.3 };
export const SKY_RING_W = [16, 70];        // a ring's half-width, px, plus this times the band's rate
export const SKY_RING_LIFT = [3, 12];      // its jump, px, plus this times the band's rate

// --- God -----------------------------------------------------------------------------------
// He stands in his camp on his slow layer (after/sky.js), drawn as a
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
// Whole until support leaves them `1 / hold` of their length, faded after.
export const GOD_RAYS = { n: 16, r: 36, long: 40, short: 24, cell: 2, turn: 0.05, dark: 0.6, hold: 3 };
// His breath (a cell up and down), and the pupils looking round, in ticks.
export const GOD_IDLE = { breath: 8, look: 6 };

// --- the gaze and the burning speech ----------------------------------------------------------
// He takes turns: `phase` ticks talking to his crowd, then `phase` glaring
// round it.
// A cone of his light from his eyes to a round spot on the crowd, each edge
// GAZE edge grey. Glaring, it sweeps the crowd: a point every `hold` ticks,
// getting there over `move` of them, at these shares of his crowd's front
// either side of him. Its spot is `w` cells across the half against a soul
// `soul` cells across, scaled to the crowd's front row (a flattened disc,
// `flat` as tall); warned, it moves onto the mark over AFTER_GAZE_SETTLE_S
// and narrows on it in three steps (`narrow`) over the rest of the warning;
// the speech chars the board to ink in held steps over AFTER_BURN_S, and it
// fades.
export const GAZE = { phase: 64, sweep: [-0.5, -0.26, 0.28, -0.02, -0.17, 0.4, 0.12, -0.38], hold: 8, move: 5,
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

// --- the horizon ------------------------------------------------------------------------
// The horizon stands this many cells over the main plane's line: the sky's
// ranges stand on it, and the far cloud runs from it down to the plane.
export const AFTER_HORIZON = 28;
// God sits far back on a slow layer behind the main plane (after/sky.js): he
// slides GOD_RATE as fast as the camera, his foot GOD_FOOT cells over the
// main plane's line; his stage's lines slide from his rate at its back to the
// world's at its front.
export const GOD_RATE = 1 / 3;
export const GOD_FOOT = 19;

// --- God's camp, stood back ------------------------------------------------------------
// The whole camp -- throne, stage, crowd, flags -- is one layer at GOD_RATE,
// the far cloud's own rate, so it stands on the far cloud and slides with it
// as one; nothing on it leans. His foot is `foot` cells over the main plane's
// line (on the horizon) and he is laid out in `size` of the sky he would have
// standing on the plane; his stage's front edge `front` cells over the line,
// up among the far cloud's rows. His crowd stands on it in straight rows and
// files, every soul the yard's square (render/after/kit.js, `square`) `soul`
// cells across with `gap` cells between files and between rows -- on the
// cell grid at every window -- across the stage and `beyond` stage
// cells out over the cloud either side of it, thinning raggedly out there
// (`fringe`: how much less a soul at the crowd's end stands than one on the
// stage's edge), the owner's vast crowd (2026-10-20: "the crowd for god lost
// its vastness"). It empties from the front as support rises a row at a time
// (GOD_CROWD's rule with these `keep`, `fore`, `luck` and `base`: the front
// row gone early, the back row standing to the strike).
export const GOD_BACK = { foot: AFTER_HORIZON, size: 0.85, front: 5, soul: 2, gap: 1, beyond: 70, fringe: 0.9,
                          keep: 1.1, fore: 1, luck: 0.12, base: 0.2 };

// --- the ground (render/after/ground.js, render/after/floor.js) ----------------------
// Three rigid layers, nothing rolling. The far cloud between the horizon and
// the main plane: rows of billow lines on the cell grid, `rows` cells under
// the horizon, each broken into stretches of `seg` cells, a share `gaps` of
// them left open, a
// row's profile repeating every `period` of its cells, on God's slow layer
// (`rate` of the camera's speed). The main plane's path: paper `depth` cells
// down off the line the stations stand on, its far edge a pale billow line.
// The foreground under it: rows of big calm clouds, `down` cells under the
// path, one every `every` cells give or take, `w` cells across and `h`
// high, a share `gaps` of the places left empty, sliding `rate` as fast as
// the camera.
export const GROUND_FAR = { rate: GOD_RATE, rows: [6, 10, 18], period: 512, seed: 41, seg: 40, gaps: 0.45 };
export const GROUND_PATH = { depth: 5, seed: 9 };
export const GROUND_FORE = { rate: 1.3, gaps: 0.35, rows: [{ down: 6, every: 64, w: [16, 28], h: [2, 3] },
                                                            { down: 20, every: 90, w: [30, 50], h: [4, 6] }] };
// The thin lines the far rows and the foreground clouds are drawn in, world px.
export const GROUND_LINE = 2;

// --- the sky's ranges (take S3, taller) ----------------------------------------------
// Three ranges of cloud, far to near, each a skyline of value noise over
// position and time, cut at a floor so a range dips out in places: how tall
// it may stand (`A`, a share of the sky from the window's top to the
// horizon; the mock's were 0.76, 0.54 and 0.35, and the owner asked for
// them taller), its heads' radius `R` a head every `S` cells,
// its drift in cells a second, whether its line is the far tone, and its
// lit cap's depth. `seed` fixes the sky; `weather` leans it calm (0) to
// towering (1), swinging `swing` either way over `period` seconds. It is
// worked out every `step` seconds, a slice a frame over the first `slice` of
// the step before, and each frame shows the step behind blended into the
// step ahead.
export const CLOUD_SKY = {
  seed: 7, weather: 0.5, swing: 0.3, period: 1800, step: 2, slice: 0.5,
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

// --- the union's crowd (DESIGN.md, "The level, the two crowds and the flags") ---
// Gathered round and behind the pair in straight rows, `rows` of them, each
// row back smaller, higher and paler, every soul on the P grid: row r's souls
// `n[r]` cells across (the front ones a body's size, as big as the pair) with
// `gap[r]` cells between them, the rows' feet rising `rise` px (whole cells)
// over the floor from front to back, the rows `half` px across the half --
// never past a cell short of the workshops' end, whatever the window -- and
// every odd row set over by half its step, rounded down to a cell, the front
// `clear` px either side of the podium's half-width left open. The front `cap`
// rows are a mid body under an ink cap a cell deep, the rows to `midTo` mid,
// the rest pale: drawn light, so God stays the eye's anchor. Every other soul
// of a row whose gap is wider than `jit` cells stands up to `jit` cells off
// its place, and a share `short` of those `shortMin` cells or more a cap
// shorter, so a row reads as people and not as a pattern. It fills in from
// the front as support rises, a soul standing once (share * rows * `fill`) - its row - a fixed chance *
// `luck` is over 0; a newcomer walks in from God's side `walk` px over
// `walkS` seconds, fading in over the first `fadeIn` of it, and one leaving
// fades over `fadeOut` seconds. When a line of the pair's speech goes up, a
// share `hop` of the front `hopRows` rows hop a cell, held `hopS` seconds.
export const UNION_CROWD = { rows: 7, n: [3, 3, 3, 3, 2, 2, 2], gap: [2, 2, 2, 2, 1, 1, 1], rise: 132, half: [160, 260], clear: 6,
                             cap: 3, midTo: 5, jit: 1, short: 0.35, shortMin: 3,
                             fill: 1.1, luck: 0.6, walk: 80, walkS: 3, fadeIn: 0.3, fadeOut: 1,
                             hop: 0.7, hopRows: 2, hopS: 0.5 };
