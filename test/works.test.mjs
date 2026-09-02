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
// The boards themselves, for the rule at the bottom of this file: a check about
// every row in the game has to be able to see every row in the game.
import { UPGRADES } from '../src/upgrades.js';
import { LAB_UPGRADES } from '../src/lab.js';
import { SCHOOL_UPGRADES } from '../src/school.js';
import { SCRUB_UPGRADES } from '../src/scrubhouse.js';
import { QUARRY_UPGRADES } from '../src/quarry.js';
import { FARM_UPGRADES } from '../src/farm.js';
import { TOWER_UPGRADES } from '../src/tower.js';
import { CASINO_UPGRADES } from '../src/casino.js';
import { crewRows } from '../src/crewboard.js';
import { SITE_JOB } from '../src/works.js';
import { WORK_BASE } from '../src/config.js';

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

  const miners0 = state().miners;
  window.__buy('carry');
  run(0.2);
  const lent = state();
  const landed = runUntil(() => Object.values(works()).length === 0, 90);
  run(1);
  const back = state();

  return [
    ok(lent.miners === miners0 - 1 && lent.builders === 1,
       'one miner comes off the rock to do it',
       `${miners0} -> ${lent.miners} miners, ${lent.builders} building`),
    ok(lent.lent.length === 1 && lent.lent[0] === 'miners',
       'and the rock is owed a body', JSON.stringify(lent.lent)),
    ok(landed, 'the rung is fitted'),
    ok(back.miners === miners0 && back.builders === 0 && back.lent.length === 0,
       'and the miner is back on the rock, the debt cleared',
       `${back.miners} miners, ${back.builders} building, owed ${JSON.stringify(back.lent)}`)
  ];
});

// ...but a site with a gang of its own is not lent to. An empty cut builds
// nothing, however many bodies are standing about elsewhere.
group('a station site is never lent a body', async () => {
  window.__reset();
  openSites();
  window.__crew(3, 0);                       // three on the rock, none in the cut
  window.__grant({ shards: 900, spores: 900, dust: 90000 });
  run(2);

  const miners0 = state().miners;
  window.__buy('quarrybench');
  run(20);
  const s = state();

  return [
    ok(s.miners === miners0 && s.lent.length === 0,
       'the rock keeps its gang', `${s.miners} miners, owed ${JSON.stringify(s.lent)}`),
    ok(s.works?.quarry && s.works.quarry.done === 0,
       'and the cut has done nothing', JSON.stringify(s.works?.quarry))
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

// --- and the rule itself ------------------------------------------------------
// Nothing above this line stops a *new* row being written without a `kind`, and
// that is exactly how nine of them got through: the tune rows, the rift's two,
// the lab's own pair, the spells, the balloon and the block of houses were all
// added without anybody having to think about the yard, and every one of them
// was bought and had in the same frame. A rule the game means is a rule
// something checks, so this walks every board in the game and asks it of each
// row, rather than of the ones somebody remembered.
group('every priced row on every board is built', async () => {
  // The two exceptions, and why each is one.
  //
  // The lab's research has been paid for in worker-seconds since the day the lab
  // opened -- somebody standing at a bench, an empty lab making no progress --
  // which is the same price this feature charges, collected by lab.js instead.
  // Making a work of it as well would be charging it twice.
  //
  // The tower's hat is the other clock the game already had: it brews for
  // WIZ_BREW_MS, said in its own bill under the same symbol, one at a time and
  // the row counting down what is left. Same argument.
  const OWN_CLOCK = ['labswing', 'labhaul', 'labcave', 'labtend', 'labair', 'wizard'];

  const boards = [
    ['the bench', UPGRADES], ['the lab', LAB_UPGRADES], ['the school', SCHOOL_UPGRADES],
    ['the scrubbing house', SCRUB_UPGRADES], ['the quarry', QUARRY_UPGRADES],
    ['the plots', FARM_UPGRADES], ['the tower', TOWER_UPGRADES],
    ['the casino', CASINO_UPGRADES], ['the houses', crewRows()]
  ];

  const checks = [];
  for (const [where, rows] of boards) for (const u of rows) {
    // A row that is not a purchase is not a build: a job dial, a readout, a door
    // through to a list, a bet the casino settles where you stand.
    if (u.job || u.dial || u.read || u.price) continue;
    if (!(u.bill || u.cost)) continue;
    if (OWN_CLOCK.includes(u.key)) continue;
    checks.push(ok(!!u.kind && u.kind in WORK_BASE,
                   `${where}: ${u.key} says what kind of thing it is`,
                   `kind ${JSON.stringify(u.kind)}`));
    checks.push(ok(!!u.site && u.site in SITE_JOB,
                   `${where}: ${u.key} says where it is built`,
                   `site ${JSON.stringify(u.site)}`));
  }
  return checks;
});

// And what a `site` with a gang of its own actually buys, on one of the rows
// that has just been given one. The lab is worked by labbers and by nobody
// else: the yard does not lend it a body the way it lends the bench one, so an
// empty lab is a purchase standing there paid for and unbuilt.
group('the lab fits its own instruments, or nobody does', async () => {
  window.__reset();
  openSites();
  window.__lab(true);
  window.__grant({ shards: 900, spores: 900, cores: 9, dust: 90000 });
  window.__crew(0, 3);                       // three spare hands, the lab empty
  run(2);

  const kit0 = state().labKitLevel;
  window.__buy('labkit');
  run(30);
  const cold = state();

  // and now somebody goes and stands in there
  window.__crew(0, 0, 0, 0, 1);
  const landed = runUntil(() => state().labKitLevel > kit0, 120);

  window.__crew(0, 0);
  return [
    ok(!!cold.works?.lab, 'the press starts a work in the lab',
       JSON.stringify(cold.works)),
    ok(cold.works?.lab && cold.works.lab.done === 0,
       'and thirty seconds of empty lab fits nothing',
       cold.works?.lab ? `${cold.works.lab.done} of ${cold.works.lab.of}` : 'gone'),
    ok(cold.labKitLevel === kit0, 'and the instruments are no better',
       `${kit0} -> ${cold.labKitLevel}`),
    ok(!cold.lent?.length, 'and no spare hand is lent to a station',
       JSON.stringify(cold.lent)),
    ok(landed, 'a labber in the room is what fits them',
       `${kit0} -> ${state().labKitLevel}`)
  ];
});
