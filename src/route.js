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
import { cutTop, quarryFace } from './quarry.js';
import { pitTop, pitLadder, NEAR, FAR } from './pit.js';
import { frames } from './clock.js';

// --- the surface --------------------------------------------------------------
// What is underfoot at a place on the open yard, as a world y of its top.
//
// This is the floor of the yard and nothing else: the ground line, and the deck
// of the bridge where somebody has laid one over the mouth of the hole. It is
// what a body walking from one end of the world to the other walks along.
//
// The hill is deliberately NOT in here, and that is the whole of what this file
// learned the hard way. For a while it was, on the argument that one surface for
// everybody is simpler than two chosen by job title -- and it is, but the thing
// that made it wrong was never the arithmetic. Put the hill in the floor and the
// hill becomes a road: every hauler, janitor and wizard with business on the far
// side of the yard ramps up over the summit and down the other side, because the
// summit is the shortest way along the only surface there is. A yard where every
// errand goes over the crest is a yard where the hill is a road.
//
// So the hill is its own way instead -- see `ways` below -- exactly as the cut
// and the hole are, and for the same reason: it is a surface you get on to and
// off again at particular places, not a stretch of the floor. Which of the two a
// body walks is then decided by what a route costs, and never by what the body
// does for a living.
//
// A heap of dust is not in here either. See `footing` below: loose ground is
// something you pass in front of, not something you stand on top of.
export function groundTop(x) {
  return Math.min(groundAt(x), S.groundY);
}

// And the surface of the hill, column by column, for the columns it has: the
// rock is a heightfield, so its top is a step per cell rather than a curve. Off
// its footprint, or in a column the crew have taken all the way down, there is
// no hill and the answer is the floor -- which is what makes the two ends of the
// rock way meet the yard at the same height as the yard.
//
// Nothing else in the game is allowed to ask `rockTopY` about a walk. This is
// the one place the hill turns into a surface, and it is a surface like any
// other from here on.
export function rockTop(x) {
  const ground = groundTop(x);
  if (!boulderAlive()) return ground;
  const c = Math.floor((x - rockLeft()) / P);
  if (c < 0 || c >= S.gw) return ground;
  return Math.min(ground, rockTopY(c));
}

