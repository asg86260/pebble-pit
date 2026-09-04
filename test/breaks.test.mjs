// A crew with nothing to do. Standing about is a state the yard has to be
// deliberate about: frozen squares read as a bug, and a gang stood at a full
// hole with dust in its hands reads as one too.

import { yard, group, ok, state, run, runUntil, quickCrew, haveRock, openSites, P, WORKER } from './helpers.mjs';

// Nothing here makes, spends or moves anything: it is the yard at rest, and
// the one rule that matters is that a break only ever happens to a body that
// had stopped anyway.
group('a stopped crew takes a break, a working one does not', async () => {
    run(0.4);
  // A gang stood down over a full yard rather than idle haulers.
  //
  // Both are stopped and both are entitled to a break, but a hauler with
  // nothing to fetch knocks off and goes home after a minute or so, and a
  // break turn only comes round every twenty-odd seconds and then lands one
  // time in three. So they get two chances each and the yard empties, and a
  // check watching for something rare in a window that keeps closing fails on
  // the timing rather than on the behaviour. A gang standing over a full pile
  // never goes home -- and it is where you actually see this in play.
  window.__crew(6, 0);
  window.__clearFloor();
  const rockX0 = state().rockX;
  for (let i = 0; i < 40; i++) window.__pile(rockX0 + 120 + i * 6, 60);
  run(3);
  const seen = [];
  let resting = 0, cig = 0;
  for (let i = 0; i < 60; i++) {
    run(2);
    const s = state();
    resting = Math.max(resting, s.resting);
    cig = Math.max(cig, s.cigSmoke);
    for (const b of s.breaks) if (!seen.includes(b.kind)) seen.push(b.kind);
  }
  const idle = { resting, breaks: seen, cig };
  // and now clear the yard, so the gang has a rock to get back to
  window.__clearFloor();
  run(6);
  const busy = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    // Five of the six, not "somebody". The seed is fixed and the run repeats, so
    // this is measured rather than hoped for: all six of them are stood about
    // over the two minutes this watches, every time. "More than nought" was the
    // band a run-to-run yard needed -- one body idling would have passed it while
    // the other five carried on working a yard they cannot put anything down in,
    // which is the fault this group exists to catch.
    ok(idle.resting >= 5, 'a gang with nowhere to put anything is stood about',
       `${idle.resting} of 6`),
    ok(idle.breaks.length > 0, 'and somebody, now and then, gets up to something',
       idle.breaks.join(',')),
    ok(idle.breaks.every(k => ['smoke', 'sing', 'curse', 'talk'].includes(k)),
       'smoking, singing, swearing or talking, and nothing else',
       idle.breaks.join(',')),
    ok(!idle.breaks.includes('smoke') || idle.cig > 0,
       'and a cigarette puts smoke in the air', `${idle.cig} puffs`),
    ok(busy.breaks.length === 0,
       'and the moment there is room again, nobody is having one',
       JSON.stringify(busy.breaks))
  ];
});

// A full hole tells everybody to stand down, and standing down eventually
// means going home. Those two rules fought: the stand-down put a body walking
// to the door back on `idle`, the idle branch sent it home again the next
// frame, and it never took a step -- the whole crew stock still between the
// pile and the lip with a yard full of dust they could not move.
// This used to be "a crew with nowhere to put anything walks home rather than
// freezing", and it was the best that could be done with a yard that had
// stopped: everybody indoors is at least somewhere, rather than a row of bodies
// stood still in the middle of the works.
//
// There is no such state any more. The hole collapses the first time it cannot
// take a grain and what will not fit goes through the rift, so there is always
// somewhere to put a load down. The check is the other way round now: fill the
// hole past the brim and nobody knocks off at all.
group('a full hole does not send the crew home any more', async () => {
    run(0.4);
  window.__crew(3, 6);
  window.__levels({ rockhandSpeedLevel: 8, haulPaceLevel: 4, haulCarryLevel: 2 });
  window.__give(999999);                     // far more than the hole holds
  runUntil(() => state().riftOpen, 30);
  const before = state();
  run(40);                                   // long enough for a stopped yard to empty
  const after = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(before.riftOpen, 'the hole has collapsed under it',
       `${before.stored} counted, ${before.pitDust} in the pile`),
    ok(after.floorGrains > 100, 'with plenty still on the ground to fetch',
       `${after.floorGrains} lying about`),
    ok(after.houses.home === 0, 'and not one of them has knocked off',
       `${after.houses.home} indoors`),
    ok(after.stored > before.stored, 'the yard is still banking',
       `${before.stored} -> ${after.stored}`),
    // ...and it is banking into the rift, which is where a full hole puts it.
    ok(after.rift > before.rift, 'through the rift, because the pile is full',
       `${before.rift} -> ${after.rift} through`)
  ];
});

