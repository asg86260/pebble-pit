// Work and the lab: a body put on a job, the smoke, the birds, and research
// from shards to sign.
//
// 7 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { sleep, state, ok, canvas, board, panel, point, onScreen, hoverBench, hoverStation,
  run, runUntil, haveRock, put, asScreen } from './kit.js';

export const TESTS = [
  // One pool of bodies: you buy a worker, and where it works is a separate
  // question you can answer again at any time.
  ['a worker put on the rock works it', async () => {
    haveRock();
    // The first body is not bought -- it is the one left standing when the rock
    // came down, and a fresh game starts with it on the rock (see intro.js). An
    // earlier check will have cleared the yard, so it is put back by hand.
    window.__crew(1, 0);
    await hoverBench();
    const hired = state().crew > 0;
    // it starts on the rock, because that is what the opening left it doing
    const start = state();
    const off = await put('mine', 'less');
    const carrying = state();
    const moved = await put('mine', 'more');
    const before = state();
    run(14);                                  // long enough to walk to the rock and swing
    const after = state();
    return [
      ok(hired, 'the yard starts with a body, and it is not bought'),
      ok(start.crew === 1, 'it is on the payroll', `${start.crew}`),
      ok(start.miners === 1, 'and it is digging, which is why it is here',
         `${start.miners} mining`),
      ok(off && carrying.miners === 0 && carrying.haulers === 1,
         'the roster takes it off, and then it carries dust',
         `${carrying.miners} mining, ${carrying.haulers} carrying`),
      ok(moved, 'the rock has a roster under it to put it back on'),
      ok(after.miners === 1 && after.haulers === 0, 'now it is on the rock and not carrying',
         `${after.miners} mining, ${after.haulers} carrying`),
      ok(after.crew === 1, 'and it is the same body, not a second hire', `${after.crew}`),
      ok(after.rock < before.rock, 'rock is coming off', `${before.rock} -> ${after.rock}`)
    ];
  }],

  ['a worker can be taken off a job again', async () => {
    window.__crew(1, 0);                        // one body, on the rock
    await hoverBench();
    const on = state();
    const back = await put('mine', 'less');
    await sleep(200);
    const off = state();
    const tooMany = await put('mine', 'more') && await put('mine', 'more');
    const capped = state();
    window.__crew(0, 0);
    return [
      ok(on.miners === 1 && on.idle === 0, 'it starts on the rock', `${on.miners} mining`),
      ok(back, 'the roster lets it go'),
      ok(off.miners === 0 && off.haulers === 1, 'and it goes back to carrying dust',
         `${off.miners} mining, ${off.haulers} carrying`),
      ok(!tooMany, 'a body it does not have cannot be put anywhere'),
      ok(capped.miners + capped.haulers === capped.crew,
         'the crew always adds up', `${capped.miners}+${capped.haulers} of ${capped.crew}`)
    ];
  }],

  ['the lab smokes while it is being worked', async () => {
    window.__grant({ shards: 20, cores: 9, dust: 30000 });
    window.__lab(true);
    window.__crew(0, 2);
    run(1);
    const idle = state();

    // A *research* row by name. The lab's first row is its own ladder now --
    // better instruments -- and clicking whatever happens to be first started a
    // purchase instead of a piece of work.
    document.querySelector('#labshop button[data-key="labswing"]').click();
    await sleep(120);
    run(3);
    const paidButEmpty = state();

    // One body. The lab holds one to a bench and starts with one bench, so the
    // second `assign` was always a no-op -- and now that nothing staffs itself,
    // a group that relied on it getting somebody in anyway gets an empty lab.
    window.__assign('labbers', 1);
    runUntil(() => state().labbers === 1, 60);
    runUntil(() => state().commuting.length === 0, 90);   // they walk there now
    run(4);
    const worked = state();
    window.__crew(0, 0);
    window.__abandon();                          // do not leave it in flight
    return [
      ok(idle.smoke === 0, 'an idle lab does not smoke', `${idle.smoke}`),
      ok(paidButEmpty.smoke === 0, 'nor does one that is paid for and empty',
         `${paidButEmpty.smoke}`),
      ok(worked.smoke > 0, 'it smokes once somebody is in there on it',
         `${worked.smoke} puffs`),
      // One body. The lab is a room with a bench in it and research is one thing
      // being looked into at a time, so a second pair of hands has nothing to be
      // a second pair of hands on.
      ok(worked.crewDetail.filter(d => d.startsWith('l|in')).length === 1,
         'and it is inside it, not standing about in front',
         JSON.stringify(worked.crewDetail.filter(d => d[0] === 'l')))
    ];
  }],

  // The one thing in the sky you can touch. It is worth a few grains, and the
  // grains are not thrown anywhere: they drop from where the bird was and land
  // on whatever ground is under it.
  ['a bird can be startled, and drops a little dust', async () => {
    window.__crew(0, 0, 0, 0);                   // nobody to fetch it while we watch
    window.__clearFloor();
    run(1);
    const clear = state().floor;
    const bank = state().stored;
    // Look at the yard before calling them in. Birds are seeded across whatever
    // is on screen, and a check that had left the view at the hole got a flock
    // over the mouth of it -- whose dust falls in and is banked, which is the
    // hole working and not the bird.
    window.__look(state().rockLeftX - 700);
    run(0.2);
    window.__birds();
    const s = state();
    // One over ordinary ground. A bird startled over the mouth of the hole drops
    // its dust straight into it, which is banked rather than left lying -- that
    // is the hole working, not the bird failing, but it is not what this check
    // is about, and which bird is where is a fresh coin toss every run.
    // Clear of the hole, clear of the rock's bare apron and clear of the mouth of
    // the quarry -- the three strips the ground refuses, where a grain is banked
    // instead of left lying. That is those working, not the bird failing, but it
    // is not what this check is about.
    const clearOf = b => b.x < s.rockLeftX - 120 && b.x > s.pitX - s.pitW;
    const bird = s.sky.birdWorld.find(clearOf) || s.sky.birdWorld[0];
    const [x, y] = onScreen(bird.x, bird.y);
    point('pointerdown', x, y);
    point('pointerup', x, y, 0);
    const hit = state();
    run(3);                                      // long enough for them to come down
    const settled = state();

    return [
      ok(hit.sky.birds === s.sky.birds - 1, 'the one that was clicked is gone',
         `${s.sky.birds} -> ${hit.sky.birds}`),
      ok(hit.chips > 0, 'and it shook some dust loose', `${hit.chips} in the air`),
      ok(hit.chipShades.every(v => v > 0), 'every grain of it is a grain and not an empty cell',
         hit.chipShades.join(' ')),
      ok(settled.chips === 0 && settled.floor === clear + hit.chips,
         'all of which lands, and none of it is lost on the way',
         `${hit.chips} shaken, ${settled.floor - clear} down`),
      ok(hit.chipX.every(cx => Math.abs(cx - bird.x) <= 12),
         'and it falls from where the bird was rather than being thrown somewhere',
         `bird at ${bird.x}, grains at ${hit.chipX.join(' ')}`),
      ok(settled.stored === bank, 'and none of it is banked for free',
         `${bank} -> ${settled.stored}`)
    ];
  }],

  ['research is started with shards and finished with people', async () => {
    window.__abandon();                          // whatever ran before us
    window.__crew(0, 3);
    window.__lab(true);
    window.__grant({ shards: 60, spores: 60, dust: 30000 });
    run(1);

    const el = document.getElementById('lab');
    await hoverStation('lab');
    const opened = !el.hidden;
    const before = state();
    const swing = el.querySelector('button[data-key="labswing"]');
    const rows = el.querySelectorAll('button[data-key]').length;

    swing.click();                               // start it, do not buy it
    await sleep(120);
    const started = state();

    // Every spare pair of hands put on the rock, so there is nobody for the lab
    // to take. An empty lab is a yard with nobody free now, rather than a roster
    // you simply did not touch: the lab staffs itself the moment there is
    // research on and somebody going spare, so leaving the stepper alone is no
    // longer a way to keep it empty.
    // Nobody put in it. The lab does not staff itself -- you decide whether it is
    // running -- so an empty lab is simply one you have not filled.
    run(12);
    const empty = state();

    // And now somebody is put in, which is the only way anybody gets in.
    window.__assign('labbers', 1);
    runUntil(() => state().labbers === 1, 60);
    runUntil(() => state().commuting.length === 0, 90);   // they walk there now
    run(5);
    const part = state();
    run(70);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(opened, 'the lab board opens at the lab'),
      ok(rows >= 4, 'and offers what it can research', `${rows} rows`),
      ok(!!started.research, 'clicking one starts it rather than buying it',
         JSON.stringify(started.research)),
      ok(started.shards < before.shards, 'and it is paid for up front',
         `${before.shards} -> ${started.shards}`),
      ok(started.mult.swing === before.mult.swing,
         'the multiplier does not move on paying', `${started.mult.swing}`),
      // A lab standing EMPTY is lent a hand by the yard -- see `busyBuilderSites`
      // in works.js -- because a purchase nobody can ever start is money taken
      // for nothing said. So the piece moves, and what this asks is only that it
      // moves at the pace of the one borrowed body rather than at the pace of a
      // lab you have actually staffed: the difference between the two is what
      // putting somebody in buys, and it is measured below.
      ok(empty.research && empty.research.at < 0.5,
         'a lab nobody has been put in creeps along on a borrowed pair of hands',
         `${empty.research && empty.research.at}`),
      ok(part.labbers === 1 && part.research && part.research.at > 0.1,
         'somebody in it and it moves', `${part.research && part.research.at}`),
      ok(!after.research && after.mult.swing === before.mult.swing + 1,
         'and finishing it is what raises the multiplier',
         `${before.mult.swing} -> ${after.mult.swing}`),
      ok(after.mineMs < before.mineMs, 'which really is a faster swing',
         `${before.mineMs}ms -> ${after.mineMs}ms`)
    ];
  }],

  // The crew are inside the lab and the chimney goes out the moment they are
  // done, so the end of a piece of research is the one thing here you would
  // otherwise miss entirely. It leaves a mark standing over the lab, and the
  // mark comes down when the board it belongs to is read.
  ['a finished piece of research says so over the lab', async () => {
    const point_ = (x, y) => canvas().dispatchEvent(new PointerEvent('pointermove', {
      clientX: x, clientY: y, pointerId: 1, isPrimary: true, buttons: 0, bubbles: true }));
    const away = () => point_(4, 4);             // nobody standing at any station
    // at its sign, which is what standing at a station means
    const atLab = () => {
      const s = state(), g = s.stands.lab;
      if (!g) return;
      point_((g.x + g.w / 2 - s.camX) * s.zoom, (g.y + g.h / 2 - s.camY) * s.zoom);
    };

    window.__abandon();
    window.__crew(0, 3);
    window.__lab(true);
    window.__grant({ shards: 60, spores: 60, dust: 30000 });
    run(1);

    atLab();                                     // go and stand at it
    await sleep(220);

    const el = document.getElementById('lab');
    // Nobody is put on the lab by hand any more: it holds one body, has one
    // thing to do with it, and takes somebody the moment there is research on
    // and hands to spare. So the staffing here is a consequence of starting the
    // work rather than something done before it.
    el.querySelector('button[data-key="labswing"]').click();
    await sleep(140);
    const started = state();

    // Somebody put in it, which is the only way anybody gets in.
    window.__assign('labbers', 1);
    runUntil(() => state().labbers === 1, 60);
    const staffed = state();

    away();                                      // and walk off while they work
    await sleep(220);
    const finished = runUntil(() => !state().research, 120);
    const done = state();

    atLab();
    await sleep(220);
    const read = state();

    window.__crew(0, 0);
    window.__abandon();
    away();
    await sleep(160);
    return [
      ok(staffed.labbers === 1, 'a body can be put in the lab',
         `${staffed.labbers}`),
      ok(!!started.research && started.labDone === null,
         'and starting a piece leaves nothing to report yet',
         JSON.stringify(started.research)),
      ok(finished, 'two bodies see it through'),
      ok(!done.research && done.labDone === 'labswing',
         'a finished piece is remembered rather than just vanishing',
         `${done.labDone}`),
      ok(done.smoke > 0, 'and the chimney gives it one last plume', `${done.smoke}`),
      ok(read.labDone === null, 'reading the board is what takes the mark down',
         `${read.labDone}`)
    ];
  }],

  ['the lab board stays inside the window too', async () => {
    const checks = [];
    for (const [w, h, dpr, name] of [[390, 844, 3, 'portrait'], [844, 390, 3, 'landscape']]) {
      await asScreen(w, h, dpr, async () => {
        // the geometry is the one container's; the lab is a page inside it
        const el = panel();
        el.hidden = false;
        document.getElementById('lab').hidden = false;
        document.getElementById('board').hidden = true;
        window.__placeBoard();
        await sleep(60);
        // it is placed with a transform, so that is where its corner is
        // the transform carries how far the board's bottom edge stands above the
        // foot of the window, not where its top corner is -- see `place`
        const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(el.style.transform) || [0, 0, 0];
        const left = +m[1], bottom = -(+m[2]);
        const bw = el.offsetWidth, bh = el.offsetHeight;
        const room = bw <= w && bh <= h;
        checks.push(ok(left >= 0 && bottom >= 0 &&
                       (!room || (left + bw <= w + 1 && bottom + bh <= h + 1)),
          `${name} keeps the lab board inside the window`,
          `${Math.round(left)}+${bw} wide, ${Math.round(bottom)}+${bh} tall, in ${w}x${h}`));
      });
    }
    document.getElementById('lab').hidden = true;
    return checks;
  }],
];
