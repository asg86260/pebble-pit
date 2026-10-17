// The two of them's page: who each is and what each wears, a page of the
// held sheet (DESIGN.md, "What the two of them wear" and "Who you are"; the
// mocks' votes, docs/mocks/pair-wardrobe-2026-10-16,
// docs/mocks/who-you-are-2026-10-16, and layout A of
// docs/mocks/wardrobe-expansion-2026-10-16). At the top a tab each for you
// and your sqouse; under them the one being chosen close up, its name and
// its role beside it; then a tab a slot, each with how many of its items
// are open, and under them every item of that slot at once as a grid of
// tiles, each tile the bare square wearing that item. The chosen tile is
// inverted; a locked one is faint, under a lock, and says what opens it.
// Picking a locked one tries it on the close-up, faint, and is not kept. The
// slot's die is in the grid's heading; the roll of the whole square but its
// name, and the clear that takes every slot back to bare, at the foot.
//
// It is reached two ways. Once at a new yard, before the opening walks out
// (`offerDress`), as four steps: build who you are, confirm your square,
// build your sqouse, and a last look at the two of you; done there lets the
// opening go. And always as a row on the house's board (crewboard.js), with
// a tab for each; the name and the role can be changed there at any time.
//
// Mouse, finger and keyboard type the name into its field. A pad moves
// between the page's buttons as on every page (padpage.js), the nearest that
// way, so across the tiles as across any row: A picks, Y rolls the slot the
// focus is in (or the name, or the role, on theirs), left and right on the
// role's row step it and on the slot tabs turn them, LT and RT turn the slot
// tabs from anywhere, LB and RB are you and your sqouse. The keyboard the
// same: the arrows, Enter, y, and [ and ] for the slot tabs. For the name,
// Steam's own keyboard where the desk has Steam to ask (`desk.askText`), and
// anywhere else, or when Steam cannot show one, a grid of letters under the
// name row: A types the key, X takes the last letter back.

import { msg, writeInto, has } from './lang.js';
import { S } from './state.js';
import { WORKER, WARD_BIG, WARD_BIG_W, WARD_BIG_H, WARD_TILE_W, WARD_TILE_H, WARD_TILE_K, WARD_TILE_FOOT, WARD_TILE_COLS,
         WARD_TRY_ALPHA, WARD_GRID_ROWS, NAME_MAX, NAME_GRID_COLS, P } from './config.js';
import { SLOTS, WHO, DEFAULTS, itemOf, bareOf, outfitOf, rollSlot, nameOf, setName, stepRole, rollName,
         rollRole, rollSquare, bareOutfit, typedName, storyArgs, wear, itemLock, isOpen } from './wardrobe.js';
import { drawDressed, YARD_INKS, DEEP_INKS } from './render/wardrobe.js';
import { raw } from './ink.js';

// A new yard's steps: who each is about and what it shows.
const FLOW = [
  { title: 'ward-build-you', who: 'you', kind: 'build' },
  { title: 'ward-confirm-you', who: 'you', kind: 'confirm' },
  { title: 'ward-build-sqouse', who: 'sqouse', kind: 'build' },
  { title: 'ward-title', who: 'sqouse', kind: 'both' },
];
// The pad's keys in QWERTY rows (the owner, 2026-10-16), each row's offset in
// half keys, as on a real keyboard; space and the one that takes a letter
// back close it.
const KEY_ROWS = [
  { keys: [...'1234567890'], at: 0 },
  { keys: [...'qwertyuiop'], at: 0 },
  { keys: [...'asdfghjkl'], at: 1 },
  { keys: [...'zxcvbnm', '-', "'"], at: 2 },
];

let who = 'you';
let slot = SLOTS[0].key;        // the slot whose tiles are shown
let step = -1;                  // the new yard's step, or -1 for the settings page
let gridAsked = false;          // Steam could not show its keyboard: the grid instead
let built = null;               // the page's parts, made once into its element
// A locked item picked: worn on the close-up, faint, by the one it was
// picked for, and never kept. Anything else picked, or a turn to another
// slot, square or step, takes it off.
let tried = null;               // { who, slot, key }
// The tiles walking in place: under the pointer, or holding the focus.
const hot = new Set();

// The pad's own focus and its nearest-that-way, handed in by pad.js at load
// (padpage.js sits behind the boards in the import ring, and this page is
// on one of them).
let nav = { focus: el => el.focus(), toward: () => null };
export function wardrobeNav(given) { nav = { ...nav, ...given }; }

