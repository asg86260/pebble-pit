// Reading and writing the game.
//
// The pit is stored as the height of every column plus how many grains of each
// shade there are, and the speckle is dealt out again on the way back in: what
// matters about a pile is its shape and its total, and a value per cell would be
// megabytes written every second.

import { P, CELL, SHADES, CORE_SIZE, QUARRY_BENCH0, FARM_PLOTS0, LOO_POSTS,
         ABYSS_AT, WORKER, LADDER } from './config.js';
import { load, clear, isSave, loadRaw, saveRaw, savePrev, loadBroken,
         claimTab, tabOwner, TAB, setSlot } from './save.js';
import { seedSmog, skyFromSave } from './smog.js';
import { craftSave, craftLoad, clearCraft } from './balloon.js';
import { showPanel } from './board.js';
import { S, BLANK, SAVED, SAVED_BY_HAND, EPHEMERAL, floor, pit, cut, sky, quarry } from './state.js';
import { SITES, rowFor, workFor, busyBuilderSites } from './works.js';
import { resetCut, squareCut, seamShards, dugShare, cutTop } from './quarry.js';
import { freshMachines, MACHINES, kitDisplaced } from './machines.js';
import { makeMeteor } from './meteor.js';
import { now as clockNow } from './clock.js';
import { BUILD } from './version.js';
import { at, put, count, fillFlat, isDust, recount, wakeGrid } from './grid.js';
import { resite, openingCamX, clampCam, settleShack, overCutMouth } from './world.js';
import { startIntro } from './intro.js';
import { gridToString, gridFromString, makeBoulder, clearBoulder, boulderAlive } from './rock.js';
import { setPitGrain, seedPitCores, rehomeDust } from './pit.js';
import { bandY } from './dust.js';
import { KINDS } from './shield.js';
import { syncWorkers, wearKitOnLoad, keepOf, wearRecord, newRecord, FACTORY } from './crew.js';
import { rebalance, JOBS } from './upgrades.js';
import { buildShop } from './shop.js';
import { resetRates } from './stats.js';
import { catchUpNotices, resetNotices, hushNotices } from './notices.js';
import { seed, reseed, rngState, setRngState } from './rng.js';
import { JOB, TYPE } from './jobs.js';
import { snapShown } from './tween.js';

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

// The by-hand fields, for a yard with no save behind it. Reading a save sets
// each of these in its own line below, because each needs judgment; reading no
// save needs none, and the answer is the declaration, same as `readSaved`. It
// used to be a second hand-written list -- two of them, one in `restore` and one
// in `reset` -- and each had quietly lost fields the other still had: a reset
// kept the last game's drowned pit, because `drowned` was in neither. The few
// left out here are not blanked but *built* -- the rock and its size by
// `makeBoulder`, the machines by `freshMachines`, the crew by walking out -- and
// the run's seed and the view are settled by whoever called.
const BUILT = new Set(['runSeed', 'camX', 'floor', 'boulder', 'gw', 'gh', 'boulderNo',
                       'machines', 'workers']);
function blankByHand() {
  for (const k of SAVED_BY_HAND) if (!BUILT.has(k) && k in BLANK) S[k] = copyOf(BLANK[k]);
}

// The session's fields, for a yard that is starting over. A reset used to name
// the ones it cleared -- the chips in the air, the belt, the weather -- and,
// like the two by-hand lists before it, the naming was where the leaks were: a
// casino wheel mid-spin, a cutscene half played, the quarry's running total
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
                       'staged', 'build', 'tick', 'lastFrame', 'dirty', 'fatal',
                       'placed', 'strips']);
function blankEphemeral() {
  for (const k of EPHEMERAL) if (!PAGES.has(k) && k in BLANK) S[k] = copyOf(BLANK[k]);
}

// The last blob this page built, written or not. SAVE A COPY hands this over
// when the store would not take it: it used to read the store back, which on a
// page whose writes were failing was the save from before the evening's play.
let lastBlob = null;

