import './style.css';
import { load, save, clear } from './save.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const shopEl = document.getElementById('shop');
const boardEl = document.getElementById('board');
const resetEl = document.getElementById('reset');

const P = 6;              // pixel size
const TARGET = 1000000;   // dust in the hole: the whole point
const PIT_COLS = 240;     // the pit is a fixed size, wider than the window
const PIT_PAD = 18;       // cells of ground past its far edge, so you can see the end
const MAX_DEPTH = 6;      // sheets of rock a boulder can be thick
const BASE_R = 12;        // boulder radius in cells at boulder 1
// A cell holds how much rock is still stacked there. Thick rock is dark, and it
// pales as you dig through it; an empty cell is the white page showing through.
// Swap these for hues to add colour.
const SHADES = ['#8a8a8a', '#757575', '#5f5f5f', '#464646', '#2c2c2c', '#111111'];
const CORE_CELL = SHADES.length + 1;   // a core sitting in a pile, among the dust
const GRAV = 0.45;
const BRUSH = 3;          // sweep radius, in cells
const CORE_SIZE = P * 3;  // a core is a square this big
const MINE_DELAY = 260;   // pause before a held click starts auto-mining
const MINE_BASE = 460;    // gap between held hits at speed level 0
const MINE_FLOOR = 75;    // fastest the pick will ever swing (13.3 px/s)
const CAP_BASE = 1;       // pixels you can carry at level 0
const CAP_STEP = 1;       // extra capacity per upgrade
const WORKER = P * 3;     // worker square size
const MINER_BASE = 1400;  // a hired miner starts slower than your own pick
const MINER_FLOOR = 260;  // fastest a miner can swing
const DRILL_BASE = 520;   // a driller bites faster than a chipper swings
const DRILL_FLOOR = 90;
const SPILL_ROW = 4;      // how high dust must be heaped at the ledge to topple in
const HAUL_MS = 110;      // gap between grains a hauler scoops at pace 0
const HAUL_BASE = 0.9;    // hauler walking speed, px per frame

let W, H, cx, cy, groundY = 0;
let worldW = 0;           // the pit runs past the right of the window
let camX = 0;             // how far the view has been scrolled along it
let boulder = [];         // rows of ints: 0 empty, 1..n the layer a cell belongs to
let grid = 46;            // current boulder grid width/height in cells
let boulderNo = 1;        // how many boulders in; each one adds a layer
let coreBuried = true;    // this boulder still has its core inside it
let nextBoulderAt = 0;    // ms deadline for the replacement rock to roll in
let chips = [];           // pixels in flight
let stored = 0;           // dust in the hole: the score, and what you spend
let held = 0;             // pixels on the cursor mid-sweep
let dragging = false;
let carryLevel = 0;       // carry-capacity upgrades bought
let speedLevel = 0;       // mining-speed upgrades bought
let autoMine = false;     // hold-to-mine unlocked
let haulersUnlocked = false;  // core unlock: haulers can be hired
let minersUnlocked = false;   // core unlock: miners can be hired
let mining = false;       // holding the button down on the boulder
let nextHit = 0;
let mouse = { x: -99, y: -99 };
let trail = [];           // recent cursor samples, for working out a throw
let motes = [];           // the floating pixels riding with the cursor
let cores = 0;            // cores banked in the pit
let seenCore = false;     // a core has been banked at least once
let pitScale = 1;         // dust each drawn grain in the pit stands for
let pitFrac = 0;          // dust banked since the last drawn grain
let pitSettles = 0;       // how many times the pile has compacted
let coreItem = null;      // a core loose in the world
let heldCore = false;     // a core riding on the cursor
let pickLevel = 0;        // pixels knocked loose per hit (bought with cores)
let miners = 0, haulers = 0, drillers = 0;
let minerSpeedLevel = 0;  // hired-miner swing speed
let drillSpeedLevel = 0;  // driller bite speed
let drillersUnlocked = false;  // core unlock: drillers can be hired
let haulCarryLevel = 0;   // grains a hauler carries per trip
let haulPaceLevel = 0;    // hauler walking speed and scoop rate
let workers = [];         // little squares that mine and ferry dust
let orbitPhase = 0;       // the whole ring of miners turns together
let coreTaker = null;     // the hauler that has claimed a loose core
const bench = { x: 0, y: 0, w: 0, h: 0 };
let boardOpen = false;    // the workbench board is showing
let shownStored = 0;      // the counter chases the real number
let tweenFrom = 0, tweenTo = 0, tweenAt = 0, tweenMs = 300;
let dirty = false;

// two sand grids: the ground the dust lands on, and the pit dug into it
const floor = { x: 0, y: 0, cols: 0, rows: 14, grid: null };
const pit = { x: 0, y: 0, w: 0, h: 0, cols: 0, rows: 22, grid: null };

// --- sand grid helpers ------------------------------------------------------
const shadeOf = v => SHADES[Math.min(SHADES.length, Math.max(1, v)) - 1];
const depthShade = (v, max) =>
  Math.max(1, Math.min(SHADES.length, Math.ceil(SHADES.length * v / Math.max(1, max))));
const at = (b, c, r) => b.grid[r * b.cols + c];
const put = (b, c, r, v) => { b.grid[r * b.cols + c] = v; };
const inside = (b, c, r) => c >= 0 && c < b.cols && r >= 0 && r < b.rows;
const bottomY = b => b.y + b.rows * P;      // screen y of the grid floor
const colOf = (b, x) => Math.floor((x - b.x) / P);
const count = b => { let n = 0; for (const v of b.grid) if (v) n++; return n; };

// the ground is cut by the pit: open between the near ledge and the far wall
const blocked = c => {
  const x = floor.x + c * P;
  return x + P > pit.x && x < pit.x + pit.w;
};
const overPitMouth = x => x + P > pit.x && x < pit.x + pit.w;

// screen y where a pixel falling down column c would come to rest
function surfaceY(b, c) {
  for (let r = b.rows - 1; r >= 0; r--) {
    if (at(b, c, r)) return bottomY(b) - (r + 2) * P;
  }
  return bottomY(b) - P;
}

function addGrain(b, x, skip, shade = 1) {
  let col = Math.max(0, Math.min(b.cols - 1, colOf(b, x)));
  const full = c => at(b, c, b.rows - 1) || (skip && skip(c));
  if (full(col)) {
    let alt = -1;
    for (let d = 1; d < b.cols; d++) {
      if (col - d >= 0 && !full(col - d)) { alt = col - d; break; }
      if (col + d < b.cols && !full(col + d)) { alt = col + d; break; }
    }
    col = alt;
  }
  if (col < 0) return false;
  for (let r = 0; r < b.rows; r++) {
    if (!at(b, col, r)) { put(b, col, r, shade); return true; }
  }
  return false;
}

// one sand tick: unsupported grains fall, then slump sideways
function settle(b, skip) {
  for (let r = 1; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      if (!at(b, c, r)) continue;
      const v = at(b, c, r);
      if (!at(b, c, r - 1)) { put(b, c, r, 0); put(b, c, r - 1, v); continue; }
      const first = (c + r) & 1 ? -1 : 1;   // alternate bias so piles stay even
      for (const d of [first, -first]) {
        const n = c + d;
        // dust heaped against the ledge topples over the edge. It has to be piled
        // up to do it: a thin scatter just rests against the wall
        if (b === floor && d > 0 && r >= SPILL_ROW && skip && skip(n) && n < b.cols) {
          put(b, c, r, 0);
          spawnChip(b.x + n * P, bottomY(b) - (r + 1) * P, 0.6 + Math.random() * 0.6, 0, v);
          break;
        }
        if (!inside(b, n, r - 1) || (skip && skip(n))) continue;
        if (!at(b, n, r - 1) && !at(b, n, r)) {
          put(b, c, r, 0);
          put(b, n, r - 1, v);
          break;
        }
      }
    }
  }
}

