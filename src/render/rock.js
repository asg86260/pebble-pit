// The boulder itself, and the chips coming off it. Lifted out of the frame's
// own body in render.js; behavior unchanged. Owns drawRock and drawChips. ctx
// comes from ./ctx.js and the mark from ./marks.js.

import { MARK_SIZE, MAX_DEPTH, P, SQUASH_WIDE, SQUASH_FLAT } from '../config.js';
import { depthShade, shadeOf } from '../grid.js';
import { depthOf, rockFootY, rockShape } from '../rock.js';
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
  const { round, squash } = rockShape();
  if (round > 0) return drawRoundRock(deep);

  const left = rockLeft(), foot = rockFootY();
  // Wider and flatter for a moment after it lands, easing back to itself --
  // see `rockShape`. Both scales are whole cells, so the rock never leaves the
  // lattice: a boulder drawn at a fraction of a cell is a boulder with a soft
  // edge, and this one is made of pixels like everything else.
  //
  // A scaled grid is drawn by mapping each run's *edges* and filling between
  // them, never by moving a run and leaving it its old width. Move it and a
  // stretch opens a hairline of white between every column.
  const half = S.gw / 2;
  const ex = i => Math.round((i - half) * (1 + SQUASH_WIDE * squash) + half);
  const ey = j => Math.round(j * (1 - SQUASH_FLAT * squash));
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
      if (!squash) ctx.fillRect(left + x * P, py, (e - x) * P, P);
      else {
        const top = ey(S.gh - y), bot = ey(S.gh - y - 1);
        ctx.fillRect(left + ex(x) * P, foot - top * P,
                     (ex(e) - ex(x)) * P, Math.max(P, (top - bot) * P));
      }
      x = e;
    }
  }
}

// A rock in the air: round, and nothing about it flat -- but not a circle. A
// circle is a ball, and a ball is a different object from the cragged hill it
// turns into on the ground. So the rim is knocked about by three sines of the
// angle, the same trick the crest is roughed with in `makeBoulder`, seeded off
// the boulder's own number so it is the same lump every frame of one fall and
// a different one for the next rock.
//
// It is shaded the way the hill is -- deepest through the middle, thinning to
// the rim -- so the two shapes are plainly the same object. It carries no
// mining, because a rock that is still falling has never been touched.
function drawRoundRock(deep) {
  const R = S.gw / 2;
  const foot = rockFootY(), left = rockLeft();
  const seed = S.boulderNo * 1.7;
  const rim = ang => 1 + 0.07 * Math.sin(ang * 3 + seed)
                       + 0.05 * Math.sin(ang * 5.7 - seed * 2)
                       + 0.03 * Math.sin(ang * 9.1 + seed * 3);
  let shade = null;
  for (let y = 0; y < S.gw; y++) {
    const py = foot - (S.gw - y) * P;
    for (let x = 0; x < S.gw; x++) {
      const dx = x + 0.5 - R, dy = y + 0.5 - R;
      const d = Math.hypot(dx, dy) / R / rim(Math.atan2(dy, dx));
      if (d > 1) continue;
      // The bands are dithered, cell by cell, off a hash of where the cell is.
      // Without it each band's edge runs flat for long stretches -- the depth
      // changes slowest through the middle -- and the rock came down with
      // straight lines through it, like contours on a map. The landed hill's
      // bands are ragged because mining makes them so; a falling rock has no
      // mining, so the raggedness has to be dealt. Hashed, not random: the
      // same speckle every frame of one fall, or the whole face shimmers.
      const jit = ((((x * 73) ^ (y * 151) ^ (S.boulderNo * 41)) % 7) - 3) * 0.13;
      const tone = TONE[Math.max(1, Math.min(deep,
                     Math.round(deep * Math.sqrt(1 - d * d) + jit)))];
      if (tone !== shade) { shade = tone; ctx.fillStyle = tone; }
      ctx.fillRect(left + x * P, py, P, P);
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
