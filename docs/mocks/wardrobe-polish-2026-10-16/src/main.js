// The wardrobe polish mock: every panel drawn on a canvas at a real device
// scale, "today" through the game's own draws and "polished" through
// polish.js. The dark page and the deep are made from the light draw the
// way the game makes them: the dark page maps every color by its lightness
// (src/ink.js), the deep is drawn in its own inks and turned over
// (render/deep.js).

import { YARD_INKS, DEEP_INKS } from '../../../../src/render/wardrobe.js';
import { HEAD, FACE, NECK, BACK, PATTERN, AURA } from '../../../../src/wardrobe.js';
import { WORKER, GREY, WARD_STILL_S, LIGHT_PAPER, LIGHT_INK, DARK_PAPER, DARK_INK } from '../../../../src/config.js';
import { TONE } from '../../../../src/render/deeptones.js';
import { drawToday, drawPolished, SETTLE_S } from './polish.js';

// --- scales ---------------------------------------------------------------------------
// Device pixels a world pixel: the yard at 1280x800 on a 1x screen (CELL 5
// over P 6), and a phone (390 wide, 3x: the yard's zoom 0.5, so 1.5).
const DESK = 5 / 6, PHONE = 1.5, BIG = 4;

// --- the walk -------------------------------------------------------------------------
// Walk right, stand, walk left, stand; a world pixel at a time.
const SPEED = 36, WALK_S = 1.6, STAND_S = 1.6, PERIOD = 2 * (WALK_S + STAND_S);
function walk(T, tl = {}) {
  const speed = tl.speed || SPEED, w = tl.walk || WALK_S, st = tl.stand || STAND_S, per = 2 * (w + st);
  const q = (((T + (tl.phase || 0)) % per) + per) % per, dist = Math.floor(speed * w);
  const x0 = tl.x0 || 0;
  let x, dir, walking, s, segStart;
  if (q < w) { x = x0 + Math.floor(speed * q); dir = 1; walking = true; s = q; segStart = 0; }
  else if (q < w + st) { x = x0 + dist; dir = 1; walking = false; s = q - w; segStart = 0; }
  else if (q < 2 * w + st) { x = x0 + dist - Math.floor(speed * (q - w - st)); dir = -1; walking = true; s = q - w - st; segStart = w + st; }
  else { x = x0; dir = -1; walking = false; s = q - 2 * w - st; segStart = w + st; }
  // `moving` as motionOf reads it: still walking for WARD_STILL_S after the last step
  let moving, since;
  if (walking) { moving = true; since = s; }
  else if (s < WARD_STILL_S) { moving = true; since = q - segStart; }
  else { moving = false; since = s - WARD_STILL_S; }
  return { x, dir, moving, since };
}

// --- backdrops ------------------------------------------------------------------------
const W0 = 120, H0 = 66;
let GROUND = 58;        // a panel, in world pixels
function hash(i, j) { const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return s - Math.floor(s); }
// `deep` is drawn before the turn, so its paper is the water.
function backdrop(g, w, h, k, kind, deep, rock) {
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  if (deep) {
    g.fillStyle = TONE.ground; g.fillRect(0, GROUND, w, h - GROUND);
    if (rock) { g.fillStyle = TONE.stone; rock(g); }
    return;
  }
  // sky motes, the yard's own greys
  for (let i = 0; i < w * h / 260; i++) {
    g.fillStyle = GREY[2 + Math.floor(hash(i, 3) * 3)];
    g.fillRect(Math.floor(hash(i, 1) * w / 2) * 2, Math.floor(hash(i, 2) * GROUND / 2) * 2, 2, 2);
  }
  // the ground: paper, a faint hatch, an inked edge a device pixel thick
  g.fillStyle = '#fff'; g.fillRect(0, GROUND, w, h - GROUND);
  g.fillStyle = GREY[1];
  for (let x = -h; x < w; x += 6) for (let d = 0; d < h - GROUND; d++) g.fillRect(x + d, GROUND + d, 1, 1);
  if (rock) { g.fillStyle = '#000'; rock(g); }
  g.fillStyle = '#000'; g.fillRect(0, GROUND, w, 1 / k);
}
// the rock behind: a black mass in cells with a stepped top
const rockAt = (x0, x1) => g => {
  for (let x = x0; x < x1; x += 6) {
    const top = GROUND - 30 + Math.floor(hash(x, 7) * 3) * 6 - (x - x0 < 12 ? 12 - (x - x0) : 0);
    g.fillRect(x, top, 6, GROUND - top);
  }
};

