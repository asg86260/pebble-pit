// The deep's hands: the yard's crew, gone down the shaft (docs/wave-serpent.md).
//
// One crew, two homes (DESIGN.md, "One crew, two homes"): a body may live in
// the yard's rooms or in the deep's pods (`deepHome`), and either may be put
// on a deep job. A deep job is a job like any other: a body from the yard
// walks to the plank, swims down the shaft and along the deep's floor to its
// station (route.js), and a body taken off it swims back up and walks to
// whatever the yard wants of it. What each does at its station is
// deep/arms.js's and deep/gather.js's, and what it does there with nothing to
// do is deep/rest.js's; here is only where each station is, and the one rule
// every body obeys about which half of the works it belongs in.

import { WORKER } from '../config.js';
import { TYPE, isDeepType } from '../jobs.js';
import { spotX, mouthX } from '../deep/place.js';
import { belowYard, keepTo, stepRoute, ways } from '../route.js';
import { commutePace } from '../levels.js';
import { DOWN_THERE } from '../works.js';
import { stationById, stationMid } from '../deep/party.js';

// Where each deep job with a fixed place stands: the keys of `DEEP_SPOTS`.
// A fighter's place is its station's, which the player put down
// (deep/party.js), so it is asked of the body rather than of the job.
export const DEEP_STATION = Object.freeze({
  [TYPE.GATHER]: 'crusher'
});

// Where a body stands to work its station: in front of it, on the floor. A
// fighter not yet given a station waits by the pods, where the deep's spare
// hands live.
export const deepPost = (type, w = null) => {
  if (type !== TYPE.FIGHTER) return spotX(DEEP_STATION[type] || 'crusher') - WORKER / 2;
  const st = w && stationById(w.station);
  return (st ? stationMid(st) : spotX('pods')) - WORKER / 2;
};

// A body made from nothing on a deep job (a save read back, or a hook's
// setup) is stood at its station, like every factory. `goal` starts empty so
// the fighters have a saved word to keep (`KEEPS`), and a body that has just
// arrived starts from it. No `station` or `uid` on a fighter's: `settle`
// lays a factory's fields over the body, and those two are the body's own.
const made = type => () => ({ type, x: deepPost(type), goal: null, phase: null });
export const newFighter = made(TYPE.FIGHTER);
export const newGatherer = made(TYPE.GATHER);

// A body on a yard job with its feet in the deep -- taken off the deep's
// roster, or the one who came out of the belly -- goes back up before it does
// anything else: to the plank at the head of the shaft, by the route, at the
// pace of any commute. Every yard job's work is written for a body standing
// in the yard, and handed one on the deep's floor it would ease it up to the
// ground a cell a frame. True while it is on its way.
export function surface(w) {
  if (isDeepType(w.type) || !belowYard(w)) return false;
  // A builder at work down there is where its work is.
  if (w.type === TYPE.BUILD && DOWN_THERE.has(w.site)) return false;
  if (!keepTo(w, mouthX(), ways().yard)) return false;
  if (stepRoute(w, commutePace())) return true;
  w.route = null;
  return false;
}
