// What the scrubbing house makes on the way to a clean sky: filters out the
// back, a heap that clogs when there is no room, and a recycler under its chute.

import { group, ok, state, run, runUntil, P } from './helpers.mjs';

group('the scrubbing house empties its filters out the back, until the recycler', async () => {
  const run1 = () => {
    window.__reset();
    window.__crew(0, 0);
    window.__clearFloor();
    // under the rain line, or the weather makes the muck instead of the house
    window.__air({ haze: 300, open: true, scrubbers: 1, muck: 0 });
    // long enough for one body to walk out there and fill a filter: the house
    // holds one now, so the catch that used to take ten seconds takes twenty.
    run(20);
    return state();
  };
  const plain = run1();

  window.__reset();
  window.__crew(0, 0);
  window.__clearFloor();
  window.__air({ haze: 300, open: true, scrubbers: 1, recycler: true, muck: 0 });
  run(20);
  const fitted = state();

  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  window.__clearFloor();
  return [
    ok(plain.smog.haze < 300, 'the house pulls the sky down either way',
       `300 -> ${Math.round(plain.smog.haze)}`),
    ok(plain.smog.rains === 0 && fitted.smog.rains === 0,
       'and no rain muddied the reading', `${plain.smog.rains}/${fitted.smog.rains} rains`),
    ok(plain.smog.muck.yard > 0, 'and leaves what it caught out the back as muck',
       `${Math.round(plain.smog.muck.yard)} to shovel`),
    ok(plain.floor === 0, 'with nothing worth carrying in it', `${plain.floor} grains`),
    ok(fitted.smog.muck.yard === 0, 'the recycler is what stops the mess',
       `${Math.round(fitted.smog.muck.yard)} to shovel`),
    ok(fitted.smog.recycled > 0 && fitted.floor > 0,
       'and turns the same catch into dust worth fetching',
       `${fitted.smog.recycled} recycled, ${fitted.floor} on the ground`)
  ];
});

// A station that makes something has somewhere to put it and stops when that
// place is full. The house was the one exception: it poured for as long as there
// was a body inside it, dust out of the spout with the recycler on and muck out
// of the back without it, and the yard could do nothing about either.
//
// What that looked like was dust everywhere. Bare ground takes a scatter and no
// more, so every grain past the scatter went looking for a column with room and
// ended up somewhere down the walk -- a spout that sprayed the yard instead of
// making a heap under itself.
group('the house heaps what it makes, and clogs when there is no room', async () => {
  window.__crew(0, 0);
  window.__clearFloor();
  window.__tune('PILE_LIMIT.scrub', 40);      // a small strip, so this is seconds
  window.__air({ haze: 0, muck: 0, open: true, scrubbers: 2, recycler: true });
  window.__air({ haze: 3000 });
  run(20);
  const on = state();

  // it keeps going until its own strip is full, and then it stops
  //
  // Held topped up, which it did not have to be before: the rain is a curve now
  // and a sky at three thousand comes down every couple of minutes, so a check
  // that wound the sky once and then waited was watching a house with nothing
  // left overhead to pull on. Nothing here fouls -- the crew is empty -- so a
  // shower is the end of the sky unless it is put back.
  //
  // The muck is swept with it, and that is not tidiness. `clogged` counts every
  // grain of muck lying near the house, and the rain drops muck all over the
  // yard -- so a sky held at three thousand rains on the house's own doorstep
  // and stops it, and the check came out watching a house shut down by the
  // weather rather than by its own heap. Which is a real thing about the game
  // and is written up in TODO; it is not what this group is asking about.
  let filled = false;
  for (let i = 0; i < 200 && !filled; i++) {
    window.__air({ haze: 3000, muck: 0 });
    run(2);
    filled = state().pileFull.scrub;
  }
  const stuck = state();
  window.__air({ haze: 3000, muck: 0 });      // plenty overhead, and no rain muck on the step
  const was = state().smog.recycled;
  run(20);
  const held = state();

  // and clearing the heap puts it back to work
  window.__clearFloor();
  window.__air({ haze: 3000, muck: 0 });      // topped up and swept, for the same reasons
  run(8);
  const freed = state();

  window.__air({ haze: 0, muck: 0, open: false, scrubbers: 0 });
  window.__tune('PILE_LIMIT.scrub', 140);
  window.__clearFloor();
  return [
    ok(on.pileCount.scrub > 0, 'what the spout makes lands on its own strip',
       `${on.pileCount.scrub} grains under the chute`),
    ok(filled, 'which fills up', `${stuck.pileCount.scrub} grains`),
    // Asked of what the house has *handed back*, not of the haze overhead.
    //
    // It used to watch the level hold still, and that stopped being a fact about
    // the house the moment the rain became a curve: a sky at three thousand is a
    // shower every half a minute or so now, so twenty seconds of a clogged house
    // reads as three thousand of haze going to nought -- and the check failed on
    // the weather doing exactly what it is supposed to. What the house does is
    // the number of grains out of its chute, and a clogged one makes none of
    // them whatever the sky does.
    ok(held.smog.recycled === was,
       'and a full one stops the house rather than pouring on',
       `${was} grains out of the chute, then ${held.smog.recycled}`),
    ok(!freed.pileFull.scrub && freed.smog.recycled > held.smog.recycled,
       'and carrying it away starts it again',
       `${held.smog.recycled} -> ${freed.smog.recycled} grains`)
  ];
});

group('the recycler pays out on the ground under its own chute', async () => {
    run(0.4);
  window.__crew(0, 3);                 // two go in the house, one is left to fetch
  run(3);
  window.__clearFloor();
  window.__air({ open: true, scrubbers: 2, recycler: true, haze: 400 });
  // held topped up: the house empties a sky of 400 faster than a body crosses
  // the yard to it, and a house that runs dry mid-check is a check about the
  // walk rather than about the chute
  for (let i = 0; i < 40 && !(state().smog.scrubbing > 0); i++) {
    window.__air({ haze: 400 });
    run(1);
  }
  window.__clearFloor();               // from here, the floor is the chute's doing
  for (let i = 0; i < 15; i++) { window.__air({ haze: 400 }); run(1); }
  const paid = state();
  const span = window.__dustSpan();
  window.__air({ haze: 0 });
  // Until some of it has been carried in, which is the whole of what is being
  // watched. The walk to the hole and back is a long one, and how long it is
  // has checks of its own.
  runUntil(() => state().stored > 0, 200);
  const swept = state();
  window.__crew(0, 0);
  window.__air({ open: false, recycler: false, scrubbers: 0, haze: 0, muck: 0 });
  window.__clearFloor();
  return [
    ok(paid.smog.recycled > 0 && paid.floor > 0,
       'the chute gives whole grains back',
       `${paid.smog.recycled} recycled, ${paid.floor} on the floor`),
    ok(span.lo !== null && span.lo >= paid.scrubX - P * 12 &&
       span.hi <= paid.scrubX + P * 24,
       'and they come to rest on the ground beside the house, not in a heap that is not its own',
       `lying ${span.lo}..${span.hi}, house at ${paid.scrubX}`),
    ok(swept.stored > 0,
       'where the crew fetch them in like anything else lying about',
       `${swept.stored} banked`)
  ];
});