// --- layout -----------------------------------------------------------------
function resize() {
  W = canvas.width = innerWidth;
  H = canvas.height = innerHeight;
  cx = Math.round(W / 2 / P) * P;
  cy = Math.round(H * 0.28 / P) * P;

  // the pit takes the bottom third of the screen
  const base = Math.round(H * 0.66 / P) * P;
  pit.rows = Math.max(8, Math.floor((H - base - P * 3) / P));

  pit.x = Math.round((W * 0.72) / P) * P;         // the ledge
  pit.cols = PIT_COLS;                            // fixed, and mostly off screen
  pit.w = pit.cols * P;
  pit.h = pit.rows * P;
  pit.y = base;                                   // mouth is flush with the ground

  bench.w = P * 12;
  bench.h = P * 7;
  bench.x = Math.round(W * 0.07 / P) * P;
  bench.y = base - bench.h;

  worldW = pit.x + pit.w + PIT_PAD * P;      // before the floor: it spans the world
  camX = Math.max(0, Math.min(camX, worldW - W));
  seedAir();

  floor.x = 0;
  floor.cols = Math.ceil(worldW / P);
  floor.y = base - floor.rows * P;
  groundY = base;

  resizeGrid(floor);
  resizeGrid(pit);
}

// keep the grain count across a resize, re-packed flat
function resizeGrid(b) {
  const want = b.cols * b.rows;
  const had = b.grid ? count(b) : 0;
  if (b.grid && b.grid.length === want) return;
  b.grid = new Uint8Array(want);
  fillFlat(b, had);
  if (b === pit) seedPitCores();
}

// the pile shows exactly the cores you still hold: top up after a resize, and
// take them back out when they are spent
function seedPitCores() {
  if (!pit.grid) return;
  let have = 0;
  for (const v of pit.grid) if (v === CORE_CELL) have++;
  for (let i = have; i < cores; i++) {
    addGrain(pit, pit.x + (0.15 + 0.7 * ((i + 0.5) / Math.max(1, cores))) * pit.w, null, CORE_CELL);
  }
  if (have > cores) takeCoreCells(have - cores);
}

// lift core cells out of the pile, topmost first
function takeCoreCells(n) {
  for (let r = pit.rows - 1; r >= 0 && n > 0; r--) {
    for (let c = 0; c < pit.cols && n > 0; c++) {
      if (at(pit, c, r) === CORE_CELL) { put(pit, c, r, 0); n--; }
    }
  }
}

function fillFlat(b, n) {
  b.grid.fill(0);
  n = Math.min(n, b.cols * b.rows);
  const shade = 4;                         // repacked dust, middling grey
  for (let r = 0; r < b.rows && n > 0; r++) {
    for (let c = 0; c < b.cols && n > 0; c++) {
      if (b === floor && blocked(c)) continue;
      put(b, c, r, shade);
      n--;
    }
  }
}

// --- boulder ----------------------------------------------------------------
// boulder n is n sheets thick (capped) and a little wider than the last, so each
// one is a longer dig. Cells hold remaining thickness, deepest in the middle.
function depthOf() {
  return Math.min(MAX_DEPTH, boulderNo);
}

function boulderRadius() {
  const want = BASE_R + boulderNo;
  const room = Math.floor(Math.min(W * 0.30, (groundY - floor.rows * P - P * 4) * 0.46) / P);
  return Math.max(6, Math.min(want, room));
}

function makeBoulder() {
  const rad = boulderRadius();
  const deep = depthOf();
  grid = rad * 2 + 2;
  const mid = grid / 2;
  const seed = [Math.random() * 6, Math.random() * 6, Math.random() * 6];

  coreBuried = true;
  boulder = [];
  for (let y = 0; y < grid; y++) {
    const row = [];
    for (let x = 0; x < grid; x++) {
      const dx = x - mid + 0.5, dy = y - mid + 0.5;
      const d = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      let edge = rad * 0.94;
      edge *= 1 + 0.06 * Math.sin(a * 3 + seed[0])
                + 0.05 * Math.sin(a * 5 - seed[1])
                + 0.03 * Math.sin(a * 8 + seed[2]);
      if (d >= edge) { row.push(0); continue; }
      // domed: thin at the rim, the full stack through the middle
      const t = Math.sqrt(Math.max(0, 1 - (d / edge) ** 2));
      row.push(Math.max(1, Math.round(deep * t)));
    }
    boulder.push(row);
  }
}

function gridToString() {
  let s = '';
  for (const row of boulder) for (const v of row) s += String(v);
  return s;
}

function gridFromString(s, size) {
  if (typeof s !== 'string' || !size || s.length !== size * size) return false;
  grid = size;
  boulder = [];
  for (let y = 0; y < grid; y++) {
    const row = [];
    for (let x = 0; x < grid; x++) row.push(+s[y * grid + x] || 0);
    boulder.push(row);
  }
  return true;
}

const cellPos = (x, y) => ({ px: cx + (x - grid / 2) * P, py: cy + (y - grid / 2) * P });

function boulderAlive() {
  for (const row of boulder) for (const v of row) if (v) return true;
  return false;
}

// the boulder's whole footprint, so clicking a chipped-out gap still chips
// on the rock if there is rock close by: chipped-out gaps still count, but the
// empty air below it does not, so falling dust can be caught there
// the rock's whole footprint takes a swing, so clicking its general area works
function overBoulder(mx, my) {
  const half = (grid / 2) * P;
  return mx > cx - half && mx < cx + half && my > cy - half && my < cy + half;
}

// the cell under the cursor, or the nearest filled one if that spot is already hollow
function pickCell(mx, my) {
  const gx = (mx - cx) / P + grid / 2;
  const gy = (my - cy) / P + grid / 2;
  const hx = Math.floor(gx), hy = Math.floor(gy);
  if (boulder[hy]?.[hx]) return { x: hx, y: hy };

  let best = null, bestD = Infinity;
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (!boulder[y][x]) continue;
      const d = (x + 0.5 - gx) ** 2 + (y + 0.5 - gy) ** 2;
      if (d < bestD) { bestD = d; best = { x, y }; }
    }
  }
  return best;
}

// roughly normal, in about -1.5..1.5, most of it near nothing
const bell = () => Math.random() + Math.random() + Math.random() - 1.5;

function spawnChip(x, y, vx, vy, shade = 1) {
  chips.push({ x, y, vx, vy, s: shade });
}

function knockOff(mx, my) {
  const c = pickCell(mx, my);
  if (!c) return;
  const r = pickR();
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const x = c.x + dx, y = c.y + dy;
      const left = boulder[y]?.[x];
      if (!left) continue;
      const shade = depthShade(left, depthOf());     // how deep it looked, for colour
      boulder[y][x] = left - 1;
      const { px, py } = cellPos(x, y);
      // mostly straight down, with a little drift and a nudge away from the middle
      spawnChip(px, py, bell() * 1.1 + (px - cx) / (grid * P) * 1.6,
                -(1.6 + Math.random() * 2.6), shade);
    }
  }
  dirty = true;
}

// the core sits at the middle of the rock and only comes loose when it is bare
function coreHome() {
  return { x: cx - CORE_SIZE / 2, y: cy - CORE_SIZE / 2 };
}

function dropCore() {
  const h = coreHome();
  coreBuried = false;
  coreItem = { x: h.x, y: h.y, vx: (Math.random() - 0.5) * 2.4, vy: -3, rest: false };
}

