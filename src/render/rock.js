// The boulder itself, and the chips coming off it.

import { MARK_SIZE, MAX_DEPTH, P, SQUASH_WIDE, SQUASH_FLAT } from '../config.js';
import { depthShade, shadeOf } from '../grid.js';
import { depthOf, rockFootY, rockShape } from '../rock.js';
import { S } from '../state.js';
import { rockLeft } from '../world.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';

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
  if (round > 0) return drawRoundRock(deep);

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

// A rock in the air: round, but not a circle, which would be a ball. The rim is
// knocked about by three sines of the angle, seeded off the boulder's own
// number so it is the same lump every frame of one fall. Shaded the way the
// hill is, so the two are plainly the same object; it carries no mining.
function drawRoundRock(deep) {
  const foot = rockFootY(), left = rockLeft();
  const bands = roundBands(deep);
  // Laid about the lump's own corner and moved to where it is: the shape is
  // the same every frame of one fall, and only the fall moves it.
  const x0 = left, y0 = foot - S.gw * P;
  ctx.translate(x0, y0);
  for (const [v, path] of bands) { ctx.fillStyle = TONE[v]; ctx.fill(path); }
  ctx.translate(-x0, -y0);
}

// The lump's cells, a path to each thickness, worked out once a fall: a cell
// is a root, an arctangent and three sines, and a late rock is two thousand
// of them, which was the frame's biggest cost for as long as it was falling.
let lump = null;
function roundBands(deep) {
  const key = `${S.boulderNo},${S.gw},${deep}`;
  if (lump?.key === key) return lump.bands;
  const R = S.gw / 2;
  const seed = S.boulderNo * 1.7;
  const rim = ang => 1 + 0.07 * Math.sin(ang * 3 + seed)
                       + 0.05 * Math.sin(ang * 5.7 - seed * 2)
                       + 0.03 * Math.sin(ang * 9.1 + seed * 3);
  const bands = new Map();
  for (let y = 0; y < S.gw; y++) {
    for (let x = 0; x < S.gw; x++) {
      const dx = x + 0.5 - R, dy = y + 0.5 - R;
      const d = Math.hypot(dx, dy) / R / rim(Math.atan2(dy, dx));
      if (d > 1) continue;
      // The bands are dithered cell by cell off a hash of where the cell is,
      // or each band's edge runs flat through the middle like contours on a
      // map. Hashed, not random: the same speckle every frame of one fall, or
      // the whole face shimmers.
      const jit = ((((x * 73) ^ (y * 151) ^ (S.boulderNo * 41)) % 7) - 3) * 0.13;
      const v = Math.max(1, Math.min(deep, Math.round(deep * Math.sqrt(1 - d * d) + jit)));
      let path = bands.get(v);
      if (!path) bands.set(v, path = new Path2D());
      path.rect(x * P, y * P, P, P);
    }
  }
  lump = { key, bands };
  return bands;
}

// A chip is a grain in the air, drawn as whatever it is. A crit's chip swells
// through the top of its arc, read straight off `vy`: fattest where `|vy|` is
// smallest, back to one cell at its launch speed `cv`. No apex is stored and
// no timer runs. A harder crit (`cp`) blooms fatter, tying the two tells
// together: it throws higher, so it hangs longer near the apex.
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
