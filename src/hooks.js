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

import { routeReport, rockTop, ways, links } from './route.js';
import { SHAKE_TURNS, P, SHARD_CELL, SPORE_CELL, someFind, QUARRY_BENCH0, FARM_PLOTS0 , tune,
         QUARRY_BENCH_MAX, FARM_PLOTS_MAX, ROCKHAND_RUNGS, RUNGS, ABYSS_AT } from './config.js';
import { S, BLANK, floor, pit, cut } from './state.js';
import { workOn, workAt, worksAt, abandonAt, start, stepWorks, SITES } from './works.js';
import { at, put, addGrain, recount } from './grid.js';
import { quarryCells, quarryTarget, digCell, dugShare } from './quarry.js';
import { blocked, resite, clampCam, benches, plotCount, rockLeft, resize } from './world.js';
import { makeBoulder, clearBoulder, rockSize, depthOf, knockOff, rockTopY, restOnRock } from './rock.js';
import { bankDust, spend as spendFromPit, pitFull, pitTop as muckTopAt,
         pitCapacity, inHole, seedPitCores } from './pit.js';
import { spawnChip } from './dust.js';
import { forceCrit } from './crit.js';
import { SKY, fillSky, poopCols, moteX, moteY, clearSky , retally } from './smog.js';
import { overPitMouth } from './world.js';
import { dropCore } from './core.js';
import { makeMeteor } from './meteor.js';
import { WIZ_BREW_MS, WORKER } from './config.js';
import { seatRift } from './rift.js';
import { now as clockNow } from './clock.js';
import { finish } from './mult.js';
import { syncWorkers, drop as dropHeld, lift as liftHeld, shakeHeld } from './crew.js';
import { rosterReport, rosterHit } from './roster.js';
import { JOB_MACHINE } from './machines.js';
import { rebalance, assign as assignJob, restaff, kitCap } from './upgrades.js';
import { buildShop, refresh } from './shop.js';
import { machine, MACHINES } from './machines.js';
import { UPGRADES, SECTIONS, buy as buyRow, rungOf, maxed, billOf, take, HOUSE_ROW } from './upgrades.js';
import { TOWER_UPGRADES, TOWER_SECTIONS } from './tower.js';
import { SCHOOL_UPGRADES, SCHOOL_SECTIONS } from './school.js';
import { SCRUB_UPGRADES, SCRUB_SECTIONS } from './scrubhouse.js';
import { QUARRY_UPGRADES, QUARRY_SECTIONS } from './quarry.js';
import { skipCutscene } from './cutscene.js';
import { FARM_UPGRADES, FARM_SECTIONS } from './farm.js';
import { OUTHOUSE_UPGRADES, OUTHOUSE_SECTIONS } from './outhouse.js';
import { BUILDBENCH_UPGRADES, BUILDBENCH_SECTIONS } from './upgrades/rows-buildbench.js';
import { crewRows, crewSections } from './crewboard.js';
import { APOTHECARY_UPGRADES, setKeep, setPrefer, setStock, setPotTonic, potBox,
         brewCost, TONICS, tonicShown } from './apothecary.js';
import { CASINO_UPGRADES } from './casino.js';
import { persist, restore, reset as resetGame } from './persist.js';
import { skipIntro } from './intro.js';
import { sendBirds, BIRDS } from './weather.js';
import { smogReport } from './smog.js';
import { advance, restart as restartClock } from './clock.js';
import { step, settleIntoWorld } from './game.js';
import { rand, seedRng, seed } from './rng.js';
import { verifyWorld, resetVerify } from './verify.js';
import { JOB, TYPE } from './jobs.js';

// clear the yard: the dust lying about and anything the sites have given up and
// nobody has carried in. Both are 'what is lying around out there'.
// --- the machines ---------------------------------------------------------------
// Set a machine's facts outright, for a check that wants one standing without
// paying for it first. A check about *buying* one must use `__buy` and never
// this, or it asserts nothing about the gate or the kit.
export const machineSet = (which, o = {}) => {
  const m = machine(which);
  if (!m) return null;
  // Buying and unbuying, and nothing else. There is no `on`: a machine runs when
  // somebody is standing at it, so a check that wants one stopped takes its
  // tender off with `__assign` -- through the same button a player would use.
  if (o.bought != null) m.bought = !!o.bought;
  if (o.driven != null) m.driven = !!o.driven;
  rebalance();
  syncWorkers();
  buildShop();
  S.dirty = true;
  return { ...m };
};

