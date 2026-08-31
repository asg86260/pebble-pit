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
         QUARRY_BENCH_MAX, FARM_PLOTS_MAX, RUNGS, ROCK_GANG } from './config.js';
import { S, BLANK, floor, pit } from './state.js';
import { at, put, addGrain, recount } from './grid.js';
import { blocked, resite, clampCam, benches, plotCount, rockLeft, resize } from './world.js';
import { makeBoulder, rockSize, depthOf, knockOff, rockTopY } from './rock.js';
import { bankDust, spend as spendFromPit, pitFull } from './pit.js';
import { spawnChip } from './dust.js';
import { SKY, pitTop as muckTopAt , fillSky, poopCols } from './smog.js';
import { overPitMouth } from './world.js';
import { dropCore } from './core.js';
import { makeMeteor } from './meteor.js';
import { WIZ_BREW_MS } from './config.js';
import { now as clockNow } from './clock.js';
import { finish } from './lab.js';
import { syncWorkers, drop as dropHeld, shakeHeld } from './crew.js';
import { rosterReport, rosterHit } from './roster.js';
import { JOB_MACHINE } from './machines.js';
import { rebalance, assign as assignJob, restaff } from './upgrades.js';
import { buildShop, refresh } from './shop.js';
import { machine, MACHINES, askLever } from './machines.js';
import { UPGRADES, SECTIONS, buy as buyRow, rungOf, maxed, billOf } from './upgrades.js';
import { TOWER_UPGRADES, TOWER_SECTIONS } from './tower.js';
import { LAB_UPGRADES, LAB_SECTIONS } from './lab.js';
import { SCHOOL_UPGRADES, SCHOOL_SECTIONS } from './school.js';
import { SCRUB_UPGRADES, SCRUB_SECTIONS } from './scrubhouse.js';
import { QUARRY_UPGRADES, QUARRY_SECTIONS } from './quarry.js';
import { FARM_UPGRADES, FARM_SECTIONS } from './farm.js';
import { persist, restore, reset as resetGame } from './persist.js';
import { skipIntro } from './intro.js';
import { sendBirds, BIRDS } from './weather.js';
import { smogReport } from './smog.js';
import { advance, restart as restartClock } from './clock.js';
import { step, settleIntoWorld } from './game.js';
import { rand, seedRng, seed } from './rng.js';
import { verifyWorld, resetVerify } from './verify.js';

// clear the yard: the dust lying about and anything the sites have given up and
// nobody has carried in. Both are 'what is lying around out there'.
// --- the machines ---------------------------------------------------------------
// Set a machine's facts outright, for a check that wants one running without
// spending twenty seconds of simulated yard walking a body to a lever. The
// lever's *own* check must use `lever` below and never this one, or it asserts
// nothing about the walk.
export const machineSet = (which, o = {}) => {
  const m = machine(which);
  if (!m) return null;
  const was = m.on;
  // Unbuying implies the lever goes down. `on` without `bought` is a state the
  // rest of the code is entitled to assume cannot happen -- `machineFor` checks
  // both, `restore` normalises it away -- and a machine left on after being
  // unbought would strand the gang it had displaced, with nothing to switch off
  // to get them back.
  if (o.bought != null) { m.bought = !!o.bought; if (!m.bought) m.on = false; }
  if (o.on != null) m.on = !!o.on && m.bought;
  if (o.driven != null) m.driven = !!o.driven;
  const job = MACHINES.find(x => x.key === which).job;
  if (m.on && !m.was) m.was = S[job] || 0;
  if (!m.on) m.ask = null;
  // Off the same way the lever goes off: the gang it displaced comes back. A
  // hook that only clamped would let a check watch a machine stop and conclude
  // that stopping one strands its station, which is the opposite of what the
  // yard does.
  if (!m.on && was && m.was) { const want = m.was; m.was = 0; restaff(job, want); }
  rebalance();
  syncWorkers();
  buildShop();
  S.dirty = true;
  return { ...m };
};

// Every station given every slot it will ever have, which is what the machines
// are gated behind. A check that wants to buy one should not have to know that
// the numbers are five and seven.
// The lever, asked for honestly: somebody has to walk over and throw it. The
// lever's own check must use this and never `machineSet`, or it asserts nothing
// about the walk -- which is the whole of what the lever is.
export const lever = (which, on) => askLever(which, !!on);

// Click the lever where it is drawn, through the very hit test the pointer uses.
// A check that reached for `askLever` directly would prove the mechanism and say
// nothing about whether there is anything in the yard to click.
// Press the machine's switch where it is drawn, through the very hit test the
// pointer uses. There is no lever in the yard any more -- it is a toggle on the
// station's roster, under the headcount, which is where the question "who is
// working this station" is already being asked and answered.
export const clickLever = which => {
  const post = rosterReport().find(r => JOB_MACHINE[r.job] === which);
  if (!post || !post.run) return false;
  return rosterHit(post.run[0], post.run[1]);
};

