// Who is working where, written under the place they work, with the two
// buttons that move them in the same place. Carrying is the exception and has
// no buttons: you never put a body *on* carrying, it is what a body does when
// it is on nothing. Its count is there to be read.

import { P, WORKER, LIFT_SEAT as SEAT } from './config.js';
import { S, quarry, farm, apothecary, filter, sky, outhouse, shack } from './state.js';
import { groundAt, kitX, liftX, quarryShed } from './world.js';
import { doorAt } from './house.js';
import { JOB_MACHINE, machine } from './machines.js';
import { assign, idle } from './staffing.js';
import { hats, worn, spareKit, roomAt, capOf, handsOf } from './levels.js';
import { KIT_MARK, TRADE_OF, LIFT, spareLifts, liftsOf } from './kit.js';
import { JOB } from './jobs.js';
import { shown } from './tween.js';


// [ - ] badge count [ + ] -- the buttons at the ends, where they are easiest to
// hit and hardest to mix up with each other.
const BTN = P * 4;                 // a button is this square
const GAP = P;                     // and this far from what it sits beside
const NUM = P * 4;                 // room kept for the count, two digits wide
const WIDE = BTN + GAP + WORKER + GAP + NUM + GAP + BTN;

// Each station and the job it stands for, in yard order, left to right.
//
// The lab and the air filter hold one body each, and still have a
// counter: what you are deciding is whether that station is *running at all*,
// and the yard deciding it for you means a pair of hands taken off the rock
// by a building without you having said so.
export const POSTS = [
  { key: 'filterjob', job: JOB.PURIFY,
    at: () => filter.x + filter.w / 2, show: () => S.filterOpen },
  // One body to a pot, stood under the apothecary it stirs.
  { key: 'stirjob', job: JOB.STIR,
    at: () => apothecary.x + apothecary.w / 2, show: () => S.apothecaryOpen },
  // The shed does not clean anything; what it buys is somebody whose job the
  // mess is (`capOf`), so the post stands under it.
  { key: 'loojob', job: JOB.JANITOR,
    at: () => outhouse.x + outhouse.w / 2, show: () => S.outhouseOpen, kit: true },
  { key: 'farmjob', job: JOB.FARM,
    at: () => farm.x + farm.w / 2, show: () => S.farmOpen, kit: true },
  { key: 'quarryjob', job: JOB.QUARRY,
    // Under the shed beside the cut, which is solid ground that stands clear
    // of the mouth; a roster under the hole's floor walks off the bottom of
    // the world as the quarry is dug down. Held clear of the mouth: the strip
    // is three times as wide as the shed, and centered exactly its plus
    // reaches into the hole's wall.
    at: () => { const s = quarryShed();
                return Math.min(s.x + s.w / 2, quarry.x - WIDE / 2 - P); },
    show: () => S.quarryOpen,
    kit: true },
  // On the ground under the meteor: the buttons belong where the body walks
  // to, not up beside the work.
  { key: 'skyjob', job: JOB.WIZARD,
    at: () => sky.x, show: () => S.meteorOpen, kit: true },
  // Outside the gang's hut once it stands; `S.cx` before, since the row is
  // here from the first hire and the shack is not. `kitX` in world.js answers
  // the stand the same way.
  { key: 'mine', job: JOB.ROCK,
    at: () => (S.shackOpen ? shack.x + shack.w / 2 : S.cx), show: () => S.crew > 0, kit: true },
  // Under the houses: carrying has no place its work is done, and what this
  // number counts is the bodies that are not on anything, so it belongs where
  // the bodies come from.
  { key: 'carry', job: JOB.HAUL,
    at: () => doorAt().x, show: () => S.crew > 0, fixed: true, kit: true }
];

// Below the ground line, clear of the stopped-station triangle (seven cells
// down and 2.6 tall) that hangs just under it.
export function postAt(p) {
  const y = S.groundY + P * 10;
  return { x: Math.round(p.at() / P) * P, y: Math.round(y / P) * P };
}

