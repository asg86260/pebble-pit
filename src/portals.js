// The acts' two portals (DESIGN.md, "Acts 3 and 4", "The portals and the
// mansion"): heaven's, whose yard end hangs in the sky over the house and
// whose other end hangs over the afterlife's cloud floor; and hell's, whose
// deep end stands on the deep's floor and whose other end hangs in hell. Each
// is a real way between two places, as the wizards' portal is between the
// yard and the deep: a click on either end takes the view through it on the
// ripple (view.js, `travel`), never a cut, and the pointing hand beside it
// says so until the player has been through and back by their own hand.
//
// When each stands is the story's (actbeats.js): heaven's opens as the souls
// rise out of the fallen house, hell's on the deep's floor as Satan is
// unmasked. When each can be *taken* is the story's too: heaven's is the
// player's from the arrival on, a way down and back up at any time
// (actbeats.js frees it); hell's waits for the pair to come back to the yard
// as ghosts (`haunt`). A beat takes the camera through either whenever it
// needs to, open to the player or not.
//
// The facts live on `S.acts.portals` (actbeats.js owns `S.acts` and its
// save): for each, how open it stands (0..1, opened over ACT_PORTAL_OPEN_S
// and never closed), and the hand's three facts, the yard portal's own rule
// (`S.portalDown`, `S.portalRound`, `S.portalHand`; view.js) kept per portal.

import { S } from './state.js';
import { P, ACT_PORTAL_R, ACT_HELL_HANG, ACT_PORTAL_OPEN_S, ACT_HAND_FADE_S, ACT_GATES_SKY, ACT_GATES_CELL,
         ACT_GATES_LEAF, ACT_GATES_H, ACT_GATES_REACH, ACT_GATES_STEP_S, ACT_GATES_HOLD_S, VIEW_GLIDE_S } from './config.js';
import { afterX0, afterFloor } from './after/place.js';
import { roadX, chamberFloor } from './hell/place.js';
import { deepFloor } from './deep/place.js';
import { afterlifeOn, hellOn } from './acts.js';
import { travel, gliding, glidingBy } from './view.js';

const snap = v => Math.round(v / P) * P;

// --- the table -----------------------------------------------------------------
// Each portal, the two places it joins -- the nearer the yard first, the one
// the ripple opens out of -- whether its act is on, and its two ends.
export const PORTALS = {
  heaven: {
    outer: 'yard', inner: 'after', on: afterlifeOn,
    end: {
      // The gates on their bank, up the stair from beside the ruin.
      yard: () => gatesEnd(snap(S.groundY) - ACT_GATES_SKY),
      // Straight over the yard's end, standing on the cloud floor: the road
      // comes up through the floor between them.
      after: () => gatesEnd(snap(afterFloor()))
    }
  },
  hell: {
    outer: 'deep', inner: 'hell', on: hellOn,
    end: {
      // The slit straight over hell's road (hell/place.js, `roadX`), so the
      // road down through it is a straight drop onto the landing.
      deep: () => ({ x: snap(roadX()), y: snap(deepFloor() - ACT_PORTAL_R - P), r: ACT_PORTAL_R }),
      hell: () => ({ x: snap(roadX()), y: snap(chamberFloor(0) - ACT_HELL_HANG), r: ACT_PORTAL_R })
    }
  }
};
export const PORTAL_KEYS = Object.keys(PORTALS);

// --- heaven's gates ---------------------------------------------------------------
// Either end of heaven's portal is the same pair of gates, standing on the line
// `feet`: the middle of the gateway (where the ripple opens and the hand
// points), the reach to a post's outside, and the box a press lands in, from
// the crest's top pearl down to the feet.
export const gatesX = () => Math.max(afterX0(), ACT_GATES_CELL * P);
export const GATES_TALL = ACT_GATES_H + 10;           // the leaves, the crest over them and its pearl
function gatesEnd(feet) {
  const x = gatesX();
  return { x, y: feet - (ACT_GATES_H / 2) * P, r: ACT_GATES_REACH, feet, top: feet - GATES_TALL * P };
}
// How far open they stand: a step of ACT_GATES_LEAF, 0 shut, the last open.
// This session's (`S.gates`): a reload finds them shut.
export const GATES_OPEN = ACT_GATES_LEAF.length - 1;
const gates = () => (S.gates ||= { step: 0, u: 0, held: 0, go: null });
export const gatesStep = () => (S.gates ? S.gates.step : 0);
export const gatesBusy = () => !!(S.gates && S.gates.go);
// One frame of them, a held step at a time toward open while anything wants
// them open -- a press waiting to go through, the camera going through, a
// hold after it has, or a body at the gateway (`near`, actbeats.js) -- and
// shut otherwise. A press waiting goes through once they stand open.
function stepGates(dt, near) {
  const g = gates();
  if (glidingBy() === 'heaven') g.held = ACT_GATES_HOLD_S;
  else g.held = Math.max(0, g.held - dt);
  const want = g.go || g.held > 0 || near ? GATES_OPEN : 0;
  // A press waiting holds them open a step more before the ripple, so the
  // last step is seen standing.
  const hold = g.step === want && !(g.go && want === GATES_OPEN);
  if (hold) g.u = 0;
  else if ((g.u += dt) >= ACT_GATES_STEP_S) { g.u = 0; if (g.step !== want) g.step += Math.sign(want - g.step); else g.u = ACT_GATES_STEP_S; }
  if (g.go && g.step === GATES_OPEN && g.u >= ACT_GATES_STEP_S && !gliding()) {
    const go = g.go;
    g.go = null;
    if (travel(go.to, 'heaven')) { g.held = ACT_GATES_HOLD_S; countTrip('heaven', go.to, go.byHand); }
  }
}

