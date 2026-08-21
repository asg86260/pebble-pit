// Reading and writing the game.
//
// The pit is stored as the height of every column plus how many grains of each
// shade there are, and the speckle is dealt out again on the way back in: what
// matters about a pile is its shape and its total, and a value per cell would be
// megabytes written every second.

import { P, CORE_CELL, SHADES, CORE_SIZE, FIND_SIZE } from './config.js';
import { load, save, clear } from './save.js';
import { S, floor, pit, bench } from './state.js';
import { at, put, count, countDust, fillFlat, addGrain, isDust } from './grid.js';
import { blocked } from './world.js';
import { gridToString, gridFromString, makeBoulder, boulderAlive, refreshRockTops } from './rock.js';
import { setPitGrain, seedPitCores, wirePit } from './pit.js';
import { syncWorkers } from './crew.js';
import { rebalance } from './upgrades.js';
import { isFind } from './finds.js';
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
    pitStep: S.pitStep,
    pickLevel: S.pickLevel,
    core: S.coreItem && !S.heldCore ? { x: S.coreItem.x, y: S.coreItem.y } : null,
    coreLoose: S.heldCore || !!S.coreItem,
    // what the sites have given up and nobody has carried in yet: it was never
    // counted, and a reload pocketing it would be the game taking it back
    finds: S.finds.filter(f => !f.counted)
                  .map(f => ({ v: f.v, x: Math.round(f.x) })),
    crew: S.crew,
    miners: S.miners,
    haulers: S.haulers,
    minerSpeedLevel: S.minerSpeedLevel,
    minerPickLevel: S.minerPickLevel,
    haulCarryLevel: S.haulCarryLevel,
    haulPaceLevel: S.haulPaceLevel,
    shards: S.shards,
    seenShard: S.seenShard,
    caveOpen: S.caveOpen,
    spelunkers: S.spelunkers,
    cavePaceLevel: S.cavePaceLevel,
    spores: S.spores,
    seenSpore: S.seenSpore,
    farmOpen: S.farmOpen,
    farmhands: S.farmhands,
    tendLevel: S.tendLevel,
    labOpen: S.labOpen,
    sparks: S.sparks,
    seenSpark: S.seenSpark,
    meteorOpen: S.meteorOpen,
    mult: { ...S.mult },
    beds: S.beds.map(b => Math.round(b * 100)),
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
    makeBoulder();
    S.stored = 0;
    S.banked = 0;
    S.shownStored = S.tweenFrom = S.tweenTo = 0;
    S.carryLevel = 0;
    S.speedLevel = 0;
    S.autoMine = false;
    S.crew = 0;
    S.finds = [];
    S.cores = 0;
    S.seenCore = false;
    S.seenBench = false;
    S.seenSects = [];
    S.pitStep = 0;
    S.pickLevel = 0;
    S.coreItem = null;
    S.miners = 0;
    S.haulers = 0;
    S.minerSpeedLevel = 0;
    S.minerPickLevel = 0;
    S.haulCarryLevel = 0;
    S.haulPaceLevel = 0;
    S.shards = 0;
    S.seenShard = false;
    S.caveOpen = false;
    S.spelunkers = 0;
    S.cavePaceLevel = 0;
    S.spores = 0;
    S.seenSpore = false;
    S.farmOpen = false;
    S.farmhands = 0;
    S.tendLevel = 0;
    S.labOpen = false;
    S.sparks = 0;
    S.seenSpark = false;
    S.meteorOpen = false;
    for (const k of Object.keys(S.mult)) S.mult[k] = 0;
    S.beds = [];
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
  setPitGrain(s.pitStep || 0);
  S.pickLevel = s.pickLevel || 0;
  if (s.coreLoose) {
    S.coreItem = s.core
      ? { x: s.core.x, y: s.core.y, vx: 0, vy: 0, rest: true }
      : { x: S.worldW * 0.2, y: S.groundY - CORE_SIZE, vx: 0, vy: 0, rest: false };
  }
  S.miners = s.miners || 0;
  S.spelunkers = s.spelunkers || 0;
  S.farmhands = s.farmhands || 0;
  // A save from before the crew was one pool has a headcount per job and no
  // total. Adding them up is the whole migration: the same bodies, on the same
  // jobs, and now they can be moved.
  S.finds = Array.isArray(s.finds)
    ? s.finds.filter(f => f && isFind(f.v))
             .map(f => ({ v: f.v, x: +f.x || 0, y: S.groundY - FIND_SIZE,
                          vx: 0, vy: 0, rest: false, counted: false }))
    : [];
  S.crew = s.crew ?? (s.miners || 0) + (s.haulers || 0) + (s.spelunkers || 0) + (s.farmhands || 0);
  rebalance();
  S.minerSpeedLevel = s.minerSpeedLevel || 0;
  // A save from when one pick row bought both keeps what its miners had.
  S.minerPickLevel = s.minerPickLevel ?? (s.pickLevel || 0);
  S.haulCarryLevel = s.haulCarryLevel || 0;
  S.haulPaceLevel = s.haulPaceLevel || 0;
  S.shards = s.shards || 0;
  S.seenShard = !!s.seenShard || S.shards > 0;
  S.caveOpen = !!s.caveOpen;
  S.spelunkers = s.spelunkers || 0;
  S.cavePaceLevel = s.cavePaceLevel || 0;
  S.spores = s.spores || 0;
  S.seenSpore = !!s.seenSpore || S.spores > 0;
  S.farmOpen = !!s.farmOpen;
  S.farmhands = s.farmhands || 0;
  S.tendLevel = s.tendLevel || 0;
  S.labOpen = !!s.labOpen;
  S.sparks = s.sparks || 0;
  S.seenSpark = !!s.seenSpark || S.sparks > 0;
  S.meteorOpen = !!s.meteorOpen;
  S.meteorAt = 0;
  if (s.mult) for (const k of Object.keys(S.mult)) S.mult[k] = s.mult[k] || 0;
  if (Array.isArray(s.beds)) S.beds = s.beds.map(b => (+b || 0) / 100);
  restoreGrid(floor, s.floor);
  if (!pitFromSave(s.pit)) pit.grid.fill(0);
  seedPitCores();
  S.coreBuried = boulderAlive() || !(s.coreLoose || S.heldCore);
}

export function reset() {
  clear();
  S.chips = [];
  S.paid = [];
  S.finds = [];
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
  setPitGrain(0);
  S.pickLevel = 0;
  S.coreItem = null;
  S.heldCore = false;
  S.miners = 0;
  S.haulers = 0;
  S.minerSpeedLevel = 0;
  S.minerPickLevel = 0;
  S.haulCarryLevel = 0;
  S.haulPaceLevel = 0;
  S.shards = 0;
  S.seenShard = false;
  S.caveOpen = false;
  S.spelunkers = 0;
  S.cavePaceLevel = 0;
  S.spores = 0;
  S.seenSpore = false;
  S.farmOpen = false;
  S.farmhands = 0;
  S.tendLevel = 0;
  S.labOpen = false;
  S.labBoardOpen = false;
  S.sparks = 0;
  S.seenSpark = false;
  S.meteorOpen = false;
  S.meteorAt = 0;
  S.falling = [];
  for (const k of Object.keys(S.mult)) S.mult[k] = 0;
  S.beds = [];
  syncWorkers();
  resetRates();
  floor.grid.fill(0);
  pit.grid.fill(0);
  floor.painter.repaint();
  pit.painter.repaint();
  S.boulderNo = 1;
  makeBoulder();
  buildShop();
  S.dirty = true;
  persist();
}

