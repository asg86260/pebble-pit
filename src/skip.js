// Skipping a scene: the space bar, held.
//
// Four things take the yard away from the player for a while -- the opening,
// the reunion after the first rock, the rescue under the dome, and the camera
// scenes (cutscene.js) -- and each had its own idea about being skipped: the
// camera scenes on any click, the opening through a dev hook, the other two
// not at all. One key ends whichever of them is running. Held rather than
// pressed, because the scenes play once and a rested hand is not a decision;
// the hold fills a bar under the hint (skiphint.js) so a player who is
// holding can see it counting, and a player who lets go early has lost
// nothing. The clock is the game's, so a hold taken into the held sheet is
// still there when the yard comes back.
//
// What a skip does is each scene's own business (`cutIntro`, `skipCutscene`):
// this only knows that one is running and that the key has been down long
// enough. It never sets state a scene did not set for itself.

import { S } from './state.js';
import { now } from './clock.js';
import { SKIP_HOLD_MS } from './config.js';
import { introRunning, cutIntro } from './intro.js';
import { cutsceneRunning, skipCutscene } from './cutscene.js';

// Whether there is anything to skip. A rescue already cut is finishing its
// walk and is nobody's to hurry.
export const skippable = () =>
  (introRunning() && !S.introCut) || cutsceneRunning();

// The key going down and coming up. Down keeps its first time -- the browser
// repeats a held key -- and up clears it.
export const holdSkip = on => { S.skipHeldAt = on ? (S.skipHeldAt || now()) : 0; };

// How far through the hold, 0 to 1, for the bar.
export const skipHeld = () =>
  S.skipHeldAt ? Math.min(1, (now() - S.skipHeldAt) / SKIP_HOLD_MS) : 0;

// Everything running, cut: the camera let go and the scene ended, in that
// order, since the dome's first hold is both at once. True if anything was.
export function skipScene() {
  const camera = skipCutscene();
  const scene = cutIntro(now());
  return camera || scene;
}

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
