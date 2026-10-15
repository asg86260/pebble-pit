// The stations' props (DESIGN.md, "A station is its fighter and a prop";
// the approved look is option A of docs/mocks/station-polish-2026-10-15/,
// whose PROPS_A these are). A station is its fighter, standing beside the
// thing its class trains with; a base unit, below the fork, has a crate of
// its gear still packed.
//
// A prop is rows of cells, the bottom row standing on the plinth, a cell of
// the drawing a cell of the deep, read by its outline from across the deep:
// the detail is in the holes, the black between boards, staves and legs.
// A letter names a part, and the part's ramp is config's (PROP_TONES):
//   H  the thing a class trains with    F  frame, timber, stand
//   S  straw, sacking                   R  Q  K  the parts rung 8 turns purple
//                                                (light, dark, paint and hoops)
//   h r d  an R cell toned by hand      g z  a Q cell toned by hand
//   1-5  a grey by hand    v w  purple by hand    *  the class accent
//   +  a cell only from rung 8          B  the hexer's brew    .  nothing
// Every part is shaded by where it stands, lit from the upper left
// (`shadeAt`), so the rows alone say how a prop is drawn, and a prop is
// swapped by swapping its rows.
//
// Data and a pure dealer, and no drawing: the renderer (render/deep.js)
// turns the tones it is handed into paint, and the node tier can read what
// a station is drawn as without a canvas. It imports only the config, so
// place.js can read it without pulling the drawing in behind it.

import { DEEP_PURPLE, PROP_TONES } from '../config.js';

