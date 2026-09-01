// Reading and writing the game.
//
// The pit is stored as the height of every column plus how many grains of each
// shade there are, and the speckle is dealt out again on the way back in: what
// matters about a pile is its shape and its total, and a value per cell would be
// megabytes written every second.

import { P, SHADES, CORE_SIZE, QUARRY_BENCH0, FARM_PLOTS0, ROCK_CELL } from './config.js';
import { load, save, clear } from './save.js';
import { seedSmog, skyFromSave } from './smog.js';
import { craftSave, craftLoad, clearCraft } from './balloon.js';
import { showPanel } from './board.js';
import { S, floor, pit, cut, sky } from './state.js';
import { resetCut } from './quarry.js';
import { freshMachines, MACHINES, kitDisplaced } from './machines.js';
import { makeMeteor } from './meteor.js';
import { now as clockNow } from './clock.js';
import { at, put, count, fillFlat, isDust, recount, wakeGrid } from './grid.js';
import { resite } from './world.js';
import { startIntro } from './intro.js';
import { gridToString, gridFromString, makeBoulder, clearBoulder, boulderAlive } from './rock.js';
import { setPitGrain, seedPitCores, rehomeDust } from './pit.js';
import { syncWorkers, wearKitOnLoad, keepOf, wearRecord, newRecord, FACTORY } from './crew.js';
import { rebalance } from './upgrades.js';
import { buildShop } from './shop.js';
import { resetRates } from './lab.js';
import { seed, reseed, rngState, setRngState } from './rng.js';

// A full pit is a million cells, which is a million characters written to
// localStorage every second if you store it a digit at a time. A pile is nearly
// all long runs of the same value, so store the runs: "value x length", and a
// full pit comes out a few kilobytes.
export function gridStr(b) {
  const out = [];
  let run = b.grid[0] || 0, len = 1;
  for (let i = 1; i < b.grid.length; i++) {
    const v = b.grid[i] || 0;
    if (v === run) { len++; continue; }
    out.push(run + 'x' + len);
    run = v;
    len = 1;
  }
  out.push(run + 'x' + len);
  return out.join('.');
}

// fills the grid from a run-length string; false if it does not fit
export function gridFill(b, str) {
  if (typeof str !== 'string' || !str) return false;
  let i = 0;
  for (const part of str.split('.')) {
    const x = part.indexOf('x');
    if (x < 0) return false;
    const v = +part.slice(0, x), len = +part.slice(x + 1);
    if (!(len >= 0) || i + len > b.grid.length) return false;
    if (v) b.grid.fill(v, i, i + len);
    i += len;
  }
  // A pile written straight into the cells is a pile the sand knows nothing
  // about. It was settled when it was saved and it will almost certainly settle
  // again on the first pass, but "almost certainly" is not how dust is allowed
  // to hang in the air, so the whole plot gets looked at once.
  wakeGrid(b);
  return i === b.grid.length;
}

// A million grains stored one value per cell is two and a half megabytes of
// speckle, written every second. What actually matters about the pile is its
// shape and its total: the shade of any one grain is decoration. So the pit is
// stored as the height of every column plus how many grains of each shade there
// are, and the speckle is dealt out again on the way back in. The profile and
// the count come back exact; you cannot tell which grain moved.
export function pitToSave() {
  const heights = new Array(pit.cols).fill(0);
  const shades = new Array(SHADES.length).fill(0);
  for (let c = 0; c < pit.cols; c++) {
    let n = 0;
    for (let r = 0; r < pit.rows; r++) {
      const v = at(pit, c, r);
      if (!isDust(v)) continue;                    // the rest are re-seeded from the counts
      n++;
      shades[Math.min(SHADES.length, Math.max(1, v)) - 1]++;
    }
    heights[c] = n;
  }
  return { cols: pit.cols, rows: pit.rows, heights: runs(heights), shades };
}

// run-length a list of numbers: "value x length", runs joined by dots
export function runs(list) {
  const out = [];
  let run = list[0], len = 1;
  for (let i = 1; i < list.length; i++) {
    if (list[i] === run) { len++; continue; }
    out.push(run + 'x' + len);
    run = list[i];
    len = 1;
  }
  out.push(run + 'x' + len);
  return out.join('.');
}

export function unruns(str, want) {
  const list = new Array(want).fill(0);
  let i = 0;
  for (const part of String(str || '').split('.')) {
    const x = part.indexOf('x');
    if (x < 0) return null;
    const v = +part.slice(0, x), len = +part.slice(x + 1);
    if (!(len >= 0) || i + len > want) return null;
    list.fill(v, i, i + len);
    i += len;
  }
  return i === want ? list : null;
}

