// The casino on the page: the bench row builds it, grains are swept off the
// dust pile and dragged to the hopper with the left button on a desk and
// with a finger on a phone -- a finger on the pile never scrolls the yard --
// and a tap on each control works it and the tooltip names it.
//
// What the hand *does* is the node tier's (test/casino.test.mjs, handful.test.mjs);
// this is the pointer and the page. 3 groups, in the order they have always
// run in -- see src/selftest.js, which is where the order lives.

import { sleep, newRun, settle, state, buildShopFromTest, ok, run, runUntil, raf, canvas, point, touch, finger, P } from './kit.js';

const phone = on => window.__coarse(on ? true : null);
const frames = async n => { for (let i = 0; i < n; i++) { run(1 / 60); await raf(); } };
const tipText = () => { const t = document.getElementById('tip'); return t && !t.hidden ? t.textContent.trim() : ''; };

// The casino bought through the bench and stood up, the piles standing, the
// view on it: a point on the dust pile's sand and the rim, on screen.
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
  const spot = window.__stakeAt('dust'), rim = window.__rim();
  const sx = [(spot.x - t.camX) * t.zoom, (spot.y - t.camY) * t.zoom];
  const rx = [(rim.x - t.camX) * t.zoom, (rim.y - t.camY) * t.zoom];
  return { s: t, sx, rx };
}

// A drag from the pile to the rim in a few steps, paused before letting go
// so it is a drop and not a throw. `move` is the pointer for the desk or the
// finger for the phone.
async function dragToRim(sx, rx, move) {
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    move(sx[0] + (rx[0] - sx[0]) * i / steps, sx[1] + (rx[1] - sx[1]) * i / steps);
    await sleep(16); await frames(1);
  }
  await sleep(150);
}

