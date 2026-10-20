// The afterlife's clouds, on the one renderer every place with sky shares
// (render/clouds.js, render/cloudgl.js, placed by render/cloudpage.js; the
// owner, 2026-10-20: "wire them in. They're better than what we have now ...
// use those clouds as the ground clouds. Clouds around the main path"):
//
// - the sky: the liquid sky's layers standing on the horizon, far to near,
//   each sliding at its own parallax;
// - the far bank: ground billows from the horizon down behind the main plane,
//   on God's slow layer (render/after/ground.js puts it);
// - the edge: small billows lapping the path's near edge from under it, on
//   the world itself, so the path stays a clear walkable surface framed by
//   cloud (render/after/floor.js puts it);
// - the foreground: big billows rolling below the path, faster than the
//   camera (render/after/ground.js puts it).
//
// Every layer's windows are worked in one pass on the card at the backdrop,
// the sky drawn then, and the rest set down from that same picture when their
// turn in the painting order comes. The flow runs on the act's own clock, so
// a held scene holds its clouds. Numbers in config/clouds.js, CLOUDS_ACT3.

import { P, GROUND_PATH, CLOUDS_ACT3 as A, CLOUDS_SKY, CLOUDS_PALETTE, CLOUDS_DEPTH_BANDS } from '../../config.js';
import { S } from '../../state.js';
import { ctx } from '../ctx.js';
import { onPixel } from '../frame.js';
import { darkPage } from '../../ink.js';
import { horizonY } from '../../after/sky.js';
import { afterFloor, afterOpenX } from '../../after/place.js';
import { skyLayer, groundLayer, layerLook, stillSheet, drawBand } from '../clouds.js';
import { cellOnPage, layerSpan, workClouds, putCells } from '../cloudpage.js';
import { now } from './kit.js';

const page = darkPage ? 'dark' : 'light';
const GROUNDS = ['far', 'edge', 'fore'];

// A ground layer's crest: the row the tallest of its back row's billows
// reach (all but a share A.crest of them stop under it), which is what a
// placement lines up with the path or the horizon, so a path stays clear of
// all but the odd top lapping it.
const crestOf = l => {
  const tops = l.puffs.filter(p => p.tier === 0).map(p => p.y - p.r * p.flat).sort((a, b) => a - b);
  return tops.length ? tops[Math.floor(tops.length * A.crest)] : 0;
};
// The body tone of a ground layer's front row, for its solid underneath.
const bodyOf = k => CLOUDS_PALETTE[page][CLOUDS_DEPTH_BANDS[page].filter(b => b[0] <= k.depths[k.depths.length - 1]).pop()[1]];

// The layers, made once: their puffs are fixed by the seed, and only where
// they are drawn changes.
let L = null;
function layers() {
  if (L) return L;
  L = { sky: Array.from({ length: CLOUDS_SKY.layers }, (_, i) => skyLayer({ i, seed: A.seed, W: A.sky.W, sky: A.sky.rows })) };
  for (const g of GROUNDS) {
    const k = A[g];
    L[g] = groundLayer({ seed: A.seed + k.R, W: k.W, R: k.R, rows: k.rows, depths: k.depths });
    L[g].crest = crestOf(L[g]);
  }
  for (const l of [...L.sky, ...GROUNDS.map(g => L[g])]) l.look = layerLook(l, { page });
  return L;
}
const NAMES = () => [...layers().sky.map((_, i) => 'sky' + i), ...GROUNDS];
const layerOf = name => (name.startsWith('sky') ? layers().sky[+name.slice(3)] : layers()[name]);

