// Getting from here to there: the one place that answers "how does a body get
// from where it is to where it wants to be", the same way for everybody.
//
// Nothing here is told about the rock, the quarry or the heaps. Two ideas:
//
//   **A surface.** For any place a body can be, the height of what it is
//   standing on. One question, and the answer is a number.
//
//   **A way, and the links between ways.** Most of the yard is one connected
//   surface. A hole in the ground is a *second* surface, connected to the
//   first only where somebody has put a ladder.
//
// A route is the shortest walk over that, worked out rather than declared. A
// quarrier leaves the cut by the ladder because the ladder is the only edge
// out; take it away and there is no route, and a body asked for one stays
// where it is. Adding a place to the yard means adding a way and saying what
// it links to.

import { P, WORKER, CLIMB_PACE } from './config.js';
import { S, floor, pit, quarry } from './state.js';
import { groundAt, rockLeft } from './world.js';
import { rockTopY, boulderAlive } from './rock.js';
import { surfaceY, colOf } from './grid.js';
import { cutTop, quarryFace } from './quarry.js';
import { pitTop, pitLadder, NEAR, FAR } from './pit.js';
import { frames } from './clock.js';

// --- the surface --------------------------------------------------------------
// The floor of the yard and nothing else: the ground line, and the deck of the
// bridge over the mouth of the hole.
//
// The hill is deliberately NOT in here. Put the hill in the floor and the hill
// becomes a road: every errand to the far side of the yard ramps over the
// summit, because the summit is the shortest way along the only surface there
// is. So the hill is its own way (`ways`), like the cut and the hole, and
// which of the two a body walks is decided by what a route costs, never by
// what the body does for a living.
//
// A heap of dust is not in here either (`footing`): loose ground is something
// you pass in front of, not something you stand on top of.
export function groundTop(x) {
  return Math.min(groundAt(x), S.groundY);
}

// The surface of the hill, a step per cell. Off its footprint, or in a column
// taken all the way down, the answer is the floor, which is what makes the two
// ends of the rock way meet the yard at the yard's height.
//
// Nothing else in the game is allowed to ask `rockTopY` about a walk.
export function rockTop(x) {
  const ground = groundTop(x);
  if (!boulderAlive()) return ground;
  const c = Math.floor((x - rockLeft()) / P);
  if (c < 0 || c >= S.gw) return ground;
  return Math.min(ground, rockTopY(c));
}

// How far the hill still reaches, or null when there is no hill left. Worked
// out from the columns every time, never kept: the flanks go bare long before
// the middle does, and a remembered span would run out over ground anybody
// can already walk. Columns hollowed out *between* the ends stay inside the
// span: a notch through the middle is a dip in the hill, not two hills.
export function rockSpan() {
  if (!boulderAlive()) return null;
  let lo = -1, hi = -1;
  for (let c = 0; c < S.gw; c++) if (S.rockTops[c] >= 0) { if (lo < 0) lo = c; hi = c; }
  if (lo < 0) return null;
  return { from: rockLeft() + lo * P, to: rockLeft() + (hi + 1) * P };
}

// --- what is underfoot, as opposed to how high it is --------------------------
// Whether a place is ground, which decides where anything can come to rest.
//
//   solid   ground, the bridge deck, the face of the rock, the floor of a
//           working. You can stand on it, and something dropped on it stays.
//   loose   a heap of dust, and a plot under a crop. A body walks past it at
//           the height of the ground and is drawn in front of it, and anything
//           that lands on one rolls down to the bare ground beside it.
//   none    the mouth of the quarry and the mouth of the hole.
//
// One property of a place; nothing below asks what a body does for a living.
export const SOLID = 'solid', LOOSE = 'loose', NONE = 'none';

// How deep the loose stuff lies at a place. Bare ground has none.
export function heapAt(x) {
  if (!floor.grid) return 0;
  const c = colOf(floor, x);
  if (c < 0 || c >= floor.cols) return 0;
  return Math.max(0, S.groundY - (surfaceY(floor, c) + floor.p));
}