// Every station given every slot it will ever have, which is what the machines
// are gated behind. A check that wants to buy one should not have to know that
// the numbers are five and seven.
export const fullSites = () => {
  S.benchLevel = QUARRY_BENCH_MAX - QUARRY_BENCH0;
  S.plotLevel = FARM_PLOTS_MAX - FARM_PLOTS0;
  S.rockhandPickLevel = ROCKHAND_RUNGS;
  S.rockhandSpeedLevel = RUNGS;
  S.quarryOpen = true;
  S.farmOpen = true;
  // And a full set of specialists, which is the other half of what a machine is
  // gated behind. A check that wants a machine should not have to know that the
  // hats are called breakers, blasters and growers -- nor how many make a set,
  // which is `kitCap` and is a smaller number than the complement now.
  S.breakers = Math.max(S.breakers, kitCap(JOB.ROCK));
  S.blasters = Math.max(S.blasters, kitCap(JOB.QUARRY));
  S.growers = Math.max(S.growers, kitCap(JOB.FARM));
  S.schoolOpen = true;
  resite();
  rebalance();
  buildShop();
  S.dirty = true;
  return { benches: benches(), plots: plotCount(),
           pick: S.rockhandPickLevel, speed: S.rockhandSpeedLevel,
           breakers: S.breakers, blasters: S.blasters, growers: S.growers };
};

