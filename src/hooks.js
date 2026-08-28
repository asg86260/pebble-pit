// The handles on the game, for checks and for the dev panel.
//
// Everything here reaches into the yard and changes it: hire six people, dig the
// hole out, hand over a thousand dust, run twenty seconds of game in a few
// milliseconds. None of it is reachable while playing -- the shell hangs these
// on `window` under `__` names, and the dev panel and the checks call them from
// there -- and none of it draws or touches the page.
//
// They live here rather than in the shell because both tiers of checks need
// them: the browser suite calls `window.__crew`, and the node checks import
// `crew` from this file. One implementation, so a hook cannot mean two
// different things depending on which suite asked.

import { P, SHARD_CELL, SPORE_CELL, someFind, QUARRY_BENCH0, FARM_BEDS0 , tune } from './config.js';
import { S, floor, pit } from './state.js';
import { at, put, addGrain } from './grid.js';
import { blocked, resite, clampCam } from './world.js';
import { makeBoulder, rockSize, depthOf } from './rock.js';
import { bankDust, spend as spendFromPit, pitFull } from './pit.js';
import { spawnChip } from './dust.js';
import { SKY, pitTop as muckTopAt , fillSky } from './smog.js';
import { overPitMouth } from './world.js';
import { dropCore } from './core.js';
import { makeMeteor } from './meteor.js';
import { WIZ_BREW_MS } from './config.js';
import { now as clockNow } from './clock.js';
import { finish } from './lab.js';
import { syncWorkers } from './crew.js';
import { rebalance, assign as assignJob } from './upgrades.js';
import { buildShop, refresh } from './shop.js';
import { UPGRADES, buy as buyRow, rungOf, maxed } from './upgrades.js';
import { persist, restore, reset as resetGame } from './persist.js';
import { skipIntro } from './intro.js';
import { sendBirds, BIRDS } from './weather.js';
import { smogReport } from './smog.js';
import { advance } from './clock.js';
import { step } from './game.js';

// clear the yard: the dust lying about and anything the sites have given up and
// nobody has carried in. Both are 'what is lying around out there'.
export const clearFloor = () => {
  floor.grid.fill(0);
  floor.painter.repaint();
  S.dirty = true;
};

export const pile = (x, n) => { for (let i = 0; i < n; i++) addGrain(floor, x, blocked); S.dirty = true; };

export const jump = n => { S.boulderNo = n; S.coreItem = null; S.heldCore = false; makeBoulder(); S.dirty = true; };

export const preview = n => {
  const keep = S.boulderNo;
  S.boulderNo = n;
  const size = rockSize(), d = depthOf();
  S.boulderNo = keep;
  // a hill w by h, roughly half of that box filled, at about half the full depth
  return { boulder: n, depth: d, cells: size,
           approxRock: Math.round(size.w * size.h * 0.5 * d * 0.55) };
};

export const next = () => { S.boulder = S.boulder.map(row => row.map(() => 0)); S.chips = []; };

export const drop = () => { dropCore(); S.dirty = true; };

// a lot of birds now, rather than in a minute. It clears whatever was still up
// there first, so a check that asks for a flock gets that flock and not it plus
// the leavings of the last one.
export const birds = (fresh = true) => { if (fresh) BIRDS.length = 0; sendBirds(); return BIRDS.length; };

export const crew = (m = 0, h = 0, sp = 0, f = 0, lb = 0, wz = 0) => {   // hire straight off, for looking at things
  S.crew = m + h + sp + f + lb + wz;
  S.miners = m; S.quarriers = sp; S.farmhands = f; S.labbers = lb;
  // The sky holds one body per hat, so a hook asked for wizards is given the
  // hats to put them in -- the same way it is given benches for quarriers.
  S.wizardHats = Math.max(S.wizardHats, wz);
  S.wizards = wz;
  // Every job this hook does not take an argument for goes to nought. It says
  // what the whole crew is doing, so a count it leaves standing is a count from
  // whatever ran before it -- and bodies quietly disappear into a station the
  // caller never mentioned. That is exactly what happened when the scrubbing
  // house became a real job and this line did not know about it: two bodies a
  // check never asked for walked off to a building that was not even open, and
  // twenty checks further down the suite lost their haulers to it.
  S.scrubbers = 0;
  S.labLeft = 0;                  // the lab owes nobody after a wholesale reshuffle
  if (wz > 0) openMeteor();
  // The cut and the plot only hold so many, so a hook asked for four down the
  // quarry gets a quarry with four benches in it rather than two of the four
  // sent back to carrying dust.
  S.benchLevel = Math.max(S.benchLevel, sp - QUARRY_BENCH0);
  S.bedLevel = Math.max(S.bedLevel, f - FARM_BEDS0);
  resite();
  rebalance();                                      // and the rest carry dust
  if (sp > 0) S.quarryOpen = true;
  if (f > 0) S.farmOpen = true;
  if (S.crew) S.seenCore = true;
  syncWorkers(); buildShop(); S.dirty = true;
};

