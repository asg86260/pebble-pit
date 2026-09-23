// The stations: one row a place, and the gates are its columns (DESIGN.md,
// "Beats and gates: one table each", "The gates table").
//
// A row says whether the place stands (`open`), where you stand to open its
// board (`stand`), which flag says its board is up (`board`), and when the
// bench may offer its door: the doors that must be open first (`after`) and
// the yard facts in the row's own words (`needs`). The shields are rows too
// -- the yard puts them between itself and the sky in the same order it opens
// its doors -- with no ground to stand on. `open`, `offered`, `standRect`,
// `nearStation` and `stationAt` are the readers; nothing else asks a
// `<place>Open` boolean by name to know whether a place is there.
//
// The doors are a partial order with facts hung off it, not a sequence: two
// doors may stand open in either order, so `after` is a list a row reads
// and not a step in a chain.

import { P, FARM_DUST, SHACK_DUST, PROP_FROM, LOO_MUCK, UNLOCK_SHOW } from './config.js';
import { S, bench, casino, filter, tower, outhouse, shack } from './state.js';
import { farmShed, quarryShed } from './world.js';
import { houseRect } from './house.js';
import { apothHut } from './apothecary.js';
import { shieldDone } from './shield.js';
import { beatDone } from './beats.js';
import { MACHINES, running } from './machines.js';
import { poopLeft } from './smog.js';
import { canAfford } from './upgrades.js';
import { standOf, crusherRect, podsRect } from './deep/place.js';
import { bedAtBrim } from './deep/scales.js';
import { registerSites } from './works.js';
import { JOB } from './jobs.js';

// A door is shown once you are within reach of affording it: a price you have
// no idea is coming is a price you cannot save for.
const nearly = n => S.stored >= n * UNLOCK_SHOW;

// How far past a station's ground the pointer still counts as standing at it,
// in cells: eight to either side and above, four below, unless a row says
// otherwise in `reach`.
const REACH = { left: 8, right: 8, up: 8, down: 4 };

