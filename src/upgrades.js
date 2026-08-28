// What the bench sells, and what each thing costs.
//
// One row is one object. Every field is a function of the current game, so a row
// never holds a stale number, and adding an upgrade is adding an object -- no
// other file has to know about it. `SECTIONS` decides the order and the grouping
// on the board.

import {
  CAP_BASE, CAP_STEP, MINE_BASE, MINE_FLOOR, MINER_BASE, MINER_FLOOR,
  HAUL_MS, HAUL_BASE, QUARRY_FLOOR, TEND_FLOOR, SCHOOL_COST,
  QUARRY_BENCH_MAX, FARM_BEDS_MAX, BENCH_COST, BENCH_RATE, BED_COST, BED_RATE,
  QUARRY_DUST, FARM_DUST, LAB_DUST, CASINO_DUST, OUTHOUSE_DUST, UNLOCK_SHOW,
  TOWER_CORES, TOWER_DUST, TOWER_SHARDS, TOWER_SPORES
} from './config.js';
import { scrubCost } from './scrubhouse.js';
import { S, pit, quarry, farm, lab, school, casino, scrub, tower, outhouse } from './state.js';
import { spend, takeCoreCells, pitCapacity, packPit, canPack, packCost, packGain } from './pit.js';
import { CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL } from './config.js';
import { refreshPiles, lookAt, resite, benches, bedCount } from './world.js';
import { syncWorkers } from './crew.js';
import { mult } from './lab.js';
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
  spore: '<i class="spore"></i>',
  spark: '<i class="spark"></i>'
};

// what you have of one
export const purse = money =>
  money === 'core' ? S.cores :
  money === 'shard' ? S.shards :
  money === 'spore' ? S.spores :
  money === 'spark' ? S.sparks :
  S.stored;

// units are the marks themselves: a grain of dust, a grain a second
export const UNITS = {
  'px': '<i class="dust"></i>',
  'px/s': '<i class="dust"></i>/s',
  'trips/min': '<i class="shard"></i>/min',
  'beds/min': '<i class="spore"></i>/min'
};

export const num = v => (v < 10 ? v.toFixed(1) : String(Math.round(v)));

// --- what a row says it gives you -------------------------------------------
// No row on any board states a number the game is keeping. It used to: every
// purchase read `1 -> 1.5` and a unit, which is two numbers and an arrow to say
// one thing, and it asked the player to hold both halves in their head and do
// the subtraction. Worse, it put the game's own bookkeeping on the shelf --
// 1.5 dust a second is a figure that means nothing until you have watched it
// for a minute, and by then you have bought the row anyway.
//
// So a row says what buying it *changes*, and nothing else. The same move the
// sky made when the pollution readout became a mark you look at: the number was
// never the thing, the direction was.
//
// Two shapes, and only two. Something you can count -- a pair of hands, a bench,
// a pixel of reach -- goes up by a whole number and says so. Everything else is
// a rate, and a rate is a proportion of itself: half again as fast is +50%
// whatever it was doing before, which is the one form that stays true at every
// level and never needs a unit explained.
//
// `from` and `to` are still the current value and the value after: the row is
// the only place that knows how its own maths works, and the difference is
// taken here rather than written out by hand thirteen times.
export const gainText = u => {
  if (!u.from) return '';
  const a = Number(u.from()), b = Number(u.to());
  if (!isFinite(a) || !isFinite(b)) return '';
  const mark = u.unit ? ' ' + UNITS[u.unit] : '';
  // A count is a count: one more bench, one more pair of hands, one more pixel
  // of reach. `num` is for rates and puts a decimal on everything under ten,
  // and "+1.0 benches" is a number pretending to be a measurement.
  if (!u.pct) { const d = b - a; return `+${Number.isInteger(d) ? d : num(d)}${mark}`; }
  // A rate stepping onto its floor can gain a real amount and round to nothing.
  // A row that says +0% is a row that reads as broken, so the smallest thing a
  // purchase is ever allowed to claim is one per cent.
  const up = a > 0 ? Math.round((b / a - 1) * 100) : 0;
  return `+${b > a ? Math.max(1, up) : up}%${mark}`;
};


