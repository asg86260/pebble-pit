// A carter's trip is a sweep home: out to the thing it went for, then back
// along the ground taking everything it walks over until its hands are full,
// and never turning round. Empty hands still decide where a trip starts --
// crew.test.mjs holds the find-first and fullest-heap checks for that -- and
// this file is about everything after.

import { yard, group, ok, state, run, runUntil, quickCrew, openSites, P } from './helpers.mjs';
import { floor } from '../src/state.js';
import { at } from '../src/grid.js';
import { spend } from '../src/pit.js';
import { LADDER } from '../src/config.js';

// One hauler, nothing mining, the floor bare: the only dust in the yard is what
// the check puts there, and the only body is the one being watched. The grains
// go on open ground left of the rock -- a thousand pixels short of the lip --
// because `__pile` walks a grain aimed at barred ground (under the rock, which
// spans the seven hundreds) to the nearest free column, and three grains
// meant to be a stride apart all ended up in one.
const oneHauler = () => {
  window.__reset();
  window.__crew(0, 1);
  quickCrew();
  window.__clearFloor();
  run(0.2);
};

// Runs until the first load is tipped and says how much was still on the
// ground at that moment -- which is the whole question: did it walk over
// something on its way to the hole, or did it walk to the hole past nothing.
//
// The toss is the moment, not the bank: what is thrown is in the air for a
// while, and by the time it lands the body is off on its next trip.
const carrying = () => Number(state().crewDetail.find(d => d[0] === 'h').split('|')[3].slice(1));
const firstToss = (limit = 60) => {
  let had = 0;
  for (let i = 0; i < limit * 60; i++) {
    run(1 / 60);
    const c = carrying();
    if (had > 0 && c === 0) return { tossed: true, left: floor.n, took: had };
    had = c;
  }
  return { tossed: false, left: floor.n, took: 0 };
};

group('a grain a stride away is taken before the walk to the hole', async () => {
  oneHauler();
  const far = state().pitX - 1000;
  // two grains, a few cells apart, both a long way from the lip
  window.__pile(far, 1);
  window.__pile(far + P * 6, 1);
  window.__place('hauler', far);
  run(0.1);
  const cap = state().haulCap;
  const r = firstToss();
  window.__crew(0, 0);
  return [
    ok(cap >= 2, 'the hands hold at least two', `${cap}`),
    ok(r.tossed, 'the load is tipped', `${r.took} grains`),
    ok(r.left === 0 && r.took === 2, 'and both grains came in on the one trip',
       `${r.took} banked, ${r.left} still on the ground`)
  ];
});

group('what lies behind the target is left for the next trip', async () => {
  oneHauler();
  // the target, one grain a stride further out, and one a stride nearer home
  const at = state().pitX - 1000;
  window.__pile(at, 1);
  window.__pile(at - P * 8, 1);
  window.__pile(at + P * 8, 1);
  window.__place('hauler', at);
  run(0.1);
  const r = firstToss();
  // and then it does go back for it: leaving it is not forgetting it
  const second = runUntil(() => floor.n === 0, 90);
  window.__crew(0, 0);
  return [
    ok(r.tossed, 'the load is tipped', `${r.took} grains`),
    ok(r.took === 2 && r.left === 1, 'the target and the one on the way home, not the one behind',
       `${r.took} banked, ${r.left} still on the ground`),
    ok(second, 'and the one behind is fetched on the trip after')
  ];
});

// A grain that lands ahead of a body already walking to the lip is picked up
// on the way, so long as there is room in hand for it.
group('a grain that lands ahead of a laden body is taken on the way', async () => {
  oneHauler();
  const far = state().pitX - 1000;
  window.__pile(far, 1);
  window.__place('hauler', far);
  // let it pick the grain up and turn for the hole
  const laden = runUntil(() => state().crewDetail.some(d => {
    const [t, goal, , c] = d.split('|');
    return t === 'h' && goal === 'dump' && c === 'c1';
  }), 30);
  // then drop one between it and the lip, on the open ground past the rock
  const ahead = state().pitX - 300;
  window.__pile(ahead, 1);
  const r = firstToss();
  window.__crew(0, 0);
  return [
    ok(laden, 'the body turns for the hole with one grain in hand'),
    ok(r.tossed, 'and tips', `${r.took} grains`),
    ok(r.took === 2 && r.left === 0, 'both grains, the second picked up on the way',
       `${r.took} banked, ${r.left} still on the ground`)
  ];
});