export function persist() {
  // A yard that has thrown is not written down. The loop stops on a throw, but
  // the interval that calls this does not, and once a second it would put the
  // state that just threw over the last save that was whole -- a bug that
  // should have cost a reload costing the run instead. See crash.js.
  if (S.fatal || !S.dirty) return;
  // A yard stood at a scene is not the player's and is never written down:
  // the save they left is kept aside until `my yard` on the sheet puts it
  // back. See scenesheet.js.
  if (S.staged) return;
  // Another page has written since this one did (wave-critics, A10): this
  // page's yard is the stale one, and writing it would put a background tab's
  // hour-old yard over the hour just played in the other. It stops writing and
  // says so on the held sheet; main.js reloads it when it is next looked at.
  // Only a page that has made a claim can be overtaken -- the node yard never
  // claims and never yields. And only another page's name counts: no name at
  // all means the store cannot be read (a third-party iframe on a browser
  // that blocks its storage, a store cleared under a running page), not that
  // anyone else is writing. That case once yielded too, and a page that has
  // yielded is reloaded the next time it is looked at -- onto a store that
  // held nothing -- so tabbing away and back reset the game.
  const owner = claimed ? tabOwner() : TAB;
  if (S.yielded || (owner !== null && owner !== TAB)) { S.yielded = true; return; }
  S.dirty = false;
  lastBlob = JSON.stringify(blob());
  // ...and whether the store took it. A private window, a quota or an eviction
  // used to be swallowed in save.js, and the game ran on unsaved with no word
  // and no way to get the yard out (A11). The sheet reads `S.unsaved`.
  S.unsaved = !saveRaw(lastBlob);
}

// Whether this page has put its name beside the save. main.js does, once, at
// boot; nothing else ever does.
// A claim that could not be written -- localStorage full or refused -- is no
// claim: the name left there is some earlier page's, and a page that treated
// it as another tab's would stand aside for nobody, reload when looked at,
// and stand aside again. Such a page is unguarded against a second tab, and
// that is the smaller loss.
let claimed = false;
export function claimSave() { claimed = claimTab(); }

// Everything a save is, as one object. `persist` writes it; `exportSave` hands
// it over as it stands.
function blob() {
  return {
    ...savedFields(),
    // Which build wrote it (wave-desk-sound, track A): the page's own stamp,
    // not `S.build`, which is the stamp of whoever wrote the save this yard
    // was read out of. A save is compared against the app that opens it, and
    // the comparison only means something if every save says who wrote it.
    build: BUILD,
    // When, for the saves page to say how long ago a yard was last played.
    // Read by nothing that boots a yard.
    savedAt: Date.now(),
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
    // the arc: what the rift has eaten and whether the hole has given way.
    // Losing these would reload a drowned yard back into its disc era.
    riftAte: S.riftAte,
    drowned: S.drowned,
    // Where the view is. Scrolling the yard is how you look at any of this, and
    // a reload that dumped you back at the rock threw away the one piece of
    // where-you-were the player sets by hand. Rounded because a pixel of a
    // pixel is not worth the characters.
    // ...as a seat at the yard's own zoom, while a scene has it pulled in: the
    // scene ends on the event now, so its seat is the right one to keep, but
    // `camX` mid-scene is the left edge of a narrower view than the one that
    // comes back (C14)
    camX: Math.round(S.cine ? S.camX + S.viewW / 2 - S.W * P / CELL / 2 : S.camX),
    // ...and a core on the cursor is written where the cursor was, so it comes
    // back there rather than at a fifth of the world's width (critics C14)
    core: S.coreItem && !S.heldCore ? { x: S.coreItem.x, y: S.coreItem.y }
        : S.heldCore && S.mouse ? { x: S.mouse.x - CORE_SIZE / 2, y: S.groundY - CORE_SIZE } : null,
    coreLoose: S.heldCore || !!S.coreItem,
    // what the sites have given up and nobody has carried in yet: it was never
    // counted, and a reload pocketing it would be the game taking it back
    crew: S.crew,
    // The crew itself, not just how many of them there are. A body has a name
    // and a record now, and rebuilding the yard from four counts would hand you
    // back four strangers standing where your crew was.
    who: S.workers.map(keepOf),
    // and where the mouth of the cut was under them, so a load can tell a
    // layout that moved from one that did not -- see `restoreCrew`
    mouth: S.quarryOpen ? quarry.x : null,
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
    rescued: S.rescued,
    shield: S.shield && { kind: S.shield.kind, x: S.shield.x, w: S.shield.w,
                          h: S.shield.h, rise: S.shield.rise, laid: S.shield.laid },
    shieldsDone: [...S.shieldsDone],
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
    // What is riding the belt: a fast belt holds ninety-odd grains at a time
    // and every reload used to eat them, the defect the crew's hands were
    // cured of (critics C14). Position and shade; the band's height is the
    // world's to answer on the way back in.
    belt: (S.belt || []).map(b => [Math.round(b.x), b.s]),
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
    // ...and where the rock's centre stood when it was written, which is the
    // ground's own anchor: the yard is laid out leftwards from it, so a save
    // read into a world whose left-hand ground has since widened knows exactly
    // how far its dust has to slide. See `floorShift`.
    floor: { cols: floor.cols, rows: floor.rows, cx: S.cx, cells: gridStr(floor) },
    pit: pitToSave(),
    // The cut's own sand, kept the same way the floor's is: a shape and a
    // run-length string. It only means anything alongside `quarryCells`
    // above, so the two are written and read together.
    cut: cut.grid ? { cols: cut.cols, rows: cut.rows, cells: gridStr(cut) } : null
  };
}

