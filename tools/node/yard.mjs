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
const { S, floor, pit, bench, quarry, farm, lab, school, casino, scrub, table } =
  await import('../../src/state.js');
const world = await import('../../src/world.js');
const grid = await import('../../src/grid.js');
const pitMod = await import('../../src/pit.js');
const upgrades = await import('../../src/upgrades.js');
const { persist, restore } = await import('../../src/persist.js');
const clock = await import('../../src/clock.js');
const { snapshot } = await import('../../src/report.js');

export async function newYard({ W = 800, H = 600 } = {}) {
  world.resize(game.settleIntoWorld);
  hooks.newGame();

  // The same handles under the same names the browser suite calls them by. A
  // check moved over from there says `window.__crew(3, 2)` and means it: there
  // is a `window` here because the shim made one, and these are the very
  // functions the shell hangs on the real one.
  Object.assign(globalThis, {
    __clearFloor: hooks.clearFloor, __pile: hooks.pile, __jump: hooks.jump,
    __preview: hooks.preview, __next: hooks.next, __drop: hooks.drop,
    __birds: hooks.birds, __crew: hooks.crew, __school: hooks.school,
    __assign: hooks.assign, __build: hooks.rebuildBoards, __plots: hooks.plots,
    __levels: hooks.levels, __fast: hooks.fast, __air: hooks.setAir,
    __tune: hooks.tuneOne, __fill: hooks.fillBoard, __coldSky: hooks.coldSky,
    __toss: hooks.toss, __take: hooks.takeFromPile, __place: hooks.placeBody,
    __abandon: hooks.abandon, __reset: hooks.newGame, __reload: hooks.reload,
    __machine: hooks.machineSet, __fullSites: hooks.fullSites,
    __lever: hooks.lever, __swing: hooks.swing, __cold: hooks.coldReload,
    __lab: hooks.openLab, __research: hooks.finishResearch, __grant: hooks.grant,
    __spend: hooks.spendDust, __press: hooks.press,
    __upgrades: hooks.upgrades, __buy: hooks.buyRowByKey, __pitProfile: hooks.pitProfile, __dig: hooks.dig,
    __tip: hooks.tip, __give: hooks.give, __state: snapshot,
    __skyX: hooks.skyX, __puffFades: hooks.puffFades, __skyFades: hooks.skyFades,
    __dustSpan: hooks.dustSpan, __dustOverPit: hooks.dustOverPit, __skyJoin: hooks.skyJoin, __skyXY: hooks.skyXY,
    __pitTop: hooks.pitTop, __overPit: hooks.overPit, __muckSet: hooks.muckSet,
    __meteor: hooks.openMeteor, __wizardHat: hooks.wizardHat,
    __loo: hooks.openLoo,
    __brew: hooks.brewWizard,
    __muckOverPit: hooks.muckOverPit, __look: hooks.look
  });

  // Run until it is true, a game second at a time, and say whether it ever was.
  // The limit is in game seconds, so it is a fact about the yard rather than
  // about the machine this is running on.
  const until = (done, limit = 60) => {
    for (let i = 0; i < limit; i++) { hooks.fast(1); if (done()) return true; }
    return false;
  };

  return {
    S, floor, pit, bench, quarry, farm, lab, school, casino, scrub, table,
    game, world, clock, upgrades, grid, pitMod, persist, restore,
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
