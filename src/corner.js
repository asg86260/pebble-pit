// The corner: the row of squares in the sky's top-right (play.html,
// `#corner`) and the crew switch that stands in it. The row lays itself out
// right to left, so this file does not say who stands where.
//
// The crew switch draws the bodies at full ink, faint, or not at all
// (render.js, a `dim` layer), a press a step round the three, so an endgame
// yard's crowd can be looked through or cleared off the buildings behind it. It
// is on the screen rather than on the settings sheet because it is a thing
// you reach for while watching, not a setting you make once. A preference
// (prefs.js, `crewView`), so it outlasts the run.

import { CREW_FADE } from './config.js';
import { S } from './state.js';
import { CREW_VIEWS, crewView, setPref } from './prefs.js';
import { onTap } from './tap.js';
import { showTipAt } from './board.js';
import { goDeep, goUp, gliding } from './view.js';
import { recede } from './cutscene.js';
import { msg } from './lang.js';

const corner = document.getElementById('corner');
const crew = document.getElementById('crewfade');
const way = document.getElementById('way');

// The glyph is one body drawn the way the yard's bodies are, so it shows
// where the switch stands; the note under it on a hover says what a press
// does next -- the yard's own note (board.js, `#tip`) rather than the
// browser's, so it reads like every other note in the game.
const next = () => CREW_VIEWS[(CREW_VIEWS.indexOf(crewView()) + 1) % CREW_VIEWS.length];
const NOTE = { show: msg('other-corner-show'), fade: msg('other-corner-fade'), hide: msg('other-corner-hide') };
let noting = false; // page: the pointer is over the crew switch
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

// The way through the surface: the same as a click on the drowned pit or the
// deep's ceiling, and on the shaft's arrow, put where the hand already goes
// for the screen's own buttons. From the snatch on; nothing while the camera
// is between the halves.
onTap(way, () => { if (gliding()) return; if (S.view === 'deep') goUp(); else goDeep(); });
// Its note the yard's own, as the crew switch's is.
let wayNoting = false; // page: the pointer is over the way through
function wayNote() {
  if (!wayNoting) return;
  const r = way.getBoundingClientRect();
  showTipAt(way.getAttribute('aria-label'), r.left + r.width / 2, r.bottom + 6, true);
}
way.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') { wayNoting = true; wayNote(); } });
way.addEventListener('pointerleave', () => { if (wayNoting) { wayNoting = false; showTipAt(null); } });
function seatWay() {
  way.hidden = S.paused || !S.portalOpen;
  const up = S.view === 'deep';
  if (way.dataset.way !== (up ? 'up' : 'down')) {
    way.dataset.way = up ? 'up' : 'down';
    way.setAttribute('aria-label', up ? msg('other-corner-up') : msg('other-corner-down'));
    wayNote();
  }
  if (way.hidden && wayNoting) { wayNoting = false; showTipAt(null); }
}

// Seated every frame like the rest of the shell, after the squares that
// decide for themselves (fullscreen.js, pause.js): gone while the game is
// held, since the sheet is up over the yard it would fade. And the row fades
// out while a scene holds the yard and back in after, on the recede's own
// number as the yard's reading does (render.js, `HUD`): the letterbox's top
// band is where it stands. Untouchable while it is going (style.css,
// `.scened`).
export function refreshCorner() {
  const ink = 1 - recede();
  corner.classList.toggle('scened', ink < 1);
  corner.style.opacity = ink < 1 ? ink.toFixed(3) : '';
  crew.hidden = S.paused;
  seatWay();
  if (crew.hidden && noting) { noting = false; showTipAt(null); }
  crew.style.setProperty('--crew-fade', CREW_FADE);
}
