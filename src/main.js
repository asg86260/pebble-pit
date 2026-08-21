// Boulder Clicker.
//
// This file is the wiring: it decides what order things happen in each frame and
// hands the browser its hooks. Everything else lives in its own module -- see
// state.js for what changes, config.js for every number, and world.js for where
// things stand.

import './style.css';
import './selftest.js';        // adds __test() to the console

import { P, GRAV, ROCK_SINK, ROCK_CLEAR, SETTLE_BUDGET, HAUL_EMPTY,
         PILE_LIMIT, PILE_CLEAR, CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL } from './config.js';
import { S, floor, pit, bench, cave, farm, lab, meteor } from './state.js';
import { at, addGrain, colOf, surfaceY, settleSome, resizeGrid, count, countDust,
         isDust, bottomY } from './grid.js';
import { resize, clampCam, stepCamera, blocked, noRest, bankCeiling, overPitMouth,
         rockLeft, yardLeft, pileAt, refreshPiles } from './world.js';
import { placeRock, makeBoulder, overBoulder, knockOff, boulderAlive, depthOf, rockSize, stepRock, rockFootY } from './rock.js';
import { wirePit, setPitGrain, settlePit, bankDust, spend, pitCapacity } from './pit.js';
import { spawnChip } from './dust.js';
import { stepCore, dropCore } from './core.js';
import { sampleRates, mult, rates } from './lab.js';
import { stepMeteor } from './meteor.js';
import { makePainter } from './painter.js';
import { updateWorkers, syncWorkers } from './crew.js';
import { catchAir } from './hands.js';
import { seedAir, stepAir, AIR } from './air.js';
import { draw, stepPaid } from './render.js';
import { hud } from './board.js';
import { buildShop } from './shop.js';
import { persist, restore, reset } from './persist.js';
import { mineMs, capacity, mineRate, minerMs, haulCap, haulSpeed, canAfford, benchMark, rebalance, assign, idle } from './upgrades.js';
import './input.js';           // the mouse, the wheel and the keyboard

// The ground is the ground because of these: the grid module knows none of it.
// A new bed of sand somewhere else is another few lines like this, not another
// copy of the sand rules.
function wireGround() {
  if (!floor.painter) floor.painter = makePainter(floor);
  floor.onPut = floor.painter.mark;
  floor.blocked = blocked;
  floor.ceiling = bankCeiling;             // and lean away from the rock rather than against it
  floor.repose = true;                     // heaps on the ground stand up
  // Nothing topples over the lip on its own any more. Dust may not stand deep
  // enough beside the ledge to do it: a heap that could tip itself in banked the
  // whole yard for free and put the haulers out of work, which is the one thing
  // the ground must never do. `grid.js` still has the hooks; nothing uses them.
  //   floor.spillsInto = overPitMouth; floor.spillsAt = 4; floor.spill = ...
}

// Laying out the world moves things; this is what each site does about it. The
// order matters: the rock needs the ground line, the rest need the rock.
function settleIntoWorld() {
  placeRock();
  wireGround();
  wirePit();
  resizeGrid(floor);
  if (!pit.grid) setPitGrain(S.pitStep);   // the pit never changes with the window
  seedAir();
}

export function relayout() { resize(settleIntoWorld); }

