// What the yard looks like from outside it: one flat object with every number a
// check could want to read.
//
// It exists because a check should not have to know which module keeps which
// fact. `stored` is the pit's, `crew` is the roster's, `rockFoot` is worked out
// from three of them -- and a check that reached into each of those directly
// would break every time one of them moved house.
//
// It is read by both suites. The browser one asks for it through
// `window.__state()` and gets this plus the two things that are facts about the
// page rather than about the game; the node checks import `snapshot` and read it
// in the same process the game is running in.
//
// Nothing here changes anything. Every line is a reading.

import { P, PIT_H, PILE_LIMIT, HAUL_EMPTY, findKind, ROCK_CLEAR,
         CORE_CELL, SHARD_CELL, SPORE_CELL, SMOG_TOP, SMOG_BAND, WORKER } from './config.js';
import { S, floor, pit, bench, quarry, farm, lab, school, casino, scrub, table } from './state.js';
import { at, count, countDust } from './grid.js';
import { rockLeft, yardLeft, bridgeSpan, groundAt, benches, bedCount, openingCamX } from './world.js';
import { rockFootY, dropZone, depthOf } from './rock.js';
import { pitCapacity, pitDepth, pitFull, digsLeft } from './pit.js';
import { quarryFace, quarryCut, ladder } from './quarry.js';
import { coreHome } from './core.js';
import { mult, rates, workFor, progress } from './lab.js';
import { pitFree, lifted, commutePace } from './crew.js';
import { AIR, airReport } from './air.js';
import { skyReport } from './weather.js';
import { houseReport } from './house.js';
import { pot, spinning, stakeOf, chipName, potAt } from './casino.js';
import { buriedVisible } from './intro.js';
import { rosterReport } from './roster.js';
import { breakReport } from './break.js';
import { smogReport } from './smog.js';
import { now as clockNow } from './clock.js';
import { mineMs, capacity, mineRate, minerMs, haulCap, haulSpeed, benchMark, idle } from './upgrades.js';

// Dust that got past the hole. Everything thrown at the pit is thrown from the
// near lip, so anything lying on the ground beyond the far wall is a throw that
// sailed over a hole it should have landed in.
export function dustPastPit() {
  let n = 0;
  for (let c = 0; c < floor.cols; c++) {
    if (floor.x + c * P < pit.x + pit.w) continue;
    for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  }
  return n;
}

