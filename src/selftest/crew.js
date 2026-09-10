// The crew at work: carried and shaken, the cut, the stops, the shovelling,
// the dance, and the headcount badge.
//
// 7 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { sleep, newRun, settle, state, buildShopFromTest, refreshShopFromTest, ok, shop,
  point, onScreen, hoverBench, hoverStation, run, runUntil } from './kit.js';

export const TESTS = [
  // A body let go of used to drop straight down however you were moving when you
  // let go -- the one thing in the yard that fell out of the air with no regard
  // for the hand that had hold of it. It is thrown now, off the same flick the
  // dust is thrown with, and waggling one about earns it a moment of not
  // knowing which way is up.
  ['a body is thrown rather than dropped, and shaking one makes it dizzy', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(2);

    // **The body actually in your hand, by name.**
    //
    // This used to click where `workerPos[0]` was standing and then read
    // `workerPos[0]` for the rest of the throw, on the assumption that the two
    // were the same body. They are not: `workerAt` lifts whichever body is under
    // the cursor, and two rockhands working one face routinely overlap -- so the
    // click picked one up and every reading afterwards was taken off a bystander
    // standing still nearby. Measured that way the throw carried 7 to 11 pixels
    // of somebody else's idle drift against a bar of eight, which is a coin toss
    // rather than a check, while the flick itself was leaving the hand at the cap
    // (`HURL_MAX`) the whole time.
    //
    // `lifted` is the snapshot's own answer to "who is in your hand", and the
    // name is looked up again on every reading rather than kept as an index,
    // because the order of the crew is not a promise anybody made.
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
    // Where it came to rest, not where it had walked to afterwards: a body picks
    // its job back up the moment it lands, so a fixed run() after the throw
    // measures the walk as well as the flight.
    const landed = who => {
      for (let i = 0; i < 240 && state().falling > 0; i++) run(1 / 60);
      return posOf(who);
    };

    // Thrown sideways from up in the air. Held at head height it has no time to
    // travel before it lands, which measures the drop rather than the throw --
    // so it goes up first, stands still long enough for the climb to go stale,
    // and is then flicked across.
    const a = grab();
    await sleep(20);
    for (let i = 1; i <= 5; i++) { point('pointermove', a.sx, a.sy - i * 40, 2); await sleep(16); }
    await sleep(180);                            // the climb is not the throw
    for (let i = 1; i <= 6; i++) { point('pointermove', a.sx + i * 20, a.sy - 200, 2); await sleep(16); }
    point('pointerup', a.sx + 140, a.sy - 200, 0);
    const thrown = posOf(a.who);
    const landedAt = landed(a.who);
    const carried = Math.abs(landedAt[0] - thrown[0]);

    // and dropped from a standstill: it goes where it was let go of
    run(3);
    const b = grab();
    await sleep(20);
    for (let i = 1; i <= 5; i++) { point('pointermove', b.sx, b.sy - i * 40, 2); await sleep(16); }
    await sleep(180);                            // stood still before letting go
    point('pointerup', b.sx, b.sy - 200, 0);
    const still = posOf(b.who);
    const stillLanded = landed(b.who);
    const dropped = Math.abs(stillLanded[0] - still[0]);

    // shaken about: it lands seeing stars
    run(3);
    const c = grab();
    await sleep(20);
    // Waggled PAST the threshold, derived from it: n moves alternating sides is
    // n-1 changes of direction, so the loop runs SHAKE_TURNS + 3 to clear the
    // bar with margin. Written as the number 8 it silently stopped being a
    // shaking the day the threshold moved to 8 -- seven turns, no stars.
    const waggles = (await import('../config.js')).SHAKE_TURNS + 3;
    for (let i = 0; i < waggles; i++) { point('pointermove', c.sx + (i % 2 ? 26 : -26), c.sy, 2); await sleep(30); }
    point('pointerup', c.sx, c.sy, 0);
    run(0.6);
    const dizzy = state();
    run(3);
    const over = state();

    window.__crew(0, 0);
    return [
      // Measured against each other rather than against a number. How far a
      // throw carries depends on how long the body is in the air, which depends
      // on where it was standing when it was picked up -- so what is actually
      // being claimed is that the flick does something the standstill does not.
      // Eight pixels, not fifteen: gravity is heavier than it was, so everything
      // thrown in this yard is in the air for less time and carries less far.
      // The claim is unchanged -- the flick does something the standstill does
      // not -- and the margin is what a shorter flight leaves of it.
      ok(a.who && b.who, 'a body was picked up to throw', `${a.who} then ${b.who}`),
      ok(carried > dropped + 8, 'a body flicked out of your hand travels while it falls',
         `${carried}px thrown against ${dropped}px let go of`),
      // Sixteen, not ten. A body let go of from a standstill still comes
      // straight down -- what it does *after* it lands is walk back to work, and
      // the crew walk half again as fast as they did, so the same sample taken
      // the same moment later catches it a few pixels further along. The claim
      // is about the fall, and the margin is what the walk adds to it.
      ok(dropped < 16, 'and one let go of from a standstill comes straight down',
         `${dropped}px across`),
      ok(dizzy.saying > 0, 'shaking one about leaves it seeing stars',
         `${dizzy.saying} saying something`),
      ok(over.saying === 0, 'and it comes round', `${over.saying} still at it`)
    ];
  }],

  // Every building used to cost cores, and a core is one whole rock -- so the
  // opening was four rocks of watching a number climb with nothing to do about
  // it but swing, and the rarest thing in the game went on doors. Dust buys the
  // yard now, and a core buys the one thing nothing else can.
  ['a core buys the tower and nothing else', async () => {
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
    buildShopFromTest();
    // The price cells are written by the board's own refresh, not by building the
    // rows, so they are empty until something fills them in.
    refreshShopFromTest();
    // The coins on a row, and only the coins. Every row past the bench carries a
    // clock in its bill as well now -- how long a thing takes is part of what it
    // costs, see works.js -- and what this group is about is which *coins* buy a
    // place.
    const coins = el => [...el.querySelectorAll('.cost i')].map(i => i.className)
                          .filter(c => c !== 'clock');
    const row = k => shop().querySelector(`[data-key="${k}"]`);
    const door = row('unlockfarm');           // the first one the yard offers
    const dustPrice = door && coins(door);

    // And *then* the ground standing, which is what the tower waits on: its row
    // is the end of the chain now -- what a finished yard buys -- so the plots,
    // the cut and the lab all have to be up before it is offered. Read in this
    // order because opening the plots is what takes their own door off the board.
    window.__crew(0, 0, 1, 1);
    window.__buildbench(true);
    window.__crew(0, 0);
    buildShopFromTest();
    refreshShopFromTest();

    // the tower takes a core and a thousand dust, and takes them together
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
      // A place is bought with a rock *and* with dust, which is what every bill
      // above the first tier looks like: the core says this is a place rather
      // than a rung, and the dust keeps the hill worth digging after it.
      //
      // This asserted dust alone for a while, when the two grounds were priced
      // in dust to keep them cheap and early. What that bought was two places
      // you could stumble into without noticing, on a currency already pouring
      // in, and a tier whose one job is buildings with two of its buildings
      // taken off it.
      ok(!!door && dustPrice.includes('core') && dustPrice.includes('dust'),
         'a place is bought with a rock and with dust', String(dustPrice)),
      ok(!!tower, 'and the tower is on the bench once a core exists'),
      // A core and dust, and nothing else. It used to ask for all four at once,
      // which was the only bill in the game that did and the one row you had to
      // study rather than read -- and it argued with the row's own note, which
      // says a core is what this is for.
      ok(marks && marks.join() === 'core,dust',
         'priced in a core and dust', String(marks)),
      ok(built.towerOpen, 'buying it puts it up'),
      ok(built.cores === cores0 - 1 && built.shards === 2000 && built.spores === 2000,
         'and takes the core, and leaves the rest of the yard alone',
         `${cores0}->${built.cores} cores, ${built.shards} shards, ${built.spores} spores`)
    ];
  }],

  // Shards used to trickle: a quarrier swung, and every so often one came off the
  // face, for ever, at a steady rate -- which makes blue a tap rather than a
  // find. A cut is full of dirt now. Somebody works down through it, and at the
  // bottom there is a seam: a handful all at once, thrown up over the rim, then
  // the climb out and the hole falls in behind them.
  ['a cut gives its stone up while it is being dug, then falls in', async () => {
    newRun();
    await settle();
    window.__crew(0, 0, 2);
    run(2);
    const fresh = state();

    // Down through the ground, and the stone turns up on the way rather than in
    // a heap at the bottom. This group used to watch for the opposite -- a whole
    // dig with nothing coming up, then a handful all at once -- which is the
    // model the cut had before the scatter. See `findShards` in quarry.js.
    const paid = runUntil(() => state().pileCount.quarry > 0, 180);
    const early = state();

    // The hole is worked right out, and the ground comes back in behind the last
    // one up the ladder.
    // Watched for the thing that lasts rather than the frame it happens on: being
    // *out* of the hole. A body on the ladder is on it for a second or two and
    // which frame you look on is luck, but a cut that has been worked out and
    // left is a cut with nobody in it, and that is what the ground coming back
    // actually waits on. A fixed fifteen-second window used to do this and no
    // longer reaches: a dig is a longer job than it was when the pay was a lump
    // at the bottom.
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

  // The yard makes its own work. A body stops now and then, says so, leaves the
  // same muck the sky rains down, and gets back to it -- so a bigger crew is
  // more hands and a bigger mess, and the shovelling has something to do that
  // did not come out of the weather.
  ['a body stops now and then, and somebody clears up after it', async () => {
    newRun();
    await settle();
    window.__crew(4, 0);                       // rockhands only: nobody to shovel it yet
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
    // Wound in for the check. A body is due about every ten minutes now, which
    // is right for playing and useless for watching one happen.
    window.__tune('LOO_EVERY', 6000);

    let said = 0, mucked = 0;
    for (let i = 0; i < 700 && (said < 2 || mucked < 2); i++) {
      run(0.25);
      const s = state();
      if (s.saying > 0) said++;
      if (s.smog.muck.yard > 0) mucked++;
    }
    const left = state().smog.muck.yard;

    // and now somebody whose job it actually is.
    //
    // A crew is no longer that. What the sky drops is everybody's, but what a
    // body leaves is a post -- so this needs the shed up and somebody put on it,
    // which is the whole of what the shed buys. See `capOf` and `poopCols`.
    window.__crew(1, 4);
    window.__loo(true);
    window.__air({ janitors: 2 });
    // and nothing new while we watch: the crew were going every six seconds for
    // the sake of the lines above, and a yard being messed while it is cleared
    // measures the race rather than the rule
    window.__tune('LOO_EVERY', 600000);
    // Gaining on it, rather than reaching nought. The crew are still going every
    // six seconds -- that is what this group turned the interval down for -- so
    // the yard is being messed up while it is being cleared, and two bodies with
    // shovels walking the length of it will never see it empty. What is being
    // checked is that somebody is now *on* it, which is the change.
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

  // A yard under muck is the one job the whole crew drops everything for, and it
  // has something to shovel wherever you stand -- so a gang that arrived
  // together each found work on the spot it arrived on, and the mess was cleared
  // by one lump you could not count the bodies in.
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
      // Three cells, which is what a body is. This file has no imports -- it
      // reads the yard through __state() and nothing else -- so the width is
      // written out rather than borrowed from config.
      ok(tightest >= 18, 'each has a body width of ground to work in',
         `closest pair ${tightest}px apart`),
      ok(again.every((x, i) => Math.abs(x - xs[i]) < 12),
         'and the line they make settles rather than shuffling about',
         `${xs.join(',')} then ${again.join(',')}`)
    ];
  }],

  // A rock in the air stops anybody who would have to walk under it, and that is
  // right. Standing dead still for the whole ten seconds of it is not: five
  // haulers that were walking in step all stop on the same pixel, and what you
  // see is one body twitching rather than a crew waiting for a rock to land.
  ['a rock in the air is danced through, not stood through', async () => {
    newRun();
    await settle();
    window.__crew(2, 5);
    window.__clearFloor();
    const p = state().piles.find(q => q.key === 'rock');
    for (let x = p.from + 8; x < p.to - 8; x += 8) window.__pile(x, 30);
    // On the second rock, not the first: the first rock's send-off is the
    // reunion now, and the reunion is not a party (wave7-sky, A2) -- nobody
    // dances through it. This group is about the ordinary celebration.
    window.__jump(2);
    // ...and settled on it: the jump moves the rock, so the gang re-post first
    // -- a body mid-commute ducks and walks through the fall, rightly, and
    // this group is about the ones standing when it starts.
    for (let i = 0; i < 1800 && state().commuting.length; i++) run(1 / 60);
    window.__next();                             // the rock is off; the next one comes
    // A frame at a time. `runUntil` moves a whole second at a go, and the fall
    // is over inside one -- so the coarse loop steps straight across it and
    // reports a yard that was never held up at all.
    let falling = false;
    for (let i = 0; i < 3600 && !falling; i++) { run(1 / 60); falling = state().rockFall > 0; }

    // Sampled right through the fall rather than off the front of it, on an odd
    // number of frames and not a round one: the jump is a sine on the beat, so
    // sampled every twenty frames it is read at the same point of it every time
    // and a body jumping steadily reads as a body standing still.
    // ...and only while it is in the air. The celebration comes BEFORE the
    // fall now -- the next rock waits for the crew to finish -- so the moment
    // it lands the gang walk back to work, and a window that runs past the
    // landing reads that walk-off as the dance wandering.
    const shots = [];
    // The last quarter second is the wind-down -- a body one beat from the
    // landing is allowed to step off toward its work -- so the window stops
    // short of it.
    for (let i = 0; i < 14 && state().rockFall > 250; i++) { run(7 / 60); shots.push(state()); }
    const hauls = s => s.workerPos.filter(d => d[0] === 'h');
    const xs = s => hauls(s).map(d => d.split(':')[1].split(',')[0]);
    const ys = s => hauls(s).map(d => d.split(':')[1].split(',')[1]);
    // How many different heights the gang are at within one frame. This is what
    // says a stack of bodies still reads as a gang: every body rolls its own
    // tempo (`jigRate`), so they are never all at the top of the beat together.
    const apart = shots.map(s => new Set(ys(s)).size);
    // and that not one of them slid off its own spot while it did it.
    // A body mid-walk is exempt: a walker finishes its walk before it joins
    // the dance now (wave7-sky, A2), so a hauler that set off on a fetch as
    // the rock cleared walks through the fall -- rightly. What must hold its
    // ground is everybody who was standing.
    const walkersAt = s => new Set(s.commuting.filter(d => d[0] === 'h')
                                              .map(d => d.split('|')[1].split('>')[0]));
    const still = shots.map(s => xs(s).filter(x => !walkersAt(s).has(x)));
    const held = new Set(still.flat()).size <= new Set(xs(shots[0])).size;
    const finite = shots.every(s => ys(s).every(y => Number.isFinite(+y)));
    const hopped = new Set(shots.flatMap(s => ys(s))).size > 1;
    const zone = shots[0].dropZone;
    const clear = !zone || shots.every(s => xs(s).every(x => +x + 18 <= zone[0] || +x >= zone[1]));

    // and it is put away again on the far side.
    //
    // Waited out to the end of the CELEBRATION, not just of the fall. The two
    // used to come to the same thing for these bodies -- a hauler with dust to
    // fetch went back to work the moment the rock was down -- and they no
    // longer do: the whole yard dances now, for as long as the yard is
    // celebrating, which outlasts the landing by the rest of the five seconds.
    // A body still dancing is not a body left standing in the air, which is
    // what this asks.
    for (let i = 0; i < 3600 && (state().dancing || state().rockFall > 0); i++) run(1 / 60);
    run(1);
    const after = state();
    window.__crew(0, 0);
    window.__clearFloor();
    return [
      ok(falling, 'a rock comes down to be held up by'),
      ok(finite, 'a body that has never been on the rock can still dance',
         ys(shots[0]).join(' ')),
      // This used to be "they do not all wait it out on the same pixel",
      // counting the different x's among them -- and that was the right question
      // while a celebration was three moves, two of which crossed the ground:
      // the gang were spread by walking, so a row of bodies on one x meant the
      // dance had degenerated into the standing about it replaced.
      //
      // A celebration is jumping now (item 21, feedback5) and a dancing body
      // covers no ground at all, so that count is nought or one whatever the
      // yard is doing -- and what it was reading was never the dance anyway.
      // These five haulers share a pixel BEFORE the rock comes off, because five
      // idle bodies share one post; the old dance walked them apart for five
      // seconds and they stacked up again the moment it ended.
      //
      // What survives is the thing the count was standing in for: a gang has to
      // read as several bodies rather than as one. It does that on the BEAT now
      // -- every body rolls its own tempo, so they are never all at the top of
      // the jump together, and a stack of five is five heights.
      ok(Math.max(...apart) > 1, 'they do not all wait it out on the same beat',
         apart.join('/')),
      ok(hopped, 'and they are jumping rather than standing', [...new Set(shots.flatMap(ys))].join(' ')),
      // ...and the other half of the same change, said outright: nobody shuffles.
      ok(held, 'none of them wanders off its own spot to do it',
         [...new Set(shots.map(s => xs(s).join(',')))].join(' | ')),
      ok(clear, 'without any of them wandering under the rock',
         `${xs(shots[0]).join(' ')} against ${JSON.stringify(zone)}`),
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
    // Enough dust that the plots are on offer, so that there is a heading with
    // nobody under it to look at: a section is only there while it has a row
    // under it.
    //
    // That heading used to be "the farm" -- the bench carried one per building it
    // could sell you. The ten of them are one group called "build" now, so the
    // section with nobody under it is that one. See DESIGN.md, "The bench is a
    // catch-all".
    window.__give(600);                      // the price of the plots
    window.__build();
    await sleep(50);
    const idle = [...shop().children].find(el => el.dataset.sect === 'build');
    const idleBadge = idle && idle.querySelector('.badge');
    // The rockhands' rows moved to their hut, and the hut's sheet has one group,
    // so there is no heading on it for the count to ride: it rides the board's
    // own title instead. Read standing at the hut, the way a player reads it.
    window.__shack();
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
