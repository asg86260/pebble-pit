// Track C: buildings go up, not appear.
//
// See docs/wave-feedback3.md, "Track C -- buildings". C3 (the barrier tape and
// dust) and C4 (a carried core's glow) are drawing and are looked at with
// tools/look.mjs rather than checked here -- a green suite cannot see a
// barrier. This file covers the mechanical half: a house takes time and
// resumes after a reload, the two sheds hold their ground without eating the
// plots or the cut, and the farm is laid out at its full width from the start.

import { group, ok, state, run, runUntil, openSites, P, yard } from './helpers.mjs';

const works = () => state().works || {};
const on = key => Object.values(works()).find(w => w.key === key) || null;

// C1 -- the house is a building now, not an instant purchase.
group('a house goes up over time, with a builder at it', async () => {
  window.__reset();
  window.__crew(0, 1);                       // one spare hand, so hiring is on offer
  window.__grant({ dust: 90000 });
  run(1);

  const before = state().crew;
  const started = window.__buy('house');
  const just = state();
  const work = on('house');

  return [
    ok(started, 'the row answers when it is pressed'),
    ok(just.crew === before, 'and the crew is not bigger yet',
       `${before} -> ${just.crew}`),
    ok(!!work && work.of > 0 && work.done === 0,
       'a house is a work on the yard, not yet had', JSON.stringify(work)),
    ok(just.houses.cubes === (before > 0 ? before + 1 : 0),
       'and no new room stands until the work does',
       `${just.houses.cubes} cubes for a crew of ${before}`)
  ];
});

group('and the spare hand finishes it, and then the crew is bigger', async () => {
  window.__reset();
  window.__crew(0, 1);
  window.__grant({ dust: 90000 });
  run(1);

  const before = state().crew;
  window.__buy('house');
  const walked = runUntil(() => state().works?.yard?.hands > 0, 60);
  const landed = runUntil(() => state().crew > before, 150);
  const after = state();

  return [
    ok(walked, 'the spare hand walks to the yard and stands there'),
    ok(landed, 'and the house is finished'),
    ok(after.crew === before + 1, 'which is one more body',
       `${before} -> ${after.crew}`),
    ok(!on('house'), 'and the work is off the books', JSON.stringify(works())),
    ok(after.houses.cubes === after.crew + 1,
       'and the settlement has grown to match', `${after.houses.cubes} cubes`)
  ];
});

// C2 -- the bug: a reload mid-build must not strand the site.
group('a reload re-dispatches the builders, and the site does not stall', async () => {
  window.__reset();
  window.__crew(0, 1);
  window.__grant({ dust: 90000 });
  run(1);

  window.__buy('house');
  runUntil(() => (state().works?.yard?.done || 0) > 0.5, 30);
  const before = on('house');
  window.__reload();
  const after = on('house');
  const stillAt = state().works?.yard?.hands > 0
                || runUntil(() => (state().works?.yard?.hands || 0) > 0, 30);
  const progressed = runUntil(
    () => (state().works?.yard?.done || 0) > (before ? before.done : 0) + 1, 60);

  return [
    ok(!!before && before.done > 0, 'the yard got some of the house done',
       before ? `${before.done} of ${before.of}` : 'nothing on the go'),
    ok(!!after, 'and the work survives the reload', JSON.stringify(after)),
    ok(stillAt, 'and a spare hand is back at the site after the reload'),
    ok(progressed, 'so the site keeps moving rather than stalling for good')
  ];
});

// C5 -- the farm and the quarry each get a shed on their own left edge, and it
// costs them nothing: the mouth and the plots stand exactly where they always
// did, and the shed is new ground rather than ground taken off either of them.
group('the farm and the quarry each have a shed, out of the way of the work', async () => {
  window.__crew(0, 0, 1, 1);       // opens both places
  window.__crew(0, 0);
  run(1);
  const s = state();
  const fs = s.farmShed, qs = s.quarryShed;

  return [
    ok(!!fs && !!qs, 'both sheds are standing', JSON.stringify({ fs, qs })),
    ok(fs.x + fs.w <= s.farmX, 'the farm shed sits clear of the first plot',
       `${fs.x}..${fs.x + fs.w} vs ${s.farmX}`),
    ok(qs.x + qs.w <= s.quarryX, 'the quarry shed sits clear of the mouth',
       `${qs.x}..${qs.x + qs.w} vs ${s.quarryX}`),
    ok(s.quarryW === 156, 'and the mouth itself is exactly the size it always was',
       `${s.quarryW}`),
    ok(fs.w > 0 && fs.h > 0 && qs.w > 0 && qs.h > 0, 'and both are real boxes')
  ];
});

