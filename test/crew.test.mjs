// The crew: where they work, how they get there, what they do when there is
// nothing to do, and where they live.
//
// Node checks: the yard is run rather than watched, so a walk the length of the
// world costs a few milliseconds instead of the half minute it takes to happen.

import { yard, group, ok, state, run, runUntil, quickCrew, haveRock, bankCore, openSites, quarryFeetY, P, WORKER } from './helpers.mjs';
// The yard's own chance, for the dust a check heaps itself. `Math.random` here
// would hand each run a differently-shaped pile out of the same seed, which is
// the seed's whole point undone from the test side. Every group is seeded
// before its body runs (see `group` in helpers.mjs), so this draws from the
// same stream the game does.
import { rand } from '../src/rng.js';

// A crew that has been stood down is still a crew standing there. Frozen
// squares read as a bug; shifting about reads as waiting.
group('a stood-down crew shifts about', async () => {
  window.__crew(3, 0);
  haveRock();
  const strip = state().piles.find(p => p.key === 'rock');
  // Enough to fill it, whatever the strip is: how wide it stands depends on
  // how big the rock is, and a fixed twenty a column was exactly the limit at
  // rock one once the lip came in.
  for (let pass = 0; pass < 4 && !state().pileFull.rock; pass++) {
    for (let x = strip.from + P; x < strip.to - P; x += P) window.__pile(x, 20);
    run(1);
  }
  const full = runUntil(() => state().pileFull.rock, 30);
  const before = state();
  // Eight seconds, not four. The idle wobble is a slow sine with a phase of
  // its own, so how many distinct rounded positions a short window catches
  // depends on where in that sine the window happens to start -- which is a
  // fact about whatever check ran before this one, not about the crew.
  const poses = new Set();
  for (let i = 0; i < 480; i++) {
    run(1 / 60);
    poses.add(state().workerPos.filter(w => w[0] === 'r').join('|'));
  }
  const after = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(full, 'the rock\'s pile fills and the crew stand down'),
    ok(after.rock === before.rock, 'nothing more comes off the rock',
       `${before.rock} -> ${after.rock}`),
    // What this is for is catching *frozen*, which is one pose and no more.
    // A tight count was measuring the phase of a sine and calling it a fault.
    ok(poses.size > 4, 'but they are not stood frozen',
       `${poses.size} poses across eight seconds`)
  ];
});

group('the crew stand on the rock and work it down', async () => {
  haveRock();                             // something to stand on, standing still
  window.__crew(5, 0);
  // Five bodies hired at the shacks, and they walk to the rock from there like
  // anybody else. What this check is about is where they stand once they are
  // on it, so it waits for the walk rather than measuring people mid-yard.
  runUntil(() => state().commuting.length === 0, 200);
  run(0.3);
  const s = state();
  const rockhands = s.workerPos.filter(p => p[0] === 'r')
                            .map(p => p.split(':')[1].split(',').map(Number));
  const foot = s.rockFoot;
  window.__crew(0, 0);                    // put them back on the shelf
  return [
    ok(rockhands.length === 5, 'five rockhands are out', `${rockhands.length}`),
    ok(rockhands.every(([, y]) => y <= foot), 'nobody is below the ground',
       JSON.stringify(rockhands)),
    ok(rockhands.every(([x]) => x > s.rockX - s.rockW / 2 - 24 && x < s.rockX + s.rockW / 2 + 24),
       'they are all on the rock, not orbiting it', JSON.stringify(rockhands)),
    // Most of them level, rather than all of them. The rule is that the gang
    // works a layer and nobody bores a shaft -- and the gang takes the layer
    // down *around* each other, so at any instant one of them can be off it
    // and climbing back, which is the behaviour rather than a fault. A check
    // that demanded every last one be level was really checking that it had
    // not caught anybody mid-climb, and it failed on the timing.
    ok((() => {
      const ys = rockhands.map(([, y]) => y).sort((a, b) => a - b);
      const mid = ys[Math.floor(ys.length / 2)];
      return ys.filter(y => Math.abs(y - mid) <= 6 * 6).length >= ys.length - 1;
    })(), 'they stand level with each other, because they work a layer',
       JSON.stringify(rockhands.map(([, y]) => y))),
    ok(new Set(rockhands.map(([x]) => Math.round(x / 18))).size > 1,
       'and spread out along it rather than stacking up',
       JSON.stringify(rockhands.map(([x]) => Math.round(x))))
  ];
});