// A portal's end in `place`, or null if it has none there.
export const portalEnd = (key, place) => {
  const row = PORTALS[key], end = row && row.end[place];
  return end ? end() : null;
};
// The portal joining two places, either way round, or null.
export const portalBetween = (a, b) =>
  PORTAL_KEYS.find(k => (PORTALS[k].outer === a && PORTALS[k].inner === b) || (PORTALS[k].outer === b && PORTALS[k].inner === a)) || null;

// --- whether -------------------------------------------------------------------
const rec = key => (S.acts && S.acts.portals && S.acts.portals[key]) || null;
// How open it stands, 0..1: 0 is not there at all.
export const portalOpenK = key => (PORTALS[key].on() && rec(key) ? rec(key).k || 0 : 0);
export const portalStands = key => portalOpenK(key) > 0;
// Whether the player may take it: whole, its act on, and the story past the
// beat that opens it to them (`S.acts.portals[key].free`, set by actbeats.js).
export const portalFree = key => portalOpenK(key) >= 1 && !!rec(key).free;

// Opened: it starts standing and grows to whole over ACT_PORTAL_OPEN_S
// (`stepPortals`). Opened once; never shut.
export function openPortal(key) {
  const r = rec(key);
  if (r && !(r.k > 0)) r.k = 1e-3;
}
// Given to the player.
export function freePortal(key) {
  const r = rec(key);
  if (r) { r.free = true; if (!(r.k > 0)) r.k = 1e-3; }
}

// One frame: each ring opening, and each hand fading once its round trip is
// made, the yard portal's own rule (view.js, `stepView`).
export function stepPortals(c, near = false) {
  if (!S.acts) return;
  const dt = c.dt / 1000;
  stepGates(dt, near);
  for (const key of PORTAL_KEYS) {
    const r = rec(key);
    if (!r) continue;
    if (r.k > 0 && r.k < 1) r.k = Math.min(1, r.k + dt / ACT_PORTAL_OPEN_S);
    if (r.round && r.hand > 0 && !gliding()) r.hand = Math.max(0, r.hand - dt / ACT_HAND_FADE_S);
  }
}

// --- the hand ------------------------------------------------------------------
// Shown beside both ends while the portal is the player's to take, until the
// round trip is made and its fade spent.
export const handShown = key => portalFree(key) && !gliding() && (rec(key).hand ?? 1) > 0;
export const handAlpha = key => (rec(key) ? rec(key).hand ?? 1 : 0);

// --- going through --------------------------------------------------------------
// Through `key` from whichever of its ends the camera is at; the player's own
// press when `byHand`, which is what the hand counts. False if it cannot be
// taken from here.
// Heaven's opens its gates first and goes through once they stand open
// (`stepGates`), so the press is answered now and the ripple follows.
export function throughPortal(key, byHand = true) {
  const row = PORTALS[key];
  if (!row || gliding()) return false;
  const from = S.view;
  const to = from === row.outer ? row.inner : from === row.inner ? row.outer : null;
  if (!to || (byHand && !portalFree(key))) return false;
  if (key === 'heaven') {
    const g = gates();
    if (g.go) return false;
    g.go = { to, byHand };
    return true;
  }
  if (!travel(to, key)) return false;
  countTrip(key, to, byHand);
  return true;
}
// The hand's count: down by the player's own press, then back.
function countTrip(key, to, byHand) {
  const r = rec(key);
  if (byHand && r) { if (to === PORTALS[key].inner) r.down = true; else if (r.down) r.round = true; }
}

// The portal end a press at (x, y) in the place on screen lands on: its ring
// and a cell round it, or the gates' box. The key, or null.
export function portalAt(x, y) {
  for (const key of PORTAL_KEYS) {
    if (!portalFree(key)) continue;
    const e = portalEnd(key, S.view);
    if (!e) continue;
    if (e.feet != null ? Math.abs(x - e.x) <= e.r + P && y >= e.top - P && y <= e.feet + P
                       : Math.hypot(x - e.x, y - e.y) <= e.r + P) return key;
  }
  return null;
}

// The hand's box beside an end, top-left on the grid: to the ring's right,
// its fingertip on the ring's middle line (render/portals.js draws it).
export const ACT_HAND_BOX = { w: P * 7, h: P * 5 };
export function handBox(key, place) {
  const e = portalEnd(key, place);
  if (!e) return null;
  return { x: snap(e.x + e.r + P * 2), y: snap(e.y - ACT_HAND_BOX.h / 2), ...ACT_HAND_BOX };
}
// A press on the hand is a press on its portal.
export function handAt(x, y) {
  for (const key of PORTAL_KEYS) {
    if (!handShown(key)) continue;
    const b = handBox(key, S.view);
    if (b && x >= b.x - P && x < b.x + b.w + P && y >= b.y - P && y < b.y + b.h + P) return key;
  }
  return null;
}
