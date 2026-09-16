// The places: revealed one at a time, and growing on what they give up.

import { sleep, newRun, settle, state, buildShopFromTest, ok, shop, S_open } from './kit.js';

export const TESTS = [
  ['the places are revealed one at a time', async () => {
    const rows = () => [...shop().querySelectorAll('button')].map(b => b.dataset.key);
    const has = k => rows().includes(k);

    newRun();
    await settle();
    const fresh = rows();

    // A door shows once you are within reach of affording it.
    window.__give(600);                      // the plots' own price, past the reveal's seven tenths
    // And a core, because a place costs one and the price is in a currency
    // you have no idea exists until one has been seen.
    window.__grant({ cores: 3 });
    window.__build();                        // `give` banks dust; it does not redraw
    await sleep(150);
    // Each shield's failure is what opens the next place (DESIGN.md, "The
    // shields are the spine"), so the dust and the core alone offer nothing.
    const withDustOnly = { farm: has('unlockfarm') };
    window.__answered('props');
    await sleep(150);
    const withDust = { farm: has('unlockfarm'), quarry: has('unlockquarry'),
                       casino: has('unlockcasino') };

    window.__crew(1, 1, 0, 1);               // the plots broken
    await sleep(150);
    const withPlotsOnly = { quarry: has('unlockquarry') };
    window.__answered('net');                // and the rope has failed
    await sleep(150);
    const withPlots = { quarry: has('unlockquarry'), casino: has('unlockcasino') };

    // The casino is revealed by the yard having been invested in (`invested`
    // in upgrades/site.js).
    window.__invest();
    window.__build();                      // as above: the yard moved, the sheet has not
    await sleep(150);
    const withRock = { casino: has('unlockcasino') };

    window.__crew(0, 0);
    return [
      ok(!fresh.includes('pick') && !fresh.includes('unlockfarm'),
         'a fresh game offers nothing about cores or places', fresh.join(' ')),
      ok(!withDustOnly.farm, 'a rock and a pile of dust offer nothing until the timber has failed'),
      ok(withDust.farm && !withDust.quarry && !withDust.casino,
         'and then the plots, and only the plots',
         JSON.stringify(withDust)),
      ok(!withPlotsOnly.quarry, 'breaking the ground offers nothing until the rope has failed'),
      ok(withPlots.quarry && !withPlots.casino, 'and then the quarry'),
      ok(withRock.casino, 'and an invested yard offers the casino')
    ];
  }],

  // A bench and a plot are each a place for one body, so the thing a site's
  // own currency buys first is room for somebody to work it.
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

    const { BENCH_COST } = await import('../config.js');
    window.__grant({ shards: 40, spores: BENCH_COST });
    // And dust, which the farm's rows are priced in: the plots open before
    // the cut.
    window.__tip(20000);
    buildShopFromTest();
    // Each is on the board at its own site, not on the bench.
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