// Moving somebody from one job to another used to delete a body where it stood
// and make a new one already at the far end of the yard. It is the same person:
// it keeps its place in the crew, walks out of wherever it was working, and
// does none of the new job on the way.
group('a body walks to its new work instead of appearing at it', async () => {
  const body = () => {
    const [t, xy] = state().workerPos[0].split(':');
    const [x, y] = xy.split(',').map(Number);
    return { t, x, y };
  };
  // No kit anywhere: a body sent on an errand for a lamp is a body doing
  // something else, and what this check is watching is the commute itself.
  window.__kit({ breakers: 0, carters: 0, blasters: 0, growers: 0 });
  window.__crew(0, 0, 1);                     // one body, and it goes down the quarry
  // Down the wall and working the floor. However long the walk out there takes:
  // where a body starts from is not what this check is about, and a fixed ten
  // seconds was only ever long enough because of where the check above it had
  // left somebody standing.
  // Down the hole, in feet terms. The quarry is what has been taken out of the
  // ground now rather than a shape the yard came with, so a body sent to a
  // quarry nobody has worked yet is stood on the ground line -- there is nothing
  // to climb out of, and a check about climbing out has nothing to watch.
  //
  // `underground` used to be quarriers whose goal was 'in', which stopped being
  // a goal a long time ago: the wait always fell through and only passed
  // because the old cut was a fixed hole a body was instantly at the bottom of.
  // Properly down the hole, measured on the body itself rather than on a count:
  // a climb of one cell is over inside a single sample, and what this group is
  // about is the route out. Four cells is a climb you can watch.
  // A generous budget: a body shuffles along the face it is working at less than
  // a walking pace, which is what it should look like, and getting a course of
  // ground off takes as long as it takes.
  runUntil(() => { const b = body(); return b.t === 'q' && b.y > state().groundY + P * 4; }, 600);
  const s0 = state();
  const digging = body();

  window.__assign('quarriers', -1);           // now it is wanted on the rock
  window.__assign('rockhands', 1);
  const off = state();

  // A thirtieth of a second at a time, so the climb out is not stepped over.
  //
  // This was a sixth, which was fine while it was written and became too coarse
  // the moment the crew's base pace went up: the whole climb fell between two
  // samples and the check reported nought rising samples for a body that had
  // climbed perfectly well. The cadence has to be finer than the fastest thing
  // it is watching, not tuned to whatever the pace happened to be.
  // Each sample carries the floor it was taken over. The cut's surface is not
  // a fixed shape -- dust settles into it and is thrown out of it while the
  // walk is happening -- so asking where the floor was, after the run is over,
  // asks about a floor the body never walked on.
  const trail = [];
  for (let i = 0; i < 150; i++) {
    run(1 / 30);
    const p = body();
    trail.push({ ...p, feet: quarryFeetY(p.x) });
  }
  // Arrived is at the rock with the walk over, not merely the walk over: a
  // reload in the middle of the commute (test/helpers.mjs does one every few
  // seconds) drops the walk for the frame it takes the body to plan it again,
  // and "nobody commuting" was true for that frame, halfway across the yard.
  const arrived = runUntil(() => state().commuting.length === 0
                                 && Math.abs(body().x - s0.rockX) < s0.rockW, 200);
  const home = body();
  const after = state();
  window.__crew(0, 0);
  window.__clearFloor();                      // the shards it knocked off are not ours

  // Below the ground line it either walks the floor to the foot of the ladder
  // or goes up the ladder; it never rises anywhere else. Rising through the
  // wall wherever it happened to be standing was the old behaviour, and the
  // ladder is there so that it is not.
  const climbing = trail.filter(p => p.y > s0.groundY - WORKER);
  const rose = trail.slice(1).filter((p, i) => p.y < trail[i].y - 1 && p.y > s0.groundY - WORKER);
  // A body walking the quarry floor towards the ladder rises too: the floor is
  // benched, so a bench it steps up is a sample that went up without being at
  // the ladder. That is the floor carrying it, not the body climbing the wall --
  // so a rise counts if the body is standing on the quarry's floor where it
  // happens to be, and is a fault if it is somewhere in the air.
  // Asked the way the yard asks it -- `quarryFeetY`, which is `standTop` over
  // `cutTop`. This used to sample `quarryFloor` at the body's middle, and both
  // halves of that were out of date: a body stands on the HIGHEST ground under
  // any part of it, not on the ground under its navel, and the surface it
  // stands on is the dust lying in the column rather than the rock beneath.
  //
  // Within a cell, not within three pixels. The floor is made of six-pixel
  // cells and it moves under the walk as dust settles into the cut, so a body
  // can spend a frame or two coming back down on to a column that shifted
  // beneath it. That is the ground moving, not the body leaving it. The fault
  // this is here to catch -- rising through the wall wherever it happened to be
  // standing -- is tens of pixels of air, not one cell of it.
  const onFloor = p => Math.abs(p.y - p.feet) <= P;
  const steps = trail.slice(1).map((p, i) => Math.abs(p.x - trail[i].x));
  return [
    ok(digging.t === 'q' && digging.y > s0.groundY,
       'it starts at work, down in the quarry', `${digging.x},${digging.y}`),
    ok(off.workers === 1 && off.crew === 1,
       'moving it is one body, not one deleted and another made',
       `${off.workers} bodies, ${off.crew} on the payroll`),
    ok(off.rockhands === 1 && off.quarriers === 0,
       'and it counts at its new job the moment it is given it',
       `${off.rockhands} mining, ${off.quarriers} in the quarry`),
    ok(climbing.length > 0 && rose.length > 0 &&
       rose.every(p => Math.abs(p.x - s0.quarryFaceX) < WORKER || onFloor(p)),
       'it comes out of the quarry up the ladder, and nowhere else',
       `${rose.length} rising samples, ladder at ${s0.quarryFaceX}`),
    // Bounded by the crew's own legs rather than by a number written here: a
    // commute is walked at whatever a body walks at with its hands free, so a
    // yard that has bought the pace upgrade covers more ground per sample and
    // is not thereby jumping.
    //
    // The commute's own pace, not the hauler's. They are the same number on a
    // yard that has bought a few pace upgrades and they are not on a fresh
    // one, where a commuter walks at its floor of 2.4 and an unbought hauler
    // ambles at 1.44 -- so a bound taken off the hauler called an ordinary
    // walk a jump, and only passed at all because a check further up the file
    // had left some upgrades lying about.
    ok(steps.filter(d => d > 0).length > 8 && Math.max(...steps) < s0.pace.commute * 11,
       'then it crosses the yard a step at a time rather than jumping',
       `${steps.map(d => Math.round(d)).join(' ')} at ${s0.pace.commute}/frame`),
    ok(arrived, 'and it gets there'),
    ok(Math.abs(home.x - s0.rockX) < s0.rockW,
       'which is the rock it was sent to',
       `${home.x}, rock at ${s0.rockX}`),
    ok(after.rockhands === 1 && after.workers === 1,
       'still the one body, and now it is a rockhand', `${after.workers} bodies`)
  ];
});

