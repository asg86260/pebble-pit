// The casino is the machine: the stake heaps on the roof, the tray floor gives
// way, and the sand pours through the pegs into the slots. What you bet on is
// which slot, and the sand decides. See DESIGN.md, "The sand board".
//
// Putting a stake down is not the bet any more -- the call is. The chip goes
// down and the sand rains on to the roof; you call a slot; you let it go. There
// was a wheel here, even money, and it is gone: a building with a wheel and a
// board in it is two buildings, and the board is the one that uses the sand.

// What goes on the roof. Four chips and one of them is everything you have:
// the size of the bet is most of what a bet feels like, and a stake worked out
// for you as a share of your holdings is a stake nobody chose. `all` is the one
// that is not a number, and it is the one the whole thing is for.
export const CASINO_CHIPS = [10, 100, 1000, 'all'];

// --- the building, in cells, top to bottom ------------------------------------
// The tray on the roof, where the stake stands. Walled, and the sand heaps up
// to its rim and then walks sideways (`table.ceiling`), so an all-in is a full
// tray rather than a spire.
export const TRAY_H = 16;
// The face: the sign across the top, a band of air for the sheet to fan out in,
// the peg rows, and the slots. The board grid is the air, the pegs and the
// slots; the sign and the label band under the slots are the building's own.
export const CASINO_SIGN_H = 9;      // five-cell letters, two of air each side
export const BOARD_AIR = 2;
export const PEG_ROWS = 4;
export const PEG_ROW_H = 2;          // cells between peg rows
export const SLOT_H = 12;            // and how deep a slot is before the sand stands in the pegs
export const LABEL_H = 14;           // what a slot pays, written under it: two digits stacked, and a cell of block above and below
// Seven slots three cells wide with a cell of wall between: twenty-seven cells
// across, and a wall each side makes the building twenty-nine. The pegs sit on
// the same pitch as the slots, staggered a half-pitch every row.
export const SLOTS = 7;
export const SLOT_W = 5;
export const SLOT_PITCH = SLOT_W + 1;
export const BOARD_COLS = SLOTS * SLOT_PITCH - 1;
export const BOARD_ROWS = BOARD_AIR + PEG_ROWS * PEG_ROW_H + SLOT_H;

// Where the tray floor can give way, as the first column of a three-wide gate:
// one over the middle of each slot. The whole pot goes through the one hole --
// the floor tips toward it, see `tipToGate` in casino.js -- so where it opens
// is the whole of the luck: picked when you let go, and drawn, so you see where
// it opened, and by then the call is made.
export const GATES = [1, 7, 13, 19, 25, 31, 37];
export const GATE_W = 3;

// What each slot pays, per grain that lands in it. MEASURED, not chosen: sand
// through pegs is not a binomial, and what share reaches each slot depends on
// the peg layout and on where the gate opened. `tools/node/board-rates.mjs`
// pours the built board from every gate and prints the shares; each rate is one
// over its slot's share across the gates, so calling any slot pays about one on
// average -- fair the way the wheel was, and no fairer. Whole numbers, because
// a stacked "6.5" is a smudge from the far end of the yard, and the nearest
// whole number puts every slot within a tenth of one. `test/sandboard.test.mjs`
// pours the board again and holds these against it, so a moved peg is a red
// test rather than a quietly crooked board.
//
// Measured 2026-09-11, the thousand chip (two hundred grains) from each gate:
// the gate's own slot takes about forty percent of the pour, the slot either
// side about twenty-eight, and the rest nothing -- so a call pays near three
// times one hand in seven, near twice two hands in seven, and nothing the
// other four.
export const SLOT_RATES = [9, 6, 6, 7, 6, 6, 9];

export const CASINO_KNOCK = 9;       // what the sheet reaching the slots does to the view
export const CASINO_WIN_KNOCK = 16;  // and what a called slot paying does
// Winnings coming down are confetti rather than gravel: they drift, because a
// shower that arrives in three frames is a flicker and the point of it is to be
// watched landing on the heap.
export const TABLE_LIFE = 2.6;       // seconds a grain leaving is in the air
export const TABLE_GRAV = 0.05;
// How much sand a pot puts on the roof -- one grain a unit right up until the
// numbers stop being numbers. Past the first band the heap is a *reading* of the
// pot rather than a count of it, on a ladder written down here: a tenfold pot
// for `CASINO_PILE_BAND` more grains, log-interpolated between the marks so
// nothing jumps, and never more than the brim.
//
//   1 - 100      the pot itself, one for one
//   1,000        200          100,000       400
//   10,000       300          1,000,000+    400, the brim
//
// The brim is what the slots hold: seven slots twelve deep is two hundred and
// fifty cells, and a pour that mostly lands in one of them stands up into the
// pegs past that -- which is a picture of a big hand, and fine, but a pour that
// filled the whole face would be a board you could not read. See `shownFor`
// in casino.js; what is approximate is the size of the heap and nothing else:
// the row says the exact pot and the hole is paid the exact pot.
export const CASINO_PILE_ONE = 100;
export const CASINO_PILE_BAND = 100;
export const CASINO_PILE_BRIM = 400;

// A row from the tray to the top of the board is a short fall; a grain that
// left the gate lands in a beat, and the pour is the sand in the tray draining
// rather than the sand in the air.
export const GATE_DROP_V = 1.2;      // cells a frame a grain leaves the gate at