export const PROPS = {
  // a crate of the gear, still packed: boards, a brace and straw at the lid
  crate: { rows: [
    '..S..S.S...S..',
    '.SSSSSSSSSSS..',
    'FFFFFFFFFFFFFF',
    'FHHHHHHHHHHFFF',
    'FHHHHHHHHHFFHF',
    'F22222222FF22F',
    'FHHHHHHHFFHHHF',
    'FHHHHHHFFHHHHF',
    'F22222FF22222F',
    'FHHHHFFHHHHHHF',
    'FHHHFFHHHHHHHF',
    'FHHFFHHHHHHHHF',
    'FFFFFFFFFFFFFF'] },
  // a heavy bag on a chain from a gallows arm, taped at both ends
  brawler: { rows: [
    'FFFFFFFFFFFFFF..',
    'FFFFFFFFFFFFFF..',
    'FFFF.......g....',
    'FFF........z....',
    'FF........Q*Q...',
    'FF......KKKKKKK.',
    'FF.....HHHHHHHHH',
    'FF.....KKKKKKKKK',
    'FF.....HHHHHHHHH',
    'FF.....HHHHHHHHH',
    'FF.....HHHHHHHHH',
    'FF.....HHHHHHHHH',
    'FF.....HHHHHHHHH',
    'FF.....KKKKKKKKK',
    'FF.....HHHHHHHHH',
    'FF......KKKKKKK.',
    'FFFF............',
    'FFFFFF..........'] },
  // two swords hilt-up in a rack, the third slot empty (his is in his hand)
  sword: { rows: [
    '....**....**........',
    '....RR....RR........',
    '....RR....RR........',
    '...RRRR..RRRR.......',
    '....HH....HH........',
    '....HH....HH........',
    'FFFFHHFFFFHHFFFF..FF',
    'FFFFHHFFFFHHFFFFFFFF',
    'FF..HH....HH......FF',
    'FF..HH....HH......FF',
    'FF..HH....HH......FF',
    'FF..HH....HH......FF',
    'FF...H.....H......FF',
    'FFFFFFFFFFFFFFFFFFFF',
    'FF................FF',
    'FFF..............FFF'] },
  // a bell hung in a frame over a woven mat
  monk: { rows: [
    'FF..................FF',
    'FFFFFFFFFFFFFFFFFFFFFF',
    '.FFFFFFFFFFFFFFFFFFFF.',
    '..FF......gg......FF..',
    '..FF.....RRRR.....FF..',
    '..FF....RRRRRR....FF..',
    '..FF...RRRRRRRR...FF..',
    '..FF...RRRRRRRR...FF..',
    '..FF...RRRRRRRR...FF..',
    '..FF...RRRRRRRR...FF..',
    '..FF..RRRRRRRRRR..FF..',
    '..FF.RRRRRRRRRRRR.FF..',
    '..FF......**......FF..',
    '..FF..............FF..',
    '.4FF44444444444444FF4.',
    '33FF33333333333333FF33'] },
  // three staves stood in a rack, one short, a ribbon on the tall one
  martial: { rows: [
    '..55..........',
    '..RR..........',
    '..RR......55..',
    '.*RR......RR..',
    '**RR......RR..',
    '*.RR..55..RR..',
    '..RR..RR..RR..',
    '..RR..RR..RR..',
    'FFRRFFRRFFRRFF',
    'F.RR..RR..RR.F',
    'F.RR..RR..RR.F',
    'F.RR..RR..RR.F',
    'FFFFFFFFFFFFFF',
    'FFFFFFFFFFFFFF',
    'FF..........FF',
    'FF..........FF'] },
  // a straw butt on an easel, painted rings, one arrow in it
  ranger: { rows: [
    '....SSSSS..3....',
    '..SSSSSSSSS.43..',
    '.SSSKKKKKSS4.3..',
    '.SSKSSSSS4SS....',
    'SSKSSSSS4SKSS...',
    'SSKSSS*SSSKSS...',
    'SSKSS***SSKSS...',
    'SSKSSS*SSSKSS...',
    'SSKSSSSSSSKSS...',
    '.SSKSSSSSKSSS...',
    '.SSSKKKKKSSS....',
    '..SSSSSSSSS.....',
    '....SSSSS.......',
    '....F.F.F.......',
    '...F..F..F......',
    '...FFFFFFF......',
    '..F...F...F.....',
    '.F....F....F....'] },
  // a sacking dummy on a post, arms out, a dagger stuck in its side
  assassin: { rows: [
    '.....HHHH...........',
    '....HHHHHH..........',
    '....HHHHHH..........',
    '....HHHHHH..........',
    '.....HHHH...........',
    '......33............',
    '3HHHHHHHHHHHH3......',
    '3HHHHHHHHHHHH3......',
    '..HHHHHHHHHH........',
    '..HHHHHHHHHH...*....',
    '..HHHHHHHHHH..R.....',
    '..HHHHHHHHHH.R......',
    '...HHHHHHHHRR.......',
    '...HHHHHHHHR........',
    '...KKKKKKKK.........',
    '....HHHHHH..........',
    '......FF............',
    '....FFFFFF..........'] },
  // a little iron pot on three legs, the brew showing at its lip
  hexer: { brew: 1, rows: [
    '.HHHHHHHHHHHH.',
    '.HBBBBBBBBBBH.',
    'HHHHHHHHHHHHHH',
    'R.HHHHHHHHHH.R',
    'RRHHHHHHHHHHRR',
    '.HHHHHHHHHHHH.',
    '.HHHHHHHHHHHH.',
    '.HHHHHHHHHHHH.',
    '..HHHHHHHHHH..',
    '...HHHHHHHH...',
    '...F..FF..F...',
    '..F...FF...F..'] },
  // three powder kegs, two stood on the floor and one on them, a fuse off the top one
  sapper: { rows: [
    '..........**......',
    '.........4........',
    '......KKKKKK......',
    '.....HHHHHHHH.....',
    '.....KKKKKKKK.....',
    '.....HHHHHHHH.....',
    '.....HHHHHHHH.....',
    '.....KKKKKKKK.....',
    '.....HHHHHHHH.....',
    '......KKKKKK......',
    '.KKKKKK....KKKKKK.',
    'HHHHHHHH..HHHHHHHH',
    'KKKKKKKK..KKKKKKKK',
    'HHHHHHHH..HHHHHHHH',
    'HHHHHHHH..HHHHHHHH',
    'KKKKKKKK..KKKKKKKK',
    'HHHHHHHH..HHHHHHHH',
    '.KKKKKK....KKKKKK.'] },
  // a lectern, a book open on it, a ribbon hanging out
  mage: { rows: [
    '.HHHHH....HHHHH.',
    'HHHHHHH..HHHHHHH',
    'HKKKKHHFFHHKKKKH',
    'HHHHHHHFFHHHHHHH',
    'HKKKHHHFFHHHKKKH',
    'HHHHHHHFFHHHHHHH',
    'FFFFFFFFFFFFFFFF',
    '.FFFFFF**FFFFFF.',
    '.....FF**FF.....',
    '.......**.......',
    '......FFFF......',
    '.......FF.......',
    '.......FF.......',
    '.......FF.......',
    '....FFFFFFFF....',
    '..FFFFFFFFFFFF..'] },
  // a music stand: a sheet with a note on it, a ledge, a thin tripod
  bard: { rows: [
    '.HHHHHHHHHH.',
    '.HHHHHKKKHH.',
    '.HHHHHKHKKH.',
    '.HHHHHKHHHH.',
    '.HHHHHKHHHH.',
    '.HHH**KHHHH.',
    '.HHH**HHHHH.',
    '.HHHHHHHHHH.',
    'FFFFFFFFFFFF',
    '.....FF.....',
    '.....FF.....',
    '.....FF.....',
    '.....FF.....',
    '.....FF.....',
    '....F..F....',
    '...F....F...',
    '..F......F..',
    '.F........F.'] },
};

