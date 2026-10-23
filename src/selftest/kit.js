// What every group in the browser suite is built out of: the seed it starts
// from, the way it turns the game's clock, the pointer, and the little walks to
// a station or a board that a check makes on the way to what it is checking.
//
// The subjects live beside this file, one per file, and src/selftest.js is
// the index that puts them in order and runs them.

import { S } from '../state.js';
import { claimSave } from '../persist.js';
import { until as untilEvery } from '../check.js';
import { openBoard, inSafeZone } from '../board.js';

// Real wall time, and the only thing in the suite that costs any. Kept for
// the few checks where wall time is the thing checked (a hold, a gap between
// presses); everything else waits on the fact it needs (`until`, `quiet`),
// and test/sleeps.test.mjs counts what is left.
let SLEPT = 0, SLEEPS = 0, STEPPED = 0, FRAMES = 0, RUNS = 0;
export const sleep = ms => { SLEPT += ms; SLEEPS++; return new Promise(r => setTimeout(r, ms)); };

// The seed every group starts from: the node tier's number, so a group that
// moves between the two tiers keeps its yard. This tier cannot be exact (the
// page draws real frames the whole time); what the seed buys is that every
// run starts in the same place, the same chance and, because `__seed`
// restarts the clock, the same point in the wind's swing.
export const SEED = 20250830;

// A group's starting yard. `__seed` rather than `__reset` because seeding and
// clearing are one act (`seedGame` in hooks.js): a seed handed to a yard
// already standing is a run that is half one seed and half another. And the
// view where the page opens it: `__seed` leaves the camera at nought, the far
// end of the world, and four groups look through the camera. And the page
// owns its save again: a group that played the game in a frame (the language
// tab) leaves that frame's name on the slot, this page stands aside and stops
// writing, and a group after it that reads the save back (the feedback
// form's tick) finds the slot as the seed cleared it.
export const newRun = () => {
  claimSave();
  S.yielded = false;
  window.__seed(SEED);
  window.__verify(true);
  window.__look(window.__state().openCamX);
};

// A frame of the page, or a fiftieth of a second, whichever comes first. The
// frame is what is wanted (a board seats itself in the frame loop, and a
// style written this moment is not laid out until the next frame); the timer
// is there because a headless browser stops painting when it decides nobody
// is looking, and a check waiting on that frame hangs the suite.
export const raf = () => new Promise(r => {
  let done = false;
  const go = () => { if (!done) { done = true; r(); } };
  requestAnimationFrame(go);
  setTimeout(go, 50);
});

// Waits for `fact()` a drawn frame at a time, the game turning a frame with
// each, up to `frames`: true when it came. What a sleep should have been.
export const until = (fact, frames = 120) => untilEvery(fact, async () => { run(1 / 60); await raf(); }, frames);
// `n` frames of the yard and the page together, for a gesture that is made
// over frames (a drag's moves, one a frame, as a hand's arrive) or a check
// that nothing happens in the frames after a press.
export const frames = async (n = 1) => { for (let i = 0; i < n; i++) { run(1 / 60); await raf(); } };
// Until nothing on the page is animating: a board sliding, a fade, a tag
// easing in. Read mid-animation, a word is pale and a box is half its size.
// An endless animation (a hovered tile's sway) never finishes, so it is not
// waited for. `on`, the elements whose animations are the ones waited for
// (and everything inside them): a toast's ring somewhere else on the glass
// is no reason a board is not seated.
const moving = a => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity;
export const quiet = (frames = 180, on = [document]) =>
  until(() => !on.some(el => el && (el === document ? el.getAnimations() : el.getAnimations({ subtree: true })).some(moving)), frames);
