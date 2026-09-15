// A quarrier claimed for a build lets go of its column.
//
// A quarrier's `cell` is a claim the rest of the gang steer round
// (`claimedCells` in quarry.js), so two bodies never swing at one column. A
// body claimed for an upgrade -- stood at the quarry's shed for the length of
// the work, or of several works queued -- kept the claim the whole while:
// nobody else would take its column, and a spike stood in the cut until it
// came back (reported 2026-09-14). The claim goes with the body's other
// errands the frame it is claimed, and the column is dug by whoever is left.

import { group, ok, run, runUntil, openSites } from './helpers.mjs';
import { S } from '../src/state.js';
import { TYPE } from '../src/jobs.js';
import { quarryCells, quarryTarget } from '../src/quarry.js';
import { workAt } from '../src/works.js';

group("a quarrier claimed for a build lets go of the column it was digging", async () => {
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
  // one of the gang, who climbs out to do it.
  const bought = window.__buy('seam');
  const claimed = () => gang().find(w => w.onBuild === 'quarry');
  const taken = runUntil(() => !!claimed(), 30);
  const body = claimed();
  const held = body ? body.cell : null;
  // Which column the rest of the gang treats as spoken for is read off the
  // body itself: a claim it has let go of is a `cell` of null.
  const letGo = body ? body.cell == null : false;

  // The rest of the gang go on digging, and the shallowest course is taken out
  // evenly: no column stands more than a pocket's worth above its neighbors
  // while the claimed body is away.
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
  let worst = 0;
  for (let i = 0; i < 60 && workAt('quarry'); i++) { run(1); window.__clearFloor(); worst = Math.max(worst, spike()); }

  window.__crew(0, 0, 0);
  return [
    ok(digging && bought && taken, 'the gang is digging and one of them is claimed for the rung',
       `digging ${digging}, bought ${bought}, taken ${taken}`),
    ok(letGo, 'and it lets go of its column the frame it is claimed', `cell ${held}`),
    ok(worst <= 3, 'so no column stands as a spike while it is away',
       `${worst} courses above its neighbors at worst`)
  ];
});