function bankCore(x) {
  cores++;
  seenCore = true;
  const at = (x ?? pit.x + pit.w / 2) + (Math.random() - 0.5) * P * 10;
  addGrain(pit, Math.max(pit.x, Math.min(pit.x + pit.w - P, at)), null, CORE_CELL);
  dirty = true;
  buildShop();              // core-priced rows appear the first time one lands
}

// --- upgrades ---------------------------------------------------------------
const capacity = () => CAP_BASE + carryLevel * CAP_STEP;
const mineMs = (lvl = speedLevel) => Math.max(MINE_FLOOR, Math.round(MINE_BASE * Math.pow(0.8, lvl)));
const mineRate = (lvl = speedLevel) => 1000 / mineMs(lvl);
const minerMs = (lvl = minerSpeedLevel) => Math.max(MINER_FLOOR, Math.round(MINER_BASE * Math.pow(0.82, lvl)));
const minerRate = (lvl = minerSpeedLevel) => 1000 / minerMs(lvl);
const drillMs = (lvl = drillSpeedLevel) => Math.max(DRILL_FLOOR, Math.round(DRILL_BASE * Math.pow(0.82, lvl)));
const drillRate = (lvl = drillSpeedLevel) => 1000 / drillMs(lvl);
const haulCap = (lvl = haulCarryLevel) => 1 + lvl;
const haulSpeed = (lvl = haulPaceLevel) => HAUL_BASE * (1 + 0.3 * lvl);
const scoopMs = (lvl = haulPaceLevel) => Math.max(30, Math.round(HAUL_MS * Math.pow(0.85, lvl)));
const pickR = () => pickLevel;                 // 0 = one pixel a hit

const num = v => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
const rateText = lvl => num(mineRate(lvl));

// how many cells one hit clears, for the label
const pickCells = lvl => {
  let n = 0;
  for (let dy = -lvl; dy <= lvl; dy++) {
    for (let dx = -lvl; dx <= lvl; dx++) if (dx * dx + dy * dy <= lvl * lvl) n++;
  }
  return n;
};

const UPGRADES = [
  {
    key: 'carry',
    label: () => `carry ${capacity()} -> ${capacity() + CAP_STEP}`,
    cost: () => Math.round(8 * Math.pow(1.35, carryLevel)),
    buy: () => carryLevel++,
    show: () => true
  },
  {
    key: 'auto',
    label: () => 'hold to mine',
    cost: () => 25,
    buy: () => { autoMine = true; },
    show: () => !autoMine
  },
  {
    key: 'speed',
    label: () => `mine ${rateText(speedLevel)} -> ${rateText(speedLevel + 1)} px/s`,
    cost: () => Math.round(20 * Math.pow(1.9, speedLevel)),
    buy: () => speedLevel++,
    show: () => mineMs() > MINE_FLOOR
  },
  {
    key: 'pick',
    label: () => `pick ${pickCells(pickLevel)} -> ${pickCells(pickLevel + 1)} px`,
    cost: () => 3 + pickLevel * 3,
    currency: 'core',
    buy: () => pickLevel++,
    show: () => seenCore
  },
  {
    key: 'unlockdrillers',
    label: () => 'first driller',
    cost: () => 3,
    currency: 'core',
    buy: () => { drillersUnlocked = true; drillers++; syncWorkers(); },
    show: () => seenCore && !drillersUnlocked
  },
  {
    key: 'driller',
    label: () => `hire driller (${drillers})`,
    cost: () => Math.round(140 * Math.pow(1.6, Math.max(0, drillers - 1))),
    buy: () => { drillers++; syncWorkers(); },
    show: () => drillersUnlocked
  },
  {
    key: 'drillspeed',
    label: () => `driller ${num(drillRate())} -> ${num(drillRate(drillSpeedLevel + 1))} px/s`,
    cost: () => Math.round(120 * Math.pow(1.7, drillSpeedLevel)),
    buy: () => drillSpeedLevel++,
    show: () => drillers > 0 && drillMs() > DRILL_FLOOR
  },
  {
    key: 'unlockminers',
    label: () => 'first miner',
    cost: () => 2,
    currency: 'core',
    buy: () => { minersUnlocked = true; miners++; syncWorkers(); },
    show: () => seenCore && !minersUnlocked
  },
  {
    key: 'miner',
    label: () => `hire miner (${miners})`,
    cost: () => Math.round(60 * Math.pow(1.7, Math.max(0, miners - 1))),
    buy: () => { miners++; syncWorkers(); },
    show: () => minersUnlocked
  },
  {
    key: 'minerspeed',
    label: () => `miner ${num(minerRate())} -> ${num(minerRate(minerSpeedLevel + 1))} px/s`,
    cost: () => Math.round(70 * Math.pow(1.8, minerSpeedLevel)),
    buy: () => minerSpeedLevel++,
    show: () => miners > 0 && minerMs() > MINER_FLOOR
  },
  {
    key: 'unlockhaulers',
    label: () => 'first hauler',
    cost: () => 1,
    currency: 'core',
    buy: () => { haulersUnlocked = true; haulers++; syncWorkers(); },
    show: () => seenCore && !haulersUnlocked
  },
  {
    key: 'hauler',
    label: () => `hire hauler (${haulers})`,
    cost: () => Math.round(80 * Math.pow(1.7, Math.max(0, haulers - 1))),
    buy: () => { haulers++; syncWorkers(); },
    show: () => haulersUnlocked
  },
  {
    key: 'haulcarry',
    label: () => `hauler load ${haulCap()} -> ${haulCap(haulCarryLevel + 1)}`,
    cost: () => Math.round(50 * Math.pow(1.5, haulCarryLevel)),
    buy: () => haulCarryLevel++,
    show: () => haulers > 0
  },
  {
    key: 'haulpace',
    label: () => `hauler pace ${num(haulSpeed() * 60)} -> ${num(haulSpeed(haulPaceLevel + 1) * 60)} px/s`,
    cost: () => Math.round(60 * Math.pow(1.7, haulPaceLevel)),
    buy: () => haulPaceLevel++,
    show: () => haulers > 0
  }
];

// the pit pile is a picture of the total, not a one-to-one store: once it gets deep
// it compacts, each remaining grain standing for twice as much, so it never fills up
const PIT_FULL = 1;       // only settle when the pit is genuinely full

function bankDust(x, shade = 1) {
  stored++;                                // every pixel is worth one
  dirty = true;
  pitFrac++;
  if (pitFrac < pitScale) return;
  pitFrac -= pitScale;
  if (!addGrain(pit, x, null, shade)) compactPit();   // full: squash and carry on
}

// squash every column, keeping the profile, and double what a grain is worth.
// each settle keeps a little more than the last, so the pit trends towards full
// over a run instead of sawtoothing around the same level
function compactPit() {
  const keepFrac = Math.min(0.85, 0.5 + 0.07 * pitSettles);
  for (let c = 0; c < pit.cols; c++) {
    const col = [], keptCores = [];
    for (let r = 0; r < pit.rows; r++) {
      const v = at(pit, c, r);
      if (!v) continue;
      if (v === CORE_CELL) keptCores.push(v);
      else col.push(v);
    }
    const keep = Math.min(pit.rows - keptCores.length, Math.ceil(col.length * keepFrac));
    const stack = col.slice(0, Math.max(0, keep)).concat(keptCores);
    for (let r = 0; r < pit.rows; r++) put(pit, c, r, stack[r] || 0);
  }
  pitScale *= 2;
  pitSettles++;
}

