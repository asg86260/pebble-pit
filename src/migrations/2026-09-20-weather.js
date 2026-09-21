// The rain got its own clock: a front is due every few minutes whatever is
// overhead, and a save carries when the next one is (`rainDue`) and how big
// the one on the way is (`stormHeft`). A save from before has neither, and
// a clock of -1 never comes due, so it is given the first front the way a
// new yard is: a full storm, a few minutes off.
import { RAIN_FIRST_S } from '../config/sky.js';

export default {
  since: '2026-09-20',
  v: 4,
  says: 'the rain has a clock of its own',
  apply(s) {
    if (!(+s.rainDue >= 0)) s.rainDue = RAIN_FIRST_S;
    if (!(+s.stormHeft > 0)) s.stormHeft = 1;
  }
};
