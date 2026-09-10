// The noticeboard: a panel on two posts, standing between the work bench and
// the front doors, with the record pinned to it.
//
// It is furniture rather than a building. Every other station in the yard is a
// box with a door in it, because every other station is somewhere a body goes
// in and works; nobody works here. So it is the one thing along the walk with
// no doorway: a face you walk up to and read, held up off the ground on legs,
// which is what tells you at a glance that it is not another shed.
//
// **The board fills up as the record does.** How many slips are pinned to it is
// how much you have done, capped at what the panel holds. That is the whole of
// what it has to say from across the yard, and it is the reason to draw the
// slips at all rather than a blank rectangle: a board with two notices on it and
// a board with forty look different from the far side of the world.

import { BOARD_LEG, BOARD_SLIPS, P, SHADES } from '../config.js';
import { S } from '../state.js';
import { noticeCount, noticeTotal, unreadNotices } from '../notices.js';
import { ctx } from './ctx.js';

// The slips are laid out in a grid inside the panel, in the order they were
// earned, so the board fills left to right and top to bottom the way a real one
// would. Their size comes from the panel rather than being written down: a
// wider board tomorrow shows the same twelve slips, bigger.
const COLS = 4, ROWS = 3;

// A slip's tone. Paper on a board is not one white -- these have been rained on
// and pinned up at different times -- so each takes a shade off its own index.
// One tone across the lot reads as printed paint rather than as paper, which is
// the rule every heap and every band in this game already follows.
const toneOf = i => SHADES[(i * 5 + 2) % SHADES.length];

export function drawNoticeboard() {
  // Nothing until the yard has done something worth a board. The first notice
  // is the first pebble in the pit, so in practice it goes up in the first
  // minute -- but a board standing empty over a yard that has not started is a
  // promise the game has not earned yet.
  if (!noticeCount()) return;

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

  // the slips
  const pad = P;
  const gw = (r.w - pad * 2) / COLS, gh = (r.h - pad * 2) / ROWS;
  const sw = Math.max(P, Math.round((gw - P / 2) / P) * P);
  const sh = Math.max(P, Math.round((gh - P / 2) / P) * P);
  const shown = Math.min(BOARD_SLIPS, noticeCount());

  for (let i = 0; i < shown; i++) {
    const cx = i % COLS, cy = Math.floor(i / COLS);
    ctx.fillStyle = toneOf(i);
    ctx.fillRect(Math.round(r.x + pad + cx * gw), Math.round(r.y + pad + cy * gh), sw, sh);
  }

  // Something new is pinned up and you have not been over to look at it. The
  // bobbing tick over the station says so as well (see drawDoneMarks) -- this is
  // the same fact said at the board's own scale, for the times you are looking
  // straight at it: the newest slip stands proud of the rest.
  if (unreadNotices() > 0 && shown) {
    const i = Math.min(shown, BOARD_SLIPS) - 1;
    const cx = i % COLS, cy = Math.floor(i / COLS);
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.round(r.x + pad + cx * gw) - P / 2,
                 Math.round(r.y + pad + cy * gh) - P / 2, sw + P, sh + P);
  }

  // and once the record is full the board is papered over, which is its own
  // small reward for having done the lot
  if (noticeCount() >= noticeTotal()) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(r.x + pad, r.y + pad, r.w - pad * 2, r.h - pad * 2);
  }
}
