// Act 3's ground (DESIGN.md, "One resource system for every act", step 2):
// one grid.js plot across the whole place, at the art cell, that every good
// lying anywhere in the act is a unit of -- a log a 4x4 block, a plank of
// timber 2x2, a sign 4x4 (config/blocks.js, `KINDS`) -- as every grain of
// dust in the yard is a cell of its one `floor`.
//
// The cloud's swells and each station's shelf are cells that never move
// (`fixed`), laid up to the profile a body's feet stand on (place.js,
// `floorProfile`), so a block comes to rest exactly where a body stands. A
// counted pile is a strip of the ground, as a yard station's pile is a strip
// of the floor (`S.piles`): an x-range from the camp's layout with its good
// and its brim, its heap kept inside it (`region`), its slots laid off its
// own first column (`lattice`), and as high as its brim's heap stands
// (`ceiling`). Open ground is every stretch between, and a heap of blocks
// settles there by the same rule (grid.js, `stepBlock`): a block rests when
// held up under half its width, rolls off when it overhangs or stands a
// whole block over its neighbor, and is only ever taken off the top.
//
// The ground is the goods, and nothing else is: a pile's count is its
// strip's units of its good, read off the cells after every write (`survey`)
// into `S.after.stock`, which stays as that copy until its last readers are
// moved onto the cells (the design's step 4). Every write goes through the
// doors below, which tally each pile's change as they survey it; verify.js
// rule 24 holds a pile's count to its tally, so nothing but a door -- no
// settle pass, no stray write -- moves a pile.
//
// Saved as the yard's floor is: the cells run-length, the terrain left out
// (it is laid from the profile), and the blocks' bottom-left cells, so every
// unit comes back where it lay, its kind and tone in its value.

import { S, afterGround as G } from '../state.js';
import { AFTER_W, AFTER_H, AFTER_PILES, AFTER_MILL, TERRAIN_CELL, KINDS, GRAV } from '../config.js';
import { at, topRow, colOf, bottomY, landed, addBlock, putBlock, takeUnit, blockAt, kindOf, sizeOfCell, recount, settle } from '../grid.js';
import { afterX0, afterTop, floorProfile, sitesKey, pileAt, pileOwner, heapX, AP } from './place.js';
import { pileGrid, pileCells } from './art.js';

// The stock keys that are strips.
export const PILED = Object.keys(AFTER_PILES);

// --- the ground's lay -----------------------------------------------------------------
// Each counted pile's strip, in ground columns: `c0` its first, `c1` the one
// past its last, `z` its good's size, `what` and `kind`.
const STRIPS = [];
// Per column: its terrain's height, its region (a strip's index + 1, or an
// open stretch's number past them), where that region starts and ends, and
// how far a heap may stand over the terrain (-1 for no limit).
let terrain = null, regionOf = null, startOf = null, endOf = null, capOf = null; // cache: laid off the camp's layout and its sites (`laidFor`)
let laidFor = null; // cache: the sites key the columns above were laid for
// Bumped on every cell written: the pile views and the lying list are taken
// again from the cells when it has moved.
let version = 0; // cache: a count of writes, only ever forward, compared and never cleared

const cellsAcross = () => Math.ceil(AFTER_W / AP);
const stripAt = c => (regionOf && c >= 0 && c < G.cols && regionOf[c] <= STRIPS.length ? STRIPS[regionOf[c] - 1] || null : null);
export const stripOf = what => STRIPS.find(s => s.what === what) || null;
// A column's world x (its left edge) and the world y of a row's bottom.
export const colX = c => G.x + c * AP;
export const rowY = r => bottomY(G) - r * AP;

