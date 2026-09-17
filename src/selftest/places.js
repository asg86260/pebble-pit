// The places: growing on what they give up. The order the doors open in is
// the station table's, checked in test/gates.test.mjs.

import { newRun, settle, state, buildShopFromTest, ok, S_open } from './kit.js';

export const TESTS = [
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

    // Enough of each coin for the bench and the plot together: the bench
    // asks spores and shards, the plot dust and spores.
    const { BENCH_COST, BENCH_SHARDS, PLOT_SPORES } = await import('../config.js');
    window.__grant({ shards: 40 + BENCH_SHARDS, spores: BENCH_COST + PLOT_SPORES });
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