// A row is the whole of a place. What it is called (`name`: the pointer's
// label, the queue card's line, its board's title) and drawn as (`glyph`: the
// hop's arrow, and the drawing any row it sells inherits when it has none of
// its own). Its board: the page (`page`, `shop`: element ids, `<key>board` and
// `<key>shop` unless it says; made from the row when the page has none) and
// what it says with nothing on it (`empty`); what it sells is registered by
// the module that owns the rows (boardrows.js). Its roster (`post`: the job,
// the key, and a `show`, `at` or `kit` of its own where it differs). The
// works it is a site for (every row with a board, or `site`), built by the
// yard's builders on its ground (`stand`) unless it says otherwise
// (`builtBy`). A row with a `pile` has a pile that can fill: the mark over it
// and its hover come from that. So a new place is one row, and every system
// that shows or staffs a place reads it off here.
//
// The rows, in the order the pointer asks them (`stationAt`), which is the
// order that settles which wins where two patches overlap: the hut before the
// bench it stands in front of; the house, a block that grows a room per body
// and whose patch reaches the bench, after every smaller thing you might be
// standing at; the noticeboard, on the busiest strip in the yard, last of all.
// The shields come after, since they have no ground and answer to no pointer.
export const STATIONS = [
  // No board: the casino's decisions are levers on the building (levers.js).
  { key: 'casino', name: 'the casino', glyph: 'die', open: () => S.casinoOpen, stand: () => casino, board: null,
    after: ['quarry'],
    // The yard has been invested in: a second rock, not any one building.
    needs: () => S.boulderNo >= 2 },
  { key: 'filter', name: 'the air filter', glyph: 'balloon',
    page: 'filter', empty: 'nothing to fit', post: { key: 'filterjob', job: JOB.PURIFY },
    open: () => S.filterOpen, stand: () => filter, board: 'filterBoardOpen',
    after: [],
    // After the first rain (the problem arriving), after the sky's readout has
    // been seen (you know what the house has to keep up with), and after the
    // first machine is running, which makes the house the bill for the thing
    // you just switched on rather than a chore.
    needs: () => S.rains > 0 && S.seenAir && MACHINES.some(m => running(m.key)) },
  // The shed is the only way in; the hole is a hole. The ramp side keeps a
  // tight margin: `SHED_GAP` is much narrower than `BRIDGE_RUN`, so the usual
  // eight cells would reach from the shed onto the ramp and open the board
  // there.
  { key: 'quarry', name: 'the quarry', glyph: 'hoist',
    empty: 'the quarry is as deep as it goes', post: { key: 'quarryjob', job: JOB.QUARRY, kit: true },
    open: () => S.quarryOpen, stand: () => quarryShed(), board: 'quarryBoardOpen',
    reach: { right: 1 },
    after: ['farm'],
    needs: () => S.seenCore },
  { key: 'farm', name: 'the farm', glyph: 'furrow',
    empty: 'the ground is all broken', post: { key: 'farmjob', job: JOB.FARM, kit: true },
    open: () => S.farmOpen, stand: () => farmShed(), board: 'farmBoardOpen',
    after: [],
    // Sticky: `nearly` reads the dust in the hole, and as a plain `show` the
    // door came and went every time you spent.
    needs: () => S.seenCore && nearly(FARM_DUST), sticky: true },
  // The hut, not the plot: a pot answers to its own picker (potpick.js), and
  // a pointer near a cauldron must not throw the shop menu over it.
  { key: 'apothecary', name: 'the apothecary', glyph: 'pot',
    page: 'apothboard', shop: 'apothshop', empty: 'the pot stands cold', post: { key: 'stirjob', job: JOB.STIR },
    open: () => S.apothecaryOpen, stand: () => apothHut(), board: 'apothBoardOpen',
    after: ['farm'],
    needs: () => S.seenSpore },
  { key: 'tower', name: 'the tower', glyph: 'tower',
    empty: 'nothing stirs in here yet', post: { key: 'skyjob', job: JOB.WIZARD, kit: true, show: () => S.meteorOpen },
    open: () => S.towerOpen, stand: () => tower, board: 'towerBoardOpen',
    after: ['quarry'],
    needs: () => S.seenCore },
  // The hut stands on ground the rock's own reach covers, so it is asked
  // before the rock in input.js's cascade.
  { key: 'shack', name: 'the shack', glyph: 'hut',
    empty: 'the tools are all on the rock', post: { key: 'mine', job: JOB.ROCK, kit: true, show: () => S.crew > 0,
            at: () => (S.shackOpen ? null : S.cx) },
    open: () => S.shackOpen, stand: () => shack, board: 'shackBoardOpen',
    after: [],
    // Sticky, for the same reason as the farm: a third of a building, and the
    // first thing most players ever put up.
    needs: () => S.crew > 0 && nearly(SHACK_DUST), sticky: true },
  // The bench has no door row: the call to build it (raise.js) is its door,
  // and `needs` is what the call asks.
  { key: 'bench', name: 'the bench', glyph: 'crate',
    page: 'board', shop: 'shop', empty: 'nothing to sell',
    open: () => S.seenBench, stand: () => bench, board: 'boardOpen',
    after: [],
    needs: () => canAfford() },
  { key: 'outhouse', name: "the janitor's closet", glyph: 'bucket',
    page: 'looboard', shop: 'looshop', empty: 'the brooms are all on their hooks', post: { key: 'loojob', job: JOB.JANITOR, kit: true },
    open: () => S.outhouseOpen, stand: () => outhouse, board: 'looBoardOpen',
    after: [],
    // Once you have seen why you want one: five patches of mess nobody is
    // clearing up.
    needs: () => S.seenMess || poopLeft() >= LOO_MUCK * 5 },
  // The whole structure, roof included. Its right edge is padded two cells,
  // not eight: the gap to the bench is eight cells exactly, and padded like
  // the rest the house claimed the ground the cursor crosses on its way to
  // the bench's board; the strip between them belongs to neither, which is
  // what the safe wedge needs. Nothing above the roof either. Nobody sells
  // the house: it stands from the first hire.
  { key: 'house', name: 'the house', glyph: 'house',
    page: 'house', shop: 'crewshop', post: { key: 'carry', job: JOB.HAUL, fixed: true, kit: true },
    open: () => S.crew > 0, stand: () => houseRect(), board: 'houseBoardOpen',
    reach: { right: 2, up: 0 },
    after: [], needs: () => false },
  // The books open once the hole has had something in it: a rate measured
  // over a yard that has never earned anything is a column of noughts. Nobody
  // sells them either.
  { key: 'stats', name: 'the books', glyph: 'sack',
    empty: 'nothing has come in yet',
    open: () => S.banked > 0, stand: () => S.noticeboard, board: 'statsBoardOpen',
    after: [], needs: () => false },

  // The deep's stations, on its floor under the drowned pit
  // (docs/wave-serpent.md). The altar stands from the snatch and nobody sells
  // it; the rest are sold on it, each on the stage before the one its weapon
  // answers, so the order is the order the serpent's defenses fall.
  { key: 'altar', name: 'the altar', glyph: 'swing',
    empty: 'nothing to strike with', post: { key: 'altarjob', job: JOB.BRAWL },
    open: () => S.snatched, stand: () => standOf('altar'), board: 'altarBoardOpen',
    after: [], needs: () => false },
  // The crusher, the deep's purse, stands from the snatch like the altar. It
  // sells nothing and nobody is put on it: its gatherers are lent haulers.
  { key: 'crusher', name: 'the crusher', glyph: 'sack', open: () => S.snatched, stand: () => crusherRect(), board: null,
    after: [], needs: () => false,
    // Its pile is the floor: scales lying at the brim, the gathering behind.
    pile: () => bedAtBrim(), full: 'the floor is full of scales' },
  // The pods, the deep's houses: nothing sold there, nothing put on.
  { key: 'pods', name: 'the pods', glyph: 'house', site: true, open: () => S.pods > 0, stand: () => podsRect(), board: null,
    after: [], needs: () => false },
  { key: 'well', name: 'the well', glyph: 'bucket',
    empty: 'the well is still', post: { key: 'welljob', job: JOB.LANCE },
    open: () => S.wellOpen, stand: () => standOf('well'), board: 'wellBoardOpen',
    after: ['altar'], needs: () => S.serpentStage >= 1 },
  { key: 'font', name: 'the font', glyph: 'bowl',
    empty: 'the font is still', post: { key: 'fontjob', job: JOB.GRENADE },
    open: () => S.fontOpen, stand: () => standOf('font'), board: 'fontBoardOpen',
    after: ['well'], needs: () => S.serpentStage >= 2 },
  { key: 'circle', name: 'the circle', glyph: 'wand',
    empty: 'the floor is bare', post: { key: 'circlejob', job: JOB.SCRIBE },
    open: () => S.circleOpen, stand: () => standOf('circle'), board: 'circleBoardOpen',
    after: ['well'], needs: () => S.serpentStage >= 2 },
  { key: 'spire', name: 'the spire', glyph: 'tower',
    empty: 'the spire is dark', post: { key: 'spirejob', job: JOB.WARLOCK },
    open: () => S.spireOpen, stand: () => standOf('spire'), board: 'spireBoardOpen',
    after: ['font', 'circle'], needs: () => S.serpentStage >= 3 },

  // The shields, each offered only once its predecessor has failed and the
  // place before it stands (DESIGN.md, "The shields are the spine"). A shield
  // is "open" once it has been and gone, so its row never returns. Never
  // while one is standing: `S.shield` is the one up now.
  { key: 'props', open: () => shieldDone('props'), after: [],
    // Not before the opening has played: the first rock is the story's.
    needs: () => !S.shield && beatDone('show') && S.boulderNo >= PROP_FROM },
  { key: 'net', open: () => shieldDone('net'), after: ['props', 'farm'],
    needs: () => !S.shield },
  { key: 'arch', open: () => shieldDone('arch'), after: ['net', 'quarry'],
    needs: () => !S.shield },
  // Poured by the wizards rather than carried out, so it wants somebody who
  // can pour it (or has: a hat is a wizard away from the board).
  { key: 'dome', open: () => shieldDone('dome'), after: ['arch', 'tower'],
    needs: () => !S.shield && (S.wizards > 0 || S.wizardHats > 0) }
];

