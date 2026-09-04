// The counter over the pit mouth: the one thing here read rather than looked at,
// drawn in screen pixels. Extracted verbatim from render.js; behavior unchanged.
// Owns digits and drawCount and the counter's remembered marks. The shared
// primitives (ctx, drawMark) come from ./ctx.js and ./marks.js.

import { fmt, openBoardRect } from '../board.js';
import { CORE_CELL, P, SHARD_CELL, SPARK_CELL, SPORE_CELL } from '../config.js';
import { S, floor, pit } from '../state.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';

// The counter is the one thing here that is read rather than looked at, so it is
// drawn in **screen** pixels and stays the size it is however far the yard has
// been scaled down to fit the window. Everything else is world furniture and a
// cell is a cell; a number you have to squint at is just a number you cannot
// read. It still sits over the pit mouth, and still slides along to stay on
// screen as you scroll the length of the hole.
const MARK = 9;          // a mark on the counter, in screen pixels
const ROW = 19;          // and the gap between one row and the next
const EDGE = 10;         // and how close to the glass it will stand
const CLEAR = 8;         // the air it keeps between itself and an open board

// the marks down the left of the counter, lifted off the card and put back
let markCan = null, markKey = '';

// The counter's numbers, remembered.
//
// `fmt` is `toLocaleString`, and `toLocaleString` is eight microseconds a call --
// once the marks are kept it is the entire remaining cost of the card, 0.04 ms a
// frame. The card asks it for the same five numbers sixty times a second, and a
// count that has not moved is the string it was last frame. Cleared rather than
// grown when it fills: the numbers worth keeping are the ones on the card now,
// and while a count is running to a new value every frame is a new number.
const said = new Map();
function digits(n) {
  let s = said.get(n);
  if (s === undefined) { if (said.size > 32) said.clear(); said.set(n, s = fmt(n)); }
  return s;
}

export function drawCount() {
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'left';

  // Everything that is going on it, bottom row first. Gathered before any of it
  // is placed, because how wide the card is decides where it can stand.
  const dust = digits(Math.round(S.shownStored));
  const lines = [{ cell: null, text: dust }];
  if (S.seenCore) lines.push({ cell: CORE_CELL, text: String(S.cores) });
  if (S.seenShard) lines.push({ cell: SHARD_CELL, text: digits(S.shards) });
  if (S.seenSpore) lines.push({ cell: SPORE_CELL, text: digits(S.spores) });
  if (S.seenSpark) lines.push({ cell: SPARK_CELL, text: digits(S.sparks) });

  // The card.
  //
  // These numbers float over whatever the yard happens to be doing behind them:
  // over the pit they are black on white and perfectly clear, and over a heap of
  // dust or a body walking past they are black on black. A reading you cannot
  // read half the time is not a reading. So they get a sheet to stand on, the
  // same white box with a black edge every menu in this game is made of -- it is
  // the same kind of thing, a panel that says what you have.
  const PAD = 7;
  // Measured off every row rather than off the dust alone. The room it needs was
  // guessed from the widest count on the card -- which is the dust nearly always
  // and is not a rule -- and the same figure has to be right about the board it
  // now has to stand clear of, so it is the card's real width or it is nothing.
  const widest = lines.reduce((w, l) => Math.max(w, ctx.measureText(l.text).width), 0);
  const wide = Math.round(MARK * 2 + widest + PAD * 2);
  const tall = Math.round(MARK + (lines.length - 1) * ROW + PAD * 2);

  let x = Math.max(EDGE, Math.min((pit.x + P * 4 - S.camX) * S.zoom, S.W - wide));
  const y = Math.min((S.groundY - P * 3 - S.camY) * S.zoom, S.H - EDGE);

  const box = { x: Math.round(x - PAD), y: Math.round(y - MARK - (lines.length - 1) * ROW - PAD),
                w: wide, h: tall };

  // And clear of whatever board is open.
  //
  // The card floats over the pit and the books stand at the pit mouth, which is
  // the whole point of them -- the counter says what you have and they say how
  // fast it is arriving, so they belong within a glance of each other. Within a
  // glance is not on top of: a board is an opaque element on the page and the
  // card is paint underneath it, so an overlap is not a clash, it is the reading
  // simply gone.
  //
  // The card is what moves, not the board. A board is seated on the station it
  // belongs to and that seating is what makes it readable at all; the card has
  // never had a place of its own -- it already slides along the pit to stay on
  // screen -- so stepping aside is the thing it was already doing. Off the left
  // by preference and off the right if the left has run out of glass, which is
  // the rule the row notes already use when they run out of room (`showTipAt`).
  // Neither side will take it on a very narrow window, and then it stays where
  // it was: half a card behind a menu is better than a card off the glass.
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
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  // on the half pixel, so a two-wide edge lands on two whole ones
  ctx.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);

  // The column of marks down the left of the card, kept rather than redrawn.
  //
  // The digits are cheap, and they are the part that moves. The marks are
  // neither: a core is an arc with a stroke round it, a spore is a hexagon and a
  // spark is an eight-point star, and a filled path costs a hundred times what a
  // fillRect does. A late yard shows all four, and drawing four shapes that had
  // not changed since the last one was found cost 0.08 ms a frame -- a fifth of
  // the whole draw on a busy yard, spent on a picture nothing had touched.
  //
  // So the column is kept on a canvas of its own and laid down whole, and drawn
  // again only when the card moves or grows or gains a row. It is *drawn* there
  // rather than copied off the frame: reading the frame back is half a
  // millisecond in a browser with no card under it, which would turn every
  // camera move into a hitch -- the very thing this is meant to take out.
  //
  // Two things make the strip exactly the pixels it replaces. It is laid down at
  // whole device pixels, and it is drawn at the same offset in device pixels, so
  // every mark keeps the fraction of a pixel it would have been drawn on and
  // nothing is resampled at any device ratio. And it is filled with the card's
  // own white first, so an opaque strip goes down over flat white and there is no
  // blending to round differently. The digits' column is left out of it -- that
  // is the part that moves -- and so is the card's edge, whose outermost pixels
  // are shared with whatever the yard is doing behind them.
  const d = S.dpr;
  const cx0 = Math.floor((box.x + 4) * d), cy0 = Math.floor((box.y + 4) * d);
  const cw = Math.ceil(MARK * 2 * d), ch = Math.ceil((box.h - 8) * d);
  // A card with nothing on it but a grain of dust has nothing worth keeping: a
  // fillRect is cheaper than any picture of one, and an early yard is all there
  // is until the first core comes up.
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
      // a grain of dust, and then one mark for every other kind, each shown only
      // once you have seen one
      g.fillStyle = '#000';
      g.fillRect(x, y - MARK, MARK, MARK);
      let at = y;
      for (const l of lines) {
        if (!l.cell) continue;                 // the dust is drawn above
        at -= ROW;
        drawMark(l.cell, x + MARK / 2, at - MARK / 2, MARK, true, g);
      }
      markKey = key;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(markCan, cx0, cy0);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  // and the counts themselves, which are the part that moves
  ctx.fillStyle = '#000';
  ctx.fillText(dust, x + MARK * 2, y);
  let row = y;
  for (const l of lines) {
    if (!l.cell) continue;
    row -= ROW;
    ctx.fillText(l.text, x + MARK * 2, row);
  }
}
