// Putting a stake down *is* the spin: the chip goes down, the wheel goes
// round, and it is doubled or it is gone. Even money on any one spin and
// ruinous kept up; when to stop is the game. A spin is given the room to be
// watched: under two seconds it read as a flicker.
export const CASINO_SPIN_MS = 2600;
// The wheel is cut into eight, half bare and half filled, alternating: the
// odds written on the thing itself. The pointer at the top is what it lands
// on. Six turns is enough that nobody can follow a slice round and know the
// answer early.
//
// Black and white, not red and green: color in this yard means what a site
// gave up. White keeps and black takes, the way round the rest of the yard
// reads: every hole a thing comes out of here is white, and black is the mass
// with nothing behind it.
export const CASINO_SLICES = 8;
export const CASINO_WIN_SLICES = 4;  // of them, and the rest are filled
export const CASINO_TURNS = 6;       // whole turns before it comes to rest
export const CASINO_LOSE = '#000';   // wall, and the pot stops there
export const CASINO_KEEP = '#fff';   // a way through, and it comes back
// Read off the wheel rather than written: a wheel that said one thing and paid
// another would be the one dishonest object in the yard.
export const CASINO_ODDS = CASINO_WIN_SLICES / CASINO_SLICES;
export const CASINO_KNOCK = 9;       // what the stop does to the view
export const CASINO_WIN_KNOCK = 16;  // and what it does when it came off
// Winnings coming down are confetti rather than gravel: they drift, because
// the point of them is to be watched landing on the heap.
export const TABLE_LIFE = 2.6;       // seconds a chip is in the air
export const TABLE_GRAV = 0.05;
export const CASINO_WHEEL = 0.35;    // radians a second it idles round at
// Four chips and one of them is everything you have: a stake worked out as a
// share of your holdings is a stake nobody chose.
export const CASINO_CHIPS = [10, 100, 1000, 'all'];
// How much sand a pot puts on the ground: one grain a unit up to the first
// band, then a *reading* of the pot rather than a count, since the pot doubles
// every ride and two million grains is the width of the yard filled solid. A
// tenfold pot for `CASINO_PILE_BAND` more grains, log-interpolated so nothing
// jumps and a double is always about forty-five more grains.
//
//   1 - 100      the pot itself, one for one
//   1,000        250          100,000       550
//   10,000       400          1,000,000+    700, and that is the brim
//
// The brim is a heap the size of the building it stands beside. See `shownFor`
// in casino.js; only the heap is approximate -- the row, the bank and the hole
// all carry the exact pot.
export const CASINO_PILE_ONE = 100;   // the largest pot still drawn one for one
export const CASINO_PILE_BAND = 150;  // grains a tenfold pot adds past it
export const CASINO_PILE_BRIM = 700;  // and the most that ever lies there

// --- how a hand is felt ---------------------------------------------------------
// A wheel that stopped and then sat there read as a wheel that had not
// decided. A win is a burst: the sign's chase goes to a full strobe, the wheel
// flashes, and a fountain of squares rains down over the yard. A loss is a
// dud: the sign goes dark and its bulbs come back one at a time. Nothing pops.
export const CASINO_WIN_MS = 2400;      // the strobe and the flash
export const CASINO_FLASH_MS = 700;     // of which the wheel itself flashes
export const CASINO_STROBE_MS = 70;     // a bulb on or off, this often
export const CASINO_BURST = 70;         // squares in the fountain...
export const CASINO_BURSTS = 3;         // ...and how many fountains, a beat apart
export const CASINO_BURST_GAP_MS = 220;
export const CASINO_BURST_UP = 3.2;     // how hard they go up, in pixels a frame
export const CASINO_BURST_SIDE = 1.6;   // and how wide they spread
export const CASINO_DARK_MS = 800;      // a loss: the sign goes dark for this long...
export const CASINO_RELIGHT_MS = 90;    // ...then a bulb comes back this often
export const CASINO_SAY_MS = 4000;      // how long the table's last word stands