const button = (text, ...cls) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.classList.add(...cls);
  b.textContent = text;
  return b;
};
const span = (cls, text = '') => Object.assign(document.createElement('span'), { className: cls, textContent: text });
const div = (...cls) => { const d = document.createElement('div'); d.classList.add(...cls); return d; };
// Small pictures in the button's own ink, on a grid of whole units.
const SVG = 'http://www.w3.org/2000/svg';
function glyph(w, h, rects, cls) {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  s.setAttribute('aria-hidden', 'true');
  if (cls) s.setAttribute('class', cls);
  for (const [x, y, rw, rh, fill = true] of rects) {
    const r = document.createElementNS(SVG, 'rect');
    for (const [k, v] of Object.entries({ x, y, width: rw, height: rh, fill: fill ? 'currentColor' : 'none' })) r.setAttribute(k, v);
    if (!fill) r.setAttribute('stroke', 'currentColor');
    s.appendChild(r);
  }
  return s;
}
// The die: five pips on a square.
const DIE = [[0.5, 0.5, 6, 6, false], ...[[1.5, 1.5], [4.5, 1.5], [3, 3], [1.5, 4.5], [4.5, 4.5]].map(([x, y]) => [x, y, 1, 1])];
// The lock: a shackle over a body, its keyhole left open.
const LOCK = [[1, 0, 5, 1], [1, 1, 1, 2], [5, 1, 1, 2], [0, 3, 7, 2], [0, 5, 3, 2], [4, 5, 3, 2], [0, 7, 7, 1]];
function die(roll) {
  const b = button('', 'warddie');
  b.setAttribute('aria-label', msg('ward-randomize'));
  b.title = msg('ward-randomize');
  b.appendChild(glyph(7, 7, DIE));
  b.addEventListener('click', () => { typing = null; roll(); say(); });
  return b;
}
const roleWord = k => msg('ward-role-word', storyArgs(k));
// A lock's name or line: a message where it names one, else its own words.
const lockWords = s => (typeof s === 'string' && s && has(s) ? msg(s) : s || '');
const lockOf = (s, k) => (testLocks ? testLocks(s, k) : itemLock(s, k));
const open = (s, k) => (testLocks ? !testLocks(s, k) : isOpen(s, k));
const itemName = (s, k) => msg(itemOf(s, k)?.name || bareOf(s).name);
// The checks' own locks, standing in for the wardrobe's while one is
// asked about (`lockForCheck`); never set in play.
let testLocks = null;
export function lockForCheck(fn) { testLocks = fn; if (built) say(); }
// The desk's way to Steam's own keyboard, when this is the Steam build: the
// other desk builds have the call too, and it answers null there.
let steamKeys;
function steamAsk() {
  if (steamKeys !== undefined) return steamKeys;
  const d = globalThis.desk;
  let steam = false;
  try { steam = typeof d?.askText === 'function' && d.version?.()?.target === 'steam'; } catch {}
  return (steamKeys = steam ? (...a) => d.askText(...a) : null);
}

