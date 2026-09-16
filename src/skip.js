// Skipping a scene: the space bar, held. One key ends whichever scene is
// running; held rather than pressed, because a rested hand is not a decision.
// The clock is the game's, so a hold taken into the held sheet is still there
// when the yard comes back.
//
// What a skip does is each beat's own business (`skip` on its row in
// beats.js): this only knows that one is running and that the key has been
// down long enough. It never sets state a beat did not set for itself.

import { S } from './state.js';
import { now } from './clock.js';
import { SKIP_HOLD_MS } from './config.js';
import { ownsYard, skipBeat } from './beats.js';
import { cutsceneRunning } from './cutscene.js';

// Whether there is anything to skip. A rescue already cut is finishing its
// walk and is nobody's to hurry.
export const skippable = () =>
  (ownsYard() && !S.introCut) || cutsceneRunning();

// Down keeps its first time -- the browser repeats a held key -- and up
// clears it.
export const holdSkip = on => { S.skipHeldAt = on ? (S.skipHeldAt || now()) : 0; };

// How far through the hold, 0 to 1, for the bar.
export const skipHeld = () =>
  S.skipHeldAt ? Math.min(1, (now() - S.skipHeldAt) / SKIP_HOLD_MS) : 0;

// Everything running, cut: the camera let go and the scene ended, in that
// order, since the dome's first hold is both at once. True if anything was.
export const skipScene = () => skipBeat(now());

// One frame: a hold with nothing to skip is dropped, so a key held through
// the end of one scene does not eat the start of the next -- one hold, one
// skip.
export function stepSkip(t) {
  if (!S.skipHeldAt) return;
  if (!skippable()) { S.skipHeldAt = 0; return; }
  if (t - S.skipHeldAt < SKIP_HOLD_MS) return;
  skipScene();
  S.skipHeldAt = 0;
}
