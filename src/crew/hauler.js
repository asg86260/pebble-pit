// Carrying, which is the job with no station: the dust is wherever it fell, so
// somebody put on it is already at work.
//
// It is much the longest of them, because a hauler is the body the yard's own
// furniture happens to: the hole it tips into, the lip it may not walk over, the
// books it holds room in, and the loose core nobody else will pick up.

import { P, WORKER, CORE_SIZE, CORE_LOB_H, HAUL_EMPTY, HOME_AFTER } from '../config.js';
import { S, floor, pit, cut, rift } from '../state.js';
import { at, put, colOf, ageAt } from '../grid.js';
import { walkY, pileAt } from '../world.js';
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
  // Its feet are on the ground from the first frame. Every other job's step
  // function puts a new body down before anything looks at it, but a body put
  // straight back on to another job is walked from wherever it is standing --
  // and a placeholder height reads as one that has to climb down out of the sky.
  const { x } = hireSpot();
  return {
    type: TYPE.HAUL, x, y: walkY(x + WORKER / 2),
    carry: 0, next: 0, goal: 'seek', claim: -1, cutClaim: null, roamTo: null,
    // Its own legs and its own patience, for when it has nowhere to be. Six
    // bodies strolling at exactly one speed and standing about for exactly one
    // length of time is a marching band, not a yard at rest -- and it is the
    // same trick every other job here already uses to stop a gang reading as one
    // animation played six times.
    amble: 0.7 + rand() * 0.6,
    linger: 0.6 + rand() * 1.3
  };
}

// The ground the crew fetch from: every column of the floor from the world's
// left edge to the near lip of the hole. It used to stop at the first heap,
// and what lay past that -- a grain thrown out left of the tower, a bird's
// shedding -- was the player's to sweep up; the farm's hands and the tower's
// crew already stand out there, and a grain a body can walk to is a grain it
// fetches.
const lastCol = () => Math.max(0, colOf(floor, pit.x) - 1);

// Whether anything lies on the ground that nobody has set off for.
const anyDust = taken => {
  const last = lastCol();
  for (let c = 0; c <= last; c++) if (!taken.has(c) && at(floor, c, 0)) return true;
  return false;
};

// Where a trip starts, decided with empty hands: whatever lies farthest from
// where the rest of the crew are headed.
//
// One rule for everything on the ground -- a heap, a heap's spill past the
// end of its strip, a find, a grain thrown out past the tower -- rather than
// a rule about piles with the rest of the ground as a special case. Each
// other carter is somewhere or on its way somewhere (its claim, or where it
// stands); the next body's target is the column with something on it that
// is farthest from the nearest of those, ties to the column whose top grain
// has lain longest. So the crew spread themselves over the ground: the
// second body does not go where the first is going, the sixth goes where
// the other five are not, and a lone grain out past the tower is exactly
// the place nobody else is. Then the body takes what is nearest until its
// hands are full (`nextNear`) and walks home taking what it walks over.
//
// This is the rule chosen for how it reads, not for what it banks
// (2026-09-15, DESIGN.md "Farthest from the rest of the crew"). Every rule
// before it was about piles -- the nearest dust, the fullest heap, the heap
// with the fewest hands headed for it -- and each left the crew stood on
// one heap while the rest of the ground waited, or left the ground off
// every strip to nobody. Oldest-first alone was tried on the way here and
// drains one heap at a time. The bench reads each resource's own rate, not
// the total (`tools/node/carters.mjs`).
function firstPick(w, taken) {
  const last = lastCol();
  const others = [];
  for (const o of S.workers) {
    if (o === w || o.type !== TYPE.HAUL) continue;
    others.push(o.claim >= 0 ? o.claim : colOf(floor, o.x));
  }
  let best = -1, bestApart = -1, bestAge = Infinity;
  for (let c = 0; c <= last; c++) {
    if (taken.has(c) || !at(floor, c, 0)) continue;
    let apart = Infinity;
    for (const t of others) apart = Math.min(apart, Math.abs(c - t));
    if (apart < bestApart) continue;
    const a = ageAt(floor, c, topGrain(c));
    if (apart === bestApart && a >= bestAge) continue;
    best = c; bestApart = apart; bestAge = a;
  }
  return best;
}