group('a hired worker carries dust to the pit', async () => {
  window.__give(4000);
  run(0.2);
  await bankCore();
  await bankCore();
  window.__crew(0, 1);                        // one body, carrying
  const hired = state().crew > 0;
  quickCrew();

  const s = state();
  window.__pile(s.pitX - 260, 150);           // within a round trip of the lip
  run(0.4);
  const before = state();

  // watch it work: it should reach the lip carrying something
  let reachedLip = false;
  for (let i = 0; i < 200; i++) {
    run(0.1);
    const w = state().workerPos.find(p => p[0] === 'h');
    if (w) {
      const wx = +w.split(':')[1].split(',')[0];
      if (Math.abs(wx - (state().pitX - WORKER)) < 24) reachedLip = true;
    }
    if (reachedLip && state().stored > before.stored) break;
  }
  const after = state();
  return [
    ok(hired, 'there is a worker to carry it'),
    ok(after.haulers >= 1, 'a worker is on the payroll'),
    ok(reachedLip, 'the worker walks its load to the lip'),
    ok(after.stored > before.stored, 'and dust arrives in the hole',
       `${before.stored} -> ${after.stored}`)
  ];
});

// A hat is a thing lying at a station until somebody walks over and picks it
// up, and it goes back the same way. Nothing about it is instant, which is the
// whole of what makes it read as kit rather than as a stat.
group('a hat is walked to, put on, and walked back', async () => {
    run(0.4);
  window.__crew(2, 1);
  window.__clearFloor();
  window.__kit({ breakers: 2 });
  const bought = state();
  run(20);
  const on = state();

  // and off the rock again: the helmet has to come back before the body does
  window.__assign('rockhands', -1);
  run(20);
  const back = state();
  window.__crew(0, 0);
  window.__kit({ breakers: 0 });
  run(20);
  window.__clearFloor();
  const rock = r => r.roster.find(x => x.job === 'rockhands');
  return [
    ok(bought.trained === '', 'buying one puts nobody in a helmet',
       `"${bought.trained}"`),
    ok(rock(bought).spareKit === 2, 'both of them are left waiting at the rock',
       `${rock(bought).spareKit} waiting`),
    ok(on.trained === 'rr', 'the bodies walk over, pick them up and wear them',
       `"${on.trained}"`),
    ok(rock(on).spareKit === 0 && rock(on).hats === 2,
       'and the stand is empty while they are worn',
       `${rock(on).spareKit} of ${rock(on).hats} waiting`),
    ok(back.trained === 'r', 'one taken off the rock is one helmet fewer worn',
       `"${back.trained}"`),
    ok(rock(back).spareKit === 1 && rock(back).hats === 2,
       'and it is back on the stand, not gone with the body',
       `${rock(back).spareKit} of ${rock(back).hats} waiting`)
  ];
});

