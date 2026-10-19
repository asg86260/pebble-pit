// The two of them as souls and ghosts, and the road they walk (DESIGN.md,
// "Acts 3 and 4", "Back to the surface, dead", and "The portals and the
// mansion"). A portal is the camera's way between two places; a body never
// goes through one. The road is real ground, every step of it an ordinary
// world position: out of the fallen house, up heaven's cloud stair to its
// gates, and through them straight up the light to the cloud floor above
// (the places are stacked, so the souls rise into the afterlife rather than
// appear there); back down the same way, down the light and the stair to the
// ruin; and for act 4, into
// the drowned pit, down through the abyss to the deep's floor, along it to
// hell's white-hot slit and down through that onto hell's floor. A carry on
// the road is a trip that takes its time (call 5: the dead carry, they do not
// work): a load of the yard's dust taken off the purse at the ruin and
// handed in at the barrier.
//
// `S.acts.pair` is where the first of them is ({ x, y } top-left, world
// pixels), the route and leg it is on, where it is held (a beat calls them
// to the cage or home), what it carries, what it is (a soul, a ghost, or
// alive again) and how many of its rim's pieces are inked; the second walks
// GHOST_GAP behind. Saved whole (actbeats.js), so a reload lands them where
// they stood, on the leg they were walking.

import { S, pit } from './state.js';
import { P, WORKER, FINALE_HOUSE_W, GHOST_PX_S, GHOST_LOAD, GHOST_GAP, HELL_TIERS, ACT_RIDE_S, ACT_GATES_SKY, ACT_GATES_REACH,
         ACT_GATES_NEAR, ACT_GATES_LIGHT, ACT_STAIR_TREAD, ACT_STAIR_RISE, ACT_STAIR_UP, ACT_STAIR_LANDING, MANSION_SOULS } from './config.js';
import { houseX } from './home.js';
import { feetOn, ways } from './route.js';
import { afterFloor, afterTop, stationBox, stationX0, speakerAt } from './after/place.js';
import { hellTop, chamberFloor, chamberAtX, chamberFocusX, storeX as hellStoreX } from './hell/place.js';
import { deepTop, deepFloor } from './deep/place.js';
import { portalEnd } from './portals.js';
import * as HELL from './hell/index.js';
import { mansionDoorX, soulAt } from './mansion.js';

const snap = v => Math.round(v / P) * P;

// --- the road's marks ------------------------------------------------------------
// Heaven's gates in the yard (portals.js): `y` the gateway's middle, `feet`
// the bank they stand on.
export const tear = () => portalEnd('heaven', 'yard');
export const slit = () => portalEnd('hell', 'deep');
// The ruin's middle, where the house's door was.
export const ruinX = () => snap(houseX() + FINALE_HOUSE_W * P / 2 - WORKER / 2);

// --- heaven's stair --------------------------------------------------------------
// The walk up it, as a body's top-left at every corner: from its foot on the
// ground straight under the gates, a flight of ACT_STAIR_UP steps away from the
// ruin -- a cell to the riser, up it, and on along the tread -- across the
// landing, a flight back the rest of the way up to the bank, and along the
// bank into the gateway, the threshold. The drawing's treads are the cells
// under it (render/portals.js, `stairTreads`), so a body walks on cloud.
const STAIR_BACK = ACT_GATES_SKY / P / ACT_STAIR_RISE - ACT_STAIR_UP;
let walkMemo = null, walkFor = null;
export function stairWalk() {
  const x0 = tearX(), g = snap(S.groundY);
  if (walkMemo && walkFor === `${x0},${g}`) return walkMemo;
  const pts = [{ x: x0, y: g - WORKER }];
  let x = x0, y = g - WORKER;
  const flight = (d, n) => {
    for (let k = 0; k < n; k++) {
      x += d * P; pts.push({ x, y });
      y -= ACT_STAIR_RISE * P; pts.push({ x, y });
      x += d * (ACT_STAIR_TREAD - 1) * P; pts.push({ x, y });
    }
  };
  flight(1, ACT_STAIR_UP);
  x += ACT_STAIR_LANDING * P; pts.push({ x, y });
  flight(-1, STAIR_BACK);
  pts.push({ x: x0, y });
  walkFor = `${x0},${g}`; walkMemo = pts;
  return pts;
}
export const STAIR_POINTS = 2 + 3 * ACT_STAIR_UP + 1 + 3 * STAIR_BACK;
// The stair's foot, and the threshold at its top.
export const stairFoot = () => stairWalk()[0];
export const threshold = () => stairWalk()[STAIR_POINTS - 1];
// Where a walk `d` world px along a run of corners has got to: { x, y, done }.
export function alongWalk(pts, d) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.y - a.y);
    if (d <= L) { const k = L > 0 ? d / L : 1; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, done: false }; }
    d -= L;
  }
  const z = pts[pts.length - 1];
  return { x: z.x, y: z.y, done: true };
}
export const walkLength = pts => pts.reduce((n, b, i) => (i ? n + Math.hypot(b.x - pts[i - 1].x, b.y - pts[i - 1].y) : 0), 0);
// The freed souls' way down (mansion.js): out of the light over the open
// gates, down through them and the stair to its foot.
export const lightDown = () => {
  const t = threshold();
  return [{ x: t.x, y: t.y - ACT_GATES_LIGHT * P }, ...stairWalk().slice().reverse()];
};
const UP_LEGS = Array.from({ length: STAIR_POINTS - 1 }, (_, i) => ({ to: () => stairWalk()[i + 1] }));
const DOWN_LEGS = Array.from({ length: STAIR_POINTS - 1 }, (_, i) => ({ to: () => stairWalk()[STAIR_POINTS - 2 - i] }));

