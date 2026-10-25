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
import { onTheme } from '../ink.js';

let card;   // page: the WebGL card, the browser's; the card's passes, null with no WebGL2; undefined until asked
onTheme(() => card?.afresh());   // its windows ease from the old page's tones otherwise
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
let frameN = 0;   // page: the page's frame count, only staggers which windows idle
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
