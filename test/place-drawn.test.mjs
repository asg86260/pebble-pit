// The polish bar's drawing gate (docs/polish-bar.md, "Automated gates" 4).
//
// On a recording canvas, each place's world layers drawn as a frame draws
// them: every fill at least P / 3 on its short side (canvas.md, "Line": the
// thinnest line in the world is two pixels, one is for screen-space rims);
// a body stood at a half-cell x drawn at that x, not snapped to the cell
// (CLAUDE.md, "motion is smooth"); and hell's palette written down with a
// role a tone (CLAUDE.md, "A palette may grow when every tone has its own
// job").
//
// What it finds is a set of `place:key:item` gaps; KNOWN_GAPS is today's and
// the last group asks that the two are the same set.

import { group, ok, run, yard } from './helpers.mjs';
import * as CONFIG from '../src/config.js';
import { SCENES } from '../src/scenes.js';
import { paintOn } from '../src/render/ctx.js';
import { LAYERS } from '../src/render.js';
import { PLACES } from '../src/acts.js';

const { P } = CONFIG;
const S = yard.S;

export const KNOWN_GAPS = [
  'after:body:snapped',
  'hell:hell chambers:thin', 'hell:hell forge:thin', 'hell:palette:roles',
];

const found = new Set();
const THIN = P / 3 - 1e-6;

// A sheet that writes down every fillRect while a layer it was told of is
// painting, with whether the layer had scaled its drawing (a sprite drawn
// small is not a thin line).
function recorder(log) {
  let scaled = 0;
  const st = { fillStyle: '#000000', lineWidth: 1, globalAlpha: 1, canvas: { width: S.W, height: S.H } };
  return new Proxy(st, {
    get: (o, k) => {
      if (k === 'fillRect') return (x, y, w, h) => log.on && log.fills.push({ x, y, w, h, scaled: scaled > 0, layer: log.on });
      if (k === 'scale' || k === 'setTransform' || k === 'transform') return () => { scaled++; };
      if (k === 'save') return () => {};
      if (k === 'restore') return () => {};
      if (k === 'createImageData' || k === 'getImageData') return (a, b, w = a, h = b) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(0, w * h * 4) || 4) });
      if (k === 'measureText') return () => ({ width: 0 });
      return k in o ? o[k] : () => ({});
    },
    set: (o, k, v) => { o[k] = v; return true; },
  });
}

const inPlace = (l, place) => (l.in || 'yard') === place || (Array.isArray(l.in) && l.in.includes(place));
const SPACES = new Set(['page', 'world', 'world:done']);
// The layers of a place's world: from the world's opening to the glass.
function worldLayers(place) {
  const glass = LAYERS.findIndex(l => l.name === 'screen');
  return LAYERS.slice(0, glass).filter(l => inPlace(l, place) && !SPACES.has(l.name));
}

function paint(place, layers) {
  const log = { on: null, fills: [] };
  const g = recorder(log);
  const make = document.createElement;
  document.createElement = tag => { const el = make(tag); if (tag === 'canvas') el.getContext = () => recorder({ on: null, fills: [] }); return el; };
  try {
    paintOn({ getContext: () => g, width: S.W, height: S.H }, () => {
      for (const l of layers) { if (l.when && !l.when()) continue; log.on = l.name; try { l.draw(); } catch { /* a layer the sheet cannot serve */ } log.on = null; }
    });
  } finally { document.createElement = make; }
  return log.fills;
}

function thin(place) {
  const fills = paint(place, worldLayers(place));
  const by = new Set();
  for (const f of fills) if (!f.scaled && Math.min(Math.abs(f.w), Math.abs(f.h)) < THIN && f.w && f.h) by.add(f.layer);
  for (const name of by) found.add(`${place}:${name}:thin`);
  return fills.length;
}

// One body of an act stood at a half-cell x and drawn alone by its layer.
const BODY_LAYER = { after: 'after members', hell: 'hell ghosts' };
function halfCell(place) {
  const crew = PLACES[place].crew, list = crew.list();
  const name = BODY_LAYER[place];
  const layer = LAYERS.find(l => l.name === name) || LAYERS.find(l => l.name === 'hell cage');
  const b = list.find(w => w.job && !w.lifted && !w.falling && !crew.unseen?.(w) && (!crew.ink || crew.ink(w) >= 1));
  if (!b) { found.add(`${place}:body:none`); return; }
  const keep = { x: b.x, camX: S.camX }, all = [...list];
  S.camX = b.x - S.viewW / 2;
  b.x = Math.round(b.x / P) * P + P / 2;
  list.length = 0; list.push(b);
  const fills = paint(place, [layer]).filter(f => !f.scaled);
  list.length = 0; list.push(...all);
  b.x = keep.x; S.camX = keep.camX;
  if (!fills.length) { found.add(`${place}:body:none`); return; }
  const left = Math.min(...fills.map(f => f.x));
  const off = ((left % P) + P) % P;
  if (Math.abs(off - P / 2) > 0.01) found.add(`${place}:body:snapped`);
}

group('the yard and the deep: no world fill thinner than the thinnest line', async () => {
  SCENES.yard.run();
  run(1);
  const n = thin('yard');
  SCENES.late.run();
  window.__view('deep');
  run(1);
  const m = thin('deep');
  window.__view('yard');
  return [ok(n > 100 && m > 100, 'both halves drew', `${n} ${m}`)];
});

group('act 3: no fill thinner than the thinnest line, and a body drawn where it stands', async () => {
  SCENES['act3-mid'].run();
  window.__goPlace('after');
  run(1);
  const n = thin('after');
  halfCell('after');
  window.__view('yard');
  window.__actsOn(null);
  return [ok(n > 100, 'the camp drew', `${n}`)];
});

group('hell: no fill thinner than the thinnest line, a body drawn where it stands, and a palette with roles', async () => {
  SCENES['hell-forge'].run();
  window.__goPlace('hell');
  run(1);
  const n = thin('hell');
  halfCell('hell');
  // Hell's palette: a table of tones each with its role, the way act 3's and
  // the clouds' are (config, AFTER_TONES, CLOUDS_PALETTE).
  const pal = CONFIG.HELL_PALETTE;
  if (!pal || !Object.keys(pal).length || Object.values(pal).some(r => !r || !r.role)) found.add('hell:palette:roles');
  window.__view('yard');
  window.__actsOn(null);
  return [ok(n > 20, 'hell drew', `${n}`)];
});

group('KNOWN_GAPS lists exactly the gaps there are', async () => {
  const stale = KNOWN_GAPS.filter(k => !found.has(k));
  const fresh = [...found].filter(k => !KNOWN_GAPS.includes(k)).sort();
  return [
    ok(stale.length === 0, 'every listed gap is still a gap (take a fixed one off the list)', stale.join(', ')),
    ok(fresh.length === 0, 'every gap is listed', fresh.map(k => `'${k}',`).join(' '))
  ];
});
