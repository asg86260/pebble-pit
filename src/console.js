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

// Everything hooks.js offers, under the name the checks call it by.
Object.assign(window, {
  __clearFloor: hooks.clearFloor, __pile: hooks.pile, __jump: hooks.jump,
  __preview: hooks.preview, __next: hooks.next, __drop: hooks.drop,
  __birds: hooks.birds, __crew: hooks.crew, __school: hooks.school,
  __assign: hooks.assign, __build: hooks.rebuildBoards, __fill: hooks.fillBoard, __tune: hooks.tuneOne, __plots: hooks.plots,
  __levels: hooks.levels, __fast: hooks.fast, __air: hooks.setAir,
  __toss: hooks.toss, __take: hooks.takeFromPile, __place: hooks.placeBody,
  __abandon: hooks.abandon, __reset: hooks.newGame, __reload: hooks.reload,
  __machine: hooks.machineSet, __fullSites: hooks.fullSites,
  __lab: hooks.openLab, __research: hooks.finishResearch, __grant: hooks.grant,
  __spend: hooks.spendDust, __press: hooks.press,
  __upgrades: hooks.upgrades, __buy: hooks.buyRowByKey, __pitProfile: hooks.pitProfile, __dig: hooks.dig,
  __tip: hooks.tip, __give: hooks.give,
  __skyX: hooks.skyX, __puffFades: hooks.puffFades, __skyFades: hooks.skyFades,
  __dustSpan: hooks.dustSpan, __dustOverPit: hooks.dustOverPit, __skyJoin: hooks.skyJoin, __skyXY: hooks.skyXY,
  __pitTop: hooks.pitTop, __overPit: hooks.overPit, __muckSet: hooks.muckSet,
  __meteor: hooks.openMeteor, __wizardHat: hooks.wizardHat,
  __loo: hooks.openLoo,
  __brew: hooks.brewWizard,
  __muckOverPit: hooks.muckOverPit, __look: hooks.look,
  __placeBoard: seatBoard, __boardFit: boardFit,
  // dev: open a board without walking to the building and tapping it, for a
  // check or a look at how a sheet lays out
  __board: showPanel
});

// What the checks read. The yard's own account of itself comes from report.js,
// which both suites share; the two lines added here are facts about the page
// rather than about the game, and there is no page in the other suite.
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
