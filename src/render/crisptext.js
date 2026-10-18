// Type in a palette's own steps: a line of text whose smoothed edges are
// tones the palette already has.
//
// The canvas smooths every glyph it draws, and on the deep's few tones that
// smoothing is a fringe of greys the deep's palette does not hold
// (docs/design-language/canvas.md, "The deep's palette"). Cut to whole ink
// or nothing, a small face loses its thin strokes and stops reading. So a
// label is set once onto a scrap of its own at the device pixels it will
// land on, and each pixel's coverage is read as the mix of the ink over the
// ground it stands on, then snapped to the nearest of the palette's steps --
// the ground's own step is left unpainted. The scrap is laid on whole device
// pixels with no smoothing. Kept by what it says, in what type, in what
// inks and at what scale.

import { CRISP_TEXT_KEEP } from '../config.js';
import { inkOf, inkMode } from '../ink.js';

const rgbOf = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

const made = new Map();
function scrapOf(text, font, ink, ground, steps, k) {
  const id = `${inkMode()}|${k}|${font}|${ink}|${ground}|${steps.join()}|${text}`;
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
  const on = rgbOf(ink), under = rgbOf(ground), tones = steps.map(rgbOf), drawn = steps.map(t => rgbOf(inkOf(t)));
  const nearest = mix => {
    let best = 0, bd = Infinity;
    tones.forEach((t, i) => {
      const e = (t[0] - mix[0]) ** 2 + (t[1] - mix[1]) ** 2 + (t[2] - mix[2]) ** 2;
      if (e < bd) { bd = e; best = i; }
    });
    return best;
  };
  const groundAt = nearest(under);
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255, at = nearest(under.map((v, j) => v + (on[j] - v) * a));
    if (at === groundAt) { d[i + 3] = 0; continue; }
    [d[i], d[i + 1], d[i + 2]] = drawn[at];
    d[i + 3] = 255;
  }
  g.putImageData(px, 0, 0);
  if (made.size >= CRISP_TEXT_KEEP) made.clear();
  s = { c, w: m.width };
  made.set(id, s);
  return s;
}

// `text` in `font` on `g`, at (x, y) in its current space: `align` 'left',
// 'center' or 'right' of x, and y the top of the line's ink. `ink` is the
// type's tone and `ground` the one it stands on, `steps` every tone the
// palette allows, all six-digit hex as they are to be seen. Returns the
// width it took.
export function crispText(g, text, x, y, font, ink, align, ground, steps) {
  if (!text) return 0;
  // A context that keeps no pixels (the node tier's sheets) is handed the
  // words as words.
  const m = g.getTransform?.();
  if (!m) { g.font = font; g.fillStyle = ink; g.textAlign = align; g.textBaseline = 'top'; g.fillText?.(text, x, y); return 0; }
  const k = m.a;
  const s = scrapOf(text, font, ink, ground, steps, k);
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