// paying takes the dust back out of the pit, top layer first
// what the pile is worth, so the picture and the number never drift apart
function pileWorth() {
  let n = 0;
  for (const v of pit.grid) if (v && v !== CORE_CELL) n++;
  return n * pitScale;
}

// paying comes out of the hole: grains are lifted off the top until the pile is
// worth no more than the counter says
function spend(cost) {
  stored -= cost;
  let worth = pileWorth();
  for (let r = pit.rows - 1; r >= 0 && worth > stored; r--) {
    for (let c = 0; c < pit.cols && worth > stored; c++) {
      const v = at(pit, c, r);
      if (!v || v === CORE_CELL) continue;
      put(pit, c, r, 0);
      worth -= pitScale;
    }
  }
}

function buy(u) {
  const cost = u.cost();
  if (!u.show()) return;
  if (u.currency === 'core') {
    if (cores < cost) return;
    cores -= cost;
    takeCoreCells(cost);
  } else {
    if (stored < cost) return;
    spend(cost);
  }
  u.buy();
  dirty = true;
  buildShop();
}

// the board is grouped by who the upgrade is for, not by what it costs
const SECTIONS = [
  { title: 'you', keys: ['carry', 'auto', 'speed', 'pick'] },
  { title: 'haulers', keys: ['unlockhaulers', 'hauler', 'haulcarry', 'haulpace'] },
  { title: 'miners', keys: ['unlockminers', 'miner', 'minerspeed'] },
  { title: 'drillers', keys: ['unlockdrillers', 'driller', 'drillspeed'] }
];

// one row per available upgrade, under a heading for the crew it belongs to
function buildShop() {
  shopEl.textContent = '';
  for (const sect of SECTIONS) {
    const rows = sect.keys
      .map(k => UPGRADES.find(u => u.key === k))
      .filter(u => u && u.show());
    if (!rows.length) continue;

    const head = document.createElement('div');
    head.className = 'sect';
    head.dataset.sect = sect.title;
    shopEl.appendChild(head);

    for (const u of rows) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.key = u.key;
      b.innerHTML = '<span class="what"></span><span class="cost"></span>';
      b.addEventListener('click', () => buy(u));
      shopEl.appendChild(b);
    }
  }
}

// --- throwing ---------------------------------------------------------------
const THROW = 9;          // cursor px/ms -> pixel velocity
const THROW_MAX = 17;

function track(x, y) {
  trail.push({ x, y, t: performance.now() });
  if (trail.length > 5) trail.shift();
}

// velocity of the flick you let go on
function throwVel() {
  if (trail.length < 2) return { vx: 0, vy: 0 };
  const a = trail[0], b = trail[trail.length - 1];
  const dt = Math.max(16, b.t - a.t);
  if (performance.now() - b.t > 120) return { vx: 0, vy: 0 };   // paused before letting go
  const clamp = v => Math.max(-THROW_MAX, Math.min(THROW_MAX, v));
  return { vx: clamp((b.x - a.x) / dt * THROW), vy: clamp((b.y - a.y) / dt * THROW) };
}

// --- sweeping ---------------------------------------------------------------
// pixels still in flight are caught if they pass the cursor while it is held
function catchAir(mx, my) {
  let room = capacity() - held;
  if (room <= 0) return;

  const reach = (BRUSH + 2) * P;      // forgiving: dust falls quickly
  for (let i = chips.length - 1; i >= 0 && room > 0; i--) {
    const ch = chips[i];
    if (Math.abs(ch.x + P / 2 - mx) > reach || Math.abs(ch.y + P / 2 - my) > reach) continue;
    chips.splice(i, 1);
    held++;
    room--;
    motes.push({
      s: ch.s,
      a: Math.random() * Math.PI * 2,
      d: P * (1 + Math.random() * 2.6),
      spin: (Math.random() - 0.5) * 0.03,
      bob: Math.random() * Math.PI * 2
    });
    dirty = true;
  }
}

// pick up floor dust inside the brush, up to what the cursor can carry
function sweep(mx, my) {
  // a loose core on the ground is picked up by hand, no capacity needed
  if (coreItem && !heldCore &&
      Math.abs(coreItem.x + CORE_SIZE / 2 - mx) < CORE_SIZE &&
      Math.abs(coreItem.y + CORE_SIZE / 2 - my) < CORE_SIZE) {
    coreItem = null;
    heldCore = true;
    dirty = true;
  }

  let room = capacity() - held;
  if (room <= 0) return;

  let taken = 0;
  const lifted = [];

  const c0 = colOf(floor, mx);
  const r0 = Math.floor((bottomY(floor) - my) / P);
  for (let dr = -BRUSH; dr <= BRUSH && room > 0; dr++) {
    for (let dc = -BRUSH; dc <= BRUSH && room > 0; dc++) {
      const c = c0 + dc, r = r0 + dr;
      const v = inside(floor, c, r) ? at(floor, c, r) : 0;
      if (!v) continue;
      if (dc * dc + dr * dr > BRUSH * BRUSH) continue;
      put(floor, c, r, 0);
      lifted.push(v);
      taken++;
      room--;
    }
  }
  if (taken) {
    held += taken;
    for (let i = 0; i < taken; i++) {
      motes.push({
        s: lifted[i],
        a: Math.random() * Math.PI * 2,
        d: P * (1 + Math.random() * 2.6),
        spin: (Math.random() - 0.5) * 0.03,
        bob: Math.random() * Math.PI * 2
      });
    }
    dirty = true;
  }
}

function release(x, y) {
  const { vx, vy } = throwVel();
  if (heldCore) {
    heldCore = false;
    coreItem = { x: x - CORE_SIZE / 2, y: y - CORE_SIZE / 2, vx, vy, rest: false };
    dirty = true;
  }
  if (!held) return;
  for (let i = 0; i < held; i++) {
    spawnChip(x + (Math.random() - 0.5) * P * 6, y + (Math.random() - 0.5) * P * 6,
              vx + (Math.random() - 0.5) * 1.4,
              vy + (Math.random() - 0.5) * 1.4,
              motes[i]?.s || 1);
  }
  held = 0;
  motes = [];
  dirty = true;
}

// --- persistence ------------------------------------------------------------
const gridStr = b => {
  let s = '';
  for (let i = 0; i < b.grid.length; i++) s += String(b.grid[i] || 0);
  return s;
};

function persist() {
  if (!dirty) return;
  dirty = false;
  save({
    stored,
    carryLevel,
    speedLevel,
    autoMine,
    cores,
    seenCore,
    pitScale,
    pitFrac,
    pitSettles,
    pickLevel,
    core: coreItem && !heldCore ? { x: coreItem.x, y: coreItem.y } : null,
    coreLoose: heldCore || !!coreItem,
    miners,
    haulers,
    drillers,
    drillSpeedLevel,
    drillersUnlocked,
    minerSpeedLevel,
    haulCarryLevel,
    haulPaceLevel,
    boulder: gridToString(),
    grid,
    boulderNo,
    floor: { cols: floor.cols, rows: floor.rows, cells: gridStr(floor) },
    pit: { cols: pit.cols, rows: pit.rows, cells: gridStr(pit) }
  });
}

function restoreGrid(b, s) {
  if (!s) return;
  if (s.cols === b.cols && s.rows === b.rows && s.cells?.length === b.cols * b.rows) {
    for (let i = 0; i < b.grid.length; i++) b.grid[i] = +s.cells[i] || 0;
  } else if (typeof s.cells === 'string') {
    let n = 0;
    for (const ch of s.cells) if (ch !== '0') n++;
    fillFlat(b, n);          // different window size: re-pack the same amount
  }
}