// how the banks sit against the rock: nothing in the apron, and the first column
// of dust outside it only a grain or two tall, so the heap ramps away
export function apronReport() {
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

// dust heaped anywhere it would bury something: over the mouth of the quarry, or
// out past it towards the beds
export function dustAtQuarry() {
  let n = 0;
  for (let c = 0; c < floor.cols; c++) {
    if (floor.x + c * P + P > yardLeft()) continue;
    for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  }
  return n;
}

// how much dust has ended up somewhere the player cannot get at it
export function strandedDust() {
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

// Every number the yard has to say about itself, in one object.
export const snapshot = () => ({ houses: houseReport(), paid: S.paid.length, dpr: S.dpr, W: S.W, H: S.H, cellDevicePx: +(P * S.zoom * S.dpr).toFixed(4), apronDust: apronReport().inApron, apronClear: apronReport().inApron === 0, heapAtRock: apronReport().tallest, bankCrest: apronReport().crest, dustLeftOfRock: strandedDust().left, dustUnderRock: strandedDust().under, rockX: Math.round(S.cx), rockLeftX: rockLeft(), rockY: Math.round(S.cy), benchX: Math.round(bench.x), benchY: Math.round(bench.y), benchW: bench.w, rockW: S.gw * P, rockH: S.gh * P, rockFoot: rockFootY(), rockFall: Math.round(S.rockFall), shake: +S.shake.toFixed(2), shakeOff: [Math.round(S.shakeX), Math.round(S.shakeY)], dropZone: (z => z && [Math.round(z.from), Math.round(z.to)])(dropZone()), dancing: clockNow() < S.danceUntil, zoom: +S.zoom.toFixed(3), viewW: Math.round(S.viewW), viewH: Math.round(S.viewH), air: AIR.length, airUnder: airReport().under, airFront: airReport().front, airKinds: airReport().kinds, airWant: airReport().want, sky: skyReport(), camY: Math.round(S.camY), worldH: S.worldH, shown: Math.round(S.shownStored), pitX: pit.x, pitW: pit.w, pitRows: pit.rows, pitHoleRows: pitDepth() / pit.p, pitDepth: pitDepth(), pitFullDepth: PIT_H, pitLevel: S.pitLevel, pitDigsLeft: digsLeft(), pitGrain: pit.p, pitStep: S.pitStep, groundY: S.groundY, camX: Math.round(S.camX), worldW: S.worldW, pitCapacity: pitCapacity(), pitFull: pitFull(), dustPastPit: dustPastPit(), stored: S.stored, held: S.held, cores: S.cores, shards: S.shards, seenShard: S.seenShard, quarryOpen: S.quarryOpen, labOpen: S.labOpen, intro: S.intro, introDone: S.introDone, reunionDone: S.reunionDone, pair: S.pair.length, buried: S.buried, buriedVisible: buriedVisible(), casinoOpen: S.casinoOpen, casinoBoardOpen: S.casinoBoardOpen, pot: S.pot && { cur: S.pot.cur, stake: S.pot.stake, on: pot() }, spinning: spinning(), sparks: S.sparks.length, hand: S.hand && { won: S.hand.won, n: S.hand.n }, potAt: Math.round(potAt().x), table: table.n, paying: S.paying && S.paying.left, chip: chipName(), stakes: { dust: stakeOf('dust'), shard: stakeOf('shard'), spore: stakeOf('spore') }, skyShown: S.skyShown, labbers: S.labbers, smoke: S.smoke.filter(p => !p.house && !p.cig).length, cigSmoke: S.smoke.filter(p => p.cig).length, houseSmoke: S.smoke.filter(p => p.house).length, shutters: [...S.shutters].sort((a, b) => a - b), research: S.research && { ...S.research, need: workFor(S.research.key), at: +progress().toFixed(3) }, labDone: S.labDone, boardOpen: S.boardOpen, labBoardOpen: S.labBoardOpen, schoolBoardOpen: S.schoolBoardOpen, houseBoardOpen: S.houseBoardOpen, scrubBoardOpen: S.scrubBoardOpen, quarryBoardOpen: S.quarryBoardOpen, farmBoardOpen: S.farmBoardOpen, smog: smogReport(), smogBand: (SMOG_TOP + SMOG_BAND) * P, scrubX: Math.round(scrub.x), pointed: S.workers.filter(w => w.pointed > clockNow()).map(w => w.name), follows: S.follow ? S.follow.name : null, followOff: S.follow ? Math.round(S.camX + S.viewW / 2 - (S.follow.x + WORKER / 2)) : null, mult: { ...S.mult }, rates: { stored: Math.round(rates.banked), banked: Math.round(rates.banked), shards: +rates.shards.toFixed(2), spores: +rates.spores.toFixed(2) }, labX: Math.round(lab.x), casinoX: Math.round(casino.x), wheel: +S.wheel.toFixed(2), finds: S.floorMarks.map(m => ({ [CORE_CELL]: 'core', [SHARD_CELL]: 'shard',
                                    [SPORE_CELL]: 'spore' })[findKind(m.v) || m.v]),
  // reported by the cell they are in, not the middle of the mark drawn on it
  findAll: S.floorMarks.map(m =>
    `${Math.round(m.x - P / 2)},${Math.round(S.groundY - m.y - P / 2)}`),
  findCells: S.floorMarks.map(m => ({ v: m.v, x: Math.round(m.x - P / 2),
    kind: ({ [CORE_CELL]: 'core', [SHARD_CELL]: 'shard', [SPORE_CELL]: 'spore'
           })[findKind(m.v) || m.v] })),
  commuting: S.workers.filter(w => w.walking).map(w => `${w.type[0]}|${Math.round(w.x)}>${Math.round(w.walkTo)}`),
  haulPace: +haulSpeed().toFixed(2), quarriers: S.quarriers, quarryX: Math.round(quarry.x), quarryW: quarry.w, bridge: bridgeSpan(), deckWalk: [-70, -40, -10, 0, quarry.w / 2, quarry.w, quarry.w + 10, quarry.w + 40, quarry.w + 70].map(d => Math.round(groundAt(quarry.x + d))), quarryFaceX: Math.round(quarryFace()), ladder: (l => ({ x: Math.round(l.x), top: Math.round(l.top), foot: Math.round(l.foot) }))(ladder()), benches: benches(), benchLevel: S.benchLevel, quarryH: quarry.h, quarryCut: (c => ({ from: c.from, to: c.to, deep: c.deep, steps: c.floor.map(f => (c.deep - f.y) / P), rims: c.outline.filter(([, y]) => y === S.groundY).length, corners: c.outline.length }))(quarryCut()), spores: S.spores, seenSpore: S.seenSpore, farmOpen: S.farmOpen, farmhands: S.farmhands, farmX: Math.round(farm.x), farmW: farm.w, bedCount: bedCount(), bedLevel: S.bedLevel, beds: S.beds.map(b => +b.toFixed(2)), bedTone: [...S.bedTone], underground: S.workers.filter(w => w.type === 'quarrier' && w.goal === 'in').length, boulderNo: S.boulderNo, depth: depthOf(), gw: S.gw, gh: S.gh, rock: S.boulder.flat().reduce((a, b) => a + b, 0), seenCore: S.seenCore, seenBench: S.seenBench, seenSects: [...S.seenSects], benchMark: benchMark(), pitGrains: count(pit), pitDust: countDust(pit), crew: S.crew, idle: idle(), roster: rosterReport(), openCamX: Math.round(openingCamX()), heldCore: S.heldCore, coreHome: (h => ({ x: Math.round(h.x), y: Math.round(h.y) }))(coreHome()), coreItem: S.coreItem && { x: Math.round(S.coreItem.x), y: Math.round(S.coreItem.y), rest: S.coreItem.rest }, pickLevel: S.pickLevel, minerPickLevel: S.minerPickLevel, carryLevel: S.carryLevel, speedLevel: S.speedLevel, autoMine: S.autoMine, miners: S.miners, haulers: S.haulers, minerSpeedLevel: S.minerSpeedLevel, haulCarryLevel: S.haulCarryLevel, haulPaceLevel: S.haulPaceLevel, haulCap: haulCap(), claims: S.workers.filter(w => w.type === 'hauler').map(w => w.claim), pitFree: pitFree(), booked: S.workers.reduce((n, w) => n + (w.booked || 0), 0), carried: S.workers.reduce((n, w) => n + (w.carry || 0), 0), pace: { laden: +haulSpeed().toFixed(2), empty: +(haulSpeed() * HAUL_EMPTY).toFixed(2), commute: +commutePace().toFixed(2) }, minerMs: minerMs(), workers: S.workers.length, workerPos: S.workers.map(w => `${w.type[0]}:${Math.round(w.x)},${Math.round(w.y)}`), crewNames: S.workers.map(w => `${w.name}|${w.type[0]}|${Math.round((w.lived||0)/1000)}s|m${w.mined||0}|q${w.quarried||0}|g${w.farmed||0}|s${w.stored||0}`).join(' '), crewDetail: S.workers.map(w => `${w.type[0]}|${w.goal || '-'}|${Math.round(w.x)}|c${w.carry || 0}|k${w.claim ?? '-'}|p${w.inPit || '-'}`), mining: S.mining, paused: S.paused, saying: S.workers.filter(w => w.say).length, moves: [...new Set(S.workers.map(w => w.move).filter(Boolean))].sort(), falling: S.workers.filter(w => w.falling).length, lifted: (w => w && w.name)(lifted()) || null, dragging: S.dragging, mouse: S.mouse, capacity: capacity(), mineMs: mineMs(), pxPerSec: +mineRate().toFixed(2), floor: count(floor), yardFull: !!S.pileFull.rock, pileCount: { ...S.pileCount }, pileFull: { ...S.pileFull }, pileLimit: { ...PILE_LIMIT }, schoolOpen: S.schoolOpen, schoolX: Math.round(school.x), breakers: S.breakers, carters: S.carters, blasters: S.blasters, growers: S.growers, trained: S.workers.filter(w => w.trained).map(w => w.type[0]).sort().join(''), pileMarks: S.piles.filter(p => S.pileFull[p.key]).map(p => p.key), piles: S.piles.map(p => ({ key: p.key, from: Math.round(p.from), to: Math.round(p.to) })), floorGrains: S.floorGrains, dustAtQuarry: dustAtQuarry(), pit: count(pit), chips: S.chips.length, chipShades: S.chips.slice(0, 8).map(c => c.s), chipX: S.chips.slice(0, 8).map(c => Math.round(c.x)), breaks: breakReport(), resting: S.workers.filter(w => w.resting).length });
