// The one landing chain (DESIGN.md, "One resource system for every act",
// section 3; game.js, `stepChips`): a chip in the air comes down on the
// surfaces its place supplies, in the place's order, and on nothing else. The
// yard's list is today's chain unreordered; act 3's is the saw's bed and then
// the ground; the deep's is the hopper and then the bed, in its water.
//
// Reached the way a player reaches it where a player is involved: the hand's
// own calls (hands.js `track`, `sweep`, `release`) at the world points where
// each thing stands. The setup it is not about: the act on and its opening
// played, the saw mill standing, goods granted on its piles.
import { group, ok, run, runUntil, yard, state, openSites, restartReloadClock } from './helpers.mjs';
import { P, AFTER_BLOCK, AFTER_MILL, DEEP_GRAV } from '../src/config.js';
import { S, floor, pit, afterGround, deepBed } from '../src/state.js';
import { spawnChip } from '../src/dust.js';
import { colOf, bottomY, topRow, at } from '../src/grid.js';
import { track, sweep, release } from '../src/hands.js';
import { plotOf } from '../src/after/piles.js';
import { millView } from '../src/after/mill.js';
import { units, counted, stripOf } from '../src/after/ground.js';
import { floorAt, afterX0, afterX1, stationX0, groundOf, AP } from '../src/after/place.js';
import { shed, dropScale, afloat, inWater } from '../src/deep/scales.js';
import { hopperRect, deepFloor } from '../src/deep/place.js';
import { rockEdge } from '../src/world.js';

const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const LOG = AFTER_BLOCK.log;

// --- the yard: exactly as before ---------------------------------------------
// The expectation is what the chain did before it was one list, recorded off
// the base (res-step2) with this same scenario.
group("a grain thrown in the yard lands as it did: the pit's mouth banks it, the floor keeps it", async () => {
  openSites();
  run(0.5);
  const stored = state().stored, n0 = floor.n;
  // over the hole's middle: banked, and nothing left in the air
  spawnChip(pit.x + pit.w / 2, S.groundY - 100, 0, 0, 4);
  run(1.5);
  const banked = state().stored - stored;
  // over open ground well clear of the rock: a grain of the floor, in the
  // column under it, at the shade it was thrown with
  const x = rockEdge(1) + P * 30;
  const col = colOf(floor, x), before = topRow(floor, col);
  spawnChip(x, S.groundY - 160, 0, 0, 5);
  run(2);
  const after = topRow(floor, col);
  const shade = at(floor, col, after);
  return [
    ok(banked >= 1 && S.chips.length === 0, 'a grain over the hole is banked, not laid on a pile', `${banked} banked, ${S.chips.length} in the air`),
    ok(floor.n === n0 + 1 && after === before + 1, 'and one over open ground is one more grain on the floor, in its own column', `${floor.n - n0} grains, top ${before} -> ${after}`),
    ok(shade === 5, 'at the shade it was thrown with', `${shade}`)
  ];
}, { reload: false });

// --- act 3: the bed, then the ground --------------------------------------------
function up() {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };
  if (!S.after.built.includes('mill')) S.after.built.push('mill');
  S.carryLevel = 3;
  run(1);
  S.held = 0; S.motes = []; S.trail = [];
}
const done = () => { S.held = 0; S.motes = []; S.carryLevel = 0; S.dragging = false; window.__actsOn(null); };
const letGo = p => { S.trail = []; track(p.x, p.y); release(p.x, p.y); };
const press = p => { S.dragging = true; S.trail = []; track(p.x, p.y); S.mouse = { ...p }; sweep(p.x, p.y); S.dragging = false; };
const aloft = () => runUntil(() => !S.chips.some(c => c.place === 'after'), 10);
// A log taken off the log pile's top by the hand, held.
function takeLog() {
  const b = plotOf('logs');
  press({ x: b.x + b.p / 2, y: bottomY(b) - b.p / 2 });
  return S.held;
}
// Open floor well clear of every pile and good, a long way up off it.
const stripNear = (c, d) => ['logs', 'grovelogs', 'timber', 'benchtimber', 'signs'].some(w => { const s = stripOf(w); return s && c > s.c0 - d && c < s.c1 + d; });
function openSpot() {
  for (let x = afterX0() + AP * 40; x < afterX1() - AP * 40; x += P * 4) {
    const c = Math.floor((x - afterGround.x) / AP);
    const clear = units().every(u => Math.abs(u.c0 - c) > 20) && !stripNear(c, 20) && Math.abs(floorAt(x) - floorAt(x + AP * 24)) < 1 && Math.abs(floorAt(x) - floorAt(x - AP * 24)) < 1;
    if (clear) return { x, y: floorAt(x) - AP * 16 };
  }
  return null;
}

