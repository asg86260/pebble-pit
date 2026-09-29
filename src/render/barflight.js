// A number's way into the serpent's bar (DESIGN.md, "The serpent's bar": the
// owner's A, docs/mocks/serpent-bar-over-2026-09-28.html). A blow's number is
// knocked off the hide, held at the top of its arc, then falls up into the
// bar; the heal's swells under the belly, then goes in the same way. The bar
// takes a number's effect only when it lands, so what it shows is the sim's
// wound less every blow still in the air and plus every heal still on its
// way. Both the numbers (render/fightnums.js) and the bar
// (render/serpentbar.js) read their timing here, so the two cannot disagree.

import { S } from '../state.js';
import { blowK } from '../deep/serpent.js';
import { NUM_KICK_UP, NUM_KICK_UP_K, NUM_KICK_GRAV, NUM_KICK_HOLD_S, NUM_HEAL_LEAVE_S, NUM_BAR_IN_S } from '../config.js';

// Seconds from a blow's number leaving the hide to the top of its arc.
export const kickTop = k => (NUM_KICK_UP + NUM_KICK_UP_K * k) / NUM_KICK_GRAV;
// Seconds after its number is said (`shut`) that a hit sets off for the bar.
export const leaveOf = hit => hit.weapon === 'heal' ? NUM_HEAL_LEAVE_S : kickTop(blowK(hit.done)) + NUM_KICK_HOLD_S;
// And the moment it lands in the bar, on the game's clock.
export const landsAt = hit => hit.shut + (leaveOf(hit) + NUM_BAR_IN_S) * 1000;

// What the numbers still on their way owe the wound at `t`: a blow in the air
// has not yet opened it, a heal on its way has not yet closed it.
export function owedWound(t) {
  let owed = 0;
  for (const h of S.hits) if (t < landsAt(h)) owed += h.weapon === 'heal' ? h.done : -h.done;
  return owed;
}