// A booking is made with the hands empty against the room the hole has then.
// The walk out is long and the hole is being spent from while it happens, so a
// body booked for one because that was all the room there was should take
// whatever room has opened by the time it is stood over the heap -- not carry
// its one grain past four and tip.
group('a spent booking asks the hole again before the body gives up', async () => {
  oneHauler();
  const s0 = state();
  // fill the hole to one grain short, so the trip out books exactly one
  window.__tip(s0.pitCapacity - 1);
  run(0.5);
  const far = state().pitX - 1000;
  window.__pile(far, 5);
  window.__place('hauler', far);
  const free0 = state().pitFree;
  // one in hand and the booking spent -- caught the frame it happens, so the
  // body is still stood over the heap when the room turns up
  let one = false;
  for (let i = 0; i < 20 * 60 && !one; i++) { run(1 / 60); one = carrying() === 1; }
  // then make room: paying comes out of the hole
  spend(20);
  run(1 / 60);
  const free1 = state().pitFree;
  const r = firstToss(30);
  window.__crew(0, 0);
  return [
    ok(free0 === 1, 'the hole has room for one grain when the trip is booked', `${free0}`),
    ok(one, 'and one grain is taken on it'),
    ok(free1 > 1, 'room is made while the body stands over the heap', `${free1}`),
    ok(r.tossed && r.took > 1, 'and it fills its hands from the heap before tipping',
       `${r.took} tipped, ${r.left} left on the ground`)
  ];
});

// A stride is `frames()` wide, so on a slow frame or under a swift brew it is
// wider than the span under the feet. The walk home used to look only under
// the feet, and a body that fast stepped clean over single grains between two
// looks -- the exact thing a sweep is for. The step ends on the next column
// with something in it instead.
group('a fast body steps on to the next grain, never over it', async () => {
  oneHauler();
  window.__levels({ haulCarryLevel: LADDER });
  const s0 = state();
  const spots = [];
  for (let x = s0.pitX - 1000; x < s0.pitX - 100; x += P * 7) spots.push(x);
  for (const x of spots) window.__pile(x, 1);
  run(1);                                    // and let them settle: a grain still rolling is not on the ground
  // The stride is widened only now: a body this fast sweeps a hand's worth
  // off the line during the settle itself, and the trip being watched is the
  // one that starts at the far end with nothing in hand.
  window.__tune('HAUL_BASE', 40);            // a stride many columns wide
  window.__place('hauler', spots[0]);
  run(0.1);
  const cap = state().haulCap;
  const r = firstToss();
  window.__tune('HAUL_BASE', 1.8);
  window.__crew(0, 0);
  const want = Math.min(cap, spots.length);
  return [
    ok(r.tossed, 'the load is tipped', `${r.took} grains`),
    ok(r.took === want, 'with every grain on the way home in it',
       `${r.took} of ${want} (${r.left} left, hands hold ${cap})`)
  ];
});

// A grain beside a laden body walking home is that body's, whoever claimed it.
//
// A claim is a target for empty hands, so six bodies do not converge on one
// shard. It was also honored by the sweep, and that put a grain the rock had
// just thrown down beside a laden body in the hands of an empty one at the far
// end of the yard: the body on the spot stepped over it and the other walked
// the length of the world for it. The body on the spot takes it; the claimant
// sees its column bare and picks again.
group('the body on the spot takes a grain another has set off for', async () => {
  window.__reset();
  window.__crew(0, 2);
  quickCrew();
  window.__clearFloor();
  run(0.2);
  const s0 = state();
  const far = s0.pitX - 1000, next = far + P * 8;
  window.__pile(far, 1);
  window.__pile(next, 1);
  run(1);
  // where the second grain actually came to rest -- a grain settles a column
  // or so from where it was dropped
  let c = -1;
  for (let k = Math.floor((next - s0.floorX) / P) - 3; k <= Math.floor((next - s0.floorX) / P) + 3; k++) if (at(floor, k, 0)) c = k;
  const [a, b] = yard.S.workers.filter(w => w.type === 'hauler');
  a.x = far; a.claim = -1; a.goal = 'seek';        // stood on its target
  b.x = s0.pitX - 100; b.claim = -1; b.goal = 'seek';   // at the lip end, empty, and it will claim `next`
  // Watched frame by frame: which body takes the second grain, and whether the
  // other one ever stood on a claim to a bare column.
  let byA = false, byB = false, bClaimed = false, stuck = 0;
  for (let i = 0; i < 20 * 60 && !(byA || byB); i++) {
    run(1 / 60);
    if (b.claim === c) bClaimed = true;
    if (b.claim === c && b.carry > 0) byB = true;
    if (a.carry >= 2) byA = true;
    if (b.claim >= 0 && !at(floor, b.claim, 0)) stuck++;
  }
  window.__crew(0, 0);
  return [
    ok(bClaimed, 'the far body sets off for the second grain'),
    ok(byA, 'but the body already beside it takes it on its way home'),
    ok(!byB, 'not the one that set off for it from the far end'),
    ok(stuck <= 1, 'and that one drops the claim the frame the column goes bare',
       `${stuck} frames on a bare claim`)
  ];
});