// The columns' lay, worked out again only when the sites change (a station
// ordered reshapes the floor under it).
function layColumns() {
  const key = sitesKey();
  if (laidFor === key && terrain) return;
  laidFor = key;
  const cols = cellsAcross(), prof = floorProfile(), across = AP / (AFTER_W / prof.length);
  terrain = new Int32Array(cols);
  for (let c = 0; c < cols; c++) terrain[c] = Math.round((prof[Math.min(prof.length - 1, Math.floor(c * across))] || 0) / across);
  STRIPS.length = 0;
  for (const what of PILED) {
    const key2 = pileOwner(what), g = pileGrid(what);
    if (!key2 || !g) continue;
    const c0 = Math.round((pileAt(key2, what) - afterX0()) / AP), z = g.size;
    STRIPS.push({ what, kind: AFTER_PILES[what].good, z, c0, c1: c0 + pileCells(what), g });
  }
  regionOf = new Int32Array(cols); startOf = new Int32Array(cols); endOf = new Int32Array(cols); capOf = new Int32Array(cols).fill(-1);
  STRIPS.forEach((s, i) => {
    for (let c = Math.max(0, s.c0); c < Math.min(cols, s.c1); c++) {
      regionOf[c] = i + 1; startOf[c] = s.c0; endOf[c] = s.c1;
      // A rack the design names a width for stands its brim's rows flat; any
      // other pile the heap its brim makes a block a step (after/art.js,
      // `pileGrid`), the same slope a heap's repose leaves (grid.js).
      const h = s.g.rows, j = Math.floor((c - s.c0) / s.z);
      capOf[c] = (AFTER_PILES[s.what].cols ? h : Math.max(0, h - Math.abs(j - (h - 1)))) * s.z;
    }
  });
  // Each open stretch between two strips its own region, its lattice laid off
  // its first column, so a slot never runs into the strip past it.
  let next = STRIPS.length + 1;
  for (let c = 0; c < cols;) {
    if (regionOf[c]) { c++; continue; }
    let e = c;
    while (e < cols && !regionOf[e]) e++;
    for (let k = c; k < e; k++) { regionOf[k] = next; startOf[k] = c; endOf[k] = e; }
    next++; c = e;
  }
}

// The sawdust heap under the saw's bed is the mill's own plot (mill.js): its
// columns are no ground a good comes to rest on, so nothing lands drawn
// through it.
const heapCol = c => {
  const h0 = Math.round((heapX() - afterX0()) / AP);
  return c >= h0 && c < h0 + AFTER_MILL.heap.cols;
};

// The plot wired: its size off the place, its rules off the columns.
function wire() {
  layColumns();
  G.x = afterX0();
  G.p = AP;
  G.cols = cellsAcross();
  G.rows = Math.round(AFTER_H / AP);
  G.y = afterTop();
  G.fixed = (c, r) => r < terrain[c];
  G.region = c => regionOf[c];
  G.lattice = (c, z) => { const s = c - ((c - startOf[c]) % z); return s + z <= endOf[c] ? s : -1; };
  G.ceiling = c => (capOf[c] >= 0 ? terrain[c] + capOf[c] : G.rows);
  G.blocked = heapCol;
  G.onPut = () => { version++; };
  G.onMove = (from, to) => { const t = tags(); if (t.has(from)) { t.set(to, t.get(from)); t.delete(from); } };
}

// Every column's terrain laid as cells, over an empty plot.
function layTerrain() {
  G.grid = new Uint8Array(G.cols * G.rows);
  for (let c = 0; c < G.cols; c++) for (let r = 0; r < Math.min(G.rows, terrain[c]); r++) G.grid[r * G.cols + c] = TERRAIN_CELL;
  G.blockGrid = null; G.block = null; G.blockSet = null; G.blockN = 0;
  recount(G);                                // written behind `put`'s back: the ledgers taken again
  version++;
}

