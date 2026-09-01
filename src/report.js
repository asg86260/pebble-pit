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

import { P, PIT_H, PILE_LIMIT, HAUL_EMPTY, findKind,
         CORE_CELL, SHARD_CELL, SPORE_CELL, SMOG_TOP, SMOG_BAND, WORKER } from './config.js';
import { S, floor, pit, cut, bench, quarry, farm, lab, school, casino, scrub, table , tower, outhouse, sky } from './state.js';
import { MACHINES, machine } from './machines.js';
import { wizMs, wizBite } from './wizard.js';
import { BOLTS, SPARKLE } from './meteor.js';

// how much of the meteor is still up there, rind or core
const skyLeft = kind => {
  if (!sky.cells) return 0;
  let n = 0;
  for (const v of sky.cells) if (v === kind) n++;
  return n;
};
import { at, count, countDust } from './grid.js';
import { wayAt } from './route.js';
import { rockLeft, bridgeSpan, groundAt, benches, plotCount, openingCamX } from './world.js';
import { rockFootY, dropZone, depthOf } from './rock.js';
import { pitCapacity, pitDepth, pitFull } from './pit.js';
import { quarryFace, quarryShape, ladder, seamShards, dugShare, quarryDone } from './quarry.js';
import { coreHome } from './core.js';
import { mult, rates, workFor, progress, labRooms, labPace } from './lab.js';
import { pitFree, lifted, commutePace } from './crew.js';
import { AIR, airReport } from './air.js';
import { skyReport } from './weather.js';
import { houseReport } from './house.js';
import { pot, spinning, pouring, stakeOf, chipName, potAt, tableWant } from './casino.js';
import { buriedVisible } from './intro.js';
import { rosterReport } from './roster.js';
import { breakReport } from './break.js';
import { smogReport } from './smog.js';
import { now as clockNow } from './clock.js';
import { seed } from './rng.js';
import { windAt } from './wind.js';
import { mineMs, capacity, mineRate, minerMs, haulCap, haulSpeed, benchMark, idle, capOf, handsOf, machineRate, kitFull, hats } from './upgrades.js';
import { hasOffer, STATIONS, standRect } from './board.js';

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

