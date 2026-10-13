// The endless serpent, one bar a level (DESIGN.md, "Endless serpent"): past
// the story the serpent is on its last defense and nowhere else. A save in the
// loop the first build had -- every level a whole fight from the first
// defense, the serpent down and gathering between -- is put on the last at its
// level: fighting a defense before it, the last opens calm and whole; down
// after a kill past the story, that kill was the level's bar emptied, so it is
// put mid-recoil with the bar empty and lands on the next level as a recoil
// would. A save at level 1 is the story and is left alone.
import { SERPENT_DEPTHS, SERPENT_LEVEL_GROWTH } from '../config/deep.js';

const LAST = SERPENT_DEPTHS.length - 1;

export default {
  since: '2026-10-13',
  v: 20,
  says: 'past the story the serpent stays on its last defense, a bar a level',
  apply(s) {
    const level = Number.isInteger(s.serpentLevel) ? s.serpentLevel : 1;
    if (level < 2) return;
    const down = !!s.serpentFreed || s.serpentStage > LAST;
    if (!down && s.serpentStage === LAST) return;
    s.serpentStage = LAST;
    s.serpentFreed = false;
    s.freedAt = s.reformAt = s.breakT = null;
    s.orb = null;
    s.mechAt = 0; s.mechSkip = false; s.phaseAt = 0;
    s.serpentStun = s.serpentGrace = 0;
    s.statuses = {};
    s.serpentWound = down ? Math.round(SERPENT_DEPTHS[LAST] * SERPENT_LEVEL_GROWTH ** (level - 1)) : 0;
    s.recoilT = down ? 0 : null;
  }
};
