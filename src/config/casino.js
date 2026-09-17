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

// What goes on the roof is what you hold the arm for: pebbles pour out of
// the purse into the funnel for as long as the arm is held, a slice of what
// you own a second -- the purse as it stood at the press, held flat, so a
// hold empties it in 1/POUR_SHARE seconds rather than crawling; never less
// than a floor, so the shortest tap stakes a real handful -- and the pile is
// the stake. See DESIGN.md, "The pour".
export let POUR_SHARE = 0.05;             // of the purse, a second
export let POUR_MIN = 16;                 // pebbles a second, at least

// --- the handful ------------------------------------------------------------------
// How many pebbles come out of the throat a hand, whatever the stake: the
// whole of the hopper's pile drains into the machine when the gate opens, and
// what the machine drops is this many pressed pebbles, each carrying its share
// of the stake. The count is what makes this a bet at all -- every pebble is
// a fair draw from the bins, a hand pays the mean of N draws, and the spread
// of a mean shrinks with the square root of N. One pebble's pay has a
// standard deviation of about 1.9 on the bin table, so sixteen pay with a
// spread near half: a typical hand comes back at half to one and a half, and
// one hand in sixty puts a pebble in a x39. Sixteen two-by-two pebbles is
// enough to read as a cascade; the number is a knob and what it trades is
// the spread, which `test/handful.test.mjs` holds off the constant. A chip
// smaller than this is one pebble a coin.
export let CASINO_HANDFUL = 16;

// --- the bins -----------------------------------------------------------------------
// Ten rows of pegs and eleven bins. A grain at a peg goes left or right and
// nothing else, so where it lands is ten fair coins added up: the odds are the
// pegs, and the bins say what they pay. Written out rather than worked from a
// formula so the numbers can be read off the board. A number is a multiple
// on the pebbles that land in the bin; a coin's name is a bin that converts
// what lands in it to that coin by worth, at the exchange every price sits
// on (`DUST_PER`), and never less than one coin. Weighted by how often a
// grain reaches each bin (1, 10, 45, 120, 210, 252 in 1,024, and back) the
// five pebble bins pay 906 and the six converting bins their 112 by worth:
// 1,018 in 1,024, fair to the pebble, the median hand under it, and that is
// the whole of the house's edge. `test/casino.test.mjs` asserts the sum, so
// a bin cannot be moved on its own.
export const CASINO_PEG_ROWS = 10;
export const CASINO_BINS = ['spark', 'shard', 'spore', 1.5, 1, 0.5, 1, 1.5, 'spore', 'shard', 'spark'];

