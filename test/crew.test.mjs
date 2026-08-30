// The crew: where they work, how they get there, what they do when there is
// nothing to do, and where they live.
//
// Node checks: the yard is run rather than watched, so a walk the length of the
// world costs a few milliseconds instead of the half minute it takes to happen.

import { group, ok, state, run, runUntil, quickCrew, haveRock, bankCore, openSites, quarryFloorAt, P, WORKER } from './helpers.mjs';

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
    poses.add(state().workerPos.filter(w => w[0] === 'm').join('|'));
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
  const miners = s.workerPos.filter(p => p[0] === 'm')
                            .map(p => p.split(':')[1].split(',').map(Number));
  const foot = s.rockFoot;
  window.__crew(0, 0);                    // put them back on the shelf
  return [
    ok(miners.length === 5, 'five miners are out', `${miners.length}`),
    ok(miners.every(([, y]) => y <= foot), 'nobody is below the ground',
       JSON.stringify(miners)),
    ok(miners.every(([x]) => x > s.rockX - s.rockW / 2 - 24 && x < s.rockX + s.rockW / 2 + 24),
       'they are all on the rock, not orbiting it', JSON.stringify(miners)),
    // Most of them level, rather than all of them. The rule is that the gang
    // works a layer and nobody bores a shaft -- and the gang takes the layer
    // down *around* each other, so at any instant one of them can be off it
    // and climbing back, which is the behaviour rather than a fault. A check
    // that demanded every last one be level was really checking that it had
    // not caught anybody mid-climb, and it failed on the timing.
    ok((() => {
      const ys = miners.map(([, y]) => y).sort((a, b) => a - b);
      const mid = ys[Math.floor(ys.length / 2)];
      return ys.filter(y => Math.abs(y - mid) <= 6 * 6).length >= ys.length - 1;
    })(), 'they stand level with each other, because they work a layer',
       JSON.stringify(miners.map(([, y]) => y))),
    ok(new Set(miners.map(([x]) => Math.round(x / 18))).size > 1,
       'and spread out along it rather than stacking up',
       JSON.stringify(miners.map(([x]) => Math.round(x))))
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
  window.__school({ breakers: 0, carters: 0, blasters: 0, growers: 0 });
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
  window.__assign('miners', 1);
  const off = state();

  // A thirtieth of a second at a time, so the climb out is not stepped over.
  //
  // This was a sixth, which was fine while it was written and became too coarse
  // the moment the crew's base pace went up: the whole climb fell between two
  // samples and the check reported nought rising samples for a body that had
  // climbed perfectly well. The cadence has to be finer than the fastest thing
  // it is watching, not tuned to whatever the pace happened to be.
  const trail = [];
  for (let i = 0; i < 150; i++) { run(1 / 30); trail.push(body()); }
  const arrived = runUntil(() => state().commuting.length === 0, 200);
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
  const onFloor = p => Math.abs(p.y - (quarryFloorAt(p.x + WORKER / 2) - WORKER)) <= 3;
  const steps = trail.slice(1).map((p, i) => Math.abs(p.x - trail[i].x));
  return [
    ok(digging.t === 'q' && digging.y > s0.groundY,
       'it starts at work, down in the quarry', `${digging.x},${digging.y}`),
    ok(off.workers === 1 && off.crew === 1,
       'moving it is one body, not one deleted and another made',
       `${off.workers} bodies, ${off.crew} on the payroll`),
    ok(off.miners === 1 && off.quarriers === 0,
       'and it counts at its new job the moment it is given it',
       `${off.miners} mining, ${off.quarriers} in the quarry`),
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
    ok(after.miners === 1 && after.workers === 1,
       'still the one body, and now it is a miner', `${after.workers} bodies`)
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
  window.__school({ breakers: 2 });
  const bought = state();
  run(20);
  const on = state();

  // and off the rock again: the helmet has to come back before the body does
  window.__assign('miners', -1);
  run(20);
  const back = state();
  window.__crew(0, 0);
  window.__school({ breakers: 0 });
  run(20);
  window.__clearFloor();
  const rock = r => r.roster.find(x => x.job === 'miners');
  return [
    ok(bought.trained === '', 'buying one puts nobody in a helmet',
       `"${bought.trained}"`),
    ok(rock(bought).spareKit === 2, 'both of them are left waiting at the rock',
       `${rock(bought).spareKit} waiting`),
    ok(on.trained === 'mm', 'the bodies walk over, pick them up and wear them',
       `"${on.trained}"`),
    ok(rock(on).spareKit === 0 && rock(on).hats === 2,
       'and the stand is empty while they are worn',
       `${rock(on).spareKit} of ${rock(on).hats} waiting`),
    ok(back.trained === 'm', 'one taken off the rock is one helmet fewer worn',
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
    window.__pile(q.from + Math.random() * (q.to - q.from) * 0.8, 20);
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

// A body that is nearly full does not cross the yard for one more thing.
//
// A find is picked before dust however far off it lies, and that is right: a
// green one is worth walking for. It stops being right when the hands doing the
// walking have one grain of room left. That body goes the length of the world,
// past the hole it could have emptied into on the way, to fetch one thing --
// while an empty pair of hands behind it fetches dust from under its feet. The
// work still gets done, by the wrong body, which is the only thing a hauler can
// get wrong.
group('a laden body banks what it has rather than crossing the yard', async () => {
  window.__reset();
  openSites();
  window.__crew(2, 4, 0, 2);                  // two on the plots: green, at the far end
  window.__levels({ haulCarryLevel: 5 });     // hands big enough to be part-full
  const s0 = state();
  for (let x = s0.pitX - 900; x < s0.pitX - 60; x += P * 8) window.__pile(x, 6);
  run(20);                                    // let the plots come in

  const cap = state().haulCap;
  const banked0 = state().pit;
  // The rule itself rather than the shape of it: a share of the walking is a
  // number that moves from run to run, and a threshold picked to sit between two
  // of them is a check that fails on a quiet afternoon.
  // At the moment of claiming, which is what the rule is about. A claim already
  // held can drift out of reach as the body fills up at the column it is
  // standing on, and giving that up would be giving up a column it is halfway
  // through -- so what has to be true is that it never *sets off* on one.
  let far = 0, took = 0;
  const had = new Map();
  for (let i = 0; i < 3600; i++) {
    run(1 / 60);
    const s = state();
    s.crewDetail.forEach((row, idx) => {
      const [type, , x, c, k] = row.split('|');
      if (type !== 'h') return;
      const claim = Number(k.slice(1));
      const before = had.get(idx);
      had.set(idx, claim);
      if (!(claim >= 0) || before === claim) return;   // nothing newly taken on
      const carry = Number(c.slice(1)), px = Number(x);
      if (carry < cap / 2) return;            // room to spare: it may go anywhere
      took++;
      const to = s.floorX + claim * P;
      if (Math.abs(to - px) > Math.abs(s.pitX - px)) far++;
    });
  }
  const held = took;
  const banked = state().pit - banked0;
  window.__reset();
  return [
    ok(cap >= 6, 'the hands are big enough for a part load to mean anything', `${cap}`),
    ok(held >= 5, 'and laden hands did take a column on often enough to judge',
       `${held} times`),
    ok(far === 0, 'never one further off than the hole it could empty into first',
       `${far} of ${held}`),
    ok(banked > 0, 'and the hole still fills', `${banked} grains`)
  ];
});

// And when the ground is backing up, the heap comes first.
//
// A find is picked before dust, which is right nearly all of the time: a green
// one is rare and dust is not. It stops being right the moment a heap fills,
// because a full heap *stops the station behind it* -- the rock stops coming
// apart -- while a find lying about stops nothing and is worth exactly as much
// in an hour. A yard where the crew step over the heap that is holding up the
// works to go and collect a spore is a yard that grinds to a halt with everybody
// busy.
group('a heap that is backing up is cleared before the finds are collected', async () => {
  window.__reset();
  openSites();
  window.__crew(4, 4, 0, 2);                  // and two on the plots, paying green
  window.__levels({ haulCarryLevel: 5, pickLevel: 6, minerPickLevel: 6 });
  run(30);                                    // long enough to be a going concern

  let full = 0, n = 0;
  for (let i = 0; i < 5400; i++) {
    run(1 / 60);
    if (state().pileFull.rock) full++;
    n++;
  }
  const s = state();
  window.__reset();
  const stopped = full / n;
  return [
    ok(s.pileCount.rock > 0, 'there is a heap under the rock to be dealt with',
       `${s.pileCount.rock} of ${s.pileLimit.rock}`),
    // It sat full about five sixths of the run while the finds always won, and
    // about seven tenths once the heap could win. Four fifths is the wrong side
    // of that and clear of the noise.
    ok(stopped < 0.8, 'the rock is not stopped by its own heap for most of the run',
       `${(stopped * 100).toFixed(1)}% of the time`),
    // The point of clearing it is what gets banked while the works keep running:
    // this ran at about fifty grains before and two hundred after.
    ok(s.pit > 100, 'and a good deal more comes off the yard for it',
       `${s.pit} grains banked`)
  ];
});
