// The controls page's rows, once, for the held sheet and the landing page:
// the input on the left, what it does on the right. Both pages build their
// list from here so the two cannot drift apart.
//
// Once a pad has been seen (pad.js), the held sheet's page gains a column:
// the pad's button for each row, between the two (DESIGN.md, "Controller
// support", "Glyphs and the controls page"). A pad's button is drawn, not
// written (padread.js, `glyph`).

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

const cell = text => {
  const s = document.createElement('span');
  s.textContent = text;
  return s;
};
// The pad's buttons for a row, as glyphs with a plus between.
function padCell(names) {
  const s = document.createElement('span');
  s.className = 'padkeys';
  names.forEach((n, i) => { if (i) s.append(' + '); s.append(glyph(n)); });
  return s;
}

// Cells go straight into the grid, input then action -- with a pad, input,
// pad, action -- so the columns are sized by what is in them (style.css,
// `.controls`).
export function fillControls(el, pad = false) {
  if (!el) return;
  el.classList.toggle('pad', pad);
  if (!pad) {
    el.replaceChildren(...CONTROLS.flat().map(cell));
    return;
  }
  const cells = [];
  CONTROLS.forEach(([input, does], i) => cells.push(cell(input), padCell(PAD_FOR[i]), cell(does)));
  for (const [names, does] of PAD_ONLY) cells.push(cell(''), padCell(names), cell(does));
  el.replaceChildren(...cells);
}
