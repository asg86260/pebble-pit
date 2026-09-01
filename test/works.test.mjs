// Time as a price: what a purchase past the bench actually does.
//
// Everything past the bench is *built* rather than had -- see works.js and
// DESIGN.md, "Time is a price". Paying starts a work at a site, and what
// finishes it is worker-seconds: somebody standing at the place it is happening.
// So the two things worth checking are the two halves of that sentence -- the
// press does not hand you the thing, and an empty site never hands it to you at
// all -- and then the arithmetic on top: a gang is quicker than a pair of hands,
// a site does one thing at a time, and a build half done survives the tab being
// shut.
//
// Bought the way a player buys it throughout: through the row, with the coin
// taken and the yard run. A hook that set the level would prove nothing about
// the thing that changed.

import { group, ok, state, run, runUntil, openSites, buyBuilt } from './helpers.mjs';

// what the yard is building, site by site
const works = () => state().works || {};
const on = key => Object.values(works()).find(w => w.key === key) || null;

group('paying starts the work and does not finish it', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 0, 2, 2);                 // two in the cut, two on the row
  window.__grant({ shards: 900, spores: 900, dust: 90000 });
  run(2);

  const benches = state().benches;
  const stone = state().spores;
  const started = window.__buy('quarrybench');
  const just = state();
  const work = on('quarrybench');

  // and then the cut digs it
  const landed = runUntil(() => state().benches > benches, 180);

  return [
    ok(started, 'the row answers when it is pressed'),
    ok(just.benches === benches, 'and the bench is not in the wall yet',
       `${benches} -> ${just.benches}`),
    // The coin goes on the press. What you are waiting on is the labour, not the
    // bill -- a price you could still spend on something else while the thing it
    // bought was being made would be a price you had not paid.
    ok(just.spores < stone, 'the crop is taken on the press, not on the finish',
       `${stone} -> ${just.spores}`),
    ok(!!work && work.of > 0 && work.done < work.of,
       'and there is a work on the cut, part done',
       work ? `${work.done} of ${work.of}` : 'nothing'),
    ok(landed, 'and the gang in the cut finishes it'),
    ok(state().benches === benches + 1, 'and then the bench is in the wall',
       `${benches} -> ${state().benches}`)
  ];
});

// The whole of the mechanic, in one check: an empty station builds nothing,
// however long you leave it. This is the same sentence the lab has said since
// the day it opened and the same one the machines say about their tenders.
group('an empty site builds nothing, and a body starts it moving', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 3);                       // three spare, nobody in the cut
  window.__grant({ shards: 900, spores: 900, dust: 90000 });
  run(2);

  const benches = state().benches;
  window.__buy('quarrybench');
  run(40);
  const cold = on('quarrybench');
  const idle = state().benches;

  // and now somebody goes down there
  window.__assign('quarriers', 2);
  const landed = runUntil(() => state().benches > benches, 180);

  return [
    ok(!!cold && cold.done === 0, 'forty seconds of empty cut is no work done',
       cold ? `${cold.done} of ${cold.of}` : 'the work vanished'),
    ok(idle === benches, 'and no bench', `${benches} -> ${idle}`),
    ok(landed, 'somebody sent down there is what finishes it'),
    // The spare hands must not have quietly done it for them. The cut has a gang
    // of its own and the work is that gang's; the yard's builders are for the
    // school and the bench, which have nobody standing at them.
    ok(state().benches === benches + 1, 'and it is the one bench that was paid for',
       `${benches} -> ${state().benches}`)
  ];
});

// A gang is what a gang is for. `done` climbs one second a second for every pair
// of hands actually there, so five in the cut take a bench out in a fifth of the
// time -- and the clock on the row says so, because it is read at the rate the
// site is actually going rather than at some nominal one.
group('more hands is less waiting', async () => {
  const dig = hands => {
    window.__reset();
    openSites();
    window.__crew(0, 0, hands, 0);
    window.__grant({ shards: 900, spores: 900, dust: 90000 });
    run(2);
    const was = state().benches;
    window.__buy('quarrybench');
    const at = state().clock ?? 0;
    let ticks = 0;
    while (state().benches === was && ticks < 60 * 200) { run(1 / 60); ticks++; }
    return ticks / 60;
  };
  const alone = dig(1);
  const gang = dig(4);

  return [
    ok(alone > 0 && gang > 0, 'both of them got the bench out',
       `${alone.toFixed(1)}s alone, ${gang.toFixed(1)}s with four`),
    // Not "exactly a quarter": the walk down to the face is in both figures and
    // is the same length whoever is making it. What is claimed is the shape --
    // four pairs of hands is most of the way to four times quicker.
    ok(gang < alone / 2, 'and four hands took less than half as long',
       `${alone.toFixed(1)}s -> ${gang.toFixed(1)}s`)
  ];
});

