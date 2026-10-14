// Fading by tone, not by alpha (docs/design-language/canvas.md). A thing on
// its way in or out is painted in a paler rung of its own ramp, in held
// steps, rather than thinned with globalAlpha: alpha over a page makes tones
// that are in no palette (a lavender ring, a grey-blue heap), and a ramp
// step is a color the game already has. globalAlpha stays for the press and
// for a veil over the whole frame.
//
// `toned(c, k)` is a color `k` of the way there (1 whole, 0 gone): mixed
// toward the paper as written, then snapped to the nearest rung of the ramp
// it belongs to with the paper and the ink on its ends -- the grey ramp, the
// purple, a coin's, or the deep's two as drawn (the deep is painted as a
// negative, so its dark is the written white too). A color in no ramp keeps
// the mix, in the same held steps. `toned(c, k, true)` goes toward the ink
// instead, for a thing fading on a black ground (the rift's hole).

import { ABYSS_TONES, COIN_TONES, FADE_STEPS, GREY, PURPLE } from '../config.js';
import { GREYS as DEEP_GREYS, PURPLES as DEEP_PURPLES } from './deeptones.js';
import { darkPage, raw } from '../ink.js';

const PAPER = [255, 255, 255], INK = [0, 0, 0];
const rgbOf = c => {
  if (typeof c !== 'string') return null;
  if (c[0] === '#') {
    if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    if (c.length !== 7) return null;
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(c);
  return m ? [+m[1], +m[2], +m[3]] : null;
};
const luma = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const hexOf = ([r, g, b]) => '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

// Every ramp, each with the paper on its light end and the ink on its dark
// one, and which ramp each of their rungs belongs to.
const ramp = list => {
  const r = list.map(rgbOf);
  if (!r.some(c => luma(c) > 250)) r.push(PAPER);
  if (!r.some(c => luma(c) < 5)) r.unshift(INK);
  return r;
};
const RAMPS = { grey: ramp(GREY), purple: ramp(PURPLE), abyss: ramp(ABYSS_TONES), deepGrey: ramp(DEEP_GREYS), deepPurple: ramp(DEEP_PURPLES),
                ...Object.fromEntries(Object.entries(COIN_TONES).map(([k, v]) => [k, ramp(v)])) };
const MEMBER = new Map();
for (const [name, r] of Object.entries(RAMPS)) for (const c of r) if (!MEMBER.has(hexOf(c))) MEMBER.set(hexOf(c), name);

// A color in no ramp is placed by its look: a grey is the grey ramp's, a
// purple the purple's, anything else keeps its own mix.
function rampFor(rgb) {
  const named = MEMBER.get(hexOf(rgb));
  if (named) return RAMPS[named];
  const [r, g, b] = rgb, hi = Math.max(r, g, b), lo = Math.min(r, g, b);
  if (hi - lo < 16) return RAMPS.grey;
  if (b >= r && r > g + 24 && b > g + 40) return RAMPS.purple;
  return null;
}

// Mild per-cell variation for a large mass of one material (C21): whether the
// cell at (c, r) is one of the one-in-`every` dealt a neighboring tone. A
// stable hash of the cell, so a mass reads as material and never strobes.
// A mixing hash, not a product, or the one-in-n cells line up in diagonals.
export const dealt = (c, r, every) => {
  let h = (Math.imul(c, 374761393) + Math.imul(r, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) % every === 0;
};

// held(k): the share left, on FADE_STEPS steps, never rounded up to whole
// once it has begun to go nor down to nothing while any is left.
export const held = k => k >= 1 ? 1 : k <= 0 ? 0 : Math.max(1, Math.ceil(k * FADE_STEPS)) / FADE_STEPS;

const cache = new Map();
export function toned(c, k, onInk = false) {
  const q = held(k);
  if (q >= 1) return c;
  if (q <= 0) return onInk ? '#000000' : '#ffffff';
  const key = c + '|' + q + (onInk ? '|i' : '');
  let out = cache.get(key);
  if (out !== undefined) return out;
  const rgb = rgbOf(c);
  if (!rgb) { cache.set(key, c); return c; }
  const to = onInk ? INK : PAPER;
  const want = rgb.map((v, i) => v + (to[i] - v) * (1 - q));
  const r = rampFor(rgb);
  if (r) {
    const at = luma(want);
    let best = r[0];
    for (const t of r) if (Math.abs(luma(t) - at) < Math.abs(luma(best) - at)) best = t;
    out = hexOf(best);
  } else out = hexOf(want.map(Math.round));
  cache.set(key, out);
  return out;
}

// `fn` drawn on `g` `k` of the way there: every fill and stroke it sets is
// toned on the way in. Set on the context in hand, not its prototype, so it
// costs nothing outside a fade, and the dark page's own map (ink.js, on the
// prototype) still sees the toned color after it. Nested fades multiply. An
// image laid with drawImage is not a fill and is not toned: a cached picture
// takes its tone where it is painted (cellimage.js, `begin`).
export function withTone(g, k, fn) {
  if (k >= 1) return fn();
  const end = toneOn(g, k);
  if (!end) return;
  try { return fn(); } finally { end(); }
}

// The same as a pair, for a stretch of drawing too long to hand over as a
// function: `toneOn` starts it and hands back what ends it, or null when
// there is nothing left to draw.
let inTone = 1;
const NO_END = () => {};
export function toneOn(g, k) {
  if (k >= 1) return NO_END;
  const outer = inTone, total = outer * Math.max(0, k);
  if (held(total) <= 0) return null;
  const own = Object.prototype.hasOwnProperty.call(g, 'fillStyle');
  const wasFill = g.fillStyle, wasStroke = g.strokeStyle;
  if (!own) {
    const proto = Object.getPrototypeOf(g);
    const fill = Object.getOwnPropertyDescriptor(proto, 'fillStyle');
    const stroke = Object.getOwnPropertyDescriptor(proto, 'strokeStyle');
    // Remembered as written, so a nested fade tones from the color itself.
    // What was in hand before the fade is read back already in the page's
    // colors, so on the dark page it is not toned again (a fill is set inside
    // the fade it is drawn in).
    let fillAs = darkPage ? null : wasFill, strokeAs = darkPage ? null : wasStroke;
    Object.defineProperty(g, 'fillStyle', { configurable: true, get: fill.get,
      set(v) { fillAs = v; fill.set.call(this, typeof v === 'string' ? toned(v, inTone) : v); } });
    Object.defineProperty(g, 'strokeStyle', { configurable: true, get: stroke.get,
      set(v) { strokeAs = v; stroke.set.call(this, typeof v === 'string' ? toned(v, inTone) : v); } });
    g.__toneAgain = () => { if (fillAs) g.fillStyle = fillAs; if (strokeAs) g.strokeStyle = strokeAs; };
  }
  inTone = total;
  g.__toneAgain();
  return () => {
    inTone = outer;
    if (!own) {
      delete g.fillStyle; delete g.strokeStyle; delete g.__toneAgain;
      g.fillStyle = typeof wasFill === 'string' ? raw(wasFill) : wasFill;
      g.strokeStyle = typeof wasStroke === 'string' ? raw(wasStroke) : wasStroke;
    } else g.__toneAgain();
  };
}
