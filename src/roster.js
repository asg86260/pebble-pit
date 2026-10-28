// Who is working where, written under the place they work, with the two
// buttons that move them in the same place. Carrying is the exception and has
// no buttons: you never put a body *on* carrying, it is what a body does when
// it is on nothing. Its count is there to be read.

import { P, WORKER, DEEP_POST_DOWN, SEAT_PIP, SEAT_GAP, SEAT_RING, SEAT_EMPTY_INK, SEAT_LEAVE_MS,
         COUNTER_ROW, COUNTER_ROWS, COUNTER_SPRITE_GAP, COUNTER_PAIR_GAP, COUNTER_GROUP_GAP, COUNTER_TOP_DROP,
         COUNTER_PLUS_DOWN, COUNTER_PLUS_ROOM, GARAGE_W, CART_W, LIFT_W, LIFT_FORK, LIFT_SEAT,
         LIFT_ANTENNA } from './config.js';
import { deepFloor, deepTop } from './deep/place.js';
import { STATIONS, station } from './stations.js';
import { S, quarry } from './state.js';
import { groundAt, kitX } from './world.js';
import { siteBox } from './works.js';
import { JOB_MACHINE, running } from './machines.js';
import { assign, idle } from './staffing.js';
import { hats, worn, spareKit, roomAt, capOf, handsOf } from './levels.js';
import { KIT_MARK, TRADE_OF, liftsOf } from './kit.js';
import { JOB, DEEP_JOBS, TYPE_OF } from './jobs.js';
import { shown, onSnap } from './tween.js';
import { garage, hasGarage } from './crew/lifts.js';
import { HATS, HATS_TIGHT, spriteW, spriteH } from './sprites.js';
import { turnedOver, themed } from './ink.js';
import { now } from './clock.js';
import { reducedMotion } from './prefs.js';
import { writeCount } from './render/numfont.js';
import { msg, FACE } from './lang.js';
import { crispText } from './render/crisptext.js';
import { drift } from './render/bars.js';
import { GREY } from './config/palette.js';
import { fillDots } from './render/dots.js';
import { SHELF_HOVER_MS, SHOP_BTN_PX, SHOP_BTN_H, SHOP_BTN_PAD, SHOP_BTN_AIR, SHOP_BTN_ADVANCE,
         SHOP_BTN_LIFT, SHOP_BTN_PRESSED } from './config.js';


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
    // Held clear by its own width: a counter is as wide as its pips.
    at: () => clearOfHoles(p.at?.() ?? mid(), widthOf(post)),
    y: () => (deep() ? deepFloor() + DEEP_POST_DOWN : null),
    get deep() { return deep(); }
  };
  return post;
}
let POSTS = null;               // cache: built from the station table, which never changes; each post reads the yard live
// The yard's posts are the station rows'; a row whose job is the deep's is
// not one of them, since the deep's stations are the player's and stand
// where they were put down.
const yardPosts = () => (POSTS ||= STATIONS.filter(r => r.post && r.post.job && !DEEP_JOBS.includes(r.post.job))
                                          .map(postOf));

// The garage's: one pip a forklift, under the garage. Nobody is put on a
// forklift, so like carrying it is read, not set.
const GARAGE_POST = {
  key: 'garage', job: null, lifts: true, kit: false, fixed: true,
  show: hasGarage,
  at: () => garage().x + GARAGE_W / 2,
  y: () => null
};
const allPosts = () => [...yardPosts(), GARAGE_POST];

// --- the places ----------------------------------------------------------------
// An act's place keeps its own crew and its own counts, but stands its posts
// on this same roster: the same counters, buttons, hit test and drawing. A
// place hands over its posts (`rosterPlace`) and each post carries `src`,
// the place's answers to what the yard answers off `S` and `S.workers`:
//
//   count(p)        how many are on the post's job
//   press(p, d)     one more (d 1) or one fewer (d -1) put on it
//   spare()         how many could be put on anything
//   cap(p)          the seats the post's station holds
//   bodies(p)       the bodies on its job
//   coming(w)       whether a body on it is still on its way there
//   left(w)         how far it still has to walk
//   uid(w)          a key for a body, for its pip's walk
//
// A place's post also says `place` (the view it stands in), its `at` and
// `y`, and a `group`: posts of one group stand side by side under one
// building, centered there as one, in the order handed over. A post that
// names a `board` (a station's key) carries that board's UPGRADES button
// over its count, and the board opens from there and nowhere else.
// The places are kept on the function itself: a place's module registers
// while this one may still be loading (the act's modules and the yard's
// import each other round a ring), and a function declaration is the one
// thing of a module standing before its body has run.
export function rosterPlace(place, list) { (rosterPlace.places ||= new Map()).set(place, list); }
const placePosts = () => [...(rosterPlace.places || new Map()).values()].flatMap(f => f());
// Every post this roster stands, the yard's and every place's.
const everyPost = () => [...allPosts(), ...placePosts()];

