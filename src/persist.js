// Reading and writing the game.
//
// The pit is stored as the height of every column plus how many grains of each
// shade there are, and the speckle is dealt out again on the way back in: what
// matters about a pile is its shape and its total, and a value per cell would be
// megabytes written every second.

import { P, SHADES, CORE_SIZE, QUARRY_BENCH0, FARM_PLOTS0, ROCK_CELL, LOO_POSTS } from './config.js';
import { load, save, clear } from './save.js';
import { seedSmog, skyFromSave } from './smog.js';
import { craftSave, craftLoad, clearCraft } from './balloon.js';
import { showPanel } from './board.js';
import { S, BLANK, SAVED, floor, pit, cut, sky } from './state.js';
import { SITES, rowFor, workFor, busyBuilderSites } from './works.js';
import { resetCut, seamShards, dugShare } from './quarry.js';
import { freshMachines, MACHINES, kitDisplaced } from './machines.js';
import { makeMeteor } from './meteor.js';
import { now as clockNow } from './clock.js';
import { at, put, count, fillFlat, isDust, recount, wakeGrid } from './grid.js';
import { resite } from './world.js';
import { startIntro } from './intro.js';
import { gridToString, gridFromString, makeBoulder, clearBoulder, boulderAlive } from './rock.js';
import { setPitGrain, seedPitCores, rehomeDust } from './pit.js';
import { syncWorkers, wearKitOnLoad, keepOf, wearRecord, newRecord, FACTORY } from './crew.js';
import { rebalance, JOBS } from './upgrades.js';
import { buildShop } from './shop.js';
import { resetRates } from './lab.js';
import { seed, reseed, rngState, setRngState } from './rng.js';
import { JOB, TYPE } from './jobs.js';

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

// Everything a save carries that is a plain copy of a field, taken straight off
// the list in state.js. There is nothing to say about any of these one at a
// time, which is exactly why they are a list: a field named there is saved from
// the moment it is named, and there is no second place to remember.
function savedFields() {
  const out = {};
  for (const k of SAVED) out[k] = S[k];
  return out;
}

// A value put back the way a fresh yard has it, without handing out `BLANK`'s
// own arrays and objects for the game to then mutate.
const copyOf = v => Array.isArray(v) ? v.slice()
  : v && typeof v === 'object' ? { ...v } : v;

// ...and the same list read back. One rule rather than a coercion written out a
// field at a time: what a field *is* is whatever its declaration in state.js
// says it is, so a save with no key for it -- an old one, or one written before
// the field existed -- gets what a fresh yard has, and a key that is there is
// read as the kind of thing the field holds. `SAVED` can be a bare list of names
// only because this is derived from the declaration rather than guessed per
// field; a default written beside each name would be the same number twice.
function readSaved(s) {
  for (const k of SAVED) {
    const blank = BLANK[k], v = s[k];
    if (v == null) S[k] = copyOf(blank);
    else if (Array.isArray(blank)) S[k] = Array.isArray(v) ? v.slice() : copyOf(blank);
    else if (typeof blank === 'number') S[k] = +v || 0;
    else if (typeof blank === 'boolean') S[k] = !!v;
    else S[k] = v;
  }
}

