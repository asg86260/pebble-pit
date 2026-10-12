// Who is working where, written under the place they work, with the two
// buttons that move them in the same place. Carrying is the exception and has
// no buttons: you never put a body *on* carrying, it is what a body does when
// it is on nothing. Its count is there to be read.

import { P, WORKER, LIFT_SEAT as SEAT, DEEP_POST_DOWN, SEAT_PIP, SEAT_GAP, SEAT_PIP_SMALL, SEAT_GAP_SMALL,
         SEAT_SHRINK, SEAT_ROW, SEAT_EMPTY_INK, SEAT_LEAVE_MS, SEAT_SEP, SEAT_RULE } from './config.js';
import { deepFloor, deepTop } from './deep/place.js';
import { STATIONS } from './stations.js';
import { S, quarry } from './state.js';
import { groundAt, kitX } from './world.js';
import { houseRect } from './house.js';
import { siteBox } from './works.js';
import { JOB_MACHINE, running } from './machines.js';
import { assign, idle } from './staffing.js';
import { hats, worn, spareKit, roomAt, capOf, handsOf } from './levels.js';
import { KIT_MARK, TRADE_OF, liftsOf } from './kit.js';
import { JOB, DEEP_JOBS, TYPE, TYPE_OF } from './jobs.js';
import { stationsBuilt, stationById, stationMid, canMoveIn, canMoveOut, moveFighter } from './deep/party.js';
import { shown, onSnap } from './tween.js';
import { darkPage } from './ink.js';
import { now } from './clock.js';
import { reducedMotion } from './prefs.js';


// [ - ] badge count [ + ] -- the buttons at the ends, where they are easiest to
// hit and hardest to mix up with each other.
const BTN = P * 4;                 // a button is this square
const GAP = P;                     // and this far from what it sits beside
const NUM = P * 4;                 // room kept for the count, two digits wide
const WIDE = BTN + GAP + WORKER + GAP + NUM + GAP + BTN;

// Each station and the job it stands for, in yard order, left to right.
//
// A roster stands centered under its station's building: the box `siteBox`
// answers for the site, which is the shed, the hut or the shack the board
// opens at and the bar hangs over, not the station's whole ground. One rule,
// and the posts are the station rows' own (`post` in stations.js), so a
// station added later has its roster by saying which job stands there. A post
// in the deep stands a band under the deep's floor; one in the yard, below
// the ground line. Nothing stands over a hole: a post that would reach the
// quarry's mouth is held clear of it, the strip being three times as wide as
// the shed.
//
// The lab and the air filter hold one body each, and still have a
// counter: what you are deciding is whether that station is *running at all*,
// and the yard deciding it for you means a pair of hands taken off the rock
// by a building without you having said so.
const clearOfHoles = (x, wide) => (S.quarryOpen && x + wide / 2 + P > quarry.x && x - wide / 2 < quarry.x + quarry.w
  ? Math.min(x, quarry.x - wide / 2 - P) : x);
function postOf(row) {
  const p = row.post;
  const box = () => siteBox(row.key) || row.stand();
  const mid = () => { const b = box(); return b.x + b.w / 2; };
  const deep = () => { const b = row.stand(); return !!b && b.y > deepTop(); };
  const post = {
    key: p.key, job: p.job, kit: !!p.kit, fixed: !!p.fixed,
    show: p.show || (() => row.open()),
    // Held clear by its own width: a row of pips is as wide as its seats.
    at: () => clearOfHoles(p.at?.() ?? mid(), widthOf(post)),
    y: () => (deep() ? deepFloor() + DEEP_POST_DOWN : null),
    get deep() { return deep(); }
  };
  return post;
}
let POSTS = null;
// The yard's posts are the station rows'; a row whose job is the deep's is
// not one of them, since the deep's stations are the player's and stand
// where they were put down.
const yardPosts = () => (POSTS ||= STATIONS.filter(r => r.post && r.post.job && !DEEP_JOBS.includes(r.post.job))
                                          .map(postOf));

