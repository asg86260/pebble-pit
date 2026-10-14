// The stations' props (DESIGN.md, "A station is its fighter and a prop";
// the approved look is docs/mocks/station-props-2026-09-28.html, whose
// PROPS, MAT and R8_PARTS these are). A station is its fighter, standing
// beside the thing its class trains with; a base unit, below the fork, has a
// crate of its gear still packed.
//
// A prop is rows of cells, the bottom row standing on the floor, a cell of
// the drawing a cell of the deep. A prop is a silhouette (the owner's B4):
// every cell one flat stone, and every cell with nothing over it lit by the
// light from above, the breathing purple the renderer deals ('top'). A
// character names a material -- wood, leather, straw -- which matters only
// for the parts a rung-8 prop lights (R8_PARTS). '*' is the rung-8 accent:
// purple from rung 8, and below it the material named by the prop's
// `under`. '.' is nothing.
//
// Nothing a prop is made of is brighter than the stone, so the kits' white
// (fists, blades, arrows) never lands on a white prop.
//
// Data and a pure dealer, and no drawing: the renderer (render/deep.js)
// turns the tones it is handed into paint, and the node tier can read what
// a station is drawn as without a canvas. It imports only the config, so
// place.js can read it without pulling the drawing in behind it.

import { DEEP_GREY, DEEP_PURPLE } from '../config.js';

// The mock's noise (deep/kits.js has the same), so each lit brew cell is
// dealt the tone it was dealt on the approved page.
const hash = n => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };

// A prop's rungs: the stone it is made of, the accent at rung 8, and a part
// in the capstone's purple a step under it, so the '*' still reads as its
// brightest point.
export const PROP_INK = { body: DEEP_GREY.stone, accent: DEEP_PURPLE.bright, part: DEEP_PURPLE.glow };

export const PROPS = {
  // a crate of the gear, still packed: boards, a frame, a brace and straw at the lid
  crate: { under: 'E', rows: [
    '.S..S.',
    'EEEEEE',
    'EpppEE',
    'EppEpE',
    'EpEppE',
    'EEEEEE'] },
  // a heavy bag on a chain from a gallows arm, taped at both ends
  brawler: { under: 'L', rows: [
    'WWWWWWW.',
    'WW...K..',
    'W...TTT.',
    'W..lLLLL',
    'W..lLL*L',
    'W..lLLLL',
    'W...TTT.',
    'W.......',
    'WWW.....'] },
  // two swords hilt-up in a rack, the third slot empty (his is in his hand)
  sword: { under: 'i', rows: [
    '.*...i...',
    '.L...L...',
    'iii.iii..',
    'WMWWWMWWW',
    'WM...M..W',
    'WM...M..W',
    'W....M..W',
    'W.......W'] },
  // a bell hung in a little frame over a woven mat
  monk: { under: 'B', rows: [
    'WWWWWWWWWWW',
    '.W.......W.',
    '.W...K...W.',
    '.W..BBB..W.',
    '.W..BBB..W.',
    '.W.BBBBB.W.',
    '.W...*...W.',
    'mmmmmmmmmmm'] },
  // three staves stood in a rack, one short, a ribbon on the tall one at 8
  martial: { under: 'v', rows: [
    '.v.....',
    '.v...v.',
    '.v.v.v.',
    '*v.v.v.',
    'WWWWWWW',
    'Wv.v.vW',
    'Wv.v.vW',
    'WWWWWWW'] },
  // a straw butt on an easel, painted rings, one arrow in it
  ranger: { under: 'I', rows: [
    '..SSS.M.',
    '.SrrrM..',
    'SrSSSrS.',
    'SrS*SrS.',
    'SrSSSrS.',
    '.SrrrS..',
    '..SSS...',
    '.W.W.W..',
    'W..W..W.'] },
  // a sacking dummy on a post, arms out, a dagger stuck in its side
  assassin: { under: 'i', rows: [
    '..UUU.....',
    '..UUU....*',
    'UUUUUUU.i.',
    '.UUUUUIi..',
    '.UUUUUMI..',
    '.UUUUU....',
    '.UrrrU....',
    '...W......',
    '..WWW.....'] },
  // a little iron pot on three legs, the brew showing at its lip
  hexer: { under: 'b', rows: [
    '.IIIII.',
    'IbbbbbI',
    'iIIIIII',
    'iIIIIII',
    '.iIIII.',
    '.I.I.I.'] },
  // three powder kegs, two stood on the floor and one on them, a fuse off the top one
  sapper: { under: 'f', rows: [
    '.....*...',
    '....f....',
    '..IIII...',
    '..vwvw...',
    '..IIII...',
    'IIII.IIII',
    'vwvw.vwvw',
    'vwvw.vwvw',
    'IIII.IIII'] },
  // a lectern, a book open on it, a ribbon hanging out at 8
  mage: { under: '.', rows: [
    '.PP.PP.',
    'PkPIPkP',
    'WWWWWWW',
    '..W*W..',
    '...W...',
    '...W...',
    '...W...',
    '.WWWWW.'] },
  // a music stand: a sheet with a note on it, a ledge, a thin tripod
  bard: { under: 'k', rows: [
    'PPkkP',
    'PPkPP',
    'P**PP',
    'PPPPP',
    'IIIII',
    '..I..',
    '..I..',
    '.I.I.',
    'I...I'] }
};