// Hiring and putting to work are two different things now. You buy a body once
// — a core for the first, dust for the next — and it carries dust until you put
// it on something else. A job is a count, not a purchase, so every one of them
// can be taken back the moment you want the dust moving again -- except a body
// that has been to the school, which is the deliberate exception and the reason
// the rule is worth stating out loud. See school.js.
export const JOBS = ['miners', 'quarriers', 'farmhands', 'labbers', 'scrubbers', 'wizards'];

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
                          quarriers: 'blasters', farmhands: 'growers',
                          // and the tower's, which is not a doubling but a
                          // licence: no hat, no flying. See wizard.js.
                          wizards: 'wizardHats' };
// What job a body is doing, from what it is. A trade is counted off the bodies
// now rather than off a number, because a hat is a thing somebody walked over
// and picked up: see crew.js.
export const JOB_OF = { miner: 'miners', hauler: 'haulers', quarrier: 'quarriers',
                        farmhand: 'farmhands', labber: 'labbers',
                        scrubber: 'scrubbers', wizard: 'wizards' };

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
  job === 'farmhands' ? bedCount() :
  // One body in the lab. It is a room with a bench in it, not a floor plan, and
  // research is one thing being looked into at a time -- a second body standing
  // in there was a second pair of hands on a job that has no second pair.
  job === 'labbers' ? 1 :
  // One body in the scrubbing house too, and for the same reason: it is a shed
  // with a fan in it. A second body was a second pair of hands on a machine
  // that runs itself once somebody is standing in it -- the draught it makes is
  // the same draught -- so the extra bodies read as a way to buy a faster sky
  // rather than as a place to be. What makes the sky come down quicker is the
  // recycler and the machine, not a queue inside the shed.
  job === 'scrubbers' ? 1 :
  // One body per hat, and the tower makes them one at a time. This is the only
  // station in the yard whose floor plan is a thing you buy rather than a thing
  // you build: there is as much room in the sky as there are people who can get
  // to it.
  job === 'wizards' ? S.wizardHats : Infinity;
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
  for (const job of ['quarriers', 'farmhands', 'labbers', 'scrubbers', 'wizards'])
    S[job] = Math.min(S[job], capOf(job));
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
// The one thing you hire, and it is bought where the crew live rather than at
// the bench. A hire has always *been* a room -- the settlement is drawn straight
// off the headcount, so taking somebody on is what builds the next one -- and a
// row on the bench selling "workers" was the shop describing that from the far
// end of the yard. Standing at the houses and putting another one up is the same
// purchase with the fiction the game was already drawing.
//
// There is no row for the *first* one. It used to cost a core, and the opening
// hands you a body now -- somebody who was already standing there when the rock
// came down -- so a row selling you the crew you already have is a row that
// could never fire. See intro.js.
export const HOUSE_ROW = {
  key: 'house',
  name: 'another house',
  from: () => S.crew,
  to: () => S.crew + 1,
  // One pool pays for every job now, so the curve is gentler than the four
  // it replaced: 1.7 a body was steep because it was steep four times over,
  // and the same eight bodies came to about 1,500 dust between them.
  cost: () => Math.round(60 * Math.pow(1.35, Math.max(0, S.crew - 1))),
  buy: hire,
  show: () => S.crew > 0
};

// A site is a place, bought once with cores. It comes with nobody in it: who
// works it is the same question as who works the rock.
// A site is a place, bought once. It used to be bought with cores -- one whole
// rock each -- which made the opening four rocks of watching a number climb with
// nothing to do about it but swing, and spent the rarest thing in the game on
// doors. Dust buys the yard now.
const site = ({ key, name, dust, open, at, show }) => ({
  key, name, cost: () => dust,
  buy: () => { S[open] = true; lookAt(at()); },
  show
});

// A door is shown once you are within reach of affording it. Nothing here is
// revealed by a counter passing a mark nobody can see -- and a price you have no
// idea is coming is a price you cannot save for.
const nearly = n => S.stored >= n * UNLOCK_SHOW;

