// Reading and writing the game. The pit is stored as the height of every
// column plus how many grains of each shade there are, and the speckle is
// dealt out again on the way back in: a value per cell would be megabytes
// written every second.

import { P, CELL, SHADES, CORE_SIZE, QUARRY_BENCH0, FARM_PLOTS0, LOO_POSTS,
         ABYSS_AT, WORKER, LADDER, TIER_RUNGS, ROCK_SINK } from './config.js';
import { load, clear, isSave, loadRaw, saveRaw, savePrev, loadBroken,
         claimTab, tabOwner, TAB, setSlot } from './save.js';
import { seedSmog, skyFromSave, skyKindCounts, DROPS, SKY } from './smog.js';
import { craftSave, craftLoad, clearCraft } from './balloon.js';
import { showPanel } from './board.js';
import { S, BLANK, SAVED, SAVED_BY_HAND, EPHEMERAL, floor, pit, cut, sky, quarry } from './state.js';
import { SITES, rowFor, workFor, busyBuilderSites } from './works.js';
import { resetCut, squareCut, seamShards, dugShare, cutTop } from './quarry.js';
import { freshMachines, MACHINES, kitDisplaced } from './machines.js';
import { makeMeteor } from './meteor.js';
import { now as clockNow } from './clock.js';
import { BUILD } from './version.js';
import { at, fillFlat, isDust, recount, wakeGrid } from './grid.js';
import { resite, openingCamX, clampCam, settleShack, overCutMouth, setZoom } from './world.js';
import { clearCasino } from './casino.js';
import { OPENING } from './intro.js';
import { BEATS, startBeat } from './beats.js';
import { gridToString, gridFromString, makeBoulder, clearBoulder, boulderAlive } from './rock.js';
import { setPitGrain, seedPitCores, rehomeDust } from './pit.js';
import { bandY } from './dust.js';
import { KINDS } from './shield.js';
import { syncWorkers, wearKitOnLoad, keepOf, wearRecord, newRecord, FACTORY } from './crew.js';
import { rebalance, JOBS } from './staffing.js';
import { resetRates } from './stats.js';
import { catchUpNotices, resetNotices, hushNotices } from './notices.js';
import { seed, reseed, rngState, setRngState } from './rng.js';
import { JOB, TYPE } from './jobs.js';
import { snapShown } from './tween.js';

// A pile is nearly all long runs of the same value, so store the runs
// ("value x length"): a full pit comes out a few kilobytes.
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

// Fills the grid from a run-length string; false if it does not fit.
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
  // about, so the whole plot gets looked at once.
  wakeGrid(b);
  return i === b.grid.length;
}

// The profile and the count come back exact; you cannot tell which grain
// moved.
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

// Run-length a list of numbers: "value x length", runs joined by dots.
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

  // A cumulative distribution over the shades, so the speckle comes back in
  // the proportions it went out in.
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

// How many cells a run-length string holds, without unpacking it.
export function gridCount(str) {
  if (typeof str !== 'string') return 0;
  let n = 0;
  for (const part of str.split('.')) {
    const x = part.indexOf('x');
    if (x > 0 && part[0] !== '0') n += +part.slice(x + 1);
  }
  return n;
}

// The plain copies, straight off the list in state.js.
function savedFields() {
  const out = {};
  for (const k of SAVED) out[k] = S[k];
  return out;
}

// A fresh value without handing out `BLANK`'s own arrays and objects for the
// game to then mutate.
const copyOf = v => Array.isArray(v) ? v.slice()
  : v && typeof v === 'object' ? { ...v } : v;

// What a field *is* is whatever its declaration in state.js says: a save with
// no key for it gets what a fresh yard has, and a key that is there is read
// as the kind of thing the field holds.
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

// The by-hand fields, for a yard with no save behind it: the declaration,
// less the few that are *built* rather than blanked (the rock by
// `makeBoulder`, the machines by `freshMachines`, the crew by walking out)
// and the seed and the view, which whoever called settles.
const BUILT = new Set(['runSeed', 'camX', 'floor', 'boulder', 'gw', 'gh', 'boulderNo',
                       'machines', 'workers']);
function blankByHand() {
  for (const k of SAVED_BY_HAND) if (!BUILT.has(k) && k in BLANK) S[k] = copyOf(BLANK[k]);
}

// The session's fields, for a yard that is starting over. A reset used to name
// the ones it cleared -- the chips in the air, the belt, the weather -- and,
// like the two by-hand lists before it, the naming was where the leaks were: a
// casino hand mid-cascade, a cutscene half played, the quarry's running total
// and the muck the house was partway through all stood through a reset because
// nobody had thought to write them down. So the answer is the declaration
// again, less the few that are not the yard's at all: what was measured off
// the window at boot, where the camera is, what the pointer is doing, what the
// store said about this page, and the housekeeping the loop itself keeps.
// A reload does none of this because a reload starts from a page with nothing
// on it; only a reset has a running yard to put down.
const PAGES = new Set(['W', 'H', 'zoom', 'dpr', 'viewW', 'viewH', 'worldW', 'worldH',
                       'cx', 'cy', 'groundY', 'camY', 'camTo', 'camWas', 'camLockY', 'follow',
                       'mouse', 'unsaved', 'yielded', 'broken', 'fellBack', 'newerSave',
                       'staged', 'build', 'tick', 'lastFrame', 'shopStale', 'fatal',
                       'placed', 'strips']);
function blankEphemeral() {
  for (const k of EPHEMERAL) if (!PAGES.has(k) && k in BLANK) S[k] = copyOf(BLANK[k]);
}

// The last blob this page built, written or not: SAVE A COPY hands this over
// when the store would not take it, rather than the store's stale copy.
let lastBlob = null;

// What the hole is still owed by the casino: the pot being paid out, plus
// every grain already in the air toward it.
function payingOwed() {
  const arcs = (S.tableAir || []).filter(k => k.arc);
  const inAir = arcs.reduce((n, k) => n + (k.worth || 0), 0);
  if (S.paying) return { cur: S.paying.cur, left: S.paying.left + inAir, grains: S.paying.grains + arcs.length };
  if (!arcs.length) return null;
  return { cur: 'dust', left: inAir, grains: arcs.length };
}

