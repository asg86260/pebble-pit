// What the bench sells, and what each thing costs.
//
// One row is one object. Every field is a function of the current game, so a row
// never holds a stale number, and adding an upgrade is adding an object -- no
// other file has to know about it. `SECTIONS` decides the order and the grouping
// on the board.

import {
  CAP_BASE, CAP_STEP, RUNGS, LOO_MUCK, MINE_BASE, MINE_FLOOR, MINER_BASE, MINER_FLOOR,
  HAUL_MS, HAUL_BASE, QUARRY_FLOOR, TEND_FLOOR, SCHOOL_COST,
  QUARRY_BENCH_MAX, FARM_PLOTS_MAX, BENCH_COST, BENCH_RATE, PLOT_COST, PLOT_RATE,
  QUARRY_DUST, FARM_DUST, LAB_DUST, CASINO_DUST, OUTHOUSE_DUST, UNLOCK_SHOW,
  TOWER_CORES, TOWER_DUST
} from './config.js';
import { scrubCost } from './scrubhouse.js';
import { labRooms } from './lab.js';
import { poopLeft } from './smog.js';
import { S, pit, quarry, farm, lab, school, casino, scrub, tower, outhouse } from './state.js';
import { spend, takeCoreCells, pitCapacity, packPit, canPack, packCost, packGain } from './pit.js';
import { CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL,
         FARM_CORES, QUARRY_CORES, COMMUTE_PACE, HAUL_EMPTY } from './config.js';
import { refreshPiles, lookAt, resite, benches, plotCount } from './world.js';
import { machineFor, buyMachine, canBuy, MACHINES, running, machine, JOB_MACHINE } from './machines.js';
import { MACHINE_GAIN, ROCK_GANG, LIP_GANG, RAM_BILL, BELT_BILL,
         SPELL_DRIVE, SPELL_THRIFT } from './config.js';
import { spelled } from './tower.js';
import { makeMeteor } from './meteor.js';
import { syncWorkers } from './crew.js';
import { mult } from './lab.js';
import { buildShop } from './shop.js';

// Every swing in the game is the same shape: a gap in milliseconds that shrinks
// by a fixed fraction per level and never goes below a floor. One function, five
// swings -- the next kind of worker gets its speed for a line.
// A rate ladder, from what it starts at down to the fastest it will ever go, in
// a fixed number of rungs -- so the last rung *is* the floor.
//
// It used to be a fraction a level for ever: multiply by 0.8 and clamp at the
// floor. Which meant the row reached the floor at some level nobody had written
// down, and then vanished off the board -- a cap the game had and would not
// admit to. Spread across the rungs instead, the last one lands exactly on the
// floor and the row says "5 of 5" and stays there.
//
// Eased rather than even: the first rungs are worth more than the last, which is
// how a rate reads -- going from a swing a second to two is a different feeling
// from going from nine to ten, and paying the same for both is what makes a
// long tail of upgrades feel like nothing is happening.
export const swing = (base, floor, rungs) => lvl => {
  const k = Math.max(0, Math.min(1, lvl / rungs));
  return Math.round(base + (floor - base) * (1 - Math.pow(1 - k, 1.6)));
};
const perSecond = ms => lvl => 1000 / ms(lvl);

export const capacity = () => CAP_BASE + S.carryLevel * CAP_STEP;

// What one rung costs, from what the first one costs.
//
// Half again a rung, so the top of a ladder is about six times the bottom of it.
// The old prices doubled and worse -- 1.9 a level on the swing -- which is the
// arithmetic of a row meant to be bought for ever: the exponent, not the game,
// decides when you stop. A ladder with an end does not need the price to be the
// wall, because the end is the wall, so a rung can stay affordable enough to be
// worth reading all the way up.
export const rungCost = (first, lvl) => Math.round(first * Math.pow(1.6, lvl));

// Where a row is on its ladder, and whether it is at the top of it. A row with
// no `rung` is not a ladder at all -- a building, a one-off, a job -- and is
// never finished.
export const rungOf = u => (u.rung ? u.rung() : 0);
// How long this row's ladder is. `RUNGS` unless the row says otherwise, which is
// one row in the game and its argument is over `KIT_MAX`: the kit ladders are
// three rungs, and a board drawing five pips over a ladder that ends at three is
// a board promising two purchases that do not exist.
//
// Read through one function rather than compared against `RUNGS` at each of the
// four places that ask -- the pips, the count under them, "done", and the fold
// -- because a cap only half of them know about is a row that says 3/5 and
// cannot be bought.
export const rungsOf = u => (u.rungs ? u.rungs() : RUNGS);
export const maxed = u => !!u.rung && rungOf(u) >= rungsOf(u);

