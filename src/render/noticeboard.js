// The noticeboard: a panel on two posts, standing between the work bench and
// the front doors, with the books pinned to it. Furniture rather than a
// building: nobody works here, so it is the one thing along the walk with no
// doorway. Everything here is whole cells; anything off the six-pixel lattice
// puts a hairline gutter between the sheets.

import { BOARD_LEG, P, PAPER } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';

// The sheets, in cells off the panel's top-left, of unequal widths so the board
// reads as somebody's rather than as a spreadsheet. The writing is lines, not
// glyphs: a run of ink half a cell tall, a cell of paper between runs, never
// reaching the sheet's edge ([row, from, width]). Half-cell runs at cell
// spacing read as digits.
const SHEETS = [
  { x: 1, y: 1, w: 3, h: 3, ink: [[0.5, 0.5, 2], [1.5, 0.5, 1.5]] },
  { x: 5, y: 1, w: 3, h: 3, ink: [[0.5, 0.5, 1.5], [1.5, 0.5, 2]] },
  { x: 9, y: 1, w: 3, h: 3, ink: [[0.5, 0.5, 2]] },
  { x: 1, y: 5, w: 3, h: 2, ink: [[0.5, 0.5, 2]] },
  { x: 5, y: 5, w: 2, h: 2, ink: [[0.5, 0.5, 1]] },
  { x: 8, y: 5, w: 4, h: 2, ink: [[0.5, 0.5, 3]] }
];

// A sheet's tone off its own index: one tone across the lot reads as printed
// paint rather than paper.
const toneOf = i => PAPER[(i * 3 + 1) % PAPER.length];

export function drawNoticeboard() {
  // The board goes up with the first grain banked, when its sheet opens too.
  if (!(S.banked > 0)) return;

  const r = S.noticeboard;
  if (!r || !r.w) return;

  // the two posts, sunk to the ground line
  ctx.fillStyle = '#000';
  const leg = P;
  ctx.fillRect(r.x + P, r.y + r.h, leg, BOARD_LEG);
  ctx.fillRect(r.x + r.w - P - leg, r.y + r.h, leg, BOARD_LEG);

  // the panel, and the same half-cell eave every building in the yard wears
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillRect(r.x - P / 2, r.y - P / 2, r.w + P, P / 2);

  // the sheets, and the writing on them
  SHEETS.forEach((s, i) => {
    const x = r.x + s.x * P, y = r.y + s.y * P;
    ctx.fillStyle = toneOf(i);
    ctx.fillRect(x, y, s.w * P, s.h * P);
    ctx.fillStyle = '#000';
    for (const [row, from, w] of s.ink) ctx.fillRect(x + from * P, y + row * P, w * P, P / 2);   // half-cell: a line of ink, on the half lattice
  });
}
