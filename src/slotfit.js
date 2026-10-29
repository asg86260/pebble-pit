// What a tile's words need (the owner, 2026-10-18; the slot itself was fitted
// to the open board until 2026-10-29, which moved every tile whenever a card's
// words changed). The slot is now one measured width a language
// (SHELF_SLOT_LANG, config/boards.js), and this file is the measure: the board
// check reads every board in every language against it, to the fraction of a
// pixel, so a name nobody has written yet, or a face a size up, goes red
// instead of being clipped.

// What on a tile cannot fold, and how many shares of a wider tile each one
// gets: a name and a gain take the whole of it, a strip half its share of
// the halves standing (they split the tile, flex 1 1 0).
export const UNFOLDING = '.what, .gain, .strip > i';

// How far `el`'s words run past its content box, in fractional pixels.
// Not scrollWidth against clientWidth: both are rounded to whole pixels, and
// a strip half 72.5 wide holding words 73.45 wide reads as 73 and 73, fits,
// and shows its ellipsis.
export function overOf(el) {
  const view = el.ownerDocument.defaultView;
  const cs = view.getComputedStyle(el);
  const box = el.getBoundingClientRect().width
    - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth);
  const words = el.ownerDocument.createRange();
  words.selectNodeContents(el);
  return words.getBoundingClientRect().width - box;
}