// What the closet buys is a job, not a place.
//
// It was a shed the crew walked to: across the yard, in for a minute, out, and
// back to work, several times an hour each. That is a lot of walking to buy, it
// takes bodies off the job for the length of it, and it makes the purchase a
// destination when what you actually wanted was somebody whose job it is to
// clear up. So they go where they stand, whether the closet is up or not, and
// what the closet changes is that a janitor can be posted at all.
group('the closet buys the job, not somewhere to walk to', async () => {
  window.__crew(3, 3);
  window.__loo();                            // the closet up
  window.__tune('LOO_EVERY', 4000);          // ten minutes a body, wound in
  window.__air({ haze: 0, muck: 0 });
  run(4);

  const shed = state().outhouseX;
  // where they were when they went, and how far that is from the closet
  const went = runUntil(() => state().saying > 0, 120);
  const going = yard.S.workers.filter(w => w.say && w.say.mark === 'loo');
  const away = going.map(w => Math.round(Math.abs(w.x - shed)));
  const nobodyIn = state().inLoo === 0;

  run(30);
  const after = state();

  window.__tune('LOO_EVERY', 600000);
  window.__crew(0, 0);
  return [
    ok(went && going.length > 0, 'a body due one goes', `${going.length} at it`),
    ok(nobodyIn, 'and nobody is inside the shed, because nobody walked to it',
       `${state().inLoo} inside`),
    // Four hundred pixels, against the six hundred and seventy-five the one body
    // due a break is actually standing at on a seeded run. Two hundred was the
    // old band, and two hundred is a distance a body could be from the closet
    // while still walking to it -- which is the very thing this is meant to rule
    // out.
    ok(away.some(d => d > 400), 'they go where they were working, wherever that is',
       `${away.join(', ')}px from the closet`),
    ok(after.smog.poop > 0, 'and what they leave is left there for somebody to clear',
       `${after.smog.poop} cells`)
  ];
});

// A job you mostly see idle wants an idle you can recognise.
//
// A janitor stands at its post all day and does nothing until somebody makes a
// mess, so the standing about is most of what you ever see it do. Left on the
// yard's usual break -- a turn every twenty-odd seconds, landing one time in
// three, and then any of four things -- what you see is a square not moving. So
// the janitor's break is a habit rather than a turn: it comes round every time,
// and it is always the cigarette.
group('a janitor on his break smokes, every time', async () => {
  window.__crew(2, 0);
  window.__loo();
  window.__air({ janitors: 1, haze: 0, muck: 0 });
  window.__clearFloor();
  window.__tune('LOO_EVERY', 600000);        // nobody makes work for him
  run(4);

  const kinds = [];
  let cig = 0;
  for (let i = 0; i < 60; i++) {
    run(2);
    const s = state();
    cig = Math.max(cig, s.cigSmoke);
    for (const b of s.breaks) if (b.type === 'janitor' && !kinds.includes(b.kind)) kinds.push(b.kind);
  }

  window.__air({ janitors: 0 });
  window.__crew(0, 0);
  return [
    ok(kinds.length > 0, 'a janitor with nothing to shovel gets up to something',
       kinds.join(',')),
    ok(kinds.every(k => k === 'smoke'), 'and it is a cigarette, never anything else',
       kinds.join(',')),
    ok(cig > 0, 'which puts smoke in the air over him', `${cig} puffs`)
  ];
});

// The loo clock is an hour of work, and a body in your hand is not working.
//
// The clock is a deadline rather than a countdown, so anything that stops a body
// working has to push the deadline out with it or the body is overdue the moment
// it starts again. That was fixed for sleeping behind a front door and for the
// two rooms with doors on them -- and picking somebody up is the same fact
// arriving by a road the fix did not cover. A body carried across the yard did
// nothing for the whole trip and was charged for every second of it, so putting
// one down set it straight off to the closet.
group('a body held on the cursor is not owing the yard an hour', async () => {
  window.__reset();
  window.__crew(2, 0);
  window.__loo();
  run(5);

  const w = yard.S.workers[0];
  const due = () => w.looAt - yard.clock.now();
  const armed = !!w.looAt;
  const before = due();

  // ten seconds in the air on the cursor
  for (let i = 0; i < 34; i++) { w.lifted = true; run(0.3); }
  const held = due();
  w.lifted = false;

  // ...and then shaken: let go of, falling, and standing where it lands seeing
  // stars. Nothing it does through any of that is work either.
  const wobbled = window.__shake(0);
  const after0 = due();
  runUntil(() => !w.falling && !w.dizzyUntil, 20);
  const after = due();

  window.__crew(0, 0);
  return [
    ok(armed, 'the body has a break due at some point'),
    // Within a frame or two of where it was: what it has already waited still
    // counts, it simply does not owe for the time it spent off the ground.
    ok(Math.abs(held - before) < 600,
       'ten seconds in the hand costs it nothing off its clock',
       `${Math.round((before - held) / 1000)}s lost`),
    ok(wobbled && wobbled.dizzyFor > 0, 'and a shaking leaves it seeing stars',
       JSON.stringify(wobbled)),
    ok(Math.abs(after - after0) < 1200,
       'and neither does the fall and the wobble at the end of it',
       `${Math.round((after0 - after) / 1000)}s lost`)
  ];
});
