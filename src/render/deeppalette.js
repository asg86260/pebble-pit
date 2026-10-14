// COMPARISON ONLY (branch mock/deep-palette-ingame): the deep's palette under
// the three options of docs/audit/visual-2026-10-14/ item C20, put into the
// real game so they can be shot side by side
// (docs/mocks/deep-palette-ingame-2026-10-14.html). Not for landing.
//
// The option is read once at boot from the address (`play.html?deep=A`);
// `window.__deepPalette('A')` reloads the page with it, because every
// station, dome and creature is a sprite cached in the palette of the
// moment. 'today' is the game as it is on main.
//
// Two halves. The parts the options re-deal by design (props, domes,
// plinths, floor, pods, the furnace, creatures' grain, the serpent's
// lattice) branch on `DEEP_PAL` where they are drawn. Everything else drawn
// in the deep -- the water, the motes, the zones, the stream, the serpent,
// its bar, the fight numbers, the finale -- goes through one fold on the
// canvas's own setters, the way ink.js maps the dark page: a ramp rung an
// option does not use becomes the nearest one it does, and a grey that is
// on no rung at all (the fleck's #9b9ba6, a yard grey drawn in the deep)
// snaps to the nearest rung it keeps. Colored marks go through untouched.

import { ABYSS_TONES, ABYSS_MAGIC_TONES } from '../config.js';
import { GREYS, PURPLES } from './deeptones.js';

const asked = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('deep') : null;
export const DEEP_PAL = ['A', 'B', 'C'].includes(asked) ? asked : 'today';

if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.__deepPalette = m => {
    const u = new URL(location.href);
    if (m && m !== 'today') u.searchParams.set('deep', m); else u.searchParams.delete('deep');
    location.href = u.href;
  };
  window.__deepPaletteNow = () => DEEP_PAL;
}

// --- the options' rules, in rungs (ABYSS_TONES / ABYSS_MAGIC_TONES indices) -------
// A: four named bands of two rungs. White (11) only for the kits, the bodies
// and the serpent, the things that are made or held; rung 10 folds into lit.
export const BANDS = { shade: [2, 3], dark: [4, 5], stone: [6, 7], lit: [8, 9] };
export const BAND_OF = { W: 'stone', w: 'lit', L: 'dark', l: 'stone', T: 'lit', K: 'lit', M: 'lit', I: 'dark', i: 'stone',
                         S: 'lit', r: 'dark', B: 'lit', m: 'dark', c: 'stone', b: 'shade', P: 'lit', k: 'dark',
                         E: 'stone', p: 'dark', f: 'lit', v: 'lit', U: 'stone' };
// B and C use greys 2-8 for what is built and the ground; 9 and 10 fold to 8.
const KEEP = {
  today: null,
  A: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11],
  B: [0, 1, 2, 3, 4, 5, 6, 7, 8, 11],
  C: [0, 1, 2, 3, 4, 5, 6, 7, 8, 11],
}[DEEP_PAL];

// The grey ramp as the option keeps it, a rung for every rung: for what is
// written straight into pixels and never meets a setter (the water's field).
// A rung an option does not keep goes to the brightest kept rung under it:
// nothing folds up into white.
const TO = KEEP ? ABYSS_TONES.map((_, i) => (KEEP.includes(i) ? i : Math.max(...KEEP.filter(k => k < i)))) : null;
export const keptRamp = ramp => (KEEP ? ramp.map((_, i) => ramp[TO[i]]) : ramp);

// The purple light from above (B, and C's dome rim): a rung at a time, held.
export const breathe = ms => [7, 8, 9, 8][Math.floor(ms / 1100) % 4];

// --- the fold --------------------------------------------------------------------
const hex = h => {
  if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  const n = parseInt(h.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const near = (rgb, list) => {
  let best = null, bd = Infinity;
  for (const c of list) {
    const q = hex(c), d = (q[0] - rgb[0]) ** 2 + (q[1] - rgb[1]) ** 2 + (q[2] - rgb[2]) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return best;
};
// Two spaces: before the deep's negative a tone is drawn as GREYS (turned),
// after it (the numbers, the statuses, the bar) as ABYSS_TONES (as seen).
function folder(ramp, purples) {
  const keep = KEEP.map(i => ramp[i].toLowerCase());
  const exact = new Map(), cache = new Map();
  ramp.forEach((c, i) => {
    if (TO[i] !== i) exact.set(c.toLowerCase(), ramp[TO[i]]);
  });
  const onRamp = new Set([...ramp, ...purples].map(c => c.toLowerCase()));
  return c => {
    if (typeof c !== 'string' || c[0] !== '#' || (c.length !== 4 && c.length !== 7)) return c;
    let out = cache.get(c);
    if (out !== undefined) return out;
    const lc = c.toLowerCase(), rgb = hex(lc);
    const full = '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
    if (exact.has(full)) out = exact.get(full);
    else if (onRamp.has(full)) out = c;
    else if (Math.max(...rgb) - Math.min(...rgb) <= 24) out = near(rgb, keep);   // a grey off the ramp
    else out = c;                                                                  // a color: left alone
    cache.set(c, out);
    return out;
  };
}
const FOLD = KEEP ? { pre: folder(GREYS, PURPLES), post: folder(ABYSS_TONES, ABYSS_MAGIC_TONES) } : null;

let phase = null;   // 'pre' or 'post' while a deep layer draws, else null
// The fold of the moment, for a cell written straight into pixels (render/cellimage.js).
export const foldNow = c => (FOLD && phase ? FOLD[phase](c) : c);
if (FOLD && typeof CanvasRenderingContext2D !== 'undefined') {
  for (const key of ['fillStyle', 'strokeStyle']) {
    const proto = CanvasRenderingContext2D.prototype, d = Object.getOwnPropertyDescriptor(proto, key);
    Object.defineProperty(proto, key, {
      configurable: true, get: d.get,
      set(v) { d.set.call(this, phase && !(v instanceof String) ? FOLD[phase](v) : v); },
    });
  }
}

// Every layer drawn in the deep, folded: the ones before the negative in the
// drawn space, the ones after it as seen (render.js calls this on LAYERS).
export function foldDeepLayers(layers, isDeep) {
  if (!FOLD) return;
  const turn = layers.findIndex(l => l.name === 'deep invert');
  layers.forEach((l, i) => {
    if (!isDeep(l.name)) return;
    const draw = l.draw, p = i < turn ? 'pre' : 'post';
    l.draw = (...a) => { const was = phase; phase = p; try { return draw(...a); } finally { phase = was; } };
  });
}
