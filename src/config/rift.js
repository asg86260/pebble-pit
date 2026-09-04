import { P } from './yard.js';

// --- the rift ----------------------------------------------------------------
// The hole in the air past the far wall of the pit: what the hole in the ground
// overflows into. See src/rift.js and `## The rift` in DESIGN.md.
//
// A black disc standing in the air over the near end of the hole: fifteen cells
// across, RIFT_AT of the hole's length in from the near lip and clear of the
// ground line by RIFT_UP cells, so the whole of it is against the white page.
// It used to be a lens on the ground past the far wall, which is two windows off
// screen, and then a disc buried to its middle in the pile, which is a blob
// painted on the grey -- see `seatRift`.
export const RIFT_W = P * 15;
export const RIFT_H = P * 15;
// A fraction of the hole rather than a count of cells: the hole is 3,600 across
// and the disc belongs at the end of it that is on screen, whatever that end
// happens to measure. Far enough in to clear the counter's card, which stands
// four cells from the lip.
export const RIFT_AT = 0.05;
export const RIFT_UP = 3;        // cells of clear air between it and the ground line
// --- the tearing ---------------------------------------------------------------
// What happens the moment a hole that cannot take another grain gives way.
//
// Not a rift that opens and then starts draining at twelve grains a second: the
// tearing is the one dramatic thing that ever happens to the pit, and what it
// does is **empty the hole**. Every grain in it goes, in one long gulp, with the
// yard rocking under it. It is also the first time anybody sees the thing work,
// so it has to be the clearest possible statement of what it is for -- after it,
// the rift's rate is what you live with, and the pressure of the ladder starts
// from a hole you watched being emptied rather than from a number on a card.
//
// Nothing is lost to it, exactly as nothing is lost to any other swallow: the
// counter does not move, the pile shows what is in the hole and the rift's
// reading shows the rest.
export const RIFT_GULP = 1.8;        // seconds the tear takes to empty the hole
export const RIFT_GULP_SHOW = 1400;  // grains of it in the air at once, while it goes
export const RIFT_SHAKE = 22;        // and how hard the yard is rocked: the biggest knock there is
// --- what it does to the air ---------------------------------------------------
// A hole that only moves something when it happens to be swallowing a grain is a
// hole that stands still, and a fresh rift swallows twelve a second -- seventeen
// specks in the air at any moment, which is not something you can see pulling. So
// it pulls on the dust as well. The dust is already everywhere, it is already
// moving, and dust going down a hole is the plainest picture of a hole there is.
//
// Nothing is counted or lost: a mote drawn into the middle is put back somewhere
// else in the same breath (see `place` in air.js), so the sky holds exactly as
// much as the yard has earned. This is weather, not stock.
//
// The reach is in disc radii, so it follows RIFT_W wherever that goes. The rest
// is screen pixels a frame, which is what a mote is measured in.
export const RIFT_PULL = 1.3;    // how hard it pulls, right at the rim
export const RIFT_PULL_R = 4.5;  // how far the pull reaches, in radii
export const RIFT_SPIN = 0.75;   // and how much of the pull goes round rather than in
// What share of the dust it eats is put back at the edge of its own reach rather
// than anywhere in the yard.
//
// Without this the pull only ever *clears* the air around the disc: the motes
// near it are drawn in, are put back over some pile across the yard, and what is
// left is a bald patch of sky with a black circle in it -- the picture of a hole
// that has finished rather than one that is working. Feeding a share of them
// back at the rim gives it a stream to pull on, which is the thing being drawn.
//
// Not all of them, because a hole that recycles everything it eats slowly drags
// the entire sky into a ring around itself and leaves the rest of the yard
// clear. At a bit over half, the ring holds what drifts into it and the sky
// stays the sky.
export const RIFT_FEED = 0.55;
// How the swallowed grains go: how many turns round the disc a grain makes on
// its way in, and how long the whole orbit takes, in frames at sixty. Both are
// what the suck is made of -- a grain is dragged round faster the closer it
// gets, so it wants turns to spend and it wants to be quick about them.
export const RIFT_TURNS = 2.4;
export const RIFT_ORBIT_FRAMES = 84;
// What tearing one costs. Red, because it is the one plainly magic thing acting
// on the one plainly dirt thing, and dust like every other row in the game.
export const RIFT_BILL = [['spark', 120], ['dust', 20000]];
// Grains a second a fresh rift swallows, and what each widening multiplies that
// by. Twelve a second is under a well-run yard's income on purpose: the rift
// arrives behind the works and you buy it forward, so the row means something
// the day you build it.
export const RIFT_RATE0 = 12;
export const RIFT_RATE = 1.6;
// And what a widening costs, in red, growing the same way. The dust half is the
// sixty-to-the-spark line every other price in the game sits on -- see DUST_PER
// in upgrades.js.
export const RIFT_RATE_COST = 25;
export const RIFT_RATE_UP = 1.5;
export const FLOOR_MARGIN = 12;  // gap under the pit floor, at the bottom of the window
// how many device pixels we are willing to fill a frame, before backing the
// resolution off. A phone at three to one is about three million.
// A `let`, because it is one of the dials -- it sat in TUNABLE as a `const` with
// no way in or out of the switches, so its slider read nothing and wrote nothing.
// One row with its own pair of accessors is what caught it.
