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
import { S, floor, pit, cut, bench, quarry, farm, lab, apothecary, casino, scrub, table, tray, tower, outhouse, shack, sky } from './state.js';
import { MACHINES, machine } from './machines.js';
import { wizMs, wizBite } from './wizard.js';
import { SITES, workAt, worksAt, workOn, handsAt } from './works.js';
import { BOLTS, SPARKLE } from './meteor.js';
import { callOut, raising } from './raise.js';
import { riftCells } from './rift.js';

// how much of the meteor is still up there, rind or core
const skyLeft = kind => {
  if (!sky.cells) return 0;
  let n = 0;
  for (const v of sky.cells) if (v === kind) n++;
  return n;
};
// The ledgers, not the walks: verify.js checks the ledger against the cells
// every few frames of every check, so a reading off it is the cells' answer
// at a fortieth of the cost -- the hole alone is forty thousand cells.
import { grainsIn, dustIn } from './grid.js';
import { wayAt } from './route.js';
import { rockLeft, bridgeSpan, groundAt, benches, plotCount, openingCamX, plotSlots, farmShed, quarryShed } from './world.js';
import { rockFootY, dropZone, depthOf } from './rock.js';
import { pitCapacity, pitDepth, pitFull } from './pit.js';
import { quarryFace, quarryShape, ladder, seamShards, dugShare, quarryDone } from './quarry.js';
import { coreHome } from './core.js';
import { rates } from './stats.js';
import { pitFree, lifted, commutePace } from './crew.js';
import { AIR, airReport } from './air.js';
import { skyReport } from './weather.js';
import { houseReport, doorAt } from './house.js';
import { pot, pouring, letting, hoisting, stakeOf, chipName, potAt, tableWant, trayWant, shownMult } from './casino.js';
import { buriedVisible } from './intro.js';
import { KINDS } from './shield.js';
import { rosterReport } from './roster.js';
import { breakReport } from './break.js';
import { smogReport, muckCols, GOING } from './smog.js';
import { now as clockNow } from './clock.js';
import { seed } from './rng.js';
import { windAt } from './wind.js';
import { CRAFT, craftY, crewed, working } from './balloon.js';
import { mineMs, capacity, mineRate, rockhandMs, haulCap, haulSpeed, benchMark, idle, capOf, handsOf, machineRate, kitFull, hats } from './upgrades.js';
import { hasOffer, STATIONS, standRect } from './board.js';
import { boiling as apothBoiling, doseComing } from './apothecary.js';
import { TYPE } from './jobs.js';

// The floor, a column at a time: how many grains are lying in each, and how
// tall it stands (the row above the topmost grain, so an empty column is 0).
//
// One walk of the grid, shared by the four reports under it. Each of them
// walked the whole floor for itself, and a snapshot took the four of them --
// six hundred columns of ninety rows, six times over -- so a check that read
// the yard every frame spent forty frames of sim on each reading. The reports
// still answer alone, for anybody who asks one of them on its own; the
// snapshot surveys once and hands the survey to each.
export function floorSurvey() {
  const { cols, rows, grid } = floor;
  const n = new Uint16Array(cols), h = new Uint16Array(cols);
  for (let r = 0; r < rows; r++) {
    const row = r * cols;
    for (let c = 0; c < cols; c++) if (grid[row + c]) { n[c]++; h[c] = r + 1; }
  }
  return { n, h };
}

