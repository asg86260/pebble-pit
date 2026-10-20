// What act 3's upgrades make of the place now: the afterlife's levels.js. Pure
// reads of `S.after.ups` (how many times each named upgrade is bought) and the
// config's two values a row (the foot and what its upgrade buys), so the sim
// reads an upgrade without importing the cards that sell it (rows.js).

import { S } from '../state.js';
import { AFTER_UPGRADES, AFTER_PLOTS0, AFTER_PODIUM_REBEL, TREE_GROW_S, AFTER_GROW_S_UP,
         AFTER_BLADE_LOGS, AFTER_BENCH_SIGNS, AFTER_VAT_SHEETS, AFTER_DRY_VATS, AFTER_STACK, AFTER_STACK_UP,
         AFTER_SAWDUST_BRIM, AFTER_SAWDUST_BRIM_UP, AFTER_CHIP_LOGS, AFTER_CHIP_SAWDUST, AFTER_CHIP_SAWDUST_UP,
         SIGN_REACH, SIGN_REACH_UP, POSTER_REACH, POSTER_REACH_UP } from '../config.js';
import { podiumStood } from './place.js';

export const upCount = key => Math.max(0, Math.min(AFTER_UPGRADES[key].bills.length, (S.after && S.after.ups[key]) || 0));
export const has = key => upCount(key) > 0;

// The podium bought, 0 the soapbox.
export const podiumRung = () => upCount('after-podium');
// A line's rebel: the higher the podium they stand on (place.js,
// `podiumStood`), the further the speech carries.
export const shoutRebel = () => AFTER_PODIUM_REBEL[podiumStood()];
export const plotCount = () => AFTER_PLOTS0 + upCount('after-plot');
export const growS = () => (has('after-grow') ? AFTER_GROW_S_UP : TREE_GROW_S);
// Each read when the thing is made, never after: a tree planted big, a sign
// or a poster put up big, so nothing already standing changes size.
export const bigTrees = () => has('after-tree');
export const bigSigns = () => has('after-signreach');
export const bigPosters = () => has('after-posterreach');
// Woodcutters dig stumps out too, once stump removal is bought.
export const stumpsOn = () => has('after-stumps');
export const bladeLogs = () => (has('after-blade') ? AFTER_BLADE_LOGS : 1);
export const heapBrim = () => (has('after-heap') ? AFTER_SAWDUST_BRIM_UP : AFTER_SAWDUST_BRIM);
export const chipLogs = () => (has('after-drum') ? AFTER_CHIP_LOGS : 1);
export const chipSawdust = () => (has('after-spout') ? AFTER_CHIP_SAWDUST_UP : AFTER_CHIP_SAWDUST);
export const benchSigns = () => (has('after-bench') ? AFTER_BENCH_SIGNS : 1);
export const vatSheets = () => (has('after-vat') ? AFTER_VAT_SHEETS : 1);
// Batches the paper mill stirs at once: a second with the drying line.
export const vats = () => (has('after-dry') ? AFTER_DRY_VATS : 1);
export const stackOf = () => (has('after-stack') ? AFTER_STACK_UP : AFTER_STACK);
export const signReach = big => (big ? SIGN_REACH_UP : SIGN_REACH);
export const posterReach = big => (big ? POSTER_REACH_UP : POSTER_REACH);

// Whether a station stands: raised to its last piece, or standing from the
// start. The grove is open from the act's first frame.
export const built = key => !!S.after && (key === 'grove' || S.after.built.includes(key));
// Whether it is bought and going up a piece at a time.
export const raising = key => !!S.after && !!S.after.raising[key] && !built(key);