// --- where a unit came from, for the drawing (TEMP: step 3's carry replaces
// the groundLogs rows these feed) ----------------------------------------------------
// A unit's arrival, by its bottom-left cell: a felled log's plot and the x it
// split off the trunk at, and when it set off rolling (`i`, `x0`, `at`); a
// good let go of, the height it fell from and for how long (`y0`, `fall`,
// `at`). The drawing moves it there along its way (render/after/piles.js),
// and a gatherer waits for it to be down. Saved with the ground.
function tags() {
  const a = S.after;
  if (!Object.prototype.hasOwnProperty.call(a, 'groundTags')) Object.defineProperty(a, 'groundTags', { value: new Map(), writable: true, configurable: true, enumerable: false });
  return a.groundTags;
}
export const tagOf = ai => (S.after ? tags().get(ai) || null : null);

// --- the tally (verify.js, rule 24) -----------------------------------------------------
// Every change to a pile's count made through a door, and the blocks taken
// in bulk with nobody's hands behind them, kept on the act's state and out of
// its save.
export function ledger() {
  const a = S.after;
  if (!Object.prototype.hasOwnProperty.call(a, 'handoffs')) Object.defineProperty(a, 'handoffs', { value: { net: {}, bulk: 0 }, writable: true, configurable: true, enumerable: false });
  return a.handoffs;
}

// Each pile's count read off the cells into `S.after.stock`; with `tally`, the
// change is a door's and goes on the pile's tally.
export function survey(tally = false) {
  const a = S.after;
  if (!a || !G.grid) return;
  const n = {};
  for (const s of STRIPS) n[s.what] = 0;
  if (G.blockN && G.blockGrid === G.grid) {
    for (const ai of G.blockSet) {
      const s = stripAt(ai % G.cols), k = kindOf(G.grid[ai]);
      if (s && k && k.key === s.kind) n[s.what]++;
    }
  }
  const led = tally ? ledger().net : null;
  for (const s of STRIPS) {
    const d = n[s.what] - (a.stock[s.what] || 0);
    if (led && d) led[s.what] = (led[s.what] || 0) + d;
    a.stock[s.what] = n[s.what];
  }
}
// A pile's count walked off the cells, never the copy: for verify.js.
export function stripCount(what) {
  const s = stripOf(what);
  if (!s || !G.grid || !G.blockN || G.blockGrid !== G.grid) return 0;
  let n = 0;
  for (const ai of G.blockSet) { const c = ai % G.cols, k = kindOf(G.grid[ai]); if (c >= s.c0 && c < s.c1 && k && k.key === s.kind) n++; }
  return n;
}

// --- reading the cells ---------------------------------------------------------------------
// The top of the slot starting at column c, z wide: the row a unit set down
// in it would rest at.
export const slotTop = (c, z) => { let r = 0; for (let i = c; i < c + z; i++) r = Math.max(r, topRow(G, i) + 1); return r; };
// The slot of size z nearest column c: the one holding it, or the nearest
// whole one beside it.
export function slotNear(c, z) {
  c = Math.max(0, Math.min(G.cols - 1, c));
  for (let d = 0; d < z; d++) for (const k of [c - d, c + d]) { const s = k >= 0 && k < G.cols ? G.lattice(k, z) : -1; if (s >= 0) return s; }
  return -1;
}
// Whether nothing rests on the block whose bottom-left cell is ai.
export function uncovered(ai) {
  const c0 = ai % G.cols, r0 = (ai - c0) / G.cols, z = sizeOfCell(G.grid[ai]);
  if (r0 + z >= G.rows) return true;
  for (let i = c0; i < c0 + z; i++) if (G.grid[(r0 + z) * G.cols + i]) return false;
  return true;
}
// Whether the block whose bottom-left cell is ai stands on something.
const restsOn = ai => {
  const c0 = ai % G.cols, r0 = (ai - c0) / G.cols, z = sizeOfCell(G.grid[ai]);
  if (r0 === 0) return true;
  for (let i = c0; i < c0 + z; i++) if (G.grid[(r0 - 1) * G.cols + i]) return true;
  return false;
};
// Every unit on the ground: { ai, c0, r0, v, kind, z }.
export function units() {
  const out = [];
  if (!G.grid || !G.blockN || G.blockGrid !== G.grid) return out;
  for (const ai of G.blockSet) {
    const v = G.grid[ai], k = kindOf(v);
    if (k) out.push({ ai, c0: ai % G.cols, r0: Math.floor(ai / G.cols), v, kind: k.key, z: k.size });
  }
  return out;
}

