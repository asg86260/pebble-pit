// The two of them dressed (wardrobe.js; DESIGN.md, "What the two of them
// wear"): what the chosen head item does to a station hat, read off the
// glass, and the picker worked as a player works it -- by the mouse on its
// buttons, and by a pad on the page (padpage.js) with left and right on a
// row stepping its item and the shoulders for her and him.
//
// The pad is a stand-in for the browser's, as in selftest/pad.js: the page's
// own frame reads it exactly as it reads a real one.

import { ok, raf, run, canvas, onScreen } from './kit.js';
import { S } from '../state.js';
import { P, WORKER } from '../config.js';
import { draw } from '../render.js';
import { darkPage } from '../ink.js';
import { namePair, outfitOf, wear, DEFAULTS, HEAD } from '../wardrobe.js';
import { wearing } from '../kit.js';
import { TYPE } from '../jobs.js';
import { offerDress } from '../settings.js';

const frames = async n => { for (let i = 0; i < n; i++) await raf(); };

// Whether the glass is ink at a world point: the device pixel under it, on
// an even row (the press darkens the odd ones), ink being the dark end on
// the light page and the light end on the dark.
function inkAt(wx, wy) {
  const [sx, sy] = onScreen(wx, wy), k = S.dpr;
  let y = Math.round(sy * k);
  if (y % 2) y++;
  const d = canvas().getContext('2d').getImageData(Math.round(sx * k), y, 1, 1).data;
  const lum = (d[0] + d[1] + d[2]) / 3;
  return darkPage ? lum > 128 : lum < 128;
}

// The held sheet up on the picker, by its buttons: escape, settings, the row.
async function openPicker() {
  dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  await frames(2);
  document.getElementById('settingsbtn').click();
  document.getElementById('wardrobebtn').click();
  await frames(3);
}
async function closePicker() {
  dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  await frames(2);
}
const shownText = slot => document.querySelector(`.wardrow[data-slot="${slot}"] .wardval`)?.textContent;
const nextKey = (list, key, by = 1) => {
  const i = list.findIndex(it => it.key === key);
  return list[(i + by + list.length) % list.length].key;
};

// The pad, as selftest/pad.js holds it.
const BUTTONS = { a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, lt: 6, rt: 7, view: 8, menu: 9,
                  l3: 10, r3: 11, up: 12, down: 13, left: 14, right: 15 };
const fake = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD)', connected: true, mapping: 'standard',
               buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] };
const own = Object.getOwnPropertyDescriptor(navigator, 'getGamepads');
function plugIn() {
  for (const b of fake.buttons) { b.pressed = false; b.value = 0; }
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [fake] });
  window.__motion(true);
}
function unplug() {
  window.__pad.off();
  if (own) Object.defineProperty(navigator, 'getGamepads', own);
  else delete navigator.getGamepads;
  window.__motion(null);
}
async function press(name) {
  const b = fake.buttons[BUTTONS[name]];
  b.pressed = true; b.value = 1;
  await frames(2);
  b.pressed = false; b.value = 0;
  await frames(2);
}
const rowOf = el => el?.closest?.('.wardrow')?.dataset.slot || null;

