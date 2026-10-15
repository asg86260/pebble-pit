// The stations' props (DESIGN.md, "A station is its fighter and a prop";
// the approved look is docs/mocks/station-props-2026-09-28.html, whose
// PROPS, MAT and R8_PARTS these are). A station is its fighter, standing
// beside the thing its class trains with; a base unit, below the fork, has a
// crate of its gear still packed.
//
// A prop is rows of cells, the bottom row standing on the floor, a cell of
// the drawing a cell of the deep. Each is drawn twice as tall and as wide
// as the first ones, with nothing behind it, so a station reads by its
// prop's outline from across the deep (the owner, 2026-10-15, option C of
// docs/mocks/deep-stations-2026-10-15/): the detail is in the holes, the
// black between boards, staves and legs. A prop is a silhouette (the owner's B4):
// every cell one flat stone, and every cell with nothing over it lit by the
// light from above, the breathing purple the renderer deals ('top'). A
// character names a material -- wood, leather, straw -- which matters only
// for the parts a rung-8 prop lights (R8_PARTS). '*' is the rung-8 accent:
// purple from rung 8, and below it the material named by the prop's
// `under`. '.' is nothing.
//
// A prop's body is the brightest grey of its station, over the plinth's
// (PROP_BODY), and still well under the kits' white (fists, blades, arrows),
// so a kit never lands on a white prop.
//
// Data and a pure dealer, and no drawing: the renderer (render/deep.js)
// turns the tones it is handed into paint, and the node tier can read what
// a station is drawn as without a canvas. It imports only the config, so
// place.js can read it without pulling the drawing in behind it.

import { DEEP_PURPLE, PROP_BODY } from '../config.js';

// A prop's rungs: what it is made of, the accent at rung 8, and a part
// in the capstone's purple a step under it, so the '*' still reads as its
// brightest point.
export const PROP_INK = { body: PROP_BODY, accent: DEEP_PURPLE.bright, part: DEEP_PURPLE.glow };

