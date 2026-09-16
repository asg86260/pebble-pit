// Carrying, which is the job with no station: the dust is wherever it fell, so
// somebody put on it is already at work. A hauler is the body the yard's own
// furniture happens to: the hole it tips into, the lip it may not walk over,
// the books it holds room in, and the loose core nobody else will pick up.

import { P, WORKER, CORE_SIZE, CORE_LOB_H, HAUL_EMPTY, HOME_AFTER,
         PILE_LIMIT, HAUL_FIFO } from '../config.js';
import { S, floor, pit, cut, rift } from '../state.js';
import { at, put, colOf, ageAt } from '../grid.js';
import { walkY, yardLeft, pileAt } from '../world.js';
import { ways, wayAt, wayOver, standTop, rockTop, keepTo, stepRoute } from '../route.js';
import { spawnChip, bell, aim } from '../dust.js';
import { TOSS_RISE, TOSS_RISE_VARY, TOSS_SPREAD } from '../config.js';
import { muckAtCol, muckFor, nearestMuck } from '../smog.js';
import { haulSpeed, scoopMs, homePace } from '../upgrades.js';
// the stew on a hauler's legs, read per body at every haul walk
import { speedBoost } from '../apothecary.js';
import { TYPE } from '../jobs.js';
import { frames } from '../clock.js';
import { rand } from '../rng.js';
import { stopJig } from './dance.js';
import { duck, stand, hireSpot } from './body.js';
import { downTheHole, downTheCut, nearestCutDust, load, roomOnBoard,
         roomToTake, tookOne, bookRoom, unbook } from './hole.js';
import { takeMess } from './shovel.js';
import { strollTo, elbowIdle, ROAM_PACE } from './idle.js';

export function newHauler() {
  // Feet on the ground from the first frame: a body put straight back on to
  // another job is walked from wherever it is standing, and a placeholder
  // height reads as climbing down out of the sky.
  const { x } = hireSpot();
  return {
    type: TYPE.HAUL, x, y: walkY(x + WORKER / 2),
    carry: 0, next: 0, goal: 'seek', claim: -1, cutClaim: null, roamTo: null,
    // Its own legs and its own patience, so six idle bodies are not a marching
    // band.
    amble: 0.7 + rand() * 0.6,
    linger: 0.6 + rand() * 1.3
  };
}

// The nearest column of dust that nobody else has set off for. One column, one
// worker, or the whole line turns round for a single grain behind them.
function nearestDust(x, taken) {
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  // The near end is where the crew stop walking, not where the ground stops:
  // a body held at `yardLeft` cannot stand on a column past it, and booked one
  // it stands at the end of its span for the rest of the run. What lies out
  // there is yours to sweep up.
  const first = Math.max(0, Math.min(last, colOf(floor, yardLeft())));
  const from = Math.max(first, Math.min(last, colOf(floor, x)));
  for (let d = 0; d <= last; d++) {
    for (const c of [from - d, from + d]) {
      // Anything in a column is worth fetching, barred or not: a shard set
      // down at the plots should still be got.
      if (c < first || c > last || taken.has(c)) continue;
      if (at(floor, c, 0)) return c;
    }
  }
  return -1;
}

