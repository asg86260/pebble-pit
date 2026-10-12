// The notices as Steam's achievements (DESIGN.md, "Three builds").
//
// The in-game list is the catalog's, and Steam's is a copy of it: one
// achievement a notice, named by the notice's key, so a notice added to the
// catalog has its Steam twin's name the moment it exists. The display text and
// icons live in the Steamworks dashboard, not here.
//
// The desk is the only way out of the page. `window.desk` has the two calls
// on a desk build and not at all on the web, so everything here is a quiet
// nothing off the desk, and a shell that is not on Steam does the same on its
// side. Nothing here may throw into the game.

import { CATALOG } from './catalog.js';

export const steamNameOf = key => `ACH_${String(key).toUpperCase()}`;

// Every notice's Steam name, in the catalog's order.
export const STEAM_ACHIEVEMENTS = CATALOG.map(n => ({ key: n.key, api: steamNameOf(n.key), name: n.name }));

const desk = () => (typeof window !== 'undefined' && window.desk) || null;

// A notice has just been earned.
export function tellSteam(key) {
  try { const d = desk(); if (d && d.achievement) d.achievement(steamNameOf(key)); } catch {}
}

// At launch, once the save is read: everything already won, so a player who
// earned them before Steam was in the game has them there too.
export function syncSteam(won) {
  try {
    const d = desk();
    if (d && d.achievements && won.length) d.achievements(won.map(steamNameOf));
  } catch {}
}
