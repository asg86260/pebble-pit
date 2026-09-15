// Carrying, which is the job with no station: the dust is wherever it fell, so
// somebody put on it is already at work.
//
// It is much the longest of them, because a hauler is the body the yard's own
// furniture happens to: the hole it tips into, the lip it may not walk over, the
// books it holds room in, and the loose core nobody else will pick up.

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
import { downTheHole, downTheCut, nearestCutDust, pitFree, load, roomOnBoard,
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

// The nearest column of dust that nobody else has set off for. One column, one
// worker: without that, every worker in the yard works out the same answer and
// the whole line turns round for a single grain behind them, then turns round
// again when the first of them picks it up.
function nearestDust(x, taken) {
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  // And the near end is where the crew stop walking, not where the ground stops.
  // Dust may lie the whole way out to the edge of the world now -- a bird sheds
  // over it, and your own cursor reaches it -- but a body held at `yardLeft`
  // cannot stand on a column past it. Booked one anyway, it would set off, stop
  // at the end of its own span, and stand there for the rest of the run with a
  // claim on ground it can never reach. What lies out there is yours to sweep
  // up, not theirs to fetch, which is the same bargain the ground past the lip
  // has always had.
  const first = Math.max(0, Math.min(last, colOf(floor, yardLeft())));
  const from = Math.max(first, Math.min(last, colOf(floor, x)));
  for (let d = 0; d <= last; d++) {
    for (const c of [from - d, from + d]) {
      // Anything in a column is worth fetching, barred or not: a barred column
      // normally holds nothing, and when it does hold something -- a shard set
      // down at the plots -- somebody should still go out and get it.
      if (c < first || c > last || taken.has(c)) continue;
      if (at(floor, c, 0)) return c;
    }
  }
  return -1;
}

// Something that is not dust is worth crossing the yard for: it is one grain and
// it is worth a whole shard. Workers take the nearest column of anything, so
// without this a shard out at the plots waits for the whole yard to be swept
// clean first -- which, in a yard with a working crew, is never.
//
// `served` is the set of grounds somebody is already off fetching from; a find
// on one of those is passed over for one on a ground nobody is serving. See the
// cap in `stepHauler`: the nearest find is nearly always the farm's, because
// the farm drips them and stands next to the walk, and picked by distance
// alone the quarry's finds -- and the star's sparks -- lay there for hours.
function nearestMark(w, taken, served = EMPTY) {
  let best = -1, bestD = Infinity;
  // Nothing beyond the near lip: a body cannot cross the hole, so a find over
  // there is one it would set off for and stand at the edge of for ever. What
  // lands past the pit is yours to sweep up, not theirs to fetch -- the same
  // bound `nearestDust` has always kept. And nothing off the near end either,
  // for the same reason at the other end of the same walk.
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
// yard for one that has rolled off a strip. Two finds on the same strip are the
// same ground's output, which is the thing the fetch cap counts.
const groundOf = x => pileAt(x)?.key || 'yard';

// The grounds somebody is already off fetching a find from.
const servedGrounds = () => {
  const s = new Set();
  for (const o of S.workers) if (o.type === TYPE.HAUL && o.forMark) s.add(o.forMark);
  return s;
};

// Whether anything on the ground is backing up.
//
// A pile that fills stops the station behind it: the rock stops coming apart,
// the quarry stops being cut. A find lying on the ground stops nothing at all -- it
// is worth money and it is in nobody's way. So while a heap is near its limit
// the dust is the urgent thing and the find can wait, which is the other way
// round from the rest of the time.
//
// Three quarters rather than full, because full is already too late: by then the
// station has stopped, and what you want is the crew turning up before it does.
const BACKED_UP = 0.75;
// Whether a heap is backing up, and *which* heap, because the two want opposite
// answers out of a body deciding what to fetch next.
//
// This used to be "is any pile backing up", and the answer to that was "fetch
// dust". Which is right when the dust is what is backing up and exactly wrong
// when it is not: a full quarry heap is a reason to go and get *shards* sooner,
// not a reason to walk past them carrying grit. And it stopped being an edge
// case the day the machines landed -- a ram fills the rock's pile in under a
// second and never empties it, so `pilingUp` was true for the rest of the run,
// dust won every single time, and the crew stopped fetching the other two
// resources at all.
const backedUp = key =>
  (S.pileCount[key] || 0) >= (PILE_LIMIT[key] || Infinity) * BACKED_UP;
// Kept for the pile mark and the stand-down rules, which are about a station
// having nowhere to put what it makes -- a different question from what a body
// coming out to fetch should pick up.
export const anyBackedUp = () => S.piles.some(p => backedUp(p.key));

// The fullest heap that is over the line, and the nearest thing on it that
// nobody has set off for -- or -1 when no heap is backing up at all.
//
// Fullness is measured against the heap's own limit, not counted in grains,
// because the limit is what stops the station: the rock's strip holds seven
// hundred and the quarry's a hundred and eighty, so a quarry heap that has
// stopped the quarry is a quarter the size of a rock heap that has not. Picked
// by distance, or by count, the body coming out to fetch goes to the rock's
// heap every time -- it stands nearest the hole and it is always the biggest --
// and the quarry stays stopped behind a heap nobody thinks is worth a walk.
// Measured against the limit, the heap that is closest to stopping its station
// is the one everybody goes to, and as it comes down whichever is next fullest
// takes over: the crew settle on to the heap that needs them without anybody
// having been told which one that is.
function fullestHeap(w, taken) {
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  const first = Math.max(0, Math.min(last, colOf(floor, yardLeft())));
  let best = -1, bestR = -1;
  for (const p of S.piles) {
    const r = (S.pileCount[p.key] || 0) / (PILE_LIMIT[p.key] || Infinity);
    if (r < BACKED_UP || r <= bestR) continue;
    // The strip's columns, held to the ground the crew can stand on -- the same
    // two bounds `nearestDust` keeps, for the same reason.
    const lo = Math.max(first, colOf(floor, p.from));
    const hi = Math.min(last, colOf(floor, p.to) - 1);
    if (lo > hi) continue;
    const from = Math.max(lo, Math.min(hi, colOf(floor, w.x)));
    for (let d = 0; d <= hi - lo && bestR < r; d++) {
      for (const c of [from - d, from + d]) {
        if (c < lo || c > hi || taken.has(c) || !at(floor, c, 0)) continue;
        best = c; bestR = r; break;
      }
    }
  }
  return best;
}

// Whether a column is one of the finds lying about, so a body that has gone for
// one can be told apart from a body shifting grit.
const isMark = c => S.floorMarks.some(m => colOf(floor, m.x) === c);

// Where a trip starts, decided with empty hands. Three answers, in order: a
// find, the fullest jammed heap, the nearest dust. Whichever is chosen, the
// others are the fallback -- a body that came out to fetch goes back with
// something.
//
// A find first -- but not by everybody at once while a heap is jammed. This
// was an all-or-nothing switch and both settings are wrong. "Any heap backing
// up, fetch dust" is what it was, and the machines made that permanently true:
// a ram fills the rock's pile in under a second and never empties it, so dust
// won every time for the rest of the run and the crew stopped fetching the
// other two grounds at all. Turning it off outright is worse in the other
// direction -- measured, the rock then stands on its own heap 85% of a run,
// because the stations keep dripping finds and a good share of the crew is
// always off chasing one.
//
// So it is a *cap* rather than a switch -- and the cap is one body per ground
// that has a find waiting, not one body for the yard. One for the yard took the
// nearest find every time -- the farm's, which drips them beside the walk --
// and the quarry's shards and the star's sparks lay on the ground for hours:
// shard income read 0.0/min in every six-hour run and no machine was ever
// bought (docs/critics-2026-09-10.md, A3). One body per ground is what the old
// argument actually claims: each ground's own drip is kept up with. Everybody
// else shifts grit and the rock keeps working.
//
// And everybody else goes to the fullest heap, not the nearest dust. The
// nearest dust to a body coming off the hole is the rock's heap, whatever
// state it is in -- so the whole crew stood on the one heap while the
// quarry's, a quarter its size and full to the line, stopped the quarry behind
// them. `fullestHeap` measures each heap against its own limit and sends the
// body to whichever is nearest to stopping its station; nothing changes until
// something is backing up, and then it is the jammed heap that is cleared
// rather than the handy one.
function firstPick(w, taken) {
  if (HAUL_FIFO) return oldestDust(taken);
  const dust = nearestDust(w.x, taken);
  const heap = fullestHeap(w, taken);
  const served = heap >= 0 ? servedGrounds() : EMPTY;
  // A served ground's find is the last fallback of all, not dropped.
  const mark = nearestMark(w, taken, served);
  return mark >= 0 ? mark : heap >= 0 ? heap : dust >= 0 ? dust : nearestMark(w, taken);
}

// The experiment: the column whose bottom grain has lain longest, wherever it
// is. First in, first out across the whole yard -- nothing is ever starved, at
// the price of the walk, which is measured rather than argued (`HAUL_FIFO`).
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

// The nearest column with something in it on the same strip as `bare`, the
// column just emptied, that nobody else has set off for -- or -1 when `bare`
// was not on a strip or the strip has nothing left. Held to the ground the
// crew can stand on, the same two bounds `nearestDust` keeps.
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

// Taking a column on. Which ground it was a find on is remembered so the cap
// in `firstPick` knows which grounds are being served. It is a fact about the
// trip, not about the column: the column stops being a find the moment it is
// picked up.
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

  // Nothing to go for and nothing owing. A hauler with no room booked and none
  // to book stands down rather than walking to the lip and throwing at a brim,
  // the same as a gang stops when the pile it is filling has no room left. It
  // keeps whatever it is already carrying -- a load tipped into a full pit is
  // a load lost -- and picks the job up the moment a dig makes room.
  //
  // Somebody already on a trip is left to finish it: the room it is holding is
  // room it booked, and turning it round at the lip is the exact thing this is
  // here to stop. A core is not dust and the hole always takes one.
  const noRoom = !w.hasCore && !w.carry && roomOnBoard(w) < 1 && pitFree() < 1;
  // Somebody already on their way home is left alone. Telling a body there is
  // no room is telling it to stand down, and a body walking to the door has
  // stood down already -- so this used to catch it, put it back on `idle`, and
  // the idle branch would send it home again on the very next frame. Home,
  // idle, home, idle, and it never took a step: a yard full of dust, a full
  // hole, and the whole crew stood stock still between the pile and the lip.
  if (noRoom && w.goal !== 'idle' && w.goal !== 'home') {
    if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
    unbook(w);
    w.goal = 'idle';
  }

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
      taken.delete(w.claim); w.claim = -1; w.forMark = false;
      // The target was a heap, not a column: a body sent to a jammed heap
      // works along it until its hands are full or the heap is bare, and only
      // then turns for home. Sent for one column, it took that column and
      // filled the rest of its hands from the rock's heap on the sweep back --
      // the rock's strip lies between the quarry's and the hole -- so the
      // quarry's heap, the one the fullest-heap rule had sent it to, lost one
      // column a trip and sat at full for the whole of a run (carters.mjs,
      // quarry-jam: cleared exactly what landed, full 100% of the time). The
      // next column is the nearest on the same strip, which is a shuffle along
      // the heap and never a turn across the yard; a find off a strip has no
      // heap to work and goes straight to the sweep.
      if (w.carry && w.carry < load(w)) {
        const next = nextOnStrip(w, bare, taken);
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
    if (!noRoom && nearestDust(w.x, taken) >= 0) {
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
    if (!noRoom && nearestDust(w.x, taken) >= 0) { w.goal = 'seek'; w.idleSince = 0; return; }

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