export const clearFloor = () => {
  floor.grid.fill(0);
  recount(floor);                          // the cells went, and not through `put`
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

export const next = () => { clearBoulder(); S.chips = []; };

export const drop = () => { dropCore(); S.dirty = true; };

// a lot of birds now, rather than in a minute. It clears whatever was still up
// there first, so a check that asks for a flock gets that flock and not it plus
// the leavings of the last one.
export const birds = (fresh = true) => { if (fresh) BIRDS.length = 0; sendBirds(); return BIRDS.length; };

export const crew = (m = 0, h = 0, sp = 0, f = 0, lb = 0, wz = 0) => {   // hire straight off, for looking at things
  S.crew = m + h + sp + f + lb + wz;
  S.rockhands = m; S.quarriers = sp; S.farmhands = f; S.scholars = lb;
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
  S.purifiers = 0;
  S.janitors = 0;
  // And every machine goes back in the box. This is the same trap as the
  // purifiers above, one level worse: a machine left standing by whatever ran
  // before does not merely move bodies about, it rewrites what the next
  // `__crew(0, 0, 3)` is *allowed* to mean -- three quarriers asked for, one
  // machine's worth permitted, and two of them quietly carrying dust while a
  // check swears it staffed the cut.
  for (const m of MACHINES) {
    const r = machine(m.key);
    if (r) { r.bought = false; r.tookKit = false; }
  }
  S.labLeft = 0;                  // the lab owes nobody after a wholesale reshuffle
  S.lent = [];                    // and nobody is on loan: these counts are the whole crew
  if (wz > 0) openMeteor();
  // The quarry and the plot only hold so many, so a hook asked for four down the
  // quarry gets a quarry with four benches in it rather than two of the four
  // sent back to carrying dust.
  S.benchLevel = Math.max(S.benchLevel, sp - QUARRY_BENCH0);
  S.plotLevel = Math.max(S.plotLevel, f - FARM_PLOTS0);
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
// dev: tear the hole open, without filling it first.
//
// There is no row that summons one any more -- the hole collapses on its own the
// first time it cannot take a grain (see `throughRift` in pit.js) -- so a check
// about what the rift DOES would otherwise have to bank two hundred thousand
// dust to get one, which is a check about filling a hole.
// Straight to the end of the arc: torn, fed past the threshold and drowned,
// with no gulp left to run -- the state every endgame check and scene means.
export const openRift = () => {
  S.riftOpen = true;
  S.drowned = true;
  S.riftAte = Math.max(S.riftAte || 0, ABYSS_AT);
  S.seenFullPit = true;
  seatRift();                       // the disc's rect follows the era it was put in
  S.dirty = true;
};

// And the middle of it: the torn era, the disc hanging and growing. `ate`
// positions it along its growth without waiting for a million grains.
export const tearRift = (ate = 0) => {
  S.riftOpen = true;
  S.drowned = false;
  S.riftAte = Math.max(0, Math.round(ate));
  S.seenFullPit = true;
  seatRift();
  S.dirty = true;
};

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
  S.towerOpen = true;
  // Put the work on directly rather than through the shop: what this hook is
  // for is a hat part way along to look at, and making a check bank three
  // currencies first would be a check about paying rather than about brewing.
  // The work itself is the real one -- same row, same site, same clock.
  const u = everyRow().find(r => r.key === TYPE.WIZARD);
  if (u && !workOn(TYPE.WIZARD)) start(u.site, u, null);
  S.dirty = true;
  return Math.round(WIZ_BREW_MS / 1000);
};

export const wizardHat = (n = 1) => {
  openMeteor();
  S.wizardHats = Math.max(0, S.wizardHats + n);
  finishWorks();
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

// dev: put every plot back to bare earth. A plot nobody is working keeps its crop
// for ever, so a check that wants to watch one come ripe has to start from a
// farm that is not already standing full of somebody else's.
export const plots = () => {
  S.plots = S.plots.map(() => 0);
  S.plotTone = S.plotTone.map(() => 0);
  S.dirty = true;
};

export const levels = (o = {}) => {             // set upgrade levels, for weighing balance
  for (const k of ['pickLevel', 'speedLevel', 'carryLevel', 'rockhandSpeedLevel',
                   'rockhandPickLevel', 'haulCarryLevel', 'haulPaceLevel',
                   'quarryPaceLevel', 'tendLevel', 'benchLevel', 'plotLevel',
                   'wizSpeedLevel', 'wizPowerLevel', 'labKitLevel',
                   'harnessLevel', 'bootsLevel', 'fanLevel', 'riftLevel',
                   'critChanceLevel', 'critMultLevel']) {
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
// --- the rules, watched from the inside ---------------------------------------
// Whether `fast` checks the world's rules after every frame it turns. Off, and
// off for good, unless somebody asks: play never asks, nothing in main.js
// reaches this, and the browser suite does not set it either. The node tier
// turns it on for every group (see test/helpers.mjs), which is what makes every
// check in it a watcher for every rule in verify.js.
//
// It is a flag rather than a wrapper because `fast` is the one door every check
// runs the yard through, and a rule that is only checked when somebody
// remembered to wrap the call is a rule that is checked in the files that never
// broke it.
let verifying = false;
export const setVerify = (on = true) => { verifying = !!on; resetVerify(); return verifying; };

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
    // and then the rules, if anybody has asked for them. See verify.js: this one
    // line is what turns every check in the suite into a watcher for every rule
    // there, and it throws on the frame a rule breaks rather than at the end of
    // the run, so the report names the frame instead of the scenario.
    if (verifying) verifyWorld();
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
  if (o.purifiers != null) { S.purifiers = o.purifiers; rebalance(); syncWorkers(); }
  if (o.janitors != null) { S.janitors = o.janitors; rebalance(); syncWorkers(); }
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
export const abandon = () => { abandonAt('lab'); buildShop(); S.dirty = true; };

// back to a new game, for a check that wants a known state
// dev: back to a game nobody has played. The opening is skipped unless it is
// the thing being looked at: five seconds of two squares talking in front of
// every check in the suite is five seconds of nothing being checked.
// `fresh` says whether this is a new *run* as well as a new game, and here it is
// off. That is not an oversight. A player's reset draws a seed of its own -- it
// is a new run, and `reset` in persist.js does it for the button in the yard --
// but this is the hook, and the hook is what a check calls in the middle of a
// seeded run. A group that resets twice and compares the two halves is asking
// for the same yard both times; drawing a fresh seed under it hands it two
// different ones and there is nothing it can conclude. So a reset through here
// clears the game and keeps the run.
export const newGame = (intro = false, fresh = false) => {
  resetGame(fresh);
  if (!intro) skipIntro();
};

// Say which run this is, and start it.
//
// A seed is a fact about a whole run, not a setting you can change halfway
// through one: the yard already standing when the seed arrives was built out of
// the old chance, so seeding without clearing it gives a game that is half one
// run and half another, and asking for the same seed again does not give it
// back. So this does both, always, and there is deliberately no way to do only
// the first. Hand it a number, get a yard that will do exactly what it did the
// last time that number was handed over.
// What it does is boot the game again, in the order the page boots it: the
// chance from the seed, the clock from nothing, the yard back to what state.js
// declares (see `BLANK` there -- `reset` alone leaves a dozen fields of the last
// run behind, which is invisible in play and fatal to a repeat), the world laid
// out over it, and then the new game. The weather is part of laying the world
// out, and has to be: the drifting field of motes remembers which camera it last
// slid from, so a field left over from the last run wraps end to end on the
// first frame of this one and a hundred and fifty draws go by that did not go by
// before.
export const seedGame = n => {
  seedRng(n);
  restartClock();
  for (const k of Object.keys(BLANK)) S[k] = structuredClone(BLANK[k]);
  resize(settleIntoWorld);
  newGame();
  // Where the view is left is deliberately not settled here. Restoring BLANK
  // puts the camera back to nought, which is right for a yard nobody is looking
  // at -- the node tier draws nothing and never asks -- but wrong for a page,
  // where the last line of main.js's boot opens the view on the rock. That line
  // belongs to the page rather than to the game, so the browser suite does it
  // for itself (see `newRun` in selftest/kit.js) and this stays the game booting.
  return seed();
};

// dev: come back to the game the way a page refresh does -- write what is here,
// then read it back into an empty yard. Nothing else in the checks can tell the
// difference between a reload and this.
// A page that has just been opened: the weather in flight is gone, because the
// module holding it came back empty, while the save on disk is untouched. The
// node yard keeps one module alive for a whole file, so without this a check
// about restoring the sky passes on motes that were simply never cleared.
export const coldSky = () => clearSky();

export const reload = () => { S.dirty = true; persist(); restore(); buildShop(); S.dirty = true; };

// A reload that is actually cold.
//
// `reload` above is `persist()` then `restore()` in one process, so anything
// still standing in `S` survives into the load. That is fine for what it was
// for and useless for checking the *order* things are restored in: a machine
// still running in memory made `restore`'s rebalance clamp by accident, and hid
// the fact that the records were being laid down thirty-seven lines after it.
//
// So this blanks what a fresh page would not have, and makes the save do the
// work. It is a dev hook rather than a path the game takes, which is why it can
// afford to reach into S like this.
export const coldReload = () => {
  persist();
  S.machines = null;
  restore();
  buildShop();
  S.dirty = true;
};


// dev: the trestle up, without paying for it.
//
// It replaced `__lab`, and the checks that called that one now call this: what
// they wanted was the multiplier rows on a board, and the construction bench is
// what gates them since the lab went. See DESIGN.md, "The lab is deleted".
export const openBuildBench = (open = true) => { S.buildbenchOpen = open; buildShop(); S.dirty = true; };

// dev: the shed, without paying for it -- for a look at what the crew do with it
export const openLoo = (open = true) => { S.outhouseOpen = open; buildShop(); S.dirty = true; };

// dev: the table, without the twenty cores it costs -- for a check about the
// wheel, which is not a check about how the building gets built
export const openCasino = (open = true) => { S.casinoOpen = open; buildShop(); S.dirty = true; };

// a piece of research finished, without the worker-seconds: a check about what a
// finished piece unlocks is not a check about how long it takes
// dev: land a piece of research without the worker-seconds -- or, with no key,
// clear the bench of whatever is on it. Both go through the works, because the
// bench a piece is on is works.js's business now and a hook that reached past it
// would be setting up a yard the game cannot get to.
export const finishResearch = key => {
  if (key == null) { while (abandonAt('lab')) ; }
  else { abandonAt('lab', key); finish(key); }
  buildShop();
  S.dirty = true;
  return { seenAir: S.seenAir, mult: { ...S.mult } };
};

// dev: put a tonic on a body -- a dose on a worker to look at the buff mark, or a
// dose in a stirrer's hand to look at it being carried. For screenshots only; the
// real round is `stepStirrer`.
export const dose = (type = TYPE.ROCK, tonic = 'stew') => {
  const w = S.workers.find(b => b.type === type);
  if (!w) return false;
  if (type === TYPE.STIR) {
    w.holding = 1; w.goal = 'out';
    w.dealTo = S.workers.find(b => b.type !== TYPE.STIR) || null;
  } else {
    // Added to whatever it already carries, the way a dealt one is, so that
    // `__dose(...)` twice with two tonics gives you a body under both -- which
    // is the state worth looking at.
    w.doses = [...(w.doses || []).filter(d => d.tonic !== tonic),
               { tonic, until: clockNow() + 999999 }];
  }
  S.dirty = true;
  return true;
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
  // And the grains that go with them. Every one of these counters is a *pile*
  // and not a number, exactly as dust is -- the coin you own is the coin lying
  // in the hole -- so a handout that moved the counter and not the cells was
  // the game's central rule broken by its own dev hook, for four coins out of
  // five. `seedPitCores` lays down what the hole will take and sends the rest
  // through the rift, which is where it would have gone in play.
  if (o.shards || o.spores || o.cores || o.sparks) seedPitCores();
  // And dust, which is now the fifth counter and the one every row asks for --
  // see `billOf` in upgrades.js. The note above about knowing three of the four
  // applies twice over: a check granting shards to buy a shard row got a row it
  // still could not afford, and failed as "the row did nothing".
  //
  // Through `give` rather than by adding to `S.stored`, because dust is the one
  // currency that is a *pile* and not a number: the counter and the grains in
  // the hole are the same fact, and a handout that moved one without the other
  // would be the game's central rule broken by its own dev hook.
  //
  // And whatever the hole will not take goes through the rift, exactly where it
  // goes in play. Without this a hook asked for two hundred thousand dust handed
  // over 37,566 of it and no word about the rest -- the hole is the ceiling on
  // the *pile*, and it stopped being the ceiling on what you own the day the
  // rift was torn. A check about an endless ladder needs more dust than a hole
  // holds, which is the whole point of the ladder.
  if (o.dust) {
    // Only as many grains as the hole could possibly take are offered to it:
    // `give` banks one at a time, so handing it a million is a million tries for
    // a hole that stopped taking any after thirty-seven thousand.
    const room = Math.max(0, pitCapacity() - inHole());
    const got = room > 0 ? give(Math.min(o.dust, room)) : 0;
    const over = o.dust - got;
    if (over > 0) { S.riftOpen = true; S.rift = (S.rift || 0) + over; S.stored += over; }
  }
  buildShop(); S.dirty = true;
};

export const spendDust = n => { spendFromPit(Math.min(n, S.stored)); S.dirty = true; };

// dev: whatever the yard is in the middle of building, standing this instant.
//
// Everything past the bench is built rather than had (see works.js), and a
// *scene* is a picture of a yard rather than a run of one -- `tools/look.mjs`
// wants the jaw on the floor of the cut, not six minutes of quarriers digging
// towards it. A check about what a purchase does must still buy it and wait,
// which is what `buyBuilt` in the checks is for; this is the shortcut, and it is
// deliberately a separate word so the two can never be confused.
export const finishWorks = () => {
  const done = [];
  // Every work at every site, not the front one at each: a lab with two benches
  // has two on the go, and a hook that finished one of them would leave a check
  // waiting on the other with no way to say so.
  for (const site of SITES) {
    for (const w of worksAt(site)) {
    done.push(w.key);
    // Through the ordinary runner, so a finished work does exactly what a
    // finished work does: the row's own `buy`, the mark, and the yard re-staffed.
    w.done = w.of;
    }
  }
  stepWorks(0);
  buildShop(); S.dirty = true;
  return done;
};

// The rows themselves, for a check about what a row *is* rather than about what
// the board looks like: how far up its ladder it is, whether it is finished, and
// whether pressing it does anything.
export const upgrades = () => UPGRADES;

// Every row on every board, with whether it is actually being offered and what
// it costs. `upgrades` above hands back the bench's array raw -- rows the board
// is not showing included -- which is fine for what it was for and useless for
// asking "is this row on offer yet", which is the whole of what a gate is.
// Every board, as its rows and its section key-lists, so a check can ask whether
// the two agree. They are two separate edits and only one of them is where the
// row is written, which is how five rows came to exist on no board at all.
// Take one row's key out of every section, to prove a board still draws it.
// `null` puts them all back. Only a check ever calls this.
let unsectioned = null;
export const unsection = key => {
  const all = [SECTIONS, TOWER_SECTIONS, SCHOOL_SECTIONS,
               SCRUB_SECTIONS, QUARRY_SECTIONS, FARM_SECTIONS, OUTHOUSE_SECTIONS];
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

export const boards = () => [
  // What the bench actually draws: everything that has not moved to a board of
  // its own. A row names its sheet with `board` and the bench takes the rest --
  // the same question `listFor` in board.js asks. Asking `UPGRADES` flat here
  // would report the crew's gear and the trestle's ladders as bench rows nobody
  // had given a heading to, which is the opposite of what happened to them.
  { name: 'bench',  keys: UPGRADES.filter(u => !u.board).map(u => u.key),
                                                          sections: SECTIONS.map(x => x.keys) },
  { name: 'house',  keys: crewRows().map(u => u.key),      sections: crewSections().map(x => x.keys) },
  { name: 'buildbench', keys: BUILDBENCH_UPGRADES.map(u => u.key),
                                                          sections: BUILDBENCH_SECTIONS.map(x => x.keys) },
  { name: 'tower',  keys: TOWER_UPGRADES.map(u => u.key),  sections: TOWER_SECTIONS.map(x => x.keys) },
  { name: 'school', keys: SCHOOL_UPGRADES.map(u => u.key), sections: SCHOOL_SECTIONS.map(x => x.keys) },
  { name: 'scrub',  keys: SCRUB_UPGRADES.map(u => u.key),  sections: SCRUB_SECTIONS.map(x => x.keys) },
  { name: 'quarry', keys: QUARRY_UPGRADES.map(u => u.key), sections: QUARRY_SECTIONS.map(x => x.keys) },
  { name: 'farm',   keys: FARM_UPGRADES.map(u => u.key),   sections: FARM_SECTIONS.map(x => x.keys) },
  { name: 'outhouse', keys: OUTHOUSE_UPGRADES.map(u => u.key), sections: OUTHOUSE_SECTIONS.map(x => x.keys) }
];

export const allRows = () => everyRow().map(u => ({
  key: u.key,
  name: u.name,
  shown: !!u.show(),
  // Not every row has a price. A job row moves bodies, a dial sets a number and
  // a payout row hands something over -- `billOf` would ask all three what they
  // cost and get an exception.
  bill: (u.bill || u.cost) ? billOf(u).map(([money, n]) => [money, n]) : []
}));
// Any board's rows, not just the bench's. A check that wants to press the row
// that raises a wizard should press *that row*, prices and rules and all, rather
// than reach past it for the dev handle that sets the flag the row would have
// set -- which is how a check ends up agreeing with a shortcut instead of with
// the game.
// Every row anywhere, for `buyRowByKey`. The two *station* boards were missing
// from this list -- so `__buy('quarrybench')` answered `false`, and a check
// written against it would have passed by asserting nothing at all. They are the
// boards the machines' own rows live on, so it is fixed before there is a
// machine to get it wrong.
// The casino's rows are in here too, for the same reason the station boards
// were added: a check that wants to put a chip down should put it down through
// the row that puts it down, prices and rules and dead states and all.
const everyRow = () => [...UPGRADES, ...TOWER_UPGRADES, ...BUILDBENCH_UPGRADES,
                        // The outhouse board's own rows -- `unlockouthouse`
                        // itself is a bench row in UPGRADES above -- and
                        // `__buy('loopost')` has to keep reaching them or every
                        // check that buys a janitor the player's way goes
                        // quietly false.
                        ...OUTHOUSE_UPGRADES,
                        ...SCHOOL_UPGRADES, ...SCRUB_UPGRADES,
                        ...QUARRY_UPGRADES, ...FARM_UPGRADES,
                        ...APOTHECARY_UPGRADES,
                        ...CASINO_UPGRADES,
                        // The house lives on the crew board, not the bench,
                        // and is otherwise the one row in the game a check
                        // could not buy the way a player does.
                        HOUSE_ROW];

export const buyRowByKey = key => {
  const u = everyRow().find(x => x.key === key);
  if (!u) return false;
  // Did it fire? Three ways a row can say so, because there are three shapes of
  // row. A ladder says so by its rung going up. A row that buys a *thing* says so
  // by leaving the board. And a station's own rows -- a bench, a plot -- do
  // neither: they stay put and there is no rung, and what moves is the figure
  // they report. That last case used to answer `false` however well it had
  // worked, so a check could take a bench out of the quarry and be told nothing
  // had happened.
  const was = rungOf(u);
  const from = u.from ? u.from() : null;
  const showed = u.show();
  // ...and a fourth, since everything past the bench is built rather than had:
  // paying starts a work and nothing else moves until it lands, so the press
  // that started it has plainly done something. Without this a check that buys a
  // bench is told nothing happened, on the frame the cut started digging it.
  const wasOn = !!workOn(u.key);
  buyRow(u);
  return rungOf(u) > was
      || (u.from && u.from() !== from)
      || (showed && !u.show())
      || (!wasOn && !!workOn(u.key));
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

// dev: dig the cut out by n cells a column, evenly, so a check can put a body
// (or a grain) at the bottom of a working quarry without hiring a gang and
// waiting on the swing. Goes through `digCell`, the same function a quarrier's
// own swing calls, so the rock in the cut's grid comes out with it.
export const digCut = (n = 1) => {
  const cells = quarryCells();
  for (let c = 0; c < cells.length; c++)
    for (let i = 0; i < n && cells[c] < quarryTarget(c); i++) digCell(c);
  S.dirty = true;
  return dugShare();
};

// dev: drop dust straight into the cut, the way a chip falling through the
// mouth would, without waiting on a throw to land.
export const pileCut = (x, n = 1) => { for (let i = 0; i < n; i++) addGrain(cut, x); S.dirty = true; };

// dev: lay dust straight on the hill, the way a chip coming down over the crest
// does, without waiting on the throw. The rock is ground now -- see `rockSand`
// in rock.js -- and this is how a check or a scene puts something on it.
export const pileRock = (x, n = 1) => {
  let put = 0;
  for (let i = 0; i < n; i++) if (restOnRock(x, 3 + (i % 3))) put++;
  S.dirty = true;
  return put;
};

// One swing of the player's own, through the very call `input.js` makes when you
// click the hill. It exists so a check can prove the thing DESIGN.md says twice
// -- that a machine on the rock replaces the crew's hands and never yours -- by
// measuring a swing rather than by reading a number off the report and comparing
// it with itself.
export const swing = (n = 1) => {
  const before = countRock();
  for (let i = 0; i < n; i++) {
    const x = rockLeft() + P * 2;
    knockOff(x, rockTopY(x) + P * 2, undefined, false);
  }
  S.dirty = true;
  return before - countRock();
};
const countRock = () => S.boulder.flat().reduce((a, b) => a + b, 0);

// dev: turn one of the numbers the panel turns, from a check. Nature is every
// ten minutes a body now, which is right for playing and useless for a check
// that has to watch one happen -- so a check can wind it in rather than sitting
// through it.
export const tuneOne = (key, v) => tune(key, v);

export const tip = (n, shade = 4) => { for (let i = 0; i < n; i++) bankDust(pit.x + rand() * 40, shade); };

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
    if (bankDust(pit.x + rand() * pit.w, shade)) { got++; continue; }
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
export const skyX = () => SKY.map(moteX);

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

export const skyXY = () => SKY.map(m => [Math.round(moteX(m)), Math.round(moteY(m) - S.camY)]);

// how much of the layer is lying over the mouth of the hole, which is the part
// nobody can walk onto
export const pitTop = wx => Math.round(muckTopAt(wx));

export const overPit = c => overPitMouth(c * P + P / 2);

// lay the layer by hand, column by column, for a check about one patch of it
export const muckSet = f => {
  const m = S.muck && S.muck.length ? S.muck : (S.muck = new Array(floor.cols).fill(0));
  for (let c = 0; c < m.length; c++) m[c] = f(c) || 0;
  retally();                       // an in-place write between frames: see smog.js
  S.dirty = true;
  return m.reduce((n, v) => n + v, 0);
};

// The other kind of mess, laid by hand. There was a way to set the weather's
// muck and no way at all to set what a body left, which meant the one condition
// that tells the two apart -- a yard whose only remaining mess is poop, with
// nobody to shovel it -- could not be built by a check.
// Shake somebody, without a pointer. The browser suite waggles a real cursor,
// which is the honest test of the gesture; this is for the yard checks, which
// care about what a shaking DOES rather than about how it is performed.
export const shake = (i = 0) => {
  const w = S.workers[i];
  if (!w) return null;
  w.lifted = true;
  // Waggled for real, through the same function a cursor drives, so what a check
  // sees is what a shaking actually does -- the load coming out turn by turn
  // included. Setting `shook` by hand skipped exactly that.
  const had = w.carry | 0;
  for (let i = 0; i <= SHAKE_TURNS; i++) shakeHeld(w, i % 2 ? 6 : -6);
  const shed = had - (w.carry | 0);
  dropHeld(w);
  return { hatOff: !!w.hatOff, shed, spill: w.spill | 0, dizzyFor: w.dizzyFor | 0 };
};

// wave7b-assign: hold a body over a spot, through the real lift, for looking
// at the assignment ring. The scene cannot drive a right-button drag; what it
// wants to see is only what the yard draws while a body hangs there.
export const hold = (i = 0, x = 0, y = 0) => {
  const w = S.workers[i];
  if (!w) return false;
  liftHeld(w);
  w.inside = false;                // out of whatever door it was behind; a hook may
  w.x = x - WORKER / 2;
  w.y = y - WORKER / 2;
  S.mouse.x = x;
  S.mouse.y = y;
  S.dirty = true;
  return true;
};

export const poopSet = f => {
  const q = poopCols();
  for (let c = 0; c < q.length; c++) q[c] = f(c) || 0;
  retally();                       // same in-place write, same stale memo
  S.dirty = true;
  return q.reduce((n, v) => n + v, 0);
};

export const muckOverPit = () => {
  const m = S.muck || [];
  let n = 0;
  for (let c = 0; c < m.length; c++) if (m[c] && overPitMouth(c * P + P / 2)) n += m[c];
  return n;
};

// look somewhere, for a screenshot or a check that wants to see the far end
export const look = x => { S.camX = x; S.camTo = null; clampCam(); S.dirty = true; return Math.round(S.camX); };

// --- getting about ------------------------------------------------------------
// How a body would get from where it is to a place, in words. The checks ask
// this rather than watching a walk and guessing at it: a route is a thing the
// game works out, so it can be read before anybody takes a step.
export const routeOf = (i, toX) => {
  const w = S.workers[i];
  return w ? routeReport(w, toX) : null;
};

// The highest thing there is to stand on at a place: the ground, the deck of the
// bridge, or the face of the hill where the hill reaches. Not which *way* that
// belongs to -- the yard's floor and the hill are two ways now (see route.js),
// and a check that wants to know whether there is rock in a column asks this and
// compares it with the ground line.
export const surfaceAt = wx => Math.round(rockTop(wx));

// Every way there is, and every link between them: the connectivity of the
// world, which is what decides every route in it.
export const waysNow = () => {
  const all = ways();
  return { ways: Object.keys(all), links: links(all).map(l => ({ name: l.name, x: Math.round(l.x), a: l.a, b: l.b })) };
};


// --- the handles ---------------------------------------------------------------
// Every way in, under the name the checks call it by, as one table.
//
// There were two of these: one in console.js for the browser suite and one in
// tools/node/yard.mjs for the node suite, each written out by hand. A hook added
// to one of them existed in one suite and not the other, and the check that used
// it failed in a way that had nothing to do with what it was checking.
//
// It is the same fault this whole file is full of examples of: a list that has
// to be kept level with another list is a list that will not be. So there is one
// list, and the two suites spread it.
export const HANDLES = {
  __clearFloor: clearFloor, __pile: pile, __jump: jump,
  __preview: preview, __next: next, __drop: drop,
  __birds: birds, __crew: crew, __school: school,
  __assign: assign, __build: rebuildBoards, __fill: fillBoard, __tune: tuneOne, __plots: plots,
  __levels: levels, __fast: fast, __verify: setVerify, __air: setAir, __coldSky: coldSky,
  // Force the crit roll for a check: true always crits, false never, null rolls
  // for real. A crit is a chance, and a chance a check cannot pin down is a check
  // that passes or fails on the seed -- see src/crit.js.
  __crit: forceCrit,
  __toss: toss, __take: takeFromPile, __place: placeBody,
  __abandon: abandon, __reset: newGame, __seed: seedGame, __reload: reload,
  __machine: machineSet, __fullSites: fullSites,
  __swing: swing, __cold: coldReload,
  __rows: allRows, __boards: boards, __unsection: unsection,
  __buildbench: openBuildBench, __research: finishResearch, __grant: grant, __dose: dose,
  __spend: spendDust,
  // Pay a price in any coin, through the very function every row's bill goes
  // through. Not a way of setting a counter: what a check using this is about
  // is *how* the payment is taken -- out of the hole first, out of the rift
  // after -- and a hook that subtracted a number would prove none of it.
  __pay: take,
  __upgrades: upgrades, __buy: buyRowByKey, __pitProfile: pitProfile, __dig: dig,
  __digCut: digCut, __pileCut: pileCut, __pileRock: pileRock,
  __tip: tip, __give: give, __finish: finishWorks,
  // dev: end whatever scene is running, without pressing anything.
  //
  // A press in the yard while a cutscene is on screen skips the scene and does
  // nothing else, which is the rule and is right. It is also a trap for a check:
  // a purse granted in setup can overfill the hole, which tears the rift, which
  // plays a scene -- so a check that banks money and then presses a control an
  // instant later is really testing the skip. This ends the scene the way its
  // own clock would, so the press that follows is the press the check meant.
  __nocine: skipCutscene,
  __skyX: skyX, __puffFades: puffFades, __skyFades: skyFades,
  __dustSpan: dustSpan, __dustOverPit: dustOverPit, __skyJoin: skyJoin, __skyXY: skyXY,
  __pitTop: pitTop, __overPit: overPit, __muckSet: muckSet, __poopSet: poopSet, __shake: shake,
  __meteor: openMeteor, __rift: openRift, __tear: tearRift, __wizardHat: wizardHat,
  __loo: openLoo, __brew: brewWizard, __casino: openCasino,
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
  // What is standing on a shelf, set outright. The setup a check or a scene is
  // NOT about: proving that a batch reaches the shelf is `wave5-apothecary`'s
  // job and it does it by brewing. This is for looking at a full shelf without
  // waiting twenty batches for one.
  __stock: (key, n) => setStock(key, n),
  // How many batches the place has behind it, set outright. Three of this
  // board's rows are revealed by the count rather than bought -- the deeper
  // rungs, the potency ladders, and the second pot at five -- and a check about
  // what one of those rows *does* would otherwise have to stand a stirrer up,
  // set a pot, buy the spores and turn the clock through five whole batches to
  // reach it. That is the setup the check is not about, which is what a handle
  // is for; the earning itself is proved where it belongs, by the apothecary's
  // own checks that brew.
  //
  // `__potSpot` will answer for a pot the yard does not have, so a check that
  // wants two cauldrons has to actually get the second one: the picker asks
  // `S.apothPots` and ignores a point outside it, and the failure looks like a
  // menu that will not open rather than like a purchase that did not happen.
  __brews: n => { S.brews = n; buildShop(); S.dirty = true; return true; },
  // The recipes there are, and which of them the player can see yet. The pot's
  // picker draws a row per recipe plus one for nothing, so a check counting
  // swatches needs the number from the place that decides it -- it was typed
  // into the check as a 4, and when the book gained two recipes the check said
  // the picker was broken. The same trap this file's own comments keep naming:
  // a constant copied into a check only proves that two people copied it.
  //
  // `shown` is the second half and not a detail: a shard recipe stays off the
  // list until the quarry opens, so "how many rows" and "how many rows with a
  // price to compare" are different questions and a check has to be able to ask
  // for the one it means.
  __tonics: () => TONICS.map(t => ({ key: t.key, shown: tonicShown(t) })),
  // Where a cauldron stands, in world pixels. A check that wants to CLICK a pot
  // has to aim at it, and the yard is the only thing that knows where it put its
  // pots -- so it says, and the pointer does the rest.
  __potSpot: i => potBox(i),
  // What a batch of a tonic costs, straight off the thing that charges for it.
  // A check comparing the picker's printed bill against a number it typed out
  // itself would only be checking that two people copied the same constant.
  __brewCost: key => brewCost(key),
  __potKeep: keep => { setKeep(keep); return true; },
  __potPrefer: job => { setPrefer(job); return true; },
  __muckOverPit: muckOverPit, __look: look, __hold: hold,   // wave7b-assign
  // getting about: the surface under a place, the ways there are, and how a
  // given body would get somewhere
  __route: routeOf, __surface: surfaceAt, __ways: waysNow
};
