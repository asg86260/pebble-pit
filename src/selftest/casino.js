// The casino: the stake on the roof, the call, the sand through the pegs.
//
// 2 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives. Everything about the
// hand itself is in the node tier (test/casino.test.mjs, test/sandboard.test.mjs);
// what is checked here is the page: the bench row that builds it, the dials
// and rows on its board, and that a hand pressed through them settles.

import { sleep, newRun, settle, state, buildShopFromTest, ok, run, runUntil } from './kit.js';

// the yard gone quiet: nothing in the air, nothing owed, nothing moving
const quiet = () => runUntil(() => state().tableAir === 0 && !state().paying &&
                                   !state().pouring && !state().letting && !state().clearing, 40);

export const TESTS = [
  // The one place in the yard that makes nothing. Everywhere else a thing you
  // buy does something for ever after; this takes what you have and hands some
  // of it back, and the whole of it is a decision you keep making.
  ['the casino takes a stake on its roof and pays the slot you called', async () => {
    newRun();
    await settle();
    window.__grant({ cores: 20 });
    window.__give(20000);
    window.__dig(23);                            // room for the winnings
    window.__invest();
    buildShopFromTest();
    const before = document.querySelector('#shop button[data-key="unlockcasino"]');
    before.click();
    window.__finish();  // the casino is a building, and the yard puts it up
    buildShopFromTest();
    const open = state();

    const casino = () => document.getElementById('casinoshop');
    const row = k => casino().querySelector(`button[data-key="${k}"]`);
    const rows = () => [...casino().querySelectorAll('button[data-key]')].map(b => b.dataset.key);

    // The chips go all the way up to everything you have. Wound back to the
    // smallest first: the dial is a setting and it keeps whatever an earlier
    // check left it on.
    const chips = [];
    const dial = k => casino().querySelector(`[data-dial="${k}"]`);
    for (let i = 0; i < 4; i++) { dial('chip').querySelector('.less').click(); buildShopFromTest(); }
    for (let i = 0; i < 4; i++) { chips.push(state().chip); dial('chip').querySelector('.more').click(); buildShopFromTest(); }
    for (let i = 0; i < 4; i++) { dial('chip').querySelector('.less').click(); buildShopFromTest(); }

    // and the call runs along the seven slots
    const calls = [];
    for (let i = 0; i < 7; i++) { dial('slot').querySelector('.less').click(); buildShopFromTest(); }
    for (let i = 0; i < 7; i++) { calls.push(state().slot); dial('slot').querySelector('.more').click(); buildShopFromTest(); }
    for (let i = 0; i < 3; i++) { dial('slot').querySelector('.less').click(); buildShopFromTest(); }

    const held = state().stored;
    const stake = state().stakes.dust;
    row('stakedust').click();
    const down = state();
    runUntil(() => !state().pouring, 40);
    buildShopFromTest();
    const landed = state();
    const potRows = rows();
    const callDial = !!dial('slot');

    row('letgo').click();
    const going = state();
    runUntil(() => !state().letting, 60);
    const hand = state().hand;
    quiet();
    buildShopFromTest();
    const after = state();

    newRun();
    await sleep(300);
    return [
      ok(open.casinoOpen, 'dust builds it', `casino at ${open.casinoX}`),
      ok(Object.entries(open.stands).every(([k, r]) => k === 'casino' || r.x > open.casinoX),
         'and it is the last thing on the ground',
         Object.entries(open.stands).filter(([k, r]) => k !== 'casino' && r.x <= open.casinoX)
           .map(([k, r]) => `${k} at ${r.x}`).join(', ')),
      ok(chips.join(',') === '10,100,1000,all in',
         'the chips run from ten to everything you have', chips.join(',')),
      ok(calls.join(',') === '0,1,2,3,4,5,6', 'and the call runs along the seven slots', calls.join(',')),
      ok(down.stored === held - stake,
         'a stake comes out of your hands', `${held} - ${stake} -> ${down.stored}`),
      ok(down.pot && down.pouring && !down.letting,
         'and putting it down starts the sand falling on to the roof, and nothing else'),
      ok(landed.table === stake && landed.pot && landed.pot.on === stake,
         'the heap on the roof is the stake, grain for grain',
         `${landed.table} of ${stake}`),
      ok(potRows.join(',') === 'letgo' && callDial,
         'a roof with a pot on it offers the call and the let-go, and no chips',
         potRows.join(',')),
      ok(going.letting && going.gate, 'letting go opens the floor', going.gate && `at ${going.gate.at}`),
      ok(hand && hand.slot === 3 && hand.counts && hand.counts.length === 7,
         'the hand settles on the called slot with the sand counted slot by slot',
         hand && hand.counts.join(' ')),
      ok(after.stored === held - stake + (hand ? hand.n : 0),
         'and the hole is paid what the called slot held at its rate',
         `${held} - ${stake} + ${hand && hand.n} -> ${after.stored}`),
      ok(after.board === 0 && after.table === 0 && !after.pot,
         'and the building stands empty for the next hand')
    ];
  }],

  // The board gets out of the light while the hand plays: a sheet standing over
  // the building the sand is going through is a sheet over the picture.
  ['the board hushes for the hand', async () => {
    newRun();
    await settle();
    window.__grant({ cores: 20 });
    window.__give(20000);
    window.__dig(23);
    window.__invest();
    buildShopFromTest();
    document.querySelector('#shop button[data-key="unlockcasino"]').click();
    window.__finish();
    buildShopFromTest();
    const s0 = state();
    window.__look(s0.casinoX - 200);
    run(0.5);

    const row = k => document.getElementById('casinoshop').querySelector(`button[data-key="${k}"]`);
    row('stakedust').click();
    const t0 = state();
    runUntil(() => !state().pouring, 40);
    buildShopFromTest();
    row('letgo').click();
    const t1 = state();
    runUntil(() => !state().letting, 60);
    quiet();
    const done = state();
    newRun();
    await sleep(300);
    return [
      ok(t0.pouring, 'the chip going down starts the pot falling'),
      ok(t1.letting && t1.gate, 'and letting go opens the floor'),
      ok(done.hand !== undefined && !done.letting && !done.pouring, 'and the hand plays itself out'),
      ok(done.board === 0 && done.table === 0, 'leaving the building empty',
         `${done.board} on the board, ${done.table} in the tray`)
    ];
  }]
];
