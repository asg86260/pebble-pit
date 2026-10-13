// The fight's number font (config NUM_FONT) drawn: a sheet of every glyph in
// one face on its drop line, and a string written off it. Shared by the
// numbers off the coil (render/fightnums.js) and the level on the serpent's
// bar (render/serpentbar.js).

import { ctx } from './ctx.js';
import { darkPage, turned } from '../ink.js';
import { NUM_FONT } from '../config.js';

const CHARS = Object.keys(NUM_FONT);
export const GW = NUM_FONT['0'][0].length, GH = NUM_FONT['0'].length;

// How a number is said. The one place: shortening a big one ("+181k") drops
// in here once its glyphs are drawn into NUM_FONT (DESIGN.md, "Endless
// serpent", the owner's call 4, still being voted).
export const sayNum = n => String(n);

// What of `str` the font can draw: anything it has no glyph for is left out.
export const drawable = str => [...String(str)].filter(ch => ch in NUM_FONT).join('');

// On the dark page every color is mapped by its lightness (ink.js), and the
// deep there is drawn turned so the map brings it back: the numbers too.
const seen = c => darkPage ? turned(c) : c;

// A small sheet of every glyph in one face on its drop line, at `px` device
// pixels a font pixel: a number is a drawImage a glyph. One sheet a size and
// a face, kept until a font pixel is a different number of device pixels.
let sheets = new Map(), sheetsPx = 0;
export function sheetOf(px, face, drop) {
  if (sheetsPx !== px) { sheets = new Map(); sheetsPx = px; }
  const id = `${px}|${face}|${drop}`;
  let c = sheets.get(id);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = CHARS.length * GW * px;
  c.height = (GH + 1) * px;
  const g = c.getContext('2d');
  const paint = (ch, ox, oy, tone) => {
    g.fillStyle = tone;
    NUM_FONT[ch].forEach((row, r) => {
      for (let i = 0; i < GW; i++) if (row[i] === '#') g.fillRect(ox + i * px, oy + r * px, px, px);
    });
  };
  CHARS.forEach((ch, i) => {
    paint(ch, i * GW * px, px, seen(drop));   // the drop, a font pixel under
    paint(ch, i * GW * px, 0, seen(face));    // and the face over it
  });
  sheets.set(id, c);
  return c;
}
// `str` with its bottom-left at (left, bottom) in the transform's pixels;
// `bob(i)` lifts glyph i by whole font pixels.
export function write(sheet, str, px, left, bottom, bob) {
  const w1 = (GW + 1) * px, h = (GH + 1) * px;
  for (let i = 0; i < str.length; i++) {
    const at = CHARS.indexOf(str[i]) * GW * px;
    if (at < 0) continue;
    ctx.drawImage(sheet, at, 0, GW * px, h, left + i * w1, bottom - h - (bob ? bob(i) * px : 0), GW * px, h);
  }
}
export const widthOf = (str, px) => Math.max(0, str.length * (GW + 1) * px - px);
