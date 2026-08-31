// The sky: the scrubbing house and the reading that is not a button.
//
// 2 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { newRun, settle, state, buildShopFromTest, ok, shop, run, runUntil, buy } from './kit.js';

export const TESTS = [
  // The problem, then the diagnosis, then the cure. The rain has to have come
  // down once, and the lab has to have been told to watch the sky, before the
  // yard will sell you anything to do about it.
  ['the scrubbing house is offered after the rain and the readout', async () => {
    newRun();
    await settle();
    window.__crew(4, 4);
    window.__grant({ cores: 9, spores: 40 });
    window.__lab(true);
    const has = () => { buildShopFromTest(); return !!shop().querySelector('[data-key="unlockscrub"]'); };

    run(2);
    const clean = has();

    // it has rained, and nobody has looked into why
    window.__air({ haze: state().smog.at + 1 });
    runUntil(() => state().smog.rains > 0, 30);
    run(20);
    const rained = has();

    // and now the lab is told to watch it
    window.__research('labair');
    const told = has();

    // ...and the third thing: a machine running. Hand labour dirties the sky
    // slowly, and a house sold against that is a cure for a number that was
    // creeping. A machine dirties it three times over per unit of work, so the
    // house is the bill for the thing you have just switched on -- problem and
    // answer in the same part of the game, which is what the smoke curve in
    // DESIGN.md is arranging.
    window.__fullSites();
    window.__machine('jaw', { bought: true, on: true });
    const both = has();
    const air = state().smog;
    window.__machine('jaw', { on: false, bought: false });
    window.__crew(0, 0);
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
    return [
      ok(!clean, 'a yard that has never been rained on is offered nothing', `${clean}`),
      ok(!rained, 'and a yard that has been rained on but never looked into it, nothing either',
         `${air.rains} rains, row ${rained}`),
      ok(!told, 'nor one that has read the sky but has nothing running that dirties it',
         `${told}`),
      ok(both, 'the rain, the readout and a machine are what open it', `${both}`),
      ok(air.rains > 0, 'and it took a real rain to get there', `${air.rains}`)
    ];
  }],

  // The one row in the game that is a reading rather than a purchase. It sits on
  // a board of things you press, so the only way to say it is not one of them is
  // to give up everything that says it is.
  ['the pollution reading is not a button', async () => {
    newRun();
    await settle();
    window.__crew(4, 4);
    window.__grant({ cores: 9, spores: 40 });
    window.__lab(true);
    window.__air({ haze: state().smog.at + 1 });
    runUntil(() => state().smog.rains > 0, 30);
    run(20);
    window.__research('labair');
    // ...and a machine running, which is the third thing the house waits on now.
    // Hand labour dirties the sky slowly; a machine dirties it three times over
    // per unit of work, and the house is the bill for the thing you switched on
    // rather than a cure sold ahead of the disease.
    window.__fullSites();
    window.__machine('jaw', { bought: true, on: true });
    buildShopFromTest();
    shop().querySelector('[data-key="unlockscrub"]').click();
    buildShopFromTest();

    const row = document.getElementById('scrubshop').querySelector('[data-key="airrate"]');
    // Read either side of the click with no clock in between: the sky fills on
    // its own, so a run() here would show the yard working and prove nothing.
    const before = state().smog.haze;
    row?.click();                                // nothing is hung on it to fire
    const after = state().smog.haze;
    const buy = document.getElementById('scrubshop')
                        .querySelector('[data-key]:not([data-key="airrate"])');

    window.__crew(0, 0);
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
    return [
      ok(!!row, 'the sky has a row on the house board'),
      ok(row && row.classList.contains('stat'),
         'and it is marked as a reading rather than a purchase'),
      ok(row && getComputedStyle(row).cursor === 'default',
         'the cursor does not change over it', row && getComputedStyle(row).cursor),
      ok(row && !row.disabled,
         'it is not dimmed either: a reading is live, it is just not for pressing'),
      ok(after === before, 'and pressing it does nothing at all', `${before} -> ${after}`),
      ok(!buy || getComputedStyle(buy).cursor === 'pointer',
         'while a real row on the same board still offers itself',
         buy && getComputedStyle(buy).cursor)
    ];
  }],
];
