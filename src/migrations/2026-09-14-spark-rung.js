import { TIER_RUNGS } from '../config/tiers.js';

// The lab's multipliers (`mult`, a quarter-again over a finished ladder) and
// the `lab*` works that bought them became the spark rung at the top of each
// ladder. A save with any of one had climbed the whole ladder under it, so
// the field goes to the top; a `lab*` work still in flight lands the same
// way, since the sparks were paid and there is no row left to finish it. The
// quarry's answered to `cave` before the place was renamed.
const FOLD = { crop: 'cropLevel', seam: 'seamLevel', tend: 'tendLevel', quarry: 'quarryPaceLevel' };
const LAB = { labcrop: 'crop', labseam: 'seam', labtend: 'tend', labcave: 'quarry' };

export default {
  since: '2026-09-14',
  v: 1,
  says: 'the multipliers and the lab works became the spark rung',
  apply(s) {
    const flying = new Set(Object.values(s.works || {})
      .flatMap(w => Array.isArray(w) ? w : w ? [w] : [])
      .map(w => w?.key && LAB[w.key]).filter(Boolean));
    for (const [k, field] of Object.entries(FOLD)) {
      const had = +(s.mult?.[k] ?? (k === 'quarry' ? s.mult?.cave : 0)) || 0;
      if (had > 0 || flying.has(k)) s[field] = TIER_RUNGS;
    }
    delete s.mult;
  }
};
