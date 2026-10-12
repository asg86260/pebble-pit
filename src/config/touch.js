// --- a thumb on the glass ---------------------------------------------------------
// The game under a finger (DESIGN.md, "Playing it on a phone"). Nothing here
// is a feel: the coast of a fling is the platform's, so there is no friction
// and no stop speed. What is here is what a tap IS, one answer for the whole
// page (tap.js), and the shape of the three things a phone gets that a desk
// does not -- the hop and the sheet.

// A tap: a press that neither wanders nor lingers. Past the slop it is a
// drag, past the time it is a hold, and neither buys or opens anything.
export const TAP_SLOP = 14;          // pixels a tap may wander and still be a tap
export const TAP_TIME = 500;         // ms; a press held longer is a long press, which asks about the row

// A finger on dust sweeps and a finger on anything else scrolls, and the
// platform has to be told which at touchstart (input.js). A thumb's
// contact point is not where the player sees it land, so dust anywhere
// within this many screen pixels of the finger claims it for the sweep,
// whatever the sweep's own brush is at that zoom.
export const THUMB = 28;             // px; a fingertip's half-width

// The hop: an arrow at each edge of the window, in the mid sky, that glides
// the view to the next standing station that way. A share of the window's
// height, since a phone has no fixed one.
export const HOP_Y = 0.42;           // below the purse and the pin, above the call to build the bench and the counter
export const HOP_SIZE = 48;          // px, eight cells; a thumb's target

// The fullscreen button, top-right in the sky (fullscreen.js): the hop's
// square, the page's --edge in (style.css), inside the safe area.
export const FS_SIZE = 44;

// A board as a sheet from the bottom, on a phone only. Its top edge at this
// share of the window down, so the ground line and the station stay in the
// picture above it; `SHEET_TALL` is its stop for a long board.
export const SHEET_H = 0.55;
export const SHEET_TALL = 0.9;
// Let go, it goes to whichever stop -- gone, the seat or tall -- lies nearest
// to where it would coast, the way a phone's own sheets do: the finger's
// speed over its last few moves only (a drag that stopped before it lifted
// has no speed left), coasted out with UIKit's scroll decay, so a flick
// travels past the next stop and a placed sheet stays where it was placed.
export const SHEET_FLING_MS = 80;    // the finger's speed is read over this much of its end
export const SHEET_DECAY = 0.998;    // UIKit's normal deceleration rate, per ms
// Up past tall it follows the finger less and less, UIKit's rubber band:
// the share of the window's height it can never quite reach past tall.
export const SHEET_RUBBER = 0.55;
export const SHEET_MS = 500;         // the ease to a stop; nought under motion: less
export const SHEET_EASE = [0.32, 0.72, 0, 1];   // the settle's cubic-bezier, the platform's sheet curve
export const SHEET_HANDLE = [36, 4]; // the bar on its top edge, px
// The sheet's own scrollbar (board.js, the rail): a phone's overlay bar is
// invisible until the list moves, so one is drawn down the right edge
// whenever the rows overflow.
export const SHEET_RAIL_W = 6;       // px, a cell
export const SHEET_RAIL_INSET = 4;   // px in from the edge


// The yard at a phone's window. A phone stood upright is narrower than a
// shield is wide, so on a thumb the yard is drawn at the size that holds the
// widest shield's whole answer with this many cells of ground to spare, and
// no scene ever zooms (cutscene.js). Never larger than the desk's cell.
export const PHONE_MARGIN_CELLS = 10;
// The least a body is to be as a target on the glass: the cell is small
// enough on a phone that a three-cell body is not a thumb's.
export const TOUCH_TARGET = 44;      // px, the platform's own minimum