// Waits drawn frames for `fact()`, the yard held where it is: for what is the
// page's own (a board fading up, a list dropping open, a fill sliding), where
// turning the yard under it, as `until` does, would change the purse or the
// crew a check is about to read. True when the fact came.
export const onPage = (fact, frames = 180) => untilEvery(fact, raf, frames);
// Nothing inside `within` in the middle of a move, the yard held: only what is
// being read is waited for, and an endless sway is not a move still going.
export const landed = (within = panel()) => onPage(() => !within.getAnimations({ subtree: true }).some(moving));
// the board and the tip beside it: what a walk to a station puts up
const boardAndTip = () => [panel(), document.getElementById('tip')];

// The board the pointer just asked for, come to rest: `open` is put on it the
// frame after it is asked for (board.js, `settle`), and its fade and slide
// run from there. With no board up there is nothing to seat, only the tip's
// fade to wait out.
export async function seated() {
  if (openBoard()) await until(() => panel().classList.contains('open'), 30);
  return quiet(180, boardAndTip());
}

// The yard and the page, both brought up to date. The seconds are game seconds
// and cost nothing; the frames are real and cost two of them.
export async function settle(seconds = 0.4) {
  if (seconds > 0) run(seconds);
  await raf();
  await raf();
}
// The story's card come to rest selling `key` in `mode` (objbarrier.js), or
// false after `ms`. Its strike and its fades are the page's, on the wall
// clock, so this waits on frames rather than turning the game: the yard is
// not what is being waited for.
export async function cardShows(key, mode, ms = 4000) {
  const t0 = performance.now();
  const card = document.getElementById('objective');
  const at = () => { const b = card?.querySelector('.barrier');
    return !!b && !card.hidden && !card.classList.contains('going') && !b.hidden && !b.classList.contains('swap')
      && b.dataset.key === key && b.dataset.mode === mode; };
  while (!at() && performance.now() - t0 < ms) await raf();
  // and long enough for the fade in to finish, so a press lands on a button
  // the pointer can see
  const t1 = performance.now();
  while (performance.now() - t1 < 400) await raf();
  return at();
}

let STATED = 0, STATES = 0;
export const state = () => { const t = performance.now(); const v = window.__state(); STATED += performance.now() - t; STATES++; return v; };
export { fmt } from '../words.js';   // the very function the boards write with, so the two cannot drift
// the boards are rebuilt when the game changes; a check that changes it by hand
// has to ask for the same
export const buildShopFromTest = () => window.__build();
// and with the words and prices written into them, for a check reading a row it
// never walked up to
export const refreshShopFromTest = () => window.__fill();

export { ok } from '../check.js';

export const P = 6;                                   // a cell, for the piles
export const canvas = () => document.getElementById('c');
export const board = () => document.getElementById('board');
export const panel = () => document.getElementById('panel');
export const shop = () => document.getElementById('shop');

export const point = (type, x, y, buttons = 1, button = 0) =>
  canvas().dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: y, pointerId: 1, isPrimary: true, button,
    buttons: type === 'pointerup' ? 0 : buttons, bubbles: true
  }));

// world position -> where it is on screen right now
export function onScreen(wx, wy) {
  const s = state();
  return [(wx - s.camX) * s.zoom, (wy - s.camY) * s.zoom];
}

// the game reports where it put things, so the tests never hold a copy of the layout
export const benchWorld = () => {
  const s = state();
  return { x: s.benchX, y: s.groundY };
};

export const boulderWorld = () => {
  const s = state();
  return { x: s.rockX, y: s.rockY };
};

// The call to build the bench, pressed the way a player does: click what is
// actually under the middle of the button, so a check cannot pass on a button
// that is off the window or behind something else. Returns what it found.
export const raiseEl = () => document.getElementById('raise');

export async function pressRaise() {
  const el = raiseEl();
  // The button is seated by `seatCall` in `hud()`, so it is not on the page
  // until a frame has been drawn since the call went out. Without this wait
  // the rect is all noughts and the click lands on bare sky.
  for (let i = 0; i < 10 && el.hidden; i++) await raf();
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(Math.round(r.left + r.width / 2),
                                        Math.round(r.top + r.height / 2));
  if (hit) hit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return hit;
}