// What is counted where: a unit is a pile's when it lies in the pile's strip
// and is its good; everything else lying is loose, a gatherer's to carry home.
export const counted = u => { const s = stripAt(u.c0); return !!s && s.kind === u.kind; };

// The loose units as rows (TEMP: the groundLogs list's shape, so step 3's
// carry and hand, and the checks reading it, keep working until they read
// the cells): { id, kind, x, y, w, free } -- `id` its bottom-left cell,
// `x`, `y` its top left in the world, `free` whether a hand or a body may
// take it now (nothing on it, not falling), and its arrival (`tagOf`).
let lyingRows = null, lyingAt = -1; // cache: the loose units, as of `version`
export function lying() {
  if (!S.after || !G.grid) return [];
  if (lyingRows && lyingAt === version) return lyingRows;
  lyingAt = version;
  lyingRows = units().filter(u => !counted(u)).map(u => ({
    id: u.ai, kind: u.kind, x: colX(u.c0), y: rowY(u.r0 + u.z), w: u.z * AP,
    free: uncovered(u.ai) && restsOn(u.ai), ...(tagOf(u.ai) || {})
  }));
  return lyingRows;
}

// --- the doors ---------------------------------------------------------------------------
// Taking a unit, off the top only (grid.js, `takeUnit`): the block whose
// bottom-left cell is ai. Its value, or 0 when it is gone or has anything on it.
export function takeAt(ai) {
  if (!G.grid || ai < 0 || ai >= G.grid.length) return 0;
  const v = G.grid[ai];
  if (!kindOf(v)) return 0;
  const a = blockAt(G, ai % G.cols, Math.floor(ai / G.cols));
  if (!a || a.r * G.cols + a.c !== ai) return 0;
  const got = takeUnit(G, a.c, a.r);
  if (got) { tags().delete(ai); survey(true); }
  return got;
}
// The top unit of column c, if it is of `kind` (any, with none) and has
// nothing on it: what a press over a heap takes.
export function takeTopOf(c, kind = null) {
  if (!G.grid || c < 0 || c >= G.cols) return 0;
  const r = topRow(G, c);
  if (r < 0 || G.fixed(c, r)) return 0;
  const k = kindOf(at(G, c, r));
  if (!k || (kind && k.key !== kind)) return 0;
  const a = blockAt(G, c, r);
  return a ? takeAt(a.r * G.cols + a.c) : 0;
}
// A unit of value v set down at world x (its middle), coming to rest on top
// of the heap there by addBlock's rule, kept to the region it lands in and
// under its ceiling. Its bottom-left cell, or -1 when the region has no room.
export function putIn(v, x) {
  if (!G.grid) return -1;
  if (!addBlock(G, x, v)) return -1;
  const ai = lastAnchor();
  survey(true);
  return ai;
}
// The unit just written by addBlock: grid.js leaves the column and row it
// went in at in `landed`, a block's bottom-left cell.
const lastAnchor = () => landed.r * G.cols + landed.c;
// A unit set down at x that has to lie somewhere: in the region under x if it
// has room, else on the open ground beside the strip it would not fit in,
// on x's side, and failing that the nearest open ground that will take it.
// Its bottom-left cell, or -1 with the whole place full.
export function putSomewhere(v, x) {
  const got = putIn(v, x);
  if (got >= 0) return got;
  return putBeside(v, x);
}
export function putBeside(v, x) {
  const z = sizeOfCell(v) * AP, c = colOf(G, x), s = stripAt(Math.max(0, Math.min(G.cols - 1, c)));
  const tries = [];
  if (s) {
    const left = x < colX((s.c0 + s.c1) / 2);
    const lx = colX(s.c0) - z / 2, rx = colX(s.c1) + z / 2;
    tries.push(...(left ? [lx, rx] : [rx, lx]));
  }
  for (let k = 1; k < 64; k++) tries.push(x - k * z, x + k * z);
  for (const tx of tries) {
    const tc = colOf(G, tx);
    if (tc < 0 || tc >= G.cols || stripAt(tc)) continue;
    const got = putIn(v, tx);
    if (got >= 0) return got;
  }
  return -1;
}
// `n` units of value v set down at once around world x as the heap they
// would roll into, each laid straight where it comes to rest: a felled tree's
// logs (grove.js). Each goes on the slot whose top is lowest for how far it
// is from x's (a slot a block's height up counting as a slot over), the far
// side first on a tie, never where the heap rule would roll it on -- its
// bottom a block or more over a neighbor's top -- so the heap stands as a
// mound a block a step, settled, the moment it lands. Their bottom-left
// cells, in the order laid.
export function heapAt(v, x, n) {
  const z = sizeOfCell(v), mid = slotNear(colOf(G, x), z), out = [];
  if (mid < 0) return out;
  const near = [];
  for (let k = -n; k <= n; k++) {
    const s = mid + k * z;
    if (s >= 0 && s + z <= G.cols && G.lattice(s, z) === s && G.region(s) === G.region(mid) && !G.blocked(s) && !G.blocked(s + z - 1)) near.push(s);
  }
  for (let i = 0; i < n; i++) {
    let best = -1, score = Infinity;
    for (const s of near) {
      const t = slotTop(s, z);
      if (t + z > G.rows) continue;
      const lean = [s - z, s + z].some(q => q >= 0 && q + z <= G.cols && G.lattice(q, z) === q && G.region(q) === G.region(s) && t - slotTop(q, z) >= z);
      if (lean) continue;
      const sc = t / z + Math.abs(s - mid) / z - (s > mid ? 0.01 : 0);
      if (sc < score) { score = sc; best = s; }
    }
    const t = best >= 0 ? slotTop(best, z) : -1;
    out.push(best >= 0 && putBlock(G, best, t, v) ? t * G.cols + best : putSomewhere(v, x));
  }
  survey(true);
  return out;
}
// Tag a unit's arrival (see `tags`).
export function tag(ai, t) { if (ai >= 0 && S.after) tags().set(ai, t); }

