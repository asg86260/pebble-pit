// The constrict's orb keeps time, not hit points (the owner's vote, 2026-10-15:
// "the timer/health is the same thing"). An orb saved holding hit points is
// read as the same share of its time: `left` of `last` seconds, as `hp` was
// of `max`, with nothing yet cut off it.
import { MECHANICS } from '../config/deep.js';

export default {
  since: '2026-10-16',
  v: 22,
  says: 'a running orb\'s hit points become the same share of its time',
  apply(s) {
    const o = s.orb;
    if (!o || typeof o !== 'object' || o.left != null) return;
    const last = MECHANICS.find(m => m && m.kind === 'orb').last;
    const k = o.max > 0 ? Math.max(0, Math.min(1, o.hp / o.max)) : 0;
    s.orb = { st: o.st, left: last * k, max: last, cut: 0, at: o.at };
  }
};