// The deep's: one post under each station standing, keyed by its id. A
// station holds one fighter, so the count is nought or one, and the two
// buttons move a fighter between stations (`moveFighter`) rather than
// making or unmaking one.
const partyPost = st => ({
  key: `station:${st.id}`, job: JOB.FIGHT, station: st.id, kit: false, fixed: false, deep: true,
  show: () => true,
  at: () => stationMid(st),
  y: () => deepFloor() + DEEP_POST_DOWN
});
const allPosts = () => [...yardPosts(), ...stationsBuilt().map(partyPost)];

// How many stand at a post, and whether each of its buttons would do anything.
const count = p => (p.station ? (stationById(p.station)?.fighter ? 1 : 0) : S[p.job]);
const canLess = (p, n) => (p.station ? canMoveOut(p.station) : n > 0);
const canMore = (p, spare) => (p.station ? canMoveIn(p.station) : spare > 0 && roomAt(p.job) > 0);
const press = (p, d) => (p.station ? moveFighter(p.station, d) : assign(p.job, d));

// --- the seats ----------------------------------------------------------------
// A station with a floor plan is counted in seats: a pip a place to stand,
// black where a body is at work, grey and hollow where nobody is. The rock
// has no plan and carrying is not a place, so those two keep the badge and
// the number. A save from before a cap can stand more than the plan holds,
// and every one of them still gets a pip.
const seatsOf = p => {
  if (p.fixed) return 0;
  const cap = p.station ? 1 : capOf(p.job);
  return Number.isFinite(cap) && cap >= 1 ? Math.max(cap, count(p)) : 0;
};

function rowOf(n) {
  const small = n > SEAT_SHRINK;
  const pip = small ? SEAT_PIP_SMALL : SEAT_PIP, gap = small ? SEAT_GAP_SMALL : SEAT_GAP;
  const per = small ? Math.min(SEAT_ROW, n) : n;
  return { small, pip, gap, per, rows: Math.ceil(n / per), w: per * (pip + gap) - gap };
}
const widthOf = p => { const n = seatsOf(p); return n ? BTN + GAP + rowOf(n).w + GAP + BTN : WIDE; };

// Who is at this post, as bodies: the count says who is assigned, and only a
// body can say whether it has got there.
const bodiesOf = p => (p.station
  ? S.workers.filter(w => w.type === TYPE.FIGHTER && w.station === p.station)
  : S.workers.filter(w => w.type === TYPE_OF[p.job]));

// On its way: a commute whose last leg is the work (crew/commute.js), the
// hat fetched first included. A hat errand ends on 'back', not 'work': that
// body never left the job, so its seat stays full.
const comingTo = w => (w.walking && w.leg === 'work') || !!w.legs?.some(l => l.do === 'work');

// What is left of the walk, along the ground: this leg and every leg after it.
function still(w) {
  let at = w.walkTo ?? w.x, d = Math.abs(w.x - at);
  for (const l of w.legs || []) { d += Math.abs(l.to - at); at = l.to; }
  return d;
}

// How far each walker had to go when it was first seen setting out, so its
// pip fills by the share of the walk behind it. A fact about the screen, not
// the yard (like tween.js's runs): nothing saves it.
const setOut = new Map();
function walked(w) {
  const left = still(w);
  let r = setOut.get(w.uid);
  if (!r || r.type !== w.type) setOut.set(w.uid, r = { type: w.type, d: left });
  return r.d > 0 ? Math.max(0, Math.min(1, 1 - left / r.d)) : 0;
}

// A body sent off is a hauler on the frame it is sent and walks to nothing,
// so its pip empties on a clock instead. Remembered per post: the count it
// had last read, and when each one that has gone since set off.
const leftAt = new Map();
onSnap(() => { leftAt.clear(); setOut.clear(); });
function leaving(p, on) {
  const key = p.station || p.job, t = now();
  let m = leftAt.get(key);
  if (!m) leftAt.set(key, m = { n: on, out: [] });
  if (on < m.n && !reducedMotion()) for (let i = on; i < m.n; i++) m.out.push(t);
  if (on > m.n) m.out.splice(0, on - m.n);
  m.n = on;
  m.out = m.out.filter(t0 => t - t0 < SEAT_LEAVE_MS);
  return m.out.map(t0 => 2 - Math.min(2, Math.floor((t - t0) / SEAT_LEAVE_MS * 3)));
}