// Whether a finished row may be folded off its board by "finished: hidden".
//
// Nearly all of them may, which is the whole point of the switch: a rate you
// have taken to its floor has nothing left to say and is in the way of the rows
// that do. A kit row is the exception and says so with `keep`.
//
// The argument is the school board's own, and it was written down long before
// there was a switch that could take it away: a row in this game says what
// buying it *gives* you and what it costs, and never what you already have --
// which leaves the kit rows as the only place in the game to read how many
// helmets are on the rock, and that is the whole question at the school. Fold a
// finished kit row away and the board loses the fact it exists to carry, right
// at the moment the fact becomes final.
//
// It became reachable when the kit got a ceiling. Before that these rows had no
// ladder, so `maxed` was never true of them and the switch could never see them
// -- and a three-rung ladder is finished quickly, so what the player sees is a
// row they have just bought vanishing under their hand.
export const folds = u => maxed(u) && !u.keep;

// Five rungs to every ladder in the game -- see RUNGS -- so that "how far along
// is this" is one question with one answer wherever it is asked.
const mineGap = swing(MINE_BASE, MINE_FLOOR, RUNGS);
const minerGap = swing(MINER_BASE, MINER_FLOOR, RUNGS);
const scoopGap = swing(HAUL_MS, 30, RUNGS);

export const mineMs = (lvl = S.speedLevel) => Math.max(1, mineGap(lvl) / mult('swing'));
export const mineRate = (lvl = S.speedLevel) => 1000 / mineMs(lvl);
export const minerMs = (lvl = S.minerSpeedLevel) => Math.max(1, minerGap(lvl) / mult('swing'));
export const minerRate = (lvl = S.minerSpeedLevel) => 1000 / minerMs(lvl);
// What a pair of hands carries: what it can hold, and then what it can hold
// *with something to hold it in*. The harness is the second tier -- bought with
// stone out of the quarry, because gear is what stone is for.
export const haulCap = (lvl = S.haulCarryLevel, gear = S.harnessLevel) => 1 + lvl + gear * 2;
export const haulSpeed = (lvl = S.haulPaceLevel, gear = S.bootsLevel) =>
  HAUL_BASE * (1 + 0.3 * lvl + 0.45 * gear) * mult('haul');
export const scoopMs = (lvl = S.haulPaceLevel) => Math.max(1, scoopGap(lvl) / mult('haul'));
// A trip's pace, for anybody making one. It lived in crew.js, and the stations
// could not reach it -- crew.js imports them -- so each grew a private walking
// speed tuned for its own few feet of ground: FARM_WALK for stepping to the
// next plot, QUARRY_WALK for shuffling in the cut. Both were then used for
// whole commutes, and a farmhand carried across the world by a shovelling
// errand came home at a plot-shuffle: sixty-five pixels a second, ninety-five
// seconds of crawling, cured by picking the body up and dropping it. A trip is
// a trip, whoever makes it.
export const commutePace = () => Math.max(COMMUTE_PACE, haulSpeed() * HAUL_EMPTY);
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
  spark: '<i class="spark"></i>',
  // Time is a price like the rest of them. Something that takes two minutes
  // costs you two minutes, and a row that said so in a note was a row you had to
  // open a second sheet beside to read one number off. It goes in the bill with
  // the coins, under a clock, and reads the same way they do.
  time: '<i class="clock"></i>'
};

// what you have of one. Time is the exception and always will be: you cannot be
// short of it, so a bill that asks for it is never the reason a row is out of
// reach and the clock on it is never greyed.
export const purse = money =>
  money === 'time' ? Infinity :
  money === 'core' ? S.cores :
  money === 'shard' ? S.shards :
  money === 'spore' ? S.spores :
  money === 'spark' ? S.sparks :
  S.stored;

