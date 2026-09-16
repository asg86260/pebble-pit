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

// What goes on the roof is the bet set on the panel: a coin and a chip, the
// four chips this casino has always sold. `all` is the whole purse.
export const CASINO_CHIPS = [10, 100, 1000, 'all'];

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
export const DIGIT_W = 3;                      // the pay face's glyph, in cells
export const DIGIT_H = 5;
export const HALF_W = DIGIT_W + 2;             // and the half's: a point, air, a digit
export const PAY_AIR = 1;                      // clear cells each side of a pay
export const BIN_W = HALF_W + 2 * PAY_AIR + 1;
export const EDGE_BIN_W = DIGIT_W * 2 + 1 + 2 * PAY_AIR + 1;
export const BIN_H = 6;
// What a bin pays, written under it in its own foot: the bins' dividers run on
// down through this band, so it is a row of table cells, one under each bin,
// and no pay can be read as its neighbor's. A floor line, a clear row, five of
// glyph, a clear row, and the tray's rim.
export const LABEL_H = 9;
// The tray at the foot, which the bins pay into: the same walled plot the
// hopper is, but deeper, so a won pot stands as a real heap at the foot.
export const TRAY_H = 12;
// The field's width: the bins across. The building is wider by a margin
// either side -- two cells at least, a white divider and the wall, and more
// when the panel of buttons under the feet is wider than the field, since
// the front has to hold the panel (see below).
export const BOARD_COLS = (CASINO_BINS.length - 2) * BIN_W + 2 * EDGE_BIN_W;
export const FIELD_H = BOARD_AIR + CASINO_PEG_ROWS * PEG_ROW_H;

// --- the controls on the building ---------------------------------------------------
// The arm is a slot machine's: a tall stem up from a boss on the wall by the
// deck with a ball on the end, the biggest knob on the building, that swings
// down through most of a half turn when pulled and comes back up slower;
// dead, it lies at the bottom of its swing. The deck is the band under the
// funnel: three boxed groups with air between them the way a real button
// deck is clustered -- COIN, BET with the stake window, PLAY -- each button
// a cap in its group's recess, black when chosen or live, grey when not,
// hollow when the purse cannot cover it, and a small label under each
// group. A thumb needs more than a stem to find, so on a phone every hit box
// opens out to `LEVER_HIT` cells.
export const ARM_LENGTH = 8;              // the arm's stem, in cells
export const ARM_BOSS = 2;                // the boss the arm turns on stands this far out from the wall
export const ARM_SWING = (2 * Math.PI) / 3;   // how far down it swings
export const LEVER_HIT = 8;               // the tap target on a phone, in cells
export const LEVER_SWING_MS = 300;        // the arm down; up takes twice this
export const BUTTON_PRESS_MS = 200;       // a pressed button reads pressed this long
export const DECK_GROUP_GAP = 4;          // clear cells between the groups
export const DECK_BUTTON_GAP = 1;         // clear cells between caps in a group
export const DECK_PAD = 1;                // clear cells between a group's caps and its rim
export const CAP_PAD = 1;                 // clear cells between a face and its cap's edge
export const MARK_CELLS = 5;              // a coin's mark on its cap, in cells square
export const GLYPH_CELLS = 8;             // the sack and the same-bet turn: a shelf glyph, a cell a pixel
export const WINDOW_CHARS = 5;            // the stake window: this many figures of the digit face, "12.5k"
export const DECK_LABELS = true;          // COIN / BET / PLAY under the groups, in the small face
export const PANEL_COINS = ['dust', 'spore', 'shard', 'spark'];