// dev: the tower's own two, without paying for either. `openMeteor` is what the
// row does -- the sky is opened and something is put in it -- and `wizardHat`
// is the tower finishing one this instant rather than in two minutes.
export const openMeteor = () => {
  S.towerOpen = true;
  S.meteorOpen = true;
  S.skyShown = true;
  S.seenCore = true;
  makeMeteor();
  buildShop();
  S.dirty = true;
};

// dev: put a hat on the go, so the bar and the lit windows can be looked at
// without waiting two minutes for one.
export const brewWizard = () => {
  openMeteor();
  S.brewAt = clockNow() + WIZ_BREW_MS;
  S.dirty = true;
  return Math.round(WIZ_BREW_MS / 1000);
};

export const wizardHat = (n = 1) => {
  openMeteor();
  S.wizardHats = Math.max(0, S.wizardHats + n);
  S.brewAt = 0;
  rebalance();
  syncWorkers();
  buildShop();
  S.dirty = true;
};

// dev: build the school and hand out trades without paying for them
export const school = (o = {}) => {
  S.schoolOpen = o.open ?? true;
  for (const k of ['breakers', 'carters', 'blasters', 'growers'])
    if (o[k] != null) S[k] = o[k];
  rebalance(); syncWorkers(); buildShop(); S.dirty = true;
};

// dev: move one body between jobs, the same way the board does
export const assign = (job, d = 1) => { assignJob(job, d); };

// dev: rebuild the boards, for a check that changed the game behind their back
export const rebuildBoards = () => { buildShop(); };

// dev: and fill the rows in. Building a board makes the row elements; the words
// and the prices in them are written by the frame loop while the board is open,
// so a check that wants to read a price off a row it never walked up to has to
// ask for them.
export const fillBoard = () => {
  buildShop();
  refresh(document.getElementById('shop'), UPGRADES, null);
};

// dev: put every bed back to bare earth. A bed nobody is working keeps its crop
// for ever, so a check that wants to watch one come ripe has to start from a
// farm that is not already standing full of somebody else's.
export const beds = () => {
  S.beds = S.beds.map(() => 0);
  S.bedTone = S.bedTone.map(() => 0);
  S.dirty = true;
};

export const levels = (o = {}) => {             // set upgrade levels, for weighing balance
  for (const k of ['pickLevel', 'speedLevel', 'carryLevel', 'minerSpeedLevel',
                   'minerPickLevel', 'haulCarryLevel', 'haulPaceLevel',
                   'quarryPaceLevel', 'tendLevel', 'benchLevel', 'bedLevel']) {
    if (k in o) S[k] = o[k];
  }
  resite(); rebalance(); syncWorkers();
  if (o.mult) for (const k of Object.keys(S.mult)) if (k in o.mult) S.mult[k] = o.mult[k];
  buildShop(); S.dirty = true;
};

// Put a body where you want it. Most of what a check waits for is a worker
// walking the length of the world, which proves nothing the walking tests do
// not already prove and costs half a minute a time.
// look somewhere, for a screenshot or a check that wants to see the far end
// Run the yard forward without waiting for it. Everything that asks the time
// asks the clock, so this is the same game running, just with the handle turned
// by hand: a check that wants to watch a worker walk two thousand pixels runs
// the steps instead of sitting through the seconds, and gets the same answer
// every time rather than one that depends on how fast the machine is.
// `hz` is what rate to pretend the machine is drawing at. It defaults to the
// sixty the game is tuned in, which is what every check has always used and
// what keeps them all measuring the same numbers -- but the whole point of the
// yard being on the clock rather than on the frame is that thirty and a hundred
// and twenty do the same amount of yard per second, and the only way to check
// that is to be able to ask for them.
export const fast = (seconds = 1, hz = 60) => {
  const frames = Math.max(1, Math.round(seconds * hz));
  const ms = 1000 / hz;
  for (let i = 0; i < frames; i++) {
    // the same shape as a real frame, held included: a check that presses space
    // should see what a player pressing space sees
    if (S.paused) continue;
    advance(ms);
    step();
  }
  S.dirty = true;
  return frames;
};

export const setAir = (o = {}) => {
  // A sky wound up from here was never climbed into, so it is filled in rather
  // than left for the crew to make -- see `fillSky`. In play nothing appears in
  // the band that did not go up there.
  if (o.haze != null) { S.haze = o.haze; fillSky(); }
  if (o.open != null) { S.scrubOpen = !!o.open; resite(); }
  if (o.recycler != null) S.recycler = !!o.recycler;
  if (o.scrubbers != null) { S.scrubbers = o.scrubbers; rebalance(); syncWorkers(); }
  if (o.muck != null) S.muck = new Array(floor.cols).fill(o.muck);
  if (o.rains != null) S.rains = o.rains;
  S.dirty = true;
  buildShop();
  return smogReport();
};

