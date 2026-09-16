// The casino: the bench row builds it, and a hand pressed through the page's
// rows -- the chip, the stake, the let-go, the decision -- settles.
//
// What the hand *does* is the node tier's (test/casino.test.mjs, handful.test.mjs);
// this is the page: the board's rows exist, they press, and the hand they start
// plays out. 2 groups, in the order they have always run in -- see
// src/selftest.js, which is where the order lives.

import { sleep, newRun, settle, state, buildShopFromTest, ok, run, runUntil, raf } from './kit.js';

export const TESTS = [
  // The one place in the yard that makes nothing. Everywhere else a thing you
  // buy does something for ever after; this takes what you have and hands some
  // of it back, and the whole of it is a decision you keep making.
  ['the casino takes a stake and drops a handful', async () => {
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
    const dial = () => casino().querySelector('[data-dial="chip"]');
    for (let i = 0; i < 4; i++) { dial().querySelector('.less').click(); buildShopFromTest(); }
    for (let i = 0; i < 4; i++) { chips.push(state().chip); dial().querySelector('.more').click(); buildShopFromTest(); }
    // and back to a hundred, so a whole handful goes down
    for (let i = 0; i < 4; i++) { dial().querySelector('.less').click(); buildShopFromTest(); }
    dial().querySelector('.more').click(); buildShopFromTest();

    const held = state().stored;
    const stake = state().stakes.dust;
    row('stakedust').click();
    const down = state();
    // The stake pours into the hopper and stands there: nothing here is on a
    // clock this check can count off.
    runUntil(() => !state().pouring, 40);
    buildShopFromTest();
    const stood = state();
    const hopperRows = rows();
    row('letgo').click();
    const let_ = state();
    let sent = 0, onBoard = 0;
    for (let f = 0; f < 60 * 30 && (state().letting || state().pouring); f++) {
      run(1 / 60);
      const d = state().drop;
      if (d) { sent = Math.max(sent, d.sent); onBoard = Math.max(onBoard, d.falling); }
    }
    buildShopFromTest();
    const paid = state();
    const trayRows = rows();
    row('bank').click();
    runUntil(() => state().tableAir === 0 && !state().paying, 30);
    const banked = state();
    newRun();
    await sleep(300);
    return [
      ok(open.casinoOpen, 'the bench row builds it', `casino at ${open.casinoX}`),
      ok(Object.entries(open.stands).every(([k, r]) => k === 'casino' || r.x > open.casinoX),
         'and it is the last thing on the ground',
         Object.entries(open.stands).filter(([k, r]) => k !== 'casino' && r.x <= open.casinoX)
           .map(([k, r]) => `${k} at ${r.x}`).join(', ')),
      ok(chips.join(',') === '10,100,1000,all in',
         'the chips run from ten to everything you have', chips.join(',')),
      ok(down.stored === held - stake,
         'a stake comes out of your hands', `${held} - ${stake} -> ${down.stored}`),
      ok(down.pot && down.pot.where === 'hopper' && down.pouring,
         'and pours into the hopper on the roof'),
      ok(stood.table === Math.min(stake, 32) && hopperRows.join(',') === 'letgo',
         'where it stands as the handful, with the let-go the one row left',
         `${stood.table} grains, rows ${hopperRows.join(',')}`),
      ok(let_.letting, 'pressing it opens the floor'),
      ok(sent === Math.min(stake, 32) && onBoard > 1,
         'and a handful goes down the pegs as a stream', `${sent} sent, ${onBoard} at once`),
      ok(paid.pot && paid.pot.where === 'tray' && paid.tray > 0 && trayRows.join(',') === 'bank,ride',
         'the bins pay into the tray and the two decisions are the rows',
         `${paid.pot && paid.pot.on} in the tray, rows ${trayRows.join(',')}`),
      ok(paid.hand && paid.mult != null, 'and the box says the multiple', `${paid.mult}`),
      ok(banked.stored === held - stake + (paid.pot ? paid.pot.on : 0) && banked.tray === 0,
         'banking flies the tray to the hole, grain for grain',
         `${banked.stored} held after`)
    ];
  }],

  // A hand is the one moment in this game you are meant to sit and watch, so
  // the board gets out of the light for the whole of it, from the chip going
  // down to the tray standing.
  ['the casino board hushes for the hand', async () => {
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
    // The hush is set by the frame's `hud()`, which the fast clock does not
    // run, so each reading waits one real frame.
    const panel = document.getElementById('panel');
    const read = async busy => { await raf(); return { busy, hushed: panel.classList.contains('hushed') }; };
    row('stakedust').click();
    run(0.3);
    const pouring = await read(state().pouring);
    runUntil(() => !state().pouring, 30);
    run(0.2);
    const standing = await read(state().pouring);
    buildShopFromTest();
    row('letgo').click();
    run(0.8);
    const falling = await read(state().letting);
    runUntil(() => !state().letting && !state().pouring, 30);
    run(0.2);
    const done = await read(state().letting || state().pouring);
    newRun();
    await sleep(300);
    return [
      ok(pouring.busy && pouring.hushed, 'the board is out of the light while the stake pours'),
      ok(!standing.busy && !standing.hushed, 'and back when the pot is standing in the hopper'),
      ok(falling.busy && falling.hushed, 'out again while the handful is on the pegs'),
      ok(!done.busy && !done.hushed, 'and back when the tray is standing')
    ];
  }]
];
