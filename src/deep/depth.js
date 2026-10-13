// How deep a defense is at a level (DESIGN.md, "Endless serpent"): the one
// place the serpent's health is read. Each rise makes every defense
// SERPENT_LEVEL_GROWTH times the last level's, compounding, and nothing else
// about the fight grows. Imports only the state and the config, so the fight,
// the phases and the drawing can all read it with no import order to mind.

import { S } from '../state.js';
import { SERPENT_WOUND, SERPENT_LEVEL_GROWTH } from '../config.js';

// The depth of defense `stage` at `level`, a whole number; nought past the
// last defense, where there is nothing left to break.
export function depthAt(stage, level = S.serpentLevel) {
  const base = SERPENT_WOUND[stage];
  if (!(base > 0)) return 0;
  const l = Math.max(1, Math.floor(level) || 1);
  return Math.round(base * SERPENT_LEVEL_GROWTH ** (l - 1));
}
