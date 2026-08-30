// Getting from here to there.
//
// This is the one place in the game that answers "how does a body get from where
// it is to where it wants to be", and it answers it the same way for everybody.
// Before it there was a way for the pit, a different way for the quarry, a third
// inside the commute, and a set of flags -- `onSite`, `overPitMouth`, `upTop`,
// `inPit`, `w.goal === 'down'` -- naming the places a body was not allowed to
// walk. Every one of those flags was a rule written down once and then needed in
// four other files, and the bugs were always the same shape: some path moved a
// body without knowing about the flag, so a quarrier rose through solid rock,
// or a janitor walked through a heap it should have gone over.
//
// Nothing here is told about the rock, the quarry or the heaps. There are two
// ideas and that is the whole of it:
//
//   **A surface.** For any place a body can be, the height of what it is
//   standing on. Rock, sand, ground, bridge, quarry floor, pit floor -- all one
//   question, and the answer is a number.
//
//   **A way, and the links between ways.** Most of the yard is one connected
//   surface you can walk end to end. A hole in the ground is a *second* surface,
//   which is not connected to the first except where somebody has put a ladder.
//
// Then a route is the shortest walk over that, worked out rather than declared.
// The reason a quarrier leaves the cut by the ladder is not that anything says
// "use the ladder": it is that the ladder is the only edge out of the cut, so
// every path that leaves goes along it. Take the ladder away and there is no
// route, and a body asked for one stays where it is -- which is also right.
//
// Adding a place to the yard means adding a way and saying what it links to.
// Nothing else has to be told.

import { P, WORKER, CLIMB_PACE } from './config.js';
import { S, floor, pit, quarry } from './state.js';
import { groundAt, rockLeft } from './world.js';
import { rockTopY, boulderAlive } from './rock.js';
import { surfaceY, colOf } from './grid.js';
import { dugTopY, quarryFace } from './quarry.js';
import { pitTop, pitLadder, NEAR, FAR } from './smog.js';
import { frames } from './clock.js';

// --- the surface --------------------------------------------------------------
// What is underfoot at a place on the open yard, as a world y of its top.
//
// Everything that can be stood on is in here and nothing is held out. The rock
// is a hill you walk over; a heap of dust is a bank you walk over; the bridge is
// a deck you walk along. None of them is a special case with a flag beside it --
// they are three things that are higher than the ground, and the surface is
// whichever of them is highest.
//
// This is what makes the pathing question answerable at all. "Take the shortest
// path" needs a world where every point either has a height or is not a point;
// as soon as some places are walkable-but-flagged, every walker has to know the
// flags, and that was the old game.
export function groundTop(x) {
  // the ground line, or the bridge where there is one over the mouth
  let top = Math.min(groundAt(x), S.groundY);

  // the hill, where there is one under this column
  if (boulderAlive()) {
    const c = Math.floor((x - rockLeft()) / P);
    if (c >= 0 && c < S.gw) top = Math.min(top, rockTopY(c));
  }

  // A heap of dust is deliberately NOT in here. See `footing` below: loose
  // ground is something you pass in front of, not something you stand on top of.
  return top;
}

// --- what is underfoot, as opposed to how high it is --------------------------
// The other half of the surface, and the half that decides where anything can
// come to rest: not how high the ground is at a place, but whether it is ground.
//
//   solid   ground, the bridge deck, the face of the rock, the floor of a
//           working. You can stand on it, and something dropped on it stays.
//   loose   a heap of dust, and a plot under a crop. It is there, you can see
//           it, and it will not take a pair of boots: a body walks past it at
//           the height of the ground and is drawn in front of it, and anything
//           that lands on one rolls down to the bare ground beside it.
//   none    the mouth of the quarry and the mouth of the hole. Not a surface at
//           all: what is over one of those is over a hole.
//
// This is one property of a place rather than a rule about who is walking. The
// old game asked `onSite`, which held the rock, the quarry and the plots out of
// the sweep together -- three quite different reasons wearing one name -- and
// then had to make an exception of the rock again for the one job that works on
// it. Nothing below asks what a body does for a living.
export const SOLID = 'solid', LOOSE = 'loose', NONE = 'none';

