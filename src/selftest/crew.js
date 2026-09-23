// The crew at work: carried and shaken, the cut, the stops, the shovelling,
// the dance, and the headcount badge.

import { sleep, newRun, settle, state, buildShopFromTest, refreshShopFromTest, ok, shop,
  point, onScreen, hoverBench, hoverStation, hoverAway, run, runUntil } from './kit.js';
import { TOWER_CORES } from '../config.js';

export const TESTS = [
  ['a body is thrown rather than dropped, and shaking one makes it dizzy', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(2);

    // The body actually in your hand, by name. `workerAt` lifts whichever
    // body is under the cursor, and two rockhands on one face routinely
    // overlap, so reading `workerPos[0]` after the click measures a bystander.
    // `lifted` is the snapshot's own answer, and the name is looked up again
    // on every reading because the order of the crew is not a promise.
    const seat = name => state().crewNames.split(' ').findIndex(n => n.split('|')[0] === name);
    const posOf = name => {
      const i = seat(name);
      return i < 0 ? [NaN, NaN] : state().workerPos[i].split(':')[1].split(',').map(Number);
    };
    const grab = () => {
      const s = state();
      const [wx, wy] = s.workerPos[0].split(':')[1].split(',').map(Number);
      const [sx, sy] = onScreen(wx, wy);
      point('pointerdown', sx, sy, 2, 2);
      return { wx, sx, sy, who: state().lifted };
    };
    // Where it came to rest, not where it walked to afterward: a body picks
    // its job back up the moment it lands.
    const landed = who => {
      for (let i = 0; i < 240 && state().falling > 0; i++) run(1 / 60);
      return posOf(who);
    };

    // Thrown sideways from up in the air: held at head height it has no time
    // to travel before it lands, which measures the drop rather than the
    // throw. It goes up first, stands still long enough for the climb to go
    // stale, and is then flicked across.
    //
    // Each gesture is played on the game's clock and nothing else: a frame of
    // yard between two moves, and no await anywhere inside one, so no real
    // frame can land in the middle of it. The flick, the stale climb and the
    // shaking window are all read off `now()`, and a busy machine used to
    // stretch a real sleep into a stale throw or a lapsed shaking.
    const a = grab();
    run(1 / 60);
    for (let i = 1; i <= 5; i++) { point('pointermove', a.sx, a.sy - i * 40, 2); run(1 / 60); }
    run(11 / 60);                                // the climb is not the throw
    for (let i = 1; i <= 6; i++) { run(1 / 60); point('pointermove', a.sx + i * 20, a.sy - 200, 2); }
    point('pointerup', a.sx + 140, a.sy - 200, 0);
    const thrown = posOf(a.who);
    const landedAt = landed(a.who);
    const carried = Math.abs(landedAt[0] - thrown[0]);

    // and dropped from a standstill: it goes where it was let go of
    run(3);
    const b = grab();
    run(1 / 60);
    for (let i = 1; i <= 5; i++) { point('pointermove', b.sx, b.sy - i * 40, 2); run(1 / 60); }
    run(11 / 60);                                // stood still before letting go
    point('pointerup', b.sx, b.sy - 200, 0);
    const still = posOf(b.who);
    const stillLanded = landed(b.who);
    const dropped = Math.abs(stillLanded[0] - still[0]);

    // shaken about: it lands seeing stars
    run(3);
    const c = grab();
    run(1 / 60);
    // Derived from the threshold: n moves alternating sides is n-1 changes of
    // direction, so SHAKE_TURNS + 3 clears the bar with margin. Written as a
    // number it silently stops being a shaking the day the threshold moves.
    const waggles = (await import('../config.js')).SHAKE_TURNS + 3;
    for (let i = 0; i < waggles; i++) { point('pointermove', c.sx + (i % 2 ? 26 : -26), c.sy, 2); run(2 / 60); }
    point('pointerup', c.sx, c.sy, 0);
    run(0.6);
    const dizzy = state();
    run(3);
    const over = state();

    window.__crew(0, 0);
    return [
      // Measured against each other rather than against a number: how far a
      // throw carries depends on where the body was standing when picked up.
      // The claim is that the flick does something the standstill does not,
      // and the margin is what a short flight leaves of it.
      ok(a.who && b.who, 'a body was picked up to throw', `${a.who} then ${b.who}`),
      ok(carried > dropped + 8, 'a body flicked out of your hand travels while it falls',
         `${carried}px thrown against ${dropped}px let go of`),
      // The claim is about the fall; the margin is what the walk back to work
      // adds before the sample.
      ok(dropped < 16, 'and one let go of from a standstill comes straight down',
         `${dropped}px across`),
      ok(dizzy.saying > 0, 'shaking one about leaves it seeing stars',
         `${dizzy.saying} saying something`),
      ok(over.saying === 0, 'and it comes round', `${over.saying} still at it`)
    ];
  }],

  ['cores buy the tower and nothing else', async () => {
    newRun();
    await settle();
    // Four rocks of yard first: the first core is in the fifth.
    const early = [];
    for (let n = 1; n <= 4; n++) {
      window.__jump(n);
      window.__next();
      runUntil(() => state().rock > 0 && !state().rockFall, 30);
      early.push(state().coreItem ? 'core' : '-');
    }
    const beforeFive = state().cores;
    window.__jump(5);
    window.__next();
    const gotOne = runUntil(() => !!state().coreItem, 30);

    // and the yard is bought in dust
    newRun();
    await settle();
    window.__give(999999);
    window.__grant({ cores: 3, shards: 2000, spores: 2000 });
    window.__answered('props', 'net', 'arch');  // the shields that open every door below
    buildShopFromTest();
    // The price cells are written by the board's own refresh, not by building the
    // rows, so they are empty until something fills them in.
    refreshShopFromTest();
    // The coins on a row, and only the coins: every row past the bench carries
    // a clock in its bill as well (works.js), and this group is about which
    // *coins* buy a place.
    const coins = el => [...el.querySelectorAll('.cost i')].map(i => i.className)
                          .filter(c => c !== 'clock');
    const row = k => shop().querySelector(`[data-key="${k}"]`);
    const door = row('unlockfarm');           // the first one the yard offers
    const dustPrice = door && coins(door);

    // And *then* the ground standing: the tower's row is the end of the
    // chain, so the plots, the cut and the lab have to be up before it is
    // offered. Read in this order because opening the plots takes their own
    // door off the board.
    window.__crew(0, 0, 1, 1);
    window.__invest();
    window.__crew(0, 0);
    buildShopFromTest();
    refreshShopFromTest();

    // the tower takes its cores and its dust, and takes them together
    const cores0 = state().cores;
    const tower = row('unlocktower');
    const marks = tower && coins(tower);
    tower?.click();
    window.__finish();      // and the yard puts it up -- see works.js
    const built = state();

    window.__crew(0, 0);
    return [
      ok(early.every(k => k === '-'), 'the first four rocks give up nothing',
         early.join(',')),
      ok(gotOne, 'and the fifth has a core in it'),
      // The core says this is a place rather than a rung, and the dust keeps
      // the hill worth digging after it.
      ok(!!door && dustPrice.includes('core') && dustPrice.includes('dust'),
         'a place is bought with a rock and with dust', String(dustPrice)),
      ok(!!tower, 'and the tower is on the bench once a core exists'),
      // A set, not an order: bills are drawn in the yard's coin order, dust first.
      ok(marks && [...marks].sort().join() === 'core,dust',
         'priced in a core and dust', String(marks)),
      ok(built.towerOpen, 'buying it puts it up'),
      ok(built.cores === cores0 - TOWER_CORES && built.shards === 2000 && built.spores === 2000,
         'and takes its cores, and leaves the rest of the yard alone',
         `${cores0}->${built.cores} cores, ${built.shards} shards, ${built.spores} spores`)
    ];
  }],

  ['a cut gives its stone up while it is being dug, then falls in', async () => {
    newRun();
    await settle();
    window.__crew(0, 0, 2);
    run(2);
    const fresh = state();

    // The stone turns up on the way down rather than in a heap at the bottom
    // (`findShards` in quarry.js).
    const paid = runUntil(() => state().pileCount.quarry > 0, 180);
    const early = state();

    // Watched for the thing that lasts rather than the frame it happens on:
    // a body on the ladder is on it for a second or two and which frame you
    // look on is luck, but a cut worked out and left has nobody in it, and
    // that is what the ground coming back waits on.
    const emptied = runUntil(() => state().underground === 0, 240);
    const done = state();

    const again = runUntil(() => state().quarryDug < 0.5 && state().pileCount.quarry > 0, 120);
    const round2 = runUntil(() => state().pileCount.quarry > done.pileCount.quarry, 240);
    window.__crew(0, 0);
    return [
      ok(fresh.quarryDug < 0.4, 'a fresh quarry is full to the ground line',
         `${fresh.quarryDug}`),
      ok(paid, 'and stone comes up out of it'),
      ok(early.quarryDug < 1,
         'while the hole is still being dug, not only once it is empty',
         `${early.pileCount.quarry} up at ${early.quarryDug.toFixed(2)} down`),
      ok(done.seam >= 2, 'what a dig is worth is the depth of the quarry',
         `${done.seam} a dig`),
      ok(emptied, 'and they get out of it: the quarry is left empty behind them'),
      ok(again, 'the quarry falls in behind them', `${state().quarryDug} deep again`),
      ok(round2, 'and they dig it again')
    ];
  }],

  ['a body stops now and then, and somebody clears up after it', async () => {
    newRun();
    await settle();
    window.__crew(4, 0);                       // rockhands only: nobody to shovel it yet
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
    // Wound in for the check: a body is due about every ten minutes, which is
    // right for playing and useless for watching one happen.
    window.__tune('LOO_EVERY', 6000);

    let said = 0, mucked = 0;
    for (let i = 0; i < 700 && (said < 2 || mucked < 2); i++) {
      run(0.25);
      const s = state();
      if (s.saying > 0) said++;
      if (s.smog.muck.yard > 0) mucked++;
    }
    const left = state().smog.muck.yard;

    // What a body leaves is a post, not everybody's: this needs the shed up
    // and somebody put on it (`capOf`, `poopCols`).
    window.__crew(1, 4);
    window.__loo(true);
    window.__air({ janitors: 2 });
    // and nothing new while we watch: a yard being messed while it is cleared
    // measures the race rather than the rule
    window.__tune('LOO_EVERY', 600000);
    const cleared = runUntil(() => state().smog.muck.yard === 0, 150);
    const after = state().smog.muck.yard;
    window.__crew(0, 0);
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
    window.__tune('LOO_EVERY', 600000);        // and put it back
    return [
      ok(said > 0, 'a body says what it is about to do', `${said} frames saying it`),
      ok(mucked > 0, 'and leaves something behind', `${mucked} frames with muck in the yard`),
      ok(left > 0, 'which stays there while nobody is shovelling', `${Math.round(left)}`),
      ok(cleared, 'and somebody put on it clears it',
         `${Math.round(left)} -> ${Math.round(after)} left`)
    ];
  }],

  ['the crew spread out to shovel rather than clearing it as one lump', async () => {
    newRun();
    await settle();
    window.__crew(0, 6);
    window.__clearFloor();
    window.__air({ muck: 300 });
    run(3);
    const s = state();
    const xs = s.workerPos.filter(d => d[0] === 'h')
                          .map(d => +d.split(':')[1].split(',')[0])
                          .sort((a, b) => a - b);
    const onJob = s.crewDetail.filter(d => d[0] === 'h' && d.split('|')[1] === 'muck').length;
    // the closest any two of them stand
    let tightest = Infinity;
    for (let i = 1; i < xs.length; i++) tightest = Math.min(tightest, xs[i] - xs[i - 1]);

    // and it settles rather than jittering: two reads a moment apart agree
    run(0.5);
    const again = state().workerPos.filter(d => d[0] === 'h')
                                   .map(d => +d.split(':')[1].split(',')[0])
                                   .sort((a, b) => a - b);
    window.__crew(0, 0);
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
    return [
      ok(onJob >= 5, 'the crew drop what they are doing for a yard under muck',
         `${onJob} of 6 shovelling`),
      ok(new Set(xs).size === xs.length, 'and no two of them stand on the same spot',
         xs.join(',')),
      // Three cells, which is what a body is. This file reads the yard through
      // __state() and nothing else, so the width is written out rather than
      // borrowed from config.
      ok(tightest >= 18, 'each has a body width of ground to work in',
         `closest pair ${tightest}px apart`),
      ok(again.every((x, i) => Math.abs(x - xs[i]) < 12),
         'and the line they make settles rather than shuffling about',
         `${xs.join(',')} then ${again.join(',')}`)
    ];
  }],

  // No fall is a dance: the crew step clear of the footprint and stand where
  // they stepped to until the rock is down, then walk back to work.
  ['a rock in the air is stood clear of, and nobody is left under it', async () => {
    newRun();
    await settle();
    window.__crew(2, 5);
    window.__clearFloor();
    const p = state().piles.find(q => q.key === 'rock');
    for (let x = p.from + 8; x < p.to - 8; x += 8) window.__pile(x, 30);
    window.__jump(2);
    // The jump moves the rock, so the gang re-post first: a body mid-commute
    // ducks and walks through the fall, rightly, and this group is about the
    // ones standing when it starts.
    for (let i = 0; i < 1800 && state().commuting.length; i++) run(1 / 60);
    window.__next();                             // the rock is off; the next one comes
    // A frame at a time: the fall is over inside a second, and `runUntil`
    // steps straight across it.
    let falling = false;
    for (let i = 0; i < 3600 && !falling; i++) { run(1 / 60); falling = state().rockFall > 0; }
    // Only while it is in the air: the moment it lands the gang walk back to
    // work, and a window past the landing reads that walk-off as wandering.
    const shots = [];
    for (let i = 0; i < 14 && state().rockFall > 100; i++) { run(5 / 60); shots.push(state()); }
    const hauls = s => s.workerPos.filter(d => d[0] === 'h');
    const xs = s => hauls(s).map(d => d.split(':')[1].split(',')[0]);
    const ys = s => hauls(s).map(d => d.split(':')[1].split(',')[1]);
    // Nobody is asked to hold still: a body with ground to work on away from
    // the footprint carries on through the fall. What must be true of all of
    // them is where they are.
    const finite = shots.every(s => ys(s).every(y => Number.isFinite(+y)));
    const zone = shots[0].dropZone;
    const clear = !zone || shots.every(s => xs(s).every(x => +x + 18 <= zone[0] || +x >= zone[1]));
    // and on the ground: the rock that was under them is gone, and a body stood
    // where its top was is a body standing in the air.
    const ground = shots[0].groundY;
    const grounded = shots.every(s => ys(s).every(y => Math.abs(+y - ground) < 12 * 3));

    for (let i = 0; i < 3600 && state().rockFall > 0; i++) run(1 / 60);
    run(1);
    const after = state();
    window.__crew(0, 0);
    window.__clearFloor();
    return [
      ok(falling, 'a rock comes down to be held up by'),
      ok(finite, 'every body has a height', ys(shots[0]).join(' ')),
      ok(clear, 'and none of them is under the rock',
         `${xs(shots[0]).join(' ')} against ${JSON.stringify(zone)}`),
      ok(grounded, 'and they wait on the ground, not where the last rock was',
         [...new Set(shots.flatMap(ys))].join(' ')),
      ok(new Set(hauls(after).map(d => d.split(',')[1])).size === 1,
         'and once the rock is down they are all back on their feet',
         hauls(after).join(' '))
    ];
  }],

  ['the headcount rides on the section as a badge', async () => {
    newRun();
    await settle(0.5);
    await hoverBench();
    window.__crew(3, 2, 2, 0, 0);
    // Enough dust that the plots are on offer, so there is a heading with
    // nobody under it to look at: a section is only there while it has a row
    // under it, and the section with nobody is "build".
    window.__give(600);                      // the price of the plots
    window.__build();
    await sleep(50);
    const idle = [...shop().children].find(el => el.dataset.sect === 'build');
    const idleBadge = idle && idle.querySelector('.badge');
    // The hut's sheet has one group, so there is no heading for the count to
    // ride: it rides the board's own title. Read standing at the hut, the way
    // a player reads it.
    window.__shack();
    // Off the bench first: the bench's board stands over the hut, and a
    // cursor that lands on the board never reaches the hut.
    await hoverAway();
    await hoverStation('shack');
    const rock = document.querySelector('#shackboard .title');
    const rockBadge = rock && rock.querySelector('.badge');
    const s = state();
    window.__crew(0, 0);
    return [
      ok(!!rockBadge, 'a board about people carries their count as a badge'),
      ok(!!rockBadge && rockBadge.textContent === String(s.rockhands),
         'the badge is the bare number, no x and no word', rockBadge && rockBadge.textContent),
      ok(!!idle && !idleBadge, 'a section with nobody has no badge'),
      ok(!!rockBadge && rockBadge.parentElement === rock, 'the badge is a span inside the title'),
      ok(!!rockBadge && rock.firstChild.nodeValue === 'the shack',
         'the title keeps its own name as plain text', rockBadge && rock.firstChild.nodeValue),
      ok(!!rockBadge && getComputedStyle(rockBadge).backgroundColor === 'rgb(0, 0, 0)' &&
         getComputedStyle(rockBadge).opacity === '1',
         'the badge is solid black, not dimmed with the rest of the heading',
         rockBadge && `${getComputedStyle(rockBadge).backgroundColor} @ ${getComputedStyle(rockBadge).opacity}`)
    ];
  }],
];