export function pitFromSave(sv) {
  if (!sv || sv.cols !== pit.cols || sv.rows !== pit.rows) return false;
  const heights = unruns(sv.heights, pit.cols);
  if (!heights) return false;

  // a cumulative distribution over the shades, so the speckle comes back in the
  // same proportions it went out in
  const counts = Array.isArray(sv.shades) ? sv.shades : [];
  let total = 0;
  for (const n of counts) total += n || 0;
  const cum = [];
  let acc = 0;
  for (let i = 0; i < SHADES.length; i++) { acc += counts[i] || 0; cum.push(acc); }

  let seed = 1;
  const pick = () => {
    if (!total) return 1;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;   // enough randomness for dust
    const t = (seed / 0x7fffffff) * total;
    for (let i = 0; i < cum.length; i++) if (t < cum[i]) return i + 1;
    return SHADES.length;
  };

  pit.grid.fill(0);
  for (let c = 0; c < pit.cols; c++) {
    const h = Math.min(pit.rows, Math.max(0, heights[c]));
    for (let r = 0; r < h; r++) pit.grid[r * pit.cols + c] = pick();
  }
  recount(pit);                                  // written cell by cell, not put
  pit.painter.repaint();
  return true;
}

// how many cells a run-length string holds, without unpacking it
export function gridCount(str) {
  if (typeof str !== 'string') return 0;
  let n = 0;
  for (const part of str.split('.')) {
    const x = part.indexOf('x');
    if (x > 0 && part[0] !== '0') n += +part.slice(x + 1);
  }
  return n;
}

