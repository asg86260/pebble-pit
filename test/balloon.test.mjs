// The purifier balloon: bought off the house's board, boarded on foot at its
// own post, and up among the clouds. See src/balloon.js and DESIGN.md, "The
// balloons ride the clouds".
//
// Bought the way a player buys it -- `__buy('balloon')` presses the row -- rather
// than by pushing a craft into the array. A check that sets the state through a
// back door proves the state can be set, and nothing about whether you can get
// there.

import { group, ok, state, run, runUntil, buyBuilt, buyNow, SEED, yard } from './helpers.mjs';

const rich = () => {
  window.__reset();
  window.__crew(0, 3);
  window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
  window.__tip(90000);
  window.__air({ open: true });
  run(2);
};

group('a balloon is bought at the house, moors at its own post, and goes up among the clouds', async () => {
  rich();
  const bought = buyNow('balloon') && buyNow('balloon');
  run(1);
  const moored = state();
  // A craft opens like a door: a spare hand is sent over to ride each one.
  const manned = yard.S.purifiers;
  const up = runUntil(() => state().craft[0] && state().craft[0].up, 90);
  const flying = state();
  return [
    ok(bought && moored.craft.length === 2, 'two bought off the row', `${moored.craft.length}`),
    ok(moored.craft[0].post !== moored.craft[1].post &&
       Math.abs(moored.craft[1].post - moored.craft[0].post) > 30,
       'each at its own post, side by side', moored.craft.map(c => c.post).join(', ')),
    ok(moored.craft.every(c => c.post > moored.filterX), 'beside the filter, past its dial',
       `filter at ${moored.filterX}`),
    ok(manned === 2, 'and a spare hand is sent over to ride each', `${manned} on the purifiers`),
    ok(up, 'and with somebody aboard it goes up'),
    ok(up && flying.craft[0].far < 0.5, 'into the clouds, at their depth', `far ${flying.craft[0].far}`)
  ];
});

group('nobody gets into a balloon without walking to it', async () => {
  rich();
  buyNow('balloon');
  run(1);
  // Where the mast is, and where the body starts: the crew stand about the yard,
  // and the craft is over by the air filter.
  const mast = state().craft[0].post;

  window.__air({ purifiers: 2 });
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
    const crew = s.filterCrew || [];
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

  window.__air({ purifiers: 0 });
  return [
    ok(seen > 10, 'the body is watched the whole way there', `${seen} frames`),
    ok(jumped === 0, 'and never moves further in one frame than a stride',
       `${jumped} jumps`),
    ok(wasAloft, 'and ends up aboard', `mast at ${Math.round(mast)}`)
  ];
});

group('a rider taken off the job is brought home in the basket and steps off at the post', async () => {
  rich();
  buyNow('balloon');
  window.__air({ purifiers: 2 });
  runUntil(() => state().craft[0] && state().craft[0].up, 90);
  window.__air({ purifiers: 0 });
  run(1);
  const turned = state();
  const home = runUntil(() => state().craft[0].phase === 'moored', 30);
  run(1);
  const after = state();
  return [
    ok(turned.craft[0].phase === 'down', 'the craft turns for home', turned.craft[0].phase),
    ok(turned.homeward === 1, 'with its rider still in the basket', `${turned.homeward} homeward`),
    ok(home, 'and is back at its post'),
    ok(after.homeward === 0, 'where the rider steps off', `${after.homeward} homeward`)
  ];
});

group('a craft lets what it catches fall wherever it is, and stays up to do it', async () => {
  rich();
  buyNow('balloon');
  // A dirty sky, nobody in the house, one aloft; nothing else fouls it.
  window.__crew(0, 0);
  window.__air({ purifiers: 2, haze: 3000, muck: 0 });
  runUntil(() => state().craft[0].up, 90);
  const muck = () => (yard.S.muck || []).reduce((n, v) => n + (v || 0), 0);
  const before = muck();
  let home = false;
  for (let s = 0; s < 60; s++) { run(1); if (state().craft[0].phase !== 'aloft') home = true; }
  return [
    ok(muck() > before, 'its catch comes down as muck', `${before} -> ${muck()}`),
    ok(!home, 'without it ever coming home to empty', state().craft[0].phase)
  ];
});

// Where a craft is among the clouds is a fact about the view (the clouds scroll
// slower than the ground, so where it is drawn depends on where you are
// looking). Where its muck lands follows that, by the player's choice; how
// much of the sky it takes must not. The same yard run twice from one seed,
// once with the view swung back and forth over it, takes the same sky.
group('what a balloon pulls does not depend on where you are looking', async () => {
  const yardRun = swing => {
    window.__seed(SEED);
    rich();
    buyNow('balloon');
    window.__air({ purifiers: 2, haze: 2400, muck: 0 });
    runUntil(() => state().craft[0] && state().craft[0].up, 60);
    for (let s = 0; s < 40; s++) {
      if (swing) window.__look(state().craft[0].x + (s % 2 ? 3000 : -380));
      run(1);
    }
    const st = state();
    // Not where the muck lands, which follows the view by design: how much
    // of the sky it takes, and what the craft is doing.
    return { haze: Math.round(st.smog.haze), phase: st.craft[0].phase };
  };
  const still = yardRun(false);
  const swung = yardRun(true);
  return [
    ok(still.haze < 2400, 'the craft takes the sky down', `${still.haze}`),
    ok(JSON.stringify(still) === JSON.stringify(swung), 'and does the same whichever way the view swings',
       `still ${JSON.stringify(still)}, swung ${JSON.stringify(swung)}`)
  ];
}, { reload: false });

// A balloon's rider is on the purifiers, and the filter's cap is a body a
// craft. Read back, the crew is dealt out
// against that cap, so the craft have to be back before the deal, or the cap
// is nought and every rider is stood down on every load.
group('a balloon rider is still on the job after a reload', async () => {
  rich();
  buyNow('balloon');
  buyNow('balloon');
  window.__air({ purifiers: 2 });
  runUntil(() => state().craft[0] && state().craft[0].up, 60);
  const before = yard.S.purifiers;
  // Read back the way a fresh page reads it, with no craft already in
  // memory: a save and a load in one process keeps the old ones, and a cap
  // read off them hides the bug.
  yard.persist();
  const raw = localStorage.getItem('boulder-clicker/v4');
  window.__reset();
  localStorage.setItem('boulder-clicker/v4', raw);
  yard.restore();
  const after = yard.S.purifiers;
  const flies = runUntil(() => state().craft[0] && state().craft[0].up, 60);
  return [
    ok(before === 2, 'one in each balloon', `${before}`),
    ok(after === 2, 'and both are still on the purifiers after a reload', `${before} -> ${after}`),
    ok(flies, 'and the balloon goes back up')
  ];
}, { reload: false });
