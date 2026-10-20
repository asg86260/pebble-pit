// A station's work, one way in (the owner, 2026-10-18: every station is
// worked by hand first, then by members at posts). `workAfter(key, amount)`
// is the only door to a station's output: the player's click calls it today,
// a member at its post calls it on the worker's clock (bodies.js), and the
// gesture each station's hand work will become (being mocked for a vote)
// will call it too, so the sim never learns how the work was done.

import { S } from '../state.js';
import { built } from './levels.js';
import { sawLog, chipLog, pulpSheet } from './mill.js';
import { joinSign, printStack } from './press.js';
import { shout } from './rebel.js';

// Each station's one unit of work: true if it made something.
const WORK = { mill: sawLog, chipper: chipLog, papermill: pulpSheet, workshop: joinSign, press: printStack };
export const WORKED = Object.keys(WORK);
// The pedestal is worked by the hand alone (a bubble popped, gestures.js), a
// line of the pair's speech a unit, its rebel let go from the bubble: not a
// station a click on its box works, so it is not in WORKED.
const HAND = { ...WORK, pedestal: at => { shout(at); return true; } };

// How many units each station has made this session, by anyone: what the
// polish bar's door check reads (stations.js, `made`). Not saved: a reading.
const MADE = {};
export const madeAt = key => MADE[key] || 0;

// `amount` units of work at station `key`, by whoever: how many took. The
// hand's (`hand`) marks the station held a moment (render/after.js); `at` is
// the world point the work came out of, where it has one (a popped bubble's
// middle).
export function workAfter(key, amount = 1, hand = false, at = null) {
  if (!S.after || !HAND[key] || !built(key)) return 0;
  let done = 0;
  for (let k = 0; k < amount && HAND[key](at); k++) done++;
  MADE[key] = (MADE[key] || 0) + done;
  if (hand && done) S.after.workAt[key] = S.after.t;
  return done;
}
