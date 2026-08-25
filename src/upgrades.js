// What the bench sells, and what each thing costs.
//
// One row is one object. Every field is a function of the current game, so a row
// never holds a stale number, and adding an upgrade is adding an object -- no
// other file has to know about it. `SECTIONS` decides the order and the grouping
// on the board.

import {
  CAP_BASE, CAP_STEP, MINE_BASE, MINE_FLOOR, MINER_BASE, MINER_FLOOR,
  HAUL_MS, HAUL_BASE, QUARRY_FLOOR, TEND_FLOOR, SCHOOL_COST, CASINO_CORES,
  QUARRY_BENCH_MAX, FARM_BEDS_MAX, BENCH_COST, BENCH_RATE, BED_COST, BED_RATE
} from './config.js';
import { S, quarry, farm, lab, school, casino } from './state.js';
import { spend, takeCoreCells, digPit, digsLeft, digCost, capacityAt, pitCapacity } from './pit.js';
import { CORE_CELL, SHARD_CELL, SPORE_CELL } from './config.js';
import { lookAt, resite, benches, bedCount } from './world.js';
import { syncWorkers } from './crew.js';
import { quarryMs, quarryRate } from './quarry.js';
import { mult } from './lab.js';
import { tendMs, tendRate } from './farm.js';
import { buildShop } from './shop.js';

// Every swing in the game is the same shape: a gap in milliseconds that shrinks
// by a fixed fraction per level and never goes below a floor. One function, five
// swings -- the next kind of worker gets its speed for a line.
const swing = (base, floor, per) => lvl => Math.max(floor, Math.round(base * Math.pow(per, lvl)));
const perSecond = ms => lvl => 1000 / ms(lvl);

export const capacity = () => CAP_BASE + S.carryLevel * CAP_STEP;

const mineGap = swing(MINE_BASE, MINE_FLOOR, 0.8);
const minerGap = swing(MINER_BASE, MINER_FLOOR, 0.82);
const scoopGap = swing(HAUL_MS, 30, 0.85);

export const mineMs = (lvl = S.speedLevel) => Math.max(1, mineGap(lvl) / mult('swing'));
export const mineRate = (lvl = S.speedLevel) => 1000 / mineMs(lvl);
export const minerMs = (lvl = S.minerSpeedLevel) => Math.max(1, minerGap(lvl) / mult('swing'));
export const minerRate = (lvl = S.minerSpeedLevel) => 1000 / minerMs(lvl);
export const haulCap = (lvl = S.haulCarryLevel) => 1 + lvl;
export const haulSpeed = (lvl = S.haulPaceLevel) => HAUL_BASE * (1 + 0.3 * lvl) * mult('haul');
export const scoopMs = (lvl = S.haulPaceLevel) => Math.max(1, scoopGap(lvl) / mult('haul'));
// Pixels a swing takes. Yours and theirs are two different tools now: one row
// that made every miner in the yard hit harder was doing two jobs at once, and
// it sat under `you` while half of what it bought was on the rock.
export const pickCount = () => 1 + S.pickLevel;         // pixels your own swing takes
export const minerBite = () => 1 + S.minerPickLevel;    // and what a miner takes

// Every currency is a mark, never a word. Adding one is a line here and a line
// in the stylesheet.
export const MARK = {
  dust: '<i class="dust"></i>',
  core: '<i class="core"></i>',
  shard: '<i class="shard"></i>',
  spore: '<i class="spore"></i>'
};

// what you have of one
export const purse = money =>
  money === 'core' ? S.cores :
  money === 'shard' ? S.shards :
  money === 'spore' ? S.spores :
  S.stored;

// units are the marks themselves: a grain of dust, a grain a second
export const UNITS = {
  'px': '<i class="dust"></i>',
  'px/s': '<i class="dust"></i>/s',
  'trips/min': '<i class="shard"></i>/min',
  'beds/min': '<i class="spore"></i>/min'
};

export const num = v => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
export const rateText = lvl => num(mineRate(lvl));


// Hiring and putting to work are two different things now. You buy a body once
// — a core for the first, dust for the next — and it carries dust until you put
// it on something else. A job is a count, not a purchase, so every one of them
// can be taken back the moment you want the dust moving again -- except a body
// that has been to the school, which is the deliberate exception and the reason
// the rule is worth stating out loud. See school.js.
export const JOBS = ['miners', 'quarriers', 'farmhands', 'labbers'];

