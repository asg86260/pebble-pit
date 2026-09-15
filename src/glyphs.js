// The objects on the shelf: one small sprite a row, in the yard's own alphabet
// ('#' rows, see sprites.js), eight cells square, drawn to a canvas at
// SHELF_GLYPH_CELL screen pixels a cell so it is crisp at any zoom.
//
// A glyph is the thing, never the effect: a sack for carry, the hat the kit
// sells, a machine's mark for a machine, a crate for a build. Everything here
// is a placeholder until the set is drawn as a batch against shelf.html; a
// row with no glyph of its own gets the crate, so a missing one is visible on
// the shelf rather than a blank.
import { SHELF_GLYPH_CELL as CELL, SHELF_GLYPH_CELLS as CELLS, SHELF_INK } from './config.js';

export const GLYPHS = {
  carry:      ['...##...', '..#..#..', '.######.', '#......#', '#......#', '#......#', '#......#', '.######.'],
  auto:       ['....#...', '...##...', '..###...', '.####...', '#####...', '.####...', '..###...', '....#...'],
  speed:      ['......##', '.....##.', '....##..', '...##...', '..##....', '.###....', '####....', '.##.....'],
  pick:       ['.....###', '....####', '...##.#.', '..##....', '.##.....', '##......', '#.......', '........'],
  critchance: ['...#....', '...#....', '.#.#.#..', '..###...', '#######.', '..###...', '.#.#.#..', '...#....'],
  critmult:   ['#......#', '.#....#.', '..#..#..', '...##...', '...##...', '..#..#..', '.#....#.', '#......#'],
  haulcarry:  ['...##...', '..####..', '.######.', '#......#', '#.####.#', '#......#', '#......#', '.######.'],
  haulpace:   ['......##', '.....###', '....####', '...#####', '..######', '.#..##..', '#...##..', '....##..'],
  carter:     ['........', '.######.', '.#....#.', '.#....#.', '########', '#......#', '.#....#.', '..#..#..'],
  belt:       ['........', '........', '.######.', '#......#', '.######.', '.#....#.', '..#..#..', '........'],
  tunebelt:   ['..#.....', '.###....', '..#.....', '..#.....', '.######.', '#......#', '.######.', '........'],
  crate:      ['...##...', '..####..', '.######.', '########', '#......#', '#.#..#.#', '#......#', '########'],
  shield:     ['#.#.#.#.', '########', '#......#', '#.####.#', '#.#..#.#', '#.####.#', '#......#', '########'],
  hat:        ['........', '...##...', '..####..', '.######.', '########', '........', '........', '........'],
};

// Which glyph a row wears when it has none of its own.
export const glyphFor = key =>
  GLYPHS[key] ||
  (key.startsWith('unlock') ? GLYPHS.crate :
   ['breaker', 'blaster', 'grower'].includes(key) ? GLYPHS.hat :
   ['props', 'net', 'arch', 'askwizards'].includes(key) ? GLYPHS.shield :
   GLYPHS.crate);

// The drawn cells' left and right edge, in cells: what the glyph is centered on.
// A sprite's box is eight wide; its ink is often narrower and off to one side,
// and a box centered under a name puts the ink off center.
export const inkSpan = rows => {
  let lo = CELLS, hi = 0;
  rows.forEach(r => [...r].forEach((c, x) => { if (c === '#') { lo = Math.min(lo, x); hi = Math.max(hi, x + 1); } }));
  return [lo, hi];
};

// The glyph as a canvas: black cells, and a one-pixel stroke in `tint` round
// the outside of the shape only. Outside is found by flooding from the margin,
// so a hole in the shape -- the carter's window, the belt's slots -- stays
// white rather than filling with color. `tint` null is no stroke; `done` draws
// the shape itself grey.
export const drawGlyph = (rows, tint = null) => {
  const M = 2, W = CELLS * CELL + 2 * M, H = CELLS * CELL + 2 * M;
  const c = document.createElement('canvas');
  c.width = W; c.height = H; c.className = 'glyph';
  const g = c.getContext('2d');
  const solid = new Uint8Array(W * H);
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch !== '#') return;
    for (let j = 0; j < CELL; j++) for (let i = 0; i < CELL; i++) solid[(y * CELL + j + M) * W + x * CELL + i + M] = 1;
  }));
  if (tint && tint !== SHELF_INK.done) {
    const out = new Uint8Array(W * H); const q = [0]; out[0] = 1;
    while (q.length) {
      const k = q.pop(), x = k % W, y = (k - x) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (out[n] || solid[n]) continue;
        out[n] = 1; q.push(n);
      }
    }
    g.fillStyle = tint;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!out[y * W + x]) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && solid[ny * W + nx]) { near = true; break; }
      }
      if (near) g.fillRect(x, y, 1, 1);
    }
  }
  g.fillStyle = tint === SHELF_INK.done ? tint : '#000';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (solid[y * W + x]) g.fillRect(x, y, 1, 1);
  // Centered on the ink: the canvas's left edge sits on the tile's center
  // line, and this pulls it left by exactly the ink's half-width.
  const [lo, hi] = inkSpan(rows);
  c.style.marginLeft = `${-(M + (lo + hi) / 2 * CELL)}px`;
  return c;
};
