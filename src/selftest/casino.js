// The casino on the page: the bench row builds it, a click on a desk and a
// finger's tap on a phone each work every button on the panel and the arm,
// and the tooltip names the buttons and nothing else on the building.
//
// What the hand *does* is the node tier's (test/casino.test.mjs, handful.test.mjs);
// this is the pointer and the page. 3 groups, in the order they have always
// run in -- see src/selftest.js, which is where the order lives.

import { sleep, newRun, settle, state, buildShopFromTest, ok, run, runUntil, raf, canvas, point, touch, finger, P } from './kit.js';

const phone = on => window.__coarse(on ? true : null);
const frames = async n => { for (let i = 0; i < n; i++) { run(1 / 60); await raf(); } };
const tipText = () => { const t = document.getElementById('tip'); return t && !t.hidden ? t.textContent.trim() : ''; };
// a hand played through: the stake in, the floor open, the bins paid
const played = () => runUntil(() => !state().armed && !state().pouring && !state().hoisting && !state().letting, 60);

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
// where a button or the arm is on screen
const onScreen = ({ x, y }) => { const t = state(); return [(x - t.camX) * t.zoom, (y - t.camY) * t.zoom]; };
const buttonAt = key => onScreen(window.__buttonAt(key));
const armAt = () => { const l = window.__leverAt('casino-gate'); return onScreen({ x: l.x, y: l.y - P * 4 }); };

export const TESTS = [
  ['the casino takes a click on each button and on the arm', async () => {
    const s = await atTheCasino();
    const rows = window.__rows().filter(r => ['chip', 'stakedust', 'letgo', 'bank', 'ride'].includes(r.key));
    const held = s.stored;
    const click = async ([x, y]) => { point('pointerdown', x, y); point('pointerup', x, y); await frames(1); };
    await click(buttonAt('chip-10'));
    const ten = state();
    await click(buttonAt('chip-100'));
    const hundred = state();
    await click(armAt());
    const pulled = state();
    played();
    const paid = state();
    const tray = paid.pot ? paid.pot.on : 0;
    await click(buttonAt('bank'));
    const banked = state();
    runUntil(() => state().paying == null && state().tableAir === 0, 30);
    const landed = state();
    await click(buttonAt('same'));
    const again = state();
    played();
    newRun();
    await sleep(300);
    return [
      ok(s.casinoOpen, 'the bench row builds it', `casino at ${s.casinoX}`),
      ok(rows.length === 0, 'and it has no rows on any board', rows.map(r => r.key).join(',')),
      ok(ten.chip === 0 && ten.nextStake === 10 && hundred.chip === 1 && hundred.nextStake === 100,
         'a click on a chip picks it and the window says so', `${ten.nextStake} then ${hundred.nextStake}`),
      ok(pulled.armed && pulled.pot && pulled.pot.stake === 100, 'a click on the arm stakes it', JSON.stringify(pulled.pot)),
      ok(paid.stored === held - 100 && (!paid.pot || paid.pot.where === 'tray'), 'and the hand plays out to the tray, the purse down by the stake',
         `${paid.stored} vs ${held - 100}`),
      ok(tray === 0 || (banked.pot === null && banked.paying != null), 'a click on the sack takes the tray', `${tray} to take`),
      ok(landed.stored === held - 100 + tray, 'and the counter is paid the pot as it lands', `${landed.stored} vs ${held - 100 + tray}`),
      ok(again.armed && again.pot && again.pot.stake === 100 && again.chip === 1, 'a click on same bet plays the last hand again',
         JSON.stringify(again.pot))
    ];
  }],

  ['a finger taps the panel, and a finger on it never scrolls the yard', async () => {
    const s = await atTheCasino();
    phone(true);
    await frames(1);
    const sc = document.getElementById('scroller');
    const camX = state().camX, scrollX = sc.scrollLeft;
    const [bx, by] = buttonAt('chip-10');
    // the platform asks at touchstart: a finger on a button is the game's
    const said = touch('touchstart', canvas(), bx, by);
    finger('pointerdown', 1, bx, by);
    await frames(2);
    const pressed = state(), midScroll = sc.scrollLeft;
    finger('pointerup', 1, bx, by);
    touch('touchend', canvas(), bx, by);
    await frames(1);
    const tapped = state();
    const [ax, ay] = armAt();
    finger('pointerdown', 1, ax, ay);
    finger('pointerup', 1, ax, ay);
    await frames(1);
    const pulled = state();
    played();
    // and a finger on the sky beside it is left to the platform
    const skySaid = touch('touchstart', canvas(), bx, by - 400);
    touch('touchend', canvas(), bx, by - 400);
    phone(false);
    newRun();
    await sleep(300);
    return [
      ok(said, 'the touch on a button is claimed at touchstart, so the platform never scrolls it'),
      ok(pressed.camX === camX && midScroll === scrollX, 'the yard did not move under the press',
         `${pressed.camX} vs ${camX}, ${midScroll} vs ${scrollX}`),
      ok(pressed.chip === s.chip && tapped.chip === 0, 'the chip is picked at the release, not the press', `${tapped.chip}`),
      ok(pulled.armed && pulled.pot && pulled.pot.stake === 10, 'and a tap on the arm plays it', JSON.stringify(pulled.pot)),
      ok(!skySaid, 'while a finger on the sky is still the platform\'s to scroll')
    ];
  }],

  ['the tooltip names the buttons and nothing else on the building', async () => {
    await atTheCasino();
    const tips = {};
    for (const key of ['coin-dust', 'chip-10', 'chip-100', 'chip-1k', 'chip-all', 'same', 'bank']) {
      const [x, y] = buttonAt(key);
      point('pointermove', x, y, 0);
      await frames(2);
      tips[key] = tipText();
    }
    const [ax, ay] = armAt();
    point('pointermove', ax, ay, 0);
    await frames(2);
    const arm = tipText();
    const w = window.__buttonAt('window');
    const [wx, wy] = onScreen(w);
    point('pointermove', wx, wy, 0);
    await frames(2);
    const win = tipText();
    newRun();
    await sleep(300);
    return [
      ok(tips['coin-dust'] === 'pebbles' && tips['chip-10'] === '10' && tips['chip-100'] === '100' && tips['chip-1k'] === '1000' && tips['chip-all'] === 'all in',
         'each coin and chip is named by its value', JSON.stringify(tips)),
      ok(tips.same === 'same bet' && tips.bank === 'bank', 'and same bet and bank by what they do', `${tips.same} | ${tips.bank}`),
      ok(!/arm|window|stake/.test(arm + win), 'the arm and the window say nothing', `"${arm}" | "${win}"`)
    ];
  }]
];