export function persist() {
  if (!S.dirty) return;
  S.dirty = false;
  save({
    ...savedFields(),
    // Which run this is, and how far into it the chance has got. The seed alone
    // would start the stream over on every reload -- the same run's name on a
    // different run -- so the generator's one word of state goes with it. See
    // rng.js.
    runSeed: S.runSeed,
    rngState: rngState(),
    banked: S.banked,
    seenCore: S.seenCore,
    // The rift, and what is standing in it. This is the one part of the pile
    // that is not in the pile: `stored` counts it, the hole does not hold it,
    // and losing this line on the way out would be the difference between a
    // player's dust being somewhere else and being gone.
    rift: S.rift,
    // and the coins it holds, for the same reason and with the same weight:
    // four numbers, against a pile that would otherwise have to hold every
    // shard you ever found for the counter to be true
    riftHeld: S.riftHeld,
    // Where the view is. Scrolling the yard is how you look at any of this, and
    // a reload that dumped you back at the rock threw away the one piece of
    // where-you-were the player sets by hand. Rounded because a pixel of a
    // pixel is not worth the characters.
    camX: Math.round(S.camX),
    core: S.coreItem && !S.heldCore ? { x: S.coreItem.x, y: S.coreItem.y } : null,
    coreLoose: S.heldCore || !!S.coreItem,
    // what the sites have given up and nobody has carried in yet: it was never
    // counted, and a reload pocketing it would be the game taking it back
    crew: S.crew,
    // The crew itself, not just how many of them there are. A body has a name
    // and a record now, and rebuilding the yard from four counts would hand you
    // back four strangers standing where your crew was.
    who: S.workers.map(keepOf),
    rockhands: S.rockhands,
    // Haulers are whoever is spare, so this is worked out again on the way in
    // rather than read -- it is written down for the sake of a save being
    // readable when one arrives as a bug report.
    haulers: S.haulers,
    rockhandSpeedLevel: S.rockhandSpeedLevel,
    rockhandPickLevel: S.rockhandPickLevel,
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
    // ...and how much of this bench's seam is still in the ground. It goes with
    // `quarryCells` and for the same reason: the depth was written down and the
    // stone in it was not, so a save read back mid-dig had a part-dug floor and
    // nothing left to find in it. `findShards` pays out of this number, and the
    // one line that lays a fresh seam only fires on ground nobody has broken
    // into (`quarryOwed <= 0 && !dugShare()`), which a part-dug floor is not --
    // so every swing left in the bench turned up nothing and the dig you were
    // halfway through paid you nothing at all.
    quarryOwed: S.quarryOwed,
    seenSpore: S.seenSpore,
    scholars: S.scholars,
    plotLevel: S.plotLevel,
    introDone: S.introDone,
    reunionDone: S.reunionDone,
    buried: S.buried,
    looPosts: S.looPosts,
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
    meteorCells: sky.cells ? Array.from(sky.cells) : null,
    summon: +(S.summon || 0).toFixed(3),
    seenSpark: S.seenSpark,
    // What the yard was in the middle of building. Paid for and part done, so
    // closing the tab on one would lose the coin and the labour both -- the same
    // argument the hat above makes. Worker-seconds rather than a deadline, which
    // is what makes it safe to write down at all: `now()` starts wherever the
    // page started, so an absolute time saved in one session is a meaningless
    // number in the next.
    works: S.works,
    // The order the yard's own buildings were bought in -- see C7 in
    // wave-feedback3.md. `placeSites` reads this on the way back in, which is
    // the only time this ever matters: nothing already standing moves for
    // buying something else later in the same session.
    buildOrder: S.buildOrder || [],
    lent: S.lent || [],
    wizards: S.wizards,
    purifiers: S.purifiers,
    // The craft the house has sold. Two numbers and an eased height apiece; the
    // lane is the index and who is aboard is a fact about the body.
    craft: craftSave(),
    haze: Math.round(S.haze),
    poop: S.poop || [],
    // and what is lying on top of the rock, which is a layer like the muck and
    // belongs to the rock the save already writes down. Column by column,
    // bottom grain first.
    rockSand: (S.rockSand || []).map(a => (a || []).join(',')),
    pot: S.pot && { ...S.pot },
    // A pot that was still pouring when the tab shut is a bet that was made. The
    // sand itself is not saved -- the table's grid never is -- so what comes back
    // is the pot on the board and the pour starting again from the sky, and the
    // wheel goes round when it has landed, exactly as it would have.
    pouring: !!S.pouring,
    // ...and a pot you have already taken is money, not sand.
    //
    // `bank()` empties `S.pot` on the frame you press it and hands the whole of
    // it to `S.paying`, which the hole is only paid out of as each flying grain
    // lands. A refresh in the middle of that used to come back on `paying: null`
    // with the air swept clear, and the pot -- off the table, not yet in the
    // hole, nowhere at all -- was simply gone. It is the one number in this
    // building that was not written down, and it was the only one that was
    // already yours.
    //
    // What is written is everything that has not landed yet: what the payout
    // still owes, plus the worth of every grain still in the air, because a
    // grain in flight is a grain the hole has not counted. It comes back the way
    // `pouring` does -- the sand flies again out of an empty table, and the hole
    // is paid the same pot it was always going to be paid.
    paying: S.paying && {
      cur: S.paying.cur,
      left: S.paying.left + (S.tableAir || []).reduce((n, k) => n + (k.arc ? (k.worth || 0) : 0), 0),
      grains: S.paying.grains + (S.tableAir || []).filter(k => k.arc).length
    },
    mult: { ...S.mult },
    plots: S.plots.map(b => Math.round(b * 100)),
    plotTone: [...S.plotTone],
    boulder: gridToString(),
    gw: S.gw,
    gh: S.gh,
    boulderNo: S.boulderNo,
    // Whether the rock standing there still owes you its core. It was worked out
    // again on the way back in rather than written down, and the working out
    // could only see a core lying on the ground or one on the cursor -- see the
    // note where it is read.
    coreBuried: S.coreBuried,
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
    // Reading a save that is not there. Every plain field goes back to what
    // state.js says a yard is, which is what "no save" means -- and it is the
    // same one line as reading a save, so the two cannot drift apart. This used
    // to be sixty assignments, and it had already lost several of them.
    readSaved({});
    S.banked = 0;
    S.shownStored = S.tweenFrom = S.tweenTo = 0;
    S.crew = 0;
    S.seenCore = false;
    S.riftGulp = 0; S.riftShake = 0;   // an event is not a state: see state.js
    S.rift = 0;
    S.riftHeld = { cores: 0, shards: 0, spores: 0, sparks: 0 };
    S.coreItem = null;
    S.rockhands = 0;
    S.haulers = 0;
    S.rockhandSpeedLevel = 0;
    S.rockhandPickLevel = 0;
    S.seenShard = false;
    S.quarryOpen = false;
    S.quarriers = 0;
    S.quarryPaceLevel = 0;
    S.benchLevel = 0;
    S.machines = freshMachines();   // a new yard has no machines in it
    S.seenSpore = false;
    S.scholars = 0;
    S.plotLevel = 0;
    S.pot = null;
    S.paying = null;
    S.pouring = false;
    S.quarryOwed = 0;
    S.buildOrder = [];
    for (const k of Object.keys(S.mult)) S.mult[k] = 0;
    S.plots = [];
    S.plotTone = [];
    return;
  }
  // Everything the save keeps as it stands, in one pass off the list in
  // state.js. It runs first because the hand-written lines below it read what it
  // sets -- the rift is clamped to `S.stored`, the wizards to `S.wizardHats` --
  // and because a field nobody has had to think about should not need a line
  // here at all.
  readSaved(s);
  S.banked = s.banked || s.stored || 0;
  S.shownStored = S.tweenFrom = S.tweenTo = S.stored;
  S.seenCore = !!s.seenCore || S.cores > 0;
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
  setPitGrain();
  if (s.coreLoose) {
    S.coreItem = s.core
      ? { x: s.core.x, y: s.core.y, vx: 0, vy: 0, rest: true }
      : { x: S.worldW * 0.2, y: S.groundY - CORE_SIZE, vx: 0, vy: 0, rest: false };
  }
  // The jobs were renamed -- miners became rock hands, labbers scholars,
  // scrubbers air purifiers -- and a save written before that says the old word.
  // Read both, old as the fallback, so a yard saved under the old names walks
  // back in with its people. Every renamed counter below does the same.
  S.rockhands = s.rockhands ?? s.miners ?? 0;
  // A save from when the quarry was a cave. The place changed and the people
  // changed name with it; what they had done is still theirs.
  S.quarriers = s.quarriers ?? s.spelunkers ?? 0;
  // How far the two growing sites have been grown. A save from before either of
  // them grew has everybody it had standing in a place that now has room for
  // two, so the places are grandfathered up to the crew that is already in
  // them: the game does not take a body off a plot it used to have.
  S.benchLevel = Math.max(+s.benchLevel || 0, (s.quarriers ?? s.spelunkers ?? 0) - QUARRY_BENCH0);
  S.plotLevel = Math.max(+s.plotLevel || 0, (s.farmhands || 0) - FARM_PLOTS0);
  S.scholars = s.scholars ?? s.labbers ?? 0;
  // A save from before the crew was one pool has a headcount per job and no
  // total. Adding them up is the whole migration: the same bodies, on the same
  // jobs, and now they can be moved.
  S.crew = s.crew ?? (s.rockhands ?? s.miners ?? 0) + (s.haulers || 0) + (S.quarriers || 0) + (s.farmhands || 0);
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
  S.rockhandSpeedLevel = s.rockhandSpeedLevel ?? s.minerSpeedLevel ?? 0;
  // A save from when one pick row bought both keeps what its rock hands had.
  S.rockhandPickLevel = s.rockhandPickLevel ?? s.minerPickLevel ?? (s.pickLevel || 0);
  S.seenShard = !!s.seenShard || S.shards > 0;
  S.quarryOpen = !!(s.quarryOpen ?? s.caveOpen);
  S.quarryPaceLevel = s.quarryPaceLevel ?? s.cavePaceLevel ?? 0;
  // How far each column had been dug. A save from before this was kept, or one
  // whose array is the wrong shape for the quarry this run has, comes back to
  // nought everywhere -- an unbroken floor, exactly what `resetCut` below then
  // lays fresh rock to match.
  S.quarryCells = Array.isArray(s.quarryCells) ? s.quarryCells.map(v => +v || 0) : null;
  S.seenSpore = !!s.seenSpore || S.spores > 0;
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
  // A save from before the second cap existed arrives with two posts already --
  // it built the closet when that was the whole of what it bought, and nobody
  // loses a cap they had to a rung that did not exist yet.
  S.looPosts = s.looPosts ?? 2;
  S.seenSpark = !!s.seenSpark || S.sparks > 0;
  S.wizards = Math.min(s.wizards || 0, S.wizardHats);
  // and whatever was being built. Only the sites this build knows about and only
  // rows it still has: a save from a version with a row this one has dropped
  // would otherwise hold a work that can never finish, at a site that is then
  // busy for ever.
  S.lent = Array.isArray(s.lent) ? s.lent.filter(j => JOBS.includes(j)) : [];
  // The order the buildings went up in. A save from before this existed, or
  // one with nothing in it, comes back empty -- and empty is the fixed order,
  // so nothing already standing moves. `placeSites` (world.js) is where an
  // unrecognised key is dropped, not here: it already has to know which keys
  // are real places, so this file does not need a second copy of that list.
  S.buildOrder = Array.isArray(s.buildOrder) ? s.buildOrder.filter(k => typeof k === 'string') : [];
  // A list a site now, because a site takes as many works as it has room for --
  // one everywhere, two at a lab with a second bench. A save written before that
  // holds one object a site, so it is read as a list of one: a yard mid-build
  // that came back with nothing on the go would have taken the money and left
  // nothing being built.
  S.works = {};
  for (const site of SITES) {
    const was = s.works?.[site];
    const list = Array.isArray(was) ? was : was ? [was] : [];
    const keep = list
      .filter(w => w && w.key && rowFor(w.key) && w.of > 0)
      .map(w => ({ key: w.key, done: Math.max(0, Math.min(w.of, w.done || 0)),
                   of: w.of, at: w.at ?? null }));
    if (keep.length) S.works[site] = keep;
  }
  // And the lab's own two fields, from before its research was ordinary work.
  // A piece that was half looked into comes back half looked into, on the bench
  // it was on, rather than being quietly dropped with the shards already spent.
  for (const was of [s.research, s.research2]) {
    if (!was || !was.key || !rowFor(was.key)) continue;
    const of = workFor(rowFor(was.key));
    if (!(of > 0)) continue;
    (S.works.lab ||= []).push({ key: was.key, done: Math.max(0, Math.min(of, +was.done || 0)),
                                of, at: null });
  }
  if (S.meteorOpen) {
    makeMeteor();
    // and the cells as they were left, if the save is of this shape of sky
    if (Array.isArray(s.meteorCells) && s.meteorCells.length === sky.cells.length) {
      sky.cells.set(s.meteorCells);
      sky.n = sky.cells.reduce((n, v) => n + (v ? 1 : 0), 0);
    }
    S.summon = Math.max(0, Math.min(1, s.summon || 0));
  }
  S.purifiers = s.purifiers ?? s.scrubbers ?? 0;
  craftLoad(s.craft);
  S.haze = s.haze || 0;
  S.scrubBank = 0;
  // The rain itself is not saved. It is nine seconds long and it is weather:
  // coming back to a shower that started before you closed the tab is a shower
  // with no beginning. What it left behind is saved, because that is the part
  // that is somebody's job.
  S.raining = false;
  S.rainFor = 0;
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
  // A pot you have already taken comes back still owed to you.
  //
  // Every other field in this building has an argument for what it does on a
  // reload; this one had none, and what it did was throw the pot away. `bank()`
  // takes the pot off the table on the frame you press it and pays it into the
  // hole one landing grain at a time, so between the press and the last grain
  // the whole of your winnings live in `S.paying` and nowhere else -- and this
  // line used to be `S.paying = null`.
  //
  // Crediting it here instead was the other way to write this, and it is the
  // wrong one: the pot going over the yard is the *point* of taking it, and a
  // refresh should not be a way to skip the walk. So the payout comes back a
  // payout. The table is empty, which `payOutStep` already copes with -- it
  // throws from the pot's spot when there is no heap left to lift off -- and the
  // sand flies again, the same way `pouring` below sends a bet's sand down out
  // of an empty sky.
  //
  // The grain count is only how many throws the money is split across, so a save
  // with a number where there should be none is worth nothing rather than owed
  // for ever: a payout with nothing left in it is no payout.
  S.paying = s.paying && s.paying.cur && +s.paying.left >= 1
    ? { cur: s.paying.cur,
        left: Math.round(+s.paying.left),
        grains: Math.max(1, Math.round(+s.paying.grains) || 1) }
    : null;
  // A bet made is a bet made: a pot caught mid-pour comes back mid-pour, the
  // sand falls again out of an empty table, and the spin it was owed is still
  // owed. A pot that had already been spun for comes back a pot and nothing more.
  S.pouring = S.casinoOpen && !!S.pot && !!s.pouring;
  S.hand = null;                // a hand that settled before you closed the tab is old news
  // the lab's quarry multiplier answered to `cave` before the place was renamed
  if (s.mult) for (const k of Object.keys(S.mult)) S.mult[k] = s.mult[k] ?? (k === 'quarry' ? s.mult.cave : 0) ?? 0;
  if (Array.isArray(s.plots)) S.plots = s.plots.map(b => (+b || 0) / 100);
  // a ripe plot keeps the spore that grew on it, tone and all
  if (Array.isArray(s.plotTone)) S.plotTone = s.plotTone.map(v => +v || 0);
  resite();                    // the quarry is as deep and the plot as wide as it was
  restoreCrew(s.who);          // the same people, where they were, with what they have done
  syncWorkers();               // and anybody the counts say is missing
  // A site with no gang of its own -- the yard, the bench -- that was busy when
  // the tab shut is busy again the moment it comes back: `S.works` is written
  // above, before the crew even exists. But nobody was sent to it, because the
  // one thing that turns spare hands into builders is the same thing a fresh
  // build starting calls, and a reload is not a build starting -- so the site
  // stood there for ever with nobody at it. See C2 in wave-feedback3.md.
  //
  // Only run when there is actually a busy builder site to redispatch to: a
  // save with nothing on the go has nothing to fix, and `rebalance` recomputes
  // every job's count from scratch (`spareHands`, which is `S.crew` less every
  // assigned job) -- a second pass over a roster that a save's own numbers
  // never quite add up to is a place a body can be lost that has nothing to do
  // with this bug.
  if (busyBuilderSites().length) { rebalance(); syncWorkers(); }
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
  S.riftGulp = 0; S.riftShake = 0;     // a save comes back after the tearing, never in it
  S.rift = Math.max(0, Math.min(Math.round(+s.rift || 0), S.stored));
  S.riftLevel = Math.max(0, Math.round(+s.riftLevel || 0));
  // The coins through it, clamped to their own counters the same way. A save
  // written before the hole swallowed anything but dust has none of these, and
  // nought through is exactly what it had: every find still in the pile.
  S.riftHeld = { cores: 0, shards: 0, spores: 0, sparks: 0 };
  for (const k of ['cores', 'shards', 'spores', 'sparks'])
    S.riftHeld[k] = Math.max(0, Math.min(Math.round(+(s.riftHeld?.[k]) || 0), S[k] || 0));
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
  // What the seam still owes. It is read after the cut, because an old save that
  // never wrote the number has to be guessed at from how much of the ground is
  // left -- and there is no ground to measure until `resetCut` and the grid
  // above have laid it.
  //
  // Guessing was all there ever was here, and the guess was nought: the number
  // was never saved. `findShards` pays out of it and stops dead at nought, and
  // the one line that lays a fresh seam only fires on ground nobody has broken
  // into. A save read back mid-dig is neither -- part-dug, owing nothing -- so
  // the rest of that bench paid the player not one shard, and it only righted
  // itself when the dig finished and `fillQuarry` laid the next seam.
  S.quarryOwed = Number.isFinite(+s.quarryOwed)
    ? Math.max(0, Math.round(+s.quarryOwed))
    : Math.round(seamShards() * Math.max(0, 1 - dugShare()));
  // Whether this rock still owes you its core.
  //
  // It used to be worked out here rather than read: `boulderAlive() ||
  // !(s.coreLoose || S.heldCore)`. That asks "is a core lying about, or on the
  // cursor" -- and those are not the only two places a core can be. One in a
  // hauler's hands is neither, so a save written with the rock dead and the core
  // walking to the hole came back saying the rock still owed one, and the next
  // frame `stepCore` dropped a second: two cores out of one rock.
  //
  // So it is written down now, and the guess is only what an old save gets --
  // widened to count a pair of hands, which is the whole of the bug it missed.
  S.coreBuried = typeof s.coreBuried === 'boolean'
    ? s.coreBuried
    : boulderAlive() || !(s.coreLoose || S.heldCore || S.workers.some(w => w.hasCore));
}

// The crew, put back. Each body is made by its own factory -- so it has every
// field its job expects, whatever has changed since the save was written -- and
// then handed back the things that are *it* rather than its job.
// What a job used to be called, for saves written before it was renamed. The
// rift-holder is the old one: a job that stopped existing, whose bodies come
// back as haulers. The other three are the same word for the same job.
const OLD_TYPE = { rifter: TYPE.HAUL, miner: TYPE.ROCK,
                   labber: TYPE.SCHOLAR, scrubber: TYPE.PURIFY };
// And the same renaming again on the *job*, because a body does not only say
// what it is -- it says which station's hat it is wearing (`kitOf`), and that is
// a job name. A save written before the rename has a body in a "miners" hat,
// which is a hat no station keeps any more: `verifyWorld` calls that out as kit
// that is not in the table, and rightly.
const OLD_JOB = { miners: JOB.ROCK, labbers: JOB.SCHOLAR, scrubbers: JOB.PURIFY };

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
    // And a body saved under a job's old name. The jobs were renamed -- miners
    // became rock hands, labbers scholars, scrubbers air purifiers -- and a save
    // is a list of bodies each of which says what it is. Without this every one
    // of them is "a trade this build does not have" on the line below, and a
    // yard saved the day before comes back empty.
    const type = OLD_TYPE[k.type] || k.type;
    const made = FACTORY(type);
    if (!made.type) continue;                  // a trade this build does not have
    const rec = OLD_JOB[k.kitOf] ? { ...k, kitOf: OLD_JOB[k.kitOf] } : k;
    S.workers.push(wearRecord(Object.assign(made, newRecord()), rec));
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
  // Everything the save keeps, put back to what state.js says a yard is -- the
  // same one line the "no save" arm of `restore` uses, and for the same reason:
  // a new game and a game that has never been played are the same yard, and the
  // list is the only place either of them says so. Naming a hundred fields here
  // is what let a new game start with the last game's quarry in it.
  readSaved({});
  // The rift: a new yard has no hole in the air in it, and nothing standing on
  // the other side of one.
  S.rift = 0;
  S.riftHeld = { cores: 0, shards: 0, spores: 0, sparks: 0 };
  S.paused = false;                // a new game is not a held one
  showPanel(null, true);           // nor one with the last game's board still up
  // the curtains are somebody's, and there is nobody here now
  S.shutters = [];
  S.shutterAt = 0;
  S.chips = [];
  S.belt = [];                       // and what was riding the belt, for the same reason
  S.paid = [];
  S.gulped = [];
  S.banked = 0;
  S.shownStored = S.tweenFrom = S.tweenTo = 0;
  S.held = 0;
  S.crew = 0;
  S.seenCore = false;
  setPitGrain();
  S.coreItem = null;
  S.heldCore = false;
  S.rockhands = 0;
  S.haulers = 0;
  S.rockhandSpeedLevel = 0;
  S.rockhandPickLevel = 0;
  S.seenShard = false;
  S.quarryOpen = false;
  S.quarriers = 0;
  S.quarryPaceLevel = 0;
  S.benchLevel = 0;
  S.quarryCells = null;
  S.machines = freshMachines();     // a new yard has no machines in it
  S.seenSpore = false;
  S.scholars = 0;
  S.plotLevel = 0;
  S.apothBoardOpen = false;
  S.labBoardOpen = false;
  S.looPosts = LOO_POSTS;
  S.summon = 0;
  S.flashAt = 0;
  S.seenSpark = false;
  S.wizards = 0;
  S.works = {};
  S.buildOrder = [];
  S.lent = [];
  S.builders = 0;
  sky.cells = null;
  sky.n = 0;
  S.purifiers = 0;
  clearCraft();
  S.introThrew = 0;
  S.haze = 0;
  S.raining = false;
  S.rainFor = 0;
  S.scrubBank = 0;
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