// units are the marks themselves: a grain of dust, a grain a second
//
// Only the ones the yard has a coin for. A unit measured in something you cannot
// hold -- work at the bench, motes through the fan, bolts off a wand -- is
// written out in the words the row already names it by. See `gainText`: this
// table says what a unit is *drawn* as, not which units exist, and a row naming
// one that is not in here used to have the lookup itself put on the board.
export const UNITS = {
  'px': '<i class="dust"></i>',
  'px/s': '<i class="dust"></i>/s',
  'trips/min': '<i class="shard"></i>/min',
  'plots/min': '<i class="spore"></i>/min'
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
  // The mark if the yard has one for it, and the row's own word if it has not.
  // Four rows name a unit no coin stands for -- the lab's work, the fan's motes,
  // the tower's bolts and the cells one takes off a star -- and what the board
  // printed for all four was the failed lookup: "better instruments, +25%
  // undefined". A missing mark is a unit to write out, not a row to break.
  const mark = u.unit ? ' ' + (UNITS[u.unit] || u.unit) : '';
  // A count says what it is now and what it would be. "+1" tells you what the
  // row does and nothing about whether it is worth it: going from one to two is
  // doubling what you can carry, and going from eleven to twelve is not, and the
  // row read identically either way. The number you have is the one thing the
  // board could not tell you and the yard could not either -- it is on your
  // cursor, not on a counter.
  //
  // Counts only. A rate is already a comparison -- it says what share it adds --
  // and "2.4/s -> 3.1/s" in a column this wide is two numbers where one will do.
  // `num` is for rates and puts a decimal on everything under ten, so "+1.0
  // benches" is a number pretending to be a measurement.
  if (!u.pct) {
    const say = v => (Number.isInteger(v) ? v : num(v));
    return `${say(a)} → ${say(b)}${mark}`;
  }
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
export const JOBS = ['miners', 'quarriers', 'farmhands', 'labbers', 'scrubbers', 'janitors', 'wizards'];

// Bodies with nothing else to do. They are the haulers, always: every body in
// the yard can be moved to every job, and nothing you buy changes that.
export const spareHands = () => S.crew - JOBS.reduce((n, j) => n + S[j], 0);
export const idle = () => spareHands();

// --- the kit ----------------------------------------------------------------
// What the school sells is not a person, it is a hat -- and a hat belongs to the
// station, not to the head that happens to be under it. Buying one used to
// upgrade a body and nail it to the post for good, which is a decision you make
// once and then live with for the rest of the run: thirteen carters is thirteen
// bodies that cannot go and work a plot.
//
// So the kit stays where the work is. Whoever is standing at the rock picks up
// whatever helmets are lying on it, and a helmet nobody is wearing lies there
// waiting for the next body sent over. Move everybody off and the hats stay
// behind; move somebody back and they are wearing one before they get there.
// Nothing is ever wasted and nothing is ever locked.
// Which station owns which hats, and what job a body is doing from what it is.
// Both live in kit.js now, with the shape of the hat and the rest of what a hat
// is, and are passed straight through here: the shop asks about a trade, and a
// trade is a fact about a hat.
import { TRADE_OF, JOB_OF, stockOf, hasKit, kitSetOf } from './kit.js';
export { TRADE_OF, JOB_OF };

// hats the station owns, hats actually on heads, and hats lying on the ground
// there waiting for somebody to come and get them
//
// Where those hats came from is the kit table's business and not the shop's:
// most stations buy theirs a trade at a time, the closet simply has its caps,
// and `stockOf` is the one place that knows the difference. Everything from here
// down -- `spareKit`, `kitFull`, the errand, the stand, the roster's second line
// -- is written against this number and cannot tell the two apart.
export const hats = stockOf;
// Counted off `kitOf` -- whose kit it is -- and not off the job the body is on.
// Those two agree except for the length of a walk back, and reading the job was
// how a helmet came to be counted twice: a body moved from the rock to carrying
// keeps the helmet on its head until it has walked it to the stand, and while it
// did, `JOB_OF` said hauler, the rock counted nobody wearing its kit, and the
// rock put a helmet it did not have out on the stand for the next body along.
// The hat is on a head. That is the fact, and this is the count of it.
export const worn = job => S.workers.filter(w => w.trained && w.kitOf === job).length;
// Kit knocked off a head and lying loose in the yard is the station's, but it
// is not ON THE STAND: until its owner picks it back up (or hands it in) nobody
// else can be sent to wear it. Without this a shaken carter's cart was counted
// spare while it lay on the ground, a second hauler fetched a phantom from an
// empty stand, and when the first recovered its real cart the books read one
// too many and marched it straight back.
export const loose = job => S.workers.filter(w => w.hatOff && w.hatOff.of === job).length;
export const spareKit = job => Math.max(0, hats(job) - worn(job) - loose(job));

// How many bodies a station has room for. Two of them have a floor plan: a cut
// holds one body per bench and a plot holds one per plot, and there is nowhere
// else down there to put anybody. That is what makes the quarry and the farm
// worth what they give up the moment they open -- a shard buys the third body
// somewhere to stand, and a spore buys the fourth a plot -- and it is why the
// plus button under either of them goes pale with hands still spare.
//
// The rock and the lab have no such plan: a rock is as long as it is and a room
// holds who it holds.
// What a station's floor plan says it holds. One table, read by both questions
// below, because a second hand-kept copy of it is precisely the bug `rebalance`
// was fixed for one screen down: the copy that gets forgotten is the one that
// matters.
const capOfBare = job =>
  job === 'quarriers' ? benches() :
  job === 'farmhands' ? plotCount() :
  // One body in the lab. It is a room with a bench in it, not a floor plan, and
  // research is one thing being looked into at a time -- a second body standing
  // in there was a second pair of hands on a job that has no second pair.
  // One body per bench. It has always been one, and the note below is still the
  // argument for it -- research is one thing being looked into at a time, and a
  // second pair of hands on *one* bench is a queue. What the second bench buys
  // is a second *thing*, not a second helper.
  job === 'labbers' ? labRooms() :
  // One body in the scrubbing house too, and for the same reason: it is a shed
  // with a fan in it. A second body was a second pair of hands on a machine
  // that runs itself once somebody is standing in it -- the draught it makes is
  // the same draught -- so the extra bodies read as a way to buy a faster sky
  // rather than as a place to be. What makes the sky come down quicker is the
  // recycler and the machine, not a queue inside the shed.
  //
  // This is also the argument for the machines, word for word. See `capOf`.
  job === 'scrubbers' ? 1 :
  // Shovelling up after everybody is a job once there is a shed to gather it
  // under. Before that the mess is the yard's problem and nobody is on it -- see
  // `takeMuck` -- so there is nowhere to put a body even if you wanted to.
  //
  // More than one of them, because unlike the shed jobs this one is not a room
  // with a bench in it: it is the whole yard, and a yard the length of this one
  // is more ground than one pair of hands can keep up with.
  //
  // How many is `LOO_POSTS`, and the closet hangs a cap on its stand for each --
  // which is why this reads the kit table rather than the number itself. A post
  // and the cap that goes with it are one thing the shed opens, and two places
  // counting it separately is exactly how you get a body sent to a job with
  // nothing on the stand to pick up.
  job === 'janitors' ? hats('janitors') :
  // One body per hat, and the tower makes them one at a time. This is the only
  // station in the yard whose floor plan is a thing you buy rather than a thing
  // you build: there is as much room in the sky as there are people who can get
  // to it.
  job === 'wizards' ? S.wizardHats :
  // The rock and the lip have no plan: a rock is as long as it is, and carrying
  // is what a body does when it is on nothing at all.
  Infinity;

// Where a body may be put, which is the floor plan unless a machine has the
// station.
//
// A station being worked by a machine holds one body: the tender. That is the
// scrubbing house's rule and its comment above is the argument for it word for
// word -- a machine runs itself once somebody is standing in it, and a second
// pair of hands is a queue rather than a place to be.
//
// It reads the lever (`on`) and not whether anybody is actually standing there.
// That distinction is the whole of why this works: a cap derived from "is it
// manned" would flip every time the tender walked off to shovel, and `rebalance`
// would thrash the gang between the station and carrying, twice a minute, for
// ever.
export const capOf = job => machineFor(job) ? 1 : capOfBare(job);

export const roomAt = job => capOf(job) - S[job];

// What the station could hold by hand -- its complement, before it was given a
// machine. `capOf` answers 1 while a machine runs, which is the right answer to
// "where can I put a body" and the wrong one to "what is this machine standing
// in for", so the two questions get two functions.
//
// The rock is the one station with no floor plan to read: `capOf('miners')` is
// `Infinity` and should stay that way. Its complement is `ROCK_GANG`, a named
// constant in config with its reasoning over it.
// What the station could hold by hand -- its complement, before it was given a
// machine. `capOf` answers 1 while a machine runs, which is the right answer to
// "where can I put a body" and the wrong one to "what is this machine standing
// in for", so the two questions get two functions off the one table.
//
// The rock is the one station with a machine and no floor plan to read, so its
// complement is `ROCK_GANG` -- a named constant in config with its reasoning
// over it. Every *other* plan-less job keeps `Infinity` and is reported as
// having no complement at all, rather than being quietly handed the rock's: the
// lip has no machine and no floor plan, and a roster claiming carrying holds
// five would be a number with nothing behind it.
export const handsOf = job =>
  job === 'miners' ? ROCK_GANG :
  // Carrying has no floor plan either, and for a different reason: it is not a
  // place at all. It is what a body does when it is on nothing, so "how many fit"
  // is the whole crew, and what the belt stands in for is a full complement of
  // carriers.
  job === 'haulers' ? LIP_GANG :
  capOfBare(job);


// What a full set of a station's kit is: its trade's own set (`KIT_MAX`, for the
// four the school sells), or its whole complement if it holds fewer hands than
// that. The second half is what keeps a small station honest -- the closet's two
// posts are fully kitted at two, and asking it for a third cap would be asking
// for a cap with no head to go under.
//
// Read off `kitSetOf` rather than the board's ceiling. The two are the same
// number everywhere but the lip, where the cart row has no ceiling and a set is
// still three -- see the note over `kitSetOf`.
export const kitCap = job => Math.min(handsOf(job), kitSetOf(job));

// Whether a station's kit is complete: every hat it will ever own, bought.
//
// It used to be a hat for every pair of hands -- which is a gate that recedes as
// you walk at it, because the hands are themselves a thing you buy. Deepening
// the cut moved the jaw further away; breaking another furrow moved the tiller.
// The ceiling is a number now (see `KIT_MAX`), so a set is a set.
export const kitFull = job => hasKit(job) && hats(job) >= kitCap(job);

// What the station's gang is worth, in bare pairs of hands.
//
// A hat is a flat doubling wherever one is worn -- twice the bite on the rock,
// twice the pace at a cell, twice the tending on a plot, twice the load at the
// lip -- so a hatted body counts twice and a bare one counts once, and the gang
// is the complement plus however many of it are hatted.
//
// This is a sum rather than a multiplier now, and it has to be: with kit capped
// below the complement there is no longer one number that describes every body
// at the station. Five hands and three helmets is eight, not five-times-
// anything, and rounding it to "fully kitted" or "bare" is what would make a
// machine either a bargain or a downgrade depending on which way it rounded.
//
// A station whose machine took its kit is counted at a full set whatever its hat
// count says, and has to be: the machine was gated behind a full set and then
// *took* them -- see `buyMachine` -- so reading the station afterwards would
// find nought hats and quietly shrink the thing you had just bought.
export const gangWorth = job => {
  const n = handsOf(job);
  if (!isFinite(n)) return n;
  const m = machineFor(job) || (JOB_MACHINE[job] && machine(JOB_MACHINE[job]));
  const hatted = (m && m.bought && m.tookKit) ? kitCap(job) : Math.min(hats(job), n);
  return n + hatted;
};

// The same thing per pair of hands, for anybody who wants it as a multiplier.
export const kitMult = job => gangWorth(job) / handsOf(job);

// What the machine is worth, in hands, at this station.
//
// It reads the hats, and this is the correction that makes the whole upgrade
// path hold together. It used to read the ladders only, on the argument that a
// machine should not be able to arrive at fifteen hands off kit you happened to
// have bought -- which was the right worry about the wrong thing. What it
// actually produced was a machine that was a *downgrade*: a fully-hatted cut of
// five is worth ten hands, and the jaw at complement-times-one-and-a-half was
// worth seven and a half. You paid fifty sparks to make the quarry slower.
//
// And it made the specialists obsolete at a stroke. A machine caps its station
// at one body, so every hat you had bought went in a drawer the moment you threw
// the lever, and the whole trade ladder stopped being worth finishing.
//
// So the gate is a full set of hats -- `KIT_MAX` of them, see `canBuy` -- and the
// rate is measured against the gang that set of hats made, which is `gangWorth`
// and is a sum rather than a multiple now that a set is smaller than a
// complement. The specialists become the thing you finish *before* the machine,
// and the machine is worth half again what they were, which is what MACHINE_GAIN
// has meant all along.
export const machineRate = job =>
  gangWorth(job) * MACHINE_GAIN
  * (machineFor(job)?.driven ? 2 : 1)
  // and the tower's, if the yard has been enchanted
  * (spelled('drive') ? SPELL_DRIVE : 1);

// Put a gang back where a machine displaced it.
//
// `rebalance` only ever clamps *down*: when the lever went on it walked the
// surplus to carrying, and nothing walks them home again. So throwing the lever
// off has to ask for them back, or every "off" costs five clicks on the roster
// and nobody ever throws the lever twice.
//
// It restores a complement; it does not conjure bodies. If the hands have since
// been sent down the quarry or up the tower, what comes back is whatever was
// idle, and no more.
export function restaff(job, want) {
  // `want` of nought is the other direction: a machine has just been switched
  // *on* and all this has to do is let `rebalance` clamp the station down to the
  // one tender. Same latch, same drain, one function.
  const room = Math.max(0, Math.min(want, capOf(job)) - S[job]);
  if (room > 0) S[job] += Math.min(room, Math.max(0, idle()));
  rebalance();
  syncWorkers();
  S.dirty = true;
}

// `haulers` is a fact on S rather than a sum worked out where it is read, so
// that the crew code can treat it like any other job. This is the one place it
// is set, and every path that moves a body goes through here.

// A station whose machine took its kit owns no hats. Zeroed here rather than in
// `buyMachine`, because this is the one place allowed to move counts about --
// and because a save from before the machines existed can arrive with both a
// machine and a full set, which is the same tidy-up.
//
// Nothing else is needed to make it read: `stepKit` finds heads wearing kit the
// station does not own and walks each one over to hand it in.
function stripKit() {
  for (const m of MACHINES) {
    const r = machine(m.key);
    if (!r || !r.bought || !r.tookKit) continue;
    const trade = TRADE_OF[m.job];
    if (trade && S[trade] > 0) { S[trade] = 0; S.dirty = true; }
  }
}

// Nothing staffs itself.
//
// The lab and the scrubbing house used to take a body when there was work and
// give it back when there was not, on the argument that each is one room with
// one job and the choice made itself. It does not: what that setting decides is
// whether the station runs at all, and a building quietly taking a pair of hands
// off the rock -- or handing them back mid-shift -- is the yard overruling the
// roster. Both are on the roster again and both stay where they are put.
export function staffSheds() {
  stripKit();
}

export function rebalance() {
  // Hats are not clamped to bodies. A station may own more of them than it has
  // people standing at it -- that is the whole point of the kit belonging to the
  // place -- so the only rule left is that a count of hats is not negative.
  // A station cannot hold more bodies than it has places to stand. Nothing the
  // player can do breaks that either, but a save from a wider plot can, and the
  // ones that do not fit go back to carrying dust rather than standing in each
  // other at a plot that is not there.
  // Over `JOBS`, not over a hand-kept copy of it. The list used to be written out
  // here with `miners` deliberately left off, because `capOf('miners')` is
  // `Infinity` and clamping to it is a no-op -- which was true right up until the
  // ram made it finite, and then the one job the list omitted was the one job
  // that needed clamping and nothing walked the gang off the rock. A no-op for
  // six of the seven is a cheaper thing to carry than a second copy of a list
  // that is declared eighty lines up.
  for (const job of JOBS) S[job] = Math.min(S[job], capOf(job));
  for (const job of Object.keys(TRADE_OF)) S[TRADE_OF[job]] = Math.max(0, S[TRADE_OF[job]]);
  // and no ladder past its top, whatever a save says
  for (const k of ['carryLevel', 'speedLevel', 'pickLevel', 'minerPickLevel',
                   'minerSpeedLevel', 'haulCarryLevel', 'haulPaceLevel',
                   'harnessLevel', 'bootsLevel'])
    S[k] = Math.max(0, Math.min(RUNGS, S[k] || 0));
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
// sells things, and moving somebody from the plots to the rock was never a
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
  cost: () => Math.round(60 * Math.pow(1.35, Math.max(0, S.crew - 1))
                         * (spelled('thrift') ? SPELL_THRIFT : 1)),
  buy: hire,
  show: () => S.crew > 0
};

// A site is a place, bought once with cores. It comes with nobody in it: who
// works it is the same question as who works the rock.
// A site is a place, bought once. It used to be bought with cores -- one whole
// rock each -- which made the opening four rocks of watching a number climb with
// nothing to do about it but swing, and spent the rarest thing in the game on
// doors. Dust buys the yard now.
// A place costs a core *and* dust. The core is what says this is a place rather
// than a rung -- see the tier table in DESIGN.md -- and the dust is what keeps
// the rock worth digging after it, which every bill above tier one does.
const site = ({ key, name, cores, dust, open, at, show }) => ({
  key, name,
  bill: () => [['core', cores], ['dust', dust]],
  buy: () => { S[open] = true; lookAt(at()); },
  show
});

// A door is shown once you are within reach of affording it. Nothing here is
// revealed by a counter passing a mark nobody can see -- and a price you have no
// idea is coming is a price you cannot save for.
const nearly = n => S.stored >= n * UNLOCK_SHOW;
// ...and a place is only worth showing once a core has been seen at all, because
// until then the price is in a currency you have no idea exists.
const seenACore = () => S.seenCore;

const FARM = site({
  key: 'unlockfarm', name: 'break the ground',
  cores: FARM_CORES, dust: FARM_DUST, open: 'farmOpen',
  at: () => farm.x + farm.w / 2,                   // show them what they just bought
  show: () => !S.farmOpen && seenACore() && nearly(FARM_DUST)
});
// One place at a time. Banking a single core used to reveal every site in the
// game at once, which spoils the whole chain: each one is a surprise that the
// last one earns.
//
// And the plots earn the quarry, rather than the other way round: a crop feeds a
// body and a body swings a pick, so the place that makes bodies stronger opens
// before the place that gives them better tools.
const CAVE = site({
  key: 'unlockquarry', name: 'open the quarry',
  cores: QUARRY_CORES, dust: QUARRY_DUST, open: 'quarryOpen',
  at: () => quarry.x + quarry.w / 2,
  show: () => S.farmOpen && !S.quarryOpen
});

export const UPGRADES = [
  {
    key: 'carry',
    // The same word the crew's row uses, because it is the same thing: how much
    // a pair of hands lifts in one go. Yours were called "carry" and theirs
    // "load", which is two names for one idea and a player having to learn both.
    name: 'strength',
    unit: 'px',
    rung: () => S.carryLevel,
    from: () => capacity(),
    to: () => capacity() + CAP_STEP,
    cost: () => rungCost(8, S.carryLevel),
    buy: () => S.carryLevel++,
    show: () => true
  },
  {
    // The rock's machine, and the only one of the three sold from the bench --
    // because the rock is the one station with no board of its own, its two kit
    // rows having always lived here under 'the rock'.
    //
    // Its gate is those two rows bought right out. The cut has benches and the
    // plots have furrows; the rock has no floor plan to fill, so what stands for
    // "everything hands can be given" here is its gear. `RUNGS` is read rather
    // than written: a ladder that grew a sixth rung should move this gate with
    // it.
    key: 'ram',
    name: 'the ram',
    bill: () => RAM_BILL,
    buy: () => { buyMachine('ram'); rebalance(); },
    show: () => canBuy('ram', () => S.minerPickLevel >= RUNGS && S.minerSpeedLevel >= RUNGS,
                       () => kitFull('miners'))
  },
  {
    // The belt from the rock to the hole, and the one machine that changes the
    // yard's *traffic* rather than a station's rate.
    //
    // It is what the yard starts asking for the moment any other machine runs: a
    // ram fills the rock's pile in well under a second and then stands down
    // waiting to be carried, so haulage becomes the bottleneck exactly when the
    // works becomes worth watching. DESIGN.md's tier three promised carts from
    // the beginning.
    //
    // Gated like the others: every rung of the lip's own gear, and a cart for
    // every pair of hands.
    key: 'belt',
    name: 'the belt',
    bill: () => BELT_BILL,
    buy: () => { buyMachine('belt'); rebalance(); },
    show: () => canBuy('belt',
                       () => S.haulCarryLevel >= RUNGS && S.haulPaceLevel >= RUNGS
                          && S.harnessLevel >= RUNGS && S.bootsLevel >= RUNGS,
                       () => kitFull('haulers'))
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
    rung: () => S.speedLevel,
    from: () => mineRate(S.speedLevel),
    to: () => mineRate(S.speedLevel + 1),
    cost: () => rungCost(20, S.speedLevel),
    buy: () => S.speedLevel++,
    // faster swings only read as an upgrade once the swinging is automatic. It
    // stays on the board once it is finished, saying so -- it used to vanish the
    // moment it reached the floor, which is a cap the game would not admit to.
    show: () => S.autoMine
  },
  // --- what a swing takes ---------------------------------------------------
  // A core is a rock. There is one of them per rock for ever, and what they are
  // for is *opening places* -- the quarry, the plots, the lab, the table. Selling a
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
    rung: () => S.pickLevel,
    from: () => pickCount(),
    to: () => pickCount() + 1,
    // Its own tier's coin, and dust with it. The rock never stops giving dust,
    // so every rung above the first tier is priced in both -- see "The ladder"
    // in DESIGN.md. Digging stays worth doing for the whole run.
    bill: () => [['shard', rungCost(4, S.pickLevel)], ['dust', rungCost(240, S.pickLevel)]],
    cost: () => rungCost(240, S.pickLevel),
    buy: () => S.pickLevel++,
    show: () => S.seenShard
  },
  // And the crew's is what the crew are fed on. The plots grow the only thing in
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
    rung: () => S.minerPickLevel,
    from: () => minerBite(),
    to: () => minerBite() + 1,
    bill: () => [['spore', rungCost(5, S.minerPickLevel)], ['dust', rungCost(300, S.minerPickLevel)]],
    cost: () => rungCost(300, S.minerPickLevel),
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
    rung: () => S.minerSpeedLevel,
    from: () => minerRate(),
    to: () => minerRate(S.minerSpeedLevel + 1),
    cost: () => rungCost(70, S.minerSpeedLevel),
    buy: () => S.minerSpeedLevel++,
    show: () => S.crew > 0
  },
  {
    key: 'haulcarry',
    // The heading over these rows already says "the crew", so the rows do not
    // need to say "worker" as well -- and what a body can pick up in one go is
    // its strength rather than its load, which is the thing it is carrying.
    name: 'strength',
    unit: 'px',
    rung: () => S.haulCarryLevel,
    from: () => haulCap(),
    to: () => haulCap(S.haulCarryLevel + 1),
    // Dust and nothing else. The crew's first two ladders are the first thing
    // anybody buys after their own hands, and they come long before the quarry or
    // the plots -- so pricing them in stone or crop was asking for a currency the
    // game has not shown you yet, on the two rows most likely to be the first
    // you ever read. The first round is dust. See "The ladder" in DESIGN.md.
    cost: () => rungCost(50, S.haulCarryLevel),
    buy: () => S.haulCarryLevel++,
    show: () => S.crew > 0
  },
  // --- and the second round, which the quarry pays for -------------------------
  // A finite ladder means running out, and running out is the game telling you
  // to go and open the next place. These are what is on the other side of that:
  // the same two things about a pair of hands, bought again in the stone the quarry
  // gives up. They are not more rungs on the ladders above -- those are finished
  // and say so -- they are gear, which is what blue is for.
  {
    key: 'harness',
    name: 'harness',
    unit: 'px',
    rung: () => S.harnessLevel,
    from: () => haulCap(),
    to: () => haulCap(S.haulCarryLevel, S.harnessLevel + 1),
    bill: () => [['shard', rungCost(8, S.harnessLevel)], ['dust', rungCost(400, S.harnessLevel)]],
    cost: () => rungCost(400, S.harnessLevel),
    buy: () => S.harnessLevel++,
    // Once there is stone to spend, and not before: a row asking for a coin the
    // yard has never handed you is a row that reads as broken.
    show: () => S.seenShard && S.crew > 0
  },
  {
    key: 'boots',
    name: 'boots',
    unit: 'px/s',
    pct: true,
    rung: () => S.bootsLevel,
    from: () => haulSpeed() * 60,
    to: () => haulSpeed(S.haulPaceLevel, S.bootsLevel + 1) * 60,
    bill: () => [['shard', rungCost(6, S.bootsLevel)], ['dust', rungCost(300, S.bootsLevel)]],
    cost: () => rungCost(300, S.bootsLevel),
    buy: () => S.bootsLevel++,
    show: () => S.seenShard && S.crew > 0
  },
  {
    key: 'haulpace',
    name: 'speed',
    unit: 'px/s',
    pct: true,
    rung: () => S.haulPaceLevel,
    from: () => haulSpeed() * 60,
    to: () => haulSpeed(S.haulPaceLevel + 1) * 60,
    cost: () => rungCost(60, S.haulPaceLevel),
    buy: () => S.haulPaceLevel++,
    show: () => S.crew > 0
  },
  FARM,
  // Growing a place you already have does not move the view.
  //
  // Opening one does, and should: four cores and a row in a menu, and the thing
  // bought is off the left of the screen -- without the glide, nothing appears
  // to happen. A bench or a plot is not that. You are standing at the bench with
  // the board open, buying the next one and the one after that, and the view
  // walking off to the far end of the yard between each of them is the game
  // taking the board out from under you to show you something you have already
  // seen. Nothing here is a surprise worth interrupting for.
  //
  // The quarry's own two rows -- how deep it goes and how fast it works -- are on
  // a board at the quarry now, along with the farm's at the farm. See quarry.js.
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
    // ...and after the first machine is running.
    //
    // That is the third thing, and it is the one that makes the house an answer
    // rather than a chore. Hand labour dirties the sky slowly; a machine dirties
    // it three times over per unit of work and never stops for a cigarette. Sold
    // before then, the house is a building you buy to fix a number that was
    // creeping; sold after, it is the bill for the thing you just switched on --
    // and the two land in the same part of the game, which is what the smoke
    // curve in DESIGN.md is trying to arrange.
    show: () => !S.scrubOpen && S.rains > 0 && S.seenAir && MACHINES.some(m => running(m.key))
  },
  // The last thing on the ground, and the only one that makes nothing.
  //
  // What it buys is a *job*, not a place. It was a shed the crew walked to,
  // which sent everybody across the yard and back several times an hour and made
  // the purchase a destination -- and a body walking to a shed is a body not
  // working. So the crew go where they stand, as they always did, and what this
  // puts up is the cupboard the shovels live in: somewhere for a janitor to
  // keep one, and therefore somewhere for there to be a janitor at all. See
  // `capOf`, which will not let you post one until this is up.
  {
    key: 'unlockouthouse',
    name: "build the janitor's closet",
    note: () => 'somewhere to keep a shovel, and somebody to swing it',
    cost: () => OUTHOUSE_DUST,
    buy: () => { S.outhouseOpen = true; lookAt(outhouse.x + outhouse.w / 2); },
    // Offered once you have seen why you want one -- which is now a thing you can
    // point at rather than a guess about how far along you are.
    //
    // It used to appear on a headcount and a fraction of its price, which is the
    // game deciding you are ready. What makes somebody want a janitor is five
    // patches of mess on the ground that nobody is clearing up, so that is what
    // puts it on the board. It stays once seen: a yard that had five and then
    // was tidied is a yard that has learned what the job is for.
    show: () => !S.outhouseOpen && (S.seenMess || poopLeft() >= LOO_MUCK * 5)
  },
  // The one thing a core buys, and the only row in the game with a bill rather
  // than a price. A core out of the rock, the dust the yard makes, the stone the
  // cut gives up and the crop off the plots: everything the operation does, on
  // one row. You cannot buy it by being good at one thing.
  {
    key: 'unlocktower',
    name: 'raise the tower',
    note: () => 'what a core is for',
    bill: () => [['core', TOWER_CORES], ['dust', TOWER_DUST]],
    cost: () => TOWER_DUST,                      // for anything that asks in one coin
    // Raising it raises a tower and nothing else. It used to call the first star
    // down with it, which put the sky there before there was anybody who could
    // reach it -- and made the wizards people who take an existing thing apart,
    // when making it is the whole of what they do. The first hat out of this
    // tower summons the first star, the same way every hat after it summons the
    // next one. See `stepTower`.
    buy: () => {
      S.towerOpen = true;
      lookAt(tower.x + tower.w / 2);
    },
    // Not offered until the ground is finished: the plots, the cut and the lab
    // all standing, and a core seen.
    //
    // A core is a core, so as soon as one was banked the tower stood on the
    // bench beside the plots -- and it is the most interesting row on the board
    // by a mile, so it took the whole chain in one step. The tower is the thing
    // that comes *after* the yard works: it is what a finished ground buys, and
    // the star it reaches is the tier above everything on the floor. Sold before
    // the lab, it is a wizard summoned by somebody with no quarry.
    //
    // Each of the three earns the next -- see the doors above -- and this is the
    // end of that chain rather than a fourth thing competing with it.
    show: () => !S.towerOpen && S.seenCore
              && S.farmOpen && S.quarryOpen && S.labOpen
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
    // Still behind the quarry or the plots: the lab multiplies what a place does, so
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

  CAVE
];

// The order and the grouping on the board. A section with nothing to show in it
// is left out, so rows appear as they are unlocked.
export const SECTIONS = [
  { title: 'you', keys: ['carry', 'auto', 'speed', 'pick'] },
  { title: 'the crew', keys: ['haulcarry', 'haulpace', 'harness', 'boots', 'belt'] },
  { title: 'the rock', keys: ['minerpick', 'minerspeed', 'ram'] },
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

// A price, in the words that price is said in. Coins are counted; time is read
// off a clock, and a hundred and twenty thousand of anything is not a thing
// anybody says about two minutes.
export const priceText = (money, n) =>
  money !== 'time' ? String(n) :
  n >= 60000 ? `${Math.round(n / 60000)} min` : `${Math.ceil(n / 1000)}s`;

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
  if (!u.show() || u.dead?.() || maxed(u) || !canPay(u)) return;
  // Nothing is taken until all of it can be: a bill you can half afford would
  // leave you with less of everything and none of the thing.
  for (const [money, n] of billOf(u)) if (money !== 'time') take(money, n);

  u.buy();
  S.dirty = true;
  buildShop();
}
