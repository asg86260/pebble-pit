// The boulder itself, and the chips coming off it.

import { MARK_SIZE, MAX_DEPTH, P, SQUASH_WIDE, SQUASH_FLAT, RAM_CHIP_CURL, RAM_CHIP_CURL_SPIN, RAM_CHIP_CURL_S } from '../config.js';
import { now } from '../clock.js';
import { depthShade, shadeOf } from '../grid.js';
import { depthOf, rockFootY, rockShape, lumpCells } from '../rock.js';
import { reducedMotion } from '../prefs.js';
import { S } from '../state.js';
import { rockLeft } from '../world.js';
import { ctx } from './ctx.js';
import { fillMarks, markInto } from './marks.js';

// the tone of every thickness a rock cell can hold, filled in once a frame
// rather than worked out per cell
const TONE = [];

// The rock, a run at a time rather than a cell at a time: shade *is* depth, and
// depth runs in bands across a row, so a row is three or four runs of one tone
// rather than forty `fillRect`s, and the tone of a thickness is a table of
// seven entries looked up once a frame.
export function drawRock() {
  ctx.fillStyle = '#000';

  const deep = depthOf();
  for (let v = 0; v <= MAX_DEPTH; v++) TONE[v] = shadeOf(depthShade(v, deep));
  const { round, squash } = rockShape();
  if (round > 0) return drawRoundRock(deep, squash);

  const left = rockLeft(), foot = rockFootY();
  // Wider and flatter for a moment after it lands (`rockShape`). Both scales
  // are whole cells, so the rock never leaves the lattice. A scaled grid is
  // drawn by mapping each run's *edges* and filling between them, never by
  // moving a run and leaving it its old width, or a stretch opens a hairline
  // of white between every column.
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

// A rock in the air: the lump's cells (`lumpCells` in rock.js), shaded the
// way the hill is. On the dome's crown it sits squashed for a held beat
// (`rockShape`): wider and flatter about its foot, by whole cells, mapped
// edge to edge as the hill's squash is, so no hairline opens between columns.
// Under reduced motion it keeps its own shape instead.
function drawRoundRock(deep, squash) {
  const foot = rockFootY(), left = rockLeft();
  if (squash && !reducedMotion()) {
    const n = S.gw, half = n / 2;
    const ex = i => Math.round((i - half) * (1 + SQUASH_WIDE * squash) + half);
    const ey = up => Math.round(up * (1 - SQUASH_FLAT * squash));
    for (const { x, y, v } of lumpCells()) {
      const top = ey(n - y), bot = ey(n - y - 1);
      ctx.fillStyle = TONE[v];
      ctx.fillRect(left + ex(x) * P, foot - top * P, (ex(x + 1) - ex(x)) * P, Math.max(P, (top - bot) * P));
    }
    return;
  }
  const bands = roundBands(deep);
  // Laid about the lump's own corner and moved to where it is: the shape is
  // the same every frame of one fall, and only the fall moves it.
  const x0 = left, y0 = foot - S.gw * P;
  ctx.translate(x0, y0);
  for (const [v, path] of bands) { ctx.fillStyle = TONE[v]; ctx.fill(path); }
  ctx.translate(-x0, -y0);
}

// The lump's cells, a path to each thickness, built once a fall: two thousand
// rects a frame was the frame's biggest cost for as long as a rock fell.
let lump = null;   // cache: keyed by the boulder, its width and the depth
function roundBands(deep) {
  const key = `${S.boulderNo},${S.gw},${deep}`;
  if (lump?.key === key) return lump.bands;
  const bands = new Map();
  for (const { x, y, v } of lumpCells()) {
    let path = bands.get(v);
    if (!path) bands.set(v, path = new Path2D());
    path.rect(x * P, y * P, P, P);
  }
  lump = { key, bands };
  return bands;
}

// A chip is a grain in the air, drawn as whatever it is. A crit's chip swells
// through the top of its arc, read straight off `vy`: fattest where `|vy|` is
// smallest, back to one cell at its launch speed `cv`. No apex is stored and
// no timer runs. A harder crit (`cp`) blooms fatter, tying the two tells
// together: it throws higher, so it hangs longer near the apex.
const runs = new Map();
export function drawChips() {
  // A color at a time (`markInto`): a late yard has thousands of grains in
  // the air. Off the glass is not drawn at all.
  const x0 = S.camX - P * 4, x1 = S.camX + S.viewW + P * 4;
  const y0 = S.camY - P * 4, y1 = S.camY + S.viewH + P * 4;
  const t = now(), calm = reducedMotion();
  for (const ch of S.chips) {
    if (ch.place) continue;      // a place's block, drawn by that place (render/after.js)
    if (ch.x < x0 || ch.x > x1 || ch.y < y0 || ch.y > y1) continue;
    let size = MARK_SIZE;
    if (ch.crit) {
      const slow = 1 - Math.min(1, Math.abs(ch.vy) / ch.cv);   // 0 at launch, 1 at apex
      size = P * (1 + (0.6 + 0.12 * (ch.cp || 3)) * slow);
    }
    let x = ch.x, y = ch.y;
    // A chip off the ram's cutter goes round with it for a moment first: an
    // offset on the drawing alone, so where the grain lands is untouched.
    if (ch.curl && !calm) {
      const age = (t - ch.curl) / 1000, sw = 1 - age / RAM_CHIP_CURL_S;
      if (sw > 0) {
        const a = age * RAM_CHIP_CURL_SPIN + ch.curlAt;
        x += Math.cos(a) * RAM_CHIP_CURL * P * sw;
        y += Math.sin(a) * RAM_CHIP_CURL * P * sw;
      }
    }
    markInto(runs, ch.s, Math.round(x) + P / 2, Math.round(y) + P / 2, size);
  }
  fillMarks(runs);
}