// The page's map, every pixel by its lightness (src/ink.js, `mapRgb`).
const lum = (r, g, b) => (Math.max(r, g, b) + Math.min(r, g, b)) / 510;
const LP = (0x1f * 3) / 765, LI = (0xe0 * 3) / 765;
function toHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function fromHsl(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
}
const MAP = new Map();
function darkMap(g) {
  const { width: w, height: h } = g.canvas, im = g.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    let o = MAP.get(key);
    if (!o) { const [hh, s, l] = toHsl(d[i], d[i + 1], d[i + 2]); o = fromHsl(hh, s, LP + (LI - LP) * (1 - l)); MAP.set(key, o); }
    d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2];
  }
  g.putImageData(im, 0, 0);
}
void lum; void LIGHT_PAPER; void LIGHT_INK; void DARK_PAPER; void DARK_INK;
function turnOver(g) {
  const { width: w, height: h } = g.canvas, im = g.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; }
  g.putImageData(im, 0, 0);
}

// --- one panel ------------------------------------------------------------------------
// A canvas `k` device pixels a world pixel, `bodies` drawn over the backdrop:
// each { outfit, tl | x, impl, key, seed, comb, moving, dir, since }.
const BARE = { head: 'none', face: 'eyes', neck: 'none', back: 'none', pattern: 'plain', aura: 'none' };
export function panel(c, k, bg, bodies, T, { w = W0, h = H0, rock = null, still = null } = {}) {
  const W = Math.round(w * k), Hh = Math.round(h * k);
  if (c.width !== W || c.height !== Hh) { c.width = W; c.height = Hh; }
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  g.setTransform(k, 0, 0, k, 0, 0);
  const deep = bg === 'deep';
  GROUND = h - 8;
  backdrop(g, w, h, k, bg, deep, rock);
  for (const b of bodies) {
    const m = still || (b.tl ? walk(T, b.tl) : { x: b.x, dir: b.dir || 1, moving: !!b.moving, since: b.since ?? 9 });
    const l = { outfit: { ...BARE, ...b.outfit }, dir: m.dir, moving: m.moving, since: m.since, t: T, deep,
                inks: deep ? DEEP_INKS : YARD_INKS, key: b.key, seed: b.seed || 0, comb: b.comb, back: true, aura: true };
    const y = GROUND - WORKER;
    if (b.impl === 'polish') drawPolished(g, m.x, y, l); else drawToday(g, m.x, y, l);
  }
  if (bg === 'dark') { g.setTransform(1, 0, 0, 1, 0, 0); darkMap(g); }
  if (deep) { g.setTransform(1, 0, 0, 1, 0, 0); turnOver(g); }
}
// The same raster blown up, nearest, to read what a 1x pixel did.
function blow(src, dst, z) {
  dst.width = src.width * z; dst.height = src.height * z;
  const g = dst.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0, dst.width, dst.height);
}
const dpr = () => window.devicePixelRatio || 1;
const native = c => { c.style.width = c.width / dpr() + 'px'; c.style.height = c.height / dpr() + 'px'; };