// A scatter of loose grains lies all over the yard; it is a bank once it is
// deep enough to stand up against a body.
const HEAP_DEEP = P * 2;

// The ways that are holes in the ground rather than stretches of it.
export const WORKINGS = ['cut', 'hole'];
export const downAWorking = key => WORKINGS.includes(key);

export function footing(x, all = ways()) {
  // A mouth is not a surface. The margin is a whole cell short of the wall
  // (`x + P > w.from`), the very line `overPitMouth`/`overCutMouth` in
  // world.js draw: with the two a cell apart, a stance this one called solid
  // ground at the lip was already what that one called open air.
  for (const key of WORKINGS) {
    const w = all[key];
    if (w && x + P > w.from && x < w.to && standTop(x - WORKER / 2, w.at) > S.groundY + P) return NONE;
  }
  if (heapAt(x) >= HEAP_DEEP) return LOOSE;
  return SOLID;
}

// The nearest place to x that will take a pair of boots or a shovelful, or
// null if none within reach. One search for standing and for putting things
// down, so a body clearing a heap stands in front of it and the mess ends up
// in front of it too.
export function solidNear(x, reach = 40, all = ways()) {
  globalThis.__perf.stances++;               // the perf gate's: one search for a stance
  for (let d = 0; d <= reach; d++) {
    for (const at of (d ? [x - d * P, x + d * P] : [x])) {
      if (footing(at, all) === SOLID) return at;
    }
  }
  return null;
}

// What a body three cells wide stands on when the ground is not level: the
// highest surface under any part of it, so a body at the foot of a bank
// stands on the bank rather than sinking its uphill half into it.
export function standTop(leftX, at = groundTop, width = WORKER) {
  let top = Infinity;
  for (let x = leftX; x < leftX + width; x += P) top = Math.min(top, at(x));
  return Math.min(top, at(leftX + width - 1));
}

// Where a body's top edge goes standing at x on a given way. A way may say
// otherwise (`stand`): the floor of the cut finishes jagged on purpose, and a
// body digging it stands on the column under its middle (`stepQuarrier`);
// walked on the highest-of-three rule, the whole gang floated a course up
// over every dip. One floor, one rule.
export const feetOn = (way, leftX) =>
  (way.stand ? way.stand(leftX) : standTop(leftX, way.at)) - WORKER;

// --- the ways -----------------------------------------------------------------
// A way is a stretch of surface a body can walk end to end without climbing.
// Worked out from the yard rather than kept: the quarry is dug and filled in,
// the pit grows, and a remembered span would be a way to somewhere that has
// moved.
//
//   key    what it is called, which is what a body remembers it is on
//   from   the left-hand end of it, in world x
//   to     and the right-hand end
//   at     the surface under a point on it
//
// Built once per outline, not once per asker: everything the object holds is
// a live function or one of eight scalars, so the same scalars mean the same
// ways. Without this the busy yard built it fifty times a frame. The perf
// gate (test/perf-gate.test.mjs) counts the builds.
//
// The outline can change mid-frame (the gang are stepped one after another,
// and the one that knocks the last cell off the hill's edge moves `rockSpan`
// for every body after it), so a second build on the same frame is counted
// only when it is for an outline already built that frame: the cache
// thrashing between two outlines, which is what the counter is for.
let last = null, lastKey = '', builtTick = -1;
const builtKeys = new Set();

export function ways() {
  const span = rockSpan();
  const key = `${S.quarryOpen ? 1 : 0}|${pit.grid && pit.cols ? pit.x + ',' + pit.w : ''}|` +
              `${quarry.x},${quarry.w}|${span ? span.from + ',' + span.to : ''}`;
  if (last && key === lastKey) return last;
  if (S.tick !== builtTick) { builtTick = S.tick; builtKeys.clear(); }
  if (!builtKeys.size || builtKeys.has(key)) globalThis.__perf.ways++;   // the perf gate's
  builtKeys.add(key);
  lastKey = key;
  return last = buildWays(span);
}

