// The handles on the game, for checks and for the dev panel. None of it is
// reachable while playing and none of it touches the page. Both tiers share
// this one implementation (the browser suite through `window.__`, the node
// checks by import), so a hook cannot mean two things.

import { routeReport, rockTop, ways, links } from './route.js';
import { SHAKE_TURNS, P, SHARD_CELL, SPORE_CELL, someFind, QUARRY_BENCH0, FARM_PLOTS0 , tune,
         QUARRY_BENCH_MAX, FARM_PLOTS_MAX, LADDER, ABYSS_AT } from './config.js';
import { S, BLANK, floor, pit, cut } from './state.js';
import { workOn, worksAt, abandonAt, start, stepWorks, SITES } from './works.js';
import { at, put, addGrain, recount } from './grid.js';
import { quarryCells, quarryTarget, digCell, dugShare } from './quarry.js';
import { blocked, resite, clampCam, benches, plotCount, rockLeft, resize, settleShack } from './world.js';
import { makeBoulder, clearBoulder, rockSize, depthOf, knockOff, rockTopY, restOnRock } from './rock.js';
import { bankDust, throughRift, spend as spendFromPit, pitTop as muckTopAt, pitRoom, seedPitCores } from './pit.js';
import { spawnChip } from './dust.js';
import { forceCrit } from './crit.js';
import { SKY, DROPS, fillSky, forceStrike, pinHeft, poopCols, moteX, moteY, clearSky , retally } from './smog.js';
import { overPitMouth } from './world.js';
import { dropCore } from './core.js';
import { makeMeteor } from './meteor.js';
import { WIZ_BREW_MS, WORKER } from './config.js';
import { seatRift } from './rift.js';
import { now as clockNow } from './clock.js';
import { syncWorkers, drop as dropHeld, lift as liftHeld, shakeHeld } from './crew.js';


import { rebalance, assign as assignJob } from './staffing.js';
import { kitCap } from './levels.js';
import { buildShop, refresh, revealed } from './shop.js';
import { machine, MACHINES } from './machines.js';
import { UPGRADES, lodgers, SECTIONS, buy as buyRow, billOf, take, HOUSE_ROW } from './upgrades.js';
import { rungOf, rungsOf, maxed } from './words.js';
import { gainText } from './words.js';
import { TOWER_UPGRADES, TOWER_SECTIONS } from './tower.js';
import { FILTER_UPGRADES, FILTER_SECTIONS } from './filter.js';
import { QUARRY_UPGRADES, QUARRY_SECTIONS } from './quarry.js';
import { skipCutscene } from './cutscene.js';
import { skipBeat } from './beats.js';
import { forceCoarse } from './prefs.js';
import { FARM_UPGRADES, FARM_SECTIONS } from './farm.js';
import { OUTHOUSE_UPGRADES, OUTHOUSE_SECTIONS } from './outhouse.js';
import { SHACK_SECTIONS, shackRows, shackSections } from './shack.js';
import { crewRows, crewSections } from './crewboard.js';
import { APOTHECARY_UPGRADES, setKeep, choosePotPrefer, setStock, setPotTonic, potBox,
         brewCost, TONICS, tonicShown } from './apothecary.js';
import { dealHand, binPay, potAt } from './casino.js';
import { LEVERS, leverAt, leverUnder, holdAt, dragArm, releaseArm, tapAt, signBox } from './levers.js';
import { holdArm, setThrottle, dropIt } from './casino.js';
import { setReadyLights, setFlashFace } from './config/casino.js';
import { persist, restore, reset as resetGame, switchSlot } from './persist.js';
import { skipIntro } from './intro.js';
import { holdSkip, skipScene } from './skip.js';
import { sendBirds, BIRDS } from './weather.js';
import { smogReport } from './smog.js';
import { advance, restart as restartClock } from './clock.js';
import { step, settleIntoWorld } from './game.js';
import { rand, seedRng, seed } from './rng.js';
import { verifyWorld, resetVerify } from './verify.js';
import { JOB, TYPE } from './jobs.js';
import { dustUnder, sweep, release } from './hands.js';
import { setTimesUrl, postTime, bootTimes } from './times.js';
import { surfaceY, colOf } from './grid.js';
import { showWindow } from './modal.js';

// --- the machines ---------------------------------------------------------------
// A machine's facts set outright. A check about *buying* one must use `__buy`
// and never this, or it asserts nothing about the gate or the kit.
export const machineSet = (which, o = {}) => {
  const m = machine(which);
  if (!m) return null;
  // There is no `on`: a machine runs when somebody is standing at it, so a
  // check that wants one stopped takes its tender off with `__assign`.
  if (o.bought != null) m.bought = !!o.bought;
  if (o.driven != null) m.driven = !!o.driven;
  rebalance();
  syncWorkers();
  buildShop();
  return { ...m };
};

// Every station given every slot it will ever have and a full set of hats,
// with the grounds' own ladders left at the foot: most checks want a full
// yard at pace nought. The rock's two ladders are topped here because the
// rock has no slots to fill and the ram has always been gated on them.
export const fullSites = () => {
  S.benchLevel = QUARRY_BENCH_MAX - QUARRY_BENCH0;
  S.plotLevel = FARM_PLOTS_MAX - FARM_PLOTS0;
  S.rockhandPickLevel = LADDER;
  S.rockhandSpeedLevel = LADDER;
  S.quarryOpen = true;
  S.farmOpen = true;
  S.breakers = Math.max(S.breakers, kitCap(JOB.ROCK));
  S.blasters = Math.max(S.blasters, kitCap(JOB.QUARRY));
  S.growers = Math.max(S.growers, kitCap(JOB.FARM));
  // The rock's own rows are sold at the shack.
  S.shackOpen = true;
  resite();
  rebalance();
  buildShop();
  return { benches: benches(), plots: plotCount(),
           pick: S.rockhandPickLevel, speed: S.rockhandSpeedLevel,
           breakers: S.breakers, blasters: S.blasters, growers: S.growers };
};

