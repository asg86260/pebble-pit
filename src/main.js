// Boulder Clicker.
//
// This file is the wiring: it decides what order things happen in each frame and
// hands the browser its hooks. Everything else lives in its own module -- see
// state.js for what changes, config.js for every number, and world.js for where
// things stand.

import './style.css';
import './selftest.js';        // adds __test() to the console

import { S, school } from './state.js';
// The game itself. This file is the shell around it: a window, a canvas, a
// mouse and a frame loop -- see game.js.
import { step, settleIntoWorld } from './game.js';
import * as hooks from './hooks.js';
import { snapshot } from './report.js';
import { at } from './grid.js';
import { openingCamX, resize, clampCam } from './world.js';
import { syncWorkers } from './crew.js';
import { draw } from './render.js';
import { hud, remeasure } from './board.js';
import { buildShop } from './shop.js';
import { persist, restore } from './persist.js';
import { assign } from './upgrades.js';
import './input.js';           // the mouse, the wheel and the keyboard
import { tick } from './clock.js';
import { pitTop } from './smog.js';

// The window changed size: lay the world out again, and measure the board that
// is standing in it. The layout is the game's; the measuring is the page's, and
// this is the one line where the two of them meet.
export function relayout() { resize(settleIntoWorld); remeasure(); }

// Held, the yard is still drawn -- it is the thing you are looking at, and a
// paused game that stopped painting would be a game that had crashed.
const heldSheet = document.getElementById('held');
function frame() {
  tick(S.paused);
  if (heldSheet.hidden === S.paused) heldSheet.hidden = !S.paused;
  if (!S.paused) step();
  draw();
  hud();
  requestAnimationFrame(frame);
}


// The dev handles, hung where the checks and the dev panel look for them. The
// hooks themselves live in hooks.js, because the node checks import them
// directly and there is no window there to hang anything on.
Object.assign(window, {
  __clearFloor: hooks.clearFloor, __pile: hooks.pile, __jump: hooks.jump,
  __preview: hooks.preview, __next: hooks.next, __drop: hooks.drop,
  __birds: hooks.birds, __crew: hooks.crew, __school: hooks.school,
  __assign: hooks.assign, __build: hooks.rebuildBoards, __beds: hooks.beds,
  __levels: hooks.levels, __fast: hooks.fast, __air: hooks.setAir,
  __toss: hooks.toss, __take: hooks.takeFromPile, __place: hooks.placeBody,
  __abandon: hooks.abandon, __reset: hooks.newGame, __reload: hooks.reload,
  __lab: hooks.openLab, __research: hooks.finishResearch, __grant: hooks.grant,
  __spend: hooks.spendDust, __pitProfile: hooks.pitProfile, __dig: hooks.dig,
  __tip: hooks.tip, __give: hooks.give,
  __skyX: hooks.skyX, __puffFades: hooks.puffFades, __skyFades: hooks.skyFades,
  __dustSpan: hooks.dustSpan, __skyJoin: hooks.skyJoin, __skyXY: hooks.skyXY,
  __pitTop: hooks.pitTop, __overPit: hooks.overPit, __muckSet: hooks.muckSet,
  __muckOverPit: hooks.muckOverPit, __look: hooks.look
});

// What the checks read. The yard's own account of itself comes from report.js,
// which both suites share; the two lines added here are facts about the page
// rather than about the game, and there is no page in the other suite.
window.__state = () => ({
  ...snapshot(),
  hushed: document.getElementById('panel').classList.contains('hushed'),
  crewRows: [...document.querySelectorAll('#crewshop [data-key]')].map(r => r.textContent)
});

// Boot, in this order and no other: the world is laid out first, because
// everything below stands in it -- the ground's own bed of sand is allocated
// here, and a frame that runs before it has nothing to fall through. Then the
// save, then the shop rows it decides, then anybody the counts say is missing.
relayout();
restore();
buildShop();
syncWorkers();

S.camX = openingCamX();
clampCam();
// the window changing shape, and getting the game written down
addEventListener('resize', relayout);
addEventListener('load', relayout);
visualViewport?.addEventListener('resize', relayout);
setInterval(() => {
  const w = document.documentElement.clientWidth, h = document.documentElement.clientHeight;
  if (w !== S.W || h !== S.H) relayout();        // in case a resize event is missed
}, 500);
document.addEventListener('visibilitychange', persist);
addEventListener('pagehide', persist);
setInterval(persist, 1000);

// The dev panel, and only when this is being run with `bun run dev`. The
// condition is a constant at build time, so a build drops the import and the
// file with it -- there is no way for any of it to reach a player.
if (import.meta.env.DEV) import('./dev.js');

requestAnimationFrame(frame);
