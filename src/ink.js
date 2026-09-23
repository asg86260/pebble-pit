// The palette (DESIGN.md, "Dark mode"). The renderers write black and white
// by name in some three hundred places, and the boards' stylesheet in as
// many; this is the one place that decides what black and white *are*.
//
// A color is mapped by its lightness alone: black to the ink, white to the
// paper, a gray to the same step between them, and a colored mark keeps its
// hue and its saturation and takes the lightness a gray of its weight would
// -- so the quarry's blue is still blue on the dark page, and the sparks are
// still red, where an inversion turned them salmon. On the light page the
// paper is white and the ink black, and the map is the identity, so it is
// not installed at all.
//
// It is installed on the canvas context's prototype rather than threaded
// through every draw: every context on the page -- the yard's, the painters'
// scratch canvases, the press's pattern -- goes through the one setter, and
// a fill nobody has written yet is covered the day it is written. The page
// is inked at boot and reinked by a reload (settings.js, `dark`): a sprite
// cached on a scratch canvas was drawn in the palette of the moment, and
// the palette cannot be changed under it.

import { LIGHT_PAPER, LIGHT_INK, DARK_PAPER, DARK_INK } from './config.js';
import { dark } from './prefs.js';

const on = dark();
export const darkPage = on;
export const paper = on ? DARK_PAPER : LIGHT_PAPER;
export const ink = on ? DARK_INK : LIGHT_INK;

// A color that must reach the canvas as written: for a `difference` fill,
// where the mapped ink would be the wrong answer (buildsites.js, drawGrit).
export const raw = c => new String(c);

const hex = h => {
  if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  const n = parseInt(h.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const [pr, pg, pb] = hex(paper), [ir, ig, ib] = hex(ink);
const lp = (pr + pg + pb) / 765, li = (ir + ig + ib) / 765;

// HSL both ways, as the map keeps hue and saturation and moves lightness.
function toHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function fromHsl(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
}

// A color with its lightness turned over and its hue kept. Written on the
// dark page, the map turns the lightness back, so it is seen as the light
// page would show it turned over: the deep is drawn this way there
// (render/deep.js), a dark field on either page with its purples still purple.
export function turned(c) {
  const [h, s, l] = toHsl(...hex(c));
  const [r, g, b] = fromHsl(h, s, 1 - l);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// A gray keeps its step: pure black lands on the ink, pure white on the
// paper, and the rest in between in the same order.
const mapRgb = (r, g, b) => {
  const [h, s, l] = toHsl(r, g, b);
  return fromHsl(h, s, lp + (li - lp) * (1 - l));
};

const NAMED = { black: [0, 0, 0], white: [255, 255, 255] };
const RGB = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/;
const cache = new Map();

// The color the page draws for a color the code wrote. Anything it cannot
// read -- a gradient, a pattern, a name it does not know -- goes through as
// it is.
export function inkOf(c) {
  if (!on || typeof c !== 'string') return c;
  let out = cache.get(c);
  if (out !== undefined) return out;
  out = c;
  let rgb = null, a = null;
  if (c[0] === '#' && (c.length === 4 || c.length === 7)) rgb = hex(c);
  else if (NAMED[c]) rgb = NAMED[c];
  else {
    const m = RGB.exec(c);
    if (m) { rgb = [+m[1], +m[2], +m[3]]; a = m[4]; }
  }
  if (rgb) {
    const [r, g, b] = mapRgb(...rgb);
    out = a != null ? `rgba(${r},${g},${b},${a})` : '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  cache.set(c, out);
  return out;
}

// The color a `difference` fill wants, to come out as the ink over the paper
// and as the paper over the ink: their sum, which on the light page is white.
export const xorInk = raw('#' + [pr + ir, pg + ig, pb + ib].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join(''));

// The setters, on the prototype, so every context is covered. Only on the
// dark page: on the light one the map is the identity and costs a lookup a
// fill for nothing.
function hook(proto, key) {
  const d = Object.getOwnPropertyDescriptor(proto, key);
  if (!d) return;
  Object.defineProperty(proto, key, {
    configurable: true,
    get: d.get,
    set(v) { d.set.call(this, v instanceof String ? v.valueOf() : inkOf(v)); },
  });
}
if (on && typeof CanvasRenderingContext2D !== 'undefined') {
  for (const proto of [CanvasRenderingContext2D.prototype,
                       typeof OffscreenCanvasRenderingContext2D !== 'undefined' ? OffscreenCanvasRenderingContext2D.prototype : null]) {
    if (!proto) continue;
    hook(proto, 'fillStyle');
    hook(proto, 'strokeStyle');
  }
  const stop = CanvasGradient.prototype.addColorStop;
  CanvasGradient.prototype.addColorStop = function (o, c) { return stop.call(this, o, inkOf(c)); };
}
