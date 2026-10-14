// The mark that stands over a station when it has finished something: a rung
// usually lands while you are looking somewhere else, and the bar coming down
// is a signal made of nothing happening.

import { P, SHELF_GLYPH_CELLS } from '../config.js';
import { glyphFor } from '../glyphs.js';
import { S } from '../state.js';
import { tintOf } from '../upgrades.js';
import { doneAt, doneBillsAt, rowFor, DOWN_THERE } from '../works.js';
import { buildingGlyph, stackSlot, drift } from './bars.js';

// The key a fighter's station's build goes by (deep/party.js, `stationRow`).
const STATION_BUILD = 'station-';
import { ctx } from './ctx.js';
import { onPixel } from './frame.js';

// The thing that finished stays where it stood in the stack over the station
// (`drawWorkBars`), drawn whole with a tick laid over it, and the next thing
// going up lifts above it: a station that has landed three rungs since its
// board was read shows three ticked glyphs, foot to top in the order they
// landed, until somebody opens that board. The tick is what says done; the
// glyph, the one its card wears, says what.

// The tick laid over the glyph, five wide, full black haloed in white so it
// is never lost in the drawing.
const TICK = [[-2, 0], [-1, 1], [0, 0], [1, -1], [2, -2]];

// cells on the grid about the origin, a cell at nought starting on it
// Every edge on a whole device pixel at the scale it is drawn at (`onPixel`),
// so a cell or a stroke between cells is never a blend of two inks; a path
// a shape a scale.
const FILLS = new WeakMap();
const pathsOf = (map, cells) => { let m = map.get(cells); if (!m) map.set(cells, m = new Map()); return m; };
const scaleNow = () => (ctx.getTransform ? ctx.getTransform().a : S.zoom * S.dpr);
function snappedRect(path, x0, y0, x1, y1, k) {
  const at = v => Math.round(v * k) / k;
  path.rect(at(x0), at(y0), at(x1) - at(x0), at(y1) - at(y0));
}
function fillCells(cells, color) {
  const k = scaleNow(), m = pathsOf(FILLS, cells);
  let path = m.get(k);
  if (!path) {
    path = new Path2D();
    for (const [dx, dy] of cells) snappedRect(path, dx * P, dy * P, dx * P + P, dy * P + P, k);
    m.set(k, path);
  }
  ctx.fillStyle = color;
  ctx.fill(path);
}

// A line round the outside of a shape, a third of a cell thick: each ink
// cell grown by the stroke, cut to the outside cells that touch it.
// Worked out once a shape: every mark over every station is redrawn every
// frame, and the flood under it never changes.
const STROKES = new WeakMap();
function strokeCells(cells, color) {
  const k = scaleNow(), m = pathsOf(STROKES, cells);
  let path = m.get(k);
  if (!path) {
    path = new Path2D();
    const t = Math.max(1, P / 3);
    for (const [ox, oy] of outsideEdge(cells))
      for (const [dx, dy] of cells) {
        if (Math.abs(dx - ox) > 1 || Math.abs(dy - oy) > 1) continue;
        const x0 = Math.max(ox * P, dx * P - t), x1 = Math.min(ox * P + P, dx * P + P + t);
        const y0 = Math.max(oy * P, dy * P - t), y1 = Math.min(oy * P + P, dy * P + P + t);
        if (x1 > x0 && y1 > y0) snappedRect(path, x0, y0, x1, y1, k);
      }
    m.set(k, path);
  }
  ctx.fillStyle = color;
  ctx.fill(path);
}

// The empty cells round a shape that touch it from the outside, corners
// included: where its stroke goes. Flooded from a margin one cell past the
// shape's bounds, so an enclosed hole is never reached.
function outsideEdge(glyph) {
  const xs = glyph.map(([x]) => x), ys = glyph.map(([, y]) => y);
  const x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1;
  const W = x1 - x0 + 1, H = y1 - y0 + 1;
  const ink = new Uint8Array(W * H), out = new Uint8Array(W * H);
  for (const [x, y] of glyph) ink[(y - y0) * W + x - x0] = 1;
  const q = [0]; out[0] = 1;
  while (q.length) {
    const k = q.pop(), x = k % W, y = (k - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (out[n] || ink[n]) continue;
      out[n] = 1; q.push(n);
    }
  }
  const edge = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!out[y * W + x]) continue;
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && ink[ny * W + nx]) { near = true; break; }
    }
    if (near) edge.push([x + x0, y + y0]);
  }
  return edge;
}

export function drawDoneMarks() {
  for (const site in S.siteDone) {
    const bills = doneBillsAt(site);
    doneAt(site).forEach((key, i) => {
      const at = stackSlot(site, i);
      if (!at) return;
      // A board left unread for long stacks its marks up off the top of the
      // glass, and every one of them is a glyph's worth of cells.
      const reach = SHELF_GLYPH_CELLS * P;
      if (at.cy + reach < S.camY || at.cy - reach > S.camY + S.viewH ||
          at.x + reach < S.camX || at.x - reach > S.camX + S.viewW) return;
      const u = rowFor(key);
      // A fighter's station going up says only that it is done: its kind's
      // glyph meant a building, and the station is its fighter now. The tick
      // alone, twice the size, stands in the glyph's place.
      const bare = key.startsWith(STATION_BUILD);
      // In the stroke of the rung that landed, off what it was paid: the row's
      // own bill is the next rung's by now.
      // Swaying on as it did while it was building: the same drift, by the
      // same name, so finishing does not stop it still.
      const [dx, dy] = drift(site + key);
      if (!bare) buildingGlyph(at.x, at.cy, glyphFor(key), 1, u ? tintOf(u, bills[i] ? { bill: bills[i] } : null) : null, dx, dy,
                               DOWN_THERE.has(site));
      ctx.save();
      // five wide: half a cell puts it true (and twice the size, a cell);
      // on a whole device pixel, as a cell is
      const half = bare ? P : P / 2;
      ctx.translate(onPixel(at.x - half + dx), onPixel(at.cy - half + dy));
      if (bare) ctx.scale(2, 2);
      strokeCells(TICK, '#fff');
      fillCells(TICK, '#000');
      ctx.restore();
    });
  }
}

// Where a site's marks stand: the last one done, at the top of them, for the
// tip to hang off.
export function doneMarkAt(site) {
  const n = doneAt(site).length;
  if (!n) return null;
  const top = stackSlot(site, n - 1);
  return top && { x: top.x, y: top.cy };
}

// where the cursor has to be to be asking what finished; says which site
export function overDoneMark(mx, my) {
  for (const site in S.siteDone) {
    const n = doneAt(site).length;
    if (!n) continue;
    const foot = stackSlot(site, 0), top = stackSlot(site, n - 1);
    if (!foot) continue;
    if (Math.abs(mx - foot.x) < P * 6 && my > top.cy - P * 6 && my < foot.cy + P * 6) return site;
  }
  return null;
}
