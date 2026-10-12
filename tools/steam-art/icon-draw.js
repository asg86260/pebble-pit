// Style 1, "the glyph", of the Steam achievement icons: the shelf's own
// drawing at six pixels a cell on a 64 px design, a one-pixel stroke in the
// coin's color where the achievement is about a coin, the shelf's badge cut in
// top-right. Locked is the drawing's one-pixel outline in ghost grey on a grey
// ground. A classic script with only a canvas context, injected into a
// headless page by tools/steam-art.mjs; glyph and badge rows are passed in
// from src/glyphs.js, never copied here.
(function (root) {
const W = 64, CELL = 6;

function mask(rows, badge, cell, ox, oy) {
  const m = new Uint8Array(W * W);
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch !== '#') return;
    for (let j = 0; j < cell; j++) for (let i = 0; i < cell; i++) m[(oy + y * cell + j) * W + ox + x * cell + i] = 1;
  }));
  if (badge) {
    const bc = Math.max(1, Math.round(cell * .6)), bx = ox + 8 * cell - 5 * bc, by = oy;
    const mk = new Uint8Array(W * W);
    badge.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') for (let j = 0; j < bc; j++) for (let i = 0; i < bc; i++) mk[(by + y * bc + j) * W + bx + x * bc + i] = 1; }));
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (mk[y * W + x]) { m[y * W + x] = 2; continue; }
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < W && mk[ny * W + nx]) { near = true; break; } }
      if (near && m[y * W + x] === 1) m[y * W + x] = 0;
    }
  }
  return m;
}
const solid = v => v > 0;
// The left edge that centers a drawing's ink (not its box) on x, as the shelf does.
function inkLeft(rows, cell, x) {
  let lo = 8, hi = 0;
  rows.forEach(r => [...r].forEach((c, i) => { if (c === '#') { lo = Math.min(lo, i); hi = Math.max(hi, i + 1); } }));
  return Math.round(x - (lo + hi) / 2 * cell);
}
function outside(m) {
  const out = new Uint8Array(W * W), q = [0]; out[0] = 1;
  while (q.length) { const k = q.pop(), x = k % W, y = (k - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= W) continue; const n = ny * W + nx; if (out[n] || solid(m[n])) continue; out[n] = 1; q.push(n); } }
  return out;
}
function paintMask(g, m, ink, stroke, ghost, locked) {
  const out = outside(m);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x;
    if (locked) {
      if (solid(m[k]) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !solid(m[(y + dy) * W + x + dx]))) { g.fillStyle = ghost; g.fillRect(x, y, 1, 1); }
      continue;
    }
    if (solid(m[k])) { g.fillStyle = m[k] === 2 && stroke ? stroke : ink; g.fillRect(x, y, 1, 1); continue; }
    if (stroke && out[k]) {
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const n = (y + dy) * W + x + dx; if (n >= 0 && n < W * W && solid(m[n])) { near = true; break; } }
      if (near) { g.fillStyle = stroke; g.fillRect(x, y, 1, 1); }
    }
  }
}
// One icon at the 64 px design size onto a 64x64 context.
function drawIcon(g, rows, badge, coinInk, ghost, locked) {
  g.fillStyle = locked ? '#ededeb' : '#ffffff'; g.fillRect(0, 0, W, W);
  const m = mask(rows, badge, CELL, Math.min(16, Math.max(2, inkLeft(rows, CELL, 32))), 8);
  paintMask(g, m, '#141414', coinInk, ghost, locked);
}
root.SteamIcons = { W, drawIcon };
})(globalThis);