// Whether a body stands at heaven's gates, at either end or on the light
// between, so they stand open for it (portals.js, `stepGates`): the pair, or
// a freed soul on its way down.
export function atGates() {
  const e = tear(), up = portalEnd('heaven', 'after');
  if (!e || !up) return false;
  const reach = ACT_GATES_REACH + ACT_GATES_NEAR;
  const near = b => {
    if (Math.abs(b.x + WORKER / 2 - e.x) > reach) return false;
    const foot = b.y + WORKER;
    return (foot >= e.top && foot <= e.feet + P) || (foot > up.feet - P && foot < e.top);
  };
  const pair = pairBodies();
  if (pair && pair.some(near)) return true;
  for (let i = 0; i < MANSION_SOULS; i++) { const s = soulAt(i); if (s && s.stair && near(s)) return true; }
  return false;
}
// The camp's pedestal, the two of them at its foot (after/place.js).
export const campX = () => snap(stationBox('pedestal').x - WORKER - P);
// Up onto it: the pillar's left face (a body standing flush against it), the
// feet on its top, and the front speaker's spot (place.js, `speakerAt`), the
// other a step behind. Once there the pedestal's own drawing is them
// (render/after/pedestal.js), the road's faded off over it (`pair.top`).
const pillarFootX = () => snap(stationX0('pedestal') + P - WORKER);
const pillarFeet = () => speakerAt(0).y - WORKER;
const speakerX = () => speakerAt(1).x;
// Into the drowned pit a few cells off its near wall.
export const pitX = () => snap(pit.x + P * 4);
export const slitX = () => snap(slit().x - WORKER / 2);
// In hell: the landing's store, where a load is handed in, and the cage
// room, where a beat calls the two of them (hell/place.js).
export const storeX = () => snap(hellStoreX() - WORKER / 2);
export const cageX = () => snap(chamberFocusX(HELL_TIERS.length - 1) - WORKER / 2);
const hellLegX = () => (S.acts && S.acts.pair && S.acts.pair.hold === 'cage' ? cageX() : storeX());
function tearX() { return snap(tear().x - WORKER / 2); }
export const yardFeet = x => feetOn(ways().yard, x);
const afterFeet = () => afterFloor() - WORKER;
const deepFeet = () => deepFloor() - WORKER;
// The floor of the chamber a body is over (each lower than the last), the
// landing's off the run.
const hellFeet = x => chamberFloor(Math.max(0, chamberAtX(x))) - WORKER;

