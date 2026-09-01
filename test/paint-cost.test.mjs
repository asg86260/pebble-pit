// What the pile costs to draw when almost none of it has moved.
//
// The painter's job is to push only what changed onto its scratch canvas. It
// used to keep one bounding box of everything `mark` had named since the last
// paint, and a box is the wrong shape for a pile: two grains landing at opposite
// ends of the hole are two cells changed and a box the full width of the plot.
//
// Measured on a pressed hole with two hundred thousand dust in it, the box came
// to 1749 cells on an ordinary frame and 20,859 on its worst -- so it was never
// rewriting the whole 383,400-cell plot every frame, and it was not what made
// the endgame slow. The bad frames are paying for something: that lifts grains
// off the top of the pile along the whole length of it, and a box round that is
// the width of the hole. Tiled, the same frame is 2344 cells and the ordinary
// one is 576.
//
// So this is written as a fact about the code rather than as a stopwatch
// reading: `paintWork()` counts the cells the painter has actually rewritten,
// the way `settleWork()` counts the columns `settle` has looked at.
//
// And the cheap half is paired with the correct half, because a painter that
// rewrites nothing is very fast and quite wrong. Every check that the work is
// small is followed by one that the glass ends up holding exactly what a painter
// starting from scratch would have put there.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDom } from '../tools/node/dom.mjs';

installDom();

const { makePainter, paintWork, resetPaintWork } = await import('../src/painter.js');
const { SHADES } = await import('../src/config.js');

// The hole at its finest grain: 3600 world pixels across and 276 + 150 deep,
// two pixels to a cell. The size the endgame actually reaches.
const COLS = 1800, ROWS = 213;

const newGrid = (cols = COLS, rows = ROWS) => ({
  cols, rows, p: 2, x: 0, y: 0, grid: new Uint8Array(cols * rows)
});

// A pile in the bottom of it, with a lumpy top -- the shape of dust, not a
// rectangle, so a tile in the middle of the surface differs from its neighbors.
function fill(b) {
  for (let c = 0; c < b.cols; c++) {
    const h = 40 + ((c * 7919) % 23);
    for (let r = 0; r < h; r++) b.grid[r * b.cols + c] = 1 + ((c + r) % SHADES.length);
  }
}

// A painter, plus the ImageData it writes into, so a check can read the glass.
// The scratch canvas hands out a fresh context per `getContext` in the shim, and
// the painter keeps the first one it is given; both are pinned here.
function painterFor(b) {
  const images = [];
  const orig = document.createElement;
  document.createElement = tag => {
    const el = orig(tag);
    const ctx = el.getContext('2d');
    el.getContext = () => ctx;
    const make = ctx.createImageData;
    ctx.createImageData = (w, h) => {
      const im = make(w, h);
      images.push(im);
      return im;
    };
    return el;
  };
  const p = makePainter(b);
  document.createElement = orig;
  return { p, glass: () => images[images.length - 1] };
}

const into = () => document.createElement('canvas').getContext('2d');

// what a painter that has never seen this grid before would put on the glass
function fromScratch(b) {
  const { p, glass } = painterFor(b);
  p.paint(into(), 0, 0, b.cols, b.rows);
  return Uint8Array.from(glass().data);
}

// Whether two sheets of glass show the same thing.
//
// Not a byte compare, because a clear pixel is only clear in its alpha: an empty
// cell is written as alpha nought and the three color bytes are left wherever
// the last grain there left them -- which costs three writes a cell to tidy up
// and shows nobody anything. So a pixel nothing can be seen through matches any
// other pixel nothing can be seen through, and every visible one must match to
// the byte.
function sameGlass(had, want, what) {
  assert.equal(had.length, want.length, `${what}: different sized glass`);
  for (let i = 0; i < had.length; i += 4) {
    if (had[i + 3] === 0 && want[i + 3] === 0) continue;
    for (let k = 0; k < 4; k++) {
      if (had[i + k] === want[i + k]) continue;
      const px = i / 4;
      assert.fail(`${what}: pixel ${px} differs (${had.slice(i, i + 4)} vs ${want.slice(i, i + 4)})`);
    }
  }
}

