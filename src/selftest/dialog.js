// The story's dialog on the page (dialog.js, render/dialog.js): God's line in
// its bubble over his head, read off the frame -- the tail's tip is ink where
// his head is -- and a real click on the game, away from the bubble, going on
// from it. The node tier has the line's facts (test/dialog.test.mjs); this is
// the pointer and the pixels.

import { S } from '../state.js';
import { DIALOG_STROKE_PX, DIALOG_TAIL } from '../config.js';
import { ok, settle, frames, canvas, point } from './kit.js';
import { draw } from '../render.js';
import { ctx } from '../render/ctx.js';
import { SCENES } from '../scenes.js';
import { bubbleSeen } from '../render/dialog.js';
import { lineShown } from '../dialog.js';

const U = DIALOG_STROKE_PX;

// The tail's tip on the window: the ink cell past its last row of paper.
function tipOf(b) {
  const L = DIALOG_TAIL.length * U;
  if (b.dir === 'down') return { x: b.at, y: b.y + b.h + L - U * 1.5 };
  if (b.dir === 'left') return { x: b.x - L + U / 2, y: b.at };
  return { x: b.x + b.w + L - U * 1.5, y: b.at };
}
// The darkest pixel within a stroke of (x, y): the tip is one cell, and a
// half-cell's rounding must not miss it.
const lum = (x, y) => {
  const r = Math.ceil(U * S.dpr), d = ctx.getImageData(Math.round(x * S.dpr) - r, Math.round(y * S.dpr) - r, r * 2 + 1, r * 2 + 1).data;
  let least = 255;
  for (let i = 0; i < d.length; i += 4) least = Math.min(least, (d[i] + d[i + 1] + d[i + 2]) / 3);
  return least;
};

export const TESTS = [
  ["God's line stands in a bubble whose tail points at his head, and a click on the game goes on from it", async () => {
    SCENES.dialog.run();
    await settle(0.6);                                // the line's fade in, done
    await frames(2);
    draw();
    const line = lineShown() && { ...lineShown() }, b = bubbleSeen();
    const tip = b && tipOf(b), head = b && b.head;
    // where the tip is, against his head: touching its side beside it, its
    // crown's top over it, and within the head's height or width
    const near = !!b && (b.dir === 'down'
      ? Math.abs(tip.x - head.x) <= head.half && Math.abs(tip.y - head.top) <= U * 3
      : Math.abs(Math.abs(tip.x - head.x) - head.half) <= U * 3 && tip.y >= head.top && tip.y <= head.mid + head.half);
    const inked = !!b && lum(tip.x, tip.y) < 96;    // the light page: the tip's outline is ink
    // A click on the game, well clear of the bubble: the bottom of the world.
    const r = canvas().getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.7;
    const off = b && !(cx - r.left >= b.x && cx - r.left < b.x + b.w && cy - r.top >= b.y && cy - r.top < b.y + b.h);
    point('pointerdown', cx, cy);
    point('pointerup', cx, cy);
    const went = !!lineShown() && lineShown().out != null && S.heard.includes('act-meet-god');
    await frames(40);
    const gone = !lineShown() || lineShown().id !== 'act-meet-god';
    return [
      ok(line && line.id === 'act-meet-god' && line.who === 'god' && line.out == null, 'God\'s line is up and waiting', JSON.stringify(line)),
      ok(near, 'its tail\'s tip is at his head', JSON.stringify({ tip, head, dir: b && b.dir })),
      ok(inked, 'and the tip is drawn there, ink on the frame', String(b && lum(tip.x, tip.y))),
      ok(off && went, 'a real click away from the bubble goes on from the line, read at once', `${off} ${went}`),
      ok(gone, 'and it fades away', JSON.stringify(lineShown()))
    ];
  }]
];
