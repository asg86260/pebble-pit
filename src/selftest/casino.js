// The casino on the page: the bench row builds it, a heap is dragged to the
// hopper with the right button on a desk and with a finger on a phone -- a
// finger on a heap never scrolls the yard -- and a tap on each lever pulls it
// and the tooltip names it.
//
// What the hand *does* is the node tier's (test/casino.test.mjs, handful.test.mjs);
// this is the pointer and the page. 3 groups, in the order they have always
// run in -- see src/selftest.js, which is where the order lives.

import { sleep, newRun, settle, state, buildShopFromTest, ok, run, runUntil, raf, canvas, point, touch, finger, P } from './kit.js';

const phone = on => window.__coarse(on ? true : null);
const frames = async n => { for (let i = 0; i < n; i++) { run(1 / 60); await raf(); } };
const tipText = () => { const t = document.getElementById('tip'); return t && !t.hidden ? t.textContent.trim() : ''; };

// The casino bought through the bench and stood up, the heaps standing, the
// view on it: a heap's spot and the rim, on screen.
async function atTheCasino() {
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
  window.__casinoStakes(20000);
  const s = state();
  window.__look(s.casinoX + 100);
  await frames(2);
  const t = state();
  const spot = window.__stakeAt('dust', 100), rim = window.__rim();
  const sx = [(spot.x - t.camX) * t.zoom, (spot.y - t.camY) * t.zoom];
  const rx = [(rim.x - t.camX) * t.zoom, (rim.y - t.camY) * t.zoom];
  return { s: t, sx, rx };
}

