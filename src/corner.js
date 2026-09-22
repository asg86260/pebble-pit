// The corner: the row of squares in the sky's top-right (play.html,
// `#corner`) and the crew switch that stands in it. The row lays itself out
// right to left, so this file does not say who stands where; it says only
// whether the row holds anything, for the pin under it to give the corner up.
//
// The crew switch draws the bodies faint (render.js, a `dim` layer), so an
// endgame yard's crowd can be looked through to the buildings behind it. It
// is on the screen rather than on the settings sheet because it is a thing
// you reach for while watching, not a setting you make once. A preference
// (prefs.js, `faded`), so it outlasts the run.

import { FS_SIZE, FS_INSET, CREW_FADE } from './config.js';
import { S } from './state.js';
import { fadedCrew, setPref } from './prefs.js';
import { onTap } from './tap.js';

const row = document.getElementById('corner');
const crew = document.getElementById('crewfade');

// The glyph is one body at the ink the yard's bodies are at, and the words
// say what pressing does.
function dress() {
  const on = fadedCrew();
  crew.dataset.on = on ? '1' : '';
  crew.title = on ? 'crew at full ink' : 'fade the crew';
  crew.setAttribute('aria-pressed', on ? 'true' : 'false');
}
onTap(crew, () => { setPref('faded', !fadedCrew()); dress(); });
dress();

// Seated every frame like the rest of the shell, after the squares that
// decide for themselves (fullscreen.js, gear.js): gone while the game is
// held, since the sheet is up over the yard it would fade.
let room = null;
export function refreshCorner() {
  crew.hidden = S.paused;
  crew.style.setProperty('--crew-fade', CREW_FADE);
  const any = [...row.children].some(b => !b.hidden);
  if (any === room) return;
  room = any;
  document.documentElement.style.setProperty('--fs-room', any ? `${FS_SIZE + FS_INSET}px` : '0px');
}