// How deep the loose stuff lies at a place. Bare ground has none.
export function heapAt(x) {
  if (!floor.grid) return 0;
  const c = colOf(floor, x);
  if (c < 0 || c >= floor.cols) return 0;
  return Math.max(0, S.groundY - (surfaceY(floor, c) + floor.p));
}

// A heap has to be worth calling a heap. A scatter of loose grains lies all over
// this yard and nobody would say a body walking through it is walking through
// anything; it is a bank once it is deep enough to stand up against a body.
const HEAP_DEEP = P * 2;

export function footing(x, all = ways()) {
  // a mouth is not a surface. Whichever way is under this point, its floor is a
  // long way down, and what is at ground level here is fresh air.
  for (const key of ['cut', 'hole']) {
    const w = all[key];
    if (w && x > w.from && x < w.to && standTop(x - WORKER / 2, w.at) > S.groundY + P) return NONE;
  }
  if (heapAt(x) >= HEAP_DEEP) return LOOSE;
  return SOLID;
}

// The nearest place to x that will take a pair of boots or a shovelful, or null
// if there is none within reach. One search, asked by everything that needs
// somewhere to stand and by everything that needs somewhere to put something --
// which is why a body clearing a heap stands in front of it and the mess it is
// clearing ends up in front of it too, without either of them being told about
// heaps.
export function solidNear(x, reach = 40, all = ways()) {
  for (let d = 0; d <= reach; d++) {
    for (const at of (d ? [x - d * P, x + d * P] : [x])) {
      if (footing(at, all) === SOLID) return at;
    }
  }
  return null;
}

// What a body actually stands on, given that it is three cells wide and the
// ground is not level. The highest surface under any part of it -- so a body at
// the foot of a bank stands on the bank rather than sinking its uphill half into
// it. It is the rule `pitStand` had for the pit and `climbTo` had for the rock,
// which are now one rule for one surface.
export function standTop(leftX, at = groundTop, width = WORKER) {
  let top = Infinity;
  for (let x = leftX; x < leftX + width; x += P) top = Math.min(top, at(x));
  return Math.min(top, at(leftX + width - 1));
}

// Where a body's top edge goes when it is standing at x, on a given way.
export const feetOn = (way, leftX) => standTop(leftX, way.at) - WORKER;

// --- the ways -----------------------------------------------------------------
// A way is a stretch of surface a body can walk from one end to the other
// without climbing anything. There are only ever a few, and they are worked out
// from the yard rather than kept: the quarry is dug and filled in, the pit grows,
// and a remembered span would be a way to somewhere that has moved.
//
//   key    what it is called, which is what a body remembers it is on
//   from   the left-hand end of it, in world x
//   to     and the right-hand end
//   at     the surface under a point on it
//
// The yard is the way everything else hangs off. It runs the whole width of the
// world, and `groundTop` gives its height, so the rock and the heaps are part of
// it rather than obstacles on it.
export function ways() {
  const out = { yard: { key: 'yard', from: -1e6, to: 1e6, at: groundTop } };

  // The floor of the cut, which exists while there is a cut. It is below the
  // ground and it is not joined to the yard anywhere except at the ladder --
  // which is the whole reason a quarrier cannot climb out of the side of it.
  if (S.quarryOpen)
    out.cut = { key: 'cut', from: quarry.x, to: quarry.x + quarry.w, at: dugTopY };

  // and the floor of the hole, which is the same shape of thing: a surface below
  // the ground with ladders at both ends.
  if (pit.grid && pit.cols)
    out.hole = { key: 'hole', from: pit.x, to: pit.x + pit.w, at: pitTop };

  return out;
}

// Which way a body is on, from where it is. Asked rather than stored, so a body
// that is dropped into a hole is in the hole and a body that walks off the end of
// one is out of it, without anybody having to remember to say so.
//
// Below the ground line and inside a hole's span is in that hole. Everywhere
// else is the yard -- including standing on the rock and standing on a heap,
// which are the yard, higher up.
export function wayAt(x, y, all = ways()) {
  const feet = y + WORKER;
  if (feet > S.groundY + 1) {
    for (const key of ['cut', 'hole']) {
      const w = all[key];
      if (w && x + WORKER > w.from && x < w.to) return w;
    }
  }
  return all.yard;
}

