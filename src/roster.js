// Who is working where, written under the place they work.
//
// The crew used to be moved about from rows on the bench, which put the whole
// workforce in one list a walk away from any of it: to see that the beds were
// standing empty you had to remember what the number beside "at the beds" was
// last time you opened the board. So the count lives under its station now. A
// glance along the yard says where everybody is, and the two buttons that move
// them are in the same place as the thing they move them to.
//
// Carrying is the exception, and it has no buttons: you never put a body *on*
// carrying dust, it is what a body does when it is on nothing. Its count is
// there to be read, so that the spare hands are a number somewhere rather than
// a sum you do in your head.

import { P, WORKER } from './config.js';
import { S, quarry, farm, lab, pit } from './state.js';
import { assign, idle } from './upgrades.js';

// [ - ] badge count [ + ] -- the buttons at the ends, where they are easiest to
// hit and hardest to mix up with each other.
const BTN = P * 4;                 // a button is this square
const GAP = P;                     // and this far from what it sits beside
const NUM = P * 4;                 // room kept for the count, two digits wide
const WIDE = BTN + GAP + WORKER + GAP + NUM + GAP + BTN;

// Each station and the job it stands for, in yard order, left to right, so the
// roster reads the way the world does.
export const POSTS = [
  { key: 'labjob', job: 'labbers',
    at: () => lab.x + lab.w / 2, show: () => S.labOpen },
  { key: 'farmjob', job: 'farmhands',
    at: () => farm.x + farm.w / 2, show: () => S.farmOpen },
  { key: 'quarryjob', job: 'quarriers',
    at: () => quarry.x + quarry.w / 2, show: () => S.quarryOpen,
    // the quarry is a hole: a roster under the ground line there would be a
    // roster down the shaft, so it stands clear of the floor of it
    below: () => quarry.h + P * 12 },
  { key: 'mine', job: 'miners',
    at: () => S.cx, show: () => S.crew > 0 },
  // The haulers' own place is the lip they tip over, which is the one bit of
  // ground they all end up at whatever they are carrying and wherever from.
  { key: 'carry', job: 'haulers',
    at: () => pit.x - P * 12, show: () => S.crew > 0, fixed: true }
];

// Where a post's roster stands, in world units. Well below the ground line: the
// bar over a station that has stopped is already just under it, and two marks
// in one place are two marks nobody reads.
export function postAt(p) {
  const y = S.groundY + (p.below ? p.below() : P * 14);
  return { x: Math.round(p.at() / P) * P, y: Math.round(y / P) * P };
}

// The three boxes of one roster, left to right, in world units.
function boxes(p) {
  const { x, y } = postAt(p);
  const left = x - WIDE / 2;
  return {
    less: { x: left, y: y - BTN / 2, w: BTN, h: BTN },
    badge: { x: left + BTN + GAP, y: y - WORKER / 2, w: WORKER, h: WORKER },
    num: { x: left + BTN + GAP + WORKER + GAP, y, w: NUM, h: BTN },
    more: { x: left + WIDE - BTN, y: y - BTN / 2, w: BTN, h: BTN }
  };
}

export const posts = () => POSTS.filter(p => p.show());

const inside = (b, x, y) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;

// A click on a roster, in world units: true if it was one, so the yard knows
// not to treat it as a swing at the ground. The buttons are only live when they
// would do something -- there is no body to take off an empty post, and none to
// put on one when every hand is already spoken for.
export function rosterHit(x, y) {
  for (const p of posts()) {
    if (p.fixed) continue;
    const b = boxes(p);
    // a near miss on either button still counts as that button rather than as a
    // swing at the ground: they are small, and the ground behind them does
    // something else entirely
    if (inside(b.less, x, y)) { if (S[p.job] > 0) assign(p.job, -1); return true; }
    if (inside(b.more, x, y)) { if (idle() > 0) assign(p.job, 1); return true; }
    if (inside(b.badge, x, y) || inside(b.num, x, y)) return true;   // the count is not a button
  }
  return false;
}

// --- drawing -----------------------------------------------------------------
// The badge and the buttons are world pixels on the cell grid, so they stay as
// crisp as everything else. The count is the one thing drawn in screen pixels:
// it is type, and type scaled by five sixths is type with a fuzzy edge.

export function drawRoster(ctx, drawBody) {
  const spare = idle();
  for (const p of posts()) {
    const b = boxes(p);
    const n = S[p.job];

    drawBody(b.badge.x, b.badge.y);

    if (p.fixed) continue;                       // carrying is read, not set
    button(ctx, b.less, '-', n > 0);
    button(ctx, b.more, '+', spare > 0);
  }
}

// A button is the mark itself: a bar, and a plus is that bar with an upright.
// They were boxed at first, and a box is a lie about what this is -- the yard
// has no windows, panels or frames anywhere else in it, and two bordered squares
// under every station read as a dialog that had wandered into the picture. The
// mark alone is the same thing to click and one less thing to look at. What it
// loses is the edge that said where to aim, so the hit box stays the size the
// box was: a cell of slack all round, which the cursor never has to know about.
//
// Pale when it would do nothing, rather than hidden -- a control that comes and
// goes is a control you have to hunt for.
const BAR = P * 3;                 // the arm of a plus, and the whole of a minus
// Drawn a hairline thick rather than a cell thick. A cell is the unit everything
// in the yard is *built* of, and a mark a cell thick sat in the picture with the
// weight of a thing you could pick up. This is a line, like the ground line, and
// carries the same weight as one.
const THIN = 2;

function button(ctx, b, kind, live) {
  ctx.fillStyle = live ? '#000' : '#c9c9c9';
  const x = b.x + b.w / 2, y = b.y + b.h / 2;
  ctx.fillRect(x - BAR / 2, y - THIN / 2, BAR, THIN);
  if (kind === '+') ctx.fillRect(x - THIN / 2, y - BAR / 2, THIN, BAR);
  ctx.fillStyle = '#000';
}

// The counts, in screen pixels, after the world has been drawn.
export function drawRosterCounts(ctx, screenAt) {
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'center';                    // it sits in the middle of its own slot
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  for (const p of posts()) {
    const b = boxes(p);
    const at = screenAt(b.num.x + b.num.w / 2, b.num.y);
    ctx.fillText(String(S[p.job]), Math.round(at.x), Math.round(at.y));
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// what the roster is showing and where its buttons are, for the checks
export function rosterReport() {
  return posts().map(p => {
    const b = boxes(p);
    return { key: p.key, job: p.job, n: S[p.job], fixed: !!p.fixed,
             less: [b.less.x + b.less.w / 2, b.less.y + b.less.h / 2],
             more: [b.more.x + b.more.w / 2, b.more.y + b.more.h / 2] };
  });
}
