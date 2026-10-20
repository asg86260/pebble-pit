// Act 3 is drawn in four tones and no others (config, AFTER_TONES; the
// owner, 2026-10-19): paper, the pale grey, the mid grey and the ink, for
// every station, body, cloud, pile, cue and bubble, and for the sky's crowd,
// whose depth is which tone a band takes. God, his light and his throne are
// the one thing outside them, and they are drawn raw (render/aftercrowd.js),
// so a raw tone is passed over here. No check can see a picture, so what is
// checked is what the act's layers are told to fill: every fill, path, text
// and image-data pixel, on a sheet that keeps them, across the act's scenes,
// sprites and band canvases included.
//
// The palette may grow when every tone has its own job (the owner,
// 2026-10-20): the clouds' tones (config/clouds.js, CLOUDS_PALETTE) are
// named by role -- sky, haze, body, shade, core, near, lit -- and are allowed
// here by name. What still fails is a tone no list names, and two different
// tones of the clouds' palette too close to tell apart on their page.
import { group, ok, run, yard } from './helpers.mjs';
import { GREY, AFTER_TONES, AFTER_DARK, CLOUDS_PALETTE } from '../src/config.js';
import { setPref } from '../src/prefs.js';
import { inkOf } from '../src/ink.js';
import { SCENES } from '../src/scenes.js';
import { paintOn } from '../src/render/ctx.js';
import { drawAfterBackdrop, drawAfterSky, drawAfterGrove, drawAfterCamp, drawAfterMembers, drawAfterCounts } from '../src/render/after.js';
import { drawSkyCrowd, drawAfterCrowd } from '../src/render/aftercrowd.js';
import { drawAfterCues } from '../src/render/aftercues.js';
import { drawAfterCoins } from '../src/render/aftercoins.js';
import { drawActsAfter } from '../src/render/portals.js';

const S = yard.S;
const LAYERS = [drawAfterBackdrop, drawSkyCrowd, drawAfterSky, drawAfterGrove, drawAfterCamp, drawAfterCrowd,
                drawAfterMembers, drawAfterCoins, drawAfterCues, drawAfterCounts, drawActsAfter];
const SCENE_NAMES = ['after-camp-art', 'after-camp-art-2', 'after-paper-line', 'after-nails', 'after-grove', 'after-saw',
                     'after-dig', 'after-chip-held', 'after-site-carry', 'after-coins', 'after-bubbles', 'after-pedestal',
                     'after-crowd', 'heaven-10', 'heaven-50', 'heaven-zoom', 'heaven-rally', 'heaven-roar', 'portal-heaven-up'];

const hex6 = c => {
  const named = { black: '#000000', white: '#ffffff' }[c];
  if (named) return named;
  if (/^#[0-9a-f]{3}$/i.test(c)) c = '#' + [...c.slice(1)].map(h => h + h).join('');
  return c.toLowerCase();
};
const FOUR = new Set([...Object.values(AFTER_TONES).map(i => hex6(GREY[i])), ...Object.values(CLOUDS_PALETTE.light).map(hex6)]);
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
    ok(off.length === 0, "no tone outside paper, pale, mid and ink, and the clouds' named tones", off.join('; ')),
  ];
});

// On the dark page the act has its own spread (ink.js, 'after'; DESIGN.md,
// "The sky, redrawn flat"): the light page's order turned -- the paper
// darkest, then pale, then mid, the ink lightest -- each a clear step above
// the last, where the yard's map squeezed all four into the paper's quarter
// of the range. What is checked is the map itself, read off a copy of ink.js
// loaded on the dark page, since the yard here is the light one -- on which
// the map must stay the identity.
const AFTER_STEP_MIN = 0.07;   // of the lightness range, between any two neighbors of the four
const lightness = c => { const [r, g, b] = hex6(c).slice(1).match(/../g).map(h => parseInt(h, 16)); return (Math.max(r, g, b) + Math.min(r, g, b)) / 510; };

group("act 3's four tones sit apart on the dark page, turned, and the light page is as written", async () => {
  setPref('theme', 'dark');
  let dark;
  try { dark = await import('../src/ink.js?after-dark'); } finally { setPref('theme', null); }
  const to = Object.fromEntries(Object.entries(AFTER_TONES).map(([k, i]) => [k, dark.inkOf(GREY[i], 'after')]));
  const order = ['paper', 'pale', 'mid', 'ink'].map(k => lightness(to[k]));
  const gaps = order.slice(1).map((l, i) => l - order[i]);
  const said = Object.entries(to).map(([k, c]) => `${k} ${c}`).join(', ');
  return [
    ok(dark.darkPage, 'the copy is on the dark page'),
    ok(Object.keys(AFTER_DARK).every(k => hex6(to[k]) === hex6(AFTER_DARK[k])), 'each of the four lands on its dark tone', said),
    ok(gaps.every(g => g > 0), 'in the order turned: paper, pale, mid, ink, each lighter than the last', said),
    ok(Math.min(...gaps) >= AFTER_STEP_MIN, `every two neighbors at least ${AFTER_STEP_MIN} apart`, `${said}; gaps ${gaps.map(g => g.toFixed(3)).join(', ')}`),
    ok(lightness(to.ink) < 1, "God's raw white is still the lightest thing in the act", said),
    ok(Object.values(AFTER_TONES).every(i => inkOf(GREY[i], 'after') === GREY[i]), 'the light page draws the four as written'),
  ];
});

// The clouds' palette: each tone named for its role, and on each page every
// two different tones a clear step apart (the same step as the act's four),
// so a new tone is a new job and not a near-copy of an old one. Two roles
// may share one tone; that is one tone, not two.
group("the clouds' tones each have a role, and no two sit too close on a page", async () => {
  const out = [];
  for (const page of ['light', 'dark']) {
    const roles = CLOUDS_PALETTE[page];
    const tones = [...new Set(Object.values(roles).map(hex6))].sort((a, b) => lightness(a) - lightness(b));
    const gaps = tones.slice(1).map((c, i) => lightness(c) - lightness(tones[i]));
    const said = Object.entries(roles).map(([k, c]) => `${k} ${c}`).join(', ');
    out.push(
      ok(Object.entries(roles).every(([k, c]) => /^[a-z]+$/.test(k) && /^#[0-9a-f]{6}$/i.test(c)), `the ${page} page's cloud tones are each named for a role`, said),
      ok(tones.length >= 3, `the ${page} page's clouds have a sky and at least two tones of cloud`, said),
      ok(Math.min(...gaps) >= AFTER_STEP_MIN, `the ${page} page's cloud tones sit at least ${AFTER_STEP_MIN} apart`, `${said}; gaps ${gaps.map(g => g.toFixed(3)).join(', ')}`)
    );
  }
  return out;
});