export function persist() {
  if (!S.dirty) return;
  S.dirty = false;
  save({
    // Which run this is, and how far into it the chance has got. The seed alone
    // would start the stream over on every reload -- the same run's name on a
    // different run -- so the generator's one word of state goes with it. See
    // rng.js.
    runSeed: S.runSeed,
    rngState: rngState(),
    stored: S.stored,
    banked: S.banked,
    carryLevel: S.carryLevel,
    speedLevel: S.speedLevel,
    autoMine: S.autoMine,
    cores: S.cores,
    seenCore: S.seenCore,
    seenBench: S.seenBench,
    seenSects: S.seenSects,
    seenRows: S.seenRows,
    // The rift, and what is standing in it. This is the one part of the pile
    // that is not in the pile: `stored` counts it, the hole does not hold it,
    // and losing this line on the way out would be the difference between a
    // player's dust being somewhere else and being gone.
    seenFullPit: S.seenFullPit,
    riftOpen: S.riftOpen,
    rift: S.rift,
    riftLevel: S.riftLevel,
    // Where the view is. Scrolling the yard is how you look at any of this, and
    // a reload that dumped you back at the rock threw away the one piece of
    // where-you-were the player sets by hand. Rounded because a pixel of a
    // pixel is not worth the characters.
    camX: Math.round(S.camX),
    hideDone: S.hideDone,
    pickLevel: S.pickLevel,
    core: S.coreItem && !S.heldCore ? { x: S.coreItem.x, y: S.coreItem.y } : null,
    coreLoose: S.heldCore || !!S.coreItem,
    // what the sites have given up and nobody has carried in yet: it was never
    // counted, and a reload pocketing it would be the game taking it back
    crew: S.crew,
    // The crew itself, not just how many of them there are. A body has a name
    // and a record now, and rebuilding the yard from four counts would hand you
    // back four strangers standing where your crew was.
    who: S.workers.map(keepOf),
    miners: S.miners,
    schoolOpen: S.schoolOpen,
    breakers: S.breakers,
    carters: S.carters,
    blasters: S.blasters,
    growers: S.growers,
    haulers: S.haulers,
    minerSpeedLevel: S.minerSpeedLevel,
    minerPickLevel: S.minerPickLevel,
    haulCarryLevel: S.haulCarryLevel,
    haulPaceLevel: S.haulPaceLevel,
    shards: S.shards,
    seenShard: S.seenShard,
    quarryOpen: S.quarryOpen,
    quarriers: S.quarriers,
    quarryPaceLevel: S.quarryPaceLevel,
    benchLevel: S.benchLevel,
    // How far each column of the cut has been dug, so the sand it carries
    // (below) is being read against the same floor it was lying on when it was
    // written. Nought everywhere and no `cut` at all come to the same thing on
    // the way back in -- see `restore`.
    quarryCells: S.quarryCells ? Array.from(S.quarryCells) : null,
    spores: S.spores,
    seenSpore: S.seenSpore,
    farmOpen: S.farmOpen,
    farmhands: S.farmhands,
    labbers: S.labbers,
    research: S.research && { ...S.research },
    labDone: S.labDone,
    labLeft: S.labLeft,
    tendLevel: S.tendLevel,
    plotLevel: S.plotLevel,
    labOpen: S.labOpen,
    introDone: S.introDone,
    reunionDone: S.reunionDone,
    buried: S.buried,
    casinoOpen: S.casinoOpen,
    scrubOpen: S.scrubOpen,
    towerOpen: S.towerOpen,
    outhouseOpen: S.outhouseOpen,
    labKitLevel: S.labKitLevel,
    fanLevel: S.fanLevel,
    spells: [...(S.spells || [])],
    wizSpeedLevel: S.wizSpeedLevel,
    wizPowerLevel: S.wizPowerLevel,
    labRooms: S.labRooms,
    research2: S.research2,
    // The machines, as facts only: whether each was bought, whether it is driven,
    // and whether it took the station's kit. The beats and the phases are not
    // saved -- they are clocks the drawing reads, and a machine comes back mid
    // stroke rather than not at all.
    //
    // Whether it is *running* is not saved because it is not a fact about the
    // machine. It is whether anybody is standing at it, and the crew is rebuilt
    // from the counts on the way in.
    machines: Object.fromEntries(MACHINES.map(m => {
      const r = (S.machines && S.machines[m.key]) || {};
      return [m.key, { bought: !!r.bought, driven: !!r.driven, tookKit: !!r.tookKit,
                       tune: r.tune || 0 }];
    })),
    // The sky. What is left of the meteor is saved cell by cell -- it is a rock
    // half taken apart, and coming back to a whole one would be a shift's work
    // handed back. The hat on the go is not: a spell in the middle of being cast
    // when you closed the tab is a spell with no beginning, the same rule the
    // rain goes by, so the tower starts it again and you have not paid twice.
    meteorOpen: S.meteorOpen,
    meteorCells: sky.cells ? Array.from(sky.cells) : null,
    summon: +(S.summon || 0).toFixed(3),
    sparks: S.sparks,
    seenSpark: S.seenSpark,
    wizardHats: S.wizardHats,
    // What the tower still owes you. The rain and the weather in flight are not
    // saved, because a shower with no beginning is not a shower -- but a hat on
    // the bench has been *paid for*, and closing the tab on one used to lose the
    // dust, the stone and the crop with it.
    brewLeft: Math.max(0, S.brewAt - clockNow()),
    wizards: S.wizards,
    scrubbers: S.scrubbers,
    // The craft the house has sold. Two numbers and an eased height apiece; the
    // lane is the index and who is aboard is a fact about the body.
    craft: craftSave(),
    janitors: S.janitors,
    harnessLevel: S.harnessLevel,
    bootsLevel: S.bootsLevel,
    seenMess: S.seenMess,

    recycler: S.recycler,
    seenAir: S.seenAir,
    haze: Math.round(S.haze),
    rains: S.rains,
    recycled: S.recycled,
    muck: S.muck || [],
    poop: S.poop || [],
    // and what is lying on top of the rock, which is a layer like the two above
    // and belongs to the rock the save already writes down. Column by column,
    // bottom grain first.
    rockSand: (S.rockSand || []).map(a => (a || []).join(',')),
    pot: S.pot && { ...S.pot },
    // A pot that was still pouring when the tab shut is a bet that was made. The
    // sand itself is not saved -- the table's grid never is -- so what comes back
    // is the pot on the board and the pour starting again from the sky, and the
    // wheel goes round when it has landed, exactly as it would have.
    pouring: !!S.pouring,
    chip: S.chip,
    mult: { ...S.mult },
    plots: S.plots.map(b => Math.round(b * 100)),
    plotTone: [...S.plotTone],
    boulder: gridToString(),
    gw: S.gw,
    gh: S.gh,
    boulderNo: S.boulderNo,
    floor: { cols: floor.cols, rows: floor.rows, cells: gridStr(floor) },
    pit: pitToSave(),
    // The cut's own sand, kept the same way the floor's is: a shape and a
    // run-length string. It only means anything alongside `quarryCells`
    // above, so the two are written and read together.
    cut: cut.grid ? { cols: cut.cols, rows: cut.rows, cells: gridStr(cut) } : null
  });
}

export function restoreGrid(b, s) {
  if (!s) return;
  b.grid.fill(0);
  if (s.cols === b.cols && s.rows === b.rows && gridFill(b, s.cells)) {
    if (b.n != null) recount(b);           // written run by run, not put
    if (b.painter) b.painter.repaint();
    return;
  }
  fillFlat(b, gridCount(s.cells));   // a different shape: re-pack the same amount
  if (b.painter) b.painter.repaint();
}