// ...but not out from under a claimant that is already there. Whoever is
// nearer keeps it: taken at the last stride, the claimant would stop on a bare
// column, pick again and turn, which reads as a body hesitating.
group('a claimant already at its column keeps it against a sweeper', async () => {
  window.__reset();
  window.__crew(0, 2);
  quickCrew();
  window.__clearFloor();
  // Past the opening drop. A fresh yard has its first rock in the air, and two
  // quick haulers let go the moment it lands took both grains below before this
  // check had placed anybody at them -- the dance that used to hold them
  // through the fall is gone (wave polish, 2026-09-14).
  runUntil(() => !(yard.S.rockFall > 0), 10);
  run(0.2);
  const s0 = state();
  const far = s0.pitX - 1000, next = far + P * 8;
  window.__pile(far, 1);
  window.__pile(next, 1);
  run(0.1);                                  // the grains come to rest; longer and a free hauler has them
  let c = -1;
  for (let k = Math.floor((next - s0.floorX) / P) - 3; k <= Math.floor((next - s0.floorX) / P) + 3; k++) if (at(floor, k, 0)) c = k;
  const [a, b] = yard.S.workers.filter(w => w.type === 'hauler');
  a.x = far; a.claim = -1; a.goal = 'seek';
  // stood on the second grain with a claim to it, and its scoop held off so
  // the sweeper gets its chance to walk over
  b.x = s0.floorX + c * P; b.claim = c; b.goal = 'seek'; b.next = Infinity;
  const r = firstToss();
  const kept = !!at(floor, c, 0) && b.claim === c;
  window.__crew(0, 0);
  return [
    ok(r.tossed && r.took === 1, 'the sweeper tips only the grain it went for',
       `${r.took} tipped`),
    ok(kept, 'and the claimant stood on the other still has it')
  ];
});

// A body sent to a heap works the heap. Its target is a column, and when that
// column is bare the next is the nearest on the same strip, until the hands
// are full or the strip is -- and only then the sweep home. Sent for one
// column it took that column and filled up from the rock's heap on the way
// back, which lies between the quarry's and the hole, and the quarry's heap
// -- the one it had been sent to because it was the fullest -- lost a column
// a trip and sat at full for a whole run.
group('a body sent to a heap fills its hands there before sweeping home', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 0);                        // the heaps first, the carter after
  quickCrew();
  window.__levels({ haulCarryLevel: 4 });
  window.__clearFloor();
  run(0.3);
  const q = state().piles.find(p => p.key === 'quarry');
  const r = state().piles.find(p => p.key === 'rock');
  // a full quarry heap, spread along its strip, and a modest rock heap
  for (let i = 0; i < 40 && !state().pileFull.quarry; i++) {
    window.__pile(q.from + P * 2 + (i % 12) * P, 8); run(1 / 60);
  }
  window.__pile(r.from + P * 4, 40);
  run(1);
  const q0 = state().pileCount.quarry, r0 = state().pileCount.rock;
  const cap = state().haulCap;
  window.__crew(0, 1);
  window.__place('hauler', state().pitX - 60);
  const t = firstToss(90);
  const q1 = state().pileCount.quarry, r1 = state().pileCount.rock;
  window.__crew(0, 0);
  return [
    ok(state().pileFull.quarry || q0 > 0, 'the quarry heap is the one over the line', `${q0}`),
    ok(t.tossed && t.took === cap, 'a full load is tipped', `${t.took} of ${cap}`),
    ok(q0 - q1 === cap, "all of it off the quarry's heap", `${q0 - q1} from the quarry`),
    ok(r0 - r1 === 0, "and none off the rock's on the way home", `${r0 - r1} from the rock`)
  ];
});