// `fullSites` and every ladder a machine is gated behind topped as well
// (`canBuy`): the jaw and the tiller on their boards. Kept apart from
// `fullSites` because a topped ore or crop ladder brims a pile in seconds,
// which is not the yard most checks mean to stand in.
export const machineGates = () => {
  fullSites();
  S.quarryPaceLevel = LADDER;
  S.seamLevel = LADDER;
  S.tendLevel = LADDER;
  S.cropLevel = LADDER;
  buildShop();
};

export const clearFloor = () => {
  floor.grid.fill(0);
  recount(floor);                          // the cells went, and not through `put`
  floor.painter.repaint();
};

export const pile = (x, n) => { for (let i = 0; i < n; i++) addGrain(floor, x, blocked); };

// The hut is settled rather than left to scoot: it walks out one rock at a
// time, and a jump is many rocks in one frame.
export const jump = n => { S.boulderNo = n; S.coreItem = null; S.heldCore = false; makeBoulder(); settleShack(); };

export const preview = n => {
  const keep = S.boulderNo;
  S.boulderNo = n;
  const size = rockSize(), d = depthOf();
  S.boulderNo = keep;
  // A hill w by h, roughly half of that box filled, at about half the depth.
  return { boulder: n, depth: d, cells: size,
           approxRock: Math.round(size.w * size.h * 0.5 * d * 0.55) };
};

export const next = () => { clearBoulder(); S.chips = []; };

export const drop = () => { dropCore(); };

// A flock now. Clears whatever was still up there first, so a check gets that
// flock and not the leavings of the last one.
export const birds = (fresh = true) => { if (fresh) BIRDS.length = 0; sendBirds(); return BIRDS.length; };

export const crew = (m = 0, h = 0, sp = 0, f = 0, lb = 0, wz = 0) => {   // hire straight off, for looking at things
  S.crew = m + h + sp + f + lb + wz;
  S.rockhands = m; S.quarriers = sp; S.farmhands = f; S.scholars = lb;
  // The sky holds one body per hat.
  S.wizardHats = Math.max(S.wizardHats, wz);
  S.wizards = wz;
  // Every job this hook takes no argument for goes to nought: it says what
  // the whole crew is doing, and a count left standing from whatever ran
  // before walks bodies off to a station the caller never mentioned.
  S.purifiers = 0;
  S.janitors = 0;
  // Every machine goes back in the box, for the same reason one level worse:
  // a machine left standing rewrites what the next `__crew(0, 0, 3)` is
  // allowed to mean.
  for (const m of MACHINES) {
    const r = machine(m.key);
    if (r) { r.bought = false; r.tookKit = false; }
  }
  S.lent = [];                    // and nobody is on loan: these counts are the whole crew
  if (wz > 0) openMeteor();
  // A hook asked for four down the quarry gets four benches, not two sent
  // back to carrying.
  S.benchLevel = Math.max(S.benchLevel, sp - QUARRY_BENCH0);
  S.plotLevel = Math.max(S.plotLevel, f - FARM_PLOTS0);
  // The places open BEFORE the crew are shared out, because sharing them out
  // is what reads the room.
  if (sp > 0) S.quarryOpen = true;
  if (f > 0) S.farmOpen = true;
  resite();
  rebalance();                                      // and the rest carry dust
  if (S.crew) S.seenCore = true;
  syncWorkers(); buildShop();
};

// The story put past a shield without raising it: each failed shield opens
// the next station (DESIGN.md, "The shields are the spine"). A check about a
// shield never touches this, or it asserts nothing about the row.
export const answered = (...kinds) => {
  for (const k of kinds) if (!S.shieldsDone.includes(k)) S.shieldsDone.push(k);
  buildShop();
  return [...S.shieldsDone];
};

// Straight to the end of the arc: torn, drowned, no gulp left to run. The
// hole tears on its own the first time it cannot take a grain (`throughRift`
// in pit.js), so a check about the rift would otherwise be a check about
// filling a hole.
export const openRift = () => {
  S.riftOpen = true;
  S.drowned = true;
  S.riftAte = Math.max(S.riftAte || 0, ABYSS_AT);
  S.seenFullPit = true;
  seatRift();                       // the disc's rect follows the era it was put in
};

// The torn era: `ate` positions the disc along its growth.
export const tearRift = (ate = 0) => {
  S.riftOpen = true;
  S.drowned = false;
  S.riftAte = Math.max(0, Math.round(ate));
  S.seenFullPit = true;
  seatRift();
};

export const openMeteor = () => {
  S.towerOpen = true;
  S.meteorOpen = true;
  S.skyShown = true;
  S.seenCore = true;
  makeMeteor();
  buildShop();
};

// A hat on the go, to look at. The work is the real one (same row, same
// site, same clock), started without paying.
export const brewWizard = () => {
  openMeteor();
  S.towerOpen = true;
  const u = everyRow().find(r => r.key === TYPE.WIZARD);
  if (u && !workOn(TYPE.WIZARD)) start(u.site, u, null);
  return Math.round(WIZ_BREW_MS / 1000);
};

export const wizardHat = (n = 1) => {
  openMeteor();
  S.wizardHats = Math.max(0, S.wizardHats + n);
  finishWorks();
  rebalance();
  syncWorkers();
  buildShop();
};