// C6 -- the farm is laid out at its full width from the first frame; only
// `plotCount` (bought) changes what is actually worked.
group('the farm is laid out at full width, plots empty until bought', async () => {
  openSites();
  window.__levels({ plotLevel: 0 });
  run(0.5);
  const s = state();

  return [
    ok(s.plotSlots > s.plotCount, 'more furrows are laid out than are bought',
       `${s.plotSlots} slots, ${s.plotCount} bought`),
    ok(s.plots.length === s.plotCount,
       'and only the bought ones are anything a body works',
       `${s.plots.length} plots vs ${s.plotCount} bought`)
  ];
});

group('the sites still lay out left of the rock, sheds and all', async () => {
  const s = state();
  return [
    ok(s.farmX + s.farmW < s.quarryX, 'the farm is out past the quarry',
       `farm ends ${Math.round(s.farmX + s.farmW)}, quarry at ${s.quarryX}`),
    ok(s.labX < s.farmX, 'and the lab out past the farm, at the far end',
       `lab at ${Math.round(s.labX)}, farm at ${Math.round(s.farmX)}`),
    ok(s.quarryX + s.quarryW < s.benchX, 'the quarry stands past the bench')
  ];
});

// C7 -- buildings placed in the order they are bought. Only started once
// C1-C6 are green, per the spec.
group('buying a place records it in the build order', async () => {
  window.__reset();
  window.__crew(0, 3);
  window.__grant({ cores: 10, dust: 90000 });
  run(1);

  const before = state().buildOrder;
  window.__buy('unlockfarm');
  // B1 (wave-feedback3.md, Track B): BUILD_GANG is one body now, not three,
  // so a 90-worker-second building is a full 90 seconds for the one builder
  // on it plus the walk over -- 90 was tight enough with a gang of three to
  // spare, and is not enough alone.
  const farmDone = runUntil(() => !on('unlockfarm'), 150);
  const afterFarm = state();
  window.__buy('unlockquarry');
  const quarryDone = runUntil(() => !on('unlockquarry'), 150);
  const afterQuarry = state();

  return [
    ok(before.length === 0, 'nothing bought yet, nothing on the list',
       JSON.stringify(before)),
    ok(farmDone && afterFarm.buildOrder.includes('farm'),
       'the farm is on the list once the ground is broken',
       JSON.stringify(afterFarm.buildOrder)),
    ok(quarryDone && afterQuarry.buildOrder.includes('quarry'),
       'and the quarry joins it', JSON.stringify(afterQuarry.buildOrder)),
    ok(afterQuarry.buildOrder.indexOf('farm') < afterQuarry.buildOrder.indexOf('quarry'),
       'in the order they were actually bought',
       JSON.stringify(afterQuarry.buildOrder))
  ];
});

// A save with nothing in `S.buildOrder` gets the fixed table back exactly --
// checked already above, in "the sites are laid out left of the rock, in
// order" and "the sites still lay out left of the rock, sheds and all". This
// is the other half: a save that bought out of the fixed order sees the
// ground laid out to match, on the next time the table is walked.
group('the ground is laid out to match the order things were bought in', async () => {
  const before = state();

  // Nothing bought yet: the fixed order, bench and house first and then the
  // table's own sequence -- school, quarry, farm, lab, scrub, casino, tower.
  const fixedTowerBehindQuarry = before.quarryX > before.towerX;

  // The tower bought first, ahead of everything else. Set directly rather
  // than played out through the whole unlock chain -- see C7's own write-up
  // in works.js for how a real purchase gets here -- because what this group
  // is about is what `placeSites` does with the order, not how a save came
  // to have one.
  yard.S.buildOrder = ['tower'];
  yard.world.resize(yard.game.settleIntoWorld);
  const after = state();

  return [
    ok(fixedTowerBehindQuarry,
       'before: the tower is the last thing in the fixed table',
       `tower ${before.towerX}, quarry ${before.quarryX}`),
    ok(after.towerX > before.towerX,
       'bought first, it stands nearer the rock than it did',
       `${before.towerX} -> ${after.towerX}`),
    ok(after.towerX > after.quarryX,
       'ahead of every station the order did not name',
       `tower ${after.towerX}, quarry ${after.quarryX}`),
    ok(after.benchX > after.towerX && after.benchX > before.benchX - 1,
       'and the bench is still the nearest thing to the rock, whatever was bought',
       `bench ${after.benchX}, tower ${after.towerX}`)
  ];
});