export const PROPS = {
  // a crate of the gear, still packed: boards, a frame, a brace and straw at the lid
  crate: { under: 'E', rows: [
    '..S..S...S..',
    '.SSS.SS.SSS.',
    'EEEEEEEEEEEE',
    'EppppppppEEE',
    'EpppppppEEpE',
    'E......EE..E',
    'EppppEEppppE',
    'EpppEEpppppE',
    'E..EE......E',
    'EpEEpppppppE',
    'EEEppppppppp',
    'EEEEEEEEEEEE'] },
  // a heavy bag on a chain from a gallows arm, taped at both ends
  brawler: { under: 'L', rows: [
    'WWWWWWWWWWWWWW..',
    'WWWWWWWWWWWWWW..',
    'WWWWW......K....',
    'WWWW.......K....',
    'WWW.......KKK...',
    'WW........TTT...',
    'WW......LLLLLLL.',
    'WW.....LLLLLLLLL',
    'WW.....LLLLL**LL',
    'WW.....LLLLL**LL',
    'WW.....LLLLLLLLL',
    'WW.....LLLLLLLLL',
    'WW......LLLLLLL.',
    'WW........TTT...',
    'WW..............',
    'WW..............',
    'WWWW............',
    'WWWWWW..........'] },
  // two swords hilt-up in a rack, the third slot empty (his is in his hand)
  sword: { under: 'i', rows: [
    '....**....ii........',
    '....LL....LL........',
    '....LL....LL........',
    '...iiii..iiii.......',
    '....MM....MM........',
    '....MM....MM........',
    'WWWWMMWWWWMMWWWW..WW',
    'WWWWMMWWWWMMWWWWWWWW',
    'WW..MM....MM......WW',
    'WW..MM....MM......WW',
    'WW..MM....MM......WW',
    'WW..MM....MM......WW',
    'WW...M....MM......WW',
    'WW........M.......WW',
    'WW................WW',
    'WWW..............WWW'] },
  // a bell hung in a little frame over a woven mat
  monk: { under: 'B', rows: [
    'WWWWWWWWWWWWWWWWWWWWWW',
    '.WWWWWWWWWWWWWWWWWWWW.',
    '..WW......KK......WW..',
    '..WW......KK......WW..',
    '..WW....BBBBBB....WW..',
    '..WW...BBBBBBBB...WW..',
    '..WW...BBBBBBBB...WW..',
    '..WW...BBBBBBBB...WW..',
    '..WW...BBBBBBBB...WW..',
    '..WW..BBBBBBBBBB..WW..',
    '..WW.BBBBBBBBBBBB.WW..',
    '..WW......**......WW..',
    '..WW......**......WW..',
    '..WW..............WW..',
    'mmWWmm.mm.mm.mm.mmWWmm',
    'mmmmmmmmmmmmmmmmmmmmmm'] },
  // three staves stood in a rack, one short, a ribbon on the tall one at 8
  martial: { under: 'v', rows: [
    '..v...........',
    '..vv..........',
    '..vv......v...',
    '..vv......vv..',
    '.*vv......vv..',
    '.*vv..v...vv..',
    '*.vv..vv..vv..',
    '..vv..vv..vv..',
    'WWWWWWWWWWWWWW',
    'W.vv..vv..vv.W',
    'W.vv..vv..vv.W',
    'W.vv..vv..vv.W',
    'W.vv..vv..vv.W',
    'W.vv..vv..vv.W',
    'WWWWWWWWWWWWWW',
    'WW..........WW'] },
  // a straw butt on an easel, painted rings, one arrow in it
  ranger: { under: 'I', rows: [
    '....SSSSS...MII.',
    '..SSSSSSSSSM.I..',
    '.SSSrrrrrSMS....',
    '.SSrrSSSrMSS....',
    'SSrrSSSSSrrSS...',
    'SSrSSS*SSSrSS...',
    'SSrSS***SSrSS...',
    'SSrSSS*SSSrSS...',
    'SSrrSSSSSrrSS...',
    '.SSrrSSSrrSS....',
    '.SSSrrrrrSSS....',
    '..SSSSSSSSS.....',
    '....SSSSS.......',
    '....W.W.W.......',
    '...W..W..W......',
    '...W..W..W......',
    '..W...W...W.....',
    '.W....W....W....'] },
  // a sacking dummy on a post, arms out, a dagger stuck in its side
  assassin: { under: 'i', rows: [
    '.....UUUU...........',
    '....UUUUUU..........',
    '....UUUUUU..........',
    '....UUUUUU..........',
    '.....UUUU...........',
    'UUUUUUUUUUUUUU......',
    'UUUUUUUUUUUUUU......',
    '..UUUUUUUUUU......**',
    '..UUUUUUUUUU.....i*.',
    '..UUUUUUUUUU..I.i...',
    '..UUUUUUUUUU.IIi....',
    '..UUUUUUUUUUMMI.....',
    '..UUUUUUUUUUMI......',
    '..UUUUUUUUUU........',
    '..UUrrrrrrUU........',
    '......WW............',
    '......WW............',
    '....WWWWWW..........'] },
  // a little iron pot on three legs, the brew showing at its lip
  hexer: { under: 'b', rows: [
    '...IIIIIIII...',
    '..IbbbbbbbbI..',
    '.IIIIIIIIIIII.',
    '..IIIIIIIIII..',
    'ii.IIIIIIIIII.',
    'i..IIIIIIIIII.',
    'ii.IIIIIIIIII.',
    '...IIIIIIIIII.',
    '....IIIIIIII..',
    '.....IIIIII...',
    '....I..II..I..',
    '...I...II...I.'] },
  // three powder kegs, two stood on the floor and one on them, a fuse off the top one
  sapper: { under: 'f', rows: [
    '..........**......',
    '.........f........',
    '......IIIIII......',
    '......vwvwvw......',
    '.....IIIIIIII.....',
    '.....vwvwvwvw.....',
    '.....vwvwvwvw.....',
    '.....IIIIIIII.....',
    '......vwvwvw......',
    '......IIIIII......',
    '.IIIIII....IIIIII.',
    '.vwvwvw....vwvwvw.',
    'IIIIIIII..IIIIIIII',
    'vwvwvwvw..vwvwvwvw',
    'vwvwvwvw..vwvwvwvw',
    'IIIIIIII..IIIIIIII',
    '.vwvwvw....vwvwvw.',
    '.IIIIII....IIIIII.'] },
  // a lectern, a book open on it, a ribbon hanging out at 8
  mage: { under: '.', rows: [
    '.PPPPPP..PPPPPP.',
    'PPPPPPPIIPPPPPPP',
    'PkkkkPPIIPPkkkkP',
    'PPPPPPPIIPPPPPPP',
    'PkkkPPPIIPPPkkkP',
    'WWWWWWWWWWWWWWWW',
    '.WWWWWW**WWWWWW.',
    '.....WW**WW.....',
    '.......**.......',
    '......WWWW......',
    '.......WW.......',
    '.......WW.......',
    '.......WW.......',
    '.......WW.......',
    '....WWWWWWWW....',
    '..WWWWWWWWWWWW..'] },
  // a music stand: a sheet with a note on it, a ledge, a thin tripod
  bard: { under: 'k', rows: [
    '.PPPPPPPP.',
    'PPPPPkkkPP',
    'PPPPPkPkkP',
    'PPPPPkPPPP',
    'PPPPPkPPPP',
    'PPP**kPPPP',
    'PPP**PPPPP',
    'PPPPPPPPPP',
    'IIIIIIIIII',
    '....II....',
    '....II....',
    '....II....',
    '....II....',
    '....II....',
    '...I..I...',
    '..I....I..',
    '.I......I.',
    'I........I'] }
};

