// Boulder Clicker.
//
// This file is the wiring: it decides what order things happen in each frame and
// hands the browser its hooks. Everything else lives in its own module -- see
// state.js for what changes, config.js for every number, and world.js for where
// things stand.

import './style.css';
import './selftest.js';        // adds __test() to the console

import { P, PIT_H, GRAV, ROCK_SINK, ROCK_CLEAR, SETTLE_BUDGET, HAUL_EMPTY,
         PILE_LIMIT, findKind, someFind, QUARRY_BENCH0, FARM_BEDS0,
         CORE_CELL, SHARD_CELL, SPORE_CELL } from './config.js';
import { S, floor, pit, bench, quarry, farm, lab, school, casino, table } from './state.js';
import { plantBeds } from './farm.js';
import { rosterReport } from './roster.js';
import { stepBreaks, breakReport } from './break.js';
import { at, put, addGrain, colOf, surfaceY, settleSome, resizeGrid, count, countDust,
         isDust, bottomY } from './grid.js';
import { resize, clampCam, stepCamera, blocked, bankCeiling, overPitMouth,
         rockLeft, yardLeft, pileAt, refreshPiles, bridgeSpan, groundAt,
         stepShake, resite, benches, bedCount } from './world.js';
import { placeRock, makeBoulder, overBoulder, knockOff, boulderAlive, depthOf, rockSize, stepRock, rockFootY, dropZone } from './rock.js';
import { wirePit, setPitGrain, settlePit, bankDust, spend, pitCapacity, pitDepth, pitFull, digPit, digsLeft } from './pit.js';
import { spawnChip, spawnSpoil } from './dust.js';
import { quarryFace, quarryCut, ladder } from './quarry.js';
import { stepCore, dropCore, coreHome } from './core.js';
import { sampleRates, mult, rates, stepLab, stepSmoke, workFor, progress } from './lab.js';
import { makePainter } from './painter.js';
import { updateWorkers, syncWorkers, pitFree } from './crew.js';
import { catchAir } from './hands.js';
import { seedAir, stepAir, AIR, airReport } from './air.js';
import { seedWeather, stepWeather, sendBirds, skyReport, BIRDS } from './weather.js';
import { draw, stepPaid } from './render.js';
import { houseReport, stepHouse } from './house.js';
import { stepCasino, stepTable, wireTable, pot, spinning, stakeOf, chipName, potAt } from './casino.js';
import { stepIntro, stepBuried, maybeReunion, introRunning, buriedVisible, skipIntro } from './intro.js';
import { hud, remeasure } from './board.js';
import { buildShop } from './shop.js';
import { persist, restore, reset } from './persist.js';
import { mineMs, capacity, mineRate, minerMs, haulCap, haulSpeed, canAfford, benchMark, rebalance, assign, idle } from './upgrades.js';
import './input.js';           // the mouse, the wheel and the keyboard
import { now as clockNow, tick, advance } from './clock.js';

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
  wireTable();                             // the ground the pot piles up on
  resizeGrid(floor);
  if (!pit.grid) setPitGrain(S.pitStep);   // the pit never changes with the window
  seedAir();
  seedWeather();       // and a sky that is already full of cloud
}

export function relayout() { resize(settleIntoWorld); remeasure(); }

