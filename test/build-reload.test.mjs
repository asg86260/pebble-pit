// A builder read back from a save mid-burst.
//
// The bug: the save kept half of the hammer. `jigAt` came back, so the body
// skipped the jig's start, but the count of blows in the burst and how many
// it wanted did not: the count went `undefined`, then NaN, and never reached
// the end of a burst, so the body never rested or moved along -- and the
// board's tile, which throws a handful of chips whenever that count changes,
// saw NaN "change" on every frame and threw a burst a frame over the drawing.

import { group, ok, run, runUntil, quickCrew } from './helpers.mjs';
import { S } from '../src/state.js';

group('a builder read back mid-build strikes at its own pace', async () => {
  window.__crew(1, 1);
  quickCrew();
  window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
  window.__tip(90000);
  S.seenMess = true;
  window.__buy('unlockouthouse');
  const hammering = () => (S.workers || []).find(w => w.type === 'builder' && w.goal === 'at' && w.jigAt != null);
  runUntil(() => hammering()?.hits > 0, 60);
  // By name: a body read back is a new object.
  const name = hammering().name;
  const body = () => S.workers.find(b => b.name === name);
  window.__reload();
  // The blows over the next four seconds, a frame at a time, read off the
  // count the body keeps, which is what the board's tile reads too.
  let blows = 0, back = 0, worst = 0, rested = false;
  for (let i = 0; i < 240; i++) {
    const was = body().hits;
    run(1 / 60);
    if (body().hits !== was) { blows++; back++; worst = Math.max(worst, back); } else back = 0;
    if (body().hits === 0) rested = true;
  }
  return [
    ok(Number.isFinite(body().hits), 'it comes back counting its blows', String(body().hits)),
    ok(blows > 0 && worst <= 1, 'and strikes at its own pace, never on two frames running',
       `${worst} blows on consecutive frames, ${blows} in four seconds`),
    ok(rested, 'and finishes its burst')
  ];
});