// --- the items to polish -----------------------------------------------------------------
// Ranked as the audit ranked them; `note` what changed, one line.
export const ITEMS = [
  { id: 'scarf', name: 'scarf (solid)', outfit: { neck: 'scarf' },
    note: 'tail no longer snaps from streaming to hanging: lifts on the start, falls on a slant, swings in under, kicks back two, rests' },
  { id: 'striped-scarf', name: 'striped scarf', outfit: { neck: 'striped-scarf' },
    note: 'same settle; the tail\'s light stripes are the grey, not the paper, so the tail no longer breaks into dashes on the ground and sky' },
  { id: 'checked-scarf', name: 'checked scarf (and the gold scarf, same code)', outfit: { neck: 'checked-scarf' },
    note: 'same settle as the solid scarf' },
  { id: 'cape', name: 'cape', outfit: { back: 'cape' },
    note: 'hung a unit off the back below a two-unit clasp, so the square keeps its back edge; a lag pose on the start; on the stop it falls, swings in under, flares back, rests' },
  { id: 'short-cape', name: 'short cape', outfit: { back: 'short-cape' }, note: 'as the cape, cut to the waist' },
  { id: 'gold-cape', name: 'gold cape', outfit: { back: 'gold-cape' }, note: 'as the cape, the gold hem kept' },
  { id: 'bow', name: 'bow (its ribbon)', outfit: { head: 'bow' },
    note: 'the two tails get a lifting pose on the start and fall, swing in, kick back on the stop, instead of snapping to the hang' },
  { id: 'balloon', name: 'balloon', outfit: { back: 'balloon' },
    note: 'no three-unit jump on the stop: it catches up, floats one past the rest, drifts back; one catch-up pose on the start' },
  { id: 'flag', name: 'flag', outfit: { back: 'flag' },
    note: 'the pennant sinks through two in-between poses and its tip swings one past and back, instead of dropping in one frame' },
  { id: 'headband', name: 'headband', outfit: { head: 'headband' },
    note: 'today its two ends stand still whatever the body does; now they stream and flutter walking and hang standing, with the settle' },
  { id: 'mortarboard', name: 'mortarboard', outfit: { head: 'mortarboard' },
    note: 'the tassel moved to the back corner (today it hangs at the front and swings forward on the step), lags back walking, an ink knob on its end' },
  { id: 'bird', name: 'bird', outfit: { head: 'bird' },
    note: 'leans back a unit as the body sets off, lurches a unit on and dips as it stops; no hop over a stop' },
  { id: 'antenna', name: 'antenna', outfit: { head: 'antenna' },
    note: 'its knob trails a unit or two back walking and wobbles one past on the stop (today it is rigid)' },
  { id: 'flower', name: 'flower', outfit: { head: 'flower' }, note: 'the head nods back on the step and forward on the stop (today rigid)' },
  { id: 'moneybag', name: 'moneybag', outfit: { back: 'moneybag' }, note: 'one more bounce as the body stops' },
  { id: 'backpack', name: 'backpack', outfit: { back: 'backpack' }, note: 'sinks a unit on the step and once on the stop, so it has weight (today welded on)' },
  { id: 'dust-motes', name: 'dust motes (aura)', outfit: { aura: 'dust-motes' },
    note: 'two rungs darker: today they are the tone of the sky motes and vanish among them at 1x' },
  { id: 'bubbles', name: 'bubbles (aura)', outfit: { aura: 'bubbles' }, note: 'two rungs darker, so the one-unit rings read as rings rather than a grey smudge' },
  { id: 'falling-petals', name: 'falling petals (aura)', outfit: { aura: 'falling-petals' }, note: 'two rungs darker' },
  { id: 'stink', name: 'stink (aura)', outfit: { aura: 'stink' }, note: 'two rungs darker' },
  { id: 'top-hat', name: 'top hat in front of the rock (the keyline)', outfit: { head: 'top-hat', face: 'monocle' },
    note: 'no shape change: the paper keyline is what separates a black hat from the black rock; on the bare yard it is invisible' },
  { id: 'rigid', name: 'face and pattern marks while walking (rigid)', outfit: { face: 'glasses', pattern: 'stripes' },
    note: 'the marks keep one shape as the body walks: the body\'s corner goes on a whole device pixel first (watch the 1x copy)' },
];

