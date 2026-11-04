// The two of them as souls and ghosts, and the road they walk (DESIGN.md,
// "Acts 3 and 4", "Back to the surface, dead", and "The portals and the
// mansion"). Hell's portal is the camera's way between two places, never a
// body's; heaven's gates are both (the owner, 2026-10-19): a body walks into
// the open gates at one end, fading into the gateway, and out of them at the
// other (`through`), and the camera goes with it by the ripple. Every other
// step of the road is an ordinary world position: out of the fallen house,
// floated up to heaven's gates over it and through them onto the cloud floor;
// back down the same way to the ruin; and for act 4, into
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
import { P, WORKER, FINALE_HOUSE_W, GHOST_PX_S, GHOST_LOAD, GHOST_GAP, HELL_TIERS, ACT_GATES_REACH, ACT_GATES_PASS,
         ACT_GATES_NEAR, ACT_GATES_UNDER, ACT_FLOAT_PX_S, ACT_FLOAT_SWAY, ACT_FLOAT_SWINGS, ACT_FLOAT_LAG, ACT_RISE_FADE, MANSION_SOULS } from './config.js';
import { houseX } from './home.js';
import { feetOn, ways } from './route.js';
import { afterFloor, floorAt, afterTop, stationBox, stationX0, speakerAt } from './after/place.js';
import { hellTop, chamberFloor, chamberAtX, chamberFocusX, storeX as hellStoreX } from './hell/place.js';
import { deepTop, deepFloor } from './deep/place.js';
import { portalEnd } from './portals.js';
import { godFront } from './after/sky.js'; // MOCK dialog-sauce
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

// --- the float -----------------------------------------------------------------
// Between the ground and heaven's gates over the house a soul floats (the
// owner's J, 2026-10-30): straight up out of the ruin to the gates' step, or
// down from it, eased in and out and swaying either side, the sway still at
// both ends. `driftAt` is where a float from `a` to `b` is `k` of the way.
const smooth = k => k * k * (3 - 2 * k);
export const swayAt = k => ACT_FLOAT_SWAY * P * Math.sin(k * Math.PI * 2 * ACT_FLOAT_SWINGS) * Math.sin(k * Math.PI);
export const driftAt = (a, b, k) => ({ x: a.x + (b.x - a.x) * smooth(k) + swayAt(k), y: a.y + (b.y - a.y) * smooth(k) });
// The gates' step: a body's top-left standing in the gateway, on the bank.
export const threshold = () => ({ x: tearX(), y: tear().feet - WORKER });
// The ground under it, where a float down from the gates comes to rest.
export const underGates = () => ({ x: tearX(), y: yardFeet(tearX()) });
// A float's pace against the road's: the leg is walked in the road's
// distance (`stepPair`) and goes this many times as far.
const FLOAT_K = ACT_FLOAT_PX_S / GHOST_PX_S;
// How far through the float it is on (0..1), or null on none.
export const floatK = (p = S.acts && S.acts.pair) => (p && p.drift ? Math.min(1, p.drift.d / Math.max(1, p.drift.len)) : null);

