// The rock: how it comes down, where it stands, what it leaves behind, and the
// beat the crew get when it is finished.

import { group, ok, state, run, runUntil, quickCrew, haveRock, bankCore, P, WORKER } from './helpers.mjs';

// Finishing a rock is the end of a long job, so it gets a beat: the crew hop
// about on the bare ground, and only then does the next one come down.
group('a finished rock is worth a moment', async () => {
  window.__crew(3, 0);
  haveRock();
  window.__next();                          // the last of it goes
  run(0.5);
  const partying = state();
  // watched across the dance rather than at two moments in it: they hop about
  // three times a second, and two samples can easily catch the same height
  const heights = new Set();
  for (let i = 0; i < 60; i++) {
    run(1 / 60);
    heights.add(state().workerPos.filter(p => p[0] === 'm').map(p => p.split(',')[1]).join());
  }
  const stillPartying = state();
  let sky = 0;
  for (let i = 0; i < 400 && !sky; i++) {    // catch it on its way down
    run(1 / 60);
    if (state().rockFall > 0) sky = state().rockFall;
  }
  const landed = haveRock();
  const after = state();
  window.__crew(0, 0);
  return [
    ok(partying.dancing, 'the crew are dancing the moment the rock is off'),
    ok(stillPartying.rock === 0, 'and the next rock has not turned up yet',
       `${stillPartying.rock} of rock`),
    ok(heights.size > 1, 'they are off the ground doing it',
       `${heights.size} different heights across a second of it`),
    ok(sky > 0, 'the next rock comes down out of the sky', `caught it ${sky}px up`),
    ok(landed && after.rockFoot === after.groundY, 'and lands on the ground line',
       `foot ${after.rockFoot}, ground ${after.groundY}`),
    ok(after.apronClear, 'clearing the ground it needs as it lands',
       `${after.apronDust} grains in the apron`)
  ];
});

// A rock is a heavy thing coming out of the sky, and until it knocked the view
// about it landed in silence. The shake has to die away on its own, and it has
// to keep the picture on whole device pixels while it does it.
group('the landing knocks the yard about', async () => {
  window.__crew(2, 0);
  haveRock();
  window.__next();
  let peak = 0, atLanding = null, quietOnTheWayDown = true;
  for (let i = 0; i < 900 && atLanding === null; i++) {
    run(1 / 60);
    const s = state();
    if (s.rockFall > 0 && s.shake > 0) quietOnTheWayDown = false;
    peak = Math.max(peak, s.shake);
    if (s.rock > 0 && !s.rockFall && peak > 0) atLanding = s;
  }
  // and then watch it ring: the offsets are read after the landing, because
  // the frame it lands on is the frame the shake is set, not spent
  const moved = new Set();
  for (let i = 0; i < 60; i++) { run(1 / 60); moved.add(state().shakeOff.join()); }
  const still = runUntil(() => state().shake === 0, 5);
  const rest = state();
  window.__crew(0, 0);
  return [
    ok(peak > 0, 'the landing throws the view', `${peak} world pixels of it`),
    ok(atLanding !== null && quietOnTheWayDown,
       'and it is the landing that does it, not the fall'),
    ok(moved.size > 2, 'it rocks rather than jumping once',
       `${moved.size} different offsets`),
    ok(still && rest.shake === 0, 'and it settles back on its own',
       `${rest.shake} left`),
    ok(rest.shakeOff[0] === 0 && rest.shakeOff[1] === 0,
       'leaving the view exactly where it was', rest.shakeOff.join())
  ];
});

