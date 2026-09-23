// The deep's hands: the yard's crew, gone down the shaft (docs/wave-serpent.md).
//
// There is no crew of the deep's own. A deep job is a job like any other: a
// body put on it walks to the plank, swims down the shaft and along the
// deep's floor to its station (route.js), and a body taken off it swims back
// up and walks to whatever the yard wants of it. What each does at its
// station is deep/arms.js's; here is only where each station is, and the one
// rule every body obeys about which half of the works it belongs in.

import { WORKER } from '../config.js';
import { TYPE, isDeepType } from '../jobs.js';
import { spotX, mouthX } from '../deep/place.js';
import { belowYard, keepTo, stepRoute, ways } from '../route.js';
import { commutePace } from '../levels.js';

// Which station of the deep each job stands at: the keys of `DEEP_SPOTS`.
export const DEEP_STATION = Object.freeze({
  [TYPE.BRAWL]: 'altar',
  [TYPE.LANCE]: 'well',
  [TYPE.GRENADE]: 'font',
  [TYPE.SCRIBE]: 'circle',
  [TYPE.WARLOCK]: 'spire'
});

// Where a body stands to work its station: in front of it, on the floor.
export const deepPost = type => spotX(DEEP_STATION[type]) - WORKER / 2;

// A body made from nothing on a deep job (a save read back, or a hook's
// setup) is stood at its station, like every factory. `goal` starts empty so
// the weapons (deep/arms.js) have a saved word to keep (`KEEPS`), and a body
// that has just arrived starts from it.
const made = type => () => ({ type, x: deepPost(type), goal: null, phase: null });
export const newBrawler = made(TYPE.BRAWL);
export const newLancer = made(TYPE.LANCE);
export const newGrenadier = made(TYPE.GRENADE);
export const newScribe = made(TYPE.SCRIBE);
export const newWarlock = made(TYPE.WARLOCK);

// A body on a yard job with its feet in the deep -- taken off the deep's
// roster, or the one who came out of the belly -- goes back up before it does
// anything else: to the plank at the head of the shaft, by the route, at the
// pace of any commute. Every yard job's work is written for a body standing
// in the yard, and handed one on the deep's floor it would ease it up to the
// ground a cell a frame. True while it is on its way.
export function surface(w) {
  if (isDeepType(w.type) || !belowYard(w)) return false;
  if (!keepTo(w, mouthX(), ways().yard)) return false;
  if (stepRoute(w, commutePace())) return true;
  w.route = null;
  return false;
}