// The bench is not in the yard until the first upgrade is affordable AND
// somebody has built it, so a check that wants to open it has to earn it and
// then put it up (raise.js).
export async function haveBench() {
  if (state().seenBench) return;
  window.__give(100);
  await until(() => state().benchCall, 75);
  await pressRaise();
  runUntil(() => state().seenBench, 90);
}

export async function hoverBench() {
  await haveBench();
  const b = benchWorld();
  const [x, y] = onScreen(b.x + 20, b.y - 30);
  point('pointermove', x, y, 0);
  await seated();
}

// Standing at a station. Where that is comes from the game: a check that did
// its own arithmetic on a building's rectangle would go on passing after the
// rectangle stopped being the thing you stand at.
export async function hoverStation(which, look = true) {
  const r = state().stands[which];
  if (!r) return null;
  // Every station's stand is an ordinary rectangle, so the middle of the
  // thing is the thing everywhere.
  const wx = r.x + r.w / 2, wy = r.y + r.h / 2;
  // the camera is placed at once; a frame lets the scroller follow it
  if (look) { window.__look(wx - 400); await raf(); await raf(); }
  const [x, y] = onScreen(wx, wy);
  point('pointermove', x, y, 0);
  await seated();
  return { x, y };
}

export const hoverHouse = () => hoverStation('house');

// The crew list is a window (modal.js), opened by pressing the door. Back
// when the window is up and its fade in is done, so a rectangle read after
// is the one the player sees.
export async function openCrewList() {
  const door = document.querySelector('#crewshop button[data-key="crewlist"]');
  if (!door) return null;
  door.click();
  // `S.modal` is set on the press and the window shown on the frame after,
  // with its fade starting there
  const win = document.getElementById('modal');
  await until(() => S.modal === 'crew' && !win.hidden, 30);
  await quiet(180, [win, document.getElementById('modalwash')]);
  return door;
}

// the cursor standing at no station at all, so the board closes: after the
// linger and the fade (board.js, `showPanel`), unless the corner is in the
// board's own wedge, where it holds itself up
export async function hoverAway() {
  point('pointermove', 4, 4, 0);
  if (openBoard() && !inSafeZone(4, 4)) await until(() => !openBoard() && panel().hidden, 30);
  await quiet(180, boardAndTip());
}

// Run the yard forward without waiting for it: `__fast(20)` is twenty seconds
// of game in a few milliseconds, and the same twenty seconds every time. A
// check that sleeps and hopes passes on a fast machine and fails on a slow
// one.
export const run = (seconds) => {
  const t = performance.now();
  const f = window.__fast(seconds);
  STEPPED += performance.now() - t; FRAMES += f; RUNS++;
  return f;
};

// Run until something is true, a second of game at a time. The limit is in
// game seconds, so it is a fact about the game rather than about the machine.
export function runUntil(done, limit = 60) {
  for (let i = 0; i < limit; i++) {
    run(1);
    if (done()) return true;
  }
  return false;
}

// The crew take five when a rock is finished and the next one comes down after
// them, so a check that wants a rock has to wait for one.
export function haveRock() {
  return runUntil(() => {
    const s = state();
    return s.rock > 0 && !s.rockFall && !s.dancing;
  }, 30);
}

// A roster: click the less or the more under the station itself, through the
// real pointer path rather than calling assign() behind the yard's back.
export const put = async (key, which) => {
  const p = state().roster.find(r => r.key === key);
  if (!p || p.fixed) return false;
  const was = state()[p.job];
  const [x, y] = onScreen(...p[which]);
  point('pointerdown', x, y);
  point('pointerup', x, y);
  await until(() => state()[p.job] !== was, 10);
  await raf();
  return state()[p.job] !== was;
};

