// Her charge in the first trip down (abyssintro.js): speed lines trailing
// back along her way, held with each pose of it, bright at her and greying
// off as a heavy blow's do (render/attacks.js, `speed`), a cell longer so
// they read over the deep's motes. Behind her, so the body reads on top.

import { P, WORKER } from '../config.js';
import { GREYS, cell } from '../deep/kits.js';
import { charging } from '../abyssintro.js';
import { ctx } from './ctx.js';
import { perPage } from '../ink.js';

const TONES = [];
perPage(() => TONES.splice(0, 4, GREYS[11], GREYS[10], GREYS[8], GREYS[6]));   // the deep's ramp turns with the page
const LINES = [-1, 1, 0];          // cells off her way, either side and down its middle
const LEN = 6;                     // cells a line trails

export function drawCharge() {
  const c = charging();
  if (!c || !c.from) return;
  const { w, from } = c;
  const dx = w.x - from.x, dy = w.y - from.y, d = Math.hypot(dx, dy);
  if (d < P) return;
  const ux = dx / d, uy = dy / d;
  // her middle, in cells, and the way back along her charge
  const cx = (w.x + WORKER / 2) / P, cy = (w.y + WORKER / 2) / P;
  for (const [i, off] of LINES.entries()) {
    const start = 2 + (i % 2);
    for (let j = 0; j < LEN; j++) {
      const r = start + j;
      cell(ctx, Math.round(cx - ux * r - uy * off * 2), Math.round(cy - uy * r + ux * off * 2), TONES[Math.min(TONES.length - 1, Math.floor(j * TONES.length / LEN) + (i % 2))]);
    }
  }
}