function build(el) {
  el.textContent = '';
  hot.clear();
  const stepEl = span('wardstep');
  const tabs = div('pair', 'wardwho');
  const tab = {};
  for (const k of WHO) {
    const b = button(k === 'you' ? msg('ward-you') : msg('ward-sqouse'), 'wardtab');
    b.id = `ward${k}`;
    b.addEventListener('click', () => pick(k));
    tabs.appendChild(b);
    tab[k] = b;
  }

  // the close-up, and beside it the name and the role
  const big = document.createElement('canvas');
  big.className = 'wardbig';
  const head = div('wardid');
  const fields = div('wardfields');

  // the name: its field, the letters left, its die; and for a pad the
  // button that asks Steam, or the grid
  const nameRow = div('wardrow', 'wardname');
  nameRow.dataset.row = 'name';
  const input = document.createElement('input');
  Object.assign(input, { type: 'text', id: 'wardnamein', autocomplete: 'off', spellcheck: false });
  input.setAttribute('enterkeyhint', 'done');
  input.setAttribute('aria-label', msg('ward-name'));
  input.addEventListener('input', () => {
    const t = typedName(input.value);
    if (t !== input.value) input.value = t;
    typing = null;
    setName(who, t);
    say();
  });
  input.addEventListener('change', () => { input.value = nameOf(who); say(); });
  const count = span('wardcount');
  const askBtn = button('', 'wardask');
  askBtn.id = 'wardnamepad';
  askBtn.addEventListener('click', () => askSteam());
  nameRow.append(span('wardlabel', msg('ward-name')), input, askBtn, count, die(() => rollName(who)));
  const grid = div('wardkeys');
  grid.style.setProperty('--cols', NAME_GRID_COLS);
  for (const r of KEY_ROWS) r.keys.forEach((k, i) => {
    const b = button(k, 'wardkey');
    b.dataset.key = k;
    b.style.gridColumnStart = r.at + i * 2 + 1;
    b.style.gridColumnEnd = 'span 2';
    b.addEventListener('click', () => typeKey(k));
    grid.appendChild(b);
  });
  const space = button(msg('ward-key-space'), 'wardkey', 'wide');
  space.dataset.key = ' ';
  space.addEventListener('click', () => typeKey(' '));
  const del = button(msg('ward-key-del'), 'wardkey', 'wide');
  del.dataset.key = 'del';
  del.addEventListener('click', () => unType());
  space.style.gridColumn = '3 / span 10';
  del.style.gridColumn = '13 / span 6';
  grid.append(space, del);

  const roleRow = div('wardrow', 'wardrole');
  roleRow.dataset.row = 'role';
  const rPrev = button('<', 'wardarr', 'prev');
  rPrev.id = 'ward-role-prev';
  const rVal = span('wardval');
  const rNext = button('>', 'wardarr', 'next');
  rNext.id = 'ward-role-next';
  rPrev.addEventListener('click', () => { stepRole(who, -1); say(); });
  rNext.addEventListener('click', () => { stepRole(who, 1); say(); });
  const roleDie = die(() => rollRole(who));
  roleRow.append(span('wardlabel', msg('ward-role')), rPrev, rVal, rNext, roleDie);
  fields.append(nameRow, roleRow);
  head.append(big, fields);

  // a tab a slot, with how many of its items are open
  const slots = div('wardslots');
  slots.setAttribute('role', 'tablist');
  slots.dataset.row = 'slots';
  const slotTab = {};
  for (const s of SLOTS) {
    const b = button('', 'wardslot');
    b.id = `ward-${s.key}-tab`;   // never ending "back": pad.js finds the way back by that
    b.dataset.slot = s.key;
    b.setAttribute('role', 'tab');
    const n = span('wardn');
    b.append(span('wardsn', msg(s.name)), n);
    b.addEventListener('click', () => turnSlot(s.key));
    slots.appendChild(b);
    slotTab[s.key] = { b, n };
  }
  // the grid's heading: the slot and what is worn in it, how many are open,
  // and the slot's die
  const slotHead = div('wardslothead');
  const slotWorn = span('wardworn'), slotOpen = span('wardopen');
  const slotDie = die(() => rollOpen(slot));
  slotDie.id = 'wardslotdie';
  const right = span('wardr');
  right.append(slotOpen, slotDie);
  slotHead.append(slotWorn, right);
  // every slot's tiles, the one shown at a time
  const tiles = [];
  const gridOf = {};
  const grids = div('wardgrids');
  grids.style.setProperty('--tile-cols', WARD_TILE_COLS);
  grids.style.setProperty('--tile', `${WARD_TILE_W * WARD_TILE_K}px`);
  for (const s of SLOTS) {
    const g = div('wardtiles');
    g.dataset.slot = s.key;
    g.dataset.row = s.key;
    g.setAttribute('role', 'tabpanel');
    for (const it of s.items) {
      const b = button('', 'wardtile');
      b.id = `ward-tile-${s.key}-${it.key}`;
      b.dataset.slot = s.key;
      b.dataset.item = it.key;
      const c = document.createElement('canvas');
      c.style.width = `${WARD_TILE_W * WARD_TILE_K}px`;
      c.style.height = `${WARD_TILE_H * WARD_TILE_K}px`;
      const lk = glyph(7, 8, LOCK, 'wardlk');
      // under a locked tile's name, what opens it, there without a hover
      const u = span('wardtu', '');
      b.append(c, span('wardtn', msg(it.name)), u, lk);
      b.addEventListener('click', () => wearTile(s.key, it.key));
      const t = { b, c, lk, u, slot: s.key, key: it.key, aura: {} };
      const on = () => { hot.add(t); sayAbout(); }, off = () => { hot.delete(t); sayAbout(); };
      b.addEventListener('pointerenter', on);
      b.addEventListener('pointerleave', off);
      b.addEventListener('focus', on);
      b.addEventListener('blur', off);
      g.appendChild(b);
      tiles.push(t);
    }
    grids.appendChild(g);
    gridOf[s.key] = g;
  }
  // the line under the grid: the tile under the pointer or the focus, what
  // opens a locked one, and what is being tried on
  const about = div('wardabout');
  about.setAttribute('aria-live', 'polite');

  const edit = div('wardedit');
  edit.append(grid, slots, slotHead, grids, about);

  // the confirm steps: the name, or the role word with none, and the role
  const shown = div('wardshown');

  const foot = div('pair', 'wardfoot');
  const back = button(msg('set-controlsback'), 'wardback');
  back.id = 'wardflowprev';
  back.addEventListener('click', () => go(-1));
  const skip = button(msg('ward-skip'), 'wardskip');
  skip.id = 'wardskip';
  skip.addEventListener('click', () => {
    S.outfits = { you: { ...DEFAULTS.you }, sqouse: { ...DEFAULTS.sqouse } };
    close();
  });
  const roll = button(msg('ward-randomize-all'), 'wardroll');
  roll.id = 'wardroll';
  roll.addEventListener('click', () => { typing = null; tried = null; rollSquare(who); keepOpen(who); say(); });
  // every slot of the square bare, its name and role kept
  const clear = button(msg('ward-clear'), 'wardclear');
  clear.id = 'wardclear';
  clear.addEventListener('click', () => { tried = null; bareOutfit(who); say(); });
  const next = button(msg('ward-next'), 'wardnext');
  next.id = 'wardnext';
  next.addEventListener('click', () => go(1));
  foot.append(skip, back, roll, clear, next);
  el.append(stepEl, tabs, head, edit, shown, foot);
  el.addEventListener('keydown', keys);
  built = { el, stepEl, big, head, fields, tabs, tab, input, count, askBtn, grid, roleRow, rVal, rPrev, rNext, roleDie,
            slots, slotTab, slotWorn, slotOpen, slotDie, tiles, gridOf, grids, about,
            nameDie: nameRow.querySelector('.warddie'), edit, shown, back, skip, roll, clear, next };
  // the page's width sets how many rows each grid is, and the parts round
  // the grid their own heights (a font coming in, the letter grid up), so the
  // heights are measured again as any of them changes; the grid's own box is
  // left out, being what the measuring sets. On the next frame, not in the
  // observer's own call: the page it sets resizes what is observed.
  if (typeof ResizeObserver !== 'undefined') {
    let asked = false;
    const ro = new ResizeObserver(() => {
      if (!asked) { asked = true; requestAnimationFrame(() => { asked = false; fitGrid(); }); }
    });
    for (const part of [el, ...el.children, ...edit.children]) if (part !== edit && part !== grids) ro.observe(part);
  }
}