export const toss = (kind, x, y = S.groundY - 60) => {
  const v = { shard: SHARD_CELL, spore: SPORE_CELL }[kind];
  if (v) spawnChip(x, y, 0, 0, someFind(v));
};

// take a few grains off a pile, the way a sweep of the brush does
export const takeFromPile = (key, n) => {
  const p = S.piles.find(q => q.key === key);
  if (!p) return 0;
  let took = 0;
  for (let c = 0; c < floor.cols && took < n; c++) {
    const x = floor.x + c * P;
    if (x < p.from || x >= p.to) continue;
    for (let r = floor.rows - 1; r >= 0 && took < n; r--) {
      if (!at(floor, c, r)) continue;
      put(floor, c, r, 0);
      took++;
    }
  }
  S.dirty = true;
  return took;
};

export const placeBody = (type, x) => {
  const w = S.workers.find(o => o.type === type);
  if (w) { w.x = x; w.claim = -1; w.goal = 'seek'; }
  return !!w;
};

// dev: drop whatever the lab is working on. A group that starts research and
// walks away leaves every later lab row disabled, which reads as a broken test
// somewhere else entirely.
export const abandon = () => { S.research = null; buildShop(); S.dirty = true; };

// back to a new game, for a check that wants a known state
// dev: back to a game nobody has played. The opening is skipped unless it is
// the thing being looked at: five seconds of two squares talking in front of
// every check in the suite is five seconds of nothing being checked.
export const newGame = (intro = false) => { resetGame(); if (!intro) skipIntro(); };

// dev: come back to the game the way a page refresh does -- write what is here,
// then read it back into an empty yard. Nothing else in the checks can tell the
// difference between a reload and this.
// A page that has just been opened: the weather in flight is gone, because the
// module holding it came back empty, while the save on disk is untouched. The
// node yard keeps one module alive for a whole file, so without this a check
// about restoring the sky passes on motes that were simply never cleared.
export const coldSky = () => { SKY.length = 0; };

export const reload = () => { S.dirty = true; persist(); restore(); buildShop(); S.dirty = true; };

export const openLab = (open = true) => { S.labOpen = open; buildShop(); S.dirty = true; };

// dev: the shed, without paying for it -- for a look at what the crew do with it
export const openLoo = (open = true) => { S.outhouseOpen = open; buildShop(); S.dirty = true; };

// a piece of research finished, without the worker-seconds: a check about what a
// finished piece unlocks is not a check about how long it takes
export const finishResearch = key => {
  finish(key);
  buildShop();
  return { seenAir: S.seenAir, mult: { ...S.mult } };
};

export const grant = (o = {}) => {              // shards and spores, for looking at things
  if (o.shards) { S.shards += o.shards; S.seenShard = true; }
  if (o.spores) { S.spores += o.spores; S.seenSpore = true; }
  if (o.cores) { S.cores += o.cores; S.seenCore = true; }
  // Red, the same as the rest. It was the one currency this could not hand out,
  // which meant every check about spending it had to bank spark grains in the
  // hole by hand first -- and a dev hook that knows three of the four counters
  // is a hook you have to remember the exception to.
  if (o.sparks) { S.sparks += o.sparks; S.seenSpark = true; }
  buildShop(); S.dirty = true;
};

export const spendDust = n => { spendFromPit(Math.min(n, S.stored)); S.dirty = true; };

// The rows themselves, for a check about what a row *is* rather than about what
// the board looks like: how far up its ladder it is, whether it is finished, and
// whether pressing it does anything.
export const upgrades = () => UPGRADES;
export const buyRowByKey = key => {
  const u = UPGRADES.find(x => x.key === key);
  if (!u) return false;
  const was = rungOf(u);
  buyRow(u);
  return rungOf(u) > was;
};

// Press the pile, through the row on the board rather than around it: the price
// is taken, the row's own rules about whether it may be bought at all apply, and
// what a check exercises is the thing a player clicks.
export const press = () => {
  const row = UPGRADES.find(u => u.key === 'packpile');
  if (row) buyRow(row);
  return { grain: pit.p, step: S.pitStep, paid: S.pitFine || 0, sparks: S.sparks };
};

// what the pile actually looks like, sampled across the hole: dust arrives at
// the lip, so the shape of it is the shape of how it got there
export const pitProfile = (n = 20) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const c = Math.floor(i * (pit.cols - 1) / (n - 1));
    let h = 0;
    for (let r = pit.rows - 1; r >= 0; r--) if (at(pit, c, r)) { h = r + 1; break; }
    out.push(h);
  }
  return out;
};

