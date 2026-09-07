// The stations: bought where they stand, the kit on them, whose board is
// whose, and why one has stopped.
//
// 5 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { sleep, newRun, settle, state, fmt, buildShopFromTest, ok, P, board, shop, point,
  onScreen, hoverBench, hoverStation, hoverAway, run, runUntil } from './kit.js';

export const TESTS = [
  // The same badge, on the other board, counting the other thing. A row says
  // what buying it gives you and what it costs, which leaves nowhere to read
  // what you already have -- and kit is the one purchase where that is the whole
  // question: a helmet is worth buying because of how many are already on the
  // rock.
  // A decision about a place is made at the place. The quarry and the plots used to
  // be sold from the bench, under headings naming a hole and a field on the far
  // side of the yard: you bought a bench you could not see, priced in a currency
  // that comes out of ground you were not standing on. The lab and the school
  // are buildings you walk to for exactly this reason.
  ['the quarry and the plots are bought where they are', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    window.__grant({ cores: 30, shards: 900, spores: 900 });
    window.__give(500000);
    buildShopFromTest();
    shop().querySelector('[data-key="unlockfarm"]')?.click();
    window.__finish();  // everything past the bench is built now; this is the page's business, not the yard's
    buildShopFromTest();
    shop().querySelector('[data-key="unlockquarry"]')?.click();
    window.__finish();  // everything past the bench is built now; this is the page's business, not the yard's
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
      ok(quarryRows.join(',') === 'quarrybench,quarrypace',
         'holding how deep it goes and how fast it works', quarryRows.join(',')),
      ok(nowBenches === wasBenches + 1, 'and the row on it digs the quarry deeper',
         `${wasBenches} -> ${nowBenches}`),
      ok(atPlots.farmBoardOpen, 'and the plots have theirs'),
      ok(plotRows.join(',') === 'farmplot,tend',
         'holding the next plot and how fast a plot comes on', plotRows.join(','))
    ];
  }],

  ['the training grounds count the kit on each stand', async () => {
    window.__crew(2, 2, 2, 2);
    window.__grant({ shards: 60 });
    window.__school({ open: true, breakers: 3, carters: 1, blasters: 0, growers: 0 });
    const s = state();

    // standing at it is what fills its board, the same as the bench
    await hoverStation('school');

    const heads = [...document.getElementById('schoolshop').children]
      .filter(el => el.dataset.sect);
    const badge = title => {
      const h = heads.find(el => el.dataset.sect === title);
      return h && h.querySelector('.badge');
    };
    const rock = badge('the rock'), dust = badge('the dust'), quarry = badge('the quarry');

    await hoverAway();
    window.__look(state().openCamX);
    window.__crew(0, 0);
    window.__school({ open: false, breakers: 0, carters: 0 });
    return [
      ok(rock && rock.textContent === '3',
         'a stand with kit on it says how much', rock && rock.textContent),
      ok(dust && dust.textContent === '1',
         'each trade counts its own, not the whole school', dust && dust.textContent),
      ok(!quarry, 'a trade you own none of carries no badge, the way an empty section does not'),
      ok(rock && rock.parentElement.firstChild.nodeValue === 'the rock',
         'and the heading keeps its own title as plain text',
         rock && rock.parentElement.firstChild.nodeValue)
    ];
  }],

  // Three boards slide into the same spot and differ only in their rows, so
  // each one says whose it is. And a board with nothing on it says that too:
  // the school runs out of trades on purpose, and an empty sheet is a bug you
  // have to rule out before you can believe it.
  ['every board says whose it is, even an empty one', async () => {
    // Counted apart, so a page that grew without a title is a missing name
    // rather than a shorter list nobody notices.
    const pages = [...document.querySelectorAll('.page')];
    const titles = [...document.querySelectorAll('.page .title')].map(t => t.textContent);

    window.__crew(2, 2);
    window.__grant({ shards: 40 });
    // The school sells kit and there is no ceiling on kit, so the way to a board
    // with nothing on it is a board whose rows are not open yet. What is being
    // checked is the sheet, not the school: a board that renders blank is a bug
    // you have to rule out before you can believe it.
    window.__school({ open: false });
    buildShopFromTest();
    const empty = document.getElementById('schoolshop');
    const emptyText = empty.textContent;
    const emptyRows = empty.querySelectorAll('[data-key]').length;

    window.__school({ open: true });
    buildShopFromTest();
    const back = document.getElementById('schoolshop').querySelectorAll('[data-key]').length;
    window.__crew(0, 0);
    window.__school({ open: false });
    return [
      // The rule, not the roll-call.
      //
      // This pinned the nine names there were, in the order they happened to be
      // written in the page, and every board added since has failed it for
      // being new rather than for being wrong: the apothecary, and then the
      // books. A list of names somebody typed cannot be right about a board
      // nobody has written yet, which is the whole of what the check is meant
      // to be about -- "even an empty one" is a promise about the *next* board.
      //
      // So it asks the thing it means: every page has a name of its own, and no
      // two pages share one. Both halves matter. A page with no title is a
      // sheet that opens over the yard saying nothing about where you are
      // standing; two pages with the same title is the same failure a frame
      // later, when you walk from one to the other and cannot tell that the
      // board changed under you.
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

  // Every price on a board is a mark and a number, and what you *had* of that
  // mark was only ever written over the pit -- the other end of the yard, in the
  // corner of the window, and as often as not behind the board itself.
  // This went missing for a while and nobody noticed. The three lines that
  // opened the bench board, the lab board and the tooltip became one call that
  // opened a board, and the tooltip went with them -- the words, the element and
  // the styling all still there, and nothing reaching them. A board opens
  // because you walked up to a station; a tooltip opens because you went and
  // looked at a mark. This check is the difference between those two.
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
    // Asked of the thing that places it. The mark hangs under the rock's PILE
    // now, not under the rock, so the station's own x is bare ground.
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
      // The hole used to carry the same warning. It cannot stop anything any
      // more -- the first grain it will not take tears it open, and the rest
      // goes through the rift -- so there is nothing over it to hover and
      // nothing to explain. A station's pile still stops its gang, which is why
      // that mark stays.
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
