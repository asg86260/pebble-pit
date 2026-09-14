// Boulder Clicker.
//
// This file is the wiring: it decides what order things happen in each frame and
// hands the browser its hooks. Everything else lives in its own module -- see
// state.js for what changes, config.js for every number, and world.js for where
// things stand.

import './style.css';

// First, so that a throw anywhere below has something listening for it.
import { fatal } from './crash.js';
import { S } from './state.js';
// The game itself. This file is the shell around it: a window, a canvas, a
// mouse and a frame loop -- see game.js.
import { step, settleIntoWorld } from './game.js';
import { at } from './grid.js';
import { openingCamX, resize, clampCam } from './world.js';
import { syncWorkers } from './crew.js';
import { draw } from './render.js';
import { hud, remeasure } from './board.js';
import { fillQueue } from './queue.js';
import { buildShop } from './shop.js';
import { persist, restore, claimSave } from './persist.js';
import { OWNER_KEY, TAB } from './save.js';
import { hold } from './input.js';   // the mouse, the wheel and the keyboard -- and the hold the boot stops on
import './settings.js';              // wave-release, track A: the held sheet's shelf
import { syncEnding } from './ending.js';   // the sheet at the end of the story
import { stepToast } from './toast.js';    // a notice said out loud as it lands
import { tick } from './clock.js';

// The window changed size: lay the world out again, and measure the board that
// is standing in it. The layout is the game's; the measuring is the page's, and
// this is the one line where the two of them meet.
export function relayout() { resize(settleIntoWorld); remeasure(); }

// What the frame spent, under `vite dev` and nowhere else.
//
// A dropped frame is nearly impossible to argue about from the outside: the rate
// falls, everything is a suspect, and every guess costs an afternoon of building
// scenes that turn out not to be the one the player was looking at. There are
// only three things in a frame -- the yard thinks, the yard is drawn, the page
// is written -- so the frame says which of the three it was and there is nothing
// left to guess.
//
// `import.meta.env.DEV` is a constant at build time, so a build folds `mark`
// into a function that returns nought and drops the rest: a player pays four
// calls that do nothing, and the panel is not there to read them anyway.
const DEV = import.meta.env.DEV;
const mark = DEV ? () => performance.now() : () => 0;
export const beat = { step: 0, draw: 0, hud: 0, frame: 0,
                      worst: 0, worstOf: '-', since: 0 };
// A tenth each frame, so the numbers settle enough to read but still move when
// the yard does. The worst is kept flat rather than averaged -- an average of a
// hitch is not a hitch -- and cleared every few seconds so it is the worst of
// what is happening now rather than the worst since the tab opened.
function record(t0, t1, t2, t3) {
  const step = t1 - t0, draw = t2 - t1, hud = t3 - t2, all = t3 - t0;
  beat.step += (step - beat.step) * 0.1;
  beat.draw += (draw - beat.draw) * 0.1;
  beat.hud += (hud - beat.hud) * 0.1;
  beat.frame += (all - beat.frame) * 0.1;
  if (t3 - beat.since > 5000) { beat.worst = 0; beat.worstOf = '-'; beat.since = t3; }
  if (all > beat.worst) {
    beat.worst = all;
    beat.worstOf = step >= draw && step >= hud ? 'step'
                 : draw >= hud ? 'draw' : 'hud';
  }
}

// Held, the yard is still drawn -- it is the thing you are looking at, and a
// paused game that stopped painting would be a game that had crashed.
//
// And a frame that throws is the last frame: the loop is not rescheduled, so
// the picture stays where it stopped, and the yard is marked fatal so nothing
// below writes the state that threw over the save. See crash.js.
const heldSheet = document.getElementById('held');
function frame() {
  try {
    tick(S.paused);
    if (heldSheet.hidden === S.paused) heldSheet.hidden = !S.paused;
    syncEnding();
    const t0 = mark();
    if (!S.paused) step();
    const t1 = mark();
    draw();
    const t2 = mark();
    hud();
    fillQueue();
    stepToast();
    const t3 = mark();
    if (DEV) record(t0, t1, t2, t3);
  } catch (e) {
    fatal(e);
    return;
  }
  requestAnimationFrame(frame);
}


// Boot, in this order and no other: the world is laid out first, because
// everything below stands in it -- the ground's own plot of sand is allocated
// here, and a frame that runs before it has nothing to fall through. Then the
// save, then the shop rows it decides, then anybody the counts say is missing.
relayout();
restore();
buildShop();
syncWorkers();
// The title page (DESIGN.md, "Save slots and the title page"): the game
// opens held, on the sheet's title front, with the yard standing still
// behind it as the picture. `play` lets it go. What the store has to say on
// boot -- the desk's fallback, a save from a newer build -- is said here,
// where the boot now stops. A first visit's intro is on the yard's clock and
// waits under the hold with everything else.
hold(true, 'title');

// Where the view opens: where you left it, or -- on a game that has never been
// played, or a save from before the view was written down -- on the rock.
// `clampCam` is what makes a remembered spot safe on a window that has changed
// size or a world that has since grown or shrunk.
S.camX = S.camWas ?? openingCamX();
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
// Two tabs on one save (wave-critics, A10). This page names itself as the
// writer; a page that sees the name change under it has been overtaken by
// another tab and stops writing (`persist` yields), and when it is next looked
// at it reloads -- the store is the yard now, and this page's is the stale
// one. The user switching back is the moment it would otherwise have written
// an hour-old yard over the hour just played.
claimSave();
addEventListener('storage', e => { if (e.key === OWNER_KEY() && e.newValue && e.newValue !== TAB) S.yielded = true; });
document.addEventListener('visibilitychange', () => {
  if (S.yielded && document.visibilityState === 'visible') location.reload();
});

// The dev panel and the console handles, and only when this is being run with
// `bun run dev`. The condition is a constant at build time, so a build drops
// both imports and everything under them -- the handles, the checks, the whole
// of the suite -- and there is no way for any of it to reach a player.
if (import.meta.env.DEV) {
  import('./dev.js');
  import('./console.js');
  import('./scenesheet.js');
}

requestAnimationFrame(frame);
