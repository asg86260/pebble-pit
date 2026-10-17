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
// unmasked. When each can be *taken* is the story's too: heaven's carries
// the souls up and nothing back until the road opens (`ghost-road`), so act 3
// is spent in the cloud; hell's waits for the pair to come back to the yard
// as ghosts (`haunt`). A beat takes the camera through either whenever it
// needs to, open to the player or not.
//
// The facts live on `S.acts.portals` (actbeats.js owns `S.acts` and its
// save): for each, how open it stands (0..1, opened over ACT_PORTAL_OPEN_S
// and never closed), and the hand's three facts, the yard portal's own rule
// (`S.portalDown`, `S.portalRound`, `S.portalHand`; view.js) kept per portal.

import { S } from './state.js';
import { P, ACT_PORTAL_R, ACT_HEAVEN_SKY, ACT_HEAVEN_HANG, ACT_HELL_HANG,
         ACT_PORTAL_OPEN_S, ACT_HAND_FADE_S, FINALE_HOUSE_W } from './config.js';
import { houseX } from './home.js';
import { afterX0, afterFloor } from './after/place.js';
import { roadX, chamberFloor } from './hell/place.js';
import { deepFloor } from './deep/place.js';
import { afterlifeOn, hellOn } from './acts.js';
import { travel, gliding } from './view.js';

const snap = v => Math.round(v / P) * P;

// --- the table -----------------------------------------------------------------
// Each portal, the two places it joins -- the nearer the yard first, the one
// the ripple opens out of -- whether its act is on, and its two ends.
export const PORTALS = {
  heaven: {
    outer: 'yard', inner: 'after', on: afterlifeOn,
    end: {
      yard: () => ({ x: snap(houseX() + FINALE_HOUSE_W * P / 2), y: snap(S.groundY - ACT_HEAVEN_SKY), r: ACT_PORTAL_R }),
      // Straight over the yard's end: the souls rise through the one tear
      // and come up through the cloud floor above it.
      after: () => ({ x: Math.max(afterX0(), snap(houseX() + FINALE_HOUSE_W * P / 2)), y: snap(afterFloor() - ACT_HEAVEN_HANG), r: ACT_PORTAL_R })
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
export function stepPortals(c) {
  if (!S.acts) return;
  const dt = c.dt / 1000;
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
export function throughPortal(key, byHand = true) {
  const row = PORTALS[key];
  if (!row || gliding()) return false;
  const from = S.view;
  const to = from === row.outer ? row.inner : from === row.inner ? row.outer : null;
  if (!to || (byHand && !portalFree(key))) return false;
  if (!travel(to, key)) return false;
  const r = rec(key);
  if (byHand && r) { if (to === row.inner) r.down = true; else if (r.down) r.round = true; }
  return true;
}

// The portal end a press at (x, y) in the place on screen lands on: its ring
// and a cell round it. The key, or null.
export function portalAt(x, y) {
  for (const key of PORTAL_KEYS) {
    if (!portalFree(key)) continue;
    const e = portalEnd(key, S.view);
    if (e && Math.hypot(x - e.x, y - e.y) <= e.r + P) return key;
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