function step() {
  // The bench arrives the moment there is something on it worth buying, and
  // stays from then on: a bench that came and went would be worse than one that
  // sat there empty.
  if (!S.seenBench && canAfford()) { S.seenBench = true; S.dirty = true; }
  stepCamera();
  stepAir();
  stepPaid();
  sampleRates(performance.now());
  stepMeteor(performance.now());
  const now = performance.now();
  const dt = Math.min(100, now - (S.lastFrame || now));   // a long tab-out is not a long frame
  S.lastFrame = now;
  // How much is lying about. Counting fifty thousand cells is not a thing to do
  // every frame, and the answer moves by a grain at a time, so it is counted
  // twice a second and the crew are told to stop or start on that.
  S.tick++;
  if (S.tick % 30 === 1) surveyFloor();
  stepRock();                                 // a new one on its way down
  updateWorkers(now, dt);
  stepCore();
  if (S.dragging) catchAir(S.mouse.x, S.mouse.y);   // swinging does not catch its own spray

  if (S.mining) {
    S.nextHit = Math.max(S.nextHit, now - 500);      // don't burst after a background tab
    while (now >= S.nextHit) {
      if (overBoulder(S.mouse.x, S.mouse.y)) knockOff(S.mouse.x, S.mouse.y);
      S.nextHit += mineMs();
    }
  }

  for (let i = S.chips.length - 1; i >= 0; i--) {
    const ch = S.chips[i];
    ch.vy += GRAV;
    ch.x += ch.vx;
    ch.y += ch.vy;

    if (ch.x < 0) { ch.x = 0; ch.vx = Math.abs(ch.vx) * 0.6; }
    if (ch.x > S.worldW - P) {
      ch.x = S.worldW - P;
      ch.vx = -Math.abs(ch.vx) * 0.3;
    }

    // down the shaft: the pit collects whatever falls through its mouth
    if (overPitMouth(ch.x) && ch.y + P > S.groundY) {
      const pc = Math.max(0, Math.min(pit.cols - 1, colOf(pit, ch.x)));
      if (ch.vx < 0 && ch.x < pit.x) { ch.x = pit.x; ch.vx = 0; }             // pit wall
      if (ch.vy > 0 && ch.y >= surfaceY(pit, pc)) {
        bankDust(ch.x, ch.s);
        S.chips.splice(i, 1);
        continue;
      }
      continue;
    }

    // Land on the floor dust -- but an aimed chip clears the bank it is thrown
    // over first. Stopping it on the near face is what built the bank towards
    // the rock instead of away from it: every chip came down on the slope facing
    // the rock and the heap grew back up to the foot.
    const c = Math.max(0, Math.min(floor.cols - 1, colOf(floor, ch.x)));
    const arrived = ch.land == null || ch.y >= S.groundY - P ||
                    (ch.vx > 0 ? ch.x >= ch.land : ch.x <= ch.land);
    if (ch.vy > 0 && arrived && ch.y >= surfaceY(floor, c)) {
      const rest = isDust(ch.s) ? blocked : noRest;      // a find is not held to the yard
      if (!addGrain(floor, ch.x, rest, ch.s, !isDust(ch.s))) bankDust(ch.x, ch.s);
      S.chips.splice(i, 1);
      S.dirty = true;
    }
  }

  settleSome(floor, SETTLE_BUDGET);
  settlePit();
}


function frame() { step(); draw(); hud(); requestAnimationFrame(frame); }