// Held thirds, never a slide: nought is an outline (somebody is on the way),
// two is two thirds; a full pip is only ever a body that has arrived.
const thirds = f => Math.min(2, Math.floor(f * 3));

// How many of the bodies at work wear the post's hat. Pure, so the boxes can
// ask it every frame without disturbing the walkers' clocks the way
// `seatsAt` does.
// A walker bound for the hat: on its way to the stand to take one, or already
// wearing it on the way to the work. Its pip is a specialist's from the start.
const wearsOn = (w, p) => !!p.kit && (w.wanting === p.job || (w.trained && w.kitOf === p.job));

function hatsAtWork(p) {
  let n = 0;
  for (const w of bodiesOf(p)) if (!comingTo(w) && w.trained && w.kitOf === p.job) n++;
  return Math.min(n, count(p));
}

// One post's seats, pip by pip from the left: who is at work (the hatted
// first), who is walking over, the furthest along first, who has just gone,
// and the rest empty.
export function seatsAt(p) {
  const seats = seatsOf(p);
  if (!seats) return null;
  const on = count(p);
  let here = 0, brims = 0;
  const walking = [], hatBound = [];
  for (const w of bodiesOf(p)) {
    if (comingTo(w)) { (wearsOn(w, p) ? hatBound : walking).push(walked(w)); continue; }
    setOut.delete(w.uid);
    here++;
    if (w.trained && w.kitOf === p.job) brims++;
  }
  const wearers = Math.min(hatBound.length, Math.max(0, on - here));
  const filled = Math.min(on - wearers, here);
  walking.sort((a, b) => b - a);
  hatBound.sort((a, b) => b - a);
  const coming = [];
  for (let i = 0; i < on - wearers - filled; i++) coming.push(thirds(walking[i] ?? 0));
  const wearing = hatBound.slice(0, wearers).map(thirds);
  const gone = leaving(p, on).slice(0, Math.max(0, seats - on));
  const t = topOf(p), nested = Math.min(brims, filled);
  return { seats, on, filled, coming, wearing, leaving: gone, brims: nested,
           plain: filled - nested, regular: seats - t.worn - t.wearing - t.spare };
}

// The seats split in two. The specialist slots are the station's hats, worn
// or spare, capped at its seats: a pip for each hatted body at work and an
// outline for each hat not yet worn (`spareKit`). The regular slots are the
// seats left over, and are the only ones a plain body is ever drawn in. Nothing
// owned means no top row. Together they never outnumber the seats, so the
// strip is as wide as its seats and no wider.
const topOf = p => {
  if (!p.kit || !seatsOf(p)) return { worn: 0, wearing: 0, spare: 0 };
  const worn = hatsAtWork(p);
  let wearing = 0, claimed = 0;
  for (const w of bodiesOf(p)) if (comingTo(w) && wearsOn(w, p)) { wearing++; if (w.wanting === p.job) claimed++; }
  wearing = Math.min(wearing, Math.max(0, count(p) - worn));
  // A hat seat a plain body already stands in is not shown: the seat is
  // taken, and the regular row must hold every plain body at work.
  const plain = Math.max(0, count(p) - worn - wearing);
  return { worn, wearing, spare: Math.max(0, Math.min(spareKit(p.job) - claimed, seatsOf(p) - worn - wearing - plain)) };
};

