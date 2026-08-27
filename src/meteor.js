// The meteor: the one thing in this game that is not on the ground.
//
// It hangs in the far sky past the farm, and it is a rock like the one in the
// yard is a rock -- cells you take off one at a time until there are none left.
// A grey rind, and a red core under it. The rind is dust, which falls and lands
// and is fetched like every other grain in the yard; the core is sparks, the one
// thing here that comes from nowhere else.
//
// Nobody on the ground can reach it. That is the whole point of it, and the
// whole point of the tower: a wizard is a body with a hat that lets it leave the
// ground, and until the tower has made one the sky is scenery.
//
// It runs out. When the last cell is off, the sky is empty for a while and then
// another one drifts in -- so the job is a thing that comes round rather than a
// tap that never stops.

import { P, METEOR_CORE, METEOR_GRAINS, METEOR_AGAIN, SPARK_CELL, someFind } from './config.js';
import { S, sky } from './state.js';
import { now } from './clock.js';
import { spawnChip, bell } from './dust.js';

// what a cell of it is
export const RIND = 1, CORE = 2;

const at = (c, r) => sky.cells[r * sky.cols + c];
const put = (c, r, v) => {
  const i = r * sky.cols + c;
  if (sky.cells[i] && !v) sky.n--;
  else if (!sky.cells[i] && v) sky.n++;
  sky.cells[i] = v;
};

// Where a cell of it is in the world, on the lattice like everything else here.
//
// Snapped, and that is the whole of why the meteor read as a grid of squares
// rather than as a rock. The disc is an odd number of cells across, so laying it
// out from its own middle put its left edge half a cell off the lattice -- and
// half a cell is a fraction of a device pixel, which draws every cell against
// its neighbour with a hairline of grey between them. Every other thing in this
// yard made of cells is anchored on a whole one; this one was not.
const originX = () => Math.round((sky.x - sky.cols * sky.p / 2) / P) * P;
const originY = () => Math.round((sky.y - sky.rows * sky.p / 2) / P) * P;
export const cellX = c => originX() + c * sky.p;
export const cellY = r => originY() + r * sky.p;

export const meteorAlive = () => S.meteorOpen && sky.n > 0;

// A new one, filled in from the middle out: a disc of rind with a core in it.
// Anything outside the circle is nothing at all, so what you see is a round
// thing rather than a square one with corners knocked off.
export function makeMeteor() {
  const n = Math.max(3, Math.round(sky.r * 2 / P));
  sky.cols = sky.rows = n;
  sky.cells = new Uint8Array(n * n);
  sky.n = 0;
  const mid = (n - 1) / 2;
  const core = mid * METEOR_CORE;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const d = Math.hypot(c - mid, r - mid);
      if (d > mid + 0.1) continue;
      put(c, r, d <= core ? CORE : RIND);
    }
  }
  S.dirty = true;
}

// The cell a wizard takes next: the one furthest out from the middle, and of
// those the nearest to the body doing the taking.
//
// Furthest out first is what makes this a rind and a core rather than a bag of
// two colours. Working from wherever the body happened to be would have it
// boring a shaft straight to the red -- the same fault the gang on the rock are
// explicitly stopped from having -- and the whole shape of the thing is that you
// have to take the grey off to get at what is under it.
// `taken` is the cells other bodies are already working on. One cell, one
// wizard: without it every one of them works out the same outermost cell, hangs
// in the same spot and takes the meteor apart standing inside each other -- the
// same rule the muck and the dust on the ground already go by, and for the same
// reason.
export function nextCell(fromX, fromY, taken) {
  if (!meteorAlive()) return null;
  const mid = (sky.cols - 1) / 2;
  let best = null, bestD = -1, bestNear = Infinity;
  for (let r = 0; r < sky.rows; r++) {
    for (let c = 0; c < sky.cols; c++) {
      if (!at(c, r)) continue;
      if (taken && taken.has(r * sky.cols + c)) continue;
      const d = Math.hypot(c - mid, r - mid);
      if (d < bestD - 0.5) continue;
      const near = Math.hypot(cellX(c) - fromX, cellY(r) - fromY);
      if (d > bestD + 0.5) { best = { c, r }; bestD = d; bestNear = near; continue; }
      if (near < bestNear) { best = { c, r }; bestD = Math.max(bestD, d); bestNear = near; }
    }
  }
  return best;
}

// One cell off, and what it was made of comes down.
//
// Nothing is banked up here. Everything this game counts is a grain that got to
// the hole, and a meteor that paid straight into the counter would be the one
// place in the yard where work turned into a number without anybody carrying
// anything. So the rind falls as dust and the core falls as sparks, and both
// of them land on the ground for the haulers to find.
export function takeCell(c, r) {
  if (!sky.cells || !at(c, r)) return null;
  const kind = at(c, r);
  put(c, r, 0);
  const x = cellX(c), y = cellY(r);
  if (kind === CORE) {
    spawnChip(x, y, bell() * 0.3, 0.2, someFind(SPARK_CELL));
  } else {
    for (let i = 0; i < METEOR_GRAINS; i++)
      spawnChip(x, y, bell() * 0.5, 0.2 + Math.random() * 0.3, 1 + Math.floor(Math.random() * 3));
  }
  // Worked out, and the sky is empty for a while. The next one is not another
  // purchase -- the tower called this one down and the sky goes on doing what
  // the tower taught it to do.
  if (sky.n === 0) S.meteorAt = now() + METEOR_AGAIN;
  S.dirty = true;
  return kind;
}

// A wizard hangs off the cell it is working on, a body's width out from it and
// on the side away from the middle -- so what it is taking apart is in front of
// it rather than behind it.
//
// Off the *cell* and not off the disc. Measured from the original radius, a
// wizard went on hanging where the outside of the meteor used to be: by the end
// of one it was working a rock the width of a hand from twenty cells away, with
// nothing but sky between them.
export function hoverSpot(cell, off) {
  const mid = (sky.cols - 1) / 2;
  const dx = cell.c - mid, dy = cell.r - mid;
  const d = Math.hypot(dx, dy) || 1;
  return { x: cellX(cell.c) + sky.p / 2 + (dx / d) * off,
           y: cellY(cell.r) + sky.p / 2 + (dy / d) * off };
}

export function stepMeteor(t) {
  if (!S.meteorOpen) return;
  if (!sky.cells) { makeMeteor(); return; }
  // the next one drifts in, once the sky has been empty long enough
  if (sky.n === 0 && S.meteorAt && t >= S.meteorAt) {
    makeMeteor();
    S.meteorAt = 0;
  }
}