// The hexer's brew, the one prop that moves: its surface is the pot's `B`
// cells (row `brew` of its rows), and a bubble rises over the lip on a
// `period`-second beat, a cell every `step` s for `life` s, at one of `lanes`
// columns from `lane0`; a dim purple `bubble` before 8, `bubbleLit` from it.
export const BREW = { period: 1.8, pace: 0.9, life: 1.2, step: 0.2, lane0: 5, lanes: 4,
                      bubble: DEEP_PURPLE.mid, bubbleLit: DEEP_PURPLE.glow };

// Which prop a station stands beside: its class's, or the crate below the fork.
export const propKey = st => (st && st.cls && PROPS[st.cls] ? st.cls : 'crate');

// A part cell's step down its ramp (0 hi, 1 body, 2 shade), lit from the
// upper left: an edge against open water above or on the left takes the
// light, one on the right or below the shade; a cell standing alone across
// its row is the body. A '+' is open water before rung 8 and after.
const OPEN = new Set(['.', '+']);
function shadeAt(rows, r, c) {
  const open = (rr, cc) => OPEN.has(rows[rr]?.[cc] ?? '.');
  const lf = open(r, c - 1), rt = open(r, c + 1);
  if (open(r - 1, c)) return 0;
  if (lf && rt) return 1;
  if (lf) return 0;
  return rt || open(r + 1, c) ? 2 : 1;
}

// Every still cell of prop `key`, as [col, row, ramp, tone]: `ramp` 'g' for
// the grey ramp and 'p' the purple, `tone` an index into it; `lit` from
// rung 8. The brew's bubble is `brewCells`'.
export function propCells(key, lit) {
  const rows = PROPS[key].rows, T = PROP_TONES, out = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    const ramp = T.ramps[ch] && ((lit && T.lit[ch]) || T.ramps[ch]);
    const tone = ramp ? ramp[shadeAt(rows, r, c)] : T.hand[ch]?.[lit ? 1 : 0];
    if (tone) out.push([c, r, ...tone]);
  }));
  return out;
}

// The bubble over the brew at `t` seconds, in the same shape. Nothing for a
// prop with no brew.
export function brewCells(key, lit, t) {
  const row = PROPS[key].brew, B = BREW;
  if (row == null) return [];
  const k = (t * B.pace) % B.period;
  return k < B.life ? [[B.lane0 + Math.floor(t / B.period) % B.lanes, row - 1 - Math.floor(k / B.step),
                        'p', lit ? B.bubbleLit : B.bubble]] : [];
}

