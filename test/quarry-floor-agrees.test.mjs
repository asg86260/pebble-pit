// Reported 2026-09-14, with a picture: on the last courses of a fully upgraded
// cut the gang stood a course above the floor the outline drew, working the
// air. The outline is drawn from the per-column count; the feet stand on the
// grid's rock (`cutTop`). Live play keeps the two together, but a save's grid
// was laid back over the fresh rock whole, rock included, so a yard whose grid
// had ever disagreed with its count carried the disagreement through every
// reload -- and `digCell` only ever takes the counted row, so the extra rock
// above it was never dug. The count is the dig; the grid's rock is derived
// from it on the way back in (`squareCut`).

import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { persist } from '../src/persist.js';
import { S, cut, quarry } from '../src/state.js';
import { P, WORKER, ROCK_CELL } from '../src/config.js';
import { quarryCells, quarryTarget, dugTopY, cutTop } from '../src/quarry.js';
import { at, put } from '../src/grid.js';

const quarriers = () => S.workers.filter(w => w.type === 'quarrier');
const columns = () => quarryCells().map((_, c) => c);
// The floor a body's feet answer to, less the floor the outline draws, in cells.
const seam = c => (cutTop(quarry.x + c * P + P / 2) - dugTopY(quarry.x + c * P + P / 2)) / P;

group('a save whose rock sits above the counted floor comes back squared, and the gang stands on the floor', async () => {
  // The deepest cut there is, five on the face, dug down to its last course.
  window.__crew(0, 0, 5, 0); window.__fullSites(); window.__tip(90000);
  const deepest = Math.max(...columns().map(quarryTarget));
  window.__digCut(deepest - 1);
  runUntil(() => quarriers().some(w => w.goal === 'work'), 60);
  run(2);
  // The grid disagrees with the count by a course in every column that still
  // has one to dig: rock put back in the row the count says is gone. This is
  // the shape an old save carries; nothing in play writes it any more.
  const cells = quarryCells();
  let spoiled = 0;
  for (const c of columns()) {
    if (cells[c] < 1) continue;
    const r = cut.rows - cells[c];           // the counted row, just dug
    if (at(cut, c, r) !== ROCK_CELL) { put(cut, c, r, ROCK_CELL); spoiled++; }
  }
  run(0.1);
  const before = Math.max(...columns().map(seam));
  persist();
  yard.restore();
  run(2);
  const after = Math.max(...columns().map(seam));
  const feet = quarriers().filter(w => w.goal === 'work')
    .map(w => (dugTopY(w.x + WORKER / 2) - (w.y + WORKER)) / P);
  return [
    ok(spoiled > 10, 'the grid was put a course above the count', `${spoiled} columns`),
    ok(before <= -0.9, 'and the feet stood a course above the drawn floor before the reload', `${before.toFixed(2)} cells`),
    ok(after > -0.1 && after < 0.1, 'after the reload the grid and the count agree in every column', `${after.toFixed(2)} cells`),
    ok(feet.length > 0 && feet.every(g => Math.abs(g) < 0.5), 'and every body at work stands on the floor the outline draws',
       feet.map(g => g.toFixed(2)).join(' ')),
  ];
});
