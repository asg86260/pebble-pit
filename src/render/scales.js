// The scales in the water: knocked off the serpent and sinking to the floor
// (`S.sinking`), and paid, rising off the bed to the station that took them
// (`S.lifting`). The ones lying on the floor are the bed's, drawn by its
// painter (render/deep.js, `drawDeepBed`).
//
// A scale is a grain of the bed, so it is drawn as one: a cell in the bed's
// own shade, which the deep's inversion turns pale. What says it is a scale
// and not a grain is that it flutters: turning as it sinks, it is seen
// edge-on for a moment on its own clock, a sliver of a cell rather than a
// cell.

import { now } from '../clock.js';
import { P } from '../config.js';
import { shadeOf } from '../grid.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';

const EDGE = Math.max(1, Math.round(P / 3));   // a scale seen edge-on
const FLUTTER_MS = 520;

function drawFlutter(list) {
  const t = now();
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const x = Math.round(m.x), y = Math.round(m.y);
    ctx.fillStyle = typeof m.s === 'number' ? shadeOf(m.s) : '#000';
    // each on its own phase, off where it is, so a shower does not flip in step
    const edge = Math.sin(t / FLUTTER_MS * Math.PI * 2 + x * 0.7 + i) > 0.6;
    if (edge) ctx.fillRect(x, y + Math.floor((P - EDGE) / 2), P, EDGE);
    else ctx.fillRect(x, y, P, P);
  }
  ctx.fillStyle = '#000';
}

export const drawSinking = () => drawFlutter(S.sinking);
export const drawLifting = () => drawFlutter(S.lifting);
