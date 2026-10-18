// The two of them (wardrobe.js; DESIGN.md, "What the two of them wear" and
// "Who you are"): what the chosen head item does to a station hat, read off
// the glass, and the page worked as a player works it -- by the mouse and
// the keyboard on its buttons and its name field, and by a pad on the page
// (padpage.js), the d-pad between the slots round the close-up, A opening a
// slot's grid and picking a tile, B back to the slot, the triggers for the
// slot before and after, the shoulders for you and your sqouse, the letter
// grid for a name, X a letter back and Y a slot's roll; a
// locked tile tried on and not kept; the page at a phone's width; a new
// yard's four steps by both; and the name and the role held on the page off
// the house's board once those steps are behind a yard.
//
// The pad is a stand-in for the browser's, as in selftest/pad.js: the page's
// own frame reads it exactly as it reads a real one.

import { ok, raf, run, canvas, onScreen, hoverHouse, hoverAway } from './kit.js';
import { S } from '../state.js';
import { P, WORKER, NAME_MAX, WARD_AURAS, WARD_AURA_FPS, WARD_GRID_ROWS, TEXT_FLOOR } from '../config.js';
import { advance } from '../clock.js';
import { draw } from '../render.js';
import { paper, ink } from '../ink.js';

const lumOf = h => [1, 3, 5].reduce((s, k) => s + parseInt(h.slice(k, k + 2), 16), 0) / 3;
const PAPER_LUM = lumOf(paper);
// The lightnesses a picture is drawn in when it is not faint: black, white,
// and the page's own paper and ink.
const ENDS = [0, 255, PAPER_LUM, lumOf(ink)];
// How close counts as one of them: a fifth of the way from the paper to
// black, which on the dark page's graphite is a short way.
const NEAR = Math.min(40, PAPER_LUM / 5);
import { namePair, outfitOf, wear, DEFAULTS, HEAD, SLOTS, bareOf, nameOf, roleOf, setName, pairBody, ROLE_START, isOpen, itemLock } from '../wardrobe.js';
import { CREW_NAMES } from '../crew/names.js';
import { objective } from '../objectives.js';
import { wearing } from '../kit.js';
import { TYPE } from '../jobs.js';
import { offerDress } from '../settings.js';
import { lockForCheck } from '../wardrobepage.js';
import { msg } from '../lang.js';

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
  // ink is black on both pages (ink.js): darker than halfway to the paper
  return lum < PAPER_LUM / 2;
}

// The held sheet up on the picker as a player brings it: the pointer to the
// house, its board out, the row to the two of you pressed.
const pairRow = () => document.querySelector('#crewshop button[data-key="pairpage"]');
async function openPicker() {
  if (!S.crew) { window.__crew(2, 2); run(1); }
  await hoverHouse();
  await frames(2);
  pairRow()?.click();
  await frames(3);
}
async function closePicker() {
  dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  await frames(2);
}
// The page's parts: a slot's button round the close-up, a tile, the tiles
// shown, what the chosen slot's button says is worn, and the count by the grid.
const slotBtn = slot => byId(`ward-${slot}-slot`);
const tile = (slot, key) => byId(`ward-tile-${slot}-${key}`);
const shownTiles = () => [...document.querySelectorAll('.wardtiles.on .wardtile')];
const gridHead = () => document.querySelector('.wardslot.on .wardsw')?.textContent || '';
const openCount = () => document.querySelector('.wardopen')?.textContent || '';
const tileOf = el => (el?.classList?.contains('wardtile') ? `${el.dataset.slot}:${el.dataset.item}` : null);
const slotOf = el => (el?.classList?.contains('wardslot') ? el.dataset.slot : null);
// The guide lines seen, once their fade is over: the slots whose line stands.
const seenLines = (d = document) => [...d.querySelectorAll('.wardlead g')]
  .filter(g => +d.defaultView.getComputedStyle(g).opacity > 0.5).map(g => g.dataset.slot);