// Where a layer stands this frame: its rate against the camera, the world y
// of its first row, its drift in cells, and how far down its front row's
// body is carried solid (a world y, or none).
function placeOf(name, l, T, cw) {
  const hz = onPixel(horizonY()), floor = onPixel(afterFloor()), bot = floor + GROUND_PATH.depth * P;
  if (name === 'far') return { rate: A.far.rate, y: hz + (A.far.down - l.crest) * cw, drift: 0, solid: bot };
  if (name === 'edge') return { rate: A.edge.rate, y: bot - (A.edge.lap + l.crest) * cw, drift: 0, solid: S.camY + S.viewH };
  if (name === 'fore') return { rate: A.fore.rate, y: bot + (A.fore.down - l.crest) * cw, drift: 0, solid: S.camY + S.viewH };
  // a sky layer: its horizon row on the horizon (its clouds stand at their
  // heights over it, render/clouds.js), blowing on its wind
  return { rate: l.P.parallax * A.sky.rate, y: hz - l.baseRow * cw, drift: l.P.wind * T, solid: null };
}

// The frame's picture: every window worked once, at the backdrop.
let pic = null, lastT = null, spans = new Map();
function work() {
  const T = now(), dt = lastT === null ? 0 : Math.max(0, Math.min(0.1, T - lastT));
  lastT = T;
  const cw = cellOnPage(P), views = [];
  spans = new Map();
  for (const name of NAMES()) {
    const l = layerOf(name), at = placeOf(name, l, T, cw), sp = layerSpan(at.rate, afterOpenX(), cw, at.drift);
    // rows off the top or the bottom of the window are not drawn
    const r0 = Math.max(0, Math.floor((S.camY - at.y) / cw)), r1 = Math.min(l.h, Math.ceil((S.camY + S.viewH - at.y) / cw));
    spans.set(name, { ...at, ...sp, r0, r1, cw });
    const below = at.solid != null && at.solid > at.y + l.h * cw;
    if (r1 <= r0 && !below) continue;
    views.push({ key: name, layer: l, ox: sp.ox, w: sp.cols, h: l.h, look: l.look, every: (l.P && l.P.every) || 1, phase: views.length });
  }
  pic = workClouds(views, T, dt);
}

// --- with no card: baked sheets, held still --------------------------------------------
// The sky as bands of the baked kinds and the ground layers as baked ground,
// each where its liquid layer stands.
let still = null;
function stills() {
  if (still) return still;
  const look = { page, treat: 'C' };
  still = { sky0: stillSheet({ kind: 'far', seed: A.seed, w: 512 }, look), sky2: stillSheet({ kind: 'mid', seed: A.seed + 1, w: 512 }, look) };
  for (const g of GROUNDS) still[g] = stillSheet({ kind: 'ground', seed: A.seed + A[g].R, w: 512, R: A[g].R }, look);
  return still;
}
function putStill(name, sp) {
  const st = stills(), sh = st[name];
  if (!sh) return;
  // the sky's bands stand on the horizon, the ground's where their layers do
  const y = name.startsWith('sky') ? onPixel(horizonY()) - sh.h * sp.cw * (name === 'sky0' ? 1.6 : 1) : sp.y;
  const k = S.zoom * S.dpr, was = ctx.getTransform();
  // drawBand lays its copies from x 0 across a width: from the window's left edge
  ctx.translate(S.camX, 0);
  drawBand(ctx, sh, S.camX - sp.off, y, sp.cw, S.viewW + sp.cw * 2, 1 / k);
  ctx.setTransform(was);
}

// One layer set down, from this frame's picture or its still sheet.
export function putAfterCloud(name) {
  if (!ctx) return;
  const sp = spans.get(name);
  if (!sp) return;
  if (!pic) putStill(name, sp);
  else {
    const a = pic.at.get(name);
    if (a) putCells(ctx, pic.canvas, a, sp.off + sp.ox * sp.cw, sp.y, sp.cw, sp.r0, sp.r1 - sp.r0);
  }
  // under a ground layer's front row, its body carried solid as far as asked
  const bottom = sp.y + layerOf(name).h * sp.cw;
  if (sp.solid != null && sp.solid > bottom && !name.startsWith('sky')) {
    ctx.fillStyle = bodyOf(A[name]);
    ctx.fillRect(S.camX, bottom, S.viewW, sp.solid - bottom);
  }
}

export function drawCloudSky() {
  if (!ctx) return;
  work();
  for (let i = 0; i < layers().sky.length; i++) putAfterCloud('sky' + i);
}