// --- the links ----------------------------------------------------------------
// Where one way joins another, and the only places they do. A link is a ladder:
// a place you can change what you are standing on, at the cost of climbing.
//
// This is the entire connectivity of the world. Adding a shaft, a lift or a ramp
// is a row here, and every body in the game can use it the same day -- because
// none of them knows what a ladder is. They ask for a route and walk it.
export function links(all = ways()) {
  const out = [];
  if (all.cut) out.push({ x: quarryFace(), a: 'yard', b: 'cut', name: 'quarry ladder' });
  if (all.hole) {
    out.push({ x: pitLadder(NEAR).x, a: 'yard', b: 'hole', name: 'near pit ladder' });
    out.push({ x: pitLadder(FAR).x, a: 'yard', b: 'hole', name: 'far pit ladder' });
  }
  return out;
}

// --- the route ----------------------------------------------------------------
// The shortest walk from one place to another, as a list of legs.
//
//   { along: way, to: x }   walk this way to here
//   { climb: link, to: way } and change to that way, which is a climb
//
// It is a plain search over a handful of ways rather than a grid A*, because
// that is the shape of the problem: the yard is a side view with three surfaces
// in it, not a maze. Two links deep is more than the world has ever needed and
// the search is bounded there, so this cannot become a cost nobody expected.
//
// The cost of a leg is how far it is, plus what the climb costs. A climb is
// counted at what it actually costs to do -- a ladder is walked at CLIMB_PACE
// and the yard at a walking pace, so a deep hole is dear and a shallow one is
// not, and a body picks the near ladder or the far one on the honest arithmetic
// rather than on which side of the middle it happens to be standing.
const CLIMB_COST = 2.2;      // how much dearer a pixel of ladder is than a pixel of ground

function climbDepth(link, all) {
  const a = all[link.a], b = all[link.b];
  return Math.abs(standTop(link.x, a.at) - standTop(link.x, b.at));
}

export function route(fromX, fromWay, toX, toWay, all = ways(), reach = links(all)) {
  if (!fromWay || !toWay) return null;
  if (fromWay.key === toWay.key)
    return { cost: Math.abs(toX - fromX), legs: [{ along: fromWay, to: toX }] };

  let best = null;
  const walk = (x, way, seen, legs, cost) => {
    if (best && cost >= best.cost) return;          // already dearer than an answer we have
    if (way.key === toWay.key) {
      const c = cost + Math.abs(toX - x);
      if (!best || c < best.cost) best = { cost: c, legs: [...legs, { along: way, to: toX }] };
      return;
    }
    if (seen.length > 2) return;                    // no world here needs three changes
    for (const l of reach) {
      const other = l.a === way.key ? all[l.b] : l.b === way.key ? all[l.a] : null;
      if (!other || seen.includes(l)) continue;
      walk(l.x, other, [...seen, l], [...legs, { along: way, to: l.x }, { climb: l, to: other }],
           cost + Math.abs(l.x - x) + climbDepth(l, all) * CLIMB_COST);
    }
  };
  walk(fromX, fromWay, [], [], 0);
  return best;
}

// The route a body would take from where it is standing to a place on the open
// yard, which is what almost everything asks for.
export const routeFor = (w, toX, toWay = null) => {
  const all = ways();
  return route(w.x, wayAt(w.x, w.y, all), toX, toWay || all.yard, all);
};