export function persist() {
  // The loop stops on a throw but the interval that calls this does not, and
  // it would put the state that just threw over the last whole save
  // (crash.js). Nothing else gates it: the write runs on the clock (main.js,
  // once a second) and writes whether or not anything moved.
  if (S.fatal) return;
  // A yard stood at a scene is not the player's (scenesheet.js).
  if (S.staged) return;
  // Another page has written since this one did: this page's yard is the
  // stale one, so it stops writing and main.js reloads it when next looked
  // at. Only a page that has made a claim can be overtaken (the node yard
  // never claims), and only another page's name counts: no name at all means
  // the store cannot be read, and yielding on that reloaded onto a store
  // that held nothing, so tabbing away and back reset the game.
  const owner = claimed ? tabOwner() : TAB;
  if (S.yielded || (owner !== null && owner !== TAB)) { S.yielded = true; return; }
  lastBlob = JSON.stringify(blob());
  // The sheet reads `S.unsaved`.
  S.unsaved = !saveRaw(lastBlob);
}

// Whether this page has put its name beside the save; main.js does, once, at
// boot. A claim that could not be written is no claim: the name left there
// is some earlier page's, and a page that treated it as another tab's would
// stand aside for nobody, reload, and stand aside again.
let claimed = false;
export function claimSave() { claimed = claimTab(); }

// Everything a save is, as one object.
function blob() {
  return {
    ...savedFields(),
    // The page's own stamp, not `S.build` (whoever wrote the save this yard
    // was read out of): the comparison against the app that opens a save only
    // means something if every save says who wrote it.
    build: BUILD,
    // For the saves page; read by nothing that boots a yard.
    savedAt: Date.now(),
    // The seed alone would start the stream over on every reload, so the
    // generator's one word of state goes with it (rng.js).
    runSeed: S.runSeed,
    rngState: rngState(),
    banked: S.banked,
    seenCore: S.seenCore,
    // The one part of the pile that is not in the pile: `stored` counts it,
    // the hole does not hold it.
    rift: S.rift,
    riftHeld: S.riftHeld,
    // Losing these would reload a drowned yard back into its disc era.
    riftAte: S.riftAte,
    drowned: S.drowned,
    // Where the view is, rounded. While a scene has the view pulled in,
    // `camX` is the left edge of a narrower view than the one that comes
    // back, so the seat is written at the yard's own zoom.
    camX: Math.round(S.shot ? S.camX + S.viewW / 2 - S.W * P / CELL / 2 : S.camX),
    // A core on the cursor is written where the cursor was.
    core: S.coreItem && !S.heldCore ? { x: S.coreItem.x, y: S.coreItem.y }
        : S.heldCore && S.mouse ? { x: S.mouse.x - CORE_SIZE / 2, y: S.groundY - CORE_SIZE } : null,
    coreLoose: S.heldCore || !!S.coreItem,
    crew: S.crew,
    // Moments on the clock are written as distances, because the clock starts
    // again with the page.
    danceLeft: Math.max(0, Math.round(S.danceUntil - clockNow())),
    nextBoulderIn: Math.max(0, Math.round(S.nextBoulderAt - clockNow())),
    // The crew itself, not just how many of them there are. A body has a name
    // and a record now, and rebuilding the yard from four counts would hand you
    // back four strangers standing where your crew was.
    who: S.workers.map(keepOf),
    // Where the mouth of the cut was under them, so a load can tell a layout
    // that moved from one that did not (`restoreCrew`).
    mouth: S.quarryOpen ? quarry.x : null,
    rockhands: S.rockhands,
    // Worked out again on the way in; written for a save arriving as a bug
    // report.
    haulers: S.haulers,
    rockhandSpeedLevel: S.rockhandSpeedLevel,
    rockhandPickLevel: S.rockhandPickLevel,
    seenShard: S.seenShard,
    quarryOpen: S.quarryOpen,
    quarriers: S.quarriers,
    quarryPaceLevel: S.quarryPaceLevel,
    benchLevel: S.benchLevel,
    // So the cut's sand (below) is read against the floor it was lying on.
    quarryCells: S.quarryCells ? Array.from(S.quarryCells) : null,
    // Goes with `quarryCells`: a fresh seam is only laid on ground nobody has
    // broken into (`quarryOwed <= 0 && !dugShare()`), so a part-dug floor
    // read back without this has nothing left to find in it.
    quarryOwed: S.quarryOwed,
    seenSpore: S.seenSpore,
    scholars: S.scholars,
    plotLevel: S.plotLevel,
    // Only the camera's beat, and only until it has been seen through: a
    // scene on its way out has let go as far as the player is concerned. The
    // yard's beats come back by their own triggers (the opening from the
    // door, the rescue from the dome's next hold) and the sheet by its fact.
    beat: { camera: S.beat.camera && !(S.shot && S.shot.out) ? S.beat.camera : null },
    rescued: S.rescued,
    shield: S.shield && { kind: S.shield.kind, x: S.shield.x, w: S.shield.w,
                          h: S.shield.h, rise: S.shield.rise, laid: S.shield.laid,
                          // So a re-caught rock picks up where the rope was.
                          strain: S.shield.strain || 0, sag: S.shield.sag || 0,
                          caughtAgo: S.shield.caught ? Math.max(0, Math.round(clockNow() - S.shield.caught)) : null },
    shieldsDone: [...S.shieldsDone],
    buried: S.buried,
    looPosts: S.looPosts,
    // The machines as facts only; whether one is *running* is whether anybody
    // is standing at it, and the crew is rebuilt from the counts on the way
    // in.
    machines: Object.fromEntries(MACHINES.map(m => {
      const r = (S.machines && S.machines[m.key]) || {};
      return [m.key, { bought: !!r.bought, driven: !!r.driven, tookKit: !!r.tookKit,
                       tune: r.tune || 0,
                       // Its clock, as distances, or a refresh hands every
                       // machine a free unit.
                       beatIn: r.beatAt ? Math.max(0, Math.round(r.beatAt - clockNow())) : null,
                       workedAgo: r.workedAt ? Math.max(0, Math.round(clockNow() - r.workedAt)) : null }];
    })),
    // What is left of the meteor is a rock half taken apart. The hat on the go
    // is not saved: a spell mid-cast has no beginning, so the tower starts it
    // again.
    meteorCells: sky.cells ? Array.from(sky.cells) : null,
    summon: +(S.summon || 0).toFixed(3),
    seenSpark: S.seenSpark,
    // Worker-seconds rather than a deadline: `now()` starts wherever the page
    // started, so an absolute time saved in one session means nothing in the
    // next.
    works: S.works,
    // Position and shade; the band's height is the world's to answer on the
    // way back in.
    belt: (S.belt || []).map(b => [Math.round(b.x), b.s]),
    // Every grain in the air: a refresh destroying what was up is the one
    // thing the yard promises it never does.
    chips: (S.chips || []).map(c => [Math.round(c.x), Math.round(c.y), +c.vx.toFixed(2), +c.vy.toFixed(2), c.s, c.land == null ? null : Math.round(c.land)]),
    buildOrder: S.buildOrder || [],
    lent: S.lent || [],
    wizards: S.wizards,
    purifiers: S.purifiers,
    // The lane is the index and who is aboard is a fact about the body.
    craft: craftSave(),
    haze: Math.round(S.haze),
    // What the haze is made of, by kind, or the band rebuilt all as dust
    // tells the readout nothing but hand work fouled it. Counts, not motes.
    skyKinds: skyKindCounts(),
    // The drops already falling are the muck the shower was about to leave.
    drops: DROPS.map(d => [Math.round(d.x), Math.round(d.y), +d.vy.toFixed(2)]),
    // Every speck still on its way up, with its climb.
    puffs: SKY.filter(m => m.up).map(m => [Math.round(m.x), Math.round(m.y), m.kind || 'dust', +(m.vy || 0).toFixed(3),
                                          Math.round(m.y0 ?? m.y), +(m.lean || 0).toFixed(2), +(m.fade ?? 1).toFixed(2), Math.round(m.age || 0)]),
    poop: S.poop || [],
    // Column by column, bottom grain first.
    rockSand: (S.rockSand || []).map(a => (a || []).join(',')),
    pot: S.pot && { ...S.pot },
    // The sand itself is not saved -- neither plot's grid ever is -- so a pot
    // comes back pouring into whichever plot it stood in, whatever it was doing:
    // a hand caught mid-cascade comes back a pot in the hopper with the let-go
    // open again, the way a wheel mid-spin used to. The bet that was made is
    // the chip, and the chip is what comes back.
    pouring: !!S.pouring,
    // A pot you have taken is money, not sand: `bank()` hands it to `S.paying`
    // and the hole is paid as each flying grain lands, so what is written is
    // everything that has not landed yet, the worth of the grains in the air
    // included. `paying` is put down the moment the last grain leaves the
    // heap, so in that window the arcs alone are owed, in dust, which is what
    // an arc lands as.
    paying: payingOwed(),
    mult: { ...S.mult },
    plots: S.plots.map(b => Math.round(b * 100)),
    plotTone: [...S.plotTone],
    boulder: gridToString(),
    gw: S.gw,
    gh: S.gh,
    boulderNo: S.boulderNo,
    coreBuried: S.coreBuried,
    // `cx` is the ground's anchor: the yard is laid out leftwards from it, so
    // a save read into a world whose left-hand ground has since widened knows
    // how far its dust has to slide (`floorShift`).
    floor: { cols: floor.cols, rows: floor.rows, cx: S.cx, cells: gridStr(floor) },
    pit: pitToSave(),
    // Only means anything alongside `quarryCells`, so the two are written and
    // read together.
    cut: cut.grid ? { cols: cut.cols, rows: cut.rows, cells: gridStr(cut) } : null
  };
}

