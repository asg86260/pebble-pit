
// Putting a stake down *is* the spin. There was a version where the pot opened
// at half and climbed back to the stake over half a minute, and it was a puzzle
// rather than a bet: you put something down and then watched a number go up,
// which is neither gambling nor anything you could explain to somebody watching.
//
// So: the chip goes down, the wheel goes round, and it is doubled or it is gone.
// If it came off, the pot is sitting there and you decide again -- bank it, or
// put the whole of it back on. Even money on any one spin and ruinous kept up,
// which is the whole of what a casino is: no spin is a bad bet and taking them
// all ends at nothing. When to stop is the game.
// A spin is the one moment in this game you are meant to sit and watch, so it
// is given the room to be watched: the wheel winds up, runs, and drags itself
// down to a stop, and the board gets out of the light while it does. Under two
// seconds it read as a flicker and the answer arrived before you had looked up.
export const CASINO_SPIN_MS = 2600;
// The wheel is cut into eight, half bare and half filled -- which is the odds
// written on the thing itself rather than a percentage on a row, and at even
// money they alternate all the way round, which is what a wheel looks like. The
// pointer at the top is what it lands on, so a spin is not a number arriving, it
// is a wheel stopping somewhere you can see. Six turns is enough that nobody can
// follow a slice round and know the answer early.
//
// Black and white, not red and green. Colour in this yard means one thing --
// what a site gave up -- and a wheel painted in traffic lights was the first
// thing here that used it for mood. It does not need it: the grammar is already
// on the page.
//
// White keeps and black takes, which is the way round the rest of the yard reads.
// Every hole a thing comes out of here is white -- the doorways in all six
// buildings, the mouth of the quarry, the throat of the scrubbing house -- and
// black is the mass that has nothing behind it. So a white slice under the
// pointer is an opening and the pot comes back through it, and a black one is
// solid wall. It was the other way about, on the argument that a filled cell is
// a thing and white is the absence of one; that reading is fine on its own and
// it was the only place in the game where black was the good news.
export const CASINO_SLICES = 8;
export const CASINO_WIN_SLICES = 4;  // of them, and the rest are filled
export const CASINO_TURNS = 6;       // whole turns before it comes to rest
export const CASINO_LOSE = '#000';   // wall, and the pot stops there
export const CASINO_KEEP = '#fff';   // a way through, and it comes back
// Four slices in eight, and it is written that way rather than as a number: the
// odds are what the wheel *is*, so the wheel is the definition and this reads
// off it. A wheel that said one thing and paid another would be the one
// dishonest object in the yard.
//
// Even money, and that is the whole of the house's edge -- which sounds like no
// edge at all until you notice that a fair double-or-nothing taken for ever ends
// at nothing with certainty. There is no spin here that is a bad bet and no
// sequence of them that is a good one. When to stop is the only decision, and
// nothing about the odds will make it for you.
export const CASINO_ODDS = CASINO_WIN_SLICES / CASINO_SLICES;
export const CASINO_KNOCK = 9;       // what the stop does to the view
export const CASINO_WIN_KNOCK = 16;  // and what it does when it came off
// Winnings coming down are confetti rather than gravel: they drift, because a
// shower that arrives in three frames is a flicker and the point of it is to be
// watched landing on the heap.
// (`SPARK_` once, before the sky took the word back: these are the table's own
// grains in the air, and nothing to do with what comes off the meteor.)
export const TABLE_LIFE = 2.6;       // seconds a chip is in the air
export const TABLE_GRAV = 0.05;
export const CASINO_WHEEL = 0.35;    // radians a second it idles round at
// What goes on the table. Four chips and one of them is everything you have:
// the size of the bet is most of what a bet feels like, and a stake worked out
// for you as a share of your holdings is a stake nobody chose. `all` is the one
// that is not a number, and it is the one the whole thing is for.
export const CASINO_CHIPS = [10, 100, 1000, 'all'];
// How much sand a pot puts on the ground -- which is one grain a unit right up
// until the numbers stop being numbers. The pot doubles on every ride, so eleven
// wins off a thousand is two million, and two million grains is a plot the width
// of the yard filled solid and twenty-four thousand squares in the air: the sand
// stops being the picture and becomes the cost of drawing it.
//
// So past the first band the heap is a *reading* of the pot rather than a count
// of it, on a ladder written down here rather than worked out per hand: a
// tenfold pot for `CASINO_PILE_BAND` more grains, log-interpolated between the
// marks so nothing jumps and a double is always about forty-five more grains on
// the ground -- a fifth of the first band, which is the smallest step that still
// reads as more sand.
//
//   1 - 100      the pot itself, one for one
//   1,000        250          100,000       550
//   10,000       400          1,000,000+    700, and that is the brim
//
// The brim is seven hundred because that is a heap the size of the building it
// stands beside -- 276 by 120 pixels against a block of 156 by 72 -- and the
// thing a heap has to do from the far end of the yard is read as a heap rather
// than as the weather. The fourteen thousand grains this stretch of ground would
// physically take is a wall; five thousand was still twice the height of the
// roof. See `shownFor` in casino.js -- and note that what
// is approximate is the size of the heap and nothing else: the row says the
// exact pot, banking credits the exact pot, and the hole fills with it.
export const CASINO_PILE_ONE = 100;   // the largest pot still drawn one for one
export const CASINO_PILE_BAND = 150;  // grains a tenfold pot adds past it
export const CASINO_PILE_BRIM = 700;  // and the most that ever lies there
// How long a settled hand stands over the building saying which way it went. A
// wheel that stopped and told you nothing is a wheel you have to have been
// watching, and the yard already has a mark for news you missed -- the lab's
// tick. This is the same idea with two answers.

// --- how a hand is felt ---------------------------------------------------------
// A settled hand is the one moment in the game that is *news*, and a wheel that
// stopped and then sat there read as a wheel that had not decided. So a win is
// a burst: the sign's chase goes to a full strobe, the wheel flashes, and a
// fountain of squares goes up out of it and rains down over the yard. A loss is
// a dud: the sign goes dark and its bulbs come back one at a time, and the pot
// lifts off the ground and fades, which it always did. Nothing pops.
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