// The column with something in it under a body's feet, if there is one -- the
// same span `seek` scoops from, a cell either side of where it stands. -1 when
// it is walking over bare ground.
//
// Claimed or not -- unless the claimant is nearer to it than this body is. A
// claim is a target, and a target is for empty hands setting off across the
// yard: it is what stops six bodies converging on one shard. It is not a
// reservation against the body already stood over the column: a grain the
// rock had just thrown down beside a laden body walking home was claimed by an
// empty body at the far end of the yard, and the laden one stepped over it and
// left it for a walk of eight hundred pixels. So the body on the spot takes
// it, and the claimant sees its column bare and picks again.
//
// But not out from under a claimant that is about to arrive. Taken at the last
// stride, the claimant stops on a bare column, picks again and turns, and read
// from across the yard that is a body hesitating. Whoever is nearer keeps it:
// a claimant losing its target early has most of its walk still ahead and the
// re-pick is a small course change; one losing it at the end has nothing.
//
// This is the whole of what a laden body decides. The trip's target was
// picked with empty hands (`firstPick`) and it is not re-argued grain by grain:
// from the target the body walks home and takes what it walks over, and that
// is all. It used to go for whatever was nearest next, and on a yard of
// single-grain finds "nearest" flips direction every grain: a body took a
// spark, turned for a crop, turned back for a spark, and read as lost. A
// sweep home never turns round, so what it does is legible from across the
// yard: out to the thing it went for, back with everything on the way.
//
// `ahead` widens the look by that many pixels toward the lip, for the stride
// the body is about to take: a step is `frames()` long, so on a slow frame or
// under a stew one stride is wider than the span under the feet, and a
// column could be crossed between two looks. Found within the stride, the
// step is shortened to land on it -- see the walk home.
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