function buildWays(span) {
  const out = { yard: { key: 'yard', from: -1e6, to: 1e6, at: groundTop } };

  // The floor of the cut: below the ground and joined to the yard nowhere but
  // the ladder, which is why a quarrier cannot climb out of the side of it.
  if (S.quarryOpen)
    out.cut = { key: 'cut', from: quarry.x, to: quarry.x + quarry.w, at: cutTop,
                stand: leftX => cutTop(leftX + WORKER / 2) };   // the column under its middle, as the dig does

  // The hole cuts the yard in two. The mouth is not a surface, so the floor
  // of the yard stops at the near wall and starts again past the far one;
  // written as one floor, a route to the strip out there is a walk on air,
  // and the far ladder is a rung nobody has reason to use. So: two ways with
  // a hole between them, and the crossing costs a climb down and up.
  if (pit.grid && pit.cols) {
    out.hole = { key: 'hole', from: pit.x, to: pit.x + pit.w, at: pitTop };
    out.past = { key: 'past', from: pit.x + pit.w, to: 1e6, at: groundTop };
    out.yard.to = pit.x;
  }

  // The hill: a surface *above* the ground, joined to the yard at the two
  // places you can walk on to it. Its span is whatever still has rock in it
  // (`rockSpan`) and its surface is read off the columns when asked, so mine
  // the crest down and the walk over it flattens the same frame; take the
  // last of it down and every route that used it stops being offered.
  if (span) out.rock = { key: 'rock', from: span.from, to: span.to, at: rockTop };

  return out;
}

// Which way a body is on, from where it is. Asked rather than stored, so a
// body dropped into a hole is in the hole and a body thrown on to the crest
// is on the hill, without anybody having to say so.
//
// Below the yard's floor and inside a working's span is down that working.
// On the hill is decided by *height*, not x: a hauler crossing the footprint
// at ground level and a rockhand on the crest are at the same x and are not
// in the same place. A heap is nobody's way: standing on a bank is standing
// on the yard, higher up.
export function wayAt(x, y, all = ways()) {
  const feet = y + WORKER;
  if (feet > S.groundY + 1) {
    for (const key of WORKINGS) {
      const w = all[key];
      if (w && x + WORKER > w.from && x < w.to) return w;
    }
  }
  const r = all.rock;
  if (r && wayOver(x, all) === r && feet < standTop(x, all.yard.at) - 1) return r;
  // Otherwise the floor of the yard, and the question is which side of the
  // hole. A body at ground height with the mouth under it is at the head of a
  // ladder, one foot over the lip, on the side the greater part of it stands
  // over (`floorWay`).
  const on = floorWay(x, all);
  // A body standing at the height of the pile, with the pile under it, is ON
  // the pile: the hole's own way, the one a hauler crosses a full pit by.
  // Read as the yard, the fall rule saw a body's height of nothing under its
  // feet and knocked it into the hole it was walking over, forever.
  //
  // Within two cells of EITHER reading of the pile: `standTop` (the highest
  // column under the body, where feet rest on a crest) or the column under
  // its own middle (where they rest in a body-wide dip). Judged by one alone,
  // a body in a dip read as buried, or a body on a crest as hovering, and
  // either wrong answer came out 'yard' and sent the next ten-pixel route back
  // across the yard and up the near ladder. A body at a ladder head with the
  // pile far below matches neither and stays the yard's.
  if (on === all.hole) {
    const under = standTop(x, on.at);
    const mid = on.at(x + WORKER / 2);
    if (Math.min(Math.abs(feet - under), Math.abs(feet - mid)) <= P * 2) return on;
    // Feet BELOW the pile is a body the sand has closed over, and it is in the
    // hole, not on the yard: answered "yard", the route home runs along a
    // floor that stops at the near wall, `feetOn` plants it inside the heap
    // every frame and `climbTo` sees a one-pixel rise instead of a wall of
    // sand, so it walks on the spot, buried, forever. Only reachable once a
    // full hole heaps above the ground line (DESIGN.md, "The rift").
    if (feet > Math.max(under, mid)) return on;
  }
  return on === all.hole ? all.yard : on;
}

