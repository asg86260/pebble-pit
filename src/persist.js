// Reading and writing the game: the loop over the savers, and the codec for
// the three plots. Every saved fact is written and read by its owner's `SAVE`
// (`SAVERS` below); what is here is the plain copies, the stamp, the chance,
// and the grids. The pit is stored as the height of every column plus how
// many grains of each shade there are, and the speckle is dealt out again on
// the way back in: a value per cell would be megabytes written every second.

import { P, SHADES, LOO_POSTS, SAVE_V } from './config.js';
import { load, clear, isSave, loadRaw, saveRaw, savePrev, loadBroken,
         claimTab, tabOwner, TAB, setSlot } from './save.js';
import { seedSmog, SAVE as SMOG } from './smog.js';
import { resetWeather } from './weather.js';
import { slideLayers } from './smog/layer.js';
import { SAVE as BALLOON } from './balloon.js';
import { showPanel } from './board.js';
import { S, BLANK, SAVED, SAVED_BY_HAND, EPHEMERAL, floor, pit, cut } from './state.js';
import { SAVE as WORKS } from './works.js';
import { resetCut, squareCut, SAVE as QUARRY } from './quarry.js';
import { SAVE as MACHINES } from './machines.js';
import { SAVE as METEOR } from './meteor.js';
import { BUILD } from './version.js';
import { at, fillFlat, isDust, recount, wakeGrid } from './grid.js';
import { openingCamX, clampCam, SAVE as VIEW } from './world.js';
import { SAVE as CASINO } from './casino.js';
import { SAVE as INTRO } from './intro.js';
import { SAVE as BEATS } from './beats.js';
import { SAVE as ROCK } from './rock.js';
import { setPitGrain, SAVE as PIT } from './pit.js';
import { SAVE as DUST } from './dust.js';
import { SAVE as SHIELD } from './shield.js';
import { syncWorkers, SAVE as CREW } from './crew.js';
import { SAVE as LIFTS } from './crew/lifts.js';
import { SAVE as STAFF } from './staffing.js';
import { SAVE as TOWER } from './tower.js';
import { SAVE as CORE } from './core.js';
import { SAVE as DANCE } from './crew/dance.js';
import { SAVE as FARM } from './farm.js';
import { resetRates } from './stats.js';
import { resetBooks } from './income.js';
import { resetNotices } from './notices.js';
import { seed, reseed, rngState, setRngState } from './rng.js';
import { migrate } from './migrations/index.js';
import { snapShown } from './tween.js';
import { SAVE as DEEP_BED } from './deep/scales.js';

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

// --- the loop's own savers -------------------------------------------------------
// Every other saver is exported by the owner of what it saves; these five
// are the loop's, because what they save has no owner above state.js: the
// stamp, the chance (rng.js is below state.js and cannot see `S`), and the
// three plots, which go through the codec above.

// Which build wrote the save, in which shape, and when.
const STAMP = {
  fields: ['build', 'saveV', 'savedAt'],
  write(out) {
    // The page's own stamp, not `S.build` (whoever wrote the save this yard
    // was read out of): the comparison against the app that opens a save
    // only means something if every save says who wrote it. The stamp is
    // also the save floor: a blob with none is not read (save.js).
    out.build = BUILD;
    // Which shape the save is in, for the migrations (src/migrations/).
    out.saveV = SAVE_V;
    // For the saves page; read by nothing that boots a yard.
    out.savedAt = Date.now();
  },
  read(s) {
    // The version boundary: a save from a newer build is loaded anyway, and
    // the sheet says so once. Dates compare as strings because they are
    // written as YYYY-MM-DD; a dev build has no date and never says anything.
    S.build = { hash: String(s.build.hash ?? ''), date: String(s.build.date ?? '') };
    S.savedAt = Number.isFinite(s.savedAt) ? s.savedAt : null;
    S.newerSave = S.build.date && BUILD.date && S.build.date > BUILD.date ? S.build.date : null;
  },
  // What the store said about this page is the store's to say (`restore`'s
  // fresh arm); a reset does not unsay it.
  blank() {}
};

// The run's name and the stream it is partway through.
const RNG = {
  fields: ['runSeed', 'rngState'],
  write(out) {
    // The seed alone would start the stream over on every reload, so the
    // generator's one word of state goes with it (rng.js).
    out.runSeed = S.runSeed;
    out.rngState = rngState();
  },
  read(s) {
    // A save with neither keeps the stream the generator seeded itself with
    // (rng.js) and is told what it is called.
    S.runSeed = Number.isFinite(s?.runSeed) ? s.runSeed >>> 0 : seed();
    if (Number.isFinite(s?.rngState)) setRngState(s.rngState);
  },
  // The seed is whoever called's to settle: `reset` draws one, `seedGame`
  // keeps the one it was given.
  blank() {}
};

// The ground.
const FLOOR = {
  fields: ['floor'],
  write(out) {
    // `cx` is the ground's anchor: the yard is laid out leftwards from it,
    // so a save read into a world whose left-hand ground has since widened
    // knows how far its dust has to slide (`floorShift`).
    out.floor = { cols: floor.cols, rows: floor.rows, cx: S.cx, cells: gridStr(floor) };
  },
  read(s) {
    restoreGrid(floor, s.floor, floorShift(s.floor));
    slideLayers(floorShift(s.floor));   // and the mess on it, by the same columns
  },
  blank() {
    floor.grid.fill(0);
    recount(floor);                          // the ledger, emptied behind `put`
    floor.painter.repaint();
  }
};

// The pile in the hole. The rift (pit.js) reads right after this, because
// how much belongs in the hole depends on how much is already through.
const PIT_CELLS = {
  fields: ['pit'],
  write(out) { out.pit = pitToSave(); },
  read(s) { if (!pitFromSave(s.pit)) pit.grid.fill(0); },
  blank() {
    pit.grid.fill(0);
    recount(pit);
    pit.painter.repaint();
  }
};