// The heights the grid gives way between on a short window (style.css,
// `.wardgrids`): its box the tallest slot's grid, never under WARD_GRID_ROWS
// rows of tiles; and the least the page and the part round the grid can be,
// everything at its own height but the grid at that floor, so on a window
// shorter still the sheet scrolls rather than anything being squeezed.
const px = (el, name, v) => { const s = `${Math.ceil(v)}px`; if (el.style.getPropertyValue(name) !== s) el.style.setProperty(name, s); };
function stacked(box, swap, h) {
  let sum = 0, n = 0;
  for (const c of box.children) {
    if (c.hidden || !c.getClientRects().length) continue;
    sum += c === swap ? h : c.getBoundingClientRect().height;
    n++;
  }
  return sum + Math.max(0, n - 1) * (parseFloat(getComputedStyle(box).rowGap) || 0);
}
// How tall a grid's first `n` rows of tiles stand, a part of a row for a
// part of `n` (a row with a locked tile's words under it stands taller than
// one without).
function rowsTall(g, n) {
  const top = g.getBoundingClientRect().top, feet = [];
  for (const t of g.children) {
    const r = t.getBoundingClientRect(), at = feet.findIndex(f => f.top === r.top);
    if (at < 0) feet.push({ top: r.top, foot: r.bottom });
    else feet[at].foot = Math.max(feet[at].foot, r.bottom);
  }
  const whole = Math.min(Math.floor(n), feet.length), part = n - Math.floor(n);
  const upTo = i => (i ? feet[i - 1].foot - top : 0);
  return upTo(whole) + (part && feet[whole] ? part * (feet[whole].foot - top - upTo(whole)) : 0);
}
function fitGrid() {
  const b = built;
  if (!b || b.edit.hidden || !shownEl(b.el)) return;
  // the tallest slot's, whichever is shown, so the page is one height
  const gs = Object.values(b.gridOf), tall = Math.max(...gs.map(g => g.scrollHeight));
  if (!tall) return;
  reserveAbout();
  const least = Math.min(tall, Math.max(...gs.map(g => rowsTall(g, WARD_GRID_ROWS))));
  px(b.grids, '--grids-h', tall);
  px(b.grids, '--grids-min', least);
  const edit = stacked(b.edit, b.grids, least);
  px(b.edit, '--edit-min', edit);
  px(b.el, '--ward-min', stacked(b.el, b.edit, edit));
}