// A key pressed on the focused button, as a keyboard does.
const key = (k, el = document.activeElement) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
// How many pixels of the close-up are neither ink nor paper: a faint
// try-on's greys, where the bare square has none.
function greys() {
  const c = byId('wardrobe').querySelector('.wardbig');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; if (ENDS.every(e => Math.abs(l - e) >= NEAR)) n++; }
  return n;
}
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

  ['wardrobe: the picker by the mouse: the slots round the close-up, the guide line, a tile worn, the switch, the slot\'s die, the roll', async () => {
    fresh();
    run(0.5);
    await openPicker();
    const page = byId('wardrobe');
    const shown = up(page);
    byId('wardyou').click();
    slotBtn('head').click();
    // every head item a tile, the worn one inverted
    const headFirst = slotBtn('head').classList.contains('on') && shownTiles().length === HEAD.length;
    const wornOn = tile('head', DEFAULTS.you.head).classList.contains('on');
    // D2: the six round the close-up, three a side in the order they are
    // worn down the body, each with what it wears named on it
    const big = page.querySelector('.wardbig').getBoundingClientRect();
    const at = k => slotBtn(k).getBoundingClientRect();
    const side = (ks, left) => ks.every((k, i) => (left ? at(k).right <= big.left : at(k).left >= big.right)
      && (!i || at(k).top > at(ks[i - 1]).top));
    const placed = side(['head', 'back', 'aura'], true) && side(['face', 'neck', 'pattern'], false);
    const named = SLOTS.every(sl => up(slotBtn(sl.key)) && slotBtn(sl.key).querySelector('.wardsw').textContent
      === msg(sl.items.find(it => it.key === outfitOf('you')[sl.key]).name));
    // the strip of slot tabs and the heading over the grid are gone; the
    // grid's tab is the chosen slot's name, inverted as its button is
    const gone = !page.querySelector('.wardslots, .wardslothead, [role="tablist"]');
    const tab = page.querySelector('.wardgridtab'), bg = el => getComputedStyle(el).backgroundColor;
    const asOne = tab.textContent === msg('ward-slot-head') && bg(tab) === bg(slotBtn('head')) && bg(tab) !== bg(slotBtn('face'));
    // the slot's picture is the real drawing of what it wears
    await frames(2);
    const pic = () => slotBtn('head').querySelector('canvas').toDataURL();
    const hatPic = pic();
    tile('head', 'ears').click();
    await frames(2);
    const eared = outfitOf('you').head === 'ears', earsOn = tile('head', 'ears').classList.contains('on')
      && !tile('head', DEFAULTS.you.head).classList.contains('on'), said = gridHead();
    const drawn = pic() !== hatPic;
    // the count is beside the grid, and a turn shows that slot's tiles alone
    const openOf = sl => sl.items.filter(it => isOpen(sl.key, it.key)).length;
    const head = SLOTS[0], counted = openCount() === msg('ward-grid-open', { open: openOf(head), all: head.items.length });
    // only the chosen slot's guide line stands, fading across on a change
    await frames(20);
    const lineHead = seenLines().join();
    slotBtn('back').click();
    const fades = parseFloat(getComputedStyle(page.querySelector('.wardlead g')).transitionDuration) > 0;
    await frames(20);
    const lineBack = seenLines().join();
    const end = page.querySelector('.wardlead g.on rect').getBoundingClientRect();
    const onSquare = end.left >= big.left - 1 && end.right <= big.right + 1 && end.top >= big.top - 1 && end.bottom <= big.bottom + 1;
    const backShown = shownTiles().length === SLOTS.find(sl => sl.key === 'back').items.length
      && shownTiles().every(t => t.dataset.slot === 'back') && slotBtn('back').classList.contains('on');
    byId('wardsqouse').click();
    const sqOn = byId('wardsqouse').classList.contains('on');
    tile('back', 'flag').click();
    const sqBack = outfitOf('sqouse').back, youBack = outfitOf('you').back;
    // the slot's die, beside the grid: that slot alone
    slotBtn('face').click();
    const before = { ...outfitOf('sqouse') };
    let faced = false;
    for (let i = 0; i < 12 && !faced; i++) { byId('wardslotdie').click(); faced = outfitOf('sqouse').face !== before.face; }
    const others = ['head', 'neck', 'back', 'pattern', 'aura'].every(k => outfitOf('sqouse')[k] === before[k]);
    let rolled = false;
    const was = JSON.stringify(outfitOf('sqouse'));
    for (let i = 0; i < 6 && !rolled; i++) { byId('wardroll').click(); rolled = JSON.stringify(outfitOf('sqouse')) !== was; }
    // randomize all leaves the name alone
    setName('sqouse', 'quill');
    byId('wardroll').click();
    const nameKept = nameOf('sqouse') === 'quill';
    // the old rows are gone: no previous or next but the role's
    const rowsGone = !document.querySelector('#wardrobe .wardarr:not(#ward-role-prev):not(#ward-role-next)');
    byId('wardrobeback').click();
    await frames(2);
    const backTo = !S.paused;
    await hoverAway();
    fresh();
    return [
      ok(shown, "the house board's row opens the picker"),
      ok(headFirst && wornOn, 'the head slot shows a tile an item, the one worn inverted'),
      ok(placed, 'the slots stand round the close-up, head, back and aura down the left, face, neck and pattern down the right'),
      ok(named, 'each slot names what it wears'),
      ok(gone && asOne, 'no slot tabs and no heading: the grid\'s tab is the chosen slot, inverted as its button is', `${gone} "${tab.textContent}"`),
      ok(eared && earsOn && said.includes('ears'), 'a click on a tile wears it, and its slot says it', `${outfitOf('you').head} "${said}"`),
      ok(drawn, 'the slot\'s picture is drawn again in what it wears'),
      ok(counted, 'how many are open is said beside the grid', openCount()),
      ok(lineHead === 'head' && lineBack === 'back' && fades, 'only the chosen slot\'s guide line is seen, and it fades across', `${lineHead} > ${lineBack}`),
      ok(onSquare, 'and it ends on the close-up', JSON.stringify([end.left, end.top, big.left, big.top])),
      ok(backShown, 'a slot shows its tiles alone'),
      ok(sqOn && sqBack === 'flag' && youBack === DEFAULTS.you.back, 'the sqouse tab dresses your sqouse, not you',
         `${sqOn} ${sqBack} ${youBack}`),
      ok(faced && others, 'the slot\'s die rolls that slot alone', JSON.stringify(outfitOf('sqouse'))),
      ok(rolled, 'randomize all dresses the one being dressed'),
      ok(nameKept, 'and never renames them', nameOf('sqouse')),
      ok(rowsGone, 'no previous and next rows for the slots'),
      ok(backTo, 'back is the yard')
    ];
  }],

  // The keyboard: the arrows between the slots round the close-up and never
  // into the grid from beside it; Enter on a slot its grid, the focus on the
  // tile worn; the arrows the nearest tile that way; Escape the slot again;
  // y the slot's roll, ] and [ the slots.
  ['wardrobe: the picker by the keyboard: the arrows between the slots, Enter, the tiles, Escape, y, [ and ]', async () => {
    fresh();
    run(0.5);
    await openPicker();
    byId('wardyou').click();
    slotBtn('head').focus();
    key('ArrowRight');
    const across = slotOf(document.activeElement);
    key('ArrowDown');
    const under = slotOf(document.activeElement);
    key('ArrowDown');
    key('ArrowDown');
    const notIn = !tileOf(document.activeElement);
    // Enter on a focused button is its click, with no pointer's count of clicks
    slotBtn('head').focus();
    slotBtn('head').click();
    const opened = tileOf(document.activeElement) === `head:${outfitOf('you').head}`;
    tile('head', 'none').focus();
    const x0 = tile('head', 'none').getBoundingClientRect();
    key('ArrowRight');
    const right = document.activeElement, rx = right.getBoundingClientRect();
    const along = !!tileOf(right) && Math.abs(rx.top - x0.top) < 2 && rx.left > x0.left;
    key('ArrowDown');
    const down = document.activeElement;
    const below = !!tileOf(down) && down.getBoundingClientRect().top > rx.top;
    key('ArrowUp');
    const backUp = document.activeElement === right;
    const was = outfitOf('you').head, faceWas = outfitOf('you').face;
    let rolled = false;
    for (let i = 0; i < 12 && !rolled; i++) { key('y'); rolled = outfitOf('you').head !== was; }
    const slotOnly = outfitOf('you').face === faceWas;
    key(']');
    const turned = slotBtn('face').classList.contains('on') && !!tileOf(document.activeElement)?.startsWith('face:');
    key('[');
    const turnedBack = slotBtn('head').classList.contains('on');
    key('Escape');
    const escaped = slotOf(document.activeElement) === 'head' && up(byId('wardrobe'));
    key(']');
    const slotTurn = slotOf(document.activeElement) === 'face' && slotBtn('face').classList.contains('on');
    await closePicker();
    await hoverAway();
    fresh();
    return [
      ok(across === 'face' && under === 'neck', 'the arrows go from slot to slot, the nearest that way', `${across} ${under}`),
      ok(notIn, 'and never into the grid from beside it', document.activeElement?.id),
      ok(opened, 'Enter on a slot puts the focus on its worn tile', tileOf(document.activeElement)),
      ok(along, 'right is the next tile along', tileOf(right)),
      ok(below && backUp, 'down is the tile under, and up comes back', `${tileOf(down)}`),
      ok(rolled && slotOnly, 'y rolls the slot the focus is in, and only it'),
      ok(turned && turnedBack, '] turns to the next slot, the focus on its tiles, and [ back'),
      ok(escaped, 'Escape in the grid is its slot again, the sheet still up'),
      ok(slotTurn, '] on a slot is the next slot, the focus on it', document.activeElement?.id)
    ];
  }],

  // A locked item (a lock of the check's own standing in for the
  // wardrobe's): faint under its lock, saying what opens it; picked, it is
  // tried on the close-up, faint, and not kept; a roll never lands on one.
  // The yard's own locks (wardrobe.js, `itemLock`): every item a tile, and a
  // locked one says on its face what opens it, at full ink, no hover needed.
  ['wardrobe: a locked tile shows what opens it, on the tile; an open one shows nothing', async () => {
    fresh();
    await openPicker();
    byId('wardyou').click();
    slotBtn('head').click();
    await frames(1);
    const line = k => tile('head', k)?.querySelector('.wardtu');
    const want = itemLock('head', 'crown'), crown = line('crown'), ears = line('ears'), lamp = line('lamp');
    const all = HEAD.every(it => up(tile('head', it.key)));
    const full = crown && getComputedStyle(crown).opacity === '1' && getComputedStyle(crown.parentElement).opacity === '1';
    // read while the sheet is up: once let go it is on its way out
    const crownSays = up(crown) && crown.textContent === want?.name, lampSays = up(lamp) && lamp.textContent === itemLock('head', 'lamp').name;
    const earsSays = up(ears);
    await closePicker();
    return [
      ok(all, 'every head item is a tile, locked or not'),
      ok(want && crownSays && full, 'the crown\'s tile says what opens it, at full ink', crown?.textContent),
      ok(lampSays, 'a station hat\'s tile names its station\'s first hat', lamp?.textContent),
      ok(!earsSays, 'an open tile has no such line')
    ];
  }],
  ['wardrobe: a locked tile is tried on, faint, and not kept; a roll never wears one', async () => {
    fresh();
    run(0.5);
    const LOCK = { kind: 'check', id: 'check', name: 'crown lock', note: 'a check holds it' };
    lockForCheck((sl, k) => (sl === 'head' && k === 'crown' ? LOCK : null));
    try {
      await openPicker();
      byId('wardyou').click();
      byId('wardclear').click();
      slotBtn('head').click();
      await frames(3);
      const t = tile('head', 'crown');
      const faint = t.classList.contains('lock') && +getComputedStyle(t.querySelector('canvas')).opacity < 0.5
        && getComputedStyle(t.querySelector('.wardlk')).visibility === 'visible';
      const told = t.getAttribute('aria-label').includes('crown lock');
      const tipEl = document.getElementById('tip'), tipSays = () => (tipEl.hidden ? '' : tipEl.textContent);
      const count = openCount() === msg('ward-grid-open', { open: HEAD.length - 1, all: HEAD.length });
      t.dispatchEvent(new PointerEvent('pointerenter'));
      await frames(1);
      const hover = tipSays(), tipPx = parseFloat(getComputedStyle(tipEl).fontSize);
      t.dispatchEvent(new PointerEvent('pointerleave'));
      const hoverGone = tipSays() === '';
      tile('head', 'ears').dispatchEvent(new PointerEvent('pointerenter'));
      const openTip = tipSays();
      tile('head', 'ears').dispatchEvent(new PointerEvent('pointerleave'));
      t.focus();
      const focused = tipSays();
      t.blur();
      const plain = greys();
      t.click();
      await frames(3);
      const kept = outfitOf('you').head === 'none';
      const faintOn = greys();
      // anything open picked takes it off
      tile('head', 'ears').click();
      await frames(3);
      const off = outfitOf('you').head === 'ears' && greys() <= plain && !t.classList.contains('tried');
      // tried again, then the page left: nothing kept
      t.click();
      byId('wardrobeback').click();
      await frames(2);
      const left = outfitOf('you').head === 'ears';
      // every head item but none locked: the slot's die and the whole roll wear none
      lockForCheck((sl, k) => (sl === 'head' && k !== 'none' ? LOCK : null));
      await openPicker();
      byId('wardyou').click();
      let shut = true;
      for (let i = 0; i < 12; i++) {
        byId('wardslotdie').click();
        byId('wardroll').click();
        if (outfitOf('you').head !== 'none') shut = false;
      }
      await closePicker();
      return [
        ok(faint && told && count, 'a locked tile is faint, under a lock, says its lock, and is not counted open'),
        ok(hover.includes('crown lock') && hover.includes('a check holds it') && hoverGone, 'its lock and note in the game\'s tooltip on hover, gone when the pointer leaves', hover),
        ok(focused === hover && openTip === '', 'the same on the focus, and an open tile has none', `${focused} | ${openTip}`),
        ok(tipPx >= TEXT_FLOOR, 'the tooltip is at the text floor', `${tipPx}px`),
        ok(kept && faintOn > plain + 20, 'picked, it is tried on the close-up, faint, and not worn',
           `${outfitOf('you').head} ${plain} > ${faintOn} greys`),
        ok(off, 'an open tile picked wears it and takes the try-on off'),
        ok(left, 'leaving the page keeps nothing tried'),
        ok(shut, 'a roll never wears a locked item')
      ];
    } finally {
      lockForCheck(null);
      await hoverAway();
      fresh();
    }
  }],

  // The page at a phone's width, in a frame of its own (as sheetwidth.js
  // stands its pages): the six slots in two rows of three under the
  // close-up, every name on them whole, only the chosen one's guide line; the
  // tiles reflow to the width, and the sheet itself never scrolls sideways.
  ['wardrobe: at a phone\'s width the slots stand in two rows of three under the close-up and the tiles reflow', async () => {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:0;top:0;width:360px;height:740px;border:0;opacity:0;pointer-events:none;z-index:-1';
    document.body.appendChild(f);
    const loaded = new Promise(r => f.addEventListener('load', r, { once: true }));
    f.src = './play.html?bench';
    await loaded;
    try {
      const win = f.contentWindow, d = f.contentDocument;
      const paint = async n => { for (let i = 0; i < n; i++) await new Promise(r => win.requestAnimationFrame(r)); };
      for (let i = 0; i < 400 && !(win.__scene && win.__fast); i++) await paint(1);
      const at = win.performance.getEntriesByType('resource').map(e => e.name)
        .filter(u => new URL(u).pathname === '/src/wardrobepage.js').pop() || '/src/wardrobepage.js';
      const page = await win.eval(`import(${JSON.stringify(at)})`);
      win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      await paint(3);
      page.openWardrobe();
      await paint(3);
      const sheet = d.getElementById('held');
      d.getElementById('ward-back-slot').click();
      await paint(20);
      const big = d.querySelector('.wardbig').getBoundingClientRect(), sh = sheet.getBoundingClientRect();
      const btns = [...d.querySelectorAll('.wardslot:not(.wardprobe)')], rects = btns.map(b => b.getBoundingClientRect());
      const rows = [...new Set(rects.map(r => Math.round(r.top)))];
      const under = rects.every(r => r.top >= big.bottom - 1 && r.left >= sh.left && r.right <= sh.right);
      const whole = btns.every(b => [...b.querySelectorAll('.wardsk')].every(n => n.scrollWidth <= n.clientWidth + 1));
      const lines = seenLines(d).join();
      const tiles = [...d.querySelectorAll('.wardtiles.on .wardtile')];
      const tops = [...new Set(tiles.map(t => Math.round(t.getBoundingClientRect().top)))];
      const perRow = tiles.filter(t => Math.round(t.getBoundingClientRect().top) === tops[0]).length;
      const grid = d.querySelector('.wardtiles.on').getBoundingClientRect();
      const inside = tiles.every(t => t.getBoundingClientRect().right <= grid.right + 1);
      return [
        ok(btns.length === 6 && rows.length === 2 && under, 'the six slots stand in two rows of three under the close-up, inside the sheet',
           `${btns.length} in ${rows.length} rows`),
        ok(whole, 'every slot\'s name shows whole'),
        ok(lines === 'back', 'only the chosen slot\'s guide line is seen', lines),
        ok(tops.length > 1 && perRow >= 3 && inside, 'the tiles reflow into rows inside the page', `${perRow} a row, ${tops.length} rows`),
        ok(sheet.scrollWidth <= sheet.clientWidth + 1, 'the sheet does not scroll sideways', `${sheet.scrollWidth} in ${sheet.clientWidth}`)
      ];
    } finally { f.remove(); }
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
    tile('head', 'beanie').click();
    const flowTile = outfitOf('you').head === 'beanie' && up(byId('wardslotdie'));
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
    // the page off the house keeps them open: a rename there mid-game shows on the story card
    await openPicker();
    const editable = !byId('wardnamein').disabled && up(byId('ward-role-next')) && up(tile('head', 'none'));
    const before = roleOf('you') + roleOf('sqouse');
    byId('ward-role-next').click();
    const kept = roleOf('you') + roleOf('sqouse') !== before;
    document.querySelectorAll('.wardtab')[1].click();
    await frames(1);
    typeName('mo');
    await closePicker();
    await frames(2);
    const renamed = nameOf('sqouse') === 'mo' && (objective()?.say || '').includes('mo');
    // and a skip from the first step, on another new yard
    fresh();
    await newYard();
    tile('head', 'ears').click();
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
      ok(flowTile, 'the step\'s grid wears a tile picked', outfitOf('you').head),
      ok(second === 'confirm your square' && confirmed.includes('Pat o\'Neil-2'), 'the second step shows your square named', `"${second}" "${confirmed}"`),
      ok(third === 'build your sqouse' && sqName === 'lee', 'the third builds your sqouse', `"${third}" ${sqName}`),
      ok(fourth === 'the two of you' && both.includes('lee') && both.includes('Pat'), 'the last shows the two of you', `"${fourth}" "${both}"`),
      ok(backed, 'back is the step before'),
      ok(let_go, 'done lets the yard go'),
      ok(card.includes('lee'), 'and the story card names your sqouse', card),
      ok(editable && kept && renamed, 'the page off the house still edits the name and the role once the steps are behind, and the story card follows', `${editable} ${kept} ${renamed}`),
      ok(skipped, 'skip lets the yard go in the defaults, unnamed'),
      ok(!again, 'the steps are offered once')
    ];
  }],

  // A pad on D2 of docs/mocks/appearance-hierarchy-2026-10-16: the d-pad
  // between the slots round the close-up, the nearest that way, and never
  // into the grid from beside it; A on a slot its grid, the focus on the
  // tile worn; the d-pad across the tiles and A wearing one; B the slot
  // again, and B on the slots the sheet's own let-go; LT and RT the slot
  // before and after from a slot or from a grid; LB and RB; Y the slot.
  ['wardrobe: the picker by a pad: the d-pad between the slots, A opens a slot\'s grid and wears a tile, B back, LT and RT, LB and RB, Y', async () => {
    fresh();
    run(0.5);
    plugIn();
    // every item open, so a tile the d-pad lands on is one A wears (a locked
    // one is tried on and not kept, its own check above)
    lockForCheck(() => null);
    const at = () => window.__pad.page();
    try {
      await press('b');                               // wakes the pad
      await openPicker();
      await frames(2);
      // down the page onto the slots, then to the head's
      for (let i = 0; i < 16 && !slotOf(at()); i++) await press('down');
      const reached = slotOf(at());
      for (let i = 0; i < 4 && slotOf(at()) !== 'head'; i++) await press(slotOf(at()) === 'face' ? 'left' : 'up');
      const onHead = slotOf(at()) === 'head';
      await press('right');
      const across = slotOf(at());
      await press('down');
      const under = slotOf(at());
      await press('down');
      await press('down');
      const notIn = !tileOf(at());
      await press('up');
      for (let i = 0; i < 4 && slotOf(at()) !== 'neck'; i++) await press('up');
      // A: the neck's grid, the focus on what is worn there
      await press('a');
      const opened = slotBtn('neck').classList.contains('on') && tileOf(at()) === `neck:${outfitOf('you').neck}`;
      const r0 = at()?.getBoundingClientRect();
      await press('right');
      const nextTile = at(), r1 = nextTile?.getBoundingClientRect();
      const along = !!tileOf(nextTile) && Math.abs(r1.top - r0.top) < 2 && r1.left > r0.left;
      await press('a');
      const [sl, it] = (tileOf(nextTile) || ':').split(':');
      const picked = outfitOf('you')[sl] === it && nextTile.classList.contains('on');
      await press('b');
      const backTo = slotOf(at()) === 'neck' && S.paused && up(byId('wardrobe'));
      // RT on a slot: the next slot, the focus on it
      await press('rt');
      const rtSlot = slotOf(at()) === 'back' && slotBtn('back').classList.contains('on');
      // RT in a grid: the next slot's grid, the focus on its worn tile; and round
      await press('a');
      await press('rt');
      const rtGrid = slotBtn('pattern').classList.contains('on') && !!tileOf(at())?.startsWith('pattern:');
      await press('rt');
      await press('rt');
      const wrapped = slotBtn('head').classList.contains('on') && !!tileOf(at())?.startsWith('head:');
      await press('lt');
      const lt = slotBtn('aura').classList.contains('on') && !!tileOf(at())?.startsWith('aura:');
      await press('rt');
      await press('rb');
      const sq = byId('wardsqouse').classList.contains('on');
      await press('right');
      const sqTile = tileOf(at());
      await press('a');
      const sqWorn = !!sqTile && outfitOf('sqouse')[sqTile.split(':')[0]] === sqTile.split(':')[1];
      await press('lb');
      const you = byId('wardyou').classList.contains('on');
      const heads = outfitOf('you').head, faces = outfitOf('you').face;
      let rolled = false;
      for (let i = 0; i < 12 && !rolled; i++) { await press('y'); rolled = outfitOf('you').head !== heads; }
      const slotOnly = outfitOf('you').face === faces;
      await press('b');                               // the grid's slot
      const slotAgain = slotOf(at()) === 'head' && S.paused;
      await press('b');                               // and the sheet let go
      const settings = !S.paused;
      await hoverAway();
      return [
        ok(!!reached && onHead, 'the d-pad reaches the slots', `${reached} ${slotOf(at())}`),
        ok(across === 'face' && under === 'neck', 'the d-pad goes from slot to slot, the nearest that way', `${across} ${under}`),
        ok(notIn, 'and never into the grid from beside it'),
        ok(opened, 'A on a slot opens its grid, the focus on the tile worn', tileOf(at())),
        ok(along, 'right is the next tile along', tileOf(nextTile)),
        ok(picked, 'A wears the tile', tileOf(nextTile)),
        ok(backTo, 'B in the grid is its slot again, the sheet still up'),
        ok(rtSlot, 'RT on a slot is the next slot, the focus on it'),
        ok(rtGrid && wrapped, 'RT in a grid is the next slot\'s grid, the focus on its tiles, round past the last'),
        ok(lt, 'LT is the slot before'),
        ok(sq && sqWorn, 'RB dresses your sqouse, A wearing the tile on them', `${sq} ${sqTile}`),
        ok(you, 'LB is you again'),
        ok(rolled && slotOnly, 'Y rolls the slot the focus is in, and only it'),
        ok(slotAgain && settings, 'B goes to the slot, and B on the slots back to the yard')
      ];
    } finally {
      lockForCheck(null);
      unplug();
      fresh();
    }
  }],

  // The way in the owner moved off settings (2026-10-16): the house's board,
  // the row to the two of you, a head item's tile picked and seen on the body
  // in the yard; then clear, and the body drawn as bare as anybody's.
  ['wardrobe: the house board opens the picker; a change is worn in the yard, and clear takes every slot bare', async () => {
    fresh();
    window.__crew(2, 2);
    run(2);
    const w = pairBody('you') || S.workers.find(o => !wearing(o));
    if (!w) return [ok(false, 'a body to be you', S.workers.length)];
    namePair('you', w);
    w.kitOf = null;                              // no station hat under what is chosen
    await openPicker();
    const opened = S.paused && up(byId('wardrobe'));
    const settingsGone = !byId('wardrobebtn');
    byId('wardyou').click();
    slotBtn('head').click();
    tile('head', 'ears').click();
    const eared = outfitOf('you').head === 'ears';
    byId('wardrobeback').click();
    await frames(2);
    const down = !S.paused;
    // drawn alone on the bare floor left of the rock, as the first check does
    const all = S.workers, was = { x: w.x, y: w.y };
    const x = Math.round(S.cx - 400), y = Math.round(S.groundY - WORKER);
    window.__look(x - S.viewW / 2);
    const look = () => {
      Object.assign(w, { x, y, lunge: 0 });
      S.workers = [w];
      draw();
      S.workers = all;
      const out = [];
      for (let dy = -3 * P; dy < WORKER; dy += 2) for (let dx = -2 * P; dx < WORKER + 2 * P; dx += 2) out.push(inkAt(x + dx, y + dy) ? 1 : 0);
      return out.join('');
    };
    const ears = look(), earsMid = inkAt(x + WORKER / 2, y - P / 2), earsSide = inkAt(x + P / 2, y - P / 2);
    // clear, from the page
    await openPicker();
    byId('wardyou').click();
    byId('wardclear').click();
    const o = outfitOf('you');
    const allBare = SLOTS.every(s => o[s.key] === bareOf(s.key).key);
    const named = nameOf('you'), role = roleOf('you');
    byId('wardrobeback').click();
    await frames(2);
    const cleared = look();
    const ids = S.pairIds;
    S.pairIds = { ...ids, you: null };
    const anybody = look();
    S.pairIds = ids;
    Object.assign(w, was);
    await hoverAway();
    fresh();
    return [
      ok(opened, 'the row on the house board brings the picker up over the yard'),
      ok(settingsGone, 'and settings has no row for it'),
      ok(eared && down, 'the ears tile worn, and back lets the yard go', outfitOf('you').head),
      ok(earsSide && !earsMid, 'the ears are drawn on you in the yard', `${earsSide} ${earsMid}`),
      ok(allBare, 'clear takes every slot to none, the pattern to plain', JSON.stringify(o)),
      ok(named === nameOf('you') && role === roleOf('you'), 'and keeps the name and the role'),
      ok(cleared !== ears && cleared === anybody, 'you are drawn bare, as anybody is')
    ];
  }],

  // The sixth slot (render/wardaura.js): the aura tab's rain cloud tile
  // picked on the page, and the cloud drawn over you in the yard, where with
  // none the air over the head is the bare floor's.
  ['wardrobe: the aura row puts a rain cloud over you in the yard', async () => {
    fresh();
    window.__crew(2, 2);
    run(2);
    const w = pairBody('you') || S.workers.find(o => !wearing(o));
    if (!w) return [ok(false, 'a body to be you', S.workers.length)];
    namePair('you', w);
    w.kitOf = null;
    wear('you', { head: 'none' });
    // the cloud waits on the first muck rain (wardrobe-locks.test.mjs)
    if (!S.won.includes('muckrain')) S.won.push('muckrain');
    await openPicker();
    byId('wardyou').click();
    slotBtn('aura').click();
    const row = up(tile('aura', 'rain-cloud'));
    tile('aura', 'rain-cloud').click();
    const said = gridHead(), worn = outfitOf('you').aura;
    byId('wardrobeback').click();
    await frames(2);
    const all = S.workers, was = { x: w.x, y: w.y };
    const x = Math.round(S.cx - 400), y = Math.round(S.groundY - WORKER);
    window.__look(x - S.viewW / 2);
    // the pixels over the head that are not the paper
    const marked = () => {
      Object.assign(w, { x, y, lunge: 0 });
      S.workers = [w];
      // the cloud trails the body by a lag read off the game's clock: stand
      // here, drawing, until the whole lag is spent here and none of it was
      // spent where the body stood before
      const held = Math.ceil(WARD_AURAS['rain-cloud'].lag * WARD_AURA_FPS) + 2;
      for (let i = 0; i < held; i++) { advance(1000 / WARD_AURA_FPS); draw(); }
      S.workers = all;
      let n = 0;
      for (let dy = -4 * P; dy < 0; dy += 2) for (let dx = 0; dx < WORKER; dx += 2) {
        const [sx, sy] = onScreen(x + dx, y + dy), k = S.dpr;
        const d = canvas().getContext('2d').getImageData(Math.round(sx * k), Math.round(sy * k) & ~1, 1, 1).data;
        const lum = (d[0] + d[1] + d[2]) / 3;
        if (Math.abs(lum - PAPER_LUM) > 20) n++;
      }
      return n;
    };
    const cloud = marked();
    wear('you', { aura: 'none' });
    const none = marked();
    Object.assign(w, was);
    await hoverAway();
    fresh();
    return [
      ok(row && worn === 'rain-cloud' && said.includes('rain cloud'), 'the page has an aura tab, and its rain cloud tile wears it', `${row} "${said}"`),
      ok(cloud > none + 6, 'the cloud is drawn over the head in the yard', `${cloud} marked, ${none} with none`)
    ];
  }],

  // The same way in by a pad alone: along the stops to the house, A its
  // board, down its rows to the two of you, A, and B the yard again.
  ['wardrobe: a pad reaches the picker through the house board', async () => {
    fresh();
    window.__crew(2, 2);
    run(1);
    const pad = window.__pad;
    pad.on();
    try {
      pad.press('b');
      for (let i = 0; i < 16 && pad.focus() !== 'st:house'; i++)
        pad.press(pad.stops().indexOf('st:house') < pad.stops().indexOf(pad.focus()) ? 'left' : 'right');
      const atHouse = pad.focus() === 'st:house';
      pad.press('a');
      await frames(2);
      const boardUp = !!S.houseBoardOpen;
      const onRow = () => pad.page()?.dataset?.key === 'pairpage';
      for (let i = 0; i < 6 && !onRow(); i++) pad.press('up');
      for (let i = 0; i < 6 && !onRow(); i++) pad.press('down');
      const stop = onRow();
      pad.press('a');
      await frames(2);
      const picker = S.paused && up(byId('wardrobe'));
      pad.press('b');
      await frames(2);
      const back = !S.paused;
      return [
        ok(atHouse, 'the focus gets to the house', pad.focus()),
        ok(boardUp, 'A opens its board'),
        ok(stop, 'the row to the two of you is a stop on it', pad.page()?.dataset?.key || pad.focus()),
        ok(picker, 'A on it brings the picker up'),
        ok(back, 'B lets the yard go again')
      ];
    } finally {
      pad.off();
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

  // One height whatever is shown (the owner, 2026-10-16), as the settings
  // tabs hold one: every slot and both squares on the page, and every
  // slot on a new yard's two build steps, at a desk's size and a
  // phone's. Read as the sheet's whole content height (scrollHeight), so a
  // phone's sheet that scrolls is held to it too.
  ['wardrobe: the sheet is one height across every slot, both squares and the build steps, desk and phone', async () => {
    const checks = [];
    for (const [size, w, h] of [['desk', 1280, 800], ['short', 1280, 900], ['tall', 1280, 1400], ['phone', 360, 740]]) {
      const f = document.createElement('iframe');
      f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;border:0;opacity:0;pointer-events:none;z-index:-1`;
      document.body.appendChild(f);
      const loaded = new Promise(r => f.addEventListener('load', r, { once: true }));
      f.src = './play.html?bench';
      await loaded;
      try {
        const win = f.contentWindow, d = f.contentDocument;
        const paint = async n => { for (let i = 0; i < n; i++) await new Promise(r => win.requestAnimationFrame(r)); };
        for (let i = 0; i < 400 && !(win.__scene && win.__fast); i++) await paint(1);
        const mod = name => {
          const at = win.performance.getEntriesByType('resource').map(e => e.name)
            .filter(u => new URL(u).pathname === `/src/${name}.js`).pop() || `/src/${name}.js`;
          return win.eval(`import(${JSON.stringify(at)})`);
        };
        const page = await mod('wardrobepage'), settings = await mod('settings'), state = await mod('state');
        // your sqouse in the longest names there are, so the two squares'
        // slots name the shortest and the longest
        (await mod('wardrobe')).wear('sqouse', { head: 'serpent-comb', face: 'round-glasses', neck: 'gold-scarf',
                                                 back: 'gold-cape', pattern: 'tall-stripes', aura: 'flock-overhead' });
        const sheet = d.getElementById('held');
        const tall = () => Math.round(sheet.scrollHeight);
        const walk = async (label, whos) => {
          const seen = [];
          for (const k of whos) {
            if (k) { d.getElementById(`ward${k}`).click(); await paint(2); }
            for (const s of SLOTS) {
              d.getElementById(`ward-${s.key}-slot`).click();
              await paint(2);
              seen.push([`${label}${k ? ' ' + k : ''} ${s.key}`, tall()]);
            }
          }
          return seen;
        };
        win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        await paint(3);
        page.openWardrobe();
        await paint(3);
        const all = await walk('page', ['you', 'sqouse']);
        // the appearance sheet is its own, wider and held to a landscape's
        // height whatever the window (the owner, 2026-10-17); a phone keeps
        // the width and height every sheet has
        {
          const r = sheet.getBoundingClientRect(), fs = parseFloat(win.getComputedStyle(sheet).fontSize);
          const em = name => parseFloat(win.getComputedStyle(d.documentElement).getPropertyValue(name)) * fs;
          const desk = w > 560, edges = 2 * 14 + 2;      // the sheet's padding and border
          checks.push(ok(desk ? Math.abs(r.width - (em('--ward-sheet-w') + 2 * 24 + 2)) <= 2 && r.width > em('--held-w') + 2 * 24 + 2
                              : r.width <= w,
                         `${size}: the sheet is the appearance sheet's width (wider than every other page's on a desk)`, `${Math.round(r.width)}px`));
          checks.push(ok(!desk || r.height <= em('--ward-sheet-h') + edges + 2 || r.height <= h,
                         `${size}: the sheet is no taller than the appearance sheet's own height`, `${Math.round(r.height)}px of a ${h}px window`));
        }
        // the slots' names whole, in the longest names: never wider than the
        // button, never taller than the room kept for them
        const slotCut = [...d.querySelectorAll('.wardslot:not(.wardprobe)')].flatMap(b => [...b.querySelectorAll('.wardsk, .wardsw')])
          .filter(n => n.getClientRects().length && (n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1
            || n.getBoundingClientRect().right > n.closest('.wardslot').getBoundingClientRect().right))
          .map(n => `${n.textContent} ${n.scrollWidth}>${n.clientWidth}`);
        checks.push(ok(slotCut.length === 0, `${size}: every slot's name and what it wears show whole`, slotCut.slice(0, 4).join('; ')));
        // every tile hovered and focused in every slot: neither the sheet nor
        // the grid moves for the words under it
        const gridH = () => Math.round(d.querySelector('.wardgrids').getBoundingClientRect().height);
        const moved = [];
        for (const s of SLOTS) {
          d.getElementById(`ward-${s.key}-slot`).click();
          await paint(2);
          const h0 = tall(), g0 = gridH();
          for (const t of d.querySelectorAll(`.wardtile[data-slot="${s.key}"]`)) {
            t.dispatchEvent(new win.Event('pointerenter')); t.dispatchEvent(new win.Event('focus'));
            if (tall() !== h0 || gridH() !== g0) moved.push(`${s.key}:${t.dataset.item} ${h0}>${tall()} ${g0}>${gridH()}`);
            t.dispatchEvent(new win.Event('pointerleave')); t.dispatchEvent(new win.Event('blur'));
          }
        }
        // no name is cut: it wraps at spaces, never an ellipsis, never wider than its tile
        const cut = [];
        for (const s of SLOTS) {
          d.getElementById(`ward-${s.key}-slot`).click();
          await paint(2);
          for (const n of d.querySelectorAll(`.wardtiles[data-slot="${s.key}"] .wardtn`)) {
            const cs = win.getComputedStyle(n);
            if (n.scrollWidth > n.clientWidth || n.scrollHeight > n.clientHeight + 1 || cs.textOverflow === 'ellipsis')
              cut.push(`${s.key}:${n.textContent} ${n.scrollWidth}>${n.clientWidth}`);
          }
        }
        checks.push(ok(cut.length === 0, `${size}: every tile's name shows whole`, cut.slice(0, 4).join('; ')));
        checks.push(ok(moved.length === 0, `${size}: hovering any tile in any slot moves neither the sheet nor the grid`, moved.slice(0, 3).join('; ')));
        page.leaveWardrobe();
        await paint(2);
        state.S.dressOffered = false;
        settings.offerDress(true);
        await paint(3);
        all.push(...await walk('step 1', [null]));
        d.getElementById('wardnext').click(); await paint(2);
        d.getElementById('wardnext').click(); await paint(2);
        all.push(...await walk('step 3', [null]));
        page.leaveWardrobe();
        // the page off the house's board and the new yard's build steps are
        // two different pages (the steps carry their count and their way on),
        // each held to its own one height
        for (const kind of ['page', 'step']) {
          const views = all.filter(([n]) => n.startsWith(kind));
          const hs = [...new Set(views.map(([, v]) => v))];
          checks.push(ok(views.length >= SLOTS.length * 2 && hs.length === 1,
                         `${size}: the ${kind === 'page' ? 'page' : 'build steps'} hold one height across ${views.length} views`,
                         hs.length === 1 ? `${hs[0]}px` : views.map(([n, v]) => `${n} ${v}`).join(', ')));
        }
      } finally { f.remove(); }
    }
    return checks;
  }],

  // A short window (the owner, 2026-10-16): only the grid scrolls, inside
  // itself, so the close-up, its slots and the foot stay on the glass;
  // the grid keeps at least its first WARD_GRID_ROWS rows in sight; and the
  // arrow down walks every row of it, each scrolled into sight, before it
  // leaves the grid. The same on a new yard's first build step. At a
  // laptop's window (1280x800, the owner wants the square held there too)
  // and a little taller.
  ['wardrobe: on a short window only the grid scrolls, the close-up stays in view, and the arrow down walks every row', async () => {
    const checks = [];
    for (const h of [800, 900]) checks.push(...(await shortWindow(h)).map(c => ({ ...c, what: `1280x${h}: ${c.what}` })));
    return checks;
  }],
];