// Each pip's square, in world units, in seat order: the hatted (top row),
// then the regular seats row by row, then the spare-hat outlines, flagged.
// Every box carries its own gap, so a row shrunk past the limit is hit at its
// own size.
function pipBoxes(p, left, y) {
  const n = seatsOf(p), t = topOf(p);
  const nTop = t.worn + t.wearing + t.spare, nBot = n - nTop;
  const rb = rowOf(nBot || 1), rt = rowOf(nTop || 1);
  const x0 = left + BTN + GAP, strip = rowOf(n).w;
  // A row shows only when it has something in it. Whatever shows is one block
  // (top row, rule, bottom row) centered on the post's line, where the buttons
  // stand, like align-items: center. The block is as tall as it is whenever
  // any hat is owned, so the only reflow is the first hat arriving.
  const hRow = (r, k) => k ? r.rows * (r.pip + r.gap) - r.gap : 0;
  const hTop = hRow(rt, nTop), hBot = hRow(rb, nBot);
  const sep = nTop && nBot ? SEAT_SEP : 0;
  const H = hTop + sep + hBot;
  const y0 = Math.floor((y - H / 2) / P) * P;
  const wide = (r, k) => Math.min(r.per, k) * (r.pip + r.gap) - r.gap;
  const lay = (r, count, yy) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const inRow = Math.min(r.per, count - Math.floor(i / r.per) * r.per);
      const w = inRow * (r.pip + r.gap) - r.gap;
      out.push({ x: x0 + Math.round((strip - w) / 2 / P) * P + (i % r.per) * (r.pip + r.gap),
                 y: yy + Math.floor(i / r.per) * (r.pip + r.gap), w: r.pip, h: r.pip, gap: r.gap });
    }
    return out;
  };
  const top = lay(rt, nTop, y0);
  const seated = t.worn + t.wearing;
  top.forEach((q, i) => { q.spare = i >= seated; q.kind = 'top'; });
  const bottom = lay(rb, nBot, y0 + hTop + sep);
  bottom.forEach(q => { q.kind = 'reg'; });
  const boxes = [...top.slice(0, seated), ...bottom, ...top.slice(seated)];
  if (sep) {
    const w = Math.max(wide(rt, nTop), wide(rb, nBot));
    boxes.rule = { x: x0 + Math.round((strip - w) / 2 / P) * P, y: y0 + hTop + (SEAT_SEP - SEAT_RULE) / 2, w, h: SEAT_RULE };
  }
  boxes.block = { y: y0, h: H };
  return boxes;
}

// What a pip is to hit: grown half a gap to each side, so the row is one
// target with no dead seams. Up and down only half a gap too, since the two
// rows are a gap apart and a taller target would take the other row's click.
const pipHit = b => ({ x: b.x - b.gap / 2, y: b.y - b.gap / 2, w: b.w + b.gap, h: b.h + b.gap });

// A click on a regular seat sets the regular count to that seat, through the
// same press the buttons make, once a body, so every one of them still walks.
// The last plain body's own pip takes that body off: the row reads as a run of
// switches, and pressing the one at the end of the run turns it off. With a
// hat spare the engine sends an added body for the hat first, as for the +.
function setTo(p, want) {
  const was = count(p);
  const d = Math.sign(want - was);
  for (let k = Math.abs(want - was); k > 0; k--) {
    const before = count(p);
    press(p, d);
    if (count(p) === before) break;
  }
}

// Below the ground line, clear of the stopped-station triangle (seven cells
// down and 2.6 tall) that hangs just under it. A post that says its own
// height (the deep's) stands there instead.
export function postAt(p) {
  const y = p.y?.() ?? S.groundY + P * 10;
  return { x: Math.round(p.at() / P) * P, y: Math.round(y / P) * P };
}

// The forklifts have a line of their own under the carters': how many the
// yard owns, drawn as one with nobody aboard.
const liftLine = p => p.job === JOB.HAUL && liftsOf() > 0;