// The routes, each a run of legs: `h` along the ground to an x (standing on
// `y` of where it is), `v` straight up or down to a y, `to` a slant to a
// point (the stair).
const ROUTES = {
  // out of the ruin, up the stair to the gates; then through them, up the light
  climb: [{ h: () => stairFoot().x, y: yardFeet }, ...UP_LEGS],
  rise: [{ v: afterFeet }],
  camp: [{ h: campX, y: afterFeet }],
  // up the pillar's face onto its top, and back down
  pedestal: [{ h: pillarFootX, y: afterFeet }, { v: pillarFeet }, { h: speakerX, y: pillarFeet }],
  off: [{ h: pillarFootX, y: pillarFeet }, { v: afterFeet }],
  // to the gates on the cloud floor, down through them and the light to the
  // gates over the yard, down the stair, and along to the ruin
  down: [{ h: tearX, y: afterFeet }, { v: () => threshold().y }, ...DOWN_LEGS, { h: ruinX, y: yardFeet }],
  // act 4's carry: the ruin to the cage and back (LOOP_CAGE, LOOP_HOME)
  loop: [{ h: pitX, y: yardFeet }, { v: deepFeet }, { h: slitX, y: deepFeet }, { v: () => hellFeet(slitX()) }, { h: hellLegX, y: hellFeet },
         { h: slitX, y: hellFeet }, { v: deepFeet }, { h: pitX, y: deepFeet }, { v: () => yardFeet(pitX()) }, { h: ruinX, y: yardFeet }],
  // home at the end: from the ruin to the mansion's door
  door: [{ h: () => mansionDoorX() - WORKER / 2, y: yardFeet }]
};
export const LOOP_CAGE = 4, LOOP_HOME = ROUTES.loop.length - 1;

// --- where -----------------------------------------------------------------------
// The place a body at height y is seen in, if any: the afterlife over the
// cloud floor, the yard from heaven's tear down, the deep, hell. Between the
// tear and the cloud floor, and in the rock between the deep and hell, it is
// on the road and in none of them.
export function placeAt(y) {
  if (y + WORKER <= afterFloor() + P && y >= afterTop()) return 'after';
  if (y < tear().y - WORKER) return null;
  if (y < deepTop()) return 'yard';
  if (y + WORKER <= deepFloor() + P) return 'deep';
  if (y >= hellTop() - WORKER) return 'hell';
  return null;
}
// The place the camera should be in to watch a body at height y: the one it
// is in, or the one it is on its way into.
export function placeFor(y) {
  const at = placeAt(y);
  if (at) return at;
  if (y < tear().y) return 'after';
  return 'hell';
}

// On the heaven road: in the sky between the tear and the cloud floor, where
// the road's own layer draws a body (render/road.js).
export const onRoad = y => !placeAt(y) && y < tear().y && y > afterTop();

// Where the pair are next seen: where they stand, while that is in a place;
// on the way up from the ruin, where they are, since the rise is ridden up
// the road in one shot (actbeats.js); crossing between two places any other
// way (down the sky from the cloud floor to the tear, the rock from the
// deep's floor to hell), where the leg they are on comes out -- the camera
// goes there by the ripple and they walk into it (shot.js, rule 5).
export function seenAt(p = S.acts && S.acts.pair) {
  if (!p) return null;
  if (placeAt(p.y) || (p.route === 'rise' && onRoad(p.y))) return { x: p.x, y: p.y };
  const L = p.route && ROUTES[p.route][p.leg];
  if (L && L.v) return { x: p.x, y: L.v() };
  if (L && L.to) return L.to();
  return { x: p.x, y: p.y };
}

// The pair's two bodies, [first, second]: the second GHOST_GAP behind the way
// the first is facing. Null with no pair.
// On the stair the second walks GHOST_GAP behind along the walk itself, so
// it stands on a tread rather than beside one in the air (`trail`).
export function pairBodies() {
  const p = S.acts && S.acts.pair;
  if (!p) return null;
  const poly = trail(p), d = poly ? along(poly, p) : null;
  const second = d != null ? alongWalk(poly, Math.max(0, d - GHOST_GAP)) : { x: p.x - (p.face || 1) * GHOST_GAP, y: p.y };
  return [{ x: p.x, y: p.y }, { x: second.x, y: second.y }];
}
// The walk the first is on while it is on the stair: up it from the ground
// short of its foot to the threshold, or down it from the bank on the side
// the light was come down on (the camp's) to the ground past its foot. Far
// out along the ground or the bank either is the plain offset behind.
const FAR = P * 1e4;
function trail(p) {
  if (p.route === 'climb' || p.at === 'climb') {
    const w = stairWalk();
    return [{ x: w[0].x - FAR, y: w[0].y }, ...w];
  }
  if ((p.route === 'down' && p.leg >= 2) || p.at === 'down') {
    const w = stairWalk(), t = threshold(), side = Math.sign(campX() - tearX()) || -1;
    return [{ x: t.x + side * FAR, y: t.y }, ...w.slice().reverse(), { x: w[0].x - FAR, y: w[0].y }];
  }
  return null;
}
// How far along a walk a point lying on it is, or null if it is not on it.
function along(pts, at) {
  let n = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.y - a.y);
    const t = L > 0 ? ((at.x - a.x) * (b.x - a.x) + (at.y - a.y) * (b.y - a.y)) / (L * L) : 0;
    if (t >= -1e-6 && t <= 1 + 1e-6 && Math.hypot(a.x + (b.x - a.x) * t - at.x, a.y + (b.y - a.y) * t - at.y) < 0.5) return n + t * L;
    n += L;
  }
  return null;
}

