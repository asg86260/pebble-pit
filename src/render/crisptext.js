// Type on the pixel grid: a line of text with no smoothing at its edges.
//
// The canvas smooths every glyph it draws, and on the deep's few tones that
// smoothing is a fringe of greys the deep's palette does not hold
// (docs/design-language/canvas.md, "The deep's palette"). So a label there
// is set once onto a scrap of its own at the device pixels it will land on,
// every pixel of it then made whole ink or nothing at half coverage, and the
// scrap laid on whole device pixels with no smoothing. Kept by what it says,
// in what type, in what ink and at what scale.

import { CRISP_TEXT_KEEP } from '../config.js';
import { inkOf } from '../ink.js';

const made = new Map();
function scrapOf(text, font, ink, k) {
  const id = `${k}|${font}|${ink}|${text}`;
  let s = made.get(id);
  if (s) return s;
  const c = document.createElement('canvas'), g = c.getContext('2d');
  g.font = font;
  const m = g.measureText(text);
  const up = Math.ceil(m.actualBoundingBoxAscent ?? 0), down = Math.ceil(m.actualBoundingBoxDescent ?? 0);
  c.width = Math.max(1, Math.ceil(m.width * k) + 2);
  c.height = Math.max(1, Math.ceil((up + down) * k) + 2);
  g.scale(k, k);
  g.font = font;
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#000';
  g.fillText(text, 1 / k, up + 1 / k);
  const px = g.getImageData(0, 0, c.width, c.height), d = px.data;
  const n = parseInt(inkOf(ink).slice(1), 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
  for (let i = 0; i < d.length; i += 4) {
    const on = d[i + 3] >= 128;
    d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = on ? 255 : 0;
  }
  g.putImageData(px, 0, 0);
  if (made.size >= CRISP_TEXT_KEEP) made.clear();
  s = { c, w: m.width, up, down };
  made.set(id, s);
  return s;
}

// `text` in `font` and `ink` (a six-digit hex, as it is to be drawn) on `g`,
// at (x, y) in its current space: `align` 'left', 'center' or 'right' of x,
// and y the top of the line's ink. Returns the width it took.
export function crispText(g, text, x, y, font, ink, align = 'left') {
  if (!text) return 0;
  // A context that keeps no pixels (the node tier's sheets) is handed the
  // words as words.
  const m = g.getTransform?.();
  if (!m) { g.font = font; g.fillStyle = ink; g.textAlign = align; g.textBaseline = 'top'; g.fillText?.(text, x, y); return 0; }
  const k = m.a;
  const s = scrapOf(text, font, ink, k);
  const left = align === 'center' ? x - s.w / 2 : align === 'right' ? x - s.w : x;
  // its top-left on a whole device pixel, so no pixel of it is resampled
  const dx = Math.round(left * k + m.e) - 1, dy = Math.round(y * k + m.f) - 1;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.imageSmoothingEnabled = false;
  g.drawImage(s.c, dx, dy);
  g.restore();
  return s.w;
}
