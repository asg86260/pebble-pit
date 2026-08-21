import './style.css';
import { load, save, clear } from './save.js';
import './selftest.js';        // adds __test() to the console

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const shopEl = document.getElementById('shop');
const boardEl = document.getElementById('board');
const resetEl = document.getElementById('reset');

const P = 6;              // pixel size
const TARGET = 1000000;   // dust in the hole: the whole point
// The place is built once and never moves. The pit floor sits on the bottom of
// the viewport, the ground line a fixed height above it, and the rock, the bench
// and the lip keep their distances. A bigger window is only more sky and more
// ground: the ground runs a long way either side of everything.
const SKY = 2000;         // world above the ground line, so any window has sky
// Every site stands on the one ground line, measured out from the rock. The
// world runs away to the left as sites are unlocked, so walking further out is
// the progression. The bench, the lab and the pit sit to the right.
const TO_CAVE = -900;     // rock centre to the mouth of the cave
const TO_FARM = -1650;    // rock centre to the near edge of the farm
const TO_BENCH = 420;     // rock centre to the bench
const TO_LAB = 650;       // rock centre to the lab
const TO_LEDGE = 900;     // rock centre to the lip of the pit
const GROUND_LEFT = 2400; // ground running away to the left of everything
const ROCK_W = 60;        // the rock is a hill: this wide in cells at rock 1
const ROCK_H = 26;        // and this tall
const ROCK_GROW_W = 4;    // each rock is a little broader than the last
const ROCK_GROW_H = 2;    // and a little higher
const ROCK_SINK = 0;      // its foot sits on the ground line, like everything else
const ROCK_SKY = 340;     // sky kept clear above the ground for the rock to grow into
const ROCK_CLEAR = 24;    // bare ground kept either side of the rock, so the spoil stands off it
const PIT_H = 276;        // the pit is one fixed hole, in world pixels: this deep
const PIT_W = 3624;       // and this wide
// What a grain in the pile is drawn at. A grain is always one dust; adding finer
// sizes here lets the pile settle to them as it fills, which is how the hole
// could be made to hold a million. For now it stays one size: dust in the pit
// looks like dust everywhere else, and the hole holds 27,784.
const PIT_GRAINS = [P];
const PIT_PAD = 18;       // cells of ground past its far edge, so you can see the end
const FLOOR_MARGIN = 12;  // gap under the pit floor, at the bottom of the window
const MAX_DEPTH = 6;      // sheets of rock a boulder can be thick
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
let worldH = 0;
let camX = 0, camY = 0;   // how far the view has been scrolled over the world
let zoom = 1;             // shrinks to fit a small window, never rearranges
let dpr = 1;
let viewW = 0, viewH = 0; // what the window covers, in world units
let boulder = [];         // rows of ints: 0 empty, 1..n the layer a cell belongs to
let gw = ROCK_W;          // rock width in cells
let gh = ROCK_H;          // rock height in cells
let rockTops = [];        // topmost rock cell per column, for the crew to stand on
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
let paid = [];            // dust on its way out of the pit to the bench
let cores = 0;            // cores banked in the pit
let seenCore = false;     // a core has been banked at least once
let pitStep = 0;          // how many times the pile has settled to a finer grain
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
let coreTaker = null;     // the hauler that has claimed a loose core
const bench = { x: 0, y: 0, w: 0, h: 0 };
let boardOpen = false;    // the workbench board is showing
let shownStored = 0;      // the counter chases the real number
let tweenFrom = 0, tweenTo = 0, tweenAt = 0, tweenMs = 300;
let dirty = false;

// two sand grids: the ground the dust lands on, and the pit dug into it
// `p` is the size of one grain in that grid. The ground's is fixed; the pit's
// gets finer as the pile grows, so a million grains still fit in the same hole
// the ground bed is deep, so heaps build to whatever height the sand finds on
// its own rather than flattening off against a ceiling
const floor = { x: 0, y: 0, cols: 0, rows: 90, p: P, grid: null };
const pit = { x: 0, y: 0, w: 0, h: 0, cols: 0, rows: 0, p: P, grid: null };

// --- sand grid helpers ------------------------------------------------------
const shadeOf = v => SHADES[Math.min(SHADES.length, Math.max(1, v)) - 1];

// Shade reads how much rock is left, relative to that rock's own thickness: a
// rock is black where it is at full thickness and pales as it is worn through.
// So rock 1, one sheet everywhere, is solid black, and so is the dust off it.
// Nothing of ours is ever drawn over the rock -- the crew stand on top of it and
// the spoil lands to either side of it -- so black on black never comes up.
const depthShade = (v, max) =>
  Math.max(1, Math.min(SHADES.length, Math.ceil(SHADES.length * v / Math.max(1, max))));
const at = (b, c, r) => b.grid[r * b.cols + c];
const put = (b, c, r, v) => {
  b.grid[r * b.cols + c] = v;
  if (b === pit) markPit(c, r);
};
const inside = (b, c, r) => c >= 0 && c < b.cols && r >= 0 && r < b.rows;
const bottomY = b => b.y + b.rows * b.p;    // screen y of the grid floor
const colOf = (b, x) => Math.floor((x - b.x) / b.p);
const count = b => { let n = 0; for (const v of b.grid) if (v) n++; return n; };
const countDust = b => { let n = 0; for (const v of b.grid) if (v && v !== CORE_CELL) n++; return n; };

// The only hole in the ground is the pit. The rock stands behind the ground,
// not on it: spoil heaps in front of its foot and the crew walk past it, which
// is what a hill at the back of a yard looks like.
const overPitMouth = x => x + P > pit.x && x < pit.x + pit.w;
const rockLeft = () => cx - (gw / 2) * P;
const overRock = x => x + P > rockLeft() && x < rockLeft() + gw * P;
const rockColAt = x => Math.max(0, Math.min(gw - 1, Math.floor((x - rockLeft()) / P)));
// the rock keeps a clear apron around its foot, so the banks stand off it rather
// than heaping up its flanks and blurring where the rock ends
const overApron = x => x + P > rockLeft() - ROCK_CLEAR && x < rockLeft() + gw * P + ROCK_CLEAR;
const blocked = c => overPitMouth(floor.x + c * P) || overApron(floor.x + c * P);

