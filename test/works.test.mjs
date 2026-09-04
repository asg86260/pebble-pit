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
  // Nobody at all. The yard lends a hand to a station standing empty -- see
  // "a station standing empty is lent a body" below -- so an empty CUT is no
  // longer an empty site; a yard with no bodies in it is. What this group is
  // about is unchanged and is the whole mechanic: worker-seconds are somebody's
  // seconds, and a site nobody is standing at does not build itself.
  window.__crew(0, 0);
  window.__grant({ shards: 900, spores: 900, dust: 90000 });
  run(2);

  const benches = state().benches;
  window.__buy('quarrybench');
  run(40);
  const cold = on('quarrybench');
  const idle = state().benches;

  // and now there is somebody to do it
  window.__crew(0, 2);
  const landed = runUntil(() => state().benches > benches, 180);

  return [
    ok(!!cold && cold.done === 0, 'forty seconds of an empty yard is no work done',
       cold ? `${cold.done} of ${cold.of}` : 'the work vanished'),
    ok(idle === benches, 'and no bench', `${benches} -> ${idle}`),
    ok(landed, 'hiring somebody is what finishes it'),
    ok(state().benches === benches + 1, 'and it is the one bench that was paid for',
       `${benches} -> ${state().benches}`)
  ];
});

// Reversed on purpose: one pair of hands to a piece of work, whoever owns the
// site. See "The building site" in DESIGN.md.
//
// `done` used to climb a second a second for EVERY pair of hands standing
// there, so a cut with five quarriers in it took its next bench out five times
// as fast and the tower went up at the speed of however many wizards happened
// to be inside. The same row therefore cost a wildly different amount of time
// depending on which board it sat on and how the yard was staffed that minute,
// which is not a difficulty curve -- it is an accident. `BUILD_GANG` had
// already said one-body-to-a-build for the yard and the bench; this is the
// same rule reaching the four sites that have a gang of their own.
//
// What the gang is still for is the station's actual output: the other four
// quarriers go on quarrying while the one puts the bench in. They just do not
// stack up on the one job.
group('a bench takes the same time however many are in the cut', async () => {
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
    // The walk down to the face is in both figures and is the same length
    // whoever makes it, so this is "about the same" rather than "identical" --
    // but four hands must not buy anything like the fourfold it used to.
    ok(Math.abs(gang - alone) < Math.max(2, alone * 0.25),
       'four hands take about as long as one, not a quarter as long',
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

// The bench's own ladders are built too, at the bench, by whoever is spare:
// the one body the story hands you is carrying, so the first purchase in the
// game is somebody walking over and fitting it. See "The bench takes time too".
group('a bench rung is fitted at the bench by a spare body', async () => {
  window.__reset();
  window.__crew(0, 1);                       // one body, carrying
  window.__grant({ dust: 90000 });
  run(2);

  const price = () => window.__rows().find(r => r.key === 'carry')?.bill?.[0]?.[1] ?? 0;
  const was = price();
  const started = window.__buy('carry');
  const work = on('carry');
  const walked = runUntil(() => state().works?.bench?.hands > 0, 60);
  const atX = state().crewDetail?.length ? state().builders : 0;
  const landed = runUntil(() => price() > was, 60);

  return [
    ok(started, 'strength can be bought'),
    ok(!!work && work.done === 0, 'and it is a work on the bench, not yet had',
       JSON.stringify(work)),
    ok(walked, 'the spare body walks to the bench and stands there'),
    ok(landed, 'and fits it'),
    ok(Object.values(works()).length === 0, 'and then goes back to carrying',
       JSON.stringify(works()))
  ];
});

// Nobody spare: the nearest body is lent. It comes off its station's count,
// does the work, and is given back -- one body, never a gang, and never at a
// site that has a gang of its own.
group('with nobody spare, the nearest body is lent and given back', async () => {
  window.__reset();
  window.__crew(3, 0);                       // three on the rock, nobody carrying
  window.__grant({ dust: 90000 });
  run(2);

  const rockhands0 = state().rockhands;
  window.__buy('carry');
  run(0.2);
  const lent = state();
  const landed = runUntil(() => Object.values(works()).length === 0, 90);
  run(1);
  const back = state();

  return [
    ok(lent.rockhands === rockhands0 - 1 && lent.builders === 1,
       'one rockhand comes off the rock to do it',
       `${rockhands0} -> ${lent.rockhands} rockhands, ${lent.builders} building`),
    ok(lent.lent.length === 1 && lent.lent[0] === 'rockhands',
       'and the rock is owed a body', JSON.stringify(lent.lent)),
    ok(landed, 'the rung is fitted'),
    ok(back.rockhands === rockhands0 && back.builders === 0 && back.lent.length === 0,
       'and the rockhand is back on the rock, the debt cleared',
       `${back.rockhands} rockhands, ${back.builders} building, owed ${JSON.stringify(back.lent)}`)
  ];
});

// ...but a site with a gang of its own is not lent to. A cut with quarriers in
// it digs its own bench, however long they take about it, and the yard does not
// quietly cover for a gang that is merely busy elsewhere.
group('a station with a gang of its own is never lent a body', async () => {
  window.__reset();
  openSites();
  window.__crew(3, 0, 2);                    // three on the rock, two in the cut
  window.__grant({ shards: 900, spores: 900, dust: 90000 });
  run(2);

  const rockhands0 = state().rockhands;
  window.__buy('quarrybench');
  run(20);
  const s = state();

  return [
    ok(s.rockhands === rockhands0 && s.lent.length === 0,
       'the rock keeps its gang', `${s.rockhands} rockhands, owed ${JSON.stringify(s.lent)}`),
    ok(!s.works?.quarry || s.works.quarry.done > 0,
       'and the cut digs its own bench', JSON.stringify(s.works?.quarry))
  ];
});

// A station standing EMPTY is the other case, and it is not the same one. There
// is no gang to do it and there never will be until you put somebody there, so
// a purchase left to that rule takes your spores and sits for the rest of the
// run with nothing to show and nothing said. The nearest body goes instead --
// off the rock if that is who is nearest -- exactly as it does for a building.
group('a station standing empty is lent a body', async () => {
  window.__reset();
  openSites();
  window.__crew(3, 0);                       // three on the rock, NOBODY in the cut
  window.__grant({ shards: 900, spores: 900, dust: 90000 });
  run(2);

  const rockhands0 = state().rockhands;
  window.__buy('quarrybench');
  run(6);
  const going = state();
  const done = runUntil(() => !state().works?.quarry, 60);
  const back = state();

  return [
    ok(going.lent.length === 1 && going.rockhands === rockhands0 - 1,
       'somebody is taken off the rock for it',
       `${going.rockhands} rockhands, owed ${JSON.stringify(going.lent)}`),
    ok((going.works?.quarry?.done || 0) > 0, 'and the bench is actually being dug',
       JSON.stringify(going.works?.quarry)),
    ok(done, 'it finishes'),
    ok(back.rockhands === rockhands0 && back.lent.length === 0,
       'and the rock has its body back', `${back.rockhands} rockhands`)
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

// And the board says so afterwards.
//
// A work is the one change in this game that nobody's finger causes: you press
// the row, and the thing it sells arrives seconds later while you are looking at
// something else. Every board was rebuilt by whoever changed it -- and there is
// no whoever here, so the row that had just been built stayed on the bench at
// its old price, pressable, and the row it unlocked was not drawn at all.
//
// Read off the board itself rather than off the row list: what the list says is
// exactly what was right all along. The question is what is on the sheet.
group('a row that lands rebuilds the board it is on', async () => {
  window.__reset();
  const { showPanel, hud } = await import('../src/board.js');
  window.__crew(4, 0);
  window.__grant({ shards: 900, spores: 900, cores: 9 });
  window.__tip(200000);

  const shopEl = document.getElementById('shop');
  const drawn = () => shopEl.children.filter(c => c.dataset.key).map(c => c.dataset.key);
  showPanel('bench', true);                  // walked up to the bench
  hud();

  const before = drawn();
  const bought = window.__buy('unlockfarm');
  const landed = runUntil(() => !on('unlockfarm'), 180);
  hud();                                     // one frame with the board open
  const after = drawn();

  return [
    ok(before.includes('unlockfarm'), 'the row is on the bench to start with',
       before.join(',')),
    ok(bought && landed, 'it is paid for and the yard builds it',
       `farm open: ${state().farmOpen}`),
    ok(!after.includes('unlockfarm'),
       'and once it is standing the row is off the board', after.join(',')),
    // The other half of it: what the finished row unlocked is drawn without
    // anybody pressing anything, which is the case no amount of remembering to
    // call the builder on a press would ever have covered.
    ok(after.includes('unlockquarry'),
       'and what it opened up is drawn in its place', after.join(','))
  ];
});

// What a build borrows, it gives back once -- and only if there is a body to
// give.
//
// A loan used to be a job name pushed on to `S.lent` and paid back off that
// list, with nothing tying either end of it to the body it was about. So a
// player who moved somebody on to the same job while the loan was out got the
// count handed back on top of the move: a crew of three, one build, and a rock
// with four rock hands on it afterwards. The roster said four for the rest of the
// run and there was never a fourth body.
group('a loan is a body, and the roster ends where the player put it', async () => {
  const start = () => {
    window.__reset();
    window.__crew(3, 0);                     // everybody on the rock, nobody spare
    window.__grant({ shards: 900, spores: 900, cores: 9 });
    window.__tip(200000);
    run(2);
  };
  const land = () => runUntil(() => !on('unlockschool'), 180);

  start();
  window.__buy('unlockschool');
  run(4);
  const lent = state();
  window.__assign('rockhands', 1);               // ...and the player fills the gap
  const landedUp = land();
  run(2);
  const up = state();

  start();
  window.__buy('unlockschool');
  run(4);
  window.__assign('rockhands', -1);              // ...or takes another one off
  const landedDown = land();
  run(2);
  const down = state();

  return [
    ok(lent.lent.length === 1 && lent.rockhands === 2,
       'a body is borrowed off the rock for the build',
       `${lent.rockhands} rockhands, owed ${JSON.stringify(lent.lent)}`),
    ok(landedUp && landedDown, 'both builds finish'),
    ok(up.rockhands === 3, 'the rock ends with the three the player asked for',
       `${up.rockhands} rockhands out of a crew of ${up.crew}`),
    ok(up.rockhands <= up.crew, 'and never with more rockhands than there are people',
       `${up.rockhands} of ${up.crew}`),
    ok(down.rockhands === 1, 'and taking one off means one off, not one off and back',
       `${down.rockhands} rockhands`),
    ok(up.lent.length === 0 && down.lent.length === 0,
       'with nothing left owed either way',
       `${JSON.stringify(up.lent)} / ${JSON.stringify(down.lent)}`)
  ];
});

// And the debt survives the tab being shut, because it is written on the body.
//
// It used to be written in two places -- the list, which was saved, and a flag
// on the worker, which was not -- so a yard reloaded mid-build came back owing
// something no worker in it was carrying. The two could only drift.
group('a loan comes back with the body that owes it', async () => {
  window.__reset();
  window.__crew(3, 0);
  window.__grant({ shards: 900, spores: 900, cores: 9 });
  window.__tip(200000);
  run(2);

  window.__buy('unlockschool');
  run(4);
  window.__reload();
  const back = state();
  window.__assign('rockhands', 1);
  const landed = runUntil(() => !on('unlockschool'), 180);
  run(2);
  const after = state();

  return [
    ok(back.lent.length === 1 && back.rockhands === 2,
       'the yard comes back still owing the rock a body',
       `${back.rockhands} rockhands, owed ${JSON.stringify(back.lent)}`),
    ok(landed, 'and the school still goes up'),
    ok(after.rockhands === 3 && after.rockhands <= after.crew,
       'and the rock ends with the crew it was set to, not one more',
       `${after.rockhands} rockhands out of ${after.crew}`)
  ];
});
