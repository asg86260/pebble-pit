// The scrubber balloon: bought off the house's board, boarded on foot, and
// crossing the sky. See src/balloon.js and DESIGN.md, "The scrubber balloon".
//
// Bought the way a player buys it -- `__buy('balloon')` presses the row -- rather
// than by pushing a craft into the array. A check that sets the state through a
// back door proves the state can be set, and nothing about whether you can get
// there.

import { group, ok, state, run, runUntil } from './helpers.mjs';

const rich = () => {
  window.__reset();
  window.__crew(0, 3);
  window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
  window.__tip(90000);
  window.__air({ open: true });
  run(2);
};

group('a balloon is bought at the house and rides the sky', async () => {
  rich();
  const before = state().craft.length;
  const bought = window.__buy('balloon');
  run(1);
  const moored = state();

  // Nobody in it yet: bought is not crewed, and a craft with nobody in it stays
  // tied to its mast. The same bargain every other station makes when you buy
  // the room before the body.
  run(10);
  const idle = state();

  // ...and then somebody is put on it. The house takes the first body and the
  // craft the second, so two on the scrubbers is one indoors and one aloft.
  window.__air({ scrubbers: 2 });
  const up = runUntil(() => state().craft[0] && state().craft[0].up, 60);
  const flying = state();

  const from = flying.craft[0].x;
  run(12);
  const later = state();

  window.__air({ scrubbers: 0 });
  return [
    ok(before === 0 && bought && moored.craft.length === 1,
       'the board sells one, and the yard has one', `${before} -> ${moored.craft.length}`),
    ok(moored.craft[0].lift === 0, 'which starts on the ground at its mast',
       `lift ${moored.craft[0].lift}`),
    ok(!idle.craft[0].crewed && idle.craft[0].lift === 0,
       'and stays there while there is nobody in it',
       `crewed ${idle.craft[0].crewed}, lift ${idle.craft[0].lift}`),
    ok(up, 'a body put on the scrubbers gets into it and it goes up',
       `lift ${flying.craft[0].lift}`),
    ok(flying.craft[0].y < moored.craft[0].y - 40,
       'and it is a long way over the yard once it is up',
       `${moored.craft[0].y} -> ${flying.craft[0].y}`),
    ok(Math.abs(later.craft[0].x - from) > 40, 'and then it crosses the sky',
       `${from} -> ${later.craft[0].x}`)
  ];
});

group('nobody gets into a balloon without walking to it', async () => {
  rich();
  window.__buy('balloon');
  run(1);
  // Where the mast is, and where the body starts: the crew stand about the yard,
  // and the craft is over by the scrubbing house.
  const mast = state().craft[0].x;

  window.__air({ scrubbers: 2 });
  // Watched every frame from the moment it is assigned. The one thing that must
  // never happen is a body appearing at the mast: every position it is ever seen
  // at has to be one it walked to, and the gap between two of them has to be a
  // stride rather than a journey.
  //
  // Followed by *name*, not by "whichever body holds the berth". The berth can
  // change hands while the gang is being sorted out in the first frames, and two
  // different people standing in two different places is not one person moving:
  // watching the berth rather than the body reported a jump the yard never made.
  let jumped = 0, seen = 0, wasAloft = false;
  let who = null, last = null;
  // Frame by frame, and for long enough to actually get there: the mast is at
  // the far end of the yard from where the crew stand about, and a walk is a
  // walk. It breaks the moment the body is aboard.
  for (let i = 0; i < 2500; i++) {
    run(1 / 60);
    const s = state();
    const crew = s.scrubCrew || [];
    // Two questions, and they are about different things. "Does anybody get
    // aboard" is about the yard; "does this body ever jump" is about one person,
    // and following the berth instead of the person answers neither.
    if (crew.some(w => w.aloft)) { wasAloft = true; break; }
    const body = who ? crew.find(w => w.name === who) : crew.find(w => w.berth >= 0);
    if (!body) continue;
    if (!who) { who = body.name; last = body.x; seen++; continue; }
    seen++;
    if (Math.abs(body.x - last) > 12) jumped++;
    last = body.x;
  }

  window.__air({ scrubbers: 0 });
  return [
    ok(seen > 10, 'the body is watched the whole way there', `${seen} frames`),
    ok(jumped === 0, 'and never moves further in one frame than a stride',
       `${jumped} jumps`),
    ok(wasAloft, 'and ends up aboard', `mast at ${Math.round(mast)}`)
  ];
});

group('a craft comes back and is let go of when the job ends', async () => {
  rich();
  window.__buy('balloon');
  window.__air({ scrubbers: 2 });
  runUntil(() => state().craft[0] && state().craft[0].up, 60);

  // Taken off the scrubbers altogether. The craft has nobody in it, so it comes
  // down and goes home to its mast -- and the body is not left believing it is
  // still in a balloon.
  window.__air({ scrubbers: 0 });
  const home = runUntil(() => state().craft[0].lift === 0, 90);
  const down = state();
  const stuck = (down.scrubCrew || []).filter(w => w.aloft).length;

  return [
    ok(home, 'an empty craft comes down', `lift ${down.craft[0].lift}`),
    ok(!down.craft[0].crewed, 'with nobody in it', `${down.craft[0].crewed}`),
    ok(stuck === 0, 'and nobody is left in the sky', `${stuck} still aloft`)
  ];
});

group('a craft takes the sky in where it is, and drops it under itself', async () => {
  rich();
  window.__clearFloor();
  window.__buy('balloon');
  // The house shut and the craft crewed. `capOf` fills the house's berth first,
  // so three on the scrubbers is one indoors and two aloft -- but there is only
  // one craft here, so it is one indoors and one up. What isolates the craft is
  // not the staffing, it is *where the muck lands*: the house's own spout is a
  // fixed lip on its left wall and the craft is halfway across the yard.
  window.__air({ haze: 2200, muck: 0, scrubbers: 2 });
  runUntil(() => state().craft[0] && state().craft[0].up, 60);
  const lit = state();

  // Held topped up, so what is being measured is the craft working rather than
  // the craft running out of sky -- and no rain, which would drop muck of its
  // own all over the answer.
  for (let i = 0; i < 14; i++) { window.__air({ haze: 2200 }); run(3); }
  const done = state();

  const scrubX = state().scrubX;
  const far = (done.muckAt || []).filter(([c]) => c * 6 > scrubX + 400);
  const flew = Math.abs(done.craft[0].x - lit.craft[0].x);

  window.__air({ haze: 0, muck: 0, scrubbers: 0 });
  window.__clearFloor();
  return [
    ok(done.smog.recycled >= 0 && (done.muckAt || []).length > 0,
       'a crewed craft brings the sky down and it lands as muck',
       `${(done.muckAt || []).length} columns with muck in them`),
    ok(flew > 100, 'while crossing the yard', `moved ${Math.round(flew)}px`),
    // The claim the whole feature rests on: the sink is the ground the craft is
    // over, not a heap on the house's own strip.
    ok(far.length > 0,
       'and it comes down well away from the house, under wherever the craft was',
       `${far.length} columns more than 400px past the house`)
  ];
});
