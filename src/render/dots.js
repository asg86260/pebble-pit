// The page's dot ground, on the canvas: the cards drawn here (the counter,
// act 3's upgrades plate) stand on the same dots as the cards in the
// stylesheet (style.css, --dots). One pixel in a SHELF_DOT cell, SHELF_DOT_AT
// in from its corner, in the page's ink at SHELF_DOT_ALPHA: the constants the
// stylesheet's tile is held to (test/ui-tokens.test.mjs).
//
// The page's dots are SHELF_DOT CSS pixels apart whatever the yard's zoom, so
// the pattern is laid in device pixels, not in the space the card is drawn
// in: the box is mapped through the context's transform, its corner put on a
// whole device pixel, and the tile filled there unscaled. Scaled with the
// world instead, a dot at the yard's five-sixths falls across two pixels and
// comes out a gray smear.

import { SHELF_DOT, SHELF_DOT_AT, SHELF_DOT_ALPHA } from '../config.js';
import { ink, raw, onTheme } from '../ink.js';
import { S } from '../state.js';

// One pattern a device scale, drawn in the page's ink of the moment, so let
// go when the page turns.
const made = new Map();   // cache: device pixels a CSS pixel -> CanvasPattern
onTheme(() => made.clear());
function patternAt(g, k) {
  let p = made.get(k);
  if (p) return p;
  const c = document.createElement('canvas');
  c.width = c.height = SHELF_DOT * k;
  const t = c.getContext('2d');
  t.globalAlpha = SHELF_DOT_ALPHA;
  t.fillStyle = raw(ink);   // the page's ink as it is, as --dots writes it, past the layer's map
  t.fillRect(SHELF_DOT_AT * k, SHELF_DOT_AT * k, k, k);
  p = g.createPattern(c, 'repeat');
  made.set(k, p);
  return p;
}

// Dots over the box (x, y, w, h), in `g`'s current space, the first cell's
// corner at (x, y): a card passes the inside of its border, as the page's
// dots start at a box's padding edge, so a whole cell meets the edge. A card
// that moves carries its dots with it, a whole device pixel at a time.
export function fillDots(g, x, y, w, h) {
  // a context that keeps no pixels (the node tier's sheets) has no pattern
  if (typeof document === 'undefined' || !g.createPattern || !g.getTransform) return;
  // the canvas's own density, whole, so a dot is a whole number of pixels
  const k = Math.max(1, Math.round(S.dpr || 1));
  const m = g.getTransform();
  const x0 = Math.round(m.a * x + m.e), y0 = Math.round(m.d * y + m.f);
  const x1 = Math.round(m.a * (x + w) + m.e), y1 = Math.round(m.d * (y + h) + m.f);
  if (x1 <= x0 || y1 <= y0) return;
  const p = patternAt(g, k);
  p.setTransform(new DOMMatrix([1, 0, 0, 1, x0, y0]));
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.imageSmoothingEnabled = false;
  g.fillStyle = p;
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.restore();
}
