// The casino is the machine: a plinko read top to bottom. The stake rains
// into a hopper on the roof and stands there as the pot; you let it go, and a
// handful of it comes out of the heap and down ten rows of pegs into eleven
// bins, each grain flipping its own coins on the way; the bins pay into a tray
// at the foot, and what stands in the tray is the pot again. Bank it, or hoist
// it back up to the roof and drop it again. See DESIGN.md, "The handful".
//
// There was a wheel here, even money, and it is gone: the answer was picked
// first and the wheel aimed at it, so you were watching a picture of a decision
// already made. Here nothing is decided until a grain is on a peg.

// What goes on the roof. Four chips and one of them is everything you have:
// the size of the bet is most of what a bet feels like, and a stake worked out
// for you as a share of your holdings is a stake nobody chose. `all` is the one
// that is not a number, and it is the one the whole thing is for.
export const CASINO_CHIPS = [10, 100, 1000, 'all'];

// --- the handful ------------------------------------------------------------------
// How many grains go down the board a hand, whatever the stake: each carries a
// thirty-second of it. The count is what makes this a bet at all -- every grain
// is a fair draw from the bins, a pour of N pays the mean of N draws, and the
// spread of a mean shrinks with the square root of N. A hundred grains pay
// between 0.8 and 1.2 nearly every hand; two hundred and fifty pay one. Thirty-
// two pay with a spread of about a third, put a grain in a x39 bin one hand in
// eight, and lose the median hand, which is plinko's actual feel. Sixteen is a
// rock and a half and too few to read as a cascade; sixty-four pays within a
// quarter nearly every hand. A chip smaller than this is one grain a coin.
// `test/handful.test.mjs` measures the spread, and is where this moves if it
// moves.
export let CASINO_HANDFUL = 32;

// --- the bins -----------------------------------------------------------------------
// Ten rows of pegs and eleven bins. A grain at a peg goes left or right and
// nothing else, so where it lands is ten fair coins added up: the odds are the
// pegs, and the bins say what they pay. Written out rather than worked from a
// formula so the numbers can be read off the board -- and chosen so that,
// weighted by how often a grain reaches each one (1, 10, 45, 120, 210, 252 in
// 1,024, and back), the table pays exactly one. Fair to the grain, and that is
// the whole of the house's edge: the mean of a hand is one and the median is
// under it, so a pot ridden for ever still ends at nothing. `test/casino.test.mjs`
// asserts the sum, so a bin cannot be moved on its own.
export const CASINO_PEG_ROWS = 10;
export const CASINO_BINS = [39, 5, 3, 1, 0.5, 0.5, 0.5, 1, 3, 5, 39];

// --- the building, in cells, top to bottom -------------------------------------------
// The hopper on the roof, where the stake stands: a funnel, the building's
// width at the rim and narrowing row by row to a flat floor over the throat.
// The profile is how many cells the wall steps in from each side, rim first;
// the walls are fixed cells in the hopper's own plot, so the sand heaps
// against them by the yard's rules, fills from the throat up and sits in the
// bowl. Three cells a row, because a funnel fifty-four wide has to close to a
// six-cell floor inside the rows the roof can spare, and the heap stands up
// to the rim and no further (`table.ceiling`).
export const HOPPER_PROFILE = [0, 3, 6, 9, 12, 15, 18, 21, 24];
export const HOPPER_H = HOPPER_PROFILE.length;
// Its floor, one cell thick, which is the gate: it splits from the middle when
// you let go, to the throat's two cells, the column the handful enters at and
// its neighbor.
export const GATE_H = 1;
export const GATE_W = 2;
// The sign band under the floor, between the funnel and the pegs so nothing
// stands in front of the bowl: the roof sign's five-row letters across the
// front in one word, a clear cell and the bulbs each side of them.
export const CASINO_SIGN_H = 9;
// The face: a band of air for the stream to fan in, then the peg rows two
// apart, then the bins with their pay written under them, then the tray.
export const BOARD_AIR = 3;
export const PEG_ROW_H = 2;
// A bin is four cells on the field: three of slot and a wall on its right. Four
// rather than the two the design guessed, because a pay is a three-cell glyph
// and a bin has to carry its own; and four halves to the two cells a grain
// steps across a row, so the fan of ten rows reaches the outer bins exactly.
// The two edge bins are wider: their pay is two digits and a gap, and a bin
// wears its own pay in its own foot, so the mouth is as wide as the word.
export const DIGIT_W = 3;                      // the pay face's glyph, in cells
export const BIN_W = DIGIT_W + 1;
export const EDGE_BIN_W = DIGIT_W * 2 + 1 + 1;
export const BIN_H = 6;
// What a bin pays, written under it in its own foot: the bins' dividers run on
// down through this band, so it is a row of table cells, one under each bin,
// and no pay can be read as its neighbor's. A floor line, a clear row, five of
// glyph, a clear row, and the tray's rim.
export const LABEL_H = 9;
// The tray at the foot, which the bins pay into: the same walled plot the
// hopper is, because what stands in it goes back up to the hopper on a drop
// again.
export const TRAY_H = 5;
// The field's width, and the whole building's: the bins across, with two cells
// of block either side -- a white divider and the wall.
export const BOARD_COLS = (CASINO_BINS.length - 2) * BIN_W + 2 * EDGE_BIN_W;
export const CASINO_MARGIN = 2;
export const FIELD_H = BOARD_AIR + CASINO_PEG_ROWS * PEG_ROW_H;

