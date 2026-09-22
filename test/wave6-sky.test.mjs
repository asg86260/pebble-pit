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

import { group, ok, state, run, runUntil, makeItRain, buyNow, openSites, yard } from './helpers.mjs';
import { RAIN_WASH } from '../src/config.js';

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

// Item 3: the walk spaces what is drawn, not what is reserved. The apothecary
// used to hold three unbought pots' worth of bare ground; growth re-walks the
// yard instead, so a pot bought like a player moves the station's own wall out
// and everything past it along by the same step -- and nothing on the near
// side moves at all.
group('buying a pot re-walks the yard rather than spending reserved ground', async () => {
  run(0.4);
  window.__crew(3, 3, 3, 3);
  openSites();
  window.__fullSites();
  window.__grant({ dust: 99999, shards: 9999, spores: 99999, sparks: 999, cores: 9 });
  const opened = buyNow('unlockapothecary');
  run(1);
  // The second pot reveals after batches have landed (the grind pass); this
  // check is about the ground it breaks, not the reveal.
  yard.S.brews = 5;
  const before = state();
  const bought = buyNow('anotherpot');
  run(1);
  const after = state();
  const step = before.apothecaryX - after.apothecaryX;
  // Everything standing past the apothecary, which is everything left of it:
  // the yard is walked leftwards from the rock, so a station that grows pushes
  // its far-side neighbours along and leaves the rock side alone.
  //
  // This named the lab, which is deleted -- and a deleted building's rect is
  // never seated, so it read 0 -> 0 and the check compared nothing with
  // nothing. Every site out there is asked now instead of one: naming a
  // neighbour was the fault, and picking a different name would be the same
  // fault waiting for the next building to go.
  const past = Object.keys(before.stands)
    .filter(k => before.stands[k].x < before.apothecaryX && after.stands[k]);
  const stayed = past.filter(k => before.stands[k].x - after.stands[k].x !== step);
  window.__crew(0, 0);
  return [
    ok(opened && bought, 'the pot is bought like a player, through the row'),
    ok(step > 0, 'the apothecary grows into fresh ground on its far side',
       `${before.apothecaryX} -> ${after.apothecaryX}`),
    ok(past.length > 0 && !stayed.length,
       'and everything past it steps along by the same distance',
       stayed.map(k => `${k} ${before.stands[k].x} -> ${after.stands[k].x}`).join(', ')
       || `${past.join(', ')} all moved ${step}`),
    ok(after.benchX === before.benchX,
       'while nothing on the rock side of it moves',
       `bench ${before.benchX} -> ${after.benchX}`)
  ];
});

// The storm, watched all the way through: the brew first, then a drizzle
// gentler than the pour, then the taper, and an end with every marked mote
// down and the rest of the sky still up.
group('a storm brews up, pours, and trails off', async () => {
  run(0.4);
  window.__crew(0, 0);
  window.__air({ haze: state().smog.cap, muck: 0 });

  // The front brought forward (the rain is on its own clock), and what it
  // starts is a brew, not a shower: no drop falls while the clouds swell.
  window.__front(1);
  const brewed = runUntil(() => state().smog.brewing, 5);
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

  // The taper: watched down to the end. When it stops there is nothing
  // marked left, and the sky it did not mark is still there.
  runUntil(() => !state().smog.raining, 120);
  const done = state().smog;
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(brewed, 'the front brews up'),
    ok(noRainYet, 'with not a drop falling while it brews',
       `${mid.drops} drops, raining ${mid.raining}`),
    ok(atOpen.raining && atOpen.rains >= 1, 'then the drizzle begins'),
    ok(drizzle < peak / 2, 'and the drizzle is far gentler than the pour',
       `${drizzle} drops in the air against ${peak} at the peak`),
    ok(done.left === 0, 'and the shower ends clean: every marked mote falls',
       `${done.left} marked left`),
    // The rest: a storm washes RAIN_WASH of the sky, and the house takes the rest.
    ok(done.haze > done.cap * (1 - RAIN_WASH) * 0.6, 'while the sky it did not mark is still up there',
       `${Math.round(done.haze)} of ${done.cap} haze left`)
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
