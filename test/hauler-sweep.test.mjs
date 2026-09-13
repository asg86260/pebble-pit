// A carter's trip is a sweep home: out to the thing it went for, then back
// along the ground taking everything it walks over until its hands are full,
// and never turning round. Empty hands still decide where a trip starts --
// crew.test.mjs holds the find-first and fullest-heap checks for that -- and
// this file is about everything after.

import { group, ok, state, run, runUntil, quickCrew, P } from './helpers.mjs';
import { floor } from '../src/state.js';
import { spend } from '../src/pit.js';

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