// --- how a grain moves -----------------------------------------------------------------
// A grain steps a cell at a time down the face, this often; at sixty frames a
// second that is a cell a frame, and it is written in time so a slow frame does
// not slow the machine. Arriving at a peg it sits a beat, and on the beat the
// peg flashes and ticks. Grains leave the hopper this far apart, so the board
// carries a stream splitting on the pegs rather than thirty-two dots in step;
// the last of a handful leaves about a second and a quarter after the first.
export let CASINO_FALL_MS = 17;
export let CASINO_PEG_BEAT_MS = 70;
export let CASINO_GRAIN_GAP_MS = 40;
// The floor splits from the middle over this long before the first grain falls.
export let CASINO_GATE_MS = 250;

// --- how a hand is felt ---------------------------------------------------------------
// A real plinko is loud -- every peg a hit, the bin a thud, the edge bin a
// siren -- and a board that is thirty-two dots on a grid is the wheel with more
// dots. Every beat here is a named event in `sfx` and a moment in the render.
export let CASINO_BIN_KNOCK = 3;          // a grain into a bin: a third of the wheel's stop
export const CASINO_KNOCK = 9;            // the hand settling
export const CASINO_WIN_KNOCK = 16;       // and a x39 landing, which is the big one
export let CASINO_EDGE_STROBE_MS = 1000;  // the sign, the second a grain reaches a x39
export const CASINO_FLASH_MS = 70;        // a peg or a divider, lit for this long
// The count comes in as sand, not as a number: the board stands full and quiet
// for a held beat, then the bins pay from the middle outward a bin a beat, so
// the half bins go first and the good bins land last.
export let CASINO_SETTLE_HOLD_MS = 400;
export let CASINO_PAY_BEAT_MS = 150;
// A win is the burst it already was, scaled to the hand: a fountain for every
// rung of this ladder the pay clears, and a x39 in the hand gets the three and
// a second strobe. A hand within this much of even is even -- quiet, the box
// and nothing else -- so the box never says x1.0 over a fountain.
export let CASINO_EVEN_BAND = 0.05;
export const CASINO_BURST_AT = [1, 1.5, 3];
export const CASINO_WIN_MS = 2400;        // the strobe
export const CASINO_STROBE_MS = 70;       // a bulb on or off, this often
export const CASINO_BURST = 70;           // squares in a fountain...
export const CASINO_BURST_GAP_MS = 220;   // ...and how far apart the fountains go up
export const CASINO_BURST_UP = 3.2;       // how hard they go up, in pixels a frame
export const CASINO_BURST_SIDE = 1.6;     // and how wide they spread
export const CASINO_DARK_MS = 800;        // a dud: the sign goes dark for this long...
export const CASINO_RELIGHT_MS = 90;      // ...then a bulb comes back this often
export const CASINO_SAY_MS = 4000;        // how long the hand's multiple stands over the building
// The sign's chase: its idle step, and the quicker one for the whole of a hand,
// from the chip going down to the tray standing.
export const CASINO_CHASE_MS = 130;
export let CASINO_CHASE_LIVE_MS = 65;
// The machine sells itself. Every so often, with nobody at it, one grain drops
// from the hopper and ticks its way down to a bin, then lifts and fades -- a
// demonstration with nothing riding on it, and the only moving thing out past
// the lab. It stops the moment a chip is down.
export let CASINO_ATTRACT_S = 20;
// Grains leaving -- a lost heap lifting off, a demonstration grain going --
// drift up and fade, because a thing that arrives or leaves in three frames is
// a flicker.
export const TABLE_LIFE = 2.6;
export const TABLE_GRAV = 0.05;
// How much sand a pot puts in the hopper -- one grain a unit right up until
// the numbers stop being numbers. Past the first band the heap is a *reading*
// of the pot rather than a count of it, on a ladder written down here: a
// tenfold pot for `CASINO_PILE_BAND` more grains, log-interpolated between the
// marks so nothing jumps, and never more than the brim.
//
//   1 - 100      the pot itself, one for one
//   1,000+       200, the brim
//
// The brim is what the bowl holds: the funnel's profile comes to two hundred
// and seventy cells, and a heap under a ceiling fills flat, so two hundred
// stands in it with the rim clear. See `shownFor` in casino.js; what is approximate
// is the size of the heap and nothing else: the row says the exact pot and
// the hole is paid the exact pot.
export const CASINO_PILE_ONE = 100;
export const CASINO_PILE_BAND = 100;
export const CASINO_PILE_BRIM = 200;

