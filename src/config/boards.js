// The boards: the numbers behind what a row looks like and what the books
// measure.

// --- the rungs under a row's name -------------------------------------------
// How far up a ladder you are is a row of pips under the words. Two numbers,
// and only two: the pips are drawn on nine boards and every one wants the same
// answer. `board.js` writes both onto the root element as custom properties
// and the stylesheet reads them from there.
export const PIP_EM = 1;            // a pip, against the row's own type size
export const PIP_TONE = 0.78;       // and how dark it stands against the words

// How far the hover lifts the pips: the share of the way from their resting
// tone to full black, not a second hand-found tone that would part company
// with the first the moment either was retuned.
export const PIP_HOVER_LIFT = 0.5;

// --- the books ---------------------------------------------------------------
// What the yard is actually earning, per currency, per second: measured off the
// counters, with the walks, the queues and the idle hands in it, never
// predicted. A rolling window rather than an eased average, so the figure has
// an end on it and does not read high after the thing making it has stopped.
// The windows the books can be read over, in seconds, in the order the board's
// toggle steps through them. The income record keeps the longest.
export const STATS_OVER_S = [30, 60, 300, 600];
export const STATS_OVER_DEFAULT = 60;
// A rate's arrow: its window against the one before, as a share of the one
// before. Under the first is level; then one arrow, two, three.
export const STATS_TREND_STEPS = [0.05, 0.25, 1];
// The sky's arrow, in haze a minute, on the air filter's board and the books'.
export const AIR_TREND_STEPS = [1, 15, 60];
// Every frame would be a thousand-odd ring entries for no more truth than forty
// give.
export const STATS_SAMPLE_S = 0.5;
// A rate under this reads as nothing: printing 0.00 is the books saying they
// have a number when they have noise.
export const STATS_FLOOR = 0.005;

// Where you stand to read them: the near lip of the pit, directly under the
// counter card. In cells, derived off the pit, so the stand goes with the hole.
export const BOOKS_STAND_W = 10;
export const BOOKS_STAND_H = 5;

// --- the clock ---------------------------------------------------------------

// --- a count on its way ------------------------------------------------------
// Every number read off the yard runs to its new value rather than jumping to
// it (`tween.js`). The time grows with the size of the jump, between a floor
// short enough that a body arriving reads as one event and a ceiling short
// enough that a big purchase is over before you look away.
export const TWEEN_MIN_MS = 220;
export const TWEEN_MAX_MS = 900;
export const TWEEN_BASE_MS = 180;      // plus this much per unit of the jump...
export const TWEEN_PER_UNIT_MS = 1.6;  // ...until the ceiling

// --- the queue card ------------------------------------------------------------
// The pips on the card's front line, filled for the share of the work done.
// Five reads at a glance; more reads as a dotted rule.
export const QUEUE_PIPS = 5;

// --- the shelf ---------------------------------------------------------------
// A board drawn as shelves: a section is a plank, an item is a pixel object
// with its name, its gain and one price tag under it (DESIGN.md, "The shelf").
// Every step is here and nowhere else, so a shelf on one board is the shelf on
// every board.
export const SHELF_SLOT = 140;      // px, one item's width
export const SHELF_SLOTS = 5;       // slots a plank holds at most; a shorter plank is as wide as what is on it
export const SHELF_SLOTS_MIN = 2;   // and never narrower than this many, so a one-row board still reads as a board
export const SHELF_STEP = 5;        // px between the glyph, the name, the gain and the tag
export const SHELF_TOP = 8;         // px from the plank's sign down to the first glyph
export const SHELF_FOOT = 8;        // px from the tag down to the tile's own foot
export const SHELF_AIR = 6;         // px of air between a tile's foot and the plank
export const SHELF_SIGN = 6;        // px between a section's sign and the tiles under it
export const SHELF_GLYPH_CELL = 3;  // screen px a sprite cell: an eight-cell glyph is 24px
// The hand on a tile being built (DESIGN.md, "A hand on the tile"): the yard's
// builder drawn beside the glyph, in glyph cells -- the body's side (the yard's
// WORKER is three of its own cells) and the gap it stands off the glyph's ink.
// Its chips are the yard's own (GRIT_*), scaled cell to cell.
export const SHELF_HAND_CELLS = 3;
export const SHELF_HAND_GAP = 1;
// A hand arrives and leaves rather than popping: it fades in sliding from the
// left over this many frames, and out the same way, `SHELF_HAND_SLIDE` cells.
export const SHELF_HAND_FADE = 45;
export const SHELF_HAND_SLIDE = 4;
export const SHELF_GLYPH_CELLS = 8; // cells a glyph is square
export const SHELF_BADGE_HALO = 1;  // px of white round a badge's ink, cut out of the drawing under it
export const SHELF_BADGE_CELL = 2;  // screen px a badge cell: finer than the drawing's, for a mark a third its size
export const SHELF_BADGE_CELLS = 5; // cells a badge is square
export const SHELF_PLANK = 5;       // px, the plank's thickness
export const SHELF_DOT = 6;         // px between dots: the held sheet's tile, one dot in six
export const SHELF_HOVER_MS = 120;  // the plate and the lift easing in under the cursor
export const SHELF_FLOAT_MS = 2400; // one turn of a lifted tile's drift, a one-pixel circle in eight stops
export const SHELF_FLOAT_SPREAD = 0.35; // how far a tile's own rate strays from that, either way
export const SHELF_FOLLOW = 2;      // px a lifted tile leans toward the cursor at the tile's edge
// What the stroke round a glyph is painted in: the deepest coin on the next
// rung's bill. Dust is nothing -- black on the ground is the default -- and a
// climbed ladder is grey. The three colors are the marks' own.
export const SHELF_INK = { spore: '#2e9e4b', shard: '#2f5fd0', spark: '#d93a25', short: '#8c8c8c', ghost: '#8c8c8c' };  // ghost: the outline of the unbuilt part of a glyph
