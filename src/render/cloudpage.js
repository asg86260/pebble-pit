// Clouds on the game's page: the one renderer (render/clouds.js, the field on
// the card in render/cloudgl.js) set down in the world. A place hands over its
// layers once a frame and puts each where it belongs; what is shared here is
// the card, the frame's one pass over every window, and the placing, so every
// place's clouds slide the same way.
//
// Art on the cell grid, motion smooth (CLAUDE.md): a layer's cells are drawn
// as one image at the layer's true position, its first cell on a whole device
// pixel and every cell a whole number of device pixels wide, so nothing in it
// shears against the rest and no run of cells comes out a pixel short. With
// no WebGL2 the same layers are drawn from baked sheets held still
// (`stillSheet`).

import { S } from '../state.js';
import { skyGL } from './cloudgl.js';
import { layerAt } from './frame.js';
import { layerLook } from './clouds.js';
import { inkOf } from '../ink.js';
import { CLOUDS_FAR_TONES, CLOUDS_FAR_LOOK } from '../config.js';

let card;   // the card's passes, null with no WebGL2; undefined until asked
export function cloudCard() {
  if (card === undefined) { try { card = skyGL(); } catch { card = null; } }
  return card;
}

// A cell's size on the page, in world units: `cell` world units rounded to a
// whole number of device pixels.
export function cellOnPage(cell) {
  const k = S.zoom * S.dpr;
  return Math.max(1, Math.round(cell * k)) / k;
}

// Where a layer sliding at `rate` stands, in its own cells: the world x of
// its cell 0 (on a whole device pixel, render/frame.js `layerAt`, plus a
// drift of `drift` cells it has blown since the start), the first whole cell
// in view, and how many columns cover the view.
export function layerSpan(rate, at, cw, drift = 0) {
  const off = layerAt(-drift * cw, rate, at);
  const ox = Math.floor((S.camX - off) / cw) - 1;
  return { off, ox, cols: Math.ceil(S.viewW / cw) + 3 };
}

// Every window this frame, worked in one pass on the card: `views` as
// render/cloudgl.js's `render` takes them. Returns key -> where its cells are
// in the card's canvas, or null with no card.
let frameN = 0;
export function workClouds(views, t, dt) {
  const gl = cloudCard();
  if (!gl || !views.length) return null;
  frameN++;
  for (const v of views) v.idle = (v.every || 1) > 1 && (frameN + (v.phase || 0)) % v.every !== 0;
  const r = gl.render(views, t, dt);
  const at = new Map();
  views.forEach((v, i) => at.set(v.key, r.at[i]));
  return { canvas: r.canvas, at };
}

// One window's cells set down on `g` (the world's own space): its cell 0 at
// world `x`, its first row at `y`, each cell `cw` world units (`cellOnPage`).
// `from`/`rows` take only some of its rows (the part a window shows).
export function putCells(g, canvas, a, x, y, cw, from = 0, rows = a.h) {
  if (rows <= 0) return;
  const smooth = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  g.drawImage(canvas, a.x, a.y + from, a.w, rows, x, y + from * cw, a.w * cw, rows * cw);
  g.imageSmoothingEnabled = smooth;
}

// A held cloud's look (render/clouds.js, `heldCloud`) in colors handed in this
// frame -- the yard's sky's, which slide with the murk and the storm -- lit
// face to core, each through the page's ink: a picture copied off the card
// never passes the ink's fill hook. Its bands' depths are made once (`into`,
// kept by the caller); a role's tone number is its role's, so the cleanup's
// idea of one shape never moves as the colors slide. The rear tier's lit face
// takes the body's tone, a step deeper, as the renderer's own look does.
const rgbaOf = css => {
  const v = inkOf(css), m = /^#([0-9a-f]{6})$/i.exec(v);
  if (m) { const n = parseInt(m[1], 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1]; }
  const r = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(v);
  return r ? [r[1] / 255, r[2] / 255, r[3] / 255, 1] : [1, 1, 1, 1];
};
export function heldLook(layer, css, into = null) {
  const L = into || layerLook(layer, { page: 'light' });
  for (let j = 0; j < layer.nt; j++) for (let k = 1; k <= 4; k++) {
    const t = Math.min(css.length - 1, j === 0 && k === 1 ? 1 : k - 1);
    L.lut.set(rgbaOf(css[t]), (j * 5 + k) * 4);
    L.tone[j * 5 + k] = t + 1;
  }
  L.tone[0] = css.length + 1;
  // a far cloud's other takes (CLOUDS_FAR_LOOK), off its own ladder: take 1
  // its underside the shadow's step, take 2 its crown the lit step, take 3
  // every step pulled toward its body
  // (only the take the dial is on, and none at the built look: this runs
  // every frame for every far cloud)
  if (L.far && CLOUDS_FAR_LOOK) {
    const last = css.length - 1, ink = css.map(rgbaOf), at = i => ink[Math.min(last, i)], body = at(1), f = CLOUDS_FAR_TONES.light.soft;
    for (let take = CLOUDS_FAR_LOOK; take === CLOUDS_FAR_LOOK; take++) {
      const F = L.far[take];
      for (let j = 0; j < layer.nt; j++) for (let k = 1; k <= 4; k++) {
        const i = take === 1 ? (k >= 3 ? 2 : 1) : take === 2 ? (k === 1 ? 0 : 1) : j === 0 && k === 1 ? 1 : k - 1;
        const c = take === 3 ? at(i).map((v, n) => v + (body[n] - v) * f) : at(i);
        F.lut.set(c, (j * 5 + k) * 4);
        F.tone[j * 5 + k] = take === 3 ? 10 + i : Math.min(last, i) + 1;
      }
      F.tone[0] = L.tone[0];
    }
  }
  return L;
}
