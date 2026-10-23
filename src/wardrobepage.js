// The two of them's page: who each is and what each wears, a page of the
// held sheet (DESIGN.md, "What the two of them wear" and "Who you are"; the
// mocks' votes, docs/mocks/pair-wardrobe-2026-10-16,
// docs/mocks/who-you-are-2026-10-16, layout A of
// docs/mocks/wardrobe-expansion-2026-10-16, and D2 of
// docs/mocks/appearance-hierarchy-2026-10-16). At the top a switch between
// you and your sqouse, each with its square small; under it the name and the
// title; then the one being chosen close up, its six slots round it, three a
// side in the order they are worn down the body, each a button with the
// slot's item drawn on it, and the chosen slot's guide line to where it is
// worn. Under them the chosen slot's every item at once, a grid of tiles
// headed by the slot's name inverted as its button is, each tile the bare
// square wearing that item. The chosen tile is inverted; a locked one is
// faint, under a lock, and says what opens it. Picking a locked one tries it
// on the close-up, faint, and is not kept. The slot's die is beside the
// grid's count; the roll of the whole square but its name, and the clear
// that takes every slot back to bare, at the foot.
//
// It is reached two ways. Once at a new yard, before the opening walks out
// (`offerDress`), as four steps: build who you are, confirm your square,
// build your sqouse, and a last look at the two of you; done there lets the
// opening go. And always as a row on the house's board (crewboard.js), with
// the switch for each; the name and the role can be changed there at any time.
//
// Mouse, finger and keyboard type the name into its field. A pad moves
// between the page's buttons as on every page (padpage.js), the nearest that
// way, but never into the grid from outside it: A on a slot opens its grid
// with the focus on the tile worn, A on a tile wears it, B in the grid goes
// back to its slot's button, and B anywhere else is the sheet's own. Y rolls
// what the focus is in (a slot or its grid, the name, the role), left and
// right on the role's row step it, LT and RT are the slot before and after
// from anywhere, LB and RB are you and your sqouse. The keyboard the same:
// the arrows, Enter, Escape for B in the grid, y, and [ and ] for the slots.
// For the name, Steam's own keyboard where the desk has Steam to ask
// (`desk.askText`), and anywhere else, or when Steam cannot show one, a grid
// of letters under the name row: A types the key, X takes the last letter back.

import { msg, writeInto, has } from './lang.js';
import { S } from './state.js';
import { showTipAt } from './board.js';
import { P, WORKER, WARD_BIG, WARD_BIG_W, WARD_BIG_H, WARD_TILE_W, WARD_TILE_H, WARD_TILE_K, WARD_TILE_FOOT, WARD_TILE_COLS,
         WARD_TRY_ALPHA, WARD_GRID_ROWS, WARD_SLOT_W, WARD_SLOT_H, WARD_SLOT_FOOT, WARD_MINI_W, WARD_MINI_H, WARD_MINI_FOOT,
         WARD_PARTS, WARD_LEAD_W, WARD_LEAD_DOT, NAME_MAX, NAME_GRID_COLS } from './config.js';
import { SLOTS, WHO, DEFAULTS, itemOf, bareOf, outfitOf, rollSlot, nameOf, setName, stepRole, rollName,
         rollRole, rollSquare, bareOutfit, typedName, storyArgs, wear, itemLock, isOpen } from './wardrobe.js';
import { drawDressed, headHeight, YARD_INKS, DEEP_INKS } from './render/wardrobe.js';
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
const canvasOf = (cls, w, h) => {
  const c = document.createElement('canvas');
  if (cls) c.className = cls;
  c.style.width = `${w}px`;
  c.style.height = `${h}px`;
  return c;
};
// Small pictures in the button's own ink, on a grid of whole units.
const SVG = 'http://www.w3.org/2000/svg';
const svgEl = (name, attrs = {}) => {
  const e = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};
