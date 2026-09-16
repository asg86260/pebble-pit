// The casino on the page: the bench row builds it, a press-and-hold on the
// arm pours the stake -- with the mouse on a desk, with a finger on a phone,
// where a hold on the arm never scrolls the page -- and a click or a tap on
// the sign drops it. Nothing on the building has a tooltip.
//
// What the hand *does* is the node tier's (test/casino.test.mjs, handful.test.mjs);
// this is the pointer and the page. 3 groups, in the order they have always
// run in -- see src/selftest.js, which is where the order lives.

import { sleep, newRun, settle, state, buildShopFromTest, ok, run, runUntil, raf, canvas, point, touch, finger, P } from './kit.js';

const phone = on => window.__coarse(on ? true : null);
const frames = async n => { for (let i = 0; i < n; i++) { run(1 / 60); await raf(); } };
const tipText = () => { const t = document.getElementById('tip'); return t && !t.hidden ? t.textContent.trim() : ''; };
// a hand played through: the pile drained, the pebbles down, the bins paid
const played = () => runUntil(() => !state().letting && !state().pouring, 60);

// The casino bought through the bench and stood up, the view on it.
async function atTheCasino() {
  newRun();
  await settle();
  window.__grant({ cores: 20 });
  window.__give(2000);
  window.__dig(23);
  window.__invest();
  buildShopFromTest();
  document.querySelector('#shop button[data-key="unlockcasino"]').click();
  window.__finish();
  buildShopFromTest();
  window.__casinoStakes(2000);
  const s = state();
  window.__look(s.casinoX + 100);
  await frames(2);
  return state();
}
// where the arm and the sign are on screen
const onScreen = ({ x, y }) => { const t = state(); return [(x - t.camX) * t.zoom, (y - t.camY) * t.zoom]; };
const armAt = () => { const l = window.__leverAt('casino-gate'); return onScreen({ x: l.x, y: l.y - P * 4 }); };
const signAt = () => onScreen(window.__signAt());

export const TESTS = [
  ['the casino pours while the mouse holds the arm, and a click on the sign drops it', async () => {
    const s = await atTheCasino();
    const rows = window.__rows().filter(r => ['chip', 'stakedust', 'letgo', 'bank', 'ride'].includes(r.key));
    const held = s.stored;
    const [ax, ay] = armAt();
    // hovering the arm says nothing; a press on it pours
    point('pointermove', ax, ay, 0);
    await frames(2);
    const armTip = tipText();
    point('pointerdown', ax, ay);
    await frames(1);
    const pressed = state();
    run(1);
    await frames(1);
    const holding = state();
    point('pointerup', ax + 40, ay + 60);          // let go somewhere else entirely
    await frames(1);
    const released = state();
    runUntil(() => !state().pouring, 30);
    const stood = state();
    // and the sign, clicked, drops it; hovering it says nothing either
    const [sx, sy] = signAt();
    point('pointermove', sx, sy, 0);
    await frames(2);
    const signTip = tipText();
    point('pointerdown', sx, sy);
    point('pointerup', sx, sy);
    await frames(1);
    const dropped = state();
    played();
    const paid = state();
    newRun();
    await sleep(300);
    return [
      ok(s.casinoOpen, 'the bench row builds it', `casino at ${s.casinoX}`),
      ok(rows.length === 0, 'and it has no rows on any board', rows.map(r => r.key).join(',')),
      ok(pressed.holding && holding.holding && holding.pot && holding.pot.stake > 0,
         'the mouse held on the arm pours the stake', `${holding.pot && holding.pot.stake} after a second`),
      ok(!released.holding && released.pot && released.pot.stake === holding.pot.stake,
         'letting go, wherever the pointer is, keeps the stake', JSON.stringify(released.pot)),
      ok(stood.stored === held - stood.pot.stake && stood.canDrop, 'the purse is down by it and the sign is live',
         `${stood.stored} vs ${held} - ${stood.pot.stake}`),
      // (the building's own one-word label, "the casino", may answer over the sign; no control is named)
      ok(!/arm|sign|drop|stake/.test(armTip + signTip), 'neither the arm nor the sign is named under the pointer', `"${armTip}" | "${signTip}"`),
      ok(dropped.letting, 'and a click on the sign opens the floor'),
      ok(!paid.pot && (paid.paying != null || paid.hand), 'so the hand plays out and the pay runs out of the foot')
    ];
  }],

  ['a finger held on the arm pours and never scrolls the yard, and a tap on the sign drops', async () => {
    const s = await atTheCasino();
    phone(true);
    await frames(1);
    const sc = document.getElementById('scroller');
    const camX = state().camX, scrollX = sc.scrollLeft;
    const [ax, ay] = armAt();
    // the platform asks at touchstart: a finger on the arm is the game's
    const said = touch('touchstart', canvas(), ax, ay);
    finger('pointerdown', 1, ax, ay);
    await frames(2);
    run(1);
    await frames(1);
    const holding = state(), midScroll = sc.scrollLeft;
    finger('pointerup', 1, ax, ay);
    touch('touchend', canvas(), ax, ay);
    await frames(1);
    const released = state();
    runUntil(() => !state().pouring, 30);
    const [sx, sy] = signAt();
    const signSaid = touch('touchstart', canvas(), sx, sy);
    finger('pointerdown', 1, sx, sy);
    finger('pointerup', 1, sx, sy);
    touch('touchend', canvas(), sx, sy);
    await frames(1);
    const dropped = state();
    played();
    // and a finger on the sky beside it is left to the platform
    const skySaid = touch('touchstart', canvas(), ax, ay - 400);
    touch('touchend', canvas(), ax, ay - 400);
    phone(false);
    newRun();
    await sleep(300);
    return [
      ok(said, 'the touch on the arm is claimed at touchstart, so the platform never scrolls it'),
      ok(holding.holding && holding.pot && holding.pot.stake > 0, 'the finger held on the arm pours', `${holding.pot && holding.pot.stake}`),
      ok(holding.camX === camX && midScroll === scrollX, 'the yard did not move under the hold',
         `${holding.camX} vs ${camX}, ${midScroll} vs ${scrollX}`),
      ok(!released.holding && released.pot && released.pot.stake === holding.pot.stake, 'lifting the finger keeps the stake'),
      ok(signSaid && dropped.letting, 'a tap on the sign is claimed and drops it'),
      ok(!skySaid, 'while a finger on the sky is still the platform\'s to scroll')
    ];
  }],

  ['the sign is nothing to press with no stake in the funnel', async () => {
    await atTheCasino();
    const [sx, sy] = signAt();
    point('pointerdown', sx, sy);
    point('pointerup', sx, sy);
    await frames(1);
    const idle = state();
    phone(true);
    const signSaid = touch('touchstart', canvas(), sx, sy);
    touch('touchend', canvas(), sx, sy);
    phone(false);
    newRun();
    await sleep(300);
    return [
      ok(!idle.letting && !idle.pot, 'a click on the empty sign does nothing'),
      ok(!signSaid, 'and a finger on it is the platform\'s to scroll')
    ];
  }]
];