// Reading a saved plot into one whose left-hand end has moved. The world only
// changes width at the ground in front of the boulder (`GROUND_LEFT` derives
// from the site table), which slides every grain the same number of columns;
// falling through to `fillFlat` instead would re-deal every shard, spore and
// spark as flat grey dust. Written straight into the cells, with one
// `recount` at the end. `dx` may be negative: what runs off the near end is
// the bare YARD_MARGIN ground nobody heaps on, and is dropped.
function gridSlide(b, s, dx) {
  if (s.rows !== b.rows) return false;
  // Only the near end may be dropped: a saved grid that would hang off the
  // right is a different world, and `fillFlat` is the answer to that.
  if (s.cols + dx > b.cols) return false;
  // A slide of nought is only a slide if the two floors are the same width.
  if (dx === 0 && s.cols !== b.cols) return false;
  const from = new b.grid.constructor(s.cols * s.rows);
  let i = 0;
  for (const part of String(s.cells || '').split('.')) {
    const x = part.indexOf('x');
    if (x < 0) return false;
    const v = +part.slice(0, x), len = +part.slice(x + 1);
    if (!(len >= 0) || i + len > from.length) return false;
    if (v) from.fill(v, i, i + len);
    i += len;
  }
  if (i !== from.length) return false;
  for (let r = 0; r < s.rows; r++)
    for (let c = 0; c < s.cols; c++) {
      const v = from[r * s.cols + c];
      const to = c + dx;
      if (v && to >= 0 && to < b.cols) b.grid[r * b.cols + to] = v;
    }
  return true;
}

export function restoreGrid(b, s, dx = 0) {
  if (!s) return;
  b.grid.fill(0);
  if (!dx && s.cols === b.cols && s.rows === b.rows && gridFill(b, s.cells)) {
    if (b.n != null) recount(b);           // written run by run, not put
    if (b.painter) b.painter.repaint();
    return;
  }
  if (gridSlide(b, s, dx)) {
    recount(b);                            // and the same: wholesale, so re-ledgered
    if (b.painter) b.painter.repaint();
    return;
  }
  fillFlat(b, gridCount(s.cells));   // a different shape: re-pack the same amount
  if (b.painter) b.painter.repaint();
}

