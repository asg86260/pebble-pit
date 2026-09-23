// The counter: the one thing here read rather than looked at, drawn in screen
// pixels. Owns digits, drawCount and the counter's remembered marks.

import { openBoardRect } from '../board.js';
import { fmt } from '../words.js';
import { CORE_CELL, P, SHARD_CELL, SPARK_CELL, SPORE_CELL, SCALE_MARK } from '../config.js';
import { S, floor, pit } from '../state.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';
import { shown } from '../tween.js';
import { safeBottom } from '../world.js';

// Drawn in **screen** pixels, so it stays the size it is however far the yard
// has been scaled down to fit the window.
const MARK = 9;          // a mark on the counter, in screen pixels
const ROW = 19;          // and the gap between one row and the next
const EDGE = 10;         // and how close to the glass it will stand
const CLEAR = 8;         // the air it keeps between itself and an open board

// the marks down the left of the counter, kept rather than redrawn
let markCan = null, markKey = '';

// The counter's numbers, remembered: `fmt` is `toLocaleString`, eight
// microseconds a call, and once the marks are kept it is the entire remaining
// cost of the card. Cleared rather than grown when it fills: while a count is
// running to a new value every frame is a new number.
const said = new Map();
function digits(n) {
  let s = said.get(n);
  if (s === undefined) { if (said.size > 32) said.clear(); said.set(n, s = fmt(n)); }
  return s;
}

// The scale's mark, pixel for pixel the stylesheet's (SCALE_MARK in
// config/deepboard.js): its ink laid on the card, whose white is its paper.
// Centered in the MARK square the other coins stand in.
function drawScale(g, x, y) {
  const ox = x + Math.floor((MARK - SCALE_MARK[0].length) / 2);
  const oy = y + Math.floor((MARK - SCALE_MARK.length) / 2);
  SCALE_MARK.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === '#') g.fillRect(ox + c, oy + r, 1, 1);
  });
}

// Where the card was last drawn, in screen pixels, for the tip over it.
let countBox = null;
export const countRect = () => countBox;
export const overCount = (sx, sy) => !!countBox && sx >= countBox.x && sx < countBox.x + countBox.w
                                     && sy >= countBox.y && sy < countBox.y + countBox.h;

// The card's lines, top row first, in the purse's order: dust, core, ore,
// crops, sparks, scales. Each read through the tweener, so a load tipping in
// counts up and a purchase counts down. Gathered before any of it is placed,
// because how wide the card is decides where it can stand.
export function countLines() {
  const dust = digits(Math.round(shown('dust', S.stored)));
  const lines = [{ cell: null, text: dust }];
  if (S.seenCore) lines.push({ cell: CORE_CELL, text: String(Math.round(shown('card:core', S.cores))) });
  if (S.seenShard) lines.push({ cell: SHARD_CELL, text: digits(Math.round(shown('card:shard', S.shards))) });
  if (S.seenSpore) lines.push({ cell: SPORE_CELL, text: digits(Math.round(shown('card:spore', S.spores))) });
  if (S.seenSpark) lines.push({ cell: SPARK_CELL, text: digits(Math.round(shown('card:spark', S.sparks))) });
  // The deep's coin, last, as on the purse. Not a grain of the pit, so it has
  // no cell: its line carries the mark's own pixels instead.
  if (S.seenScale) lines.push({ cell: 'scale', text: digits(Math.round(shown('card:scale', S.scales))) });
  return lines;
}