function restore() {
  const s = load();
  boulderNo = s?.boulderNo || 1;
  if (!s || !gridFromString(s.boulder, s.grid) || typeof s.stored !== 'number') {
    makeBoulder();
    stored = 0;
    shownStored = tweenFrom = tweenTo = 0;
    carryLevel = 0;
    speedLevel = 0;
    autoMine = false;
    haulersUnlocked = false;
    minersUnlocked = false;
    cores = 0;
    seenCore = false;
    pitScale = 1;
    pitFrac = 0;
    pitSettles = 0;
    pickLevel = 0;
    coreItem = null;
    miners = 0;
    haulers = 0;
    drillers = 0;
    drillSpeedLevel = 0;
    drillersUnlocked = false;
    minerSpeedLevel = 0;
    haulCarryLevel = 0;
    haulPaceLevel = 0;
    return;
  }
  stored = s.stored;
  shownStored = tweenFrom = tweenTo = stored;
  carryLevel = s.carryLevel || 0;
  speedLevel = s.speedLevel || 0;
  autoMine = !!s.autoMine;
  haulersUnlocked = !!s.haulersUnlocked;
  minersUnlocked = !!s.minersUnlocked;
  cores = s.cores || 0;
  seenCore = !!s.seenCore || cores > 0;
  pitScale = s.pitScale || 1;
  pitFrac = s.pitFrac || 0;
  pitSettles = s.pitSettles || 0;
  pickLevel = s.pickLevel || 0;
  if (s.coreLoose) {
    coreItem = s.core
      ? { x: s.core.x, y: s.core.y, vx: 0, vy: 0, rest: true }
      : { x: W * 0.4, y: groundY - CORE_SIZE, vx: 0, vy: 0, rest: false };
  }
  miners = s.miners || 0;
  haulers = s.haulers || 0;
  drillers = s.drillers || 0;
  drillSpeedLevel = s.drillSpeedLevel || 0;
  drillersUnlocked = !!s.drillersUnlocked;
  minerSpeedLevel = s.minerSpeedLevel || 0;
  haulCarryLevel = s.haulCarryLevel || 0;
  haulPaceLevel = s.haulPaceLevel || 0;
  restoreGrid(floor, s.floor);
  restoreGrid(pit, s.pit);
  seedPitCores();
  coreBuried = boulderAlive() || !(s.coreLoose || heldCore);
}

function reset() {
  clear();
  chips = [];
  stored = 0;
  shownStored = tweenFrom = tweenTo = 0;
  held = 0;
  carryLevel = 0;
  speedLevel = 0;
  autoMine = false;
  haulersUnlocked = false;
  minersUnlocked = false;
  cores = 0;
  seenCore = false;
  pitScale = 1;
  pitFrac = 0;
  pitSettles = 0;
  pickLevel = 0;
  coreItem = null;
  heldCore = false;
  miners = 0;
  haulers = 0;
  drillers = 0;
  drillSpeedLevel = 0;
  drillersUnlocked = false;
  minerSpeedLevel = 0;
  haulCarryLevel = 0;
  haulPaceLevel = 0;
  syncWorkers();
  floor.grid.fill(0);
  pit.grid.fill(0);
  boulderNo = 1;
  makeBoulder();
  buildShop();
  dirty = true;
  persist();
}

// --- workers ----------------------------------------------------------------
function syncWorkers() {
  const want = { miner: miners, hauler: haulers, driller: drillers };
  workers = workers.filter(w => want[w.type]-- > 0);       // drop any extras

  // count what is missing first: pushing while re-reading the length only ever
  // creates half of them
  const have = t => workers.filter(w => w.type === t).length;
  const needMiners = miners - have('miner');
  for (let i = 0; i < needMiners; i++) {
    workers.push({
      type: 'miner', next: 0, x: cx, y: cy, lunge: 0,
      ph: Math.random() * Math.PI * 2,        // where in its wobble it starts
      sp: 0.5 + Math.random() * 0.9,          // how fast it sways
      wob: 0.05 + Math.random() * 0.10,       // how far it drifts round its seat
      rw: 0.4 + Math.random() * 0.9           // how much it drifts in and out
    });
  }
  const needDrillers = drillers - have('driller');
  for (let i = 0; i < needDrillers; i++) {
    workers.push({ type: 'driller', next: 0, x: cx, y: cy, spot: null, ph: Math.random() * 6.28 });
  }
  const needHaulers = haulers - have('hauler');
  for (let i = 0; i < needHaulers; i++) {
    workers.push({ type: 'hauler', x: Math.random() * pit.x * 0.8, carry: 0, next: 0, goal: 'seek' });
  }

  // number the miners off so they can be spaced evenly round the rock, and
  // stagger the new ones through the swing cycle so the crew never hits as one
  let slot = 0;
  for (const w of workers) {
    if (w.type !== 'miner') continue;
    w.slot = slot++;
    if (!w.next) w.next = performance.now() + minerMs() * (w.slot / Math.max(1, miners));
  }
}

// somewhere worth drilling: sample a few cells and take the thickest rock
function thickSpot() {
  let best = null, deepest = 0;
  for (let i = 0; i < 40; i++) {
    const y = Math.floor(Math.random() * grid), x = Math.floor(Math.random() * grid);
    const v = boulder[y]?.[x] || 0;
    if (v > deepest) { deepest = v; best = { x, y }; }
  }
  return best;
}

// only dust on this side of the pit: nobody can walk across the trench
function nearestDust(x) {
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  const from = Math.max(0, Math.min(last, colOf(floor, x)));
  for (let d = 0; d <= last; d++) {
    for (const c of [from - d, from + d]) {
      if (c < 0 || c > last || blocked(c)) continue;
      if (at(floor, c, 0)) return c;
    }
  }
  return -1;
}

function topGrain(c) {
  for (let r = floor.rows - 1; r >= 0; r--) if (at(floor, c, r)) return r;
  return -1;
}

