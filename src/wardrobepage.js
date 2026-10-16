// The two of them's page: who each is and what each wears, a page of the
// held sheet (DESIGN.md, "What the two of them wear" and "Who you are"; the
// mocks' votes, docs/mocks/pair-wardrobe-2026-10-16 and
// docs/mocks/who-you-are-2026-10-16). The two of them close up at the top --
// a press on either picks who is being chosen -- and under them the yard's
// own scale with a crowd walking it, so a choice is made for being found in
// the yard and not only for the close-up. Then a row each: the name, the
// role, and the five slots, each slot and the role with its previous and
// next, and every row with a die that rolls it alone; a roll for the whole
// square but its name, and a clear that takes every slot back to bare.
//
// It is reached two ways. Once at a new yard, before the opening walks out
// (`offerDress`), as four steps: build who you are, confirm your square,
// build your sqouse, and a last look at the two of you; done there lets the
// opening go. And always as a row on the house's board (crewboard.js), with
// a tab for each; the name and the role can be changed there at any time.
//
// Mouse, finger and keyboard type the name into its field. A pad moves
// between the page's buttons as on every page (padpage.js): left and right
// on the role's or a slot's row step it, Y rolls the row the focus is on, LB
// and RB are the tabs. For the name, Steam's own keyboard where the desk has
// Steam to ask (`desk.askText`), and anywhere else, or when Steam cannot
// show one, a grid of letters under the name row: A types the key, X takes
// the last letter back.

import { msg, writeInto } from './lang.js';
import { S } from './state.js';
import { P, WORKER, WARD_BIG, WARD_BIG_H, WARD_STRIP_H, WARD_CROWD, WARD_CROWD_PACE, NAME_MAX, NAME_GRID_COLS } from './config.js';
import { SLOTS, WHO, DEFAULTS, itemOf, outfitOf, stepItem, rollSlot, nameOf, setName, stepRole, rollName,
         rollRole, rollSquare, bareOutfit, typedName, storyArgs } from './wardrobe.js';
import { drawDressed, YARD_INKS } from './render/wardrobe.js';
import { HATS, drawSprite, spriteH, spriteW } from './sprites.js';

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
let step = -1;                  // the new yard's step, or -1 for the settings page
let gridAsked = false;          // Steam could not show its keyboard: the grid instead
let built = null;               // the page's parts, made once into its element

const button = (text, ...cls) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.classList.add(...cls);
  b.textContent = text;
  return b;
};
const span = (cls, text = '') => Object.assign(document.createElement('span'), { className: cls, textContent: text });
// The die: five pips on a square, drawn in the button's own ink.
const SVG = 'http://www.w3.org/2000/svg';
function die(roll) {
  const b = button('', 'warddie');
  b.setAttribute('aria-label', msg('ward-randomize'));
  b.title = msg('ward-randomize');
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('viewBox', '0 0 7 7');
  s.setAttribute('aria-hidden', 'true');
  const rect = (x, y, w, h, fill) => {
    const r = document.createElementNS(SVG, 'rect');
    for (const [k, v] of Object.entries({ x, y, width: w, height: h, fill: fill ? 'currentColor' : 'none' })) r.setAttribute(k, v);
    if (!fill) r.setAttribute('stroke', 'currentColor');
    s.appendChild(r);
  };
  rect(0.5, 0.5, 6, 6, false);
  for (const [x, y] of [[1.5, 1.5], [4.5, 1.5], [3, 3], [1.5, 4.5], [4.5, 4.5]]) rect(x, y, 1, 1, true);
  b.appendChild(s);
  b.addEventListener('click', () => { typing = null; roll(); say(); });
  return b;
}
const roleWord = k => msg('ward-role-word', storyArgs(k));
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
  const stepEl = span('wardstep');
  const big = document.createElement('canvas');
  big.className = 'wardbig';
  big.addEventListener('click', e => {
    if (step >= 0) return;
    const r = big.getBoundingClientRect();
    pick(e.clientX - r.left < r.width / 2 ? WHO[0] : WHO[1]);
  });
  const strip = document.createElement('canvas');
  strip.className = 'wardstrip';
  const tabs = document.createElement('div');
  tabs.classList.add('pair', 'wardwho');
  const tab = {};
  for (const k of WHO) {
    const b = button(k === 'you' ? msg('ward-you') : msg('ward-sqouse'), 'wardtab');
    b.id = `ward${k}`;
    b.addEventListener('click', () => pick(k));
    tabs.appendChild(b);
    tab[k] = b;
  }

  // the name: its field, the letters left, its die; and for a pad the
  // button that asks Steam, or the grid
  const nameRow = document.createElement('div');
  nameRow.classList.add('wardrow', 'wardname');
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
  const grid = document.createElement('div');
  grid.className = 'wardkeys';
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

  const roleRow = document.createElement('div');
  roleRow.className = 'wardrow';
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

  const rows = SLOTS.map(s => {
    const row = document.createElement('div');
    row.className = 'wardrow';
    row.dataset.slot = s.key;
    row.dataset.row = s.key;
    const prev = button('<', 'wardarr', 'prev');
    prev.id = `ward-${s.key}-prev`;
    const val = span('wardval');
    const next = button('>', 'wardarr', 'next');
    next.id = `ward-${s.key}-next`;
    prev.addEventListener('click', () => { stepItem(who, s.key, -1); say(); });
    next.addEventListener('click', () => { stepItem(who, s.key, 1); say(); });
    row.append(span('wardlabel', msg(s.name)), prev, val, next, die(() => rollSlot(who, s.key)));
    return { row, val, s };
  });
  const edit = document.createElement('div');
  edit.className = 'wardedit';
  edit.append(nameRow, grid, roleRow, ...rows.map(r => r.row));

  // the confirm steps: the name, or the role word with none, and the role
  const shown = document.createElement('div');
  shown.className = 'wardshown';

  const foot = document.createElement('div');
  foot.classList.add('pair', 'wardfoot');
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
  roll.addEventListener('click', () => { typing = null; rollSquare(who); say(); });
  // every slot of the square bare, its name and role kept
  const clear = button(msg('ward-clear'), 'wardclear');
  clear.id = 'wardclear';
  clear.addEventListener('click', () => { bareOutfit(who); say(); });
  const next = button(msg('ward-next'), 'wardnext');
  next.id = 'wardnext';
  next.addEventListener('click', () => go(1));
  foot.append(skip, back, roll, clear, next);
  el.append(stepEl, big, strip, tabs, edit, shown, foot);
  built = { el, stepEl, big, strip, tabs, tab, input, count, askBtn, grid, roleRow, rVal, rPrev, rNext, roleDie,
            nameDie: nameRow.querySelector('.warddie'), rows, edit, shown, back, skip, roll, clear, next, crowd: crowdOf() };
}

