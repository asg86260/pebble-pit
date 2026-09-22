// The corner: the row of squares in the sky's top-right (play.html,
// `#corner`) and the crew switch that stands in it. The row lays itself out
// right to left, so this file does not say who stands where; it says only
// whether the row holds anything, for the pin under it to give the corner up.
//
// The crew switch draws the bodies at full ink, faint, or not at all
// (render.js, a `dim` layer), a press a step round the three, so an endgame
// yard's crowd can be looked through or cleared off the buildings behind it. It
// is on the screen rather than on the settings sheet because it is a thing
// you reach for while watching, not a setting you make once. A preference
// (prefs.js, `crewView`), so it outlasts the run.

import { FS_SIZE, FS_INSET, CREW_FADE } from './config.js';
import { S } from './state.js';
import { CREW_VIEWS, crewView, setPref } from './prefs.js';
import { onTap } from './tap.js';
import { showTipAt } from './board.js';

const row = document.getElementById('corner');
const crew = document.getElementById('crewfade');

// The glyph is one body drawn the way the yard's bodies are, so it shows
// where the switch stands; the note under it on a hover says what a press
// does next -- the yard's own note (board.js, `#tip`) rather than the
// browser's, so it reads like every other note in the game.
const next = () => CREW_VIEWS[(CREW_VIEWS.indexOf(crewView()) + 1) % CREW_VIEWS.length];
const NOTE = { show: 'show workers', fade: 'fade workers', hide: 'hide workers' };
let noting = false;
function note() {
  if (!noting) return;
  const r = crew.getBoundingClientRect();
  showTipAt(NOTE[next()], r.left + r.width / 2, r.bottom + 6, true);
}
function dress() {
  crew.dataset.view = crewView();
  crew.setAttribute('aria-label', NOTE[next()]);
  note();
}
onTap(crew, () => { setPref('crew', next()); dress(); });
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