window.__clearFloor = () => { floor.grid.fill(0); floor.painter.repaint(); S.dirty = true; };
window.__pile = (x, n) => { for (let i = 0; i < n; i++) addGrain(floor, x, blocked); S.dirty = true; };
window.__jump = n => { S.boulderNo = n; S.coreItem = null; S.heldCore = false; makeBoulder(); S.dirty = true; };
window.__preview = n => {
  const keep = S.boulderNo;
  S.boulderNo = n;
  const size = rockSize(), d = depthOf();
  S.boulderNo = keep;
  // a hill w by h, roughly half of that box filled, at about half the full depth
  return { boulder: n, depth: d, cells: size,
           approxRock: Math.round(size.w * size.h * 0.5 * d * 0.55) };
};
window.__next = () => { S.boulder = S.boulder.map(row => row.map(() => 0)); S.chips = []; };
window.__drop = () => { dropCore(); S.dirty = true; };
window.__crew = (m = 0, h = 0, sp = 0, f = 0) => {   // hire straight off, for looking at things
  S.crew = m + h + sp + f;
  S.miners = m; S.spelunkers = sp; S.farmhands = f;
  rebalance();                                      // and the rest carry dust
  if (sp > 0) S.caveOpen = true;
  if (f > 0) S.farmOpen = true;
  if (S.crew) S.seenCore = true;
  syncWorkers(); buildShop(); S.dirty = true;
};
// dev: move one body between jobs, the same way the board does
window.__assign = (job, d = 1) => { assign(job, d); };
window.__levels = (o = {}) => {             // set upgrade levels, for weighing balance
  for (const k of ['pickLevel', 'speedLevel', 'carryLevel', 'minerSpeedLevel',
                   'minerPickLevel', 'haulCarryLevel', 'haulPaceLevel',
                   'cavePaceLevel', 'tendLevel']) {
    if (k in o) S[k] = o[k];
  }
  if (o.mult) for (const k of Object.keys(S.mult)) if (k in o.mult) S.mult[k] = o.mult[k];
  buildShop(); S.dirty = true;
};
// A spark is forty-two seconds apart in play, which is a fine rhythm and a
// terrible thing to sit through in a check: opening it sheds one at once.
window.__meteor = (open = true) => {
  S.meteorOpen = open;
  S.meteorAt = performance.now();
  buildShop();
  S.dirty = true;
};
// Put a body where you want it. Most of what a check waits for is a worker
// walking the length of the world, which proves nothing the walking tests do
// not already prove and costs half a minute a time.
window.__place = (type, x) => {
  const w = S.workers.find(o => o.type === type);
  if (w) { w.x = x; w.claim = -1; w.goal = 'seek'; }
  return !!w;
};
window.__lab = (open = true) => { S.labOpen = open; buildShop(); S.dirty = true; };
window.__grant = (o = {}) => {              // shards and spores, for looking at things
  if (o.shards) { S.shards += o.shards; S.seenShard = true; }
  if (o.spores) { S.spores += o.spores; S.seenSpore = true; }
  if (o.cores) { S.cores += o.cores; S.seenCore = true; }
  if (o.sparks) { S.sparks += o.sparks; S.seenSpark = true; }
  buildShop(); S.dirty = true;
};
window.__spend = n => { spend(Math.min(n, S.stored)); S.dirty = true; };
// what the pile actually looks like, sampled across the hole: dust arrives at
// the lip, so the shape of it is the shape of how it got there
window.__pitProfile = (n = 20) => {
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
window.__tip = (n, shade = 4) => { for (let i = 0; i < n; i++) bankDust(pit.x + Math.random() * 40, shade); };
window.__give = (n, shade = 4) => { for (let i = 0; i < n; i++) bankDust(pit.x + Math.random() * pit.w, shade); };

// how the banks sit against the rock: nothing in the apron, and the first column
// of dust outside it only a grain or two tall, so the heap ramps away
function apronReport() {
  let inApron = 0, tallest = 0, crest = 0;
  const near = rockLeft() - ROCK_CLEAR, far = rockLeft() + S.gw * P + ROCK_CLEAR;
  for (let c = 0; c < floor.cols; c++) {
    const x = floor.x + c * P;
    let h = 0;
    for (let r = floor.rows - 1; r >= 0; r--) if (at(floor, c, r)) { h = r + 1; break; }
    if (x + P > near && x < far) { inApron += h; continue; }
    const d = x < near ? (near - (x + P)) / P : (x - far) / P;
    if (d < 1) tallest = Math.max(tallest, h);
    if (d < 60) crest = Math.max(crest, h);          // the high point of the bank itself
  }
  return { inApron, tallest, crest };
}

// One walk of the ground, twice a second, for the two things worth knowing about
// it and not worth working out every frame: how much is lying there, and where
// anything that is not dust has come to rest. A mark is drawn only where it is
// the top of its column -- one under a foot of dust is buried, and looks it.
function surveyFloor() {
  const marks = [];
  const count = {};
  for (const p of S.piles) count[p.key] = 0;
  let grains = 0;
  for (let c = 0; c < floor.cols; c++) {
    const x = floor.x + c * P;
    const pile = pileAt(x);
    let top = -1, mark = null, n = 0;
    for (let r = 0; r < floor.rows; r++) {
      const v = at(floor, c, r);
      if (!v) continue;
      n++;
      top = r;
      if (!isDust(v)) mark = { v, r };
    }
    grains += n;
    if (pile) count[pile.key] += n;
    if (mark && mark.r === top) {
      marks.push({ v: mark.v, x: x + P / 2, y: bottomY(floor) - (top + 1) * P + P / 2 });
    }
  }
  S.floorGrains = grains;
  S.floorMarks = marks;
  S.pileCount = count;

  // A pile that is full stops the station behind it, and has to come down a
  // quarter before that station starts again -- otherwise a single grain being
  // carried away starts it, it puts one back, and it stutters on the line.
  const full = {};
  for (const p of S.piles) {
    const limit = PILE_LIMIT[p.key] || Infinity;
    full[p.key] = S.pileFull[p.key]
      ? count[p.key] > limit * PILE_CLEAR
      : count[p.key] >= limit;
  }
  S.pileFull = full;
}

// dust heaped anywhere it would bury something: over the mouth of the cave, or
// out past it towards the beds
function dustAtCave() {
  let n = 0;
  for (let c = 0; c < floor.cols; c++) {
    if (floor.x + c * P + P > yardLeft()) continue;
    for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  }
  return n;
}

// how much dust has ended up somewhere the player cannot get at it
function strandedDust() {
  let left = 0, under = 0;
  const l = rockLeft(), r = l + S.gw * P;
  for (let c = 0; c < floor.cols; c++) {
    const x = floor.x + c * P;
    if (x >= r) continue;
    let n = 0;
    for (let row = 0; row < floor.rows; row++) if (at(floor, c, row)) n++;
    if (x + P <= l) left += n; else under += n;
  }
  return { left, under };
}

window.__state = () => ({ paid: S.paid.length, dpr: S.dpr, W: S.W, H: S.H, cellDevicePx: +(P * S.zoom * S.dpr).toFixed(4), apronDust: apronReport().inApron, apronClear: apronReport().inApron === 0, heapAtRock: apronReport().tallest, bankCrest: apronReport().crest, dustLeftOfRock: strandedDust().left, dustUnderRock: strandedDust().under, rockX: Math.round(S.cx), rockLeftX: rockLeft(), rockY: Math.round(S.cy), benchX: Math.round(bench.x), benchY: Math.round(bench.y), rockW: S.gw * P, rockH: S.gh * P, rockFoot: rockFootY(), rockFall: Math.round(S.rockFall), dancing: performance.now() < S.danceUntil, zoom: +S.zoom.toFixed(3), viewW: Math.round(S.viewW), viewH: Math.round(S.viewH), air: AIR.length, camY: Math.round(S.camY), worldH: S.worldH, shown: Math.round(S.shownStored), pitX: pit.x, pitW: pit.w, pitRows: pit.rows, pitGrain: pit.p, pitStep: S.pitStep, groundY: S.groundY, camX: Math.round(S.camX), worldW: S.worldW, pitCapacity: pitCapacity(), stored: S.stored, held: S.held, cores: S.cores, shards: S.shards, seenShard: S.seenShard, caveOpen: S.caveOpen, labOpen: S.labOpen, labBoardOpen: S.labBoardOpen, mult: { ...S.mult }, rates: { stored: Math.round(rates.banked), banked: Math.round(rates.banked), shards: +rates.shards.toFixed(2), spores: +rates.spores.toFixed(2) }, labX: Math.round(lab.x), sparks: S.sparks, seenSpark: S.seenSpark, meteorOpen: S.meteorOpen, meteorX: Math.round(meteor.x), meteorY: Math.round(meteor.y), falling: S.falling.length, floorMarks: S.floorMarks.map(m => ({ [CORE_CELL]: 'core', [SHARD_CELL]: 'shard',
                                       [SPORE_CELL]: 'spore', [SPARK_CELL]: 'spark' })[m.v]), spelunkers: S.spelunkers, caveX: Math.round(cave.x), caveW: cave.w, spores: S.spores, seenSpore: S.seenSpore, farmOpen: S.farmOpen, farmhands: S.farmhands, farmX: Math.round(farm.x), farmW: farm.w, beds: S.beds.map(b => +b.toFixed(2)), underground: S.workers.filter(w => w.type === 'spelunker' && w.goal === 'in').length, boulderNo: S.boulderNo, depth: depthOf(), gw: S.gw, gh: S.gh, rock: S.boulder.flat().reduce((a, b) => a + b, 0), seenCore: S.seenCore, seenBench: S.seenBench, seenSects: [...S.seenSects], benchMark: benchMark(), pitGrains: count(pit), pitDust: countDust(pit), crew: S.crew, idle: idle(), heldCore: S.heldCore, coreItem: S.coreItem && { x: Math.round(S.coreItem.x), y: Math.round(S.coreItem.y), rest: S.coreItem.rest }, pickLevel: S.pickLevel, minerPickLevel: S.minerPickLevel, carryLevel: S.carryLevel, speedLevel: S.speedLevel, autoMine: S.autoMine, miners: S.miners, haulers: S.haulers, minerSpeedLevel: S.minerSpeedLevel, haulCarryLevel: S.haulCarryLevel, haulPaceLevel: S.haulPaceLevel, haulCap: haulCap(), claims: S.workers.filter(w => w.type === 'hauler').map(w => w.claim), pace: { laden: +haulSpeed().toFixed(2), empty: +(haulSpeed() * HAUL_EMPTY).toFixed(2) }, minerMs: minerMs(), workers: S.workers.length, workerPos: S.workers.map(w => `${w.type[0]}:${Math.round(w.x)},${Math.round(w.y)}`), mining: S.mining, dragging: S.dragging, mouse: S.mouse, capacity: capacity(), mineMs: mineMs(), pxPerSec: +mineRate().toFixed(2), floor: count(floor), yardFull: !!S.pileFull.rock, pileCount: { ...S.pileCount }, pileFull: { ...S.pileFull }, pileMarks: S.piles.filter(p => S.pileFull[p.key]).map(p => p.key), piles: S.piles.map(p => ({ key: p.key, from: Math.round(p.from), to: Math.round(p.to) })), floorGrains: S.floorGrains, dustAtCave: dustAtCave(), pit: count(pit), chips: S.chips.length, chipShades: S.chips.slice(0, 8).map(c => c.s) });

relayout();
restore();
buildShop();
syncWorkers();
S.camX = S.cx - 300;                       // start looking at the rock, its pile and the lip
clampCam();
// the window changing shape, and getting the game written down
addEventListener('resize', relayout);
addEventListener('load', relayout);
visualViewport?.addEventListener('resize', relayout);
setInterval(() => {
  const w = document.documentElement.clientWidth, h = document.documentElement.clientHeight;
  if (w !== S.W || h !== S.H) relayout();        // in case a resize event is missed
}, 500);
document.addEventListener('visibilitychange', persist);
addEventListener('pagehide', persist);
setInterval(persist, 1000);

requestAnimationFrame(frame);