// The stations' kit without paying: the counts are the hats on the stands,
// and `stepKit` walks the bodies over. `learned` answers the three shields
// that open the kit rows (rows-kit.js).
export const kit = (o = {}) => {
  if (typeof o !== 'object') o = {};
  for (const k of ['breakers', 'carters', 'drivers', 'blasters', 'growers'])
    if (o[k] != null) S[k] = o[k];
  if (o.learned) {
    for (const k of ['props', 'net', 'arch'])
      if (!S.shieldsDone.includes(k)) S.shieldsDone.push(k);
    S.seenShard = true;
  }
  rebalance(); syncWorkers(); buildShop();
};

// Move one body between jobs the way the board does, opening the place
// first: the board can only send somebody to a station that is standing, and
// a shut quarry or farm holds nobody (`capOfBare`), so without this the move
// is refused.
const PLACE_OF = { quarriers: 'quarryOpen', farmhands: 'farmOpen' };
export const assign = (job, d = 1) => {
  if (d > 0 && PLACE_OF[job]) S[PLACE_OF[job]] = true;
  assignJob(job, d);
  // The roster's move does not rebuild the boards itself (staffing.js);
  // the board's own button does, so this does too.
  buildShop();
};

// Rebuild the boards, for a check that changed the game behind their back.
export const rebuildBoards = () => { buildShop(); };

// The words and prices in a row are written by the frame loop while the
// board is open, so a check reading a row it never walked up to asks here.
export const fillBoard = () => {
  buildShop();
  refresh(document.getElementById('shop'), UPGRADES, null);
};

// Every plot back to bare earth; a plot nobody is working keeps its crop for
// ever.
export const plots = () => {
  S.plots = S.plots.map(() => 0);
  S.plotTone = S.plotTone.map(() => 0);
};

export const levels = (o = {}) => {             // set upgrade levels, for weighing balance
  for (const k of ['pickLevel', 'speedLevel', 'carryLevel', 'rockhandSpeedLevel',
                   'rockhandPickLevel', 'haulCarryLevel', 'haulPaceLevel',
                   'liftLoadLevel', 'liftPaceLevel',
                   'quarryPaceLevel', 'tendLevel', 'benchLevel', 'plotLevel',
                   'cropLevel', 'seamLevel',
                   'wizSpeedLevel', 'wizPowerLevel', 'labKitLevel',
                   'powerLevel', 'riftLevel',
                   'critChanceLevel', 'critMultLevel', 'dosesLevel', 'lengthLevel',
                   'tossSpeedLevel', 'tossReachLevel']) {
    if (k in o) S[k] = o[k];
  }
  resite(); rebalance(); syncWorkers();
  buildShop();
};

// --- the rules, watched from the inside ---------------------------------------
// Whether `fast` checks the world's rules after every frame it turns. Off
// unless somebody asks; the node tier turns it on for every group
// (test/helpers.mjs). A flag rather than a wrapper because `fast` is the one
// door every check runs the yard through, and a rule only checked where
// somebody remembered to wrap the call is checked in the files that never
// broke it.
let verifying = false;
export const setVerify = (on = true) => { verifying = !!on; resetVerify(); return verifying; };

// Run the yard forward without waiting for it: the same game with the handle
// turned by hand, so a check gets the same answer every time. `hz` is the
// rate to pretend the machine is drawing at; thirty and a hundred and twenty
// should do the same amount of yard per second, and this is how to ask.
export const fast = (seconds = 1, hz = 60) => {
  const frames = Math.max(1, Math.round(seconds * hz));
  const ms = 1000 / hz;
  for (let i = 0; i < frames; i++) {
    // The same shape as a real frame, held included.
    if (S.paused) continue;
    advance(ms);
    step();
    // Throws on the frame a rule breaks, so the report names the frame.
    if (verifying) verifyWorld();
  }
  return frames;
};

export const setAir = (o = {}) => {
  // A sky wound up from here was never climbed into, so it is filled in
  // (`fillSky`); in play nothing appears in the band that did not go up there.
  if (o.haze != null) { S.haze = o.haze; fillSky(); }
  if (o.open != null) { S.filterOpen = !!o.open; resite(); }
  if (o.recycler != null) S.recycler = !!o.recycler;
  if (o.purifiers != null) { S.purifiers = o.purifiers; rebalance(); syncWorkers(); }
  if (o.janitors != null) { S.janitors = o.janitors; rebalance(); syncWorkers(); }
  if (o.muck != null) S.muck = new Array(floor.cols).fill(o.muck);
  if (o.rains != null) S.rains = o.rains;
  buildShop();
  return smogReport();
};

export const toss = (kind, x, y = S.groundY - 60) => {
  const v = { shard: SHARD_CELL, spore: SPORE_CELL }[kind];
  if (v) spawnChip(x, y, 0, 0, someFind(v));
};

// A few grains off a pile, the way a sweep of the brush does.
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
  return took;
};

export const placeBody = (type, x) => {
  const w = S.workers.find(o => o.type === type);
  if (w) { w.x = x; w.claim = -1; w.goal = 'seek'; }
  return !!w;
};

// A group that starts research and walks away leaves every later lab row
// disabled, which reads as a broken test somewhere else entirely.
export const abandon = () => { abandonAt('lab'); buildShop(); };

// Back to a game nobody has played, opening skipped unless it is the thing
// being looked at. `fresh` is off because this is what a check calls in the
// middle of a seeded run: a group that resets twice and compares the halves
// wants the same yard both times. A player's reset draws its own seed.
export const newGame = (intro = false, fresh = false) => {
  resetGame(fresh);
  if (!intro) skipIntro();
  // A yard the last group left held would stall this one: `fast` does
  // nothing held.
  S.paused = false;
  // The boards as the frame would have them by now (main.js drains the flag).
  buildShop();
};