function updateWorkers(now) {
  orbitPhase += 0.004;
  if (!coreItem || heldCore || !coreItem.rest) coreTaker = null;
  for (const w of workers) {
    if (w.type === 'miner') {
      // the crew stands in an evenly spaced ring and turns together, so nobody
      // shares a spot; a second ring forms outside once the first is full
      const base = (grid / 2) * P + WORKER;
      const perRing = Math.max(6, Math.floor((2 * Math.PI * base) / (WORKER * 2.2)));
      const ring = Math.floor(w.slot / perRing);
      const seat = w.slot % perRing;
      const inRing = Math.min(perRing, miners - ring * perRing);   // share out the whole circle
      const t = now / 1000;

      // each one sways round its seat and drifts in and out on its own timing,
      // and leans into the rock when it swings
      w.lunge *= 0.86;
      const angle = (seat / inRing) * Math.PI * 2 + orbitPhase + ring * 0.5
                  + Math.sin(t * w.sp + w.ph) * w.wob;
      const rad = base + ring * WORKER * 2
                + Math.sin(t * w.sp * 0.7 + w.ph * 1.7) * WORKER * 0.5 * w.rw
                - w.lunge * WORKER * 0.9;

      w.x = cx + Math.cos(angle) * rad - WORKER / 2;
      w.y = cy + Math.sin(angle) * rad - WORKER / 2;
      if (boulderAlive() && now >= w.next) {
        knockOff(w.x + WORKER / 2, w.y + WORKER / 2);
        w.lunge = 1;
        w.next = now + minerMs() * (0.85 + Math.random() * 0.3);   // never quite in time
      }
      continue;
    }

    if (w.type === 'driller') {
      // pick a thick spot and stay on it until it is gone
      if (!w.spot || !boulder[w.spot.y]?.[w.spot.x]) w.spot = thickSpot();
      if (!w.spot) continue;

      const { px, py } = cellPos(w.spot.x, w.spot.y);
      const pull = Math.sin(now / 90 + w.ph) * 1.5;      // it judders as it bites
      w.x = px - WORKER / 2 + P / 2 + pull;
      w.y = py - WORKER / 2 + P / 2;

      if (now >= w.next) {
        const left = boulder[w.spot.y][w.spot.x];
        boulder[w.spot.y][w.spot.x] = left - 1;
        spawnChip(px, py, bell() * 0.9 + (px - cx) / (grid * P) * 1.2,
                  -(1.4 + Math.random() * 2), depthShade(left, depthOf()));
        w.next = now + drillMs() * (0.9 + Math.random() * 0.2);
        dirty = true;
      }
      continue;
    }

    // hauler: fetch a loose core if there is one, else scoop dust, then tip it
    // all over the ledge
    if ((w.goal === 'seek' || w.goal === 'idle') &&
        coreItem && coreItem.rest && !heldCore && !w.hasCore &&
        (!coreTaker || coreTaker === w)) {
      coreTaker = w;
      const target = coreItem.x + CORE_SIZE / 2 - WORKER / 2;
      w.x += Math.sign(target - w.x) * Math.min(haulSpeed(), Math.abs(target - w.x));
      if (Math.abs(target - w.x) < P * 2) {
        coreItem = null;
        coreTaker = null;
        w.hasCore = true;
        w.goal = 'dump';
        dirty = true;
      }
      continue;
    }

    if (w.x > pit.x - WORKER) w.x = pit.x - WORKER;

    if (w.goal === 'seek') {
      const c = nearestDust(w.x);
      if (c < 0) { w.goal = w.carry ? 'dump' : 'idle'; continue; }
      const target = floor.x + c * P;
      w.x += Math.sign(target - w.x) * Math.min(haulSpeed(), Math.abs(target - w.x));
      if (Math.abs(target - w.x) < P && now >= w.next) {
        const r = topGrain(c);
        if (r >= 0) {
          (w.load ||= []).push(at(floor, c, r));
          put(floor, c, r, 0);
          w.carry++;
          w.next = now + scoopMs();
          dirty = true;
        }
      }
      if (w.carry >= haulCap()) w.goal = 'dump';
    } else if (w.goal === 'dump') {
      const target = pit.x + P;
      w.x += Math.sign(target - w.x) * Math.min(haulSpeed() * 1.6, Math.abs(target - w.x));
      if (Math.abs(target - w.x) < P * 1.5) {
        if (w.hasCore) {
          coreItem = { x: pit.x + P * 2, y: groundY - CORE_SIZE, vx: 1.1, vy: -1.2, rest: false };
          w.hasCore = false;
          dirty = true;
        }
        for (let i = 0; i < w.carry; i++) {
          spawnChip(pit.x + P + Math.random() * P * 3, groundY - P * 2,
                    0.4 + Math.random(), -1 - Math.random(),
                    w.load?.[i] || 1);
        }
        w.carry = 0;
        w.load = [];
        w.goal = 'seek';
        dirty = true;
      }
    } else {
      if (nearestDust(w.x) >= 0) w.goal = 'seek';
    }
  }
}

// a white circle with a black edge. It paints rather than clears, so it never
// eats the dust or the ground line behind it
function drawCircle(cxp, cyp, r) {
  ctx.beginPath();
  ctx.arc(cxp, cyp, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.stroke();
  ctx.fillStyle = '#000';
}

function drawCoreAt(x, y) {
  // radius allows for the 2px stroke, so the circle stays inside its box and
  // never paints over the ground line it is resting on
  drawCircle(x + CORE_SIZE / 2, y + CORE_SIZE / 2, CORE_SIZE / 2 - 2);
}

// buried in the rock: drawn first so the boulder covers it until you dig it out
function drawCoreBehind() {
  if (heldCore || coreItem || !boulderAlive()) return;
  const h = coreHome();
  drawCoreAt(h.x, h.y);
}

// out in the world: on the cursor or lying on the ground
function drawCore() {
  if (heldCore) drawCoreAt(mouse.x - CORE_SIZE / 2, mouse.y - CORE_SIZE / 2);
  else if (coreItem) drawCoreAt(coreItem.x, coreItem.y);
}

// a little dust hanging in the air. It drifts, and it passes at a different rate
// to the ground, so you can tell when the view is moving
const AIR = [];

function seedAir() {
  AIR.length = 0;
  const n = Math.round((worldW / 900) * 26);
  for (let i = 0; i < n; i++) {
    AIR.push({
      x: Math.random() * worldW,
      y: Math.random() * groundY,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.05 - Math.random() * 0.12,
      size: Math.random() < 0.3 ? P / 2 : P / 3,
      far: 0.45 + Math.random() * 0.4
    });
  }
}

function drawAir() {
  ctx.fillStyle = '#d9d9d9';
  for (const m of AIR) {
    m.x += m.vx;
    m.y += m.vy;
    if (m.y < -P) { m.y = groundY; m.x = Math.random() * worldW; }
    if (m.x < -P) m.x = worldW;
    if (m.x > worldW) m.x = 0;
    ctx.fillRect(Math.round(m.x - camX * m.far), Math.round(m.y), m.size, m.size);
  }
  ctx.fillStyle = '#000';
}

function drawCount() {
  const text = fmt(Math.round(shownStored));
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000';

  // over the pit mouth, but kept on screen as you scroll along it
  const x = Math.max(camX + P * 3, Math.min(pit.x + P * 4, camX + W - P * 30));
  const y = groundY - P * 3;
  ctx.fillText(text, x, y);

  if (seenCore) {
    ctx.fillStyle = '#7a7a7a';
    ctx.fillText(`${cores} core${cores === 1 ? '' : 's'}`, x, y - P * 3);
  }
  ctx.fillStyle = '#000';
}

function drawBench() {
  ctx.fillStyle = '#000';
  ctx.fillRect(bench.x, bench.y, bench.w, P * 2);                       // top slab
  ctx.fillRect(bench.x + P, bench.y + P * 2, P * 2, bench.h - P * 2);   // legs
  ctx.fillRect(bench.x + bench.w - P * 3, bench.y + P * 2, P * 2, bench.h - P * 2);
  ctx.fillRect(bench.x + P * 4, bench.y - P * 2, P * 2, P * 2);         // something clamped to it
  if (boardOpen) return;
  ctx.fillRect(bench.x + bench.w / 2 - P / 2, bench.y - P * 5, P, P);   // a dot when idle
}

function drawWorkers() {
  for (const w of workers) {
    if (w.type === 'miner') {
      ctx.fillRect(Math.round(w.x), Math.round(w.y), WORKER, WORKER);
      ctx.fillStyle = '#fff';
      ctx.fillRect(Math.round(w.x) + P, Math.round(w.y) + P, P, P);    // hollow centre
      ctx.fillStyle = '#000';
    } else if (w.type === 'driller') {
      const x = Math.round(w.x), y = Math.round(w.y);
      ctx.fillRect(x, y, WORKER, WORKER);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + P, y, P, P);                                     // a bite out of it
      ctx.fillRect(x + P, y + P * 2, P, P);
      ctx.fillStyle = '#000';
    } else {
      const y = groundY - WORKER;
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(w.x) + 1, y + 1, WORKER - 2, WORKER - 2);
      // the load rides overhead, stacked two abreast
      const left = Math.round(w.x) + (WORKER - P * 2) / 2;
      for (let i = 0; i < Math.min(w.carry, 24); i++) {
        ctx.fillStyle = shadeOf(w.load?.[i] || 1);
        ctx.fillRect(left + (i % 2) * P, y - P * (Math.floor(i / 2) + 1), P, P);
      }
      ctx.fillStyle = '#000';
      if (w.hasCore) {
        const stack = Math.ceil(Math.min(w.carry, 24) / 2);        // ride above the dust
        drawCircle(Math.round(w.x) + WORKER / 2, y - P * (stack + 2), P * 1.2);
      }
    }
  }
}