// --- the building, in cells, top to bottom -------------------------------------------
// The hopper on the roof, where the stake stands: a funnel, the building's
// width at the rim and narrowing row by row to a flat floor over the throat.
// The profile is how many cells the wall steps in from each side, rim first;
// the walls are fixed cells in the hopper's own plot, so the sand heaps
// against them by the yard's rules, fills from the throat up and sits in the
// bowl. What stands in it is the stake at the band ladder -- a chip of ten is
// ten grains, an all-in is the brim -- and the bowl is at least the brim: nine
// rows stepping in evenly from the building's width to a floor of
// `HOPPER_FLOOR` cells (the profile is worked out below, once the width is
// known). The heap stands up to the rim and no further (`table.ceiling`).
export const HOPPER_H = 9;
export const HOPPER_FLOOR = 8;
// Its floor, one cell thick, which is the gate: it splits from the middle when
// you let go, to the throat's two cells, the column the handful enters at and
// its neighbor.
export const GATE_H = 1;
export const GATE_W = 2;
// The sign band under the floor, between the funnel and the pegs so nothing
// stands in front of the bowl: the roof sign's five-row letters across the
// front in one word, a clear cell and the bulbs each side of them.
export const CASINO_SIGN_H = 9;
// The face: a band of air for the stream to fan in, then the peg rows three
// apart -- two was cramped: a pebble two cells tall on a peg had a cell of
// air over it -- then the bins with their pay written under them, then the
// tray. The rows below the last peg, `PEG_ROW_H - 1` of them, are the air
// over the bins.
export const BOARD_AIR = 4;
export const PEG_ROW_H = 3;
// A bin is eight cells on the field: a seven-cell slot and a wall on its
// right. Seven, because a bin wears its own pay in its own foot and the
// half's ".5" -- a point, a clear cell and a digit, the only way it reads at
// this size -- is five cells, and a pay wants a clear cell each side of it
// or it reads as its neighbor's; and eight halves to the four cells a grain
// steps across a row, so the fan of ten rows reaches the outer bins exactly.
// The two edge bins are wider still: their pay is two digits and a gap.
export const DIGIT_W = 3;                      // the pay face's glyph, in cells (a one is a stroke)
export const DIGIT_H = 5;
export const PAY_AIR = 1;                      // clear cells each side of a pay
// The widest pay on the feet is "1.5": a stroke, air, the point, air, a
// five -- seven cells -- and the edge bins wear a coin's mark.
export const PAY_W = 1 + 1 + 1 + 1 + DIGIT_W;
export const BIN_W = PAY_W + 2 * PAY_AIR + 1;
export const EDGE_BIN_W = 5 + 2 * PAY_AIR + 1;
export const BIN_H = 6;
// What a bin pays, written under it in its own foot: the bins' dividers run on
// down through this band, so it is a row of table cells, one under each bin,
// and no pay can be read as its neighbor's. A floor line, a clear row, five of
// glyph, a clear row, and the tray's rim.
export const LABEL_H = 9;
// The foot under the bins is the tray: the pay falls through the feet and
// heaps on the building's floor, a plot of sand of its own, where a win is
// seen to pile up before it goes. Tall enough for a big hand to stand in.
export const FOOT_H = 22;
// The tray's plot: the foot's height less a clear row under the feet's rim,
// so a pebble is seen to drop before it lands.
export const TRAY_H = FOOT_H - 2;
// The field's width: the bins across.
export const BOARD_COLS = (CASINO_BINS.length - 2) * BIN_W + 2 * EDGE_BIN_W;
export const FIELD_H = BOARD_AIR + CASINO_PEG_ROWS * PEG_ROW_H;

// --- the controls on the building ---------------------------------------------------
// Two, and one of them is the sign. The arm is a slot machine's: a tall stem
// up from a boss on the wall by the funnel with a ball on the end, held down
// while the stake pours and springing back up when let go; dead, it lies at
// the bottom of its swing. The sign is the drop button while a stake stands
// in the funnel: a tap presses it down a cell for a beat and the floor
// opens. A thumb needs more than a stem to find, so on a phone every hit box
// opens out to `LEVER_HIT` cells.
export const ARM_LENGTH = 8;              // the arm's stem, in cells
export const ARM_BOSS = 2;                // the boss the arm turns on stands this far out from the wall
export const ARM_SWING = (2 * Math.PI) / 3;   // how far down it swings
export const LEVER_HIT = 8;               // the tap target on a phone, in cells
export const LEVER_SWING_MS = 300;        // the arm down; up takes twice this
export const BUTTON_PRESS_MS = 200;       // the sign reads pressed this long
export const MARK_CELLS = 5;              // a coin's mark on a bin's foot, in cells square
// The building is the field's width and a margin either side: a white
// divider and the wall. The hopper's funnel steps in evenly from that width
// to its floor.
export const CASINO_MARGIN = 2;
export const HOPPER_COLS = BOARD_COLS + 2 * CASINO_MARGIN - 2;
export const HOPPER_PROFILE = Array.from({ length: HOPPER_H }, (_, r) =>
  Math.round(r * ((HOPPER_COLS - HOPPER_FLOOR) / 2) / (HOPPER_H - 1)));