// How far a saved floor has to slide to line up with today's yard, in
// columns: exact off the anchor `cx`. A save with no anchor cannot say which
// way the ground moved, so the `max(0, ...)` path only ever slides right.
const floorShift = saved =>
  !saved ? 0
  : Number.isFinite(saved.cx) ? Math.round((S.cx - saved.cx) / P)
  : Math.max(0, floor.cols - (saved.cols || floor.cols));

export function restore() {
  const s = load();
  // The seed and the stream first, before anything below draws on it. A save
  // with neither keeps the stream the generator seeded itself with (rng.js)
  // and is told what it is called.
  S.runSeed = Number.isFinite(s?.runSeed) ? s.runSeed >>> 0 : seed();
  if (Number.isFinite(s?.rngState)) setRngState(s.rngState);
  S.boulderNo = s?.boulderNo || 1;
  // Read at boot and nowhere else; an old save has none, and gets the
  // opening view.
  S.camWas = Number.isFinite(s?.camX) ? s.camX : null;
  if (!s || !gridFromString(s.boulder, s.gw, s.gh) || typeof s.stored !== 'number') {
    // A game that has never been played starts with two people, and the rock
    // is what happens to them (intro.js).
    makeBoulder();
    settleShack();
    clearBoulder();
    S.coreBuried = false;
    // A save that would not read has been put aside by `load`, and the sheet
    // offers it for as long as it is there.
    S.broken = !!loadBroken();
    S.newerSave = null;             // no save, so no build to be newer than this one
    // The same one line as reading a save, so the two cannot drift apart.
    readSaved({});
    blankByHand();
    S.banked = 0;
    S.shownStored = 0; snapShown();
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
    clearCasino();
    S.quarryOwed = 0;
    S.buildOrder = [];
    for (const k of Object.keys(S.mult)) S.mult[k] = 0;
    S.plots = [];
    S.plotTone = [];
    S.shield = null;
    S.shieldsDone = [];
    S.rockHeld = false;
    S.rescued = false;
    // Last, after the blanking above: the opening's pair are stood at the
    // door before the first frame is drawn.
    startBeat('leave');
    return;
  }
  // The hut where this save's rock puts it: the yard was laid out with the
  // hut off rock one, and a bigger rock would have it inside the boulder.
  settleShack();
  // First, because the hand-written lines below read what it sets (the rift
  // is clamped to `S.stored`, the wizards to `S.wizardHats`).
  readSaved(s);
  // The version boundary: a save from a newer build is loaded anyway, and the
  // sheet says so once. Dates compare as strings because they are written as
  // YYYY-MM-DD; a dev build has no date and never says anything.
  S.build = s.build && typeof s.build === 'object' ? { hash: String(s.build.hash ?? ''), date: String(s.build.date ?? '') } : null;
  S.savedAt = Number.isFinite(s.savedAt) ? s.savedAt : null;
  S.newerSave = S.build?.date && BUILD.date && S.build.date > BUILD.date ? S.build.date : null;
  S.banked = s.banked || s.stored || 0;
  S.shownStored = S.stored; snapShown();
  S.seenCore = !!s.seenCore || S.cores > 0;
  // The hole is the whole hole at one grain size for ever; a save written at
  // a finer grain will not fit this plot, and `rehomeDust` below puts that
  // dust back where it goes.
  setPitGrain();
  // `coreTaker` is a body, and the bodies are about to be built again: a
  // claim left pointing at a body no longer in the yard leaves the core lying
  // there for good (`haulerWork` defers to the taker). A restore in a running
  // page has to say so.
  S.coreTaker = null;
  S.danceUntil = Number.isFinite(s.danceLeft) && s.danceLeft > 0 ? clockNow() + s.danceLeft : 0;
  S.nextBoulderAt = Number.isFinite(s.nextBoulderIn) && s.nextBoulderIn > 0 ? clockNow() + s.nextBoulderIn : 0;
  if (s.coreLoose) {
    S.coreItem = s.core
      ? { x: s.core.x, y: s.core.y, vx: 0, vy: 0, rest: true }
      : { x: S.worldW * 0.2, y: S.groundY - CORE_SIZE, vx: 0, vy: 0, rest: false };
  }
  // Renamed jobs are read under both names, old as the fallback.
  S.rockhands = s.rockhands ?? s.miners ?? 0;
  S.quarriers = s.quarriers ?? s.spelunkers ?? 0;
  // The growing sites are grandfathered up to the crew already standing in
  // them: the game does not take a body off a plot it used to have.
  S.benchLevel = Math.max(+s.benchLevel || 0, (s.quarriers ?? s.spelunkers ?? 0) - QUARRY_BENCH0);
  S.plotLevel = Math.max(+s.plotLevel || 0, (s.farmhands || 0) - FARM_PLOTS0);
  // Nobody is a scholar any more, but the bodies are read so the headcount
  // adds up; `rebalance` below hands them to the spare pool.
  S.scholars = 0;
  const wasScholars = s.scholars ?? s.labbers ?? 0;
  // A save from before the crew was one pool has a headcount per job and no
  // total.
  S.crew = s.crew ?? (s.rockhands ?? s.miners ?? 0) + (s.haulers || 0) + (S.quarriers || 0) + (s.farmhands || 0)
                     + wasScholars;
  // Before `rebalance()`: a restored machine changes what its station's cap
  // *is*, and a rebalance against the old cap leaves five bodies at a cut
  // that now holds one, with nothing recomputing it per frame. The dev
  // reload (`persist()` then `restore()` in one process) hides this, because
  // the in-memory machine is still running.
  S.machines = freshMachines();
  for (const m of MACHINES) {
    const r = (s.machines && s.machines[m.key]) || {};
    const rec = S.machines[m.key];
    rec.bought = !!r.bought;
    // A save's `on` and `was` are dropped: a machine is worked by whoever is
    // standing at it.
    rec.driven = !!r.driven;
    rec.tune = Math.max(0, Math.round(+r.tune || 0));
    // A bought machine with no record took a full set. A machine that does
    // not take kit never took any, whatever the save says: a stale `true`
    // has `stripKit` empty the stand every frame under a row still selling
    // carts.
    rec.tookKit = rec.bought && kitDisplaced(m.job)
      ? (r.tookKit == null ? true : !!r.tookKit) : false;
    if (Number.isFinite(r.beatIn)) rec.beatAt = clockNow() + r.beatIn;
    if (Number.isFinite(r.workedAgo)) rec.workedAt = clockNow() - r.workedAgo;
  }
  rebalance();
  // A save carrying the old harness or boots ladder folds it into the one
  // ladder, trimmed to the top.
  S.haulCarryLevel = Math.min(LADDER, (S.haulCarryLevel || 0) + (+s.harnessLevel || 0));
  S.haulPaceLevel = Math.min(LADDER, (S.haulPaceLevel || 0) + (+s.bootsLevel || 0));
  S.rockhandSpeedLevel = s.rockhandSpeedLevel ?? s.minerSpeedLevel ?? 0;
  // A save from when one pick row bought both keeps what its rock hands had.
  S.rockhandPickLevel = s.rockhandPickLevel ?? s.minerPickLevel ?? (s.pickLevel || 0);
  S.seenShard = !!s.seenShard || S.shards > 0;
  S.quarryOpen = !!(s.quarryOpen ?? s.caveOpen);
  S.quarryPaceLevel = s.quarryPaceLevel ?? s.cavePaceLevel ?? 0;
  // Null is an unbroken floor, which `resetCut` below lays fresh rock to
  // match.
  S.quarryCells = Array.isArray(s.quarryCells) ? s.quarryCells.map(v => +v || 0) : null;
  S.seenSpore = !!s.seenSpore || S.spores > 0;
  // 2026-09-15: the story's progress was six flags; it is the set of beats
  // that have played (beats.js), read as a plain copy above, and a save from
  // before the set folds its flags into it. A save from before the opening
  // existed with nobody hired is a game that has not started; `reunionDone`
  // came in after the second rock could already have fallen; `storyTold`
  // came in after the rescue could already have happened, and a sheet weeks
  // later is not the moment; the rescue's own fact marks its beat. A scene
  // the last sitting closed the tab on (`cineOwed`, or today's
  // `beat.camera`) marks nothing and is the running camera beat, played once
  // over the event as it now stands. A chain of beats (the opening, the
  // reunion) is one story: a save taken partway through it does not write
  // the yard's beat down, so the beats it had played come off the set and
  // the story starts over from its first.
  const done = new Set(S.beatsDone);
  if (!Array.isArray(s.beatsDone)) {
    if (!!s.introDone || (s.crew ?? 0) > 0) for (const k of OPENING) done.add(k);
    if (s.reunionDone ?? ((s.boulderNo ?? 1) > 1)) { done.add('meet'); done.add('part'); }
    if (s.rescued) done.add('rescue');
    if ('storyTold' in s ? !!s.storyTold : !!s.rescued) done.add('ending');
  }
  for (const row of BEATS) {
    let end = row;
    while (end.next) end = BEATS.find(r => r.key === end.next);
    if (end !== row && !done.has(end.key)) done.delete(row.key);
  }
  S.beatsDone = [...done];
  const owed = typeof s.beat?.camera === 'string' ? s.beat.camera : s.cineOwed;
  const camera = BEATS.find(r => r.key === owed && r.owns === 'camera' && !done.has(owed));
  S.beat = { yard: null, camera: camera ? camera.key : null, sheet: null };
  // A shot of some other scene is the old yard's; the same scene, still
  // standing in this process, carries on rather than starting over.
  if (S.shot && S.shot.name !== S.beat.camera) { S.shot = null; setZoom(1); }
  // The catch is taken again below, once the rock's fall has been read.
  S.shield = s.shield ? { kind: s.shield.kind, x: s.shield.x, w: s.shield.w,
                          h: s.shield.h, rise: s.shield.rise || 0,
                          laid: s.shield.laid || 0, caught: 0, held: 0,
                          strain: 0, sag: 0,
                          setting: false, poured: 0, fading: 0 } : null;
  // What is woven is the fact; the wizard-seconds behind it are worked back
  // out of it.
  if (S.shield && KINDS[S.shield.kind].cast) {
    const k = KINDS[S.shield.kind];
    S.shield.poured = (S.shield.laid / k.pieces) * k.work;
  }
  S.shieldsDone = Array.isArray(s.shieldsDone) ? s.shieldsDone : [];
  S.rockHeld = false;
  // A rock that was in the shield's hands is in them still, or it falls the
  // rest of the way on its own, lands inside the net without the net giving
  // up, and `shieldsDone` never gets the word. Only a finished shield of a
  // kind that catches; the rock goes through anything else anyway.
  if (S.shield && S.rockFall > 0) {
    const k = KINDS[S.shield.kind];
    if (S.shield.laid >= k.pieces && k.answer !== 'through' && s.shield.caughtAgo != null && Number.isFinite(+s.shield.caughtAgo)) {
      // `held` is the catch height (where a falling rock's foot meets the
      // shield's top, as in `stepShield`), not where the rock is now, or
      // every refresh would have the rope start straining from nothing. A
      // rock above it is one the dome sprang back up.
      S.shield.caught = clockNow() - (+s.shield.caughtAgo || 0);
      S.shield.held = (S.shield.h + 1) * P + ROCK_SINK;
      S.shield.strain = +s.shield.strain || 0;
      S.shield.sag = +s.shield.sag || 0;
      if (k.answer === 'hold' && S.rockFall > S.shield.held) S.shield.rising = true;
      else S.rockFallV = 0;
      S.rockHeld = true;
    }
  }
  S.camLockY = null;
  S.pair = [];
  S.buried = s.buried ?? S.beatsDone.includes('show');
  // A save from before the second cap existed built the closet when that was
  // the whole of what it bought.
  S.looPosts = s.looPosts ?? 2;
  // `labDone` is the same news under the per-site name.
  if (s.labDone) S.siteDone = { ...S.siteDone, lab: s.labDone };
  S.rescued = !!s.rescued;
  if (S.rescued) S.buried = false;
  S.seenSpark = !!s.seenSpark || S.sparks > 0;
  S.wizards = Math.min(s.wizards || 0, S.wizardHats);
  // Only jobs this build still has.
  S.lent = Array.isArray(s.lent) ? s.lent.filter(j => JOBS.includes(j)) : [];
  // Empty is the fixed order. `placeSites` (world.js) drops an unrecognized
  // key, since it already knows which keys are real places.
  S.buildOrder = Array.isArray(s.buildOrder) ? s.buildOrder.filter(k => typeof k === 'string') : [];
  // A save whose record was stamped off the clock has page-relative
  // milliseconds, any one of which outranks a sequence number: renumber them
  // in the order they had.
  const stamps = Object.entries(S.wonAt || {});
  if (stamps.some(([, v]) => v > 100000)) {
    stamps.sort((a, b) => a[1] - b[1]);
    S.wonAt = Object.fromEntries(stamps.map(([k], i) => [k, i + 1]));
    S.wonSeq = stamps.length;
  }
  S.chips = Array.isArray(s.chips)
    ? s.chips.filter(c => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]))
        .map(([x, y, vx, vy, sh, land]) => ({ x, y, vx: vx || 0, vy: vy || 0, s: sh || 1, land: Number.isFinite(land) ? land : null }))
    : [];
  S.belt = Array.isArray(s.belt)
    ? s.belt.filter(b => Array.isArray(b) && Number.isFinite(b[0])).map(([x, sh]) => ({ x, y: bandY(), s: sh || 1 }))
    : [];
  // A list a site; a save holding one object a site is read as a list of
  // one. Walked by the save's own keys rather than today's `SITES`, because a
  // site can stop existing between builds and the work filed under it is
  // re-homed below rather than dropped.
  S.works = {};
  for (const site of Object.keys(s.works || {})) {
    const was = s.works[site];
    const list = Array.isArray(was) ? was : was ? [was] : [];
    for (const w of list) {
      if (!(w && w.key && rowFor(w.key) && w.of > 0)) continue;
      // Under the site the row says today, so a work whose row has moved
      // sites does not come back blocking a site that is not there.
      const home = rowFor(w.key).site || site;
      if (!SITES.includes(home)) continue;
      (S.works[home] ||= []).push({ key: w.key, done: Math.max(0, Math.min(w.of, w.done || 0)),
                                    of: w.of, at: w.at ?? null });
    }
  }
  // The lab's own two fields, from before its research was ordinary work.
  for (const was of [s.research, s.research2]) {
    if (!was || !was.key || !rowFor(was.key)) continue;
    const of = workFor(rowFor(was.key));
    if (!(of > 0)) continue;
    (S.works.lab ||= []).push({ key: was.key, done: Math.max(0, Math.min(of, +was.done || 0)),
                                of, at: null });
  }
  if (S.meteorOpen) {
    makeMeteor();
    // The cells as they were left, if the save is of this shape of sky.
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
  // The weather in flight comes back with the sky (`raining`, `rainFor`,
  // `stormFor` are plain saved fields); the bolt is a flash of a few frames
  // and is not.
  S.bolt = null;
  S.poop =Array.isArray(s.poop) ? s.poop.slice() : [];
  S.rockSand = Array.isArray(s.rockSand)
    ? s.rockSand.map(a => String(a || '').split(',').filter(Boolean).map(Number))
    : null;
  // The sky itself, not only the number for it: `settleCount` only ever takes
  // motes away in play, so a haze read back over an empty band stays wrong
  // for an hour. Safe here because the world is laid out before the save is
  // read (main.js), so there is a width to spread it across.
  skyFromSave(s.skyKinds, s.drops, s.puffs);
  // A pot left in its plot is still in it. The sand itself is never saved, so
  // it comes back pouring in again whatever it was doing -- a hand caught on
  // the pegs comes back a pot in the hopper with the let-go open again, a tray
  // caught mid-hoist comes back a pot in the hopper. A save from the wheel's day
  // has no `where`, and a pot with no plot named stands where a stake stands.
  S.pot = s.pot && s.pot.cur
    ? { cur: s.pot.cur, stake: +s.pot.stake || 0, n: +s.pot.n || 0,
        where: s.pot.where === 'tray' ? 'tray' : 'hopper' }
    : null;
  clearCasino();                // both plots start empty; the pot pours again
  S.tableAir = [];
  S.drop = null;                // a hand on the pegs, a hoist, a demonstration: none has a beginning to come back to
  S.hoisting = false;
  S.attract = null;
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
  // A bet made is a bet made: a pot comes back pouring into its plot, whether
  // it was still arriving or already standing there, because the sand it stood
  // as was not saved.
  S.pouring = S.casinoOpen && !!S.pot;
  S.hand = null;                // a hand that settled before you closed the tab is old news
  // The old multipliers fold into their ladders' spark rung (DESIGN.md, "The
  // spark band is the top of the ladder"): a save with any of one had climbed
  // the whole ladder under it, and a `lab*` work still in flight lands the
  // same way, since there is no row left to finish it and the sparks were
  // paid. The quarry's answered to `cave` before the place was renamed.
  const FOLD = { crop: 'cropLevel', seam: 'seamLevel', tend: 'tendLevel', quarry: 'quarryPaceLevel' };
  const LAB = { labcrop: 'crop', labseam: 'seam', labtend: 'tend', labcave: 'quarry' };
  const flying = new Set([...Object.values(s.works || {}).flatMap(w => Array.isArray(w) ? w : w ? [w] : []),
                          s.research, s.research2].map(w => w?.key && LAB[w.key]).filter(Boolean));
  for (const [k, field] of Object.entries(FOLD)) {
    const had = +(s.mult?.[k] ?? (k === 'quarry' ? s.mult?.cave : 0)) || 0;
    if (had > 0 || flying.has(k)) S[field] = TIER_RUNGS;
  }
  for (const k of Object.keys(S.mult)) S.mult[k] = 0;
  if (Array.isArray(s.plots)) S.plots = s.plots.map(b => (+b || 0) / 100);
  if (Array.isArray(s.plotTone)) S.plotTone = s.plotTone.map(v => +v || 0);
  resite();                    // the quarry is as deep and the plot as wide as it was
  restoreCrew(s.who, Number.isFinite(s.mouth) ? s.mouth : null);
  // A body written down is a body in the yard: a save can carry the headcount
  // and the list disagreeing (the fixture in `test/fixtures` does), and
  // `syncWorkers` stands down anybody the deal has no room for, so the count
  // gives way to the list. The deal is done again when it does, because
  // `rebalance` is where `S.haulers` comes from.
  if (S.workers.length > S.crew) { S.crew = S.workers.length; rebalance(); }
  syncWorkers();               // and anybody the counts say is missing
  // Only a save from before the record existed is caught up, and that is
  // asked of the save rather than a flag on S: running the catch-up on a
  // save that carries `won` would mark every unread notice as read.
  if (!(s && 'won' in s)) catchUpNotices();
  S.noticeMigrated = true;
  hushNotices();               // what this save already earned is on the sheet, not in the air
  // A site with no gang of its own that was busy when the tab shut needs its
  // builders sent again: only a build starting turns spare hands into
  // builders, and a reload is not one. Only when there is a busy site,
  // because a second `rebalance` over a roster whose numbers never quite add
  // up is a place a body can be lost.
  if (busyBuilderSites().length) { rebalance(); syncWorkers(); }
  if (!Array.isArray(s.who)) wearKitOnLoad();   // an old save has no record of who wore what
  if (!S.beatsDone.includes('show')) startBeat('leave');
  restoreGrid(floor, s.floor, floorShift(s.floor));
  if (!pitFromSave(s.pit)) pit.grid.fill(0);
  // The rift comes back before the dust is put away, because how much
  // belongs in the hole depends on how much is already through. Clamped to
  // the counter: a rift holding more than you own leaves `inHole` reading
  // nought against a pile that plainly has dust in it.
  S.seenFullPit = !!s.seenFullPit;
  S.riftOpen = !!s.riftOpen;
  S.riftGulp = 0; S.riftShake = 0;     // a save comes back after the tearing, never in it
  S.rift = Math.max(0, Math.min(Math.round(+s.rift || 0), S.stored));
  S.riftLevel = Math.max(0, Math.round(+s.riftLevel || 0));
  // The coins through it, clamped to their own counters the same way.
  S.riftHeld = { cores: 0, shards: 0, spores: 0, sparks: 0 };
  for (const k of ['cores', 'shards', 'spores', 'sparks'])
    S.riftHeld[k] = Math.max(0, Math.min(Math.round(+(s.riftHeld?.[k]) || 0), S[k] || 0));
  // A save with no `riftAte` but a torn rift was written when the tear and
  // the drowning were the same moment, so it comes back drowned, its eaten
  // count seeded from what is through and floored at the threshold so the
  // disc size and the drowning trigger agree with the era.
  S.drowned = s.riftAte !== undefined ? !!s.drowned : !!s.riftOpen;
  S.riftAte = Math.max(0, Math.round(+s.riftAte || 0));
  if (s.riftAte === undefined && S.riftOpen)
    S.riftAte = (S.rift || 0) + Object.values(S.riftHeld).reduce((a, b) => a + b, 0);
  if (S.drowned) S.riftAte = Math.max(S.riftAte, ABYSS_AT);
  rehomeDust();
  seedPitCores();
  // Rock laid fresh to the depth just restored, then the dust that was lying
  // on it overlaid, but only if the save's cut is the exact shape of this
  // grid; otherwise `resetCut` alone is an empty cut.
  resetCut();
  if (cut.grid && s.cut && s.cut.cols === cut.cols && s.cut.rows === cut.rows &&
      gridFill(cut, s.cut.cells)) {
    // The save's grid brings what was lying loose, and nothing about the
    // rock: that is the count's to say (`squareCut`).
    squareCut();
    recount(cut);
    if (cut.painter) cut.painter.repaint();
  }
  // After the cut, because an old save that never wrote the number is
  // guessed from how much ground is left, and there is no ground to measure
  // until the lines above have laid it.
  S.quarryOwed = Number.isFinite(+s.quarryOwed)
    ? Math.max(0, Math.round(+s.quarryOwed))
    : Math.round(seamShards() * Math.max(0, 1 - dugShare()));
  // The guess is only for an old save, and counts a core in a hauler's hands:
  // a rock dead with its core walking to the hole would otherwise drop a
  // second.
  S.coreBuried = typeof s.coreBuried === 'boolean'
    ? s.coreBuried
    : boulderAlive() || !(s.coreLoose || S.heldCore || S.workers.some(w => w.hasCore));
}

