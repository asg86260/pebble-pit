// The handles, hung on `window` where the checks and the dev panel look for
// them. main.js reaches for this behind `import.meta.env.DEV`, so a production
// build drops this file and everything it imports: the hooks, the report and
// the browser suite. The `__` names are not an interface; the game itself
// never calls one.

import { showWindow } from './modal.js';
import './selftest.js';        // adds __test() to the console
import * as hooks from './hooks.js';
import { snapshot } from './report.js';
import { seatBoard, boardFit, showPanel } from './board.js';
import { barSpot, pileMarkAt } from './render.js';
import { dialRect } from './render/filter.js';
import { siteBox } from './works.js';

// Everything hooks.js offers, under the name the checks call it by.
Object.assign(window, {
  ...hooks.HANDLES,
  __placeBoard: seatBoard, __boardFit: boardFit,
  // Open or close a board without walking to it. No linger either way: a check
  // that put the board away and hovered a pot found the board still up for a
  // tenth of a second and the picker refusing to open under it.
  __board: which => showPanel(which, true),
  // and a window (modal.js) the same way: by kind, or null to close it
  __window: kind => showWindow(kind)
});

// Facts about the page rather than the game, which is why they are here and
// not in report.js. Each reads the function that places the thing: a check
// that copies the layout goes red the next time the layout is right.
window.__barAt = barSpot;
window.__siteBox = siteBox;
window.__pileMarkAt = pileMarkAt;
window.__dialRect = dialRect;

window.__state = () => ({
  ...snapshot(),
  hushed: document.getElementById('panel').classList.contains('hushed'),
  // Read out of the DOM, and only while the sheet is out: the rows are built
  // once and kept, so a folded-away list still has every name in it.
  crewRows: [...document.querySelectorAll('#modal:not([hidden]) #modalcrew:not([hidden]) [data-key^="who"]')]
              .map(r => r.textContent),
  // and the two rows on the board itself: what you can put up, and the way in
  houseRow: (r => r && r.textContent)(document.querySelector('#crewshop [data-key="house"]')),
  crewDoor: (r => r && r.textContent)(document.querySelector('#crewshop [data-key="crewlist"]'))
});