// The carts' second rung has a line of its own under the carters': the
// engines the lip owns, drawn as a driver sat up on one.
const liftLine = p => p.job === JOB.HAUL && liftsOf() > 0;

// The machine's mark stands under the count, at the bottom of the strip, below
// the tradesmen's lines when there are any.
function runBox(p, left, y) {
  const h = BTN;
  return { x: left, y: y + WORKER + P * 3 + (p.kit ? WORKER + P * 2 : 0) +
                     (liftLine(p) ? WORKER + SEAT + P * 3 : 0), w: WIDE, h };
}

// The boxes of one roster, left to right, in world units, and under them a
// second line for the tradesmen: under rather than beside, because it is a
// *part* of the headcount, not another number.
function boxes(p) {
  const { x, y } = postAt(p);
  const left = x - WIDE / 2;
  // Two cells of air more than the gap elsewhere: the hat stands a cell proud
  // of its square, and past that a full clear cell keeps the two groups
  // reading as two lines rather than one smudged column.
  const under = y + WORKER + P * 3;
  return {
    less: { x: left, y: y - BTN / 2, w: BTN, h: BTN },
    badge: { x: left + BTN + GAP, y: y - WORKER / 2, w: WORKER, h: WORKER },
    num: { x: left + BTN + GAP + WORKER + GAP, y, w: NUM, h: BTN },
    more: { x: left + WIDE - BTN, y: y - BTN / 2, w: BTN, h: BTN },
    trade: { x: left + BTN + GAP, y: under - WORKER / 2, w: WORKER, h: WORKER },
    tradeNum: { x: left + BTN + GAP + WORKER + GAP, y: under, w: NUM, h: BTN },
    // The driver's line, the same clear air under the carters' as theirs is
    // under the headcount. `lift.y` is where the body would stand on foot;
    // the truck lifts it `SEAT`, so the count sits halfway down the pair. A
    // cell left of the other badges, so the stack out the truck's back ends
    // where their bodies do and the counts stay one column.
    lift: { x: left + BTN + GAP - P, y: under + WORKER / 2 + P * 3 + SEAT, w: WORKER, h: WORKER },
    liftNum: { x: left + BTN + GAP + WORKER + GAP, y: under + WORKER + P * 3 + SEAT / 2,
               w: NUM, h: BTN },
    // The machine's mark, on the roster: "is this station worked by hands or
    // by the machine" is the same question the counter above answers about
    // *how many* hands.
    run: runBox(p, left, y)
  };
}

export const posts = () => POSTS.filter(p => p.show());

// --- the kit stand ------------------------------------------------------------
// A hat belongs to the station, so a hat nobody is wearing waits at it: one
// stand, one hat and a number, the way every other count in the yard is
// written. What each trade wears is its own shape.
export { KIT_MARK } from './kit.js';

export function kitStands() {
  const out = [];
  for (const p of POSTS) {
    if (!p.kit || !p.show()) continue;
    const n = spareKit(p.job);
    if (n < 1) continue;
    const x = Math.round(kitX(p.job) / P) * P;
    out.push({ job: p.job, mark: KIT_MARK[p.job], n, x, y: Math.round(groundAt(x) / P) * P });
  }
  // The engines wait on a second trestle beside the carts', one stand's width
  // over, so the two counts never sit on one another.
  const lifts = spareLifts();
  if (lifts >= 1) {
    const x = Math.round(liftX() / P) * P;
    out.push({ job: JOB.HAUL, mark: LIFT.mark, n: lifts, x, y: Math.round(groundAt(x) / P) * P });
  }
  return out;
}

const inside = (b, x, y) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;

// What a button is to *hit*, as against what it is to look at: the mark is a
// hairline bar, so the target is grown well past it and the cursor turns over
// exactly this much. A cell out to the sides, because sideways it may not
// reach the count between the two buttons, which must not become one; two up
// and down, where there is nothing but bare ground.
const HIT_X = P, HIT_Y = P * 2;
const hit = b => ({ x: b.x - HIT_X, y: b.y - HIT_Y,
                    w: b.w + HIT_X * 2, h: b.h + HIT_Y * 2 });