// screen y where a pixel falling down column c would come to rest
function surfaceY(b, c) {
  for (let r = b.rows - 1; r >= 0; r--) {
    if (at(b, c, r)) return bottomY(b) - (r + 2) * b.p;
  }
  return bottomY(b) - b.p;
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
function settle(b, skip, from = 0, to = b.cols) {
  for (let r = 1; r < b.rows; r++) {
    for (let c = from; c < to; c++) {
      if (!at(b, c, r)) continue;
      const v = at(b, c, r);
      if (!at(b, c, r - 1)) { put(b, c, r, 0); put(b, c, r - 1, v); continue; }
      const first = (c + r) & 1 ? -1 : 1;   // alternate bias so piles stay even
      for (const d of [first, -first]) {
        const n = c + d;
        // dust heaped against the ledge topples over the edge. It has to be piled
        // up to do it: a thin scatter just rests against the wall
        if (b === floor && d > 0 && r >= SPILL_ROW && n < b.cols && overPitMouth(b.x + n * P)) {
          put(b, c, r, 0);
          spawnChip(b.x + n * P, bottomY(b) - (r + 1) * P, 0.6 + Math.random() * 0.6, 0, v);
          break;
        }
        if (!inside(b, n, r - 1) || (skip && skip(n))) continue;
        // on the ground a grain only slides where there is a real drop beside it,
        // so heaps stand up instead of spreading themselves flat
        if (b === floor && r >= 2 && at(b, n, r - 2)) continue;
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
// The world is a fixed size and never rearranges: the window is only a view onto
// it, and a small window scrolls rather than squashing everything together.
function resize() {
  // the canvas is told its size outright, in its own inline style and in device
  // pixels, so it does not depend on the stylesheet or on measuring anything
  W = Math.max(320, document.documentElement.clientWidth || innerWidth || 320);
  H = Math.max(240, document.documentElement.clientHeight || innerHeight || 240);
  dpr = Math.min(2, devicePixelRatio || 1);

  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.zIndex = '0';
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);

  // only a window too small for the pit shrinks the picture, and then in whole
  // pixels per cell: fractional scaling leaves hairline seams between them
  const needH = ROCK_SKY + PIT_H + FLOOR_MARGIN + P * 4;
  const needW = TO_LEDGE + ROCK_SKY + P * 20;
  const raw = Math.min(1, H / needH, W / needW);
  zoom = Math.max(2, Math.floor(P * raw)) / P;
  viewW = W / zoom;
  viewH = H / zoom;

  // fixed places, laid out once and never moved
  groundY = SKY;
  cx = GROUND_LEFT;
  placeRock();                             // the rock stands on the ground line

  pit.x = cx + TO_LEDGE;
  pit.w = PIT_W;
  pit.h = PIT_H;
  pit.cols = PIT_W / pit.p;
  pit.rows = PIT_H / pit.p;
  pit.y = groundY;

  bench.w = P * 12;
  bench.h = P * 7;
  bench.x = cx + TO_BENCH;
  bench.y = groundY - bench.h;

  worldW = pit.x + pit.w + PIT_PAD * P;
  worldH = groundY + pit.h + FLOOR_MARGIN;

  floor.x = 0;
  floor.cols = Math.ceil(worldW / P);
  floor.y = groundY - floor.rows * P;

  // the pit floor rests on the bottom of the window; everything above it is sky
  camY = worldH - viewH;
  clampCam();
  seedAir();

  resizeGrid(floor);
  if (!pit.grid) setPitGrain(pitStep);     // the pit never changes with the window
}

// the view can never leave the world; if the window is bigger, it sits still
// only sideways: the pit floor is pinned to the bottom of the window
function clampCam() {
  camX = Math.max(0, Math.min(camX, Math.max(0, worldW - viewW)));
  camY = worldH - viewH;
}

// The pit is drawn through a scratch canvas one pixel per grain, blitted up to
// size. A million fillRects a frame is not a drawing routine; one drawImage is.
// Only the cells that changed are pushed across, so a busy pile costs a strip.
const pitPix = document.createElement('canvas');
const pitPixCtx = pitPix.getContext('2d', { willReadFrequently: true });
let pitImage = null;                       // the pixels, one per grain
let pitPainted = false;                    // false means repaint the whole thing
let pitLo = 0, pitHi = -1, pitTop = -1, pitBot = 0;   // what has changed since

// SHADES as packed RGBA, so a grain is one array write
const SHADE_RGBA = SHADES.map(h => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
});

function markPit(c, r) {
  if (c < pitLo) pitLo = c;
  if (c > pitHi) pitHi = c;
  if (r < pitTop || pitTop < 0) pitTop = r;
  if (r > pitBot) pitBot = r;
}

function setPitGrain(step) {
  pitStep = Math.max(0, Math.min(PIT_GRAINS.length - 1, step));
  pit.p = PIT_GRAINS[pitStep];
  pit.cols = PIT_W / pit.p;
  pit.rows = PIT_H / pit.p;
  pit.grid = new Uint8Array(pit.cols * pit.rows);
  pitPainted = false;
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
    // near the lip, where the dust is and where you can see them: the pit runs
    // a long way right, and a core out in the empty end is a core nobody finds
    addGrain(pit, pit.x + (0.1 + 0.8 * ((i + 0.5) / Math.max(1, cores))) * 700, null, CORE_CELL);
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

// how big rock n is, in cells. It may never grow into the bench, nor out of the
// sky kept clear above the ground line
function rockSize() {
  const w = ROCK_W + (boulderNo - 1) * ROCK_GROW_W;
  const h = ROCK_H + (boulderNo - 1) * ROCK_GROW_H;
  return {
    w: Math.max(10, Math.min(w, Math.floor((TO_BENCH - P * 14) * 2 / P))),
    h: Math.max(6, Math.min(h, Math.floor((ROCK_SKY - P * 4) / P)))
  };
}

// the rock's foot sits just under the ground line so it looks planted, not laid
function placeRock() {
  cy = groundY + ROCK_SINK - (gh / 2) * P;
}

// world y of the top of the rock in a column, or the ground where there is none
function rockTopY(c) {
  const t = rockTops[c];
  return t >= 0 ? groundY + ROCK_SINK - (gh - t) * P : groundY;
}

// the surface the crew stand on, kept per column so nobody walks it every frame
// Where a worker's feet go, given the surface it is standing on. Everything on
// the ground shares one baseline: snapped to the pixel grid so a row of them
// lines up, and never below the ground line, so nobody sinks into the earth.
function standOn(surfaceY) {
  const y = Math.min(surfaceY, groundY) - WORKER;
  return Math.round(y / P) * P;
}

function refreshRockTops() {
  rockTops = new Array(gw).fill(-1);
  for (let c = 0; c < gw; c++) {
    for (let y = 0; y < gh; y++) if (boulder[y][c]) { rockTops[c] = y; break; }
  }
}

// A heightfield, not a disc: a broad hill with crags along its crest, sitting
// flat on the ground. Cells hold remaining thickness, deepest at the base and
// through the middle, thinning towards the skyline.
function makeBoulder() {
  const size = rockSize();
  gw = size.w;
  gh = size.h;
  const deep = depthOf();
  const seed = [Math.random() * 6, Math.random() * 6, Math.random() * 6,
                Math.random() < 0.5 ? -1 : 1];

  const crest = [];
  for (let x = 0; x < gw; x++) {
    const u = x / (gw - 1);
    let f = Math.pow(Math.sin(Math.PI * u), 0.42);        // broad, with steep shoulders
    f *= 1 + 0.16 * (u - 0.5) * seed[3]                   // it leans one way or the other
           + 0.05 * Math.sin(u * 6.1 + seed[0])           // and the crest is rough, not wavy
           + 0.07 * Math.sin(u * 14.7 - seed[1])
           + 0.06 * Math.sin(u * 27.3 + seed[2]);
    crest.push(Math.max(1, Math.min(gh, Math.round(f * gh))));
  }

  coreBuried = true;
  boulder = [];
  for (let y = 0; y < gh; y++) {
    const row = [];
    for (let x = 0; x < gw; x++) {
      const up = gh - y;                                   // 1 at the foot, gh at the sky
      if (up > crest[x]) { row.push(0); continue; }
      const k = crest[x] <= 1 ? 0 : (up - 1) / (crest[x] - 1);
      const mid = Math.sqrt(Math.max(0, 1 - ((x / (gw - 1) - 0.5) * 2) ** 2 * 0.55));
      const t = Math.sqrt(Math.max(0, 1 - k * k)) * mid;
      row.push(Math.max(1, Math.round(deep * t)));
    }
    boulder.push(row);
  }
  placeRock();
  refreshRockTops();
  clearApron();
}

// shift any dust the last rock left inside this one's apron out to clear ground,
// so a bigger rock never lands standing in a heap
function clearApron() {
  if (!floor.grid) return;
  for (let c = 0; c < floor.cols; c++) {
    if (!blocked(c)) continue;
    for (let r = 0; r < floor.rows; r++) {
      const v = at(floor, c, r);
      if (!v) continue;
      put(floor, c, r, 0);
      addGrain(floor, floor.x + c * P, blocked, v);     // to the nearest clear column
    }
  }
}

function gridToString() {
  let s = '';
  for (const row of boulder) for (const v of row) s += String(v);
  return s;
}

function gridFromString(s, w, h) {
  if (typeof s !== 'string' || !w || !h || s.length !== w * h) return false;
  gw = w;
  gh = h;
  boulder = [];
  for (let y = 0; y < gh; y++) {
    const row = [];
    for (let x = 0; x < gw; x++) row.push(+s[y * gw + x] || 0);
    boulder.push(row);
  }
  placeRock();
  refreshRockTops();
  return true;
}

// the rock is anchored by its foot, not its middle: it grows upwards and outwards
const cellPos = (x, y) => ({ px: cx + (x - gw / 2) * P, py: groundY + ROCK_SINK - (gh - y) * P });

function boulderAlive() {
  for (const row of boulder) for (const v of row) if (v) return true;
  return false;
}

// the boulder's whole footprint, so clicking a chipped-out gap still chips
// on the rock if there is rock close by: chipped-out gaps still count, but the
// empty air below it does not, so falling dust can be caught there
// the rock's whole footprint takes a swing, so clicking its general area works
function overBoulder(mx, my) {
  if (!boulderAlive()) return false;         // nothing left to swing at
  const half = (gw / 2) * P;
  const foot = groundY + ROCK_SINK;
  return mx > cx - half && mx < cx + half && my > foot - gh * P && my < foot;
}

// the cell under the cursor, or the nearest filled one if that spot is already hollow
function pickCell(mx, my) {
  const gx = (mx - cx) / P + gw / 2;
  const gy = gh - (groundY + ROCK_SINK - my) / P;
  const hx = Math.floor(gx), hy = Math.floor(gy);
  if (boulder[hy]?.[hx]) return { x: hx, y: hy };

  let best = null, bestD = Infinity;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
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

// Rock knocked loose is *aimed*. A chip goes off whichever side of the rock it
// was struck from, to a spot on the ground clear of the foot, and is launched on
// the one arc that gets there: the pop is sized to the distance, and the
// sideways speed follows from how long that pop keeps it in the air. Nothing is
// nudged mid-flight and nothing has to be shoved off the rock, so the spray
// reads as a throw rather than a scatter. Where it lands it heaps up on its own,
// to whatever height the sand finds -- there is no ceiling on a bank.
function spawnSpoil(px, py, shade) {
  const side = px < cx ? -1 : 1;                     // off the nearer side of the rock
  const land = rockEdge(side) + side * (P * 6 + Math.abs(bell()) * P * 12);
  const v = aim(px, py, land, P);
  spawnChip(px, py, v.vx, v.vy, shade);
}

const rockEdge = side =>
  side < 0 ? rockLeft() - ROCK_CLEAR : rockLeft() + gw * P + ROCK_CLEAR;

// the one arc from here to there: the pop is sized to the distance, and the
// sideways speed follows from how long that pop keeps it in the air
function aim(x, y, land, size) {
  const drop = Math.max(P, groundY - size - y);
  const pop = 2 + Math.min(4.5, Math.abs(land - x) / 90);
  const t = (pop + Math.sqrt(pop * pop + 2 * GRAV * drop)) / GRAV;
  return { vx: (land - x) / t, vy: -pop };
}

function knockOff(mx, my) {
  const c = pickCell(mx, my);
  if (!c) return;

  const want = pickCount();
  const reach = Math.ceil(Math.sqrt(want)) + 1;
  const near = [];
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      const x = c.x + dx, y = c.y + dy;
      if (!boulder[y]?.[x]) continue;
      near.push({ x, y, d: dx * dx + dy * dy });
    }
  }
  near.sort((a, b) => a.d - b.d);

  for (const cell of near.slice(0, want)) {
    const left = boulder[cell.y][cell.x];
    const shade = depthShade(left, depthOf());   // how deep it looked, for colour
    boulder[cell.y][cell.x] = left - 1;
    const { px, py } = cellPos(cell.x, cell.y);
    spawnSpoil(px, py, shade);
  }
  dirty = true;
  refreshRockTops();
}

// the core sits at the middle of the rock and only comes loose when it is bare
function coreHome() {
  return { x: cx - CORE_SIZE / 2, y: groundY + ROCK_SINK - gh * P * 0.42 - CORE_SIZE / 2 };
}

function dropCore() {
  const h = coreHome();
  coreBuried = false;
  // Thrown clear of the rock, out towards the bench. The next rock stands where
  // the last one did, so a core that settled in its footprint would be one you
  // could not pick up -- it is aimed past the edge rather than left to roll.
  const land = rockEdge(1) + P * 3 + Math.random() * P * 8;
  const v = aim(h.x, h.y, land, CORE_SIZE);
  coreItem = { x: h.x, y: h.y, vx: v.vx, vy: v.vy, rest: false };
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
const pickCount = () => 1 + pickLevel;         // pixels a single swing takes

// units are the marks themselves: a grain of dust, a grain a second
const UNITS = {
  'px': '<i class="dust"></i>',
  'px/s': '<i class="dust"></i>/s'
};

const num = v => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
const rateText = lvl => num(mineRate(lvl));

const UPGRADES = [
  {
    key: 'carry',
    name: 'carry',
    from: () => capacity(),
    to: () => capacity() + CAP_STEP,
    cost: () => Math.round(8 * Math.pow(1.35, carryLevel)),
    buy: () => carryLevel++,
    show: () => true
  },
  {
    key: 'auto',
    name: 'hold to mine',
    cost: () => 25,
    buy: () => { autoMine = true; },
    show: () => !autoMine
  },
  {
    key: 'speed',
    name: 'swing',
    unit: 'px/s',
    from: () => rateText(speedLevel),
    to: () => rateText(speedLevel + 1),
    cost: () => Math.round(20 * Math.pow(1.9, speedLevel)),
    buy: () => speedLevel++,
    show: () => mineMs() > MINE_FLOOR
  },
  {
    key: 'pick',
    name: 'pick',
    unit: 'px',
    from: () => pickCount(),
    to: () => pickCount() + 1,
    cost: () => 2 + pickLevel,
    currency: 'core',
    buy: () => pickLevel++,
    show: () => seenCore
  },
  {
    key: 'unlockminers',
    name: 'first miner',
    cost: () => 1,
    currency: 'core',
    buy: () => { minersUnlocked = true; miners++; syncWorkers(); },
    show: () => seenCore && !minersUnlocked
  },
  {
    key: 'miner',
    name: 'miners',
    from: () => miners,
    to: () => miners + 1,
    cost: () => Math.round(60 * Math.pow(1.7, Math.max(0, miners - 1))),
    buy: () => { miners++; syncWorkers(); },
    show: () => minersUnlocked
  },
  {
    key: 'minerspeed',
    name: 'miner swing',
    unit: 'px/s',
    from: () => num(minerRate()),
    to: () => num(minerRate(minerSpeedLevel + 1)),
    cost: () => Math.round(70 * Math.pow(1.8, minerSpeedLevel)),
    buy: () => minerSpeedLevel++,
    show: () => miners > 0 && minerMs() > MINER_FLOOR
  },
  {
    key: 'unlockhaulers',
    name: 'first worker',
    cost: () => 2,
    currency: 'core',
    buy: () => { haulersUnlocked = true; haulers++; syncWorkers(); },
    show: () => seenCore && !haulersUnlocked
  },
  {
    key: 'hauler',
    name: 'workers',
    from: () => haulers,
    to: () => haulers + 1,
    cost: () => Math.round(80 * Math.pow(1.7, Math.max(0, haulers - 1))),
    buy: () => { haulers++; syncWorkers(); },
    show: () => haulersUnlocked
  },
  {
    key: 'haulcarry',
    name: 'worker load',
    from: () => haulCap(),
    to: () => haulCap(haulCarryLevel + 1),
    cost: () => Math.round(50 * Math.pow(1.5, haulCarryLevel)),
    buy: () => haulCarryLevel++,
    show: () => haulers > 0
  },
  {
    key: 'haulpace',
    name: 'worker pace',
    unit: 'px/s',
    from: () => num(haulSpeed() * 60),
    to: () => num(haulSpeed(haulPaceLevel + 1) * 60),
    cost: () => Math.round(60 * Math.pow(1.7, haulPaceLevel)),
    buy: () => haulPaceLevel++,
    show: () => haulers > 0
  },
  {
    key: 'unlockdrillers',
    name: 'first driller',
    cost: () => 3,
    currency: 'core',
    buy: () => { drillersUnlocked = true; drillers++; syncWorkers(); },
    show: () => seenCore && !drillersUnlocked
  },
  {
    key: 'driller',
    name: 'drillers',
    from: () => drillers,
    to: () => drillers + 1,
    cost: () => Math.round(140 * Math.pow(1.6, Math.max(0, drillers - 1))),
    buy: () => { drillers++; syncWorkers(); },
    show: () => drillersUnlocked
  },
  {
    key: 'drillspeed',
    name: 'driller bite',
    unit: 'px/s',
    from: () => num(drillRate()),
    to: () => num(drillRate(drillSpeedLevel + 1)),
    cost: () => Math.round(120 * Math.pow(1.7, drillSpeedLevel)),
    buy: () => drillSpeedLevel++,
    show: () => drillers > 0 && drillMs() > DRILL_FLOOR
  }
];

// The pile in the pit is the real thing, not a picture of it: one grain is one
// dust, always. What changes as it fills is how big a grain is drawn. The hole
// stays the same hole; the dust in it settles finer, six pixels to three to two
// to one, and at one pixel a grain the pit holds a million.
function bankDust(x, shade = 1) {
  stored++;                                // every pixel is worth one
  dirty = true;
  if (!addGrain(pit, x, null, shade)) {
    refinePit();                           // full: settle finer and carry on
    addGrain(pit, x, null, shade);
  }
}

// how many dust the pit could hold at its current grain
const pitCapacity = () => pit.cols * pit.rows;

// Settle the pile to the next grain down. Every grain is kept: each column of
// the old pile is shared out across the finer columns that stand where it did,
// so the profile survives and only the resolution changes. With one grain size
// configured there is nowhere finer to go, and a full pit simply stays full --
// the count keeps rising, the picture does not.
function refinePit() {
  if (pitStep >= PIT_GRAINS.length - 1) return;    // already as fine as it gets

  const oldP = pit.p, oldCols = pit.cols, oldRows = pit.rows, oldGrid = pit.grid;
  pitStep++;
  pit.p = PIT_GRAINS[pitStep];
  pit.cols = PIT_W / pit.p;
  pit.rows = PIT_H / pit.p;
  pit.grid = new Uint8Array(pit.cols * pit.rows);

  // Where each old column lands. The ratio is not always a whole number (three
  // pixels to two is one and a half), so a column's span is taken from the
  // boundaries rather than assumed: spans of one and two alternate, and every
  // finer column is claimed exactly once. Nothing is dropped on the floor.
  const k = oldP / pit.p;
  const edge = c => Math.min(pit.cols, Math.floor(c * k));

  for (let c = 0; c < oldCols; c++) {
    const stack = [];
    for (let r = 0; r < oldRows; r++) {
      const v = oldGrid[r * oldCols + c];
      if (v && v !== CORE_CELL) stack.push(v);     // cores are re-seeded after
    }
    if (!stack.length) continue;

    const a = edge(c);
    const span = Math.max(1, edge(c + 1) - a);
    for (let i = 0; i < stack.length; i++) {
      const nc = a + (i % span);
      const nr = (i - i % span) / span;
      if (nc < pit.cols && nr < pit.rows) put(pit, nc, nr, stack[i]);
    }
  }
  seedPitCores();
  pitPainted = false;
  dirty = true;
}

// paying comes out of the hole: grains are lifted off the top until the pile is
// worth no more than the counter says
// The pile always shows as much of the hole as will fit in it: one grain one
// dust, up to the brim. Spending lifts grains off the top until it says the
// right thing again -- which is a straight subtraction while there is room, and
// nothing at all while the pit is over the brim and the pile is already short.
function spend(cost) {
  if (window.__spends) window.__spends.push(cost);   // dev: what took dust out
  stored -= cost;
  let left = countDust(pit) - Math.min(stored, pitCapacity());
  for (let r = pit.rows - 1; r >= 0 && left > 0; r--) {
    for (let c = 0; c < pit.cols && left > 0; c++) {
      const v = at(pit, c, r);
      if (!v || v === CORE_CELL) continue;
      put(pit, c, r, 0);
      left--;
      if (paid.length < 200) {               // a few hundred is plenty to read
        paid.push({
          x0: pit.x + c * pit.p,
          y0: bottomY(pit) - (r + 1) * pit.p,
          x: pit.x + c * pit.p,
          y: bottomY(pit) - (r + 1) * pit.p,
          t: -Math.random() * 0.5,           // they leave in a stream, not a block
          rate: 0.012 + Math.random() * 0.01,
          lift: 60 + Math.random() * 90,     // how high it arcs on the way
          s: v
        });
      }
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
  { title: 'miners', keys: ['unlockminers', 'miner', 'minerspeed'] },
  { title: 'workers', keys: ['unlockhaulers', 'hauler', 'haulcarry', 'haulpace'] },
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
      b.innerHTML = '<span class="name"></span><span class="from"></span>' +
                    '<span class="arrow"></span><span class="to"></span>' +
                    '<span class="cost"></span>';
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
// A full pit is a million cells, which is a million characters written to
// localStorage every second if you store it a digit at a time. A pile is nearly
// all long runs of the same value, so store the runs: "value x length", and a
// full pit comes out a few kilobytes.
function gridStr(b) {
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
function gridFill(b, str) {
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
  return i === b.grid.length;
}

// A million grains stored one value per cell is two and a half megabytes of
// speckle, written every second. What actually matters about the pile is its
// shape and its total: the shade of any one grain is decoration. So the pit is
// stored as the height of every column plus how many grains of each shade there
// are, and the speckle is dealt out again on the way back in. The profile and
// the count come back exact; you cannot tell which grain moved.
function pitToSave() {
  const heights = new Array(pit.cols).fill(0);
  const shades = new Array(SHADES.length).fill(0);
  for (let c = 0; c < pit.cols; c++) {
    let n = 0;
    for (let r = 0; r < pit.rows; r++) {
      const v = at(pit, c, r);
      if (!v || v === CORE_CELL) continue;
      n++;
      shades[Math.min(SHADES.length, Math.max(1, v)) - 1]++;
    }
    heights[c] = n;
  }
  return { cols: pit.cols, rows: pit.rows, heights: runs(heights), shades };
}

// run-length a list of numbers: "value x length", runs joined by dots
function runs(list) {
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

function unruns(str, want) {
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

function pitFromSave(sv) {
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
  pitPainted = false;
  return true;
}

// how many cells a run-length string holds, without unpacking it
function gridCount(str) {
  if (typeof str !== 'string') return 0;
  let n = 0;
  for (const part of str.split('.')) {
    const x = part.indexOf('x');
    if (x > 0 && part[0] !== '0') n += +part.slice(x + 1);
  }
  return n;
}

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
    pitStep,
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
    gw,
    gh,
    boulderNo,
    floor: { cols: floor.cols, rows: floor.rows, cells: gridStr(floor) },
    pit: pitToSave()
  });
}

function restoreGrid(b, s) {
  if (!s) return;
  b.grid.fill(0);
  if (s.cols === b.cols && s.rows === b.rows && gridFill(b, s.cells)) {
    if (b === pit) pitPainted = false;
    return;
  }
  fillFlat(b, gridCount(s.cells));   // a different shape: re-pack the same amount
  if (b === pit) pitPainted = false;
}

function restore() {
  const s = load();
  boulderNo = s?.boulderNo || 1;
  if (!s || !gridFromString(s.boulder, s.gw, s.gh) || typeof s.stored !== 'number') {
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
    pitStep = 0;
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
  setPitGrain(s.pitStep || 0);
  pickLevel = s.pickLevel || 0;
  if (s.coreLoose) {
    coreItem = s.core
      ? { x: s.core.x, y: s.core.y, vx: 0, vy: 0, rest: true }
      : { x: worldW * 0.2, y: groundY - CORE_SIZE, vx: 0, vy: 0, rest: false };
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
  if (!pitFromSave(s.pit)) pit.grid.fill(0);
  seedPitCores();
  coreBuried = boulderAlive() || !(s.coreLoose || heldCore);
}

function reset() {
  clear();
  chips = [];
  paid = [];
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
  setPitGrain(0);
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
// The crew take the hill off in layers. A miner does not stand in one spot and
// bore a shaft: it walks the top layer, striking the rock under its feet as it
// goes, so the crest comes off as a row and the next row is exposed underneath.
// It turns at the ends of the layer and turns before walking into a mate, so the
// gang works back and forth across the rock like a line of men on a bench.
const MINE_BAND = 3;      // cells below the peak still counted as the top layer
const MINER_WALK = 0.5;   // pixels a frame along the row

let peakRow = 0;          // the highest standing rock, recomputed each frame

function findPeak() {
  peakRow = gh;
  for (let c = 0; c < gw; c++) {
    if (rockTops[c] >= 0 && rockTops[c] < peakRow) peakRow = rockTops[c];
  }
}

const inBand = c =>
  c >= 0 && c < gw && rockTops[c] >= 0 && rockTops[c] <= peakRow + MINE_BAND;

const colAtX = x => Math.max(0, Math.min(gw - 1, Math.round((x - rockLeft()) / P)));

// the nearest column that is still part of the working layer
function nearestInBand(from) {
  for (let d = 0; d < gw; d++) {
    if (inBand(from - d)) return from - d;
    if (inBand(from + d)) return from + d;
  }
  return from;
}

// somebody already working the stretch this one is about to walk into
function elbowed(w, x) {
  for (const o of workers) {
    if (o === w || o.type !== 'miner') continue;
    if ((o.x - w.x) * w.dir <= 0) continue;             // behind it: not in the way
    if (Math.abs(o.x - x) < WORKER * 1.2) return true;
  }
  return false;
}

function syncWorkers() {
  const want = { miner: miners, hauler: haulers, driller: drillers };
  workers = workers.filter(w => want[w.type]-- > 0);       // drop any extras

  // count what is missing first: pushing while re-reading the length only ever
  // creates half of them
  const have = t => workers.filter(w => w.type === t).length;
  const needMiners = miners - have('miner');
  for (let i = 0; i < needMiners; i++) {
    workers.push({
      type: 'miner', next: 0, lunge: 0,
      x: rockLeft() + Math.random() * gw * P, y: cy,
      dir: Math.random() < 0.5 ? -1 : 1,
      ph: Math.random() * Math.PI * 2,        // where in its wobble it starts
      sp: 0.5 + Math.random() * 0.9,          // how fast it sways
      wob: 0.05 + Math.random() * 0.10,       // how far it drifts round its seat
      rw: 0.4 + Math.random() * 0.9           // how much it drifts in and out
    });
  }
  const needDrillers = drillers - have('driller');
  for (let i = 0; i < needDrillers; i++) {
    workers.push({ type: 'driller', next: 0, x: cx, y: cy, spot: null,
      side: i % 2 ? 1 : -1, ph: Math.random() * 6.28 });
  }
  const needHaulers = haulers - have('hauler');
  for (let i = 0; i < needHaulers; i++) {
    workers.push({
      type: 'hauler', x: rockLeft() + Math.random() * (pit.x - rockLeft()), y: 0,
      carry: 0, next: 0, goal: 'seek'
    });
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
// the outermost standing column on one flank, at its foot: a driller parks there
// and eats a notch sideways into the hill
function flankSpot(side) {
  for (let i = 0; i < gw; i++) {
    const x = side < 0 ? i : gw - 1 - i;
    if (rockTops[x] < 0) continue;
    for (let y = gh - 1; y >= 0; y--) if (boulder[y][x]) return { x, y };
  }
  return null;
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
  if (miners > 0) findPeak();
  if (!coreItem || heldCore || !coreItem.rest) coreTaker = null;
  for (const w of workers) {
    if (w.type === 'miner') {
      // The crew climb the hill and work it from the top down. Each one keeps a
      // stretch of the crest to itself, stands on whatever rock is left there and
      // sinks with it as the rock goes; when its stretch is bare it ambles along
      // to the nearest that is not.
      const t = now / 1000;

      // Walk the layer, turning at its ends and before walking into a mate. A
      // miner that finds itself off the layer -- because the rest of the gang
      // took the row down around it, or because it was hired onto a flank --
      // climbs back to it rather than standing there boring a shaft.
      const here = colAtX(w.x + WORKER / 2);
      if (!inBand(here)) {
        const back = nearestInBand(here);
        if (back !== here) w.dir = Math.sign(back - here);
        w.x += w.dir * MINER_WALK * 2.5;              // brisk, it has ground to make up
      } else {
        const step = w.x + w.dir * MINER_WALK;
        if (inBand(colAtX(step + WORKER / 2)) && !elbowed(w, step)) w.x = step;
        else w.dir = -w.dir;
      }

      const col = colAtX(w.x + WORKER / 2);
      const surf = rockTopY(col);
      w.lunge *= 0.82;
      // it bobs on its feet, and drops into the swing
      w.y = standOn(surf + Math.sin(t * w.sp + w.ph) * 1.2 + w.lunge * P * 1.4);

      if (boulderAlive() && now >= w.next && rockTops[col] >= 0) {
        knockOff(w.x + WORKER / 2, surf + P / 2);                   // bite what it stands on
        w.lunge = 1;
        w.next = now + minerMs() * (0.85 + Math.random() * 0.3);    // never quite in time
      }
      continue;
    }

    if (w.type === 'driller') {
      // a driller works the flank instead: it parks at the foot of the hill and
      // eats a notch sideways into it
      if (!w.spot || !boulder[w.spot.y]?.[w.spot.x]) w.spot = flankSpot(w.side);
      if (!w.spot) continue;

      const { px, py } = cellPos(w.spot.x, w.spot.y);
      const pull = Math.sin(now / 90 + w.ph) * 1.5;      // it judders as it bites
      w.x = px - WORKER / 2 + P / 2 + pull + w.side * WORKER * 0.6;
      w.y = standOn(Math.min(py + P, groundY));

      if (now >= w.next) {
        const had = boulder[w.spot.y][w.spot.x];
        boulder[w.spot.y][w.spot.x] = had - 1;
        spawnSpoil(px, py, depthShade(had, depthOf()));
        w.next = now + drillMs() * (0.9 + Math.random() * 0.2);
        refreshRockTops();
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
    w.y = standOn(groundY);

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
      const target = pit.x - WORKER;                 // the lip, where they can stand
      w.x += Math.sign(target - w.x) * Math.min(haulSpeed() * 1.6, Math.abs(target - w.x));
      if (Math.abs(target - w.x) < P) {
        if (w.hasCore) {
          coreItem = { x: pit.x + P * 2, y: groundY - CORE_SIZE, vx: 1.1, vy: -1.2, rest: false };
          w.hasCore = false;
          dirty = true;
        }
        // a proper toss off the lip, so it arcs out over the edge
        for (let i = 0; i < w.carry; i++) {
          spawnChip(w.x + WORKER / 2, groundY - WORKER - P,
                    2 + Math.random() * 1.4 + bell() * 0.3,
                    -(2.4 + Math.random() * 1.6),
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

// dust hanging in the air, thrown off the piles themselves: the more dust is
// lying about, the more of it drifts. They pass at their own rate as the view
// scrolls, so movement reads without any furniture in the background
const AIR = [];
const AIR_CAP = 260;

function seedAir() {
  AIR.length = 0;
}

// a spot just above the dust in a random column of a pile
function airSource() {
  const b = Math.random() < 0.5 ? floor : pit;
  for (let tries = 0; tries < 12; tries++) {
    const c = Math.floor(Math.random() * b.cols);
    if (!at(b, c, 0)) continue;
    if (b === floor && blocked(c)) continue;
    return { x: b.x + c * b.p + Math.random() * b.p, y: surfaceY(b, c) - P };
  }
  return null;
}

// paid dust arcs out of the pit to the bench and is gone; a flight it always
// finishes, rather than a pull it can circle forever
function stepPaid() {
  const tx = bench.x + bench.w / 2, ty = bench.y - P * 2;
  for (let i = paid.length - 1; i >= 0; i--) {
    const m = paid[i];
    m.t += m.rate;
    if (m.t >= 1) { paid.splice(i, 1); continue; }
    if (m.t <= 0) continue;

    const e = m.t * m.t * (3 - 2 * m.t);           // ease in and out
    m.x = m.x0 + (tx - m.x0) * e;
    m.y = m.y0 + (ty - m.y0) * e - Math.sin(e * Math.PI) * m.lift;
  }
}

function drawPaid() {
  let shade = 0;
  for (const m of paid) {
    if (m.s !== shade) { shade = m.s; ctx.fillStyle = shadeOf(m.s); }
    ctx.fillRect(Math.round(m.x), Math.round(m.y), P, P);
  }
  ctx.fillStyle = '#000';
}

let dustSeen = 0, dustSeenAt = 0;

// roughly how much dust is lying about, refreshed a few times a second: this
// only sets how many motes drift in the air, and counting a full pit every
// frame would cost more than the whole rest of the game
function dustAbout(now) {
  if (now - dustSeenAt > 400) {
    dustSeen = count(floor) + count(pit);
    dustSeenAt = now;
  }
  return dustSeen;
}

function stepAir() {
  const dust = dustAbout(performance.now());
  const want = Math.min(AIR_CAP, 6 + Math.round(dust / 45));

  if (AIR.length < want && Math.random() < 0.6) {
    const from = dust > 20 ? airSource() : null;
    const at0 = from || { x: camX + Math.random() * W, y: Math.random() * groundY };
    AIR.push({
      x: at0.x,
      y: at0.y,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -0.06 - Math.random() * 0.16,
      life: 300 + Math.random() * 500,
      size: Math.random() < 0.3 ? P / 2 : P / 3,
      far: 0.45 + Math.random() * 0.4
    });
  }

  for (let i = AIR.length - 1; i >= 0; i--) {
    const m = AIR[i];
    m.x += m.vx;
    m.y += m.vy;
    m.life--;
    if (m.life <= 0 || m.y < -P || AIR.length > want + 40) AIR.splice(i, 1);
  }
}

function drawAir() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#d9d9d9';
  for (const m of AIR) {
    ctx.fillRect(Math.round(m.x - camX * m.far), Math.round(m.y - camY * m.far), m.size, m.size);
  }
  ctx.fillStyle = '#000';
}

function drawCount() {
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'left';

  // over the pit mouth, but kept on screen as you scroll along it
  const x = Math.max(camX + P * 3, Math.min(pit.x + P * 4, camX + viewW - P * 30));
  const y = Math.min(groundY - P * 3, camY + viewH - P * 3);

  // a grain of dust, then the count of it
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y - P, P, P);
  ctx.fillText(fmt(Math.round(shownStored)), x + P * 2, y);

  // a core, then the count of those
  if (seenCore) {
    const cy2 = y - P * 3;
    drawCircle(x + P / 2, cy2 - P / 2, P / 2 + 1);
    ctx.fillStyle = '#000';
    ctx.fillText(String(cores), x + P * 2, cy2);
  }
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
      const y = standOn(groundY);
      ctx.strokeStyle = '#000';
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
    const clear = !coreItem || heldCore || coreItem.rest;   // it has rolled clear
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

  // A core must never settle under the rock. It is aimed clear when it drops,
  // but a rock that grew over it, or a throw of your own, can still leave one
  // there: it is relaunched, once, on an arc that clears the edge -- not left to
  // bounce its way out a few pixels at a time.
  if (k.rest && k.x + CORE_SIZE > rockLeft() && k.x < rockLeft() + gw * P) {
    const side = k.x + CORE_SIZE / 2 < cx ? -1 : 1;
    const v = aim(k.x, k.y, rockEdge(side) + side * P * 4, CORE_SIZE);
    k.rest = false;
    k.vx = v.vx;
    k.vy = v.vy;
  }

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
  stepAir();
  stepPaid();
  updateWorkers(performance.now());
  stepCore();
  if (dragging) catchAir(mouse.x, mouse.y);   // swinging does not catch its own spray

  if (mining) {
    const now = performance.now();
    nextHit = Math.max(nextHit, now - 500);      // don't burst after a background tab
    while (now >= nextHit) {
      if (overBoulder(mouse.x, mouse.y)) knockOff(mouse.x, mouse.y);
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
  settlePit();
}

// A million cells is too many to walk every frame, so the pit is settled a band
// of columns at a time, picking up where it left off. The pile slumps a beat
// behind itself, which nobody can see, and the frame cost is flat whatever the
// grain.
const SETTLE_BUDGET = 40000;               // cells of pit to look at per frame
let settleAt = 0;                          // the column it got to last time

function settlePit() {
  const band = Math.max(1, Math.min(pit.cols, Math.floor(SETTLE_BUDGET / pit.rows)));
  settle(pit, null, settleAt, Math.min(pit.cols, settleAt + band));
  settleAt += band;
  if (settleAt >= pit.cols) settleAt = 0;
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#fff';                       // the page is painted, not assumed
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawAir();

  ctx.save();
  const k = zoom * dpr;
  ctx.setTransform(k, 0, 0, k, Math.round(-camX * k), Math.round(-camY * k));
  drawCoreBehind();
  drawGroundLine();
  ctx.fillStyle = '#000';

  const deep = depthOf();
  let shade = 0;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
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
  drawPit();

  drawPitOutline();

  drawPaid();
  drawBench();
  drawCount();
  drawCore();
  drawWorkers();
  drawCursor();
  ctx.restore();

}

// push whatever changed into the scratch canvas, then blit it into the world at
// grain size. Cores are drawn on top, as circles, not as pixels
// The ground runs up to the lip and picks up again past the far wall. It is
// drawn before the rock, so the rock's foot stands over it: the couple of cells
// the rock sinks below the line then read as the rock being in front of the
// ground rather than buried in it.
function drawGroundLine() {
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(0, groundY + 1);
  ctx.lineTo(pit.x - 1, groundY + 1);
  ctx.moveTo(pit.x + pit.w + 1, groundY + 1);
  ctx.lineTo(worldW, groundY + 1);
  ctx.stroke();
}

// the walls and floor of the pit, over the pile so the hole keeps its edges
function drawPitOutline() {
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(pit.x - 1, groundY + 1);
  ctx.lineTo(pit.x - 1, groundY + pit.h + 1);
  ctx.lineTo(pit.x + pit.w + 1, groundY + pit.h + 1);
  ctx.lineTo(pit.x + pit.w + 1, groundY + 1);
  ctx.stroke();
}

function drawPit() {
  if (!pitImage || pitPix.width !== pit.cols || pitPix.height !== pit.rows) {
    pitPix.width = pit.cols;
    pitPix.height = pit.rows;
    pitImage = pitPixCtx.createImageData(pit.cols, pit.rows);
    pitPainted = false;
  }

  if (!pitPainted) { pitLo = 0; pitHi = pit.cols - 1; pitTop = 0; pitBot = pit.rows - 1; }

  if (pitHi >= pitLo && pitTop >= 0) {
    const d = pitImage.data;
    for (let r = pitTop; r <= pitBot; r++) {
      // row 0 is the floor of the pit, so the image is drawn upside down
      const py = pit.rows - 1 - r;
      for (let c = pitLo; c <= pitHi; c++) {
        const v = at(pit, c, r);
        const i = (py * pit.cols + c) * 4;
        if (!v) { d[i + 3] = 0; continue; }
        const rgba = SHADE_RGBA[Math.min(SHADES.length, Math.max(1, v)) - 1];
        d[i] = rgba[0]; d[i + 1] = rgba[1]; d[i + 2] = rgba[2]; d[i + 3] = 255;
      }
    }
    pitPixCtx.putImageData(pitImage, 0, 0, pitLo, pit.rows - 1 - pitBot,
                           pitHi - pitLo + 1, pitBot - pitTop + 1);
    pitPainted = true;
    pitLo = pit.cols; pitHi = -1; pitTop = -1; pitBot = 0;
  }

  const sm = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;       // grains are squares, not smudges
  ctx.drawImage(pitPix, pit.x, pit.y, pit.w, pit.h);
  ctx.imageSmoothingEnabled = sm;

  drawPitCores();
}

// a core draws bigger than the grain it sits in, so keep the whole circle inside
// the pile's walls and floor rather than letting it poke through
function drawPitCores() {
  const rad = P * 1.2, pad = rad + 2;
  for (let r = 0; r < pit.rows; r++) {
    for (let c = 0; c < pit.cols; c++) {
      if (at(pit, c, r) !== CORE_CELL) continue;
      const x = pit.x + c * pit.p, y = bottomY(pit) - (r + 1) * pit.p;
      drawCircle(Math.min(Math.max(x + pit.p / 2, pit.x + pad), pit.x + pit.w - pad),
                 Math.min(Math.max(y + pit.p / 2, pit.y + pad), bottomY(pit) - pad), rad);
    }
  }
  ctx.fillStyle = '#000';
}

function drawGrid(b) {
  let shade = 0;
  const buried = [];
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      const v = at(b, c, r);
      if (!v) continue;
      const x = b.x + c * b.p, y = bottomY(b) - (r + 1) * b.p;
      if (v === CORE_CELL) { buried.push([x, y]); continue; }
      if (v !== shade) { shade = v; ctx.fillStyle = shadeOf(v); }
      ctx.fillRect(x, y, b.p, b.p);
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
  boardEl.style.left = `${(bench.x - camX) * zoom}px`;
  boardEl.style.top = 'auto';
  boardEl.style.bottom = `${H - (bench.y - camY) * zoom + P * 3}px`;
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
      const crew = el.dataset.sect === 'workers' ? haulers
                 : el.dataset.sect === 'miners' ? miners : 0;
      el.textContent = crew ? `${el.dataset.sect}  ×${crew}` : el.dataset.sect;
      continue;
    }
    const u = UPGRADES.find(x => x.key === el.dataset.key);
    const cost = u.cost();
    const core = u.currency === 'core';
    const [name, from, arrow, to, price] = el.children;
    const step = u.from ? `${u.from()}` : '';

    name.textContent = u.name;
    from.textContent = step;
    arrow.textContent = step ? '→' : '';
    to.innerHTML = step ? `${u.to()}${u.unit ? ' ' + UNITS[u.unit] : ''}` : '';
    price.innerHTML = core ? `<i class="core"></i> ${cost}` : `<i class="dust"></i> ${cost}`;
    el.disabled = (core ? cores : stored) < cost;
  }
}

function frame() { step(); draw(); hud(); requestAnimationFrame(frame); }

// --- input ------------------------------------------------------------------
function pos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) / zoom + camX,
    y: (e.clientY - r.top) / zoom + camY
  };
}

canvas.addEventListener('pointerdown', e => {
  const p = pos(e);
  mouse = p;
  if (overBoulder(p.x, p.y)) {                // false once the rock is finished
    knockOff(p.x, p.y);
    mining = autoMine;                      // holding only mines once unlocked
    nextHit = performance.now() + MINE_DELAY;
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
  camX += dx;
  clampCam();
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
addEventListener('load', resize);
visualViewport?.addEventListener('resize', resize);
setInterval(() => {
  const w = document.documentElement.clientWidth, h = document.documentElement.clientHeight;
  if (w !== W || h !== H) resize();          // in case a resize event is missed
}, 500);
document.addEventListener('visibilitychange', persist);
addEventListener('pagehide', persist);
setInterval(persist, 1000);

// dev hooks for poking at state from the console
window.__clearFloor = () => { floor.grid.fill(0); dirty = true; };
window.__pile = (x, n) => { for (let i = 0; i < n; i++) addGrain(floor, x, blocked); dirty = true; };
window.__jump = n => { boulderNo = n; coreItem = null; heldCore = false; makeBoulder(); dirty = true; };
window.__preview = n => {
  const keep = boulderNo;
  boulderNo = n;
  const size = rockSize(), d = depthOf();
  boulderNo = keep;
  // a hill w by h, roughly half of that box filled, at about half the full depth
  return { boulder: n, depth: d, cells: size,
           approxRock: Math.round(size.w * size.h * 0.5 * d * 0.55) };
};
window.__next = () => { boulder = boulder.map(row => row.map(() => 0)); chips = []; };
window.__drop = () => { dropCore(); dirty = true; };
window.__crew = (m = 0, h = 0, d = 0) => {   // hire straight off, for looking at things
  miners = m; haulers = h; drillers = d;
  minersUnlocked = m > 0; haulersUnlocked = h > 0; drillersUnlocked = d > 0;
  if (m || h || d) seenCore = true;
  syncWorkers(); buildShop(); dirty = true;
};
window.__spend = n => { spend(Math.min(n, stored)); dirty = true; };
window.__give = (n, shade = 4) => { for (let i = 0; i < n; i++) bankDust(pit.x + Math.random() * pit.w, shade); };

// how the banks sit against the rock: nothing in the apron, and the first column
// of dust outside it only a grain or two tall, so the heap ramps away
function apronReport() {
  let inApron = 0, tallest = 0;
  const near = rockLeft() - ROCK_CLEAR, far = rockLeft() + gw * P + ROCK_CLEAR;
  for (let c = 0; c < floor.cols; c++) {
    const x = floor.x + c * P;
    let h = 0;
    for (let r = floor.rows - 1; r >= 0; r--) if (at(floor, c, r)) { h = r + 1; break; }
    if (x + P > near && x < far) { inApron += h; continue; }
    const d = x < near ? (near - (x + P)) / P : (x - far) / P;
    if (d < 1) tallest = Math.max(tallest, h);
  }
  return { inApron, tallest };
}

// how much dust has ended up somewhere the player cannot get at it
function strandedDust() {
  let left = 0, under = 0;
  const l = rockLeft(), r = l + gw * P;
  for (let c = 0; c < floor.cols; c++) {
    const x = floor.x + c * P;
    if (x >= r) continue;
    let n = 0;
    for (let row = 0; row < floor.rows; row++) if (at(floor, c, row)) n++;
    if (x + P <= l) left += n; else under += n;
  }
  return { left, under };
}

window.__state = () => ({ paid: paid.length, apronDust: apronReport().inApron, apronClear: apronReport().inApron === 0, heapAtRock: apronReport().tallest, dustLeftOfRock: strandedDust().left, dustUnderRock: strandedDust().under, rockX: Math.round(cx), rockY: Math.round(cy), benchX: Math.round(bench.x), benchY: Math.round(bench.y), rockW: gw * P, rockH: gh * P, rockFoot: groundY + ROCK_SINK, zoom: +zoom.toFixed(3), viewW: Math.round(viewW), viewH: Math.round(viewH), air: AIR.length, camY: Math.round(camY), worldH, shown: Math.round(shownStored), drillers, pitX: pit.x, pitW: pit.w, pitRows: pit.rows, pitGrain: pit.p, pitStep, groundY, camX: Math.round(camX), worldW, pitCapacity: pitCapacity(), stored, held, cores, boulderNo, depth: depthOf(), gw, gh, rock: boulder.flat().reduce((a, b) => a + b, 0), seenCore, pitGrains: count(pit), pitDust: countDust(pit), haulersUnlocked, minersUnlocked, heldCore, coreItem: coreItem && { x: Math.round(coreItem.x), y: Math.round(coreItem.y), rest: coreItem.rest }, pickLevel, carryLevel, speedLevel, autoMine, miners, haulers, minerSpeedLevel, haulCarryLevel, haulPaceLevel, haulCap: haulCap(), minerMs: minerMs(), workers: workers.length, workerPos: workers.map(w => `${w.type[0]}:${Math.round(w.x)},${Math.round(w.y)}`), mining, dragging, mouse, capacity: capacity(), mineMs: mineMs(), pxPerSec: +mineRate().toFixed(2), floor: count(floor), pit: count(pit), chips: chips.length, chipShades: chips.slice(0, 8).map(c => c.s) });

resize();
camX = cx - 380;                         // start looking at the rock, the bench and the pit
clampCam();
restore();
syncWorkers();
buildShop();
frame();