// At rung 8 whole parts of a prop take the capstone's purple, a material at
// a time (the owner, 2026-09-28: more accent on the rung-8 props).
export const R8_PARTS = {
  brawler: ['T', 'K'], sword: ['i', 'L'], monk: ['B'], martial: ['v'], ranger: ['r'],
  assassin: ['r', 'M', 'I'], hexer: ['i'], sapper: ['I'], mage: ['k'], bard: ['k']
};

// The hexer's brew, the one prop that moves: dark and still before rung 8,
// and from 8 its surface (row `row`, columns `from` to `to`) purple and
// dealt afresh `rate` times a second. A bubble rises over the lip on a
// `period`-second beat, a cell every `step` s for `life` s, at one of `lanes`
// columns from `lane0`; a dim purple `bubble` before 8, `bubbleLit` from it.
export const BREW = { row: 1, from: 1, to: 5, lit: [DEEP_PURPLE.mid, DEEP_PURPLE.glow, DEEP_PURPLE.mid], rate: 2,
                      period: 1.8, pace: 0.9, life: 1.2, step: 0.4, lane0: 2, lanes: 3,
                      bubble: DEEP_PURPLE.mid, bubbleLit: DEEP_PURPLE.glow };

// Which prop a station stands beside: its class's, or the crate below the fork.
export const propKey = st => (st && st.cls && PROPS[st.cls] ? st.cls : 'crate');

// A seed a prop, as the mock deals it: the key's length, so each prop's
// tones fall where the approved page's did.
const seedOf = key => key.length * 3.1;
const toneAt = (mat, c, r, seed) => mat[Math.floor(hash(c * 13.7 + r * 71.3 + seed) * mat.length)];

// Every still cell of prop `key`, as [col, row, ramp, tone]: `ramp` 'g' for
// the grey ramp and 'p' the purple, `tone` an index into it, or 'top' for a
// cell along a top edge, which the renderer lights; `lit` from rung 8. The
// brew's moving cells are `brewCells`'.
export function propCells(key, lit) {
  const p = PROPS[key], parts = lit ? R8_PARTS[key] || [] : [], out = [];
  const open = (c, r) => (p.rows[r]?.[c] ?? '.') === '.';
  p.rows.forEach((row, r) => [...row].forEach((ch0, c) => {
    let ch = ch0;
    if (ch === '*') {
      if (lit) { out.push([c, r, 'p', PROP_INK.accent]); return; }
      ch = p.under;
    }
    if (ch === '.') return;
    if (parts.includes(ch)) out.push([c, r, 'p', PROP_INK.part]);
    else if (open(c, r - 1)) out.push([c, r, 'top', 0]);
    else out.push([c, r, 'g', PROP_INK.body]);
  }));
  return out;
}

// The brew's cells at `t` seconds, in the same shape: the lit surface from
// rung 8, and the bubble over the lip. Nothing for any other prop.
export function brewCells(key, lit, t) {
  if (key !== 'hexer') return [];
  const B = BREW, seed = seedOf(key), out = [];
  if (lit) for (let c = B.from; c <= B.to; c++) out.push([c, B.row, 'p', toneAt(B.lit, c, Math.floor(t * B.rate), seed)]);
  const k = (t * B.pace) % B.period;
  if (k < B.life) out.push([B.lane0 + Math.floor(t / B.period) % B.lanes, B.row - 1 - Math.floor(k / B.step),
                            lit ? 'p' : 'g', lit ? B.bubbleLit : B.bubble]);
  return out;
}