// The next rock lands on the ground the crew were standing on, so they get out
// of its footprint before it arrives rather than being buried by it.
group('the crew get out from under the next rock', async () => {
  window.__crew(4, 3);
  quickCrew();
  // A rock a few in, rather than the first one. The first is the smallest the
  // game ever drops and it comes down from the lowest sky, which gives a crew
  // stood on top of it the least time there is to get off -- four bodies on
  // rock one clear the footprint about seven frames late. That is a fact about
  // the opening, and it is watched in its own right; this check is about the
  // rule, so it watches a rock the rule has room to work in.
  window.__jump(4);
  haveRock();
  // Everybody at their own work before the rock is finished. A body still
  // walking out to the rock is a body crossing the ground the next one is
  // coming down on, and this is a check about clearing the footprint, not
  // about the commute.
  run(6);
  window.__next();
  const inZone = s => !s.dropZone ? [] : s.workerPos.filter(w => {
    const x = +w.split(':')[1].split(',')[0];
    return x + WORKER > s.dropZone[0] && x < s.dropZone[1];
  });
  let told = false, late = 0, landed = null;
  for (let i = 0; i < 900 && landed === null; i++) {
    run(1 / 60);
    const s = state();
    if (s.dropZone) told = true;
    // the last of the fall is when it matters: by then the ground is spoken for
    if (s.rockFall > 0 && s.rockFall < 200 && inZone(s).length) late++;
    if (s.rock > 0 && !s.rockFall && told) landed = s;
  }
  const under = landed ? inZone({ ...landed, dropZone: landed.dropZone }) : ['no rock'];
  window.__crew(0, 0);
  return [
    ok(told, 'they are told where it is coming down before it is there'),
    ok(landed !== null, 'and it comes down'),
    ok(late === 0, 'nobody is still in the way as it drops',
       `${late} frames with somebody in it`),
    ok(under.length === 0, 'and nobody is under it when it lands', under.join(' '))
  ];
});

group('the rock stands on the ground', async () => {
  haveRock();                                // a rock still in the air stands on nothing
  const s = state();
  return [
    ok(Math.abs(s.rockFoot - s.groundY) <= 18,
       'its foot is at the ground line', `${s.rockFoot - s.groundY} below`),
    ok(s.rockW > s.rockH, 'it is a hill, wider than it is tall', `${s.rockW}x${s.rockH}`),
    ok(s.benchX + s.benchW < s.rockX - s.rockW / 2, 'it stands clear of the bench',
       `bench ends ${Math.round(s.benchX + s.benchW)}, rock starts ${Math.round(s.rockX - s.rockW / 2)}`),
    ok(s.benchX < s.rockX && s.rockX < s.pitX, 'the rock is between the bench and the pit'),
    // the whole working area has to sit in a window at once, at the biggest
    // rock: the bench, the rock and the lip of the pit are one screenful
    ok(s.pitX - s.benchX < 1600, 'bench through pit lip is one screenful',
       `${Math.round(s.pitX - s.benchX)} across`),
    ok((s.rockX - s.rockW / 2) - (s.benchX + s.benchW) > 60, 'the rock never grows into the bench',
       `${Math.round((s.rockX - s.rockW / 2) - (s.benchX + s.benchW))} clear`),
    ok(s.pitX - (s.rockX + s.rockW / 2) > 300, 'there is ground to sweep between rock and lip',
       `${Math.round(s.pitX - (s.rockX + s.rockW / 2))}`)
  ];
});

// The rock is the only thing drawn a cell at a time, so it is the only thing
// that seams: two rects sharing an edge on a fraction of a device pixel are
// each antialiased against the page, and the seam between them comes out grey.
// The layout picks a whole number of device pixels per cell, and this checks
// the other half of it -- that the rock's own edges land on that same ladder,
// at every cell size a window can ask for.
group('the rock lands on whole device pixels', async () => {
  const s = state();
  const off = v => Math.abs(v - Math.round(v));
  const sizes = [1, 2, 3, 4, 5, 6];                 // device pixels a cell may be
  const rows = sizes.filter(cell => off(s.rockFoot * (cell / 6)) > 1e-9);
  const cols = sizes.filter(cell => off(s.rockLeftX * (cell / 6)) > 1e-9);
  return [
    ok(off(s.cellDevicePx) < 1e-9, 'a cell is a whole number of device pixels',
       `${s.cellDevicePx}`),
    ok(rows.length === 0, 'the rock stands on the device grid at every cell size',
       `seams at ${rows.join(', ')}px a cell`),
    ok(cols.length === 0, 'and its left edge does too',
       `seams at ${cols.join(', ')}px a cell`),
    ok((s.rockW / 6) % 2 === 0, 'the rock is an even number of cells across',
       `${s.rockW / 6} cells`)
  ];
});

