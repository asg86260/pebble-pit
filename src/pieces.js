// REVIEW review-mansion
// A building put up a piece a trip (the finale's house, home.js; the
// ending's mansion, mansion.js): the one reckoning of where a piece is and
// where a body stands to set it, so the two plans cannot drift apart.
//
// A piece's `segs` are [x, row, w, h] in cells off the building's left end
// and up from the ground line (rows negative). A piece with no cells of its
// own (a row of rock broken up, a pole taken down) names the cell it is
// worked at as `x`.

import { P, WORKER } from './config.js';

// Its middle (`cx`), its top row and its widest run, in cells, written onto
// each piece of a plan once, when the plan is laid out.
export function shapePieces(list) {
  for (const p of list) {
    if (!p.segs.length) { p.cx = (p.x ?? 0) + 0.5; continue; }
    const x0 = Math.min(...p.segs.map(s => s[0])), x1 = Math.max(...p.segs.map(s => s[0] + s[2]));
    p.cx = (x0 + x1) / 2;
    p.top = Math.min(...p.segs.map(s => s[1]));
    p.w = Math.max(...p.segs.map(s => s[2]));
  }
  return list;
}

// The spot a piece is set from: a body's left edge on the ground under the
// piece's middle, on the cell grid, for a building whose left end is `x0`.
export const pieceSpot = (x0, p) => x0 + Math.round(p.cx - WORKER / P / 2) * P;
