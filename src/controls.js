// The controls page's rows, once, for the held sheet and the landing page.
// Both pages build their table from here so the two cannot drift apart.
//
// The page is one table grouped by what you do (option B of
// docs/mocks/controls-page-2026-10-15/): each action once, then the mouse or
// keys that do it, then the pad's buttons. The rows below are written by
// input, the way each half was first listed; the table folds every row whose
// action reads the same into one, so "move camera" is one row of three inputs.
//
// Once a pad has been seen (pad.js), the held sheet's table gains its pad
// column and the rows only the pad has (DESIGN.md, "Controller support",
// "Glyphs and the controls page"). A pad's button is drawn, not written
// (padread.js, `glyph`); so is the mouse.

import { glyph } from './padread.js';
import { msg } from './lang.js';

export const CONTROLS = [
  [msg('ctl-leftclick-in'), msg('ctl-leftclick-do')],
  [msg('ctl-rightclick-in'), msg('ctl-rightclick-do')],
  [msg('ctl-rightleft-in'), msg('ctl-rightleft-do')],
  [msg('ctl-middle-in'), msg('ctl-middle-do')],
  [msg('ctl-wheel-in'), msg('ctl-wheel-do')],
  [msg('ctl-arrows-in'), msg('ctl-arrows-do')],
  [msg('ctl-digits-in'), msg('ctl-digits-do')],
];

// The pad's buttons for the rows above, in the same order: a list of glyph
// names joined by a plus, the way 'right click + left click' is written.
const PAD_FOR = [
  ['a'],
  ['lt'],
  ['lt', 'a'],
  ['r'],
  ['r'],
  ['r'],
  ['left', 'right'],
];

// What the pad does that the mouse has no row for (`ctl-pad-…` in
// locales/en.ftl).
export const PAD_WORDS = {
  hop: msg('ctl-pad-hop'),
  back: msg('ctl-pad-back'),
  handBack: msg('ctl-pad-handback'),
  turn: msg('ctl-pad-turn'),
  hand: msg('ctl-pad-hand'),
  corner: msg('ctl-pad-corner'),
  hold: msg('ctl-pad-hold'),
  look: msg('ctl-pad-look'),
  way: msg('ctl-pad-way'),
};
const PAD_ONLY = [
  [['up', 'down'], PAD_WORDS.hop],
  [['b'], PAD_WORDS.back],
  [['y'], PAD_WORDS.handBack],
  [['lb', 'rb'], PAD_WORDS.turn],
  [['rt'], PAD_WORDS.hand],
  [['view'], PAD_WORDS.corner],
  [['menu'], PAD_WORDS.hold],
  [['r3'], PAD_WORDS.look],
  [['l3'], PAD_WORDS.way],
];

// How each of CONTROLS' inputs is drawn, in the same order: the mouse's
// buttons pressed (left, right, middle, wheel), or 'keys', its words drawn as
// key caps.
const MOUSE_FOR = [['l'], ['r'], ['r', 'l'], ['m'], ['w'], 'keys', 'keys'];

// The table's groups, by what you do, each with its actions in order. An
// action is named by its words, so a row added above lands in its group by
// being listed here; one listed nowhere goes in the first group rather than
// off the page.
const GROUPS = [
  [msg('ctl-group-interact'), [msg('ctl-leftclick-do'), PAD_WORDS.hand, PAD_WORDS.handBack, PAD_WORDS.back]],
  [msg('ctl-group-crew'), [msg('ctl-rightclick-do'), msg('ctl-rightleft-do')]],
  [msg('ctl-group-camera'), [msg('ctl-middle-do'), msg('ctl-wheel-do'), msg('ctl-arrows-do'), PAD_WORDS.look]],
  [msg('ctl-group-boards'), [PAD_WORDS.turn, PAD_WORDS.corner, PAD_WORDS.hold]],
  [msg('ctl-group-travel'), [msg('ctl-digits-do'), PAD_WORDS.hop, PAD_WORDS.way]],
];

// Every action once: its words, the mouse inputs that do it ([drawing,
// words]) and the pad's button lists, each list once.
function actions() {
  const out = new Map();
  const add = (does, mouse, names) => {
    let a = out.get(does);
    if (!a) out.set(does, a = { does, mouse: [], pad: [] });
    if (mouse) a.mouse.push(mouse);
    if (names && !a.pad.some(p => p.join() === names.join())) a.pad.push(names);
  };
  CONTROLS.forEach(([input, does], i) => add(does, [MOUSE_FOR[i], input], PAD_FOR[i]));
  for (const [names, does] of PAD_ONLY) add(does, null, names);
  return [...out.values()];
}

// The groups as the page shows them: without a pad, only what the mouse and
// keys do, and a group with nothing left in it is not shown.
export function controlGroups(pad = false) {
  const all = actions().filter(a => pad || a.mouse.length);
  const groups = GROUPS.map(([word, does]) => [word, [...new Set(does)].map(d => all.find(a => a.does === d)).filter(Boolean)]);
  const listed = new Set(GROUPS.flatMap(([, does]) => does));
  groups[0][1].push(...all.filter(a => !listed.has(a.does)));
  return groups.filter(([, rows]) => rows.length);
}

