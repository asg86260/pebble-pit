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
    ok(idle.resting > 0, 'a gang with nowhere to put anything is stood about',
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
group('a crew with nowhere to put anything walks home rather than freezing', async () => {
    run(0.4);
  window.__crew(3, 6);
  window.__levels({ minerSpeedLevel: 8, haulPaceLevel: 4, haulCarryLevel: 2 });
  // The hole is the whole hole from the first frame now, so filling it by
  // mining is an hour of yard. It is handed over instead: what this check is
  // about is what the crew do once there is nowhere to put anything, not how
  // long it takes to get there.
  window.__give(999999);
  runUntil(() => state().pitFull, 30);
  runUntil(() => state().houses.home === 6, 120);
  const full = state();

  // nobody is left standing about in the middle of the yard
  const out = () => state().crewDetail.filter(d => d[0] === 'h' && !d.includes('|home|'));
  const stalled = out();

  // and room in the hole brings them all straight back out. It used to be a dig
  // that made the room; the hole does not grow any more, so it is dust going out
  // of it instead -- which is the same fact from the crew's side.
  window.__spend(4000);
  // Measured from *after* the room was made, not from the full hole: making the
  // room is itself dust going out, so the old comparison was asking the crew to
  // carry back everything that was spent before it counted as carrying at all.
  const freed = state();
  runUntil(() => state().houses.home === 0 && state().stored > freed.stored, 60);
  const dug = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(full.pitFull, 'the hole is full', `${full.stored} of ${full.pitCapacity}`),
    ok(full.floorGrains > 100, 'and the yard is not', `${full.floorGrains} lying about`),
    ok(full.houses.home === 6, 'so every one of them has gone home',
       `${full.houses.home} in, ${stalled.length} still out`),
    ok(dug.houses.home === 0, 'and room in it brings them all back out',
       `${dug.houses.home} still in`),
    ok(dug.stored > freed.stored, 'carrying again', `${freed.stored} -> ${dug.stored}`)
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
    ok(away.some(d => d > 200), 'they go where they were working, wherever that is',
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