// --- standing it up ------------------------------------------------------------------------
// The ground laid for the act state now on `S.after`: the terrain, then what
// the save kept (`S.after.ground`, written by `groundRecord`), then anything
// an older save handed over to lay (`S.after.lay`, the one-ground migration),
// all settled to rest before the first frame and surveyed into the stock.
export function standGround(lay = []) {
  const a = S.after;
  if (!a) { G.grid = null; G.blockN = 0; return; }
  wire();
  layTerrain();
  delete a.groundTags;
  const rec = a.ground;
  a.ground = null;
  if (rec) readRecord(rec);
  survey(false);
  for (const item of lay) item();
  rest();
  survey(false);
}
// Settled until nothing moves: a save read stands as the blocks left it.
export function rest() {
  for (let i = 0; i < 4 * G.rows && settle(G); i++) { /* until nothing moves */ }
}
// One frame's share of the ground: a pass of the heap rule over the awake
// columns, the count surveyed after.
export function settleGround() {
  if (!G.grid) return 0;
  const did = settle(G);
  if (did) survey(false);
  return did;
}

// --- the save --------------------------------------------------------------------------------
// Runs of "value x length", as persist.js's `gridStr`, over the cells less
// the terrain.
function runsOf(cells) {
  const out = [];
  let run = cells[0] || 0, len = 1;
  for (let i = 1; i < cells.length; i++) {
    const v = cells[i] || 0;
    if (v === run) { len++; continue; }
    out.push(run + 'x' + len); run = v; len = 1;
  }
  out.push(run + 'x' + len);
  return out.join('.');
}
function cellsOfRuns(str, n) {
  if (typeof str !== 'string' || !str) return null;
  const cells = new Uint8Array(n);
  let i = 0;
  for (const part of str.split('.')) {
    const x = part.indexOf('x'), v = +part.slice(0, x), len = +part.slice(x + 1);
    if (x < 0 || !(len >= 0) || i + len > n) return null;
    if (v) cells.fill(v, i, i + len);
    i += len;
  }
  return i === n ? cells : null;
}
// The ground as the act's saver writes it, or null with no act.
export function groundRecord() {
  if (!S.after || !G.grid) return null;
  const cells = G.grid.slice();
  for (let c = 0; c < G.cols; c++) for (let r = 0; r < Math.min(G.rows, terrain[c]); r++) cells[r * G.cols + c] = 0;
  const blocks = G.blockN && G.blockGrid === G.grid ? [...G.blockSet].sort((p, q) => p - q) : [];
  const t = [...tags()].filter(([ai]) => G.blockSet && G.blockSet.has(ai)).map(([ai, v]) => [ai, v]);
  return { cols: G.cols, rows: G.rows, cells: runsOf(cells), blocks, tags: t };
}
// A record read back: each block at its own cell if the plot is the same
// shape and the square is still clear, else dropped in at its x (the camp
// laid out again under it); every grain of a kind likewise.
function readRecord(rec) {
  if (!rec || typeof rec !== 'object' || !(rec.cols > 0) || !(rec.rows > 0)) return;
  const cells = cellsOfRuns(rec.cells, rec.cols * rec.rows);
  if (!cells) return;
  const same = rec.cols === G.cols && rec.rows === G.rows;
  const kept = new Map(Array.isArray(rec.tags) ? rec.tags.filter(e => Array.isArray(e) && e[1] && typeof e[1] === 'object') : []);
  const part = new Uint8Array(cells.length);
  const place = (v, c0, r0, from) => {
    const z = sizeOfCell(v);
    let ai = -1;
    if (same && putBlock(G, c0, r0, v)) ai = r0 * G.cols + c0;
    else ai = putSomewhere(v, G.x + c0 * AP + z * AP / 2);
    if (ai >= 0 && kept.has(from)) tag(ai, kept.get(from));
  };
  for (const ai of Array.isArray(rec.blocks) ? rec.blocks : []) {
    const v = cells[ai], k = kindOf(v);
    if (!k || k.size < 2 || !Number.isInteger(ai)) continue;
    const c0 = ai % rec.cols, r0 = Math.floor(ai / rec.cols);
    for (let j = 0; j < k.size; j++) for (let i = 0; i < k.size; i++) { const q = (r0 + j) * rec.cols + c0 + i; if (q < part.length) part[q] = 1; }
    place(v, c0, r0, ai);
  }
  for (let i = 0; i < cells.length; i++) {
    const v = cells[i], k = kindOf(v);
    if (k && k.size === 1 && !part[i]) place(v, i % rec.cols, Math.floor(i / rec.cols), i);
  }
}

// The height a good let go of at world bottom y falls from, and how long its
// fall takes under the yard's gravity (GRAV, px a frame a frame), to where it
// came to rest: the drawing's (render/after/piles.js).
export function fallTag(ai, y) {
  if (ai < 0) return;
  const c0 = ai % G.cols, r0 = Math.floor(ai / G.cols), bot = rowY(r0), h = Math.max(0, bot - y);
  tag(ai, { y0: Math.min(y, bot), at: S.after.t, fall: Math.sqrt(2 * h / GRAV) / 60, x0: colX(c0) });
}

// Kinds by key, for the doors' callers.
export const sizeOf = kind => KINDS[kind].size;
export const groundVersion = () => version;