function glyph(w, h, rects, cls) {
  const s = svgEl('svg', { viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true' });
  if (cls) s.setAttribute('class', cls);
  for (const [x, y, rw, rh, fill = true] of rects) {
    const r = svgEl('rect', { x, y, width: rw, height: rh, fill: fill ? 'currentColor' : 'none' });
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
  // you and your sqouse: a segmented pair, each with its square small
  const tabs = div('pair', 'wardwho');
  const tab = {};
  for (const k of WHO) {
    const b = button('', 'wardtab');
    b.id = `ward${k}`;
    const c = canvasOf('wardmini', WARD_MINI_W, WARD_MINI_H);
    b.append(c, span('wardwl', k === 'you' ? msg('ward-you') : msg('ward-sqouse')));
    b.addEventListener('click', () => pick(k));
    tabs.appendChild(b);
    tab[k] = { b, c, aura: {} };
  }

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
  fields.append(nameRow, grid, roleRow);

  // the close-up, its six slots round it and the chosen one's guide line
  const stage = div('wardstage');
  const big = document.createElement('canvas');
  big.className = 'wardbig';
  const lead = svgEl('svg', { class: 'wardlead', 'aria-hidden': 'true' });
  const leads = {};
  stage.append(big, lead);
  const slotBtn = {};
  for (const s of SLOTS) {
    const b = button('', 'wardslot');
    b.id = `ward-${s.key}-slot`;   // never ending "back": pad.js finds the way back by that
    b.dataset.slot = s.key;
    b.dataset.row = s.key;
    const c = canvasOf('wardsg', WARD_SLOT_W, WARD_SLOT_H);
    const worn = span('wardsw');
    const words = span('wardst');
    words.append(span('wardsk', msg(s.name)), worn);
    b.append(c, words);
    // a click is the slot chosen; a click from a key or a pad's A (no
    // pointer, so no count of clicks) is the grid opened too, its worn tile
    // taking the focus
    b.addEventListener('click', e => {
      turnSlot(s.key);
      if (e.detail === 0) { const t = wornTile(); if (t) nav.focus(t.b); }
    });
    stage.appendChild(b);
    slotBtn[s.key] = { b, c, worn, aura: {} };
    const g = svgEl('g', { 'data-slot': s.key });
    const line = svgEl('polyline', { fill: 'none', 'stroke-width': WARD_LEAD_W });
    const dot = svgEl('rect', { width: WARD_LEAD_DOT, height: WARD_LEAD_DOT });
    g.append(line, dot);
    lead.appendChild(g);
    leads[s.key] = { g, line, dot };
  }
  // A slot's button laid out unseen with every item's name in it, for the
  // narrowest a slot's button can be and the most lines a name takes in one
  // (`slotLeast`, `slotLines`): neither may be guessed, or a name nobody has written
  // yet is cut.
  const probe = button('', 'wardslot', 'wardprobe');
  probe.inert = true;
  probe.tabIndex = -1;
  probe.setAttribute('aria-hidden', 'true');
  const probeWorn = span('wardsw');
  const probeWords = span('wardst');
  probeWords.append(span('wardsk', SLOTS.map(s => msg(s.name)).join(' ')), probeWorn);
  probe.append(canvasOf('wardsg', WARD_SLOT_W, WARD_SLOT_H), probeWords);
  stage.appendChild(probe);

  // the grid: its head, the slot's name inverted as the chosen slot's
  // button is, so the two read as one, and beside it how many are open and
  // the slot's die; under it every slot's tiles, the one chosen shown
  const box = div('wardbox');
  const boxHead = div('wardgridhead');
  const gridTab = span('wardgridtab');
  const slotOpen = span('wardopen');
  const slotDie = die(() => rollOpen(slot));
  slotDie.id = 'wardslotdie';
  const right = span('wardr');
  right.append(slotOpen, slotDie);
  boxHead.append(gridTab, right);
  const tiles = [];
  const gridOf = {};
  const grids = div('wardgrids');
  grids.style.setProperty('--tile-cols', WARD_TILE_COLS);
  grids.style.setProperty('--tile', `${WARD_TILE_W * WARD_TILE_K}px`);
  for (const s of SLOTS) {
    const g = div('wardtiles');
    g.dataset.slot = s.key;
    g.dataset.row = s.key;
    for (const it of s.items) {
      const b = button('', 'wardtile');
      b.id = `ward-tile-${s.key}-${it.key}`;
      b.dataset.slot = s.key;
      b.dataset.item = it.key;
      const c = canvasOf('', WARD_TILE_W * WARD_TILE_K, WARD_TILE_H * WARD_TILE_K);
      const lk = glyph(7, 8, LOCK, 'wardlk');
      // under a locked tile's name, what opens it, there without a hover
      const u = span('wardtu', '');
      b.append(c, span('wardtn', msg(it.name)), u, lk);
      b.addEventListener('click', () => wearTile(s.key, it.key));
      const t = { b, c, lk, u, slot: s.key, key: it.key, aura: {} };
      const on = () => { hot.add(t); tipFor(t); }, off = () => { hot.delete(t); if (hot.size) tipFor([...hot].pop()); else showTipAt(null); };
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
  box.append(boxHead, grids);

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
  el.append(stepEl, tabs, fields, stage, box, shown, foot);
  el.addEventListener('keydown', keys);
  built = { el, stepEl, big, k: WARD_BIG, fields, tabs, tab, input, count, askBtn, grid, roleRow, rVal, rPrev, rNext, roleDie,
            stage, lead, leads, slotBtn, probe, probeWorn, box, gridTab, slotOpen, slotDie, tiles, gridOf, grids,
            nameDie: nameRow.querySelector('.warddie'), shown, back, skip, roll, clear, next };
  // the page's width sets how big the close-up can be and how many rows each
  // grid is, and the parts round the grid their own heights (a font coming
  // in, the letter grid up), so all of it is measured again as any of them
  // changes; the grid's own box is left out, being what the measuring sets.
  // On the next frame, not in the observer's own call: the page it sets
  // resizes what is observed.
  if (typeof ResizeObserver !== 'undefined') {
    let asked = false;
    const ro = new ResizeObserver(() => {
      if (!asked) { asked = true; requestAnimationFrame(() => { asked = false; fitGrid(); }); }
    });
    for (const part of [el, ...el.children, ...box.children]) if (part !== box && part !== grids) ro.observe(part);
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
    if (c.hidden || !c.getClientRects().length || getComputedStyle(c).position === 'absolute') continue;
    const cs = getComputedStyle(c);
    sum += (c === swap ? h : c.getBoundingClientRect().height) + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
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
// Every tile's name in a slot stands as tall as that slot's longest, measured,
// so a row is even and no name is cut.
function reserveNames() {
  for (const g of Object.values(built.gridOf)) {
    g.style.removeProperty('--tn-h');
    px(g, '--tn-h', Math.max(0, ...[...g.querySelectorAll('.wardtn')].map(n => n.getBoundingClientRect().height)));
  }
}
// Whether the slots stand three a side of the close-up (a desk) or in two
// rows under it (a phone): style.css says, by `--ward-side`.
const sideBySide = () => getComputedStyle(built.stage).getPropertyValue('--ward-side').trim() !== '0';
// The slots' buttons measured off the unseen one: the narrowest any can be,
// every item's name in it wrapping at its spaces (its longest word, then);
// and laid at the width a button has, the most lines any name takes there,
// which every button's worn name is given, so a square in longer names is
// no taller and the page stays one height.
const allNames = () => [...new Set(SLOTS.flatMap(s => s.items.map(it => itemName(s.key, it.key))))];
function slotLeast() {
  const b = built;
  b.probe.style.width = 'min-content';
  b.probeWorn.textContent = allNames().join(' ');
  return b.probe.getBoundingClientRect().width;
}
// At the width a button is given, `w`: the lines are read there.
function slotLines(w) {
  const b = built;
  b.probe.style.width = `${w}px`;
  let lines = 0;
  for (const n of allNames()) { b.probeWorn.textContent = n; lines = Math.max(lines, b.probeWorn.getBoundingClientRect().height); }
  return lines;
}
// The close-up as large as the page lets it be, a whole number of screen
// pixels a world pixel: beside the slots, what is left between them; over
// them on a phone, or alone on a confirm step, the most it is ever drawn.
function sizeBig() {
  const b = built, alone = b.stage.classList.contains('alone');
  let k = WARD_BIG, width = `${WARD_BIG_W * WARD_BIG}px`, side = 0;
  if (alone && step === FLOW.length - 1) width = '100%';
  else if (!alone && sideBySide()) {
    const least = slotLeast();
    px(b.stage, '--slot-min', least);
    const gap = parseFloat(getComputedStyle(b.stage).columnGap) || 0;
    const room = b.stage.clientWidth - 2 * gap - 2 * Math.ceil(least);
    k = Math.max(1, Math.min(WARD_BIG, Math.floor(room / WARD_BIG_W)));
    width = `${WARD_BIG_W * k}px`;
    side = (b.stage.clientWidth - 2 * gap - WARD_BIG_W * k) / 2;
  } else if (!alone) {
    k = Math.max(1, Math.min(WARD_BIG, Math.floor(b.stage.clientWidth / WARD_BIG_W)));
    width = `${WARD_BIG_W * k}px`;
  }
  b.k = k;
  if (b.big.style.width !== width) b.big.style.width = width;
  const h = `${WARD_BIG_H * k}px`;
  if (b.big.style.height !== h) b.big.style.height = h;
  if (side) px(b.stage, '--sw-h', slotLines(side));
}
function fitGrid() {
  const b = built;
  if (!b || !shownEl(b.el)) return;
  sizeBig();
  lead();
  if (b.box.hidden) return;
  reserveNames();
  // the tallest slot's, whichever is shown, so the page is one height
  const gs = Object.values(b.gridOf), tall = Math.max(...gs.map(g => g.scrollHeight));
  if (!tall) return;
  const least = Math.min(tall, Math.max(...gs.map(g => rowsTall(g, WARD_GRID_ROWS))));
  // the grid's own edge counted in, as its box is drawn
  const edge = b.grids.offsetHeight - b.grids.clientHeight;
  px(b.grids, '--grids-h', tall + edge);
  px(b.grids, '--grids-min', least + edge);
  const box = stacked(b.box, b.grids, least + edge);
  px(b.box, '--box-min', box);
  px(b.el, '--ward-min', stacked(b.el, b.box, box));
}

// The chosen slot's guide line, from its button's edge nearest the close-up
// to where that slot is worn on the square, across and then up or down so it
// keeps to the page's square lines. Every slot has its line laid; only the
// chosen one's is seen, and the others fade out as it fades in (style.css,
// `.wardlead`).
function lead() {
  const b = built;
  if (b.stage.classList.contains('alone')) return;
  const St = b.stage.getBoundingClientRect(), Q = b.big.getBoundingClientRect(), k = b.k;
  if (!Q.width) return;
  const w = Q.width / k;
  const x0 = Math.round(w * 0.5 - WORKER / 2), y0 = Math.round(WARD_BIG_H - P) - WORKER;
  const o = drawnOutfit(who);
  for (const s of SLOTS) {
    const l = b.leads[s.key];
    l.g.classList.toggle('on', s.key === slot);
    const [wx, wy] = WARD_PARTS[s.key];
    const lift = s.key === 'head' ? headHeight({ outfit: o }) : 0;
    const px0 = Math.round(Q.left - St.left + (x0 + wx) * k), py0 = Math.round(Q.top - St.top + (y0 + wy - lift) * k);
    const B = b.slotBtn[s.key].b.getBoundingClientRect();
    const L = B.left - St.left, R = B.right - St.left, T = B.top - St.top, D = B.bottom - St.top;
    const inset = WARD_LEAD_DOT;
    const clampY = v => Math.round(Math.min(Math.max(v, T + inset), D - inset));
    const clampX = v => Math.round(Math.min(Math.max(v, L + inset), R - inset));
    let ax, ay;
    if (R < px0 - inset) { ax = Math.round(R); ay = clampY(py0); }
    else if (L > px0 + inset) { ax = Math.round(L); ay = clampY(py0); }
    else if (D < py0) { ax = clampX(px0); ay = Math.round(D); }
    else { ax = clampX(px0); ay = Math.round(T); }
    const mid = Math.abs(ax - px0) > Math.abs(ay - py0) ? `${px0},${ay}` : `${ax},${py0}`;
    l.line.setAttribute('points', `${ax},${ay} ${mid} ${px0},${py0}`);
    l.dot.setAttribute('x', px0 - WARD_LEAD_DOT / 2);
    l.dot.setAttribute('y', py0 - WARD_LEAD_DOT / 2);
  }
}
// What the close-up wears for `k`: its outfit, with a locked item tried on.
const drawnOutfit = k => (tried && tried.who === k ? { ...outfitOf(k), [tried.slot]: tried.key } : outfitOf(k));

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
    b.tab[k].b.classList.toggle('on', k === who);
    b.tab[k].b.setAttribute('aria-pressed', String(k === who));
  }
  const building = kind === 'build';
  b.fields.hidden = !building;
  b.stage.classList.toggle('alone', !building);
  b.box.hidden = !building;
  b.shown.hidden = building;

  const name = nameOf(who);
  if (document.activeElement !== b.input || typedName(b.input.value).trim() !== name) b.input.value = typing ?? name;
  b.input.placeholder = roleWord(who);
  b.input.maxLength = NAME_MAX * 2;            // the cap is counted in characters (`typedName`), not UTF-16
  b.count.textContent = String(NAME_MAX - [...name].length);
  b.askBtn.textContent = name || roleWord(who);
  padKeys();
  b.rVal.textContent = roleWord(who);

  // the slots' buttons, the grid's head, and every tile
  const o = outfitOf(who);
  for (const s of SLOTS) {
    const all = s.items.length, opened = s.items.filter(it => open(s.key, it.key)).length;
    const sb = b.slotBtn[s.key], on = s.key === slot, worn = itemName(s.key, o[s.key]);
    sb.b.hidden = !building;
    sb.b.classList.toggle('on', on);
    sb.b.setAttribute('aria-pressed', String(on));
    sb.b.setAttribute('aria-label', msg('ward-grid-head', { slot: msg(s.name), item: worn }));
    sb.worn.textContent = worn;
    // every slot's grid stands in one cell, the others unseen but keeping
    // their space (style.css, `.wardgrids`), so the page is the tallest
    // slot's height whichever is shown, as the settings tabs are
    b.gridOf[s.key].classList.toggle('on', on);
    b.gridOf[s.key].inert = !on;
    if (on) {
      b.gridTab.textContent = msg(s.name);
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
    t.b.setAttribute('aria-label', lock ? lockTip(t) : nm);
  }
  const lit = [...hot].pop() || built.tiles.find(t => t.b === document.activeElement);
  if (lit) tipFor(lit);

  if (!building) showSquares(kind === 'both' ? WHO : [who]);

  // the way on and back: skip on the first step, back on the rest
  b.skip.hidden = !at || step > 0;
  b.back.hidden = !at || step === 0;
  b.roll.hidden = !building;
  b.clear.hidden = !building;
  b.next.hidden = !at;
  b.next.textContent = at && step === FLOW.length - 1 ? msg('ward-done') : msg('ward-next');
  const backBtn = document.getElementById('wardrobeback');
  if (backBtn) { backBtn.hidden = !!at; backBtn.textContent = msg('set-controlsback'); }
  fitGrid();
}

// A locked tile's words, in the game's own tooltip (board.js `showTipAt`),
// under the tile on a hover and on the focus: what it is and what opens it,
// and the lock's note. An open tile has none; its name is on its face.
function lockTip(t) {
  const lock = lockOf(t.slot, t.key);
  if (!lock) return '';
  const head = msg('ward-locked', { item: itemName(t.slot, t.key), lock: lockWords(lock.name) });
  return lock.note ? `${head}. ${lockWords(lock.note)}` : head;
}
function tipFor(t) {
  const words = t.slot === slot ? lockTip(t) : '';
  if (!words) { showTipAt(null); return; }
  const r = t.b.getBoundingClientRect();
  showTipAt(words, r.left + r.width / 2, r.bottom + 4, true);
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

// The slot chosen, by name or a step along the slots (wrapping), in the
// order they are listed: head, face, neck, back, pattern, aura.
function turnSlot(to) {
  const i = SLOTS.findIndex(s => s.key === slot);
  const was = slot;
  slot = typeof to === 'number' ? SLOTS[(i + to + SLOTS.length) % SLOTS.length].key : to;
  if (slot !== was) {
    tried = null;
    hot.clear();
    showTipAt(null);
  }
  say();
}
// The tile worn in the slot shown, for the focus to land on.
const wornTile = () => built.tiles.find(t => t.slot === slot && t.on) || built.tiles.find(t => t.slot === slot);

// The pad's way to the name: Steam's keyboard behind a button where Steam
// can be asked, else the grid; neither without a pad, where the field is
// typed into.
function padKeys() {
  const b = built, pad = !!S.padOn && !b.fields.hidden;
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
  // a pad comes onto the page at the chosen slot; a new yard's steps start
  // it on the name, at the top, as the page reads
  if (S.padOn && !start) nav.focus(built.slotBtn[slot].b);
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
// row, or a slot (its button, a tile of its grid, or the grid's die).
function rowAt(el) {
  if (!el?.closest) return null;
  if (el === built.slotDie) return slot;
  return el.closest('[data-row]')?.dataset.row || (el.closest('.wardkeys') ? 'name' : null);
}
// Whether the focus is in the chosen slot's grid, or on a slot's button.
const inBox = el => !!el && built.box.contains(el);
const onSlot = el => !!el?.classList?.contains('wardslot');
// Y, or y: the roll of what the focus is in, the slot shown from anywhere
// else.
function rollAt(el) {
  typing = null;
  const row = rowAt(el);
  if (row === 'name') rollName(who);
  else if (row === 'role') rollRole(who);
  else rollOpen(SLOTS.some(s => s.key === row) ? row : slot);
  say();
}
const mid = b => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, b }; };
const boxOf = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
// From a tile, the nearest tile that way in its own grid, the rows a short
// window has scrolled out of sight counted with the seen ones, and scrolled
// to: the grid is walked to its last row before a press leaves it (a row out
// of sight under it stands further off than the buttons at the page's foot).
function gridStep(el, d) {
  const g = built.gridOf[slot];
  if (!el?.classList?.contains('wardtile') || !g.contains(el)) return false;
  const to = nav.toward(boxOf(el), d, [...g.children].filter(b => b !== el).map(mid));
  // a row's end is the grid's edge: across it is nothing, never a key
  // across the page level with some other row
  if (!to) return d === 'left' || d === 'right';
  nav.focus(to.b);
  to.b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  return true;
}
// Everything on the sheet a press can stand on but the tiles: the grid is
// gone into by A on its slot, never walked into from beside it.
function outside() {
  const sheet = built.el.closest('#held') || built.el.parentElement || built.el;
  return [...sheet.querySelectorAll('button, a[href], input[type="range"]')]
    .filter(b => shownEl(b) && !b.closest('[inert]') && !b.classList.contains('wardtile') && b.getBoundingClientRect().width >= 1);
}
// A direction the page answers itself: across or along a grid to its next
// tile, left and right on the role's row step it, and anywhere else on the
// sheet the nearest that way of everything but the tiles. True if it was
// answered (a press with nothing that way is answered by nothing).
function stepAt(el, d) {
  if (!el || !built.el.parentElement?.contains(el)) return false;
  if (gridStep(el, d)) return true;
  if ((d === 'left' || d === 'right') && rowAt(el) === 'role') { stepRole(who, d === 'right' ? 1 : -1); say(); return true; }
  // from a slot, the slots first: the six are one control round the
  // close-up, and a wide key over them stands nearer by the rule than the
  // slot across the square
  const from = boxOf(el), all = outside().filter(b => b !== el);
  const to = (onSlot(el) && nav.toward(from, d, all.filter(onSlot).map(mid))) || nav.toward(from, d, all.map(mid));
  if (to) nav.focus(to.b);
  return true;
}
// LT and RT, or [ and ]: the slot before or after, the focus kept where it
// was -- in the grid, on the new grid's worn tile; on a slot, on the new slot.
function turnFrom(by) {
  const at = document.activeElement, grid = inBox(at), slotted = onSlot(at);
  turnSlot(by);
  if (grid) { const t = wornTile(); if (t) nav.focus(t.b); }
  else if (slotted) nav.focus(built.slotBtn[slot].b);
}
// B, or Escape, in the grid: back to its slot's button.
function outOfGrid(el) {
  if (!inBox(el)) return false;
  nav.focus(built.slotBtn[slot].b);
  return true;
}

// The keyboard: the arrows go to the nearest button that way, as the pad's
// d-pad does, and Enter is the button's own; Escape in the grid is its slot
// again, y rolls, [ and ] turn the slots. Not while the name is being typed
// into its field.
function keys(e) {
  if (!built || built.box.hidden || e.target === built.input || e.altKey || e.ctrlKey || e.metaKey) return;
  const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
  if (dir) stepAt(e.target, dir);
  else if (e.key === 'Escape') { if (!outOfGrid(e.target)) return; }
  else if (e.key === 'y' || e.key === 'Y') rollAt(e.target);
  else if (e.key === '[' || e.key === ']') turnFrom(e.key === ']' ? 1 : -1);
  else return;
  e.preventDefault();
  e.stopPropagation();
}

// The pad, on top of the page's own moves between its buttons: Y rolls, X
// takes a letter back while the grid is up, LT and RT turn the slots, LB and
// RB are you and your sqouse, B in the grid goes back to its slot. Through
// the new yard's steps B is otherwise the step back and menu the step on,
// never the sheet's own let-go. Answers the directions it left for the
// page, and whether it took B.
export function wardrobePad(dirs, pressed) {
  if (!built || !shownEl(built.el)) return { dirs, took: false };
  padKeys();
  if (step < 0) {
    if (pressed('lb')) pick(WHO[0]);
    if (pressed('rb')) pick(WHO[1]);
  }
  const editing = !built.box.hidden;
  if (editing && (pressed('lt') || pressed('rt'))) turnFrom(pressed('rt') ? 1 : -1);
  if (pressed('y') && editing) rollAt(document.activeElement);
  if (pressed('x') && !built.grid.hidden) unType();
  let took = false;
  if (pressed('b') && editing && outOfGrid(document.activeElement)) took = true;
  else if (step >= 0) {
    if (pressed('b')) { if (step > 0) go(-1); took = true; }
  }
  if (step >= 0 && pressed('menu')) { go(1); took = true; }
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
// A square standing in a picture of its own, `foot` over its bottom: a tile,
// a slot's button, the switch's two. The chosen one is turned over, in the
// deep's inks as the deep is, to stand on its inverted button.
function paintSquare(c, k, h, foot, outfit, chosen, key, moving, t) {
  const { g, w, h: hh } = fit(c, k, h * k);
  const inks = chosen ? DEEP_INKS : YARD_INKS;
  const gy = hh - foot;
  ground(g, w, hh, gy, inks);
  drawDressed(g, Math.round((w - WORKER) / 2), gy - WORKER, { outfit, dir: 1, moving, t, inks, key, seed: 0 });
  if (chosen) {
    g.globalCompositeOperation = 'difference';
    g.fillStyle = raw('#fff');
    g.fillRect(0, 0, w, hh);
    g.globalCompositeOperation = 'source-over';
  }
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

// Once a frame while the page is up: the close-up, the slots' and the
// switch's squares, and the shown slot's tiles, walking on the page's own
// clock (the yard is held under the sheet).
export function paintWardrobe(t = performance.now()) {
  if (!built || !shownEl(built.el)) return;
  padKeys();                         // a pad seen or put down while the page is up
  // the two of them changed from outside the page (a save come back, a hook)
  const now = JSON.stringify([S.selves, S.outfits, S.dressOffered]);
  if (now !== built.said) say();
  const s = t / 1000;
  const both = step === FLOW.length - 1;
  {
    const k = built.k;
    const { g, w, h } = fit(built.big, k, WARD_BIG_H * k);
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
  if (!built.tabs.hidden) {
    for (const k of WHO) paintSquare(built.tab[k].c, 1, WARD_MINI_H, WARD_MINI_FOOT, outfitOf(k), k === who, built.tab[k].aura, false, s);
  }
  if (built.box.hidden) return;
  const o = outfitOf(who);
  for (const sl of SLOTS) {
    const sb = built.slotBtn[sl.key];
    paintSquare(sb.c, 1, WARD_SLOT_H, WARD_SLOT_FOOT, tileOutfit(sl.key, o[sl.key]), sl.key === slot, sb.aura, false, s);
  }
  for (const tile of built.tiles) {
    if (tile.slot !== slot) continue;
    paintSquare(tile.c, WARD_TILE_K, WARD_TILE_H, WARD_TILE_FOOT, tileOutfit(tile.slot, tile.key), tile.on, tile.aura, hot.has(tile), s);
  }
}