// The page brought up to the two of them and to the step.
function say() {
  if (!built) return;
  built.said = JSON.stringify([S.selves, S.outfits, S.dressOffered]);
  const b = built, at = step >= 0 ? FLOW[step] : null;
  if (at) who = at.who;
  if (tried && tried.who !== who) tried = null;
  const kind = at ? at.kind : 'build';
  const head = document.getElementById('wardhead');
  if (head) writeInto(head, msg(at ? at.title : 'ward-appearance'));
  b.stepEl.hidden = !at;
  if (at) b.stepEl.textContent = msg('ward-step', { n: step + 1, of: FLOW.length });
  b.tabs.hidden = !!at;
  for (const k of WHO) {
    b.tab[k].classList.toggle('on', k === who);
    b.tab[k].setAttribute('aria-pressed', String(k === who));
  }
  b.fields.hidden = kind !== 'build';
  b.head.classList.toggle('alone', kind !== 'build');
  b.edit.hidden = kind !== 'build';
  b.shown.hidden = kind === 'build';

  const name = nameOf(who);
  if (document.activeElement !== b.input || typedName(b.input.value).trim() !== name) b.input.value = typing ?? name;
  b.input.placeholder = roleWord(who);
  b.input.maxLength = NAME_MAX * 2;            // the cap is counted in characters (`typedName`), not UTF-16
  b.count.textContent = String(NAME_MAX - [...name].length);
  b.askBtn.textContent = name || roleWord(who);
  padKeys();
  b.rVal.textContent = roleWord(who);

  // the slot tabs, the grid's heading, and every tile
  const o = outfitOf(who);
  for (const s of SLOTS) {
    const all = s.items.length, opened = s.items.filter(it => open(s.key, it.key)).length;
    const t = b.slotTab[s.key], on = s.key === slot;
    t.n.textContent = msg('ward-slot-open', { open: opened, all });
    t.b.classList.toggle('on', on);
    t.b.setAttribute('aria-selected', String(on));
    // every slot's grid stands in one cell, the others unseen but keeping
    // their space (style.css, `.wardgrids`), so the page is the tallest
    // slot's height whichever is shown, as the settings tabs are
    b.gridOf[s.key].classList.toggle('on', on);
    b.gridOf[s.key].inert = !on;
    if (on) {
      b.slotWorn.textContent = msg('ward-grid-head', { slot: msg(s.name), item: itemName(s.key, o[s.key]) });
      b.slotOpen.textContent = msg('ward-grid-open', { open: opened, all });
    }
  }
  for (const t of b.tiles) {
    const lock = lockOf(t.slot, t.key);
    const on = o[t.slot] === t.key;
    t.on = on;
    t.b.classList.toggle('on', on);
    t.b.classList.toggle('lock', !!lock);
    t.b.classList.toggle('tried', !!tried && tried.slot === t.slot && tried.key === t.key);
    t.b.setAttribute('aria-pressed', String(on));
    t.lk.style.visibility = lock ? 'visible' : 'hidden';
    t.u.textContent = lock ? lockWords(lock.name) : '';
    t.u.hidden = !lock;
    const nm = itemName(t.slot, t.key);
    t.b.title = lock ? msg('ward-locked', { item: nm, lock: lockWords(lock.name) }) : nm;
  }
  sayAbout();

  if (kind !== 'build') showSquares(kind === 'both' ? WHO : [who]);

  // the way on and back: skip on the first step, back on the rest
  b.skip.hidden = !at || step > 0;
  b.back.hidden = !at || step === 0;
  b.roll.hidden = kind !== 'build';
  b.clear.hidden = kind !== 'build';
  b.next.hidden = !at;
  b.next.textContent = at && step === FLOW.length - 1 ? msg('ward-done') : msg('ward-next');
  const backBtn = document.getElementById('wardrobeback');
  if (backBtn) { backBtn.hidden = !!at; backBtn.textContent = msg('set-controlsback'); }
  fitGrid();
}

// The line under the grid: the tile the pointer or the focus is on -- its
// name, and for a locked one what opens it -- and what is being tried on.
function fillAbout(box, at, tryItem) {
  box.textContent = '';
  if (at) {
    const lock = lockOf(at.slot, at.key), nm = itemName(at.slot, at.key);
    box.append(span('wardline', lock ? msg('ward-locked', { item: nm, lock: lockWords(lock.name) })
                                     : msg('ward-grid-head', { slot: msg(SLOTS.find(s => s.key === at.slot).name), item: nm })));
    if (lock && lock.note) box.append(span('wardline', lockWords(lock.note)));
  }
  if (tryItem) box.append(span('wardline', msg('ward-trying', { item: itemName(tryItem.slot, tryItem.key) })));
}
function sayAbout() {
  if (!built) return;
  const at = [...hot].pop() || built.tiles.find(t => t.b === document.activeElement);
  fillAbout(built.about, at && at.slot === slot ? at : null, tried);
}
// The tallest the info line can stand, measured: every tile's words, with the
// trying line under them, set in the box at its width. The box keeps that
// height, so hovering never moves the grid or the sheet.
let aboutAt = '';
function reserveAbout() {
  const b = built, box = b.about, w = box.clientWidth, key = `${w}|${msg('ward-trying', { item: '' })}`;
  if (!w || key === aboutAt) return;
  aboutAt = key;
  const keep = [...box.childNodes];
  box.style.minHeight = '0';
  let tall = 0;
  for (const t of b.tiles) {
    fillAbout(box, t, { slot: t.slot, key: t.key });
    tall = Math.max(tall, box.getBoundingClientRect().height);
  }
  box.replaceChildren(...keep);
  box.style.minHeight = '';
  px(box, '--about-h', tall);
}