// At rung 8 whole parts of a prop take the capstone's purple, a material at
// a time (the owner, 2026-09-28: more accent on the rung-8 props).
export const R8_PARTS = {
  brawler: ['T', 'K'], sword: ['i', 'L'], monk: ['B'], martial: ['v'], ranger: ['r'],
  assassin: ['r', 'M', 'I'], hexer: ['i'], sapper: ['I'], mage: ['k'], bard: ['k']
};

// The hexer's brew, the one prop that moves: dark and still before rung 8,
// and from 8 its surface (row `row`, columns `from` to `to`) one steady
// purple, `lit`. A bubble rises over the lip on a
// `period`-second beat, a cell every `step` s for `life` s, at one of `lanes`
// columns from `lane0`; a dim purple `bubble` before 8, `bubbleLit` from it.
// The bubble climbs a cell every `step`, half the old pot's step now its
// cells are half the size, so it rises as far and as fast as it did.
export const BREW = { row: 1, from: 3, to: 10, lit: DEEP_PURPLE.mid,
                      period: 1.8, pace: 0.9, life: 1.2, step: 0.2, lane0: 5, lanes: 4,
                      bubble: DEEP_PURPLE.mid, bubbleLit: DEEP_PURPLE.glow };

// Which prop a station stands beside: its class's, or the crate below the fork.
export const propKey = st => (st && st.cls && PROPS[st.cls] ? st.cls : 'crate');

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
  const B = BREW, out = [];
  if (lit) for (let c = B.from; c <= B.to; c++) out.push([c, B.row, 'p', B.lit]);
  const k = (t * B.pace) % B.period;
  if (k < B.life) out.push([B.lane0 + Math.floor(t / B.period) % B.lanes, B.row - 1 - Math.floor(k / B.step),
                            lit ? 'p' : 'g', lit ? B.bubbleLit : B.bubble]);
  return out;
}