// A find is one grain worth a whole shard, so it is worth crossing the yard
// for ahead of the nearest dust. `served` is the grounds somebody is already
// off fetching a find from; one on those is passed over for a ground nobody
// serves, or the farm's finds (dripped beside the walk) win on distance every
// time and the quarry's lie there for hours.
function nearestMark(w, taken, served = EMPTY) {
  let best = -1, bestD = Infinity;
  // The same two bounds `nearestDust` keeps: a body cannot cross the hole or
  // stand past the near end, and a find beyond either is stood at the edge for
  // ever.
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  const first = Math.max(0, Math.min(last, colOf(floor, yardLeft())));
  for (const m of S.floorMarks) {
    const c = colOf(floor, m.x);
    if (c < first || c > last || taken.has(c) || !at(floor, c, 0)) continue;
    if (served.has(groundOf(m.x))) continue;
    const d = Math.abs(m.x - w.x);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}
const EMPTY = new Set();

// Which ground a find is lying on: the strip its column falls in, or the open
// yard for one that has rolled off a strip.
const groundOf = x => pileAt(x)?.key || 'yard';

// The grounds somebody is already off fetching a find from.
const servedGrounds = () => {
  const s = new Set();
  for (const o of S.workers) if (o.type === TYPE.HAUL && o.forMark) s.add(o.forMark);
  return s;
};

// A pile that fills stops the station behind it; a find on the ground stops
// nothing. Three quarters rather than full, because full is already too late.
const BACKED_UP = 0.75;
// Per heap, not "any heap": a full quarry heap is a reason to fetch shards
// sooner, not to walk past them carrying grit, and a ram keeps the rock's
// pile full for the whole run.
const backedUp = key =>
  (S.pileCount[key] || 0) >= (PILE_LIMIT[key] || Infinity) * BACKED_UP;
// For the pile mark and the stand-down rules, which are about a station
// having nowhere to put what it makes.
export const anyBackedUp = () => S.piles.some(p => backedUp(p.key));

// The heap that most needs the next pair of hands, and the nearest thing on it
// nobody has set off for, or -1 when no heap is backing up.
//
// Fullness against the heap's own limit, because the limit is what stops the
// station (the quarry's strip is a quarter the rock's). Less the armfuls
// already on their way, or the whole crew reads the same fullest heap and
// sets off as a convoy. And per pixel of the round trip, so bodies go to the
// near heap until enough armfuls are coming to bring it under the line and
// the rest walk to the far one; the empty leg is quicker by `HAUL_EMPTY`.
function fullestHeap(w, taken) {
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  const first = Math.max(0, Math.min(last, colOf(floor, yardLeft())));
  const coming = armfulsComing(w);
  let best = -1, bestScore = -1;
  for (const p of S.piles) {
    const r = ((S.pileCount[p.key] || 0) - (coming.get(p.key) || 0)) / (PILE_LIMIT[p.key] || Infinity);
    if (r < BACKED_UP) continue;
    const mid = (p.from + p.to) / 2;
    const score = r / (Math.abs(w.x - mid) / HAUL_EMPTY + Math.abs(pit.x - mid));
    if (score <= bestScore) continue;
    // The strip's columns, held to the ground the crew can stand on.
    const lo = Math.max(first, colOf(floor, p.from));
    const hi = Math.min(last, colOf(floor, p.to) - 1);
    if (lo > hi) continue;
    const from = Math.max(lo, Math.min(hi, colOf(floor, w.x)));
    for (let d = 0; d <= hi - lo && bestScore < score; d++) {
      for (const c of [from - d, from + d]) {
        if (c < lo || c > hi || taken.has(c) || !at(floor, c, 0)) continue;
        best = c; bestScore = score; break;
      }
    }
  }
  return best;
}

// The grains already spoken for on each heap by carters with a claim on it.
// Only claims count: a body walking home has already taken its load off.
function armfulsComing(w) {
  const m = new Map();
  for (const o of S.workers) {
    if (o === w || o.type !== TYPE.HAUL || o.claim < 0) continue;
    const key = pileAt(o.claim * P + P / 2)?.key;
    if (key) m.set(key, (m.get(key) || 0) + load(o));
  }
  return m;
}

// Whether a column is one of the finds lying about, so a body that has gone for
// one can be told apart from a body shifting grit.
const isMark = c => S.floorMarks.some(m => colOf(floor, m.x) === c);

// Where a trip starts, decided with empty hands: a find, then the fullest
// jammed heap, then the nearest dust, each the next one's fallback.
//
// A find first, but while a heap is jammed only one body per ground with a
// find waiting: a switch either way is wrong (all on dust and the other
// grounds are never fetched; all on finds and the rock stands on its own heap
// most of a run), and one body for the whole yard takes the farm's find every
// time. Everybody else goes to the fullest heap, not the nearest dust, which
// to a body coming off the hole is always the rock's.
function firstPick(w, taken) {
  if (HAUL_FIFO) return oldestDust(taken);
  const dust = nearestDust(w.x, taken);
  const heap = fullestHeap(w, taken);
  const served = heap >= 0 ? servedGrounds() : EMPTY;
  // A served ground's find is the last fallback of all, not dropped.
  const mark = nearestMark(w, taken, served);
  return mark >= 0 ? mark : heap >= 0 ? heap : dust >= 0 ? dust : nearestMark(w, taken);
}

// First in, first out across the whole yard: nothing is ever starved, at the
// price of the walk (`HAUL_FIFO`).
function oldestDust(taken) {
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  const first = Math.max(0, Math.min(last, colOf(floor, yardLeft())));
  let best = -1, bestAge = Infinity;
  for (let c = first; c <= last; c++) {
    if (taken.has(c) || !at(floor, c, 0)) continue;
    const a = ageAt(floor, c, 0);
    if (a < bestAge) { bestAge = a; best = c; }
  }
  return best;
}

// The column with something in it under a body's feet, the same span `seek`
// scoops from, or -1 over bare ground.
//
// Claimed or not, unless the claimant is nearer: a claim is a target for empty
// hands setting off, not a reservation against the body already stood over
// the column, but taken out from under a claimant at its last stride the
// claimant stops, re-picks and turns, which reads as hesitating. This is the
// whole of what a laden body decides: the target was picked with empty hands
// and a sweep home never turns round.
//
// `ahead` widens the look toward the lip by the stride about to be taken: on
// a slow frame or under a stew one stride is wider than the span under the
// feet, and a column could be crossed between two looks.
function underfoot(w, ahead = 0) {
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  const first = Math.max(0, Math.min(last, colOf(floor, yardLeft())));
  const lo = Math.max(first, colOf(floor, w.x - P)), hi = Math.min(last, colOf(floor, w.x + WORKER + ahead));
  for (let c = lo; c <= hi; c++) {
    if (!at(floor, c, 0)) continue;
    const x = floor.x + c * P;
    const owner = S.workers.find(o => o !== w && o.type === TYPE.HAUL && o.claim === c);
    if (owner && Math.abs(owner.x - x) <= Math.abs(w.x - x)) continue;
    return c;
  }
  return -1;
}

// One grain off the top of a column and into the hands. Dust or find, the
// same take; the booking has already said yes.
function scoop(w, c, now) {
  const r = topGrain(c);
  if (r < 0) return false;
  (w.load ||= []).push(at(floor, c, r));
  put(floor, c, r, 0);
  w.carry++;
  tookOne(w);
  w.next = now + scoopMs();
  S.dirty = true;
  return true;
}

// The nearest unclaimed column with something in it on the same strip as
// `bare`, the column just emptied, or -1 when `bare` was not on a strip or
// the strip has nothing left.
function nextOnStrip(w, bare, taken) {
  const strip = pileAt(floor.x + bare * P);
  if (!strip) return -1;
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  const first = Math.max(0, Math.min(last, colOf(floor, yardLeft())));
  const lo = Math.max(first, colOf(floor, strip.from));
  const hi = Math.min(last, colOf(floor, strip.to) - 1);
  for (let d = 1; d <= hi - lo; d++) {
    for (const c of [bare - d, bare + d]) {
      if (c < lo || c > hi || taken.has(c)) continue;
      if (at(floor, c, 0)) return c;
    }
  }
  return -1;
}

// Taking a column on. Which ground it was a find on is remembered on the
// trip, not the column: the column stops being a find the moment it is picked
// up.
function claim(w, c, taken) {
  w.claim = c; taken.add(c);
  w.forMark = isMark(c) ? groundOf(floor.x + c * P) : false;
}

// the columns already spoken for this frame
export function claims() {
  const taken = new Set();
  for (const w of S.workers) if (w.type === TYPE.HAUL && w.claim >= 0) taken.add(w.claim);
  return taken;
}

export function topGrain(c) {
  for (let r = floor.rows - 1; r >= 0; r--) if (at(floor, c, r)) return r;
  return -1;
}

export function haulerWork(w, c) {
  const { now, zone, taken, muckTaken, cutTaken } = c;

  // Down the hole, and nothing else applies. Checked before everything,
  // including the dodge: a body on a ladder inside the pit is not where a
  // rock can land, and the dodge lifting it back to the ground line every
  // other frame holds it at the top of the ladder for ever.
  //
  // Which patch it is going for is the same claim `takeMess` makes, made here
  // so the trip down the hole is made against it too: one patch, one body, in
  // the hole as much as out of it.
  if (!w.carry && !w.hasCore) {
    // Cleared and re-picked a frame apart, because the frame's set still
    // carries this body's own elbows. The mark is the frame it was dropped on,
    // so it holds against `takeMess` further down the same frame and needs
    // nobody to clear it (a body out past the hole never reaches `takeMess`).
    // Its own kinds (`muckFor`) in both the release and the gate: a hauler may
    // not touch a body's mess, and gated on all mess it goes down to stand on
    // what it cannot shift.
    if (w.muckAt != null && muckAtCol(w.muckAt, w) <= 0) { w.muckAt = null; w.muckDropped = now; }
    else if (w.muckAt == null && w.muckDropped !== now && muckFor(w) > 0) {
      const pick = nearestMuck(w.x + WORKER / 2, muckTaken, w);
      w.muckAt = pick == null ? null : Math.floor(pick / P);
    }
  }
  const patch = !w.carry && !w.hasCore && muckFor(w) > 0 && w.muckAt != null
    ? w.muckAt * P + P / 2 : null;

  // In the hole, over the hole, or on the ground beyond it: all one question,
  // which way is the body on and which way is its work on. Both are places
  // only a route reaches.
  const all = ways();
  const here = wayAt(w.x, w.y, all);
  const on = patch == null ? null : wayOver(patch - WORKER / 2, all);
  const away = here.key === 'hole' || here.key === 'past';
  const through = on != null && (on.key === 'hole' || on.key === 'past');

  if (away || through) {
    if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
    unbook(w);
    w.goal = 'muck';
    downTheHole(w, through ? patch : null);
    return;
  }

  // Down the cut, the same shape of question: still down there, or committed
  // to going. A hauler on the cut's floor keeps working it after its claim
  // runs out. Not folded into `away || through` because this carries a real
  // load booked against the pit, and there is no unbooking it on the way past.
  if (here.key === 'cut' || w.cutClaim != null) {
    if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
    const fetching = w.cutClaim != null && roomToTake(w);
    w.goal = 'cut';
    downTheCut(w, fetching ? w.cutClaim : null);
    if (!fetching) {
      w.cutClaim = null;
      if (wayAt(w.x, w.y, all).key === 'yard') w.goal = w.carry ? 'dump' : 'idle';
    }
    return;
  }

  // a rock coming down beats anything it was carrying or fetching. It keeps its
  // claim and picks the job up again on the far side.
  if (duck(w, zone)) { w.y = stand(w); return; }

  // The rock has landed: put the dance away before it walks off, or it carries
  // the hop and the shout on to the next thing it does.
  if (w.jigAt != null && S.rockFall <= 0) stopJig(w);

  // fetch a loose core if there is one, else scoop dust, then tip it all
  // over the ledge
  if ((w.goal === 'seek' || w.goal === 'idle') &&
      S.coreItem && S.coreItem.rest && !S.heldCore && !w.hasCore &&
      (!S.coreTaker || S.coreTaker === w) && bookRoom(w, 1) > 0) {
    S.coreTaker = w;
    if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }   // the core comes first
    const target = S.coreItem.x + CORE_SIZE / 2 - WORKER / 2;
    const pace = haulSpeed() * speedBoost(w) * HAUL_EMPTY;
    // A route, not a straight line: the core rests at the foot of the rock,
    // and a mover that moves x and leaves y walks through the hill.
    if (Math.abs(target - w.x) >= P * 2) {
      if (!keepTo(w, target, wayOver(target, all))) { S.coreTaker = null; return; }
      if (stepRoute(w, pace)) return;
      w.route = null;
    }
    if (Math.abs(target - w.x) < P * 2) {
      S.coreItem = null;
      S.coreTaker = null;
      w.hasCore = true;
      tookOne(w);                            // a core is a grain of the hole too
      w.goal = 'dump';
      S.dirty = true;
    }
    return;
  }

  // The lip, and everybody stops at it. A route never offers a leg across the
  // opening (`ways` in route.js); the clamp is for the walks this file does
  // by hand -- a stroll, a step toward a core, a nudge at an elbow -- which
  // know nothing of ways. The side is the one the body is standing on.
  if (!w.route) {
    if (here.key === 'past') { if (w.x < pit.x + pit.w) w.x = pit.x + pit.w; }
    else if (w.x > pit.x - WORKER) w.x = pit.x - WORKER;
  }
  w.y = stand(w);

  // There is no "no room" here: the hole takes everything, into the pile or
  // through the rift (`pitFree` in hole.js).

  w.resting = false;
  if (w.goal !== 'idle' && w.goal !== 'home') w.idleSince = 0;

  // Muck comes first, and this is the one job that picks its shovel up here
  // rather than in the mess stage (see `late` on the row): there is always
  // dust to fetch, so a mess left for spare moments is never cleared. Hands
  // full is the exception: a load put down to pick up a shovel is a trip
  // wasted.
  if (takeMess(w, c)) return;
  haulerBack(w);                                   // the yard is clear

  // Fresh dust down the cut, worth a look before the yard's own. Only for a
  // body with empty hands and nothing claimed, so it never steals a load that
  // is already somebody's.
  if ((w.goal === 'seek' || w.goal === 'idle') && w.claim < 0 && !w.carry && !w.hasCore &&
      w.cutClaim == null && cut.n > (cut.rock || 0) && bookRoom(w) > 0) {
    const pick = nearestCutDust(w.x + WORKER / 2, cutTaken);
    // Acted on the same frame it is found, or a floor column picked below
    // doubles up with it: two claims on one pair of hands.
    if (pick >= 0) { w.cutClaim = pick; cutTaken.add(pick); w.goal = 'cut'; return; }
  }

  if (w.goal === 'seek') {
    // It keeps the column it set off for until that column is bare. Picking
    // the nearest one afresh every frame is what makes the crew swarm.
    if (w.claim >= 0 && !at(floor, w.claim, 0)) {
      const bare = w.claim;
      taken.delete(w.claim); w.claim = -1; w.forMark = false;
      // The target was a heap, not a column: a body sent to a jammed heap
      // works along it until its hands are full or the heap is bare. Sent for
      // one column it fills the rest of its hands from the rock's heap on the
      // sweep back, and the jammed heap loses one column a trip. The next
      // column is on the same strip, a shuffle along and never a turn across
      // the yard; a find off a strip goes straight to the sweep.
      if (w.carry && w.carry < load(w)) {
        const next = nextOnStrip(w, bare, taken);
        if (next >= 0) claim(w, next, taken);
      }
    }
    // A target is picked with empty hands and only then: a bare target with
    // something in hand is the turn for home, not a reason to pick again.
    if (w.claim < 0 && w.carry) { w.goal = 'dump'; return; }
    if (w.claim < 0) {
      // Book the hole before picking a column: nothing is fetched without room
      // for it.
      if (roomToTake(w)) {
        const pick = firstPick(w, taken);
        if (pick >= 0) claim(w, pick, taken);
      }
    }
    if (w.claim < 0) { w.goal = 'idle'; return; }
    const col = w.claim;
    const target = floor.x + col * P;
    // hands free, so it moves; a load is what slows it down
    const pace = haulSpeed() * speedBoost(w) * HAUL_EMPTY;
    w.x += Math.sign(target - w.x) * Math.min(pace * frames(), Math.abs(target - w.x));
    // It scoops what is under it, not what its left edge is exactly on: the
    // last two columns before the lip sit further right than a worker may
    // stand.
    const under = target >= w.x - P && target <= w.x + WORKER;
    if (under && now >= w.next && topGrain(col) >= 0) {
      // Only with room booked for it; a spent booking asks the hole again
      // before giving up.
      if (roomToTake(w)) scoop(w, col, now);
      else {
        // the booking is used up: this trip is done
        taken.delete(col);
        w.claim = -1;
        w.goal = w.carry ? 'dump' : 'idle';
        return;
      }
    }
    if (w.carry >= load(w)) {                  // a cart holds twice
      if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
      w.goal = 'dump';
    }
  } else if (w.goal === 'dump') {
    // Home along the ground, and everything on the way comes too, column by
    // column. Nothing here turns it round: what is behind it is the next
    // trip's. A core is the one load that goes straight in. The column is
    // found before the hole is asked, so a body walking to tip is not holding
    // room it will not use.
    const target = pit.x - WORKER;                 // the lip, where they can stand
    let stride = Math.min(haulSpeed() * speedBoost(w) * frames(), Math.abs(target - w.x));
    if (!w.hasCore && w.carry < load(w)) {
      const c = underfoot(w, stride);
      const under = c >= 0 && floor.x + c * P <= w.x + WORKER;
      if (under && roomToTake(w)) {
        if (now >= w.next) scoop(w, c, now);
        return;                                // stood over it until it is bare
      }
      // Within the stride but not under the feet yet: the step ends on it,
      // so nothing is walked over between one look and the next.
      if (c >= 0) stride = Math.min(stride, Math.max(0, floor.x + c * P - w.x));
    }
    w.x += Math.sign(target - w.x) * stride;
    if (Math.abs(target - w.x) < P) {
      // A toss off the lip, aimed at the hole the way spoil is aimed at a
      // pile: a fixed spray sails over the far wall of a narrow pit.
      const from = w.x + WORKER / 2, up = S.groundY - WORKER - P;
      const far = pit.x + Math.max(P, pit.w - P * 2);
      if (w.hasCore) {
        // Lobbed on the same arc as the dust, to a fixed peak. Not banked
        // here: `stepCore` counts it the moment it touches the pile.
        const land = Math.min(far, pit.x + P * 2 + Math.abs(bell()) * (far - pit.x) * 0.45);
        const v = aim(from, up, land, CORE_SIZE, CORE_LOB_H);
        S.coreItem = { x: from - CORE_SIZE / 2, y: up, vx: v.vx, vy: v.vy, rest: false };
        w.hasCore = false;
        S.dirty = true;
      }
      for (let i = 0; i < w.carry; i++) {
        // Onto the pile, most of it near the lip and tailing away down the
        // hole; or, with the rift open and no pile, at the disc, so the arc and
        // the swirl are one movement instead of a fan dragged back to a point.
        // A little scatter either way: grains landing on one pixel go round in
        // single file.
        const land = S.riftOpen && !S.drowned
          ? rift.x + rift.w / 2 + bell() * rift.w * 0.4
          : Math.min(far, pit.x + P * 2 + Math.abs(bell()) * (far - pit.x) * 0.45);
        // A hand's throw, not a nozzle's: a span rather than a point, and each
        // grain its own peak, so they land spread in time as well as place.
        const fx = from + (rand() - 0.5) * TOSS_SPREAD;
        const fy = up - rand() * P;
        const rise = TOSS_RISE * (1 + bell() * TOSS_RISE_VARY);
        const v = aim(fx, fy, land, P, rise);
        spawnChip(fx, fy, v.vx, v.vy, w.load?.[i] || 1);
      }
      w.stored = (w.stored || 0) + w.carry;
      w.carry = 0;
      w.load = [];
      unbook(w);                             // the room it booked is spent
      w.goal = 'seek';
      S.dirty = true;
    }
  } else if (w.goal === 'home') {
    // Knocked off: it walks to the door it was hired out of and goes in, and
    // the moment there is dust on the ground it comes straight back out.
    w.resting = false;
    if (nearestDust(w.x, taken) >= 0) {
      w.inside = false;
      w.goal = 'seek';
      return;
    }
    unbook(w);
    if (w.inside) return;                      // in out of it, and nothing to watch
    const door = hireSpot().x;
    w.x += Math.sign(door - w.x) * Math.min(homePace() * frames(), Math.abs(door - w.x));
    w.y = stand(w);
    if (Math.abs(door - w.x) < 1) { w.inside = true; w.x = door; S.dirty = true; }
  } else {
    // Nothing to fetch and nothing to carry: they amble, a spot to stroll to
    // and a stand about when they get there, so a yard at rest reads as at
    // rest rather than switched off.
    unbook(w);                  // idle hands hold no room
    if (nearestDust(w.x, taken) >= 0) { w.goal = 'seek'; w.idleSince = 0; return; }

    // After a good while of nothing to carry, staggered so they trickle off
    // rather than clocking out together, a body goes home. It is back the
    // moment there is work.
    if (!w.idleSince) w.idleSince = now + HOME_AFTER * (0.6 + rand() * 0.9);
    if (!w.brk && now >= w.idleSince) { w.goal = 'home'; w.roamTo = null; return; }
    // Stood still between strolls is the only moment a hauler is allowed a
    // break: a body walking somewhere is on its way there.
    w.resting = w.roamTo === null || w.roamTo === undefined;
    if (w.roamTo === null || w.roamTo === undefined) {
      elbowIdle(w);                  // and not stood inside somebody
      // Feet on the ground even while stood still, or a body put down mid-air
      // rests there hanging.
      w.y = stand(w);
      // and it stays put while it is having one
      if (!w.brk && now >= (w.restUntil || 0)) w.roamTo = strollTo(w);
    } else {
      const d = w.roamTo - w.x;
      // its own legs, not everybody's
      const stride = w.x;
      w.x += Math.sign(d) * Math.min(haulSpeed() * ROAM_PACE * (w.amble || 1) * frames(), Math.abs(d));
      // feet on the ground it is strolling over, or a body on the crest
      // strolls off the edge at crest height
      w.y = stand(w);
      // A stroll does not stride off a cliff: a step that leaves the feet
      // hanging more than a couple of cells is given back. HERE and not in the
      // climber, because working walks legitimately drop down ramps and lips
      // and a roam has nowhere to be.
      if (standTop(w.x, rockTop) - (w.y + WORKER) > P * 2) w.x = stride;
      if (Math.abs(d) < 1) {
        w.roamTo = null;
        // and its own patience about standing there afterwards
        w.restUntil = now + (500 + rand() * 3000) * (w.linger || 1);
      }
    }
  }
}

// The whole yard is a hauler's to shovel, and with none left the body goes
// back to standing about. Named because `haulerWork` calls it itself (see
// `late` on the row).
export function haulerBack(w) {
  if (w.goal === 'muck') { w.goal = 'idle'; w.muckAt = null; }
}