// The crew, put back. Each body is made by its own factory, so it has every
// field its job expects whatever has changed since the save, and then handed
// back the things that are *it* rather than its job.
// Old names for a type. A job that stopped existing (the rift-holder, the
// scholar under both its names) comes back as a hauler rather than being
// dropped, which is a body lost out of somebody's save.
const OLD_TYPE = { rifter: TYPE.HAUL, miner: TYPE.ROCK,
                   labber: TYPE.HAUL, scholar: TYPE.HAUL,
                   scrubber: TYPE.PURIFY };
// The same renaming on `kitOf`, which is a job name: a hat no station keeps
// is kit not in the table, and `verifyWorld` calls that out.
const OLD_JOB = { miners: JOB.ROCK, labbers: JOB.HAUL, scholars: JOB.HAUL,
                  scrubbers: JOB.PURIFY };

function restoreCrew(who, mouth = null) {
  // Whether the ground under the crew is the ground they were saved on, and
  // if the cut has moved, by how much: the yard re-walks when a station grows
  // (DRAWN_W in world.js), and a save carries every body at its old x.
  const sameGround = mouth != null && mouth === quarry.x;
  const cutShift = mouth != null && S.quarryOpen ? quarry.x - mouth : 0;
  S.workers = [];
  if (!Array.isArray(who)) return;
  for (const k of who) {
    if (!k.type) continue;
    const type = OLD_TYPE[k.type] || k.type;
    const made = FACTORY(type);
    if (!made.type) continue;                  // a trade this build does not have
    let rec = OLD_JOB[k.kitOf] ? { ...k, kitOf: OLD_JOB[k.kitOf] } : k;
    // A body saved inside the lab would load under the ground line at the
    // door of a building that is not there, so its position goes and the
    // factory's own puts it on its feet. `labber` has no constant: it is a
    // name from before the rename, like the keys of the maps above.
    if (k.type === TYPE.SCHOLAR || k.type === 'labber') {
      const { x, y, goal, inside, site, ...rest } = rec;
      rec = rest;
    }
    // A body down in the cut when the cut moved goes with the cut, or it
    // comes back in solid ground with no working under it (verify.js rule 1).
    // A body at ground height over the mouth on a layout that moved stands at
    // the near edge instead; at ground height exactly, because a carter on
    // the bridge deck is over the mouth too and belongs there. A quarrier at
    // work stands on the cut's floor under its own x, or it walks the whole
    // top of the cut and climbs down again on every refresh. None of it on
    // the same layout: a body over the mouth then is at the head of the
    // ladder mid-stride, and moving it hops it back on every refresh.
    if (cutShift && Number.isFinite(rec.x) && Number.isFinite(rec.y)
        && rec.y + WORKER > S.groundY + 1
        && rec.x + WORKER > mouth && rec.x < mouth + quarry.w) {
      rec = { ...rec, x: rec.x + cutShift };
    }
    if (!sameGround && Number.isFinite(rec.x) && overCutMouth(rec.x)
        && (!Number.isFinite(rec.y) || Math.abs(rec.y + WORKER - S.groundY) <= 1)) {
      if (type === TYPE.QUARRY && rec.goal === 'work') {
        rec = { ...rec, y: cutTop(rec.x + WORKER / 2) - WORKER };
      } else {
        const nearSide = rec.x + WORKER / 2 < quarry.x + quarry.w / 2;
        rec = { ...rec, x: nearSide ? quarry.x - WORKER - P : quarry.x + quarry.w + P };
      }
    }
    S.workers.push(wearRecord(Object.assign(made, newRecord()), rec));
  }
}