// The nearest column with something in it to `bare`, the column just
// emptied, that nobody else has set off for, on any ground -- a heap's own
// spill on the bare ground beside its strip, a grain that rolled, the next
// heap along -- or -1 when there is nothing nearer than the walk home. A body
// with room in hand keeps taking what is nearest until its hands are full:
// held to its own strip it stepped over the grains a heap sheds past the edge
// of its strip, and those lay there for good. Nearer than the hole is the
// bound: a grain closer than the lip is a small detour or on the way, one
// further off is another trip's. Held to the near lip of the hole, as
// everything a carter fetches is.
//
// Claimed or not, unless the claimant is nearer -- the same rule the sweep
// home keeps (`keptBy`). A claim is for empty hands setting off across the
// yard; held against the body already stood beside the column, a body ran
// out to a cluster of three, took one, and turned for home while another
// walked the length of the yard for the two beside it.
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
// six bodies do not converge on one shard; it is not a reservation against
// the body already stood beside the column. Whoever is nearer keeps it: a
// claimant losing its target early has most of its walk ahead and the re-pick
// is a small course change, where one losing it at the last stride stops on
// bare ground and turns, which reads as hesitating.
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

  // Down the hole, and nothing else applies.
  //
  // This is checked before everything, including the dodge -- a body on a
  // ladder inside the pit is not standing where a rock can land on it, and it
  // cannot go anywhere but up or down anyway. It was in the middle of the
  // hauler's decisions to begin with, under the dodge, and the dodge put it
  // back on the ground line every other frame: the climb pushed it two pixels
  // down the ladder, the dodge lifted it two back, and the pair of them held it
  // at the top of the ladder for ever, taking turns.
  // Which patch this one is going for -- the same claim `takeMess` makes, made
  // here so that the trip down the hole is made against it too. It used to ask
  // for the nearest muck outright, claims and all ignored, so every hauler in
  // the yard worked out the same patch in the bottom of the hole, went down
  // for it together and stood in one another on the one column until it was
  // gone. One patch, one body, in the hole as much as out of it.
  if (!w.carry && !w.hasCore) {
    // Cleared and re-picked a frame apart, for the reason takeMess gives: the
    // frame's set still carries this body's own elbows.
    // Its own kinds, in both the release and the gate: a hauler may not touch
    // a body's mess, and a gate on *all* mess sent it down for what it could
    // not shift, to stand on it.
    // "A frame apart" has to hold across the whole frame: this branch let the
    // column go and did not pick, and then `takeMess`, further down the same
    // frame, saw empty hands and picked -- against the set built at the top of
    // the frame with this body's own elbows still in it, so the nearest column
    // it was allowed was always a stride off. A lone hauler between two heaps
    // hopped from one to the other and back (docs/critics-2026-09-10.md, A9).
    // The mark is the frame it was dropped on, so it needs nobody to clear it:
    // a flag that waited for `takeMess` to clear it left a body out past the
    // hole -- which never reaches `takeMess` -- unable to pick again at all.
    if (w.muckAt != null && muckAtCol(w.muckAt, w) <= 0) { w.muckAt = null; w.muckDropped = now; }
    else if (w.muckAt == null && w.muckDropped !== now && muckFor(w) > 0) {
      const pick = nearestMuck(w.x + WORKER / 2, muckTaken, w);
      w.muckAt = pick == null ? null : Math.floor(pick / P);
    }
  }
  const patch = !w.carry && !w.hasCore && muckFor(w) > 0 && w.muckAt != null
    ? w.muckAt * P + P / 2 : null;

  // In the hole, over the hole, or on the ground beyond it: all one errand,
  // and all one question.
  //
  // It used to be four -- `inPit`, `overPitMouth`, a `wrongSide` worked out
  // against a remembered `farSide`, and a `marooned` for the body left
  // stranded out past the far wall when the crossing stopped running. Every
  // one of those is now the same sentence: which way is the body on, and
  // which way is its work on. A body on the hole's own surface or on the
  // strip past it is somewhere only a route reaches; so is a patch of muck
  // lying on either.
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

  // Down the cut, on the same trip -- the same shape of question `away ||
  // through` just asked, and answered the same way: still down there, or
  // committed to going. A hauler already on the cut's own floor keeps working
  // it even after its claim runs out (there may be another grain worth taking
  // before the trip home), and one only on its way there is caught by the
  // claim alone. Unlike muck, this carries a real load booked against the pit,
  // so it is not folded into `away || through` above -- there is no unbooking
  // it on the way past.
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

  // The rock has landed and this one was dancing while it came down. Put the
  // dance away before it walks off, or it carries the hop and the shout on to
  // the next thing it does -- the same tidy-up the gang on the rock do.
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
    // A route, like every other errand, and not a straight line. The core
    // comes to rest at the foot of the rock and the next rock lands on the
    // same spot, so a carter sent for it from the far side walked straight
    // through the hill at ground level -- a mover that moved x and left y,
    // which is the one thing the climber cannot answer (see `climbTo`). The
    // buried rule caught it a hundred and thirty pixels into the rock.
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

  // The lip, and everybody stops at it. The hole is where dust goes, not where
  // a body with a load in its hands walks.
  //
  // A route has this for nothing: the floor of the yard ends at the near wall,
  // the ground past the far one is its own way, and the only edges between
  // them are the two ladders -- so no route ever offers a leg across the
  // opening (see `ways` in route.js). What the clamp is here for is the walks
  // this file still does by hand: a stroll to nowhere in particular, a step
  // towards a loose core, a nudge at somebody's elbow. None of those knows
  // what a way is.
  //
  // Which side it is held on is not remembered any more. It is the side the
  // body is standing on, which is a thing you can see by looking at it.
  if (!w.route) {
    if (here.key === 'past') { if (w.x < pit.x + pit.w) w.x = pit.x + pit.w; }
    else if (w.x > pit.x - WORKER) w.x = pit.x - WORKER;
  }
  w.y = stand(w);

  // There is no "no room" here. A hauler used to stand down when the hole's
  // count said it was full, and stood down for good: the grain that would have
  // torn the hole open was the one nobody was allowed to carry (see `pitFree`
  // in hole.js). The hole takes everything -- into the pile or through the
  // rift -- so a body with a load always has somewhere to put it down.

  w.resting = false;
  if (w.goal !== 'idle' && w.goal !== 'home') w.idleSince = 0;

  // Muck lying about the yard comes first -- and this is the one job that picks
  // its shovel up here rather than in the mess stage. See `late` on the row.
  //
  // It used to be what a body did when it had nothing else on, which meant it
  // was never done: there is always dust to fetch, so a yard under an inch of
  // muck stayed under an inch of muck while the crew walked over it carrying
  // grains. Clearing up is the job when there is a mess -- the dust is not
  // going anywhere and the mess is in everybody's way.
  //
  // Hands full is the one exception: a body already carrying a load finishes
  // the trip first. Putting a load down to pick up a shovel is a load on the
  // floor and a trip wasted.
  if (takeMess(w, c)) return;
  haulerBack(w);                                   // the yard is clear

  // Fresh dust down the cut, worth a look before the yard's own: it is what
  // keeps the ladder trip working rather than only ever starting from muck.
  // One column, one hauler -- see `nearestCutDust` -- and it only ever fires
  // for a body with empty hands and nothing else already claimed, so it never
  // steals a load that is already somebody's.
  if ((w.goal === 'seek' || w.goal === 'idle') && w.claim < 0 && !w.carry && !w.hasCore &&
      w.cutClaim == null && cut.n > (cut.rock || 0) && bookRoom(w) > 0) {
    const pick = nearestCutDust(w.x + WORKER / 2, cutTaken);
    // A claim taken and acted on the same frame it is found, or a floor column
    // picked below could double up with it: two claims on one pair of hands.
    if (pick >= 0) { w.cutClaim = pick; cutTaken.add(pick); w.goal = 'cut'; return; }
  }

  if (w.goal === 'seek') {
    // It keeps the column it set off for until that column is bare. Picking
    // the nearest one afresh every frame is what made the crew swarm.
    if (w.claim >= 0 && !at(floor, w.claim, 0)) {
      const bare = w.claim;
      taken.delete(w.claim); w.claim = -1;
      // The target was a place, not a column: a body with room in hand keeps
      // taking the nearest thing to where it stands -- along the heap, on to
      // the ground the heap has shed onto, across to the next heap if that is
      // nearer than home -- until its hands are full, and only then turns for
      // home. Sent for one column, it took that column and filled the rest of
      // its hands on the sweep back, so a far heap lost one column a trip.
      if (w.carry && w.carry < load(w)) {
        const next = nextNear(w, bare, taken);
        if (next >= 0) claim(w, next, taken);
      }
    }
    // A target is picked with empty hands and only then. Once anything is in
    // hand the trip has a shape -- out to the target, along its heap, home
    // along the ground -- and its target being bare (taken by a body sweeping
    // past, or all in hand already) is the turn for home, not a reason to pick
    // again. The sweep home is in the `dump` branch below.
    if (w.claim < 0 && w.carry) { w.goal = 'dump'; return; }
    if (w.claim < 0) {
      // Book the hole before picking a column, not after filling your hands.
      // Nothing at all is fetched without room for it -- a shard on the ground
      // with a full hole behind it is a shard that stays on the ground.
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
    // It scoops what is under it, not what its left edge is exactly on. The
    // last two columns before the lip sit further right than a worker is
    // allowed to stand, so a worker that had to be standing on them stood at
    // the lip for ever with the dust a hand's width away.
    const under = target >= w.x - P && target <= w.x + WORKER;
    if (under && now >= w.next && topGrain(col) >= 0) {
      // A grain is worth taking only if this trip booked room for it --
      // otherwise it stays on the ground, which is somewhere, rather than in
      // a pair of hands, which is not. Dust or find, it is the same rule.
      // A spent booking asks the hole again before giving up: room a dig
      // opened while this body was walking out is room it may take.
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
    // Home along the ground, and everything on the way comes too. A body with
    // room in hand that is stood over a column with something in it stops and
    // takes it, column by column, and walks on when the column is bare; one
    // with full hands walks straight to the lip. Nothing here turns it round:
    // what is behind it is the next trip's, and what is ahead of it is this
    // one's -- which is what makes a trip readable as a trip rather than as a
    // body changing its mind. A core is the one load that goes straight in.
    //
    // The column is found before the hole is asked: a booking made here is a
    // booking held to the lip, and a body walking to tip should not be
    // holding room it will not use.
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
      // A proper toss off the lip, so it arcs out over the edge -- and it is
      // aimed at the hole, the same way spoil is aimed at a pile. It used to
      // be a fixed spray, which was fine while the pit ran two windows to the
      // right and never once while it is a scrape: the same throw sailed over
      // the far wall and came down on the ground behind it.
      const from = w.x + WORKER / 2, up = S.groundY - WORKER - P;
      const far = pit.x + Math.max(P, pit.w - P * 2);
      if (w.hasCore) {
        // Lobbed, not dropped -- see B3 in wave-feedback3.md. Same lip, same
        // hands, the same landing formula a grain of dust gets a column further
        // down this function, and the same arc-from-here-to-there `aim` throws
        // everything else on, just sized to a fixed peak instead of one picked
        // by distance. It is not banked here: it is caught by `stepCore`,
        // which only counts it the moment it actually touches the pile, the
        // same as it always has for a core dropped off the rock.
        const land = Math.min(far, pit.x + P * 2 + Math.abs(bell()) * (far - pit.x) * 0.45);
        const v = aim(from, up, land, CORE_SIZE, CORE_LOB_H);
        S.coreItem = { x: from - CORE_SIZE / 2, y: up, vx: v.vx, vy: v.vy, rest: false };
        w.hasCore = false;
        S.dirty = true;
      }
      for (let i = 0; i < w.carry; i++) {
        // Where it is thrown depends on what is down there to throw it at.
        //
        // Onto the pile: most of it near the lip where they are standing,
        // tailing away down the hole, which is the shape a pile has always had.
        //
        // Into the drain: at the disc. With the rift open there is no pile --
        // `riftCatch` takes every grain the moment it crosses the mouth -- and
        // aiming a spread across a floor that is not there gave the fan of
        // dust flung over the hole and then dragged back to one point, two
        // motions with nothing to do with each other. Thrown at the thing that
        // is going to eat it, the arc and the swirl are one movement. It still
        // scatters a little: a hand throwing at a target is not a machine, and
        // grains landing on the same pixel would go round in a single file.
        const land = S.riftOpen && !S.drowned
          ? rift.x + rift.w / 2 + bell() * rift.w * 0.4
          : Math.min(far, pit.x + P * 2 + Math.abs(bell()) * (far - pit.x) * 0.45);
        // A hand's throw, not a nozzle's. Every grain used to leave the same
        // pixel on the same arc and differ only in where it came down, which
        // is a dozen identical parabolas out of one point -- and this is the
        // one moment in the game where you watch a whole day's work actually
        // go somewhere. So the hands are a span rather than a point, and each
        // grain gets its own peak: some lobbed high and slow, some flicked
        // flat and quick. They land spread in time as well as in place, which
        // is what a barrow being turned over looks like.
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
    // Knocked off. It walks to the door it was hired out of and goes in, and
    // the moment there is dust on the ground it comes straight back out --
    // which is the one thing that has to be true of this, because a crew you
    // cannot get back is a crew you would never let go in the first place.
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
    // Nothing to fetch and nothing to carry. Rather than standing to
    // attention they amble: a spot to stroll to, a stand about when they get
    // there, then another. A yard at rest should read as at rest, not as
    // switched off.
    unbook(w);                  // idle hands hold no room
    if (anyDust(taken)) { w.goal = 'seek'; w.idleSince = 0; return; }

    // A rock has just come off, or the next one is on its way down, and this
    // body has nothing to do about either. It joins in rather than ambling
    // about with its hands in its pockets: the gang on the ground are already
    // celebrating, and a yard where half of it is dancing and the other half
    // is strolling reads as half the yard not having noticed.
    //
    // This is the hauler's own `held`, and it is down here rather than up in
    // the stage because it is the *last* thing a hauler will do with a frame:
    // a body with a load in its hands or a column booked has somewhere to be,
    // and the ones fetching, tipping and walking home all dance from where the
    // rock catches them -- see `across` and `heldUp` above.
    //
    // Everything the dance needs is here -- it spreads out from where it
    // stands, and it elbows clear of anybody it is standing in.

    // A yard with nothing in it to carry is a yard nobody needs to be stood
    // in. After a good while of it -- staggered, so they trickle off rather
    // than clocking out together -- a body goes home. It is not a rate and it
    // costs nothing: every one of them is back the moment there is work.
    if (!w.idleSince) w.idleSince = now + HOME_AFTER * (0.6 + rand() * 0.9);
    if (!w.brk && now >= w.idleSince) { w.goal = 'home'; w.roamTo = null; return; }
    // Stood still between strolls is the one moment a hauler is properly
    // stopped, and it is the only moment it is allowed a break: a body
    // walking somewhere is on its way there.
    w.resting = w.roamTo === null || w.roamTo === undefined;
    if (w.roamTo === null || w.roamTo === undefined) {
      elbowIdle(w);                  // and not stood inside somebody
      // Feet on the ground even while stood still. A resting body never asked
      // where the ground was, so one that stopped at the crest's edge -- or was
      // put down mid-air by anything at all -- rested exactly there, hanging.
      // The climber eases it down the outline in place.
      w.y = stand(w);
      // and it stays put while it is having one: a body that wandered off
      // mid-cigarette would be a body that was never really standing there
      if (!w.brk && now >= (w.restUntil || 0)) w.roamTo = strollTo(w);
    } else {
      const d = w.roamTo - w.x;
      // its own legs, not everybody's
      const stride = w.x;
      w.x += Math.sign(d) * Math.min(haulSpeed() * ROAM_PACE * (w.amble || 1) * frames(), Math.abs(d));
      // and its feet on the ground it is strolling over. The roam never asked --
      // it moved x and left y where the last job put it, so a body dropped on
      // the crest of the rock strolled off the edge at crest height, drawing a
      // straight line through open air.
      w.y = stand(w);
      // A stroll does not stride off a cliff. If the step just taken left the
      // feet hanging more than a couple of cells over the ground below, the
      // step is given back and the feet come down first. This lives HERE, in
      // the leisure code, and not in the climber: working walks legitimately
      // drop down ramps and lips all over the yard and their length is a tested
      // promise -- a roam has nowhere to be, so it can afford to pick its way
      // down the outline.
      if (standTop(w.x, rockTop) - (w.y + WORKER) > P * 2) w.x = stride;
      if (Math.abs(d) < 1) {
        w.roamTo = null;
        // and its own patience about standing there afterwards
        w.restUntil = now + (500 + rand() * 3000) * (w.linger || 1);
      }
    }
  }
}

// The whole yard is a hauler's to shovel, and when there is none of it left the
// body goes back to standing about. Named rather than written into the registry
// row because `haulerWork` calls it itself -- see `late` on the row.
export function haulerBack(w) {
  if (w.goal === 'muck') { w.goal = 'idle'; w.muckAt = null; }
}