// The yard is one canvas, so nothing in it carries a cursor of its own;
// somebody has to ask every time the mouse moves.
export const overRoster = (x, y) => posts().some(p => {
  if (p.fixed) return false;
  const b = boxes(p);
  return inside(hit(b.less), x, y) || inside(hit(b.more), x, y);
});

// A click on a roster, in world units: true if it was one, so the yard knows
// not to treat it as a swing at the ground.
export function rosterHit(x, y) {
  for (const p of posts()) {
    if (p.fixed) continue;
    const b = boxes(p);
    // a near miss on either button still counts as that button rather than as a
    // swing at the ground: they are small, and the ground behind them does
    // something else entirely
    if (inside(hit(b.less), x, y)) { assign(p.job, -1); S.shopStale = true; return true; }
    if (inside(hit(b.more), x, y)) { assign(p.job, 1); S.shopStale = true; return true; }
    if (inside(b.badge, x, y) || inside(b.num, x, y)) return true;   // the count is not a button
    // The machine's mark is not a button either (a machine is stopped by
    // taking its tender off, the `-` two rows up), but a click there is not a
    // swing at the ground.
    if (machineAt(p.job) && inside(hit(b.run), x, y)) return true;
  }
  return false;
}

// --- drawing -----------------------------------------------------------------
// The badge and the buttons are world pixels on the cell grid. The count is
// the one thing drawn in screen pixels: it is type, and type scaled by five
// sixths has a fuzzy edge.

export function drawRoster(ctx, drawBody, drawHat, drawCart, drawRun, drawLift) {
  const spare = idle();
  for (const p of posts()) {
    const b = boxes(p);
    const n = S[p.job];

    // Only on the stations that have a machine standing.
    if (machineAt(p.job) && drawRun) drawRun(b.run, JOB_MACHINE[p.job]);

    drawBody(b.badge.x, b.badge.y);
    // Where the hat *is* the job (the sky, and a job with kit but no bought
    // trade, like the janitor) the badge wears it and there is no second
    // line: a count of hats under a count of wizards is the same number
    // written twice. Everywhere else a hat is a doubling on top of a body
    // that works fine bare-headed, and the two lines are two facts.
    if (p.job === JOB.WIZARD || (KIT_MARK[p.job] && !TRADE_OF[p.job])) {
      drawHat(b.badge.x, b.badge.y, KIT_MARK[p.job], true);
      if (p.fixed) continue;
      button(ctx, b.less, '-', n > 0);
      button(ctx, b.more, '+', spare > 0 && roomAt(p.job) > 0);
      continue;
    }

    // How many have the trade, drawn as the trade looks out in the yard.
    if (hats(p.job) > 0) {
      drawBody(b.trade.x, b.trade.y);
      // A carter is a body *with* a cart. It trails to the left, into the slot
      // the minus button would be in: carrying has no buttons, so the room is
      // there.
      if (p.job === JOB.HAUL) drawCart(b.trade.x, b.trade.y, 1);
      else drawHat(b.trade.x, b.trade.y, KIT_MARK[p.job], true);
    }
    // Facing left, like the cart trails left: the forks go into the empty
    // minus slot and the stack stays clear of the count.
    if (liftLine(p) && drawLift) {
      drawLift(b.lift.x, b.lift.y, -1);
      drawBody(b.lift.x, b.lift.y - SEAT);
    }

    if (p.fixed) continue;                       // carrying is read, not set
    // The hat belongs to the station, so the minus is live whenever there is
    // anybody there to take off.
    button(ctx, b.less, '-', n > 0);
    // Pale when there is nobody spare to send or nowhere left to put one: the
    // way to send a fourth body down the quarry is to buy it a bench.
    button(ctx, b.more, '+', spare > 0 && roomAt(p.job) > 0);
  }
}