// A body used to be a slot: the crew was four counts and the people were made
// out of them when people were needed, so coming back to a saved game handed
// you a fresh set standing where your crew had been. This game opens on two
// squares who are somebody; a crew of interchangeable slots underneath that
// was the yard disagreeing with its own first minute.
group('a body is somebody, and stays somebody', async () => {
    run(0.4);
  window.__crew(2, 2);
  window.__clearFloor();
  run(50);
  const before = state();
  window.__reload();
  const after = state();

  const names = before.crewNames.split(' ').map(w => w.split('|')[0]);
  window.__crew(0, 0);
  return [
    ok(names.every(n => n && n !== 'undefined'), 'every one of them has a name',
       before.crewNames),
    ok(new Set(names).size === names.length, 'and no two of them the same', names.join(',')),
    ok(/\|\d+s\|/.test(before.crewNames), 'an age', before.crewNames),
    ok(before.crewNames.includes('|m') && /m[1-9]/.test(before.crewNames),
       'and a record of what they have shifted', before.crewNames),
    ok(after.crewNames === before.crewNames,
       'and they are the same people when you come back to it',
       `${before.crewNames}
${after.crewNames}`)
  ];
});

// The hole has two sides and there is ground beyond it. With one ladder the pit
// was a dead end: muck past the far wall was somewhere the crew could see and
// never reach, because the lip clamp pins them this side of the mouth.
group('the crew go through the hole to get at the far side', async () => {
    run(0.4);
  window.__crew(0, 3);
  run(4);
  window.__clearFloor();
  window.__air({ haze: 0, muck: 0 });
  const far = state().pitX + state().pitW;

  // A patch out past the far wall, and nothing anywhere else. The strip beyond
  // the hole is only the padding the world keeps there -- about eighteen cells
  // -- and the hole is the full width from the first frame now, so the patch has
  // to fit in that rather than reach four hundred pixels into ground that is not
  // there.
  const laid = window.__muckSet(c => {
    const x = c * 6 + 3;
    return x > far ? 2 : 0;
  });
  let beyond = 0, deepest = 0, gone = false;
  for (let i = 0; i < 400 && !gone; i++) {
    run(0.25);
    const s = state();
    for (const p of s.workerPos.filter(q => q[0] === 'h')) {
      const [x, y] = p.split(':')[1].split(',').map(Number);
      if (x > far) beyond = Math.max(beyond, Math.round(x - far));
      deepest = Math.max(deepest, y - s.groundY);
    }
    // the rain's share of it. What a body leaves is a second stack that only a
    // janitor may touch -- see `poopCols` -- and over three minutes of yard a
    // crew of three will leave some, which would mean "all gone" never came.
    gone = s.smog.muck.all - s.smog.poop === 0;
  }

  // and home again, which needs the crossing to work both ways
  window.__muckSet(c => (c * 6 + 3 > 1200 && c * 6 + 3 < 1500 ? 2 : 0));
  let back = false;
  for (let i = 0; i < 400 && !back; i++) {
    run(0.25);
    const s = state();
    back = s.smog.muck.all - s.smog.poop === 0;
  }

  // and with nothing at all left anywhere, nobody is left standing out there:
  // the crossing only ever ran while there was muck to chase, so the last body
  // to finish on the far side used to be stuck there for good
  window.__air({ haze: 0, muck: 0 });
  run(60);
  const stranded = state().workerPos.filter(q => q[0] === 'h')
    .map(p => Math.round(+p.split(':')[1].split(',')[0]));
  const home = stranded.every(x => x < far);

  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  return [
    // Eighteen cells is the whole of it: the world keeps that much ground past
    // the far wall and no more, and the hole is the full width from the first
    // frame. It used to be a scrape with hundreds of pixels of yard behind it.
    ok(laid > 10, 'a patch of muck out past the far wall', `${laid} cells`),
    ok(deepest > 40, 'and the crew go down into the hole to get to it',
       `${deepest}px below the ground line`),
    ok(beyond > 40, 'and up the far wall and out onto ground they cannot otherwise stand on',
       `${beyond}px past the far wall`),
    ok(gone, 'and shift the lot',
       `${Math.round(state().smog.muck.all - state().smog.poop)} of the rain's left`),
    ok(back, 'and come back through the same way when the near side needs them'),
    ok(home, 'and do not stand out there waiting to be asked: with nothing left to do on the far side they come home on their own',
       `${stranded.join()} past a wall at ${Math.round(far)}`)
  ];
});

