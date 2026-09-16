import { UNLOCK_SHOW } from '../config.js';
import { S } from '../state.js';
import { lookAt } from '../world.js';
import { assign, rebalance } from '../upgrades.js';

// The shape every "open a place" row on the bench is cut from. It lives here
// rather than in upgrades.js because the rows files build a site the moment
// they load, and a helper declared in the file loading them would still be in
// its dead zone.
//
// A place costs a core *and* dust: the core says this is a place rather than
// a rung, and the dust keeps the rock worth digging after it.
export const site = ({ key, name, note, blurb, cores, dust, more, open, at, once, show, job, then }) => ({
  key, name,
  // What the place is for, where a ladder row prints its gain: one line of a
  // slot, since the line does not wrap. The note is the longer say, on the tip.
  blurb,
  note,
  // A building like the rest: the yard's spare hands put it up, and the view
  // does not glide to it until it is standing.
  kind: 'building', site: 'yard', at,
  // `more` is any further coin a door asks alongside the core and the dust.
  bill: () => [['core', cores], ['dust', dust], ...(more || [])],
  // `job` is the trade worked there; the door opens with one spare body sent
  // over (`staffDoor`). `then` is anything else the door does on opening.
  buy: () => { S[open] = true; lookAt(at()); if (job) staffDoor(job); if (then) then(); },
  // `once` is the door's reveal (`revealed` in shop.js); a condition that can
  // stop being true belongs there, so the door does not come off the board.
  once,
  show
});

// A place opens with one spare body sent over through the same `assign` the
// board's + button uses. `rebalance` first: a build with nobody spare borrows
// the nearest body off its station, and on the frame the door lands that body
// is still on loan, off its count, and reads as idle -- asked then, `assign`
// would hand the yard's one rockhand to the new place.
export function staffDoor(job) {
  rebalance();
  assign(job, 1);
}

// A door is shown once you are within reach of affording it: a price you have
// no idea is coming is a price you cannot save for.
export const nearly = n => S.stored >= n * UNLOCK_SHOW;
export const seenACore = () => S.seenCore;

// The yard has been invested in. Written once, because what the rows waiting
// on it want is the player having committed to the place, not any one
// building being up.
export const invested = () => S.quarryOpen && S.boulderNo >= 2;