// Dust that got past the hole. Everything thrown at the pit is thrown from the
// near lip, so anything lying on the ground beyond the far wall is a throw that
// sailed over a hole it should have landed in.
export function dustPastPit(survey = floorSurvey()) {
  let n = 0;
  for (let c = 0; c < floor.cols; c++) {
    if (floor.x + c * P < pit.x + pit.w) continue;
    n += survey.n[c];
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
export function apronReport(survey = floorSurvey()) {
  let inApron = 0, tallest = 0, crest = 0;
  const near = rockLeft(), far = rockLeft() + S.gw * P;
  for (let c = 0; c < floor.cols; c++) {
    const x = floor.x + c * P;
    const h = survey.h[c];
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
export function dustAtQuarry(survey = floorSurvey()) {
  if (!S.quarryOpen) return 0;
  let n = 0;
  for (let c = 0; c < floor.cols; c++) {
    const x = floor.x + c * P;
    if (!(x + P > quarry.x && x < quarry.x + quarry.w)) continue;
    n += survey.n[c];
  }
  return n;
}

// How the ground either side of the hill reads: what is lying behind it, and
// what is standing under it. The second is the invariant -- nothing may ever be
// under the rock -- and the first is a measure of how much of the yard's dust
// has ended up on the far side of the boulder from the crew.
export function strandedDust(survey = floorSurvey()) {
  let left = 0, under = 0;
  const l = rockLeft(), r = l + S.gw * P;
  for (let c = 0; c < floor.cols; c++) {
    const x = floor.x + c * P;
    if (x >= r) continue;
    if (x + P <= l) left += survey.n[c]; else under += survey.n[c];
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
//
// The floor is walked once (`floorSurvey`) and every report that reads it is
// handed the survey; the air is reported once too. They were called once per
// field -- `apronReport()` four times over, and each call every cell of a
// six-hundred-column ground -- so a snapshot cost forty frames of sim, and a
// check reading the yard on every frame of a thirty-second run at three frame
// rates spent eighty seconds reading and a fifth of one running.
export const snapshot = () => {
  const survey = floorSurvey();
  return snapshotOf(survey, apronReport(survey), strandedDust(survey), airReport());
};
const snapshotOf = (survey, apron, stranded, air) => ({
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
  apronDust: apron.inApron,
  apronClear: apron.inApron === 0,
  heapAtRock: apron.tallest,
  bankCrest: apron.crest,
  dustLeftOfRock: stranded.left,
  dustUnderRock: stranded.under,

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
  waves: S.shocks.filter(s => s.ms).length,     // rings in the air that are not a crit's: a shield's fanfare
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
  airUnder: air.under,
  airFront: air.front,
  airKinds: air.kinds,
  airWant: air.want,
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
  dustPastPit: dustPastPit(survey),
  stored: S.stored,
  held: S.held,

  // Cores and shards, banked and loose.
  cores: S.cores,
  shards: S.shards,
  seenShard: S.seenShard,
  // Whether the sky's reading is showing. It was only ever handed back by the
  // lab's own hook, because buying it at the lab was the only way to get it;
  // the first rain sets it now, so it is a fact about the yard like the other
  // two beside it.
  seenAir: S.seenAir,

  // What has been opened, and how far through the opening story the yard is.
  quarryOpen: S.quarryOpen,
  labOpen: S.labOpen,
  intro: S.intro,
  introDone: S.introDone,
  reunionDone: S.reunionDone,
  pair: S.pair.length,
  pairX: S.pair.map(b => Math.round(b.x)),   // where the two of them are stood, or walking
  doorX: Math.round(doorAt().x),
  buried: S.buried,
  buriedVisible: buriedVisible(),
  buriedDug: S.buriedDug,
  buriedMs: S.buriedMs,
  rescued: S.rescued,
  storyTold: S.storyTold,

  // The shields: what is standing over the landing spot, how much of it is up,
  // and whether it currently has a rock off the ground.
  shield: S.shield && { kind: S.shield.kind, x: Math.round(S.shield.x), w: S.shield.w,
                        h: S.shield.h, rise: S.shield.rise, laid: S.shield.laid,
                        pieces: KINDS[S.shield.kind].pieces, caught: !!S.shield.caught,
                        rising: !!S.shield.rising, setting: !!S.shield.setting,
                        sag: +(S.shield.sag || 0).toFixed(2),
                        strain: +(S.shield.strain || 0).toFixed(2) },
  shieldsDone: [...S.shieldsDone],
  pinned: S.pinned,                 // the card in the corner, or null
  rockHeld: S.rockHeld,

  // The casino: the stake in the hopper, the handful on the pegs, the bins,
  // the tray.
  casinoOpen: S.casinoOpen,
  casinoBoardOpen: S.casinoBoardOpen,
  pot: S.pot && { cur: S.pot.cur, stake: S.pot.stake, on: pot(), where: S.pot.where },
  // the stake is still coming down into its plot
  pouring: pouring(),
  // a hand is on the board: the gate open, the grains falling, the bins paying
  letting: letting(),
  drop: S.drop && { stage: S.drop.stage, sent: S.drop.sent, handful: S.drop.handful,
                    falling: S.drop.grains.filter(g => !g.landed).length,
                    onPegs: S.drop.grains.filter(g => g.seat).length,
                    bins: S.drop.bins.map(b => b.length),
                    paid: Math.round(S.drop.paid), edge: S.drop.edge },
  // the tray on its way back up for a drop again
  hoisting: hoisting(),
  // the demonstration grain, ticking down with nothing riding on it
  attract: !!(S.attract && S.attract.grain),
  tableAir: S.tableAir.length,
  hand: S.hand && { won: S.hand.won, n: S.hand.n, mult: +S.hand.mult.toFixed(3), edge: S.hand.edge },
  mult: shownMult(),
  potAt: Math.round(potAt().x),
  // the grains in the hopper and the tray, and how many each is meant to hold,
  // which past the first band is fewer than the pot itself -- see `shownFor`
  table: table.n,
  tableWant: tableWant(),
  tray: tray.n,
  trayWant: trayWant(),
  paying: S.paying && S.paying.left,
  chip: chipName(),
  stakes: { dust: stakeOf('dust'), shard: stakeOf('shard'), spore: stakeOf('spore') },

  // The lab, and every kind of smoke over the yard.
  skyShown: S.skyShown,
  scholars: S.scholars,
  smoke: S.smoke.filter(p => !p.house && !p.cig && !p.mach).length,
  machSmoke: S.smoke.filter(p => p.mach).length,
  cigSmoke: S.smoke.filter(p => p.cig).length,
  grit: S.grit.length,        // chips in the air off a builder's hammer
  houseSmoke: S.smoke.filter(p => p.house).length,
  shutters: [...S.shutters].sort((a, b) => a - b),
  // per-site now; `labDone` is kept as the lab's own reading of it
  siteDone: S.siteDone,
  labDone: S.siteDone?.lab ?? null,

  // The boards: which one is up, what each has to offer, and where you stand to
  // open it.
  boardOpen: S.boardOpen,
  labBoardOpen: S.labBoardOpen,
  houseBoardOpen: S.houseBoardOpen,
  crewListOpen: S.crewListOpen,
  scrubBoardOpen: S.scrubBoardOpen,
  quarryBoardOpen: S.quarryBoardOpen,
  farmBoardOpen: S.farmBoardOpen,
  towerBoardOpen: S.towerBoardOpen,
  statsBoardOpen: S.statsBoardOpen,       // Track F3 (wave5): the books over the pit
  looBoardOpen: S.looBoardOpen,
  shackBoardOpen: S.shackBoardOpen,
  towerOpen: S.towerOpen,
  towerX: Math.round(tower.x),
  outhouseOpen: S.outhouseOpen,
  outhouseX: Math.round(outhouse.x),
  // The gang's hut, and where it stands: a check about the rock's own board and
  // about the walk having moved out to make room for it reads both from here.
  shackOpen: S.shackOpen,
  shackX: Math.round(shack.x),
  // the noticeboard, and how much of the record is on it
  noticesX: Math.round(S.noticeboard.x),
  noticesY: Math.round(S.noticeboard.y),
  won: (S.won || []).length,
  wonUnread: Math.max(0, (S.won || []).length - (S.wonSeen | 0)),
  shackW: Math.round(shack.w),
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
  brewing: !!workOn(TYPE.WIZARD),

  // What the yard is in the middle of building, site by site: the row, how much
  // of the work is in, and how much it takes. A check that buys something past
  // the bench has to be able to see that it *started*, and then watch it land.
  works: Object.fromEntries(SITES.map(site => [site, workAt(site)
    ? { key: workAt(site).key, done: +workAt(site).done.toFixed(2), of: workAt(site).of,
        hands: handsAt(site) }
    : null]).filter(([, w]) => w)),
  // ...and the whole of each site's line behind that, in the order it will be
  // built. `works` above is the front alone, which is what every check written
  // before there was a line reads; a check about the line reads this.
  line: Object.fromEntries(SITES.map(site => [site, worksAt(site)
    .map(w => ({ key: w.key, done: +w.done.toFixed(2), of: w.of }))]).filter(([, l]) => l.length)),
  builders: S.builders || 0,
  // The order the yard's own buildings were bought in -- see C7 in
  // wave-feedback3.md.
  buildOrder: [...(S.buildOrder || [])],
  lent: [...(S.lent || [])],
  aloft: S.workers.filter(w => w.aloft).length,
  wizardY: S.workers.filter(w => w.type === TYPE.WIZARD).map(w => Math.round(w.y)),
  // A wizard down on the ground for a dose, with the stirrer nearly at it:
  // the `manabrew` scene runs to this frame, so the shot is the two of them
  // meeting rather than a body alone on the ground.
  doseMeeting: S.workers.some(w => w.type === TYPE.WIZARD && !w.aloft && doseComing(w) &&
    S.workers.some(s => s.type === TYPE.STIR && s.dealTo === w && Math.abs(s.x - w.x) < 240)),

  // The smog, and the house that scrubs it.
  smog: smogReport(),
  smogBand: (SMOG_TOP + SMOG_BAND) * P,
  scrubX: Math.round(scrub.x),

  // The cursor: what it is over, and what is following it.
  pointed: S.workers.filter(w => w.pointed > clockNow()).map(w => w.name),
  follows: S.follow ? S.follow.name : null,
  followOff: S.follow ? Math.round(S.camX + S.viewW / 2 - (S.follow.x + WORKER / 2)) : null,

  rates: { stored: Math.round(rates.banked), banked: Math.round(rates.banked), shards: +rates.shards.toFixed(2), spores: +rates.spores.toFixed(2) },
  labX: Math.round(lab.x),
  apothecaryX: Math.round(apothecary.x),
  apothecaryOpen: S.apothecaryOpen,
  boiling: apothBoiling(),
  stirrers: S.stirrers,
  potTonics: S.potTonics,
  potPrefers: S.potPrefers,
  potKeep: S.potKeep,
  potSpent: S.potSpent,
  apothPots: S.apothPots,
  // How many batches the place has ever finished. Three rows on this board are
  // revealed by it -- the deeper rungs, the potency ladders and the second pot
  // -- so a check that wants one of them has to be able to see how close the
  // craft is to earning it. Without this the only way to reach an earned row
  // was to set the count by hand, which proves nothing about how a player gets
  // there.
  brews: S.brews,
  casinoX: Math.round(casino.x),

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
  // The two sheds -- see C5. Only meaningful once the station they belong to is
  // standing, the same as everything else about it.
  quarryShed: S.quarryOpen ? quarryShed() : null,
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
  farmShed: S.farmOpen ? farmShed() : null,
  plotCount: plotCount(),
  // How wide the row is laid out, whether or not every furrow in it has been
  // broken -- see C6 in wave-feedback3.md. `plotCount` above is the mechanical
  // one and keeps meaning "bought"; this is what the fence actually brackets.
  plotSlots: plotSlots(),
  plotLevel: S.plotLevel,
  plots: S.plots.map(b => +b.toFixed(2)),
  plotTone: [...S.plotTone],

  // The rock being worked: which one, how deep, and how much is left.
  underground: S.workers.filter(w => w.type === TYPE.QUARRY && w.y > S.groundY).length,
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
  // The call to build the bench: whether it is standing there to be pressed,
  // and whether the bench is going up. Both derived (see raise.js), so this is
  // the only place a check can read them.
  benchCall: callOut(),
  benchRising: raising(),

  // The dust in the pit, grain by grain.
  pitGrains: grainsIn(pit),
  pitDust: dustIn(pit),
  // And the dust that is not in the pit, because it is not in this dimension.
  // `stored` is the two of them together -- see `inHole` in pit.js.
  rift: S.rift || 0,
  riftOpen: !!S.riftOpen,
  riftLevel: S.riftLevel || 0,
  // the arc: how much it has eaten, the disc size that derives, and whether
  // the hole has given way into the abyss
  riftAte: S.riftAte || 0,
  riftCells: riftCells(),
  drowned: !!S.drowned,
  cine: S.cine ? S.cine.name : null,
  cineOut: !!(S.cine && S.cine.out),        // let go, and on its way out
  // and the coins through it, which the counters do not distinguish: what you
  // own is what is in the hole plus what is in here
  riftHeld: { ...(S.riftHeld || {}) },
  // and how many grains are in the air on their way into it, with the first
  // few of them, so a check can see the orbit rather than only the count
  gulped: (S.gulped || []).length,
  gulpedAt: (S.gulped || []).slice(0, 4).map(m => ({ t: +m.t.toFixed(2), x: Math.round(m.x), y: Math.round(m.y) })),

  // And the dust lying in the cut, fallen down the mouth and not yet fetched.
  cutDust: dustIn(cut),

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
  rockhandPickLevel: S.rockhandPickLevel,
  carryLevel: S.carryLevel,
  speedLevel: S.speedLevel,
  autoMine: S.autoMine,
  rockhands: S.rockhands,
  haulers: S.haulers,
  rockhandSpeedLevel: S.rockhandSpeedLevel,
  haulCarryLevel: S.haulCarryLevel,
  haulPaceLevel: S.haulPaceLevel,
  haulCap: haulCap(),

  // The shovelling: who has claimed which stretch of floor, and what they are
  // carrying.
  claims: S.workers.filter(w => w.type === TYPE.HAUL).map(w => w.claim),
  floorX: floor.x,
  pitFree: pitFree(),
  booked: S.workers.reduce((n, w) => n + (w.booked || 0), 0),
  carried: S.workers.reduce((n, w) => n + (w.carry || 0), 0),
  pace: { laden: +haulSpeed().toFixed(2), empty: +(haulSpeed() * HAUL_EMPTY).toFixed(2), commute: +commutePace().toFixed(2) },
  rockhandMs: rockhandMs(),

  // The bodies themselves: where they are, what they are saying, and what is
  // being dragged.
  // Where the muck actually is, in columns, so a check can ask *where* a thing
  // came down rather than only how much of it there is. The balloon's whole
  // claim is about where.
  muckAt: (() => {
    const m = muckCols();
    const out = [];
    for (let c = 0; c < m.length; c++) if (m[c]) out.push([c, m[c]]);
    return out;
  })(),
  // Anybody currently under a canopy, having stepped out of a balloon. A count
  // and their heights, so a check can watch one actually come down.
  // Specks a mouth has taken that are still fading where they stood. Not haze --
  // they left the sky on the frame they were swallowed -- so this is a count of
  // a picture, and it is here so a check can tell a fade from a pop.
  going: GOING.length,
  brollies: S.workers.filter(w => w.brolly).map(w => Math.round(w.y)),
  // The bodies on the purifiers, which is the one station whose people are in
  // two quite different places: through a door, or several hundred pixels up in
  // a basket. `berth` is -1 for the house and the craft's index otherwise.
  scrubCrew: S.workers.filter(w => w.type === TYPE.PURIFY).map(w => ({
    name: w.name, x: Math.round(w.x), y: Math.round(w.y),
    berth: w.berth == null ? null : w.berth, aloft: !!w.aloft, goal: w.goal || null
  })),
  workers: S.workers.length,
  workerPos: S.workers.map(w => `${w.type[0]}:${Math.round(w.x)},${Math.round(w.y)}`),
  // and what each of them is up to, for a check about the yard settling rather
  // than about where anybody is standing
  workerGoals: S.workers.map(w => `${w.type}:${w.goal || '-'}`),
  crewNames: S.workers.map(w => `${w.name}|${w.type[0]}|${Math.round((w.lived||0)/1000)}s|m${w.mined||0}|q${w.quarried||0}|g${w.farmed||0}|s${w.stored||0}`).join(' '),
  crewDetail: S.workers.map(w => `${w.type[0]}|${w.goal || '-'}|${Math.round(w.x)}|c${w.carry || 0}|k${w.claim ?? '-'}|p${wayAt(w.x, w.y).key}|w${w.trained ? (w.kitOf || '?')[0] : '-'}|y${Math.round(w.y)}`),
  mining: S.mining,
  paused: S.paused,
  fatal: S.fatal,
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
  floor: survey.n.reduce((a, b) => a + b, 0),
  // The craft the scrubbing house has sold: where each one is, how far up, and
  // whether anybody is in it. `up` is the one worth reading -- a crewed craft
  // still climbing off the mast is not working yet, the same rule the house has
  // always run on.
  craft: CRAFT.map((c, i) => ({
    x: Math.round(c.x), dir: c.dir, lift: +c.lift.toFixed(3),
    y: Math.round(craftY(i)), crewed: crewed(i), up: working(i)
  })),
  yardFull: !!S.pileFull.rock,
  pileCount: { ...S.pileCount },
  pileFull: { ...S.pileFull },
  pileLimit: { ...PILE_LIMIT },

  // The kit each station owns, and who is wearing it.
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
  dustAtQuarry: dustAtQuarry(survey),
  pit: grainsIn(pit),

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
