// Who is working where, written under the place they work.
//
// The crew used to be moved about from rows on the bench, which put the whole
// workforce in one list a walk away from any of it: to see that the plots were
// standing empty you had to remember what the number beside "at the plots" was
// last time you opened the board. So the count lives under its station now. A
// glance along the yard says where everybody is, and the two buttons that move
// them are in the same place as the thing they move them to.
//
// Carrying is the exception, and it has no buttons: you never put a body *on*
// carrying dust, it is what a body does when it is on nothing. Its count is
// there to be read, so that the spare hands are a number somewhere rather than
// a sum you do in your head.

import { P, WORKER } from './config.js';
import { S, quarry, farm, lab, apothecary, scrub, sky, outhouse, school } from './state.js';
import { groundAt, kitX } from './world.js';
import { doorAt } from './house.js';
import { JOB_MACHINE, machine } from './machines.js';
import { assign, idle, hats, worn, spareKit, roomAt, capOf, handsOf } from './upgrades.js';
import { KIT_MARK } from './kit.js';
import { JOB } from './jobs.js';


// [ - ] badge count [ + ] -- the buttons at the ends, where they are easiest to
// hit and hardest to mix up with each other.
const BTN = P * 4;                 // a button is this square
const GAP = P;                     // and this far from what it sits beside
const NUM = P * 4;                 // room kept for the count, two digits wide
const WIDE = BTN + GAP + WORKER + GAP + NUM + GAP + BTN;

// Each station and the job it stands for, in yard order, left to right, so the
// roster reads the way the world does.
//
// The lab and the scrubbing house are on it again. They were taken off on the
// grounds that each holds one body and has one thing to do with it, so the
// counter had a single useful setting -- true, and beside the point. What you
// are actually deciding is whether that station is *running at all*, which is
// worth a control however few settings it has, and the yard deciding it for you
// means a pair of hands can be taken off the rock by a building without you
// having said so.
//
// And once somebody is put in, they stay in. See `stepLab`: the lab used to turn
// its own people out after a while with nothing to do, which is the same thing
// wearing a friendlier coat.
export const POSTS = [
  { key: 'scrubjob', job: JOB.PURIFY,
    at: () => scrub.x + scrub.w / 2, show: () => S.scrubOpen },
  { key: 'labjob', job: JOB.SCHOLAR,
    at: () => lab.x + lab.w / 2, show: () => S.labOpen },
  // One body to a pot, stood under the apothecary it stirs.
  { key: 'stirjob', job: JOB.STIR,
    at: () => apothecary.x + apothecary.w / 2, show: () => S.apothecaryOpen },
  // One teacher, through the school's door, or the trades on its board stall.
  // (wave6-sim, item 1)
  { key: 'teachjob', job: JOB.TEACH,
    at: () => school.x + school.w / 2, show: () => S.schoolOpen },
  // The shed does not clean anything. What it buys is somebody whose job the
  // mess is -- see `capOf` -- so the post stands under it.
  { key: 'loojob', job: JOB.JANITOR,
    at: () => outhouse.x + outhouse.w / 2, show: () => S.outhouseOpen, kit: true },
  { key: 'farmjob', job: JOB.FARM,
    at: () => farm.x + farm.w / 2, show: () => S.farmOpen, kit: true },
  { key: 'quarryjob', job: JOB.QUARRY,
    at: () => quarry.x + quarry.w / 2, show: () => S.quarryOpen,
    // the quarry is a hole: a roster under the ground line there would be a
    // roster down the shaft, so it stands clear of the floor of it
    // The quarry is a hole, so its roster used to stand below the floor of it --
    // which walked off the bottom of the world as soon as the quarry was taken
    // down a bench or two, taking the counter with it. It stands *over* the
    // mouth instead: the one station whose own ground is not somewhere a
    // roster can go, so it goes in the sky above it.
    // High enough to clear the machine. The rig stands on the bridge deck, four
    // cells up, and is seven more on top of that with a body standing on its
    // roof above even that -- so the old thirteen cells put the headcount badge
    // level with the operator's head, two white squares in a column, and you
    // could not tell which of them was the man.
    above: () => P * 18,
    // ...and the machine's mark does not go up there with it. A count in the sky
    // is only a number and can hang anywhere; the mark is a *picture of the jaw*,
    // and hung under that count it landed in the middle of the jaw and the hoist
    // -- a small drawing of the machine on top of the machine, which is the one
    // place it cannot be read.
    //
    // This outlived the reason it was written for. It was put here when the mark
    // was a switch and the argument was that you walk up to a switch; the switch
    // is gone and the placement is still right, because what was actually wrong
    // was never the walking. It was two pictures of the same object in the same
    // few cells.
    //
    // There is ordinary ground a few cells past the lip, so it stands on it.
    // Off the quarry's own right edge, so it follows the hole when the hole is
    // resited, and clear of the rim by the width of the strip itself.
    runAt: () => quarry.x + quarry.w + WIDE / 2 + P * 3,
    kit: true },
  // The sky. Its roster stands on the ground under the meteor -- the work is a
  // long way over it, but the buttons belong where the body walks to, and a
  // count hanging in the air beside the thing it is about would be the one
  // roster in the yard nobody could stand next to.
  { key: 'skyjob', job: JOB.WIZARD,
    at: () => sky.x, show: () => S.meteorOpen, kit: true },
  { key: 'mine', job: JOB.ROCK,
    at: () => S.cx, show: () => S.crew > 0, kit: true },
  // The haulers stand under the houses. Every other post is written under the
  // place its work is done, and carrying has no such place -- the dust is
  // wherever it fell, and the lip is only where the trip ends. What this number
  // actually counts is the bodies that are not on anything, so it belongs where
  // the bodies come from. It used to sit out by the lip, which put a count with
  // no buttons on it in the emptiest corner of the yard, reading as a stray
  // control rather than as a fact about the crew.
  { key: 'carry', job: JOB.HAUL,
    at: () => doorAt().x, show: () => S.crew > 0, fixed: true, kit: true }
];

