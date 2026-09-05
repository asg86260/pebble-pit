// What every group in the browser suite is built out of: the seed it starts
// from, the way it turns the game's clock, the pointer, and the little walks to
// a station or a board that a check makes on the way to what it is checking.
//
// The subjects live beside this file -- one per file -- and src/selftest.js is
// the index that puts them in order and runs them.

// Real wall time, and the only thing in the suite that costs any. It is not
// waste: `run()` drives the game, but dust in flight, the counter tween, the
// board sliding and the save's debounce are all hung off real frames, and a
// check that reads them early reads them mid-animation. Capping these was tried
// and cost ten checks. What is worth cutting is simulated frames, below.
let SLEPT = 0, SLEEPS = 0, STEPPED = 0, FRAMES = 0, RUNS = 0;
export const sleep = ms => { SLEPT += ms; SLEEPS++; return new Promise(r => setTimeout(r, ms)); };

// The seed every group in this suite starts from.
//
// It is the same idea as SEED in test/helpers.mjs, and for the same reason: the
// yard's chance comes out of one generator (src/rng.js), which seeds itself from
// the clock and the platform's entropy on load, so a check that ran a busy yard
// and then measured it was measuring a different yard every run. Up here that
// showed itself as one check -- the wind group -- that failed on a busy machine
// and passed on the next go, which is the kind of failure nobody can bisect and
// everybody learns to re-run.
//
// So every group starts from a number instead. There is nothing special about
// the number; it is only a name for a run, and it is the node tier's number so
// that a group that moves between the two tiers keeps its yard.
//
// This tier cannot be as exact as the node one and does not pretend to be: the
// page is drawing real frames of its own the whole time, and a check that sleeps
// for a board to slide has let some unknown number of them go by. What the seed
// buys here is that every run starts in the same place -- the same chance and,
// because `__seed` restarts the clock too, the same point in the wind's swing --
// rather than somewhere new each time.
export const SEED = 20250830;

// A group's starting yard: the seed, and then the rules watched for the whole of
// it. Both are properties of the run rather than of what the run is about, so
// no group has to remember to ask for either.
//
// It is `__seed` rather than `__reset` because seeding and clearing are one act
// (see `seedGame` in hooks.js): a seed handed to a yard that is already standing
// gives a run that is half one seed and half another and cannot be had again.
//
// And the view where the page opens it. `__seed` puts every field of the game
// back to what state.js declares, camera included, which leaves it at nought --
// the far left-hand end of the world, with the rock three thousand pixels off
// the right of the window. The game is right to do that and the node tier never
// notices, because nothing there looks through a camera. A page does: the last
// line of main.js's boot opens the view on the rock, and a suite that resets the
// game without it is a suite checking what four of its groups can see from the
// wrong end of the yard.
export const newRun = () => {
  window.__seed(SEED);
  window.__verify(true);
  window.__look(window.__state().openCamX);
};

// A frame of the page, rather than a stretch of the wall clock.
//
// Waiting for the browser is not the same as waiting for the game. The game's
// own clock is turned by hand here -- see `run` -- but the page has its own
// business: a board seats itself in the frame loop, and a style written this
// moment is not laid out until the next frame. Two frames is all any of that
// takes, and two frames is about thirty milliseconds rather than the quarter of
// a second a check used to sleep for on the off-chance.
// A frame, or a fiftieth of a second, whichever comes first. The frame is what
// is actually wanted; the timer is there because a headless browser stops
// painting when it decides nobody is looking, and a check waiting on a frame
// that will never come is a suite that hangs three minutes in with no output.
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
export { fmt } from '../board.js';   // the very function the boards write with, so the two cannot drift
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

// The bench is not in the yard until the first upgrade is affordable, so a check
// that wants to open it has to earn it first.
export async function haveBench() {
  if (state().seenBench) return;
  window.__give(100);
  for (let i = 0; i < 30 && !state().seenBench; i++) await sleep(40);
}

export async function hoverBench() {
  await haveBench();
  const b = benchWorld();
  const [x, y] = onScreen(b.x + 20, b.y - 30);
  point('pointermove', x, y, 0);
  await sleep(250);
}

