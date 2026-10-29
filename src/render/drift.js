// A glyph's float, a leaf of its own: the roster's UPGRADES button drifts as
// the shop tile does, and must not pull the drawing layer (render/bars.js,
// and through it the board's DOM) into the landing page's imports.
import { P, BUILD_DRIFT, SHELF_FLOAT_MS, SHELF_FLOAT_SPREAD } from '../config.js';
import { now } from '../clock.js';

// The shop tile's drift (shelf.css, `shelf-sway-*`): each axis two sines
// summed, one on the glyph's own clock and one at an incommensurate multiple
// of it, so the path never repeats. Free of the lattice, as the tile's is --
// a glyph that steps a cell at a time reads as ticking, not floating; the
// painter still lays it on whole device pixels (`onPixel`). The rate, the
// direction and the phase are hashed off the site and the row, so a stack
// never breathes in unison.
export function drift(name) {
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rate = 1 + ((h % 1000) / 1000 * 2 - 1) * SHELF_FLOAT_SPREAD;
  const dir = (h >> 10) & 1 ? -1 : 1;
  const p = dir * now() / (SHELF_FLOAT_MS * rate) + ((h >> 11) % 1000) / 1000;
  const wave = k => Math.sin(Math.PI * 2 * p * k);
  return [BUILD_DRIFT * (wave(1) - wave(1 / 1.618)) / 2 * P,
          BUILD_DRIFT * (-wave(1) - wave(1 / 0.73)) / 2 * P];
}
