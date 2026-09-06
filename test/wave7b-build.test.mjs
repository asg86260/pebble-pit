// The build yard (wave7b, Track F): after the construction bench stands, new
// buildings are raised by a builder who walks to the site; before it stands,
// builds work exactly as they always have. See docs/wave7b.md and DESIGN.md,
// "The build yard".
//
// Bought the way a player buys it throughout: the bench through `__buy`, the
// builders through `__assign` -- the same button the roster presses -- and the
// setup that the checks are NOT about (crew, coin) through the hooks.

import { group, ok, state, run, runUntil, yard } from './helpers.mjs';
import { S } from '../src/state.js';
import { worksAt, progressOfKey } from '../src/works.js';
import { inBuildSite } from '../src/crew/builders.js';
import { TYPE } from '../src/jobs.js';

const rich = () => {
  window.__crew(2, 2);
  window.__grant({ cores: 9, dust: 90000, shards: 900, spores: 900, sparks: 500 });
  // The bench's door shows from the second rock -- the one piece of setup the
  // rows' own `show` asks about that the coin cannot buy.
  S.boulderNo = 2;
};

const yardWork = key => worksAt('yard').find(w => w.key === key) || null;

const openBench = () => {
  if (!window.__buy('unlockbuildbench')) return false;
  return runUntil(() => S.buildbenchOpen, 300);
};

group('before the bench, a building rises exactly as today', async () => {
  rich();
  run(1);
  const bought = window.__buy('unlocklab');
  // The derived gang: a spare body walks over and puts it up, with nobody
  // assigned to anything -- which is the whole of the pre-bench behavior.
  const landed = runUntil(() => S.labOpen, 300);
  return [
    ok(bought, 'the lab row answers when it is pressed'),
    ok(landed, 'and the yard raises it with nobody assigned to building'),
    ok(S.builders === 0, 'and the derived gang stands down after it lands',
       `${S.builders}`)
  ];
});

group('with the bench open, a build waits fenced until a builder is assigned', async () => {
  rich();
  run(1);
  const benched = openBench();
  const zero = S.builders;
  const bought = window.__buy('unlocklab');
  run(30);
  const waited = yardWork('unlocklab');
  const stood = waited ? waited.done : -1;

  // Assign one through the roster's own move, and watch the body WALK: its x
  // never moves more than a commute's single frame could carry it.
  window.__assign('builders', 1);
  // A tenth of a second a step, so "never jumps" is measured against what six
  // frames of a commute can honestly carry -- about 28 pixels -- rather than
  // against the whole-second strides `runUntil` takes.
  let jumped = 0, last = null, arrived = false;
  for (let t = 0; t < 120 && !arrived; t += 0.1) {
    run(0.1);
    const b = S.workers.find(w => w.type === TYPE.BUILD);
    if (b) {
      if (last != null && Math.abs(b.x - last) > 40) jumped++;
      last = b.x;
    }
    arrived = !!b && inBuildSite(b);
  }
  const before = yardWork('unlocklab')?.done ?? 0;
  run(10);
  const after = yardWork('unlocklab')?.done ?? 0;
  const landed = runUntil(() => S.labOpen, 300);

  return [
    ok(benched, 'the construction bench is bought and raises itself'),
    ok(zero === 0, 'and it opens with zero builders assigned', `${zero}`),
    ok(bought, 'a building unlock can still be bought'),
    ok(!!waited && stood === 0,
       'and its work stands at nought with nobody on it -- the bar is empty',
       waited ? `${stood}` : 'no work'),
    ok(arrived, 'an assigned builder walks to the site and stands in it'),
    ok(jumped === 0, 'and never jumps on the way', `${jumped} jumps`),
    ok(after > before, 'progress moves only while the body is present',
       `${before} -> ${after}`),
    ok(landed, 'and the building lands')
  ];
});

group('two builds and one post finish in sequence; a second post runs them at once', async () => {
  rich();
  run(1);
  openBench();
  window.__assign('builders', 1);
  const b1 = window.__buy('unlocklab');
  const b2 = window.__buy('unlockschool');
  runUntil(() => (yardWork('unlocklab')?.done ?? 0) > 0, 60);
  run(5);
  const first = yardWork('unlocklab')?.done ?? 0;
  const queued = yardWork('unlockschool')?.done ?? 0;

  // The ladder: a `buildposts` rung and a second builder, and both rise at
  // once. Sampled the moment the second body starts the queued one, while the
  // first build is still on the go -- both moving in the same window is the
  // whole of the claim.
  const rung = window.__buy('buildposts');
  window.__assign('builders', 1);
  runUntil(() => progressOfKey('yard', 'unlockschool') > 0 || !yardWork('unlocklab'), 60);
  const a1 = yardWork('unlocklab')?.done ?? null;
  const a2 = yardWork('unlockschool')?.done ?? null;
  run(3);
  const d1 = a1 != null && (yardWork('unlocklab')?.done ?? Infinity) > a1;
  const d2 = a2 != null && (yardWork('unlockschool')?.done ?? Infinity) > a2;
  const both = runUntil(() => S.labOpen && S.schoolOpen, 600);

  return [
    ok(b1 && b2, 'the yard takes a second build into its queue with one post'),
    ok(first > 0 && queued === 0,
       'one builder works the oldest and the queued one stands at nought',
       `${first} / ${queued}`),
    ok(rung, 'a buildposts rung can be bought in sparks'),
    ok(S.builders === 2, 'and the second post takes a second builder', `${S.builders}`),
    ok(d1 && d2, 'with two posts both builds progress in the same window',
       `${a1} +${d1} / ${a2} +${d2}`),
    ok(both, 'and both land')
  ];
});

group('the bench, its ladders and its builders survive a reload', async () => {
  rich();
  run(1);
  openBench();
  window.__buy('buildposts');
  window.__assign('builders', 1);
  window.__assign('builders', 1);
  run(2);
  S.dirty = true;
  yard.persist();
  // Scramble what the save must bring back, so what comes back was read.
  S.buildbenchOpen = false; S.buildPostLevel = 0; S.builders = 0;
  yard.restore();
  run(1);
  return [
    ok(S.buildbenchOpen === true, 'the bench is still open'),
    ok(S.buildPostLevel === 1, 'the posts rung is still bought', `${S.buildPostLevel}`),
    ok(S.builders === 2, 'and both hired builders are still at their posts',
       `${S.builders}`),
    ok(S.buildbench.w > 0, 'and the trestle stands seated in the yard',
       JSON.stringify(S.buildbench))
  ];
});