// bank at the lip, the way a worker tips it in
// dev: dig the hole out, so a check does not have to buy it a row at a time
// The hole is the whole hole from the first frame, so there is nothing to dig.
// Kept as a no-op because the panel and a check or two still say the word.
export const dig = () => {};

// dev: turn one of the numbers the panel turns, from a check. Nature is every
// ten minutes a body now, which is right for playing and useless for a check
// that has to watch one happen -- so a check can wind it in rather than sitting
// through it.
export const tuneOne = (key, v) => tune(key, v);

export const tip = (n, shade = 4) => { for (let i = 0; i < n; i++) bankDust(pit.x + Math.random() * 40, shade); };

// dev: hand over dust, and dig the room to hold it. The hole turns dust away
// when it is full, which is the game working -- but a check that wants two
// thousand dust to spend on something else should not have to buy a pit first.
//
// It used to give up the first time a grain would not go in, and a grain is
// offered to a column picked at random -- so one full column ended the whole
// handout with the hole half empty, and a check asking for two thousand got a
// few hundred and then failed somewhere else entirely. A refusal now means fill
// along instead of throwing at random; only a hole that is genuinely full stops
// it. The column it reached is kept between grains, because starting the walk
// over for every one of them is six hundred tries a grain once the hole is
// nearly full.
export const give = (n, shade = 4) => {
  let got = 0, col = 0;
  for (let i = 0; i < n; i++) {
    if (bankDust(pit.x + Math.random() * pit.w, shade)) { got++; continue; }
    let placed = false, tried = 0;
    while (!placed && tried++ < pit.cols) {
      placed = bankDust(pit.x + col * pit.p, shade);
      col = (col + 1) % pit.cols;
    }
    if (!placed) break;                      // genuinely full: that is the hole working
    got++;
  }
  return got;
};

// --- the sky, the layer of muck, and where dust is lying ---------------------

// drop one of something where you like, for a check that wants to watch it land
// the sky, set where you want it: a rain is two hours of honest mining away, and
// a check should not have to do two hours of honest mining
export const skyX = () => SKY.map(m => m.x);

// What the climbing half of the sky is drawn at. There is no fading between a
// puff and a mote any more -- they are one object -- so this is a check that it
// stays that way: every speck in the air, climbing or not, is at full weight.
export const puffFades = () => SKY.filter(m => m.up).map(m => ({ d: false, f: +(m.fade ?? 1).toFixed(2) }));

export const skyFades = () => SKY.map(m => +(m.fade ?? 1).toFixed(2));

// anything at all in that column, at any height
const surfaceHas = c => { for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) return true; return false; };

// the leftmost and rightmost columns with anything in them, for a check about
// where dust is allowed to lie
export const dustSpan = () => {
  let lo = null, hi = null;
  for (let c = 0; c < floor.cols; c++) {
    if (!at(floor, c, 0) && !surfaceHas(c)) continue;
    if (lo === null) lo = c;
    hi = c;
  }
  return { lo: lo === null ? null : Math.round(floor.x + lo * P),
           hi: hi === null ? null : Math.round(floor.x + hi * P) };
};

// grains of ground dust lying over the mouth of the hole, which is a number
// that should always be nought: nothing rests on an opening. A dig widens the
// mouth under whatever was piled behind the far wall, and this is the check
// that the ground let go of it.
export const dustOverPit = () => {
  let n = 0;
  for (let c = 0; c < floor.cols; c++) {
    if (!overPitMouth(floor.x + c * P)) continue;
    for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  }
  return n;
};

export const skyJoin = () => SKY.map(m => +(m.eased ?? 1).toFixed(2));

export const skyXY = () => SKY.map(m => [Math.round(m.x), Math.round(m.y - S.camY)]);

// how much of the layer is lying over the mouth of the hole, which is the part
// nobody can walk onto
export const pitTop = wx => Math.round(muckTopAt(wx));

export const overPit = c => overPitMouth(c * P + P / 2);

// lay the layer by hand, column by column, for a check about one patch of it
export const muckSet = f => {
  const m = S.muck && S.muck.length ? S.muck : (S.muck = new Array(floor.cols).fill(0));
  for (let c = 0; c < m.length; c++) m[c] = f(c) || 0;
  S.dirty = true;
  return m.reduce((n, v) => n + v, 0);
};

export const muckOverPit = () => {
  const m = S.muck || [];
  let n = 0;
  for (let c = 0; c < m.length; c++) if (m[c] && overPitMouth(c * P + P / 2)) n += m[c];
  return n;
};

// look somewhere, for a screenshot or a check that wants to see the far end
export const look = x => { S.camX = x; S.camTo = null; clampCam(); S.dirty = true; return Math.round(S.camX); };
