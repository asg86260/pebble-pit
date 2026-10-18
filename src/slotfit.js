// A shelf's slot is as wide as its widest unbreakable words need (the owner,
// 2026-10-18): SHELF_SLOT is the least, and a board grows past it only when a
// tile on it has a word or a label that cannot fold -- a long name in the
// house tracking, the strip's two halves, an amount glued to its unit in the
// readable face. Measured, not guessed, so a name nobody has written yet, or
// a face a size up, widens the board instead of being clipped by it.

import { SHELF_SLOT } from './config.js';

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

// Written onto `host` (the sheet in the game, so its width rule reads it too;
// the rows on the card bench), and returned. Cleared first, so the measure is
// of the least slot and not of the last fit.
export function fitSlot(shelf, host = shelf) {
  host.style.removeProperty('--shelf-slot');
  if (typeof getComputedStyle !== 'function') return SHELF_SLOT;
  let over = 0;
  for (const tile of shelf.querySelectorAll(':scope > .tile')) {
    // A tile two slots wide grows by two slots' worth for every one.
    const span = +(/span (\d+)/.exec(getComputedStyle(tile).gridColumnStart)?.[1] || 1);
    for (const el of tile.querySelectorAll(UNFOLDING)) {
      if (!el.getClientRects().length) continue;            // hidden: nothing to fit
      const shares = el.matches('.strip > i')
        ? [...el.parentElement.children].filter(h => h.getClientRects().length).length : 1;
      over = Math.max(over, overOf(el) * shares / span);
    }
  }
  const slot = SHELF_SLOT + Math.ceil(over);
  if (slot > SHELF_SLOT) host.style.setProperty('--shelf-slot', `${slot}px`);
  return slot;
}
