// Heaven's gates and their stair moved to the yard's left end, left of the
// house (the owner, 2026-10-20), so the house and its door stand further
// right than they did. A yard past the finale saved the two of them by world
// pixels at the old door (`retired.home`); they come with the house, by the
// same distance, so a reload finds them at its door and bench as they were.
import { P } from '../config/yard.js';
import { FINALE_END_CELLS } from '../config/finale.js';

export default {
  since: '2026-10-20',
  v: 27,
  says: 'the house moved right of heaven\'s stairway: the two of them at home move with it',
  apply(s) {
    const r = s.retired;
    if (!r || !Number.isFinite(r.home)) return;
    const d = FINALE_END_CELLS * P - r.home;
    if (!d) return;
    r.home += d;
    if (Array.isArray(r.x)) r.x = r.x.map(x => (Number.isFinite(x) ? x + d : x));
  }
};
