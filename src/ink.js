// The palette (DESIGN.md, "Dark mode: the page turned over"). The renderers
// write black and white by name in some three hundred places, and the boards'
// stylesheet in as many; this is the one place that decides what black and
// white *are*.
//
// On the light page the paper is white and the ink black, and the map is the
// identity, so it is not installed at all. The dim page (prefs.js, `theme`)
// is one map, light gray on charcoal turned by lightness, everywhere, and the
// tags below are that map too. The dark page is the same turn on near-black
// (the owner, 2026-10-19: white where the game was black), and render.js says
// which map a layer is drawn in (`inkMode`):
//
// - 'yard' and 'line', the default and the layers that are read (render.js,
//   READING): white to the near-black paper, black to the light ink, a gray
//   landing on the same step between them, hue kept.
// - 'deep', for the deep's whole half: the same turn between dim's charcoal
//   and light gray. The deep was drawn for that, as a dark field on either
//   page, and it is left as it was.
// - 'after', for act 3's layers (render.js, AFTER): the act is drawn in four
//   tones and no others (config, AFTER_TONES), and the yard's map would put
//   all four inside the paper's quarter of the range, a murk at 1x. Here
//   they are the light page's order turned (AFTER_DARK, `afterSpread`): the
//   paper a near-black, pale and mid a step above it each, the ink lightest,
//   and God's raw white over them all.
//
// Two tags decide a color at the call, past the map, as `raw` does:
// `light(c)` for a thing that shines (a lit window, the portal, a fire),
// which keeps its color with white lifted only to the light ink; and
// `line(c)`, a word or a stroke on bare paper in a layer that is not one of
// the reading ones. Both are the identity on the light page.
//
// It is installed on the canvas context's prototype rather than threaded
// through every draw: every context on the page -- the yard's, the painters'
// scratch canvases, the press's pattern -- goes through the one setter, and
// a fill nobody has written yet is covered the day it is written.
//
// The page turns in place (`setTheme`, under the settings' veil). A sprite
// cached on a scratch canvas was drawn in the palette of the moment, so
// every holder of a drawn or mapped color says so once, with `onTheme` (or
// `themed` for a Map), and is dropped when the palette changes; the next
// frame draws it again in the new one. The holders are listed in
// docs/reviews/2026-10-21-theme-in-place/README.md.

import { LIGHT_PAPER, LIGHT_INK, DARK_PAPER, DARK_INK, DEEP_PAPER, DEEP_INK, GREY, AFTER_TONES, AFTER_DARK } from './config.js';
import { theme } from './prefs.js';

// The page in force, and what follows from it. Live bindings: a module that
// reads `darkPage` at a draw reads the page of the moment.
let look = 'light', on = false, dim = false;   // page: the page's look, set by setTheme
export let darkPage = false;
export let paper = LIGHT_PAPER;
export let ink = LIGHT_INK;

// A color that must reach the canvas as written: for a `difference` fill,
// where the mapped ink would be the wrong answer (buildsites.js, drawGrit).
export const raw = c => new String(c);

