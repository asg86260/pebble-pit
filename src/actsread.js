// What the readouts show in the acts' places (render/counter.js): each
// place's own purse, the yard's coins being below. Each act's track says its
// own lines when it exports them (`afterCount` in after/index.js, `hellCount`
// in hell/index.js, each a list of `{ n }` in the order its card reads);
// until then the scaffold's facts stand in: faith and ink up there,
// brimstone and the dust carried down in hell. Placeholder marks, every one.

import { S } from './state.js';
import * as AFTER from './after/index.js';
import * as HELL from './hell/index.js';

export function actsCount(place) {
  if (place === 'after') {
    if (typeof AFTER.afterCount === 'function') return AFTER.afterCount();
    const a = S.after;
    if (!a) return [{ n: 0 }];
    return a.ink > 0 ? [{ n: a.faith || 0 }, { n: a.ink }] : [{ n: a.faith || 0 }];
  }
  if (typeof HELL.hellCount === 'function') return HELL.hellCount();
  const h = S.hell, carried = (S.acts && S.acts.purse) || 0;
  const out = [{ n: h ? h.brimstone || 0 : 0 }];
  if (carried > 0) out.push({ n: carried });
  return out;
}