// Bodies with nothing else to do. They are the haulers, always: every body in
// the yard can be moved to every job, and nothing you buy changes that.
export const spareHands = () => S.crew - JOBS.reduce((n, j) => n + S[j], 0);
export const idle = () => spareHands();

// --- the kit ----------------------------------------------------------------
// What the school sells is not a person, it is a hat -- and a hat belongs to the
// station, not to the head that happens to be under it. Buying one used to
// upgrade a body and nail it to the post for good, which is a decision you make
// once and then live with for the rest of the run: thirteen carters is thirteen
// bodies that cannot go and work a bed.
//
// So the kit stays where the work is. Whoever is standing at the rock picks up
// whatever helmets are lying on it, and a helmet nobody is wearing lies there
// waiting for the next body sent over. Move everybody off and the hats stay
// behind; move somebody back and they are wearing one before they get there.
// Nothing is ever wasted and nothing is ever locked.
export const TRADE_OF = { miners: 'breakers', haulers: 'carters',
                          quarriers: 'blasters', farmhands: 'growers' };
// What job a body is doing, from what it is. A trade is counted off the bodies
// now rather than off a number, because a hat is a thing somebody walked over
// and picked up: see crew.js.
export const JOB_OF = { miner: 'miners', hauler: 'haulers', quarrier: 'quarriers',
                        farmhand: 'farmhands', labber: 'labbers' };

// hats the station owns, hats actually on heads, and hats lying on the ground
// there waiting for somebody to come and get them
export const hats = job => S[TRADE_OF[job]] || 0;
export const worn = job => S.workers.filter(w => JOB_OF[w.type] === job && w.trained).length;
export const spareKit = job => Math.max(0, hats(job) - worn(job));

// How many bodies a station has room for. Two of them have a floor plan: a cut
// holds one body per bench and a plot holds one per bed, and there is nowhere
// else down there to put anybody. That is what makes the quarry and the farm
// worth what they give up the moment they open -- a shard buys the third body
// somewhere to stand, and a spore buys the fourth a bed -- and it is why the
// plus button under either of them goes pale with hands still spare.
//
// The rock and the lab have no such plan: a rock is as long as it is and a room
// holds who it holds.
export const capOf = job =>
  job === 'quarriers' ? benches() :
  job === 'farmhands' ? bedCount() : Infinity;
export const roomAt = job => capOf(job) - S[job];

// `haulers` is a fact on S rather than a sum worked out where it is read, so
// that the crew code can treat it like any other job. This is the one place it
// is set, and every path that moves a body goes through here.
export function rebalance() {
  // Hats are not clamped to bodies. A station may own more of them than it has
  // people standing at it -- that is the whole point of the kit belonging to the
  // place -- so the only rule left is that a count of hats is not negative.
  // A station cannot hold more bodies than it has places to stand. Nothing the
  // player can do breaks that either, but a save from a wider plot can, and the
  // ones that do not fit go back to carrying dust rather than standing in each
  // other at a bed that is not there.
  for (const job of ['quarriers', 'farmhands']) S[job] = Math.min(S[job], capOf(job));
  for (const job of Object.keys(TRADE_OF)) S[TRADE_OF[job]] = Math.max(0, S[TRADE_OF[job]]);
  // Carrying is the job nobody is assigned to: it is what a body does when it is
  // on nothing, so the haulers are whatever is left over. The carts are the
  // lip's kit and are counted with the rest of it, not held out of this.
  S.haulers = Math.max(0, spareHands());
}

export function hire() {
  S.crew++;
  rebalance();
  syncWorkers();
  S.dirty = true;
  buildShop();
}

// move one body on to a job, or off it and back to carrying dust
export function assign(job, d) {
  if (d > 0 && idle() < 1) return;
  if (d > 0 && roomAt(job) < 1) return;          // nowhere down there to put them
  if (d < 0 && S[job] < 1) return;
  // and nothing stops one leaving: the hat it was wearing stays at the station.
  S[job] += d;
  rebalance();
  syncWorkers();
  S.dirty = true;
  buildShop();
}

// Where a body works is not on the bench any more: every station carries its own
// count and its own two buttons, under the place the work happens. The bench
// sells things, and moving somebody from the beds to the rock was never a
// purchase. `roster.js` is where that lives now; the lab keeps a row of its own,
// because starting a piece of research and staffing it are one job and the lab
// is where you are standing when you do it.

