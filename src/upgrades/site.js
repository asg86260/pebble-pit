import { UNLOCK_SHOW } from '../config.js';
import { S } from '../state.js';
import { lookAt } from '../world.js';

// The shape every "open a place" row on the bench is cut from. It lives here
// rather than in upgrades.js because the rows files build a site the moment they
// load, and upgrades.js is the file loading them -- a helper declared over there
// would still be in its dead zone when the first row asked for it.
//
// A site is a place, bought once with cores. It comes with nobody in it: who
// works it is the same question as who works the rock.
// A site is a place, bought once. It used to be bought with cores -- one whole
// rock each -- which made the opening four rocks of watching a number climb with
// nothing to do about it but swing, and spent the rarest thing in the game on
// doors. Dust buys the yard now.
// A place costs a core *and* dust. The core is what says this is a place rather
// than a rung -- see the tier table in DESIGN.md -- and the dust is what keeps
// the rock worth digging after it, which every bill above tier one does.
export const site = ({ key, name, note, cores, dust, more, open, at, once, show, then }) => ({
  key, name,
  // The line of words under the card. Every door writes one; this used to leave
  // it behind, so three of the doors wrote a note nobody ever read.
  note,
  // A place is a building like the rest of them: the yard's spare hands go out
  // and put it up, and the view does not glide to it until it is standing.
  kind: 'building', site: 'yard', at,
  // `more` is any further coin a door asks alongside the core and the dust --
  // the lab takes a handful of spores, because it multiplies the grounds and
  // should cost a taste of one.
  bill: () => [['core', cores], ['dust', dust], ...(more || [])],
  // `then` is anything else the door does the moment it opens -- the quarry
  // sends its first body over, so the place is never bought and then dead.
  buy: () => { S[open] = true; lookAt(at()); if (then) then(); },
  // `once` is the door's reveal, and it is optional: a door with none is
  // revealed by `show` alone. See `revealed` in shop.js -- a condition that can
  // stop being true belongs here, so the door does not come off the board again.
  once,
  show
});

// A door is shown once you are within reach of affording it. Nothing here is
// revealed by a counter passing a mark nobody can see -- and a price you have no
// idea is coming is a price you cannot save for.
export const nearly = n => S.stored >= n * UNLOCK_SHOW;
// ...and a place is only worth showing once a core has been seen at all, because
// until then the price is in a currency you have no idea exists.
export const seenACore = () => S.seenCore;

// The yard has been invested in: two places bought and the first rock behind
// you. Three rows wait on this -- the casino, the multipliers and the tower --
// and each of them used to name the building that happened to sit at this tier
// instead. That was the lab, then the construction bench, and both are gone
// now, so each of the three had to be re-pointed at whatever stood there next.
// Written once here so the next thing to be scrapped does not cost a third
// round of that: what these rows are actually waiting for is the player having
// committed to the place, not any one building being up.
export const invested = () => S.quarryOpen && S.boulderNo >= 2;