export const buy = async key => {
  const b = shop().querySelector(`button[data-key="${key}"]`);
  if (!b || b.disabled) return false;
  b.click();
  // Everything past the press is built (works.js). This tier is about the
  // page, not the yard, so the work is finished on the spot rather than
  // staffed and waited for.
  window.__finish();
  // and the boards rebuilt for it, by the frame loop (main.js)
  await until(() => !S.shopStale, 30);
  await raf();
  return true;
};


// pretend to be a particular screen for the length of one check
export async function asScreen(w, h, dpr, fn) {
  // devicePixelRatio is the window's own property, so deleting it would take it
  // away for good: put the description back exactly as it was found
  const el = document.documentElement;
  const was = [
    [window, 'devicePixelRatio', Object.getOwnPropertyDescriptor(window, 'devicePixelRatio')],
    [el, 'clientWidth', Object.getOwnPropertyDescriptor(el, 'clientWidth')],
    [el, 'clientHeight', Object.getOwnPropertyDescriptor(el, 'clientHeight')]
  ];
  const set = (o, k, v) => Object.defineProperty(o, k, { value: v, configurable: true });
  set(window, 'devicePixelRatio', dpr);
  set(el, 'clientWidth', w);
  set(el, 'clientHeight', h);
  dispatchEvent(new Event('resize'));
  // the resize is laid out at once (main.js, `relayout`); a frame draws it
  await raf();
  try {
    return await fn();
  } finally {
    for (const [o, k, d] of was) {
      if (d) Object.defineProperty(o, k, d); else delete o[k];
    }
    dispatchEvent(new Event('resize'));
    await raf();
  }
}

// a finger rather than a mouse
export const finger = (type, id, x, y) =>
  canvas().dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: y, pointerId: id, isPrimary: id === 1, pointerType: 'touch',
    buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true
  }));

// The touch itself, as the platform raises it before it decides whether to
// scroll: a `touchstart` on `el` at a spot. Answers whether the page said no
// (`preventDefault`), which is the whole of what the game decides about a
// touch (input.js, the `touchstart` gate). A synthetic touch cannot make the
// platform scroll -- only a real finger does that -- so what a check reads
// here is the decision, and the coast is the platform's to keep.
export function touch(type, el, x, y, id = 1) {
  const t = new Touch({ identifier: id, target: el, clientX: x, clientY: y });
  const e = new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t],
                                   targetTouches: type === 'touchend' ? [] : [t],
                                   bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  return e.defaultPrevented;
}

// A tap, as a finger makes one: the pointer events a touch raises, down and
// up on the same spot, with the browser's `click` after them -- since a row
// buys on the click the tap gate lets through (tap.js). `hold` ms between,
// for a check about a long press; `move` px sideways before the release,
// for one about the slop.
export async function tap(el, { hold = 30, move = 0 } = {}) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const ev = (type, dx = 0, buttons = 1) => el.dispatchEvent(new PointerEvent(type, {
    clientX: x + dx, clientY: y, pointerId: 7, isPrimary: true, pointerType: 'touch',
    button: 0, buttons, bubbles: true, cancelable: true }));
  touch('touchstart', el, x, y, 7);
  ev('pointerdown');
  if (move) ev('pointermove', move);
  await sleep(hold);                  // wall time: how long the finger is down is what a hold check is about
  ev('pointerup', move, 0);
  touch('touchend', el, x + move, y, 7);
  // The platform raises no click for a press that moved: it was a scroll.
  if (!move) el.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true, cancelable: true }));
}

// the quarry and the plots, opened without paying for them
export function S_open() {
  window.__crew(0, 0, 1, 1);      // opens both places
  window.__crew(0, 0);
  window.__levels({ benchLevel: 0, plotLevel: 0 });
}

// The suite's own bill, for the summary runTests prints.
export const cost = () => ({
  sleptMs: Math.round(SLEPT), sleeps: SLEEPS,
  steppedMs: Math.round(STEPPED), frames: FRAMES, runs: RUNS,
  statedMs: Math.round(STATED), states: STATES
});
