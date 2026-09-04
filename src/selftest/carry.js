// Picking a body up and putting it down again.
//
// 4 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { sleep, newRun, settle, state, buildShopFromTest, ok, point, run, runUntil, put } from './kit.js';

export const TESTS = [
  // The lab empties itself when there is nothing to research. That is the game
  // tidying up after you, and making you go and undo it before anything can
  // happen is a chore rather than a decision.
  ['a body put in the lab stays in it, work or no work', async () => {
    newRun();
    await settle();
    window.__lab(true);
    window.__crew(0, 3, 0, 0, 2);                // two of the five in the lab
    // Stone and dust: `labswing` is priced in both, like every row -- see
    // `billOf` in upgrades.js -- so a purse with only stone in it cannot start
    // the piece this check is about.
    window.__grant({ shards: 50, dust: 20000 });
    run(3);
    const staffed = state();
    run(40);                                     // long enough for them to drift off
    const empty = state();
    buildShopFromTest();
    document.querySelector('#labshop button[data-key="labswing"]').click();
    run(1);
    const back = state();
    window.__abandon();
    window.__crew(0, 0);
    return [
      ok(staffed.scholars === 1, 'one is put in the lab', `${staffed.scholars}`),
      // It keeps them. The lab used to turn its own people out after a while
      // with nothing to research, and call them back when work arrived -- which
      // reads as thoughtful and is the building overruling the roster: you put
      // somebody in, and later they were somewhere else without your having said
      // so. An idle bench is a thing for you to notice, and the counter under
      // the lab is where you act on it.
      ok(empty.scholars === 1, 'and with nothing to work on it keeps them anyway',
         `${empty.scholars} left in`),
      ok(back.scholars === 1, 'and they are still there when work arrives',
         `${back.scholars} in`),
      ok(!!back.research, 'with the work actually started', JSON.stringify(back.research))
    ];
  }],

  // Picking somebody up moves them and does nothing else. It is the right
  // button because the left one is the whole game -- swinging, sweeping,
  // catching -- and a body is eighteen pixels walking about on top of the dust
  // you are trying to sweep.
  ['a body can be picked up, and walks back to work', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    window.__clearFloor();
    run(30);
    const s = state();
    const m = state().workerPos.find(p => p[0] === 'r').split(':')[1].split(',').map(Number);
    const scr = (wx, wy) => [(wx - state().camX) * s.zoom, (wy - state().camY) * s.zoom];

    // hovering one says who it is
    point('pointermove', ...scr(m[0] + 9, m[1] + 9), 0);
    const tipEl = document.getElementById('tip');
    const said = tipEl.hidden ? '' : tipEl.textContent;

    // the right button picks it up
    point('pointerdown', ...scr(m[0] + 9, m[1] + 9), 2, 2);
    const up = state();
    const away = [s.rockX - 700, s.groundY - 200];
    point('pointermove', ...scr(...away), 2, -1);
    const carried = state();
    const heldCard = document.getElementById('tip');
    const heldSaid = heldCard.hidden ? '' : heldCard.textContent;
    point('pointerup', ...scr(...away), 0, 2);
    run(0.2);
    const put = state();
    run(20);
    const home = state();
    window.__crew(0, 0);
    return [
      // The name, then a row a fact. Named rather than counted: the count was
      // seven and is nine since the card started saying what a body is doing
      // this second and where it is going, and a check that has to be edited
      // every time a row is added is a check that says nothing about any of
      // them. What must be true is that it is rows and that they are this
      // body's.
      ok(said.split(String.fromCharCode(10)).length >= 7 && said.includes('mining the rock')
         && /^age {7}/m.test(said) && /^doing {5}/m.test(said) && /^heading {3}/m.test(said),
         'hovering one says who it is and what it does, a row at a time',
         JSON.stringify(said)),
      ok(/^mined {5}/m.test(said) && /^quarried {2}/m.test(said) && /^stored {4}/m.test(said),
         'one line per site, all lined up in a column', JSON.stringify(said)),
      ok(!/^carrying/m.test(said), 'and a rockhand is not asked what it is carrying',
         JSON.stringify(said)),
      ok(!!up.lifted, 'the right button picks it up', `${up.lifted}`),
      ok(heldSaid.startsWith(up.lifted), 'and it keeps saying who it is while you hold it',
         JSON.stringify(heldSaid.slice(0, 40))),
      ok(up.rock === s.rock, 'and does not swing at what it was standing on'),
      // whichever rockhand is on the cursor, not whichever is first in the list:
      // there are two of them and the order they are stored in is not a fact
      // about which one you picked up
      ok(carried.workerPos.some(p => p[0] === 'r' &&
           Math.abs(+p.split(':')[1].split(',')[0] - away[0]) < 30),
         'it goes where the cursor goes',
         `${carried.workerPos.filter(p => p[0] === 'r')} want ${Math.round(away[0])}`),
      ok(put.falling === 1, 'let go, it falls rather than being lowered', `${put.falling}`),
      ok(!put.lifted && put.rockhands === s.rockhands,
         'putting it down leaves everybody on the job they were on',
         `${s.rockhands} -> ${put.rockhands}`),
      ok(Math.abs(+home.workerPos.find(p => p[0] === 'r').split(':')[1].split(',')[0] - s.rockX) < s.rockW,
         'and it walks back to what it was doing',
         home.workerPos.find(p => p[0] === 'r'))
    ];
  }],

  // Put down where it already works, there is nothing to walk to, so it should
  // not walk: the commute that gets a body home from the far end of the yard is
  // exactly the wrong thing when you have just set it on its own rock.
  ['a body dropped on its own station gets straight back to it', async () => {
    newRun();
    await settle();
    window.__crew(1, 0);
    window.__clearFloor();
    run(30);
    const s = state();
    const scr = (wx, wy) => [(wx - s.camX) * s.zoom, (wy - s.camY) * s.zoom];
    const m = s.workerPos.find(p => p[0] === 'r').split(':')[1].split(',').map(Number);
    point('pointerdown', ...scr(m[0] + 9, m[1] + 9), 2, 2);
    // straight up in the air over the rock, then let go
    const over = [s.rockX + s.rockW / 2, s.groundY - 260];
    point('pointermove', ...scr(...over), 2, -1);
    point('pointerup', ...scr(...over), 0, 2);
    const let_go = state();
    run(0.35);
    const air = state();
    run(4);
    const down = state();
    const near = +down.workerPos.find(p => p[0] === 'r').split(':')[1].split(',')[1];
    window.__crew(0, 0);
    return [
      ok(let_go.falling === 1, 'let go over its own rock, it is in the air', `${let_go.falling}`),
      ok(+air.workerPos.find(p => p[0] === 'r').split(':')[1].split(',')[1] > over[1],
         'and it is coming down', air.workerPos.find(p => p[0] === 'r')),
      ok(down.falling === 0 && near < s.groundY + 40, 'it lands', `${down.falling}, ${near}`),
      ok(down.rockhands === s.rockhands, 'still a rockhand', `${s.rockhands} -> ${down.rockhands}`)
    ];
  }],

  // A body put down on the rock should be standing on the rock, not standing on
  // the ground under it and then appearing on top a frame later.
  ['a body dropped on the rock lands on the rock and climbs from there', async () => {
    newRun();
    await settle();
    window.__crew(1, 1);
    window.__give(400);
    // wait for the hauler to actually have something in its hands, so the drop
    // below is a drop of a loaded body rather than an empty one
    const laden = () => state().crewDetail.find(d => d[0] === 'h' && !/\|c0\|/.test(d));
    runUntil(() => laden(), 40);
    const s = state();
    const carriedBefore = +(laden() || '').split('|')[3].slice(1) || 0;
    const scr = (wx, wy) => [(wx - s.camX) * s.zoom, (wy - s.camY) * s.zoom];
    // the hauler, so its card is the one that says what it is carrying
    const h = s.workerPos.find(p => p[0] === 'h').split(':')[1].split(',').map(Number);
    point('pointermove', ...scr(h[0] + 9, h[1] + 9), 0);
    const tipEl = document.getElementById('tip');
    const hauled = tipEl.hidden ? '' : tipEl.textContent;

    // Two drops from the same height: one over bare ground, one over the middle
    // of the rock. What the ground one lands at is what "fell to the ground"
    // means here, so the rock one can be measured against it rather than against
    // a number picked out of the air.
    const sky = s.groundY - 400;
    // Carried to a spot and *put down* there, which since bodies became throwable
    // means coming to a stop before letting go: a hand still travelling throws,
    // and this check is about where a body lands, not about how far it can be
    // flung. Two moves to the same place, a beat apart, is a hand at rest.
    const dropAt = async (tag, wx) => {
      const w = state().workerPos.find(p => p[0] === tag).split(':')[1].split(',').map(Number);
      point('pointerdown', ...scr(w[0] + 9, w[1] + 9), 2, 2);
      point('pointermove', ...scr(wx, sky), 2, -1);
      await sleep(180);
      point('pointermove', ...scr(wx, sky), 2, -1);
      await sleep(180);
      point('pointerup', ...scr(wx, sky), 0, 2);
      for (let i = 0; i < 80; i++) {
        run(0.1);
        if (!state().falling)
          return +state().workerPos.find(p => p[0] === tag).split(':')[1].split(',')[1];
      }
      return null;
    };
    const ground = await dropAt('h', s.rockX - 500);
    const carriedAfter = +(state().crewDetail.find(d => d[0] === 'h') || '|||c0').split('|')[3].slice(1);
    // Over the middle of it. `rockX` is the rock's centre, so the old
    // `rockX + rockW / 2` was its right-hand *edge* -- a body let go exactly
    // above the last column of the hill, which lands on the rock or beside it
    // depending on how far it drifts on the way down. It caught the edge while
    // gravity was gentle enough to let it drift inward, and stopped catching it
    // when gravity went up. The question is whether a body dropped over the rock
    // lands on the rock, and the middle is where that is asked.
    const landed = await dropAt('m', s.rockX);
    window.__crew(0, 0);
    return [
      ok(/^carrying {2}(nothing|[■▲⬢◯] \d)/m.test(hauled),
         'a body whose job is carrying says what it has, kind by kind',
         JSON.stringify(hauled)),
      // a body that fell to the ground stands exactly at `standOn(groundY)`; on
      // the rock it stands higher, however low the rock has been worked
      ok(carriedBefore > 0 && carriedAfter === carriedBefore,
         'and picking one up and putting it down does not empty its hands',
         `${carriedBefore} -> ${carriedAfter}`),
      ok(landed != null && landed < ground - 1,
         'and one dropped over the rock stops on the rock, not on the ground under it',
         `${landed} vs ${ground} on the ground`)
    ];
  }],
];
