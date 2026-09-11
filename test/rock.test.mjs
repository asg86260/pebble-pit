// The rock: how it comes down, where it stands, what it leaves behind, and the
// beat the crew get when it is finished.

import { group, ok, state, run, runUntil, quickCrew, haveRock, bankCore, yard, P, WORKER } from './helpers.mjs';
// The dance's own numbers, for the celebration group below: what a jump clears,
// the pace that reads as a fault, and the two the beat is derived from. Read
// rather than retyped, so the check moves with the dial instead of pinning it.
import { DANCE_BEAT, DANCE_BUZZ, DANCE_JUMP_H, DANCE_TEMPO_HI, danceJumpBeat } from '../src/config.js';
// The bodies themselves, for the same group: which frames the dance actually
// drew is a fact about a worker and not one the snapshot carries.
import { S } from '../src/state.js';
import { sweep } from '../src/hands.js';

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
    heights.add(state().workerPos.filter(p => p[0] === 'r').map(p => p.split(',')[1]).join());
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

// And while they wait for it, they dance -- and what dancing IS changed under
// this check, so the check changed with it (item 21, feedback5; F4 of wave 5).
//
// It used to assert *travel*: the dance had three moves, two of which crossed
// the ground, and the bug this group was written for was a body whose mark lay
// through the drop zone being ordered toward it by the drift rule and flipped
// back by the zone's wall every frame -- a square going nowhere for the whole of
// the fall. Travel was the tell that the celebration had not degenerated.
//
// The two moves that travelled are gone: a gang ambling sideways and turning on
// the spot read as milling about rather than as delight, so a celebration is
// jumping now and **a dancing body covers no ground at all**. That makes the old
// assertion the exact opposite of the rule, so what is defended here is the same
// spirit against the new promise -- a celebration must not degenerate into a
// shiver, and the shiver now has three different shapes:
//
//   too small   nobody leaves the ground: a gang standing still is not a
//               celebration, whatever the moves table says.
//   too quick   somebody crosses its own height past DANCE_BUZZ, which is where
//               a bounce stops reading as pleased and starts reading as a fault.
//               That IS the vibration this group is named for.
//   sliding     a jumping body that also drifts sideways is the old shuffle
//               coming back, and it is the one thing the new dance cannot do.
//
// The numbers all come off the dance's own constants rather than being typed
// again here: a check that pins 21 pixels of jump is a check that goes red the
// day somebody moves the dial, which is the failure that brought this group's
// author back in the first place.
group('the crew dance rather than vibrate while the next rock falls', async () => {
  window.__crew(4, 0);
  quickCrew();
  window.__jump(4);
  haveRock();
  run(6);
  window.__next();
  // Frame by frame, as the groups above do -- a coarse step walks straight over
  // the fall -- and across the whole beat, celebration and fall alike: a body
  // pinned against the drop zone is pinned while the sky is still empty.
  //
  // Off the bodies rather than off `workerPos`, which is the one thing this
  // group needed that a snapshot cannot say: WHICH FRAMES THE DANCE DREW. Those
  // are the only frames any of this is about -- a body being walked clear of the
  // drop zone is travelling, and rightly, but the duck is doing that and not the
  // dance. `jigOn` is the frame the dance last ran on a body, which is exactly
  // the question, and `foot` is the footing it took when it joined in.
  const seen = new Map();
  let sampled = 0;
  for (let i = 0; i < 1200; i++) {
    run(1 / 60);
    const s = state();
    if (!s.dancing && s.rockFall <= 0) break;
    const t = yard.clock.now();
    S.workers.forEach((w, idx) => {
      if (w.type !== 'rockhand' || w.jigOn !== t) return;   // not dancing this frame
      if (!seen.has(idx)) seen.set(idx, []);
      seen.get(idx).push({ f: sampled, x: w.x, y: w.y, foot: w.foot });
    });
    sampled++;
  }
  window.__crew(0, 0);

  // The last frame anybody was still dancing, which is when the yard stopped
  // watching: the dance ends for the whole gang at once.
  const ended = Math.max(...[...seen.values()].map(f => f[f.length - 1].f));

  // What one body did, off the footing it joined the dance on.
  const bodies = [...seen.values()].filter(f => f.length > 30).map(film => {
    const foot = film[film.length - 1].foot;
    const rise = foot - Math.min(...film.map(p => p.y));
    // Ground covered while the dance was the thing moving it, measured only
    // between two frames it drew BACK TO BACK. A gap in the film is a frame
    // something else had the body -- the duck walking it clear of the drop zone
    // is the one that happens here, and it is travel, but it is not the dance's.
    // Not a range with slack in it either: a jump writes `w.y` and never `w.x`,
    // so the answer is nought exactly, and anything else is a move that travels
    // having come back.
    let slide = 0;
    for (let k = 1; k < film.length; k++)
      if (film[k].f === film[k - 1].f + 1)
        slide = Math.max(slide, Math.abs(film[k].x - film[k - 1].x));
    // How often it crossed its own height: the tops of the bounces, counting
    // only the ones that got at least halfway up so a pixel of wobble at a beat
    // join is not read as a bounce of its own.
    const tops = [];
    for (let k = 1; k < film.length - 1; k++)
      if (film[k].y < film[k - 1].y && film[k].y <= film[k + 1].y && foot - film[k].y > rise / 2)
        tops.push(film[k].f);
    let quickest = 0;
    for (let k = 1; k < tops.length; k++)
      quickest = Math.max(quickest, 60 / (tops[k] - tops[k - 1]));
    // And how high it was on the last frame the dance drew it -- which the
    // wind-down promises is the ground: a body only leaves it if it can be back
    // down before the yard has something else to look at.
    //
    // Only for the bodies that were still dancing at the end. One that was
    // ducked clear in the last moments stopped dancing early and was stood on
    // its feet by the duck, which is a different rule keeping the same promise.
    const last = film[film.length - 1];
    return { rise, slide, quickest, hanging: last.f === ended ? foot - last.y : 0 };
  });

  const rises = bodies.map(b => b.rise).sort((a, b) => b - a);
  const jump = DANCE_JUMP_H * P;                       // what a full jump clears
  const quickest = Math.max(0, ...bodies.map(b => b.quickest));
  const slide = Math.max(0, ...bodies.map(b => b.slide));
  const hanging = bodies.filter(b => b.hanging > 1).length;
  // The bound the tempo is built on, which holds whatever the panel is set to:
  // the quickest tempo any body can roll, times the beat derived from it.
  const ceiling = DANCE_BEAT * danceJumpBeat() * DANCE_TEMPO_HI;

  return [
    ok(sampled > 240, 'there was a stretch of the beat to watch', `${sampled} frames of it`),
    ok(bodies.length >= 3, 'with a gang on the ground under it', `${bodies.length} rockhands`),
    // Three quarters of a jump rather than the whole of it: the film is sampled
    // a frame at a time and the very top of the arc falls between two of them.
    ok(rises[0] > jump * 0.75, 'and the gang leave the ground rather than shivering on it',
       `tallest ${rises[0]}px of a ${jump}px jump`),
    ok(rises.filter(r => r > jump * 0.5).length >= 2,
       'for more of the gang than one', rises.map(r => `${r}px`).join(' ')),
    // The vibration this group is named for, said as the rule it always meant.
    ok(quickest < DANCE_BUZZ, 'and nobody crosses its own height fast enough to buzz',
       `quickest ${quickest.toFixed(2)} a second against ${DANCE_BUZZ}`),
    ok(ceiling < DANCE_BUZZ, 'nor could they: the tempo is derived to stay under it',
       `ceiling ${ceiling.toFixed(2)} against ${DANCE_BUZZ}`),
    // The new rule, and the old assertion turned over: a jump goes up, and only
    // up. A body sliding while it is in the air is the shuffle coming back.
    ok(slide === 0, 'a body in the air covers no ground at all', `${slide}px of drift`),
    // And the promise the wind-down makes: nobody is switched off mid-jump.
    ok(hanging === 0, 'and nobody is left hanging when the yard stops watching',
       `${hanging} still up`)
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
  runUntil(() => state().intro !== 'leave', 12);   // the walk over, at the yard's own pace
  run(1);
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

  // Handed over carrying, in the shape the show taught -- and the view back on
  // the seat, where the bench is. Left on the rock, nothing was ever carried,
  // the counter stood at 1 and no row lit (critics 2026-09-10, A2). The pile
  // the show left on the crest is what it goes and gets: the counter has to
  // move with no click from the player at all.
  const handed = { haulers: after.haulers, rockhands: after.rockhands };
  run(40);
  const banked = state().stored;
  run(2);
  const seat = Math.abs(state().camX - state().openCamX);
  // The bench's first row is about YOUR hands -- what a drag of the cursor
  // picks up -- and it is not offered until you have dragged (critics
  // 2026-09-10, C4): a stranger bought it four times for a mechanic nothing
  // had shown them.
  const rowShown = () => !!window.__rows().find(r => r.key === 'carry')?.shown;
  const beforeDrag = rowShown();
  const heap = state().piles.find(p => p.key === 'rock');
  window.__pile(heap.from + P * 2, 4);
  sweep(heap.from + P * 2 + P / 2, state().groundY - P / 2);
  const afterDrag = rowShown();

  // And the one underneath is still there every time a rock is finished. A body
  // on the rock, so the crew take their five seconds over it: with nobody on
  // it there is no celebration and the next rock is down before you can look.
  window.__crew(1, 0);
  window.__next();
  run(1);
  const bare = state();
    run(0.3);
  return [
    ok(open.intro === 'leave' && open.pair === 2,
       'it opens on two of them, and no rock', `${open.pair} stood there, rock ${open.rock}`),
    ok(open.rock === 0, 'nothing to mine yet', `${open.rock}`),
    ok(open.zoom > 1, 'and it opens close on them', `zoom ${open.zoom}`),
    ok(talking.intro === 'chat', 'they are given a moment to be two people'),
    ok(seen.join(',') === 'leave,chat,fall,down,up,show',
       'a walk out of the house, a rock, a body knocked flat, a body getting up, and the loop shown once',
       seen.join(',')),
    // They come out of the house, which stands before anybody is hired: the
    // pair start at its door and the rock lands on the spot, not on the door.
    ok(open.pairX.every(x => x < open.doorX + 150) && open.houses.cubes === 2,
       'the two of them come out of the house, which is already standing',
       `pair at ${open.pairX.join(',')}, door ${open.doorX}, ${open.houses.cubes} rooms`),
    ok(talking.pairX.every(x => Math.abs(x - open.rockX) < 60),
       'and walk to the spot before the chat', `pair at ${talking.pairX.join(',')} vs ${open.rockX}`),
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
    // One grain, thrown. It used to carry two of them the length of the yard with
    // the camera trailing behind, which is a correct demonstration and a dreadful
    // thing to sit through -- see `show` in intro.js.
    ok(after.stored >= 1,
       'and it has shown you where dust goes before you are given the yard',
       `${after.stored} in the hole`),
    ok(after.buried, 'with the other one under it'),
    ok(handed.haulers === 1 && handed.rockhands === 0,
       'and the one left standing is handed over carrying, as the show taught',
       JSON.stringify(handed)),
    ok(banked > after.stored,
       'so the counter moves with no click from the player', `${after.stored} -> ${banked}`),
    ok(seat < 2, 'and the view is back on the opening seat, bench in shot', `${seat} px off`),
    ok(!beforeDrag && afterDrag, 'and the row about your own hands waits until you have used them',
       `shown before a drag: ${beforeDrag}, after: ${afterDrag}`),
    ok(bare.buriedVisible,
       'and when the rock is gone they are there, alive, until the next one lands')
  ];
});

group('a rockhand tosses its spoil onto the heap', async () => {
  window.__crew(6, 0);
  run(12);
  const s = state();
  window.__crew(0, 0);
  const right = s.floor - s.dustLeftOfRock - s.dustUnderRock;
  return [
    ok(s.floor > 0, 'dust piles on the ground', `${s.floor}`),
    ok(s.dustUnderRock === 0, 'none of it comes to rest on or under the rock',
       `${s.dustUnderRock} grains`),
    // A rock has two sides and only one of them is the yard. Letting spoil
    // simply fall put half of it on the back of the hill, where the crew, the
    // bench and the hole are not, and it lay there in a layer nobody had a
    // reason to walk to. A rockhand throws it onto the heap instead.
    ok(s.dustLeftOfRock === 0, 'and none on the back of the hill',
       `${s.dustLeftOfRock} behind it`),
    ok(right === s.floor, 'it all goes onto the heap the rock pours into',
       `${right} of ${s.floor} right of the rock`),
    // The apron is a cliff the sand cannot slump over, so without a ceiling on
    // how high a column may stand near it the bank grows straight up against
    // the rock as a sheer wall.
    ok(s.heapAtRock <= 3, 'the bank does not stand up as a wall at the rock',
       `${s.heapAtRock} cells high against the apron`)
  ];
});

// The one underneath is the reason any of this is happening, and the moment the
// next rock lands on them is the only time you ever see it happen. It used to be
// over before it started: a rock exists from the instant it is made, several
// seconds before it arrives, so the square winked out while the rock was still
// up in the air and what you saw was a thing disappearing rather than a thing
// being buried.
group('the one underneath is covered by the rock, not by the making of it', async () => {
  window.__reset();
  window.__crew(1, 0);
  window.__jump(2);
  window.__next();

  let falling = 0, landed = 0, said = 0;
  for (let i = 0; i < 400; i++) {
    run(1 / 60);
    const s = state();
    if (s.rockFall > 0 && s.buriedVisible) falling++;
    if (s.rockFall === 0 && s.rock > 0 && s.buriedVisible) landed++;
    if (s.saying > 0) said++;
  }
  window.__crew(0, 0);
  window.__reset();
  return [
    ok(falling > 10, 'it is there the whole way down', `${falling} frames`),
    ok(landed === 0, 'and gone the moment the rock is on it', `${landed} frames after`),
    // and somebody watched it happen. The opening gives the body it threw clear
    // a mark over its head; every rock after that lands on the same spot, on the
    // same person, and used to land in silence.
    ok(said > 0, 'and whoever saw it says so', `${said} frames of it`)
  ];
});
