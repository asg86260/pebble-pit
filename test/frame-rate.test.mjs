// The yard does the same amount of yard per second whatever the machine is
// drawing at.
//
// Everything that *counts* in this game has always been on the clock: how fast
// a rock comes apart, how long research takes, how quickly the sky fouls. What
// was not on the clock was everything that *moves* -- walking, falling,
// climbing, rain, clouds, the shake -- all of it written as pixels a frame,
// which is a speed only if the frames arrive at one rate. On a machine drawing
// thirty the yard walked at half speed while its clocks kept perfect time, so a
// body took twice as long to reach a job that still finished exactly when it
// always had.
//
// `__fast(seconds, hz)` pretends to be a machine drawing at `hz`. Sixty is what
// every other check uses and what the game is tuned in; these run the same
// stretch of yard at thirty and a hundred and twenty and expect the same
// distance covered.

import { group, ok, state, yard } from './helpers.mjs';

// how far the crew get in ten seconds, from the same start, at a given rate
const walkAt = hz => {
  window.__reset();
  window.__crew(6, 3);
  window.__clearFloor();
  window.__fast(3, hz);                       // let them pick jobs and set off
  const from = state().workerPos.map(p => p.split(':')[1]);
  window.__fast(10, hz);
  const to = state().workerPos.map(p => p.split(':')[1]);
  let moved = 0;
  for (let i = 0; i < Math.min(from.length, to.length); i++) {
    const [ax, ay] = from[i].split(',').map(Number);
    const [bx, by] = to[i].split(',').map(Number);
    moved += Math.hypot(bx - ax, by - ay);
  }
  return Math.round(moved);
};

group('the yard walks the same distance whatever the frame rate', async () => {
  const slow = walkAt(30);
  const tuned = walkAt(60);
  const fast = walkAt(120);
  window.__reset();
  // Generous, and it has to be: bodies pick jobs, claim patches and elbow each
  // other, so two runs are never identical to the pixel. What is being checked
  // is that thirty is not half of sixty, which is what it was.
  const near = (a, b) => Math.abs(a - b) <= Math.max(60, b * 0.25);
  return [
    ok(tuned > 200, 'the crew get somewhere at sixty', `${tuned}px`),
    ok(near(slow, tuned), 'and the same somewhere at thirty',
       `${slow}px against ${tuned}px`),
    ok(near(fast, tuned), 'and at a hundred and twenty',
       `${fast}px against ${tuned}px`)
  ];
});

group('and a rock falls, and rain lands, on the clock too', async () => {
  const fallAt = hz => {
    window.__reset();
    window.__crew(0, 0);
    window.__next();                          // a rock on its way down
    let n = 0;
    while (state().rockFall > 0 && n < 600) { window.__fast(1 / hz, hz); n++; }
    return +(n / hz).toFixed(2);              // seconds it took to land
  };
  const slow = fallAt(30), tuned = fallAt(60), fast = fallAt(120);

  // A shower starts when the band is heavy enough and then ramps, so this waits
  // for it to be raining and measures a fixed stretch of the rain itself.
  const rainAt = hz => {
    window.__reset();
    window.__crew(0, 0);
    // over the line a shower starts at, which is SMOG_RAIN_AT
    window.__air({ haze: 4000, muck: 0 });
    for (let i = 0; i < 40 && !state().smog.raining; i++) window.__fast(1, hz);
    window.__fast(8, hz);
    return Math.round(state().smog.muck.all);
  };
  const rainSlow = rainAt(30), rainTuned = rainAt(60);
  window.__reset();
  window.__air({ haze: 0, muck: 0 });

  const near = (a, b, slack) => Math.abs(a - b) <= slack;
  return [
    ok(tuned > 0.15, 'a rock takes a moment to come down', `${tuned}s`),
    ok(near(slow, tuned, 0.12) && near(fast, tuned, 0.12),
       'and the same moment at thirty and at a hundred and twenty',
       `${slow}s / ${tuned}s / ${fast}s`),
    ok(rainTuned > 0, 'a shower leaves muck on the ground', `${rainTuned} cells`),
    ok(near(rainSlow, rainTuned, Math.max(40, rainTuned * 0.3)),
       'and the same shower at thirty', `${rainSlow} against ${rainTuned}`)
  ];
});