// The cut's own sand. Only means anything alongside `quarryCells`
// (quarry.js), so the two are written together; read last, after the ground.
const CUT = {
  fields: ['cut'],
  write(out) {
    out.cut = cut.grid ? { cols: cut.cols, rows: cut.rows, cells: gridStr(cut) } : null;
  },
  read(s) {
    // Rock laid fresh to the depth just restored, then the dust that was
    // lying on it overlaid, but only if the save's cut is the exact shape
    // of this grid; otherwise `resetCut` alone is an empty cut.
    resetCut();
    if (cut.grid && s.cut && s.cut.cols === cut.cols && s.cut.rows === cut.rows &&
        gridFill(cut, s.cut.cells)) {
      // The save's grid brings what was lying loose, and nothing about the
      // rock: that is the count's to say (`squareCut`).
      squareCut();
      recount(cut);
      if (cut.painter) cut.painter.repaint();
    }
  },
  blank() { resetCut(); }                    // fresh rock, nought dug, nothing lying in it
};

// --- the savers, in the order the yard is read back ------------------------------
// One list, and it IS the order: `blob` writes it top to bottom, `restore`
// reads it top to bottom, and a reset blanks it top to bottom. Every by-hand
// name in state.js is in exactly one entry's `fields`
// (test/persist-roundtrip.test.mjs). Entries with a comment saying what
// breaks if they move are the point of the list.
export const SAVERS = [
  // The first three are read before the yard is told whether it has a save,
  // on either arm (`FIRST` below): the seed and the stream first, before
  // anything draws on them; the seat, read at boot and nowhere else; and the
  // rock, because whether the rock reads *is* whether there is a save.
  RNG,
  VIEW,
  ROCK,
  STAMP,
  CORE,
  DANCE,
  // Before the deal: a restored machine changes what its station's cap
  // *is*, and a rebalance against the old cap leaves five bodies at a cut
  // that now holds one, with nothing recomputing it per frame. The dev
  // reload (`persist()` then `restore()` in one process) hides this,
  // because the in-memory machine is still running.
  MACHINES,
  // The craft before the deal for the same reason: the filter's cap is one
  // body plus one a craft, and dealt against the house alone every rider is
  // stood down on every load.
  BALLOON,
  // The wizards' count before the deal too: every job count has to be back
  // before the spares are worked out, or the wizards are counted as haulers
  // and three more bodies are stood up on every load.
  TOWER,
  // The load's `rebalance`, and the loan: after the machines, the craft and
  // every job count, before the crew is stood.
  STAFF,
  QUARRY,
  BEATS,
  // The catch is taken again here, once the rock's fall has been read.
  SHIELD,
  WORKS,
  DUST,
  METEOR,
  SMOG,
  CASINO,
  FARM,
  // The crew after `resite` (its own first line): the yard is as deep and
  // as wide as it was before a body is stood on it.
  CREW,
  // The forklifts after the crew, whose rebalance they are not part of.
  LIFTS,
  FLOOR,
  // The rift comes back before the dust is put away, because how much
  // belongs in the hole depends on how much is already through; the pit's
  // grain before its pile.
  PIT_CELLS,
  PIT,
  // The deep's floor, laid under the world once the world has its size.
  DEEP_BED,
  // The cut after `resetCut`, which reads the depth the quarry put back.
  CUT,
  // Last: the opening's pair are stood at the door after everything else is
  // back and before the first frame is drawn.
  INTRO
];
const FIRST = new Set([RNG, VIEW, ROCK]);

// Everything a save is, as one object.
function blob() {
  const out = savedFields();
  STAMP.write(out);
  for (const o of SAVERS) if (o !== STAMP) o.write(out);
  return out;
}

export function restore() {
  const s = load();
  // The raw save is brought up to today's shape before a field of it is read
  // (src/migrations/); everything below reads today's shape and nothing else.
  if (s) migrate(s);
  RNG.read(s);
  VIEW.read(s);
  const rock = ROCK.read(s);
  if (!s || !rock || typeof s.stored !== 'number') {
    // A game that has never been played starts with two people, and the rock
    // is what happens to them (intro.js).
    // A save that would not read, or one from below the floor, has been put
    // aside by `load`, and the sheet offers it for as long as it is there.
    S.broken = !!loadBroken();
    S.newerSave = null;             // no save, so no build to be newer than this one
    // The same one line as reading a save, so the two cannot drift apart.
    readSaved({});
    blankByHand();
    S.shownStored = 0; snapShown();
    for (const o of SAVERS) o.blank();
    return;
  }
  // First, because the savers below read what it sets (the rift is clamped
  // to `S.stored`, the wizards to `S.wizardHats`).
  readSaved(s);
  S.shownStored = S.stored; snapShown();
  // The hole is the whole hole at one grain size for ever; a save written at
  // a finer grain will not fit this plot, and `rehomeDust` (the pit's saver)
  // puts that dust back where it goes. Shaped here, before the machines and
  // the crew are measured against it; its sand can only come back after the
  // ground's.
  setPitGrain();
  for (const o of SAVERS) if (!FIRST.has(o)) o.read(s);
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
  showPanel(null, true);           // nor one with the last game's board still up
  snapShown();
  S.looPosts = LOO_POSTS;
  seedSmog();
  resetWeather();                  // a new run is a new sky, clouds and birds both
  S.boulderNo = 1;                 // the rock's blank builds it
  for (const o of SAVERS) o.blank();
  syncWorkers();                   // the crew walks out, every count being nought
  resetRates();
  resetBooks();
  resetNotices();
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

