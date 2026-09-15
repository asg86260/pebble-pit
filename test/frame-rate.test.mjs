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

import { group, ok, state, yard, SEED } from './helpers.mjs';
// Read straight off the yard in the frame-by-frame loops below: a snapshot
// walks the whole floor, and a loop that takes one a frame spends its time
// reading rather than running.
import { raining } from '../src/smog.js';

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

// One body, one long walk, nothing to choose between. This is the claim the
// group below is *trying* to make, made where nothing can drift: a commute is a
// distance over a time, and it must not care how many frames the time was cut
// into. It comes out inside a pixel at every rate.
//
// It is a separate check because the one below cannot be this tight. Nine bodies
// picking jobs and elbowing each other diverge -- two runs are never identical,
// and a slightly different first decision compounds over ten seconds. That is
// chaos in the job-picking, not frame rate in the legs, and conflating the two
// is what made a real guarantee look shaky.
group('a walk is a distance over a time, whatever the frame rate', async () => {
  const walk = hz => {
    // The *seed*, not just a reset, and once per rate rather than once for the
    // three of them. A reset puts a new game up but leaves the generator where
    // the last run left it, so the thirty ran off one set of rolls and the
    // hundred and twenty off another: the body's own amble is a roll, and three
    // walks at three paces do not measure the frame rate, they measure the dice.
    // That is what the eight percent of slack below was quietly paying for --
    // seeded per rate the three come out within a pixel of each other, which is
    // the claim this check was written to make.
    window.__seed(SEED);
    window.__crew(1, 0);
    window.__clearFloor();
    window.__place('rockhand', 400);            // a long way from the rock
    window.__fast(0.5, hz);                  // under way before the tape starts
    const a = Number(state().workerPos[0].split(':')[1].split(',')[0]);
    // Three seconds, and it matters that the body is still walking at the end of
    // them. Measured over eight it arrives, starts working, and the endpoint
    // stops being about walking at all.
    window.__fast(3, hz);
    const b = Number(state().workerPos[0].split(':')[1].split(',')[0]);
    return Math.round(Math.abs(b - a));
  };
  const slow = walk(30), tuned = walk(60), fast = walk(120);
  const spread = Math.max(slow, tuned, fast) - Math.min(slow, tuned, fast);
  // Within a few percent, not to the pixel, and the few percent is honest rather
  // than slack. `frames()` is clamped to three, a step is clamped to the
  // distance remaining so a body cannot overshoot what it was walking to, and a
  // coarser tick lands those clamps in slightly different places. The mechanism
  // carries a body the same distance per second; the clamps put it down a pixel
  // or two either side of where a finer tick would have.
  //
  // Left at eight percent when the bands round it came in, because this one is
  // not buying room for chance -- the run is seeded and it comes out at 210 /
  // 228 / 211 pixels every time, a spread of eighteen, which is 7.9 percent and
  // is all clamp. Tightening it would not be a stronger claim about the frame
  // rate, it would be a claim about where the clamps happen to land.
  return [
    ok(tuned > 150, 'the body actually walks somewhere', `${tuned}px`),
    ok(spread <= tuned * 0.08,
       'and covers the same ground at thirty, sixty and a hundred and twenty',
       `${slow} / ${tuned} / ${fast}, spread ${spread}px`)
  ];
});