// How a chip the purse cannot cover is drawn: a hollow cap, or grey like an
// unchosen one.
export let CHIP_DEAD_HOLLOW = true;
export const setDeadLook = hollow => { CHIP_DEAD_HOLLOW = !!hollow; };
// A chip's figure on its button, and a figure's width in the sign's face:
// three cells a figure and a cell of air between.
export const chipLabel = c => c === 'all' ? 'ALL' : c === 1000 ? '1k' : String(c);
export const wordCells = word => word.length * DIGIT_W + (word.length - 1);
// Each group stacks its caps two rows deep inside its recess: the coins two
// by two, the chips two by two with the window standing beside them across
// both rows, same bet over the sack. A group's width is its columns (each
// as wide as its widest cap), the gaps between, the window if it has one,
// and a pad and a rim round the lot; its height the two rows, the gap, and
// the same pad and rim -- every group the tallest group's height.
const capW = face => face + 2 * CAP_PAD;
export const WINDOW_CELLS = WINDOW_CHARS * (DIGIT_W + 1) - 1 + 1 + MARK_CELLS + 2;
const columns = (faces, cols) => {
  const w = [];
  faces.forEach((f, i) => { w[i % cols] = Math.max(w[i % cols] || 0, capW(f)); });
  return w.reduce((n, c) => n + c, 0) + (w.length - 1) * DECK_BUTTON_GAP;
};
// ...and never narrower than its label wants, a cell of air each side.
export const GROUP_LABELS = ['COIN', 'BET', 'PLAY'];
const atLeastLabel = (w, i) => Math.max(w, wordCells(GROUP_LABELS[i]) + 2);
export const DECK_GROUPS_W = [
  columns(PANEL_COINS.map(() => MARK_CELLS), 2) + 2 * (DECK_PAD + 1),
  columns(CASINO_CHIPS.map(c => wordCells(chipLabel(c))), 2) + DECK_BUTTON_GAP + WINDOW_CELLS + 2 * (DECK_PAD + 1),
  columns([GLYPH_CELLS, GLYPH_CELLS], 1) + 2 * (DECK_PAD + 1)
].map(atLeastLabel);
export const DECK_CELLS = DECK_GROUPS_W.reduce((n, w) => n + w, 0) + 2 * DECK_GROUP_GAP;
export const GROUP_H = 2 * capW(GLYPH_CELLS) + DECK_BUTTON_GAP + 2 * (DECK_PAD + 1);
export const LABEL_ROWS = DECK_LABELS ? DIGIT_H + 1 : 0;
export const DECK_H = 1 + GROUP_H + LABEL_ROWS + 1;
// ...which is what sets the building's margin past the field, and with it
// the hopper's width and its funnel's profile: the walls step in evenly
// from the rim to the floor.
export const CASINO_MARGIN = Math.max(2, Math.ceil((DECK_CELLS + 2 - BOARD_COLS) / 2));
export const HOPPER_COLS = BOARD_COLS + 2 * CASINO_MARGIN - 2;
export const HOPPER_PROFILE = Array.from({ length: HOPPER_H }, (_, r) =>
  Math.round(r * ((HOPPER_COLS - HOPPER_FLOOR) / 2) / (HOPPER_H - 1)));

// --- how a grain moves -----------------------------------------------------------------
// A grain steps a cell at a time down the face, this often -- slower than a
// frame, so the eye can keep up with one -- and it is written in time so a
// slow frame does not slow the machine. Arriving at a peg it sits a beat, and
// on the beat the peg rings and ticks. Grains leave the hopper this far apart,
// so the board carries a procession splitting on the pegs rather than a
// cloud; a handful is on the board about two and a half seconds from
// the first grain leaving to the last landing (two and six-tenths, measured).
export let CASINO_FALL_MS = 20;
export let CASINO_PEG_BEAT_MS = 60;
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
// The tray's ladder is steeper and its brim higher: the tray is twelve rows
// deep so that a won pot stands as a real heap at the foot, and a thousand
// should look like a thousand there. Nine hundred is what its rows hold
// with the rim clear.
export const CASINO_TRAY_BAND = 400;
export const CASINO_TRAY_BRIM = 900;
export const trayShownFor = n =>
  n <= CASINO_PILE_ONE ? Math.max(0, Math.floor(n))
    : Math.min(CASINO_TRAY_BRIM,
               Math.round(CASINO_PILE_ONE +
                          CASINO_TRAY_BAND * Math.log10(n / CASINO_PILE_ONE)));
export const CASINO_KNOBS = [
  { key: 'CASINO_HANDFUL', label: 'pebbles a hand', min: 4, max: 64, step: 1,
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
