// The casino: the stake, the spin, the pot as a real pile, and banking it.

import { sleep, newRun, settle, state, buildShopFromTest, ok, run, runUntil } from './kit.js';

export const TESTS = [
  ['the casino takes a stake and pays a pot', async () => {
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

    // Wound back to the smallest first: the dial is a setting and it keeps
    // whatever an earlier check left it on.
    const chips = [];
    const dial = () => casino().querySelector('[data-dial="chip"]');
    for (let i = 0; i < 4; i++) { dial().querySelector('.less').click(); buildShopFromTest(); }
    for (let i = 0; i < 4; i++) { chips.push(state().chip); dial().querySelector('.more').click(); buildShopFromTest(); }

    // and back down again, to put the smallest one down
    for (let i = 0; i < 4; i++) { dial().querySelector('.less').click(); buildShopFromTest(); }
    const held = state().stored;
    const stake = state().stakes.dust;
    row('stakedust').click();
    const down = state();
    // Neither half of the hand is on a clock this check can count off.
    runUntil(() => !state().pouring && !state().spinning, 40);
    buildShopFromTest();
    const settled = state();
    const potRows = settled.pot ? rows() : [];

    // Keep at it until both ways round have come up, and let the yard go
    // quiet between hands: a counter read while half the pot is still in the
    // air is a number mid-throw.
    const quiet = () => runUntil(() => state().tableAir === 0 && !state().paying &&
                                       !state().pouring && !state().spinning, 30);
    let won = null, lost = null;
    for (let i = 0; i < 40 && !(won && lost); i++) {
      if (state().pot) { row('bank').click(); quiet(); buildShopFromTest(); }
      quiet();
      const b = state().stored;
      row('stakedust').click();
      quiet();
      buildShopFromTest();
      const p = state().pot;
      const hand = state().hand;
      if (p) {
        row('bank').click();
        quiet();
        buildShopFromTest();
        won = { net: state().stored - b, said: hand && hand.won };
      } else lost = { net: state().stored - b, said: hand && hand.won === false };
    }
    newRun();
    await sleep(300);
    return [
      // Asked of every building, not of one neighbor: a building that is gone
      // is never seated and its x comes back 0. `siteOrder` pins the casino
      // last, and what that means is exactly this.
      ok(open.casinoOpen, 'cores build it',
         `casino at ${open.casinoX}`),
      ok(Object.entries(open.stands).every(([k, r]) => k === 'casino' || r.x > open.casinoX),
         'and it is the last thing on the ground',
         Object.entries(open.stands).filter(([k, r]) => k !== 'casino' && r.x <= open.casinoX)
           .map(([k, r]) => `${k} at ${r.x}`).join(', ')),
      ok(chips.join(',') === '10,100,1000,all in',
         'the chips run from ten to everything you have', chips.join(',')),
      ok(down.stored === held - stake,
         'a stake comes out of your hands', `${held} - ${stake} -> ${down.stored}`),
      ok(down.pot && down.pouring && !down.spinning,
         'and putting it down is the spin: one gesture, not two -- but the wheel '
         + 'waits for the sand it is spinning for'),
      ok(!settled.pot || potRows.join(',') === 'bank,ride',
         'a table with a pot on it offers two decisions and no stakes',
         potRows.join(',')),
      ok(won && won.net === stake, 'a win doubles the stake, so banking it clears it',
         won && `${won.net} net on ${stake}`),
      ok(lost && lost.net === -stake, 'and a loss is the stake, and nothing else',
         lost && `${lost.net} net on ${stake}`),
      ok(won && won.said && lost && lost.said,
         'and the yard says which way each one went')
    ];
  }],

  ['a spin is something to watch', async () => {
    newRun();
    await settle();
    window.__grant({ cores: 20 });
    window.__give(20000);
    window.__dig(23);
    window.__invest();
    buildShopFromTest();
    document.querySelector('#shop button[data-key="unlockcasino"]').click();
    window.__finish();  // the page's business, not the yard's
    buildShopFromTest();
    // stand at it, so there is a board in the way to get out of the way
    const s0 = state();
    window.__look(s0.casinoX - 200);
    run(0.5);

    const row = k => document.getElementById('casinoshop').querySelector(`button[data-key="${k}"]`);
    row('stakedust').click();
    const t0 = state();
    run(0.6);
    const early = state();                       // still raining down
    run(1.2);
    const late = state();
    runUntil(() => state().spinning, 30);
    const going = state();
    runUntil(() => !state().spinning, 30);
    const done = state();

    // and again until it comes off, to see the heap and the shower
    let win = null;
    for (let i = 0; i < 30 && !win; i++) {
      buildShopFromTest();
      if (state().pot) { row('bank').click(); run(0.5); buildShopFromTest(); }
      row('stakedust').click();
      runUntil(() => !state().pouring && !state().spinning, 40);
      buildShopFromTest();
      if (state().pot) win = state();
    }
    newRun();
    await sleep(300);
    return [
      ok(t0.pouring && !t0.spinning,
         'the chip going down starts the pot falling, not the wheel'),
      ok(early.wheel !== late.wheel, 'and the wheel keeps its idle turn while it comes down',
         `${early.wheel} -> ${late.wheel}`),
      ok(going.tableAir === 0 && !going.pouring,
         'it goes round in earnest once the last grain is lying still',
         `${going.table} down, ${going.tableAir} in the air`),
      ok(!done.spinning, 'and it comes to rest on its own'),
      ok(win && win.pot && win.pot.on > 0 && win.potAt > win.casinoX,
         'what is on the table is a heap on the ground beside the building',
         win && `${win.pot.on} at ${win.potAt}, building at ${win.casinoX}`),
      ok(win && (win.tableAir > 0 || win.table > 0),
         'and it trickles down out of the sky on to it',
         win && `${win.tableAir} in the air, ${win.table} down`),
      ok(win && win.hand && win.hand.won, 'with a mark to say so')
    ];
  }],

  ['the pot is a real pile, grain for grain', async () => {
    newRun();
    await settle();
    window.__grant({ cores: 20 });
    window.__give(30000);
    window.__dig(23);
    window.__invest();
    buildShopFromTest();
    document.querySelector('#shop button[data-key="unlockcasino"]').click();
    window.__finish();  // the page's business, not the yard's
    buildShopFromTest();
    const row = k => document.getElementById('casinoshop').querySelector(`button[data-key="${k}"]`);
    const dial = () => document.getElementById('casinoshop').querySelector('[data-dial="chip"]');

    dial().querySelector('.more').click(); buildShopFromTest();     // a hundred, so the heap is worth looking at
    const stake = state().stakes.dust;
    row('stakedust').click();
    const down = state();                       // the chip is down, nothing has landed
    run(0.5);                                   // the first of it is still falling
    const arriving = state();
    // and the hand plays itself out: the pot comes down, the wheel goes round
    // when it has, and the heap walks to whatever it left on the table
    runUntil(() => !state().pouring && !state().spinning && state().tableAir === 0 &&
                   state().table === state().tableWant, 40);
    const settled = state();
    const on = settled.pot ? settled.pot.on : 0;

    // and it leaves the same way, a grain at a time and fading as it goes
    if (settled.pot) { row('bank').click(); run(0.4); }
    const leaving = state();
    run(4);
    const gone = state();
    newRun();
    await sleep(300);
    return [
      ok(arriving.table < stake && arriving.table + arriving.tableAir > 0,
         'it arrives a grain at a time rather than appearing',
         `${arriving.table} of ${stake} down, ${arriving.tableAir} still falling`),
      ok(arriving.tableAir > 0, 'trickling out of the sky', `${arriving.tableAir} in the air`),
      ok(down.tableWant === stake, 'a stake at the first band is the pot itself, one for one',
         `${down.tableWant} grains for ${stake}`),
      ok(settled.table === settled.tableWant,
         'and it is the heap the pot asks for, grain for grain',
         `${settled.table} grains of ${settled.tableWant}, ${on} on the table`),
      ok(leaving.tableAir > 0 || gone.table === 0,
         'and when it goes it lifts off rather than blinking out'),
      ok(gone.table === 0, 'until the ground is bare again', `${gone.table} left`)
    ];
  }],

  ['banking flies the pot to the hole, grain for grain', async () => {
    newRun();
    await settle();
    window.__grant({ cores: 20 });
    window.__give(30000);
    window.__dig(23);
    window.__invest();
    buildShopFromTest();
    document.querySelector('#shop button[data-key="unlockcasino"]').click();
    window.__finish();  // the page's business, not the yard's
    buildShopFromTest();
    const row = k => document.getElementById('casinoshop').querySelector(`button[data-key="${k}"]`);
    const dial = () => document.getElementById('casinoshop').querySelector('[data-dial="chip"]');
    const quiet = () => runUntil(() => state().tableAir === 0 && !state().paying &&
                                       !state().pouring && !state().spinning, 30);

    dial().querySelector('.more').click(); buildShopFromTest();
    let win = null;
    for (let i = 0; i < 30 && !win; i++) {
      quiet();
      buildShopFromTest();
      if (state().pot) { row('bank').click(); quiet(); buildShopFromTest(); }
      row('stakedust').click();
      quiet();
      buildShopFromTest();
      if (state().pot) win = state();
    }
    const held = state().stored;
    const on = win ? win.pot.on : 0;
    row('bank').click();
    run(0.6);
    const flying = state();
    quiet();
    const landed = state();
    newRun();
    await sleep(300);
    return [
      ok(!!win && on > 0, 'there is a pot to take', `${on}`),
      ok(flying.tableAir > 0 && flying.paying !== null,
         'taking it puts the whole heap in the air',
         `${flying.tableAir} flying, ${flying.paying} still to go`),
      ok(flying.stored < held + on,
         'and the counter does not move until it gets there',
         `${flying.stored} vs ${held + on}`),
      ok(landed.stored === held + on, 'every grain that set off is counted when it lands',
         `${held} + ${on} -> ${landed.stored}`),
      ok(landed.table === 0 && landed.tableAir === 0,
         'and nothing is left behind', `${landed.table} on the ground`)
    ];
  }],
];