async function shortWindow(h) {
    const f = document.createElement('iframe');
    f.style.cssText = `position:fixed;left:0;top:0;width:1280px;height:${h}px;border:0;opacity:0;pointer-events:none;z-index:-1`;
    document.body.appendChild(f);
    const loaded = new Promise(r => f.addEventListener('load', r, { once: true }));
    f.src = './play.html?bench';
    await loaded;
    try {
      const win = f.contentWindow, d = f.contentDocument;
      const paint = async n => { for (let i = 0; i < n; i++) await new Promise(r => win.requestAnimationFrame(r)); };
      for (let i = 0; i < 400 && !(win.__scene && win.__fast); i++) await paint(1);
      const mod = name => {
        const at = win.performance.getEntriesByType('resource').map(e => e.name)
          .filter(u => new URL(u).pathname === `/src/${name}.js`).pop() || `/src/${name}.js`;
        return win.eval(`import(${JSON.stringify(at)})`);
      };
      const page = await mod('wardrobepage'), settings = await mod('settings'), state = await mod('state');
      const sheet = d.getElementById('held'), grids = () => d.querySelector('.wardgrids');
      const inWin = el => { const r = el.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= win.innerHeight + 1; };
      const inGrid = el => { const r = el.getBoundingClientRect(), g = grids().getBoundingClientRect(); return r.top >= g.top - 1 && r.bottom <= g.bottom + 1; };
      const fixed = () => [d.querySelector('.wardbig'), d.querySelector('.wardstage'), d.getElementById('wardroll')].every(inWin);
      win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      await paint(3);
      page.openWardrobe();
      await paint(3);
      d.getElementById('ward-head-slot').click();
      await paint(3);
      const g = grids(), tiles = [...d.querySelectorAll('.wardtiles.on .wardtile')];
      const rowOf = t => Math.round(t.getBoundingClientRect().top + g.scrollTop);
      const rows = [...new Set(tiles.map(rowOf))];
      // how far down the grid its first WARD_GRID_ROWS rows reach, a part of
      // the next row for a part of a row
      const footOf = i => tiles.filter(t => rowOf(t) === rows[i]).reduce((m, t) => Math.max(m, t.getBoundingClientRect().bottom), 0) - g.getBoundingClientRect().top;
      const whole = Math.floor(WARD_GRID_ROWS), part = WARD_GRID_ROWS - whole;
      const two = footOf(whole - 1) + (part ? part * (footOf(whole) - footOf(whole - 1)) : 0);
      const sheetStill = sheet.scrollHeight <= sheet.clientHeight + 1, gridScrolls = g.scrollHeight > g.clientHeight + 1;
      const twoSeen = g.clientHeight >= two - 1, upAtFirst = fixed();
      // down from the first tile, a press at a time, until the focus leaves
      tiles[0].focus();
      const seen = new Set(), lost = [];
      for (let i = 0; i < 40; i++) {
        const at = d.activeElement;
        if (!at?.classList.contains('wardtile') || !g.contains(at)) break;
        seen.add(rowOf(at));
        if (!inGrid(at)) lost.push(at.id);
        at.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
        await paint(1);
      }
      const leftTo = d.activeElement?.id, upAfter = fixed() && sheet.scrollTop === 0;
      // scrolled to the foot, every tile's picture stands at its tile's top, over its words
      g.scrollTop = g.scrollHeight;
      await paint(1);
      const strays = tiles.filter(t => {
        const a = t.getBoundingClientRect(), c = t.querySelector('canvas').getBoundingClientRect();
        return Math.abs(c.top - a.top - parseFloat(getComputedStyle(t).borderTopWidth)) > 1;
      }).map(t => t.id);
      page.leaveWardrobe();
      await paint(2);
      state.S.dressOffered = false;
      settings.offerDress(true);
      await paint(3);
      const stepStill = sheet.scrollHeight <= sheet.clientHeight + 1, stepScrolls = grids().scrollHeight > grids().clientHeight + 1;
      const stepUp = [d.querySelector('.wardbig'), d.querySelector('.wardstage'), d.getElementById('wardnext')].every(inWin);
      page.leaveWardrobe();
      return [
        ok(sheetStill && gridScrolls, 'the sheet stands still and the grid scrolls inside it',
           `sheet ${sheet.scrollHeight} in ${sheet.clientHeight}, grid ${g.scrollHeight} in ${g.clientHeight}`),
        ok(twoSeen, `the grid keeps its first ${WARD_GRID_ROWS} rows in sight`, `${g.clientHeight} for ${Math.round(two)}`),
        ok(upAtFirst && upAfter, 'the close-up, its slots and the foot stay in the window, before the walk and after'),
        ok(seen.size === rows.length && !lost.length, 'the arrow down walks every row, each scrolled into sight',
           `${seen.size} of ${rows.length} rows; out of sight: ${lost.join(' ')}`),
        ok(!!leftTo && !leftTo.startsWith('ward-tile-'), 'and only then leaves the grid', leftTo),
        ok(!strays.length, 'a tile\'s picture scrolls with its tile', strays.join(' ')),
        ok(stepStill && stepScrolls && stepUp, 'a new yard\'s build step the same',
           `sheet ${sheet.scrollHeight}/${sheet.clientHeight}, grid scrolls ${stepScrolls}, in view ${stepUp}`)
      ];
    } finally { f.remove(); }
}
