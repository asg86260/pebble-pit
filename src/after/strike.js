// The gates and the strike (DESIGN.md, "Acts 3 and 4", act 3, "The gates" and
// "The climax").
//
// The three gates in AFTER_GATES, each reached once and kept, every one read
// off how empty God's yard is (call 14, settled 2026-10-18: members walk
// out): the first meeting at MEET_MEMBERS souls walked out to the camp, the
// slowdown at SLOW_SHARE of the crowd walked out (the throne's speech comes
// twice as often), the strike at STRIKE_SHARE. No gate
// offers a station: the shack has them all from the start. The strike is a cutscene, never a
// fight (call 3 open: one defeat, the recommendation). `S.after.gate` is how
// many are reached, so `AFTER_GATES[gate - 1]` is the last.
//
// The seams for the beats (actbeats.js): `afterGate()` names the gate due
// this frame and not yet reached, and `strikeDue()` the climax.

import { S } from '../state.js';
import { AFTER_GATES, MEET_MEMBERS, SLOW_SHARE, STRIKE_SHARE } from '../config.js';
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

// One frame of the gates: the next one reached if met.
export function stepStrike(c) {
  const a = S.after;
  if (afterGate()) { a.gate += 1; a.gateAt = a.t; }
}