export const TESTS = [
  // The owner's vote on the mock: the chosen headwear replaces the station
  // hat. A farmhand in a sun hat named him, read with nothing chosen (the
  // brim's middle cell over his head is ink) and with the ears (two cells
  // either side, nothing over the middle: no brim under them), against the
  // glass with nobody drawn there.
  ['wardrobe: his chosen head item is drawn in place of his station hat', async () => {
    window.__crew(0, 0, 0, 3);
    window.__kit({ growers: 3 });
    run(6);
    const w = S.workers.find(o => o.type === TYPE.FARM && wearing(o) === 'brim');
    if (!w) return [ok(false, 'a farmhand in a sun hat', S.workers.map(o => `${o.type}:${wearing(o)}`).join(' '))];
    namePair('him', w);
    // drawn alone, stood on the bare floor left of the rock: the plots' crops
    // stand as high as a head, and nothing else is to be read there
    const all = S.workers, was = { x: w.x, y: w.y };
    const x = Math.round(S.cx - 400), y = Math.round(S.groundY - WORKER);
    window.__look(x - S.viewW / 2);
    const read = head => {
      wear('him', { head });
      Object.assign(w, { x, y, lunge: 0 });
      S.workers = [w];
      draw();
      S.workers = all;
      return { mid: inkAt(x + WORKER / 2, y - P / 2), side: inkAt(x + P / 2, y - P / 2) };
    };
    S.workers = [];
    draw();
    S.workers = all;
    const ground = { mid: inkAt(x + WORKER / 2, y - P / 2), side: inkAt(x + P / 2, y - P / 2) };
    const bare = read('none'), ears = read('ears');
    Object.assign(w, was);
    wear('him', DEFAULTS.him);
    return [
      ok(!ground.mid && !ground.side, 'nothing else is drawn over his head', JSON.stringify(ground)),
      ok(bare.mid && bare.side, 'with nothing chosen he wears the sun hat', JSON.stringify(bare)),
      ok(ears.side && !ears.mid, 'with the ears chosen they are drawn and the sun hat is not', JSON.stringify(ears))
    ];
  }],

  ['wardrobe: the picker by the mouse: a row\'s next, her and him, the roll, the close-up', async () => {
    wear('her', DEFAULTS.her); wear('him', DEFAULTS.him);
    run(0.5);
    await openPicker();
    const page = document.getElementById('wardrobe');
    const up = !page.hidden && page.getClientRects().length > 0;
    document.getElementById('ward-head-next').click();
    const stepped = outfitOf('her').head, said = shownText('head');
    document.getElementById('wardhim').click();
    const himOn = document.getElementById('wardhim').classList.contains('on');
    document.getElementById('ward-back-prev').click();
    const himBack = outfitOf('him').back, herBack = outfitOf('her').back;
    let rolled = false;
    const was = JSON.stringify(outfitOf('him'));
    for (let i = 0; i < 6 && !rolled; i++) { document.getElementById('wardroll').click(); rolled = JSON.stringify(outfitOf('him')) !== was; }
    // the close-up's left half is her
    const big = page.querySelector('canvas');
    const r = big.getBoundingClientRect();
    big.dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width * 0.25, clientY: r.top + r.height / 2, bubbles: true }));
    const herOn = document.getElementById('wardher').classList.contains('on');
    document.getElementById('wardrobeback').click();
    const backTo = !document.getElementById('wardrobebtn').hidden;
    await closePicker();
    wear('her', DEFAULTS.her); wear('him', DEFAULTS.him);
    return [
      ok(up, 'the settings row opens the picker'),
      ok(stepped === nextKey(HEAD, DEFAULTS.her.head) && said && said.length > 0,
         'next on the head row puts the next head item on her, and the row says it', `${stepped} "${said}"`),
      ok(himOn && himBack === 'flag' && herBack === DEFAULTS.her.back, 'the him tab dresses him, not her',
         `${himOn} ${himBack} ${herBack}`),
      ok(rolled, 'the roll dresses the one being dressed'),
      ok(herOn, 'a press on her half of the close-up picks her'),
      ok(backTo, 'back is the settings page')
    ];
  }],

  // A new yard's offer (settings.js, `offerDress`): the yard held on the
  // picker, a skip that puts the defaults back, done that lets the yard go;
  // and asked again it is not offered twice.
  ['wardrobe: a new yard offers the picker once; done lets the yard go, skip puts the defaults back', async () => {
    window.__reset();
    run(0.5);
    S.dressOffered = false;
    offerDress(true);
    await frames(3);
    const page = document.getElementById('wardrobe');
    const held = S.paused && !page.hidden && page.getClientRects().length > 0;
    const skip = document.getElementById('wardskip');
    const skipShown = !skip.hidden;
    const doneSays = document.getElementById('wardrobeback').textContent;
    document.getElementById('ward-head-next').click();
    const changed = outfitOf('her').head !== DEFAULTS.her.head;
    skip.click();
    await frames(2);
    const skipped = !S.paused && outfitOf('her').head === DEFAULTS.her.head;
    offerDress(true);
    await frames(2);
    const again = S.paused;
    // and once more, a fresh yard, kept with done
    S.dressOffered = false;
    offerDress(true);
    await frames(2);
    document.getElementById('ward-head-next').click();
    document.getElementById('wardrobeback').click();
    await frames(2);
    const kept = !S.paused && outfitOf('her').head !== DEFAULTS.her.head && S.dressOffered;
    wear('her', DEFAULTS.her);
    return [
      ok(held && skipShown, 'the yard is held on the picker, with a skip', `${S.paused} ${skipShown}`),
      ok(doneSays && doneSays !== document.getElementById('settingsback').textContent, 'its way off says done', doneSays),
      ok(changed && skipped, 'skip lets the yard go in the defaults'),
      ok(!again, 'it is offered once'),
      ok(kept, 'done lets the yard go in what was chosen')
    ];
  }],

  ['wardrobe: the picker by a pad: up and down the rows, left and right the items, LB and RB', async () => {
    wear('her', DEFAULTS.her); wear('him', DEFAULTS.him);
    run(0.5);
    plugIn();
    try {
      await press('b');                               // wakes the pad
      await openPicker();
      await frames(2);
      // up the page to the head row
      for (let i = 0; i < 12 && rowOf(window.__pad.page()) !== 'head'; i++)
        await press(rowOf(window.__pad.page()) ? 'up' : 'down');
      const onHead = rowOf(window.__pad.page()) === 'head';
      await press('right');
      const head = outfitOf('her').head;
      const stayed = rowOf(window.__pad.page()) === 'head';
      await press('down');
      const onFace = rowOf(window.__pad.page()) === 'face';
      await press('left');
      const face = outfitOf('her').face;
      await press('rb');
      const him = document.getElementById('wardhim').classList.contains('on');
      await press('right');
      const hisFace = outfitOf('him').face;
      await press('lb');
      const her = document.getElementById('wardher').classList.contains('on');
      const was = JSON.stringify(outfitOf('her'));
      let rolled = false;
      for (let i = 0; i < 6 && !rolled; i++) { await press('y'); rolled = JSON.stringify(outfitOf('her')) !== was; }
      await press('b');                               // back, to settings
      const settings = !document.getElementById('wardrobebtn').hidden;
      await closePicker();
      return [
        ok(onHead, 'the d-pad reaches the head row', rowOf(window.__pad.page())),
        ok(head === nextKey(HEAD, DEFAULTS.her.head) && stayed, 'right steps her head item and keeps the row', head),
        ok(onFace, 'down is the next row'),
        ok(face !== DEFAULTS.her.face, 'left steps that row back', face),
        ok(him && hisFace !== DEFAULTS.him.face, 'RB dresses him', `${him} ${hisFace}`),
        ok(her, 'LB is her again'),
        ok(rolled, 'Y rolls her outfit'),
        ok(settings, 'B goes back to settings')
      ];
    } finally {
      unplug();
      wear('her', DEFAULTS.her); wear('him', DEFAULTS.him);
    }
  }],
];