// Where a post's roster stands, in world units. Well below the ground line: the
// bar over a station that has stopped is already just under it, and two marks
// in one place are two marks nobody reads.
export function postAt(p) {
  const y = p.above ? S.groundY - p.above()
                    : S.groundY + (p.below ? p.below() : P * 14);
  return { x: Math.round(p.at() / P) * P, y: Math.round(y / P) * P };
}

// The boxes of one roster, left to right, in world units -- and under them a
// second line for the tradesmen, which is drawn only when there are any.
//
// It sits under the headcount rather than beside it because it is a *part* of
// that number, not another number: of the four on the rock, two are breakers.
// Beside it, the two read as separate crews.
// Where the machine's mark stands. Under the count, at the bottom of the strip,
// on every post that keeps its roster on the ground -- and at the post's own
// `runAt`, down at the ordinary roster depth, on one that does not.
//
// Written here rather than as a second case in the quarry, because "the mark
// goes under the count unless the count is not somewhere a mark can go" is a
// rule about rosters, and a rule about rosters lives with the rest of them.
function runBox(p, left, y) {
  const h = BTN;
  if (p.runAt) {
    const x = Math.round(p.runAt() / P) * P;
    return { x: Math.round((x - WIDE / 2) / P) * P,
             y: Math.round((S.groundY + P * 14) / P) * P, w: WIDE, h };
  }
  return { x: left, y: y + WORKER + P * 2 + (p.kit ? WORKER + P * 2 : 0), w: WIDE, h };
}

function boxes(p) {
  const { x, y } = postAt(p);
  const left = x - WIDE / 2;
  // a cell of air more than the gap elsewhere, because the hat stands a cell
  // proud of the square it is on and would otherwise touch the badge above it
  const under = y + WORKER + P * 2;
  return {
    less: { x: left, y: y - BTN / 2, w: BTN, h: BTN },
    badge: { x: left + BTN + GAP, y: y - WORKER / 2, w: WORKER, h: WORKER },
    num: { x: left + BTN + GAP + WORKER + GAP, y, w: NUM, h: BTN },
    more: { x: left + WIDE - BTN, y: y - BTN / 2, w: BTN, h: BTN },
    trade: { x: left + BTN + GAP, y: under - WORKER / 2, w: WORKER, h: WORKER },
    tradeNum: { x: left + BTN + GAP + WORKER + GAP, y: under, w: NUM, h: BTN },
    // The machine's switch, on the roster under the headcount.
    //
    // It was a lever standing in the yard, and two things were wrong with that.
    // No works has a lever bolted to the ground beside the machine it drives --
    // and drawn small enough to sit in a pixel yard it read as a fencepost, one
    // more black shape among the hundred that do nothing. The question it asks
    // is "is this station worked by hands or by the machine", which is the same
    // question the counter above it answers about *how many* hands, so it
    // belongs there: one strip per station, saying who is doing the work.
    //
    // Unless the post has said otherwise, which one of them has: a roster driven
    // up into the sky by a hole in the ground takes its counts with it, and
    // leaves its switch on ground somebody can stand on. See `runAt`.
    run: runBox(p, left, y)
  };
}

export const posts = () => POSTS.filter(p => p.show());

