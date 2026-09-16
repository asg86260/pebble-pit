// The fullscreen button: a square in the sky's top-right corner, and a row on
// the settings sheet, both asking the platform for the whole screen and
// giving it back. Shown only where the platform can do it
// (`fullscreenEnabled`): a desk's browser, Android, an iPad. An iPhone has
// no element fullscreen at all -- Safari's is for video -- so it gets no
// button that does nothing; installing to the home screen is the whole
// screen there (play.html, the manifest), and the sheet says so in a line.
//
// The glyph flips between in and out on the platform's own `fullscreenchange`
// rather than on the press, since the escape key and the system's own
// gestures leave fullscreen without asking us.

import { FS_SIZE, FS_INSET } from './config.js';
import { S } from './state.js';
import { onTap } from './tap.js';

const doc = typeof document !== 'undefined' ? document : null;
const root = doc?.documentElement;

// Whether the platform will do it at all. Read once: it is a fact about the
// browser, not the moment.
export const fullscreenAble = () =>
  !!doc && !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);

export const inFullscreen = () => !!doc && !!(doc.fullscreenElement || doc.webkitFullscreenElement);

// In or out, with the webkit spellings for the platforms that still use
// them. The request is asked of the root, so the whole page goes, sheets and
// all. A refusal (a browser that wants a gesture it did not get) is nothing
// to crash over.
export function toggleFullscreen() {
  try {
    if (inFullscreen()) (doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc);
    else (root.requestFullscreen || root.webkitRequestFullscreen)?.call(root);
  } catch {}
}

const button = doc?.getElementById('fullscreen');
const rowEl = doc?.getElementById('fullscreenrow');
root?.style.setProperty?.('--fs-size', `${FS_SIZE}px`);
root?.style.setProperty?.('--fs-inset', `${FS_INSET}px`);

// Two ways to say the same state, and the word says what pressing does.
function dress() {
  const on = inFullscreen();
  if (button) { button.dataset.on = on ? '1' : ''; button.title = on ? 'leave fullscreen' : 'fullscreen'; }
  if (rowEl) rowEl.textContent = on ? 'fullscreen: on' : 'fullscreen: off';
}

if (button) {
  onTap(button, toggleFullscreen);
  doc.addEventListener('fullscreenchange', dress);
  doc.addEventListener('webkitfullscreenchange', dress);
  dress();
}
if (rowEl) {
  rowEl.addEventListener('click', toggleFullscreen);
  // The row stands only where it can do something; where it cannot, one
  // line says what does.
  const note = doc.getElementById('fullscreennote');
  if (!fullscreenAble()) { rowEl.hidden = true; rowEl.dataset.pane = ''; if (note) note.dataset.pane = 'settings'; }
  else if (note) { note.dataset.pane = ''; note.hidden = true; }
}

// Seated every frame like the rest of the shell: gone while the game is
// held, since the sheet is up and has its own row.
let shown = null;
export function refreshFullscreen() {
  if (!button) return;
  const want = fullscreenAble() && !S.paused;
  if (want === shown) return;
  shown = want;
  button.hidden = !want;
  // and the pin under it gives the corner up
  root.style.setProperty('--fs-room', want ? `${FS_SIZE + FS_INSET}px` : '0px');
}