group('rocks stop growing, because they never stop coming', async () => {
  window.__jump(40);
  run(0.2);
  const forty = state();
  window.__jump(400);
  run(0.2);
  const far = state();
  window.__jump(1);
  run(0.2);
  return [
    ok(far.rockW === forty.rockW && far.rockH === forty.rockH,
       'rock four hundred is no bigger than rock forty',
       `${forty.rockW}x${forty.rockH} vs ${far.rockW}x${far.rockH}`),
    ok(far.rockH < 520, 'and still fits under the sky', `${far.rockH}`),
    ok(far.rockW < 900 - 108, 'and never reaches the bench', `${far.rockW}`)
  ];
});

// The first rock comes off and, for a moment, you did it. Then the next one
// lands. Once, after the first rock and never again -- a beat you are shown
// twice is a beat, a beat you are shown every time is a loading screen.
group('the first rock is worth a moment, and only the first', async () => {
  window.__reset(true);                        // the opening, played out
  run(0.4);
  runUntil(() => !state().intro, 200);
  window.__crew(3, 1);
  const before = state();

  window.__next();                             // and the first rock is finished
  const seen = [];
  let met = null;
  for (let i = 0; i < 600 && !state().reunionDone; i++) {
    run(0.1);
    const s = state();
    if (s.intro && !seen.includes(s.intro)) seen.push(s.intro);
    if (s.intro === 'meet' && s.zoom > 1.9) met = s;
  }
  const after = state();

  // and the next one is just a rock
  window.__next();
  let again = false;
  for (let i = 0; i < 200; i++) { run(0.1); if (state().intro) again = true; }
  const later = state();
    run(0.3);
  return [
    ok(!before.reunionDone, 'it has not happened yet when the opening ends'),
    ok(seen.join(',') === 'meet,part',
       'the first rock brings them together, and then parts them', seen.join(',')),
    ok(met && met.zoom > 1.9, 'the view comes back in for it',
       met && `zoom ${met.zoom}`),
    ok(met && met.buriedVisible, 'with the one who was under it out on the ground'),
    ok(after.reunionDone && Math.abs(after.zoom - 0.833) < 0.01,
       'then it lets go', `${after.zoom}`),
    ok(after.boulderNo === before.boulderNo + 1 && after.rock > 0,
       'and the next rock is down and is the next rock',
       `${before.boulderNo} -> ${after.boulderNo}`),
    ok(!again, 'and no rock after the first one ever stops the game again'),
    ok(later.boulderNo === after.boulderNo + 1,
       'they just keep coming', `${after.boulderNo} -> ${later.boulderNo}`)
  ];
});

// A core sits at the foot of the rock, not partway up it. Pinned to a fraction
// of the rock's full height it ended up hanging in the air over a worn one --
// the gang take the rock down from the top, so the last of it is a low mound.
group('the core sits at the foot of the rock', async () => {
    run(0.4);
  window.__crew(0, 0);
  window.__clearFloor();
  window.__jump(5);                            // the first rock with a core in it
  run(1);
  const s = state();
  const foot = s.rockFoot;
  const home = s.coreHome;

  // and it comes out of the last of the rock rather than out of the air
  window.__next();
  runUntil(() => state().coreItem && state().coreItem.rest, 60);
  const loose = state();
  window.__clearFloor();
  return [
    ok(home && Math.abs(home.y + 18 - foot) <= 2,
       'it stands on the foot of the rock itself',
       `core bottom ${home && home.y + 18}, rock foot ${foot}`),
    ok(home && Math.abs(home.x + 9 - s.rockX) <= 3,
       'in the middle of it', `${home && home.x + 9} vs ${s.rockX}`),
    ok(!!loose.coreItem, 'and it drops out when the last of the rock goes')
  ];
});