export const CASINO_KNOBS = [
  { key: 'CASINO_HANDFUL', label: 'the handful', min: 4, max: 128, step: 4,
    get: () => CASINO_HANDFUL, set: v => { CASINO_HANDFUL = v; } },
  { key: 'CASINO_FALL_MS', label: 'a cell of fall, ms', min: 8, max: 60, step: 1,
    get: () => CASINO_FALL_MS, set: v => { CASINO_FALL_MS = v; } },
  { key: 'CASINO_PEG_BEAT_MS', label: 'a beat on a peg, ms', min: 0, max: 300, step: 10,
    get: () => CASINO_PEG_BEAT_MS, set: v => { CASINO_PEG_BEAT_MS = v; } },
  { key: 'CASINO_GRAIN_GAP_MS', label: 'between grains, ms', min: 0, max: 200, step: 5,
    get: () => CASINO_GRAIN_GAP_MS, set: v => { CASINO_GRAIN_GAP_MS = v; } },
  { key: 'CASINO_GATE_MS', label: 'the gate opening, ms', min: 0, max: 1000, step: 50,
    get: () => CASINO_GATE_MS, set: v => { CASINO_GATE_MS = v; } },
  { key: 'CASINO_SETTLE_HOLD_MS', label: 'the held beat, ms', min: 0, max: 2000, step: 50,
    get: () => CASINO_SETTLE_HOLD_MS, set: v => { CASINO_SETTLE_HOLD_MS = v; } },
  { key: 'CASINO_PAY_BEAT_MS', label: 'a bin paying, ms', min: 0, max: 600, step: 10,
    get: () => CASINO_PAY_BEAT_MS, set: v => { CASINO_PAY_BEAT_MS = v; } },
  { key: 'CASINO_BIN_KNOCK', label: 'a bin thud', min: 0, max: 16, step: 1,
    get: () => CASINO_BIN_KNOCK, set: v => { CASINO_BIN_KNOCK = v; } },
  { key: 'CASINO_EDGE_STROBE_MS', label: 'a x39 strobe, ms', min: 0, max: 3000, step: 100,
    get: () => CASINO_EDGE_STROBE_MS, set: v => { CASINO_EDGE_STROBE_MS = v; } },
  { key: 'CASINO_CHASE_LIVE_MS', label: 'the live chase, ms', min: 20, max: 260, step: 5,
    get: () => CASINO_CHASE_LIVE_MS, set: v => { CASINO_CHASE_LIVE_MS = v; } },
  { key: 'CASINO_ATTRACT_S', label: 'the attract loop, s', min: 5, max: 120, step: 5,
    get: () => CASINO_ATTRACT_S, set: v => { CASINO_ATTRACT_S = v; } },
  { key: 'CASINO_EVEN_BAND', label: 'even, within', min: 0, max: 0.3, step: 0.01,
    get: () => CASINO_EVEN_BAND, set: v => { CASINO_EVEN_BAND = v; } }
];