// A button is the mark itself: a bar, and a plus is that bar with an upright.
// No box: the yard has no windows, panels or frames anywhere else. Pale when
// it would do nothing, rather than hidden: a control that comes and goes is a
// control you have to hunt for.
const BAR = P * 3;                 // the arm of a plus, and the whole of a minus
// A hairline, not a cell: a mark a cell thick sits in the picture with the
// weight of a thing you could pick up. This is a line, like the ground line.
const THIN = 2;

// A dead button is dotted (every other cell of the bar) rather than grey: the
// yard is black and white.
function button(ctx, b, kind, live) {
  ctx.fillStyle = '#000';
  const x = b.x + b.w / 2, y = b.y + b.h / 2;
  if (live) ctx.fillRect(x - BAR / 2, y - THIN / 2, BAR, THIN);
  else for (let i = 0; i < BAR; i += P * 2) ctx.fillRect(x - BAR / 2 + i, y - THIN / 2, P, THIN);
  if (kind === '+') {
    if (live) ctx.fillRect(x - THIN / 2, y - BAR / 2, THIN, BAR);
    else for (let i = 0; i < BAR; i += P * 2) ctx.fillRect(x - THIN / 2, y - BAR / 2 + i, THIN, P);
  }
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
    ctx.fillText(String(Math.round(shown('roster:' + p.job, S[p.job]))), Math.round(at.x), Math.round(at.y));
    // What the station owns, not what is being worn: the number says what is
    // waiting there for the next body you send. No second line where the
    // badge already wears the hat (see `drawRoster`).
    if (p.job !== JOB.WIZARD && TRADE_OF[p.job] && hats(p.job) > 0) {
      const t = screenAt(b.tradeNum.x + b.tradeNum.w / 2, b.tradeNum.y);
      ctx.fillText(String(Math.round(shown('hats:' + p.job, hats(p.job)))), Math.round(t.x), Math.round(t.y));
    }
    if (liftLine(p)) {
      const t = screenAt(b.liftNum.x + b.liftNum.w / 2, b.liftNum.y);
      ctx.fillText(String(Math.round(shown('lifts:' + p.job, liftsOf()))), Math.round(t.x), Math.round(t.y));
    }

  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// Whether this station has a machine standing at it. Whether it is *working*
// is whether anybody is standing at it, which is the count on the roster.
export const machineAt = job => {
  const key = JOB_MACHINE[job];
  const m = key && machine(key);
  return !!(m && m.bought);
};

// what the roster is showing and where its buttons are, for the checks
export function rosterReport() {
  return posts().map(p => {
    const b = boxes(p);
    const H = hit(b.less);
    return { key: p.key, job: p.job, n: S[p.job], hats: hats(p.job), worn: worn(p.job),
             spareKit: spareKit(p.job), fixed: !!p.fixed, hitW: H.w, hitH: H.h,
             room: Math.min(99, roomAt(p.job)),
             // What the station holds now (1 while a machine runs) and what it
             // would hold by hand; without both a check cannot tell a capped
             // station from a small one.
             cap: capOf(p.job) === Infinity ? null : capOf(p.job),
             // Whether it is *working* is `n`, two fields up.
             machine: machineAt(p.job),
             run: (b => [b.run.x + b.run.w / 2, b.run.y + b.run.h / 2])(boxes(p)),
             hands: (n => n === Infinity ? null : n)(handsOf(p.job)),
             // Only where a trade line is actually drawn.
             trade: TRADE_OF[p.job] && hats(p.job) > 0
               ? [b.trade.x + b.trade.w / 2, b.trade.y + b.trade.h / 2] : null,
             lifts: liftLine(p) ? liftsOf() : null,
             mark: KIT_MARK[p.job],
             less: [b.less.x + b.less.w / 2, b.less.y + b.less.h / 2],
             more: [b.more.x + b.more.w / 2, b.more.y + b.more.h / 2] };
  });
}
