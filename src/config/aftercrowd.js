// --- act 3: the sky, God and the camera (track B) ---------------------------------
// God's crowd filling the sky (docs/mocks/act3-skycrowd-2026-10-18, round 2,
// the owner's vote; horns and a harder scowl added after it), built to
// docs/wave-act3-build.md, track B. Every number the mock gives is the mock's.
import { P } from './yard.js';

// The members waiting stand in the camp from here to the pedestal
// (after/place.js, `campSpot`).
export const OURS_X0 = P * 14;

// --- the sky's frame ----------------------------------------------------------------
// The crowd stands from the window's top to a cloud bank this far up off the
// floor, worked out off the window the place has at rest (after/sky.js), so
// the dive magnifies the sky rather than laying it out again.
export const SKY_BANK = P * 17;
// Each band's top, a share of the sky from the window's top to the bank,
// furthest first; the last is the near band of souls.
export const SKY_TOPS = [0.07, 0.20, 0.33, 0.45, 0.57, 0.69, 0.81];
// The six far bands, furthest first: px a texel (`q`) and a row (`p`), a
// cell `cp` texels apart and `hs` across, every other row staggered `st`;
// its tone, one of act 3's four (AFTER_TONES) by name, and the share of its
// cells that stand (`fill`), so the far bands are the pale one thinly and
// the nearer ones the mid grey more densely -- depth by which tone and how
// dense, never a grey between; the tone of its top two rows of heads
// (`edge`), standing whole, so each band's top reads as a line against the
// one behind; and its parallax rate.
export const SKY_BANDS = [
  { p: 2, q: 2, cp: 1, hs: 1, st: 0, tone: 'pale', fill: 0.45, edge: 'pale', rate: 0.24 },
  { p: 2, q: 2, cp: 1, hs: 1, st: 0, tone: 'pale', fill: 0.7, edge: 'mid', rate: 0.31 },
  { p: 3, q: 3, cp: 1, hs: 1, st: 0, tone: 'pale', fill: 0.95, edge: 'mid', rate: 0.39 },
  { p: 4, q: 1, cp: 4, hs: 3, st: 2, tone: 'mid', fill: 0.5, edge: 'mid', rate: 0.47 },
  { p: 5, q: 1, cp: 5, hs: 4, st: 2, tone: 'mid', fill: 0.75, edge: 'mid', rate: 0.55 },
  { p: 8, q: 2, cp: 4, hs: 3, st: 2, tone: 'mid', fill: 0.95, edge: 'mid', rate: 0.70 }
];
// The near band: souls a body's two thirds square, this far apart across and
// down, an ink rim and two eyes on God.
export const SKY_NEAR = { soul: 12, pitch: 16, rowp: 15, rate: 0.8 };
export const SKY_BANK_RATE = 0.9;          // the cloud bank's own parallax
export const SKY_SIGN_RATE = 0.85;         // the signs and posters, standing in the near band
export const SKY_CLOUDS_AFTER = [1, 3, 4]; // a thin cloud strip between band k and the next
export const SKY_CLOUD_DRIFT = 3;          // px/s the furthest strip drifts, a px/s more each nearer
// The layers' pan reaches this far past the window either side, so a band
// is never seen to end.
export const SKY_EDGE = P * 34;

// --- thinning as support rises ----------------------------------------------------------
// The share of support toward the strike (1 at STRIKE_SHARE) band k starts
// to go at, and how much more it takes to empty it; the near band keeps a
// scatter. Every soul and far cell has its own threshold, three parts chance
// to one part row, so the back rows go first and a band empties by scattered
// souls; past it a soul fades out over SKY_KEEP_SOFT of support. A band's top
// sinks by SKY_SINK of its height as it empties.
export const SKY_THIN = { from: 0.12, step: 0.11, span: 0.30, nearCap: 0.9 };
export const SKY_KEEP_SOFT = 0.06;
export const SKY_SINK = 0.5;
export const SKY_SUPPORT_EASE = 0.8;       // support's share a second the drawing eases toward the sim's
export const SKY_REDRAW_STEP = 0.004;      // a band's cells are written again when its share moves this much
// A member walking out: a near soul in view inks its rim, holds, and fades.
export const SKY_JOIN = { hold: 0.5, fade: 1.2, most: 3 };

