// The crew at work: carried and shaken, the cut, the stops, the shovelling,
// the dance, and the headcount badge.

import { sleep, newRun, settle, state, buildShopFromTest, refreshShopFromTest, ok, shop,
  point, onScreen, hoverBench, hoverStation, hoverAway, run, runUntil, canvas, put } from './kit.js';
import { P, WORKER, SEAT_PIP, GARAGE_W, CART_W, CART_H, COUNTER_TOP_DROP, COUNTER_PAIR_GAP, COUNTER_ROW } from '../config.js';
import { S } from '../state.js';
import { draw } from '../render.js';
import { lifted } from '../crew.js';
import { deepTop, deepFloor, mouthX } from '../deep/place.js';

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
      // The right button held looks at the crew; the left going down with it
      // (a chord: a move, not a press) takes the body under the hand.
      point('pointerdown', sx, sy, 2, 2);
      point('pointermove', sx, sy, 3, 0);
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
    for (let i = 1; i <= 5; i++) { point('pointermove', a.sx, a.sy - i * 40, 3); run(1 / 60); }
    run(11 / 60);                                // the climb is not the throw
    for (let i = 1; i <= 6; i++) { run(1 / 60); point('pointermove', a.sx + i * 20, a.sy - 200, 3); }
    point('pointerup', a.sx + 140, a.sy - 200, 0);
    const thrown = posOf(a.who);
    const landedAt = landed(a.who);
    const carried = Math.abs(landedAt[0] - thrown[0]);

    // and dropped from a standstill: it goes where it was let go of
    run(3);
    const b = grab();
    run(1 / 60);
    for (let i = 1; i <= 5; i++) { point('pointermove', b.sx, b.sy - i * 40, 3); run(1 / 60); }
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
    for (let i = 0; i < waggles; i++) { point('pointermove', c.sx + (i % 2 ? 26 : -26), c.sy, 3); run(2 / 60); }
    point('pointerup', c.sx, c.sy, 0);
    run(0.6);
    const dizzy = state();
    run(3);
    const over = state();

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

  // A body in your hand is on the glass wherever you carry it. It was drawn
  // by the half it hung over: over the drowned pit it went under the liquid's
  // surface like a body wading in, and in the deep, on a window tall enough
  // to see past the deep's ceiling, it left the swimmers' water and was drawn
  // by nobody. The camera is put at each height by hand, the body carried
  // there by the pointer, and the pixels read with and without it.
  ['a body in your hand is drawn at every height, over the drowned pit and in the deep', async () => {
    window.__crew(3, 3, 5, 7);
    window.__snatch({ played: true });
    window.__view('yard');
    run(2);
    const [wx, wy] = state().workerPos[0].split(':')[1].split(',').map(Number);
    window.__look(wx - S.viewW / 2);
    const [sx, sy] = onScreen(wx, wy);
    point('pointerdown', sx + 2, sy + 2, 2, 2);
    point('pointermove', sx + 2, sy + 2, 3, 0);
    const w = lifted();
    if (!w) return [ok(false, 'a body is picked up')];
    const g = canvas().getContext('2d');
    const seen = () => {
      const [bx, by] = onScreen(w.x, w.y);
      const k = S.dpr, pad = WORKER;
      return g.getImageData(Math.round((bx - pad) * k), Math.round((by - pad) * k),
                            Math.round((WORKER + 2 * pad) * k), Math.round((WORKER + 2 * pad) * k)).data;
    };
    const lost = [];
    const carry = (view, x0, from, to) => {
      for (let y = from; y <= to; y += P * 8) {
        S.view = view;
        S.camX = x0;
        S.camY = y - S.viewH / 2;
        point('pointermove', S.viewW / 2, S.viewH / 2, 3, 0);
        draw();
        const held = seen();
        const all = S.workers;
        S.workers = all.filter(o => o !== w);
        draw();
        const bare = seen();
        S.workers = all;
        let n = 0;
        for (let i = 0; i < held.length; i += 4) if (held[i] !== bare[i]) n++;
        if (n === 0) lost.push(`${view} ${Math.round(w.y)}`);
      }
    };
    const x0 = mouthX() - S.viewW / 2;
    carry('yard', x0, S.groundY - P * 60, S.worldH);
    carry('deep', x0, deepTop() - P * 60, deepFloor() - P * 4);
    point('pointerup', S.viewW / 2, S.viewH / 2, 0, 2);
    window.__view('yard');
    return [ok(lost.length === 0, 'the body in your hand is drawn at every height it is carried to',
               `not drawn at ${lost.slice(0, 6).join(', ')}${lost.length > 6 ? ` and ${lost.length - 6} more` : ''}`)];
  }],
  // The seat pips (roster.js): a pip a seat under the cut, read off the
  // canvas, and every change made with the pointer -- the plus, a pip, the
  // minus -- so each body still walks.
  ['seat pips: a pip a seat, filled in thirds as a body walks over, set by a click', async () => {
    newRun();
    window.__crew(0, 3, 3, 0);
    window.__levels({ benchLevel: 3 });
    window.__kit({ blasters: 2 });
    run(20);
    const q = () => state().roster.find(r => r.key === 'quarryjob');
    window.__look(q().pips[2][0] - S.viewW / 2);
    const two = q().pips, farm = state().roster.find(r => r.key === 'plotjob');
    run(0.1);
    const g = canvas().getContext('2d');
    const ink = (wx, wy) => {
      const [sx, sy] = onScreen(wx, wy);
      return g.getImageData(Math.round(sx * S.dpr), Math.round(sy * S.dpr), 1, 1).data[0];
    };
    const dark = v => v < 90, light = v => v > 170;
    const off = SEAT_PIP * 0.3;
    const pip = i => { draw(); const [x, y] = q().pips[i]; return { mid: ink(x, y), low: ink(x, y + off), high: ink(x, y - off),
                                                                     edge: ink(x, y - SEAT_PIP / 2 + 1) }; };
    // A counter's head, read a half cell under its top in the middle: the
    // hat's crown on a hatted body, the white inside of a bare one.
    const head = c => { draw(); const [x, y, w] = c.head; return ink(x + w / 2, y + P / 2); };
    const plusMid = () => { draw(); const [x, y] = q().more; return ink(x, y); };
    const at = q(), first = pip(0), third = pip(2), fifth = pip(4);
    const heads = at.counters.map(head);
    const second = pip(1), regular = pip(2), pip3 = pip(3);

    // The buttons, off the canvas: the + (its upright bar scanned for its
    // extent) stands level with the block's first row, not its middle.
    const grey = v => v > 100 && v < 200;
    const level = () => {
      draw();
      // the + 's flat bar, read a few pixels in from its end, where even the
      // dotted one is solid
      const r = q(), [px0, py] = r.more, px = px0 - 7, [sx, sy0] = onScreen(px, py);
      let a = -1, z = -1;
      const reach = Math.round(3 * (onScreen(px, py + 1)[1] - sy0) * S.dpr);
      for (let d = -reach; d <= reach; d++) {
        const v = g.getImageData(Math.round(sx * S.dpr), Math.round(sy0 * S.dpr + d), 1, 1).data[0];
        if (v < 90) { if (a < 0) a = d; z = d; }
      }
      const mid = (a + z) / 2 / S.dpr;
      const rowMid = onScreen(px, r.block.y + COUNTER_TOP_DROP)[1] - sy0;
      return { off: Math.abs(mid - rowMid), mid, rowMid, a, z, reach, dpr: S.dpr, sy0, block: r.block,
               rows: new Set(r.pips.map(p => p[1])).size, n: r.pips.length, heads: r.counters.map(c => c.sprite) };
    };
    const twoCounters = level();
    // Every seat taken by a specialist: the hatted counter alone.
    window.__crew(0, 5, 5, 0);
    window.__kit({ blasters: 5 });
    run(30);
    const hatsOnly = level();
    window.__kit({ blasters: 2 });
    window.__crew(0, 3, 3, 0);

    const sent = await put('quarryjob', 'more');
    let seen = null;
    for (let i = 0; i < 200 && !seen; i++) {
      run(0.1);
      if (q().seats.coming[0] === 1) seen = pip(3);
    }
    runUntil(() => q().seats.filled === 4, 30);
    const arrived = pip(3);

    const click = async i => {
      const [x, y] = onScreen(...q().pips[i]);
      point('pointerdown', x, y);
      point('pointerup', x, y);
      await sleep(150);
    };
    await click(4);
    const five = state().quarriers;
    const fullPlus = plusMid();
    await click(4);
    const again = state().quarriers;
    const less = await put('quarryjob', 'less');
    const after = q();
    run(2);
    const gone = pip(4);
    // Filling seats takes a spare hat first: one hat spare, press + and the
    // walker's pip stands in the hatted counter, and it arrives hatted;
    // press + again with none spare and it takes a plain seat.
    window.__kit({ blasters: 4 });
    run(15);
    const hatted = () => q().counters.find(c => c.top);
    const spareRing = pip(hatted().shown - 1);     // the waiting hats are the hatted counter's last
    const sentHat = await put('quarryjob', 'more');
    let hatWalk = null;
    for (let i = 0; i < 200 && !hatWalk; i++) {
      run(0.1);
      const r = q();
      if (r.seats.wearing.length === 1) hatWalk = { inHats: r.counters[0].top && r.counters[0].pips >= r.seats.brims + 1, n: r.seats.wearing[0] };
    }
    runUntil(() => q().seats.brims === 4, 40);
    const fourHats = q().seats.brims;
    const sentPlain = await put('quarryjob', 'more');
    let plainWalk = null;
    for (let i = 0; i < 200 && !plainWalk; i++) {
      run(0.1);
      const r = q();
      if (r.seats.coming.length === 1 && r.seats.wearing.length === 0) {
        const [x] = r.pips[r.counters[0].shown + r.seats.plain];
        const plainBox = r.counters.find(c => !c.top).box;
        plainWalk = { x, plainBox, inPlain: x >= plainBox.x && x <= plainBox.x + plainBox.w };
      }
    }
    window.__crew(0, 0);
    // No hat owned: no top row, one row of seats.
    newRun();
    window.__crew(0, 3, 3, 0);
    window.__levels({ benchLevel: 3 });
    run(20);
    const bare = q().pips;
    const plainOnly = level();
    window.__crew(0, 0);
    return [
      ok(twoCounters.heads.join() === 'hat,body' && twoCounters.rows === 1 && twoCounters.off <= 1,
         'the lamped and the plain are two counters side by side, the + level with their first row', JSON.stringify(twoCounters)),
      ok(hatsOnly.rows === 1 && hatsOnly.n === 5 && hatsOnly.heads.join() === 'hat' && hatsOnly.off <= 1,
         'a station of five seats and five hats is the hatted counter alone', JSON.stringify(hatsOnly)),
      ok(plainOnly.rows === 1 && plainOnly.heads.join() === 'body' && plainOnly.off <= 1,
         'a station of only plain seats is the plain counter alone', JSON.stringify(plainOnly)),
      ok(at.seats && at.seats.seats === 5 && at.pips.length === 5, 'the cut with five benches shows five pips',
         at.seats && `${at.seats.seats} seats, ${at.pips && at.pips.length} pips`),
      ok(at.seats && at.seats.filled === 3, 'three of them filled for the three at work', at.seats && at.seats.filled),
      ok(dark(first.mid) && dark(third.mid), 'a body at work is a solid pip', `${first.mid} ${third.mid}`),
      ok(light(fifth.mid) && !dark(fifth.low), 'an empty seat is hollow', `${fifth.mid} ${fifth.low}`),
      ok(at.seats && at.seats.brims === 2 && at.counters[0].pips === 2 && at.counters[1].pips === 3
         && at.pips[0][1] === at.pips[4][1] && at.counters[1].box.x - (at.counters[0].box.x + at.counters[0].box.w) === COUNTER_PAIR_GAP,
         'the two lamped are a counter of their own beside the three regular seats', JSON.stringify(at.counters)),
      ok(at.seats && at.seats.plain === 1 && at.seats.regular === 3 && dark(regular.mid) && light(pip3.mid) && light(fifth.mid) && dark(first.mid) && dark(second.mid),
         'two hatted and one plain: two specialist pips and three regular, one of them filled', JSON.stringify([at.seats, regular.mid, pip3.mid, fifth.mid])),
      ok(dark(heads[0]) && light(heads[1]), "the hatted counter's head wears the lamp, the plain one's is bare",
         JSON.stringify(heads)),
      ok(sent, 'the plus under the cut sends one more'),
      ok(seen && dark(seen.low) && light(seen.high), 'its pip fills from the bottom while it walks over',
         seen && `low ${seen.low}, high ${seen.high}`),
      ok(dark(arrived.mid) && dark(arrived.high), 'and is solid once it is there', `${arrived.mid} ${arrived.high}`),
      ok(five === 5, 'clicking the fifth pip asks for five', `${five}`),
      ok(!dark(fullPlus), 'a full station dots its plus', `${fullPlus}`),
      ok(again === 4, "clicking the last body's own pip takes that body off", `${again}`),
      ok(less && after.n === 3, 'the minus takes one more off', `${after.n}`),
      ok(light(gone.mid) && !dark(gone.low), 'and its seat is empty once it has gone', `${gone.mid} ${gone.low}`),
      ok(grey(spareRing.edge) && light(spareRing.mid), 'a waiting hat is a grey ring in the hatted counter', JSON.stringify(spareRing)),
      ok(sentHat && hatWalk && hatWalk.inHats && fourHats === 4,
         'with a hat spare, the body added walks over as a specialist and arrives hatted', JSON.stringify([hatWalk, fourHats])),
      ok(sentPlain && plainWalk && plainWalk.inPlain, 'with none spare the next one fills a plain seat', JSON.stringify(plainWalk))
    ];
  }],

  // The counters with no seat cap (roster.js, "the crowds"): the house's
  // carriers, the rock's diggers and the garage's forklifts, a pip a body,
  // six to a row, three rows, and the rest written under the block. Read off
  // the canvas, and the diggers moved with the pointer.
  ['seat pips, uncapped: six a row, three rows, then +N; carters and breakers a counter beside; a pip a forklift under the garage', async () => {
    newRun();
    window.__crew(5, 30);
    window.__kit({ carters: 4, breakers: 3, drivers: 2 });
    run(25);
    const r = key => state().roster.find(p => p.key === key);
    const top = c => c.crowd.pips.filter(q => q.top), bot = c => c.crowd.pips.filter(q => !q.top);
    const rowLens = c => c.counters.flatMap(k => Object.values(k.at.reduce((m, q) => ((m[q[1]] = (m[q[1]] || 0) + 1), m), {})));
    const carry = r('carry');
    window.__look(carry.crowd.pips[0].at[0] - S.viewW / 2);
    run(0.1);
    const g = canvas().getContext('2d');
    const ink = (wx, wy) => {
      const [sx, sy] = onScreen(wx, wy);
      return g.getImageData(Math.round(sx * S.dpr), Math.round(sy * S.dpr), 1, 1).data[0];
    };
    const dark = v => v < 90;
    draw();
    const cart = top(r('carry'))[0], plain = bot(r('carry'))[0];
    // The carter's head: the wheel under its cart, and the plain pip solid.
    const carter = r('carry').counters.find(c => c.top);
    const cartInk = { wheel: ink(carter.head[0] + CART_W / 2, carter.head[1] + CART_H + P / 2), sprite: carter.sprite };
    const plainInk = { mid: ink(...plain.at) };
    // The "+N" is type centered under the block: some ink on its line.
    const plus = r('carry').crowd.plus[0];
    let plusInk = false;
    // Type is anti-aliased, so any clearly inked pixel in the band will do.
    if (plus) for (let d = -SEAT_PIP * 1.5; d <= SEAT_PIP * 1.5 && !plusInk; d++)
      for (let e = -P / 2; e <= P / 2 && !plusInk; e++) plusInk = ink(plus.at[0] + d, plus.at[1] + e) < 160;
    const gar = r('garage');
    const garMid = gar && gar.crowd.pips.reduce((a, q) => a + q.at[0], 0) / gar.crowd.pips.length;
    const mine = r('mine');
    const lessed = await put('mine', 'less');
    const afterLess = state().rockhands;
    const plusAt = r('mine').more;
    const mored = await put('mine', 'more');
    const afterMore = state().rockhands;
    const plusThen = r('mine').more;
    window.__crew(0, 0);
    return [
      ok(carry.crowd.top === 4 && carry.crowd.bottom === 26 && Math.max(...rowLens(carry)) <= COUNTER_ROW,
         'the carriers: four carts and twenty-six plain, six a row in each counter', JSON.stringify(rowLens(carry))),
      ok(plus && plus.n === 8 && plusInk, 'and the eight past three rows written under the block as +8', JSON.stringify(plus)),
      ok(top(carry).length === 4 && top(carry).every(q => q.brim === 'cart') && cart.at[1] === plain.at[1] && cart.at[0] < plain.at[0],
         'the carters are a counter of their own beside the plain', JSON.stringify(top(carry))),
      ok(dark(cartInk.wheel) && cartInk.sprite === 'cart' && dark(plainInk.mid),
         'drawn: the carters under a carter and its cart, the plain hauler solid', JSON.stringify([cartInk, plainInk])),
      ok(carry.lifts === null && !carry.crowd.pips.some(q => q.brim === 'fork'), 'and no forklift on the carriers'),
      ok(mine.crowd && top(mine).length === 3 && top(mine).every(q => q.brim === 'hat') && bot(mine).length === 2 &&
         top(mine)[0].at[0] < bot(mine)[0].at[0], 'the diggers: three breakers beside two plain', JSON.stringify(mine.crowd)),
      ok(lessed && afterLess === 4 && mored && afterMore === 5, 'and the - and + under the rock move a body each',
         `${afterLess} then ${afterMore}`),
      ok(plusAt[0] === plusThen[0] && plusAt[1] === plusThen[1], 'and the + stays where it was pressed',
         JSON.stringify([plusAt, plusThen])),
      ok(gar && gar.lifts === 2 && gar.crowd.pips.length === 2 && gar.crowd.pips.every(q => q.brim === 'fork'),
         'the garage: a pip a forklift', gar && JSON.stringify(gar.crowd)),
      ok(gar && Math.abs(garMid - (state().garage + GARAGE_W / 2)) <= P, 'standing under the garage',
         `${garMid} against ${state().garage + GARAGE_W / 2}`)
    ];
  }],
];