// --- walking ---------------------------------------------------------------------
// Set off on a route from where it stands; one already being walked is
// walked on from the leg it is on (a beat played again after a reload).
export function sendPair(route, leg = 0) {
  const p = S.acts.pair;
  if (p.route === route) return;
  p.route = route; p.leg = leg; p.at = null;
}
export const pairAt = where => !!(S.acts && S.acts.pair && S.acts.pair.at === where);

// One frame of the pair's walk, `dist` world pixels of it.
export function stepPair(dist) {
  const p = S.acts && S.acts.pair;
  if (!p || !p.route) return;
  for (let n = 0; n < 4 && dist > 0 && p.route; n++) {
    const L = ROUTES[p.route][p.leg];
    if (!L) { p.at = p.route; p.route = null; return; }
    let done = false;
    if (L.h) {
      const d = L.h() - p.x, m = Math.min(Math.abs(d), dist);
      if (Math.abs(d) > 0.01) p.face = Math.sign(d);
      p.x += Math.sign(d) * m; dist -= m;
      p.y = L.y(p.x);
      done = Math.abs(L.h() - p.x) < 0.01;
    } else if (L.v) {
      const d = L.v() - p.y, m = Math.min(Math.abs(d), dist);
      p.y += Math.sign(d) * m; dist -= m;
      done = Math.abs(L.v() - p.y) < 0.01;
    } else {
      const to = L.to(), dx = to.x - p.x, dy = to.y - p.y, len = Math.hypot(dx, dy);
      if (len < 0.01) done = true;
      else {
        const m = Math.min(len, dist);
        p.x += dx / len * m; p.y += dy / len * m; dist -= m;
        if (Math.abs(dx) > 0.01) p.face = Math.sign(dx);
        done = m >= len;
      }
    }
    if (!done) return;
    legEnd(p);
  }
}

function legEnd(p) {
  if (p.route !== 'loop') {
    p.leg++;
    if (p.leg >= ROUTES[p.route].length) {
      p.at = p.route; p.route = null;
      // a walk with another after it (down from the cloud, then the loop)
      if (p.then) { const next = p.then; p.then = null; sendPair(next); }
    }
    return;
  }
  if (p.leg === LOOP_CAGE) {
    // The load handed in at the barrier: to hell's stores when act 4's mine
    // takes it (`takeCarry`, Track B's seam), else kept on the acts' own tally.
    if (p.carry > 0) {
      if (typeof HELL.takeCarry === 'function') HELL.takeCarry(p.carry);
      else S.acts.purse = (S.acts.purse || 0) + p.carry;
      S.acts.carried = (S.acts.carried || 0) + p.carry;
      p.carry = 0;
    }
    if (p.hold === 'cage') { p.at = 'cage'; p.route = null; return; }
  }
  if (p.leg === LOOP_HOME) {
    if (p.hold === 'home') { p.at = 'home'; p.route = null; return; }
    p.leg = 0;
    takeLoad(p);
    return;
  }
  p.leg++;
}

// A load off the purse at the ruin, if the purse holds one.
export function takeLoad(p) {
  if (p.carry > 0 || !(S.stored >= GHOST_LOAD)) return;
  S.stored -= GHOST_LOAD;
  p.carry = GHOST_LOAD;
}

// The pace the road is walked at.
export const ghostPace = () => GHOST_PX_S;
// The rise's: the road from the gates to the cloud floor in ACT_RIDE_S,
// however far apart the two stand.
export const ridePace = () => Math.max(P, threshold().y - afterFeet()) / ACT_RIDE_S;
// The seconds of the rise still to go from height y.
export const rideLeft = (y = S.acts && S.acts.pair ? S.acts.pair.y : afterFeet()) => Math.max(0, y - afterFeet()) / ridePace();
