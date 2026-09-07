// The drain: the rift pulls, and everything that goes into it does the rest.
//
// What is checked here is that the fall is a *consequence* rather than a shape.
// There used to be a law of infall -- a logarithmic spiral every grain was
// pinned to, the same number of turns whatever it had been doing beforehand --
// and the tell was that a grain released at rest orbited exactly as hard as one
// flung past at speed. So the checks that matter are the ones that law would
// have failed: two grains given different speeds at the same place must do
// different things, and the one at rest must fall straight in.
//
// Drawing is not checked here and cannot be: whether it *looks* like a hole is
// a question for a shot (the `grown` scene in tools/look.mjs).

import { group, ok, state, run, runUntil, yard } from './helpers.mjs';

const { RIFT_EAT, RIFT_G } = await import('../src/config.js');
const { S, rift } = await import('../src/state.js');

// A torn yard with hands in it: the hole filled past what it holds, which is
// what tears it, and haulers still carrying so grains keep arriving at a rift
// that is already open.
function tornYard() {
  window.__reset();
  window.__crew(3, 6, 2, 2);
  window.__fullSites();
  window.__meteor();
  window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
  window.__give(60000);                 // more than the hole holds: it tears
}

const mid = () => ({ x: rift.x + rift.w * 0.5, y: rift.y + rift.h * 0.5 });
const far = m => Math.hypot(m.x - mid().x, m.y - mid().y);

group('the rift pulls, and a grain at rest falls straight into it', async () => {
  tornYard();
  // Let it finish the pile first. The disc grows with every grain it eats and
  // it grows fastest just after it tears, so its middle walks right while a
  // grain is falling and tilts the fall by a few pixels -- real, and not what
  // this group is about. Fed nothing, it holds still.
  run(4);
  const c = mid(), R = rift.w * 0.5;
  // One grain, put out at two radii with no speed of its own. Pushed onto the
  // list directly because what is being checked is the pull itself: how a grain
  // gets there is `riftCatch`'s business and has its own group below.
  S.gulped.length = 0;
  S.gulped.push({ x0: c.x, y0: c.y - R * 2, x: c.x, y: c.y - R * 2, vx: 0, vy: 0, s: 1 });
  const one = S.gulped[0];

  // Measured against the middle AS IT IS, not where it was: the disc grows
  // with every grain it eats and its centre walks right as it widens, so a
  // grain falling dead straight still drifts a few pixels from where the
  // middle used to be. That is the hole moving, not the grain swinging.
  const seen = [];
  let drift = 0;
  for (let i = 0; i < 6 && S.gulped.includes(one); i++) {
    seen.push(far(one));
    drift = Math.max(drift, Math.abs(one.x - mid().x));
    run(0.1);
  }

  let closing = seen.length > 1;
  for (let i = 1; i < seen.length; i++) if (seen[i] > seen[i - 1] + 0.5) closing = false;
  const gone = runUntil(() => !S.gulped.includes(one), 30);

  return [
    ok(seen.length > 1, 'there was a grain to follow', `${seen.length} samples`),
    ok(closing, 'it comes in, and never back out', seen.map(d => Math.round(d)).join(' -> ')),
    // The one the old law could not do: released at rest, directly above, it
    // falls down the line it was on. A spiral would have swung it sideways.
    ok(drift < R * 0.25, 'and straight: no sideways swing it was never given',
       `${Math.round(drift)} px across, radius ${Math.round(R)}`),
    ok(gone, 'and it is gone once it reaches the middle')
  ];
});

group('a grain thrown past it swings, and the same grain dropped does not', async () => {
  tornYard();
  const c = mid(), R = rift.w * 0.5;
  // The same place, the same distance out, twice: once at rest and once with a
  // good sideways clip on it. If the fall were a drawn shape these would be the
  // same journey.
  const put = (vx, vy) => {
    S.gulped.length = 0;
    S.gulped.push({ x0: c.x, y0: c.y - R * 2, x: c.x, y: c.y - R * 2, vx, vy, s: 1 });
    const g = S.gulped[0];
    let swing = 0;
    for (let i = 0; i < 40 && S.gulped.includes(g); i++) {
      swing = Math.max(swing, Math.abs(g.x - c.x));
      run(1 / 30);
    }
    return swing;
  };
  const dropped = put(0, 0);
  const thrown = put(6, 0);

  return [
    ok(thrown > dropped * 2, 'the thrown one goes round it, the dropped one does not',
       `${Math.round(thrown)} px across against ${Math.round(dropped)}`),
    ok(dropped < R * 0.3, 'and the dropped one really is straight',
       `${Math.round(dropped)} px of ${Math.round(R)}`),
    ok(RIFT_G > 0 && RIFT_EAT > 0, 'the pull and the mouth are real numbers')
  ];
});

group('a grain thrown at a torn hole keeps the speed it arrived with', async () => {
  tornYard();
  // Bought the way the yard does it: the crew tip, `riftCatch` takes them at
  // the mouth. Nothing here sets `gulped` by hand.
  runUntil(() => S.gulped.length > 0, 120);
  const flying = S.gulped.slice();
  const moving = flying.filter(m => Math.hypot(m.vx || 0, m.vy || 0) > 0.01);

  // ...and how much of that speed is ACROSS the pull rather than along it,
  // which is the whole of whether the stuff swirls or plunges. `enterDrain`
  // gives every grain a share of the circular speed for where it joined (see
  // RIFT_SWING), so a grain lifted off the pile is not on a collision course
  // with the middle even though it was lying still.
  const c = mid();
  const sideways = flying.map(m => {
    const d = Math.hypot(m.x - c.x, m.y - c.y) || 1;
    const ux = (c.x - m.x) / d, uy = (c.y - m.y) / d;      // toward the middle
    const across = Math.abs((m.vx || 0) * -uy + (m.vy || 0) * ux);
    return across / (Math.hypot(m.vx || 0, m.vy || 0) || 1);
  });
  const swirling = sideways.filter(s => s > 0.2).length;

  return [
    ok(flying.length > 0, 'the hole is eating what the crew tip in', `${flying.length}`),
    ok(flying.every(m => Number.isFinite(m.vx) && Number.isFinite(m.vy)),
       'every grain carries a speed'),
    // The throws arrive moving; grains lifted off the pile were lying still.
    // Both are in the list, so this only asks that the thrown ones kept theirs.
    ok(moving.length > 0, 'and the thrown ones came in with theirs still on them',
       `${moving.length} of ${flying.length} moving`),
    ok(swirling > flying.length * 0.5,
       'and most of them are going ACROSS the pull, not straight down it',
       `${swirling} of ${flying.length} with real sideways speed`)
  ];
});
