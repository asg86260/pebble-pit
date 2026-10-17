// The gates and the strike (DESIGN.md, "Acts 3 and 4", act 3, "The gates" and
// "The climax").
//
// The three gates in AFTER_GATES, each reached once and kept: the first
// meeting at MEET_MEMBERS members (won by canvassers alone; the grove opens
// to the union and the saw mill and the workshop are offered), the slowdown
// at SLOW_SHARE of the crowd (the paper mill and the press are offered, the
// speech comes twice as often and the wardens double), the strike at
// STRIKE_SHARE. The strike is a cutscene, never a fight (call 3 open: one
// defeat, the recommendation). `S.after.gate` is how many are reached, so
// `AFTER_GATES[gate - 1]` is the last.
//
// The seams for the beats (Track C): `afterGate()` names the gate due this
// frame and not yet reached, and `strikeDue()` the climax. Until the beats
// read them, the strike is owed through acts.js (`owe('strike')`), as the
// axe is (faith.js).

import { S } from '../state.js';
import { AFTER_GATES, MEET_MEMBERS, SLOW_SHARE, STRIKE_SHARE } from '../config.js';
import { owe, owed } from '../acts.js';
import { union, support } from './union.js';

// Whether gate `k` (0 the meeting) stands met by the crowd as it is now.
const met = k => k === 0 ? union() >= MEET_MEMBERS
              : k === 1 ? support() >= SLOW_SHARE
              : support() >= STRIKE_SHARE;

// The next gate, by name, if the crowd has met it and it is not yet reached:
// null otherwise. One gate a frame, in order.
export function afterGate() {
  const a = S.after;
  if (!a || a.gate >= AFTER_GATES.length) return null;
  return met(a.gate) ? AFTER_GATES[a.gate] : null;
}
export const strikeDue = () => !!S.after && S.after.gate >= AFTER_GATES.length && !S.beatsDone.includes('strike');
export const gateReached = () => (S.after && S.after.gate > 0 ? AFTER_GATES[S.after.gate - 1] : null);

// One frame of the gates: the next one reached if met, and the strike owed
// while it is due.
export function stepStrike(c) {
  const a = S.after;
  if (afterGate()) { a.gate += 1; a.gateAt = a.t; }
  if (strikeDue() && !owed('strike') && S.beat.camera !== 'strike') owe('strike');
}
