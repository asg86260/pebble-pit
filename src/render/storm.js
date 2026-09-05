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
  const top = bandTop();
  ctx.globalAlpha = k * STORM_INK_MAX;
  ctx.fillStyle = '#000';
  ctx.fillRect(S.camX, top, S.viewW, bandLow() - top);
  ctx.globalAlpha = 1;
  S.dirty = true;                       // the wash is easing: keep the frames coming
}
