// What each act-3 ladder is worth now: the afterlife's levels.js. Pure reads
// of `S.after.rungs` and the written tables (AFTER_LADDERS), so the sim reads
// a ladder without importing the cards that sell it (rows.js).

import { S } from '../state.js';
import { AFTER_LADDERS, LADDER } from '../config.js';

export const rungAt = key => Math.max(0, Math.min(LADDER, (S.after && S.after.rungs[key]) || 0));
export const ladderValue = (key, lvl) => {
  const v = AFTER_LADDERS[key].value;
  return v[Math.max(0, Math.min(v.length - 1, lvl))];
};
export const valueOf = key => ladderValue(key, rungAt(key));

export const puffFaith = () => valueOf('after-puff');
export const treeChops = () => valueOf('after-axe');
export const growS = () => valueOf('after-grow');
export const sawS = () => valueOf('after-saw');
export const signS = () => valueOf('after-joinery');
export const pulpS = () => valueOf('after-pulp');
export const stackOf = () => valueOf('after-print');
export const wringInk = () => valueOf('after-wring');

// Whether a station stands (bought, or standing from the start).
export const built = key => !!S.after && (key === 'grove' ? S.after.gate >= 1 : S.after.built.includes(key));