export function drawCount() {
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'left';
  const lines = countLines();

  // The card: a white sheet with a black edge, the same panel every menu is
  // made of, so the numbers are never black on a heap of dust behind them.
  const PAD = 7;
  // Measured off every row, not the dust alone: the widest count is the dust
  // nearly always and that is not a rule, and the same figure has to be right
  // about the board it stands clear of.
  const widest = lines.reduce((w, l) => Math.max(w, ctx.measureText(l.text).width), 0);
  const wide = Math.round(MARK * 2 + widest + PAD * 2);
  const tall = Math.round(MARK + (lines.length - 1) * ROW + PAD * 2);

  // On the floor of the glass, where nothing in the yard is ever drawn, and
  // left of the hole, never over it: it slides along to stay with the pit, but
  // the near lip is a wall it does not cross, since everything past that is
  // the one part of the screen worth watching. EDGE is the degenerate case,
  // the lip scrolled off the left of the glass.
  const lip = (pit.x - S.camX) * S.zoom;
  const oldX = (pit.x + P * 4 - S.camX) * S.zoom;
  let x = Math.min(oldX, S.W - wide, lip - CLEAR - wide);
  x = Math.max(EDGE, x);
  // In the deep the pit is overhead, not beside the card: the card keeps to
  // the left edge of the glass, over the crusher that is the purse down there.
  if (S.view === 'deep') x = EDGE;
  // `y` is the bottom row's baseline and the box hangs above it, so the card's
  // own bottom edge is `y + PAD`.
  // Above the safe area, where a phone has one.
  const y = S.H - safeBottom() - EDGE - PAD;

  const box = { x: Math.round(x - PAD), y: Math.round(y - MARK - (lines.length - 1) * ROW - PAD),
                w: wide, h: tall };

  // And clear of whatever board is open: a board is an opaque element on the
  // page and the card is paint underneath it, so an overlap is the reading
  // gone. The card is what moves, off the left by preference and off the right
  // if the left has run out of glass (the rule `showTipAt` uses). On a window
  // too narrow for either it stays where it was: half a card behind a menu
  // beats a card off the glass.
  const sheet = openBoardRect();
  if (sheet && box.x < sheet.x + sheet.w && box.x + box.w > sheet.x &&
      box.y < sheet.y + sheet.h && box.y + box.h > sheet.y) {
    const left = sheet.x - CLEAR - box.w;
    const right = sheet.x + sheet.w + CLEAR;
    const put = left >= EDGE ? left
              : right + box.w <= S.W - EDGE ? right
              : box.x;
    x += put - box.x;
    box.x = put;
  }
  ctx.fillStyle = '#fff';
  countBox = box;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  // on the half pixel, so a two-wide edge lands on two whole ones
  ctx.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);

  // The column of marks, kept on a canvas of its own and laid down whole,
  // redrawn only when the card moves, grows or gains a row: a filled path
  // costs a hundred times what a fillRect does. It is *drawn* there rather
  // than copied off the frame, since reading the frame back is half a
  // millisecond and would turn every camera move into a hitch.
  //
  // The strip is exactly the pixels it replaces: laid down at whole device
  // pixels and drawn at the same device-pixel offset, so nothing is resampled,
  // and filled with the card's own white first so there is no blending to
  // round differently. The digits' column and the card's edge are left out;
  // the edge's outermost pixels are shared with whatever is behind them.
  const d = S.dpr;
  const cx0 = Math.floor((box.x + 4) * d), cy0 = Math.floor((box.y + 4) * d);
  const cw = Math.ceil(MARK * 2 * d), ch = Math.ceil((box.h - 8) * d);
  // A card with nothing on it but a grain of dust has nothing worth keeping.
  const key = lines.length > 1 &&
              `${cx0},${cy0},${cw},${ch},${x},${y},${lines.map(l => l.cell).join('.')}`;
  if (!key) {
    markKey = '';
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y - MARK, MARK, MARK);
  } else {
    if (markKey !== key) {
      markCan = markCan || document.createElement('canvas');
      if (markCan.width !== cw || markCan.height !== ch) { markCan.width = cw; markCan.height = ch; }
      const g = markCan.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#fff';
      g.fillRect(0, 0, cw, ch);
      g.setTransform(d, 0, 0, d, -cx0, -cy0);   // the card's own place, so nothing shifts
      // a grain of dust on the top row, then one mark for every other kind,
      // each shown only once you have seen one, in the purse's order so the
      // two read the same
      g.fillStyle = '#000';
      lines.forEach((l, i) => {
        const at = y - (lines.length - 1 - i) * ROW;
        if (!l.cell) g.fillRect(x, at - MARK, MARK, MARK);
        else if (l.cell === 'scale') drawScale(g, x, at - MARK);
        else drawMark(l.cell, x + MARK / 2, at - MARK / 2, MARK, true, g);
      });
      markKey = key;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(markCan, cx0, cy0);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  // and the counts themselves, which are the part that moves
  ctx.fillStyle = '#000';
  lines.forEach((l, i) => {
    ctx.fillText(l.text, x + MARK * 2, y - (lines.length - 1 - i) * ROW);
  });
}
