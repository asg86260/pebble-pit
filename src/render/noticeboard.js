// The noticeboard: a panel on two posts, standing between the work bench and
// the front doors, with the books pinned to it.
//
// It is furniture rather than a building. Every other station in the yard is a
// box with a door in it, because every other station is somewhere a body goes
// in and works; nobody works here. So it is the one thing along the walk with
// no doorway: a face you walk up to and read, held up off the ground on legs,
// which is what tells you at a glance that it is not another shed.
//
// It used to fill up with slips as the record did. The record hangs on the
// held sheet now (record.js), and what the board carries is the books -- a
// few sheets of figures, the same few from the first minute to the last -- so
// the face is a fixed arrangement of pinned sheets with lines of writing on
// them, and nothing about it changes with the score. The old slips were laid
// out at thirteen and a half pixels a column on a six-pixel lattice, which put
// a hairline gutter between every pair and a lopsided bottom row; everything
// here is whole cells.

import { BOARD_LEG, P, PAPER } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';

// The sheets, in cells off the panel's top-left: where each one is pinned and
// how big it is. Three across the top row and three along the bottom, of
// unequal widths, because a board with six identical cards on it reads as a
// spreadsheet and one with a wide sheet, a narrow one and a torn corner reads
// as somebody's. The writing is a list of rows within the sheet, each a run
// of ink cells: [row, from, width].
// The writing is lines, not glyphs: a run of ink half a cell tall, a cell of
// paper between runs, never reaching the sheet's edge. Half-cell runs at cell
// spacing were tried and read as digits.
const SHEETS = [
  { x: 1, y: 1, w: 3, h: 3, ink: [[0.5, 0.5, 2], [1.5, 0.5, 1.5]] },
  { x: 5, y: 1, w: 3, h: 3, ink: [[0.5, 0.5, 1.5], [1.5, 0.5, 2]] },
  { x: 9, y: 1, w: 3, h: 3, ink: [[0.5, 0.5, 2]] },
  { x: 1, y: 5, w: 3, h: 2, ink: [[0.5, 0.5, 2]] },
  { x: 5, y: 5, w: 2, h: 2, ink: [[0.5, 0.5, 1]] },
  { x: 8, y: 5, w: 4, h: 2, ink: [[0.5, 0.5, 3]] }
];

// A sheet's tone. Paper on a board is not one white -- these have been rained
// on and pinned up at different times -- so each takes a shade off its own
// index. One tone across the lot reads as printed paint rather than as paper,
// which is the rule every heap and every band in this game already follows.
const toneOf = i => PAPER[(i * 3 + 1) % PAPER.length];

export function drawNoticeboard() {
  // Nothing until the yard has something to keep books on: the board goes up
  // with the first grain banked, which is when its sheet opens too.
  if (!(S.banked > 0)) return;

  const r = S.noticeboard;
  if (!r || !r.w) return;

  // the two posts, sunk to the ground line
  ctx.fillStyle = '#000';
  const leg = P;
  ctx.fillRect(r.x + P, r.y + r.h, leg, BOARD_LEG);
  ctx.fillRect(r.x + r.w - P - leg, r.y + r.h, leg, BOARD_LEG);

  // the panel, and a lip over it -- the same half-cell eave every building in
  // the yard wears, which is what keeps it a thing that was built rather than a
  // rectangle that appeared
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
