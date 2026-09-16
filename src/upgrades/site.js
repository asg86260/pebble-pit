import { S } from '../state.js';
import { lookAt } from '../world.js';
import { assign, rebalance } from '../staffing.js';
import { station, open, offered } from '../stations.js';

// The shape every "open a place" row on the bench is cut from. It lives here
// rather than in upgrades.js because the rows files build a site the moment
// they load, and a helper declared in the file loading them would still be in
// its dead zone.
//
// A place costs a core *and* dust: the core says this is a place rather than
// a rung, and the dust keeps the rock worth digging after it. `key` is the
// station's row in stations.js; the gate is that row's `after` and `needs`,
// read through `offered`, and the row here says only what it costs and what
// buying does.
export const site = ({ key, name, note, blurb, cores, dust, more, at, job, then }) => ({
  key: 'unlock' + key, name,
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
  buy: () => { S[key + 'Open'] = true; lookAt(at()); if (job) staffDoor(job); if (then) then(); },
  // A sticky door reveals through `once` (`revealed` in shop.js holds it), so
  // a fact that can stop being true does not take the door off the board;
  // `show` then only retires it. Any other door is offered while its gate
  // holds. Getters, because a row is built the moment its file loads and the
  // table it reads is not there yet.
  get once() { return station(key).sticky ? () => offered(key) : undefined; },
  get show() { return station(key).sticky ? () => !open(key) : () => offered(key); }
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