const CAVE = site({
  key: 'unlockquarry', name: 'open the quarry', dust: QUARRY_DUST, open: 'quarryOpen',
  at: () => quarry.x + quarry.w / 2,               // show them what they just bought
  show: () => !S.quarryOpen && nearly(QUARRY_DUST)
});
// One place at a time. Banking a single core used to reveal every site in the
// game at once, which spoils the whole chain: each one is a surprise that the
// last one earns.
const FARM = site({
  key: 'unlockfarm', name: 'break the ground', dust: FARM_DUST, open: 'farmOpen',
  at: () => farm.x + farm.w / 2,
  show: () => S.quarryOpen && !S.farmOpen
});

export const UPGRADES = [
  {
    key: 'carry',
    // The same word the crew's row uses, because it is the same thing: how much
    // a pair of hands lifts in one go. Yours were called "carry" and theirs
    // "load", which is two names for one idea and a player having to learn both.
    name: 'strength',
    unit: 'px',
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
    pct: true,
    from: () => mineRate(S.speedLevel),
    to: () => mineRate(S.speedLevel + 1),
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
    // And the same again for the tool. What you swing and what a miner swings do
    // exactly the same job, so they are the same row under two headings rather
    // than "pick" here and "upgrade pickaxe" over there.
    name: 'upgrade pickaxe',
    unit: 'px',
    from: () => pickCount(),
    to: () => pickCount() + 1,
    cost: () => Math.round(4 * Math.pow(1.55, S.pickLevel)),
    currency: 'shard',
    buy: () => S.pickLevel++,
    show: () => S.seenShard
  },
  // And the crew's is what the crew are fed on. The beds grow the only thing in
  // this yard anybody eats, so what a body can take out of the rock is bought in
  // spores -- which also keeps the green from piling up unspent, and gives the
  // two currencies a job each instead of one of them doing all the work.
  {
    key: 'minerpick',
    // What you are buying is the tool, not the number the tool moves. The row
    // said "miner bite", which is the effect described in the game's own jargon
    // -- a player reads "bite" as a stat and "pickaxe" as a thing you can hold.
    name: 'upgrade pickaxe',
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
    // Two words do the work of every rate on these boards now: a **swing** is a
    // pick hitting rock, and **speed** is how often anything else happens. Each
    // one means one thing, and a row under "the rock" saying "miner" was saying
    // what the heading already said.
    name: 'swing',
    unit: 'px/s',
    pct: true,
    from: () => minerRate(),
    to: () => minerRate(S.minerSpeedLevel + 1),
    cost: () => Math.round(70 * Math.pow(1.8, S.minerSpeedLevel)),
    buy: () => S.minerSpeedLevel++,
    show: () => S.crew > 0 && minerMs() > MINER_FLOOR
  },
  {
    key: 'haulcarry',
    // The heading over these rows already says "the crew", so the rows do not
    // need to say "worker" as well -- and what a body can pick up in one go is
    // its strength rather than its load, which is the thing it is carrying.
    name: 'strength',
    unit: 'px',
    from: () => haulCap(),
    to: () => haulCap(S.haulCarryLevel + 1),
    cost: () => Math.round(50 * Math.pow(1.5, S.haulCarryLevel)),
    buy: () => S.haulCarryLevel++,
    show: () => S.crew > 0
  },
  {
    key: 'haulpace',
    name: 'speed',
    unit: 'px/s',
    pct: true,
    from: () => haulSpeed() * 60,
    to: () => haulSpeed(S.haulPaceLevel + 1) * 60,
    cost: () => Math.round(60 * Math.pow(1.7, S.haulPaceLevel)),
    buy: () => S.haulPaceLevel++,
    show: () => S.crew > 0
  },
  CAVE,
  // Growing a place you already have does not move the view.
  //
  // Opening one does, and should: four cores and a row in a menu, and the thing
  // bought is off the left of the screen -- without the glide, nothing appears
  // to happen. A bench or a bed is not that. You are standing at the bench with
  // the board open, buying the next one and the one after that, and the view
  // walking off to the far end of the yard between each of them is the game
  // taking the board out from under you to show you something you have already
  // seen. Nothing here is a surprise worth interrupting for.
  //
  // The cut's own two rows -- how deep it goes and how fast it works -- are on
  // a board at the cut now, along with the farm's at the farm. See quarry.js.
  // The school is a building you put up, like the lab, and it is priced in what
  // the quarry gives so that the quarry's output has somewhere to go the day it
  // starts arriving.
  {
    key: 'unlockschool',
    name: 'build the training grounds',
    cost: () => SCHOOL_COST,
    currency: 'shard',
    buy: () => { S.schoolOpen = true; lookAt(school.x + school.w / 2); },
    show: () => S.seenShard && !S.schoolOpen
  },
  // The one building that undoes something instead of making something. It is
  // offered the first time the sky is visibly dirty rather than on a schedule:
  // the haze is the advertisement, and a row selling you a cure for a thing you
  // have not noticed yet is a row that means nothing.
  {
    key: 'unlockscrub',
    name: 'build the scrubbing house',
    note: () => 'somebody in it pulls the haze back out of the sky, before it falls again',
    cost: () => scrubCost(),
    // and the ground under its spout becomes a station's strip the moment it is
    // up: what the house makes has to have somewhere of its own to heap.
    buy: () => { S.scrubOpen = true; refreshPiles(); lookAt(scrub.x + scrub.w / 2); },
    // Offered after the first rain, and after the lab has been told to watch the
    // sky. Two things have to have happened, in that order, and neither of them
    // is a threshold quietly passing somewhere.
    //
    // The rain is the problem arriving. Until it has come down once, the haze
    // overhead is a thing you have noticed and not a thing that has cost you
    // anything, and a cure sold before the disease is a cure for a number.
    //
    // The readout is you going and looking into it. It is the one piece of
    // research in the lab that is not a multiplier: it tells you how fast the yard
    // fouls, how fast a house would clean, and how long you have. Making it the
    // key to the building means you buy the house knowing what it has to keep up
    // with -- and it means the answer to a bad sky is a walk to the lab first,
    // which is what the lab is for.
    //
    // It was a share of the way to a downpour before, which is a threshold nobody
    // can see passing, and at a quarter it was twenty minutes of honest work: a
    // quarter of an hour watching the sky dirty with nothing on any board about
    // it, which reads as the game not having noticed.
    show: () => !S.scrubOpen && S.rains > 0 && S.seenAir
  },
  // The last thing on the ground, and the only one that makes nothing. It is
  // the far end of the walk on purpose, and it is the last core you spend.
  // Somewhere to go. What it does is not remove the mess -- a shed with a hole
  // under it is not a drain -- it *gathers* it: the crew stop leaving one wherever
  // they were working and leave it all in one place instead, which is one patch
  // to shovel rather than a yard of them. The tower deals with the rest, later.
  {
    key: 'unlockouthouse',
    name: 'build the outhouse',
    note: () => 'the crew go here instead of wherever they are standing',
    cost: () => OUTHOUSE_DUST,
    buy: () => { S.outhouseOpen = true; lookAt(outhouse.x + outhouse.w / 2); },
    // Offered once you have seen why you want one.
    show: () => !S.outhouseOpen && S.crew > 1 && nearly(OUTHOUSE_DUST)
  },
  // The one thing a core buys, and the only row in the game with a bill rather
  // than a price. A core out of the rock, the dust the yard makes, the stone the
  // cut gives up and the crop off the beds: everything the operation does, on
  // one row. You cannot buy it by being good at one thing.
  {
    key: 'unlocktower',
    name: 'raise the tower',
    note: () => 'what a core is for',
    bill: () => [['core', TOWER_CORES], ['dust', TOWER_DUST],
                 ['shard', TOWER_SHARDS], ['spore', TOWER_SPORES]],
    cost: () => TOWER_DUST,                      // for anything that asks in one coin
    buy: () => { S.towerOpen = true; lookAt(tower.x + tower.w / 2); },
    // Not offered until a core exists to spend. Before that it is a row asking
    // for a thing the game has not shown you yet.
    show: () => !S.towerOpen && S.seenCore
  },
  {
    key: 'unlockcasino',
    name: 'build the casino',
    cost: () => CASINO_DUST,
    buy: () => { S.casinoOpen = true; lookAt(casino.x + casino.w / 2); },
    show: () => S.labOpen && !S.casinoOpen
  },
  {
    key: 'unlocklab',
    name: 'build the lab',
    cost: () => LAB_DUST,
    buy: () => { S.labOpen = true; lookAt(lab.x + lab.w / 2); },
    // Still behind the cut or the beds: the lab multiplies what a place does, so
    // it means nothing until there is a second place for it to be about.
    show: () => !S.labOpen && (S.seenShard || S.seenSpore)
  },

  // The hole is not something you buy any more. It is the whole pit from the
  // first frame -- see pit.js: what you could hold used to be what you had dug,
  // which made a hole in the ground the ceiling on every other price in the game.
  //
  // What you can buy is how *finely* it holds it, which is a different thing:
  // the hole stays the hole and the dust in it gets smaller. It is the one row
  // on this board bought with red, and the only one where a wizard does
  // something to the ground.
  {
    key: 'packpile',
    name: 'press the pile',
    note: () => `the hole holds ${packGain()} times as much, in the same hole`,
    cost: () => packCost(),
    currency: 'spark',
    buy: () => { packPit(); lookAt(pit.x + pit.w / 2); },
    // Once there is red to spend it on and there is a finer grain left to go to.
    show: () => S.seenSpark && canPack()
  },

  FARM
];