// How far the hill still reaches, left and right, or null when there is no hill
// left to reach anywhere.
//
// Worked out from the columns every time it is asked, never kept. The rock is
// being taken apart while people are walking about on it: the gang start on the
// crest and work down, the flanks go bare long before the middle does, and a
// span remembered from when the rock landed is a way that runs out over ground
// anybody can already walk. Same rule as `quarryFace` -- the cut's ladder moves
// as the cut is dug, so nothing writes down where it is.
//
// The ends are the outermost columns that still have rock in them. Columns
// hollowed out *between* those two are left inside the span on purpose: a notch
// mined through the middle of a hill is a dip in the hill, not two hills, and
// `rockTop` gives it at the height of the ground so the way runs down into it
// and up the other side.
export function rockSpan() {
  if (!boulderAlive()) return null;
  let lo = -1, hi = -1;
  for (let c = 0; c < S.gw; c++) if (S.rockTops[c] >= 0) { if (lo < 0) lo = c; hi = c; }
  if (lo < 0) return null;
  return { from: rockLeft() + lo * P, to: rockLeft() + (hi + 1) * P };
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

// The ways that are holes in the ground rather than stretches of it. They are
// the two with a mouth you can be over, and the two with something over your
// head when you are down one, and both of those come up often enough in other
// files to be worth naming once here rather than four times elsewhere.
export const WORKINGS = ['cut', 'hole'];
export const downAWorking = key => WORKINGS.includes(key);

export function footing(x, all = ways()) {
  // a mouth is not a surface. Whichever way is under this point, its floor is a
  // long way down, and what is at ground level here is fresh air.
  for (const key of WORKINGS) {
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
// it. The pit had its own copy of this rule and the climber on the rock had
// another; they are one rule for one surface now, and the copies are gone.
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
// world and `groundTop` gives its height, so a heap of dust is part of it rather
// than an obstacle on it -- you pass in front of a bank, and the ground line is
// where you pass it at. The hill is not part of it: it is a way of its own, and
// the reason why is written out at `groundTop`.
export function ways() {
  const out = { yard: { key: 'yard', from: -1e6, to: 1e6, at: groundTop } };

  // The floor of the cut, which exists while there is a cut. It is below the
  // ground and it is not joined to the yard anywhere except at the ladder --
  // which is the whole reason a quarrier cannot climb out of the side of it.
  if (S.quarryOpen)
    out.cut = { key: 'cut', from: quarry.x, to: quarry.x + quarry.w, at: cutTop };

  // and the floor of the hole, which is the same shape of thing: a surface below
  // the ground with ladders at both ends.
  //
  // The hole also cuts the yard in two, and that is not a detail. The mouth is
  // not a surface -- `footing` says so -- so the floor of the yard genuinely
  // stops at the near wall and starts again past the far one, and the strip of
  // ground out there is joined to the rest of the world only by going down one
  // ladder and up the other. Written as one floor running the whole width, a
  // route from the yard to that strip is a walk straight across the opening,
  // which is a body walking on air; and the far ladder is then a rung nobody
  // has any reason to use, because the ground at the top of it was already
  // reachable on the flat.
  //
  // So it is two ways with a hole between them, and the crossing costs what
  // climbing down and up again costs. That is the whole of what `downTheHole`
  // used to say by hand, said once, for everybody.
  if (pit.grid && pit.cols) {
    out.hole = { key: 'hole', from: pit.x, to: pit.x + pit.w, at: pitTop };
    out.past = { key: 'past', from: pit.x + pit.w, to: 1e6, at: groundTop };
    out.yard.to = pit.x;
  }

  // The hill, which is the same shape of thing turned the other way up: a
  // surface *above* the ground, joined to the yard at the two places you can
  // walk on to it, and only there. It exists while there is a rock to stand on
  // and stops existing when the crew have taken the last of it down, at which
  // point every route that used it simply stops being offered -- the same way a
  // filled-in cut takes its ladder with it.
  //
  // Its span is whatever of the footprint still has rock standing in it -- see
  // `rockSpan` -- and its surface is read off the columns the moment it is
  // asked, so the way *is* the outline of what is left. Mine the crest down and
  // the walk over it flattens the same frame; mine a flank away and the hill
  // gets shorter and its foot moves in.
  const span = rockSpan();
  if (span) out.rock = { key: 'rock', from: span.from, to: span.to, at: rockTop };

  return out;
}

// Which way a body is on, from where it is. Asked rather than stored, so a body
// that is dropped into a hole is in the hole, a body thrown on to the crest is
// on the hill, and a body that walks off the end of either is out of it, without
// anybody having to remember to say so.
//
// Below the yard's floor and inside a working's span is down that working.
//
// Above the yard's floor and inside the hill's footprint is on the hill -- and
// the discriminator there is *height*, not x. This is the whole of the thing the
// bug was about: a hauler crossing the footprint at ground level and a miner
// standing on the crest are at the same x and are not in the same place, and the
// only thing that tells them apart is that one of them is up in the air. So the
// question asked is "is this body higher than the yard would put it, somewhere
// the hill is higher than the yard" -- and a body at the height of the floor,
// however far across the footprint it is, is on the floor, walking in front of
// the hill.
//
// A body part way up the face on its way to the top answers yes, which is right:
// it is on the hill, climbing it. And a heap is nobody's way -- standing on a
// bank is standing on the yard, higher up, because a bank is not something you
// stand on at all.
export function wayAt(x, y, all = ways()) {
  const feet = y + WORKER;
  if (feet > S.groundY + 1) {
    for (const key of WORKINGS) {
      const w = all[key];
      if (w && x + WORKER > w.from && x < w.to) return w;
    }
  }
  // and up on the hill if the hill is what is over this spot -- the same
  // question `wayOver` asks of a place -- and the feet are up there with it.
  const r = all.rock;
  if (r && wayOver(x, all) === r && feet < standTop(x, all.yard.at) - 1) return r;
  // Otherwise it is on the floor of the yard, and the only question left is
  // which side of the hole it is standing on. A body at the height of the
  // ground with the mouth under it is a body at the head of a ladder, one foot
  // over the lip: it is on the side it stepped off on, which is the side the
  // greater part of it is standing over. See `floorWay`.
  const on = floorWay(x, all);
  // A body standing at the height of the pile, with the pile under it, is ON
  // the pile -- the hole's own way, the one a hauler crosses a full pit by.
  // It used to be read as being on the yard, which is right for a body at the
  // head of a ladder with the pile far below and wrong for a body walking a
  // pile banked up to the brim: the yard's surface is then a body's height
  // under its feet, and the fall rule -- which asks this very function where
  // the body is standing -- read the crossing as five cells of nothing and
  // knocked it into the hole it was already walking over. Landed, it was
  // re-tasked home by the landing, sent straight back by its errand, and
  // crossed into the same fall for ever.
  // Judged at the body's own middle rather than by `standTop`, and that is not
  // a shortcut. `standTop` answers with the highest column under the body's
  // width, which is right for where its feet come to rest and wrong for saying
  // where it is standing: a body down in a one-body dip between two crests of
  // pile read as two cells *below* the surface, was ruled off the pile, and its
  // next route to a patch ten pixels away went back across the yard and up the
  // near ladder -- the reported lap: out along the pile, a fall into a dip,
  // back to the yard, out along the pile again.
  // ...within a couple of cells of either reading of the pile: `standTop`, the
  // highest column under the body's width -- where its feet come to rest on a
  // crest -- or the column under its own middle, where they rest in a dip a
  // body wide. One reading alone gets one of those wrong: judged only by
  // `standTop` a body down a dip read as buried under its neighbours; judged
  // only at its middle a body on a crest read as hovering. Both wrong answers
  // came out 'yard', and the next route to a patch ten pixels along went back
  // across the yard, through the pile's own mass at ground height, and up the
  // near ladder -- the reported lap. A body at a ladder head with the pile far
  // below matches neither reading and stays the yard's, which is what the
  // mapping below has always been for.
  if (on === all.hole) {
    const under = standTop(x, on.at);
    const mid = on.at(x + WORKER / 2);
    if (Math.min(Math.abs(feet - under), Math.abs(feet - mid)) <= P * 2) return on;
    // And a body whose feet are BELOW the pile is IN it, which is the hole's
    // way and not the yard's.
    //
    // The line under this one is written for the other side of the same
    // question: a body at a ladder head with the pile far below, feet well
    // ABOVE the surface, which really is standing on the yard at the lip. Feet
    // well UNDER it is not that body at all -- it is one the sand has closed
    // over -- and answering "the yard" for it hands back a way whose own span
    // (`yard.to = pit.x`) does not contain the body. Everything downstream then
    // inherits that: the router plans a walk home along a yard floor that stops
    // at the near wall, so the route runs through the length of the pile;
    // `feetOn` gives the ground line, so the body is planted inside the heap
    // every frame; and `climbTo` sees a one-pixel rise instead of a wall of
    // sand, so nothing ever lifts it out. The body walks on the spot, buried,
    // for ever.
    //
    // Unreachable while the hole could not fill: an empty hole puts the pile far
    // below everything over the mouth, so only the ladder-head case existed. A
    // full hole heaps above the ground line, and a full hole is where an endgame
    // yard lives -- see `## The rift` in DESIGN.md.
    if (feet > Math.max(under, mid)) return on;
  }
  return on === all.hole ? all.yard : on;
}

// Which floor a place is on: the yard, or the strip past the far wall of the
// hole, or -- for a place rather than a body -- the top of the pile between the
// two.
//
// Taken at the middle of a body rather than at its edge, because a body
// straddles a lip while it steps on and off the head of a ladder and has to
// come down on one side of it or the other. That one line is what replaced
// `w.farSide`: which side of the hole somebody is on is a thing you can see by
// looking at them, not a flag they have to remember to keep up to date.
function floorWay(x, all) {
  const h = all.hole;
  if (!h) return all.yard;
  const mid = x + WORKER / 2;
  if (mid > h.to) return all.past;
  if (mid > h.from) return h;
  return all.yard;
}

// The way a place is on, when the place is named by an x and nothing else.
//
// Almost everything that sends a body somewhere knows a number and not a
// surface: a station's stand, the head of a ladder, a patch of muck. Whatever is
// highest there is what "there" means -- a spot on the hill's footprint is on
// the hill, and everywhere else is the yard. That is the one line that decides
// who climbs: the gang's stand is on the crest, so their route goes up; a load
// of dust waiting on the far side of the yard is on the ground, so the route to
// it runs along the floor in front of the hill, which is flatter and shorter and
// therefore cheaper. Neither of those is a rule about miners or about haulers.
//
// And a place over the mouth of the hole is *in* the hole. There is no floor
// over an opening, and what a thing dropped there comes to rest on is the top
// of the pile -- `muckFloor` sends it to `pitTop` for exactly that reason. So
// the walk to a patch of muck over the mouth is a walk on to the hole's own
// surface, which is a walk down a ladder, and nothing had to be told that.
export function wayOver(x, all = ways()) {
  const r = all.rock;
  if (r && x + WORKER > r.from && x < r.to
      && standTop(x, r.at) < standTop(x, all.yard.at) - 1) return r;
  return floorWay(x, all);
}

// Is this body down a working: below the ground, in the cut or the hole?
//
// Asked in half a dozen places -- a lever wants somebody who can walk to it, a
// rock landing wants everybody who can see it, a body about to be caught short
// wants to be somewhere a shovel can reach -- and every one of them used to ask
// `w.inPit`, which was a flag the pit's own state machine kept and no other
// hole in the yard had. The question is about where a body is, so it is asked
// of where the body is.
export const inWorking = w => downAWorking(wayAt(w.x, w.y).key);

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
  // The two ladders in the walls of the hole, and they do not join the same
  // pair of ways: the near one joins the yard to the pile, the far one joins
  // the pile to the strip of ground beyond the far wall. Which is what they
  // are: there is no walking round to the top of the far ladder, so the only
  // approach to it is from inside the hole, and the only approach to the
  // ground it stands on is up it.
  //
  // That is the whole of the crossing. A body with business out past the hole
  // is offered one route, it has two climbs in it, and neither this file nor
  // the body knows that the errand is unusual.
  if (all.hole) {
    out.push({ x: pitLadder(NEAR).x, a: 'yard', b: 'hole', name: 'near pit ladder' });
    out.push({ x: pitLadder(FAR).x, a: 'past', b: 'hole', name: 'far pit ladder' });
  }
  // The two flanks of the hill. There is no ladder up a hill: you get on to it
  // by walking on to it, at the toe, on whichever side you arrive at -- and that
  // is exactly what a link is for. Each one sits just clear of the footprint, so
  // both ways are at the height of the yard there and the change costs nothing;
  // the going up is the walk along the rock way afterwards, which follows the
  // face cell by cell. That is how the gang have always mounted the hill, and it
  // is now the only way anybody does.
  if (all.rock) {
    out.push({ x: all.rock.from - WORKER, a: 'yard', b: 'rock', name: 'near rock flank' });
    out.push({ x: all.rock.to, a: 'yard', b: 'rock', name: 'far rock flank' });
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
//
// "The open yard" is a floor and not a name. Everywhere left of the hole that
// is the yard, and past the far wall of it that is the strip out there -- the
// same floor, with a hole in the middle of it -- so a caller that knows an x
// and nothing else gets the floor that x is actually on. Written as the yard
// outright, a walk to the ground behind the hole came back as one leg straight
// across the mouth, which is a body walking on air.
export const routeFor = (w, toX, toWay = null) => {
  const all = ways();
  return route(w.x, wayAt(w.x, w.y, all), toX, toWay || openFloor(toX, all), all);
};

// The floor at a place. Over the mouth of a hole there is no floor, and what a
// caller naming a bare x means by it is the lip it would stand at.
const openFloor = (x, all) => {
  const on = floorWay(x, all);
  // A body standing at the height of the pile, with the pile under it, is ON
  // the pile -- the hole's own way, the one a hauler crosses a full pit by.
  // It used to be read as being on the yard, which is right for a body at the
  // head of a ladder with the pile far below and wrong for a body walking a
  // pile banked up to the brim: the yard's surface is then a body's height
  // under its feet, and the fall rule -- which asks this very function where
  // the body is standing -- read the crossing as five cells of nothing and
  // knocked it into the hole it was already walking over. Landed, it was
  // re-tasked home by the landing, sent straight back by its errand, and
  // crossed into the same fall for ever.
  // Judged at the body's own middle rather than by `standTop`, and that is not
  // a shortcut. `standTop` answers with the highest column under the body's
  // width, which is right for where its feet come to rest and wrong for saying
  // where it is standing: a body down in a one-body dip between two crests of
  // pile read as two cells *below* the surface, was ruled off the pile, and its
  // next route to a patch ten pixels away went back across the yard and up the
  // near ladder -- the reported lap: out along the pile, a fall into a dip,
  // back to the yard, out along the pile again.
  // ...within a couple of cells of either reading of the pile: `standTop`, the
  // highest column under the body's width -- where its feet come to rest on a
  // crest -- or the column under its own middle, where they rest in a dip a
  // body wide. One reading alone gets one of those wrong: judged only by
  // `standTop` a body down a dip read as buried under its neighbours; judged
  // only at its middle a body on a crest read as hovering. Both wrong answers
  // came out 'yard', and the next route to a patch ten pixels along went back
  // across the yard, through the pile's own mass at ground height, and up the
  // near ladder -- the reported lap. A body at a ladder head with the pile far
  // below matches neither reading and stays the yard's, which is what the
  // mapping below has always been for.
  if (on === all.hole) {
    const under = standTop(x, on.at);
    const mid = on.at(x + WORKER / 2);
    if (Math.min(Math.abs(feet - under), Math.abs(feet - mid)) <= P * 2) return on;
  }
  return on === all.hole ? all.yard : on;
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
  const dt = frames();

  // A change of way with no height in it takes no time. Walking on to the toe
  // of the hill is a step across a join, not a climb: both ways are at the
  // height of the yard there, so the body is already standing where the change
  // puts it and the frame should carry on into the walk beyond rather than
  // being spent standing at the join. A frame spent is a frame's worth of
  // ground not covered, and a frame is a different length at every tick rate --
  // which is how a free join turned into a walk that was longer at a hundred
  // and twenty than at thirty.
  while (legs.length && legs[0].climb
         && Math.abs(feetOn(legs[0].to, legs[0].climb.x) - w.y) < 0.5) {
    w.x = legs[0].climb.x;
    plant(w, feetOn(legs[0].to, w.x));
    w.way = legs[0].to.key;
    legs.shift();
  }
  if (!legs.length) return false;
  const leg = legs[0];

  // Up or down a ladder, and nothing else while it is on one: a body on a rung
  // is not somewhere it can be walked sideways from, which is the rule that used
  // to be four copies of "hold x at the face".
  if (leg.climb) {
    w.x = leg.climb.x;
    const want = feetOn(leg.to, w.x);
    plant(w, w.y + Math.sign(want - w.y) * Math.min(CLIMB_PACE * dt, Math.abs(want - w.y)));
    if (Math.abs(want - w.y) < 0.5) { plant(w, want); w.way = leg.to.key; legs.shift(); }
    return true;
  }

  const d = leg.to - w.x;
  if (Math.abs(d) > 0.5) {
    // Nothing about facing here. Which way a body is pointing is measured off
    // the ground it has covered, once, at the end of the frame -- see
    // `faceTravel` in crew.js -- so a leg that moves a body says so by moving it.
    w.x += Math.sign(d) * Math.min(pace * dt, Math.abs(d));
  } else w.x = leg.to;
  // and the feet follow the surface it is walking over, which is what puts a
  // body up the side of the rock and over a heap without either being
  // mentioned -- and, where the surface ahead is too steep for the feet to
  // follow, holds the body back at the foot of it. See `climbTo`, which is the
  // one climber in this game now: the second one lived here, kept level with
  // the first by a hand-written line that copied `w.y` into `w.foot` after
  // every frame of every walk.
  w.y = climbTo(w, feetOn(leg.along, w.x));
  if (Math.abs(leg.to - w.x) < 0.5) legs.shift();
  return legs.length > 0;
}

// --- the climber ---------------------------------------------------------------
// One frame of a body getting from the height it is at to the height it should
// be at, and the height it reaches. Everything that moves a body along a surface
// goes through this: a miner on the crest, a hauler crossing the pile, a janitor
// walking past a bank, and every leg of every route.
//
// There were two of these. This one lived in crew.js and kept its answer in
// `w.foot`; the other lived here and did not, and the two were held level by a
// line in `stepRoute` that wrote `w.y` back into `w.foot` after every frame of
// every walk. A body handed back and forth between them with those out of step
// was dragged between two answers. One climber, and the cache is inside it.
//
// The pace is a floor and a fraction: near enough and it steps down a cell at a
// time, a long way off and it moves briskly, so it can always keep up with a
// crest coming apart underneath it and never looks detached from the rock.
const CLIMB_MIN = 1.1;             // pixels a frame at the least
const CLIMB_SHARE = 0.14;          // and this much of whatever is left
// and however far it walked, times this. A body walking on to the hill goes up
// the side it meets, which means its feet have to rise as fast as it is moving
// along: at a fixed pace the walk outruns the climb, and what that looks like is
// a body crossing the footprint at ground level and rising somewhere near the
// middle -- measured, twenty-three pixels inside the rock at fifty-six per cent
// of the way across it. Running to the centre and then going to the top.
//
// One and six tenths carries any slope up to about sixty degrees, which is the
// flank of a hill. What is steeper than that is a wall, and a wall is not
// something this number is meant to carry -- see below.
const CLIMB_SLOPE = 1.6;

// Feet where they are put, rather than eased to: a rung of a ladder, a step
// across a join, a body set down after a fall. The climber's memory is set with
// the body, so the next frame eases on from here instead of from wherever the
// body used to be.
export function plant(w, y) {
  w.y = w.foot = y;
  w.footAt = w.x;
  return y;
}

export function climbTo(w, want) {
  // Sand does not let you stand inside it.
  //
  // Everything below is a *climb*: feet lead, body follows, the step is given
  // back until they arrive. Right for rock, wrong for a body the pile has closed
  // over -- the ease will not carry a sheer face and sand is sheer, so it stands
  // at the foot of a wall of its own heap for ever, walking on the spot inside
  // it. Being buried is not a climb; the pile puts the body out on top of itself.
  //
  // Only a body with no route. One that HAS a route is going somewhere on
  // purpose -- down a ladder, over the heap, into the hole -- and its height is
  // that route's business. Written without this guard it shoved every descending
  // body back up the rungs it was climbing down, every frame, and left one
  // farmhand a hundred and twenty-nine pixels inside the pile: the cure making a
  // worse case of the disease.
  //
  // Half a cell a frame, not a snap -- half a cell is the bar `dance.test.mjs`
  // holds every move to, so a body lifted out while the yard is dancing is still
  // under it, and a body jumping its own height is the one thing this yard does
  // not do.
  if (pit.grid && pit.cols && !(w.route && w.route.length)) {
    const mid = w.x + WORKER / 2;
    if (mid > pit.x && mid < pit.x + pit.w && pitTop(mid) < w.y) {
      const out = Math.max(pitTop(mid) - WORKER, w.y - P / 2 * frames());
      w.foot = out;
      w.footAt = w.x;
      return out;
    }
  }

  // From where the body actually is. Seeding this with the target instead is a
  // body that arrives at the foot of the rock and is suddenly on top of it --
  // which is the one thing climbing was put in to stop.
  if (w.foot == null) w.foot = w.y;
  const was = w.footAt == null ? w.x : w.footAt;
  // How far it walked since the last time its feet were asked about, which is
  // what lets a walk up a slope keep its feet on the slope. See CLIMB_SLOPE.
  const along = w.x - was;
  const d = want - w.foot;
  // Per frame, times how long this frame was: at sixty that is one and the pace
  // is exactly what it always was. See `frames` in clock.js. The share of what
  // is left is a proportion rather than a distance, so it is raised to the
  // power instead of multiplied -- a fourteenth of the way there twice is not
  // twice a fourteenth of the way there.
  const f = frames();
  const chunk = Math.max(CLIMB_MIN * f, Math.abs(along) * CLIMB_SLOPE,
                         Math.abs(d) * (1 - (1 - CLIMB_SHARE) ** f));
  // and never more than a cell in a frame. The rock's surface is made of whole
  // cells, so what is under a body's feet does not slope -- it *steps*, six
  // pixels at a time, and at a corner two or three of those arrive together. A
  // foot that took all of it at once was a body jumping up the hill rather than
  // walking up it. A cell a frame is three hundred and sixty pixels a second,
  // which is faster than anything in this yard moves and still smooth.
  const step = Math.min(chunk, P * f);

  // A wall is not a slope, and this is the one place that says so.
  //
  // Everything above is an *ease*: the feet come up at the walking pace and a
  // half, which carries any bank in this yard and cannot carry a sheer face.
  // Walk into one and the body keeps its pace while its feet fall behind, so
  // for the length of the climb the body is inside the rock -- measured at
  // twenty-four pixels, which is more than a body is tall. The old answer to
  // that would be a faster ease, and a faster ease only moves the face that
  // beats it.
  //
  // So the feet lead and the body follows. If the ground it has just walked on
  // to is higher than the feet can reach this frame, then it did not get there:
  // the step is given back and the body stands at the foot of the face and
  // climbs, and it walks on in the frame its feet arrive. That is what a climb
  // *is*, and it is exactly what the ladder links already say about the two
  // holes with rungs in them -- said here for every face that has none, and
  // without naming a slope, a height or a job.
  //
  // The line is where it is because everything above already decides it. What
  // the feet can reach in a frame is `step`, and `step` is the walking pace and
  // a half: so a slope a walk can carry is carried, and anything steeper is
  // climbed. Nothing here is tuned, and nothing had to be told what a wall is.
  //
  // A stop rather than a slowing, and that matters. Braking in proportion to
  // how far behind the feet are makes the walk depend on a *state* -- the lag
  // -- and a state that unwinds at a different rate every tick length is a walk
  // that is a different length at thirty frames a second than at sixty.
  // `frame-rate.test.mjs` caught exactly that, the hour it was written.
  const rise = -d;                        // how far UP the feet still have to come
  // Going up at all is climbing, and a climbing body is not an unsupported one.
  // The wall branch below stamps the sheer case, but a climber's feet also lag
  // on any slope steep enough that a frame's walk outruns a frame's ease --
  // the flank of a full pit's pile, the toe of a big hill -- and the fall rule
  // read that lag as five cells of nothing and knocked the climber off ground
  // it was in the middle of mounting. The stamp says: these feet are being led
  // up a face by the one climber in the game, this very frame.
  if (rise > 0.5) w.scaleAt = S.tick;
  if (rise > step) {
    w.x = was;
    // And say so, on the body, with this frame's number. A wall climb holds the
    // body at the foot of the face with its feet leading up it, which from the
    // outside is indistinguishable from the thing the fall rule exists to catch:
    // a body high over the ground with nothing under it. The fall rule exempts a
    // ladder because a climb leg names itself; a face has no leg, so this is the
    // face naming itself. A stamp rather than a flag, because a flag would need
    // clearing by every mover that ends a climb, and a stale one would hold a
    // genuinely dropped body in the air.
    w.scaleAt = S.tick;
  }
  // There is deliberately NO mirror of that rule facing down. It was tried --
  // hold the step whenever the ground falls away faster than the feet follow --
  // and seven checks failed inside the minute: walks legitimately stride down
  // ramps, off ladder heads and over lips all across this yard, and a walk that
  // stops at every descent is a different length at every frame rate. What made
  // a body float off the crest was never the climber: it was movers that never
  // asked it (a roam that moved x and left y) or overrode it (a sway written as
  // a position). Fix the mover, not the law of walking.

  w.footAt = w.x;
  w.foot += Math.sign(d) * Math.min(Math.abs(d), step);
  return w.foot;
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
