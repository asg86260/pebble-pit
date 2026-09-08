// The places: revealed one at a time, and growing on what they give up.
//
// 2 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { sleep, newRun, settle, state, buildShopFromTest, ok, shop, S_open } from './kit.js';

export const TESTS = [
  ['the places are revealed one at a time', async () => {
    const rows = () => [...shop().querySelectorAll('button')].map(b => b.dataset.key);
    const has = k => rows().includes(k);

    newRun();
    await settle();
    const fresh = rows();

    // Dust opens the places now, not cores -- a core buys the tower and nothing
    // else. A door shows once you are within half its price of affording it, so
    // what reveals the quarry is having most of what it costs.
    window.__give(400);
    // And a rock finished, because a place costs one. The plots are not offered
    // on a pile of dust alone any more: until a core has been seen at all, the
    // price is in a currency you have no idea exists.
    window.__grant({ cores: 3 });
    window.__build();                        // `give` banks dust; it does not redraw
    await sleep(150);
    const withDust = { farm: has('unlockfarm'), quarry: has('unlockquarry'),
                       bench: has('unlockbuildbench') };

    window.__crew(1, 1, 0, 1);               // the plots broken
    await sleep(150);
    const withPlots = { quarry: has('unlockquarry'), bench: has('unlockbuildbench') };

    // The third beat was the lab, revealed by the first shard. The lab is gone,
    // and what stands in its place in the run is the construction bench -- which
    // is revealed by getting to the second rock rather than by a coin. See
    // DESIGN.md, "The lab is deleted".
    window.__jump(2);
    window.__build();                      // as above: the yard moved, the sheet has not
    await sleep(150);
    const withRock = { bench: has('unlockbuildbench') };

    window.__crew(0, 0);
    return [
      ok(!fresh.includes('pick') && !fresh.includes('unlockfarm'),
         'a fresh game offers nothing about cores or places', fresh.join(' ')),
      ok(withDust.farm && !withDust.quarry && !withDust.bench,
         'a rock and a pile of dust offer the plots, and only the plots',
         JSON.stringify(withDust)),
      ok(withPlots.quarry && !withPlots.bench, 'breaking the ground offers the quarry'),
      ok(withRock.bench, 'and the second rock offers the work bench')
    ];
  }],

  // A site is bought with cores and then paid for by itself. What the quarry
  // gives up takes the quarry down another bench, and what the plots give up breaks
  // another plot -- and a bench and a plot are each a place for one body, so the
  // thing the site's own currency buys first is room for somebody to work it.
  ['the quarry and the farm grow on what they give up', async () => {
    newRun();
    await settle();
    window.__levels({ benchLevel: 0, plotLevel: 0 });
    S_open();
    window.__crew(0, 10);
    const start = state();
    // every hand in the yard, and only so many of them fit
    for (let i = 0; i < 6; i++) window.__assign('quarriers', 1);
    for (let i = 0; i < 6; i++) window.__assign('farmhands', 1);
    const packed = state();

    window.__grant({ shards: 40, spores: 40 });
    // And dust, which the farm's rows are priced in now: the plots open before
    // the cut, so pricing them in shards priced the earlier place in a currency
    // the later one has not started making yet.
    window.__tip(20000);
    buildShopFromTest();
    // Each is on the board at its own site now, not on the bench: see
    // 'the quarry and the plots are bought where they are'.
    const rows = [...document.querySelectorAll('#quarryshop [data-key], #farmshop [data-key]')]
      .map(b => b.dataset.key);
    const deep = state().quarryH, wide = state().farmW;
    document.querySelector('#quarryshop button[data-key="quarrybench"]').click();
    document.querySelector('#farmshop button[data-key="farmplot"]').click();
    window.__finish();  // the cut has to actually dig it; the page is what this is about
    const grown = state();
    window.__assign('quarriers', 1);
    window.__assign('farmhands', 1);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(start.benches === 2 && start.plotCount === 1,
         'a fresh quarry holds two and the ground comes with one plot',
         `${start.benches} benches, ${start.plotCount} plots`),
      ok(packed.quarriers === 2 && packed.farmhands === 1,
         'and no more than that can be sent to either',
         `${packed.quarriers} down, ${packed.farmhands} at the plots`),
      ok(rows.includes('quarrybench') && rows.includes('farmplot'),
         'both are on their own board the moment the place is open', rows.join(',')),
      ok(grown.quarryH > deep && grown.farmW > wide,
         'buying one takes the quarry deeper and the plot wider',
         `${deep}->${grown.quarryH} deep, ${wide}->${grown.farmW} wide`),
      ok(after.quarriers === 3 && after.farmhands === 2,
         'and there is room for one more body at each',
         `${after.quarriers} down, ${after.farmhands} at the plots`)
    ];
  }],
];