// Scenery would have been cheaper. This is the check that it is not scenery:
// somebody fetching from the far pile has to actually ride over the mouth
// rather than walk across the gap on nothing, the way they used to.
group('the crew walk the bridge rather than the air', async () => {
  window.__crew(0, 3, 1);
  quickCrew();
  const s0 = state();
  const { x0, x1 } = s0.bridge;

  // something worth fetching on the far side of the hole, so a hauler has a
  // reason to cross at all
  const farm = s0.piles.find(p => p.key === 'farm');
  window.__pile(Math.round((farm.from + farm.to) / 2), 40);

  let seen = 0, high = null;
  for (let i = 0; i < 80; i++) {
    window.__fast(0.2);                       // finer than a second: a crossing is short
    for (const w of state().workerPos) {
      const [t, xy] = w.split(':');
      const [x, y] = xy.split(',').map(Number);
      if (t === 'q' || x < x0 || x > x1) continue;
      seen++;
      if (high === null || y < high) high = y;
    }
  }
  window.__crew(0, 0);

  return [
    ok(seen > 0, 'somebody crosses the mouth at all', `${seen} samples over it`),
    ok(high !== null && high < s0.groundY - 18,
       'and the bridge carries them above the ground line doing it',
       `highest top edge ${high}, ground line ${s0.groundY}`),
    ok(high !== null && high <= s0.bridge.top - 18 + 1,
       'right up onto the deck, not just the foot of a ramp',
       `${high} vs deck ${s0.bridge.top - 18}`)
  ];
});

group('clearing a handful puts the crew back to work', async () => {
  window.__crew(4, 0);
  window.__clearFloor();
  run(0.5);
  // fill it to just under, then let the crew tip it over themselves, so the
  // pile stops where mining stops it rather than where a test dumped it
  const strip = () => state().piles.find(q => q.key === 'rock');
  // just under whatever the limit is, read off the game rather than written
  // down here: the limit is a number that gets tuned, and a check holding its
  // own copy of it is a check that fails the day somebody halves it.
  const nearly = state().pileLimit.rock - 70;
  for (let i = 0; i < 300 && state().pileCount.rock < nearly; i++) {
    const q = strip();
    window.__pile(q.from + rand() * (q.to - q.from) * 0.8, 20);
    run(0.1);
  }
  const stopped = runUntil(() => state().pileFull.rock, 60);
  const full = state();
  const rockThen = full.rock;
  run(2);
  const stalled = state();

  const took = window.__take('rock', 6);
  run(0.5);
  const freed = state();
  const rockFreed = freed.rock;
  run(2);
  const working = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(stopped, 'the pile fills and the crew stop', `${full.pileCount.rock} grains`),
    ok(stalled.rock === rockThen, 'and stay stopped', `${rockThen} -> ${stalled.rock}`),
    ok(took === 6, 'six grains come off the pile', `${took}`),
    ok(!freed.pileFull.rock, 'which is enough to make room',
       `${freed.pileCount.rock} grains`),
    ok(working.rock < rockFreed, 'and they are swinging again',
       `${rockFreed} -> ${working.rock}`)
  ];
});

