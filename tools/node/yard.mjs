// A yard to run checks against, in node, with no browser anywhere.
//
//   import { newYard } from '../tools/node/yard.mjs';
//   const yard = await newYard();
//   yard.fast(10);                       // ten seconds of game, in a few ms
//
// The game's clock is turned by hand here, exactly as it is in the browser
// suite: `fast(10)` is six hundred frames of `step`, and it is the same six
// hundred frames every time it is run. Nothing waits on the wall.
//
// One yard per test *file*: node runs each file in its own process, so the
// modules -- and the single `S` they all share -- are built fresh for each one.
// Inside a file, `reset()` puts the yard back to a new game.

import { installDom } from './dom.mjs';

installDom();

const game = await import('../../src/game.js');
const smog = await import('../../src/smog.js');
const tower = await import('../../src/tower.js');
const hooks = await import('../../src/hooks.js');
const { S, floor, pit, bench, quarry, farm, lab, apothecary, casino, filter, table } =
  await import('../../src/state.js');
const world = await import('../../src/world.js');
const grid = await import('../../src/grid.js');
const pitMod = await import('../../src/pit.js');
const riftMod = await import('../../src/rift.js');
const upgrades = await import('../../src/upgrades.js');
const { persist, restore } = await import('../../src/persist.js');
const clock = await import('../../src/clock.js');
const { snapshot } = await import('../../src/report.js');
const { forceCrit } = await import('../../src/crit.js');

export async function newYard({ W = 800, H = 600 } = {}) {
  world.resize(game.settleIntoWorld);
  hooks.newGame();

  // Crits off by default in the node harness. A crit is a roll -- see crit.js --
  // and a roll is nondeterminism, so a check about anything *other* than crits
  // reads a yard where the swing spoil and the dig timing wobble under it: a dig
  // finishes a beat early when a swing pulls the seam forward, a swing's speck
  // comes off fatter and higher. Every one of those checks is about the thing it
  // is about and not about crits, so the honest yard for it is the crit-free one.
  // A check that *is* about crits forces the roll on with `__crit(true)` (or back
  // to real rolls with `__crit(null)`) and manages its own state -- see
  // test/crit.test.mjs. Play never touches this: `forceCrit` is test-only and the
  // game rolls its 10% from the first swing.
  forceCrit(false);

  // The same handles under the same names the browser suite calls them by. A
  // check moved over from there says `window.__crew(3, 2)` and means it: there
  // is a `window` here because the shim made one, and these are the very
  // functions the shell hangs on the real one.
  Object.assign(globalThis, { ...hooks.HANDLES, __state: snapshot });

  // Run until it is true, a game second at a time, and say whether it ever was.
  // The limit is in game seconds, so it is a fact about the yard rather than
  // about the machine this is running on.
  const until = (done, limit = 60) => {
    for (let i = 0; i < limit; i++) { hooks.fast(1); if (done()) return true; }
    return false;
  };

  return {
    S, floor, pit, bench, quarry, farm, lab, apothecary, casino, filter, table,
    game, world, clock, upgrades, grid, pitMod, riftMod, persist, restore,
    // The same handles the browser checks call through `window.__`, by their
    // own names. Anything not here is a `hooks.` away.
    ...hooks,
    reset: hooks.newGame, spend: hooks.spendDust,
    // The same reading of the yard the browser checks get from `window.__state`,
    // minus the two lines about the page. A check ported from there reads the
    // same field names it always did.
    state: snapshot,
    until,
    grains: b => grid.count(b), dust: b => grid.countDust(b),
    // where everybody is, in the shorthand the checks read: a body a line
    who: () => S.workers.map(w => `${w.type[0]}:${Math.round(w.x)},${Math.round(w.y)}`),
    // The motes themselves, for a check that has to watch one speck rather than
    // a count of them: what climbs and what settles are one list and one object,
    // and the only way to check that is to hold on to one.
    smogSky: () => smog.SKY,
    // how far along the hat on the tower's bench is, which is what the bar over
    // the tower is drawn from
    brewAt: () => tower.brewAt()
  };
}
