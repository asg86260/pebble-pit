// A crew with nothing to do. Standing about is a state the yard has to be
// deliberate about: frozen squares read as a bug, and a gang stood at a full
// hole with dust in its hands reads as one too.

import { group, ok, state, run, runUntil, quickCrew, haveRock, openSites, P, WORKER } from './helpers.mjs';

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
  // Two waits, not one. Filling the scrape is the setup and the walk home is
  // the check, so stopping at the moment the hole filled left six bodies still
  // crossing the yard -- and running a flat four hundred seconds instead spent
  // twenty thousand frames watching a yard that had already gone quiet.
  runUntil(() => state().pitFull, 300);
  runUntil(() => state().houses.home === 6, 120);
  const full = state();

  // nobody is left standing about in the middle of the yard
  const out = () => state().crewDetail.filter(d => d[0] === 'h' && !d.includes('|home|'));
  const stalled = out();

  // and a dig brings them all straight back out
  window.__dig(4);
  runUntil(() => state().houses.home === 0 && state().stored > full.stored, 60);
  const dug = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(full.pitFull, 'the hole is full', `${full.stored} of ${full.pitCapacity}`),
    ok(full.floorGrains > 100, 'and the yard is not', `${full.floorGrains} lying about`),
    ok(full.houses.home === 6, 'so every one of them has gone home',
       `${full.houses.home} in, ${stalled.length} still out`),
    ok(dug.houses.home === 0, 'and a dig brings them all back out',
       `${dug.houses.home} still in`),
    ok(dug.stored > full.stored, 'carrying again', `${full.stored} -> ${dug.stored}`)
  ];
});