// Reading a saved plot into one that has grown at its left-hand end.
//
// The world only ever grows that way. The rock and the lip are the two things
// that never move relative to each other, and everything else is laid out
// leftwards from them, so widening the yard is widening the ground in front of
// the boulder -- which slides every building, and every grain lying under one,
// the same number of columns to the right. `GROUND_LEFT` is derived from the
// site table now (config/sites.js), so a station that grows widens the world
// rather than walking off the end of it, and that is a thing that can happen to
// a yard somebody has already been playing.
//
// Without this the save still loaded: `fillFlat` below re-packs the same NUMBER
// of grains flat along the floor. What that loses is where they were lying and
// what each of them was -- a shard, a spore, a spark, all of it re-dealt as
// plain grey dust at the bottom of the yard. Which is a heap you carried,
// carried away.
//
// It is written straight into the cells rather than through `put` for the same
// reason `gridFill` is: a run at a time, with one `recount` at the end.
// `dx` may be negative. The world only ever GREW when this was written -- the
// comment above still says so, because that was true of every change that had
// happened to it -- and then a spacing number turned out to be reserving ground
// the rock had already stopped needing (see TO_FIRST_SITE, config/sites.js), and
// the yard got nineteen columns narrower. A save from the wider world fell
// through to `fillFlat` and had its heaps re-dealt as flat grey dust: the exact
// loss this function exists to prevent, in the one direction it did not cover.
//
// Sliding left is the same walk with the same anchor. What runs off the near
// end is dropped rather than refused, because those columns are the bare
// YARD_MARGIN ground past the last building -- somewhere for the camera to stop,
// which nobody heaps on. A grain out there is a grain the yard has no room for
// any more, and dropping it is the truthful answer; keeping it would mean
// folding it back on to a column that already has its own.
function gridSlide(b, s, dx) {
  if (s.rows !== b.rows) return false;
  // The far end has to land inside the new floor whichever way the walk went:
  // what may be dropped is the near end, and only the near end. A saved grid
  // that would hang off the RIGHT is not a moved world, it is a different one,
  // and `fillFlat` is the right answer to that.
  if (s.cols + dx > b.cols) return false;
  // and a slide of nought is only a slide if the two floors are the same width
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

// How far a saved floor has to slide to line up with today's yard, in columns.
//
// A save carries the ground's own anchor -- where the rock's centre stood when
// it was written -- so the answer is exact whichever end of the world moved.
// A save from before that was written down does not, and for those the column
// count is the answer: the only thing that has ever changed the floor's width is
// the ground in front of the boulder, so every column it gained or lost, it
// gained or lost on the left. The `max(0, ...)` stays on that older path -- a
// save with no anchor cannot say which way the ground moved, and guessing a
// slide on one is worse than not sliding at all.
const floorShift = saved =>
  !saved ? 0
  : Number.isFinite(saved.cx) ? Math.round((S.cx - saved.cx) / P)
  : Math.max(0, floor.cols - (saved.cols || floor.cols));

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
    settleShack();
    clearBoulder();
    S.coreBuried = false;
    startIntro();
    // A first visit, or a save that would not read. The second is not the
    // first: `load` has put the blob aside, and the sheet offers it for as
    // long as it is there.
    S.broken = !!loadBroken();
    S.newerSave = null;             // no save, so no build to be newer than this one
    // Reading a save that is not there. Every plain field goes back to what
    // state.js says a yard is, which is what "no save" means -- and it is the
    // same one line as reading a save, so the two cannot drift apart. This used
    // to be sixty assignments, and it had already lost several of them.
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
    S.quarryOwed = 0;
    S.buildOrder = [];
    for (const k of Object.keys(S.mult)) S.mult[k] = 0;
    S.plots = [];
    S.plotTone = [];
    S.shield = null;
    S.shieldsDone = [];
    S.rockHeld = false;
    S.rescued = false;
    return;
  }
  // The hut where this save's rock puts it, now that the rock is known. The
  // yard was laid out with the hut off rock one; a save from rock forty-two
  // would otherwise come back with the hut inside the boulder and the gang's
  // kit stand under it, scooting out over the first seconds of play.
  settleShack();
  // Everything the save keeps as it stands, in one pass off the list in
  // state.js. It runs first because the hand-written lines below it read what it
  // sets -- the rift is clamped to `S.stored`, the wizards to `S.wizardHats` --
  // and because a field nobody has had to think about should not need a line
  // here at all.
  readSaved(s);
  // The version boundary (wave-desk-sound, track A). A save from a build newer
  // than this one is loaded anyway -- the game has never broken a save going
  // backward, and refusing would be the punishment -- but the sheet says so
  // the first time it is opened. Dates compare as strings because they are
  // written as YYYY-MM-DD; a dev build has no date and never says anything.
  S.build = s.build && typeof s.build === 'object' ? { hash: String(s.build.hash ?? ''), date: String(s.build.date ?? '') } : null;
  S.savedAt = Number.isFinite(s.savedAt) ? s.savedAt : null;
  S.newerSave = S.build?.date && BUILD.date && S.build.date > BUILD.date ? S.build.date : null;
  S.banked = s.banked || s.stored || 0;
  S.shownStored = S.stored; snapShown();
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
  // The lab is gone, so nobody is a scholar any more. The bodies are not: they
  // are read out of the save like everybody else and `rebalance` below hands
  // them to the spare pool, because a job whose room is nought is a job with
  // nobody in it. Read rather than dropped so the headcount still adds up --
  // `S.crew` below counts them -- or a save with four in the lab would come back
  // four bodies short. See DESIGN.md, "The lab is deleted".
  S.scholars = 0;
  const wasScholars = s.scholars ?? s.labbers ?? 0;
  // A save from before the crew was one pool has a headcount per job and no
  // total. Adding them up is the whole migration: the same bodies, on the same
  // jobs, and now they can be moved.
  S.crew = s.crew ?? (s.rockhands ?? s.miners ?? 0) + (s.haulers || 0) + (S.quarriers || 0) + (s.farmhands || 0)
                     + wasScholars;
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
  // The harness and the boots were ladders of their own over what a hauler
  // carries and how fast it walks; a save carrying either folds it into the one
  // ladder each is now (2026-09-12), trimmed to the ladder's top.
  S.haulCarryLevel = Math.min(LADDER, (S.haulCarryLevel || 0) + (+s.harnessLevel || 0));
  S.haulPaceLevel = Math.min(LADDER, (S.haulPaceLevel || 0) + (+s.bootsLevel || 0));
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
  // A save from before the shields existed has plainly not raised one. The
  // catch is not restored: a rock held in the air is a beat a few seconds
  // long, and a save reloaded into the middle of it would come back to a rock
  // resting on nothing if anything about the arch had changed. It falls.
  S.shield = s.shield ? { kind: s.shield.kind, x: s.shield.x, w: s.shield.w,
                          h: s.shield.h, rise: s.shield.rise || 0,
                          laid: s.shield.laid || 0, caught: 0, held: 0,
                          strain: 0, sag: 0,
                          setting: false, poured: 0 } : null;
  // A pour picks up where it left off rather than starting again: what is
  // woven is the fact, so the wizard-seconds behind it are worked back out of
  // it and the ring carries on from there.
  if (S.shield && KINDS[S.shield.kind].cast) {
    const k = KINDS[S.shield.kind];
    S.shield.poured = (S.shield.laid / k.pieces) * k.work;
  }
  S.shieldsDone = Array.isArray(s.shieldsDone) ? s.shieldsDone : [];
  S.rockHeld = false;
  S.intro = null;
  S.camLockY = null;
  S.pair = [];
  S.buried = s.buried ?? !!s.introDone;
  // A save from before the second cap existed arrives with two posts already --
  // it built the closet when that was the whole of what it bought, and nobody
  // loses a cap they had to a rung that did not exist yet.
  S.looPosts = s.looPosts ?? 2;
  // A save from when only the lab announced a finish carries `labDone`; it is
  // the same news under the per-site name now.
  if (s.labDone) S.siteDone = { ...S.siteDone, lab: s.labDone };
  // A save from before the dome existed has plainly not got anybody out yet.
  S.rescued = !!s.rescued;
  if (S.rescued) S.buried = false;
  // A save from before the ending sheet, with the rescue already behind it,
  // has had its ending: the sheet is for the moment, not for a reload weeks
  // later.
  if (!('storyTold' in s)) S.storyTold = S.rescued;
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
  // A save from when the record was stamped off the clock: the stamps are
  // page-relative milliseconds, and any one of them outranks a sequence number.
  // Renumber them in the order they had, and carry the count on from there.
  const stamps = Object.entries(S.wonAt || {});
  if (stamps.some(([, v]) => v > 100000)) {
    stamps.sort((a, b) => a[1] - b[1]);
    S.wonAt = Object.fromEntries(stamps.map(([k], i) => [k, i + 1]));
    S.wonSeq = stamps.length;
  }
  S.belt = Array.isArray(s.belt)
    ? s.belt.filter(b => Array.isArray(b) && Number.isFinite(b[0])).map(([x, sh]) => ({ x, y: bandY(), s: sh || 1 }))
    : [];
  // A save from when there was a shelf outside the school (`hatShelf`) is not
  // read: the hats on it were already in the station's count, and with no
  // shelf to wait on they are on the stand from the frame the yard comes back
  // -- the one pop-in, once, for a building that no longer stands. A teacher
  // in such a save is a job the roster no longer has, and comes back carrying.
  // A list a site now, because a site takes as many works as it has room for --
  // one everywhere, two at a lab with a second bench. A save written before that
  // holds one object a site, so it is read as a list of one: a yard mid-build
  // that came back with nothing on the go would have taken the money and left
  // nothing being built.
  // Walked by the save's own keys rather than today's `SITES`, because a site
  // can stop existing between builds (the school) and the work filed under it
  // is re-homed below rather than dropped.
  S.works = {};
  for (const site of Object.keys(s.works || {})) {
    const was = s.works[site];
    const list = Array.isArray(was) ? was : was ? [was] : [];
    for (const w of list) {
      if (!(w && w.key && rowFor(w.key) && w.of > 0)) continue;
      // Under the site the row says today, not the site the save filed it
      // under: a work is re-homed when a row moves sites between builds (the
      // kit rows were the school's, and the yard's before that), so a saved
      // half-made hat does not come back blocking a site that is not there.
      const home = rowFor(w.key).site || site;
      if (!SITES.includes(home)) continue;
      (S.works[home] ||= []).push({ key: w.key, done: Math.max(0, Math.min(w.of, w.done || 0)),
                                    of: w.of, at: w.at ?? null });
    }
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
  // The weather in flight comes back with the sky (decided 2026-09-14, the
  // reliability freeze). It used to be dropped -- "a shower with no beginning
  // is not a shower" -- and every refresh mid-storm cleared the sky: eleven
  // checks about rain went red the day every check became a reload check.
  // `raining`, `rainFor` and `stormFor` are plain saved fields now; the bolt is
  // a flash of a few frames and is not.
  S.bolt = null;
  S.poop =Array.isArray(s.poop) ? s.poop.slice() : [];
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
  // ...on the ground they were saved on, if the mouth of the cut is where the
  // save says it was: then a body over it is over it on purpose.
  restoreCrew(s.who, Number.isFinite(s.mouth) && s.mouth === quarry.x);
  // A body written down is a body in the yard.
  //
  // The headcount and the list of people are two records of the same thing, and
  // a save can carry them disagreeing -- the yard in `test/fixtures` does, with
  // `crew: 23` over twenty-four people. Whichever way that happened, the bodies
  // are the thing that exists and the count is only a tally of them, so the
  // count gives way to the list rather than the other way about.
  //
  // It matters because `rebalance` deals the crew out into jobs and
  // `syncWorkers` below stands down anybody the deal has no room for: one short
  // in the count is one person gone on the reload, name, record and all. That
  // used to be covered by an accident of reading order -- the janitors and the
  // stirrers were read *after* `rebalance`, so the deal counted fewer jobs than
  // the yard had and happened to leave a spare hauler's worth of room -- and
  // reading the save off one list took the accident away with it. Saying it
  // outright is better than either, because it does not care what order
  // anything is read in.
  //
  // Only when the list is the longer of the two, and the deal is done again
  // when it is: `rebalance` is where `S.haulers` comes from, so a crew corrected
  // after it has run is a correction nobody is standing for.
  if (S.workers.length > S.crew) { S.crew = S.workers.length; rebalance(); }
  syncWorkers();               // and anybody the counts say is missing
  // A save written BEFORE the record existed satisfies a great many rules at
  // once, and thirty ticks is a feature introducing itself by shouting. Those
  // are earned silently and marked already read: these are things you did, and
  // the board is late, not you.
  //
  // Only that save, though, and it is asked of the SAVE rather than of a flag
  // on S. Any save this version wrote carries `won`, and running the catch-up
  // on one of those would mark every notice you had earned and not yet gone and
  // looked at as read -- closing the tab would quietly clear the board's tick.
  if (!(s && 'won' in s)) catchUpNotices();
  S.noticeMigrated = true;
  hushNotices();               // what this save already earned is on the sheet, not in the air
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
  restoreGrid(floor, s.floor, floorShift(s.floor));
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
  // The arc. A save that has never heard of it (`riftAte` missing) but has a
  // torn rift was written when the tear and the drowning were the same moment,
  // so it comes back drowned -- nobody is pulled back an era -- and its eaten
  // count is seeded from what is through the rift, floored at the threshold so
  // the derived disc size and the drowning trigger both agree with the era.
  S.drowned = s.riftAte !== undefined ? !!s.drowned : !!s.riftOpen;
  S.riftAte = Math.max(0, Math.round(+s.riftAte || 0));
  if (s.riftAte === undefined && S.riftOpen)
    S.riftAte = (S.rift || 0) + Object.values(S.riftHeld).reduce((a, b) => a + b, 0);
  if (S.drowned) S.riftAte = Math.max(S.riftAte, ABYSS_AT);
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
    // The save's grid brings what was lying loose, and nothing about the rock:
    // that is the count's to say. See `squareCut`.
    squareCut();
    recount(cut);
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
//
// The scholar is the second job to stop existing, and it comes back the same way
// the rift-holder does: as a carter. The lab is gone, so there is no room to put
// one in -- and a body whose type this build has no factory for is dropped on the
// line below, which is a body lost out of somebody's save. It was: a fixture with
// twenty-five people in it came back with twenty-four. Both of its old names map
// here, because `labber` was what a scholar was called before the rename.
const OLD_TYPE = { rifter: TYPE.HAUL, miner: TYPE.ROCK,
                   labber: TYPE.HAUL, scholar: TYPE.HAUL,
                   scrubber: TYPE.PURIFY };
// And the same renaming again on the *job*, because a body does not only say
// what it is -- it says which station's hat it is wearing (`kitOf`), and that is
// a job name. A save written before the rename has a body in a "miners" hat,
// which is a hat no station keeps any more: `verifyWorld` calls that out as kit
// that is not in the table, and rightly.
// ...and the hat, for the same reason. A scholar's hat is a hat no station keeps
// any more, so it comes off with the job: `verifyWorld` calls out kit that is not
// in the table, and rightly.
const OLD_JOB = { miners: JOB.ROCK, labbers: JOB.HAUL, scholars: JOB.HAUL,
                  scrubbers: JOB.PURIFY };

function restoreCrew(who, sameGround = false) {
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
    let rec = OLD_JOB[k.kitOf] ? { ...k, kitOf: OLD_JOB[k.kitOf] } : k;
    // A body that was standing inside a building this build no longer has.
    //
    // The rift-holder above comes back "where it stood", and that works because
    // the strip it stood on is still there to stand on. A scholar's was the
    // inside of the lab, and the lab is gone: kept, the body loads at the door of
    // a building that is not there -- `verifyWorld` caught it two hundred and
    // seventy-six pixels under the ground line, which is a person buried in the
    // yard. So the position goes and the factory's own is used, which puts it on
    // its feet on the ground; it then walks wherever the roster sends it, and
    // nothing teleports because nothing was anywhere to teleport from.
    // `TYPE.SCHOLAR` rather than the word: job names are spelled in jobs.js and
    // nowhere else, which vocabulary.test.mjs holds the line on. `labber` has no
    // constant -- it is a name from before the rename, like the keys of the map
    // above -- so it stays a literal.
    if (k.type === TYPE.SCHOLAR || k.type === 'labber') {
      const { x, y, goal, inside, site, ...rest } = rec;
      rec = rest;
    }
    // A body that was standing on ground this layout has a hole in. The walk
    // closes up and spreads out as the yard's spacing changes (`padOf`, config/
    // sites.js), and a save's bodies keep the x they were saved at -- so a
    // farmhand saved on bare yard came back at ground height over the mouth of
    // the cut, where the ladder and the dance took turns with it. It stands at
    // the near edge of the mouth instead, on ground that is there, and walks
    // from that. A body saved DOWN in the cut is in the cut on purpose and keeps
    // its place; only a body at ground height is over a hole it never entered.
    //
    // ...at ground height exactly, not above it: a carter saved on the bridge
    // deck stands over the mouth too, a few cells up, and the old test (feet
    // at or above the line) moved it ten cells sideways on every reload
    // (critics 2026-09-10, C14). The deck is a way, and a body on a way is
    // where it is.
    //
    // Unless it is a quarrier at work, in which case the mouth is exactly
    // where it belongs. Put on the far bank it walked the whole top of the cut
    // at the shuffle, climbed down and started again -- a gang that loitered
    // for five seconds on every refresh (reported 2026-09-13). It stands on the
    // cut's floor under its own x -- the same height the work leg would put it
    // at on its first frame -- whatever the save said about its y.
    //
    // And none of it when the mouth is where the save left it. The whole
    // premise here is a layout that moved under the crew between one build and
    // the next; on the same layout a body at ground height over the mouth is
    // at the head of the ladder, mid-stride, and is there on purpose. Moved
    // anyway, a quarrier stepping on to the ladder hopped eight cells back on
    // every refresh, and one stepping off it was dropped a course into the
    // cut -- the reload harness in test/helpers.mjs named both, and this is
    // the third patch on the same spot. The save says where the mouth was.
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
  // A staged yard is nobody's (scenesheet.js, the landing page's demo): it
  // is never written down, and clearing the slot under it would erase the
  // player's yard to make room for a picture.
  if (!S.staged) clear();
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
  blankByHand();
  // ...and everything the save throws away, for the same reason: what was in
  // the air, on the belt, on the wheel or on the camera is the old yard's too.
  blankEphemeral();
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
  startIntro();                    // a reset is a game that has never been played
  buildShop();
  S.dirty = true;
  persist();
}

// --- the save, in and out of the player's hands (wave-release, track C) ------
//
// The two doors the settings sheet opens. `exportSave` is the raw blob, exactly
// as stored -- huge, honest, and pasteable into a bug report, which is what
// `copy save` on the dev panel has always handed over. `importSave` is the
// other way: parse, check the shape the way `load` does, keep the current save
// under a second key until the new one has restored cleanly, and only then let
// it go. It returns true on a yard that took, false on a blob that was refused,
// and a page that had a good save before has the same good save after either
// answer.
//
// The yard as it stands, not the store: the store can be a second behind, and
// on a page whose writes are failing it is the save from before this sitting.
// And on a page whose save would not read (see `BROKEN_KEY`), the blob that
// would not read -- the one thing the player has left of that run.
export function exportSave() {
  const broken = S.broken && loadBroken();
  if (broken) return broken;
  S.dirty = true;
  persist();
  return lastBlob || loadRaw() || '';
}

// A pasted blob, made the yard.
//
// The order matters. The blob is parsed and shown the same door `load` uses,
// so anything `load` would ignore on the next boot is refused here rather than
// written and then ignored. What is under KEY now goes to PREV_KEY before the
// blob goes under KEY, because `restore` reads the store and nothing else: the
// blob has to be the save before the yard can be read out of it, and the
// player's own save has to be somewhere else by then.
//
// Then the boot, as main.js does it and nowhere else: `restore`, the shop rows
// the save decides, and anybody the counts say is missing. This is the one
// place outside main.js that boots the yard, because it is the one place a
// whole different yard arrives while the page is already up -- the sheet is
// open and the player is looking, so the page is not reloaded to do it.
//
// `restore` throwing is the case the second key is for. A blob that parses is
// not a blob that reads: a field of the wrong shape can throw from anywhere in
// a thousand lines, and the yard is half-read by then. So the previous save
// goes back under KEY and is read again, which is the same call a page load
// makes and leaves the same yard it would leave. The player had a good save
// before and has the same good save after.
//
// On a page that has never saved, "the previous save" is nothing, and nothing
// is what goes back: a fresh game, which is what the page had. The sky, the
// pit and the crew are all rebuilt by `restore` from what is under KEY, so a
// half-read yard leaves no residue the second read does not overwrite.
//
// The yard is written down first. What is kept is the yard the player is
// looking at, not the one the interval last got round to: the store can be a
// second behind the game, and a second of a yard is a second of somebody's
// run.
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
  S.dirty = true;
  persist();
  return true;
}