// Whether a body stands at heaven's gates, at either end, so they stand open
// for it (portals.js, `stepGates`): the pair, or a freed soul on its way down.
export function atGates() {
  const e = tear(), up = portalEnd('heaven', 'after');
  if (!e || !up) return false;
  const reach = ACT_GATES_REACH + ACT_GATES_NEAR;
  // (over the yard, a soul floating up opens them from ACT_GATES_UNDER below
  // the bank, so they stand open by the time it reaches the step)
  const at = (g, b, under) => {
    const foot = b.y + WORKER;
    return Math.abs(b.x + WORKER / 2 - g.x) <= reach && foot >= g.top && foot <= g.feet + under;
  };
  const near = b => at(e, b, ACT_GATES_UNDER) || at(up, b, P);
  const pair = pairBodies();
  if (pair && pair.some(near)) return true;
  for (let i = 0; i < MANSION_SOULS; i++) { const s = soulAt(i); if (s && s.floating && near(s)) return true; }
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
// The same spot under the gates on the cloud floor, which stand at the
// camp's own column (portals.js), not over the yard's.
const afterGateX = () => snap(portalEnd('heaven', 'after').x - WORKER / 2);
// MOCK dialog-sauce: the two of them before God's throne, their middle on its front
const beforeGod = () => snap(godFront() - WORKER / 2 + GHOST_GAP / 2);
export const yardFeet = x => feetOn(ways().yard, x);
const afterFeet = x => (x == null ? afterFloor() : floorAt(x)) - WORKER;
const deepFeet = () => deepFloor() - WORKER;
// The floor of the chamber a body is over (each lower than the last), the
// landing's off the run.
const hellFeet = x => chamberFloor(Math.max(0, chamberAtX(x))) - WORKER;

// The routes, each a run of legs: `h` along the ground to an x (standing on
// `y` of where it is), `v` straight up or down to a y, `float` from where it
// stands to a point (`driftAt`), `through` heaven's gates into the place named.
const ROUTES = {
  // out of the ruin, floated up to the gates; then through them
  float: [{ float: threshold }],
  // (MOCK dialog-sauce: with an option up the gates stand between the two
  // camps, and the two walk out of them to stand before God, briskly:
  // actbeats.js, `stepActs`)
  rise: [{ through: 'after' }, { h: () => (globalThis.__dialogSauce ? beforeGod() : S.acts.pair.x), y: afterFeet }],
  camp: [{ h: campX, y: afterFeet }],
  // up the pillar's face onto its top, and back down
  pedestal: [{ h: pillarFootX, y: afterFeet }, { v: pillarFeet }, { h: speakerX, y: pillarFeet }],
  off: [{ h: pillarFootX, y: pillarFeet }, { v: afterFeet }],
  // to the gates on the cloud floor, through them to the gates over the
  // yard, and floated down to the ruin under them
  down: [{ h: afterGateX, y: afterFeet }, { through: 'yard' }, { float: () => ({ x: ruinX(), y: yardFeet(ruinX()) }) }],
  // act 4's carry: the ruin to the cage and back (LOOP_CAGE, LOOP_HOME)
  loop: [{ h: pitX, y: yardFeet }, { v: deepFeet }, { h: slitX, y: deepFeet }, { v: () => hellFeet(slitX()) }, { h: hellLegX, y: hellFeet },
         { h: slitX, y: hellFeet }, { v: deepFeet }, { h: pitX, y: deepFeet }, { v: () => yardFeet(pitX()) }, { h: ruinX, y: yardFeet }],
  // home at the end: from the ruin to the mansion's door
  door: [{ h: () => mansionDoorX() - WORKER / 2, y: yardFeet }]
};
export const LOOP_CAGE = 4, LOOP_HOME = ROUTES.loop.length - 1;
// The leg of `down` that floats from the gates to the ruin.
export const DOWN_FLOAT = 2;

// --- what is seen of the rise ---------------------------------------------------------
// The opening's souls and heaven's gates over the yard come in over the
// float up (the owner's K2, 2026-10-31): before it, while the souls wait in
// the wreck, neither is there; over it the souls fade in from nothing to
// whole by ACT_RISE_FADE.soul of the way, and the gates from `gatesFrom` to
// `gatesTo`; and from the gates on, whole, for good. Read off the pair as
// it stands, so a reload mid-rise sees what it saw.
const fadeIn = (k, a, b) => { const t = Math.max(0, Math.min(1, (k - a) / (b - a))); return t * t * (3 - 2 * t); };
const waiting = p => !!p && p.mode === 'soul' && !p.at && (!p.route || p.route === 'float') && placeAt(p.y) === 'yard';
export function gatesSeen() {
  if (!S.acts || S.acts.house === 'standing') return 1;
  const p = S.acts.pair;
  if (!p) return 0;
  if (!waiting(p)) return 1;
  return p.route === 'float' ? fadeIn(floatK(p) ?? 0, ACT_RISE_FADE.gatesFrom, ACT_RISE_FADE.gatesTo) : 0;
}
export function soulSeen(p = S.acts && S.acts.pair) {
  if (!waiting(p)) return 1;
  return p.route === 'float' ? fadeIn(floatK(p) ?? 0, 0, ACT_RISE_FADE.soul) : 0;
}

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

// Where the pair are next seen: where they stand, while that is in a place
// (through heaven's gates they are in one place or the other, never between);
// crossing between two places any other way (the rock from the deep's floor
// to hell), where the leg they are on comes out -- the camera goes there by
// the ripple and they walk into it (shot.js, rule 5).
export function seenAt(p = S.acts && S.acts.pair) {
  if (!p) return null;
  if (placeAt(p.y)) return { x: p.x, y: p.y };
  const L = p.route && ROUTES[p.route][p.leg];
  if (L && L.v) return { x: p.x, y: L.v() };
  return { x: p.x, y: p.y };
}

// The pair's two bodies, [first, second]: the second GHOST_GAP behind the way
// the first is facing. Null with no pair. Floating, the second hangs under
// the first, ACT_FLOAT_LAG cells at the float's middle and level at its ends.
// Going through the gates it closes up into the gateway behind the first and
// steps out of it behind them at the far end.
export function pairBodies() {
  const p = S.acts && S.acts.pair;
  if (!p) return null;
  const k = p.pass > 0 ? Math.abs(1 - p.pass) : 1, f = floatK(p);
  const lag = f == null ? 0 : ACT_FLOAT_LAG * P * Math.sin(f * Math.PI);
  return [{ x: p.x, y: p.y }, { x: p.x - (p.face || 1) * GHOST_GAP * k, y: p.y + lag }];
}
// How much of them is seen, going through the gates: faded out into the
// gateway at the near end, in out of it at the far one (`through`).
export const passAlpha = (p = S.acts && S.acts.pair) => (p && p.pass > 0 ? Math.abs(1 - p.pass) : 1);

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
    } else if (L.through) {
      // `pass` 0..2 over twice ACT_GATES_PASS cells of walk: into the gateway
      // here, then out of it there, at the far end's threshold from 1 on
      const span = ACT_GATES_PASS * P, was = p.pass || 0;
      const m = Math.min(dist, (2 - was) * span);
      p.pass = was + m / span; dist -= m;
      if (was < 1 && p.pass >= 1) {
        const at = L.through === 'after' ? { x: afterGateX(), y: afterFeet() } : threshold();
        p.x = at.x; p.y = at.y;
        // up there they step out facing the camp they walk on to, so the
        // second comes out of the gateway behind them, not ahead
        if (L.through === 'after') p.face = Math.sign(campX() - at.x) || p.face;
      }
      done = p.pass >= 2 - 1e-9;
      if (done) p.pass = 0;
    } else if (L.float) {
      // From where the leg began (kept, so the sway is about a straight line
      // and a reload floats on from the same start) to its end, at the float's
      // pace; the face kept, so the sway does not turn them about.
      const to = L.float();
      if (!p.drift) p.drift = { x: p.x, y: p.y, d: 0, len: Math.hypot(to.x - p.x, to.y - p.y) };
      const f = p.drift, m = Math.min(f.len - f.d, dist * FLOAT_K);
      f.d += m; dist -= m / FLOAT_K;
      const at = driftAt(f, to, f.len > 0 ? f.d / f.len : 1);
      p.x = at.x; p.y = at.y;
      done = f.d >= f.len - 1e-6;
      if (done) { p.x = to.x; p.y = to.y; p.drift = null; }
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