// A body with anything in its hands never sets off across the yard.
//
// A trip is out to a target, then whatever is nearest, then home along the
// ground. The target is picked with empty hands; after that a laden body
// takes the nearest thing to where it stands -- along its heap, on to what
// the heap has shed past its strip, across to the next heap -- but only
// while that is nearer than the walk home. It used to pick again at every
// column, so a body part-laden at the quarry walked back past the rock's
// heap to the farm for a spore, and a yard of single-grain finds had it
// turning round on every one.
group('a laden body takes what is near and sweeps home rather than setting off again', async () => {
  window.__reset();
  openSites();
  window.__crew(2, 4, 0, 2);                  // two on the plots: green, at the far end
  window.__levels({ haulCarryLevel: 5 });     // hands big enough to be part-full
  const s0 = state();
  for (let x = s0.pitX - 900; x < s0.pitX - 60; x += P * 8) window.__pile(x, 6);
  run(20);                                    // let the plots come in

  const banked0 = state().pit;
  // Every column newly taken on with something in hand, and whether it was
  // further off than the lip -- read off the frame before, because a target
  // already under the feet is scooped from on the frame it is claimed.
  let took = 0, laden = 0, far = 0;
  const had = new Map(), held = new Map();
  for (let i = 0; i < 7200; i++) {
    run(1 / 60);
    for (const w of yard.S.workers) {
      if (w.type !== 'hauler') continue;
      const before = had.get(w), carried = held.get(w) || 0;
      had.set(w, w.claim);
      held.set(w, w.carry || 0);
      if (w.claim < 0 || before === w.claim) continue;   // nothing newly taken on
      took++;
      if (carried > 0) {
        laden++;
        const x = s0.floorX + w.claim * P;
        if (Math.abs(x - w.x) > Math.abs(s0.pitX - w.x) + P) far++;
      }
    }
  }
  const banked = state().pit - banked0;
  window.__reset();
  return [
    ok(took >= 10, 'columns are taken on often enough to judge', `${took} times`),
    ok(far === 0, 'and a body with anything in hand never sets off for something further than home',
       `${far} of ${laden} laden claims were further off than the lip`),
    ok(banked > 0, 'and the hole still fills', `${banked} grains`)
  ];
});

// And a jammed heap does not take the crew off the rest of the ground. The
// pick has no piles in it: a body goes where the rest of the crew are not,
// so while the rock's heap is over its line the plots' spores are still
// carried in and the heap is still worked -- neither gets the whole crew.
// (Heap-first was the rule once: while any heap was over the line nobody
// fetched a find, and once a machine kept the rock's heap there for good
// the crew never fetched anything else again.)
group('a jammed heap and the finds are both carried in', async () => {
  window.__reset();
  openSites();
  window.__crew(4, 4, 0, 2);                  // and two on the plots, paying green
  window.__levels({ haulCarryLevel: 5, pickLevel: 6, rockhandPickLevel: 6 });
  run(30);                                    // long enough to be a going concern

  const spores0 = state().spores, pit0 = state().pit;
  let full = 0, n = 0;
  for (let i = 0; i < 5400; i++) {
    run(1 / 60);
    if (state().pileFull.rock) full++;
    n++;
  }
  const s = state();
  window.__reset();
  return [
    ok(s.pileCount.rock > 0, 'there is a heap under the rock to be dealt with',
       `${s.pileCount.rock} of ${s.pileLimit.rock}`),
    ok(s.spores > spores0, 'the spores are carried in while it stands', `${s.spores - spores0} spores`),
    ok(s.pit - pit0 > 100, 'and so is the heap', `${s.pit - pit0} grains banked, the rock stopped ${(100 * full / n).toFixed(0)}% of the run`)
  ];
});