// A new game. `fresh` draws a new seed, before a single grain is laid down;
// a run started from a seed on purpose (`seedGame` in hooks.js) keeps the
// number it was given.
export function reset(fresh = true) {
  // A staged yard is nobody's (scenesheet.js, the demo): clearing the slot
  // under it would erase the player's yard to make room for a picture.
  if (!S.staged) clear();
  S.runSeed = fresh ? reseed() : seed();
  // The same one line the "no save" arm of `restore` uses: a new game and a
  // game never played are the same yard.
  readSaved({});
  blankByHand();
  // ...and everything the save throws away, for the same reason: what was in
  // the air, on the belt, on the pegs or on the camera is the old yard's too.
  blankEphemeral();
  clearCasino();                   // the hopper and the tray stand empty
  // The rift: a new yard has no hole in the air in it, and nothing standing on
  // the other side of one.
  S.rift = 0;
  S.riftHeld = { cores: 0, shards: 0, spores: 0, sparks: 0 };
  showPanel(null, true);           // nor one with the last game's board still up
  snapShown();
  S.crew = 0;
  setPitGrain();
  S.machines = freshMachines();     // a new yard has no machines in it
  S.looPosts = LOO_POSTS;
  S.works = {};
  sky.cells = null;
  sky.n = 0;
  clearCraft();
  S.rockSand = null;
  seedSmog();
  for (const k of Object.keys(S.mult)) S.mult[k] = 0;
  syncWorkers();
  resetRates();
  resetNotices();
  floor.grid.fill(0);
  pit.grid.fill(0);
  recount(floor);                          // both ledgers, both emptied behind `put`
  recount(pit);
  floor.painter.repaint();
  pit.painter.repaint();
  resetCut();                              // fresh rock, nought dug, nothing lying in it
  S.boulderNo = 1;
  S.shield = null;
  makeBoulder();
  settleShack();                   // beside rock one, not sliding in from where it stood
  clearBoulder();
  startBeat('leave');              // a reset is a game that has never been played
  S.shopStale = true;
  persist();
}

