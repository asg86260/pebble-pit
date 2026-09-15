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
import { quarryCells, quarryTarget, dugTopY, cutTop, cellsLeft, quarryDone } from '../src/quarry.js';
import { at, put } from '../src/grid.js';

const quarriers = () => S.workers.filter(w => w.type === 'quarrier');
const columns = () => quarryCells().map((_, c) => c);
// The floor a body's feet answer to, less the floor the outline draws, in cells.
const seam = c => (cutTop(quarry.x + c * P + P / 2) - dugTopY(quarry.x + c * P + P / 2)) / P;

group('a save whose rock sits above the counted floor comes back squared, and the gang stands on the floor', async () => {
  // The deepest cut there is, five on the face, dug down near its floor -- a
  // few courses left rather than one, so the gang are still at work on the
  // floor when it is measured after the load rather than done and climbing out.
  window.__crew(0, 0, 5, 0); window.__fullSites(); window.__tip(90000);
  const deepest = Math.max(...columns().map(quarryTarget));
  window.__digCut(deepest - 4);
  runUntil(() => quarriers().some(w => w.goal === 'work'), 60);
  run(2);
  // The grid disagrees with the count by a course in every column that still
  // has one to dig: rock put back in the row the count says is gone. This is
  // the shape an old save carries; nothing in play writes it any more.
  const cells = quarryCells();
  const spoiled = [];
  for (const c of columns()) {
    if (cells[c] < 1) continue;
    const r = cut.rows - cells[c];           // the counted row, just dug
    if (at(cut, c, r) !== ROCK_CELL) { put(cut, c, r, ROCK_CELL); spoiled.push(c); }
  }
  run(0.1);
  // Over the columns that were spoiled: a column the gang has already dug out
  // has nothing to put back and agrees with itself, and how many of those
  // there are by now is the gang's timing, not this check's subject.
  const before = Math.max(...spoiled.map(seam));
  persist();
  yard.restore();
  run(2);
  const after = Math.max(...columns().map(seam));
  const feet = quarriers().filter(w => w.goal === 'work')
    .map(w => (dugTopY(w.x + WORKER / 2) - (w.y + WORKER)) / P);
  return [
    ok(spoiled.length > 10, 'the grid was put a course above the count', `${spoiled.length} columns`),
    ok(before <= -0.9, 'and the feet stood a course above the drawn floor before the reload', `${before.toFixed(2)} cells`),
    ok(after > -0.1 && after < 0.1, 'after the reload the grid and the count agree in every column', `${after.toFixed(2)} cells`),
    ok(feet.length > 0 && feet.every(g => Math.abs(g) < 0.5), 'and every body at work stands on the floor the outline draws',
       feet.map(g => g.toFixed(2)).join(' ')),
  ];
});

// The finished floor is jagged on purpose. A body digging it stands on the
// column under its middle; a body walking it -- out to the ladder when the
// cut is done, in to its seat -- stood on the highest of the three columns
// under it, a course up over every dip. One floor, one rule: see `feetOn`.
group('the gang walks the finished floor out to the ladder on it, not a course above it', async () => {
  window.__crew(0, 0, 5, 0); window.__fullSites(); window.__tip(90000);
  const deepest = Math.max(...columns().map(quarryTarget));
  window.__digCut(deepest - 1);
  runUntil(() => quarriers().some(w => w.goal === 'work'), 60);
  // Through the last course and the walk out, frame by frame: every frame a
  // body is on the floor leg of a route, its feet against the floor under
  // its middle.
  // A step down a course is eased over a frame or two (`climbTo`); a stand a
  // course up is a streak. Before the fix a body was up for most of its walk.
  let walked = 0, up = 0, streak = 0;
  for (let f = 0; f < 60 * 120 && walked < 40; f++) {
    run(1 / 60);
    for (const w of quarriers()) {
      const leg = w.route && w.route[0] && w.route[0].along;
      if (!leg || leg.key !== 'cut' || w.y + WORKER <= S.groundY + 2) { w.upFor = 0; continue; }
      walked++;
      const gap = (dugTopY(w.x + WORKER / 2) - (w.y + WORKER)) / P;
      w.upFor = gap > 0.6 ? (w.upFor || 0) + 1 : 0;
      if (gap > 0.6) up++;
      streak = Math.max(streak, w.upFor);
    }
  }
  return [
    ok(walked >= 40, 'bodies walked the floor', `${walked} body-frames`),
    ok(streak <= 3, 'and never stood a course above the floor under their middle',
       `${up} of ${walked} frames up, longest ${streak} frames running`),
  ];
});

// The gang comes in near the top and digs its way down, course by course. The
// dig used to write the body's height as a position, leaving the climber's
// memory (`w.foot`) on the course the descent had ended on -- so the first
// route after the dig, the walk out when the cut was done, eased from up
// there: the whole gang stood up in a line a course or more above the floor
// and slid down to it. The picture the player sent, 2026-09-14.
group('when the cut is done the gang walks out from the floor, not from the course it came in on', async () => {
  window.__crew(0, 6, 5, 0); window.__fullSites(); window.__tip(90000);
  runUntil(() => quarriers().some(w => w.goal === 'work'), 60);
  // Let them arrive and dig a while, so the climber's memory is well above
  // the floor they end on; then take the cut down to its last courses and
  // wait for the whole gang to be down there working them.
  run(10);
  const deepest = Math.max(...columns().map(quarryTarget));
  window.__digCut(deepest - 4);
  runUntil(() => quarriers().every(w => w.goal === 'work' && w.y + WORKER > S.groundY + P * 10), 120);
  const deep = quarriers().filter(w => w.y + WORKER > S.groundY + P * 10).length;
  // The frame each body's walk out begins on: its feet against the floor
  // under its middle. Before the fix that frame put a body up to seventeen
  // courses above the floor, from where it slid down a cell a frame. (Later
  // in the walk a body stepping off a wall bench eases down the face at the
  // climber's pace, which is the climber's own business and not this.)
  const starts = [], seen = new Set();
  for (let f = 0; f < 60 * 240 && starts.length < 5; f++) {
    run(1 / 60);
    for (const w of quarriers()) {
      if (w.goal !== 'up' || !w.route || seen.has(w)) continue;
      seen.add(w);
      starts.push((dugTopY(w.x + WORKER / 2) - (w.y + WORKER)) / P);
    }
  }
  return [
    ok(deep === 5, 'the whole gang was down on the last courses', `${deep} of 5`),
    ok(starts.length === 5 && quarryDone(), 'the gang dug them out and every body set off for the ladder', `${starts.length} of 5`),
    ok(starts.every(g => Math.abs(g) < 1.2), 'each from the floor it was standing on, not from the course it came in on',
       starts.map(g => g.toFixed(1)).join(' ') + ' cells up'),
  ];
});