function step() {
  // The bench arrives the moment there is something on it worth buying, and
  // stays from then on: a bench that came and went would be worse than one that
  // sat there empty.
  if (!S.seenBench && canAfford()) { S.seenBench = true; S.dirty = true; }
  // The beds are dug when the ground is broken, not when the first farmhand
  // walks up to them: a plot you have paid for that shows nothing but fence
  // posts reads as a purchase that did not happen. Asked every frame rather
  // than hooked onto the sale, so a save, the dev panel and the sale itself all
  // arrive at the same plot; it is two length checks and it does nothing once
  // the beds are there.
  if (S.farmOpen) plantBeds();
  stepCamera();
  stepShake();                                // and whatever the last landing left
  stepAir();
  stepPaid();
  sampleRates(clockNow());
  const now = clockNow();
  stepWeather(now);
  const dt = Math.min(100, now - (S.lastFrame || now));   // a long tab-out is not a long frame
  S.lastFrame = now;
  // How much is lying about. Counting fifty thousand cells is not a thing to do
  // every frame, and the answer moves by a grain at a time, so it is counted
  // twice a second and the crew are told to stop or start on that.
  S.tick++;
  // four times a second, not twice: this is what tells a station it has room
  // again, and waiting half a second to notice reads as the crew dawdling.
  if (S.tick % 15 === 1) surveyFloor();
  stepRock();                                 // a new one on its way down
  updateWorkers(now, dt);
  stepBreaks(now);                            // and what the stopped ones get up to
  stepLab(dt);                                // and whatever the lab is working on
  stepSmoke(now, dt);                         // which the chimney says out loud
  stepCasino(dt);                             // and the wheel, if there is anything on the table
  stepTable(dt);                              // and the pot, arriving or leaving, a grain at a time
  maybeReunion(now);                          // the one beat after the first rock
  stepIntro(now);                             // and, once and once only, the two of them
  stepBuried(now);                            // and whoever is under the rock, when they can be seen
  stepHouse(now);                             // and the crew's own hearth, now and then
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
    // `>=`, to match what the ground asks a line below. With `>` a chip that
    // came down exactly on the ground line over the mouth failed the pit's
    // test, passed the floor's, and was shoved back to the end of a pile.
    if (overPitMouth(ch.x) && ch.y + P >= S.groundY) {
      // A full hole hands it straight back: thrown at a brim there is no room
      // under, the grain comes back out over the lip and lands on the rock's own
      // pile. Nothing that was mined is destroyed by a pit with no room in it,
      // and nothing goes in uncounted.
      if (pitFull() && isDust(ch.s)) {
        spawnSpoil(ch.x, ch.y, ch.s, 'rock');
        S.chips.splice(i, 1);
        continue;
      }
      const pc = Math.max(0, Math.min(pit.cols - 1, colOf(pit, ch.x)));
      if (ch.vx < 0 && ch.x < pit.x) { ch.x = pit.x; ch.vx = 0; }             // pit wall
      // And the far one, which is a wall to anything already below the lip.
      //
      // A throw that *clears* the hole clears it and lands on the ground behind
      // -- that is a throw that went too far, and it never comes through here at
      // all, because it is never over the mouth at ground level. This is the
      // other case: a grain down inside the hole, still travelling, arriving at
      // the back of it. It used to be let through and deposited on the surface
      // beyond, which is a grain climbing out of a hole.
      if (ch.vx > 0 && ch.x + P > pit.x + pit.w) { ch.x = pit.x + pit.w - P; ch.vx = 0; }
      if (ch.vy > 0 && ch.y >= surfaceY(pit, pc)) {
        // The hole would not take it -- everything counts against the same
        // capacity now, finds included. It is not swallowed: it comes back out
        // on to the ground by the lip and lies there until a dig makes room.
        if (!bankDust(ch.x, ch.s)) spawnSpoil(pit.x - P * 4, S.groundY - P * 4, ch.s, 'rock');
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
      // One rule for everything that lands: a shard keeps to the piles exactly as
      // a grain of dust does, because as far as the ground is concerned it is one.
      if (!addGrain(floor, ch.x, blocked, ch.s)) bankDust(ch.x, ch.s);
      S.chips.splice(i, 1);
      S.dirty = true;
    }
  }

  settleSome(floor, SETTLE_BUDGET);
  settlePit();
}


function frame() { tick(); step(); draw(); hud(); requestAnimationFrame(frame); }