export const TESTS = [
  ['the casino takes a heap dragged to the hopper with the right button', async () => {
    const { s, sx, rx } = await atTheCasino();
    const rows = window.__rows().filter(r => ['chip', 'stakedust', 'letgo', 'bank', 'ride'].includes(r.key));
    const held = s.stored;
    // the right button held on the heap, dragged to the rim, let go there
    point('pointerdown', sx[0], sx[1], 2, 2);
    await frames(1);
    const lifted = state();
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      point('pointermove', sx[0] + (rx[0] - sx[0]) * i / steps, sx[1] + (rx[1] - sx[1]) * i / steps, 2, 2);
      await frames(1);
    }
    const over = state();
    point('pointerup', rx[0], rx[1], 0, 2);
    await frames(1);
    const dropped = state();
    runUntil(() => !state().pouring, 30);
    const stood = state();
    // and the gate lever, tapped, plays the hand
    const gate = window.__leverAt('casino-gate');
    const gx = [(gate.x - stood.camX) * stood.zoom, (gate.y - P * 2 - stood.camY) * stood.zoom];
    point('pointermove', gx[0], gx[1]);
    await frames(1);
    const named = tipText();
    point('pointerdown', gx[0], gx[1]);
    point('pointerup', gx[0], gx[1], 0);
    await frames(1);
    const pulled = state();
    runUntil(() => !state().letting && !state().pouring, 40);
    const paid = state();
    newRun();
    await sleep(300);
    return [
      ok(s.casinoOpen, 'the bench row builds it', `casino at ${s.casinoX}`),
      ok(rows.length === 0, 'and it has no rows on any board', rows.map(r => r.key).join(',')),
      ok(lifted.inHand && lifted.inHand.kind === 'stake' && lifted.inHand.n === 100,
         'the right button held on a heap lifts it', JSON.stringify(lifted.inHand)),
      ok(over.inHand && Math.abs(over.inHand.x - window.__rim().x) < 2,
         'and it goes where the pointer goes', over.inHand && `${over.inHand.x}`),
      ok(!dropped.inHand && dropped.pot && dropped.pot.on === 100 && dropped.stored === held - 100,
         'let go over the rim it is the pot, out of the purse', JSON.stringify(dropped.pot)),
      ok(stood.table > 0 && !stood.pouring, 'and it stands in the funnel', `${stood.table}`),
      ok(/gate/.test(named), 'hovering the gate lever names it', named),
      ok(pulled.letting, 'and a click on it opens the floor'),
      ok(paid.pot && paid.pot.where === 'tray', 'so the hand plays out to the tray')
    ];
  }],

  ['a finger on a heap lifts it and never scrolls the yard', async () => {
    const { s, sx, rx } = await atTheCasino();
    phone(true);
    await frames(1);
    const sc = document.getElementById('scroller');
    const camX = state().camX, scrollX = sc.scrollLeft;
    // the platform asks at touchstart: a finger on a heap is the game's
    const said = touch('touchstart', canvas(), sx[0], sx[1]);
    finger('pointerdown', 1, sx[0], sx[1]);
    await frames(1);
    const lifted = state();
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      finger('pointermove', 1, sx[0] + (rx[0] - sx[0]) * i / steps, sx[1] + (rx[1] - sx[1]) * i / steps);
      await sleep(16); await frames(1);
    }
    const mid = state();
    finger('pointerup', 1, rx[0], rx[1]);
    touch('touchend', canvas(), rx[0], rx[1]);
    await frames(1);
    const dropped = state();
    // and a finger on the sky beside it is left to the platform
    const skySaid = touch('touchstart', canvas(), sx[0], sx[1] - 200);
    touch('touchend', canvas(), sx[0], sx[1] - 200);
    phone(false);
    newRun();
    await sleep(300);
    return [
      ok(said, 'the touch on a heap is claimed at touchstart, so the platform never scrolls it'),
      ok(lifted.inHand && lifted.inHand.kind === 'stake', 'and the finger has the heap', JSON.stringify(lifted.inHand)),
      ok(mid.camX === camX && sc.scrollLeft === scrollX, 'the yard did not move under the drag',
         `${mid.camX} vs ${camX}, ${sc.scrollLeft} vs ${scrollX}`),
      ok(!dropped.inHand && dropped.pot && dropped.pot.on === 100, 'and lifting the finger over the rim stakes it',
         JSON.stringify(dropped.pot)),
      ok(!skySaid, 'while a finger on the sky is still the platform\'s to scroll')
    ];
  }],

  ['a tap on each lever pulls it and the tooltip names it', async () => {
    const { s } = await atTheCasino();
    phone(true);
    window.__casinoStake(100);
    await frames(1);
    const at = key => { const l = window.__leverAt(key); const t = state(); return [(l.x - t.camX) * t.zoom, (l.y - P * 2 - t.camY) * t.zoom]; };
    const tapLever = async key => {
      const [x, y] = at(key);
      finger('pointerdown', 1, x, y);
      finger('pointerup', 1, x, y);
      await frames(1);
    };
    await tapLever('casino-gate');
    const gate = state();
    runUntil(() => !state().letting && !state().pouring, 40);
    await tapLever('casino-crank');
    const crank = state();
    runUntil(() => !state().hoisting && !state().pouring, 40);
    await tapLever('casino-gate');
    runUntil(() => !state().letting && !state().pouring, 40);
    await tapLever('casino-chute');
    const chute = state();
    runUntil(() => !state().paying, 40);
    phone(false);
    // and on a desk, each is named under the pointer
    const names = [];
    for (const key of ['casino-gate', 'casino-chute', 'casino-crank']) {
      const [x, y] = at(key);
      point('pointermove', x, y);
      await frames(1);
      names.push(tipText());
    }
    newRun();
    await sleep(300);
    return [
      ok(gate.letting, 'a tap on the gate lever opens the floor'),
      ok(crank.hoisting || (crank.pot && crank.pot.where === 'hopper'), 'a tap on the crank hoists the tray',
         JSON.stringify(crank.pot)),
      ok(chute.paying != null, 'and a tap on the chute tips the tray out', `${chute.paying}`),
      ok(/gate/.test(names[0]) && /chute/.test(names[1]) && /crank/.test(names[2]),
         'each is named under the pointer', names.join(' | '))
    ];
  }]
];