// The one thing you hire. Everything else is where you put them.
//
// There is no row for the *first* one any more. It used to cost a core, and the
// opening hands you a body now -- somebody who was already standing there when
// the rock came down -- so a row selling you the crew you already have is a row
// that could never fire. A game that has never been played gets its first body
// from the story; see intro.js.
const HIRE = [
  {
    key: 'worker',
    name: 'workers',
    from: () => S.crew,
    to: () => S.crew + 1,
    // One pool pays for every job now, so the curve is gentler than the four
    // it replaced: 1.7 a body was steep because it was steep four times over,
    // and the same eight bodies came to about 1,500 dust between them.
    cost: () => Math.round(60 * Math.pow(1.35, Math.max(0, S.crew - 1))),
    buy: hire,
    show: () => S.crew > 0
  }
];

// A site is a place, bought once with cores. It comes with nobody in it: who
// works it is the same question as who works the rock.
const site = ({ key, name, cores, open, at, show }) => ({
  key, name, cost: () => cores, currency: 'core',
  buy: () => { S[open] = true; lookAt(at()); },
  show
});

const CAVE = site({
  key: 'unlockquarry', name: 'open the quarry', cores: 3, open: 'quarryOpen',
  at: () => quarry.x + quarry.w / 2,               // show them what they just bought
  show: () => S.seenCore && !S.quarryOpen
});
// One place at a time. Banking a single core used to reveal every site in the
// game at once, which spoils the whole chain: each one is a surprise that the
// last one earns.
const FARM = site({
  key: 'unlockfarm', name: 'break the ground', cores: 5, open: 'farmOpen',
  at: () => farm.x + farm.w / 2,
  show: () => S.quarryOpen && !S.farmOpen
});