// --- the page ---------------------------------------------------------------------------
const $ = (s, r = document) => r.querySelector(s);
const params = new URLSearchParams(location.hash.slice(1));
let BG = params.get('bg') || 'light';
const FREEZE = params.has('t') ? +params.get('t') : null;
let speed = 1, paused = FREEZE != null, clock = FREEZE ?? 0, last = performance.now();
const ROCK = rockAt(78, 120);

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [a, v] of Object.entries(attrs)) if (a === 'class') e.className = v; else e.setAttribute(a, v);
  for (const k of kids) e.append(k);
  return e;
}
const live = [];   // (T) => void, redrawn every frame while on screen
const seen = new WeakSet();
const io = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target))));

function side(label, impl, item, keyBase) {
  const one = el('canvas', { class: 'one' }), mag = el('canvas', { class: 'mag' }), big = el('canvas', { class: 'big' });
  const fig = el('figure', { class: 'side' }, el('figcaption', {}, label),
    el('div', { class: 'scales' }, el('div', {}, el('span', { class: 'lab' }, '1x desk'), one),
      el('div', {}, el('span', { class: 'lab' }, '1x desk, magnified x3'), mag)),
    el('div', {}, el('span', { class: 'lab' }, '4x'), big));
  const keyA = {}, keyB = {};
  const draw = T => {
    const b = { outfit: item.outfit, tl: { x0: 14 }, impl, comb: item.comb };
    panel(one, DESK, BG, [{ ...b, key: keyA }], T, { rock: ROCK });
    native(one); blow(one, mag, 3);
    panel(big, BIG, BG, [{ ...b, key: keyB }], T, { rock: ROCK });
    big.style.width = big.width / dpr() + 'px';
  };
  live.push({ node: fig, draw });
  io.observe(fig);
  return fig;
}

// A strip of held poses round the stop: the last steps, the stop, the settle.
function strip(item, impl) {
  const c = el('canvas', { class: 'strip' });
  const draw = () => {
    const z = 3, n = 9, w = 44, h = 50, ts = Array.from({ length: n }, (_, i) => WALK_S - 0.18 + i * 0.12);
    const one = document.createElement('canvas');
    c.width = n * w * z; c.height = h * z;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    ts.forEach((T, i) => {
      const m = walk(T, { x0: 0 });
      panel(one, z, BG, [{ outfit: item.outfit, x: 14, dir: 1, moving: m.moving, since: m.since, impl, comb: item.comb, key: {} }], T,
            { w, h, still: { x: 14, dir: 1, moving: m.moving, since: m.since } });
      g.drawImage(one, 0, -(H0 - h) * 0, w * z, h * z, i * w * z, 0, w * z, h * z);
    });
  };
  return { c, draw };
}

function itemRow(item) {
  const strips = [strip(item, 'today'), strip(item, 'polish')];
  const row = el('section', { class: 'item', id: 'item-' + item.id },
    el('h3', {}, item.name),
    el('p', { class: 'note' }, item.note),
    el('div', { class: 'pair' }, side('today (the game\'s own draw)', 'today', item), side('polished', 'polish', item)),
    el('details', {}, el('summary', {}, 'the stop, pose by pose (0.12 s apart, x3)'),
      el('div', { class: 'striplab' }, 'today'), strips[0].c, el('div', { class: 'striplab' }, 'polished'), strips[1].c));
  row._strips = strips;
  return row;
}