// How the banks sit against the rock: nothing under the boulder itself, and the
// first column of dust outside it only a grain or two tall, so the ground ramps
// away from the foot of the hill instead of standing up against it.
//
// It used to measure from the apron, because the apron was barred ground. The
// clearance holds dust now and the footprint is the only thing that does not,
// so `inApron` is what is standing inside the rock -- which is nought, always.
export function apronReport() {
  let inApron = 0, tallest = 0, crest = 0;
  const near = rockLeft(), far = rockLeft() + S.gw * P;
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

// Dust lying across the mouth of the cut, which is a number that should always
// be nought: a grain over an opening is a grain lying on nothing.
//
// It used to count everything off the left-hand end of the yard instead, back
// when that ground was barred and anything out there was dust that had gone
// somewhere nobody could reach. That ground is ordinary ground now, so counting
// it says nothing -- and the mouth it was named for was never being looked at.
export function dustAtQuarry() {
  if (!S.quarryOpen) return 0;
  let n = 0;
  for (let c = 0; c < floor.cols; c++) {
    const x = floor.x + c * P;
    if (!(x + P > quarry.x && x < quarry.x + quarry.w)) continue;
    for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  }
  return n;
}

// How the ground either side of the hill reads: what is lying behind it, and
// what is standing under it. The second is the invariant -- nothing may ever be
// under the rock -- and the first is a measure of how much of the yard's dust
// has ended up on the far side of the boulder from the crew.
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

// One machine's account of itself: whether it has been bought, whether it is
// running, and the hands, kit and rate behind it. `machine()` returns nothing
// for a machine that is not in the yard yet, so the whole thing is nothing.
//
// It reads as a field of the snapshot below, and it was one -- a five-hundred
// character line of nested arrows. It is only up here to be readable.
const machineReport = m => (r => r && ({
  bought: !!r.bought, driven: !!r.driven,
  working: !!r.working, workedAt: r.workedAt | 0,
  job: m.job, kitFull: kitFull(m.job), kit: hats(m.job),
  // Whether it is running is not a field: it is `manned`, which is whether the
  // station has anybody at it, which is the whole of the rule now.
  manned: (S[m.job] | 0) > 0,
  hands: handsOf(m.job), rate: +machineRate(m.job).toFixed(2),
  cap: (c => c === Infinity ? null : c)(capOf(m.job))
}))(machine(m.key));

// Every number the yard has to say about itself, in one object.
export const snapshot = () => ({
  // Which run this is. Every wobble in the yard was worked out from this number
  // (see rng.js), so a check that fails and prints its snapshot has named the
  // run that failed rather than describing a yard nobody can build again.
  seed: seed(),
  // And the seed the *run* was started from, which is the same number in a
  // seeded check and is the one a player's yard can be named by: it is written
  // down with the save and comes back with it. See `runSeed` in state.js.
  runSeed: S.runSeed,

  // The settlement: the blocks put up, and every row that has been paid for.
  houses: houseReport(),
  paid: S.paid.length,

  // The screen, and whether a cell lands on a whole device pixel on it.
  dpr: S.dpr,
  W: S.W,
  H: S.H,
  cellDevicePx: +(P * S.zoom * S.dpr).toFixed(4),

  // The dust banked around the rock: what is in the apron, how high the bank
  // stands, and what has ended up somewhere nobody can shovel it.
  apronDust: apronReport().inApron,
  apronClear: apronReport().inApron === 0,
  heapAtRock: apronReport().tallest,
  bankCrest: apronReport().crest,
  dustLeftOfRock: strandedDust().left,
  dustUnderRock: strandedDust().under,

  // The boulder, the bench beside it, and the shake when it is struck.
  rockX: Math.round(S.cx),
  rockLeftX: rockLeft(),
  rockY: Math.round(S.cy),
  benchX: Math.round(bench.x),
  benchY: Math.round(bench.y),
  benchW: bench.w,
  rockW: S.gw * P,
  rockH: S.gh * P,
  rockFoot: rockFootY(),
  rockFall: Math.round(S.rockFall),
  shake: +S.shake.toFixed(2),
  shakeOff: [Math.round(S.shakeX), Math.round(S.shakeY)],
  dropZone: (z => z && [Math.round(z.from), Math.round(z.to)])(dropZone()),
  dancing: clockNow() < S.danceUntil,
  // How many bodies are actually in the dance -- holding a mark. `dancing` is
  // the yard's mood; this is who has joined in, and a fall where it stays at
  // nought is a crew grinding at the zone's wall instead of celebrating.
  jigging: S.workers.filter(w => w.jigAt != null).length,

  // The view: how far in, and how much of the world it covers.
  zoom: +S.zoom.toFixed(3),
  viewW: Math.round(S.viewW),
  viewH: Math.round(S.viewH),

  // The air: the motes, the draught the cursor leaves in them, and the one wind
  // the whole yard leans on.
  air: AIR.length,
  // how many motes are still carrying a draught the cursor left in them, and how
  // far the strongest of them is being carried
  airStirred: AIR.filter(m => m.sx || m.sy).length,
  airStirTop: +Math.max(0, ...AIR.map(m => Math.hypot(m.sx || 0, m.sy || 0))).toFixed(2),
  airPos: AIR.slice(0, 60).map(m => `${Math.round(m.x)},${Math.round(m.y)}`),
  // Which way the yard is leaning this instant, and where the motes are to a
  // tenth of a pixel. There is one wind over the yard -- see `wind.js` -- and a check on
  // that has to be able to see a far-band mote move: at a third of the near
  // band's pace that is a tenth of a pixel in a frame, and rounded to whole
  // pixels, as `airPos` is, most of the field reads as standing perfectly still.
  wind: +windAt(clockNow()).toFixed(3),
  airX: AIR.slice(0, 80).map(m => +m.x.toFixed(2)),
  airUnder: airReport().under,
  airFront: airReport().front,
  airKinds: airReport().kinds,
  airWant: airReport().want,
  sky: skyReport(),

  // Where the view sits in a world of this size, and how much of it is on screen.
  camY: Math.round(S.camY),
  worldH: S.worldH,
  shown: Math.round(S.shownStored),

  // The pit: its shape, how deep the dust in it stands, and what it holds.
  pitX: pit.x,
  pitW: pit.w,
  pitRows: pit.rows,
  pitHoleRows: pitDepth() / pit.p,
  pitDepth: pitDepth(),
  pitFullDepth: PIT_H,
  pitGrain: pit.p,
  groundY: S.groundY,
  camX: Math.round(S.camX),
  worldW: S.worldW,
  pitCapacity: pitCapacity(),
  pitFull: pitFull(),
  dustPastPit: dustPastPit(),
  stored: S.stored,
  held: S.held,

  // Cores and shards, banked and loose.
  cores: S.cores,
  shards: S.shards,
  seenShard: S.seenShard,

  // What has been opened, and how far through the opening story the yard is.
  quarryOpen: S.quarryOpen,
  labOpen: S.labOpen,
  intro: S.intro,
  introDone: S.introDone,
  reunionDone: S.reunionDone,
  pair: S.pair.length,
  buried: S.buried,
  buriedVisible: buriedVisible(),

  // The casino: the stake, the spin, and the pot.
  casinoOpen: S.casinoOpen,
  casinoBoardOpen: S.casinoBoardOpen,
  pot: S.pot && { cur: S.pot.cur, stake: S.pot.stake, on: pot() },
  spinning: spinning(),
  // the beat before the spin: the stake is still coming down out of the sky
  pouring: pouring(),
  tableAir: S.tableAir.length,
  hand: S.hand && { won: S.hand.won, n: S.hand.n },
  potAt: Math.round(potAt().x),
  table: table.n,
  // how many grains that pot is meant to put on the ground, which past the first
  // band is fewer than the pot itself -- see `shownFor` in casino.js
  tableWant: tableWant(),
  paying: S.paying && S.paying.left,
  chip: chipName(),
  stakes: { dust: stakeOf('dust'), shard: stakeOf('shard'), spore: stakeOf('spore') },

  // The lab, and every kind of smoke over the yard.
  skyShown: S.skyShown,
  labbers: S.labbers,
  smoke: S.smoke.filter(p => !p.house && !p.cig && !p.mach).length,
  machSmoke: S.smoke.filter(p => p.mach).length,
  cigSmoke: S.smoke.filter(p => p.cig).length,
  houseSmoke: S.smoke.filter(p => p.house).length,
  shutters: [...S.shutters].sort((a, b) => a - b),
  research: S.research && { ...S.research, need: workFor(S.research.key), at: +progress().toFixed(3) },
  research2: S.research2 && { ...S.research2, need: workFor(S.research2.key) },
  labRooms: labRooms(),
  labKitLevel: S.labKitLevel || 0,
  labPace: +labPace().toFixed(3),
  labDone: S.labDone,

  // The boards: which one is up, what each has to offer, and where you stand to
  // open it.
  boardOpen: S.boardOpen,
  labBoardOpen: S.labBoardOpen,
  schoolBoardOpen: S.schoolBoardOpen,
  houseBoardOpen: S.houseBoardOpen,
  crewListOpen: S.crewListOpen,
  scrubBoardOpen: S.scrubBoardOpen,
  quarryBoardOpen: S.quarryBoardOpen,
  farmBoardOpen: S.farmBoardOpen,
  towerBoardOpen: S.towerBoardOpen,
  towerOpen: S.towerOpen,
  towerX: Math.round(tower.x),
  outhouseOpen: S.outhouseOpen,
  outhouseX: Math.round(outhouse.x),
  offers: STATIONS.filter(k => hasOffer(k)),
  stands: Object.fromEntries(STATIONS.map(k => [k, (r => r && { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) })(standRect(k))]).filter(([, v]) => v)),
  inLoo: S.workers.filter(w => w.inLoo).length,

  // The meteor: what is still up there, and what it throws off on the way down.
  meteorOpen: S.meteorOpen,
  meteor: sky.n,
  bolts: BOLTS.length,
  summon: +(S.summon || 0).toFixed(3),
  trail: SPARKLE.length,
  meteorCore: skyLeft(2),
  meteorRind: skyLeft(1),
  meteorX: Math.round(sky.x),
  meteorY: Math.round(sky.y),
  sparks: S.sparks,
  seenSpark: S.seenSpark,

  // The wizards: how many, how fast, and what they are brewing.
  wizardHats: S.wizardHats,
  wizards: S.wizards,
  spells: [...(S.spells || [])],
  wizSpeed: S.wizSpeedLevel || 0,
  wizPower: S.wizPowerLevel || 0,
  wizMs: Math.round(wizMs()),
  wizBite: wizBite(),
  janitors: S.janitors,
  brewing: S.brewAt > 0,
  aloft: S.workers.filter(w => w.aloft).length,
  wizardY: S.workers.filter(w => w.type === 'wizard').map(w => Math.round(w.y)),

  // The smog, and the house that scrubs it.
  smog: smogReport(),
  smogBand: (SMOG_TOP + SMOG_BAND) * P,
  scrubX: Math.round(scrub.x),

  // The cursor: what it is over, and what is following it.
  pointed: S.workers.filter(w => w.pointed > clockNow()).map(w => w.name),
  follows: S.follow ? S.follow.name : null,
  followOff: S.follow ? Math.round(S.camX + S.viewW / 2 - (S.follow.x + WORKER / 2)) : null,

  // What research has bought, and where the buildings stand.
  mult: { ...S.mult },
  rates: { stored: Math.round(rates.banked), banked: Math.round(rates.banked), shards: +rates.shards.toFixed(2), spores: +rates.spores.toFixed(2) },
  labX: Math.round(lab.x),
  casinoX: Math.round(casino.x),
  wheel: +S.wheel.toFixed(2),

  // What is lying on the floor waiting to be found.
  finds: S.floorMarks.map(m => ({ [CORE_CELL]: 'core', [SHARD_CELL]: 'shard',
    [SPORE_CELL]: 'spore' })[findKind(m.v) || m.v]),
  // reported by the cell they are in, not the middle of the mark drawn on it
  findAll: S.floorMarks.map(m =>
    `${Math.round(m.x - P / 2)},${Math.round(S.groundY - m.y - P / 2)}`),
  findCells: S.floorMarks.map(m => ({ v: m.v, x: Math.round(m.x - P / 2),
    kind: ({ [CORE_CELL]: 'core', [SHARD_CELL]: 'shard', [SPORE_CELL]: 'spore'
    })[findKind(m.v) || m.v] })),

  // Who is walking somewhere, and how fast a hauler goes.
  commuting: S.workers.filter(w => w.walking).map(w => `${w.type[0]}|${Math.round(w.x)}>${Math.round(w.walkTo)}`),
  haulPace: +haulSpeed().toFixed(2),

  // The quarry: who is in it, how far down it is dug, and what it owes.
  quarriers: S.quarriers,
  quarryX: Math.round(quarry.x),
  quarryW: quarry.w,
  bridge: bridgeSpan(),
  deckWalk: [-70, -40, -10, 0, quarry.w / 2, quarry.w, quarry.w + 10, quarry.w + 40, quarry.w + 70].map(d => Math.round(groundAt(quarry.x + d))),
  quarryFaceX: Math.round(quarryFace()),
  ladder: (l => ({ x: Math.round(l.x), top: Math.round(l.top), foot: Math.round(l.foot) }))(ladder()),
  benches: benches(),
  benchLevel: S.benchLevel,
  quarryDug: +dugShare().toFixed(3),
  quarryTotal: S.quarryTotal || 0,
  quarryDone: quarryDone(),
  seam: seamShards(),
  quarryOwed: S.quarryOwed || 0,

  // Every machine, by key.
  machines: Object.fromEntries(MACHINES.map(m => [m.key, machineReport(m)])),

  // The quarry's shape, cut by cut.
  quarryH: quarry.h,
  quarryShape: (c => ({ from: c.from, to: c.to, deep: c.deep, steps: c.floor.map(f => (c.deep - f.y) / P), rims: c.outline.filter(([, y]) => y === S.groundY).length, corners: c.outline.length }))(quarryShape()),

  // The farm and the plots.
  spores: S.spores,
  seenSpore: S.seenSpore,
  farmOpen: S.farmOpen,
  farmhands: S.farmhands,
  farmX: Math.round(farm.x),
  farmW: farm.w,
  plotCount: plotCount(),
  plotLevel: S.plotLevel,
  plots: S.plots.map(b => +b.toFixed(2)),
  plotTone: [...S.plotTone],

  // The rock being worked: which one, how deep, and how much is left.
  underground: S.workers.filter(w => w.type === 'quarrier' && w.y > S.groundY).length,
  boulderNo: S.boulderNo,
  depth: depthOf(),
  gw: S.gw,
  gh: S.gh,
  rock: S.boulder.flat().reduce((a, b) => a + b, 0),

  // What the player has been shown at least once.
  seenCore: S.seenCore,
  seenBench: S.seenBench,
  seenSects: [...S.seenSects],
  benchMark: benchMark(),

  // The dust in the pit, grain by grain.
  pitGrains: count(pit),
  pitDust: countDust(pit),
  // And the dust that is not in the pit, because it is not in this dimension.
  // `stored` is the two of them together -- see `inHole` in pit.js.
  rift: S.rift || 0,
  riftOpen: !!S.riftOpen,
  riftLevel: S.riftLevel || 0,

  // And the dust lying in the cut, fallen down the mouth and not yet fetched.
  cutDust: countDust(cut),

  // And what has come down on top of the rock and not yet been thrown off it.
  rockDust: (S.rockSand || []).reduce((n, a) => n + (a ? a.length : 0), 0),

  // The crew, counted, and the roster board that moves them about.
  crew: S.crew,
  idle: idle(),
  roster: rosterReport(),
  openCamX: Math.round(openingCamX()),

  // The core: carried, loose, or home.
  heldCore: S.heldCore,
  coreHome: (h => ({ x: Math.round(h.x), y: Math.round(h.y) }))(coreHome()),
  coreItem: S.coreItem && { x: Math.round(S.coreItem.x), y: Math.round(S.coreItem.y), rest: S.coreItem.rest },

  // The upgrades, by rung.
  pickLevel: S.pickLevel,
  minerPickLevel: S.minerPickLevel,
  carryLevel: S.carryLevel,
  speedLevel: S.speedLevel,
  autoMine: S.autoMine,
  miners: S.miners,
  haulers: S.haulers,
  minerSpeedLevel: S.minerSpeedLevel,
  haulCarryLevel: S.haulCarryLevel,
  haulPaceLevel: S.haulPaceLevel,
  haulCap: haulCap(),

  // The shovelling: who has claimed which stretch of floor, and what they are
  // carrying.
  claims: S.workers.filter(w => w.type === 'hauler').map(w => w.claim),
  floorX: floor.x,
  pitFree: pitFree(),
  booked: S.workers.reduce((n, w) => n + (w.booked || 0), 0),
  carried: S.workers.reduce((n, w) => n + (w.carry || 0), 0),
  pace: { laden: +haulSpeed().toFixed(2), empty: +(haulSpeed() * HAUL_EMPTY).toFixed(2), commute: +commutePace().toFixed(2) },
  minerMs: minerMs(),

  // The bodies themselves: where they are, what they are saying, and what is
  // being dragged.
  workers: S.workers.length,
  workerPos: S.workers.map(w => `${w.type[0]}:${Math.round(w.x)},${Math.round(w.y)}`),
  crewNames: S.workers.map(w => `${w.name}|${w.type[0]}|${Math.round((w.lived||0)/1000)}s|m${w.mined||0}|q${w.quarried||0}|g${w.farmed||0}|s${w.stored||0}`).join(' '),
  crewDetail: S.workers.map(w => `${w.type[0]}|${w.goal || '-'}|${Math.round(w.x)}|c${w.carry || 0}|k${w.claim ?? '-'}|p${wayAt(w.x, w.y).key}|w${w.trained ? (w.kitOf || '?')[0] : '-'}|y${Math.round(w.y)}`),
  mining: S.mining,
  paused: S.paused,
  saying: S.workers.filter(w => w.say).length,
  moves: [...new Set(S.workers.map(w => w.move).filter(Boolean))].sort(),
  falling: S.workers.filter(w => w.falling).length,
  lifted: (w => w && w.name)(lifted()) || null,
  dragging: S.dragging,
  mouse: S.mouse,

  // The rates a body works at.
  capacity: capacity(),
  mineMs: mineMs(),
  pxPerSec: +mineRate().toFixed(2),

  // The yard's floor and the piles standing on it.
  floor: count(floor),
  yardFull: !!S.pileFull.rock,
  pileCount: { ...S.pileCount },
  pileFull: { ...S.pileFull },
  pileLimit: { ...PILE_LIMIT },

  // The school, and who has been trained.
  schoolOpen: S.schoolOpen,
  schoolX: Math.round(school.x),
  breakers: S.breakers,
  carters: S.carters,
  blasters: S.blasters,
  growers: S.growers,
  trained: S.workers.filter(w => w.trained).map(w => w.type[0]).sort().join(''),

  // The piles as they are drawn.
  pileMarks: S.piles.filter(p => S.pileFull[p.key]).map(p => p.key),
  piles: S.piles.map(p => ({ key: p.key, from: Math.round(p.from), to: Math.round(p.to) })),

  // Grains, counted where they lie.
  floorGrains: S.floorGrains,
  dustAtQuarry: dustAtQuarry(),
  pit: count(pit),

  // The casino chips in flight.
  chips: S.chips.length,
  // What is riding the belt, and how far along. A check that wants to know the
  // dust *travelled* rather than being thrown over the top of the band has to be
  // able to see it on the band.
  belt: S.belt.length,
  beltX: S.belt.slice(0, 8).map(b => Math.round(b.x)),
  chipShades: S.chips.slice(0, 8).map(c => c.s),
  chipX: S.chips.slice(0, 8).map(c => Math.round(c.x)),

  // Who is on a break.
  breaks: breakReport(),
  resting: S.workers.filter(w => w.resting).length
});
