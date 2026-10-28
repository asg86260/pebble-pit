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
import { gliding } from './view.js';
import { waysOut, takeWay } from './portals.js';
import { recede } from './cutscene.js';
import { msg } from './lang.js';

const corner = document.getElementById('corner');
const crew = document.getElementById('crewfade');
const ways = [document.getElementById('way'), document.getElementById('way2')];

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

// The ways out of the place on screen (portals.js, `waysOut`), a square
// each, put where the hand already goes for the screen's own buttons: from
// the snatch on, the wizards' portal down from the yard and up from the
// deep, the same as a press on the portal or the shaft's hand; in the acts,
// each act portal the story has opened to the player, the same as a press
// on its end. A chevron for which way the camera goes; nothing while it is
// going.
const WAY_NOTE = {
  'yard:deep': msg('other-corner-down'), 'deep:yard': msg('other-corner-up'),
  'after:yard': msg('other-corner-down-yard'), 'yard:after': msg('other-corner-up-after'),
  'deep:hell': msg('other-corner-down-hell'), 'hell:deep': msg('other-corner-up-deep')
};
let shown = [];      // page: the way each square stands for, as last seated
let wayNoting = -1;  // page: which square the pointer is over, or -1
function wayNote() {
  if (wayNoting < 0) return;
  const b = ways[wayNoting], r = b.getBoundingClientRect();
  showTipAt(b.getAttribute('aria-label'), r.left + r.width / 2, r.bottom + 6, true);
}
ways.forEach((b, i) => {
  onTap(b, () => { if (!gliding()) takeWay(shown[i]); });
  // Its note the yard's own, as the crew switch's is.
  b.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') { wayNoting = i; wayNote(); } });
  b.addEventListener('pointerleave', () => { if (wayNoting === i) { wayNoting = -1; showTipAt(null); } });
});
function seatWay() {
  shown = S.paused ? [] : waysOut();
  ways.forEach((b, i) => {
    const w = shown[i];
    b.hidden = !w;
    if (!w) { if (wayNoting === i) { wayNoting = -1; showTipAt(null); } return; }
    const note = WAY_NOTE[`${S.view}:${w.to}`] || '';
    if (b.dataset.way !== w.dir || b.getAttribute('aria-label') !== note) {
      b.dataset.way = w.dir;
      b.setAttribute('aria-label', note);
      if (wayNoting === i) wayNote();
    }
  });
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
