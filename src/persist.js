// Reading and writing the game.
//
// The pit is stored as the height of every column plus how many grains of each
// shade there are, and the speckle is dealt out again on the way back in: what
// matters about a pile is its shape and its total, and a value per cell would be
// megabytes written every second.

import { P, SHADES, CORE_SIZE, QUARRY_BENCH0, FARM_BEDS0 } from './config.js';
import { load, save, clear } from './save.js';
import { seedSmog, skyFromSave } from './smog.js';
import { showPanel } from './board.js';
import { S, floor, pit } from './state.js';
import { at, put, count, fillFlat, isDust, recount } from './grid.js';
import { resite } from './world.js';
import { startIntro } from './intro.js';
import { gridToString, gridFromString, makeBoulder, boulderAlive } from './rock.js';
import { setPitGrain, seedPitCores } from './pit.js';
import { syncWorkers, wearKitOnLoad, keepOf, wearRecord, newRecord, FACTORY } from './crew.js';
import { rebalance } from './upgrades.js';
import { buildShop } from './shop.js';
import { resetRates } from './lab.js';

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
    pitStep: S.pitStep,
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
    spores: S.spores,
    seenSpore: S.seenSpore,
    farmOpen: S.farmOpen,
    farmhands: S.farmhands,
    labbers: S.labbers,
    research: S.research && { ...S.research },
    labDone: S.labDone,
    labLeft: S.labLeft,
    tendLevel: S.tendLevel,
    bedLevel: S.bedLevel,
    labOpen: S.labOpen,
    introDone: S.introDone,
    reunionDone: S.reunionDone,
    buried: S.buried,
    casinoOpen: S.casinoOpen,
    scrubOpen: S.scrubOpen,
    towerOpen: S.towerOpen,
    outhouseOpen: S.outhouseOpen,
    magicLoo: S.magicLoo,
    scrubbers: S.scrubbers,
    recycler: S.recycler,
    seenAir: S.seenAir,
    haze: Math.round(S.haze),
    rains: S.rains,
    recycled: S.recycled,
    muck: S.muck || [],
    pot: S.pot && { ...S.pot },
    chip: S.chip,
    mult: { ...S.mult },
    beds: S.beds.map(b => Math.round(b * 100)),
    bedTone: [...S.bedTone],
    boulder: gridToString(),
    gw: S.gw,
    gh: S.gh,
    boulderNo: S.boulderNo,
    floor: { cols: floor.cols, rows: floor.rows, cells: gridStr(floor) },
    pit: pitToSave()
  });
}

export function restoreGrid(b, s) {
  if (!s) return;
  b.grid.fill(0);
  if (s.cols === b.cols && s.rows === b.rows && gridFill(b, s.cells)) {
    if (b.painter) b.painter.repaint();
    return;
  }
  fillFlat(b, gridCount(s.cells));   // a different shape: re-pack the same amount
  if (b.painter) b.painter.repaint();
}