export const UPGRADES = [
  {
    key: 'carry',
    name: 'carry',
    from: () => capacity(),
    to: () => capacity() + CAP_STEP,
    cost: () => Math.round(8 * Math.pow(1.35, S.carryLevel)),
    buy: () => S.carryLevel++,
    show: () => true
  },
  {
    key: 'auto',
    name: 'hold to mine',
    cost: () => 25,
    buy: () => { S.autoMine = true; },
    show: () => !S.autoMine
  },
  {
    key: 'speed',
    name: 'swing',
    unit: 'px/s',
    from: () => rateText(S.speedLevel),
    to: () => rateText(S.speedLevel + 1),
    cost: () => Math.round(20 * Math.pow(1.9, S.speedLevel)),
    buy: () => S.speedLevel++,
    // faster swings only read as an upgrade once the swinging is automatic
    show: () => S.autoMine && mineMs() > MINE_FLOOR
  },
  // --- what a swing takes ---------------------------------------------------
  // A core is a rock. There is one of them per rock for ever, and what they are
  // for is *opening places* -- the cut, the beds, the lab, the table. Selling a
  // pick for one put a rate on the same shelf as a whole new part of the game,
  // and every core spent on a bigger bite was a core not spent on somewhere to
  // send anybody. So the picks are priced in what the ground gives up instead,
  // which is what the ground is for.
  //
  // Yours is a tool, and a tool is cut stone: shards.
  {
    key: 'pick',
    name: 'pick',
    unit: 'px',
    from: () => pickCount(),
    to: () => pickCount() + 1,
    cost: () => Math.round(4 * Math.pow(1.55, S.pickLevel)),
    currency: 'shard',
    buy: () => S.pickLevel++,
    show: () => S.seenShard
  },
  ...HIRE,
  // And the crew's is what the crew are fed on. The beds grow the only thing in
  // this yard anybody eats, so what a body can take out of the rock is bought in
  // spores -- which also keeps the green from piling up unspent, and gives the
  // two currencies a job each instead of one of them doing all the work.
  {
    key: 'minerpick',
    name: 'miner bite',
    unit: 'px',
    from: () => minerBite(),
    to: () => minerBite() + 1,
    cost: () => Math.round(5 * Math.pow(1.55, S.minerPickLevel)),
    currency: 'spore',
    buy: () => S.minerPickLevel++,
    show: () => S.seenSpore && S.crew > 0
  },
  {
    key: 'minerspeed',
    name: 'miner swing',
    unit: 'px/s',
    from: () => num(minerRate()),
    to: () => num(minerRate(S.minerSpeedLevel + 1)),
    cost: () => Math.round(70 * Math.pow(1.8, S.minerSpeedLevel)),
    buy: () => S.minerSpeedLevel++,
    show: () => S.crew > 0 && minerMs() > MINER_FLOOR
  },
  {
    key: 'haulcarry',
    name: 'worker load',
    from: () => haulCap(),
    to: () => haulCap(S.haulCarryLevel + 1),
    cost: () => Math.round(50 * Math.pow(1.5, S.haulCarryLevel)),
    buy: () => S.haulCarryLevel++,
    show: () => S.crew > 0
  },
  {
    key: 'haulpace',
    name: 'worker pace',
    unit: 'px/s',
    from: () => num(haulSpeed() * 60),
    to: () => num(haulSpeed(S.haulPaceLevel + 1) * 60),
    cost: () => Math.round(60 * Math.pow(1.7, S.haulPaceLevel)),
    buy: () => S.haulPaceLevel++,
    show: () => S.crew > 0
  },
  CAVE,
  // The first thing a shard is worth, and the reason the quarry is worth three
  // cores: the cut pays for its own next bench. A fresh one is two benches of
  // standing room, so the third body you want down there has to be given
  // somewhere to stand -- and what it is bought with is what the two already
  // down there are carrying up.
  {
    key: 'quarrybench',
    name: 'take out a bench',
    from: () => benches(),
    to: () => benches() + 1,
    cost: () => Math.round(BENCH_COST * Math.pow(BENCH_RATE, S.benchLevel)),
    currency: 'shard',
    buy: () => { S.benchLevel++; resite(); lookAt(quarry.x + quarry.w / 2); },
    show: () => S.quarryOpen && benches() < QUARRY_BENCH_MAX
  },
  // And the pace of it, in the same coin. It was dust, and dust is the one
  // thing the quarry has nothing to do with: a place ought to be paid for out
  // of what it gives up, or opening it is a bill with nothing at the end of it.
  {
    key: 'quarrypace',
    name: 'quarry lamps',
    unit: 'trips/min',
    from: () => num(quarryRate()),
    to: () => num(quarryRate(S.quarryPaceLevel + 1)),
    cost: () => Math.round(3 * Math.pow(1.7, S.quarryPaceLevel)),
    currency: 'shard',
    buy: () => S.quarryPaceLevel++,
    show: () => S.quarryOpen && quarryMs() > QUARRY_FLOOR
  },
  // The school is a building you put up, like the lab, and it is priced in what
  // the quarry gives so that the quarry's output has somewhere to go the day it
  // starts arriving.
  {
    key: 'unlockschool',
    name: 'build the school',
    cost: () => SCHOOL_COST,
    currency: 'shard',
    buy: () => { S.schoolOpen = true; lookAt(school.x + school.w / 2); },
    show: () => S.seenShard && !S.schoolOpen
  },
  // The last thing on the ground, and the only one that makes nothing. It is
  // the far end of the walk on purpose, and it is the last core you spend.
  {
    key: 'unlockcasino',
    name: 'build the casino',
    cost: () => CASINO_CORES,
    currency: 'core',
    buy: () => { S.casinoOpen = true; lookAt(casino.x + casino.w / 2); },
    show: () => S.labOpen && !S.casinoOpen
  },
  {
    key: 'unlocklab',
    name: 'build the lab',
    cost: () => 7,
    currency: 'core',
    buy: () => { S.labOpen = true; lookAt(lab.x + lab.w / 2); },
    show: () => S.seenCore && !S.labOpen && (S.seenShard || S.seenSpore)
  },

  // The hole is the one thing you buy that is not a rate. It starts as a scrape
  // and every dig takes the far wall out and the floor down, so what it holds is
  // something you dug rather than something the yard came with. It is priced in
  // the dust it will hold: paying for room comes out of the room you have.
  {
    key: 'dig',
    name: 'dig the pit',
    unit: 'px',
    from: () => pitCapacity(),
    to: () => capacityAt(S.pitLevel + 1),
    // called through, not handed over: the pit and the bench import each other,
    // so a binding read while this list is being built is one that does not
    // exist yet
    cost: () => digCost(),
    buy: () => digPit(),
    show: () => digsLeft() > 0
  },

  FARM,
  // The farm makes the same bargain the quarry does, in the shape a farm makes
  // it. The ground comes with three beds; every one after that is broken with
  // what the beds already in it have grown, and a bed is a place for one body.
  {
    key: 'farmbed',
    name: 'break a bed',
    from: () => bedCount(),
    to: () => bedCount() + 1,
    cost: () => Math.round(BED_COST * Math.pow(BED_RATE, S.bedLevel)),
    currency: 'spore',
    buy: () => { S.bedLevel++; resite(); lookAt(farm.x + farm.w / 2); },
    show: () => S.farmOpen && bedCount() < FARM_BEDS_MAX
  },
  {
    key: 'tend',
    name: 'tending',
    unit: 'beds/min',
    from: () => num(tendRate()),
    to: () => num(tendRate(S.tendLevel + 1)),
    cost: () => Math.round(4 * Math.pow(1.7, S.tendLevel)),
    currency: 'spore',
    buy: () => S.tendLevel++,
    show: () => S.farmOpen && tendMs() > TEND_FLOOR
  }
];

