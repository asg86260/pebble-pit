// --- a thumb on the glass ---------------------------------------------------------
// The game under a finger (DESIGN.md, "Playing it on a phone"). Nothing here
// is a feel: the coast of a fling is the platform's, so there is no friction
// and no stop speed. What is here is what a tap IS, one answer for the whole
// page (tap.js), and the shape of the three things a phone gets that a desk
// does not -- the hop, the undo and the sheet.

// A tap: a press that neither wanders nor lingers. Past the slop it is a
// drag, past the time it is a hold, and neither buys or opens anything.
export const TAP_SLOP = 14;          // pixels a tap may wander and still be a tap
export const TAP_TIME = 500;         // ms; a press held longer is a long press, which asks about the row

// A purchase can be taken back from the tile's own tag for this long: a
// clean tap on the wrong tile is the one case the tap gate cannot catch.
export const UNDO_MS = 4000;
// ...but not in the first instant: a fast double tap is one purchase kept,
// not one bought and taken back.
export const UNDO_DEAD_MS = 250;

// The hop: an arrow at each edge of the window, in the mid sky, that glides
// the view to the next standing station that way. A share of the window's
// height, since a phone has no fixed one.
export const HOP_Y = 0.42;           // below the purse and the pin, above the call to build the bench and the counter
export const HOP_SIZE = 48;          // px, eight cells; a thumb's target
export const HOP_INSET = 6;          // px in from the edge

// The fullscreen button, top-right in the sky (fullscreen.js): the hop's
// square, the hop's inset, inside the safe area.
export const FS_SIZE = 44;
export const FS_INSET = 6;

// A board as a sheet from the bottom, on a phone only. Its top edge at this
// share of the window down, so the ground line and the station stay in the
// picture above it; dragged up past its seat it grows to `SHEET_TALL`, and
// dragged down past a third of its height it goes.
export const SHEET_H = 0.55;
export const SHEET_TALL = 0.9;
export const SHEET_DISMISS = 0.33;
export const SHEET_MS = 220;         // up and down; nought under motion: less
export const SHEET_HANDLE = [36, 4]; // the bar on its top edge, px
// The sheet's own scrollbar (board.js, the rail): a phone's overlay bar is
// invisible until the list moves, so one is drawn down the right edge
// whenever the rows overflow.
export const SHEET_RAIL_W = 6;       // px, a cell
export const SHEET_RAIL_INSET = 4;   // px in from the edge

