// The storm press: the darkness that comes before and rides over a shower.
//
// (wave6-sky, item 5.) A shower used to arrive out of a sky that looked like it
// had a moment earlier -- the first warning was the first drop. The break rolls
// a *brew* now: `S.storming` ramps up over STORM_BREW_S before the drizzle
// begins, holds through the pour, and fades back out with the taper, and this
// is the whole of what that ramp draws -- one translucent black wash over the
// band the haze lives in. Black and white only, flat on purpose: it is not a
// material with cells and ages, it is light going out of the sky, and a wash
// with texture in it would read as a second haze rather than as the first one
// darkening.
//
// It sits immediately over the 'smog' layer, so the motes themselves darken
// with the air they hang in and everything nearer the eye -- the balloons, the
// rain -- still reads at full weight.

import { STORM_INK_MAX } from '../config.js';
import { bandLow, bandTop } from '../smog.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';

export function drawStormPress() {
  const k = S.storming || 0;
  if (k <= 0) return;
  // The wash dies away to nothing at both of its edges rather than stopping at
  // them. As one flat rect over the band it had a ruled line along the top of
  // the window and another just over the ground -- a pane of smoked glass
  // hanging in the sky, when what it is is light going out of the air. So it
  // runs the full height from the window's top to the ground line, at nothing
  // at either end and full through the stretch the band lives in. This is the
  // one gradient in the yard besides the press's vignette, and for the same
  // reason: it is not a material, it is light.
  const y0 = S.camY, y1 = S.groundY;
  const h = y1 - y0;
  if (h <= 0) return;
  const inA = Math.max(0, Math.min(1, (bandTop() - y0) / h));
  const outA = Math.max(inA, Math.min(1, (bandLow() - y0) / h));
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(inA, '#000');
  g.addColorStop(outA, '#000');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = k * STORM_INK_MAX;
  ctx.fillStyle = g;
  ctx.fillRect(S.camX, y0, S.viewW, h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
  S.dirty = true;                       // the wash is easing: keep the frames coming
}
