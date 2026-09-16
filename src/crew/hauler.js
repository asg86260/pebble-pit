// Carrying, which is the job with no station: the dust is wherever it fell, so
// somebody put on it is already at work. The longest job file because a hauler
// is the body the yard's own furniture happens to: the hole it tips into, the
// lip it may not walk over, the books it holds room in, and the loose core
// nobody else will pick up.

import { P, WORKER, CORE_SIZE, CORE_LOB_H, HAUL_EMPTY, HOME_AFTER } from '../config.js';
import { S, floor, pit, cut, rift } from '../state.js';
import { at, put, colOf, ageAt } from '../grid.js';
import { walkY } from '../world.js';
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
import { duck, stand, hireSpot, sideOf } from './body.js';
import { downTheHole, downTheCut, nearestCutDust, load, roomToTake, tookOne, bookRoom, unbook } from './hole.js';
import { takeMess } from './shovel.js';
import { strollTo, elbowIdle, amble, ROAM_PACE } from './idle.js';

export function newHauler() {
  // Feet on the ground from the first frame: a body put straight on to
  // another job is walked from wherever it stands, and a placeholder height
  // reads as climbing down out of the sky.
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

// The ground the crew fetch from: every column from the world's left edge to
// the near lip of the hole.
const lastCol = () => Math.max(0, colOf(floor, pit.x) - 1);

// Whether anything lies on the ground that nobody has set off for.
const anyDust = taken => {
  const last = lastCol();
  for (let c = 0; c <= last; c++) if (!taken.has(c) && at(floor, c, 0)) return true;
  return false;
};

// Where a trip starts, decided with empty hands: the column with something on
// it that is farthest from where the rest of the crew are or are headed
// (claim, or where they stand), ties to the column whose top grain has lain
// longest. One rule for everything on the ground, so the crew spread
// themselves over it; a rule about piles leaves the ground off every strip to
// nobody. Then the body takes what is nearest until its hands are full
// (`nextNear`) and walks home taking what it walks over. Chosen for how it
// reads, not what it banks (DESIGN.md "Farthest from the rest of the crew").
//
// Not across the footprint while the next rock is on its way: the columns
// under it are `taken` (step.js), and a target past it would be a stand at
// the edge until the rock is down (`holdTheLine`). The far side is the next
// trip's.
function firstPick(w, taken, zone) {
  const last = lastCol();
  const others = [];
  for (const o of S.workers) {
    if (o === w || o.type !== TYPE.HAUL) continue;
    others.push(o.claim >= 0 ? o.claim : colOf(floor, o.x));
  }
  const side = zone ? sideOf(zone, w.x) : 0;
  let best = -1, bestApart = -1, bestAge = Infinity;
  for (let c = 0; c <= last; c++) {
    if (taken.has(c) || !at(floor, c, 0)) continue;
    if (side && sideOf(zone, floor.x + c * P) !== side) continue;
    let apart = Infinity;
    for (const t of others) apart = Math.min(apart, Math.abs(c - t));
    if (apart < bestApart) continue;
    const a = ageAt(floor, c, topGrain(c));
    if (apart === bestApart && a >= bestAge) continue;
    best = c; bestApart = apart; bestAge = a;
  }
  return best;
}

// The column with something in it under a body's feet, the same span `seek`
// scoops from, or -1 over bare ground. Claimed or not, unless the claimant is
// nearer (`keptBy`). This is the whole of what a laden body decides: the
// target was picked with empty hands and a sweep home never turns round, or
// on a yard of single-grain finds "nearest next" flips direction every grain.
//
// `ahead` widens the look toward the lip by the stride about to be taken: on
// a slow frame or under a stew one stride is wider than the span under the
// feet, and a column could be crossed between two looks.
function underfoot(w, ahead = 0) {
  const last = lastCol();
  const lo = Math.max(0, colOf(floor, w.x - P)), hi = Math.min(last, colOf(floor, w.x + WORKER + ahead));
  for (let c = lo; c <= hi; c++) {
    if (!at(floor, c, 0) || keptBy(w, c)) continue;
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

// The nearest column with something in it to `bare`, the column just emptied,
// on any ground, or -1 when nothing is nearer than the walk home. A body with
// room in hand keeps taking what is nearest until its hands are full; held to
// its own strip it stepped over what the heap sheds past the edge. Nearer
// than the hole is the bound: further off is another trip's. Claimed or not,
// unless the claimant is nearer (`keptBy`).
function nextNear(w, bare, taken) {
  const last = lastCol();
  const reach = Math.floor(Math.abs(pit.x - w.x) / P);
  for (let d = 1; d <= reach; d++) {
    for (const c of [bare - d, bare + d]) {
      if (c < 0 || c > last || !at(floor, c, 0) || keptBy(w, c)) continue;
      return c;
    }
  }
  return -1;
}

// Whether another carter has set off for a column and is at least as near to
// it as this body: then it is theirs. A claim is a target for empty hands, so
// six bodies do not converge on one shard, not a reservation against the body
// already stood beside the column. Whoever is nearer keeps it: a claimant
// losing its target at the last stride stops on bare ground and turns, which
// reads as hesitating.
function keptBy(w, c) {
  const x = floor.x + c * P;
  const o = S.workers.find(o => o !== w && o.type === TYPE.HAUL && o.claim === c);
  return !!o && Math.abs(o.x - x) <= Math.abs(w.x - x);
}

// Taking a column on.
function claim(w, c, taken) {
  w.claim = c; taken.add(c);
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

  // Down the hole, and nothing else applies -- checked before the dodge: a
  // body on a ladder cannot go anywhere but up or down, and the dodge putting
  // it back on the ground line every other frame held it at the top for ever.
  // The patch it is going for is the same claim `takeMess` makes, made here
  // so the trip down the hole is made against it too: one patch, one body.
  if (!w.carry && !w.hasCore) {
    // Cleared and re-picked a frame apart, since the frame's set still
    // carries this body's own elbows -- and "a frame apart" has to hold across
    // the whole frame, or `takeMess` further down picks against those elbows
    // and the nearest allowed column is always a stride off. The mark is the
    // frame it was dropped on, so nothing has to clear it; a flag waited on
    // `takeMess` left a body out past the hole unable to pick again. Its own
    // kinds only: a gate on *all* mess sent it down to stand on what it could
    // not shift.
    if (w.muckAt != null && muckAtCol(w.muckAt, w) <= 0) { w.muckAt = null; w.muckDropped = now; }
    else if (w.muckAt == null && w.muckDropped !== now && muckFor(w) > 0) {
      const pick = nearestMuck(w.x + WORKER / 2, muckTaken, w);
      w.muckAt = pick == null ? null : Math.floor(pick / P);
    }
  }
  const patch = !w.carry && !w.hasCore && muckFor(w) > 0 && w.muckAt != null
    ? w.muckAt * P + P / 2 : null;

  // In the hole, over the hole, or on the ground beyond it: one question --
  // which way is the body on, and which way is its work on. A body on the
  // hole's own surface or on the strip past it is somewhere only a route
  // reaches; so is a patch of muck lying on either.
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
  // to going. A hauler already on the cut's floor keeps working it after its
  // claim runs out; one only on its way is caught by the claim alone. This
  // carries a real load booked against the pit, so it is not folded into
  // `away || through`: there is no unbooking it on the way past.
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

  // A rock coming down beats anything it was carrying or fetching. It keeps
  // its claim and picks the job up again on the far side.
  if (duck(w, zone)) { w.y = stand(w); return; }

  // The rock has landed and this one was dancing while it came down: put the
  // dance away before it walks off, or it carries the hop on to the next thing.
  if (w.jigAt != null && S.rockFall <= 0) stopJig(w);

  // A loose core first, then dust, then tip it all over the ledge.
  if ((w.goal === 'seek' || w.goal === 'idle') &&
      S.coreItem && S.coreItem.rest && !S.heldCore && !w.hasCore &&
      (!S.coreTaker || S.coreTaker === w) && bookRoom(w, 1) > 0) {
    S.coreTaker = w;
    if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }   // the core comes first
    const target = S.coreItem.x + CORE_SIZE / 2 - WORKER / 2;
    const pace = haulSpeed() * speedBoost(w) * HAUL_EMPTY;
    // A route, not a straight line: the core rests at the foot of the rock
    // and the next rock lands on the same spot, so a straight walk from the
    // far side goes through the hill at ground level.
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

  // The lip, and everybody stops at it. A route never offers a leg across
  // the opening (`ways`); the clamp is for the walks this file does by hand
  // (a stroll, a step toward a core, a nudge at an elbow), which know nothing
  // of ways. Which side is not remembered: it is the side the body stands on.
  if (!w.route) {
    if (here.key === 'past') { if (w.x < pit.x + pit.w) w.x = pit.x + pit.w; }
    else if (w.x > pit.x - WORKER) w.x = pit.x - WORKER;
  }
  w.y = stand(w);

  // There is no "no room" here: the hole takes everything, into the pile or
  // through the rift, so a body with a load always has somewhere to put it
  // (`pitFree` in hole.js).

  w.resting = false;
  if (w.goal !== 'idle' && w.goal !== 'home') w.idleSince = 0;

  // Muck comes first, and this is the one job that picks its shovel up here
  // rather than in the mess stage (`late` on the row): done only when there is
  // nothing else on, it is never done. Hands full is the exception: a load
  // put down to pick up a shovel is a trip wasted.
  if (takeMess(w, c)) return;
  haulerBack(w);                                   // the yard is clear

  // Fresh dust down the cut, before the yard's own: it is what keeps the
  // ladder trip working. One column, one hauler (`nearestCutDust`), and only
  // for empty hands with nothing claimed, so it never steals a load.
  if ((w.goal === 'seek' || w.goal === 'idle') && w.claim < 0 && !w.carry && !w.hasCore &&
      w.cutClaim == null && cut.n > (cut.rock || 0) && bookRoom(w) > 0) {
    const pick = nearestCutDust(w.x + WORKER / 2, cutTaken);
    // Acted on the same frame it is found, or a floor column picked below
    // could double up with it: two claims on one pair of hands.
    if (pick >= 0) { w.cutClaim = pick; cutTaken.add(pick); w.goal = 'cut'; return; }
  }

  if (w.goal === 'seek') {
    // It keeps the column it set off for until that column is bare; picking
    // the nearest afresh every frame is what makes the crew swarm.
    if (w.claim >= 0 && !at(floor, w.claim, 0)) {
      const bare = w.claim;
      taken.delete(w.claim); w.claim = -1;
      // The target was a place, not a column: with room in hand it keeps
      // taking the nearest thing until its hands are full, then turns for
      // home. Sent for one column, a far heap lost one column a trip.
      if (w.carry && w.carry < load(w)) {
        const next = nextNear(w, bare, taken);
        if (next >= 0) claim(w, next, taken);
      }
    }
    // A target is picked with empty hands only. Once anything is in hand the
    // trip has a shape, and its target being bare is the turn for home, not a
    // reason to pick again (the sweep home is the `dump` branch).
    if (w.claim < 0 && w.carry) { w.goal = 'dump'; return; }
    if (w.claim < 0) {
      // Book the hole before picking a column: nothing is fetched without
      // room for it, or a shard stays on the ground behind a full hole.
      if (roomToTake(w)) {
        const pick = firstPick(w, taken, zone);
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
      // Only if this trip booked room for it; a spent booking asks the hole
      // again, since room a dig opened while this body walked out is its to
      // take.
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
    // column; full hands walk straight to the lip. Nothing here turns it
    // round: what is behind it is the next trip's. A core goes straight in.
    // The column is found before the hole is asked, because a booking made
    // here is held to the lip and a body walking to tip should not hold room
    // it will not use.
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
        // Lobbed to a fixed peak on the same `aim` everything else is thrown
        // on. Not banked here: `stepCore` counts it when it touches the pile.
        const land = Math.min(far, pit.x + P * 2 + Math.abs(bell()) * (far - pit.x) * 0.45);
        const v = aim(from, up, land, CORE_SIZE, CORE_LOB_H);
        S.coreItem = { x: from - CORE_SIZE / 2, y: up, vx: v.vx, vy: v.vy, rest: false };
        w.hasCore = false;
        S.dirty = true;
      }
      for (let i = 0; i < w.carry; i++) {
        // Onto the pile: most near the lip, tailing down the hole. Into the
        // drain: at the disc, since with the rift open `riftCatch` takes every
        // grain at the mouth and a spread across a floor that is not there is
        // two motions. A little scatter either way, or grains on one pixel go
        // round in single file.
        const land = S.riftOpen && !S.drowned
          ? rift.x + rift.w / 2 + bell() * rift.w * 0.4
          : Math.min(far, pit.x + P * 2 + Math.abs(bell()) * (far - pit.x) * 0.45);
        // A hand's throw, not a nozzle's: the hands are a span and each grain
        // gets its own peak, so they land spread in time as well as place.
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
    if (anyDust(taken)) {
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
    // Nothing to fetch and nothing to carry: a spot to stroll to, a stand
    // about when they get there, then another.
    unbook(w);                  // idle hands hold no room
    if (anyDust(taken)) { w.goal = 'seek'; w.idleSince = 0; return; }

    // After a good while of nothing -- staggered, so they trickle off rather
    // than clocking out together -- a body goes home. Every one is back the
    // moment there is work.
    if (!w.idleSince) w.idleSince = now + HOME_AFTER * (0.6 + rand() * 0.9);
    if (!w.brk && now >= w.idleSince) { w.goal = 'home'; w.roamTo = null; return; }
    // Stood still between strolls is the only moment a hauler is allowed a
    // break: a body walking somewhere is on its way there.
    w.resting = w.roamTo === null || w.roamTo === undefined;
    if (w.roamTo === null || w.roamTo === undefined) {
      elbowIdle(w);                  // and not stood inside somebody
      // Feet on the ground even while stood still: a body put down mid-air by
      // anything at all would otherwise rest there, hanging.
      w.y = stand(w);
      // and it stays put while it is having one
      if (!w.brk && now >= (w.restUntil || 0)) w.roamTo = strollTo(w);
    } else {
      // its own legs, and they get going and slow down rather than switching
      // on and off (`amble`)
      const stride = w.x;
      const there = amble(w, w.roamTo, haulSpeed() * ROAM_PACE * (w.amble || 1));
      // Feet on the ground it is strolling over: the roam moves x and leaves y
      // where the last job put it.
      w.y = stand(w);
      // A stroll does not stride off a cliff: a step that leaves the feet
      // hanging more than two cells over the ground is given back. Here, not
      // in the climber -- working walks legitimately drop down ramps and lips
      // and their length is a tested promise; a roam has nowhere to be.
      if (standTop(w.x, rockTop) - (w.y + WORKER) > P * 2) { w.x = stride; w.pace = 0; }
      if (there) {
        w.roamTo = null;
        // and its own patience about standing there afterwards
        w.restUntil = now + (500 + rand() * 3000) * (w.linger || 1);
      }
    }
  }
}

// The whole yard is a hauler's to shovel, and when there is none left the body
// goes back to standing about. Named rather than written into the registry row
// because `haulerWork` calls it itself (`late` on the row).
export function haulerBack(w) {
  if (w.goal === 'muck') { w.goal = 'idle'; w.muckAt = null; }
}
