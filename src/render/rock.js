// The boulder itself, and the chips coming off it. Lifted out of the frame's
// own body in render.js; behavior unchanged. Owns drawRock and drawChips. ctx
// comes from ./ctx.js and the mark from ./marks.js.

import { MARK_SIZE, MAX_DEPTH, P } from '../config.js';
import { depthShade, shadeOf } from '../grid.js';
import { depthOf, rockFootY } from '../rock.js';
import { S } from '../state.js';
import { rockLeft } from '../world.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';

// the tone of every thickness a rock cell can hold, filled in once a frame
// rather than worked out per cell. See the rock's pass below.
const TONE = [];

// The rock, a run at a time rather than a cell at a time.
//
// A rock is up to forty cells across and twenty deep, and this used to be
// eight hundred separate `fillRect`s with a `cellPos` object allocated for
// each one -- the most expensive thing in the whole frame, and by some way:
// measured at 0.12 ms on a yard with nothing else in it.
//
// But shade *is* depth, and depth runs in bands across a row. A row of a rock
// is three or four runs of one tone, not forty cells of it, so each run goes
// down as one `fillRect` and the whole rock is a few dozen calls. The tone of
// a thickness is looked up once a frame rather than worked out per cell for
// the same reason: neither `depthShade` nor `shadeOf` knows anything a table
// of seven entries does not.
export function drawRock() {
  ctx.fillStyle = '#000';

  const deep = depthOf();
  for (let v = 0; v <= MAX_DEPTH; v++) TONE[v] = shadeOf(depthShade(v, deep));
  const left = rockLeft(), foot = rockFootY();
  let shade = null;
  for (let y = 0; y < S.gh; y++) {
    const row = S.boulder[y], py = foot - (S.gh - y) * P;
    let x = 0;
    while (x < S.gw) {
      if (!row[x]) { x++; continue; }
      const tone = TONE[row[x]];
      let e = x + 1;
      while (e < S.gw && row[e] && TONE[row[e]] === tone) e++;
      if (tone !== shade) { shade = tone; ctx.fillStyle = tone; }
      ctx.fillRect(left + x * P, py, (e - x) * P, P);
      x = e;
    }
  }
}

// a chip is a grain in the air, drawn as whatever it is -- and a crit's chip
// swells through the top of its arc. The apex is where the grain is slowest
// vertically, so the swell is read straight off `vy`: fattest where `|vy|` is
// smallest (near nothing at the top), back to one cell where it is fastest
// (its launch speed `cv`). No apex is stored and no per-grain timer runs -- it
// is a number worked out from `vy` the same frame it is drawn. A harder crit
// (`cp`) blooms fatter, which ties the two tells together: it throws higher,
// so it hangs longer near the slow apex, so it is both higher and fatter.
export function drawChips() {
  ctx.fillStyle = '#000';

  for (const ch of S.chips) {
    let size = MARK_SIZE;
    if (ch.crit) {
      const slow = 1 - Math.min(1, Math.abs(ch.vy) / ch.cv);   // 0 at launch, 1 at apex
      size = P * (1 + (0.6 + 0.12 * (ch.cp || 3)) * slow);
    }
    drawMark(ch.s, Math.round(ch.x) + P / 2, Math.round(ch.y) + P / 2, size);
  }
  ctx.fillStyle = '#000';
}