// The game used to start with a rock already sitting there and a cursor to hit
// it with, and nothing said why. It starts before the rock now: two squares on
// the bare ground, and then one of them is under it. Everything after that is
// the other one digging.
group('the game opens on two squares and a rock lands on one', async () => {
  window.__reset(true);                        // the opening, played out
  run(0.4);
  const open = state();
  run(3);
  const talking = state();

  // it runs on its own clock, in phases, and it is deliberately unhurried
  const seen = [open.intro];
  let flat = null, up = null;
  for (let i = 0; i < 900 && state().intro; i++) {
    run(0.1);
    const s = state();
    if (s.intro && !seen.includes(s.intro)) seen.push(s.intro);
    if (s.intro === 'down' && !flat) flat = s;
    // partway through getting up, not the frame it starts: the view eases out
    // over the whole of it and at the first frame it has not moved yet
    if (s.intro === 'up') up = s;
  }
  const after = state();

  // And the one underneath is still there every time a rock is finished. A body
  // on the rock, so the crew take their five seconds over it: with nobody on
  // it there is no celebration and the next rock is down before you can look.
  window.__crew(1, 0);
  window.__next();
  run(1);
  const bare = state();
    run(0.3);
  return [
    ok(open.intro === 'chat' && open.pair === 2,
       'it opens on two of them, and no rock', `${open.pair} stood there, rock ${open.rock}`),
    ok(open.rock === 0, 'nothing to mine yet', `${open.rock}`),
    ok(open.zoom > 1, 'and it opens close on them', `zoom ${open.zoom}`),
    ok(talking.intro === 'chat', 'they are given a moment to be two people'),
    ok(seen.join(',') === 'chat,fall,down,up,show',
       'a rock, a body knocked flat, a body getting up, and the loop shown once',
       seen.join(',')),
    ok(flat && flat.rock > 0, 'the boulder comes down out of the sky',
       flat && `${flat.rock} of rock`),
    ok(flat && flat.pair === 1, 'on one of them', flat && `${flat.pair} left standing`),
    ok(up && up.zoom < open.zoom, 'and the view pulls back out as it gets up',
       up && `${open.zoom} -> ${up.zoom}`),
    ok(after.intro === null && Math.abs(after.zoom - 0.833) < 0.01,
       'all the way back out', `${after.zoom}`),
    ok(after.crew === 1,
       'and the one left standing is the crew -- the first body is not bought',
       `${after.crew} hired`),
    ok(after.stored >= 2,
       'and it has shown you where dust goes before you are given the yard',
       `${after.stored} in the hole`),
    ok(after.buried, 'with the other one under it'),
    ok(bare.buriedVisible,
       'and when the rock is gone they are there, alive, until the next one lands')
  ];
});

group('spoil falls where it falls', async () => {
  window.__crew(6, 0);
  // Long enough to be a sample rather than a handful. Where a grain goes is a
  // coin toss now instead of a delivery, so five seconds of it is a dozen and a
  // half grains and which side they fell on swings about.
  run(12);
  const s = state();
  window.__crew(0, 0);
  const right = s.floor - s.dustLeftOfRock - s.dustUnderRock;
  return [
    ok(s.floor > 0, 'dust piles on the ground', `${s.floor}`),
    ok(s.dustUnderRock === 0, 'none of it comes to rest on or under the rock',
       `${s.dustUnderRock} grains`),
    // Spoil used to be *aimed*: every grain picked a spot inside the rock's own
    // strip and was launched on the one arc that got there, so it all ended up
    // on the side the pit is on because the game put it there. A knock is a
    // knock now, and a hill has two sides -- so some of it goes over the back,
    // and somebody walks round for it. See 'a worker can reach the bank behind
    // the rock'.
    ok(right > 0 && s.dustLeftOfRock > 0, 'and a hill has two sides to land on',
       `${right} right of the rock, ${s.dustLeftOfRock} behind it`),
    ok(s.floor === right + s.dustLeftOfRock,
       'with nothing lost between the two of them',
       `${s.floor} down, ${right} + ${s.dustLeftOfRock}`),
    // The apron is a cliff the sand cannot slump over, so without a ceiling on
    // how high a column may stand near it the bank grows straight up against
    // the rock as a sheer wall.
    ok(s.heapAtRock <= 3, 'the bank does not stand up as a wall at the rock',
       `${s.heapAtRock} cells high against the apron`)
  ];
});
