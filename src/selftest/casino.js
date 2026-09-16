// The casino on the page: the bench row builds it, a click on the dust pile
// on a desk and a finger's tap on a phone each stake a tenth of the purse --
// a finger on the pile never scrolls the yard -- a tap on each control works
// it, and nothing on the building says a word under the pointer.
//
// What the hand *does* is the node tier's (test/casino.test.mjs, handful.test.mjs);
// this is the pointer and the page. 3 groups, in the order they have always
// run in -- see src/selftest.js, which is where the order lives.

import { sleep, newRun, settle, state, buildShopFromTest, ok, run, runUntil, raf, canvas, point, touch, finger, P } from './kit.js';
import { STAKE_TAP_SHARE, STAKE_TAP_MIN } from '../config.js';

const phone = on => window.__coarse(on ? true : null);
const frames = async n => { for (let i = 0; i < n; i++) { run(1 / 60); await raf(); } };
const tipText = () => { const t = document.getElementById('tip'); return t && !t.hidden ? t.textContent.trim() : ''; };
const share = purse => Math.min(purse, Math.max(STAKE_TAP_MIN, Math.round(purse * STAKE_TAP_SHARE)));
// the stream landed and the pour settled
const streamed = () => runUntil(() => !state().staking && !state().inFlight && !state().pouring, 30);

// The casino bought through the bench and stood up, the piles standing, the
// view on it: a point on the dust pile's sand, on screen.
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
  const t = state();
  const spot = window.__stakeAt('dust');
  const sx = [(spot.x - t.camX) * t.zoom, (spot.y - t.camY) * t.zoom];
  return { s: t, sx };
}

// A point on each control on screen: up the arm's stem, on the button's
// cap, on the crank's hub.
const controlAt = key => {
  const l = window.__leverAt(key); const t = state();
  const dy = key === 'casino-gate' ? -P * 4 : key === 'casino-chute' ? -P * 4 : 0;
  const dx = key === 'casino-chute' ? -P * 4 : 0;
  return [(l.x + dx - t.camX) * t.zoom, (l.y + dy - t.camY) * t.zoom];
};

export const TESTS = [
  ['the casino takes a click on the dust pile as a tenth of the purse', async () => {
    const { s, sx } = await atTheCasino();
    const rows = window.__rows().filter(r => ['chip', 'stakedust', 'letgo', 'bank', 'ride'].includes(r.key));
    const held = s.stored;
    // hovering the pile says nothing; a click on it stakes
    point('pointermove', sx[0], sx[1], 0);
    await frames(2);
    const pileTip = tipText();
    point('pointerdown', sx[0], sx[1]);
    point('pointerup', sx[0], sx[1]);
    await frames(1);
    const tapped = state();
    streamed();
    const stood = state();
    // and the arm, clicked, plays the hand; hovering it says nothing either
    const gx = controlAt('casino-gate');
    point('pointermove', gx[0], gx[1], 0);
    await frames(2);
    const armTip = tipText();
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
      ok(tapped.staking > 0 || tapped.inFlight > 0 || (tapped.pot && tapped.pot.on > 0),
         'a click on the pile sets a tenth of the purse streaming', `${tapped.staking} to lift, ${tapped.inFlight} flying`),
      ok(stood.pot && stood.pot.on === share(held) && stood.stored === held - share(held),
         'which lands in the bowl as the pot, out of the purse', JSON.stringify(stood.pot)),
      ok(stood.table > 0 && !stood.pouring, 'and stands in the funnel', `${stood.table}`),
      ok(pileTip === '' && armTip === '', 'neither the pile nor the arm says anything under the pointer',
         `"${pileTip}" | "${armTip}"`),
      ok(pulled.letting, 'and a click on the arm opens the floor'),
      ok(paid.pot && paid.pot.where === 'tray', 'so the hand plays out to the tray')
    ];
  }],

  ['a finger on the pile taps it and never scrolls the yard', async () => {
    const { s, sx } = await atTheCasino();
    const held = s.stored;
    phone(true);
    await frames(1);
    const sc = document.getElementById('scroller');
    const camX = state().camX, scrollX = sc.scrollLeft;
    // the platform asks at touchstart: a finger on the pile is the game's
    const said = touch('touchstart', canvas(), sx[0], sx[1]);
    finger('pointerdown', 1, sx[0], sx[1]);
    await frames(2);
    const pressed = state(), midScroll = sc.scrollLeft;
    finger('pointerup', 1, sx[0], sx[1]);
    touch('touchend', canvas(), sx[0], sx[1]);
    await frames(1);
    const tapped = state();
    streamed();
    const stood = state();
    // and a finger on the sky beside it is left to the platform
    const skySaid = touch('touchstart', canvas(), sx[0], sx[1] - 200);
    touch('touchend', canvas(), sx[0], sx[1] - 200);
    phone(false);
    newRun();
    await sleep(300);
    return [
      ok(said, 'the touch on the pile is claimed at touchstart, so the platform never scrolls it'),
      ok(pressed.camX === camX && midScroll === scrollX, 'the yard did not move under the press',
         `${pressed.camX} vs ${camX}, ${midScroll} vs ${scrollX}`),
      ok(!pressed.staking && (tapped.staking > 0 || tapped.inFlight > 0 || (tapped.pot && tapped.pot.on > 0)),
         'the stake goes at the release, not the press', `${tapped.staking} to lift`),
      ok(stood.pot && stood.pot.on === share(held), 'and it is a tenth of the purse', JSON.stringify(stood.pot)),
      ok(!skySaid, 'while a finger on the sky is still the platform\'s to scroll')
    ];
  }],

  ['a tap on each control works it', async () => {
    const { s } = await atTheCasino();
    phone(true);
    window.__casinoStake(1);
    await frames(1);
    const tapLever = async key => {
      const [x, y] = controlAt(key);
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
    // and on a desk, none of them says a word under the pointer (the crank's
    // hub is on the wall, where the building's own one-word label stands)
    const tips = [];
    for (const key of ['casino-gate', 'casino-chute', 'casino-crank']) {
      const [x, y] = controlAt(key);
      point('pointermove', x, y, 0);
      await frames(2);
      tips.push(tipText());
    }
    newRun();
    await sleep(300);
    return [
      ok(arm.letting, 'a tap on the arm opens the floor'),
      ok(crank.hoisting || (crank.pot && crank.pot.where === 'hopper'), 'a tap on the crank hoists the tray',
         JSON.stringify(crank.pot)),
      ok(button.paying != null, 'and a tap on the button tips the tray out', `${button.paying}`),
      ok(tips.every(t => !/arm|bank|crank/.test(t)), 'and none of them has a tooltip', tips.join(' | '))
    ];
  }]
];