// --- loop -------------------------------------------------------------------
// where the top of the dust sits in a floor column
function pileTop(col) {
  return surfaceY(floor, Math.max(0, Math.min(floor.cols - 1, col))) + P;
}

function stepCore() {
  // the moment the last pixel goes, the core is loose and falls from the middle
  if (coreBuried && !boulderAlive()) {
    dropCore();
    nextBoulderAt = performance.now() + 2500;      // backstop if it never falls clear
    dirty = true;
  }

  // the next rock rolls in once the core has dropped out of its way
  if (!coreBuried && !boulderAlive()) {
    const clear = !coreItem || heldCore || coreItem.y > cy + (grid / 2) * P;
    if (clear || performance.now() > nextBoulderAt) {
      boulderNo++;
      makeBoulder();
      dirty = true;
    }
  }

  if (!coreItem) return;

  const k = coreItem;
  const cells = CORE_SIZE / P;
  const leftCol = () => colOf(floor, k.x);
  // the core rests on the highest dust anywhere under it
  const supportY = () => {
    let top = Infinity;
    for (let i = 0; i < cells; i++) top = Math.min(top, pileTop(leftCol() + i));
    return top;
  };

  // resting until the dust under it goes away
  if (k.rest) {
    if (k.y + CORE_SIZE >= supportY() - P) return;
    k.rest = false;
  }

  k.vy += GRAV;
  k.x += k.vx;
  k.y += k.vy;

  if (k.x < 0) { k.x = 0; k.vx = Math.abs(k.vx) * 0.4; }

  // past the ledge it drops down the shaft and banks when it hits the dust
  if (k.x + CORE_SIZE > pit.x && k.y + CORE_SIZE > groundY) {
    if (k.x < pit.x) { k.x = pit.x; k.vx = 0; }
    if (k.x > pit.x + pit.w - CORE_SIZE) { k.x = pit.x + pit.w - CORE_SIZE; k.vx = 0; }
    const pc = Math.max(0, Math.min(pit.cols - 1, colOf(pit, k.x + CORE_SIZE / 2)));
    if (k.y + CORE_SIZE >= surfaceY(pit, pc) + P) {
      const where = k.x + CORE_SIZE / 2;
      coreItem = null;
      bankCore(where);
    }
    return;
  }

  if (k.x > worldW - CORE_SIZE) { k.x = worldW - CORE_SIZE; k.vx = -Math.abs(k.vx) * 0.4; }

  // landing on the ground, or on whatever dust is piled there
  const floorY = supportY() - CORE_SIZE;
  if (k.y >= floorY) {
    k.y = floorY;
    k.vy *= -0.28;
    k.vx *= 0.72;
    if (Math.abs(k.vy) < 1.3) {
      k.vy = 0;
      if (Math.abs(k.vx) < 0.25) { k.vx = 0; k.rest = true; dirty = true; }
    }
  }
}

function step() {
  updateWorkers(performance.now());
  stepCore();
  if (mining || dragging) catchAir(mouse.x, mouse.y);   // hold and it catches

  if (mining) {
    const now = performance.now();
    nextHit = Math.max(nextHit, now - 500);      // don't burst after a background tab
    while (now >= nextHit) {
      if (boulderAlive() && overBoulder(mouse.x, mouse.y)) knockOff(mouse.x, mouse.y);
      nextHit += mineMs();
    }
  }

  for (let i = chips.length - 1; i >= 0; i--) {
    const ch = chips[i];
    ch.vy += GRAV;
    ch.x += ch.vx;
    ch.y += ch.vy;

    if (ch.x < 0) { ch.x = 0; ch.vx = Math.abs(ch.vx) * 0.6; }
    if (ch.x > worldW - P) {
      ch.x = worldW - P;
      ch.vx = -Math.abs(ch.vx) * 0.3;
    }

    // down the shaft: the pit collects whatever falls through its mouth
    if (overPitMouth(ch.x) && ch.y + P > groundY) {
      const pc = Math.max(0, Math.min(pit.cols - 1, colOf(pit, ch.x)));
      if (ch.vx < 0 && ch.x < pit.x) { ch.x = pit.x; ch.vx = 0; }             // pit wall
      if (ch.vy > 0 && ch.y >= surfaceY(pit, pc)) {
        bankDust(ch.x, ch.s);
        chips.splice(i, 1);
        continue;
      }
      continue;
    }

    // land on the floor dust
    const c = Math.max(0, Math.min(floor.cols - 1, colOf(floor, ch.x)));
    if (ch.vy > 0 && ch.y >= surfaceY(floor, c)) {
      if (!addGrain(floor, ch.x, blocked, ch.s)) bankDust(ch.x, ch.s);   // ground is full: it rolls in
      chips.splice(i, 1);
      dirty = true;
    }
  }

  settle(floor, blocked);
  settle(pit, null);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawAir();

  ctx.save();
  ctx.translate(-camX, 0);
  drawCoreBehind();
  ctx.fillStyle = '#000';

  const deep = depthOf();
  let shade = 0;
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const v = boulder[y][x];
      if (!v) continue;
      const band = depthShade(v, deep);
      if (band !== shade) { shade = band; ctx.fillStyle = shadeOf(band); }
      const { px, py } = cellPos(x, y);
      ctx.fillRect(px, py, P, P);
    }
  }

  ctx.fillStyle = '#000';

  for (const ch of chips) {
    ctx.fillStyle = shadeOf(ch.s);
    ctx.fillRect(Math.round(ch.x), Math.round(ch.y), P, P);
  }
  ctx.fillStyle = '#000';

  drawGrid(floor);
  drawGrid(pit);

  // ground up to the ledge, then the pit wall dropping away to the right edge
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(0, groundY + 1);
  ctx.lineTo(pit.x - 1, groundY + 1);
  ctx.lineTo(pit.x - 1, groundY + pit.h + 1);
  ctx.lineTo(pit.x + pit.w + 1, groundY + pit.h + 1);
  ctx.lineTo(pit.x + pit.w + 1, groundY + 1);
  ctx.lineTo(worldW, groundY + 1);
  ctx.stroke();

  drawBench();
  drawCount();
  drawCore();
  drawWorkers();
  drawCursor();
  ctx.restore();

}

function drawGrid(b) {
  let shade = 0;
  const buried = [];
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      const v = at(b, c, r);
      if (!v) continue;
      const x = b.x + c * P, y = bottomY(b) - (r + 1) * P;
      if (v === CORE_CELL) { buried.push([x, y]); continue; }
      if (v !== shade) { shade = v; ctx.fillStyle = shadeOf(v); }
      ctx.fillRect(x, y, P, P);
    }
  }
  // a core draws bigger than the cell it sits in, so keep the whole circle inside
  // the pile's walls and floor rather than letting it poke through
  const rad = P * 1.2, pad = rad + 2;
  for (const [x, y] of buried) {
    const cxp = Math.min(Math.max(x + P / 2, b.x + pad), b.x + b.cols * P - pad);
    const cyp = Math.min(Math.max(y + P / 2, b.y + pad), bottomY(b) - pad);
    drawCircle(cxp, cyp, rad);
  }
  ctx.fillStyle = '#000';
}

