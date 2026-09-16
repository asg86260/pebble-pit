import { TYPE, JOB } from '../jobs.js';

// The school came down: kit is sold where it is worn. A teacher is a trade
// the roster no longer has and comes back carrying, on its feet where the
// factory puts a carrier rather than inside a building that is not there. The
// hats on the shelf outside it were already in the station's count.
export default {
  since: '2026-09-14',
  v: 1,
  says: 'the school came down; its teachers carry',
  apply(s) {
    if (Array.isArray(s.who)) {
      s.who = s.who.map(k => {
        if (k?.type !== 'teacher') return k;
        const { x, y, goal, inside, site, ...rest } = k;
        if (rest.kitOf === 'teachers') rest.kitOf = JOB.HAUL;
        return { ...rest, type: TYPE.HAUL };
      });
    }
    delete s.teachers;
    delete s.hatShelf;
    delete s.schoolOpen;
  }
};