const hex = h => {
  if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  const n = parseInt(h.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lightOf = h => { const [r, g, b] = hex(h); return (r + g + b) / 765; };
const toHex = ([r, g, b]) => '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

// HSL both ways, as every map keeps hue and saturation and moves lightness.
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

// The ends of each map: where white lands and where black lands.
const DEEP_ENDS = [lightOf(DEEP_PAPER), lightOf(DEEP_INK)];
const endsOf = d => (d ? { yard: DEEP_ENDS, line: DEEP_ENDS, deep: DEEP_ENDS, after: DEEP_ENDS } : {
  yard: [lightOf(DARK_PAPER), lightOf(DARK_INK)],
  after: [lightOf(AFTER_DARK.paper), lightOf(AFTER_DARK.ink)],
  line: [lightOf(DARK_PAPER), lightOf(DARK_INK)],
  deep: DEEP_ENDS,
});
let ENDS = endsOf(false);   // page: the look's ends, set by setTheme
// How far a color has to be from gray for act 3 to keep it as written:
// the spread of its channels, faded in between the two so no hue jumps.
const DULL = 0.22, KEPT = 0.42;

// Act 3's dark spread: where each of its four tones lands, as lightness
// (AFTER_DARK). The light page's order turned: the paper darkest, then pale,
// mid and the ink, each a clear step above the last, all well under God's
// raw white, which stays the brightest thing in the act.
export const afterSpread = () => Object.fromEntries(Object.entries(AFTER_DARK).map(([k, c]) => [k, lightOf(c)]));
// The map as knots, written lightness to drawn lightness, from the darkest:
// a tone between two of the four lands between theirs.
const AFTER_KNOTS = (() => {
  const to = afterSpread();
  return Object.entries(AFTER_TONES).map(([k, i]) => [lightOf(GREY[i]), to[k]]).sort((a, b) => a[0] - b[0]);
})();
function afterLight(l) {
  for (let i = 1; i < AFTER_KNOTS.length; i++) {
    const [l0, t0] = AFTER_KNOTS[i - 1], [l1, t1] = AFTER_KNOTS[i];
    if (l <= l1) return t0 + (t1 - t0) * (l - l0) / (l1 - l0);
  }
  return AFTER_KNOTS[AFTER_KNOTS.length - 1][1];
}

let mode = 'yard';  // cache: the layer being drawn, set by render.js each frame and put back to 'yard'
// Which map the next fills go through (render.js, a layer at a time).
export function inkMode(m) { if (m) mode = m; return mode; }
// Whether black is being drawn light: the turned maps, where a `darken`
// becomes a `lighten` and the deep skips its negative.
export const turnedOver = () => on && (dim || mode !== 'after');

function mapRgb(r, g, b, m) {
  const [h, s, l] = toHsl(r, g, b);
  const [lw, lb] = ENDS[m];
  const to = m === 'after' && !dim ? afterLight(l) : lb + (lw - lb) * l;
  if (m !== 'after' || dim) return fromHsl(h, s, to);
  const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  const k = Math.min(1, Math.max(0, (chroma - DULL) / (KEPT - DULL)));
  return fromHsl(h, s, to + (l - to) * k);
}

// A color with its lightness turned over and its hue kept. Drawn in the
// deep's map, which turns the lightness back, it is seen as the light page
// would show it turned over (render/deep.js).
export function turned(c) {
  const [h, s, l] = toHsl(...hex(c));
  return toHex(fromHsl(h, s, 1 - l));
}

// A color written so the deep's map lands it on `c` itself, steps and all. A
// tone darker than the deep's paper cannot be reached and lands on the paper.
export function landed(c) {
  const [h, s, l] = toHsl(...hex(c));
  const [lp, li] = ENDS.deep;
  return toHex(fromHsl(h, s, Math.min(1, Math.max(0, 1 - (l - lp) / (li - lp)))));
}

// A color as written, squeezed into what the map in force can show: white to
// its lightest, black to its darkest. What the deep's marks and the number
// font want, a count reading the same way round on either page.
export function seen(c) {
  if (!on) return c;
  const [h, s, l] = toHsl(...hex(c));
  const [lw, lb] = ENDS[mode];
  const lo = Math.min(lw, lb), hi = mode === 'after' && !dim ? lightOf(DARK_INK) : Math.max(lw, lb);
  return raw(toHex(fromHsl(h, s, lo + (hi - lo) * l)));
}

// A thing that shines. On a turned page it turns with everything else, so a
// lit window keeps its place against its wall; in act 3's spread it keeps its
// color as written, white lifted only to the light ink.
export function light(c) {
  if (!on) return c;
  if (dim || mode !== 'after') return raw(inkOf(c));
  const [h, s, l] = toHsl(...hex(c));
  return raw(toHex(fromHsl(h, s, l * lightOf(DARK_INK))));
}

// A word or a stroke on bare paper: black to the light ink.
export function line(c) {
  if (!on) return c;
  return raw(toHex(mapRgb(...hex(c), 'line')));
}

const NAMED = { black: [0, 0, 0], white: [255, 255, 255] };
const RGB = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/;
const caches = { yard: new Map(), line: new Map(), deep: new Map(), after: new Map() };

// The color the page draws for a color the code wrote, in the map in force.
// Anything it cannot read -- a gradient, a pattern, a name it does not know --
// goes through as it is.
export function inkOf(c, m = mode) {
  if (!on || typeof c !== 'string') return c;
  const cache = caches[m];
  let out = cache.get(c);
  if (out !== undefined) return out;
  out = c;
  let rgb = null, a = null;
  if (c[0] === '#' && (c.length === 4 || c.length === 7)) rgb = hex(c);
  else if (NAMED[c]) rgb = NAMED[c];
  else {
    const m2 = RGB.exec(c);
    if (m2) { rgb = [+m2[1], +m2[2], +m2[3]]; a = m2[4]; }
  }
  if (rgb) {
    const [r, g, b] = mapRgb(...rgb, m);
    out = a != null ? `rgba(${r},${g},${b},${a})` : toHex([r, g, b]);
  }
  cache.set(c, out);
  return out;
}

// The color a `difference` fill wants in a turned map, to come out as the ink
// over the paper and as the paper over the ink: their sum. In act 3's map,
// as on the light page, the fill is white.
const sum = (p, i) => { const [a, b, c] = hex(p), [d, e, f] = hex(i);
  return raw('#' + [a + d, b + e, c + f].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('')); };
const xorOf = d => (d ? { yard: sum(DEEP_PAPER, DEEP_INK), line: sum(DEEP_PAPER, DEEP_INK), deep: sum(DEEP_PAPER, DEEP_INK), after: sum(DEEP_PAPER, DEEP_INK) }
  : { yard: sum(DARK_PAPER, DARK_INK), line: sum(DARK_PAPER, DARK_INK), deep: sum(DEEP_PAPER, DEEP_INK), after: raw('#ffffff') });
let XOR = xorOf(false);   // page: the look's difference inks, set by setTheme
export const xorInk = () => (on ? XOR[mode] : raw('#ffffff'));

// The setters, on the prototype, so every context is covered. Only on a
// dark page: on the light one the map is the identity and costs a lookup a
// fill for nothing, so turning back to it puts the plain setters back.
const PROTOS = () => [typeof CanvasRenderingContext2D !== 'undefined' ? CanvasRenderingContext2D.prototype : null,
                      typeof OffscreenCanvasRenderingContext2D !== 'undefined' ? OffscreenCanvasRenderingContext2D.prototype : null]
  .filter(Boolean);
let plain = null;   // page: the setters as the browser made them, while ours stand in
function hookAll(want) {
  if (want === !!plain || typeof CanvasRenderingContext2D === 'undefined') return;
  if (!want) {
    for (const [proto, key, d] of plain) Object.defineProperty(proto, key, d);
    plain = null;
    return;
  }
  plain = [];
  for (const proto of PROTOS()) for (const key of ['fillStyle', 'strokeStyle']) {
    const d = Object.getOwnPropertyDescriptor(proto, key);
    if (!d) continue;
    plain.push([proto, key, d]);
    Object.defineProperty(proto, key, {
      configurable: true,
      get: d.get,
      set(v) { d.set.call(this, v instanceof String ? v.valueOf() : inkOf(v)); },
    });
  }
  const stop = CanvasGradient.prototype.addColorStop;
  plain.push([CanvasGradient.prototype, 'addColorStop', Object.getOwnPropertyDescriptor(CanvasGradient.prototype, 'addColorStop')]);
  CanvasGradient.prototype.addColorStop = function (o, c) { return stop.call(this, o, inkOf(c)); };
}

// Everything that holds a color drawn or mapped in the palette of the
// moment, as a way to let it go: a sprite set back to null, a table
// cleared. Called after the palette has changed, so a holder that keeps a
// value rather than dropping it can compute the new one at once.
const holders = new Set();
export function onTheme(drop) { holders.add(drop); return drop; }
// A Map of drawn or mapped colors, emptied when the page turns.
export function themed(m) { onTheme(() => m.clear()); return m; }
// Tones worked out from the page: `fill` run now and again at every turn.
// A table filled where it stands keeps its identity, so a module that holds
// the array itself, or names it as a default, needs nothing of its own.
export function perPage(fill) { fill(look); return onTheme(fill); }

// Which turn of the page this is, for a cache that would rather compare a
// number than be told.
export let themeGen = 0;

// The page turned to `to` ('light', 'dim' or 'dark'), in place: the map, its
// ends and its tables, the setters, the stylesheet's two root classes
// (play.html's head sets the same at boot), and then every holder let go.
// The yard itself is not touched; the next frame draws it in the new page.
export function setTheme(to) {
  look = to;
  on = look !== 'light'; dim = look === 'dim';
  darkPage = on;
  paper = dim ? DEEP_PAPER : on ? DARK_PAPER : LIGHT_PAPER;
  ink = dim ? DEEP_INK : on ? DARK_INK : LIGHT_INK;
  ENDS = endsOf(dim);
  XOR = xorOf(dim);
  for (const c of Object.values(caches)) c.clear();
  hookAll(on);
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', on);
    document.documentElement.classList.toggle('dim', dim);
  }
  themeGen++;
  // in the yard's map, as at load, where every holder first worked out its tones
  const was = mode;
  mode = 'yard';
  try { for (const drop of holders) drop(look); } finally { mode = was; }
}
export const themeNow = () => look;
setTheme(theme());