// Each of `list` as a name over its role word; with no name, the role word
// alone, as the lines will read.
function showSquares(list) {
  const box = built.shown;
  box.textContent = '';
  for (const k of list) {
    const one = div('wardone');
    const name = nameOf(k);
    one.append(span('wardnm', name || roleWord(k)));
    if (name) one.append(span('wardrl', roleWord(k)));
    box.appendChild(one);
  }
}

// A tile picked: an open item is worn, a locked one tried on.
function wearTile(s, k) {
  typing = null;
  if (open(s, k)) { tried = null; wear(who, { [s]: k }); }
  else tried = tried && tried.slot === s && tried.key === k ? null : { who, slot: s, key: k };
  say();
}
// Nothing locked left on after a roll: the roll is the wardrobe's, and
// whatever it landed on that is shut goes back to bare.
function keepOpen(k) {
  const o = outfitOf(k), off = {};
  for (const s of SLOTS) if (!open(s.key, o[s.key])) off[s.key] = bareOf(s.key).key;
  if (Object.keys(off).length) wear(k, off);
}
function rollOpen(s) { tried = null; rollSlot(who, s); keepOpen(who); }

// The slot tabs turned, to a slot by name or a step along them (wrapping).
function turnSlot(to) {
  const i = SLOTS.findIndex(s => s.key === slot);
  slot = typeof to === 'number' ? SLOTS[(i + to + SLOTS.length) % SLOTS.length].key : to;
  tried = null;
  hot.clear();
  say();
}
// The tile worn in the slot shown, for the focus to land on.
const wornTile = () => built.tiles.find(t => t.slot === slot && t.on) || built.tiles.find(t => t.slot === slot);

// The pad's way to the name: Steam's keyboard behind a button where Steam
// can be asked, else the grid; neither without a pad, where the field is
// typed into.
function padKeys() {
  const b = built, pad = !!S.padOn && !b.edit.hidden;
  const steam = pad && !!steamAsk() && !gridAsked;
  b.askBtn.hidden = !steam;
  b.input.hidden = steam;
  b.grid.hidden = !pad || steam;
}
async function askSteam() {
  const ask = steamAsk();
  let got = null;
  try { got = ask ? await ask(msg('ward-name'), NAME_MAX, nameOf(who)) : null; } catch { got = null; }
  // Steam answers null for a keyboard it could not show as for one put
  // away; either way the grid is there to type on instead.
  if (typeof got === 'string') setName(who, got);
  else gridAsked = true;
  say();
}
// The grid's name as it is being typed, a space at its end kept until the
// next letter (the name the game keeps is trimmed); null once anything else
// has changed the name.
let typing = null;
function typeKey(k) {
  const now = typing ?? nameOf(who), t = typedName(now + k);
  if (t === now) return;
  typing = t;
  setName(who, t);
  say();
}
function unType() {
  typing = [...(typing ?? nameOf(who))].slice(0, -1).join('');
  setName(who, typing);
  say();
}

function pick(k) { if (step < 0) { who = k; typing = null; tried = null; say(); } }
function go(by) {
  typing = null;
  tried = null;
  const to = step + by;
  if (to >= FLOW.length) { close(); return; }
  step = Math.max(0, to);
  say();
}

let onClose = null;
// Done, or skip: the yard has been offered its steps, and the names and roles
// stay open to change from the house's board.
const close = () => {
  if (step >= 0) S.dressOffered = true;
  step = -1;
  tried = null;
  S.naming = false;
  onClose?.();
};

// The page turned to, into `el`: `start` true for the new yard's steps.
// `leave` is how the sheet lets the page go (settings.js).
export function showWardrobe(el, { start = false, leave = null } = {}) {
  if (!built || built.el !== el) build(el);
  step = start ? 0 : -1;
  S.naming = start;
  onClose = leave;
  gridAsked = false;
  typing = null;
  tried = null;
  if (start) { who = 'you'; slot = SLOTS[0].key; }
  say();
}
// Whether the new yard's steps are up, which own the way back and on.
export const wardrobeOffer = () => step >= 0;
export const leaveWardrobe = () => close();
// The house board's row opens the page (crewboard.js), but the sheet is
// settings.js's to bring up, and settings.js sits behind the board in the
// import ring: it hands its way in here at load, and the row asks for it.
let opener = null;
export function wardrobeOpener(fn) { opener = fn; }
export function openWardrobe() { opener?.(); }

