// Two kinds of mess, and they are not the same job.
//
// What the sky drops is weather: it lands on everybody's yard and everybody
// clears it, the way they always have. What a body leaves behind is a body's
// own, and shovelling that is a *post* -- it lies where it fell until you put
// somebody on it, and there is nobody to put on it until the outhouse is up.
// Which is what the shed buys: not a tidier yard, but the job.

import { yard, group, ok, state, run, runUntil, openSites } from './helpers.mjs';

group('what a body leaves lies there until somebody is put on it', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);            // so they go while we are watching
  // no rain in this one: the sky is what everybody clears, and this is about the
  // other stack
  window.__air({ haze: 0, muck: 0 });
  run(60);
  const left = state().smog;
  run(120);
  const later = state().smog;

  window.__reset();
  return [
    ok(left.poop > 0, 'a crew with nowhere to go leaves a mess', `${left.poop} cells`),
    ok(later.poop >= left.poop,
       'and nobody clears it, however long they have to think about it',
       `${left.poop} -> ${later.poop}`),
    ok(later.muck.all >= later.poop,
       'and it counts as mess on the ground like anything else',
       `${later.muck.all} of mess, ${later.poop} of it theirs`)
  ];
});

group('the shed buys the job, and the janitor does it', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);
  window.__air({ haze: 0, muck: 0 });
  run(90);
  const messy = state();

  // the shed, and somebody on it
  window.__loo(true);
  window.__air({ janitors: 1 });
  const put = state();
  run(180);
  const swept = state();

  window.__reset();
  return [
    ok(messy.smog.poop > 0, 'there is something to clear up', `${messy.smog.poop} cells`),
    ok(messy.janitors === 0 && put.janitors === 1,
       'nobody can be put on it until the shed is up',
       `${messy.janitors} -> ${put.janitors}`),
    ok(swept.smog.poop < messy.smog.poop,
       'and once somebody is, it goes', `${messy.smog.poop} -> ${swept.smog.poop}`)
  ];
});

group('the shed is offered once the yard is in a state', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);
  window.__air({ haze: 0, muck: 0 });
  run(0.2);                                    // a frame, so the readings are this yard's
  const clean = state();
  const offered = () => !!window.__upgrades().find(u => u.key === 'unlockouthouse')?.show();
  const before = offered();
  run(120);
  const after = offered();
  window.__reset();
  return [
    ok(clean.smog.poop === 0, 'a new yard is clean', `${clean.smog.poop}`),
    ok(!before, 'and the shed is not on the board yet'),
    ok(after, 'five patches of it later, it is')
  ];
});

// Nobody ever ends up nowhere.
//
// The janitor was given something to do while it waits, read a sway phase that
// nothing had given it, and multiplied its position by the sine of `undefined`.
// A body at NaN is a body nowhere -- it vanishes off the yard, and asking the
// view to follow it takes you to an empty white corner of the world.
//
// It is checked for the whole crew rather than for the janitor, because the
// cause was a per-trade habit -- some factories handed out a rhythm and some did
// not -- and the next trade to be given an idle would have found the same hole.
group('every body has a rhythm, and none of them ends up nowhere', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(2, 2, 3, 3, 0, 1);
  window.__loo();
  window.__assign('janitors', 1);
  window.__air({ muck: 40 });
  run(3);

  const bodies = () => yard.S.workers;
  const noPhase = [];
  let lost = null;
  for (let i = 0; i < 40; i++) {
    run(1);
    for (const w of bodies()) {
      if (!Number.isFinite(w.ph)) noPhase.push(`${w.type}:${w.name}`);
      if (!Number.isFinite(w.x) || !Number.isFinite(w.y)) {
        lost = lost || `${w.type}:${w.name} at ${w.x},${w.y}`;
      }
    }
  }
  const types = [...new Set(bodies().map(w => w.type))];
  window.__crew(0, 0, 0);
  return [
    ok(types.length >= 4, 'a yard with several trades in it', types.join(',')),
    ok(noPhase.length === 0, 'every body has a sway of its own',
       [...new Set(noPhase)].join(', ') || 'all of them do'),
    ok(!lost, 'and nobody is at a position that is not a number', lost || 'nobody')
  ];
});
