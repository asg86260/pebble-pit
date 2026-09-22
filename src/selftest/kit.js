// What every group in the browser suite is built out of: the seed it starts
// from, the way it turns the game's clock, the pointer, and the little walks to
// a station or a board that a check makes on the way to what it is checking.
//
// The subjects live beside this file, one per file, and src/selftest.js is
// the index that puts them in order and runs them.

// Real wall time, and the only thing in the suite that costs any. Dust in
// flight, the counter tween, the board sliding and the save's debounce are
// all hung off real frames, and a check that reads them early reads them
// mid-animation.
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
// end of the world, and four groups look through the camera.
export const newRun = () => {
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

// The yard and the page, both brought up to date. The seconds are game seconds
// and cost nothing; the frames are real and cost two of them.
export async function settle(seconds = 0.4) {
  if (seconds > 0) run(seconds);
  await raf();
  await raf();
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

export function ok(cond, what, detail = '') {
  if (cond) return { pass: true, what };
  return { pass: false, what, detail };
}

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
  for (let i = 0; i < 30 && !state().benchCall; i++) await sleep(40);
  await pressRaise();
  runUntil(() => state().seenBench, 90);
}

export async function hoverBench() {
  await haveBench();
  const b = benchWorld();
  const [x, y] = onScreen(b.x + 20, b.y - 30);
  point('pointermove', x, y, 0);
  await sleep(250);
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
  if (look) { window.__look(wx - 400); await sleep(120); }
  const [x, y] = onScreen(wx, wy);
  point('pointermove', x, y, 0);
  await sleep(250);
  return { x, y };
}

export const hoverHouse = () => hoverStation('house');

// The crew is a submenu: the names come out beside the board when the cursor
// reaches that row. Two frames, because opening it measures and re-seats the
// panel and a rectangle read before that is the one the board had without it.
// The crew list is a window (modal.js), opened by pressing the door.
export async function openCrewList() {
  const door = document.querySelector('#crewshop button[data-key="crewlist"]');
  if (!door) return null;
  door.click();
  await raf();
  await raf();
  return door;
}

// the cursor standing at no station at all, so the board closes
export async function hoverAway() {
  point('pointermove', 4, 4, 0);
  await sleep(250);
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

// bank one core the long way round: finish the rock, wait for the core to roll
// clear of it, carry it, throw it in
export async function bankCore() {
  // The first four rocks have no core (CORE_FROM), so this works the rock
  // that has the first of them, and puts the yard back on the rock it found
  // afterward: rock five is a good deal bigger than rock one.
  const wasRock = state().boulderNo;
  const jumped = wasRock < 5;
  if (jumped) window.__jump(5);
  window.__next();                             // the last of the rock goes
  // Turned by hand rather than waited out: the core rolls clear on the game's
  // own clock.
  runUntil(() => state().coreItem?.rest, 10);
  const k = state().coreItem;
  if (!k) return false;

  const [kx, ky] = onScreen(k.x + 9, k.y + 9);
  point('pointerdown', kx, ky);
  run(0.1);
  const s = state();
  const [tx, ty] = onScreen(s.pitX + s.pitW * 0.2, s.groundY - 120);
  for (let i = 1; i <= 8; i++) {
    point('pointermove', kx + (tx - kx) * i / 8, ky + (ty - ky) * i / 8);
    run(1 / 60);
  }
  run(0.2);
  point('pointerup', tx, ty);
  const done = runUntil(() => !state().coreItem && !state().heldCore, 20);
  if (jumped) window.__jump(wasRock);          // and the yard back on the rock it was on
  haveRock();
  return done;
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
  await sleep(150);
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
  await sleep(150);
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
  await sleep(80);
  try {
    return await fn();
  } finally {
    for (const [o, k, d] of was) {
      if (d) Object.defineProperty(o, k, d); else delete o[k];
    }
    dispatchEvent(new Event('resize'));
    await sleep(80);
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
  await sleep(hold);
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