// --- walking it ---------------------------------------------------------------
// One frame of a route. It returns true while there is still walking to do, so a
// caller is a single line: hand it the body and the pace, and do the work when it
// says the body has arrived.
//
// Nothing here knows what a quarry is. A body on the floor of the cut with a
// route out walks its legs: along the floor to the ladder, up the ladder, along
// the yard. It is the same three lines that carry a hauler across the yard.
export function stepRoute(w, pace) {
  const legs = w.route;
  if (!legs || !legs.length) return false;
  const leg = legs[0];
  const dt = frames();

  // Up or down a ladder, and nothing else while it is on one: a body on a rung
  // is not somewhere it can be walked sideways from, which is the rule that used
  // to be four copies of "hold x at the face".
  if (leg.climb) {
    w.x = leg.climb.x;
    const want = feetOn(leg.to, w.x);
    w.y += Math.sign(want - w.y) * Math.min(CLIMB_PACE * dt, Math.abs(want - w.y));
    if (Math.abs(want - w.y) < 0.5) { w.y = want; w.way = leg.to.key; legs.shift(); }
    return true;
  }

  const d = leg.to - w.x;
  if (Math.abs(d) > 0.5) {
    w.face = w.dir = Math.sign(d) || w.face || 1;
    w.x += Math.sign(d) * Math.min(pace * dt, Math.abs(d));
  } else w.x = leg.to;
  // and the feet follow the surface it is walking over, which is what puts a
  // body up the side of the rock and over a heap without either being mentioned
  w.y = climbToward(w, feetOn(leg.along, w.x), pace * dt);
  // The other climber in this game keeps its own memory of where the feet are
  // (see `climbTo` in crew.js), and a body handed back and forth between the two
  // with those out of step gets dragged between two answers every frame. One
  // line, and the two agree.
  w.foot = w.y;
  w.footAt = w.x;
  if (Math.abs(leg.to - w.x) < 0.5) legs.shift();
  return legs.length > 0;
}

// Feet that follow the ground rather than being put on it. A body climbs at the
// pace it is walking and a half again, so it can get up any slope in this yard
// without ever being teleported to the top of one.
//
// The half again is what makes a slope climbable at all: at exactly the walking
// pace a body on a 45-degree bank falls behind the ground for as long as the
// bank lasts. See CLIMB_SLOPE in crew.js, which this replaces.
const CLIMB_SLOPE = 1.5;
export function climbToward(w, want, step) {
  const d = want - w.y;
  return w.y + Math.sign(d) * Math.min(Math.max(step * CLIMB_SLOPE, CLIMB_PACE * frames()), Math.abs(d));
}

// Put a body on a route to somewhere, or say there is no way there.
//
// The route is remembered along with what it was a route *to*, which is the
// whole of what `keepTo` needs below.
export function sendTo(w, toX, toWay = null) {
  const r = routeFor(w, toX, toWay);
  w.route = r ? r.legs : null;
  w.routeTo = r ? toX : null;
  w.routeWay = r ? (toWay ? toWay.key : 'yard') : null;
  return !!r;
}

// Keep a body walking to a place, working the route out when it needs working
// out and not otherwise.
//
// The first go at this asked for a route once, when the walk began, and then
// walked it to the end. That is wrong in a yard where the destination moves:
// the head of the ladder shifts as the cut is dug and filled, a station is
// resited when a plot is bought, and a body handed a new errand mid-walk has a
// new place to be. What it did was carry on to where the target *used to be*,
// arrive, and call that arriving -- and because the overshoot depended on where
// the frame boundaries fell, the same walk came out a different length at thirty
// frames a second than at a hundred and twenty. A walk is a distance over a
// time; it is not allowed to depend on how the time was cut up.
//
// So the destination is checked every frame and the route is only rebuilt when
// it has actually moved. That is one comparison a frame for a walk that is
// otherwise free.
const RETARGET = 1;                 // a pixel: below this it is the same place

export function keepTo(w, toX, toWay = null) {
  const key = toWay ? toWay.key : 'yard';
  if (w.route && w.routeWay === key && Math.abs((w.routeTo ?? NaN) - toX) < RETARGET)
    return true;
  return sendTo(w, toX, toWay);
}

// What the checks ask: how a body would get somewhere, as something readable.
export const routeReport = (w, toX) => {
  const r = routeFor(w, toX);
  return r && { cost: Math.round(r.cost),
                legs: r.legs.map(l => l.climb ? `climb ${l.climb.name} to ${l.to.key}`
                                              : `${l.along.key} to ${Math.round(l.to)}`) };
};