// Another slot (DESIGN.md, "Save slots and the title page"): the yard standing
// is written to its own slot, the other is opened, and it is booted the way
// an import boots -- `restore` reads the store and the store now knows its
// slot. An empty slot is the new game, and goes through `reset` rather than
// the no-save arm of `restore`: that arm is written for a page that has just
// loaded, and starts the intro over whatever the last yard left in the fields
// the save does not carry -- `introDone` among them, so the intro never came.
// `reset` blanks all of it first, which is what a new game is. The yard you
// left is untouched under its own key either way, and the new slot is written
// the instant it is entered so a page reloaded a moment later comes up on it.
export function switchSlot(n) {
  persist();
  setSlot(n);
  // The claim is per slot (save.js, OWNER_KEY), and the boot made it for the
  // slot open then: the new slot's key holds whichever page last wrote there,
  // and a page that did not claim it would take that name for another tab's
  // and yield every write from here on -- a yard switched into and never
  // saved. So the switch claims, the way the boot does.
  claimSave();
  S.yielded = false;
  if (!loadRaw()) { reset(); return; }
  restore();
  bootYard();
  S.dirty = true;
  persist();
}

// The rest of what main.js does after `restore`, so a yard that came in
// through the sheet stands the way one that came in through a page load does:
// the rows, the bodies, and the view where the save left it -- clamped, because
// the save's world may be a different width from the one the page laid out.
// Exported for the scene sheet, which puts a kept save back the same way.
export function bootYard() {
  buildShop();
  syncWorkers();
  S.camX = S.camWas ?? openingCamX();
  clampCam();
}