// --- the comb's idle light -----------------------------------------------------------------
function combRow() {
  const wrap = el('section', { class: 'item', id: 'comb' },
    el('h3', {}, 'serpent comb: the idle light (the owner\'s addition)'),
    el('p', { class: 'note' }, 'A climbs back to front every 4 s, a held step a spike, each spike fading in, then the whole fades out. ' +
      'B is the serpent\'s own pre-constrict tell every 5.5 s: lit head first, white tip, the crest\'s two-purple flicker, dark tail first. ' +
      'C breathes one rung up and back, always, by opacity. In the yard a lighter purple on the paper reads as fading, so there the light ' +
      'is the tip in the brightest purple and a pale purple glow round the lit spike; in the deep it is the serpent\'s own white tip and top purples.'));
  const grid = el('div', { class: 'combgrid' });
  for (const [mode, label] of [['today', 'today'], ['A', 'A: climb'], ['B', 'B: the tell'], ['C', 'C: breathe']]) {
    const item = { outfit: { head: 'serpent-comb' }, comb: mode === 'today' ? null : mode };
    const cells = [];
    for (const bg of ['light', 'deep']) {
      const one = el('canvas', { class: 'one' }), mag = el('canvas', { class: 'mag' }), big = el('canvas', { class: 'big' });
      const k1 = {}, k2 = {};
      const draw = T => {
        const b = { outfit: item.outfit, x: 50, dir: 1, impl: mode === 'today' ? 'today' : 'polish', comb: item.comb };
        panel(one, DESK, bg, [{ ...b, key: k1 }], T, { w: 100, h: 50, still: { x: 40, dir: 1, moving: false, since: 9 } });
        native(one); blow(one, mag, 3);
        panel(big, BIG, bg, [{ ...b, key: k2 }], T, { w: 60, h: 40, still: { x: 21, dir: 1, moving: false, since: 9 } });
      };
      const cell = el('div', { class: 'combcell' }, el('span', { class: 'lab' }, bg === 'light' ? 'yard' : 'deep'), one, mag, big);
      live.push({ node: cell, draw, fixedBg: true });
      io.observe(cell);
      cells.push(cell);
    }
    grid.append(el('div', { class: 'combcol' }, el('h4', {}, label), ...cells));
  }
  wrap.append(grid);
  return wrap;
}

// --- the crowd -------------------------------------------------------------------------------
const CROWD = [
  { neck: 'scarf' }, { back: 'cape', head: 'crown' }, {}, { back: 'balloon', face: 'smile' }, { head: 'bow', neck: 'striped-scarf' },
  {}, { back: 'flag' }, { head: 'headband', pattern: 'overalls' }, { head: 'helmet' }, { head: 'mortarboard', face: 'glasses' },
  { head: 'bird' }, {}, { back: 'short-cape', head: 'top-hat' }, { head: 'antenna', back: 'backpack' }, { head: 'flower', neck: 'checked-scarf' },
  { head: 'lamp' }, { back: 'gold-cape', head: 'gold-crown', neck: 'gold-scarf' }, { back: 'moneybag', head: 'sun-hat' }, {},
  { head: 'serpent-comb', aura: 'juggling-balls' }, { head: 'wizard-hat' }, { head: 'diving-bowl', aura: 'bubbles' },
];
function crowdRow() {
  const wrap = el('section', { class: 'item', id: 'crowd' }, el('h3', {}, 'the whole set in a crowd, at game scale'),
    el('p', { class: 'note' }, 'Twenty-two bodies, every polished piece worn by someone, plain crew among them, walking and stopping on their own clocks ' +
      'in front of the rock. Top: 1x desk, true size. Under it the same raster magnified x2.'));
  const figs = [];
  for (const impl of ['today', 'polish']) {
    const one = el('canvas', { class: 'one' }), mag = el('canvas', { class: 'mag' });
    const keys = CROWD.map(() => ({}));
    const draw = T => {
      const bodies = CROWD.map((o, i) => ({
        outfit: Object.keys(o).length ? o : { face: 'none' }, key: keys[i], impl: Object.keys(o).length ? impl : 'today', seed: i,
        tl: { x0: 6 + i * 21, speed: 20 + hash(i, 5) * 22, walk: 0.8 + hash(i, 6) * 1.2, stand: 0.6 + hash(i, 8) * 1.6, phase: hash(i, 9) * 6 },
      }));
      panel(one, DESK, BG, bodies, T, { w: 520, h: H0, rock: rockAt(330, 470) });
      native(one); blow(one, mag, 2);
    };
    const fig = el('figure', { class: 'crowd' }, el('figcaption', {}, impl === 'today' ? 'today' : 'polished'), one, mag);
    live.push({ node: fig, draw }); io.observe(fig);
    figs.push(fig);
  }
  wrap.append(...figs);
  return wrap;
}