export const fullSites = () => {
  S.benchLevel = QUARRY_BENCH_MAX - QUARRY_BENCH0;
  S.plotLevel = FARM_PLOTS_MAX - FARM_PLOTS0;
  S.minerPickLevel = RUNGS;
  S.minerSpeedLevel = RUNGS;
  S.quarryOpen = true;
  S.farmOpen = true;
  // And a full set of specialists, which is the other half of what a machine is
  // gated behind. A check that wants a machine should not have to know that the
  // hats are called breakers, blasters and growers.
  S.breakers = Math.max(S.breakers, ROCK_GANG);
  S.blasters = Math.max(S.blasters, QUARRY_BENCH_MAX);
  S.growers = Math.max(S.growers, FARM_PLOTS_MAX);
  S.schoolOpen = true;
  resite();
  rebalance();
  buildShop();
  S.dirty = true;
  return { benches: benches(), plots: plotCount(),
           pick: S.minerPickLevel, speed: S.minerSpeedLevel,
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
  S.janitors = 0;
  // And every machine stops. This is the same trap as the scrubbers above, one
  // level worse: a machine left running by whatever ran before does not merely
  // move bodies about, it rewrites what the next `__crew(0, 0, 3)` is *allowed*
  // to mean -- three quarriers asked for, one bench's worth permitted, and two
  // of them quietly carrying dust while a check swears it staffed the cut.
  for (const m of MACHINES) {
    const r = machine(m.key);
    if (r) { r.on = false; r.ask = null; r.was = 0; }
  }
  S.labLeft = 0;                  // the lab owes nobody after a wholesale reshuffle
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

// dev: put every plot back to bare earth. A plot nobody is working keeps its crop
// for ever, so a check that wants to watch one come ripe has to start from a
// farm that is not already standing full of somebody else's.
export const plots = () => {
  S.plots = S.plots.map(() => 0);
  S.plotTone = S.plotTone.map(() => 0);
  S.dirty = true;
};

export const levels = (o = {}) => {             // set upgrade levels, for weighing balance
  for (const k of ['pickLevel', 'speedLevel', 'carryLevel', 'minerSpeedLevel',
                   'minerPickLevel', 'haulCarryLevel', 'haulPaceLevel',
                   'quarryPaceLevel', 'tendLevel', 'benchLevel', 'plotLevel',
                   'wizSpeedLevel', 'wizPowerLevel', 'labKitLevel',
                   'harnessLevel', 'bootsLevel', 'fanLevel']) {
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
  if (o.scrubbers != null) { S.scrubbers = o.scrubbers; rebalance(); syncWorkers(); }
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
export const abandon = () => { S.research = null; buildShop(); S.dirty = true; };

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
export const coldSky = () => { SKY.length = 0; };

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
  const all = [SECTIONS, LAB_SECTIONS, TOWER_SECTIONS, SCHOOL_SECTIONS,
               SCRUB_SECTIONS, QUARRY_SECTIONS, FARM_SECTIONS];
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
  { name: 'bench',  keys: UPGRADES.map(u => u.key),        sections: SECTIONS.map(x => x.keys) },
  { name: 'lab',    keys: LAB_UPGRADES.map(u => u.key),    sections: LAB_SECTIONS.map(x => x.keys) },
  { name: 'tower',  keys: TOWER_UPGRADES.map(u => u.key),  sections: TOWER_SECTIONS.map(x => x.keys) },
  { name: 'school', keys: SCHOOL_UPGRADES.map(u => u.key), sections: SCHOOL_SECTIONS.map(x => x.keys) },
  { name: 'scrub',  keys: SCRUB_UPGRADES.map(u => u.key),  sections: SCRUB_SECTIONS.map(x => x.keys) },
  { name: 'quarry', keys: QUARRY_UPGRADES.map(u => u.key), sections: QUARRY_SECTIONS.map(x => x.keys) },
  { name: 'farm',   keys: FARM_UPGRADES.map(u => u.key),   sections: FARM_SECTIONS.map(x => x.keys) }
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
const everyRow = () => [...UPGRADES, ...TOWER_UPGRADES, ...LAB_UPGRADES,
                        ...SCHOOL_UPGRADES, ...SCRUB_UPGRADES,
                        ...QUARRY_UPGRADES, ...FARM_UPGRADES];

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
  buyRow(u);
  return rungOf(u) > was
      || (u.from && u.from() !== from)
      || (showed && !u.show());
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

export const poopSet = f => {
  const q = poopCols();
  for (let c = 0; c < q.length; c++) q[c] = f(c) || 0;
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
  __toss: toss, __take: takeFromPile, __place: placeBody,
  __abandon: abandon, __reset: newGame, __seed: seedGame, __reload: reload,
  __machine: machineSet, __fullSites: fullSites,
  __lever: lever, __swing: swing, __cold: coldReload,
  __rows: allRows, __boards: boards, __unsection: unsection, __clickLever: clickLever,
  __lab: openLab, __research: finishResearch, __grant: grant,
  __spend: spendDust, __press: press,
  __upgrades: upgrades, __buy: buyRowByKey, __pitProfile: pitProfile, __dig: dig,
  __tip: tip, __give: give,
  __skyX: skyX, __puffFades: puffFades, __skyFades: skyFades,
  __dustSpan: dustSpan, __dustOverPit: dustOverPit, __skyJoin: skyJoin, __skyXY: skyXY,
  __pitTop: pitTop, __overPit: overPit, __muckSet: muckSet, __poopSet: poopSet, __shake: shake,
  __meteor: openMeteor, __wizardHat: wizardHat,
  __loo: openLoo, __brew: brewWizard,
  __muckOverPit: muckOverPit, __look: look,
  // getting about: the surface under a place, the ways there are, and how a
  // given body would get somewhere
  __route: routeOf, __surface: surfaceAt, __ways: waysNow
};
