// A hole with no room left in it. Everything in here is about the moment the
// pile stops taking anything: what the counter says, what the crew do, and where
// a grain goes when the hole turns it away.
//
// Its own file rather than the bottom of pit.test.mjs because filling a dug-out
// hole is the slowest thing any check does, and node runs files side by side --
// so the slow ones are worth keeping together and out of everybody's way.

import { group, ok, state, run, runUntil, quickCrew, haveRock, bankCore, P, WORKER } from './helpers.mjs';

group('filling the pit stops at what the hole holds', async () => {
  window.__dig();
  const cap = state().pitCapacity;
  window.__tip(cap * 2);                     // twice what the hole can take
  run(0.8);
  const s = state();
  return [
    // it does not stop at the brim -- it heaps over the mouth -- but it stops
    // at what the plot will hold, and never gets out onto the ground
    ok(s.pitDust <= cap, 'the pile stops at what the plot holds',
       `${s.pitDust} of ${cap}`),
    ok(s.pitDust > (3600 / s.pitGrain) * (276 / s.pitGrain),
       'having heaped up over the mouth on the way', `${s.pitDust}`),
    // The pile stops; the COUNTER does not. What will not fit goes through the
    // rift, and `stored` less `rift` is what is in the hole -- so the number and
    // the picture still say the same thing, with the rift accounting for the
    // difference. This used to read `stored === pitDust`, from when a hole with
    // no room turned the grain away and the dust was simply not banked.
    ok(s.stored - s.rift === s.pitDust,
       'and what is counted, less what is through the rift, is what is in the pile',
       `${s.stored} counted, ${s.rift} through, ${s.pitDust} in the pile`),
    ok(s.stored > s.pitDust, 'with the overflow banked rather than turned away',
       `${s.stored - s.pitDust} through`),
    ok(s.pitGrain === 6, 'the grain does not change under it', `${s.pitGrain}px`)
  ];
});

// Over the hole is in the hole. One landing on top of the ones already in
// there rests above the ground line, and while the count asked it to be below
// the line it lay over the mouth uncounted -- where a worker could see it,
// walk to the lip, and stand there for ever reaching for something the lip
// would not let it reach. Two workers stuck like that is a yard that has
// quietly stopped, and it took half the suite runs with it.
// Over the hole is in the hole. A chip that crosses the mouth is banked
// whatever it is, so nothing can come to rest lying over the lip where a
// worker could see it, walk to the ledge, and reach for it for ever.
group('nothing is left lying over the mouth of the pit', async () => {
  window.__crew(0, 0);
  window.__clearFloor();
  run(0.5);
  const before = state().shards;
  for (let i = 0; i < 12; i++) window.__toss('shard', state().pitX + 12);
  run(4);
  const after = state();
  const nearLip = after.findAll
    .map(t => +t.split(',')[0])
    .filter(x => x > after.pitX - 60);
  return [
    ok(after.shards === before + 12, 'every one of them is counted',
       `${before} -> ${after.shards}`),
    ok(nearLip.length === 0, 'none is left lying over the mouth',
       JSON.stringify(nearLip))
  ];
});

// A find used to go in over the ceiling on the grounds that it is a thing you
// went and got. A hole that holds everything except the four things it does
// not hold is a hole with a rule you cannot see.
//
// And a full hole no longer turns anything away at all: it collapses, and what
// will not fit goes through the rift -- a find exactly as much as a grain of
// dust, which is the same rule read the other way round. This group used to say
// the shard stayed on the ground and nobody went for it, which was true when a
// full hole was a wall.
group('a find is banked through the rift when the hole is full', async () => {
    run(0.4);
  window.__crew(0, 6);
  window.__give(200000);                       // the scrape, full
  runUntil(() => state().riftOpen, 60);
  const rockX = state().rockX;
  window.__toss('shard', rockX + 200);
  window.__toss('shard', rockX + 240);
  const got = runUntil(() => state().shards === 2, 60);
  const after = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(after.riftOpen, 'the hole has collapsed under all that dust'),
    ok(got && after.shards === 2, 'both shards are fetched and counted',
       `${after.shards} banked, ${after.finds.length} lying about`),
    ok(after.finds.length === 0, 'and nothing is left lying on the ground for want of room',
       `${after.finds.length} left`),
    // Through the rift is not away: the counter holds them, and the rift's own
    // books say how many of them are not in the pile.
    ok(after.riftHeld.shards <= after.shards,
       'the rift accounts for whichever of them it took',
       `${after.riftHeld.shards} of ${after.shards} through`)
  ];
});

