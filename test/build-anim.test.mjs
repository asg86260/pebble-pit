// A building going up, and the body putting it up.
//
// Everything here is about a thing you are meant to SEE, which is the awkward
// kind of thing to check in node -- so none of these check what it looks like.
// They check the four facts underneath it that were each wrong at some point in
// this pass and each failed silently, because a drawing that does nothing looks
// exactly like a drawing that is not there:
//
//   1. the builder walks at a trip's pace, not a plot-shuffle's
//   2. the grit ages in the units it is actually handed
//   3. the builder stands beside the footprint, not inside it
//   4. the quarry's board is opened by its shed and by nothing else
//
// Every one of those is a number the eye cannot audit at sixty frames a second.

import { group, ok, state, run, runUntil, quickCrew, P, WORKER } from './helpers.mjs';
import { commutePace } from '../src/upgrades.js';
import { FARM_WALK, GRIT_LIFE, BUILD_SHIFT_SPAN, BUILD_SHIFT } from '../src/config.js';
import { spawnGrit, stepGrit } from '../src/grit.js';
import { S } from '../src/state.js';
import { nearQuarry } from '../src/board.js';
import { quarryShed } from '../src/world.js';

// The bug: `stepBuilder` walked on FARM_WALK -- a farmhand's pace for stepping
// to the next furrow -- for a walk clean across the yard. It is a quarter of
// everybody else's commute, and because it never asked `commutePace` it also
// ignored every boots and pace rung the player had bought, so the one body the
// player was watching got slower relative to the yard the more they spent.
group('a builder walks to its site at a trip\'s pace', async () => {
  quickCrew();
  const pace = commutePace();
  return [
    ok(pace > FARM_WALK * 2, 'a commute is much faster than a plot-shuffle',
       `commute ${pace.toFixed(2)} vs FARM_WALK ${FARM_WALK}`),
    // The rungs move it. This is the half that a hard-coded constant silently
    // dropped on the floor, and the half no screenshot would ever show.
    (() => {
      // quickCrew already stands the walk at the top of its ladder, so measure
      // from the bottom of it and back.
      const was = S.haulPaceLevel;
      S.haulPaceLevel = 0;
      const before = commutePace();
      S.haulPaceLevel = 9;
      const after = commutePace();
      S.haulPaceLevel = was;
      return ok(after > before, 'and the gear the player bought moves it',
                `${before.toFixed(2)} -> ${after.toFixed(2)}`);
    })()
  ];
});

// The bug: `stepGrit` took `dt` for seconds. Every stepper in this game is
// handed milliseconds (see `stepSmoke`, which divides by a thousand), so each
// chip aged a thousand times too fast and was spliced out on the frame after it
// spawned. The list read empty on every frame anybody looked at it, and the
// dust was invisible with nothing whatever wrong with where it was thrown.
group('grit ages in the units it is handed', async () => {
  S.grit.length = 0;
  S.groundY = 10000;                 // out of the way: this is about the clock
  spawnGrit(100, 0, { n: 4 });
  const born = S.grit.length;
  // One frame at sixty a second, in milliseconds, the way the loop hands it over
  stepGrit(1000 / 60);
  const afterAFrame = S.grit.length;
  // And now well past the far end of the longest life a chip can roll
  for (let i = 0; i < 200; i++) stepGrit(1000 / 60);
  const afterAWhile = S.grit.length;
  S.grit.length = 0;
  return [
    ok(born === 4, 'a blow throws a handful of chips', `${born}`),
    ok(afterAFrame === 4, 'and they are all still there one frame later',
       `${afterAFrame} left after ${(1000 / 60).toFixed(1)}ms`),
    ok(afterAWhile === 0, 'and all gone a good while after that',
       `${afterAWhile} left after ${GRIT_LIFE * 3}s`)
  ];
});

// The bug: a chip thrown at a fraction of a pixel topped out half a cell up,
// so the whole burst lived and died in the one row of pixels directly above the
// ground line -- drawn in black, against the black ground line. Twelve chips in
// the air and not one of them visible.
group('a chip is thrown clear of the ground it is thrown at', async () => {
  S.grit.length = 0;
  S.groundY = 1000;
  spawnGrit(100, S.groundY - P, { n: 6 });
  let highest = S.groundY;
  for (let i = 0; i < 60; i++) {
    stepGrit(1000 / 60);
    for (const g of S.grit) highest = Math.min(highest, g.y);
  }
  const left = S.grit.length;
  S.grit.length = 0;
  return [
    ok(S.groundY - highest > P * 2, 'a chip gets clear of the ground line',
       `topped out ${(S.groundY - highest).toFixed(1)}px up`),
    ok(left === 0, 'and none of them end up under the world', `${left} left`)
  ];
});