// The page brought up to the two of them and to the step.
function say() {
  if (!built) return;
  built.said = JSON.stringify([S.selves, S.outfits, S.dressOffered]);
  const b = built, at = step >= 0 ? FLOW[step] : null;
  if (at) who = at.who;
  const kind = at ? at.kind : 'build';
  const head = document.getElementById('wardhead');
  if (head) writeInto(head, msg(at ? at.title : 'ward-title'));
  b.stepEl.hidden = !at;
  if (at) b.stepEl.textContent = msg('ward-step', { n: step + 1, of: FLOW.length });
  b.tabs.hidden = !!at;
  for (const k of WHO) {
    b.tab[k].classList.toggle('on', k === who);
    b.tab[k].setAttribute('aria-pressed', String(k === who));
  }
  b.strip.hidden = kind !== 'build';
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
  const o = outfitOf(who);
  for (const { val, s } of b.rows) val.textContent = msg(itemOf(s.key, o[s.key])?.name || s.items[0].name);

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
}

// Each of `list` as a name over its role word; with no name, the role word
// alone, as the lines will read.
function showSquares(list) {
  const box = built.shown;
  box.textContent = '';
  for (const k of list) {
    const one = document.createElement('div');
    one.className = 'wardone';
    const name = nameOf(k);
    one.append(span('wardnm', name || roleWord(k)));
    if (name) one.append(span('wardrl', roleWord(k)));
    box.appendChild(one);
  }
}

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

