// The deep's palette is a cap (the owner's B4; docs/design-language/canvas.md,
// "The deep's palette"): six greys, five purples and white, and nothing
// else. Each of the deep's scenes stood up and the frame drawn, every color
// on the glass counted, and any the cap does not hold named with how much of
// the glass it covers.
//
// Read at a whole device pixel a world pixel (the deep held at 1x): at a zoom
// that is not whole, a mark laid between cells straddles device pixels and
// the canvas blends its edge, which is the raster's doing and not a tone
// anybody drew. The press's scanlines darken every odd row of device pixels,
// so only the even rows are read. The yard's reading -- the counter -- is the
// yard's and is left out, and so is the bed of scales: the scales keep their
// coin's own greys (the bed's per-cell dust tones), as the flutter of one
// thrown or sinking does (`shadeOf`, turned with the deep).

import { ok, run } from './kit.js';
import { draw, LAYERS } from '../render.js';
import { countRect } from '../render/counter.js';
import { DEEP_SEEN } from '../render/deeptones.js';
import { darkPage } from '../ink.js';
import { COIN_TONES, SHADES, P, CELL } from '../config.js';

// The comparison pages' scenes (docs/mocks/deep-palette-ingame-2026-10-14.html,
// docs/mocks/deep-background-2026-10-14.html).
const SCENES = ['deep-all', 'deep-seven', 'deep-zones', 'deep-rest', 'deep-react-angler', 'deep-react-stream-0',
                'deep-stun', 'party-statuses', 'deep-numbers', 'deep-neardeath-light', 'deep-powerup-motes',
                'deep-build', 'deep-kill-start', 'deep-freed', 'deep-endless', 'crusher', 'pods', 'finale-gear'];
const MIN_PX = 12;   // a color counts once it covers this many pixels of the rows read

const xor = h => '#' + (0xffffff ^ parseInt(h.slice(1), 16)).toString(16).padStart(6, '0');
const hex = (d, k) => '#' + ((1 << 24) | (d[k] << 16) | (d[k + 1] << 8) | d[k + 2]).toString(16).slice(1);

function offPalette(hide = null) {
  const allowed = new Set([...DEEP_SEEN, ...Object.values(COIN_TONES).flat(), ...SHADES.map(xor)]
    .map(c => c.toLowerCase()));
  const off = LAYERS.filter(l => l.name === 'deep bed' || l === hide), was = off.map(l => l.when);
  off.forEach(l => { l.when = () => false; });
  try { draw(); } finally { off.forEach((l, i) => { l.when = was[i]; }); }
  const c = document.getElementById('c'), g = c.getContext('2d'), k = devicePixelRatio || 1;
  const d = g.getImageData(0, 0, c.width, c.height).data;
  const box = countRect(), pad = 8;
  const inCount = (x, y) => box && x >= (box.x - pad) * k && x < (box.x + box.w + pad) * k
                                && y >= (box.y - pad) * k && y < (box.y + box.h + pad) * k;
  const seen = new Map();
  for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x++) {
    if (inCount(x, y)) continue;
    const h = hex(d, (y * c.width + x) * 4);
    if (!allowed.has(h)) seen.set(h, (seen.get(h) || 0) + 1);
  }
  return [...seen].filter(([, n]) => n >= MIN_PX).sort((a, b) => b[1] - a[1]);
}

// The layers whose absence takes the most of `off` away, for the report.
const ALWAYS = new Set(['page', 'world', 'world:done', 'screen', 'deep zones', 'deep invert', 'press']);
function whose(off) {
  const total = off.reduce((n, [, k]) => n + k, 0), by = [];
  for (const l of LAYERS) {
    if (ALWAYS.has(l.name)) continue;
    const left = offPalette(l).reduce((n, [, k]) => n + k, 0);
    if (left < total) by.push([l.name, total - left]);
  }
  by.sort((a, b) => b[1] - a[1]);
  return by.length ? ' (from ' + by.slice(0, 3).map(([n, k]) => `${n} ${k}`).join(', ') + ')' : '';
}

export const TESTS = [
  ['deep palette: every deep scene draws from six greys, five purples and white', async () => {
    if (darkPage) return [ok(true, 'the dark page draws the deep unturned; read on the light page')];
    const out = [];
    for (const name of SCENES) {
      window.__scene(name);
      run(1);
      window.__deepZoom(P / CELL);   // a world pixel a device pixel, past this window's fit
      run(1 / 60);
      const off = offPalette();
      // which layer draws them: the ones whose absence takes the most away
      const by = off.length ? whose(off) : '';
      window.__deepZoom(null);
      out.push(ok(off.length === 0, `${name}: nothing off the deep's palette`,
                  off.slice(0, 8).map(([h, n]) => `${h} x${n}`).join(' ') + by));
    }
    return out;
  }]
];