export function restore() {
  const s = load();
  // The run's name and where its chance had got to, before anything below draws
  // on it -- restoring the sky, dealing the pit's speckle and standing the crew
  // back up all take draws, and they should be the draws the save was going to
  // take next.
  //
  // A save written before any of this existed has neither, and must not be made
  // to crash over it: the generator seeded itself from entropy when the module
  // loaded (see rng.js), so such a game simply keeps that stream and is told
  // what it is called. It is a run with a name from now on, which is all the
  // migration there is.
  S.runSeed = Number.isFinite(s?.runSeed) ? s.runSeed >>> 0 : seed();
  if (Number.isFinite(s?.rngState)) setRngState(s.rngState);
  S.boulderNo = s?.boulderNo || 1;
  // Where the view was left. Read at boot and nowhere else, and only believed
  // if it is a number -- an old save has none, and gets the opening view.
  S.camWas = Number.isFinite(s?.camX) ? s.camX : null;
  if (!s || !gridFromString(s.boulder, s.gw, s.gh) || typeof s.stored !== 'number') {
    // A game that has never been played does not start with a rock. It starts
    // with two people, and the rock is what happens to them -- see intro.js.
    makeBoulder();
    clearBoulder();
    S.coreBuried = false;
    startIntro();
    S.stored = 0;
    S.banked = 0;
    S.shownStored = S.tweenFrom = S.tweenTo = 0;
    S.carryLevel = 0;
    S.speedLevel = 0;
    S.autoMine = false;
    S.crew = 0;
      S.cores = 0;
    S.seenCore = false;
    S.seenBench = false;
    S.seenSects = [];
    S.seenRows = [];
    S.seenFullPit = false;
    S.riftOpen = false;
    S.rift = 0;
    S.riftLevel = 0;
    S.pickLevel = 0;
    S.coreItem = null;
    S.miners = 0;
    S.haulers = 0;
    S.schoolOpen = false;
    S.breakers = 0;
    S.carters = 0;
    S.blasters = 0;
    S.growers = 0;
    S.minerSpeedLevel = 0;
    S.minerPickLevel = 0;
    S.haulCarryLevel = 0;
    S.haulPaceLevel = 0;
    S.shards = 0;
    S.seenShard = false;
    S.quarryOpen = false;
    S.quarriers = 0;
    S.quarryPaceLevel = 0;
    S.benchLevel = 0;
    S.machines = freshMachines();   // a new yard has no machines in it
    S.labKitLevel = 0; S.labRooms = 1; S.research2 = null;
  S.wizSpeedLevel = 0; S.wizPowerLevel = 0; S.fanLevel = 0; S.spells = [];
    S.wizSpeedLevel = 0; S.wizPowerLevel = 0; S.fanLevel = 0; S.spells = [];
    S.spores = 0;
    S.seenSpore = false;
    S.farmOpen = false;
    S.farmhands = 0;
    S.labbers = 0;
    S.research = null;
    S.labDone = null;
    S.labLeft = 0;
    S.tendLevel = 0;
    S.plotLevel = 0;
    S.labOpen = false;
    S.casinoOpen = false;
    S.pot = null;
    S.pouring = false;
    for (const k of Object.keys(S.mult)) S.mult[k] = 0;
    S.plots = [];
  S.plotTone = [];
    S.plotTone = [];
    return;
  }
  S.stored = s.stored;
  S.banked = s.banked || s.stored || 0;
  S.shownStored = S.tweenFrom = S.tweenTo = S.stored;
  S.carryLevel = s.carryLevel || 0;
  S.speedLevel = s.speedLevel || 0;
  S.autoMine = !!s.autoMine;
  S.cores = s.cores || 0;
  S.seenCore = !!s.seenCore || S.cores > 0;
  S.seenBench = !!s.seenBench;
  S.seenSects = Array.isArray(s.seenSects) ? s.seenSects : [];
  S.seenRows = Array.isArray(s.seenRows) ? s.seenRows : [];
  // How far the hole has been dug decides how big the plot is, so it goes in
  // before the plot is laid out -- and the saved pile only fits a plot of the
  // shape it came out of.
  // A save from before the hole was something you dug has one already: it was
  // the whole thing from the first frame, and it keeps it.
  // Nothing to restore about the shape of it: the hole is the whole hole from
  // the first frame, and one grain size for ever. A save from when it was dug
  // out a purchase at a time arrives in one, and a save from when the press sold
  // a finer grain arrives at six pixels -- its `pitStep` and `pitFine` are read
  // by nobody now, and the pile it wrote at three pixels or two will not fit
  // this plot. `rehomeDust` below is what puts that dust back where it goes.
  S.hideDone = !!s.hideDone;
  setPitGrain();
  S.pickLevel = s.pickLevel || 0;
  if (s.coreLoose) {
    S.coreItem = s.core
      ? { x: s.core.x, y: s.core.y, vx: 0, vy: 0, rest: true }
      : { x: S.worldW * 0.2, y: S.groundY - CORE_SIZE, vx: 0, vy: 0, rest: false };
  }
  S.miners = s.miners || 0;
  S.schoolOpen = !!s.schoolOpen;
  // rebalance clamps them to what is actually standing there
  S.breakers = s.breakers || 0;
  S.carters = s.carters || 0;
  S.blasters = s.blasters || 0;
  S.growers = s.growers || 0;
  // A save from when the quarry was a cave. The place changed and the people
  // changed name with it; what they had done is still theirs.
  S.quarriers = s.quarriers ?? s.spelunkers ?? 0;
  // How far the two growing sites have been grown. A save from before either of
  // them grew has everybody it had standing in a place that now has room for
  // two, so the places are grandfathered up to the crew that is already in
  // them: the game does not take a body off a plot it used to have.
  S.benchLevel = Math.max(+s.benchLevel || 0, (s.quarriers ?? s.spelunkers ?? 0) - QUARRY_BENCH0);
  S.plotLevel = Math.max(+s.plotLevel || 0, (s.farmhands || 0) - FARM_PLOTS0);
  S.farmhands = s.farmhands || 0;
  S.labbers = s.labbers || 0;
  // a piece of research keeps whatever the crew already put into it
  S.research = s.research && s.research.key ? { key: s.research.key, done: +s.research.done || 0 } : null;
  // and one that finished while you were away is still news when you come back
  S.labDone = s.labDone || null;
  // and how many it let out, so a reload does not lose the ones it owes you
  S.labLeft = +s.labLeft || 0;
  // A save from before the crew was one pool has a headcount per job and no
  // total. Adding them up is the whole migration: the same bodies, on the same
  // jobs, and now they can be moved.
  S.crew = s.crew ?? (s.miners || 0) + (s.haulers || 0) + (S.quarriers || 0) + (s.farmhands || 0);
  // Before the `rebalance()` below, and that ordering is the whole point: a
  // restored machine changes what its station's cap *is*, and a rebalance run
  // against the old cap leaves five bodies standing at a cut that now holds one.
  //
  // This block used to sit thirty-seven lines further down, under a comment
  // saying exactly what is written above -- which was simply not true, and the
  // clamp it promised never ran. A save with the gang still at the cut and the
  // jaw switched on came back with five bodies against a cap of one, and stayed
  // that way: nothing recomputes it per frame. It only ever looked right through
  // the dev reload, which is `persist()` then `restore()` in one process, where
  // the still-running in-memory machine made the rebalance clamp by accident.
  //
  // A save from before the machines existed has no block at all, and gets three
  // fresh records rather than three undefineds.
  S.machines = freshMachines();
  for (const m of MACHINES) {
    const r = (s.machines && s.machines[m.key]) || {};
    const rec = S.machines[m.key];
    rec.bought = !!r.bought;
    // A save written while the levers still existed carries `on` and `was`. Both
    // are dropped on the way in: a machine is worked by whoever is standing at
    // it, and a save that came back switched off would be a machine you had
    // bought and could no longer start, the switch for it having been taken out
    // of the game.
    rec.driven = !!r.driven;
    // How far up its own ladder it is. An endless ladder is a number that only
    // goes up, so losing it on a reload is losing everything ever spent on the
    // biggest sink in the game.
    rec.tune = Math.max(0, Math.round(+r.tune || 0));
    // A machine bought before this was written took a full set and has no
    // record of it. It is bought, so it did.
    // And a machine that does not take kit never took any, whatever the save
    // says: the belt was written down as having taken the carts back when every
    // machine did, and a stale `true` there would have `stripKit` empty the
    // stand every frame under a row that is still selling carts.
    rec.tookKit = rec.bought && kitDisplaced(m.job)
      ? (r.tookKit == null ? true : !!r.tookKit) : false;
  }
  rebalance();
  S.minerSpeedLevel = s.minerSpeedLevel || 0;
  // A save from when one pick row bought both keeps what its miners had.
  S.minerPickLevel = s.minerPickLevel ?? (s.pickLevel || 0);
  S.haulCarryLevel = s.haulCarryLevel || 0;
  S.haulPaceLevel = s.haulPaceLevel || 0;
  S.shards = s.shards || 0;
  S.seenShard = !!s.seenShard || S.shards > 0;
  S.quarryOpen = !!(s.quarryOpen ?? s.caveOpen);
  S.quarryPaceLevel = s.quarryPaceLevel ?? s.cavePaceLevel ?? 0;
  // How far each column had been dug. A save from before this was kept, or one
  // whose array is the wrong shape for the quarry this run has, comes back to
  // nought everywhere -- an unbroken floor, exactly what `resetCut` below then
  // lays fresh rock to match.
  S.quarryCells = Array.isArray(s.quarryCells) ? s.quarryCells.map(v => +v || 0) : null;
  S.spores = s.spores || 0;
  S.seenSpore = !!s.seenSpore || S.spores > 0;
  S.farmOpen = !!s.farmOpen;
  S.farmhands = s.farmhands || 0;
  S.tendLevel = s.tendLevel || 0;
  S.labOpen = !!s.labOpen;
  // The opening happens once, ever. Coming back to a saved game is coming back
  // to a yard where it already happened.
  // A save from before the opening existed, with nobody hired yet, is a game
  // that has not started -- so it gets the opening. There is no row selling a
  // first worker any more; the story hands you one.
  S.introDone = !!s.introDone || (s.crew ?? 0) > 0;
  // and a save from before the second act existed has plainly had its first rock
  S.reunionDone = s.reunionDone ?? ((s.boulderNo ?? 1) > 1);
  S.intro = null;
  S.camLockY = null;
  S.pair = [];
  S.buried = s.buried ?? !!s.introDone;
  S.casinoOpen = !!s.casinoOpen;
  S.scrubOpen = !!s.scrubOpen;
  S.towerOpen = !!s.towerOpen;
  S.outhouseOpen = !!s.outhouseOpen;
  S.labKitLevel = s.labKitLevel || 0;
  S.fanLevel = s.fanLevel || 0;
  S.spells = Array.isArray(s.spells) ? s.spells.slice() : [];
  S.wizSpeedLevel = s.wizSpeedLevel || 0;
  S.wizPowerLevel = s.wizPowerLevel || 0;
  S.labRooms = Math.max(1, s.labRooms || 1);
  S.research2 = s.research2 || null;
  S.meteorOpen = !!s.meteorOpen;
  S.sparks = s.sparks || 0;
  S.seenSpark = !!s.seenSpark || S.sparks > 0;
  S.wizardHats = s.wizardHats || 0;
  S.wizards = Math.min(s.wizards || 0, S.wizardHats);
  S.brewAt = s.brewLeft > 0 ? clockNow() + s.brewLeft : 0;
  if (S.meteorOpen) {
    makeMeteor();
    // and the cells as they were left, if the save is of this shape of sky
    if (Array.isArray(s.meteorCells) && s.meteorCells.length === sky.cells.length) {
      sky.cells.set(s.meteorCells);
      sky.n = sky.cells.reduce((n, v) => n + (v ? 1 : 0), 0);
    }
    S.summon = Math.max(0, Math.min(1, s.summon || 0));
  }
  S.scrubbers = s.scrubbers || 0;
  craftLoad(s.craft);
  S.janitors = s.janitors || 0;
  S.harnessLevel = s.harnessLevel || 0;
  S.bootsLevel = s.bootsLevel || 0;
  S.seenMess = !!s.seenMess;
  S.recycler = !!s.recycler;
  S.seenAir = !!s.seenAir;
  S.haze = s.haze || 0;
  S.rains = s.rains || 0;
  S.recycled = s.recycled || 0;
  S.scrubBank = 0;
  // The rain itself is not saved. It is nine seconds long and it is weather:
  // coming back to a shower that started before you closed the tab is a shower
  // with no beginning. What it left behind is saved, because that is the part
  // that is somebody's job.
  S.raining = false;
  S.rainFor = 0;
  S.muck = Array.isArray(s.muck) ? s.muck.slice() : [];
  S.poop = Array.isArray(s.poop) ? s.poop.slice() : [];
  // A save from before the rock was something dust could lie on has none, and
  // comes back to a bare hill.
  S.rockSand = Array.isArray(s.rockSand)
    ? s.rockSand.map(a => String(a || '').split(',').filter(Boolean).map(Number))
    : null;
  // And the sky itself, not only the number for it. The haze was being written
  // down and read back while the motes it stands for were not: `settleCount`
  // only ever takes motes away in play -- one arrives by climbing off a swing,
  // which is the whole point of them -- so a reload came back to a full
  // readout over an empty band, and the two only agreed again after the crew
  // had spent an hour putting the sky back up a speck at a time.
  //
  // This is exactly the case `skyFromSave` is for: a sky being restored rather
  // than made. Safe here because the world is laid out before the save is read
  // (see the boot order in main.js), so there is a width to spread it across.
  skyFromSave();
  // A pot left on the table is still on it. It comes back ripe -- the clock it
  // was climbing on is wall time, and a hand you left an hour ago is a hand you
  // left long enough.
  S.pot = s.pot && s.pot.cur ? { cur: s.pot.cur, stake: +s.pot.stake || 0, n: +s.pot.n || 0, at: 0 } : null;
  S.spinUntil = 0;
  S.tableAir = [];
  S.paying = null;
  // A bet made is a bet made: a pot caught mid-pour comes back mid-pour, the
  // sand falls again out of an empty table, and the spin it was owed is still
  // owed. A pot that had already been spun for comes back a pot and nothing more.
  S.pouring = S.casinoOpen && !!S.pot && !!s.pouring;
  S.chip = Math.max(0, +s.chip || 0);
  S.hand = null;                 // a hand that settled before you closed the tab is old news
  // the lab's quarry multiplier answered to `cave` before the place was renamed
  if (s.mult) for (const k of Object.keys(S.mult)) S.mult[k] = s.mult[k] ?? (k === 'quarry' ? s.mult.cave : 0) ?? 0;
  if (Array.isArray(s.plots)) S.plots = s.plots.map(b => (+b || 0) / 100);
  // a ripe plot keeps the spore that grew on it, tone and all
  if (Array.isArray(s.plotTone)) S.plotTone = s.plotTone.map(v => +v || 0);
  resite();                    // the quarry is as deep and the plot as wide as it was
  restoreCrew(s.who);          // the same people, where they were, with what they have done
  syncWorkers();               // and anybody the counts say is missing
  if (!Array.isArray(s.who)) wearKitOnLoad();   // an old save has no record of who wore what
  if (!S.introDone) startIntro();
  restoreGrid(floor, s.floor);
  if (!pitFromSave(s.pit)) pit.grid.fill(0);
  // What is here and what is somewhere else. The rift comes back before the dust
  // is put away, because how much of it belongs in the hole depends on how much
  // of it is already through the rift.
  //
  // Clamped to the counter on the way in: a rift holding more than you own would
  // leave `inHole` reading nought against a pile that plainly has dust in it, and
  // a saved number is not something to trust over the one it has to agree with.
  S.seenFullPit = !!s.seenFullPit;
  S.riftOpen = !!s.riftOpen;
  S.rift = Math.max(0, Math.min(Math.round(+s.rift || 0), S.stored));
  S.riftLevel = Math.max(0, Math.round(+s.riftLevel || 0));
  rehomeDust();
  seedPitCores();
  // The cut's own sand: rock laid fresh to the depth just restored above, then
  // the dust that was lying on it overlaid -- but only if the save's cut is
  // the exact shape this quarry's grid is. A save from before the cut kept
  // sand, or one whose grid no longer matches (the depth it names having
  // failed to restore, or the game's own shape of the plot having moved on),
  // arrives with nothing lying in it: `resetCut` alone is a fresh, unbroken
  // floor at the depth `S.quarryCells` says, which is exactly what an empty
  // cut is.
  resetCut();
  if (cut.grid && s.cut && s.cut.cols === cut.cols && s.cut.rows === cut.rows &&
      gridFill(cut, s.cut.cells)) {
    recount(cut);
    cut.rock = 0;
    for (const v of cut.grid) if (v === ROCK_CELL) cut.rock++;
    if (cut.painter) cut.painter.repaint();
  }
  S.coreBuried = boulderAlive() || !(s.coreLoose || S.heldCore);
}

