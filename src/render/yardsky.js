// REVIEW yardsky
// The yard's clouds, on the one cloud renderer every place with sky shares
// (render/clouds.js, the field on the card in render/cloudgl.js, placed by
// render/cloudpage.js; DESIGN.md, "The yard's sky on the cloud renderer").
//
// What a cloud is, where it is and how swelled, browned or greyed it is this
// frame are weather.js's (`cloudNow`): the clock, the front, the murk and the
// balloons all stay there. This is only the drawing. Every cloud is a window
// of its own on the card, a cell of its sheet's size a pixel, worked in one
// pass a frame with the rest, and set down whole at its true position on a
// whole device pixel -- art on the grid, motion smooth. Farthest first, with
// the balloons drawn between them by depth, so a near cloud covers a far one
// and a balloon hangs among them.
//
// The palette is data: the renderer's roles (lit face, body, shade, core) are
// colored each frame from the yard's own tones -- CLOUD_TONES steps from the
// crown's color to the base's, browned by the murk and greyed by the storm --
// passed through the page's map, since the card's cells reach the canvas as
// an image and no fill style ever sees them. With no WebGL2 a cloud is drawn
// from its field worked on the CPU, held still, in its body's tone.

import { S } from '../state.js';
import { ctx } from './ctx.js';
import { skyCam } from '../view.js';
import { GUESTS } from '../skyguests.js';
import { CLOUDS, cloudNow, swell, murk, skyClock } from '../weather.js';
import { layerLook, restTiers } from './clouds.js';
import { cellOnPage, workClouds, putCells, cloudCard } from './cloudpage.js';
import { inkOf, themeGen } from '../ink.js';

const hex2 = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
const toHex = c => '#' + hex2(c[0]) + hex2(c[1]) + hex2(c[2]);
// A color as the yard's map draws it on the page in force.
const onPage = c => String(inkOf(toHex(c), 'yard'));

// A cloud's look: its roles and bands (`layerLook`, off its puffs and its
// depth) colored from this frame's tones. Made again only when a color has
// moved a whole step, or the page has turned.
function lookOf(c, tones) {
  const [lit, body, shade, core] = tones.map(onPage);
  const key = `${themeGen}|${lit}|${body}|${shade}|${core}`;
  if (c.look && c.lookKey === key) return c.look;
  // the far sheet is one tone (CLOUDS_DEPTH_BANDS), its crown's: `haze`
  const palette = { sky: onPage([255, 255, 255]), haze: lit, lit, body, shade, core };
  c.look = layerLook(c.layer, { palette });
  c.lookKey = key;
  return c.look;
}

// A cloud without the card: its field at rest, at this frame's swell, each
// cell its tier's body tone. Worked again only when the swell or a color moves.
function stillOf(c, look) {
  const l = c.layer, sc = l.scale, key = `${sc.r}|${sc.bud}|${c.lookKey}`;
  let st = c.still;
  if (st && st.key === key) return st;
  if (!st) {
    const canvas = document.createElement('canvas');
    canvas.width = l.w; canvas.height = l.h;
    const g = canvas.getContext('2d');
    st = c.still = { canvas, g, img: g.createImageData(l.w, l.h), at: { x: 0, y: 0, w: l.w, h: l.h } };
  }
  const t = restTiers(l, sc), d = st.img.data, lut = look.lut;
  for (let i = 0; i < t.length; i++) {
    const o = i * 4;
    if (t[i] < 0) { d[o + 3] = 0; continue; }
    const k = (t[i] * 5 + 2) * 4;
    d[o] = lut[k] * 255; d[o + 1] = lut[k + 1] * 255; d[o + 2] = lut[k + 2] * 255; d[o + 3] = 255;
  }
  st.g.putImageData(st.img, 0, 0);
  st.key = key;
  return st;
}

let lastT = null;          // page: the sky clock at the last frame drawn, for the fade
const known = new Set();   // page: the clouds that have a window on the card

export function drawClouds() {
  const T = skyClock(), dt = lastT === null ? 0 : Math.max(0, Math.min(0.1, T - lastT));
  lastT = T;
  const sw = swell(), mk = murk();
  // Every place snapped to a whole device pixel, once for the whole cloud.
  const k = S.zoom * S.dpr, snap = v => Math.round(v * k) / k;
  // Cut at the top of the window: a storm swollen past it is a ceiling
  // there, not a wall running up out of the sky.
  const top = skyCam().y;
  // Where the glass is, for leaving out a cloud wholly off it: the sky runs
  // the world's whole width.
  const glass = ctx.getTransform(), glassW = ctx.canvas.width;
  const order = CLOUDS.slice().sort((a, b) => a.far - b.far);
  const views = [], placed = [];
  for (const c of order) {
    const n = cloudNow(c, sw, mk), l = c.layer, cw = cellOnPage(n.cell);
    const x = snap(n.x), y = snap(n.base - l.baseRow * cw);
    if (glass.a * (x + l.w * cw) + glass.e < 0 || glass.a * x + glass.e > glassW) continue;
    l.scale = n.scale;
    const look = lookOf(c, n.tones);
    views.push({ key: c, layer: l, ox: 0, oy: 0, w: l.w, h: l.h, look, every: 1 });
    known.add(c);
    placed.push({ c, x, y, cw, from: Math.max(0, Math.ceil((top - y) / cw)), look });
  }
  const pic = workClouds(views, T, dt);
  // a cloud gone from the sky gives its window back
  if (known.size > CLOUDS.length) {
    const live = new Set(CLOUDS);
    for (const c of known) if (!live.has(c)) { known.delete(c); cloudCard()?.forget(c); }
  }

  // Farthest first, the balloons between: anything farther than a cloud
  // goes down before it, so the cloud covers it.
  const visitors = GUESTS.list().slice().sort((a, b) => a.far - b.far);
  let g = 0;
  for (const p of placed) {
    while (g < visitors.length && visitors[g].far < p.c.far) visitors[g++].draw();
    const l = p.c.layer, rows = l.h - p.from;
    if (rows <= 0) continue;
    if (pic) { const a = pic.at.get(p.c); if (a) putCells(ctx, pic.canvas, a, p.x, p.y, p.cw, p.from, rows); }
    else if (typeof document !== 'undefined') { const st = stillOf(p.c, p.look); putCells(ctx, st.canvas, st.at, p.x, p.y, p.cw, p.from, rows); }
  }
  // and whatever is nearer than every cloud
  while (g < visitors.length) visitors[g++].draw();
}