// Say which run this is, and start it. A seed is a fact about a whole run,
// so this always clears the yard too; seeding one already standing gives a
// game half one run and half another. It boots in the order the page boots:
// the chance, the clock, the yard back to `BLANK` (`reset` alone leaves
// fields of the last run behind, invisible in play and fatal to a repeat),
// the world laid out over it (the weather is part of that, and a field left
// over from the last run wraps on the first frame and draws differently),
// then the new game.
export const seedGame = n => {
  seedRng(n);
  restartClock();
  for (const k of Object.keys(BLANK)) S[k] = structuredClone(BLANK[k]);
  resize(settleIntoWorld);
  newGame();
  // The view is not settled here: opening it on the rock is the page's line,
  // so the browser suite does it for itself (`newRun` in selftest/kit.js).
  return seed();
};

// A page just opened has the weather in flight gone, because the module
// holding it came back empty. The node yard keeps one module alive for a
// whole file, so without this a check about restoring the sky passes on
// motes that were never cleared.
export const coldSky = () => clearSky();

// The next front due now, at a heft the check chooses (a full storm unless
// it says). The roll, the marking and the brew are the game's own; the gap
// since the last shower is not waived.
export const front = (heft = 1) => { S.rainDue = 0; pinHeft(heft); };

// Come back to the game the way a page refresh does.
export const reload = () => { persist(); restore(); buildShop(); };

// A reload that is actually cold. `reload` is `persist()` then `restore()`
// in one process, so anything still standing in `S` survives into the load,
// which hides the *order* things are restored in (a machine still running in
// memory made `restore`'s rebalance clamp by accident). This blanks what a
// fresh page would not have and makes the save do the work.
export const coldReload = () => {
  persist();
  S.machines = null;
  restore();
  buildShop();
};


export const openLoo = (open = true) => { S.outhouseOpen = open; buildShop(); };

// For a check whose subject is what is on the shack's board rather than how
// it got there; the check that buys it goes through `unlockshack`.
export const openShack = (open = true) => { S.shackOpen = open; buildShop(); };

export const openCasino = (open = true) => { S.casinoOpen = open; buildShop(); };


// A tonic on a body, or in a stirrer's hand, for screenshots only; the real
// round is `stepStirrer`.
export const dose = (type = TYPE.ROCK, tonic = 'stew') => {
  const w = S.workers.find(b => b.type === type);
  if (!w) return false;
  if (type === TYPE.STIR) {
    w.holding = 1; w.goal = 'out';
    w.dealTo = S.workers.find(b => b.type !== TYPE.STIR) || null;
  } else {
    // Added to whatever it already carries, so two calls give a body under
    // both tonics.
    w.doses = [...(w.doses || []).filter(d => d.tonic !== tonic),
               { tonic, until: clockNow() + 999999 }];
  }
  return true;
};

// The investment beat three boards wait on (the casino's row in stations.js).
// The boulder is set directly rather than through `jump`, which would make a
// new rock under a check that may be standing on one.
export const invest = () => {
  S.farmOpen = true;
  S.quarryOpen = true;
  S.boulderNo = Math.max(2, S.boulderNo);
  buildShop();
};

export const grant = (o = {}) => {              // shards and spores, for looking at things
  if (o.shards) { S.shards += o.shards; S.seenShard = true; }
  if (o.spores) { S.spores += o.spores; S.seenSpore = true; }
  if (o.cores) { S.cores += o.cores; S.seenCore = true; }
  if (o.sparks) { S.sparks += o.sparks; S.seenSpark = true; }
  // Every counter is a *pile*, not a number: the coin you own is the coin
  // lying in the hole, so the cells move with the counter. `seedPitCores`
  // lays down what the hole will take and sends the rest through the rift.
  if (o.shards || o.spores || o.cores || o.sparks) seedPitCores();
  // Dust through `give`, for the same reason, and whatever the hole will not
  // take through the rift, where it goes in play: a check about an endless
  // ladder needs more dust than a hole holds.
  if (o.dust) {
    // Only as many grains as the hole could take are offered: `give` banks
    // one at a time, so a million is a million tries on a full hole. Room in
    // the *pile*, not the dust account, since a granted core takes a cell.
    // The pile's own answer is the last word (the count credits a few cells
    // the search cannot fill), and a refusal tears the rift for real, with
    // the cutscene over every scene on a rich yard; a grant is a handout, so
    // the event is dropped the way a save drops it and the rift is simply
    // open.
    const room = pitRoom();
    const gulp = S.riftGulp || 0;
    const got = room > 0 ? give(Math.min(o.dust, room)) : 0;
    if ((S.riftGulp || 0) > gulp) { S.riftGulp = gulp; S.riftShake = 0; }
    const over = o.dust - got;
    if (over > 0) { S.riftOpen = true; S.rift = (S.rift || 0) + over; S.stored += over; }
  }
  buildShop();
};

export const spendDust = n => { spendFromPit(Math.min(n, S.stored)); };

// Whatever the yard is building, standing this instant. A check about what a
// purchase does must still buy it and wait (`buyBuilt` in the checks); this
// is the shortcut for scenes.
export const finishWorks = () => {
  const done = [];
  // Every work at every site, not the front one at each.
  for (const site of SITES) {
    for (const w of worksAt(site)) {
    done.push(w.key);
    // Through the ordinary runner, so a finished work does exactly what a
    // finished work does.
    w.done = w.of;
    }
  }
  // Only the front of each site's line lands in a step, so it is stepped
  // until nothing filled-in is left standing.
  for (let guard = 0; guard < 99 && SITES.some(site => worksAt(site).some(w => w.done >= w.of)); guard++) stepWorks(0);
  buildShop();
  return done;
};

// The bench's rows raw, rows the board is not showing included.
export const upgrades = () => UPGRADES;