// --- the pad and the keys ---------------------------------------------------------
// What the focus is in: the name (its row, or the letter grid), the role's
// row, the slot tabs, or a slot (a tile of its grid, or the grid's die).
function rowAt(el) {
  if (!el?.closest) return null;
  if (el === built.slotDie) return slot;
  return el.closest('[data-row]')?.dataset.row || (el.closest('.wardkeys') ? 'name' : null);
}
// Y, or y: the roll of the row the focus is in, the slot shown from
// anywhere else.
function rollAt(el) {
  typing = null;
  const row = rowAt(el);
  if (row === 'name') rollName(who);
  else if (row === 'role') rollRole(who);
  else rollOpen(SLOTS.some(s => s.key === row) ? row : slot);
  say();
}
// From a tile, the nearest tile that way in its own grid, the rows a short
// window has scrolled out of sight counted with the seen ones, and scrolled
// to: the grid is walked to its last row before a press leaves it (a row out
// of sight under it stands further off than the buttons at the page's foot).
function gridStep(el, d) {
  const g = built.gridOf[slot];
  if (!el?.classList?.contains('wardtile') || !g.contains(el)) return false;
  const mid = b => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, b }; };
  const r = el.getBoundingClientRect();
  const to = nav.toward({ x: r.left, y: r.top, w: r.width, h: r.height }, d, [...g.children].filter(b => b !== el).map(mid));
  if (!to) return false;
  nav.focus(to.b);
  to.b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  return true;
}
// A direction the page answers itself: across or along a grid to its next
// tile, left and right on the role's row step it, and on the slot tabs turn
// them. True if it was answered.
function stepAt(el, d) {
  if (gridStep(el, d)) return true;
  if (d !== 'left' && d !== 'right') return false;
  const by = d === 'right' ? 1 : -1, row = rowAt(el);
  if (row === 'role') { stepRole(who, by); say(); return true; }
  if (row === 'slots') { turnSlot(by); nav.focus(built.slotTab[slot].b); return true; }
  return false;
}
// LT and RT, or [ and ]: the next slot tab, the focus on its worn tile.
function turnFrom(by) {
  turnSlot(by);
  const t = wornTile();
  if (t) nav.focus(t.b);
}

// The keyboard: the arrows go to the nearest button that way, as the pad's
// d-pad does, and Enter is the button's own; y rolls, [ and ] turn the slot
// tabs. Not while the name is being typed into its field.
function keys(e) {
  if (!built || built.edit.hidden || e.target === built.input || e.altKey || e.ctrlKey || e.metaKey) return;
  const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
  if (dir) {
    if (!stepAt(e.target, dir)) {
      const from = e.target.getBoundingClientRect();
      const list = [...built.el.querySelectorAll('button')].filter(b => b !== e.target && shownEl(b) && !b.closest('[inert]'));
      const to = nav.toward({ x: from.left, y: from.top, w: from.width, h: from.height }, dir,
                            list.map(b => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, b }; }));
      to?.b.focus();
    }
  } else if (e.key === 'y' || e.key === 'Y') rollAt(e.target);
  else if (e.key === '[' || e.key === ']') turnFrom(e.key === ']' ? 1 : -1);
  else return;
  e.preventDefault();
  e.stopPropagation();
}

// The pad, on top of the page's own moves between its buttons: Y rolls, X
// takes a letter back while the grid is up, LT and RT turn the slot tabs,
// LB and RB are the tabs for the two of you. Through the new yard's steps B
// is the step back and menu the step on, never the sheet's own let-go.
// Answers the directions it left for the page, and whether it took B.
export function wardrobePad(dirs, pressed) {
  if (!built || !shownEl(built.el)) return { dirs, took: false };
  padKeys();
  if (step < 0) {
    if (pressed('lb')) pick(WHO[0]);
    if (pressed('rb')) pick(WHO[1]);
  }
  const editing = !built.edit.hidden;
  if (editing && (pressed('lt') || pressed('rt'))) turnFrom(pressed('rt') ? 1 : -1);
  if (pressed('y') && editing) rollAt(document.activeElement);
  if (pressed('x') && !built.grid.hidden) unType();
  let took = false;
  if (step >= 0) {
    if (pressed('b')) { if (step > 0) go(-1); took = true; }
    if (pressed('menu')) { go(1); took = true; }
  }
  if (!editing) return { dirs, took };
  return { took, dirs: dirs.filter(d => !stepAt(document.activeElement, d)) };
}
// Whether the new yard's steps are on the glass: the pad's menu is theirs.
export const wardrobeHolds = () => step >= 0 && !!built && shownEl(built.el);
const shownEl = el => !!el && !el.hidden && el.getClientRects().length > 0;