// One work per site, which is what makes the waiting a decision: while the cut
// is going down a bench it is not doing anything else, and you had to pick.
group('a site builds one thing at a time', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 0, 2, 2);
  window.__grant({ shards: 900, spores: 900, dust: 90000 });
  run(2);

  const level = state().quarryPace ?? null;
  window.__buy('quarrybench');
  const second = window.__buy('quarrypace');
  const both = Object.values(works()).filter(w => w).length;
  const cut = on('quarrybench');
  const speed = on('quarrypace');

  // ...but the plots are a different place, and get on with their own
  const plot = window.__buy('farmplot');

  return [
    ok(!!cut, 'the cut takes the bench'),
    ok(!second && !speed, 'and will not start a second thing while it is on it',
       speed ? 'the speed row started as well' : 'it refused'),
    ok(plot && !!on('farmplot'), 'while the plots get on with their own'),
    ok(both === 1, 'one work on the cut, and one only', `${both}`)
  ];
});

// A build is paid for and part done, so shutting the tab on one must not lose
// the coin and the labour both -- the same argument the tower's hat makes. And
// it is worker-seconds rather than a deadline, which is what makes it safe to
// write down: `now()` starts wherever the page started.
group('a half-built thing survives the tab being shut', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 0, 2, 2);
  window.__grant({ shards: 900, spores: 900, dust: 90000 });
  run(2);

  const benches = state().benches;
  window.__buy('quarrybench');
  run(6);
  const before = on('quarrybench');
  window.__reload();
  const after = on('quarrybench');
  const landed = runUntil(() => state().benches > benches, 180);

  return [
    ok(!!before && before.done > 0, 'the cut got some of it done',
       before ? `${before.done} of ${before.of}` : 'nothing on the go'),
    ok(!!after, 'and the work is still on the go after a reload',
       after ? `${after.done} of ${after.of}` : 'it was lost'),
    ok(after && Math.abs(after.done - before.done) < 1.5 && after.of === before.of,
       'with what was done still done',
       after ? `${before.done} -> ${after.done}` : ''),
    ok(landed, 'and it finishes from where it was')
  ];
});

// The bench's own ladders are the opening of the game and stay instant: a game
// that begins by making you wait for the first row you ever read begins badly.
group('the bench own ladders are still had on the press', async () => {
  window.__reset();
  window.__crew(1, 1);
  window.__grant({ dust: 90000 });
  run(2);

  // the row's own price climbs a rung, which is the one thing the board reports
  const rung = () => window.__rows().find(r => r.key === 'carry')?.bill?.[0]?.[1] ?? 0;
  const was = rung();
  const bought = window.__buy('carry');
  const now = rung();

  return [
    ok(bought, 'strength can be bought'),
    ok(Object.values(works()).length === 0,
       'and nothing is being built for it', JSON.stringify(works())),
    ok(now > was, 'it is simply had', `${was} -> ${now}`)
  ];
});

// And the thing the whole feature is for: a bill that says how long as well as
// how much, in the words a length of time is said in.
group('the waiting is in the bill, under a clock', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 0, 2, 2);
  window.__grant({ shards: 900, spores: 900, dust: 90000 });
  run(2);

  const row = () => window.__rows().find(r => r.key === 'quarrybench');
  const before = row();
  const clock = before && before.bill.find(([c]) => c === 'time');
  window.__buy('quarrybench');
  const during = row();
  const left = during && during.bill.find(([c]) => c === 'time');

  return [
    ok(!!clock, 'a row past the bench is priced in time as well as coin',
       before ? JSON.stringify(before.bill) : 'no row'),
    ok(clock && clock[1] > 0, 'and the time is a real length of it',
       clock ? `${clock[1]}ms` : ''),
    // Read at the rate the site is actually going, so putting more bodies in the
    // cut is visible on the row rather than only in the outcome.
    ok(left && left[1] > 0 && left[1] <= clock[1],
       'and while it is building the clock is what is left of it',
       left && clock ? `${clock[1]}ms -> ${left[1]}ms` : '')
  ];
});