// Take one row's key out of every section, to prove a board still draws it.
// `null` puts them all back.
let unsectioned = null;
export const unsection = key => {
  const all = [SECTIONS, TOWER_SECTIONS,
               FILTER_SECTIONS, QUARRY_SECTIONS, FARM_SECTIONS, OUTHOUSE_SECTIONS,
               SHACK_SECTIONS];
  if (unsectioned) {
    for (const [sect, keys] of unsectioned) sect.keys = keys;
    unsectioned = null;
  }
  if (!key) { buildShop(); return true; }
  unsectioned = [];
  let found = false;
  for (const list of all) for (const sect of list) {
    if (!sect.keys.includes(key)) continue;
    unsectioned.push([sect, sect.keys]);
    sect.keys = sect.keys.filter(k => k !== key);
    found = true;
  }
  buildShop();
  return found;
};

// Every board as its rows and its section key-lists, so a check can ask
// whether the two agree; they are two separate edits.
export const boards = () => [
  // What the bench actually draws: a row names its sheet with `board` and the
  // bench takes the rest, the same question `listFor` in board.js asks.
  { name: 'bench',  keys: UPGRADES.filter(u => !u.board).map(u => u.key),
                                                          sections: SECTIONS.map(x => x.keys) },
  { name: 'house',  keys: crewRows().map(u => u.key),      sections: crewSections().map(x => x.keys) },
  { name: 'tower',  keys: TOWER_UPGRADES.map(u => u.key),  sections: TOWER_SECTIONS.map(x => x.keys) },
  { name: 'filter',  keys: FILTER_UPGRADES.map(u => u.key),  sections: FILTER_SECTIONS.map(x => x.keys) },
  // With the kit row lodging on each (`lodgers` in upgrades.js).
  { name: 'quarry', keys: [...QUARRY_UPGRADES, ...lodgers('quarry')].map(u => u.key), sections: QUARRY_SECTIONS.map(x => x.keys) },
  { name: 'farm',   keys: [...FARM_UPGRADES, ...lodgers('farm')].map(u => u.key),   sections: FARM_SECTIONS.map(x => x.keys) },
  { name: 'outhouse', keys: OUTHOUSE_UPGRADES.map(u => u.key), sections: OUTHOUSE_SECTIONS.map(x => x.keys) },
  // The shack's rows are objects in UPGRADES above; what is checked is that
  // they are on this sheet and off that one.
  { name: 'shack',  keys: shackRows().map(u => u.key),    sections: shackSections().map(x => x.keys) }
];

// The boards are built first, as the frame would have by the time a player
// looked: a row the sim's last step raised (`S.shopStale`) is on them here.
export const allRows = () => { buildShop(); return everyRow().map(u => ({
  key: u.key,
  name: u.name,
  // Through the same gate a board uses, not `show` on its own: a row whose
  // reveal has not fired is a row no board would draw (`revealed`).
  shown: !!revealed(u),
  gain: gainText(u),
  // Where the row stands on its ladder, and whether it is finished. A row with
  // no ladder is 0 of 0 and never done. Reported because checks were asking
  // `row.done` and getting `undefined`, which passes whatever the board says.
  rung: rungOf(u),
  rungs: u.rung ? rungsOf(u) : 0,
  done: maxed(u),
  // What the card says it is waiting on instead of a price (`coinNeeds`).
  waits: u.waits?.() || '',
  // A job row, a dial and a payout row have no price, and `billOf` would
  // throw asking.
  bill: (u.bill || u.cost) ? billOf(u).map(([money, n]) => [money, n]) : []
})); };
// Every row anywhere, for `buyRowByKey`: a check presses the row itself,
// prices and rules and dead states and all. A board missing from this list
// answers `false`, and a check written against it passes by asserting
// nothing.
const everyRow = () => [...UPGRADES, ...TOWER_UPGRADES,
                        ...OUTHOUSE_UPGRADES,
                        ...FILTER_UPGRADES,
                        ...QUARRY_UPGRADES, ...FARM_UPGRADES,
                        ...APOTHECARY_UPGRADES,
                        // On the crew board, not the bench.
                        HOUSE_ROW];

// Every bill a row will ever ask, by climbing it: the price now, then after
// each rung is taken outright (`u.buy()`, the finish, not the work). The
// house has no rung and climbs on the crew count, so it is walked a room at
// a time. Rows with no price come back empty; the clock is left off. Leaves
// the yard climbed: reset after.
export const climbRow = (u, read, limit = 40) => {
  if (!(u.bill || u.cost)) return;
  if (u.key === 'house') { for (let i = 0; i < 16; i++) { read(S.crew); S.crew++; } return; }
  if (!u.rung) { read(0); return; }
  for (let i = 0; i < limit && !maxed(u); i++) {
    const at = rungOf(u);
    read(at + 1);
    u.buy();
    if (rungOf(u) === at) break;     // a buy that did not climb: a decision, not a rung
  }
};
export const climbedBills = () => everyRow().map(u => {
  const bills = [];
  try { climbRow(u, () => bills.push(billOf(u).filter(([money]) => money !== 'time'))); }
  catch (e) { bills.push([['error', String(e.message || e)]]); }
  return { key: u.key, bills };
});

export const buyRowByKey = key => {
  const u = everyRow().find(x => x.key === key);
  if (!u) return false;
  // Did it fire? Four ways a row can say so: a ladder's rung goes up, a row
  // that buys a thing leaves the board, a station's own row moves the figure
  // it reports, and a row that is built rather than had starts a work.
  const was = rungOf(u);
  const from = u.from ? u.from() : null;
  const showed = u.show();
  const wasOn = !!workOn(u.key);
  // ...and a fifth: a decision row that stays on its board and goes dead --
  // the casino's let-go opens the floor and stands there grey until the hand
  // is settled, which is the one sign it fired.
  const wasDead = !!u.dead?.();
  buyRow(u);
  // The boards as a tap leaves them (shop.js drains the flag on the press),
  // so a check that presses then reads sees the next rung.
  buildShop();
  return rungOf(u) > was
      || (u.from && u.from() !== from)
      || (showed && !u.show())
      || (!wasOn && !!workOn(u.key))
      || (!wasDead && !!u.dead?.());
};


