// The stations: bought where they stand, the kit on them, whose board is
// whose, and why one has stopped.

import { sleep, newRun, settle, state, fmt, buildShopFromTest, ok, P, board, shop, point,
  onScreen, hoverBench, hoverStation, hoverAway, run, runUntil } from './kit.js';

export const TESTS = [
  // A decision about a place is made at the place.
  ['the quarry and the plots are bought where they are', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    window.__grant({ cores: 30, shards: 900, spores: 900 });
    window.__answered('props', 'net');          // the shields that open the two doors
    window.__give(500000);
    buildShopFromTest();
    shop().querySelector('[data-key="unlockfarm"]')?.click();
    window.__finish();  // the page's business, not the yard's
    buildShopFromTest();
    shop().querySelector('[data-key="unlockquarry"]')?.click();
    window.__finish();  // the page's business, not the yard's
    buildShopFromTest();
    const bench = [...shop().querySelectorAll('[data-key]')].map(b => b.dataset.key);

    // walk to the mouth of the quarry
    const s0 = state();
    await hoverStation('quarry');
    const atQuarry = state();
    const quarryRows = [...document.querySelectorAll('#quarryshop [data-key]')].map(b => b.dataset.key);
    const deeper = document.querySelector('#quarryshop [data-key="quarrybench"]');
    const wasBenches = state().benches;
    deeper?.click();
    window.__finish();  // the cut has to actually dig it; the page is what this is about
    const nowBenches = state().benches;

    // and out to the plots
    await hoverStation('farm');
    const atPlots = state();
    const plotRows = [...document.querySelectorAll('#farmshop [data-key]')].map(b => b.dataset.key);

    await hoverAway();
    window.__look(state().openCamX);
    window.__crew(0, 0);
    return [
      ok(!bench.includes('quarrybench') && !bench.includes('quarrypace') &&
         !bench.includes('farmplot') && !bench.includes('tend'),
         'the bench sells neither of them any more', bench.join(',')),
      ok(atQuarry.quarryBoardOpen, 'standing at the quarry opens its own board'),
      // A place row, the blaster's lamp (the kit opens with its station, on
      // the door chain), and the first card of each of the cut's two ladders:
      // only the band you are on is ever drawn.
      ok(quarryRows.join(',') === 'quarrybench,blaster,seam,quarrypace',
         'holding how deep it goes, what a dig turns up and how fast it works',
         quarryRows.join(',')),
      ok(nowBenches === wasBenches + 1, 'and the row on it digs the quarry deeper',
         `${wasBenches} -> ${nowBenches}`),
      ok(atPlots.farmBoardOpen, 'and the plots have theirs'),
      // ...and the grower's brim, sold where it is worn.
      ok(plotRows.join(',') === 'farmplot,grower,crop,tend',
         'holding the next plot, the brim, what a cut is worth and how fast a plot comes on',
         plotRows.join(','))
    ];
  }],

  ['every board says whose it is, even an empty one', async () => {
    // Counted apart, so a page that grew without a title is a missing name
    // rather than a shorter list nobody notices.
    const pages = [...document.querySelectorAll('.page')];
    const titles = [...document.querySelectorAll('.page .title')].map(t => t.textContent);

    window.__crew(2, 2);
    window.__grant({ shards: 40 });
    // The way to a board with nothing on it is a board whose rows are not
    // open yet: the quarry's, before the quarry is dug.
    const St = (await import('/src/state.js')).S;
    St.quarryOpen = false;
    buildShopFromTest();
    const empty = document.getElementById('quarryshop');
    const emptyText = empty.textContent;
    const emptyRows = empty.querySelectorAll('[data-key]').length;

    St.quarryOpen = true;
    buildShopFromTest();
    const back = document.getElementById('quarryshop').querySelectorAll('[data-key]').length;
    window.__crew(0, 0);
    St.quarryOpen = false;
    return [
      // The rule, not the roll-call: a list of names somebody typed cannot be
      // right about a board nobody has written yet. Both halves matter: two
      // pages with the same title is a board that changed under you without
      // saying so.
      ok(pages.length > 8 && titles.length === pages.length,
         'every board carries a name', `${titles.length} names on ${pages.length} boards`),
      ok(titles.every(t => t.trim().length > 0) &&
         new Set(titles.map(t => t.trim())).size === titles.length,
         'and each of them is its own', titles.join('|')),
      ok(emptyRows === 0 && emptyText.trim().length > 0,
         'a board with no rows says so instead of standing there blank', emptyText),
      ok(back > 0, 'and the rows come back once the place is built', `${back}`)
    ];
  }],

  // A board opens because you walked up to a station; a tooltip opens because
  // you went and looked at a mark. This check is the difference between those
  // two.
  ['a stopped station says why when you look at it', async () => {
    const tip = document.getElementById('tip');
    const hover = async (wx, wy) => {
      window.__look(wx - 380);
      await sleep(60);
      const [x, y] = onScreen(wx, wy);
      point('pointermove', x, y, 0);
      await sleep(140);
      return tip.hidden ? null : tip.textContent;
    };

    // a full pile at the rock
    window.__crew(4, 0);
    window.__clearFloor();
    const strip = state().piles.find(q => q.key === 'rock');
    for (let pass = 0; pass < 4 && !state().pileFull.rock; pass++) {
      for (let x = strip.from + P; x < strip.to - P; x += P) window.__pile(x, 20);
      run(1);
    }
    runUntil(() => state().pileFull.rock, 60);
    // Asked of the thing that places it: the mark hangs under the rock's
    // pile, not under the rock, so the station's own x is bare ground.
    const spot = window.__pileMarkAt('rock');
    const onMark = await hover(spot.x, spot.y);
    const away = await hover(state().rockX - 300, state().groundY - P * 20);

    // and a full hole
    window.__crew(0, 0);
    window.__clearFloor();
    window.__tip(state().pitCapacity * 2);
    run(1);
    const s = state();
    const onPit = await hover(s.pitX - P * 5, s.groundY - P * 7);

    window.__spend(state().stored);
    await hoverAway();
    window.__look(state().openCamX);
    return [
      ok(onMark === 'pile is full', 'the mark over a stopped station says so',
         String(onMark)),
      ok(away === null, 'and only where the mark is', String(away)),
      // The hole cannot stop anything (the first grain it will not take tears
      // it open), so there is nothing over it to hover. A station's pile still
      // stops its gang, which is why that mark stays.
      ok(onPit === null, 'and the hole, which cannot stop any more, carries none',
         String(onPit))
    ];
  }],

  ['the boards say what you have to spend with', async () => {
    await hoverBench();
    const purse = document.getElementById('purse');
    const marks = () => [...purse.querySelectorAll('.coin i')].map(i => i.className);

    // What has been seen depends on how far the checks before this one got the
    // yard, so the rule is checked against the game rather than against a
    // guess: the purse shows exactly the currencies you have seen, in order.
    const s0 = state();
    const want = ['dust', s0.seenCore && 'core', s0.seenShard && 'shard',
                  s0.seenSpore && 'spore'].filter(Boolean);
    const early = marks();
    window.__grant({ shards: 5, spores: 2 });
    await sleep(80);
    const later = marks();
    const shown = [...purse.querySelectorAll('.coin b')].map(b => b.textContent);
    const s = state();

    // beside the board, and on the left of it
    const box = purse.getBoundingClientRect();
    const sheet = document.querySelector('.panel .sheet').getBoundingClientRect();
    await hoverAway();
    return [
      ok(early.join(',') === want.join(','),
         'it shows exactly the currencies you have seen, and no others',
         `${early.join(',')} vs ${want.join(',')}`),
      ok(later.includes('shard') && later.includes('spore'),
         'and one you have appears', later.join(',')),
      ok(shown[0] === fmt(s.stored), 'the numbers are what you actually hold',
         `${shown[0]} vs ${s.stored}`),
      ok(box.right <= sheet.left + 1, 'it floats off the left of the board',
         `purse ends ${Math.round(box.right)}, board starts ${Math.round(sheet.left)}`),
      ok(box.width > 0 && box.height > 0, 'and it is actually on screen',
         `${Math.round(box.width)}x${Math.round(box.height)}`)
    ];
  }],
];