// --- how a grain moves -----------------------------------------------------------------
// A pebble falls under gravity, in cells a second squared: it speeds up
// between rows, and off a peg it hops -- up `CASINO_HOP` cells and across
// to the next seat in one arc, the hop a little higher or lower for each
// pebble so no two share a path in step. On a peg it sits a beat, and on
// the beat the peg rings and ticks. Written in time, so a slow frame does
// not slow the machine. Grains leave the throat this far apart, give or
// take the jitter, so the board carries a procession splitting on the pegs
// rather than a clump, and the eye can follow one; a handful is on the
// board about four and a half seconds from the first leaving to the last landing (measured).
export let CASINO_GRAV = 300;
export let CASINO_HOP = 0.6;
export let CASINO_HOP_VARY = 0.3;              // how much a hop's height varies, pebble to pebble
export let CASINO_PEG_BEAT_MS = 60;
export let CASINO_GRAIN_GAP_MS = 100;
export let CASINO_GRAIN_JITTER = 0.6;          // of the gap, either way
// The floor splits from the middle over this long: the middle cell is open
// on the frame of the tap and the pile is draining through it that frame --
// a quarter second of nothing after the tap read as a hitch on the phone --
// and the cells either side follow.
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
// "The pour": the marquee carries the state (DESIGN.md, "The marquee
// carries the state"). Idle, every other bulb lit, the two sets swapping on
// a slow beat. Pouring and draining, a run of bulbs chasing round the
// border with the dust: a step a grain, its length off the grains a second
// between a floor and a cap. Ready, the sign flashing between the count and
// DROP IT on a beat, the bulbs more excited than either: all on with a
// sparkle of random ones dropping out each step ('sparkle'), or two runs
// chasing in opposite directions under the count ('twin').
export let SIGN_SWAP_MS = 1500;
export let SIGN_CHASE_MIN_MS = 40;
export let SIGN_CHASE_MAX_MS = 400;
export let SIGN_FLASH_MS = 700;
// Ready, the sign holds the count this long before the first DROP IT: the
// figure is still rolling up to the stake when the arm lets go, and words
// over a number mid-climb read as the sign changing its mind.
export let SIGN_SETTLE_MS = 1500;
export let SIGN_READY_STEP_MS = 60;
export let SIGN_READY_LIGHTS = 'sparkle';
export const setReadyLights = how => { SIGN_READY_LIGHTS = how; };
// the flash's face held for a scene's shot: null runs on the beat, 0 the count, 1 the words
export let SIGN_FLASH_FACE = null;
export const setFlashFace = f => { SIGN_FLASH_FACE = f; };
export let CASINO_CHASE_LIVE_MS = 65;
// The tray keeps the pay a beat after the last bin has paid, so the pile is
// seen whole, then lifts it off a grain at a time, out of the hatch and into
// the hole: however much there is, it is away in about this long. The next
// stake pours while it goes; nothing waits on the tray.
export let TRAY_HOLD_MS = 600;
export let TRAY_OUT_MS = 2500;
// ...and never faster than a grain every this many ms, so a small pile is
// seen to go rather than blink off.
export let TRAY_STEP_MS = 40;
// The machine sells itself. Every so often, with nobody at it, one grain drops
// from the hopper and ticks its way down to a bin, then lifts and fades -- a
// demonstration with nothing riding on it, and the only moving thing out past
// the lab. It stops the moment the arm is held.
export let CASINO_ATTRACT_S = 20;
// Grains leaving -- a lost heap lifting off, a demonstration grain going --
// drift up and fade, because a thing that arrives or leaves in three frames is
// a flicker.
export const TABLE_LIFE = 2.6;
export const TABLE_GRAV = 0.05;
// How much sand a pot puts in the hopper or the tray -- one grain a unit
// right up until the numbers stop being numbers. Past the first band the heap is a *reading*
// of the pot rather than a count of it, on a ladder written down here: a
// tenfold pot for `CASINO_PILE_BAND` more grains, log-interpolated between the
// marks so nothing jumps, and never more than the brim.
//
//   1 - 100      the pot itself, one for one
//   1,000        250          10,000+      300, the brim
//
// The brim is what the tray holds and what the bowl holds: five rows of
// seventy-two, or the funnel's profile, is three hundred and sixty cells, and
// a heap under a ceiling fills flat, so three hundred stands in either with
//
// The ladder is arithmetic on three numbers and nothing else, so it lives
// here where the numbers do, and the plots are sized off it at layout. What
// is approximate is the size of the heap and nothing else: the row says the
// exact pot and the hole is paid the exact pot.
export const CASINO_PILE_ONE = 100;
export const CASINO_PILE_BAND = 150;
export const CASINO_PILE_BRIM = 300;
export const shownFor = n =>
  n <= CASINO_PILE_ONE ? Math.max(0, Math.floor(n))
    : Math.min(CASINO_PILE_BRIM,
               Math.round(CASINO_PILE_ONE +
                          CASINO_PILE_BAND * Math.log10(n / CASINO_PILE_ONE)));