// How many stand at a post, and whether each of its buttons would do anything.
const count = p => (p.src ? p.src.count(p) : p.lifts ? liftsOf() : S[p.job]);
const capAt = p => (p.src ? p.src.cap(p) : capOf(p.job));
const roomOf = p => (p.src ? capAt(p) - count(p) : roomAt(p.job));
const spareOf = p => (p.src ? p.src.spare() : idle());
const canLess = (p, n) => n > 0;
const canMore = (p, spare) => spare > 0 && roomOf(p) > 0;
const press = (p, d) => (p.src ? p.src.press(p, d) : assign(p.job, d));
// Only the yard's posts have machines standing in for them: a place's job
// that shares a yard job's name (act 3's hauler) is not the belt's.
const machineOn = p => !p.src && machineAt(p.job);

// --- the seats ----------------------------------------------------------------
// A station with a floor plan is counted in seats: a pip a place to stand,
// black where a body is at work, a grey ring where nobody is. The rock has no
// plan and carrying is not a place, so those two count bodies instead (the
// crowds, below). A save from before a cap can stand more than the plan
// holds, and every one of them still gets a pip.
const seatsOf = p => {
  if (p.fixed) return 0;
  const cap = capAt(p);
  return Number.isFinite(cap) && cap >= 1 ? Math.max(cap, count(p)) : 0;
};

// Who is at this post, as bodies: the count says who is assigned, and only a
// body can say whether it has got there.
// A pass over every post asks this of each several times over, so the pass
// sorts the crew by type once (`overPosts`) and reads the sort; asked
// outside a pass, it is a walk of the crew as ever.
let byType = null;              // cache: the crew by type for the length of one pass, null outside it
const NOBODY = [];
const bodiesOf = p => p.src ? p.src.bodies(p)
  : byType ? byType.get(TYPE_OF[p.job]) || NOBODY
           : S.workers.filter(w => w.type === TYPE_OF[p.job]);
function overPosts(fn) {
  byType = new Map();
  for (const w of S.workers) {
    const list = byType.get(w.type);
    if (list) list.push(w); else byType.set(w.type, [w]);
  }
  try { return fn(); } finally { byType = null; }
}

// On its way: a commute whose last leg is the work (crew/commute.js), the
// hat fetched first included. A hat errand ends on 'back', not 'work': that
// body never left the job, so its seat stays full.
const comingYard = w => (w.walking && w.leg === 'work') || !!w.legs?.some(l => l.do === 'work');
const comingTo = (w, p) => (p.src ? p.src.coming(w) : comingYard(w));

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
const uidOf = (w, p) => (p.src ? p.src.uid(w) : w.uid);
function walked(w, p) {
  const left = p.src ? p.src.left(w) : still(w), id = uidOf(w, p), type = p.src ? w.job : w.type;
  let r = setOut.get(id);
  if (!r || r.type !== type) setOut.set(id, r = { type, d: left });
  return r.d > 0 ? Math.max(0, Math.min(1, 1 - left / r.d)) : 0;
}

// A body sent off is a hauler on the frame it is sent and walks to nothing,
// so its pip empties on a clock instead. Remembered per post: the count it
// had last read, and when each one that has gone since set off.
const leftAt = new Map();
onSnap(() => { leftAt.clear(); setOut.clear(); });
function leaving(p, on) {
  const key = p.src ? p.key : p.job, t = now();
  let m = leftAt.get(key);
  if (!m) leftAt.set(key, m = { n: on, out: [] });
  if (on < m.n && !reducedMotion()) for (let i = on; i < m.n; i++) m.out.push(t);
  if (on > m.n) m.out.splice(0, on - m.n);
  m.n = on;
  m.out = m.out.filter(t0 => t - t0 < SEAT_LEAVE_MS);
  return m.out.map(t0 => 2 - Math.min(2, Math.floor((t - t0) / SEAT_LEAVE_MS * 3)));
}

// Held thirds, never a slide: nought is a ring (somebody is on the way), two
// is two thirds; a full pip is only ever a body that has arrived.
const thirds = f => Math.min(2, Math.floor(f * 3));

// A walker bound for the hat: on its way to the stand to take one, or already
// wearing it on the way to the work. Its pip is a specialist's from the start.
const wearsOn = (w, p) => !!p.kit && (w.wanting === p.job || (w.trained && w.kitOf === p.job));

// How many of the bodies at work wear the post's hat. Pure, so the boxes can
// ask it every frame without disturbing the walkers' clocks the way
// `seatsAt` does.
function hatsAtWork(p) {
  let n = 0;
  for (const w of bodiesOf(p)) if (!comingTo(w, p) && w.trained && w.kitOf === p.job) n++;
  return Math.min(n, count(p));
}