// The order and the grouping on the board. A section with nothing to show in it
// is left out, so rows appear as they are unlocked.
export const SECTIONS = [
  { title: 'you', keys: ['carry', 'auto', 'speed', 'pick'] },
  { title: 'the crew', keys: ['haulcarry', 'haulpace'] },
  { title: 'the rock', keys: ['minerpick', 'minerspeed'] },
  { title: 'the quarry', keys: ['unlockquarry'] },
  { title: 'the farm', keys: ['unlockfarm'] },
  { title: 'the lab', keys: ['unlocklab'] },
  { title: 'the casino', keys: ['unlockcasino'] },
  { title: 'the outhouse', keys: ['unlockouthouse'] },
  { title: 'the tower', keys: ['unlocktower'] },
  { title: 'the training grounds', keys: ['unlockschool'] },
  { title: 'the scrubbing house', keys: ['unlockscrub'] },
  { title: 'the hole', keys: ['packpile'] }
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
  UPGRADES.some(u => !u.job && u.show() && canPay(u));

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
// Take one currency out of wherever it is kept. Dust is lifted back out of the
// pile; everything else is one grain in that pile, so paying lifts that many of
// them out of it -- the pile always shows exactly what you are holding.
function take(money, n) {
  if (!n) return;
  if (money === 'dust') spend(n);
  else if (money === 'core') { S.cores -= n; takeCoreCells(n, CORE_CELL); }
  else if (money === 'shard') { S.shards -= n; takeCoreCells(n, SHARD_CELL); }
  else if (money === 'spore') { S.spores -= n; takeCoreCells(n, SPORE_CELL); }
  // Nothing is priced in sparks yet. It is here so that the day something is,
  // paying for it takes the red grains out of the pile like every other coin --
  // a currency the pile does not know about would be the one number in this
  // game that is not a thing you can see lying in the hole.
  else if (money === 'spark') { S.sparks -= n; takeCoreCells(n, SPARK_CELL); }
}

// What a row costs, as a currency and an amount each. Almost every row in the
// game is priced in one thing and says so with `cost` and `currency`; the tower
// is priced in all four at once and says so with `bill`. One shape here means
// the affording, the paying and the drawing all read a price the same way
// whichever kind it is.
export const billOf = u => u.bill ? u.bill() : [[u.currency || 'dust', u.cost()]];

export const canPay = u => billOf(u).every(([money, n]) => purse(money) >= n);

export function buy(u) {
  if (u.job || u.dial) return;                   // a job row moves bodies and a dial sets a number
  // A row with a payout on it instead of a price is not a purchase: nothing is
  // taken, and what it does is its own business. The casino's two decisions are
  // the only ones in the game.
  if (u.price) { if (u.show() && !u.dead?.()) { u.buy(); S.dirty = true; buildShop(); } return; }
  // A row that is greyed out for a reason of its own -- the tower already has a
  // hat on the go -- takes nothing and does nothing. Without this the money went
  // and the row shrugged.
  if (!u.show() || u.dead?.() || !canPay(u)) return;
  // Nothing is taken until all of it can be: a bill you can half afford would
  // leave you with less of everything and none of the thing.
  for (const [money, n] of billOf(u)) take(money, n);

  u.buy();
  S.dirty = true;
  buildShop();
}
