// What the readouts show in the acts' places (render/counter.js): each
// place's own purse, the yard's coins being below. Read off each act's own
// purse (after/rows.js `afterPurse`, hell/coins.js `hellPurse`): faith, then
// ink once there is any, up there; brimstone, then the bars once there are
// any, down in hell, and the dust the ghosts have carried down. Placeholder
// marks on the card, every one, until the coins are drawn.

import { S } from './state.js';
import { afterPurse } from './after/rows.js';
import { hellPurse, HELL_COINS } from './hell/coins.js';

export function actsCount(place) {
  if (place === 'after') {
    const out = [{ n: afterPurse('faith') }];
    if (afterPurse('ink') > 0) out.push({ n: afterPurse('ink') });
    return out;
  }
  const out = HELL_COINS.map(c => ({ n: hellPurse(c) })).filter((l, i) => i === 0 || l.n > 0);
  const carried = (S.acts && S.acts.purse) || 0;
  if (carried > 0) out.push({ n: carried });
  return out;
}
