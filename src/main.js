// Boulder Clicker.
//
// This file is the wiring: it decides what order things happen in each frame and
// hands the browser its hooks. Everything else lives in its own module -- see
// state.js for what changes, config.js for every number, and world.js for where
// things stand.

import './style.css';
import './selftest.js';        // adds __test() to the console

import { P, GRAV, ROCK_SINK, SPILL_ROW, ROCK_CLEAR } from './config.js';
import { S, floor, pit, bench, cave, farm } from './state.js';
import { at, addGrain, colOf, surfaceY, settle, resizeGrid, count, countDust } from './grid.js';
import { resize, clampCam, stepCamera, blocked, overPitMouth, rockLeft } from './world.js';
import { placeRock, makeBoulder, overBoulder, knockOff, boulderAlive, depthOf, rockSize } from './rock.js';
import { wirePit, setPitGrain, settlePit, bankDust, spend, pitCapacity } from './pit.js';
import { spawnChip } from './dust.js';
import { stepCore, dropCore } from './core.js';
import { stepFinds } from './cave.js';
import { stepCrop } from './farm.js';
import { updateWorkers, syncWorkers } from './crew.js';
import { catchAir } from './hands.js';
import { seedAir, stepAir, AIR } from './air.js';
import { draw, stepPaid } from './render.js';
import { hud } from './board.js';
import { buildShop } from './shop.js';
import { persist, restore, reset } from './persist.js';
import { mineMs, capacity, mineRate, minerMs, haulCap } from './upgrades.js';
import './input.js';           // the mouse, the wheel and the keyboard

// The ground is the ground because of these: the grid module knows none of it.
// A new bed of sand somewhere else is another few lines like this, not another
// copy of the sand rules.
function wireGround() {
  floor.blocked = blocked;
  floor.repose = true;                     // heaps on the ground stand up
  floor.spillsInto = overPitMouth;         // and topple over the lip
  floor.spillsAt = SPILL_ROW;
  floor.spill = (x, y, v) => spawnChip(x, y, 0.6 + Math.random() * 0.6, 0, v);
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
  stepCamera();
  stepAir();
  stepPaid();
  stepFinds();
  stepCrop();
  const now = performance.now();
  const dt = Math.min(100, now - (S.lastFrame || now));   // a long tab-out is not a long frame
  S.lastFrame = now;
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

    // land on the floor dust
    const c = Math.max(0, Math.min(floor.cols - 1, colOf(floor, ch.x)));
    if (ch.vy > 0 && ch.y >= surfaceY(floor, c)) {
      if (!addGrain(floor, ch.x, blocked, ch.s)) bankDust(ch.x, ch.s);   // ground is full: it rolls in
      S.chips.splice(i, 1);
      S.dirty = true;
    }
  }

  settle(floor);
  settlePit();
}


function frame() { step(); draw(); hud(); requestAnimationFrame(frame); }

window.__clearFloor = () => { floor.grid.fill(0); S.dirty = true; };
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
  S.miners = m; S.haulers = h; S.spelunkers = sp; S.farmhands = f;
  S.minersUnlocked = m > 0; S.haulersUnlocked = h > 0;
  if (sp > 0) S.caveOpen = true;
  if (f > 0) S.farmOpen = true;
  if (m || h || sp || f) S.seenCore = true;
  syncWorkers(); buildShop(); S.dirty = true;
};
window.__spend = n => { spend(Math.min(n, S.stored)); S.dirty = true; };
window.__give = (n, shade = 4) => { for (let i = 0; i < n; i++) bankDust(pit.x + Math.random() * pit.w, shade); };

// how the banks sit against the rock: nothing in the apron, and the first column
// of dust outside it only a grain or two tall, so the heap ramps away
function apronReport() {
  let inApron = 0, tallest = 0;
  const near = rockLeft() - ROCK_CLEAR, far = rockLeft() + S.gw * P + ROCK_CLEAR;
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

window.__state = () => ({ paid: S.paid.length, dpr: S.dpr, W: S.W, H: S.H, cellDevicePx: +(P * S.zoom * S.dpr).toFixed(4), apronDust: apronReport().inApron, apronClear: apronReport().inApron === 0, heapAtRock: apronReport().tallest, dustLeftOfRock: strandedDust().left, dustUnderRock: strandedDust().under, rockX: Math.round(S.cx), rockY: Math.round(S.cy), benchX: Math.round(bench.x), benchY: Math.round(bench.y), rockW: S.gw * P, rockH: S.gh * P, rockFoot: S.groundY + ROCK_SINK, zoom: +S.zoom.toFixed(3), viewW: Math.round(S.viewW), viewH: Math.round(S.viewH), air: AIR.length, camY: Math.round(S.camY), worldH: S.worldH, shown: Math.round(S.shownStored), pitX: pit.x, pitW: pit.w, pitRows: pit.rows, pitGrain: pit.p, pitStep: S.pitStep, groundY: S.groundY, camX: Math.round(S.camX), worldW: S.worldW, pitCapacity: pitCapacity(), stored: S.stored, held: S.held, cores: S.cores, shards: S.shards, seenShard: S.seenShard, caveOpen: S.caveOpen, spelunkers: S.spelunkers, caveX: Math.round(cave.x), caveW: cave.w, spores: S.spores, seenSpore: S.seenSpore, farmOpen: S.farmOpen, farmhands: S.farmhands, farmX: Math.round(farm.x), farmW: farm.w, beds: S.beds.map(b => +b.toFixed(2)), underground: S.workers.filter(w => w.type === 'spelunker' && w.goal === 'in').length, boulderNo: S.boulderNo, depth: depthOf(), gw: S.gw, gh: S.gh, rock: S.boulder.flat().reduce((a, b) => a + b, 0), seenCore: S.seenCore, pitGrains: count(pit), pitDust: countDust(pit), haulersUnlocked: S.haulersUnlocked, minersUnlocked: S.minersUnlocked, heldCore: S.heldCore, coreItem: S.coreItem && { x: Math.round(S.coreItem.x), y: Math.round(S.coreItem.y), rest: S.coreItem.rest }, pickLevel: S.pickLevel, carryLevel: S.carryLevel, speedLevel: S.speedLevel, autoMine: S.autoMine, miners: S.miners, haulers: S.haulers, minerSpeedLevel: S.minerSpeedLevel, haulCarryLevel: S.haulCarryLevel, haulPaceLevel: S.haulPaceLevel, haulCap: haulCap(), minerMs: minerMs(), workers: S.workers.length, workerPos: S.workers.map(w => `${w.type[0]}:${Math.round(w.x)},${Math.round(w.y)}`), mining: S.mining, dragging: S.dragging, mouse: S.mouse, capacity: capacity(), mineMs: mineMs(), pxPerSec: +mineRate().toFixed(2), floor: count(floor), pit: count(pit), chips: S.chips.length, chipShades: S.chips.slice(0, 8).map(c => c.s) });

relayout();
restore();
buildShop();
syncWorkers();
S.camX = S.cx - 380;                       // start looking at the rock, the bench and the pit
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