// the carried dust drifts loosely around the cursor
function drawCursor() {
  if (!held) return;
  const t = performance.now() / 1000;
  let shade = 0;
  for (const m of motes) {
    m.a += m.spin;
    if (m.s !== shade) { shade = m.s; ctx.fillStyle = shadeOf(m.s); }
    const x = mouse.x + Math.cos(m.a) * m.d + Math.sin(t * 1.7 + m.bob) * 2;
    const y = mouse.y + Math.sin(m.a) * m.d + Math.cos(t * 1.3 + m.bob) * 2;
    ctx.fillRect(Math.round(x), Math.round(y), P, P);
  }
  ctx.fillStyle = '#000';
}

// the board opens when the cursor comes near the bench. There is nothing to
// click: the ground round it sweeps like anywhere else
const nearBench = (x, y) => x > bench.x - P * 8 && x < bench.x + bench.w + P * 8 &&
                            y > bench.y - P * 8 && y < bench.y + bench.h + P * 4;

function placeBoard() {
  boardEl.style.left = `${bench.x - camX}px`;
  boardEl.style.top = 'auto';
  boardEl.style.bottom = `${H - bench.y + P * 3}px`;
}

function showBoard(open) {
  if (open === boardOpen) return;
  boardOpen = open;
  boardEl.hidden = !open;
  if (open) placeBoard();
}

const fmt = n => n.toLocaleString('en-US');

// the count runs to its new value and eases in at the end, taking longer for a
// bigger jump so a purchase reads as a real withdrawal
function tweenCount(now) {
  if (stored !== tweenTo) {
    tweenFrom = shownStored;
    tweenTo = stored;
    tweenAt = now;
    tweenMs = Math.max(220, Math.min(900, 180 + Math.abs(tweenTo - tweenFrom) * 1.6));
  }
  const t = Math.max(0, Math.min(1, (now - tweenAt) / tweenMs));
  const ease = 1 - Math.pow(1 - t, 3);                  // out-cubic
  shownStored = tweenFrom + (tweenTo - tweenFrom) * ease;
}

function hud() {
  tweenCount(performance.now());
  if (!boardOpen) return;

  for (const el of shopEl.children) {
    if (el.dataset.sect) {                       // heading, with the headcount
      const crew = el.dataset.sect === 'haulers' ? haulers
                 : el.dataset.sect === 'miners' ? miners : 0;
      el.textContent = crew ? `${el.dataset.sect}  ×${crew}` : el.dataset.sect;
      continue;
    }
    const u = UPGRADES.find(x => x.key === el.dataset.key);
    const cost = u.cost();
    const core = u.currency === 'core';
    el.firstChild.textContent = u.label();
    el.lastChild.textContent = core ? `◆ ${cost}` : String(cost);
    el.disabled = (core ? cores : stored) < cost;
  }
}

function frame() { step(); draw(); hud(); requestAnimationFrame(frame); }

// --- input ------------------------------------------------------------------
function pos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left + camX, y: e.clientY - r.top };
}

canvas.addEventListener('pointerdown', e => {
  const p = pos(e);
  mouse = p;
  if (!boulderAlive() && chips.length === 0) { makeBoulder(); dirty = true; return; }
  if (boulderAlive() && overBoulder(p.x, p.y)) {
    knockOff(p.x, p.y);
    mining = autoMine;                      // holding only mines once unlocked
    nextHit = performance.now() + MINE_DELAY;
    dragging = true;                        // but the brush is always in hand
    trail = [];
    track(p.x, p.y);
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    return;
  }
  dragging = true;
  trail = [];
  track(p.x, p.y);
  try { canvas.setPointerCapture(e.pointerId); } catch {}
  sweep(p.x, p.y);
});

canvas.addEventListener('pointermove', e => {
  mouse = pos(e);
  track(mouse.x, mouse.y);
  showBoard(nearBench(mouse.x, mouse.y));
  if (e.buttons === 0 && (mining || dragging)) { endDrag(e); return; }
  if (dragging) sweep(mouse.x, mouse.y);
});

function endDrag(e) {
  mining = false;
  if (!dragging) return;
  dragging = false;
  const p = pos(e);
  release(p.x, p.y);
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
addEventListener('pointerup', endDrag);          // catch releases outside the canvas
addEventListener('blur', () => {
  mining = false;
  if (dragging) { dragging = false; release(mouse.x, mouse.y); }
});

let resetArmed = 0;

function disarmReset() {
  resetArmed = 0;
  resetEl.classList.remove('armed');
  resetEl.textContent = 'reset progress';
}

resetEl.addEventListener('click', () => {
  if (!resetArmed) {
    resetArmed = setTimeout(disarmReset, 4000);
    resetEl.classList.add('armed');
    resetEl.textContent = 'erase everything?';
    return;
  }
  clearTimeout(resetArmed);
  disarmReset();
  reset();
});

function pan(dx) {
  const was = camX;
  camX = Math.max(0, Math.min(camX + dx, Math.max(0, worldW - W)));
  if (camX !== was && boardOpen) placeBoard();
}

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  pan((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.8);
}, { passive: false });

boardEl.addEventListener('pointerleave', () => showBoard(false));
addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') reset();
  if (e.key === 'ArrowRight') pan(P * 12);
  if (e.key === 'ArrowLeft') pan(-P * 12);
});
addEventListener('resize', resize);
document.addEventListener('visibilitychange', persist);
addEventListener('pagehide', persist);
setInterval(persist, 1000);

// dev hooks for poking at state from the console
window.__pile = (x, n) => { for (let i = 0; i < n; i++) addGrain(floor, x, blocked); dirty = true; };
window.__jump = n => { boulderNo = n; coreItem = null; heldCore = false; makeBoulder(); dirty = true; };
window.__preview = n => {
  const keep = boulderNo;
  boulderNo = n;
  const r = boulderRadius(), d = depthOf();
  boulderNo = keep;
  // a dome of radius r and depth d holds about 2/3 pi r^2 d
  return { boulder: n, depth: d, radiusCells: r, approxRock: Math.round(2 / 3 * Math.PI * r * r * d * 0.9) };
};
window.__next = () => { boulder = boulder.map(row => row.map(() => 0)); chips = []; };
window.__drop = () => { dropCore(); dirty = true; };
window.__give = (n, shade = 1) => { for (let i = 0; i < n; i++) bankDust(pit.x + Math.random() * pit.w, shade); };

window.__state = () => ({ shown: Math.round(shownStored), drillers, pitX: pit.x, pitW: pit.w, pitRows: pit.rows, groundY, camX: Math.round(camX), worldW, pitCapacity: pit.cols * pit.rows, stored, held, cores, boulderNo, depth: depthOf(), grid, rock: boulder.flat().reduce((a, b) => a + b, 0), seenCore, pitScale, pitSettles, pitGrains: count(pit), haulersUnlocked, minersUnlocked, heldCore, coreItem: coreItem && { x: Math.round(coreItem.x), y: Math.round(coreItem.y), rest: coreItem.rest }, pickLevel, carryLevel, speedLevel, autoMine, miners, haulers, minerSpeedLevel, haulCarryLevel, haulPaceLevel, haulCap: haulCap(), minerMs: minerMs(), workers: workers.length, workerPos: workers.map(w => `${w.type[0]}:${Math.round(w.x)},${Math.round(w.y)}`), mining, dragging, mouse, capacity: capacity(), mineMs: mineMs(), pxPerSec: +mineRate().toFixed(2), floor: count(floor), pit: count(pit), chips: chips.length, chipShades: chips.slice(0, 8).map(c => c.s) });

resize();
restore();
syncWorkers();
buildShop();
frame();