// Same rule, and the case where getting it wrong costs the most: a core is one
// a rock, for ever, and one the hole swallowed would be a rock done twice.
group('a core goes in through the rift like anything else', async () => {
    run(0.4);
  window.__crew(2, 2);
  window.__give(200000);
  runUntil(() => state().riftOpen, 60);
  // onto a rock that actually has a core in it: the first four have none
  window.__jump(5);
  window.__next();                             // the last of the rock goes
  runUntil(() => state().coreItem?.rest, 40);
  const banked = runUntil(() => state().cores === 1, 60);
  const after = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    // A core used to sit on the ground until you dug room for it -- the one
    // thing the hole would not take and the most expensive thing to be wrong
    // about. A hole that has collapsed takes it, because it takes everything.
    ok(banked && after.cores === 1, 'a core is banked with the hole full',
       `${after.cores} cores`),
    ok(!after.coreItem, 'and is not left lying about',
       JSON.stringify(after.coreItem)),
    ok(after.riftHeld.cores <= after.cores, 'the rift accounts for it if it took it',
       `${after.riftHeld.cores} of ${after.cores} through`)
  ];
});

// Room in the hole is a resource like a column of dust is a resource, and it
// is claimed the same way: at the moment you decide, held until you spend it.
// Without it every body in the yard filled its hands and walked to the lip to
// find out, and eight workers stood at the brim holding a load each with
// nowhere to put any of it and no way to put it back.
group('a hauler books room in the hole before it fetches', async () => {
    run(0.4);
  window.__crew(0, 8);
  window.__levels({ haulCarryLevel: 4 });
  // Most of the way full, and NOT collapsed: the booking is a promise that
  // there will be somewhere to put this grain down, and the promise is only
  // worth anything while the hole can still say no. Once it has torn open there
  // is always somewhere -- see `pitFree` in crew.js -- and the queue is the
  // trip rather than the hole.
  const cap = state().pitCapacity;
  window.__give(Math.round(cap * 0.98));
  run(2);
  const room = state().pitCapacity - state().pitDust;
  const rockX = state().rockX;
  window.__pile(rockX + 200, 600);             // more on the ground than the hole can take
  const before = state().stored;
  runUntil(() => state().stored - before >= room, 60);
  run(5);                                      // and a moment for one more, if one is coming
  const some = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(!some.riftOpen || some.stored - before <= room + 1,
       'a hole that has not collapsed takes what it has room for and no more',
       `${some.stored - before} banked into room for ${room}`),
    ok(some.floorGrains > 100, 'with plenty still on the ground',
       `${some.floorGrains} lying about`),
    // a booking is the whole trip, and what is in hand is part of it -- so
    // the one number that must never exceed the room is the booking
    ok(some.carried <= some.booked,
       'and never more is carried than is spoken for',
       `${some.carried} carried of ${some.booked} booked`)
  ];
});

// The soft-lock, and the whole reason the hole collapses.
//
// A full hole used to stop the yard: a hauler cannot put its load down, so
// nothing is banked, so nothing is earned. The cure was a black hole summoned
// from the tower for red -- priced in the coin that had stopped coming in, so a
// yard that filled its hole before it could afford one was stuck for good.
group('a full hole collapses rather than stopping the yard', async () => {
  window.__reset();
  window.__crew(3, 6, 3, 3);
  window.__fullSites();
  window.__grant({ sparks: 99, shards: 99, spores: 99, cores: 9 });
  window.__give(999999);                     // far more than the hole can hold
  run(20);

  const s0 = state();
  const a = state();
  run(30);
  const b = state();
  const jobs = {};
  for (const w of b.workerGoals) jobs[w] = (jobs[w] || 0) + 1;
  const idle = (jobs['hauler:idle'] || 0) + (jobs['hauler:home'] || 0);
  const working = Object.entries(jobs)
    .filter(([k]) => k.startsWith('hauler:') && !k.endsWith('idle') && !k.endsWith('home'))
    .reduce((n, [, v]) => n + v, 0);

  return [
    ok(s0.riftOpen, 'the hole tears open on its own rather than waiting to be bought'),
    ok(s0.stored > s0.pitDust * 2, 'and everything over the brim is still yours',
       `${s0.stored} counted against ${s0.pitDust} in the pile`),
    // The yard is what this is about. Before the collapse, thirty seconds of a
    // full hole banked nothing at all and the carters went home.
    ok(b.stored > a.stored, 'the yard goes on banking with the hole full',
       `${b.stored - a.stored} banked in thirty seconds`),
    ok(working > idle, 'and the carters are working rather than standing about',
       `${working} working, ${idle} idle or gone home`)
  ];
});
