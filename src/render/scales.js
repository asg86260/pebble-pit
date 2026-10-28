// The scales in the water: knocked off the serpent and sinking to the floor
// (chips of the place 'deep', stepChips; `S.sinking` the tossed), and paid, rising off the bed to the station that took them
// (`S.lifting`). The ones lying on the floor are the bed's, drawn by its
// painter (render/deep.js, `drawDeepBed`).
//
// A scale is a grain of the bed, so it is drawn as one: a cell in the bed's
// own shade, which the deep's inversion turns pale. What says it is a scale
// and not a grain is that it flutters: turning as it sinks, it is seen
// edge-on for a moment on its own clock, a sliver of a cell rather than a
// cell.
//
// A scale over the crusher is going into its funnel or coming up out of it,
// so it is drawn behind the furnace, before it stands: it drops out of sight
// past the rim rather than sliding down the funnel's face.

import { now } from '../clock.js';
import { P, FANG_SPRITE } from '../config.js';
import { shadeOf } from '../grid.js';
import { S } from '../state.js';
import { crusherRect } from '../deep/place.js';
import { ctx } from './ctx.js';
import { fillOnPixels } from './frame.js';
import { GREYS } from './deeptones.js';
import { perPage } from '../ink.js';

const EDGE = Math.max(1, Math.round(P / 3));   // a scale seen edge-on
const FLUTTER_MS = 520;

function overCrusher(m, c) {
  return c && m.x + P > c.x && m.x < c.x + c.w && m.y + P > c.y && m.y < c.y + c.h;
}

// `only` keeps a chip list to the water's own (the one air carries every
// place's goods; a scale in the water is the chip of the place 'deep').
function drawFlutter(list, behind, only = null) {
  const t = now();
  const c = S.snatched ? crusherRect() : null;
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    if (only && m.place !== only) continue;
    if (overCrusher(m, c) !== behind) continue;
    const x = Math.round(m.x), y = Math.round(m.y);
    ctx.fillStyle = typeof m.s === 'number' ? shadeOf(m.s) : '#000';
    // each on its own phase, off where it is, so a shower does not flip in step
    const edge = Math.sin(t / FLUTTER_MS * Math.PI * 2 + x * 0.7 + i) > 0.6;
    if (edge) fillOnPixels(ctx, x, y + Math.floor((P - EDGE) / 2), P, EDGE);
    else fillOnPixels(ctx, x, y, P, P);
  }
  ctx.fillStyle = '#000';
}

// The fang (docs/wave-party.md): a white fang of a few cells, point down,
// dropped at a phase's break. It sinks and lies on the floor like a scale
// and is carried like one, in a gatherer's arms over its head
// (`S.fangsLoose`, deep/party.js: (x, y) its foot's middle). Heavier than a
// scale, it does not flutter: it goes down whole, a rigid few cells at
// whole pixels, and lying still it is on the cell grid.
const FANG_TONE = {};
perPage(() => Object.assign(FANG_TONE, { '#': GREYS[GREYS.length - 1], '+': GREYS[GREYS.length - 3] }));   // the deep's ramp turns with the page
const FANG_W = FANG_SPRITE[0].length * P, FANG_H = FANG_SPRITE.length * P;
export function drawFang(f) {
  let x = f.x - FANG_W / 2, y = f.y - FANG_H;
  x = f.rest ? Math.round(x / P) * P : Math.round(x);
  y = f.rest ? Math.round(y / P) * P : Math.round(y);
  FANG_SPRITE.forEach((row, r) => [...row].forEach((ch, c) => {
    if (!FANG_TONE[ch]) return;
    ctx.fillStyle = FANG_TONE[ch];
    fillOnPixels(ctx, x + c * P, y + r * P, P, P);
  }));
  ctx.fillStyle = '#000';
}

export const drawSinking = () => {
  drawFlutter(S.sinking, false);
  drawFlutter(S.chips, false, 'deep');
  for (const f of S.fangsLoose || []) drawFang(f);
};
export const drawLifting = () => drawFlutter(S.lifting, false);
export const drawIntoCrusher = () => { drawFlutter(S.sinking, true); drawFlutter(S.chips, true, 'deep'); drawFlutter(S.lifting, true); };