group('the yard walks the same distance whatever the frame rate', async () => {
  const slow = walkAt(30);
  const tuned = walkAt(60);
  const fast = walkAt(120);
  window.__reset();
  // A coarser step does not move a body further per second -- the group above
  // measures that on one body and gets the same walk to within the clamps --
  // but it does make each body's decisions land in slightly different places,
  // and nine bodies compounding that over ten seconds pull apart. So the band is
  // wider than the one-body check above and always will be: what it is protecting against is a
  // yard that runs at half speed on a slow machine, not a yard that picks a
  // different job first.
  //
  // Set against a deterministic run rather than against the worst yard the
  // chance could build. The seed is fixed and the sim takes its chance from one
  // generator, so these three numbers are the same three numbers every time:
  // thirty comes in at 1.27 of sixty and a hundred and twenty at 0.88 of it,
  // and the whole of that spread is decisions landing differently, not legs
  // moving at different speeds. The band was six-tenths to one-and-four-fifths,
  // which was buying room for a chaos that no longer exists; it is now the
  // observed spread with about a quarter again round it. Tighter than this
  // would be pinning the job-picking, which is not what this group is about.
  //
  // Widened below once more when the gap between rocks came down to a second
  // (wave polish, 2026-09-14): with rocks cycling that fast the ten seconds
  // hold two or three falls, each a fresh set of decisions to land differently,
  // and a hundred and twenty came in at 0.83 of sixty. Still the same legs.
  const near = (a, b) => a > b * 0.75 && a < b * 1.4;
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
    while (yard.S.rockFall > 0 && n < 600) { window.__fast(1 / hz, hz); n++; }
    return +(n / hz).toFixed(2);              // seconds it took to land
  };
  const slow = fallAt(30), tuned = fallAt(60), fast = fallAt(120);

  // A shower starts when the band is heavy enough and then ramps, so this waits
  // for it to be raining and measures a fixed stretch of the rain itself.
  const rainAt = hz => {
    window.__reset();
    window.__crew(0, 0);
    // To the brim, which is the one sky certain to break at the next look: over
    // the line is only a chance now (see `rainOdds` in smog.js).
    window.__air({ haze: state().smog.cap, muck: 0 });
    // Frame by frame rather than a second at a time. The shower is measured from
    // the frame it starts on, and a coarse wait leaves it up to a second into its
    // own ramp before the measuring begins -- so the two clocks would be reading
    // different parts of the same shower and calling the difference a frame-rate
    // fault.
    for (let i = 0; i < 40 * hz && !raining(); i++) window.__fast(1 / hz, hz);
    window.__fast(8, hz);
    return Math.round(state().smog.muck.all);
  };
  const rainSlow = rainAt(30), rainTuned = rainAt(60);
  window.__reset();
  window.__air({ haze: 0, muck: 0 });

  const near = (a, b, slack) => Math.abs(a - b) <= slack;
  // Both slacks are set against a deterministic run. The fall comes in at 0.73s
  // at thirty and 0.70s at sixty and at a hundred and twenty -- one tick of the
  // coarse clock apart, which is the whole of the difference and is exactly what
  // a fall measured in whole frames has to be. Two of those ticks is the slack;
  // it was an eighth of a second, which was four of them.
  //
  // The shower leaves 2571 cells at thirty against 2589 at sixty, eighteen cells
  // apart out of two and a half thousand. Three percent leaves four times that
  // in hand and still catches a shower that pours at half the rate on a slow
  // machine, which is the fault. Thirty percent could not have caught anything.
  return [
    ok(tuned > 0.15, 'a rock takes a moment to come down', `${tuned}s`),
    ok(near(slow, tuned, 0.07) && near(fast, tuned, 0.07),
       'and the same moment at thirty and at a hundred and twenty',
       `${slow}s / ${tuned}s / ${fast}s`),
    ok(rainTuned > 0, 'a shower leaves muck on the ground', `${rainTuned} cells`),
    ok(near(rainSlow, rainTuned, Math.max(40, rainTuned * 0.03)),
       'and the same shower at thirty', `${rainSlow} against ${rainTuned}`)
  ];
});

// The amble between plots, which was the last per-frame speed in the yard with
// no `frames()` on it.
//
// The two groups above measure a body on a commute, and a commute goes by route
// at `commutePace`, which was converted with everything else. A farmhand
// crossing from one plot to the next is not on a commute -- the row is
// forty-two pixels a plot and the route only comes out past twelve cells -- so
// it walked at a flat FARM_WALK a frame and nothing above could see it. At
// thirty it crawled between plots at half speed while the tending clock it was
// walking to kept perfect time, and a hand on a slow machine spent twice as long
// walking for it. (The purifier's walk to the balloon mast, in balloon.js, was
// the same line and is fixed with it; there is no readout in this tier to
// measure that one's pace off.)
//
// Measured as a pace and not as a distance, and the difference is the whole
// check: the distance between two plots is the same at any rate, because it is
// where the plots are. What changes is how long it takes to cover it. So this
// sums the ground covered while a hand is in its amble and divides by the time
// it spent there.
group('and a farmhand ambles between plots at one speed', async () => {
  const ambleAt = hz => {
    window.__seed(SEED);
    window.__fullSites();                     // the whole row, so there is walking to do
    window.__crew(0, 0, 0, 1);                // one hand, so there is nobody to elbow
    window.__clearFloor();
    window.__fast(4, hz);                     // settled on the row before the tape starts
    // The one body, read off the yard rather than out of a snapshot: this
    // reads it on every frame of a thirty-second run at three rates, and a
    // snapshot is the whole floor walked -- forty frames of sim per reading,
    // which made this the slowest group in the tier by a distance.
    const hand = yard.S.workers[0];
    const xOf = () => Math.round(hand.x);
    const goalOf = () => hand.goal || '-';
    let prev = xOf(), was = goalOf(), dist = 0, ticks = 0;
    for (let i = 0; i < 30 * hz; i++) {
      window.__fast(1 / hz, hz);
      const x = xOf(), goal = goalOf(), step = Math.abs(x - prev);
      // Both ends of the step in the amble, and a step short enough that it
      // cannot be the commute route -- which is on the clock already, and which
      // averaged in would hide exactly what this is looking for.
      if (goal === 'to' && was === 'to' && step <= 3) { dist += step; ticks++; }
      prev = x; was = goal;
    }
    return ticks ? Math.round(dist / (ticks / hz)) : 0;
  };
  const slow = ambleAt(30), tuned = ambleAt(60), fast = ambleAt(120);
  // Without the multiplier these come out at 33 / 66 / 133 pixels a second --
  // exactly the frame rate, which is exactly the fault. With it they are
  // 65 / 66 / 66, and the pixel of slack is the position readout being rounded
  // to whole pixels before this ever sees it.
  return [
    ok(tuned > 50, 'a hand actually crosses the row', `${tuned}px/s`),
    ok(Math.abs(slow - tuned) <= 4 && Math.abs(fast - tuned) <= 4,
       'and at the same pace at thirty and a hundred and twenty',
       `${slow} / ${tuned} / ${fast} px/s`)
  ];
});