// clear the yard: the dust lying about and anything the sites have given up and
// nobody has carried in. Both are 'what is lying around out there'.
window.__clearFloor = () => {
  floor.grid.fill(0);
  floor.painter.repaint();
  S.dirty = true;
};
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
// a lot of birds now, rather than in a minute. It clears whatever was still up
// there first, so a check that asks for a flock gets that flock and not it plus
// the leavings of the last one.
window.__birds = (fresh = true) => { if (fresh) BIRDS.length = 0; sendBirds(); return BIRDS.length; };
window.__crew = (m = 0, h = 0, sp = 0, f = 0, lb = 0) => {   // hire straight off, for looking at things
  S.crew = m + h + sp + f + lb;
  S.miners = m; S.quarriers = sp; S.farmhands = f; S.labbers = lb;
  S.labLeft = 0;                  // the lab owes nobody after a wholesale reshuffle
  // The cut and the plot only hold so many, so a hook asked for four down the
  // quarry gets a quarry with four benches in it rather than two of the four
  // sent back to carrying dust.
  S.benchLevel = Math.max(S.benchLevel, sp - QUARRY_BENCH0);
  S.bedLevel = Math.max(S.bedLevel, f - FARM_BEDS0);
  resite();
  rebalance();                                      // and the rest carry dust
  if (sp > 0) S.quarryOpen = true;
  if (f > 0) S.farmOpen = true;
  if (S.crew) S.seenCore = true;
  syncWorkers(); buildShop(); S.dirty = true;
};
// dev: build the school and hand out trades without paying for them
window.__school = (o = {}) => {
  S.schoolOpen = o.open ?? true;
  for (const k of ['breakers', 'carters', 'blasters', 'growers'])
    if (o[k] != null) S[k] = o[k];
  rebalance(); syncWorkers(); buildShop(); S.dirty = true;
};
// dev: move one body between jobs, the same way the board does
window.__assign = (job, d = 1) => { assign(job, d); };
// dev: rebuild the boards, for a check that changed the game behind their back
window.__build = () => { buildShop(); };
// dev: put every bed back to bare earth. A bed nobody is working keeps its crop
// for ever, so a check that wants to watch one come ripe has to start from a
// farm that is not already standing full of somebody else's.
window.__beds = () => {
  S.beds = S.beds.map(() => 0);
  S.bedTone = S.bedTone.map(() => 0);
  S.dirty = true;
};
window.__levels = (o = {}) => {             // set upgrade levels, for weighing balance
  for (const k of ['pickLevel', 'speedLevel', 'carryLevel', 'minerSpeedLevel',
                   'minerPickLevel', 'haulCarryLevel', 'haulPaceLevel',
                   'quarryPaceLevel', 'tendLevel', 'benchLevel', 'bedLevel']) {
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
// Run the yard forward without waiting for it. Everything that asks the time
// asks the clock, so this is the same game running, just with the handle turned
// by hand: a check that wants to watch a worker walk two thousand pixels runs
// the steps instead of sitting through the seconds, and gets the same answer
// every time rather than one that depends on how fast the machine is.
window.__fast = (seconds = 1) => {
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) {
    advance(1000 / 60);
    step();
  }
  S.dirty = true;
  return frames;
};
// drop one of something where you like, for a check that wants to watch it land
window.__toss = (kind, x, y = S.groundY - 60) => {
  const v = { shard: SHARD_CELL, spore: SPORE_CELL }[kind];
  if (v) spawnChip(x, y, 0, 0, someFind(v));
};
// take a few grains off a pile, the way a sweep of the brush does
window.__take = (key, n) => {
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
window.__look = x => { S.camX = x; S.camTo = null; clampCam(); S.dirty = true; return Math.round(S.camX); };
window.__place = (type, x) => {
  const w = S.workers.find(o => o.type === type);
  if (w) { w.x = x; w.claim = -1; w.goal = 'seek'; }
  return !!w;
};
// dev: drop whatever the lab is working on. A group that starts research and
// walks away leaves every later lab row disabled, which reads as a broken test
// somewhere else entirely.
window.__abandon = () => { S.research = null; buildShop(); S.dirty = true; };
// back to a new game, for a check that wants a known state
// dev: back to a game nobody has played. The opening is skipped unless it is
// the thing being looked at: five seconds of two squares talking in front of
// every check in the suite is five seconds of nothing being checked.
window.__reset = (intro = false) => { reset(); if (!intro) skipIntro(); };
// dev: come back to the game the way a page refresh does -- write what is here,
// then read it back into an empty yard. Nothing else in the checks can tell the
// difference between a reload and this.
window.__reload = () => { S.dirty = true; persist(); restore(); buildShop(); S.dirty = true; };
window.__lab = (open = true) => { S.labOpen = open; buildShop(); S.dirty = true; };
window.__grant = (o = {}) => {              // shards and spores, for looking at things
  if (o.shards) { S.shards += o.shards; S.seenShard = true; }
  if (o.spores) { S.spores += o.spores; S.seenSpore = true; }
  if (o.cores) { S.cores += o.cores; S.seenCore = true; }
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
// dev: dig the hole out, so a check does not have to buy it a row at a time
window.__dig = (n = 99) => { for (let i = 0; i < n && digsLeft() > 0; i++) digPit(); };
window.__tip = (n, shade = 4) => { for (let i = 0; i < n; i++) bankDust(pit.x + Math.random() * 40, shade); };
// dev: hand over dust, and dig the room to hold it. The hole turns dust away
// when it is full, which is the game working -- but a check that wants two
// thousand dust to spend on something else should not have to buy a pit first.
window.__give = (n, shade = 4) => {
  for (let i = 0; i < n; i++) {
    if (pitFull()) digPit();
    if (!bankDust(pit.x + Math.random() * pit.w, shade)) break;
  }
};

// Dust that got past the hole. Everything thrown at the pit is thrown from the
// near lip, so anything lying on the ground beyond the far wall is a throw that
// sailed over a hole it should have landed in.
function dustPastPit() {
  let n = 0;
  for (let c = 0; c < floor.cols; c++) {
    if (floor.x + c * P < pit.x + pit.w) continue;
    for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  }
  return n;
}

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

// One walk of the ground, four times a second, for the things worth knowing about
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
    let n = 0;
    for (let r = 0; r < floor.rows; r++) {
      const v = at(floor, c, r);
      if (!v) continue;
      n++;
      // The painter has no colour for anything that is not dust, so it leaves
      // that cell clear and the mark is drawn over the top. Every one of them,
      // not just the top of a column: a cell left clear and never marked is a
      // hole in the pile, and a shard with another on top of it is still there.
      if (!isDust(v)) {
        marks.push({ v, x: x + P / 2, y: bottomY(floor) - (r + 1) * P + P / 2 });
      }
    }
    grains += n;
    if (pile) count[pile.key] += n;
  }
  S.floorMarks = marks;
  S.floorGrains = grains;
  S.pileCount = count;

  // A pile that is full stops the station behind it, and the moment there is
  // room for one more it starts again. No waiting for the pile to come down by
  // some fraction: clearing a handful should put somebody back to work, because
  // that is what clearing a handful looks like it ought to do.
  const full = {};
  for (const p of S.piles) full[p.key] = count[p.key] >= (PILE_LIMIT[p.key] || Infinity);
  S.pileFull = full;
}

// dust heaped anywhere it would bury something: over the mouth of the quarry, or
// out past it towards the beds
function dustAtQuarry() {
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

window.__state = () => ({ houses: houseReport(), paid: S.paid.length, dpr: S.dpr, W: S.W, H: S.H, cellDevicePx: +(P * S.zoom * S.dpr).toFixed(4), apronDust: apronReport().inApron, apronClear: apronReport().inApron === 0, heapAtRock: apronReport().tallest, bankCrest: apronReport().crest, dustLeftOfRock: strandedDust().left, dustUnderRock: strandedDust().under, rockX: Math.round(S.cx), rockLeftX: rockLeft(), rockY: Math.round(S.cy), benchX: Math.round(bench.x), benchY: Math.round(bench.y), benchW: bench.w, rockW: S.gw * P, rockH: S.gh * P, rockFoot: rockFootY(), rockFall: Math.round(S.rockFall), shake: +S.shake.toFixed(2), shakeOff: [Math.round(S.shakeX), Math.round(S.shakeY)], dropZone: (z => z && [Math.round(z.from), Math.round(z.to)])(dropZone()), dancing: clockNow() < S.danceUntil, zoom: +S.zoom.toFixed(3), viewW: Math.round(S.viewW), viewH: Math.round(S.viewH), air: AIR.length, airUnder: airReport().under, airFront: airReport().front, airKinds: airReport().kinds, airWant: airReport().want, sky: skyReport(), camY: Math.round(S.camY), worldH: S.worldH, shown: Math.round(S.shownStored), pitX: pit.x, pitW: pit.w, pitRows: pit.rows, pitHoleRows: pitDepth() / pit.p, pitDepth: pitDepth(), pitFullDepth: PIT_H, pitLevel: S.pitLevel, pitDigsLeft: digsLeft(), pitGrain: pit.p, pitStep: S.pitStep, groundY: S.groundY, camX: Math.round(S.camX), worldW: S.worldW, pitCapacity: pitCapacity(), pitFull: pitFull(), dustPastPit: dustPastPit(), stored: S.stored, held: S.held, cores: S.cores, shards: S.shards, seenShard: S.seenShard, quarryOpen: S.quarryOpen, labOpen: S.labOpen, intro: S.intro, introDone: S.introDone, reunionDone: S.reunionDone, pair: S.pair.length, buried: S.buried, buriedVisible: buriedVisible(), casinoOpen: S.casinoOpen, casinoBoardOpen: S.casinoBoardOpen, pot: S.pot && { cur: S.pot.cur, stake: S.pot.stake, on: pot() }, spinning: spinning(), sparks: S.sparks.length, hushed: document.getElementById('panel').classList.contains('hushed'), hand: S.hand && { won: S.hand.won, n: S.hand.n }, potAt: Math.round(potAt().x), table: table.n, paying: S.paying && S.paying.left, chip: chipName(), stakes: { dust: stakeOf('dust'), shard: stakeOf('shard'), spore: stakeOf('spore') }, skyShown: S.skyShown, labbers: S.labbers, smoke: S.smoke.filter(p => !p.house && !p.cig).length, cigSmoke: S.smoke.filter(p => p.cig).length, houseSmoke: S.smoke.filter(p => p.house).length, shutters: [...S.shutters].sort((a, b) => a - b), research: S.research && { ...S.research, need: workFor(S.research.key), at: +progress().toFixed(3) }, labDone: S.labDone, boardOpen: S.boardOpen, labBoardOpen: S.labBoardOpen, schoolBoardOpen: S.schoolBoardOpen, mult: { ...S.mult }, rates: { stored: Math.round(rates.banked), banked: Math.round(rates.banked), shards: +rates.shards.toFixed(2), spores: +rates.spores.toFixed(2) }, labX: Math.round(lab.x), casinoX: Math.round(casino.x), wheel: +S.wheel.toFixed(2), finds: S.floorMarks.map(m => ({ [CORE_CELL]: 'core', [SHARD_CELL]: 'shard',
                                    [SPORE_CELL]: 'spore' })[findKind(m.v) || m.v]),
  // reported by the cell they are in, not the middle of the mark drawn on it
  findAll: S.floorMarks.map(m =>
    `${Math.round(m.x - P / 2)},${Math.round(S.groundY - m.y - P / 2)}`),
  findCells: S.floorMarks.map(m => ({ v: m.v, x: Math.round(m.x - P / 2),
    kind: ({ [CORE_CELL]: 'core', [SHARD_CELL]: 'shard', [SPORE_CELL]: 'spore'
           })[findKind(m.v) || m.v] })),
  commuting: S.workers.filter(w => w.walking).map(w => `${w.type[0]}|${Math.round(w.x)}>${Math.round(w.walkTo)}`),
  haulPace: +haulSpeed().toFixed(2), quarriers: S.quarriers, quarryX: Math.round(quarry.x), quarryW: quarry.w, bridge: bridgeSpan(), deckWalk: [-70, -40, -10, 0, quarry.w / 2, quarry.w, quarry.w + 10, quarry.w + 40, quarry.w + 70].map(d => Math.round(groundAt(quarry.x + d))), quarryFaceX: Math.round(quarryFace()), ladder: (l => ({ x: Math.round(l.x), top: Math.round(l.top), foot: Math.round(l.foot) }))(ladder()), benches: benches(), benchLevel: S.benchLevel, quarryH: quarry.h, quarryCut: (c => ({ from: c.from, to: c.to, deep: c.deep, steps: c.floor.map(f => (c.deep - f.y) / P), rims: c.outline.filter(([, y]) => y === S.groundY).length, corners: c.outline.length }))(quarryCut()), spores: S.spores, seenSpore: S.seenSpore, farmOpen: S.farmOpen, farmhands: S.farmhands, farmX: Math.round(farm.x), farmW: farm.w, bedCount: bedCount(), bedLevel: S.bedLevel, beds: S.beds.map(b => +b.toFixed(2)), bedTone: [...S.bedTone], underground: S.workers.filter(w => w.type === 'quarrier' && w.goal === 'in').length, boulderNo: S.boulderNo, depth: depthOf(), gw: S.gw, gh: S.gh, rock: S.boulder.flat().reduce((a, b) => a + b, 0), seenCore: S.seenCore, seenBench: S.seenBench, seenSects: [...S.seenSects], benchMark: benchMark(), pitGrains: count(pit), pitDust: countDust(pit), crew: S.crew, idle: idle(), roster: rosterReport(), openCamX: Math.round(openingCamX()), heldCore: S.heldCore, coreHome: (h => ({ x: Math.round(h.x), y: Math.round(h.y) }))(coreHome()), coreItem: S.coreItem && { x: Math.round(S.coreItem.x), y: Math.round(S.coreItem.y), rest: S.coreItem.rest }, pickLevel: S.pickLevel, minerPickLevel: S.minerPickLevel, carryLevel: S.carryLevel, speedLevel: S.speedLevel, autoMine: S.autoMine, miners: S.miners, haulers: S.haulers, minerSpeedLevel: S.minerSpeedLevel, haulCarryLevel: S.haulCarryLevel, haulPaceLevel: S.haulPaceLevel, haulCap: haulCap(), claims: S.workers.filter(w => w.type === 'hauler').map(w => w.claim), pitFree: pitFree(), booked: S.workers.reduce((n, w) => n + (w.booked || 0), 0), carried: S.workers.reduce((n, w) => n + (w.carry || 0), 0), pace: { laden: +haulSpeed().toFixed(2), empty: +(haulSpeed() * HAUL_EMPTY).toFixed(2) }, minerMs: minerMs(), workers: S.workers.length, workerPos: S.workers.map(w => `${w.type[0]}:${Math.round(w.x)},${Math.round(w.y)}`), crewDetail: S.workers.map(w => `${w.type[0]}|${w.goal || '-'}|${Math.round(w.x)}|c${w.carry || 0}|k${w.claim ?? '-'}`), mining: S.mining, dragging: S.dragging, mouse: S.mouse, capacity: capacity(), mineMs: mineMs(), pxPerSec: +mineRate().toFixed(2), floor: count(floor), yardFull: !!S.pileFull.rock, pileCount: { ...S.pileCount }, pileFull: { ...S.pileFull }, pileLimit: { ...PILE_LIMIT }, schoolOpen: S.schoolOpen, schoolX: Math.round(school.x), breakers: S.breakers, carters: S.carters, blasters: S.blasters, growers: S.growers, trained: S.workers.filter(w => w.trained).map(w => w.type[0]).sort().join(''), pileMarks: S.piles.filter(p => S.pileFull[p.key]).map(p => p.key), piles: S.piles.map(p => ({ key: p.key, from: Math.round(p.from), to: Math.round(p.to) })), floorGrains: S.floorGrains, dustAtQuarry: dustAtQuarry(), pit: count(pit), chips: S.chips.length, chipShades: S.chips.slice(0, 8).map(c => c.s), breaks: breakReport(), resting: S.workers.filter(w => w.resting).length });

relayout();
restore();
buildShop();
syncWorkers();
// Where the view opens. The rock comes first -- it is the thing you are here to
// hit -- and the bench and the shacks beside it come too when the window is wide
// enough to hold them. On a phone that is not true, and a view opened on the
// bench would put the rock off the right-hand edge of a game about a rock.
//
// A function rather than a line, because it is only ever run once and a check
// that wants to know what a different window would have opened on cannot make
// the game boot again.
export const openingCamX = () => Math.max(bench.x - P * 10, S.cx - S.viewW * 0.4);
S.camX = openingCamX();
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

// The dev panel, and only when this is being run with `bun run dev`. The
// condition is a constant at build time, so a build drops the import and the
// file with it -- there is no way for any of it to reach a player.
if (import.meta.env.DEV) import('./dev.js');

requestAnimationFrame(frame);
