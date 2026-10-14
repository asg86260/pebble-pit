// The Steam achievement icons, "the glyph": the shelf's own drawing at six
// pixels a cell on a 64 px design (scaled four times to Steam's 256), drawn
// the way drawGlyph draws it on the shelf -- ink cells, a one-pixel stroke in
// the coin's color where the achievement is about a coin, the badge top-right
// on its finer grid (SHELF_BADGE_CELL against SHELF_GLYPH_CELL) with a halo cut
// out of the drawing under it.
//
// A rung of a ladder (rock0..rock3) wears the rung mark the shelf's rows wear:
// a column of pips down the right edge, the first rung at the foot, the ones
// reached filled and the rest rings, each pip one of the drawing's own cells.
// So a ladder reads as one drawing and no two of its rungs are the same icon.
//
// Locked is the unbuilt glyph's look: the shape's one-pixel edge in ghost, on
// the page, pips and all.
//
// A classic script with only a canvas context, injected into a headless page
// by tools/steam-art.mjs. It owns no color and no drawing: the palette comes
// in through `SteamIcons.use`, the glyph and badge rows from src/glyphs.js.
(function (root) {
const W = 64, CELL = 6, TOP = 8;
let K = null;
const use = pal => { K = pal; };

// The pip, a cell square with its corners off; the ring is its edge.
const PIP_ON = ['.####.', '######', '######', '######', '######', '.####.'];
const PIP_OFF = ['.####.', '#....#', '#....#', '#....#', '#....#', '.####.'];
const PIP_GAP = 2;   // the shelf's: a third of a pip between pips

function mask(rows, badge, ox, oy) {
  const m = new Uint8Array(W * W);
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch !== '#') return;
    for (let j = 0; j < CELL; j++) for (let i = 0; i < CELL; i++) m[(oy + y * CELL + j) * W + ox + x * CELL + i] = 1;
  }));
  if (badge) {
    const bc = CELL * K.badgeCell / K.glyphCell, halo = K.halo;
    const bx = ox + K.glyphCells * CELL - badge[0].length * bc, by = oy;
    const mk = new Uint8Array(W * W);
    badge.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') for (let j = 0; j < bc; j++) for (let i = 0; i < bc; i++) mk[(by + y * bc + j) * W + bx + x * bc + i] = 1; }));
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (mk[y * W + x]) { m[y * W + x] = 2; continue; }
      let near = false;
      for (let dy = -halo; dy <= halo && !near; dy++) for (let dx = -halo; dx <= halo; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < W && mk[ny * W + nx]) { near = true; break; } }
      if (near && m[y * W + x] === 1) m[y * W + x] = 0;
    }
  }
  return m;
}
const solid = v => v > 0;
function inkSpan(rows) {
  let lo = 8, hi = 0;
  rows.forEach(r => [...r].forEach((c, i) => { if (c === '#') { lo = Math.min(lo, i); hi = Math.max(hi, i + 1); } }));
  return [lo, hi];
}
function outside(m) {
  const out = new Uint8Array(W * W), q = [0]; out[0] = 1;
  while (q.length) { const k = q.pop(), x = k % W, y = (k - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= W) continue; const n = ny * W + nx; if (out[n] || solid(m[n])) continue; out[n] = 1; q.push(n); } }
  return out;
}
const at = (m, x, y) => x >= 0 && y >= 0 && x < W && y < W ? m[y * W + x] : 0;
function paintMask(g, m, stroke, locked) {
  const out = outside(m);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x;
    if (locked) {
      if (solid(m[k]) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !solid(at(m, x + dx, y + dy)))) { g.fillStyle = K.ghost; g.fillRect(x, y, 1, 1); }
      continue;
    }
    if (solid(m[k])) { g.fillStyle = m[k] === 2 && stroke ? stroke : K.ink; g.fillRect(x, y, 1, 1); continue; }
    if (stroke && out[k]) {
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (solid(at(m, x + dx, y + dy))) { near = true; break; }
      if (near) { g.fillStyle = stroke; g.fillRect(x, y, 1, 1); }
    }
  }
}
function pips(g, rung, of, x, foot, locked) {
  g.fillStyle = locked ? K.ghost : K.ink;
  for (let i = 0; i < of; i++) {
    const shape = i <= rung ? PIP_ON : PIP_OFF, y = foot - (i + 1) * CELL - i * PIP_GAP;
    shape.forEach((r, j) => [...r].forEach((ch, k) => { if (ch === '#') g.fillRect(x + k, y + j, 1, 1); }));
  }
}

// One icon at the 64 px design size onto a 64x64 context. `rung` is
// { at, of } for a rung of a ladder, else null.
function drawIcon(g, rows, badge, coinInk, rung, locked) {
  if (!K) throw new Error('SteamIcons.use(palette) first: the icons own no color');
  g.fillStyle = K.paper; g.fillRect(0, 0, W, W);
  const [lo, hi] = inkSpan(rows), foot = TOP + K.glyphCells * CELL;
  // The ink centered on the icon; a ladder's drawing moves left to leave the
  // right edge to its pips, its box (and the badge on it) clear of them.
  const center = rung ? 28 : 32, right = rung ? W - CELL - 4 - K.glyphCells * CELL : W;
  let ox = Math.round(center - (lo + hi) / 2 * CELL);
  ox = Math.max(1 - lo * CELL, Math.min(ox, rung ? right : W - 1 - hi * CELL));
  paintMask(g, mask(rows, badge, ox, TOP), coinInk, locked);
  if (rung) pips(g, rung.at, rung.of, W - CELL - 2, foot, locked);
}
root.SteamIcons = { W, use, drawIcon };
})(globalThis);