// The crew, put back. Each body is made by its own factory -- so it has every
// field its job expects, whatever has changed since the save was written -- and
// then handed back the things that are *it* rather than its job.
function restoreCrew(who) {
  S.workers = [];
  if (!Array.isArray(who)) return;
  for (const k of who) {
    if (!k.type) continue;
    // A body that was holding the rift open, from a save written when it needed
    // holding. Nobody teleports and nobody is lost: it comes back as a carter,
    // where it stood -- on the strip past the far wall -- and walks home over
    // the ladders the way it got there. Carrying is what a body does when it is
    // on nothing, which is what a job that no longer exists leaves it on, and
    // `rebalance` counts the spare hands as carters without being told.
    const type = k.type === 'rifter' ? 'hauler' : k.type;
    const made = FACTORY(type);
    if (!made.type) continue;                  // a trade this build does not have
    S.workers.push(wearRecord(Object.assign(made, newRecord()), k));
  }
}

// A new game, and a new run.
//
// `fresh` is what tells the two apart. A player starting over gets a seed of
// their own, drawn here before a single grain is laid down, because everything
// below this line draws on the chance and a yard built before its seed was set
// is a yard that seed does not describe. A run started from a seed on purpose --
// `seedGame` in hooks.js, which is how every check in both tiers begins -- comes
// through here with `fresh` false and keeps the number it was given: reseeding
// under it would throw the seed away in the act of honoring it.
export function reset(fresh = true) {
  clear();
  S.runSeed = fresh ? reseed() : seed();
  // Including what the hole had been pressed to. This is not the same field as
  // the grain it is *at* -- the grain follows from the pile being rebuilt, and
  // reset does rebuild it -- and leaving the paid-for permission behind meant a
  // brand new yard came with the star's red already spent on it.
  // The rift: a new yard has no hole in the air in it, and nothing standing on
  // the other side of one.
  S.seenFullPit = false;
  S.riftOpen = false;
  S.rift = 0;
  S.riftLevel = 0;
  S.paused = false;                // a new game is not a held one
  showPanel(null, true);           // nor one with the last game's board still up
  // the curtains are somebody's, and there is nobody here now
  S.shutters = [];
  S.shutterAt = 0;
  S.chips = [];
  S.belt = [];                       // and what was riding the belt, for the same reason
  S.paid = [];
  S.gulped = [];
  S.stored = 0;
  S.banked = 0;
  S.shownStored = S.tweenFrom = S.tweenTo = 0;
  S.held = 0;
  S.carryLevel = 0;
  S.speedLevel = 0;
  S.autoMine = false;
  S.crew = 0;
  S.cores = 0;
  S.seenCore = false;
  S.seenBench = false;
  S.seenSects = [];
  S.seenRows = [];
  setPitGrain();
  S.pickLevel = 0;
  S.coreItem = null;
  S.heldCore = false;
  S.miners = 0;
  S.haulers = 0;
  S.schoolOpen = false;
  S.breakers = 0;
  S.carters = 0;
  S.blasters = 0;
  S.growers = 0;
  S.minerSpeedLevel = 0;
  S.minerPickLevel = 0;
  S.haulCarryLevel = 0;
  S.haulPaceLevel = 0;
  S.shards = 0;
  S.seenShard = false;
  S.quarryOpen = false;
  S.quarriers = 0;
  S.quarryPaceLevel = 0;
  S.benchLevel = 0;
  S.quarryCells = null;
  S.machines = freshMachines();     // a new yard has no machines in it
  S.labKitLevel = 0; S.labRooms = 1; S.research2 = null;
  S.spores = 0;
  S.seenSpore = false;
  S.farmOpen = false;
  S.farmhands = 0;
  S.labbers = 0;
  S.research = null;
  S.labDone = null;
  S.labLeft = 0;
  S.tendLevel = 0;
  S.plotLevel = 0;
  S.labOpen = false;
  S.labBoardOpen = false;
  S.casinoOpen = false;
  S.scrubOpen = false;
  S.towerOpen = false;
  S.outhouseOpen = false;
  S.meteorOpen = false;
  S.summon = 0;
  S.flashAt = 0;
  S.sparks = 0;
  S.seenSpark = false;
  S.wizardHats = 0;
  S.wizards = 0;
  S.brewAt = 0;
  sky.cells = null;
  sky.n = 0;
  S.scrubbers = 0;
  clearCraft();
  S.janitors = 0;
  S.introThrew = 0;
  S.harnessLevel = 0;
  S.bootsLevel = 0;
  S.seenMess = false;
  S.recycler = false;
  S.seenAir = false;
  S.haze = 0;
  S.raining = false;
  S.rainFor = 0;
  S.rains = 0;
  S.recycled = 0;
  S.scrubBank = 0;
  S.muck = [];
  S.poop = [];
  S.rockSand = null;
  seedSmog();
  S.casinoBoardOpen = false;
  S.pot = null;
  S.pouring = false;
  S.spinUntil = 0;
  S.tableAir = [];
  S.falling = [];
  for (const k of Object.keys(S.mult)) S.mult[k] = 0;
  S.plots = [];
  S.plotTone = [];
  syncWorkers();
  resetRates();
  floor.grid.fill(0);
  pit.grid.fill(0);
  recount(floor);                          // both ledgers, both emptied behind `put`
  recount(pit);
  floor.painter.repaint();
  pit.painter.repaint();
  resetCut();                              // fresh rock, nought dug, nothing lying in it
  S.boulderNo = 1;
  S.introDone = false;
  S.reunionDone = false;
  S.buried = false;
  makeBoulder();
  clearBoulder();
  S.coreBuried = false;
  startIntro();                    // a reset is a game that has never been played
  buildShop();
  S.dirty = true;
  persist();
}