// Which floor a place is on: the yard, the strip past the far wall, or the
// top of the pile between. Taken at the middle of a body rather than its
// edge, because a body straddles a lip stepping on and off a ladder head and
// has to come down on one side. Which side of the hole somebody is on is a
// thing you can see by looking, not a flag to keep up to date.
function floorWay(x, all) {
  const h = all.hole;
  if (!h) return all.yard;
  const mid = x + WORKER / 2;
  if (mid > h.to) return all.past;
  if (mid > h.from) return h;
  return all.yard;
}

// The way a place is on, when the place is named by an x and nothing else.
// Whatever is highest there is what "there" means: a spot on the hill's
// footprint is on the hill, so the gang's route goes up; a load of dust on
// the far side of the yard is on the ground, so the route runs along the
// floor in front of the hill, which is cheaper. Neither is a rule about
// rockhands or haulers.
//
// A place over the mouth of the hole is *in* the hole: what a thing dropped
// there rests on is the top of the pile (`muckFloor` sends it to `pitTop`),
// so the walk to it is a walk down a ladder.
export function wayOver(x, all = ways()) {
  const r = all.rock;
  if (r && x + WORKER > r.from && x < r.to
      && standTop(x, r.at) < standTop(x, all.yard.at) - 1) return r;
  return floorWay(x, all);
}

// Is this body down a working: below the ground, in the cut or the hole?
//
// Below the ground line at all counts, not only inside a working's span: the
// yard re-walks when a station grows (`DRAWN_W` in world.js) and the cut can
// move a hundred pixels out from under a quarrier mid-swing. For the one
// frame before the quarrier's guard sends it back, `wayAt` reads that body as
// on the yard, and a stage that took it at its word held a body on a break
// standing in rock.
export const inWorking = w => w.y + WORKER > S.groundY + 1
                           || downAWorking(wayAt(w.x, w.y).key);

