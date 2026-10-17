// The two of them as souls and ghosts, and the road they walk (DESIGN.md,
// "Acts 3 and 4", "Back to the surface, dead", and "The portals and the
// mansion"). A portal is the camera's way between two places; a body never
// goes through one. The road is real ground, every step of it an ordinary
// world position: out of the fallen house straight up through heaven's tear
// in the sky to the cloud floor above (the places are stacked, so the souls
// rise into the afterlife rather than appear there); back down the same way
// by the cloud stair let down from the tear to the ruin; and for act 4, into
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
import { P, WORKER, FINALE_HOUSE_W, GHOST_PX_S, GHOST_LOAD, GHOST_GAP, HELL_TIERS } from './config.js';
import { houseX } from './home.js';
import { feetOn, ways } from './route.js';
import { afterFloor, afterTop, stationBox } from './after/place.js';
import { hellTop, chamberFloor, chamberAtX, chamberFocusX, storeX as hellStoreX } from './hell/place.js';
import { deepTop, deepFloor } from './deep/place.js';
import { portalEnd } from './portals.js';
import * as HELL from './hell/index.js';
import { mansionDoorX } from './mansion.js';

const snap = v => Math.round(v / P) * P;

// --- the road's marks ------------------------------------------------------------
export const tear = () => portalEnd('heaven', 'yard');
export const slit = () => portalEnd('hell', 'deep');
// The ruin's middle, where the house's door was; the stair's foot, beside it.
export const ruinX = () => snap(houseX() + FINALE_HOUSE_W * P / 2 - WORKER / 2);
export const stairFoot = () => {
  const x = snap(houseX() + (FINALE_HOUSE_W + 4) * P);
  return { x, y: yardFeet(x) };
};
// The camp's pedestal, the two of them at its foot (after/place.js): its
// top, and the speech from it, are act 3's placeholder until the climb up
// is drawn.
export const campX = () => snap(stationBox('pedestal').x - WORKER - P);
// Into the drowned pit a few cells off its near wall.
export const pitX = () => snap(pit.x + P * 4);
export const slitX = () => snap(slit().x - WORKER / 2);
// In hell: the landing's store, where a load is handed in, and the cage
// room, where a beat calls the two of them (hell/place.js).
export const storeX = () => snap(hellStoreX() - WORKER / 2);
export const cageX = () => snap(chamberFocusX(HELL_TIERS.length - 1) - WORKER / 2);
const hellLegX = () => (S.acts && S.acts.pair && S.acts.pair.hold === 'cage' ? cageX() : storeX());
const tearX = () => snap(tear().x - WORKER / 2);
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
  rise: [{ v: afterFeet }],
  camp: [{ h: campX, y: afterFeet }],
  // to the tear's patch in the cloud, down through it and the sky to the
  // tear over the yard, down the stair, and along to the ruin
  down: [{ h: tearX, y: afterFeet }, { v: () => tear().y - WORKER / 2 }, { to: stairFoot }, { h: ruinX, y: yardFeet }],
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

// The pair's two bodies, [first, second]: the second GHOST_GAP behind the way
// the first is facing. Null with no pair.
export function pairBodies() {
  const p = S.acts && S.acts.pair;
  if (!p) return null;
  return [{ x: p.x, y: p.y }, { x: p.x - (p.face || 1) * GHOST_GAP, y: p.y }];
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
