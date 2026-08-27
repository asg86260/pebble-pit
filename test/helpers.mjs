// What a check needs, and nothing about a browser.
//
// The yard is built once per file -- node runs each test file in its own
// process, so `S` and every module around it are fresh here and cannot be
// reached by anybody else -- and put back to a new game before each group.
//
// The names are the names the browser suite uses: `state()`, `run(seconds)`,
// `runUntil(...)`, `ok(...)`, and the `window.__` handles. A group moved over
// from `src/selftest.js` reads the same as it did there, which is the point:
// what moved is where it runs, not what it says.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newYard } from '../tools/node/yard.mjs';

export const yard = await newYard();

export const state = () => yard.state();
export const run = seconds => yard.fast(seconds);
export const runUntil = (done, limit = 60) => yard.until(done, limit);

// A check: what it is called, and what to say when it is not true. The same
// shape the browser suite uses, so a group carries its words across unchanged.
export const ok = (cond, what, detail = '') => ({ pass: !!cond, what, detail });

// One group of checks, run out of a fresh game. The whole group runs before
// anything is reported, so a group of six failing checks says six things rather
// than the first one and nothing else -- which is what the browser suite does
// and what makes a failure worth reading.
export function group(name, fn) {
  test(name, async () => {
    yard.reset();
    const checks = (await fn()) || [];
    const bad = checks.filter(c => !c.pass);
    assert.equal(bad.length, 0,
      bad.map(c => `${c.what}${c.detail ? ` — ${c.detail}` : ''}`).join('\n  '));
  });
}

// --- the few things a check sets up for itself -------------------------------

// Checks that are about *what* a worker does should not sit through *how long*
// it takes. There are checks of their own for pace and for the length of a walk.
export const quickCrew = () =>
  window.__levels({ haulPaceLevel: 20, haulCarryLevel: 4, quarryPaceLevel: 10, tendLevel: 10 });

export const haveRock = () => runUntil(() => {
  const s = state();
  return s.rock > 0 && !s.rockFall && !s.dancing;
}, 30);

// the quarry and the beds, opened without paying for them
export function openSites() {
  window.__crew(0, 0, 1, 1);      // opens both places
  window.__crew(0, 0);
  window.__levels({ benchLevel: 0, bedLevel: 0 });
}

// A core out of the rock and into the hole. The browser suite does this with the
// pointer, because there it is also a check that a core can be picked up and
// thrown; here it is only ever a check's way of getting a core into the pile, so
// the core is let go over the mouth and the game does the rest -- the same fall,
// the same landing, the same `bankCore` in core.js.
export function bankCore() {
  // Not every rock has one. The first four are rock and nothing else -- see
  // CORE_FROM in config.js -- so a check that wants a core works the rock that
  // has the first of them rather than whichever one it happens to be on.
  // and it puts the yard back on the rock it found afterwards: rock five is a
  // good deal bigger than rock one, and leaving the yard on it hands every check
  // after this one a different-sized boulder to reason about
  const wasRock = state().boulderNo;
  const jumped = wasRock < 5;
  if (jumped) window.__jump(5);
  const restore = () => { if (jumped) window.__jump(wasRock); };
  window.__next();                             // the last of the rock goes
  runUntil(() => state().coreItem?.rest || state().cores > 0, 20);
  if (state().cores > 0) { restore(); return true; }
  if (!state().coreItem) { restore(); return false; }
  yard.S.coreItem = { x: yard.pit.x + 40, y: yard.S.groundY - 240, vx: 0, vy: 0, rest: false };
  const done = runUntil(() => !state().coreItem, 20);
  restore();
  haveRock();                                  // and the next rock comes down
  return done;
}

// Where the ground is at some x -- and, down in the quarry, where the cut's own
// benched floor is. They are two different answers: `groundAt` is the surface a
// body walks along up top, and the cut is a hole in that surface.
const { quarryFloor } = await import('../src/quarry.js');
export const groundAt = x => yard.world.groundAt(x);
export const cutFloorAt = x => quarryFloor(x);

export const P = 6;               // a cell, for the piles
export const WORKER = 18;         // a worker square, for tolerances