// --- the pictures ------------------------------------------------------------------
// A canvas sized to the box it is laid in, in device pixels, `k` screen
// pixels a world pixel; the context back with its transform set.
function fit(c, k, h) {
  const d = devicePixelRatio || 1, w = c.clientWidth || 1;
  const W = Math.round(w * d), H = Math.round(h * d);
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  c.style.height = `${h}px`;
  const g = c.getContext('2d');
  g.setTransform(k * d, 0, 0, k * d, 0, 0);
  g.imageSmoothingEnabled = false;
  return { g, w: w / k, h: h / k };
}
// The ground a square stands on, `gy` down a picture `w` wide.
function ground(g, w, h, gy, inks) {
  g.fillStyle = inks.paper;
  g.fillRect(0, 0, w, h);
  g.fillStyle = inks.ink;
  g.fillRect(0, gy, w, 1);
}
// the close-up's two, a key apiece for an aura to remember their walk by,
// and a third for the faint pass of a try-on
const CLOSE = [{}, {}];
const TRY = {};
// The try-on's own sheet, the close-up's size, cleared for each frame.
let trySheet = null;
function tryOn(w, h) {
  if (!trySheet) trySheet = document.createElement('canvas').getContext('2d');
  const c = trySheet.canvas;
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  trySheet.setTransform(1, 0, 0, 1, 0, 0);
  trySheet.clearRect(0, 0, w, h);
  return trySheet;
}
// A tile's square: bare but for its own item, and eyes, so a square with
// nothing on its face still reads as one; on a face tile, the face is the item.
const tileOutfit = (s, k) => {
  const o = Object.fromEntries(SLOTS.map(x => [x.key, bareOf(x.key).key]));
  if (itemOf('face', 'eyes')) o.face = 'eyes';
  o[s] = k;
  return o;
};

// Once a frame while the page is up: the close-up and the shown slot's
// tiles, walking on the page's own clock (the yard is held under the sheet).
export function paintWardrobe(t = performance.now()) {
  if (!built || !shownEl(built.el)) return;
  padKeys();                         // a pad seen or put down while the page is up
  // the two of them changed from outside the page (a save come back, a hook)
  const now = JSON.stringify([S.selves, S.outfits, S.dressOffered]);
  if (now !== built.said) say();
  const s = t / 1000;
  const both = step === FLOW.length - 1;
  const alone = !built.fields.hidden;
  {
    // beside the fields its own width, which they wrap under where the page
    // is too narrow for both (style.css); alone, the page's
    built.big.style.width = alone ? `${WARD_BIG_W * WARD_BIG}px` : '';
    const { g, w, h } = fit(built.big, WARD_BIG, WARD_BIG_H * WARD_BIG);
    ground(g, w, h, Math.round(h - P), YARD_INKS);
    const gy = Math.round(h - P);
    // a turn now and then, so the things that hang off the back are seen moving
    const moving = s % 6 >= 4;
    WHO.forEach((k2, i) => {
      if (!both && k2 !== who) return;
      const x = Math.round(w * (both ? (i ? 0.66 : 0.34) : 0.5) - WORKER / 2);
      const look = { dir: both && i ? -1 : 1, moving, t: s, inks: YARD_INKS, seed: i };
      const o = outfitOf(k2), on = tried && tried.who === k2 ? tried : null;
      // a try-on: the square with that slot bare, and over it, faint, the
      // square in the item tried, so only the item is faint
      drawDressed(g, x, gy - WORKER, { ...look, outfit: on ? { ...o, [on.slot]: bareOf(on.slot).key } : o, key: CLOSE[i] });
      if (on) {
        // drawn whole on a sheet of its own and laid over faint: drawn
        // faint in place, its own overlaps (the paper over the rim) would
        // grey the square too
        const c = built.big, tc = tryOn(c.width, c.height);
        tc.setTransform(g.getTransform());
        tc.imageSmoothingEnabled = false;
        drawDressed(tc, x, gy - WORKER, { ...look, outfit: { ...o, [on.slot]: on.key }, key: TRY });
        g.save();
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalAlpha = WARD_TRY_ALPHA;
        g.drawImage(tc.canvas, 0, 0);
        g.restore();
      }
    });
  }
  if (built.edit.hidden) return;
  for (const tile of built.tiles) {
    if (tile.slot !== slot) continue;
    const { g, w, h } = fit(tile.c, WARD_TILE_K, WARD_TILE_H * WARD_TILE_K);
    // the chosen tile turned over, in the deep's inks as the deep is
    const inks = tile.on ? DEEP_INKS : YARD_INKS;
    const gy = h - WARD_TILE_FOOT;
    ground(g, w, h, gy, inks);
    drawDressed(g, Math.round((w - WORKER) / 2), gy - WORKER,
                { outfit: tileOutfit(tile.slot, tile.key), dir: 1, moving: hot.has(tile), t: s, inks, key: tile.aura, seed: 0 });
    if (tile.on) {
      g.globalCompositeOperation = 'difference';
      g.fillStyle = raw('#fff');
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'source-over';
    }
  }
}