// One post's seats: who is at work (the hatted counted apart), who is walking
// over, the furthest along first, who has just gone, and how many seats are
// the plain hands'.
export function seatsAt(p) {
  const seats = seatsOf(p);
  if (!seats) return null;
  const on = count(p);
  let here = 0, brims = 0;
  const walking = [], hatBound = [];
  for (const w of bodiesOf(p)) {
    if (comingTo(w, p)) { (wearsOn(w, p) ? hatBound : walking).push(walked(w, p)); continue; }
    setOut.delete(uidOf(w, p));
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
// or spare, capped at its seats: a pip for each hatted body at work and a
// ring for each hat not yet worn (`spareKit`). The regular slots are the
// seats left over, and are the only ones a plain body is ever drawn in.
// Together they never outnumber the seats.
const topOf = p => {
  if (!p.kit || !seatsOf(p)) return { worn: 0, wearing: 0, spare: 0 };
  const worn = hatsAtWork(p);
  let wearing = 0, claimed = 0;
  for (const w of bodiesOf(p)) if (comingTo(w, p) && wearsOn(w, p)) { wearing++; if (w.wanting === p.job) claimed++; }
  wearing = Math.min(wearing, Math.max(0, count(p) - worn));
  // A hat seat a plain body already stands in is not shown: the seat is
  // taken, and the regular counter must hold every plain body at work.
  const plain = Math.max(0, count(p) - worn - wearing);
  return { worn, wearing, spare: Math.max(0, Math.min(spareKit(p.job) - claimed, seatsOf(p) - worn - wearing - plain)) };
};

// A seated post's two counters, as pip lists: `k` thirds filled (3 is a body
// at work) or `open`, a grey ring. The hatted: the hatted at work, then the
// walkers bound for a hat, then the hats waiting. The plain: the plain at
// work, then walking over, then just gone, then the empty seats.
function seatPips(p) {
  const s = seatsAt(p), t = topOf(p);
  const top = [];
  for (let i = 0; i < t.worn + t.wearing; i++) top.push({ k: i < s.brims ? 3 : (s.wearing[i - s.brims] ?? 0) });
  for (let i = 0; i < t.spare; i++) top.push({ k: 0, open: true, spare: true });
  const plain = [], on = s.plain + s.coming.length;
  for (let m = 0; m < s.regular; m++)
    plain.push(m < s.plain ? { k: 3 }
      : m < on ? { k: s.coming[m - s.plain] }
      : m < on + s.leaving.length ? { k: s.leaving[m - on] }
      : { k: 0, open: true });
  return { top, plain };
}

// --- the crowds ----------------------------------------------------------------
// The rock, carrying and the garage have no seats to count: the rock has no
// floor plan, carrying is not a place, and nobody is put on a forklift. Each
// is a pip a body all the same, solid where a body is at work.
const crowded = p => !seatsOf(p) && (p.fixed || !Number.isFinite(capAt(p)));

function crowdPips(p) {
  if (p.lifts) return { top: [], plain: Array.from({ length: liftsOf() }, () => ({ k: 3 })) };
  const on = count(p);
  let here = 0, brims = 0, claimed = 0;
  const walking = [], hatBound = [];
  for (const w of bodiesOf(p)) {
    if (comingTo(w, p)) {
      if (wearsOn(w, p)) { hatBound.push(walked(w, p)); if (w.wanting === p.job) claimed++; } else walking.push(walked(w, p));
      continue;
    }
    setOut.delete(uidOf(w, p));
    here++;
    if (w.trained && w.kitOf === p.job) brims++;
  }
  const wearers = Math.min(hatBound.length, Math.max(0, on - here));
  const filled = Math.min(on - wearers, here);
  const hatted = Math.min(brims, filled);
  walking.sort((a, b) => b - a);
  hatBound.sort((a, b) => b - a);
  const spare = p.kit ? Math.max(0, spareKit(p.job) - claimed) : 0;
  const top = [
    ...Array.from({ length: hatted }, () => ({ k: 3 })),
    ...hatBound.slice(0, wearers).map(f => ({ k: thirds(f) })),
    ...Array.from({ length: spare }, () => ({ k: 0, open: true, spare: true }))
  ];
  const plain = Array.from({ length: filled - hatted }, () => ({ k: 3 }));
  for (let i = 0; i < on - wearers - filled; i++) plain.push({ k: thirds(walking[i] ?? 0) });
  return { top, plain };
}

// --- the counters ----------------------------------------------------------------
// Every counter is one shape: a sprite that says what is counted, and under it
// the pips. The specialists are a counter of their own beside the plain hands,
// as the house's carters stand beside its workers. A sprite is a body, the
// body in the station's hat (the counter's tight brim), a carter with its
// cart, or a forklift.
const hatRows = mark => HATS_TIGHT[mark] || HATS[mark] || HATS.helmet;
function spriteOf(p, kind) {
  if (kind === 'cart') return { kind, w: CART_W + P + WORKER, h: WORKER };
  if (kind === 'lift') return { kind, w: LIFT_W + P + LIFT_FORK, h: LIFT_SEAT + LIFT_ANTENNA + P };
  if (kind === 'hat') {
    const mark = KIT_MARK[p.job], rows = hatRows(mark), head = spriteH(rows) * P;
    return { kind, mark, head, w: Math.max(WORKER, spriteW(rows) * P), h: head + WORKER };
  }
  return { kind: 'body', w: WORKER, h: WORKER };
}
// What the report calls each sprite's kit, as the checks have always read it.
const KIT_NAME = { hat: 'hat', cart: 'cart', lift: 'fork', body: null };

const pipRowW = n => Math.max(0, n * (SEAT_PIP + SEAT_GAP) - SEAT_GAP);

// The post's counters, measured: an empty counter is not drawn, unless the
// post would have none, when the plain one stands alone so the post still
// says what it counts. Each block wraps at COUNTER_ROW and stops at
// COUNTER_ROWS, the rest hidden and written under it.
function countersOf(p) {
  const seated = !!seatsOf(p);
  if (!seated && !crowded(p)) return null;
  const { top, plain } = seated ? seatPips(p) : crowdPips(p);
  const list = [
    { sprite: spriteOf(p, !p.src && p.job === JOB.HAUL ? 'cart' : 'hat'), pips: top, top: true },
    { sprite: spriteOf(p, p.lifts ? 'lift' : 'body'), pips: plain, top: false }
  ];
  const some = list.filter(c => c.pips.length);
  return (some.length ? some : [list[1]]).map(c => {
    const n = Math.min(c.pips.length, COUNTER_ROW * COUNTER_ROWS);
    const rows = Math.ceil(n / COUNTER_ROW);
    const strip = pipRowW(Math.min(c.pips.length, COUNTER_ROW));
    return { ...c, n, hidden: c.pips.length - n, strip,
             w: Math.max(strip, c.sprite.w), h: Math.max(0, rows * (SEAT_PIP + SEAT_GAP) - SEAT_GAP) };
  });
}

// Buttons either side where the post has them: one pair framing the whole
// post, however many counters stand on it.
const sideOf = p => (p.fixed ? 0 : BTN + GAP);
const innerOf = cs => cs.reduce((s, c) => s + c.w, 0) + COUNTER_PAIR_GAP * (cs.length - 1);

const widthOf = p => {
  const cs = countersOf(p);
  return cs ? innerOf(cs) + sideOf(p) * 2 : WIDE;
};

// Each counter placed: its sprite's corner, and each shown pip's square in
// world units, the rows left-aligned on a strip centered under the counter.
// The block hangs from its first row, whose middle is the post's line, so the
// buttons stand level with that row and stay put as rows are added under it.
function placeCounters(cs, x0, line) {
  const y0 = line - COUNTER_TOP_DROP;
  const snap = v => Math.round(v / P) * P;
  let x = x0;
  for (const c of cs) {
    c.box = { x, y: y0, w: c.w, h: c.h };
    c.spriteAt = { x: x + snap((c.w - c.sprite.w) / 2), y: y0 - COUNTER_SPRITE_GAP - c.sprite.h };
    const px = x + snap((c.w - c.strip) / 2);
    c.boxes = c.pips.slice(0, c.n).map((q, i) => ({
      ...q, top: c.top, brim: KIT_NAME[c.sprite.kind],
      x: px + (i % COUNTER_ROW) * (SEAT_PIP + SEAT_GAP),
      y: y0 + Math.floor(i / COUNTER_ROW) * (SEAT_PIP + SEAT_GAP), w: SEAT_PIP, h: SEAT_PIP, gap: SEAT_GAP }));
    c.plus = c.hidden ? { n: c.hidden, x: px + c.strip / 2, y: y0 + c.h + COUNTER_PLUS_DOWN } : null;
    x += c.w + COUNTER_PAIR_GAP;
  }
  const H = Math.max(...cs.map(c => c.h));
  const up = Math.max(...cs.map(c => c.sprite.h)) + COUNTER_SPRITE_GAP;
  const foot = y0 + H + (cs.some(c => c.hidden) ? COUNTER_PLUS_ROOM : 0);
  return { list: cs, block: { y: y0, h: H }, top: y0 - up, foot };
}

// A counter is as wide as its pips, so a press that changes them would slide
// the button under the pointer. While the pointer is over a post, the button
// last pressed is held where it is and the post grows or shrinks away from
// it; the post centers again when the pointer leaves. `box` is the post as
// last drawn, `anchor` the pressed button's side and edge.
const held = new Map();
const NEAR = P * 2;
const pointerOn = f => !!f.box && !!S.mouse && S.mouse.x >= f.box.l - NEAR && S.mouse.x <= f.box.r + NEAR
  && S.mouse.y >= f.box.t - NEAR && S.mouse.y <= f.box.b + NEAR;

// What a pip is to hit: grown half a gap to each side, so the block is one
// target with no dead seams.
const pipHit = b => ({ x: b.x - b.gap / 2, y: b.y - b.gap / 2, w: b.w + b.gap, h: b.h + b.gap });

// A click on a regular seat sets the regular count to that seat, through the
// same press the buttons make, once a body, so every one of them still walks.
// The last plain body's own pip takes that body off: the row reads as a run of
// switches, and pressing the one at the end of the run turns it off.
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
  return { x: Math.round((p.group ? groupAt(p) : p.at()) / P) * P, y: Math.round(y / P) * P };
}

// A post of a group, side by side with the others under its building: the
// group as wide as its posts and a gap between each two, centered on the
// building's middle, each post at the middle of its own width.
function groupAt(p) {
  const side = everyPost().filter(q => q.group === p.group && q.show());
  const ws = side.map(widthOf), total = ws.reduce((s, w) => s + w, 0) + COUNTER_GROUP_GAP * (side.length - 1);
  let x = p.at() - total / 2;
  for (let i = 0; i < side.length; i++) {
    if (side[i] === p) return x + ws[i] / 2;
    x += ws[i] + COUNTER_GROUP_GAP;
  }
  return p.at();
}

// The machine's mark stands under the count, at the foot of the post.
function runBox(p, left, y, set) {
  const h = BTN;
  if (set) return { x: left, y: set.foot + P * 2, w: widthOf(p), h };
  return { x: left, y: y + WORKER + P * 3 + (p.kit ? WORKER + P * 2 : 0), w: WIDE, h };
}

// The boxes of one roster, left to right, in world units. A post with no
// seats and no crowd keeps the badge and the number, and under them a second
// line for the tradesmen: under rather than beside, because it is a *part* of
// the headcount, not another number.
function boxes(p) {
  const { x, y } = postAt(p);
  const cs = countersOf(p);
  const wide = cs ? innerOf(cs) + sideOf(p) * 2 : WIDE;
  // Back on the grid: an even number of pips is half a cell off center.
  let left = Math.round((x - wide / 2) / P) * P;
  const f = held.get(p.key);
  if (f && f.anchor && pointerOn(f)) left = f.anchor.side === 'l' ? f.anchor.x : f.anchor.x - wide;
  else if (f) f.anchor = null;
  const under = y + WORKER + P * 3;
  const set = cs ? placeCounters(cs, left + sideOf(p), y) : null;
  if (set && !p.fixed) {
    const g = f || (held.set(p.key, { box: null, anchor: null }), held.get(p.key));
    g.box = { l: left, r: left + wide, t: set.top, b: set.foot };
  }
  return {
    less: { x: left, y: y - BTN / 2, w: BTN, h: BTN },
    badge: { x: left + BTN + GAP, y: y - WORKER / 2, w: WORKER, h: WORKER },
    num: { x: left + BTN + GAP + WORKER + GAP, y, w: NUM, h: BTN },
    more: { x: left + wide - BTN, y: y - BTN / 2, w: BTN, h: BTN },
    counters: set,
    seated: !!seatsOf(p),
    trade: { x: left + BTN + GAP, y: under - WORKER / 2, w: WORKER, h: WORKER },
    tradeNum: { x: left + BTN + GAP + WORKER + GAP, y: under, w: NUM, h: BTN },
    // The machine's mark, on the roster: "is this station worked by hands or
    // by the machine" is the same question the counter above answers about
    // *how many* hands.
    run: runBox(p, left, y, set),
    // Over the count rather than under it: the pips grow downward as seats
    // are bought, and a button under them would be pushed about by every
    // purchase.
    shop: p.board ? { x: Math.round((left + wide / 2 - shopW() / 2) / P) * P,
                      y: y - WORKER / 2 - WORKER - SHOP_BTN_AIR - SHOP_BTN_H, w: shopW(), h: SHOP_BTN_H } : null
  };
}
const shopWord = () => msg('roster-upgrades').toUpperCase();
const shopW = () => Math.ceil((shopWord().length * SHOP_BTN_PX * SHOP_BTN_ADVANCE + SHOP_BTN_PAD * 2) / P) * P;

export const posts = () => allPosts().filter(p => p.show());
// The posts a click or the pointer can be on: those standing in the view the
// camera is in. The yard's are the yard's and the deep's, a place's its own.
const PLACE_VIEWS = new Set(['after', 'hell']);
const here = p => (p.place ? S.view === p.place : !PLACE_VIEWS.has(S.view));
const live = () => everyPost().filter(p => p.show() && here(p));

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
// reach the pips beside it, which must not become one; two up and down,
// where there is nothing but bare ground.
const HIT_X = P, HIT_Y = P * 2;
const hit = b => ({ x: b.x - HIT_X, y: b.y - HIT_Y,
                    w: b.w + HIT_X * 2, h: b.h + HIT_Y * 2 });

// The yard is one canvas, so nothing in it carries a cursor of its own;
// somebody has to ask every time the mouse moves.
export const overRoster = (x, y) => live().some(p => {
  if (p.fixed) return false;
  const b = boxes(p);
  return inside(hit(b.less), x, y) || inside(hit(b.more), x, y) || !!pipAt(p, b, x, y) || (!!b.shop && inside(hit(b.shop), x, y));
});

// The board whose UPGRADES button a point is on, or null: a press there is
// the button's, so input.js keeps it from closing the board it is opening.
export function shopAt(x, y) {
  for (const p of live()) { const b = boxes(p); if (b.shop && inside(hit(b.shop), x, y)) return p.board; }
  return null;
}
// A board's button where it stands, or null where none does: a station with
// one opens from it and not from a click on its drawing, and the board
// stands off it (after/stations.js, `boardAnchor`).
export function shopBoxOf(key) {
  const p = live().find(q => q.board === key);
  return p ? boxes(p).shop : null;
}

// What a post says with the cursor on it, for a place that gives its posts
// words (`says`; the yard's have none): the text and the world point under
// the roster it hangs from, or null.
export function rosterSays(x, y) {
  for (const p of live()) {
    if (!p.says) continue;
    const b = boxes(p), g = held.get(p.key)?.box;
    const top = Math.min(b.badge.y, g ? g.t : b.badge.y), foot = Math.max(b.num.y + b.num.h, g ? g.b : 0);
    if (x >= b.less.x && x < b.more.x + b.more.w && y >= top && y < foot) return { text: p.says(), at: { x: (b.less.x + b.more.x + b.more.w) / 2, y: foot } };
  }
  return null;
}

// The seat pip a point is over: { kind, at } where `at` counts from one
// inside the plain counter, or null. A crowd's pips are bodies, not seats,
// and are not switches.
function pipAt(p, b, x, y) {
  if (!b.seated || !b.counters) return null;
  for (const c of b.counters.list) {
    const i = c.boxes.findIndex(q => inside(pipHit(q), x, y));
    if (i < 0) continue;
    if (!c.top) return { kind: 'reg', at: i + 1 };
    return { kind: c.boxes[i].spare ? 'spare' : 'top' };
  }
  return null;
}

// A click on a roster, in world units: true if it was one, so the yard knows
// not to treat it as a swing at the ground. On an UPGRADES button it is the
// board's key instead, for the page to open or put away: the board is the
// page's, and this file stands in the node tier too.
export function rosterHit(x, y) {
  for (const p of live()) {
    if (p.fixed) continue;
    const b = boxes(p);
    // a near miss on either button still counts as that button rather than as a
    // swing at the ground: they are small, and the ground behind them does
    // something else entirely
    if (b.shop && inside(hit(b.shop), x, y)) { pressedShop = p.key; return p.board; }
    const hold = (side, edge) => { const f = held.get(p.key); if (f) f.anchor = { side, x: edge }; };
    if (inside(hit(b.less), x, y)) { hold('l', b.less.x); press(p, -1); S.shopStale = true; return true; }
    if (inside(hit(b.more), x, y)) { hold('r', b.more.x + b.more.w); press(p, 1); S.shopStale = true; return true; }
    const pip = pipAt(p, b, x, y);
    if (pip) {
      // A plain seat sets the plain count: the hatted bodies stand outside
      // it. A waiting hat's ring is a worker sent for that hat, the same
      // press as the +. A hatted body's pip is no switch; it is only not a
      // swing.
      if (pip.kind === 'reg') {
        const t = topOf(p), held = t.worn + t.wearing, plain = count(p) - held;
        setTo(p, held + (pip.at === plain ? pip.at - 1 : pip.at));
      } else if (pip.kind === 'spare') press(p, 1);
      S.shopStale = true;
      return true;
    }
    if (inside(b.badge, x, y) || inside(b.num, x, y)) return true;   // the count is not a button
    // The machine's mark is not a button either (a machine is stopped by
    // taking its tender off, the `-` beside the count), but a click there is
    // not a swing at the ground.
    if (machineOn(p) && inside(hit(b.run), x, y)) return true;
  }
  return false;
}

// The minus and the plus of one post's roster, as drawn, for a pad's focus
// to stand on (pad.js): a press there is `rosterHit` at the button's middle,
// the very call a click makes. Null for a post not standing or not a switch.
export function rosterButtons(key) {
  const p = live().find(q => q.key === key && !q.fixed);
  if (!p) return null;
  const b = boxes(p);
  return { less: b.less, more: b.more };
}

// --- drawing -----------------------------------------------------------------
// The badge and the buttons are world pixels on the cell grid. The count is
// the one thing drawn in screen pixels: it is type, and type scaled by five
// sixths has a fuzzy edge.

// `sprites` draws the counters' heads that are not a bare body or a hatted
// one: `cart(x, y)` a carter with its cart, `lift(x, y)` a forklift, each from
// the top-left of its box, so the crew's drawing stays in render/crew.js.
export function drawRoster(ctx, drawBody, drawHat, drawRun, sprites) {
  overPosts(() => drawRosterPass(ctx, drawBody, drawHat, drawRun, sprites));
}
// The roster is cut to the half it stands in (frame.js, `clipToHalf`), so a
// post in the other half is never seen and is not worked out.
const inHalf = p => (p.place ? S.view === p.place : !PLACE_VIEWS.has(S.view) && !!p.deep === (S.view === 'deep'));
function drawRosterPass(ctx, drawBody, drawHat, drawRun, sprites) {
  for (const p of everyPost()) {
    if (!p.show() || !inHalf(p)) continue;
    const b = boxes(p);
    const n = count(p), spare = spareOf(p);
    if (b.shop) shopButton(ctx, b.shop, p);

    // Only on the stations that have a machine standing.
    if (machineOn(p) && drawRun) drawRun(b.run, JOB_MACHINE[p.job]);

    if (b.counters) {
      for (const c of b.counters.list) {
        const { x, y } = c.spriteAt, s = c.sprite;
        if (s.kind === 'cart') sprites?.cart(x, y);
        else if (s.kind === 'lift') sprites?.lift(x, y);
        else {
          const bx = x + (s.w - WORKER) / 2, by = y + (s.head || 0);
          drawBody(bx, by);
          if (s.kind === 'hat') drawHat(bx, by, s.mark, true);
        }
        for (const q of c.boxes) drawPip(ctx, q);
      }
      if (p.fixed) continue;                     // carrying and the garage are read, not set
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
      drawHat(b.trade.x, b.trade.y, KIT_MARK[p.job], true);
    }

    if (p.fixed) continue;
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

// The UPGRADES button is a shop tile on the canvas (shelf.css, `.tile`), so
// it answers the pointer the way the tiles a player has already learned do:
// at rest only the word on the ground; under the pointer, or while its board
// is up, the plate lifts up and left off a hard shadow left where it stood,
// its edge easing in over the tile's own SHELF_HOVER_MS, and drifts on the
// tile's own loop (bars.js); pressed, it sinks halfway back.
const lifting = new Map();       // the post's key -> { to, from, at }, the lift easing toward `to`
let pressedShop = null;          // page: the post whose button the pointer went down on, until it comes up
// The pointer came up, wherever it was (input.js `endDrag`, and a blur).
export const rosterUp = () => { pressedShop = null; };
const boardUp = key => !!S[station(key)?.board];
function lifted(key, to) {
  const t0 = now();
  let r = lifting.get(key);
  if (!r) lifting.set(key, r = { to, from: to, at: t0 });
  const k = Math.min(1, (t0 - r.at) / SHELF_HOVER_MS), at = r.from + (r.to - r.from) * (1 - Math.pow(1 - k, 3));
  if (r.to !== to) { r.from = at; r.to = to; r.at = t0; }
  return reducedMotion() ? r.to : at;
}
function shopButton(ctx, b, p) {
  const over = !!S.mouse && inside(hit(b), S.mouse.x, S.mouse.y);
  const t = lifted(p.key, over && pressedShop === p.key ? SHOP_BTN_PRESSED : over || boardUp(p.board) ? 1 : 0);
  const paper = GREY[0], ink = GREY[GREY.length - 1];
  const [dx, dy] = reducedMotion() ? [0, 0] : drift(`upgrades${p.key}`);
  const x = b.x + (dx - SHOP_BTN_LIFT) * t, y = b.y + (dy - SHOP_BTN_LIFT) * t;
  if (t > 0) {
    ctx.fillStyle = ink; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = paper; ctx.fillRect(x, y, b.w, b.h);
    fillDots(ctx, x + THIN, y + THIN, b.w - 2 * THIN, b.h - 2 * THIN);   // the board's dots, on the plate and going with it
    // the border is all there by the time a press has sunk the plate
    ctx.globalAlpha = Math.min(1, t / SHOP_BTN_PRESSED); ctx.fillStyle = ink;
    ctx.fillRect(x, y, b.w, THIN); ctx.fillRect(x, y + b.h - THIN, b.w, THIN);
    ctx.fillRect(x, y, THIN, b.h); ctx.fillRect(x + b.w - THIN, y, THIN, b.h);
    ctx.globalAlpha = 1;
  }
  crispText(ctx, shopWord(), x + b.w / 2, y + (b.h - SHOP_BTN_PX) / 2, `${SHOP_BTN_PX}px ${FACE}`, ink, 'center', paper, GREY);
}

// A pip is a pixel mask, never an arc: an arc's edge is a grey smear, and a
// disc on whole pixels stays black and white. A disc is every pixel whose
// middle is inside the circle; the ring is the disc less the pixels further
// in than its thickness; a body on its way is the ring with the disc's rows
// filled from the bottom. The mask is cut in the screen's own pixels, not the
// world's: the yard is drawn at five sixths, and a world pixel's row lands
// between two screen rows and leaves a pale seam through the disc.
const masks = themed(new Map());
function maskOf(d, ring, fill, color) {
  const key = `${d}:${ring}:${fill}:${color}`;
  let c = masks.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = d;
  const g = c.getContext('2d'), r = d / 2;
  g.fillStyle = color;
  for (let y = 0; y < d; y++) for (let x = 0; x < d; x++) {
    const q = Math.hypot(x + 0.5 - r, y + 0.5 - r);
    if (q <= r && (q > r - ring || y >= d - fill)) g.fillRect(x, y, 1, 1);
  }
  masks.set(key, c);
  return c;
}

// A body at work is a black disc; an empty seat, or a hat waiting with nobody
// under it, a grey ring. A body on its way is a black ring filling from the
// bottom in held thirds, and one just gone the same, emptying.
function drawPip(ctx, q) {
  const m = ctx.getTransform(), z = m.a;
  const d = Math.max(1, Math.round(q.w * z)), ring = Math.max(1, Math.round(SEAT_RING * z));
  const fill = q.open ? 0 : q.k >= 3 ? d : Math.round(d * q.k / 3);
  const mask = maskOf(d, ring, fill, q.open ? SEAT_EMPTY_INK : '#000');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(mask, Math.round(m.a * q.x + m.e), Math.round(m.d * q.y + m.f));
  ctx.restore();
  ctx.fillStyle = '#000';
}

// The counts, in screen pixels, after the world has been drawn.
export function drawRosterCounts(ctx, screenAt) {
  overPosts(() => drawCountsPass(ctx, screenAt));
}
function drawCountsPass(ctx, screenAt) {
  // In the number font, keyed in paper, in the middle of its own slot.
  for (const p of everyPost()) {
    if (!p.show() || !inHalf(p)) continue;
    // Drawn over the finished frame: on the light page the deep has been
    // turned over under it, so a deep post's number is written in the
    // paper's white to stand on the black water like the post's own marks,
    // its keyline the water's black.
    const inv = p.deep && !turnedOver();
    const look = { ink: inv ? '#fff' : '#000', paper: inv ? '#000' : '#fff' };
    const b = boxes(p);
    // A counter is its own count up to its rows; past them, the rest under
    // the block, since nobody counts sixty dots.
    if (b.counters) {
      b.counters.list.forEach((c, i) => {
        if (!c.plus) return;
        const at = screenAt(c.plus.x, c.plus.y);
        writeCount(ctx, `+${Math.round(shown(`crowd:${p.key}:${i}`, c.plus.n))}`, at.x, at.y, look);
      });
      continue;
    }
    const at = screenAt(b.num.x + b.num.w / 2, b.num.y);
    writeCount(ctx, String(Math.round(shown('roster:' + p.job, count(p)))), at.x, at.y, look);
    // What the station owns, not what is being worn: the number says what is
    // waiting there for the next body you send. No second line where the
    // badge already wears the hat (see `drawRoster`).
    if (p.job !== JOB.WIZARD && TRADE_OF[p.job] && hats(p.job) > 0) {
      const t = screenAt(b.tradeNum.x + b.tradeNum.w / 2, b.tradeNum.y);
      writeCount(ctx, String(Math.round(shown('hats:' + p.job, hats(p.job)))), t.x, t.y, look);
    }
  }
  ctx.fillStyle = '#000';
}

// Whether this station has a machine standing at it. Whether it is *working*
// is whether anybody is standing at it, which is the count on the roster.
export const machineAt = job => {
  const key = JOB_MACHINE[job];
  return !!key && running(key);
};

// what the roster is showing and where its buttons are, for the checks
// The yard's posts by default; a place's (`place` 'after') on its own, so a
// check of the yard never reads an act's posts, nor the other way about.
export function rosterReport(place = null) {
  const list = place ? placePosts().filter(p => p.place === place && p.show()) : posts();
  return list.map(p => (p.src
    ? { ...postReport(p), hats: 0, worn: 0, spareKit: 0, machine: false, hands: null, trade: null,
        room: Math.min(99, roomOf(p)), cap: capAt(p) }
    : postReport(p)));
}
function postReport(p) {
  {
    const b = boxes(p);
    const H = hit(b.less);
    const set = b.counters;
    const mid = q => [q.x + q.w / 2, q.y + q.h / 2];
    const all = set ? set.list.flatMap(c => c.boxes) : [];
    return { key: p.key, job: p.job, n: count(p),
             // The counter's ground, left and right, for the checks that keep two apart.
             span: [b.less.x, b.more.x + b.more.w], hats: hats(p.job), worn: worn(p.job),
             spareKit: spareKit(p.job), fixed: !!p.fixed, hitW: H.w, hitH: H.h,
             room: p.lifts ? null : Math.min(99, roomAt(p.job)),
             // What the station holds now (1 while a machine runs) and what it
             // would hold by hand; without both a check cannot tell a capped
             // station from a small one.
             cap: capOf(p.job) === Infinity ? null : capOf(p.job),
             // Whether it is *working* is `n`, two fields up.
             machine: machineAt(p.job),
             run: [b.run.x + b.run.w / 2, b.run.y + b.run.h / 2],
             hands: (n => n === Infinity ? null : n)(handsOf(p.job)),
             // Only where a trade line is actually drawn.
             trade: !set && TRADE_OF[p.job] && hats(p.job) > 0
               ? [b.trade.x + b.trade.w / 2, b.trade.y + b.trade.h / 2] : null,
             lifts: p.lifts ? liftsOf() : null,
             // Each counter on the post, left to right: what its sprite is
             // and where, how many pips it has and how many are shown, each
             // shown pip's middle, and the "+N" under it.
             counters: set ? set.list.map(c => ({
               sprite: c.sprite.kind, mark: c.sprite.mark || null, top: c.top,
               head: [c.spriteAt.x, c.spriteAt.y, c.sprite.w, c.sprite.h], box: { ...c.box },
               pips: c.pips.length, shown: c.n, at: c.boxes.map(mid),
               plus: c.plus ? { n: c.plus.n, at: [c.plus.x, c.plus.y] } : null })) : null,
             // A crowd, where a post is one: each shown pip's middle, whether
             // it is filled, its kit and whether it is in the specialists'
             // counter; how many pips each counter has; and each "+N".
             crowd: set && !b.seated ? {
               pips: all.map(q => ({ at: mid(q), k: q.k, brim: q.brim, spare: !!q.spare, top: q.top })),
               top: set.list.filter(c => c.top).reduce((s, c) => s + c.pips.length, 0),
               bottom: set.list.filter(c => !c.top).reduce((s, c) => s + c.pips.length, 0),
               plus: set.list.filter(c => c.plus).map(c => ({ n: c.plus.n, at: [c.plus.x, c.plus.y] })),
               block: { ...set.block } } : null,
             mark: KIT_MARK[p.job],
             // The seats, where a post has them: what each pip shows and
             // where its middle is (the specialists' counter first), for a
             // check to click.
             seats: seatsAt(p),
             pips: set && b.seated ? all.map(mid) : null,
             block: set && b.seated ? { ...set.block } : null,
             less: [b.less.x + b.less.w / 2, b.less.y + b.less.h / 2],
             more: [b.more.x + b.more.w / 2, b.more.y + b.more.h / 2] };
  }
}
