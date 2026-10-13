// The fight's number font (config NUM_FONT) drawn: a sheet of every glyph in
// one face on its drop line, and a string written off it. Shared by the
// numbers off the coil (render/fightnums.js) and the level on the serpent's
// bar (render/serpentbar.js).

import { S } from '../state.js';
import { ctx } from './ctx.js';
import { darkPage, turned } from '../ink.js';
import { NUM_FONT, NUM_FONT_TIGHT } from '../config.js';
import { fmt } from '../words.js';

const CHARS = Object.keys(NUM_FONT);
export const GH = NUM_FONT['0'].length;
// Each glyph's width and where it starts on a sheet, in font pixels: worked
// out once, so a number written a frame reads two lookups a glyph.
const GLYPH_W = {}, GLYPH_AT = {};
let sheetW = 0;
for (const ch of CHARS) { GLYPH_W[ch] = NUM_FONT[ch][0].length; GLYPH_AT[ch] = sheetW; sheetW += GLYPH_W[ch]; }
// The gap before glyph `i` of `str`, in font pixels.
const gapBefore = (str, i) => (i > 0 && !NUM_FONT_TIGHT.includes(str[i]) ? 1 : 0);

// How a number is said: the yard's own short scale (`fmt`, words.js: 875,
// 1.2k, 18.4k, 181k, 21.6m), so the deep and the HUD read a number alike.
// When `fmt` takes the language's decimal mark (DESIGN.md, localization phase
// two), NUM_FONT wants a comma drawn, or `drawable` drops it.
export const sayNum = n => fmt(n);

// What of `str` the font can draw: anything it has no glyph for is left out.
export const drawable = str => [...String(str)].filter(ch => ch in NUM_FONT).join('');

// On the dark page every color is mapped by its lightness (ink.js), and the
// deep there is drawn turned so the map brings it back: the numbers too.
const seen = c => darkPage ? turned(c) : c;

// A small sheet of every glyph in one face on its drop line, at `px` device
// pixels a font pixel: a number is a drawImage a glyph. One sheet a size and
// a face, kept until the device pixels a screen pixel change. A frame draws
// at more than one size -- a big blow's number beside the small ones -- so
// they are let go on the pixel ratio, never on the size: a canvas made
// afresh a frame is a pause for the collector every few seconds.
let sheets = new Map(), sheetsDpr = 0;
export let sheetsMade = 0;                // test/deep-alloc.test.mjs
export function sheetOf(px, face, drop) {
  if (sheetsDpr !== S.dpr) { sheets = new Map(); sheetsDpr = S.dpr; }
  const id = `${px}|${face}|${drop}`;
  let c = sheets.get(id);
  if (c) return c;
  c = document.createElement('canvas');
  sheetsMade++;
  c.width = sheetW * px;
  c.height = (GH + 1) * px;
  const g = c.getContext('2d');
  const paint = (ch, ox, oy, tone) => {
    g.fillStyle = tone;
    NUM_FONT[ch].forEach((row, r) => {
      for (let i = 0; i < row.length; i++) if (row[i] === '#') g.fillRect(ox + i * px, oy + r * px, px, px);
    });
  };
  for (const ch of CHARS) {
    paint(ch, GLYPH_AT[ch] * px, px, seen(drop));   // the drop, a font pixel under
    paint(ch, GLYPH_AT[ch] * px, 0, seen(face));    // and the face over it
  }
  sheets.set(id, c);
  return c;
}
// `str` with its bottom-left at (left, bottom) in the transform's pixels;
// `bob(i)` lifts glyph i by whole font pixels. A character the font has no
// glyph for takes no room.
export function write(sheet, str, px, left, bottom, bob) {
  const h = (GH + 1) * px;
  let x = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i], w = GLYPH_W[ch];
    if (!w) continue;
    x += gapBefore(str, i);
    ctx.drawImage(sheet, GLYPH_AT[ch] * px, 0, w * px, h, left + x * px, bottom - h - (bob ? bob(i) * px : 0), w * px, h);
    x += w;
  }
}
export function widthOf(str, px) {
  let x = 0;
  for (let i = 0; i < str.length; i++) if (GLYPH_W[str[i]]) x += gapBefore(str, i) + GLYPH_W[str[i]];
  return x * px;
}