// --- the kit stand ------------------------------------------------------------
// A hat belongs to the station, so a hat nobody is wearing is a hat waiting at
// it. That is the whole of the rule made visible: take everybody off the rock
// and the helmets stay there, and a body sent over walks to this spot, picks one
// up and puts it on before it does a stroke of work.
//
// It is one stand with one hat on it and a number over it, not a row of hats on
// the ground. A row was honest and unreadable: six carts along the lip is a
// fence, thirty is a wall, and the count -- the thing you actually want off a
// glance -- had to be got by counting them. One of the thing, and a figure, is
// how every other count in this yard is written.
//
// What each trade wears is its own shape, so the stand at the plots and the stand
// at the quarry are different things standing there rather than the same grey lump
// in two places.
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
  return out;
}

const inside = (b, x, y) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;

// What a button is to *hit*, as against what it is to look at.
//
// The mark is a bar three cells long and a hairline thick, on purpose: a box
// round it reads as a dialog that has wandered into a yard with no windows,
// panels or frames anywhere else in it. What that costs is the edge that told
// you where to aim -- so the target is grown instead, well past the mark and
// past the slot it sits in, and the cursor turns over exactly this much of it.
// You aim at the bar and you hit a good deal more than the bar.
//
// A cell out to the sides and two up and down: sideways it may not reach the
// count between the two buttons, which is not a button and must not become one;
// vertically there is nothing there but bare ground to be generous with.
const HIT_X = P, HIT_Y = P * 2;
const hit = b => ({ x: b.x - HIT_X, y: b.y - HIT_Y,
                    w: b.w + HIT_X * 2, h: b.h + HIT_Y * 2 });

// Whether the cursor is over a button, without pressing it. The yard is drawn on
// one canvas, so nothing in it can carry a cursor of its own the way a DOM
// button does -- somebody has to ask, every time the mouse moves.
export const overRoster = (x, y) => posts().some(p => {
  if (p.fixed) return false;
  const b = boxes(p);
  return inside(hit(b.less), x, y) || inside(hit(b.more), x, y);
});

// A click on a roster, in world units: true if it was one, so the yard knows not
// to treat it as a swing at the ground. The buttons are only live when they
// would do something -- there is no body to take off an empty post, and none to
// put on one when every hand is already spoken for.
export function rosterHit(x, y) {
  for (const p of posts()) {
    if (p.fixed) continue;
    const b = boxes(p);
    // a near miss on either button still counts as that button rather than as a
    // swing at the ground: they are small, and the ground behind them does
    // something else entirely
    if (inside(hit(b.less), x, y)) { assign(p.job, -1); return true; }
    if (inside(hit(b.more), x, y)) { assign(p.job, 1); return true; }
    if (inside(b.badge, x, y) || inside(b.num, x, y)) return true;   // the count is not a button
    // The machine's mark is not a button either. It used to be a switch; there
    // is no switch now -- a machine is stopped by taking its tender off, which
    // is the `-` button two rows up. Swallowing the click anyway, because the
    // mark is drawn under a station and a click there is not a swing at the
    // ground.
    if (machineAt(p.job) && inside(hit(b.run), x, y)) return true;
  }
  return false;
}

// --- drawing -----------------------------------------------------------------
// The badge and the buttons are world pixels on the cell grid, so they stay as
// crisp as everything else. The count is the one thing drawn in screen pixels:
// it is type, and type scaled by five sixths is type with a fuzzy edge.