// The bug: `siteX` answers with the MIDDLE of the thing being built, which is
// the right answer to the question and the wrong place to stand. Everything
// here is a black mass on a white page, so a black body inside a black building
// is not a body in front of a building -- it is nothing at all. The builder was
// there the whole time, hammering, invisible.
group('a builder works across the whole zone it is fencing', async () => {
  // Bought and deliberately left going UP -- `buyBuilt` waits for the thing to
  // land, and a finished building has no builder standing at it to look at.
  window.__crew(1, 1);
  quickCrew();
  window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
  window.__tip(90000);
  window.__buy('unlockschool');
  const placed = S.placed && S.placed.school;
  if (!placed) return [ok(false, 'the school has ground to stand on', 'no placement')];

  // Let a body get there and settle into its bursts, then watch the whole patch
  // it works: a burst is a few blows in one place and a step along, so a single
  // frame says nothing about the ground it covers.
  runUntil(() => (S.workers || []).some(w => w.type === 'builder' && w.goal === 'at'), 60);
  const xs = [];
  for (let i = 0; i < 60 * 12; i++) {
    run(1 / 60);
    for (const w of S.workers) if (w.type === 'builder') xs.push(w.x);
  }
  if (!xs.length) return [ok(false, 'somebody turned up to build it', 'no builder')];
  const rightmost = Math.max(...xs), leftmost = Math.min(...xs);
  const covered = rightmost - leftmost;

  return [
    // The zone is the site, and the work happens across it. This used to be the
    // other way round -- the body stood off the near edge and never crossed the
    // line -- on the argument that a black body inside a black building cannot
    // be seen. What is going up is drawn rising out of the ground a course at a
    // time, so for most of a build there is nothing there to be lost against,
    // and a hammer that works one corner of a fenced-off site reads as a body
    // standing near some tape rather than as the site being built.
    ok(leftmost >= placed.x - WORKER, 'it does not work off the near end of the zone',
       `body reached ${Math.round(leftmost)}, zone starts ${Math.round(placed.x)}`),
    ok(rightmost + WORKER <= placed.x + placed.w + WORKER,
       'nor off the far end',
       `body reached ${Math.round(rightmost + WORKER)}, zone ends ${Math.round(placed.x + placed.w)}`),
    ok(covered > placed.w / 3, 'and it works across the zone rather than one corner of it',
       `${Math.round(covered)}px of ${Math.round(placed.w)}`)
  ];
});


// The bug: the step-along between bursts moved `w.x` by a whole `BUILD_SHIFT`
// -- four cells -- in the single frame the burst ended. That is a body
// teleporting, and this yard has one rule it has never broken: every body
// walks. It was invisible in the picture (four cells at sixty frames a second
// reads as a body that moved) and unmissable in a measurement, which is the
// whole argument for measuring travel rather than watching it.
group('a builder walks between its patches rather than appearing at them', async () => {
  window.__crew(1, 1);
  quickCrew();
  window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
  window.__tip(90000);
  window.__buy('unlockschool');
  runUntil(() => (S.workers || []).some(w => w.type === 'builder' && w.goal === 'at'), 60);

  // The largest single frame of travel any builder makes, over a long enough
  // film to contain several whole bursts and the walks between them.
  let worst = 0;
  const last = new Map();
  for (let i = 0; i < 600; i++) {
    run(1 / 60);
    for (const w of S.workers) {
      if (w.type !== 'builder') continue;
      const was = last.get(w);
      if (was != null) worst = Math.max(worst, Math.abs(w.x - was));
      last.set(w, w.x);
    }
  }
  const cap = commutePace() + 1;      // its own pace, plus a pixel of slack
  return [
    ok(worst > 0, 'the builder does move between patches', `${worst.toFixed(2)}px`),
    ok(worst <= cap, 'and never covers more in one frame than it can walk',
       `worst frame ${worst.toFixed(2)}px, pace ${commutePace().toFixed(2)}px`)
  ];
});

// The bug: #1 of "Wave 3.1" made the shed a SECOND way into the quarry's board
// and left the hole answering as well, so pointing anywhere at the cut -- the
// ground the crew work, a quarrier on the ladder -- threw a shop menu over the
// thing you were trying to look at. Every other station is opened by its
// building; the shed is what the quarry's building is.
group('the quarry\'s board is opened by its shed and nothing else', async () => {
  quickCrew();
  S.quarryOpen = true;
  const shed = quarryShed();
  const q = state();
  return [
    ok(nearQuarry(shed.x + shed.w / 2, shed.y + shed.h / 2),
       'pointing at the shed opens it', `shed at ${Math.round(shed.x)}`),
    ok(!nearQuarry(q.quarryX + 60, q.groundY + 80),
       'pointing down the hole does not', `hole at ${q.quarryX}`),
    ok(!nearQuarry(q.quarryX + 60, q.groundY + 200),
       'nor does pointing at the floor of the cut', `deep in the cut`)
  ];
});