export const TESTS = [
  ['the casino takes grains swept off the pile and dragged to the hopper', async () => {
    const { s, sx, rx } = await atTheCasino();
    const rows = window.__rows().filter(r => ['chip', 'stakedust', 'letgo', 'bank', 'ride'].includes(r.key));
    const held = s.stored;
    const worth = s.stakes[0].worth;
    // the left button held on the pile, dragged to the rim, let go there
    point('pointerdown', sx[0], sx[1]);
    await frames(1);
    const lifted = state();
    await dragToRim(sx, rx, (x, y) => point('pointermove', x, y));
    point('pointerup', rx[0], rx[1]);
    await frames(1);
    runUntil(() => state().chips === 0 && !state().inHand, 5);
    const dropped = state();
    runUntil(() => !state().pouring, 30);
    const stood = state();
    // and the arm, clicked, plays the hand
    const arm = window.__leverAt('casino-gate');
    const gx = [(arm.x - stood.camX) * stood.zoom, (arm.y - P * 4 - stood.camY) * stood.zoom];
    point('pointermove', gx[0], gx[1], 0);
    await frames(1);
    const named = tipText();
    point('pointerdown', gx[0], gx[1]);
    point('pointerup', gx[0], gx[1]);
    await frames(1);
    const pulled = state();
    runUntil(() => !state().letting && !state().pouring, 40);
    const paid = state();
    newRun();
    await sleep(300);
    return [
      ok(s.casinoOpen, 'the bench row builds it', `casino at ${s.casinoX}`),
      ok(rows.length === 0, 'and it has no rows on any board', rows.map(r => r.key).join(',')),
      ok(lifted.held > 0 && lifted.inHand === lifted.held,
         'the left button held on the pile sweeps grains of it on to the cursor', `${lifted.held} held, ${lifted.inHand} of the pile`),
      ok(!dropped.inHand && dropped.pot && dropped.pot.on === worth * lifted.held && dropped.stored === held - worth * lifted.held,
         'let go over the rim they are the pot, out of the purse', JSON.stringify(dropped.pot)),
      ok(stood.table > 0 && !stood.pouring, 'and it stands in the funnel', `${stood.table}`),
      ok(/arm/.test(named), 'hovering the arm names it', named),
      ok(pulled.letting, 'and a click on it opens the floor'),
      ok(paid.pot && paid.pot.where === 'tray', 'so the hand plays out to the tray')
    ];
  }],

  ['a finger on the pile sweeps it and never scrolls the yard', async () => {
    const { s, sx, rx } = await atTheCasino();
    const worth = s.stakes[0].worth;
    phone(true);
    await frames(1);
    const sc = document.getElementById('scroller');
    const camX = state().camX, scrollX = sc.scrollLeft;
    // the platform asks at touchstart: a finger on the pile is the game's
    const said = touch('touchstart', canvas(), sx[0], sx[1]);
    finger('pointerdown', 1, sx[0], sx[1]);
    await frames(1);
    const lifted = state();
    await dragToRim(sx, rx, (x, y) => finger('pointermove', 1, x, y));
    const mid = state(), midScroll = sc.scrollLeft;
    finger('pointerup', 1, rx[0], rx[1]);
    touch('touchend', canvas(), rx[0], rx[1]);
    await frames(1);
    runUntil(() => state().chips === 0 && !state().inHand, 5);
    const dropped = state();
    // and a finger on the sky beside it is left to the platform
    const skySaid = touch('touchstart', canvas(), sx[0], sx[1] - 200);
    touch('touchend', canvas(), sx[0], sx[1] - 200);
    phone(false);
    newRun();
    await sleep(300);
    return [
      ok(said, 'the touch on the pile is claimed at touchstart, so the platform never scrolls it'),
      ok(lifted.held > 0 && lifted.inHand === lifted.held, 'and the finger has grains of the pile', `${lifted.held} held`),
      ok(mid.camX === camX && midScroll === scrollX, 'the yard did not move under the drag',
         `${mid.camX} vs ${camX}, ${midScroll} vs ${scrollX}`),
      ok(!dropped.inHand && dropped.pot && dropped.pot.on === worth * lifted.held, 'and lifting the finger over the rim stakes them',
         JSON.stringify(dropped.pot)),
      ok(!skySaid, 'while a finger on the sky is still the platform\'s to scroll')
    ];
  }],

  ['a tap on each control works it and the tooltip names it', async () => {
    const { s } = await atTheCasino();
    phone(true);
    window.__casinoStake(5);
    await frames(1);
    // a point on each: up the arm's stem, on the button's cap, on the crank's hub
    const at = key => {
      const l = window.__leverAt(key); const t = state();
      const dy = key === 'casino-gate' ? -P * 4 : key === 'casino-chute' ? -P * 3 : 0;
      const dx = key === 'casino-chute' ? -P * 3 : 0;
      return [(l.x + dx - t.camX) * t.zoom, (l.y + dy - t.camY) * t.zoom];
    };
    const tapLever = async key => {
      const [x, y] = at(key);
      finger('pointerdown', 1, x, y);
      finger('pointerup', 1, x, y);
      await frames(1);
    };
    await tapLever('casino-gate');
    const arm = state();
    runUntil(() => !state().letting && !state().pouring, 40);
    await tapLever('casino-crank');
    const crank = state();
    runUntil(() => !state().hoisting && !state().pouring, 40);
    await tapLever('casino-gate');
    runUntil(() => !state().letting && !state().pouring, 40);
    await tapLever('casino-chute');
    const button = state();
    runUntil(() => !state().paying, 40);
    phone(false);
    // and on a desk, each is named under the pointer
    const names = [];
    for (const key of ['casino-gate', 'casino-chute', 'casino-crank']) {
      const [x, y] = at(key);
      point('pointermove', x, y, 0);
      await frames(1);
      names.push(tipText());
    }
    newRun();
    await sleep(300);
    return [
      ok(arm.letting, 'a tap on the arm opens the floor'),
      ok(crank.hoisting || (crank.pot && crank.pot.where === 'hopper'), 'a tap on the crank hoists the tray',
         JSON.stringify(crank.pot)),
      ok(button.paying != null, 'and a tap on the button tips the tray out', `${button.paying}`),
      ok(names[0] === 'the arm' && names[1] === 'bank it' && names[2] === 'the crank',
         'each is named under the pointer', names.join(' | '))
    ];
  }]
];