group('a log thrown in act 3 lands on the saw bed, on a pile by the heap rule, or on open ground as a block', async () => {
  up();
  window.__afterGrant({ grovelogs: 8, logs: 4 });
  run(1);
  restartReloadClock();
  // 1. onto the bed: the seat is the saw mill's, so the log is the saw's
  const took = takeLog();
  const wx = ax => stationX0('mill') + ax * AP, wy = ay => groundOf('mill') + ay * AP;
  letGo({ x: wx(AFTER_MILL.seat.x + LOG / 2), y: wy(AFTER_MILL.frame.bed - LOG * 2) });
  const onBed = runUntil(() => !!millView().log, 5);
  // 2. onto the log pile: it joins the heap, the pile's count one more
  const logs0 = S.after.stock.logs;
  press({ x: plotOf('grovelogs').x + AP, y: bottomY(plotOf('grovelogs')) - AP });
  const held2 = S.held;
  const b = plotOf('logs');
  letGo({ x: b.x + b.cols * b.p / 2, y: b.y - b.p * 2 });
  aloft();
  const onPile = S.after.stock.logs - logs0;
  // 3. onto open ground: it lies there as a block, counted by no pile
  const spot = openSpot();
  press({ x: plotOf('grovelogs').x + AP, y: bottomY(plotOf('grovelogs')) - AP });
  const held3 = S.held;
  if (spot) letGo(spot);
  aloft();
  const lying = units().filter(u => u.kind === 'log' && !counted(u) && Math.abs(afterGround.x + (u.c0 + u.z / 2) * AP - spot.x) < AP * 12);
  done();
  return [
    ok(took === 1 && onBed, 'a log let go over the bed lands on the bed', `${took} held, on the bed ${onBed}`),
    ok(held2 >= 1 && onPile === held2, 'one let go over the log pile joins its heap', `${held2} let go, pile ${logs0} -> ${S.after.stock.logs}`),
    ok(!!spot && held3 >= 1 && lying.length === held3, 'and one let go over open ground lies there as a block of its own', `${held3} let go, ${lying.length} lying`),
    ok(S.chips.length === 0, 'with nothing left in the air', `${S.chips.length}`)
  ];
}, { reload: false });

// --- the deep: the water, the hopper, the bed -----------------------------------
function deepYard() {
  window.__snatch({ played: true });
  window.__scales(50);
  window.__deepCrew();
  S.portalOpen = true;
}

group('scales let go in the deep sink under drag and land on the bed or in the hopper, and are paid', async () => {
  deepYard();
  const bed0 = deepBed.n, purse = S.scales;
  const h = hopperRect();
  // over the bed, clear of the hopper: ten, from rest
  const lefts = [deepBed.x + P * 30, deepBed.x + deepBed.cols * P - P * 60];
  const x = lefts.find(v => v + P * 12 < h.x || v > h.x + h.w) ?? lefts[0];
  const y0 = deepFloor() - P * 60;
  for (let i = 0; i < 10; i++) dropScale(x + i * P, y0, 0, 0, 3);
  const inAir = inWater();
  run(1);
  const drop = S.chips.filter(c => c.place === 'deep').map(c => c.y - y0);
  const vacuum = 0.5 * DEEP_GRAV * 60 * 60;
  const flying = afloat();
  runUntil(() => afloat() === 0, 40);
  const onBed = deepBed.n - bed0;
  // over the hopper: crushed as it enters, and counted
  dropScale(h.x + h.w / 2, h.y - P * 4, 0, 0, 3);
  runUntil(() => afloat() === 0, 20);
  return [
    ok(inAir === 10 && S.chips.every(c => c.place !== 'deep'), 'they are chips of the one air while they fall, and none after', `${inAir} in the water`),
    ok(drop.length > 0 && drop.every(d => d > 0 && d < vacuum * 0.6), 'the water holds them back: a second of fall is well short of the same fall in air', `${drop.map(Math.round).slice(0, 3)} of ${Math.round(vacuum)}`),
    ok(flying > 0 && onBed === 10, 'ten let go over the floor lie on the bed', `${onBed} on the bed`),
    ok(S.scales === purse + 1, 'and one let go over the hopper is crushed and paid', `${S.scales - purse}`)
  ];
}, { reload: false });

group('nothing in the air is lost across a reload: the water keeps its scales, the yard its dust', async () => {
  deepYard();
  const bed0 = deepBed.n, purse = S.scales;
  shed(deepBed.x + deepBed.cols * P / 2, deepFloor() - P * 50, 12);
  spawnChip(rockEdge(1) + P * 30, S.groundY - 60, 0, 0, 4);
  run(0.2);
  const water = inWater(), dust = S.chips.filter(c => !c.place).length;
  window.__cold();
  const water2 = inWater(), dust2 = S.chips.filter(c => !c.place).length;
  runUntil(() => afloat() === 0, 40);
  const gone = (deepBed.n - bed0) + (S.scales - purse);
  return [
    ok(water > 0 && water2 === water, 'every scale in the water is back after the reload', `${water} -> ${water2}`),
    ok(dust2 === dust, 'and so is the yard\'s dust', `${dust} -> ${dust2}`),
    ok(gone === 12, 'and all twelve land, once', `${gone}`)
  ];
}, { reload: false });