// The order and the grouping on the board. A section with nothing to show in it
// is left out, so rows appear as they are unlocked.
export const SECTIONS = [
  { title: 'you', keys: ['carry', 'auto', 'speed', 'pick'] },
  { title: 'the crew', keys: ['worker', 'haulcarry', 'haulpace'] },
  { title: 'the rock', keys: ['minerpick', 'minerspeed'] },
  { title: 'the quarry', keys: ['unlockquarry', 'quarrybench', 'quarrypace'] },
  { title: 'the farm', keys: ['unlockfarm', 'farmbed', 'tend'] },
  { title: 'the lab', keys: ['unlocklab'] },
  { title: 'the casino', keys: ['unlockcasino'] },
  { title: 'the pit', keys: ['dig'] },
  { title: 'the school', keys: ['unlockschool'] }
];

// What the bench has to say for itself, without opening it. The board is built
// from the same two questions, so a new upgrade or a new section is picked up
// here without this ever being touched.

// the sections that have any row showing right now
export const openSections = () =>
  SECTIONS.filter(sect => sect.keys.some(k => {
    const u = UPGRADES.find(x => x.key === k);
    return u && u.show();
  })).map(sect => sect.title);

// something on the board you could buy this second
export const canAfford = () =>
  UPGRADES.some(u => !u.job && u.show() && purse(u.currency || 'dust') >= u.cost());

// a whole heading you have not seen yet -- worth more of a nudge than one more
// row under a heading you have already read
export const unseenSection = () =>
  openSections().some(title => !S.seenSects.includes(title));

// What the bench is showing without being opened. One place decides it, so the
// drawing and the check that reads it can never drift apart.
export const benchMark = () =>
  !S.seenBench ? '' : unseenSection() ? 'flag' : canAfford() ? 'dot' : '';

// the board has been looked at: every heading on it now counts as read
export function markSectionsSeen() {
  S.seenSects = openSections();
  S.dirty = true;
}

// Buying is the same shape whatever the row and whatever it is priced in: check
// you can afford it, take the price out of wherever that currency is kept, then
// let the row do its one thing.
export function buy(u) {
  if (u.job || u.dial) return;                   // a job row moves bodies and a dial sets a number
  // A row with a payout on it instead of a price is not a purchase: nothing is
  // taken, and what it does is its own business. The casino's two decisions are
  // the only ones in the game.
  if (u.price) { if (u.show() && !u.dead?.()) { u.buy(); S.dirty = true; buildShop(); } return; }
  const cost = u.cost();
  const money = u.currency || 'dust';
  if (!u.show() || purse(money) < cost) return;

  if (money === 'dust') spend(cost);              // lifted back out of the pile
  // everything but dust is one grain in the pile, so paying lifts that many of
  // them back out of it -- the pile always shows exactly what you are holding
  else if (money === 'core') { S.cores -= cost; takeCoreCells(cost, CORE_CELL); }
  else if (money === 'shard') { S.shards -= cost; takeCoreCells(cost, SHARD_CELL); }
  else if (money === 'spore') { S.spores -= cost; takeCoreCells(cost, SPORE_CELL); }

  u.buy();
  S.dirty = true;
  buildShop();
}
