// Boulder Clicker.
//
// This file is the wiring: it decides what order things happen in each frame and
// hands the browser its hooks. Everything else lives in its own module -- see
// state.js for what changes, config.js for every number, and world.js for where
// things stand.

import './style.css';

import { S } from './state.js';
// The game itself. This file is the shell around it: a window, a canvas, a
// mouse and a frame loop -- see game.js.
import { step, settleIntoWorld } from './game.js';
import { at } from './grid.js';
import { openingCamX, resize, clampCam } from './world.js';
import { syncWorkers } from './crew.js';
import { draw } from './render.js';
import { hud, remeasure } from './board.js';
import { buildShop } from './shop.js';
import { persist, restore } from './persist.js';
import './input.js';           // the mouse, the wheel and the keyboard
import { tick } from './clock.js';

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

// The dev panel and the console handles, and only when this is being run with
// `bun run dev`. The condition is a constant at build time, so a build drops
// both imports and everything under them -- the handles, the checks, the whole
// of the suite -- and there is no way for any of it to reach a player.
if (import.meta.env.DEV) {
  import('./dev.js');
  import('./console.js');
}

requestAnimationFrame(frame);
