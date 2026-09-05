// Wave 6, track B: the sky as a total and the storm as an event.
//
// Item 4: the haze is one pool over the whole yard. A settled mote's place is
// its slot alone -- uniform over the span -- so the band reads as an even
// ceiling at every level and never as pillars over the machines.
//
// Item 5: a storm has a shape. The break rolls a brew-up -- twenty seconds of
// darkness before a drop falls -- then a drizzle, a smoothstep up to the full
// pour, and a taper at the end so it trails off instead of cutting. A brim sky
// is about forty seconds of shower, and every marked mote still goes.

import { group, ok, state, run, runUntil, makeItRain } from './helpers.mjs';

// The band is uniform by construction, at a working level and at the brim: the
// fullest strip of sky holds barely more than the average one, from the frame
// the sky is filled -- there is no seven-minute widening left to wait out.
group('the haze lies as one even band, not banks over the machines', async () => {
  run(0.4);
  window.__crew(0, 0);
  window.__air({ haze: 900 });
  run(2);
  const light = state().smog;
  window.__air({ haze: state().smog.cap - 100 });
  run(2);
  const heavy = state().smog;
  window.__air({ haze: 0 });
  return [
    ok(light.clumpiness < 3, 'a light sky is already even across the yard',
       `${light.clumpiness} fullest-strip over average`),
    ok(heavy.clumpiness < 1.6, 'and a heavy one is very nearly flat',
       `${heavy.clumpiness}`),
    ok(heavy.skyBins > 100, 'with something in nearly every strip of it',
       `${heavy.skyBins} strips occupied`)
  ];
});

// The storm, watched all the way through: darkness first, then a drizzle
// gentler than the pour, then the taper, and a clean end with the wash gone.
group('a storm brews up, pours, and trails off', async () => {
  run(0.4);
  window.__crew(0, 0);
  window.__air({ haze: state().smog.cap, muck: 0 });

  // The roll lands within a look or two at the brim, and what it starts is a
  // brew, not a shower: no drop falls while the sky darkens.
  const brewed = runUntil(() => state().smog.brewing, 30);
  const early = state().smog;
  run(10);
  const mid = state().smog;
  const noRainYet = !mid.raining && mid.drops === 0;

  // The drizzle: the first seconds of the shower fall far below the full rate.
  runUntil(() => state().smog.raining, 30);
  const atOpen = state().smog;
  // Drops in the air are the rate times their fall, so the two counts compare
  // the drizzle's rate against the pour's without timing either.
  run(3);
  const drizzle = state().smog.drops;
  run(12);                                     // well past the rise
  const peak = state().smog.drops;
  const washAtPeak = state().smog.storming;

  // The taper: watched down to the end. The rate falls away with what is left,
  // the wash falls with it, and when it stops there is nothing marked left.
  runUntil(() => !state().smog.raining, 120);
  const done = state().smog;
  run(4);
  const after = state().smog;
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(brewed, 'a brim sky commits to a storm within a look or two'),
    ok(early.storming < mid.storming && mid.storming > 0.2,
       'and the sky darkens through the brew-up',
       `${early.storming} -> ${mid.storming}`),
    ok(noRainYet, 'with not a drop falling while it brews',
       `${mid.drops} drops, raining ${mid.raining}`),
    ok(atOpen.raining && atOpen.rains >= 1, 'then the drizzle begins'),
    ok(drizzle < peak / 2, 'and the drizzle is far gentler than the pour',
       `${drizzle} drops in the air against ${peak} at the peak`),
    ok(washAtPeak > 0.8, 'the darkness holds through the pour', `${washAtPeak}`),
    ok(done.haze < 40, 'and the shower still ends clean: every marked mote falls',
       `${Math.round(done.haze)} haze left`),
    ok(after.storming < washAtPeak && after.storming < 0.2,
       'while the wash fades back out with the taper',
       `${washAtPeak} -> ${after.storming}`)
  ];
});

// The length: a brim sky is tens of seconds of weather now, not a bucket. The
// watch starts at the first drop and ends when the rain stops.
group('a brim sky is a long storm rather than a tipped bucket', async () => {
  run(0.4);
  window.__crew(0, 0);
  makeItRain();
  let fell = 0;
  for (let i = 0; i < 480 && state().smog.raining; i++) { run(0.25); fell += 0.25; }
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(fell > 25, 'the shower runs the better part of a minute',
       `${fell.toFixed(1)}s of rain`),
    ok(fell < 90, 'but it does end', `${fell.toFixed(1)}s`)
  ];
});
