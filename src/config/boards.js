// The boards: the numbers behind what a row looks like and what the books
// measure. Added by Track F3 (wave5).

// --- the rungs under a row's name -------------------------------------------
// How far up a ladder you are is a row of pips under the words. They were set in
// the stylesheet at eight tenths of an em and half opacity, and at that weight
// they read as a dotted underline rather than as a count you could take at a
// glance -- which is the one job they have.
//
// Two numbers, and only two. The pips are drawn on nine boards and every one of
// them wants the same answer, so a per-board nudge would be the same bug fixed
// nine times. `board.js` writes both onto the root element as custom properties
// and the stylesheet reads them from there, so this stays the only place either
// is decided.
export const PIP_EM = 1;            // a pip, against the row's own type size
export const PIP_TONE = 0.78;       // and how dark it stands against the words

// How far the hover lifts the pips: not a third number, but the share of the
// way from their resting tone to full black. A tone found by hand for the
// resting state and a second one found by hand for the hover would part company
// the moment either was retuned.
export const PIP_HOVER_LIFT = 0.5;

// --- the books ---------------------------------------------------------------
// What the yard is actually earning, per currency, per second.
//
// Measured rather than predicted. Every rate the boards state elsewhere is a
// figure the game computes about itself -- what a plot *should* yield, what a
// bench *should* get through -- and the number a player wants is the one the
// yard really turned in, with the walks, the queues and the idle hands in it.
// So the books watch the counters and nothing else.
//
// A window rather than a smoothing: a rolling window says "this is what the
// last half minute paid", which is a fact with an end on it, where an eased
// average has a tail of unknown length and reads high for a while after the
// thing making it has stopped.
export const STATS_WINDOW_S = 30;    // how much of the recent past a rate is taken over
// How often a reading is taken. Every frame would be a sample per sixtieth for
// counters that move a handful of times a second -- a thousand-odd entries in
// the ring for no more truth than forty give.
export const STATS_SAMPLE_S = 0.5;
// A rate under this reads as nothing rather than as a trickle of hundredths: a
// core an hour is not a rate anybody acts on, and printing 0.00 in the column
// is the books saying they have a number when they have noise.
export const STATS_FLOOR = 0.005;

// Where you stand to read them: the mouth of the pit at its near lip, which is
// directly under the counter card. In cells, like everything else in the yard,
// and derived off the pit rather than written as a position, so the stand goes
// with the hole wherever the layout puts it.
export const BOOKS_STAND_W = 10;
export const BOOKS_STAND_H = 5;

// --- the clock ---------------------------------------------------------------
// Seconds are a clock face, never the letter s. On a board the clock is the
// `.clock` mark the bills already price time in (`MARK.time` in upgrades.js);
// on a card in the yard, which is one monospace text node and can hold no
// markup, it is this glyph -- the same idea drawn with the same means the card
// already uses for a shard and a spore.
export const CLOCK_GLYPH = '◴';

// --- a count on its way ------------------------------------------------------
// Every number read off the yard -- the counter card, a purse on a board, a
// roster under a station, a price on a row -- runs to its new value rather than
// jumping to it (`tween.js`). How long it takes grows with the size of the
// jump, between a floor short enough that a body arriving reads as one event
// and a ceiling short enough that a big purchase is over before you look away.
export const TWEEN_MIN_MS = 220;
export const TWEEN_MAX_MS = 900;
export const TWEEN_BASE_MS = 180;      // plus this much per unit of the jump...
export const TWEEN_PER_UNIT_MS = 1.6;  // ...until the ceiling

// --- the queue card ------------------------------------------------------------
// The pips on the card's front line, standing for the bar of the work being
// built: filled for the share done. Five reads at a glance; more reads as a
// dotted rule.
export const QUEUE_PIPS = 5;

// --- the shelf ---------------------------------------------------------------
// A board drawn as shelves: a section is a plank, an item is a pixel object
// with its name, its gain and one price tag under it (DESIGN.md, "The shelf").
// Every step is here and nowhere else, so a shelf on one board is the shelf on
// every board.
export const SHELF_SLOT = 140;      // px, one item's width; five to the bench's plank
export const SHELF_STEP = 5;        // px between the glyph, the name, the gain and the tag
export const SHELF_TOP = 8;         // px from the plank's sign down to the first glyph
export const SHELF_FOOT = 8;        // px from the tag down to the tile's own foot
export const SHELF_AIR = 6;         // px of air between a tile's foot and the plank
export const SHELF_SIGN = 6;        // px between a section's sign and the tiles under it
export const SHELF_GLYPH_CELL = 3;  // screen px a sprite cell: an eight-cell glyph is 24px
export const SHELF_GLYPH_CELLS = 8; // cells a glyph is square
export const SHELF_PLANK = 5;       // px, the plank's thickness
export const SHELF_DOT_INK = 0.14;  // the ground's dot, half the held sheet's .28
export const SHELF_HOVER_MS = 120;  // the plate and the lift easing in under the cursor
// What the stroke round a glyph is painted in: the deepest coin on the next
// rung's bill. Dust is nothing -- black on the ground is the default -- and a
// climbed ladder is grey. The three colors are the marks' own.
export const SHELF_INK = { spore: '#2e9e4b', shard: '#2f5fd0', spark: '#d93a25', done: '#8c8c8c' };
// Whether the boards are drawn as shelves at all. Every dev build, so the
// owner plays on them (their call, 2026-09-14); a release keeps the cards
// until the glyphs are drawn and the design is marked built. It was gated on
// `?shelf` for a day so the browser suite's eleven card checks -- heights,
// columns, the corner, the seating -- would read the cards; with the shelf
// on for dev those checks now read the shelf, and the ones that disagree
// are the shelf's to make true. `import.meta.env` is vite's and does not
// exist in the node yard, which has no boards to draw.
export const SHELF_BOARDS = !!(import.meta.env && import.meta.env.DEV);