// --- the audit grid: every item, today ----------------------------------------------------
function auditGrid() {
  const wrap = el('div', { class: 'audit' });
  const slots = [['head', HEAD], ['face', FACE], ['neck', NECK], ['back', BACK], ['pattern', PATTERN], ['aura', AURA]];
  const draws = [];
  for (const [slot, list] of slots) {
    const row = el('div', { class: 'auditslot' }, el('h4', {}, slot));
    for (const it of list.slice(1)) {
      const outfit = { [slot]: it.key, ...(slot === 'face' ? {} : { face: 'none' }) };
      const cs = [0, 1, 2, 3, 4].map(() => el('canvas'));
      const cell = el('div', { class: 'acell' }, el('div', { class: 'aname' }, it.key), ...cs);
      row.append(cell);
      draws.push(() => {
        const one = document.createElement('canvas');
        const w = 56, h = 62, base = { outfit, key: {}, impl: 'today' };
        // standing and walking on the sky, standing in front of the rock: 1x, magnified x3
        panel(one, DESK, BG, [{ ...base, x: 22 }], 1.3, { w, h, still: { x: 22, dir: 1, moving: false, since: 9 } }); blow(one, cs[0], 3);
        panel(one, DESK, BG, [{ ...base, key: {}, x: 22 }], 1.3, { w, h, still: { x: 22, dir: 1, moving: true, since: 0.5 } }); blow(one, cs[1], 3);
        panel(one, DESK, BG, [{ ...base, key: {}, x: 22 }], 1.3, { w, h, rock: rockAt(0, 60), still: { x: 22, dir: 1, moving: false, since: 9 } }); blow(one, cs[2], 3);
        // the phone: its device pixels, x2
        panel(one, PHONE, BG, [{ ...base, key: {}, x: 22 }], 1.3, { w, h, still: { x: 22, dir: 1, moving: true, since: 0.5 } }); blow(one, cs[3], 2);
        panel(cs[4], BIG, BG, [{ ...base, key: {}, x: 22 }], 1.3, { w, h, still: { x: 22, dir: 1, moving: true, since: 0.5 } });
        const z = params.has('afull') ? 1 : 2; cs.forEach(c => { c.style.width = c.width / z + 'px'; c.style.height = c.height / z + 'px'; });
      });
    }
    wrap.append(row);
  }
  wrap._draw = () => draws.forEach(d => d());
  return wrap;
}

function build() {
  const items = $('#items');
  for (const it of ITEMS) items.append(itemRow(it));
  $('#comb-slot').append(combRow());
  $('#crowd-slot').append(crowdRow());
  const audit = auditGrid();
  $('#audit-slot').append(audit);
  const redrawStatic = () => {
    audit._draw();
    document.querySelectorAll('.item').forEach(r => r._strips && r._strips.forEach(s => s.draw()));
  };
  document.querySelectorAll('[data-bg]').forEach(b => {
    b.classList.toggle('on', b.dataset.bg === BG);
    b.onclick = () => {
      BG = b.dataset.bg;
      document.querySelectorAll('[data-bg]').forEach(x => x.classList.toggle('on', x === b));
      document.body.dataset.bg = BG;
      redrawStatic(); frame(true);
    };
  });
  document.body.dataset.bg = BG;
  document.querySelectorAll('[data-speed]').forEach(b => {
    b.classList.toggle('on', +b.dataset.speed === speed);
    b.onclick = () => { speed = +b.dataset.speed; paused = false; document.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('on', x === b)); };
  });
  $('#pause').onclick = () => { paused = !paused; };
  $('#step').onclick = () => { paused = true; clock += SETTLE_S; frame(true); };
  redrawStatic();
  frame(true);
}

function frame(force = false) {
  const now = performance.now();
  if (!paused) clock += (now - last) / 1000 * speed;
  last = now;
  $('#clock').textContent = clock.toFixed(2) + ' s';
  for (const p of live) if (force || seen.has(p.node)) p.draw(clock);
  if (!force) requestAnimationFrame(() => frame());
}
build();
if (FREEZE == null) requestAnimationFrame(() => frame());
window.__ready = true;
void PERIOD;