const byKey = new Map(STATIONS.map(r => [r.key, r]));

// Every station with a board, by key: what is true of all of them (the mark
// under the foot, the hop's stops) is written once against this list. A new
// station with a board is on it by existing.
export const BOARDS = STATIONS.filter(r => r.board).map(r => r.key);

// Every station that is a site for works, and its ground, handed to works.js
// (which the boards import, and so cannot import this back).
registerSites(STATIONS.filter(r => r.board || r.site).map(r => [r.key, r.builtBy || JOB.BUILD]),
              key => byKey.get(key)?.stand?.() || null);

// The row for a key, or undefined for a thing that is not a station (the
// rift, the meteor, the lab that was).
export const station = key => byKey.get(key);
// What a place is called, for any key a site or a station goes by.
export const nameOf = key => byKey.get(key)?.name || null;

// Whether the place stands. A key that is not a station is not open.
export const open = key => !!station(key)?.open();

// Whether the bench may offer the door: not yet open, every door before it
// open, and the yard's own facts met. A sticky row's holding is `revealed`
// in shop.js (`once`), so this is asked, never remembered.
export function offered(key) {
  const s = station(key);
  if (!s || s.open()) return false;
  return s.after.every(open) && s.needs();
}

// The ground a station stands on, or null while it is not there, so where
// you have to be to open a board is not arithmetic written out again in a
// check.
export function standRect(key) {
  const s = station(key);
  if (!s || !s.stand || !s.open()) return null;
  const r = s.stand();
  return r && { x: r.x, y: r.y, w: r.w, h: r.h };
}

// Near enough to a station's ground to be interested in it: its rectangle
// padded by its reach.
export function nearStation(key, x, y) {
  const s = station(key);
  if (!s || !s.stand || !s.open()) return false;
  const r = s.stand();
  if (!r) return false;
  const c = { ...REACH, ...(s.reach || {}) };
  return x > r.x - P * c.left && x < r.x + r.w + P * c.right &&
         y > r.y - P * c.up && y < r.y + r.h + P * c.down;
}

// The station a point on the ground asks for, in table order, or null.
export function stationAt(x, y) {
  for (const s of STATIONS) if (s.stand && nearStation(s.key, x, y)) return s.key;
  return null;
}

// The door a shield stands before: the one door among the shields it comes
// after. The props stand before nothing but the rock, so they answer null,
// and `shieldOpened` in shield.js reads that as open.
export function shieldBefore(kind) {
  const s = station(kind);
  return s?.after.find(k => station(k)?.stand) ?? null;
}