// Everything bought, through `buyRowByKey`, walked again until a whole pass
// buys nothing (a row that only appears once another has gone is reached on
// the next pass). The casino is left alone: a chip is a wager. `grant` first.
// Returns every key pressed, in order.
//
// `endless` is the cap for a row with no top at all. There is one kind left,
// the rift's throughput; the machines' tuning ladders used to be the others
// and now end at `MACHINE_TUNE_RUNGS`, where `maxed` stops them like any
// other row. Bottomless rows go last, or they drink every spark before the
// jaw is reached.
export const everything = (endless = LADDER, passes = 8) => {
  const bought = [];
  const bottomless = u => u.kind === 'rung' && !u.rung;
  const rows = everyRow().filter(u => u.bill || u.cost);
  const order = [...rows.filter(u => !bottomless(u)), ...rows.filter(bottomless)];
  for (let p = 0; p < passes; p++) {
    let any = false;
    for (const u of order) {
      const cap = bottomless(u) ? endless - bought.filter(k => k === u.key).length : 64;
      for (let i = 0; i < cap && revealed(u) && !maxed(u); i++) {
        if (!buyRowByKey(u.key)) break;
        finishWorks();
        bought.push(u.key); any = true;
      }
    }
    if (!any) break;
  }
  buildShop();
  return bought;
};

// The pile's shape, sampled across the hole.
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

// The hole is the whole hole from the first frame, so there is nothing to
// dig; a no-op because the panel and a check or two still say the word.
export const dig = () => {};

// The cut dug out by n cells a column, through `digCell` (the same function
// a quarrier's swing calls), so the rock in the cut's grid comes out with it.
export const digCut = (n = 1) => {
  const cells = quarryCells();
  for (let c = 0; c < cells.length; c++)
    for (let i = 0; i < n && cells[c] < quarryTarget(c); i++) digCell(c);
  return dugShare();
};

// Dust straight into the cut, the way a chip falling through the mouth would.
export const pileCut = (x, n = 1) => { for (let i = 0; i < n; i++) addGrain(cut, x); };

// Dust straight on the hill, the way a chip coming down over the crest does
// (`rockSand` in rock.js).
export const pileRock = (x, n = 1) => {
  let put = 0;
  for (let i = 0; i < n; i++) if (restOnRock(x, 3 + (i % 3))) put++;
  return put;
};

// One swing of the player's own, through the very call `input.js` makes, so
// a check can measure a swing rather than read a number off the report.
export const swing = (n = 1) => {
  const before = countRock();
  for (let i = 0; i < n; i++) {
    const x = rockLeft() + P * 2;
    knockOff(x, rockTopY(x) + P * 2, undefined, false);
  }
  return before - countRock();
};
const countRock = () => S.boulder.flat().reduce((a, b) => a + b, 0);

// Turn one of the numbers the panel turns, from a check.
export const tuneOne = (key, v) => tune(key, v);

// Bank at the lip the way a worker tips it in; once the hole has said no, the
// rest goes straight through the rift, for the reason `give` gives below.
export const tip = (n, shade = 4) => {
  let full = false;
  for (let i = 0; i < n; i++) {
    const x = pit.x + rand() * 40;
    if (full) { throughRift(x, shade); continue; }
    const held = pit.n;
    bankDust(x, shade);
    if (pit.n === held) full = true;
  }
};