// --- drawing ------------------------------------------------------------------
const SVG = 'http://www.w3.org/2000/svg';
// A small drawing from [tag, attributes] parts, in the page's ink and paper
// (style.css, `.controls svg`).
function draw(w, h, parts) {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('class', 'gm');
  s.setAttribute('width', w); s.setAttribute('height', h);
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  s.setAttribute('aria-hidden', 'true');
  for (const [tag, at] of parts) {
    const e = document.createElementNS(SVG, tag);
    for (const k in at) e.setAttribute(k, at[k]);
    s.append(e);
  }
  return s;
}
// A mouse, with the button pressed filled: 'l', 'r', 'm' (the wheel), 'w' (the
// wheel, rolled: arrows beside it), or none for the column's head.
function mouse(b) {
  const parts = [['rect', { x: 1, y: 1, width: 14, height: 20, rx: 7, class: 'ms' }]];
  if (b === 'l') parts.push(['path', { d: 'M8 1.5A6.5 6.5 0 0 0 1.5 8V9H8Z', class: 'mi' }]);
  if (b === 'r') parts.push(['path', { d: 'M8 1.5A6.5 6.5 0 0 1 14.5 8V9H8Z', class: 'mi' }]);
  parts.push(['path', { d: 'M8 1.5V9M1.5 9H14.5', class: 'ml' }]);
  parts.push(['rect', { x: 6.5, y: 3.5, width: 3, height: 4, rx: 1.5, class: b === 'm' || b === 'w' ? 'mi' : 'mt' }]);
  if (b === 'w') parts.push(['path', { d: 'M19 4l-2.5 3h5zM19 18l-2.5-3h5z', class: 'mi' }]);
  return draw(b === 'w' ? 22 : 16, 22, parts);
}
// A pad, for its column's head.
const padPicture = () => draw(30, 20, [
  ['path', { d: 'M8 3Q15 2 22 3Q27 4 28 9L29 15Q29 19 26 18L22 14Q15 13 8 14L4 18Q1 19 1 15L2 9Q3 4 8 3Z', class: 'ms' }],
  ['circle', { cx: 9, cy: 8, r: 1.6, class: 'mi' }],
  ['circle', { cx: 21, cy: 8, r: 1.6, class: 'mi' }],
]);

const el = (tag, cls, ...kids) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.append(...kids);
  return e;
};
const plus = text => el('span', 'plus', text);
// An input cell with nothing in it: a dot, so the eye still crosses the row.
const none = () => el('span', 'none', '·');
// Words that may break only where a plus joins two inputs: 'right click +'
// over 'left click', never 'right' over 'click'.
function caption(text) {
  const out = el('span', 'cap');
  const parts = text.split(' + ');
  parts.forEach((part, i) => {
    if (i) out.append(' ');
    out.append(i < parts.length - 1 ? el('span', 'nw', part, ' ', plus('+')) : el('span', 'nw', part));
  });
  return out;
}
// Keys as caps: '← → / a d' is two sets of caps either side of a slash, each
// set kept on one line, a dash or a plus between caps written plain.
function keyCaps(text) {
  const out = el('span', 'keys');
  text.split(/\s+\/\s+/).forEach((set, i) => {
    if (i) out.append(plus('/'));
    out.append(el('span', 'nw', ...set.split(/\s+/).map(k => /^[–+-]$/.test(k) ? plus(k) : el('b', 'key', k))));
  });
  return out;
}
// One mouse input: the buttons drawn with its words under them, or its keys.
function mouseInput([how, words]) {
  if (how === 'keys') return el('span', 'in', keyCaps(words));
  const pic = el('span', 'nw');
  how.forEach((b, i) => { if (i) pic.append(plus('+')); pic.append(mouse(b)); });
  return el('span', 'in', pic, caption(words));
}
// One list of the pad's buttons, glyphs with a plus between, on one line.
function padInput(names) {
  const s = el('span', 'padin');
  names.forEach((n, i) => { if (i) s.append(plus('+')); s.append(glyph(n)); });
  return s;
}

// One grid for the whole table, so every row's cells share the column tracks
// (style.css, `.controls`): a head row of the two drawings, then each group's
// heading across every column and its rows, action then mouse then pad.
export function fillControls(list, pad = false) {
  if (!list) return;
  list.classList.toggle('pad', pad);
  const cells = [el('span', 'colhead'), el('span', 'colhead', mouse())];
  if (pad) cells.push(el('span', 'colhead', padPicture()));
  for (const [word, rows] of controlGroups(pad)) {
    cells.push(el('div', 'group', word));
    for (const a of rows) {
      cells.push(el('span', 'do', a.does), el('span', 'bymouse', ...(a.mouse.length ? a.mouse.map(mouseInput) : [none()])));
      if (pad) cells.push(el('span', 'bypad', ...(a.pad.length ? a.pad.map(padInput) : [none()])));
    }
  }
  list.replaceChildren(...cells);
}
