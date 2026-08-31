// The cut's own sand: dust that falls down the quarry's mouth, lies on
// whatever ground is still standing under it, and is fetched back out down the
// ladder -- the same shape of thing the pit already is, one level down.

import { group, ok, state, run, runUntil, quickCrew, openSites, P } from './helpers.mjs';
import { S, cut } from '../src/state.js';
import { spawnChip } from '../src/dust.js';
import { at, isDust } from '../src/grid.js';
import { ROCK_CELL } from '../src/config.js';
import { fillQuarry } from '../src/quarry.js';

// where the mouth is, once the quarry is open -- read off the report the same
// way a check reads anything else about the yard
const mouthX = () => state().quarryX + state().quarryW / 2;

group('a chip over the open mouth falls into the cut, not a pile', async () => {
  openSites();
  window.__digCut(3);                          // some headroom for it to fall into
  run(0.3);
  const before = state();
  spawnChip(mouthX(), S.groundY - 100, 0, 0, 4);
  run(2);
  const after = state();
  return [
    ok(after.cutDust > before.cutDust, 'a grain dropped over the mouth lands in the cut',
       `${before.cutDust} -> ${after.cutDust}`),
    ok((after.pileCount.quarry || 0) === (before.pileCount.quarry || 0),
       "and not on the quarry's own pile outside it",
       `${before.pileCount.quarry || 0} -> ${after.pileCount.quarry || 0}`)
  ];
});

group("a hauler routes down the ladder and banks the cut's own dust", async () => {
  openSites();
  window.__digCut(3);
  run(0.2);
  window.__pileCut(mouthX(), 20);
  run(0.5);
  const before = state();
  window.__crew(0, 1);                         // one hauler, nothing else
  quickCrew();

  // Watched as it goes, not only at the end: a claim is picked up and spent in
  // a few frames, and a check that only looked at the end could miss the body
  // ever having been down there at all.
  let sawCut = false;
  for (let i = 0; i < 300 && !sawCut; i++) {
    run(0.1);
    if (state().crewDetail.some(d => d.split('|')[0] === 'h' && d.split('|')[5] === 'pcut'))
      sawCut = true;
  }
  const banked = runUntil(() => state().stored > before.stored, 80);
  window.__crew(0, 0);
  return [
    ok(before.cutDust > 0, 'there is dust lying in the cut to start with', `${before.cutDust}`),
    ok(sawCut, "a hauler is seen down on the cut's own way while it fetches",
       JSON.stringify(state().crewDetail.filter(d => d[0] === 'h'))),
    ok(banked, 'and it comes back up and banks a load',
       `${before.stored} -> ${state().stored}`)
  ];
});

group("fillQuarry lifts the cut's dust out, and loses none of it", async () => {
  openSites();
  window.__digCut(999);                        // as deep as this bench goes
  run(0.2);
  window.__pileCut(mouthX(), 15);
  run(0.3);
  const before = state();
  const cutBefore = before.cutDust;
  const totalBefore = cutBefore + before.floor;

  fillQuarry();
  run(4);                                      // give every tossed chip time to land

  const after = state();
  const totalAfter = after.cutDust + after.floor;
  return [
    ok(cutBefore >= 10, 'there is a real pile lying in the cut to start with', `${cutBefore}`),
    ok(after.cutDust === 0, 'the cut is bare once the ground is back in', `${after.cutDust}`),
    // Not necessarily all in the quarry's own pile strip -- a throw is aimed
    // rather than guaranteed, the same as any other toss out of this hole --
    // but every pixel is worth one dust, so the total lying on the ground has
    // to come out exactly what went in.
    ok(totalAfter === totalBefore,
       'every grain that was lying in it is still lying about the yard, not one lost',
       `${totalBefore} -> ${totalAfter} (had ${cutBefore} in the cut)`),
    ok((after.pileCount.quarry || 0) > (before.pileCount.quarry || 0),
       "and most of it lands on the quarry's own pile",
       `${before.pileCount.quarry || 0} -> ${after.pileCount.quarry}`)
  ];
});

group('dust never comes to rest in the rock still standing under it', async () => {
  openSites();
  window.__digCut(1);                          // only the shallowest layer open
  run(0.2);
  for (let i = 0; i < 25; i++) { window.__pileCut(mouthX(), 1); run(0.05); }
  run(2);

  const bad = [];
  for (let c = 0; c < cut.cols; c++) {
    let rockTop = -1, dustBottom = Infinity;
    for (let r = 0; r < cut.rows; r++) {
      const v = at(cut, c, r);
      if (v === ROCK_CELL) rockTop = r;
      else if (isDust(v)) dustBottom = Math.min(dustBottom, r);
    }
    if (dustBottom <= rockTop) bad.push({ c, rockTop, dustBottom });
  }
  return [
    ok(bad.length === 0, 'no column has a grain sitting at or below rock nobody has dug out',
       JSON.stringify(bad))
  ];
});

group('a closed quarry works exactly as it always has', async () => {
  run(0.5);
  const before = state();
  const at0 = mouthX();
  spawnChip(at0, S.groundY - 60, 0, 0, 4);
  run(2);
  const after = state();
  return [
    ok(!after.quarryOpen, 'the quarry has never been opened'),
    ok(after.cutDust === 0, 'nothing has ever been laid in the cut', `${after.cutDust}`),
    ok(after.floor > before.floor, 'a grain dropped there lands on the ground like any other',
       `${before.floor} -> ${after.floor}`)
  ];
});