// The machine's mark stands under the count, at the bottom of the strip, below
// the tradesmen's lines when there are any.
function runBox(p, left, y) {
  const h = BTN;
  // A row of pips has no tradesmen's line under it (the brims are the hats),
  // but wraps when the seats run past a row.
  const n = seatsOf(p);
  if (n) {
    const r = rowOf(n);
    return { x: left, y: y + WORKER + P * 3 + (r.rows - 1) * (r.pip + r.gap), w: widthOf(p), h };
  }
  return { x: left, y: y + WORKER + P * 3 + (p.kit ? WORKER + P * 2 : 0) +
                     (liftLine(p) ? WORKER + SEAT + P * 3 : 0), w: WIDE, h };
}

// The boxes of one roster, left to right, in world units, and under them a
// second line for the tradesmen: under rather than beside, because it is a
// *part* of the headcount, not another number.
function boxes(p) {
  const { x, y } = postAt(p);
  const wide = widthOf(p);
  // Back on the grid: an even number of seats is half a cell off center.
  const left = Math.round((x - wide / 2) / P) * P;
  // Two cells of air more than the gap elsewhere: the hat stands a cell proud
  // of its square, and past that a full clear cell keeps the two groups
  // reading as two lines rather than one smudged column.
  const under = y + WORKER + P * 3;
  return {
    less: { x: left, y: y - BTN / 2, w: BTN, h: BTN },
    badge: { x: left + BTN + GAP, y: y - WORKER / 2, w: WORKER, h: WORKER },
    num: { x: left + BTN + GAP + WORKER + GAP, y, w: NUM, h: BTN },
    more: { x: left + wide - BTN, y: y - BTN / 2, w: BTN, h: BTN },
    pips: seatsOf(p) ? pipBoxes(p, left, y) : null,
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

export const posts = () => allPosts().filter(p => p.show());

// --- the kit stand ------------------------------------------------------------
// A hat belongs to the station, so a hat nobody is wearing waits at it: one
// stand, one hat and a number, the way every other count in the yard is
// written. What each trade wears is its own shape.
export { KIT_MARK } from './kit.js';

export function kitStands() {
  const out = [];
  for (const p of allPosts()) {
    if (!p.kit || !p.show()) continue;
    // The tower keeps its spare hats indoors: no stand under it.
    if (p.job === JOB.WIZARD) continue;
    const n = spareKit(p.job);
    if (n < 1) continue;
    const x = Math.round(kitX(p.job) / P) * P;
    out.push({ job: p.job, mark: KIT_MARK[p.job], n, x, y: Math.round(groundAt(x) / P) * P });
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
  return inside(hit(b.less), x, y) || inside(hit(b.more), x, y) || pipAt(p, b, x, y) > 0;
});

// The pip a point is over: { kind, at } where `at` counts from one inside the
// regular row, or null.
function pipAt(p, b, x, y) {
  if (!b.pips) return null;
  const i = b.pips.findIndex(q => inside(pipHit(q), x, y));
  if (i < 0) return null;
  const q = b.pips[i];
  return q.kind === 'reg' ? { kind: 'reg', at: b.pips.filter((r, j) => j <= i && r.kind === 'reg').length }
                          : { kind: q.spare ? 'spare' : 'top' };
}

// A click on a roster, in world units: true if it was one, so the yard knows
// not to treat it as a swing at the ground.
export function rosterHit(x, y) {
  for (const p of posts()) {
    if (p.fixed) continue;
    const b = boxes(p);
    // a near miss on either button still counts as that button rather than as a
    // swing at the ground: they are small, and the ground behind them does
    // something else entirely
    if (inside(hit(b.less), x, y)) { press(p, -1); S.shopStale = true; return true; }
    if (inside(hit(b.more), x, y)) { press(p, 1); S.shopStale = true; return true; }
    const pip = pipAt(p, b, x, y);
    if (pip) {
      // A regular pip sets the regular count: the hatted bodies stand outside
      // it. A spare hat's outline is a worker sent for that hat, the same
      // press as the +. A hatted body's pip is no switch; it is only not a swing.
      if (pip.kind === 'reg') {
        const t = topOf(p), held = t.worn + t.wearing, plain = count(p) - held;
        setTo(p, held + (pip.at === plain ? pip.at - 1 : pip.at));
      } else if (pip.kind === 'spare') press(p, 1);
      S.shopStale = true;
      return true;
    }
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
    const n = count(p);

    // Only on the stations that have a machine standing.
    if (machineAt(p.job) && drawRun) drawRun(b.run, JOB_MACHINE[p.job]);

    if (b.pips) {
      drawPips(ctx, b.pips, seatsAt(p));
      const rl = b.pips.rule;
      if (rl) { ctx.fillStyle = SEAT_EMPTY_INK; ctx.fillRect(rl.x, rl.y, rl.w, rl.h); ctx.fillStyle = '#000'; }
      button(ctx, b.less, '-', canLess(p, n));
      button(ctx, b.more, '+', canMore(p, spare));
      continue;
    }

    drawBody(b.badge.x, b.badge.y);
    // Where the hat *is* the job (the sky, and a job with kit but no bought
    // trade, like the janitor) the badge wears it and there is no second
    // line: a count of hats under a count of wizards is the same number
    // written twice. Everywhere else a hat is a doubling on top of a body
    // that works fine bare-headed, and the two lines are two facts.
    if (p.job === JOB.WIZARD || (KIT_MARK[p.job] && !TRADE_OF[p.job])) {
      drawHat(b.badge.x, b.badge.y, KIT_MARK[p.job], true);
      if (p.fixed) continue;
      button(ctx, b.less, '-', canLess(p, n));
      button(ctx, b.more, '+', canMore(p, spare));
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
    }

    if (p.fixed) continue;                       // carrying is read, not set
    // The hat belongs to the station, so the minus is live whenever there is
    // anybody there to take off.
    button(ctx, b.less, '-', canLess(p, n));
    // Pale when there is nobody spare to send or nowhere left to put one: the
    // way to send a fourth body down the quarry is to buy it a bench.
    button(ctx, b.more, '+', canMore(p, spare));
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

// A pip's outline, as four hairlines: a stroked square straddles the pixel
// edge and comes out as a grey smear at the yard's zoom.
function edge(ctx, b, t) {
  ctx.fillRect(b.x, b.y, b.w, t);
  ctx.fillRect(b.x, b.y + b.h - t, b.w, t);
  ctx.fillRect(b.x, b.y, t, b.h);
  ctx.fillRect(b.x + b.w - t, b.y, t, b.h);
}

// An outline with `k` thirds of it filled from the bottom up.
function part(ctx, b, k, t) {
  ctx.fillStyle = '#000';
  edge(ctx, b, t);
  const h = Math.round(b.h * k / 3);
  if (h) ctx.fillRect(b.x, b.y + b.h - h, b.w, h);
}

function drawPips(ctx, boxes, s) {
  let ti = 0, ri = 0;
  boxes.forEach(b => {
    const small = b.w < SEAT_PIP, t = small ? THIN / 2 : THIN;
    // The hat, as a brim a hairline clear of the head and proud of it either
    // side, with a crown on it; at the small size there is room only for
    // the brim. A spare hat's outline wears it too, in the outline's grey.
    const hat = () => {
      if (small) ctx.fillRect(b.x, b.y - t * 2, b.w, t);
      else {
        ctx.fillRect(b.x - t, b.y - t * 2, b.w + t * 2, t);
        ctx.fillRect(b.x + b.w / 4, b.y - t * 2 - P / 2, b.w / 2, P / 2);
      }
    };
    if (b.spare) { ctx.fillStyle = SEAT_EMPTY_INK; edge(ctx, b, t); hat(); return; }
    // The top row: the hatted at work, then the walkers bound for a hat.
    if (b.kind === 'top') {
      if (ti < s.brims) { ctx.fillStyle = '#000'; ctx.fillRect(b.x, b.y, b.w, b.h); hat(); }
      else { part(ctx, b, s.wearing[ti - s.brims] ?? 0, t); hat(); }
      ti++;
      return;
    }
    // The bottom row: plain bodies at work, then walking over, then leaving.
    const m = ri++, on = s.plain + s.coming.length;
    if (m < s.plain) { ctx.fillStyle = '#000'; ctx.fillRect(b.x, b.y, b.w, b.h); }
    else if (m < on) part(ctx, b, s.coming[m - s.plain], t);
    else if (m < on + s.leaving.length) part(ctx, b, s.leaving[m - on], t);
    else { ctx.fillStyle = SEAT_EMPTY_INK; edge(ctx, b, t); }
  });
  ctx.fillStyle = '#000';
}

// The counts, in screen pixels, after the world has been drawn.
export function drawRosterCounts(ctx, screenAt) {
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'center';                    // it sits in the middle of its own slot
  ctx.textBaseline = 'middle';
  for (const p of posts()) {
    // Drawn over the finished frame: on the light page the deep has been
    // turned over under it, so a deep post's number is written in the
    // paper's white to stand on the black water like the post's own marks.
    ctx.fillStyle = p.deep && !darkPage ? '#fff' : '#000';
    const b = boxes(p);
    // A row of pips is its own count; past a row's worth it is written over
    // them too, seated of seats, since nobody counts sixty dots.
    if (b.pips) {
      if (seatsOf(p) > SEAT_SHRINK) {
        const s = seatsAt(p);
        const top = Math.min(...b.pips.map(q => q.y));
        const lo = Math.min(...b.pips.map(q => q.x)), hi = Math.max(...b.pips.map(q => q.x + q.w));
        const at = screenAt((lo + hi) / 2, top - P * 2);
        ctx.fillText(`${Math.round(shown('seats:' + (p.station || p.job), s.filled))}/${s.seats}`,
                     Math.round(at.x), Math.round(at.y));
      }
      continue;
    }
    const at = screenAt(b.num.x + b.num.w / 2, b.num.y);
    ctx.fillText(String(Math.round(shown('roster:' + (p.station || p.job), count(p)))), Math.round(at.x), Math.round(at.y));
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
  return !!key && running(key);
};

// what the roster is showing and where its buttons are, for the checks
export function rosterReport() {
  return posts().map(p => {
    const b = boxes(p);
    const H = hit(b.less);
    return { key: p.key, job: p.job, station: p.station || null, n: count(p), hats: hats(p.job), worn: worn(p.job),
             spareKit: spareKit(p.job), fixed: !!p.fixed, hitW: H.w, hitH: H.h,
             room: p.station ? 1 - count(p) : Math.min(99, roomAt(p.job)),
             // What the station holds now (1 while a machine runs) and what it
             // would hold by hand; without both a check cannot tell a capped
             // station from a small one.
             cap: p.station ? 1 : capOf(p.job) === Infinity ? null : capOf(p.job),
             // Whether it is *working* is `n`, two fields up.
             machine: machineAt(p.job),
             run: (b => [b.run.x + b.run.w / 2, b.run.y + b.run.h / 2])(boxes(p)),
             hands: (n => n === Infinity ? null : n)(handsOf(p.job)),
             // Only where a trade line is actually drawn.
             trade: !b.pips && TRADE_OF[p.job] && hats(p.job) > 0
               ? [b.trade.x + b.trade.w / 2, b.trade.y + b.trade.h / 2] : null,
             lifts: liftLine(p) ? liftsOf() : null,
             mark: KIT_MARK[p.job],
             // The seats, where a post has them: what each pip shows and
             // where its middle is, for a check to click.
             seats: seatsAt(p),
             pips: b.pips ? b.pips.map(q => [q.x + q.w / 2, q.y + q.h / 2]) : null,
             rule: b.pips && b.pips.rule ? { ...b.pips.rule } : null,
             block: b.pips ? { ...b.pips.block } : null,
             less: [b.less.x + b.less.w / 2, b.less.y + b.less.h / 2],
             more: [b.more.x + b.more.w / 2, b.more.y + b.more.h / 2] };
  });
}