// --- the save, in and out of the player's hands ----------------------------
//
// The yard as it stands, not the store: the store can be a second behind,
// and on a page whose writes are failing it is the save from before this
// sitting. On a page whose save would not read (`BROKEN_KEY`), the blob that
// would not read.
export function exportSave() {
  const broken = S.broken && loadBroken();
  if (broken) return broken;
  persist();
  return lastBlob || loadRaw() || '';
}

// A pasted blob, made the yard. The order matters: the blob is shown the
// same door `load` uses, so anything `load` would ignore is refused here;
// the current save is written first (the store can be a second behind) and
// goes to PREV_KEY before the blob goes under KEY, because `restore` reads
// the store and nothing else. A blob that parses is not a blob that reads,
// and the yard is half-read by the time it throws, so the previous save goes
// back under KEY and is read again; on a page that has never saved, nothing
// is what goes back. Either way the player has the same good save after.
export function importSave(raw) {
  let s;
  try { s = JSON.parse(raw); } catch { return false; }
  if (!isSave(s)) return false;
  persist();
  const was = loadRaw();
  savePrev(was);
  saveRaw(raw);
  try {
    restore();
  } catch {
    if (was == null) clear(); else saveRaw(was);
    restore();
    bootYard();
    return false;
  }
  bootYard();
  persist();
  return true;
}

// Another slot (DESIGN.md, "Save slots and the title page"): the yard
// standing is written to its own slot, the other opened and booted the way
// an import boots. An empty slot goes through `reset` rather than the
// no-save arm of `restore`: that arm is written for a page that has just
// loaded, and starts the intro over whatever the last yard left in the
// fields the save does not carry (`beatsDone` among them, so the intro never
// came). The new slot is written the instant it is entered.
export function switchSlot(n) {
  persist();
  setSlot(n);
  // The claim is per slot (OWNER_KEY), and the boot made it for the slot open
  // then; a page that did not claim the new one would take the name there
  // for another tab's and yield every write from here on.
  claimSave();
  S.yielded = false;
  if (!loadRaw()) { reset(); return; }
  restore();
  bootYard();
  persist();
}

// The rest of what main.js does after `restore`. The view is clamped because
// the save's world may be a different width from the one the page laid out.
export function bootYard() {
  S.shopStale = true;
  syncWorkers();
  S.camX = S.camWas ?? openingCamX();
  clampCam();
}