// Hand over dust. A grain is offered to a column at random, so a refusal
// means fill along instead; the column reached is kept between grains,
// because restarting the walk is six hundred tries a grain on a nearly full
// hole. Once the hole has said no the rest goes straight through the rift:
// `bankDust` on a full hole searches every column first, and a check handing
// over two million dust paid that search two million times.
export const give = (n, shade = 4) => {
  let got = 0, col = 0, full = false;
  for (let i = 0; i < n; i++) {
    if (full) { if (throughRift(pit.x + rand() * pit.w, shade)) got++; continue; }
    const held = pit.n;
    if (bankDust(pit.x + rand() * pit.w, shade)) {
      got++;
      if (pit.n === held) full = true;       // it went through the rift, not into the hole
      continue;
    }
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

export const skyX = () => SKY.map(moteX);
// where every drop in the air is, for a check about the sheet
export const dropXs = () => DROPS.map(d => d.x);

// A puff and a mote are one object, so every speck in the air, climbing or
// not, is at full weight; this is the check that it stays that way.
export const puffFades = () => SKY.filter(m => m.up).map(m => ({ d: false, f: +(m.fade ?? 1).toFixed(2) }));

export const skyFades = () => SKY.map(m => +(m.fade ?? 1).toFixed(2));

const surfaceHas = c => { for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) return true; return false; };

// The leftmost and rightmost columns with anything in them.
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

// Ground dust lying over the mouth of the hole, which should always be
// nought: nothing rests on an opening.
export const dustOverPit = () => {
  let n = 0;
  for (let c = 0; c < floor.cols; c++) {
    if (!overPitMouth(floor.x + c * P)) continue;
    for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  }
  return n;
};

export const skyJoin = () => SKY.map(m => +(m.eased ?? 1).toFixed(2));

export const skyXY = () => SKY.map(m => [Math.round(moteX(m)), Math.round(moteY(m) - S.camY)]);

export const pitTop = wx => Math.round(muckTopAt(wx));

export const overPit = c => overPitMouth(c * P + P / 2);

// The layer laid by hand, column by column.
export const muckSet = f => {
  const m = S.muck && S.muck.length ? S.muck : (S.muck = new Array(floor.cols).fill(0));
  for (let c = 0; c < m.length; c++) m[c] = f(c) || 0;
  retally();                       // an in-place write between frames: see smog.js
  return m.reduce((n, v) => n + v, 0);
};

// Shake somebody without a pointer, for the yard checks; the browser suite
// waggles a real cursor.
export const shake = (i = 0) => {
  const w = S.workers[i];
  if (!w) return null;
  w.lifted = true;
  // Waggled through the same function a cursor drives, so the load comes out
  // turn by turn; setting `shook` by hand skips exactly that.
  const had = w.carry | 0;
  for (let i = 0; i <= SHAKE_TURNS; i++) shakeHeld(w, i % 2 ? 6 : -6);
  const shed = had - (w.carry | 0);
  dropHeld(w);
  return { hatOff: !!w.hatOff, shed, spill: w.spill | 0, dizzyFor: w.dizzyFor | 0 };
};

// Hold a body over a spot through the real lift, for looking at the
// assignment ring; a scene cannot drive a right-button drag.
export const hold = (i = 0, x = 0, y = 0) => {
  const w = S.workers[i];
  if (!w) return false;
  liftHeld(w);
  w.inside = false;                // out of whatever door it was behind; a hook may
  w.x = x - WORKER / 2;
  w.y = y - WORKER / 2;
  S.mouse.x = x;
  S.mouse.y = y;
  return true;
};

export const poopSet = f => {
  const q = poopCols();
  for (let c = 0; c < q.length; c++) q[c] = f(c) || 0;
  retally();                       // same in-place write, same stale memo
  return q.reduce((n, v) => n + v, 0);
};

export const muckOverPit = () => {
  const m = S.muck || [];
  let n = 0;
  for (let c = 0; c < m.length; c++) if (m[c] && overPitMouth(c * P + P / 2)) n += m[c];
  return n;
};

// Look somewhere, for a screenshot.
export const look = x => { S.camX = x; S.camTo = null; clampCam(); return Math.round(S.camX); };

// --- getting about ------------------------------------------------------------
// How a body would get from where it is to a place, in words: a route is
// worked out before anybody takes a step, so a check reads it rather than
// watching a walk and guessing.
export const routeOf = (i, toX) => {
  const w = S.workers[i];
  return w ? routeReport(w, toX) : null;
};

// The highest thing there is to stand on at a place, whichever way it
// belongs to (route.js).
export const surfaceAt = wx => Math.round(rockTop(wx));

// Every way there is, and every link between them.
export const waysNow = () => {
  const all = ways();
  return { ways: Object.keys(all), links: links(all).map(l => ({ name: l.name, x: Math.round(l.x), a: l.a, b: l.b })) };
};


// --- the handles ---------------------------------------------------------------
// Every way in, under the name the checks call it by, as one table that both
// suites spread; a hook in one suite and not the other fails a check in a way
// that has nothing to do with what it is checking.
export const HANDLES = {
  // a window (modal.js) by kind, or null to close it
  __window: kind => showWindow(kind),
  __clearFloor: clearFloor, __pile: pile, __jump: jump,
  __preview: preview, __next: next, __drop: drop,
  __birds: birds, __crew: crew, __kit: kit,
  __assign: assign, __build: rebuildBoards, __fill: fillBoard, __tune: tuneOne, __plots: plots,
  __levels: levels, __fast: fast, __verify: setVerify, __air: setAir, __coldSky: coldSky,
  __strike: forceStrike,
  __dropXs: dropXs,
  // The next front brought forward, at a heft: the roll itself is the game's.
  __front: front,
  // The crit roll forced: true always crits, false never, null rolls for real
  // (crit.js).
  __crit: forceCrit,
  __toss: toss, __take: takeFromPile, __place: placeBody,
  __abandon: abandon, __reset: newGame, __seed: seedGame, __reload: reload,
  __slot: switchSlot,
  __machine: machineSet, __fullSites: fullSites, __machineGates: machineGates,
  __swing: swing, __cold: coldReload,
  __rows: allRows, __climbed: climbedBills, __boards: boards, __unsection: unsection,
  __invest: invest, __grant: grant, __dose: dose,
  __spend: spendDust,
  // Pay a price through the very function every row's bill goes through, for
  // a check about *how* the payment is taken (the hole first, the rift after).
  __pay: take,
  __upgrades: upgrades, __buy: buyRowByKey, __pitProfile: pitProfile, __dig: dig,
  __digCut: digCut, __pileCut: pileCut, __pileRock: pileRock,
  __tip: tip, __give: give, __finish: finishWorks, __everything: everything,
  __dustUnder: dustUnder,          // is a press here a sweep or a look about
  // End whatever scene is running. A press while a cutscene is on screen
  // skips the scene and does nothing else, so a check that banks money (which
  // can tear the rift, which plays a scene) and then presses a control is
  // really testing the skip.
  __nocine: skipCutscene,
  // A phone stood up for a scene or a check, without writing the preference.
  __coarse: forceCoarse,
  // The space bar: held down or let go, and the skip it ends in.
  __holdSkip: holdSkip, __skip: skipScene,
  // One owner's beat cut, the way its own click would (the sheet's button, a
  // click on a cutscene): the yard's, the camera's or the sheet's.
  __skipBeat: owner => skipBeat(clockNow(), owner),
  // The board of times: a check points the yard at a stub server, posts the
  // rescue the way the ending sheet's button does, and says when it boots.
  __timesUrl: setTimesUrl, __postTime: postTime, __bootTimes: bootTimes,
  __skyX: skyX, __puffFades: puffFades, __skyFades: skyFades,
  __dustSpan: dustSpan, __dustOverPit: dustOverPit, __skyJoin: skyJoin, __skyXY: skyXY,
  __pitTop: pitTop, __overPit: overPit, __muckSet: muckSet, __poopSet: poopSet, __shake: shake,
  __meteor: openMeteor, __answered: answered, __rift: openRift, __tear: tearRift, __wizardHat: wizardHat,
  __loo: openLoo, __shack: openShack, __brew: brewWizard, __casino: openCasino,
  // The arm held and let go, and the sign tapped: the same calls the
  // pointer makes. `__holdArm(true)` starts the pour and `__holdArm(false)`
  // ends it; `__tapSign()` drops the stake; each answers false when the
  // control is dead. `__holdAt` and `__tapAt` are the hit tests, by point.
  __holdArm: (on, throttle = 1) => holdArm(!!on, throttle),
  __throttle: t => { setThrottle(t); return S.throttle; },
  __tapSign: () => dropIt(),
  __holdAt: (x, y) => holdAt(x, y),
  __dragAt: (x, y) => dragArm(x, y),
  __releaseArm: () => releaseArm(),
  __tapAt: (x, y) => tapAt(x, y),
  __leverAt: key => { const l = LEVERS.find(x => x.key === key); return l ? leverAt(l) : null; },
  __leverUnder: (x, y) => leverUnder(x, y)?.key || null,
  __signAt: () => { const b = signBox(); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; },
  // the sign's look for a scene: the ready lights, and the flash's face held
  __readyLights: how => setReadyLights(how),
  __signFace: f => setFlashFace(f),
  // The sweep, one step in from the pointer: what a press-and-drag does at a
  // point and what letting go there does, the same two calls input.js makes.
  __sweep: (x, y) => { sweep(x, y); return S.held; },
  __let: (x, y) => { release(x, y); },
  __rim: () => ({ x: potAt().x, y: potAt().y - P * 3 }),
  // the pointer, for a scene that wants the cursor somewhere
  __mouseAt: (x, y) => { S.mouse.x = x; S.mouse.y = y; },
  // The table stood up the way the scenes and the checks want it: open, with
  // dust in the hole; the arm held until the stake is this many, let go and
  // the pour settled; a hand played through to the pay run out. Each waits
  // on the sand.
  __casinoStakes: (dust = 6000) => {
    newGame(); openCasino(true); give(dust); rebuildBoards();
  },
  __casinoStake: (stake = 100) => {
    if (!S.casinoOpen) { newGame(); openCasino(true); give(6000); rebuildBoards(); }
    holdArm(true);
    for (let f = 0; f < 60 * 60 && S.holding && (!S.pot || S.pot.stake < stake); f++) fast(1 / 60);
    holdArm(false);
    for (let f = 0; f < 60 * 30 && S.pouring; f++) fast(1 / 60);
    return S.pot ? S.pot.stake : 0;
  },
  __casinoHand: () => {
    const dropped = dropIt();
    for (let f = 0; f < 60 * 60 && (S.drop || S.pouring); f++) fast(1 / 60);
    return dropped;
  },
  // a hand dealt off the rng without the sim -- the bins each grain of a
  // handful lands in and what they pay on this stake -- for the check that
  // measures the spread two thousand hands at a time
  __deal: (stake = 1000) => dealHand(stake),
  // and what one bin pays for the pebbles in it, by kind
  __binPay: (b, pebbles, worth) => binPay(b, pebbles, worth),
  // Setting the pot the way the board does: clicking a tonic row calls its
  // `set`, the keep/one-off dial its toggle, the favor dial its step. These are
  // the same functions the pointer calls, so a check that sets the pot this way
  // sets it the way a player does.
  //
  // Except the tonic, which is no longer set from a board at all: the brew is
  // picked at the pot now (potpick.js), and a DOM popover is not something the
  // node tier can press. So this calls the same toggle the picker's own
  // machinery does, and it is setup rather than the route -- the route is proved
  // by the browser check that clicks a cauldron and then a swatch. The pot is
  // named as well as the tonic, the first one when nobody says, which is what
  // every caller written before the pots came apart meant.
  __pot: (key, pot = 0) => {
    if (!S.apothecaryOpen || pot < 0 || pot >= S.apothPots) return false;
    setPotTonic(pot, key);
    return true;
  },
  // What is standing on a shelf, set outright; that a batch reaches the shelf
  // is proved by brewing.
  __stock: (key, n) => setStock(key, n),
  // Batches behind the place, set outright: three rows are revealed by the
  // count. `__potSpot` answers for a pot the yard does not have, but the
  // picker asks `S.apothPots` and ignores a point outside it, so a check that
  // wants two cauldrons has to actually get the second one.
  __brews: n => { S.brews = n; buildShop(); return true; },
  // The recipes there are, from the place that decides it (a constant copied
  // into a check only proves two people copied it). `shown` matters: a shard
  // recipe stays off the list until the quarry opens.
  __tonics: () => TONICS.map(t => ({ key: t.key, shown: tonicShown(t) })),
  // Where a cauldron stands, in world pixels, for a check that wants to click
  // one.
  __potSpot: i => potBox(i),
  // What a batch costs, straight off the thing that charges for it.
  __brewCost: key => brewCost(key),
  __potKeep: keep => { setKeep(keep); return true; },
  __potPrefer: (job, pot = 0) => { choosePotPrefer(pot, job); return true; },
  __muckOverPit: muckOverPit, __look: look, __hold: hold,
  __route: routeOf, __surface: surfaceAt, __ways: waysNow
};

// The motion preference: `true` asks for less, `false` for the full picture,
// `null` to follow the system. Answers with what the camera will actually do.
import { setPref, reducedMotion } from './prefs.js';
HANDLES.__motion = v => { setPref('motion', v); return reducedMotion(); };
