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
import { showTipAt } from './board.js';

const row = document.getElementById('corner');
const crew = document.getElementById('crewfade');

// The glyph is one body at the ink the yard's bodies are at. The note under
// it says what the switch is, where it stands and what a press does -- the
// yard's own note (board.js, `#tip`) rather than the browser's, so it reads
// like every other note in the game and changes the moment it is pressed.
const NOTE = {
  off: 'crew: full ink\nclick to fade the workers,\nso the buildings behind\nthem show through',
  on: 'crew: faded\nclick to put the workers\nback at full ink',
};
let noting = false;
function note() {
  if (!noting) return;
  const r = crew.getBoundingClientRect();
  showTipAt(NOTE[fadedCrew() ? 'on' : 'off'], r.left + r.width / 2, r.bottom + 6, true);
}
function dress() {
  const on = fadedCrew();
  crew.dataset.on = on ? '1' : '';
  crew.setAttribute('aria-label', on ? 'crew faded' : 'crew at full ink');
  crew.setAttribute('aria-pressed', on ? 'true' : 'false');
  note();
}
onTap(crew, () => { setPref('faded', !fadedCrew()); dress(); });
// A mouse's hover only: a thumb has no hover, and a note left standing after
// a tap would cover the yard it was pressed to clear.
crew.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') { noting = true; note(); } });
crew.addEventListener('pointerleave', () => { if (noting) { noting = false; showTipAt(null); } });
dress();

// Seated every frame like the rest of the shell, after the squares that
// decide for themselves (fullscreen.js, gear.js): gone while the game is
// held, since the sheet is up over the yard it would fade.
let room = null;
export function refreshCorner() {
  crew.hidden = S.paused;
  if (crew.hidden && noting) { noting = false; showTipAt(null); }
  crew.style.setProperty('--crew-fade', CREW_FADE);
  const any = [...row.children].some(b => !b.hidden);
  if (any === room) return;
  room = any;
  document.documentElement.style.setProperty('--fs-room', any ? `${FS_SIZE + FS_INSET}px` : '0px');
}