// Standing at a station. Where that is comes from the game rather than being
// worked out again here: a check that did its own arithmetic on a building's
// rectangle would go on passing after the rectangle stopped being the thing you
// stand at.
export async function hoverStation(which, look = true) {
  const r = state().stands[which];
  if (!r) return null;
  // Every station's stand is an ordinary rectangle now, the quarry and the
  // farm included -- they stand at their shed rather than at the hole or the
  // plots (see #1, "Wave 3.1" in wave-feedback3.md), so the middle of the
  // thing is the thing everywhere.
  const wx = r.x + r.w / 2, wy = r.y + r.h / 2;
  if (look) { window.__look(wx - 400); await sleep(120); }
  const [x, y] = onScreen(wx, wy);
  point('pointermove', x, y, 0);
  await sleep(250);
  return { x, y };
}

// The block's own, by the name the checks have always called it.
export const hoverHouse = () => hoverStation('house');

// And the last step of the way to the people: the crew is a submenu now, so the
// board is the block and the row that leads to the names, and the names come out
// beside it when the cursor reaches that row. Two frames, because opening it
// measures and re-seats the panel and a rectangle read before that is the one
// the board had without it.
export async function openCrewList() {
  const door = document.querySelector('#crewshop button[data-key="crewlist"]');
  if (!door) return null;
  const r = door.getBoundingClientRect();
  door.dispatchEvent(new PointerEvent('pointerenter',
    { clientX: r.left + 2, clientY: r.top + 2, bubbles: true }));
  await raf();
  await raf();
  return door;
}

// the cursor standing at no station at all, so the board closes
export async function hoverAway() {
  point('pointermove', 4, 4, 0);
  await sleep(250);
}

// bank one core the long way round: finish the rock, wait for the core to roll
// clear of it, carry it, throw it in
// The crew take five when a rock is finished and the next one comes down out of
// the sky after them, so between rocks there is a stretch with nothing to mine.
// A check that wants a rock has to wait for one.
// Run the yard forward without waiting for it: `__fast(20)` is twenty seconds of
// game in a few milliseconds, and the same twenty seconds every time it is run.
// A check that sleeps and hopes passes on a fast machine and fails on a slow
// one; a check that turns the handle a fixed number of times does not.
export const run = (seconds) => {
  const t = performance.now();
  const f = window.__fast(seconds);
  STEPPED += performance.now() - t; FRAMES += f; RUNS++;
  return f;
};

// Run until something is true, a second of game at a time, up to a limit. The
// limit is in game seconds, not real ones, so it is a fact about the game
// rather than about the machine.
export function runUntil(done, limit = 60) {
  for (let i = 0; i < limit; i++) {
    run(1);
    if (done()) return true;
  }
  return false;
}

export function haveRock() {
  return runUntil(() => {
    const s = state();
    return s.rock > 0 && !s.rockFall && !s.dancing;
  }, 30);
}

export async function bankCore() {
  // Not every rock has one: the first four are rock and nothing else, so a check
  // that wants a core works the rock that has the first of them. See CORE_FROM.
  //
  // And it puts the yard back on the rock it found afterwards. Rock five is a
  // good deal bigger than rock one, and a check that quietly left the yard on it
  // hands every check after it a different-sized boulder to reason about.
  const wasRock = state().boulderNo;
  const jumped = wasRock < 5;
  if (jumped) window.__jump(5);
  window.__next();                             // the last of the rock goes
  // Turned by hand rather than waited out. The core rolls clear on the game's
  // own clock, and the game's clock is ours here: six seconds of it costs a few
  // milliseconds, where sitting through six seconds costs six seconds.
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

// A roster: click the less or the more under the station itself. The game
// reports where its buttons are, so this aims at the real control through the
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
  // Everything past the press is built now, the bench's own rows included --
  // see works.js. This tier is about the page, not the yard, so the work is
  // finished on the spot rather than staffed and waited for.
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

// the quarry and the plots, opened without paying for them
export function S_open() {
  window.__crew(0, 0, 1, 1);      // opens both places
  window.__crew(0, 0);
  window.__levels({ benchLevel: 0, plotLevel: 0 });
}

// The suite's own bill, for the summary runTests prints. Real milliseconds
// slept, game frames turned, and the time spent reading the yard out.
export const cost = () => ({
  sleptMs: Math.round(SLEPT), sleeps: SLEEPS,
  steppedMs: Math.round(STEPPED), frames: FRAMES, runs: RUNS,
  statedMs: Math.round(STATED), states: STATES
});