export function restore() {
  const s = load();
  S.boulderNo = s?.boulderNo || 1;
  if (!s || !gridFromString(s.boulder, s.gw, s.gh) || typeof s.stored !== 'number') {
    // A game that has never been played does not start with a rock. It starts
    // with two people, and the rock is what happens to them -- see intro.js.
    makeBoulder();
    S.boulder = S.boulder.map(row => row.map(() => 0));
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
    S.pitStep = 0;
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
    S.spores = 0;
    S.seenSpore = false;
    S.farmOpen = false;
    S.farmhands = 0;
    S.labbers = 0;
    S.research = null;
    S.labDone = null;
    S.labLeft = 0;
    S.tendLevel = 0;
    S.bedLevel = 0;
    S.labOpen = false;
    S.casinoOpen = false;
    S.pot = null;
    for (const k of Object.keys(S.mult)) S.mult[k] = 0;
    S.beds = [];
  S.bedTone = [];
    S.bedTone = [];
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
  // How far the hole has been dug decides how big the bed is, so it goes in
  // before the bed is laid out -- and the saved pile only fits a bed of the
  // shape it came out of.
  // A save from before the hole was something you dug has one already: it was
  // the whole thing from the first frame, and it keeps it.
  // Nothing to restore: the hole is the whole hole from the first frame, and a
  // save from when it was dug out a purchase at a time simply arrives in one.
  setPitGrain(s.pitStep || 0);
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
  // them: the game does not take a body off a bed it used to have.
  S.benchLevel = Math.max(+s.benchLevel || 0, (s.quarriers ?? s.spelunkers ?? 0) - QUARRY_BENCH0);
  S.bedLevel = Math.max(+s.bedLevel || 0, (s.farmhands || 0) - FARM_BEDS0);
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
  S.magicLoo = !!s.magicLoo;
  S.scrubbers = s.scrubbers || 0;
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
  S.muck = Array.isArray(s.muck) ? s.muck.slice() : [];
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
  S.sparks = [];
  S.paying = null;
  S.paying = null;
  S.chip = Math.max(0, +s.chip || 0);
  S.hand = null;                 // a hand that settled before you closed the tab is old news
  // the lab's quarry multiplier answered to `cave` before the place was renamed
  if (s.mult) for (const k of Object.keys(S.mult)) S.mult[k] = s.mult[k] ?? (k === 'quarry' ? s.mult.cave : 0) ?? 0;
  if (Array.isArray(s.beds)) S.beds = s.beds.map(b => (+b || 0) / 100);
  // a ripe bed keeps the spore that grew on it, tone and all
  if (Array.isArray(s.bedTone)) S.bedTone = s.bedTone.map(v => +v || 0);
  resite();                    // the cut is as deep and the plot as wide as it was
  restoreCrew(s.who);          // the same people, where they were, with what they have done
  syncWorkers();               // and anybody the counts say is missing
  if (!Array.isArray(s.who)) wearKitOnLoad();   // an old save has no record of who wore what
  if (!S.introDone) startIntro();
  restoreGrid(floor, s.floor);
  if (!pitFromSave(s.pit)) pit.grid.fill(0);
  seedPitCores();
  S.coreBuried = boulderAlive() || !(s.coreLoose || S.heldCore);
}

// The crew, put back. Each body is made by its own factory -- so it has every
// field its job expects, whatever has changed since the save was written -- and
// then handed back the things that are *it* rather than its job.
function restoreCrew(who) {
  S.workers = [];
  if (!Array.isArray(who)) return;
  for (const k of who) {
    const make = FACTORY[k.type];
    if (!make) continue;
    S.workers.push(wearRecord(Object.assign(make(), newRecord()), k));
  }
}

export function reset() {
  clear();
  S.paused = false;                // a new game is not a held one
  showPanel(null);                 // nor one with the last game's board still up
  // the curtains are somebody's, and there is nobody here now
  S.shutters = [];
  S.shutterAt = 0;
  S.chips = [];
  S.paid = [];
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
  setPitGrain(0);
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
  S.spores = 0;
  S.seenSpore = false;
  S.farmOpen = false;
  S.farmhands = 0;
  S.labbers = 0;
  S.research = null;
  S.labDone = null;
  S.labLeft = 0;
  S.tendLevel = 0;
  S.bedLevel = 0;
  S.labOpen = false;
  S.labBoardOpen = false;
  S.casinoOpen = false;
  S.scrubOpen = false;
  S.towerOpen = false;
  S.outhouseOpen = false;
  S.magicLoo = false;
  S.scrubbers = 0;
  S.recycler = false;
  S.seenAir = false;
  S.haze = 0;
  S.raining = false;
  S.rains = 0;
  S.recycled = 0;
  S.scrubBank = 0;
  S.muck = [];
  seedSmog();
  S.casinoBoardOpen = false;
  S.pot = null;
  S.spinUntil = 0;
  S.sparks = [];
  S.falling = [];
  for (const k of Object.keys(S.mult)) S.mult[k] = 0;
  S.beds = [];
  S.bedTone = [];
  syncWorkers();
  resetRates();
  floor.grid.fill(0);
  pit.grid.fill(0);
  recount(pit);
  floor.painter.repaint();
  pit.painter.repaint();
  S.boulderNo = 1;
  S.introDone = false;
  S.reunionDone = false;
  S.buried = false;
  makeBoulder();
  S.boulder = S.boulder.map(row => row.map(() => 0));
  S.coreBuried = false;
  startIntro();                    // a reset is a game that has never been played
  buildShop();
  S.dirty = true;
  persist();
}