// --- the crowd's life: the sea and the rings ------------------------------------------------
// A, the sea: one long wave through every band, heads up and down a step at a time.
export const SKY_SEA = { len: 230, hz: 0.85, amp: 1.2, lag: 0.35, swayLen: 240, swayHz: 0.7 };
// C, a rally: a sign or poster lifts a cell and a ring runs out from it
// through every band; the throne's roar and grumble send rings of their own.
// Each ring's width and jump in a band scale by the band's parallax rate.
export const SKY_RALLY = { every: [6, 9], speed: 320, life: 8, lift: 1.2 };
export const SKY_ROAR = { every: 6.5, speed: 380, life: 6, mouth: 1.6, bubble: 1.9 };
export const SKY_GRUMBLE = { every: [2.3, 3.3], speed: 220, reach: 420, bubble: 1.2 };
export const SKY_RING_W = [16, 70];        // a ring's half-width, px, plus this times the band's rate
export const SKY_RING_LIFT = [3, 12];      // its jump, px, plus this times the band's rate
export const SKY_RING_STEP = 12;           // screen px a slice of a band moved by a ring

// --- God -----------------------------------------------------------------------------------
// High in the sky's middle on a tower throne, between the five far bands and
// the two near ones. A God-cell is the largest of GOD_CELLS px that fits
// GOD_FIT cells -- spikes to tower foot -- in the sky; God is 18 cells
// square. He is a light source on either page (raw tones, src/ink.js).
export const GOD_CELLS = [9, 6, 4, 3];
export const GOD_FIT = 52;
export const GOD_RATE = 0.62;              // his parallax walking toward the camp
export const GOD_OPEN_AT = 0.62;           // where across the window he stands when the act opens
export const GOD_UP = 0.03;                // his crown's spikes this share of the sky down off the window's top, and 19 cells
export const GOD_GLARE_R = 19;             // the glare's disc, God-cells
export const GOD_HALO_R = 21;              // the halo's ring, God-cells
export const GOD_SPOKES = { n: 12, r: 23, long: 5, short: 3, turn_s: 50 };
// His idle, in held poses: a breath, three fingers drumming twice then a
// rest, the crown slipping and set straight with the left hand.
export const GOD_IDLE = { breath_s: 4.6, drum_s: 3.2, crown_s: 11 };
// The gaze: a pale wedge from his eyes sweeping the sky and the camp, holding
// on the camp a while.
export const GOD_GAZE_HOLD_S = 2.6;

// --- the burning speech ------------------------------------------------------------------
// The gaze swings onto the sign or poster it will burn over this, then four
// corner marks close in on it in held steps for the rest of the warning
// (AFTER_SPEECH_WARN_S); it chars and burns away over AFTER_BURN_S, embers
// rising.
export const AFTER_GAZE_SETTLE_S = 0.9;
export const AFTER_BURN_S = 4;
export const SKY_SIGN = { w: 60, h: 36, cell: 3 };
export const SKY_POSTER = { w: 42, h: 60, cell: 3 };

// --- the tithe line ---------------------------------------------------------------------------
// Bowed carriers with planks and sheets from the camp across the cloud floor
// and up a dotted ledge under God to the glare at his left hand; thinning
// and slowing as support rises, standing still at the strike.
export const TITHE_CARRIERS = 70;
export const TITHE_LAP = 0.010;            // the line's share of its path a second at the start
export const TITHE_GLARE_R = 6;            // the glare that takes the loads, God-cells

// --- souls drifting up from the camp ---------------------------------------------------------
export const SKY_DRIFT = { every: [2.5, 4.5], life: 14, rise: 22 };

// --- the camera -------------------------------------------------------------------------------
// Panning right of where the act opens zooms in toward God, the square of an
// ease of the way to the end of the pan, to this, and pulls his face to this
// share of the window's height.
export const AFTER_ZOOM_MAX = 1.8;
export const AFTER_FOCUS_AT = 0.42;
