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
    // at what the bed will hold, and never gets out onto the ground
    ok(s.pitDust <= cap, 'the pile stops at what the bed holds',
       `${s.pitDust} of ${cap}`),
    ok(s.pitDust > (3600 / s.pitGrain) * (276 / s.pitGrain),
       'having heaped up over the mouth on the way', `${s.pitDust}`),
    // The pile is the dust. A counter that went on climbing past a pile that
    // had stopped would be the number and the picture saying different things.
    ok(s.stored === s.pitDust, 'and the counter stops with it',
       `${s.stored} counted, ${s.pitDust} in the pile`),
    ok(s.pitFull, 'the hole reports itself full'),
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
group('a find is counted against the hole like everything else', async () => {
    run(0.4);
  window.__crew(0, 6);
  window.__give(200000);                       // the scrape, full
  run(20);
  const rockX = state().rockX;
  window.__toss('shard', rockX + 200);
  window.__toss('shard', rockX + 240);
  run(25);
  const full = state();

  window.__spend(3);                           // room for three
  run(25);
  const room = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(full.pitFull, 'the hole is full', `${full.stored} in it`),
    ok(full.shards === 0 && full.finds.length === 2,
       'a shard on the ground with a full hole behind it stays on the ground',
       `${full.shards} banked, ${full.finds.length} lying about`),
    ok(full.carried === 0,
       'and nobody sets off for one they have nowhere to put',
       `${full.carried} in hands`),
    ok(room.shards === 2 && room.finds.length === 0,
       'make room and they are fetched and banked like anything else',
       `${room.shards} banked, ${room.finds.length} left`)
  ];
});

// Same rule, and the case where getting it wrong costs the most: a core is one
// a rock, for ever, and one the hole swallowed would be a rock done twice.
group('a core waits on the ground rather than being lost to a full hole', async () => {
    run(0.4);
  window.__crew(2, 2);
  window.__give(200000);
  run(20);
  window.__next();                             // the last of the rock goes
  run(20);
  const full = state();

  window.__spend(20);
  run(40);
  const room = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(full.pitFull && full.cores === 0, 'a full hole banks no core',
       `${full.cores} cores`),
    ok(!!full.coreItem, 'and the core is still out there, in plain sight',
       JSON.stringify(full.coreItem)),
    ok(room.cores === 1 && !room.coreItem,
       'dig, and it goes in like anything else',
       `${room.cores} cores, ${room.coreItem ? 'one still loose' : 'none loose'}`)
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
  window.__give(200000);                       // fill the scrape to the brim
  run(20);
  const rockX = state().rockX;
  window.__pile(rockX + 200, 600);             // and a heap nobody can shift
  run(30);
  const full = state();

  // now make room for six, and watch six leave the ground
  window.__spend(6);
  const before = state().stored;
  run(20);
  const some = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(full.pitFull, 'the hole is full', `${full.stored} in it`),
    ok(full.floorGrains > 500, 'and there is plenty on the ground',
       `${full.floorGrains} lying about`),
    ok(full.carried === 0,
       'so nobody is holding dust with nowhere to put it',
       `${full.carried} grains in hands`),
    ok(full.booked === 0, 'and nobody has room booked', `${full.booked} booked`),
    ok(some.stored - before <= 6,
       'room for six takes six off the ground, not eight loads',
       `${some.stored - before} banked`),
    // a booking is the whole trip, and what is in hand is part of it -- so
    // the one number that must never exceed the room is the booking
    ok(some.booked <= 6 && some.carried <= some.booked,
       'and never more is spoken for than the hole will take',
       `${some.carried} carried of ${some.booked} booked`)
  ];
});
