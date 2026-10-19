// Act 3 is drawn in four tones and no others (config, AFTER_TONES; the
// owner, 2026-10-19): paper, the pale grey, the mid grey and the ink, for
// every station, body, cloud, pile, cue and bubble, and for the sky's crowd,
// whose depth is which tone a band takes and how densely. God's light is the
// one thing outside them, and it is drawn raw (render/aftercrowd.js), so a
// raw tone is passed over here. No check can see a picture, so what is
// checked is what the act's layers are told to fill: every fill, path, text
// and image-data pixel, on a sheet that keeps them, across the act's scenes,
// sprites and band canvases included.
import { group, ok, run, yard } from './helpers.mjs';
import { GREY, AFTER_TONES } from '../src/config.js';
import { SCENES } from '../src/scenes.js';
import { paintOn } from '../src/render/ctx.js';
import { drawAfterBackdrop, drawAfterSky, drawAfterGrove, drawAfterCamp, drawAfterMembers, drawAfterCounts } from '../src/render/after.js';
import { drawSkyCrowd, drawAfterCrowd } from '../src/render/aftercrowd.js';
import { drawAfterCues } from '../src/render/aftercues.js';
import { drawAfterCoins } from '../src/render/aftercoins.js';

const S = yard.S;
const LAYERS = [drawAfterBackdrop, drawSkyCrowd, drawAfterSky, drawAfterGrove, drawAfterCamp, drawAfterCrowd,
                drawAfterMembers, drawAfterCoins, drawAfterCues, drawAfterCounts];
const SCENE_NAMES = ['after-camp-art', 'after-camp-art-2', 'after-paper-line', 'after-nails', 'after-grove', 'after-saw',
                     'after-dig', 'after-chip-held', 'after-site-carry', 'after-coins', 'after-bubbles', 'after-pedestal',
                     'after-crowd', 'heaven-10', 'heaven-50', 'heaven-zoom', 'heaven-rally', 'heaven-roar'];

const hex6 = c => {
  const named = { black: '#000000', white: '#ffffff' }[c];
  if (named) return named;
  if (/^#[0-9a-f]{3}$/i.test(c)) c = '#' + [...c.slice(1)].map(h => h + h).join('');
  return c.toLowerCase();
};
const FOUR = new Set(Object.values(AFTER_TONES).map(i => hex6(GREY[i])));
const toHex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');

// A sheet that keeps every tone it is told to lay down, by the scene that
// asked: a primitive string is the page's own tone; a String object is a raw
// one (ink.js), God's light, and passed over; and only while an act-3
// layer is painting (`where`), not the yard's own scratch sheets made as a
// scene is set up.
function keeper(seen, where) {
  const take = v => {
    if (typeof v !== 'string') return;
    const c = hex6(v);
    const w = where();
    if (w && !FOUR.has(c)) { const s = seen.get(c) || new Set(); s.add(w); seen.set(c, s); }
  };
  const make = () => {
    const st = { fillStyle: '#000000' };
    return new Proxy(st, {
      get: (o, k) => {
        if (k === 'fillRect' || k === 'fill' || k === 'fillText') return () => take(o.fillStyle);
        if (k === 'createImageData') return (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
        if (k === 'putImageData') return img => {
          const d = img.data;
          for (let i = 0; i < d.length; i += 4) if (d[i + 3]) take(toHex(d[i], d[i + 1], d[i + 2]));
        };
        if (k === 'measureText') return () => ({ width: 0 });
        return k in o ? o[k] : () => ({});
      },
      set: (o, k, v) => { o[k] = v; return true; },
    });
  };
  return make;
}

group("act 3's layers paint only its four tones, God's raw light aside", async () => {
  window.__board = () => {};
  const seen = new Map();
  let at = null;
  const sheetCtx = keeper(seen, () => at);
  const make = document.createElement;
  // The sprites and the far bands' canvases are painted on sheets of their
  // own (aftercrowd.js, `sprite`, `bandCanvas`): each one kept too.
  document.createElement = tag => {
    const el = make(tag);
    if (tag === 'canvas') { const g = sheetCtx(); el.getContext = () => g; }
    return el;
  };
  const stood = [];
  try {
    for (const name of SCENE_NAMES) {
      SCENES[name].run();
      run(1);
      if (!S.after) continue;
      stood.push(name);
      const g = sheetCtx();
      for (let f = 0; f < 3; f++) {
        paintOn({ getContext: () => g, width: S.W, height: S.H }, () => { for (const draw of LAYERS) { at = `${name} ${draw.name}`; draw(); } at = null; });
        run(1 / 2);
      }
    }
  } finally {
    document.createElement = make;
  }
  window.__actsOn(null);
  const off = [...seen].map(([c, where]) => `${c} (${[...where].slice(0, 3).join(', ')})`);
  return [
    ok(stood.length === SCENE_NAMES.length, 'every act-3 scene stood the act up', SCENE_NAMES.filter(n => !stood.includes(n)).join(', ')),
    ok(off.length === 0, 'no tone outside paper, pale, mid and ink', off.join('; ')),
  ];
});