test('the first paint pushes the whole plot across', () => {
  const b = newGrid();
  fill(b);
  const { p } = painterFor(b);
  resetPaintWork();
  p.paint(into(), 0, 0, b.cols, b.rows);
  // Nothing on the glass yet, so every cell is owed one write and no more.
  assert.equal(paintWork(), COLS * ROWS);
});

test('a quiet plot costs nothing to paint', () => {
  const b = newGrid();
  fill(b);
  const { p } = painterFor(b);
  p.paint(into(), 0, 0, b.cols, b.rows);
  resetPaintWork();
  for (let i = 0; i < 10; i++) p.paint(into(), 0, 0, b.cols, b.rows);
  assert.equal(paintWork(), 0, 'ten frames of a pile nobody touched');
});

test('two grains at opposite ends do not drag the plot between them along', () => {
  const b = newGrid();
  fill(b);
  const { p, glass } = painterFor(b);
  p.paint(into(), 0, 0, b.cols, b.rows);

  // One grain by the near lip and one at the far end -- the case the bounding
  // box could not tell from the whole hole changing.
  const put = (c, r, v) => { b.grid[r * b.cols + c] = v; p.mark(c, r); };
  put(3, 60, 2);
  put(b.cols - 4, 61, 2);

  resetPaintWork();
  p.paint(into(), 0, 0, b.cols, b.rows);

  // Two tiles' worth at the very most, against 383,400 for the plot.
  assert.ok(paintWork() <= 2 * 8 * 8,
    `rewrote ${paintWork()} cells to move two grains`);
  assert.ok(paintWork() < COLS * ROWS / 100,
    `${paintWork()} is not a small share of ${COLS * ROWS}`);

  // And the glass says what it would have said the long way round.
  sameGlass(glass().data, fromScratch(b), 'the two grains are on the glass');
});

test('a busy frame all over the plot still lands the right pixels', () => {
  const b = newGrid();
  fill(b);
  const { p, glass } = painterFor(b);
  p.paint(into(), 0, 0, b.cols, b.rows);

  // Grains landing, grains lifted, and finds among them -- everywhere at once,
  // including the last row and column, which is where a tile is clipped.
  let seed = 12345;
  const rnd = n => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n);
  for (let i = 0; i < 4000; i++) {
    const c = rnd(b.cols), r = rnd(b.rows);
    b.grid[r * b.cols + c] = rnd(2) ? 0 : 1 + rnd(SHADES.length + 6);
    p.mark(c, r);
  }
  for (const [c, r] of [[0, 0], [b.cols - 1, 0], [0, b.rows - 1], [b.cols - 1, b.rows - 1]]) {
    b.grid[r * b.cols + c] = 3;
    p.mark(c, r);
  }
  p.paint(into(), 0, 0, b.cols, b.rows);
  sameGlass(glass().data, fromScratch(b), 'the glass matches a fresh painter');
});

test('a repaint pushes the whole plot again', () => {
  const b = newGrid(200, 64);
  fill(b);
  const { p, glass } = painterFor(b);
  p.paint(into(), 0, 0, b.cols, b.rows);

  // The grid changed out from under the painter -- loaded, refilled, repacked --
  // so nothing it was told about is worth anything.
  b.grid.fill(0);
  fill(b);
  b.grid[5] = 0;
  p.repaint();

  resetPaintWork();
  p.paint(into(), 0, 0, b.cols, b.rows);
  assert.equal(paintWork(), 200 * 64);
  sameGlass(glass().data, fromScratch(b), 'the glass matches a fresh painter');
});

test('a plot that changes shape starts over on a clean glass', () => {
  const b = newGrid(200, 64);
  fill(b);
  const { p, glass } = painterFor(b);
  p.paint(into(), 0, 0, b.cols, b.rows);

  // What `refinePit` does: a new grid of a new shape in the same painter's
  // hands. The scratch canvas is resized, which empties it, so every tile is
  // owed a write however few of them were marked.
  const wide = newGrid(400, 128);
  fill(wide);
  b.cols = wide.cols; b.rows = wide.rows; b.grid = wide.grid;
  p.mark(0, 0);

  resetPaintWork();
  p.paint(into(), 0, 0, b.cols, b.rows);
  assert.equal(paintWork(), 400 * 128);
  sameGlass(glass().data, fromScratch(b), 'the glass matches a fresh painter');
});
