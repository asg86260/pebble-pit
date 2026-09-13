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

// The seed every group in a file starts from.
//
// The yard's chance comes out of one generator now (src/rng.js), and on load it
// is seeded from the clock, so a check that runs a busy yard for thirty seconds
// used to be looking at a different yard every run. That is what the wide
// tolerance bands in these files were buying, and what the three checks that
// failed under load and passed on the retry were paying for: a failure you
// cannot run again is a failure you cannot bisect.
//
// So every group starts from a known number. It is one constant per *file* --
// each file is its own node process with its own yard, so the same constant is
// a different run in each of them -- and a group that fails can be run again
// and fail the same way. There is nothing special about the number itself; it
// is only a name for a run. A file that wants its own may pass one to `group`.
export const SEED = 20250830;

// One group of checks, run out of a fresh game. The whole group runs before
// anything is reported, so a group of six failing checks says six things rather
// than the first one and nothing else -- which is what the browser suite does
// and what makes a failure worth reading.
//
// The reset is `__seed` rather than `__reset`: seeding and clearing are one act
// (see `seedGame` in hooks.js), because a seed handed to a yard that is already
// standing gives a run that is half one seed and half another and cannot be had
// again. So the group starts from the seed, and the seed is where the run
// starts.
export function group(name, fn, seed = SEED) {
  test(name, async () => {
    window.__seed(seed);
    // And the rules are watched for the whole of it. Every group in this tier
    // now checks every invariant in src/verify.js on every frame it runs,
    // whatever the group itself was written to look at -- so a body that goes
    // through a wall is reported by whichever check happened to be running when
    // it did, naming the frame and the seed, rather than by the one group that
    // was built to go looking for it.
    //
    // Right after the seed, and for the same reason the seed is here: it is a
    // property of the run and not of what the run is about, so no group has to
    // remember to ask for it.
    window.__verify(true);
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

// Buying something past the bench is the start of a wait rather than the end of
// one: the coin goes, and the yard has to build the thing. So a check that wants
// the thing has to let the yard build it -- with somebody standing at the site,
// because an empty site builds nothing however long you leave it.
//
// It is deliberately the long way round. A hook that set the level would prove
// nothing about how a player gets there, and what these checks are about is what
// a purchase actually does.
// Buy it and have it built, without a crew to build it.
//
// `buyBuilt` waits for hands, which is right when the waiting is the subject.
// Most checks are about what a row *does* -- a rung making a machine quicker, a
// spell landing on the yard -- and staffing a site for them is a second check
// about staffing written into the first. This pays for the row the way a player
// does and then hands the yard the worker-seconds.
export function buyNow(key) {
  if (!window.__buy(key)) return false;
  window.__finish();
  return true;
}

// Climb a ladder sold in bands the way a player does: pressing its one card,
// rung after rung. Returns how many rungs went up.
export function climb(key, n = 9, buy = buyNow) {
  let got = 0;
  for (let i = 0; i < n; i++) {
    const card = window.__rows().find(r => r.shown && r.key === key);
    if (!card || !buy(card.key)) break;
    got++;
  }
  return got;
}

export function buyBuilt(key, limit = 120) {
  if (!window.__buy(key)) return false;
  const going = () => Object.values(state().works || {}).flat().some(w => w && w.key === key);
  if (!going()) return true;                   // nothing to build: it landed
  runUntil(() => !going(), limit);
  return !going();
}

// the quarry, the plots and the gang's hut, opened without paying for them
export function openSites() {
  window.__crew(0, 0, 1, 1);      // opens both places
  window.__crew(0, 0);
  // The hut is one of them now. Everything the rock sells moved onto its sheet,
  // so a check that opened "the sites" and not the shack was handed a yard with
  // the rock's whole ladder missing and no way to tell that from a yard that
  // never had it.
  window.__shack();
  window.__levels({ benchLevel: 0, plotLevel: 0 });
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

// Where the ground is at some x -- and, down in the quarry, where the quarry's own
// benched floor is. They are two different answers: `groundAt` is the surface a
// body walks along up top, and the quarry is a hole in that surface.
const { quarryFloor, cutTop } = await import('../src/quarry.js');
const { standTop } = await import('../src/route.js');
export const groundAt = x => yard.world.groundAt(x);
export const quarryFloorAt = x => quarryFloor(x);

// Where a body's top edge is when it is standing on the cut's floor at leftX --
// the game's own answer, not a re-derivation of it.
//
// A check that wants to say "it is standing on the floor" has to ask the
// question the way the yard asks it, and the yard asks it twice over: the
// surface is `cutTop` (the dust lying in a column, not the rock under it) and
// the height is `standTop` (the HIGHEST surface under any part of a body three
// cells wide, so a body at the foot of a bench stands on the bench). Sampling
// `quarryFloor` at a body's middle instead gets both wrong, and on a benched
// floor it is out by a whole cell -- which reads as a body six pixels up in the
// air when it is walking perfectly ordinary ground.
export const quarryFeetY = leftX => standTop(leftX, cutTop) - WORKER;

export const P = 6;               // a cell, for the piles
export const WORKER = 18;         // a worker square, for tolerances

// Weather, on demand. A sky over the line does not come down on the frame it
// crosses it any more -- the yard takes a look at what is overhead every few
// seconds and rolls for it, and how likely the roll is is how filthy the sky is
// (see `rainOdds` in smog.js). So a check that wants a shower asks for the one
// sky that is certain to break -- the brim -- and then waits for the look,
// rather than winding to a number and reading the next frame.
//
// It also waits out the minute of dry a second shower owes the first: two rains
// in a row is two rains, not one that stuttered. See RAIN_GAP.
export function makeItRain(limit = 90) {
  window.__air({ haze: state().smog.cap });
  return runUntil(() => state().smog.raining, limit);
}
