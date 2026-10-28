// Every body carries cells since 2026-10-28 (DESIGN.md, "One resource system
// for every act", section 4): `load` is an array of cell values and `carry` its
// length, in act 3 as in the yard. A save from before kept an act 3 body's load
// as the name of what it held ('log', 'plank', 'sign') with `carry` how many,
// and three things that were never goods in the same field: 'tip' (a sawyer
// off to the notch with a load of sawdust), and 'carry' and 'lay' (a builder
// with a load of a station going up). Here, on the raw save, a good becomes
// that many units of its kind's value, the sawyer's trip its own flag
// (`tipping`) and a builder's load a unit of the shack's (`phase` says which
// half of the trip it is on), so nobody drops what they held.
import { KINDS, AFTER_SITE_LOAD } from '../config.js';

const obj = v => v && typeof v === 'object' && !Array.isArray(v);

export default {
  since: '2026-10-28',
  v: 33,
  says: 'act 3\'s members carry cells like the yard\'s haulers: a load of "log" and a count becomes that many log cells',
  apply(s) {
    const a = s.after;
    if (!obj(a) || !Array.isArray(a.bodies)) return;
    for (const b of a.bodies) {
      if (!obj(b)) continue;
      const was = b.load;
      if (Array.isArray(was)) { b.carry = was.length; continue; }
      b.load = [];
      b.carry = 0;
      if (was === 'tip') b.tipping = true;
      else if (was === 'carry' || was === 'lay') { b.phase = was; b.load = [AFTER_SITE_LOAD]; b.carry = 1; }
      else if (typeof was === 'string' && KINDS[was]) {
        const n = Math.max(1, Math.floor(+b.carry || 1));
        b.load = Array(n).fill(KINDS[was].first);
        b.carry = n;
      }
    }
  }
};
