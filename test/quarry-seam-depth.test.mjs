// Players reported two things about the quarry, 2026-09-14: the ore only ever
// came up out of the top couple of layers of a dig, and a shard could lie on the
// floor of the cut and never be picked up. The first was a crit pulling whole
// shards forward on top of the extra ground it takes (findShards, quarry.js);
// the second was the cut's floor seeing only dust, so a shard that came down
// short of the rim was invisible to the tidy and buried by the refill -- and it
// came down short because the far wall stopped a rising throw dead (game.js).

import { group, ok, run, runUntil } from './helpers.mjs';
import { S, cut, quarry } from '../src/state.js';
import { P, SHARD_CELL, FIND_TONES } from '../src/config.js';
import { cellsLeft, seamShards } from '../src/quarry.js';
import { addGrain } from '../src/grid.js';

const quarriers = () => S.workers.filter(w => w.type === 'quarrier');
const digging = () => quarriers().some(w => w.goal === 'work');
const shardsInCut = () => {
  let n = 0;
  for (const v of cut.grid) if (v >= SHARD_CELL && v < SHARD_CELL + FIND_TONES) n++;
  return n;
};

group('the ore is scattered down the whole cut, even when every swing crits', async () => {
  window.__crew(0, 0, 3, 0); window.__fullSites(); window.__tip(90000);
  window.__crit(true);
  runUntil(digging, 60);
  const seam = seamShards();
  const whole = cellsLeft();
  // Dig the first quarter of the cut. A crit used to take three whole shards
  // from a seam of six, so two crits emptied the ground before a quarter of it
  // was out and the rest of the dig turned up nothing.
  runUntil(() => cellsLeft() <= whole * 0.75 || S.quarryOwed <= 0, 600);
  const owedAtQuarter = S.quarryOwed;
  runUntil(() => cellsLeft() <= whole * 0.5 || S.quarryOwed <= 0, 600);
  const owedAtHalf = S.quarryOwed;
  window.__crit(null);
  return [
    ok(seam >= 3, 'a fresh cut has a handful in the ground', `${seam}`),
    ok(owedAtQuarter > seam * 0.5, 'more than half the seam is still down there with a quarter dug',
       `${owedAtQuarter} of ${seam}`),
    ok(owedAtHalf > 0, 'and some is still there with half dug', `${owedAtHalf} of ${seam}`),
  ];
});

group('a shard lying on the floor of the cut is thrown out onto the heap', async () => {
  window.__crew(0, 0, 3, 0); window.__fullSites(); window.__tip(90000);
  runUntil(digging, 60);
  window.__digCut(6);
  // On the floor under the far wall: the column a throw at the rim is most
  // likely to come down short from, and the one the tidy must be able to clear.
  const x = quarry.x + quarry.w - P / 2;
  for (let i = 0; i < 3; i++) addGrain(cut, x, null, SHARD_CELL + i);
  const laid = shardsInCut();
  const tidiedBefore = quarriers().reduce((n, w) => n + (w.tidied || 0), 0);
  runUntil(() => shardsInCut() === 0, 120);
  const tidiedAfter = quarriers().reduce((n, w) => n + (w.tidied || 0), 0);
  // And it stays out: a throw from under the wall used to hit the face and
  // fall straight back to where it was picked up.
  run(10);
  return [
    ok(laid === 3, 'three shards laid on the floor', `${laid}`),
    ok(shardsInCut() === 0, 'none is left lying in the cut', `${shardsInCut()}`),
    ok(tidiedAfter - tidiedBefore >= 3, 'a quarrier stooped for each of them',
       `${tidiedAfter - tidiedBefore}`),
  ];
});
