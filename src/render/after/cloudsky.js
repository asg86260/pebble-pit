// The afterlife's clouds, on the one renderer every place with sky shares
// (render/clouds.js, render/cloudgl.js, placed by render/cloudpage.js; the
// owner, 2026-10-20: "wire them in. They're better than what we have now ...
// use those clouds as the ground clouds. Clouds around the main path"):
//
// the sky's layers in their lanes at the top of the sky, far to near, each
// sliding at its own parallax. The ground clouds that lapped the path and
// rolled below it are gone (the owner, 2026-10-22): the path's front is its
// own lip of billows now (render/after/ground.js). So is the bank that stood
// on the horizon, a flat pale band behind the stations' middles (the owner,
// 2026-10-26: "remove the clouds behind the main plane that arent a part of
// the sky clouds"): only a layer with a lane (CLOUDS_ACT3.sky.lanes) is drawn.
//
// Every layer's windows are worked in one pass on the card at the backdrop.
// The flow runs on the act's own clock, so a held scene holds its clouds.
// Numbers in config/clouds.js, CLOUDS_ACT3.

import { P, CLOUDS_ACT3 as A, CLOUDS_SKY, CLOUDS_PALETTE } from '../../config.js';
import { S } from '../../state.js';
import { ctx } from '../ctx.js';
import { onPixel } from '../frame.js';
import { darkPage, onTheme } from '../../ink.js';
import { afterOpenX, afterX0, afterX1 } from '../../after/place.js';
import { skyLayer, layerLook, layerParams, stillSheet, drawBand } from '../clouds.js';
import { cellOnPage, layerSpan, workClouds, putCells } from '../cloudpage.js';
import { now } from './kit.js';
import { restY } from '../../shot.js';
import { held } from '../../reset.js';

const page = () => (darkPage ? 'dark' : 'light');
// The path's surface: the paper by day, by night the cloud palette's role
// CLOUDS_ACT3.path names (render/after/floor.js draws the path in it too).
export const pathTone = () => (darkPage ? CLOUDS_PALETTE.dark[A.path.dark] : CLOUDS_PALETTE.light.sky);

// The layers, made once: their puffs are fixed by the seed, and only where
// they are drawn changes.
let L = null;   // cache: made once from the act's fixed seed and width
function layers() {
  if (L) return L;
  // a layer's round: the act's width as the layer slides past it, and a pad
  const round = rate => Math.ceil((afterX1() - afterX0()) * rate / P) + A.pad;
  L = { sky: Array.from({ length: CLOUDS_SKY.layers }, (_, i) => skyLayer({ i, seed: A.seed, W: round(layerParams(i).parallax * A.sky.rate), sky: A.sky.rows, lane: A.sky.lanes[i] })) };
  for (const l of L.sky) l.look = layerLook(l, { page: page() });
  return L;
}
const NAMES = () => layers().sky.map((_, i) => 'sky' + i).filter((_, i) => A.sky.lanes[i]);
const layerOf = name => layers().sky[+name.slice(3)];

// Where a layer stands this frame: its rate against the camera, the world y
// of its first row and its drift in cells.
function placeOf(name, l, T, cw) {
  // a sky layer, blowing on its wind: its top row at the top of the act's
  // resting window, so its clouds keep to the top of the sky
  // (CLOUDS_ACT3.sky) and still slide with the world as the camera lifts
  // off its rest
  return { rate: l.P.parallax * A.sky.rate, y: onPixel(restY()) - l.baseRow * cw, drift: l.P.wind * T };
}

// The frame's picture: every window worked once, at the backdrop.
let pic = null, lastT = null, spans = new Map();   // held: the last frame's picture, its clock and its spans
held('cloudsky-picture', () => { pic = null; lastT = null; spans = new Map(); });
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
    if (r1 <= r0) continue;
    views.push({ key: name, layer: l, ox: sp.ox, w: sp.cols, h: l.h, look: l.look, every: (l.P && l.P.every) || 1, phase: views.length });
  }
  pic = workClouds(views, T, dt);
}

// --- with no card: baked sheets, held still --------------------------------------------
// The sky as bands of the baked kinds, each where its liquid layer stands.
let still = null;   // cache: baked from the act's fixed seed, in the page's tones
// The layers' looks and the still sheets are the page's: made again when it turns.
onTheme(() => { L = null; still = null; });
function stills() {
  if (still) return still;
  const look = { page: page(), treat: 'C' };
  still = { sky2: stillSheet({ kind: 'mid', seed: A.seed + 1, w: 512 }, look) };
  return still;
}
function putStill(name, sp) {
  const st = stills(), sh = st[name];
  if (!sh) return;
  // the sky's band in its layer's lane at the top of the sky
  const lane = A.sky.lanes[+name.slice(3)];
  const y = onPixel(restY()) + lane[1] * sp.cw - sh.h * sp.cw;
  const k = S.zoom * S.dpr, was = ctx.getTransform();
  // drawBand lays its copies from x 0 across a width: from the window's left edge
  ctx.translate(S.camX, 0);
  drawBand(ctx, sh, S.camX - sp.off, y, sp.cw, S.viewW + sp.cw * 2, 1 / k);
  ctx.setTransform(was);
}

// One layer set down, from this frame's picture or its still sheet.
function putAfterCloud(name) {
  const sp = spans.get(name);
  if (!sp) return;
  if (!pic) putStill(name, sp);
  else {
    const a = pic.at.get(name);
    if (a) putCells(ctx, pic.canvas, a, sp.off + sp.ox * sp.cw, sp.y, sp.cw, sp.r0, sp.r1 - sp.r0);
  }
}

export function drawCloudSky() {
  if (!ctx) return;
  work();
  for (const name of NAMES()) putAfterCloud(name);
}
