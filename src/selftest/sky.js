// The sky: the scrubbing house and the reading that is not a button.
//
// 2 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { newRun, settle, state, buildShopFromTest, ok, shop, run, runUntil, buy } from './kit.js';

export const TESTS = [
  // The problem, then the cure. The rain has to have come down on you once, and
  // something that dirties the sky has to be running, before the yard will sell
  // you anything to do about it.
  //
  // It used to be three things: the rain, a readout bought at the lab, and a
  // machine. The lab is gone and the readout is not bought any more -- the first
  // rain is what shows you the sky's reading, because rain on your head is
  // meeting the thing, and nothing in this game is named before you have met one.
  // So the first two conditions are one condition now. See DESIGN.md, "The lab is
  // deleted".
  ['the scrubbing house is offered after the rain and a machine', async () => {
    newRun();
    await settle();
    window.__crew(4, 4);
    window.__grant({ cores: 9, spores: 40 });
    window.__invest();
    const has = () => { buildShopFromTest(); return !!shop().querySelector('[data-key="unlockscrub"]'); };

    run(2);
    const clean = has();
    const blind = state().seenAir;

    // it has rained, which is also how you come to be reading the sky
    // To the brim rather than a hair over the line: a sky at the line only
    // *might* rain now -- the yard takes a look every few seconds and rolls for
    // it -- and a sky at the brim is certain to break at the next look.
    window.__air({ haze: state().smog.cap });
    runUntil(() => state().smog.rains > 0, 60);
    run(20);
    const rained = has();
    const told = state().seenAir;

    // ...and the second thing: a machine running. Hand labour dirties the sky
    // slowly, and a house sold against that is a cure for a number that was
    // creeping. A machine dirties it three times over per unit of work, so the
    // house is the bill for the thing you have just switched on -- problem and
    // answer in the same part of the game, which is what the smoke curve in
    // DESIGN.md is arranging.
    window.__fullSites();
    window.__machine('jaw', { bought: true });
    const both = has();
    const air = state().smog;
    window.__machine('jaw', { bought: false });
    window.__crew(0, 0);
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
    return [
      ok(!clean, 'a yard that has never been rained on is offered nothing', `${clean}`),
      ok(!blind, 'and has no reading of the sky to go on either', `${blind}`),
      ok(told, 'the first rain is what gives you the reading', `${told}`),
      ok(!rained, 'which on its own is still not enough to sell you the house', `${rained}`),
      ok(both, 'the rain and a machine are what open it', `${both}`),
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
    window.__invest();
    // To the brim rather than a hair over the line: a sky at the line only
    // *might* rain now -- the yard takes a look every few seconds and rolls for
    // it -- and a sky at the brim is certain to break at the next look.
    window.__air({ haze: state().smog.cap });
    runUntil(() => state().smog.rains > 0, 60);
    run(20);
    window.__research('labair');
    // ...and a machine running, which is the third thing the house waits on now.
    // Hand labour dirties the sky slowly; a machine dirties it three times over
    // per unit of work, and the house is the bill for the thing you switched on
    // rather than a cure sold ahead of the disease.
    window.__fullSites();
    window.__machine('jaw', { bought: true });
    buildShopFromTest();
    shop().querySelector('[data-key="unlockscrub"]').click();
    window.__finish();  // everything past the bench is built now; this is the page's business, not the yard's
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
