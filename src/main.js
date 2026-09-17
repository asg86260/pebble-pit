// Boulder Clicker: the browser shell. What order things happen in each frame,
// and the browser's hooks. The simulation frame itself is game.js.

import './style.css';
import './shelf.css';   // the boards are shelves (DESIGN.md, "The shelf"); the card rules stay for the crew list

// First, so that a throw anywhere below has something listening for it.
import { fatal } from './crash.js';
import { S } from './state.js';
import { step, settleIntoWorld } from './game.js';

import { openingCamX, resize, clampCam, measureSafeArea } from './world.js';
import { syncWorkers } from './crew.js';
import { draw, asPicture } from './render.js';
import { hud, remeasure } from './board.js';
import { fillQueue } from './queue.js';
import { buildShop, fillPin } from './shop.js';
import { persist, restore, claimSave, reset } from './persist.js';
import { crew as hire, fast } from './hooks.js';
import { reducedMotion } from './prefs.js';
import { TITLE_COLUMN, DEMO_HEAD_START_S } from './config.js';
import { fadeIn, fadeOut } from './fade.js';
import { refreshHop } from './hop.js';                     // and the two arrows in its mid sky
import { refreshFullscreen } from './fullscreen.js';        // and the whole screen, where there is one to be had
import { refreshGear, refreshHeldSeat } from './gear.js';    // and the way to the settings on a phone

// The veil comes off one frame after the first, so the frame is painted under
// it before it starts to go.
const veil = document.getElementById('veil');
function unveil() {
  requestAnimationFrame(() => veil.classList.remove('up'));
}
// motion: less is a class on the body, so every fade in style.css can be
// nought in one rule; settings.js toggles it again when the switch is pressed.
document.body.classList.toggle('still', reducedMotion());

import { OWNER_KEY, TAB, primeStore } from './save.js';
import { hold, stepKeyPan } from './input.js';   // the mouse, the wheel and the keyboard -- and the hold the boot stops on
import './settings.js';              // the held sheet's shelf
import { syncEnding } from './ending.js';   // the sheet at the end of the story
import { stepToast } from './toast.js';    // a notice said out loud as it lands
import { stepSkipHint } from './skiphint.js';   // the hint under a scene, and its bar
import { tick } from './clock.js';

// The layout is the game's; the measuring is the page's; this is the one line
// where the two meet.
export function relayout() { measureSafeArea(); resize(settleIntoWorld); remeasure(); }

// What the frame spent, in its three parts (the yard thinks, the yard is
// drawn, the page is written), under `vite dev` only: `import.meta.env.DEV`
// is a build-time constant, so a build folds `mark` into a function that
// returns nought.
const DEV = import.meta.env.DEV;
const mark = DEV ? () => performance.now() : () => 0;
export const beat = { step: 0, draw: 0, hud: 0, frame: 0,
                      worst: 0, worstOf: '-', since: 0 };
// Eased a tenth a frame. The worst is kept flat rather than averaged (an
// average of a hitch is not a hitch) and cleared every few seconds.
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

// Held, the yard is still drawn. A frame that throws is the last frame: the
// loop is not rescheduled and the yard is marked fatal so nothing writes the
// state that threw over the save (crash.js).
const heldSheet = document.getElementById('held');
const scrim = document.getElementById('scrim');
function frame() {
  try {
    tick(S.paused);
    // the sheet and its wash, kept in step with the flag as fades
    (S.paused ? fadeIn : fadeOut)(heldSheet);
    (S.paused ? fadeIn : fadeOut)(scrim);
    syncEnding();
    stepKeyPan();                             // the arrows, held: a held yard pans too
    const t0 = mark();
    if (!S.paused && !(demo && reducedMotion())) step();
    // The boards, once, for whatever the step changed on them: a core landing,
    // a first drag, a hand settled. The sim raises the flag and nothing else;
    // the draw below reads boards that are already right.
    if (S.shopStale) { S.shopStale = false; buildShop(); }
    const t1 = mark();
    draw();
    const t2 = mark();
    hud();
    refreshHop();
    refreshFullscreen();
    refreshGear();
    refreshHeldSeat();
    fillQueue();
    fillPin();
    stepToast();
    stepSkipHint();
    const t3 = mark();
    if (DEV) record(t0, t1, t2, t3);
  } catch (e) {
    fatal(e);
    return;
  }
  requestAnimationFrame(frame);
}


// Boot, in this order: the world is laid out first, because everything below
// stands in it (the ground's sand is allocated here). Then the save, then the
// shop rows it decides, then anybody the counts say is missing.
relayout();
// The store is read once and answered from memory after (`primeStore`):
// IndexedDB answers in its own time and the yard reads the store as if it
// did not.
await primeStore();
// Asked to be kept: a browser short of disk evicts the storage of origins
// nobody asked it to keep, least recently used first. The answer changes
// nothing here.
try { navigator.storage?.persist?.(); } catch {}
// The landing page's picture (DESIGN.md, "The landing page"): this same page
// inside the title's frame, standing a staged yard nobody owns. Staged means
// never written down: no slot is read, cleared or claimed.
const params = new URLSearchParams(location.search);
const demo = params.has('demo');
// The scene bench's frame (scenes.html): the player's own yard, stood but never
// written. Staged from boot, so nothing here writes the slot, clears it or
// puts this page's name beside it -- a bench that claimed the save would make
// the game in the next tab stand aside and reload. Dev only, like the scenes
// themselves: a build folds this to false and drops every branch under it.
const bench = import.meta.env.DEV && params.has('bench');
if (demo) {
  document.body.classList.add('demo');
  veil.remove();
  asPicture(true);
  S.staged = true;
  reset(false);
  hire(3, 2);
  fast(DEMO_HEAD_START_S);
  // The opening view, pushed right by the menu column's width so the column
  // stands over empty ground.
  S.camX = openingCamX() - TITLE_COLUMN;
  clampCam();
} else {
  restore();
  buildShop();
  syncWorkers();
  // The save that would not read has been put aside and the one before it is
  // standing: the game opens held, with the sheet saying so.
  if (S.fellBack) hold(true);
  // Where you left the view, or on the rock. `clampCam` makes a remembered
  // spot safe on a window or a world that has since changed size.
  S.camX = S.camWas ?? openingCamX();
  clampCam();
  if (bench) S.staged = true;
}
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
// Two tabs on one save: this page names itself as the writer; a page that
// sees the name change under it has been overtaken, stops writing (`persist`
// yields), and reloads when next looked at, which is the moment it would
// otherwise have written an hour-old yard over the hour just played.
if (!demo && !bench) claimSave();
addEventListener('storage', e => { if (!demo && !bench && e.key === OWNER_KEY() && e.newValue && e.newValue !== TAB) S.yielded = true; });
document.addEventListener('visibilitychange', () => {
  if (S.yielded && document.visibilityState === 'visible') location.reload();
});

// A build-time constant, so a build drops these imports and everything under
// them.
if (import.meta.env.DEV) {
  import('./dev.js');
  import('./console.js');
  import('./scenesheet.js');
}

requestAnimationFrame(frame);
if (!demo) unveil();
