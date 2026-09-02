// The handles, hung on `window` where the checks and the dev panel look for
// them -- and nowhere near a build.
//
// main.js reaches for this behind `import.meta.env.DEV`, the same gate the dev
// panel is behind, so a production build drops this file and everything it
// imports: the hooks, the yard's own account of itself, and the browser suite.
// None of it is code a player has any use for, and it was most of what they
// were being asked to download.
//
// The names are `__` names because they are not an interface. They are a way in
// for a check and for the panel, and the game itself never calls one.

import './selftest.js';        // adds __test() to the console
import * as hooks from './hooks.js';
import { snapshot } from './report.js';
import { seatBoard, boardFit, showPanel } from './board.js';
import { barSpot } from './render.js';
import { siteBox } from './works.js';

// Everything hooks.js offers, under the name the checks call it by.
Object.assign(window, {
  ...hooks.HANDLES,
  __placeBoard: seatBoard, __boardFit: boardFit,
  // dev: open a board without walking to the building and tapping it, for a
  // check or a look at how a sheet lays out
  __board: showPanel
});

// What the checks read. The yard's own account of itself comes from report.js,
// which both suites share; the two lines added here are facts about the page
// rather than about the game, and there is no page in the other suite.
// Where a site's bar hangs and what it hangs over, so a check can ask whether
// the one is clear of the other rather than reading it off a screenshot.
window.__barAt = barSpot;
window.__siteBox = siteBox;

window.__state = () => ({
  ...snapshot(),
  hushed: document.getElementById('panel').classList.contains('hushed'),
  // The people, off the sheet they now live on -- the house board itself is the
  // block and the door through to them, and a check reading the crew wants the
  // crew. Read out of the DOM rather than off the game so that a list which
  // never made it onto the page reads as no list at all.
  // Off the sheet only while the sheet is out: the rows are built once and kept,
  // so a folded-away list still has every name in it, and a check asking what
  // the crew list says would have been told about a list nobody can see.
  crewRows: [...document.querySelectorAll('#crewlist:not([hidden]) [data-key^="who"]')]
              .map(r => r.textContent),
  // and the two rows on the board itself: what you can put up, and the way in
  houseRow: (r => r && r.textContent)(document.querySelector('#crewshop [data-key="house"]')),
  crewDoor: (r => r && r.textContent)(document.querySelector('#crewshop [data-key="crewlist"]'))
});
