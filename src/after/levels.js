// What act 3's upgrades make of the place now: the afterlife's levels.js. Pure
// reads of `S.after.ups` (how many times each named upgrade is bought) and the
// config's two values a row (the foot and what its upgrade buys), so the sim
// reads an upgrade without importing the cards that sell it (rows.js).

import { S } from '../state.js';
import { AFTER_START_BUILT, AFTER_UPGRADES, AFTER_PLOTS0, AFTER_PODIUM_REBEL, TREE_GROW_S, AFTER_GROW_S_UP,
         AFTER_BLADE_LOGS, AFTER_BENCH_SIGNS, AFTER_SAWDUST_BRIM, AFTER_SAWDUST_BRIM_UP,
         SIGN_REACH, SIGN_REACH_UP, AFTER_SEAT_BILLS } from '../config.js';
import { podiumStood } from './place.js';

export const upCount = key => Math.max(0, Math.min(AFTER_UPGRADES[key].bills.length, (S.after && S.after.ups[key]) || 0));
export const has = key => upCount(key) > 0;

// The podium bought, 0 the soapbox.
export const podiumRung = () => upCount('after-podium');

// A job's seats: one to start and each bought on its station's board, the
// seat rows' count kept beside the named upgrades' (rows.js).
export const seatKey = job => 'after-seat-' + job;
export const seatsBought = job => Math.max(0, Math.min(AFTER_SEAT_BILLS.length, (S.after && S.after.ups[seatKey(job)]) || 0));
export const seatsOf = job => 1 + seatsBought(job);
// A line's rebel: the higher the podium they stand on (place.js,
// `podiumStood`), the further the speech carries.
export const shoutRebel = () => AFTER_PODIUM_REBEL[podiumStood()];
export const plotCount = () => AFTER_PLOTS0 + upCount('after-plot');
export const growS = () => (has('after-grow') ? AFTER_GROW_S_UP : TREE_GROW_S);
// Each read when the thing is made, never after: a tree planted big, a sign
// put up big, so nothing already standing changes size.
export const bigTrees = () => has('after-tree');
export const bigSigns = () => has('after-signreach');
// Woodcutters dig stumps out too, once stump removal is bought.
export const stumpsOn = () => has('after-stumps');
export const bladeLogs = () => (has('after-blade') ? AFTER_BLADE_LOGS : 1);
export const heapBrim = () => (has('after-heap') ? AFTER_SAWDUST_BRIM_UP : AFTER_SAWDUST_BRIM);
export const benchSigns = () => (has('after-bench') ? AFTER_BENCH_SIGNS : 1);
export const signReach = big => (big ? SIGN_REACH_UP : SIGN_REACH);

// Whether a station stands: raised to its last piece, or standing from the
// start. The grove is open from the act's first frame.
// The grove, and the stations standing from the act's first frame, stand in
// any save, one made before a station was added to them too.
export const built = key => !!S.after && (key === 'grove' || AFTER_START_BUILT.includes(key) || S.after.built.includes(key));
// Whether it is bought and going up a piece at a time.
export const raising = key => !!S.after && !!S.after.raising[key] && !built(key);