export const CASINO_KNOBS = [
  { key: 'POUR_SHARE', label: 'the pour, of the purse a second', min: 0.005, max: 0.5, step: 0.005,
    get: () => POUR_SHARE, set: v => { POUR_SHARE = v; } },
  { key: 'POUR_MIN', label: 'the pour, pebbles a second at least', min: 1, max: 200, step: 1,
    get: () => POUR_MIN, set: v => { POUR_MIN = v; } },
  { key: 'CASINO_HANDFUL', label: 'pebbles a hand', min: 4, max: 64, step: 1,
    get: () => CASINO_HANDFUL, set: v => { CASINO_HANDFUL = v; } },
  { key: 'CASINO_GRAV', label: 'gravity on the pegs, cells a second squared', min: 40, max: 600, step: 10,
    get: () => CASINO_GRAV, set: v => { CASINO_GRAV = v; } },
  { key: 'CASINO_HOP', label: 'a hop off a peg, cells up', min: 0, max: 3, step: 0.05,
    get: () => CASINO_HOP, set: v => { CASINO_HOP = v; } },
  { key: 'CASINO_HOP_VARY', label: 'the hop\'s variation, pebble to pebble', min: 0, max: 1, step: 0.05,
    get: () => CASINO_HOP_VARY, set: v => { CASINO_HOP_VARY = v; } },
  { key: 'CASINO_GRAIN_JITTER', label: 'the throat\'s jitter, of the gap', min: 0, max: 1, step: 0.05,
    get: () => CASINO_GRAIN_JITTER, set: v => { CASINO_GRAIN_JITTER = v; } },
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
  { key: 'SIGN_SWAP_MS', label: 'the idle marquee swap, ms', min: 200, max: 3000, step: 50,
    get: () => SIGN_SWAP_MS, set: v => { SIGN_SWAP_MS = v; } },
  { key: 'SIGN_CHASE_MIN_MS', label: 'the chase, fastest step ms', min: 10, max: 200, step: 5,
    get: () => SIGN_CHASE_MIN_MS, set: v => { SIGN_CHASE_MIN_MS = v; } },
  { key: 'SIGN_CHASE_MAX_MS', label: 'the chase, slowest step ms', min: 100, max: 2000, step: 50,
    get: () => SIGN_CHASE_MAX_MS, set: v => { SIGN_CHASE_MAX_MS = v; } },
  { key: 'SIGN_READY_STEP_MS', label: 'the ready chase, ms a step', min: 20, max: 300, step: 5,
    get: () => SIGN_READY_STEP_MS, set: v => { SIGN_READY_STEP_MS = v; } },
  { key: 'SIGN_FLASH_MS', label: 'the ready flash, ms', min: 200, max: 2000, step: 50,
    get: () => SIGN_FLASH_MS, set: v => { SIGN_FLASH_MS = v; } },
  { key: 'SIGN_SETTLE_MS', label: 'the count settling before DROP IT, ms', min: 0, max: 4000, step: 100,
    get: () => SIGN_SETTLE_MS, set: v => { SIGN_SETTLE_MS = v; } },
  { key: 'TRAY_HOLD_MS', label: 'the tray holds the pay, ms', min: 0, max: 3000, step: 100,
    get: () => TRAY_HOLD_MS, set: v => { TRAY_HOLD_MS = v; } },
  { key: 'TRAY_OUT_MS', label: 'the tray empties into the hole, ms', min: 500, max: 8000, step: 250,
    get: () => TRAY_OUT_MS, set: v => { TRAY_OUT_MS = v; } },
  { key: 'TRAY_STEP_MS', label: 'the tray, ms a grain at the slowest', min: 10, max: 200, step: 5,
    get: () => TRAY_STEP_MS, set: v => { TRAY_STEP_MS = v; } },
  { key: 'CASINO_ATTRACT_S', label: 'the attract loop, s', min: 5, max: 120, step: 5,
    get: () => CASINO_ATTRACT_S, set: v => { CASINO_ATTRACT_S = v; } },
  { key: 'CASINO_EVEN_BAND', label: 'even, within', min: 0, max: 0.3, step: 0.01,
    get: () => CASINO_EVEN_BAND, set: v => { CASINO_EVEN_BAND = v; } }
];