function pick(k) { if (step < 0) { who = k; typing = null; say(); } }
function go(by) {
  typing = null;
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
  if (start) who = 'you';
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

// --- the pad ----------------------------------------------------------------------
// Up and down are the page's own moves between its buttons. On the role's
// or a slot's row left and right step it rather than move off it; Y rolls
// the row the focus is on (the name from anywhere in its grid), and the
// whole square from anywhere else; X takes a letter back while the grid is
// up; LB and RB are the tabs. Through the new yard's steps B is the step
// back and menu the step on, never the sheet's own let-go. Answers the
// directions it left for the page, and whether it took B.
export function wardrobePad(dirs, pressed) {
  if (!built || !shownEl(built.el)) return { dirs, took: false };
  padKeys();
  if (step < 0) {
    if (pressed('lb')) pick(WHO[0]);
    if (pressed('rb')) pick(WHO[1]);
  }
  const focus = document.activeElement;
  const row = focus?.closest?.('[data-row]')?.dataset.row || (focus?.closest?.('.wardkeys') ? 'name' : null);
  if (pressed('y') && !built.edit.hidden) {
    typing = null;
    if (row === 'name') rollName(who);
    else if (row === 'role') rollRole(who);
    else if (row) rollSlot(who, row);
    else rollSquare(who);
    say();
  }
  if (pressed('x') && !built.grid.hidden) unType();
  let took = false;
  if (step >= 0) {
    if (pressed('b')) { if (step > 0) go(-1); took = true; }
    if (pressed('menu')) { go(1); took = true; }
  }
  const stepped = row && row !== 'name' && (row === 'role' || SLOTS.some(s => s.key === row));
  if (!stepped) return { dirs, took };
  return {
    took,
    dirs: dirs.filter(d => {
      if (d !== 'left' && d !== 'right') return true;
      const by = d === 'right' ? 1 : -1;
      if (row === 'role') stepRole(who, by); else stepItem(who, row, by);
      say();
      return false;
    })
  };
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

// The crowd the strip's two walk among: crew in station hats, each pacing a
// stretch of it, some standing. Made once, in shares of the strip's width.
const KITS = [null, 'helmet', 'lamp', 'brim', 'point', 'cap'];
function crowdOf() {
  let s = 7;
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const [lo, hi] = WARD_CROWD_PACE;
  const out = [];
  for (let i = 0; i < WARD_CROWD; i++) {
    const a = r() * 0.8, span = 0.1 + r() * 0.5;
    out.push({ a, b: Math.min(0.95, a + span), v: r() < 0.2 ? 0 : lo + r() * (hi - lo), ph: r() * 10, kit: KITS[Math.floor(r() * KITS.length)] });
  }
  // and the two of them, always walking
  out.push({ a: 0.1, b: 0.8, v: hi * 0.6, ph: 0.3, who: 'sqouse' }, { a: 0.2, b: 0.9, v: hi * 0.8, ph: 0.7, who: 'you' });
  return out;
}
// Where a pacer is at `t` along a strip `w` wide: out, a pause, back, a pause.
function pace(p, t, w) {
  const a = p.a * w, b = p.b * w;
  if (!p.v) return { x: a, dir: 1, moving: false };
  const T = (b - a) / p.v, u = (t + p.ph * T) % (2 * T + 2);
  if (u < T) return { x: a + u * p.v, dir: 1, moving: true };
  if (u < T + 1) return { x: b, dir: 1, moving: false };
  if (u < 2 * T + 1) return { x: b - (u - T - 1) * p.v, dir: -1, moving: true };
  return { x: a, dir: -1, moving: false };
}
const hatOn = kit => kit && ((g, x, y) => drawSprite(g, HATS[kit], x + (WORKER - spriteW(HATS[kit]) * P) / 2, y - spriteH(HATS[kit]) * P));
const plainLook = { outfit: { head: 'none', face: 'none', neck: 'none', back: 'none', pattern: 'plain' }, inks: YARD_INKS };

// Once a frame while the page is up: the close-up and the strip, walking on
// the page's own clock (the yard is held under the sheet). The new yard's
// first two steps are about you alone, so you stand alone in the close-up.
export function paintWardrobe(t = performance.now()) {
  if (!built || !shownEl(built.el)) return;
  padKeys();                         // a pad seen or put down while the page is up
  // the two of them changed from outside the page (a save come back, a hook)
  const now = JSON.stringify([S.selves, S.outfits, S.dressOffered]);
  if (now !== built.said) say();
  const s = t / 1000;
  const alone = step === 0 || step === 1;
  const barred = step < 0 || step === 2;
  {
    const { g, w, h } = fit(built.big, WARD_BIG, WARD_BIG_H * WARD_BIG);
    g.fillStyle = YARD_INKS.paper;
    g.fillRect(0, 0, w, h);
    const ground = Math.round(h - P);
    g.fillStyle = YARD_INKS.ink;
    g.fillRect(0, ground, w, 1);
    // a turn now and then, so the things that hang off the back are seen moving
    const moving = s % 6 >= 4;
    WHO.forEach((k, i) => {
      if (alone && k !== 'you') return;
      const x = Math.round(w * (alone ? 0.5 : i ? 0.66 : 0.34) - WORKER / 2);
      drawDressed(g, x, ground - WORKER, { outfit: outfitOf(k), dir: alone || !i ? 1 : -1, moving, t: s, inks: YARD_INKS });
      // the one being chosen: a bar under its feet
      if (barred && k === who) { g.fillStyle = YARD_INKS.ink; g.fillRect(x - 2, ground + 3, WORKER + 4, 2); }
    });
  }
  if (!built.strip.hidden) {
    const { g, w, h } = fit(built.strip, 1, WARD_STRIP_H);
    g.fillStyle = YARD_INKS.paper;
    g.fillRect(0, 0, w, h);
    const ground = h - P;
    g.fillStyle = YARD_INKS.ink;
    g.fillRect(0, ground, w, 1);
    for (const p of built.crowd) {
      const at = pace(p, s, w - WORKER), x = Math.round(at.x);
      const look = p.who ? { outfit: outfitOf(p.who), dir: at.dir, moving: at.moving, t: s, inks: YARD_INKS }
                         : { ...plainLook, dir: at.dir };
      drawDressed(g, x, ground - WORKER, look, hatOn(p.kit));
    }
  }
}
