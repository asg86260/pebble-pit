// The stations' props (DESIGN.md, "A station is its fighter and a prop";
// the approved look is option A of docs/mocks/station-polish-2026-10-15/,
// whose PROPS_A these are). A station is its fighter, standing beside the
// thing its class trains with; a base unit, below the fork, has a blank
// flag, its colors still to be painted.
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
// A prop with `cloth` names the letters its cloth is made of; those cells
// are left out of its still cells and drawn waving (`clothCells`).
// Every part is shaded by where it stands, lit from the upper left
// (`shadeAt`), so the rows alone say how a prop is drawn, and a prop is
// swapped by swapping its rows.
//
// Data and a pure dealer, and no drawing: the renderer (render/deep.js)
// turns the tones it is handed into paint, and the node tier can read what
// a station is drawn as without a canvas. It imports only the config, so
// place.js can read it without pulling the drawing in behind it.

import { DEEP_PURPLE, PROP_TONES, FLAG_WAVE } from '../config.js';

export const PROPS = {
  // a blank swallowtail flag on a pole, its colors still to be painted (the
  // owner, 2026-10-15, option 6 of docs/mocks/station-default-2026-10-15/);
  // its cloth (`cloth`, the letters it is made of) waves (`clothCells`)
  flag: { cloth: 'S4', rows: [
    '.HH...........',
    '.FFSSSSS4SSSSS',
    '.FFSSSSS4SSSSS',
    '.FFSSSSS4SSSS.',
    '.FFSSSSS4SSS..',
    '.FFSSSSS4SSSS.',
    '.FFSSSSS4SSSSS',
    '.FFSSSSS4SSSSS',
    '.FF...........',
    '.FF...........',
    '.FF...........',
    '.FF...........',
    '.FF...........',
    'FFFF..........',
    'FFFFF.........'] },
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
  // a sacking dummy on a post, arms out, a dagger stuck straight out of its chest
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
    '..HHHHHHHHHH..Q.....',
    '..HHHHHHHHH2hhQrr*..',
    '..HHHHHHHHHH..Q.....',
    '...HHHHHHHH.........',
    '...HHHHHHHH.........',
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
  // a lectern, a book open on it, a candle at the desk's end, its flame the accent
  mage: { rows: [
    '..............*.',
    '.HHHH..HHHH...*.',
    'HHHHHFFHHHHH..1.',
    'HKKKHFFHKKKH.HHH',
    'HHHHHFFHHHHH.HHH',
    'HKKHHFFHHKKH.HHH',
    'HHHHHFFHHHHH.HHH',
    'FFFFFFFFFFFFFFFF',
    '.FFFFFFFFFFFFFF.',
    '......FFFF......',
    '.......FF.......',
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

// Which prop a station stands beside: its class's, or the flag below the fork.
export const propKey = st => (st && st.cls && PROPS[st.cls] ? st.cls : 'flag');

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
// rung 8. The brew's bubble is `brewCells`', the cloth `clothCells`'.
export function propCells(key, lit) {
  const rows = PROPS[key].rows, out = [], cloth = PROPS[key].cloth || '';
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    const cell = !cloth.includes(ch) && toneCell(rows, r, c, ch, lit);
    if (cell) out.push(cell);
  }));
  return out;
}

// The cell `ch` at row `r`, column `c` of `rows`, as [col, row, ramp, tone].
function toneCell(rows, r, c, ch, lit) {
  const T = PROP_TONES, ramp = T.ramps[ch] && ((lit && T.lit[ch]) || T.ramps[ch]);
  const tone = ramp ? ramp[shadeAt(rows, r, c)] : T.hand[ch]?.[lit ? 1 : 0];
  return tone ? [c, r, ...tone] : null;
}

// How far up column `c` of a cloth is lifted on frame `k`, in whole cells
// (FLAG_WAVE): a sine crest travelling out from the hoist a column a frame,
// rounded to a cell, its swing growing from nothing at the pole to a cell
// `grow` columns out.
export function clothLift(c, k) {
  const W = FLAG_WAVE, d = Math.sin(2 * Math.PI * (k - c) / W.length) * Math.min(1, c / W.grow);
  return Math.round(d) || 0;
}
// A station's own beat: its id hashed to a share of the period, so no two
// flags step together. Spread by the golden ratio, since the ids run s1, s2..
// and hash a step apart.
const beatOf = seed => ([...String(seed ?? '')].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 9973, 7) * 0.6180339887) % 1;

// The cloth of prop `key` at `t` seconds, in propCells' shape, for the
// station `seed`: each column of it lifted by `clothLift` on the frame the
// clock is on, a frame held `period / length` s, and shaded where it now
// stands. Nothing for a prop with no cloth.
export function clothCells(key, lit, t, seed) {
  const { rows, cloth } = PROPS[key], W = FLAG_WAVE;
  if (!cloth) return [];
  const k = Math.floor((t / W.period + beatOf(seed)) * W.length);
  const grid = rows.map(row => [...row].map(ch => (cloth.includes(ch) ? '.' : ch)));
  const at = [];
  let hoist = Infinity;
  rows.forEach(row => [...row].forEach((ch, c) => { if (cloth.includes(ch)) hoist = Math.min(hoist, c); }));
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (!cloth.includes(ch)) return;
    const rr = r - clothLift(c - hoist, k);
    if (grid[rr]) { grid[rr][c] = ch; at.push([rr, c, ch]); }
  }));
  const moved = grid.map(row => row.join(''));
  return at.map(([r, c, ch]) => toneCell(moved, r, c, ch, lit)).filter(Boolean);
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

