// The two of them (wardrobe.js; DESIGN.md, "What the two of them wear" and
// "Who you are"): what the chosen head item does to a station hat, read off
// the glass, and the page worked as a player works it -- by the mouse and
// the keyboard on its buttons and its name field, and by a pad on the page
// (padpage.js), with left and right on a row stepping it, the shoulders for
// you and your sqouse, the letter grid for a name, X a letter back and Y a
// row's roll; a new yard's four steps by both; and the name and the role
// held on the settings page once those steps are behind a yard.
//
// The pad is a stand-in for the browser's, as in selftest/pad.js: the page's
// own frame reads it exactly as it reads a real one.

import { ok, raf, run, canvas, onScreen } from './kit.js';
import { S } from '../state.js';
import { P, WORKER, NAME_MAX } from '../config.js';
import { draw } from '../render.js';
import { darkPage } from '../ink.js';
import { namePair, outfitOf, wear, DEFAULTS, HEAD, nameOf, roleOf, ROLE_START } from '../wardrobe.js';
import { CREW_NAMES } from '../crew/names.js';
import { objective } from '../objectives.js';
import { wearing } from '../kit.js';
import { TYPE } from '../jobs.js';
import { offerDress } from '../settings.js';

const frames = async n => { for (let i = 0; i < n; i++) await raf(); };
const byId = id => document.getElementById(id);
const up = el => !!el && !el.hidden && el.getClientRects().length > 0;

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
  byId('settingsbtn').click();
  byId('wardrobebtn').click();
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
// The name typed into its field as a keyboard does: the value, and the
// input event the field answers.
function typeName(text) {
  const el = byId('wardnamein');
  el.focus();
  el.value = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.blur();
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
const heading = () => byId('wardhead')?.textContent || '';
// A new yard, its steps up as a first boot puts them.
async function newYard() {
  window.__reset();
  run(0.5);
  S.dressOffered = false;
  offerDress(true);
  await frames(3);
}
const fresh = () => {
  wear('sqouse', DEFAULTS.sqouse); wear('you', DEFAULTS.you);
  S.selves = null;
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
  // hat. A farmhand in a sun hat named you, read with nothing chosen (the
  // brim's middle cell over the head is ink) and with the ears (two cells
  // either side, nothing over the middle: no brim under them), against the
  // glass with nobody drawn there.
  ['wardrobe: your chosen head item is drawn in place of your station hat', async () => {
    window.__crew(0, 0, 0, 3);
    window.__kit({ growers: 3 });
    run(6);
    const w = S.workers.find(o => o.type === TYPE.FARM && wearing(o) === 'brim');
    if (!w) return [ok(false, 'a farmhand in a sun hat', S.workers.map(o => `${o.type}:${wearing(o)}`).join(' '))];
    namePair('you', w);
    // drawn alone, stood on the bare floor left of the rock: the plots' crops
    // stand as high as a head, and nothing else is to be read there
    const all = S.workers, was = { x: w.x, y: w.y };
    const x = Math.round(S.cx - 400), y = Math.round(S.groundY - WORKER);
    window.__look(x - S.viewW / 2);
    const read = head => {
      wear('you', { head });
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
    wear('you', DEFAULTS.you);
    return [
      ok(!ground.mid && !ground.side, 'nothing else is drawn over the head', JSON.stringify(ground)),
      ok(bare.mid && bare.side, 'with nothing chosen it wears the sun hat', JSON.stringify(bare)),
      ok(ears.side && !ears.mid, 'with the ears chosen they are drawn and the sun hat is not', JSON.stringify(ears))
    ];
  }],

  ['wardrobe: the picker by the mouse: a row\'s next, the two tabs, a row\'s die, the roll, the close-up', async () => {
    fresh();
    run(0.5);
    await openPicker();
    const page = byId('wardrobe');
    const shown = up(page);
    byId('wardyou').click();
    byId('ward-head-next').click();
    const stepped = outfitOf('you').head, said = shownText('head');
    byId('wardsqouse').click();
    const sqOn = byId('wardsqouse').classList.contains('on');
    byId('ward-back-prev').click();
    const sqBack = outfitOf('sqouse').back, youBack = outfitOf('you').back;
    // the face row's own die: that row alone
    const before = { ...outfitOf('sqouse') };
    let faced = false;
    for (let i = 0; i < 8 && !faced; i++) {
      document.querySelector('.wardrow[data-slot="face"] .warddie').click();
      faced = outfitOf('sqouse').face !== before.face;
    }
    const others = ['head', 'neck', 'back', 'pattern'].every(k => outfitOf('sqouse')[k] === before[k]);
    let rolled = false;
    const was = JSON.stringify(outfitOf('sqouse'));
    for (let i = 0; i < 6 && !rolled; i++) { byId('wardroll').click(); rolled = JSON.stringify(outfitOf('sqouse')) !== was; }
    // the close-up's left half is you
    const big = page.querySelector('canvas');
    const r = big.getBoundingClientRect();
    big.dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width * 0.25, clientY: r.top + r.height / 2, bubbles: true }));
    const youOn = byId('wardyou').classList.contains('on');
    byId('wardrobeback').click();
    const backTo = !byId('wardrobebtn').hidden;
    await closePicker();
    fresh();
    return [
      ok(shown, 'the settings row opens the picker'),
      ok(stepped === nextKey(HEAD, DEFAULTS.you.head) && said && said.length > 0,
         'next on the head row puts the next head item on you, and the row says it', `${stepped} "${said}"`),
      ok(sqOn && sqBack === 'flag' && youBack === DEFAULTS.you.back, 'the sqouse tab dresses your sqouse, not you',
         `${sqOn} ${sqBack} ${youBack}`),
      ok(faced && others, 'a row\'s die rolls that row alone', JSON.stringify(outfitOf('sqouse'))),
      ok(rolled, 'randomize all dresses the one being dressed'),
      ok(youOn, 'a press on the left half of the close-up picks you'),
      ok(backTo, 'back is the settings page')
    ];
  }],

  // A new yard (settings.js, `offerDress`): the yard held on four steps.
  // Build who you are, by the field, the role's next and the name's die;
  // confirm your square; build your sqouse; the two of you; done lets the
  // yard go, and the story card names your sqouse as typed. A skip from the
  // first step lets it go in the defaults, and it is offered once.
  ['wardrobe: a new yard\'s steps by the mouse and the keyboard: who you are, your square, your sqouse, the two of you', async () => {
    fresh();
    await newYard();
    const page = byId('wardrobe');
    const held = S.paused && up(page);
    const first = heading();
    const skipShown = up(byId('wardskip')) && !up(byId('wardrobeback'));
    // the name die: a name off the crew's list
    document.querySelector('.wardname .warddie').click();
    const rolledName = nameOf('you');
    typeName('  Pat  o\'Neil-2<b>x</b>yz');
    const typed = nameOf('you');
    byId('ward-role-next').click();
    const role = roleOf('you');
    byId('wardnext').click();
    await frames(1);
    const second = heading(), confirmed = page.querySelector('.wardshown')?.textContent || '';
    byId('wardnext').click();
    await frames(1);
    const third = heading();
    typeName('lee');
    const sqName = nameOf('sqouse');
    byId('wardnext').click();
    await frames(1);
    const fourth = heading(), both = page.querySelector('.wardshown')?.textContent || '';
    byId('wardflowprev').click();
    const backed = heading() === third;
    byId('wardnext').click();
    byId('wardnext').click();
    await frames(2);
    const let_go = !S.paused && S.dressOffered && !S.naming;
    const card = objective()?.say || '';
    // the settings page now holds them
    await openPicker();
    const lockedField = byId('wardnamein').disabled && up(document.querySelector('.wardlock'));
    byId('ward-role-next').click();
    const kept = roleOf('you') === role;
    await closePicker();
    // and a skip from the first step, on another new yard
    fresh();
    await newYard();
    byId('ward-head-next').click();
    byId('wardskip').click();
    await frames(2);
    const skipped = !S.paused && outfitOf('you').head === DEFAULTS.you.head && !nameOf('you');
    offerDress(true);
    await frames(2);
    const again = S.paused;
    fresh();
    return [
      ok(held && first === 'build who you are' && skipShown, 'the yard is held on the first step, with a skip', `${S.paused} "${first}"`),
      ok(CREW_NAMES.includes(rolledName), 'the name\'s die draws a crew name', rolledName),
      ok(typed === 'Pat o\'Neil-2', 'a name keeps letters, digits, space, - and \', trimmed, to NAME_MAX',
         `"${typed}" ${[...typed].length}/${NAME_MAX}`),
      ok(role !== ROLE_START.you, 'next on the role row steps it', role),
      ok(second === 'confirm your square' && confirmed.includes('Pat o\'Neil-2'), 'the second step shows your square named', `"${second}" "${confirmed}"`),
      ok(third === 'build your sqouse' && sqName === 'lee', 'the third builds your sqouse', `"${third}" ${sqName}`),
      ok(fourth === 'the two of you' && both.includes('lee') && both.includes('Pat'), 'the last shows the two of you', `"${fourth}" "${both}"`),
      ok(backed, 'back is the step before'),
      ok(let_go, 'done lets the yard go'),
      ok(card.includes('lee'), 'and the story card names your sqouse', card),
      ok(lockedField && kept, 'the settings page holds the name and the role once the steps are behind'),
      ok(skipped, 'skip lets the yard go in the defaults, unnamed'),
      ok(!again, 'the steps are offered once')
    ];
  }],

  ['wardrobe: the picker by a pad: up and down the rows, left and right the items, LB and RB, Y a row', async () => {
    fresh();
    run(0.5);
    plugIn();
    try {
      await press('b');                               // wakes the pad
      await openPicker();
      await frames(2);
      // up the page to the head row
      for (let i = 0; i < 16 && rowOf(window.__pad.page()) !== 'head'; i++)
        await press(rowOf(window.__pad.page()) ? 'up' : 'down');
      const onHead = rowOf(window.__pad.page()) === 'head';
      await press('right');
      const head = outfitOf('you').head;
      const stayed = rowOf(window.__pad.page()) === 'head';
      await press('down');
      const onFace = rowOf(window.__pad.page()) === 'face';
      await press('left');
      const face = outfitOf('you').face;
      await press('rb');
      const sq = byId('wardsqouse').classList.contains('on');
      await press('right');
      const sqFace = outfitOf('sqouse').face;
      await press('lb');
      const you = byId('wardyou').classList.contains('on');
      const was = outfitOf('you').face, heads = outfitOf('you').head;
      let rolled = false;
      for (let i = 0; i < 8 && !rolled; i++) { await press('y'); rolled = outfitOf('you').face !== was; }
      const rowOnly = outfitOf('you').head === heads;
      await press('b');                               // back, to settings
      const settings = !byId('wardrobebtn').hidden;
      await closePicker();
      return [
        ok(onHead, 'the d-pad reaches the head row', rowOf(window.__pad.page())),
        ok(head === nextKey(HEAD, DEFAULTS.you.head) && stayed, 'right steps your head item and keeps the row', head),
        ok(onFace, 'down is the next row'),
        ok(face !== DEFAULTS.you.face, 'left steps that row back', face),
        ok(sq && sqFace !== DEFAULTS.sqouse.face, 'RB dresses your sqouse', `${sq} ${sqFace}`),
        ok(you, 'LB is you again'),
        ok(rolled && rowOnly, 'Y rolls the row the focus is on, and only it'),
        ok(settings, 'B goes back to settings')
      ];
    } finally {
      unplug();
      fresh();
    }
  }],

  // The rescue's sheet as it comes up (ending.js): its line names your
  // sqouse as the player did, and reads the role word with no name.
  ['wardrobe: the rescue sheet names your sqouse by the name, else by the role', async () => {
    const seen = async self => {
      window.__serpentOn(false);           // the sheet goes down with its button, not floating off
      window.__reset();
      run(0.5);
      window.__self('sqouse', self);
      S.rescued = true; S.buried = false; S.buriedMs = 600000;
      run(1 / 60);
      await raf();
      const line = byId('savedwhy').textContent, time = byId('savedin').textContent;
      window.__skipBeat('sheet');
      run(1 / 60);
      await raf();
      return { line, time, down: byId('saved').hidden };
    };
    const named = await seen({ name: 'robin', role: 'husband' }), plain = await seen({ name: '', role: 'husband' });
    S.selves = null;
    window.__serpentOn(null);
    window.__reset();
    await raf();
    return [
      ok(named.line === 'you saved robin in 10:00!', 'named, the name', named.line),
      ok(plain.line === 'you saved your sqhusband in 10:00!', 'unnamed, the role word chosen', plain.line)
    ];
  }],

  // A new yard by a pad, off Steam: the letter grid under the name, A a key,
  // X a letter back, Y the name's roll from the grid, B the step back and
  // menu the step on, never the sheet's let-go.
  ['wardrobe: a new yard\'s steps by a pad: the letter grid, X, Y, B and menu', async () => {
    fresh();
    plugIn();
    try {
      await press('b');                               // wakes the pad
      await newYard();
      await frames(2);
      // onto a letter: down from wherever the focus stands
      const onKey = () => window.__pad.page()?.classList?.contains('wardkey');
      for (let i = 0; i < 12 && !onKey(); i++) await press('down');
      const grid = up(document.querySelector('.wardkeys'));
      // QWERTY: the rows read as a keyboard's, and down lands on the key nearest across
      const rowsTxt = [...document.querySelectorAll('.wardkeys .wardkey')].map(b => b.dataset.key).join('');
      const qwerty = rowsTxt === "1234567890qwertyuiopasdfghjklzxcvbnm-'" + ' ' + 'del';
      const at = k => document.querySelector(`.wardkeys .wardkey[data-key="${k}"]`).getBoundingClientRect();
      const offset = at('a').left > at('q').left && at('z').left > at('a').left;
      // from the first key reached, down lands on a key within one key's width across
      const cx = r => r.left + r.width / 2;
      const from = window.__pad.page();
      const fx = cx(from.getBoundingClientRect());
      await press('down');
      const to = window.__pad.page();
      const near = to !== from && to.classList.contains('wardkey') && Math.abs(cx(to.getBoundingClientRect()) - fx) <= from.getBoundingClientRect().width;
      await press('up');
      const home = window.__pad.page() === from;
      const key = from.dataset.key;
      await press('a');
      await press('a');
      const typed = nameOf('you');
      await press('x');
      const deleted = nameOf('you');
      await press('y');
      const rolled = nameOf('you');
      await press('menu');
      const on = heading() === 'confirm your square' && S.paused;
      await press('b');
      const back = heading() === 'build who you are' && S.paused;
      await press('b');
      const stays = heading() === 'build who you are' && S.paused;
      for (let i = 0; i < 4; i++) await press('menu');
      const done = !S.paused && S.dressOffered;
      return [
        ok(grid, 'the letter grid is up under the name'),
        ok(qwerty, 'the keys sit in QWERTY rows', rowsTxt),
        ok(near && home, 'down lands on the key nearest across, and up comes back', `${from.dataset.key}>${to.dataset.key}`),
        ok(offset, 'the home and bottom rows are offset like a keyboard'),
        ok(key && typed === key + key, 'A types the key the focus is on', `${key} "${typed}"`),
        ok(deleted === key, 'X takes the last letter back', deleted),
        ok(CREW_NAMES.includes(rolled), 'Y from the grid rolls the name', rolled),
        ok(on, 'menu is the step on'),
        ok(back, 'B is the step back'),
        ok(stays, 'B on the first step keeps the yard held'),
        ok(done, 'and menu through the last lets the yard go')
      ];
    } finally {
      unplug();
      fresh();
    }
  }],
];