// --- the links ----------------------------------------------------------------
// Where one way joins another, and the only places they do. A link is a
// ladder: a place you can change what you are standing on, at the cost of
// climbing. This is the entire connectivity of the world; a shaft, a lift or
// a ramp is a row here.
export function links(all = ways()) {
  const out = [];
  if (all.cut) out.push({ x: quarryFace(), a: 'yard', b: 'cut', name: 'quarry ladder' });
  // The near ladder joins the yard to the pile, the far one the pile to the
  // strip beyond the far wall: there is no walking round to the top of the
  // far ladder, so the only approach to it is from inside the hole.
  if (all.hole) {
    out.push({ x: pitLadder(NEAR).x, a: 'yard', b: 'hole', name: 'near pit ladder' });
    out.push({ x: pitLadder(FAR).x, a: 'past', b: 'hole', name: 'far pit ladder' });
  }
  // The two flanks of the hill. Each sits just clear of the footprint, so both
  // ways are at the height of the yard there and the change costs nothing; the
  // going up is the walk along the rock way afterwards.
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
// A plain search over a handful of ways, bounded at two links deep. A climb
// is counted at what it costs to do, so a deep hole is dear and a shallow one
// is not, and a body picks the near ladder or the far one on the arithmetic.
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

// The route from where a body stands to a place on the open yard. "The open
// yard" is a floor, not a name: a caller that knows an x and nothing else gets
// the floor that x is on, or a walk to the ground behind the hole comes back
// as one leg straight across the mouth.
export const routeFor = (w, toX, toWay = null) => {
  const all = ways();
  return route(w.x, wayAt(w.x, w.y, all), toX, toWay || openFloor(toX, all), all);
};

// The floor at a place. Over the mouth of a hole there is no floor, and a
// caller naming a bare x means the lip it would stand at: a bare x has no
// height, so whether it means the pile cannot be asked of it (a caller that
// means the pile names the way).
const openFloor = (x, all) => {
  const on = floorWay(x, all);
  return on === all.hole ? all.yard : on;
};

// --- walking it ---------------------------------------------------------------
// One frame of a route. Returns true while there is still walking to do.
// Nothing here knows what a quarry is: a body on the floor of the cut walks
// its legs, along the floor, up the ladder, along the yard.
export function stepRoute(w, pace) {
  const legs = w.route;
  if (!legs || !legs.length) return false;
  const dt = frames();

  // A change of way with no height in it takes no time: the body is already
  // standing where the change puts it, and a frame spent at the join is
  // ground not covered, a different amount at every tick rate.
  while (legs.length && legs[0].climb
         && Math.abs(feetOn(legs[0].to, legs[0].climb.x) - w.y) < 0.5) {
    w.x = legs[0].climb.x;
    plant(w, feetOn(legs[0].to, w.x));
    w.way = legs[0].to.key;
    legs.shift();
  }
  if (!legs.length) return false;
  const leg = legs[0];

  // Up or down a ladder, and nothing else while on one: a body on a rung is
  // not somewhere it can be walked sideways from.
  if (leg.climb) {
    w.x = leg.climb.x;
    const want = feetOn(leg.to, w.x);
    plant(w, w.y + Math.sign(want - w.y) * Math.min(CLIMB_PACE * dt, Math.abs(want - w.y)));
    if (Math.abs(want - w.y) < 0.5) { plant(w, want); w.way = leg.to.key; legs.shift(); }
    return true;
  }

  const d = leg.to - w.x;
  if (Math.abs(d) > 0.5) {
    // Nothing about facing here: which way a body points is measured off the
    // ground it covered, once, at the end of the frame (`faceTravel` in
    // crew.js).
    w.x += Math.sign(d) * Math.min(pace * dt, Math.abs(d));
  } else w.x = leg.to;
  // The feet follow the surface, which is what puts a body up the side of the
  // rock and over a heap; where the surface ahead is too steep, `climbTo`
  // holds the body back at the foot of it.
  w.y = climbTo(w, feetOn(leg.along, w.x));
  if (Math.abs(leg.to - w.x) < 0.5) legs.shift();
  return legs.length > 0;
}

// --- the climber ---------------------------------------------------------------
// One frame of a body getting from the height it is at to the height it
// should be at. Everything that moves a body along a surface goes through
// this, and the cache (`foot`, `footAt`) is inside it: two climbers held
// level by hand dragged a body between two answers.
//
// The pace is a floor and a fraction: near enough and it steps down a cell at
// a time, a long way off it moves briskly, so it keeps up with a crest coming
// apart underneath it.
const CLIMB_MIN = 1.1;             // pixels a frame at the least
const CLIMB_SHARE = 0.14;          // and this much of whatever is left
// And however far it walked, times this: a body walking on to the hill goes
// up the side it meets, so its feet have to rise as fast as it moves along, or
// it crosses the footprint at ground level inside the rock and rises near the
// middle. One and six tenths carries any slope up to about sixty degrees;
// steeper is a wall, handled below.
const CLIMB_SLOPE = 1.6;

// Feet where they are put, rather than eased to: a rung, a step across a
// join, a body set down after a fall. The climber's memory is set with the
// body, so the next frame eases on from here.
export function plant(w, y) {
  w.y = w.foot = y;
  w.footAt = w.x;
  return y;
}

export function climbTo(w, want) {
  // Sand does not let you stand inside it. Everything below is a *climb*, and
  // the ease will not carry a sheer face; sand is sheer, so a body the pile
  // has closed over would stand at the foot of its own heap forever. The pile
  // puts it out on top of itself.
  //
  // Only a body with no route: one that HAS a route is going somewhere on
  // purpose (down a ladder, into the hole) and its height is the route's
  // business. Without the guard this shoved every descending body back up
  // the rungs it was climbing down.
  //
  // Half a cell a frame, not a snap: half a cell is the bar `dance.test.mjs`
  // holds every move to.
  if (pit.grid && pit.cols && !(w.route && w.route.length)) {
    const mid = w.x + WORKER / 2;
    if (mid > pit.x && mid < pit.x + pit.w && pitTop(mid) < w.y) {
      const out = Math.max(pitTop(mid) - WORKER, w.y - P / 2 * frames());
      w.foot = out;
      w.footAt = w.x;
      return out;
    }
  }

  // From where the body actually is; seeded with the target, a body arriving
  // at the foot of the rock is suddenly on top of it.
  if (w.foot == null) w.foot = w.y;
  const was = w.footAt == null ? w.x : w.footAt;
  // How far it walked since its feet were last asked about (CLIMB_SLOPE).
  const along = w.x - was;
  const d = want - w.foot;
  // Per frame, times how long this frame was (`frames` in clock.js). The
  // share of what is left is a proportion, so it is raised to the power
  // rather than multiplied: a fourteenth of the way there twice is not twice
  // a fourteenth.
  const f = frames();
  const chunk = Math.max(CLIMB_MIN * f, Math.abs(along) * CLIMB_SLOPE,
                         Math.abs(d) * (1 - (1 - CLIMB_SHARE) ** f));
  // Never more than a cell in a frame: the rock's surface *steps*, six pixels
  // at a time, and at a corner two or three arrive together. A cell a frame is
  // three hundred and sixty pixels a second, faster than anything here moves.
  const step = Math.min(chunk, P * f);

  // A wall is not a slope, and this is the one place that says so. The ease
  // above carries any bank and cannot carry a sheer face: walk into one and
  // the body keeps its pace while its feet fall behind, so it is inside the
  // rock for the length of the climb. So the feet lead and the body follows:
  // if the ground it has walked on to is higher than the feet can reach this
  // frame, the step is given back and the body climbs at the foot of the face.
  //
  // A stop rather than a slowing: braking in proportion to the lag makes the
  // walk depend on a state that unwinds at a different rate every tick
  // length, and `frame-rate.test.mjs` catches exactly that.
  const rise = -d;                        // how far UP the feet still have to come
  // Going up at all is climbing, and a climbing body is not an unsupported
  // one: a climber's feet lag on any slope where a frame's walk outruns a
  // frame's ease, and the fall rule read that lag as five cells of nothing.
  if (rise > 0.5) w.scaleAt = S.tick;
  if (rise > step) {
    w.x = was;
    // A wall climb holds the body at the foot of the face with its feet
    // leading up it, which from outside is exactly what the fall rule exists
    // to catch. A ladder names itself with a climb leg; a face has no leg, so
    // this is the face naming itself. A stamp rather than a flag, because a
    // stale flag would hold a genuinely dropped body in the air.
    w.scaleAt = S.tick;
  }
  // Deliberately NO mirror of that rule facing down: walks legitimately stride
  // down ramps, off ladder heads and over lips all across this yard, and a
  // walk that stops at every descent is a different length at every frame
  // rate. A body floating off the crest is a mover that never asked the
  // climber or overrode it. Fix the mover, not the law of walking.

  w.footAt = w.x;
  w.foot += Math.sign(d) * Math.min(Math.abs(d), step);
  return w.foot;
}

// Put a body on a route to somewhere, or say there is no way there. The route
// is remembered along with what it was a route *to*, for `keepTo`.
export function sendTo(w, toX, toWay = null) {
  const r = routeFor(w, toX, toWay);
  w.route = r ? r.legs : null;
  w.routeTo = r ? toX : null;
  w.routeWay = r ? (toWay ? toWay.key : 'yard') : null;
  return !!r;
}

// Keep a body walking to a place, rebuilding the route only when the
// destination has actually moved. Destinations move (the ladder head shifts
// as the cut is dug, a station is resited, an errand changes mid-walk), and a
// route walked to where the target *used to be* overshot by an amount that
// depended on where the frame boundaries fell.
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
