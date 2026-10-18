// Readable text (the settings' graphics tab, on the game and the landing
// page): the page's words in IBM Plex Mono a size up, with the tracking and
// the capitals taken off running sentences (style.css, `:root.readable`).
// The yard's own canvas lettering is a picture and is left as it is. The head
// of each page sets the class before the first paint, from the store
// directly (play.html, index.html), so a page never opens in one face and
// turns to the other; this is the switch, which turns it in place. The face
// itself is imported by the two pages' entries (main.js, title.js), since the
// node yard loads this file and cannot take a stylesheet.

import { readable, setPref } from './prefs.js';
import { msg } from './lang.js';

// Every width on the page that is measured from its words (the sheets, the
// boards, the appearance page's slots) is measured again on a resize, so the
// turn asks for one, and again once the face has arrived: until then the
// browser sets the words in the fallback, and a measure taken then is wrong.
function apply() {
  document.documentElement.classList.toggle('readable', readable());
  dispatchEvent(new Event('resize'));
  // the resize has laid the words out in the new face, so it is asked for and
  // `ready` waits on it rather than answering at once
  void document.body.offsetWidth;
  document.fonts?.ready.then(() => dispatchEvent(new Event('resize')));
}

export const sayReadable = el => { el.textContent = readable() ? msg('set-readable-on') : msg('set-readable-off'); };

export function mountReadable(el) {
  sayReadable(el);
  el.addEventListener('click', () => {
    setPref('readable', !readable());
    apply();
    sayReadable(el);
  });
  // a page opened with it on: the face may land after the boot's measures
  if (readable()) { void document.body.offsetWidth; document.fonts?.ready.then(() => dispatchEvent(new Event('resize'))); }
}
