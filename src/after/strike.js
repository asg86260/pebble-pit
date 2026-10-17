// The gates and the strike (DESIGN.md, "Acts 3 and 4", act 3, "The gates" and
// "The climax"). A stub of the scaffold: nothing here runs yet.
//
// What it will own: the three gates in AFTER_GATES -- the first meeting at
// MEET_MEMBERS (the grove opens), the slowdown at SLOW_SHARE of the crowd
// (the paper branch opens, the wardens double), the strike at STRIKE_SHARE --
// and owing each one's beat (story.js). The strike stops God's yard, the
// tithe stops, the glare fails: a cutscene, never a fight. Whether heaven
// has one defeat or two is call 3, open (one recommended: the strike beats
// the disguise and the one under it at once). The gate reached is
// `S.after.gate`, an index into AFTER_GATES.

import { S } from '../state.js';
import { AFTER_GATES } from '../config.js';

// One frame of the gates: none opens yet.
export function stepStrike(c) {}

// The last gate the union has reached, or null before the first meeting.
export const gateReached = () => (S.after && S.after.gate > 0 ? AFTER_GATES[S.after.gate - 1] : null);
