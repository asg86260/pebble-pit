// A quarry rung pulls nobody out of the cut.
//
// A quarrier's `cell` is a claim the rest of the gang steer round
// (`claimedCells` in quarry.js), so two bodies never swing at one column.
// Under the shed claim a body pulled to the shed for an upgrade kept its
// column the whole while and a spike stood in the cut until it came back
// (reported 2026-09-14); the fix let go of the column, and then the claim
// itself went -- the work is a spare hand's now. What is left to hold is the
// outcome: buy a rung, and the cut is dug evenly by the whole gang throughout.

import { group, ok, run, runUntil, openSites } from './helpers.mjs';
import { S } from '../src/state.js';
import { TYPE } from '../src/jobs.js';
import { quarryCells, quarryTarget } from '../src/quarry.js';
import { workAt } from '../src/works.js';

group("a quarry rung pulls nobody out of the cut, and no column stands as a spike", async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 4, 4);
  window.__grant({ dust: 200000, spores: 9000, shards: 9000 });
  window.__clearFloor();
  const gang = () => S.workers.filter(w => w.type === TYPE.QUARRY);
  // Everybody down and digging, each with a column of its own.
  const digging = runUntil(() => gang().every(w => w.goal === 'work' && w.cell != null), 120);
  run(2);

  // A rung bought like a player buys it: it is built at the quarry's shed by
  // a spare hand, and the gang is not asked.
  const bought = window.__buy('seam');
  const sent = () => S.workers.filter(w => w.type === TYPE.BUILD && w.site === 'quarry');
  const taken = runUntil(() => sent().length === 1, 30);
  const gangSize = gang().length;

  // The shallowest course is taken out evenly: no column stands more than a
  // pocket's worth above its neighbors while the work is on.
  const spike = () => {
    const cells = quarryCells();
    let worst = 0;
    for (let c = 1; c < cells.length - 1; c++) {
      if (cells[c] >= quarryTarget(c)) continue;
      const around = Math.max(cells[c - 1], cells[c + 1]);
      worst = Math.max(worst, around - cells[c]);
    }
    return worst;
  };
  let worst = 0, fewest = gangSize;
  for (let i = 0; i < 60 && workAt('quarry'); i++) {
    run(1); window.__clearFloor();
    worst = Math.max(worst, spike());
    fewest = Math.min(fewest, gang().length);
  }

  window.__crew(0, 0, 0);
  return [
    ok(digging && bought && taken, 'the gang is digging and a spare hand is sent for the rung',
       `digging ${digging}, bought ${bought}, taken ${taken}`),
    ok(gangSize === 4 && fewest === 4, 'and all four stay in the cut the whole while',
       `${gangSize} at the start, ${fewest} at the fewest`),
    ok(worst <= 3, 'so no column stands as a spike',
       `${worst} courses above its neighbors at worst`)
  ];
});