export function drawRoster(ctx, drawBody, drawHat, drawCart, drawRun) {
  const spare = idle();
  for (const p of posts()) {
    const b = boxes(p);
    const n = S[p.job];

    // Who is working this station: the hands or the machine. Only on the
    // stations that have one standing, which is none of them for most of a run.
    // What is working this station, when it is not hands. Only on the stations
    // that have a machine standing, which is none of them for most of a run.
    if (machineAt(p.job) && drawRun) drawRun(b.run, JOB_MACHINE[p.job]);

    drawBody(b.badge.x, b.badge.y);
    // The counter is a bare body, and that is every post but the sky now. It
    // used to have a second case: a hat nobody bought was worn by the badge
    // unconditionally, because the janitor's cap was worn unconditionally out in
    // the yard. The cap hangs on a stand outside the outhouse like every other hat
    // in this yard, so the janitor's roster is the ordinary two lines -- so many
    // bodies, so many caps -- and the line that made an exception of it is gone
    // along with the exception.
    // The sky is the one post where the hat *is* the job: there is no such thing
    // as a wizard without one, so the body at the top of its roster wears it and
    // the plain square underneath -- a body that could not be up there at all --
    // is not drawn. Everywhere else a hat is a doubling on top of a body that
    // works fine bare-headed, and the two lines are two different facts.
    // One figure and one number. The hat *is* the job up there, so the body wears
    // it -- and there is no second line, because a count of hats under a count of
    // wizards is the same number written twice with a spare hat drawn beside it.
    // What is waiting on the stand is already said at the stand, at the foot of
    // the tower, where somebody would go to pick one up.
    if (p.job === JOB.WIZARD) {
      drawHat(b.badge.x, b.badge.y, KIT_MARK[p.job], true);
      if (p.fixed) continue;
      button(ctx, b.less, '-', n > 0);
      button(ctx, b.more, '+', spare > 0 && roomAt(p.job) > 0);
      continue;
    }

    // And how many of them have the trade, drawn as whatever that trade looks
    // like out in the yard, so the line under the count and the bodies walking
    // about are obviously the same fact. Three of the four wear a hat; a carter
    // drags a cart, and the cart is the thing you see, so the cart is the mark.
    if (hats(p.job) > 0) {
      drawBody(b.trade.x, b.trade.y);
      // A carter is a body *with* a cart -- a cart on its own is a cart nobody
      // is pulling. It trails to the left, exactly as it does in the yard, into
      // the slot the minus button would be in: carrying is the one post that has
      // no buttons, because you never put a body *on* it, so the room is there.
      if (p.job === JOB.HAUL) drawCart(b.trade.x, b.trade.y, 1);
      else drawHat(b.trade.x, b.trade.y, KIT_MARK[p.job], true);
    }

    if (p.fixed) continue;                       // carrying is read, not set
    // Nobody is ever stuck at a post now: the hat belongs to the station, so the
    // minus button is live whenever there is anybody there to take off.
    button(ctx, b.less, '-', n > 0);
    // and pale on the other side either when there is nobody spare to send or
    // when the place has nowhere left to put one: a cut holds one body a bench
    // and a plot one a plot, so the way to send a fourth body down the quarry is
    // to go and buy it a bench.
    button(ctx, b.more, '+', spare > 0 && roomAt(p.job) > 0);
  }
}

// A button is the mark itself: a bar, and a plus is that bar with an upright.
// They were boxed at first, and a box is a lie about what this is -- the yard
// has no windows, panels or frames anywhere else in it, and two bordered squares
// under every station read as a dialog that had wandered into the picture. The
// mark alone is the same thing to click and one less thing to look at. What it
// loses is the edge that said where to aim -- and what makes up for that is a
// target grown well past it, and a cursor that turns over the whole of it.
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
    // What the station owns, not what is being worn: a rock with four helmets
    // and one body on it still has four helmets, and the point of the number is
    // that it tells you what is waiting there for the next body you send.
    //
    // and the sky has no second line at all: see `drawRoster`.
    if (p.job !== JOB.WIZARD && hats(p.job) > 0) {
      const t = screenAt(b.tradeNum.x + b.tradeNum.w / 2, b.tradeNum.y);
      ctx.fillText(String(hats(p.job)), Math.round(t.x), Math.round(t.y));
    }

  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// what the roster is showing and where its buttons are, for the checks
// Whether this station has a machine standing at it.
//
// It used to answer three things -- no machine, machine off, machine on -- for a
// switch that no longer exists. A machine is bought or it is not; whether it is
// *working* is whether anybody is standing at it, which is the count two rows
// up and is already on the roster in the ordinary way.
export const machineAt = job => {
  const key = JOB_MACHINE[job];
  const m = key && machine(key);
  return !!(m && m.bought);
};

export function rosterReport() {
  return posts().map(p => {
    const b = boxes(p);
    const H = hit(b.less);
    return { key: p.key, job: p.job, n: S[p.job], hats: hats(p.job), worn: worn(p.job),
             spareKit: spareKit(p.job), fixed: !!p.fixed, hitW: H.w, hitH: H.h,
             room: Math.min(99, roomAt(p.job)),
             // What the station holds now -- 1 while a machine runs -- and what
             // it would hold by hand. Without both, a check cannot tell a capped
             // station from a small one.
             cap: capOf(p.job) === Infinity ? null : capOf(p.job),
             // Whether a machine stands here. Whether it is *working* is not a
             // second fact: it is `n`, two fields up.
             machine: machineAt(p.job),
             run: (b => [b.run.x + b.run.w / 2, b.run.y + b.run.h / 2])(boxes(p)),
             hands: (n => n === Infinity ? null : n)(handsOf(p.job)),
             trade: hats(p.job) > 0 ? [b.trade.x + b.trade.w / 2, b.trade.y + b.trade.h / 2] : null,
             mark: KIT_MARK[p.job],
             less: [b.less.x + b.less.w / 2, b.less.y + b.less.h / 2],
             more: [b.more.x + b.more.w / 2, b.more.y + b.more.h / 2] };
  });
}
