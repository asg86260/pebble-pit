// "Another shovel" and "another plot" are ladders as far as the tile is
// concerned: a pip a bench the cut can be worked down to, a pip a plot the
// ground can be broken into, lit as they are bought. They had a from/to and a
// price that climbed but no rung to draw pips from -- and no rung for
// `workFor` to read either, so the work stayed flat where WORK_BASE said a
// bench's should climb with the rung the way its price does.

import { group, ok, run, yard } from './helpers.mjs';
import { rungOf, rungsOf } from '../src/words.js';
import { workFor } from '../src/works.js';
import { QUARRY_BENCH0, QUARRY_BENCH_MAX, FARM_PLOTS0, FARM_PLOTS_MAX, WORK_STEP } from '../src/config.js';
import { QUARRY_UPGRADES } from '../src/quarry.js';
import { FARM_UPGRADES } from '../src/farm.js';

const S = () => yard.S;
const rowOf = key => [...QUARRY_UPGRADES, ...FARM_UPGRADES].find(u => u.key === key);

group('the shovel and plot rows climb a ladder of their own', async () => {
  window.__reset();
  // Two quarriers and one farmhand: exactly the room a fresh cut and a fresh
  // farm come with, so `__crew` opens neither a bench nor a plot deeper.
  window.__crew(2, 3, 2, 1);
  window.__grant({ cores: 9, dust: 200000, spores: 20000, shards: 20000 });
  run(1);
  const bench = rowOf('quarrybench'), plot = rowOf('farmplot');
  const benchFirst = { at: rungOf(bench), of: rungsOf(bench), work: workFor(bench) };
  const plotFirst = { at: rungOf(plot), of: rungsOf(plot), work: workFor(plot) };
  // Bought like a player: the row, and the yard's hands take it out.
  const boughtBench = window.__buy('quarrybench');
  const boughtPlot = window.__buy('farmplot');
  window.__finish(); run(1);
  const benchNext = { at: rungOf(bench), work: workFor(bench) };
  const plotNext = { at: rungOf(plot), work: workFor(plot) };
  return [
    ok(benchFirst.at === 0 && benchFirst.of === QUARRY_BENCH_MAX - QUARRY_BENCH0,
       'a fresh cut has no pip lit, one a bench it can go down', JSON.stringify(benchFirst)),
    ok(plotFirst.at === 0 && plotFirst.of === FARM_PLOTS_MAX - FARM_PLOTS0,
       'a fresh farm has none lit, one a plot it can break', JSON.stringify(plotFirst)),
    ok(boughtBench && boughtPlot, 'both rows are bought'),
    ok(benchNext.at === 1 && plotNext.at === 1, 'and each lights a pip', `${benchNext.at}, ${plotNext.at}`),
    ok(Math.abs(benchNext.work / benchFirst.work - WORK_STEP) < 0.1,
       'the next bench takes a step longer, as WORK_BASE says', `${benchFirst.work}s -> ${benchNext.work}s`),
    ok(Math.abs(plotNext.work / plotFirst.work - WORK_STEP) < 0.1,
       'and so does the next plot', `${plotFirst.work}s -> ${plotNext.work}s`)
  ];
});
