// What the bench sells, and what each thing costs.
//
// One row is one object. Every field is a function of the current game, so a row
// never holds a stale number, and adding an upgrade is adding an object -- no
// other file has to know about it. `SECTIONS` decides the order and the grouping
// on the board.

import {
  P, CAP_BASE, CAP_STEP, RUNGS, LOO_MUCK, LOO_POSTS, MINE_BASE, MINE_FLOOR, ROCKHAND_BASE, ROCKHAND_FLOOR,
  HAUL_MS, HAUL_BASE, QUARRY_FLOOR, TEND_FLOOR, SCHOOL_COST, SCHOOL_DUST,
  QUARRY_BENCH_MAX, FARM_PLOTS_MAX, BENCH_COST, BENCH_RATE, PLOT_COST, PLOT_RATE,
  QUARRY_DUST, FARM_DUST, LAB_DUST, CASINO_DUST, OUTHOUSE_DUST, LOOPOST_SHARDS, UNLOCK_SHOW,
  TOWER_CORES, TOWER_DUST, ROCKHAND_RUNGS, CRIT_MULT_RUNGS
} from './config.js';
import { fmt } from './board.js';
import { scrubCost } from './scrubhouse.js';
import { craftCount } from './balloon.js';
import { poopLeft } from './smog.js';
import { S, pit, quarry, farm, lab, apothecary, school, casino, scrub, tower, outhouse } from './state.js';
import { spend, spendHeld, pitCapacity, payTo } from './pit.js';
import { CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL,
         FARM_CORES, QUARRY_CORES, COMMUTE_PACE, HAUL_EMPTY,
         APOTHECARY_CORES, APOTHECARY_DUST } from './config.js';
import { refreshPiles, lookAt, resite, benches, plotCount } from './world.js';
import { machineFor, buyMachine, canBuy, MACHINES, running, machine, JOB_MACHINE, tuneGain, tuneRow, specOf } from './machines.js';
import { MACHINE_GAIN, ROCK_GANG, LIP_GANG, RAM_BILL, BELT_BILL,
         SPELL_DRIVE, SPELL_THRIFT, DUST_PER_SPARK, DUST_PER_SHARD, DUST_PER_SPORE, DUST_PER_CORE,
         HOUSE_COST0, HOUSE_RATE,
         MACHINE_TUNE,
         HOUSE_WORK0, HOUSE_WORK_STEP, HOUSE_WORK_MAX } from './config.js';
import { critChance, critMult } from './crit.js';
import { spelled } from './tower.js';
import { makeMeteor } from './meteor.js';
import { syncWorkers } from './crew.js';
import { mult } from './mult.js';
import { buildShop } from './shop.js';
import { takesTime, workOn, workFor, leftAt, busyAt, fullAt, start, registerRows,
         busyBuilderSites, siteX, siteBox } from './works.js';
// The one row this file's owner does not hold: the house is track C's
// building, and this is the one line of upgrades.js it edits. See C1 in
// wave-feedback3.md.
import { nextHouseAt } from './house.js';

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

// A ladder sold in more than one row is still one ladder, and shows one row at
// a time. Load and then the harness are two rows over what a pair of hands
// carries; pace, then boots, then the pace multiplier are three over how fast
// they walk. Side by side they read as the same thing for sale twice -- and a
// player with both open is being asked which of two identical rows to buy, which
// is not a decision, it is a shrug. So a row that continues another names it
// with `after`, and stays off every board until that row's ladder is finished:
// the same rule the four cards of a tier ladder already keep (`tierRows`), said
// once here for the rows written by hand. The finished row folds away under
// "finished: hidden" and the next one stands where it stood.
//
// It wraps `show` rather than being a second gate the boards have to ask about,
// so everything that reads `show()` -- the sheet, `canAfford`, the bench's mark,
// `__rows` -- gets the chain for free.
export const chained = rows => {
  const byKey = new Map(rows.map(u => [u.key, u]));
  for (const u of rows) {
    if (!u.after) continue;
    const prev = byKey.get(u.after);
    if (!prev) throw new Error(`${u.key} comes after ${u.after}, which is not a row`);
    const own = u.show;
    u.show = () => maxed(prev) && own();
  }
  return rows;
};

// Five rungs to every ladder in the game -- see RUNGS -- so that "how far along
// is this" is one question with one answer wherever it is asked.
const mineGap = swing(MINE_BASE, MINE_FLOOR, RUNGS);
const rockhandGap = swing(ROCKHAND_BASE, ROCKHAND_FLOOR, RUNGS);
const scoopGap = swing(HAUL_MS, 30, RUNGS);

export const mineMs = (lvl = S.speedLevel) => Math.max(1, mineGap(lvl) / mult('swing'));
export const mineRate = (lvl = S.speedLevel) => 1000 / mineMs(lvl);
export const rockhandMs = (lvl = S.rockhandSpeedLevel) => Math.max(1, rockhandGap(lvl) / mult('swing'));
export const rockhandRate = (lvl = S.rockhandSpeedLevel) => 1000 / rockhandMs(lvl);
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
// that made every rockhand in the yard hit harder was doing two jobs at once, and
// it sat under `you` while half of what it bought was on the rock.
export const pickCount = () => 1 + S.pickLevel;         // pixels your own swing takes
// What a rockhand takes: a whole pixel a rung, over the pickaxe's own short
// ladder. The eased curve this replaces bought fractions of a pixel per rung --
// numbers the row could only show as noise ("1.4 -> 1.7 px") -- so the ladder
// is three rungs now, each a pixel you can watch land, and each an order dearer
// (see rows-rock.js). Clamped to the ladder here as well as at load, so a saved
// level past the new top reads as the top.  (feedback7, item 19)
export const rockhandBite = (lvl = S.rockhandPickLevel) =>
  1 + Math.max(0, Math.min(ROCKHAND_RUNGS, lvl | 0));

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
  'plots/min': '<i class="spore"></i>/min',
  // What one go on either ground is worth, which is the other half of what the
  // two grounds sell -- a rate says how often, these say how much.
  'shards/dig': '<i class="shard"></i>/dig',
  'spores/cut': '<i class="spore"></i>/cut'
};

// A second is the clock, never the letter.
//
// Every other quantity on these boards is a mark -- a grain, a core, a shard,
// a clock for what a build costs in waiting -- and seconds were the one thing
// still spelled out, as an `s` hanging off a number. Next to a lowercase word
// unit that reads as the end of the word ("a longer dose, +14 s") and next to a
// mark it reads as a stray letter, and the game already has a picture for time
// standing in the bill directly underneath.
//
// Done here rather than in the four rows that name a unit in seconds -- and in
// whichever row is written next -- because a row's business is what it measures,
// not how the board spells it. `s` on its own is a duration; a trailing `/s` is
// a rate, and the clock goes where the letter was in both.
export const secondsMark = text =>
  text === 's' ? MARK.time : text.replace(/\/s$/, `/${MARK.time}`);

// What a unit is drawn as: the mark the yard has a coin for, or the row's own
// word if it has not -- and either way with its seconds turned into clocks.
export const unitText = unit => secondsMark(UNITS[unit] || unit);

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
  const mark = u.unit ? ' ' + unitText(u.unit) : '';
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
  //
  // And no mark after it. A proportion is a comparison of a thing with itself,
  // and the unit cancels out of it: the haulers' pace row read "+30% grains per
  // clock", which is thirty per cent of nothing anyone could name. The row
  // still carries its unit -- that is what `from` and `to` are measured in --
  // but the board has no use for it once the number is a share.
  const up = a > 0 ? Math.round((b / a - 1) * 100) : 0;
  return `+${b > a ? Math.max(1, up) : up}%`;
};


// Hiring and putting to work are two different things now. You buy a body once
// — a core for the first, dust for the next — and it carries dust until you put
// it on something else. A job is a count, not a purchase, so every one of them
// can be taken back the moment you want the dust moving again -- except a body
// that has been to the school, which is the deliberate exception and the reason
// the rule is worth stating out loud. See school.js.
export const JOBS = [JOB.ROCK, JOB.QUARRY, JOB.FARM, JOB.SCHOLAR, JOB.PURIFY, JOB.STIR, JOB.JANITOR, JOB.WIZARD, JOB.TEACH];

// Bodies with nothing else to do. They are the haulers, always: every body in
// the yard can be moved to every job, and nothing you buy changes that.
// Builders are not subtracted here: the count is derived FROM the spares (see
// `rebalance`), so subtracting it would take the same body off twice.
export const spareHands = () =>
  S.crew - JOBS.reduce((n, j) => n + S[j], 0);
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
import { JOB } from './jobs.js';
import { BENCH_ROWS } from './upgrades/rows-bench.js';
import { LUCK_ROWS } from './upgrades/rows-luck.js';
import { ROCK_ROWS } from './upgrades/rows-rock.js';
import { CREW_ROWS } from './upgrades/rows-crew.js';
import { FARM_ROWS } from './upgrades/rows-farm.js';
import { SCHOOL_ROWS } from './upgrades/rows-school.js';
import { SCRUB_ROWS } from './upgrades/rows-scrub.js';
import { TOWER_ROWS } from './upgrades/rows-tower.js';
import { CASINO_ROWS } from './upgrades/rows-casino.js';
import { APOTHECARY_ROWS } from './upgrades/rows-apothecary.js';
import { TUNING_ROWS } from './upgrades/rows-tuning.js';
import { QUARRY_ROWS } from './upgrades/rows-quarry.js';
import { OUTHOUSE_ROWS } from './upgrades/rows-outhouse.js';
import { SHACK_ROWS } from './upgrades/rows-shack.js';
import { MULT_ROWS } from './upgrades/rows-mult.js';
import { SHIELD_ROWS } from './upgrades/rows-shields.js';
export { TRADE_OF, JOB_OF };

// hats the station owns, hats actually on heads, and hats lying on the ground
// there waiting for somebody to come and get them
//
// Where those hats came from is the kit table's business and not the shop's:
// most stations buy theirs a trade at a time, the outhouse simply has its caps,
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
// ...and neither is a hat still on the shelf outside the school, or in the
// hands of the body carrying it over. The school makes the station's hats; it
// does not put them on the station's stand, a thousand pixels off, out of
// nothing -- which is what it did (critics 2026-09-10, A8). A taught trade is
// a hat on the shelf until somebody has walked it to the stand.
export const shelved = job => (S.hatShelf && S.hatShelf[job]) || 0;
export const carried = job => S.workers.filter(w => w.shelfHat === job).length;
export const spareKit = job => Math.max(0, hats(job) - worn(job) - loose(job) - shelved(job) - carried(job));

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
  job === JOB.QUARRY ? benches() :
  job === JOB.FARM ? plotCount() :
  // One stirrer to a pot -- the farm's "one hand a plot", said of the pots the
  // apothecary has broken standing room for. A second pot is a second body's.
  job === JOB.STIR ? S.apothPots :
  // No room for a scholar anywhere, because there is no lab: research is a build
  // now and the bodies that do it are builders. Kept as a nought rather than
  // deleted so a save written before the lab went can still be read -- it lands
  // its scholars in the spare pool through `rebalance`, which is what a job with
  // no room does. See DESIGN.md, "The lab is deleted".
  job === JOB.SCHOLAR ? 0 :
  // One body in the scrubbing house too, and for the same reason: it is a shed
  // with a fan in it. A second body was a second pair of hands on a machine
  // that runs itself once somebody is standing in it -- the draught it makes is
  // the same draught -- so the extra bodies read as a way to buy a faster sky
  // rather than as a place to be. What makes the sky come down quicker is the
  // recycler and the machine, not a queue inside the shed.
  //
  // This is also the argument for the machines, word for word. See `capOf`.
  // One in the house -- and one in each balloon it has sold. The shed argument
  // above is about the *shed*: a second body at one fan is a queue. A craft is a
  // second mouth rather than a second pair of hands at the same one, so it is a
  // place to be and it takes a body of its own. See balloon.js.
  job === JOB.PURIFY ? 1 + craftCount() :
  // Shovelling up after everybody is a job once there is a shed to gather it
  // under. Before that the mess is the yard's problem and nobody is on it -- see
  // `takeMuck` -- so there is nowhere to put a body even if you wanted to.
  //
  // More than one of them, because unlike the shed jobs this one is not a room
  // with a bench in it: it is the whole yard, and a yard the length of this one
  // is more ground than one pair of hands can keep up with.
  //
  // How many is `LOO_POSTS`, and the outhouse hangs a cap on its stand for each --
  // which is why this reads the kit table rather than the number itself. A post
  // and the cap that goes with it are one thing the shed opens, and two places
  // counting it separately is exactly how you get a body sent to a job with
  // nothing on the stand to pick up.
  job === JOB.JANITOR ? hats(JOB.JANITOR) :
  // One body per hat, and the tower makes them one at a time. This is the only
  // station in the yard whose floor plan is a thing you buy rather than a thing
  // you build: there is as much room in the sky as there are people who can get
  // to it.
  job === JOB.WIZARD ? S.wizardHats :
  // One teacher, once the training grounds stand: it is a room with a lectern
  // in it, the scrubbing house's argument word for word -- a second body in
  // there is a queue, not a second class. Nought before it is built, because a
  // teacher with no school is a body with nowhere to go. (wave6-sim, item 1)
  job === JOB.TEACH ? (S.schoolOpen ? 1 : 0) :
  // Building is not a job you assign at all. The yard derives its builders from
  // whoever is spare when something is going up (see `rebalance`), so there is
  // no room to put anybody in -- and a save written while the construction
  // bench stood lands its hired builders in the spare pool, the way the lab's
  // scholars do above.
  job === JOB.BUILD ? 0 :
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
// The rock is the one station with no floor plan to read: `capOf('rock hands')` is
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
  job === JOB.ROCK ? ROCK_GANG :
  // Carrying has no floor plan either, and for a different reason: it is not a
  // place at all. It is what a body does when it is on nothing, so "how many fit"
  // is the whole crew, and what the belt stands in for is a full complement of
  // carriers.
  job === JOB.HAUL ? LIP_GANG :
  capOfBare(job);


// What a full set of a station's kit is: its trade's own set (`KIT_MAX`, for the
// four the school sells), or its whole complement if it holds fewer hands than
// that. The second half is what keeps a small station honest -- the outhouse's two
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
  // Every rung of the machine's own endless ladder. One multiplier, here, for
  // all four of them -- see `tuneGain` in machines.js: every machine's rate runs
  // through this one function, so a ladder is a number in a record rather than
  // four rate functions to keep in step.
  * tuneGain(JOB_MACHINE[job])
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
  // here with `rock hands` deliberately left off, because `capOf('rock hands')` is
  // `Infinity` and clamping to it is a no-op -- which was true right up until the
  // ram made it finite, and then the one job the list omitted was the one job
  // that needed clamping and nothing walked the gang off the rock. A no-op for
  // six of the seven is a cheaper thing to carry than a second copy of a list
  // that is declared eighty lines up.
  for (const job of JOBS) S[job] = Math.min(S[job], capOf(job));
  for (const job of Object.keys(TRADE_OF)) S[TRADE_OF[job]] = Math.max(0, S[TRADE_OF[job]]);
  // and no ladder past its top, whatever a save says
  for (const k of ['carryLevel', 'speedLevel', 'pickLevel',
                   'rockhandSpeedLevel', 'haulCarryLevel', 'haulPaceLevel',
                   'harnessLevel', 'bootsLevel'])
    S[k] = Math.max(0, Math.min(RUNGS, S[k] || 0));
  // Two ladders got shorter (feedback7 items 19 and 20), so their saved levels
  // clamp against their own tops rather than the shared RUNGS: a save at pick
  // level five reads as the new level three, not as two rungs past the ladder.
  S.rockhandPickLevel = Math.max(0, Math.min(ROCKHAND_RUNGS, S.rockhandPickLevel || 0));
  S.critMultLevel = Math.max(0, Math.min(CRIT_MULT_RUNGS, S.critMultLevel || 0));
  // Building is not a job on the roster and never will be. You do not decide to
  // have builders -- you decide to build something, and the hands that had
  // nothing else on go and do it, which is what "spare" already meant. So the
  // count is derived here rather than set anywhere, and it goes back to nought
  // the moment the thing is standing.
  //
  // Never the whole yard: a build that swallowed every idle body would stop the
  // dust moving altogether, and what this is meant to be is a share of the
  // yard's attention rather than all of it. One a site (the old BUILD_GANG),
  // because the bench, the yard and the school are three places and a body at
  // one of them is not at the other two.
  const sites = busyBuilderSites();
  const gang = sites.length;
  // Nobody spare: the nearest body comes and does it. Carrying first -- a
  // hauler is spare by definition and is already counted -- and if there is
  // nobody carrying, the body standing nearest the site is *lent*: taken off
  // its count, which makes it spare, and given back the moment there is nothing
  // left to build. One a site and never a gang: borrowing is what keeps a
  // purchase from stalling, not a way to staff a build off the rock. What it
  // costs is a rockhand away from the rock for ten seconds, which you can see.
  //
  // The four sites with a gang of their own keep the lab's rule instead -- an
  // empty cut builds nothing -- because their work *is* the gang's.
  //
  // What is owed rides on the body it was borrowed from. It used to be a list of
  // job names in `S.lent`, pushed on one side of this function and paid back on
  // the other -- a ledger kept beside the thing it is about, which is a ledger
  // that can disagree with it, and did twice over. The array was saved and the
  // flag on the body was not, so a reload came back owing a debt no body in the
  // yard was carrying. And nothing tied a repayment to a body still being there
  // to repay: move somebody on to the same job while the loan is out and the
  // count came back on *top* of the move, so a crew of three ended the build
  // with four rock hands on the rock and nothing said.
  for (let short = sites.length - Math.max(0, spareHands()); short > 0; short--) {
    const w = nearestLendable(sites);
    if (!w) break;
    const job = JOB_OF[w.type];
    w.lentFrom = job;                    // stood down first, see syncWorkers
    S[job]--;
  }
  // ...and given back. Whatever job a body was borrowed from gets its count back
  // the frame the last builders' site clears, and `syncWorkers` walks a body
  // home to it -- if there is still room there: a bench dug out from under a
  // borrowed quarrier is a body back on carrying, which is what it would have
  // been anyway.
  //
  // And only if there is a body spare to be the one going home. A count handed
  // back that nobody in the yard can stand behind is a roster that reads higher
  // than the crew, for ever, with the extra rockhand nowhere to be seen.
  if (!sites.length) {
    for (const w of S.workers) {
      const job = w.lentFrom;
      if (!job) continue;
      delete w.lentFrom;
      if (roomAt(job) > 0 && spareHands() > 0) S[job]++;
    }
  }
  // What is out on loan, read off the bodies rather than kept in step with them.
  // Saves, the roster and the checks all read this; none of them can now read
  // something the yard does not have.
  S.lent = S.workers.filter(w => w.lentFrom).map(w => w.lentFrom);
  S.builders = sites.length ? Math.min(gang, Math.max(0, spareHands())) : 0;
  // Carrying is the job nobody is assigned to: it is what a body does when it is
  // on nothing, so the haulers are whatever is left over -- less whoever is over
  // at the site putting something up. The carts are the lip's kit and are
  // counted with the rest of it, not held out of this.
  S.haulers = Math.max(0, spareHands() - S.builders);
}

// The body on a station standing nearest any of the sites that want one, and
// not already spoken for. Station bodies only: a hauler is spare already and a
// builder is the thing being looked for.
function nearestLendable(sites) {
  const xs = sites.map(siteX).filter(x => x != null);
  let best = null, dist = Infinity;
  for (const w of S.workers) {
    const job = JOB_OF[w.type];
    if (!job || !JOBS.includes(job) || w.lentFrom) continue;
    if (S[job] < 1) continue;
    const d = xs.length ? Math.min(...xs.map(x => Math.abs(w.x - x))) : 0;
    if (d < dist) { dist = d; best = w; }
  }
  return best;
}

export function hire() {
  S.crew++;
  rebalance();
  syncWorkers();
  S.dirty = true;
  buildShop();
}

// A loan taken off a job the player has just re-set is not a loan any more.
//
// The roster shows a job's count with whatever is out on loan already taken off
// it, so a press on those buttons is a decision about the number in front of
// you. Handing the borrowed body back afterwards, on top of the press, is the
// yard quietly undoing what you just did -- which is how "+1 rockhand" ended a
// build with two more rock hands than it started with. Forgiven rather than repaid:
// `rebalance`, on the next line down, borrows again if the build still needs
// somebody, and it borrows against the count you just set.
const forgive = job => { for (const w of S.workers) if (w.lentFrom === job) delete w.lentFrom; };

// move one body on to a job, or off it and back to carrying dust
export function assign(job, d) {
  if (d > 0 && idle() < 1) return;
  if (d > 0 && roomAt(job) < 1) return;          // nowhere down there to put them
  if (d < 0 && S[job] < 1) return;
  // and nothing stops one leaving: the hat it was wearing stays at the station.
  S[job] += d;
  forgive(job);
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
  // A building, like the rest of them past the bench: a room does not appear,
  // it goes up, with a builder at it -- see C1 in wave-feedback3.md. `at` is
  // where the next room will stand, which house.js works out the same way it
  // works out every other room.
  kind: 'building', site: 'yard', at: () => nextHouseAt(),
  // Its own curve, off how many rooms already stand -- see #8, "Wave 3.1"
  // amendment. It is `kind: 'building'` with no `rung` of its own, so without
  // this `workFor` gave it one flat number for ever: ninety worker-seconds,
  // which with BUILD_GANG at one is ninety seconds alone for your very first
  // hire. `S.crew` is a rung in all but name -- it is exactly the "from" this
  // row already reports below -- clamped at zero so the crew the intro hands
  // you does not push the very first bought house up the curve.
  work: () => Math.min(HOUSE_WORK_MAX,
    HOUSE_WORK0 * Math.pow(HOUSE_WORK_STEP, Math.max(0, S.crew - 1))),
  from: () => S.crew,
  to: () => S.crew + 1,
  // One pool pays for every job now, so the curve is gentler than the four
  // it replaced: 1.7 a body was steep because it was steep four times over,
  // and the same eight bodies came to about 1,500 dust between them. The rate
  // sits above the ladders' 1.6 on purpose: every body compounds the income
  // every ladder is priced against, so the crew is the one curve that must
  // outrun the shop's -- the grind pass, DESIGN.md.
  cost: () => Math.round(HOUSE_COST0 * Math.pow(HOUSE_RATE, Math.max(0, S.crew - 1))
                         * (spelled('thrift') ? SPELL_THRIFT : 1)),
  buy: hire,
  show: () => S.crew > 0
};
// Registered on its own, because it lives on the crew board rather than the
// bench (see crewboard.js) and so is not one of `UPGRADES` below -- but a work
// coming out of a save is a key and two numbers, and it still has to find its
// way back to this row's own `buy` when it lands. See `registerRows` in
// works.js.
registerRows([HOUSE_ROW]);

// What the bench sells, in the order it is written down. Every row is a data
// object in its own file under `src/upgrades/` -- one file per section of the
// board -- and this is the only place their order is decided. A new row is a
// row in one of those files; a new section is a file and a line here.
//
// The economy below is what does not fit in a data file: rebalancing the crew,
// hiring, staffing, paying a bill. That stays here.
export const UPGRADES = chained([
  ...BENCH_ROWS,
  ...LUCK_ROWS,
  ...ROCK_ROWS,
  ...CREW_ROWS,
  ...FARM_ROWS,
  ...SCHOOL_ROWS,
  ...SCRUB_ROWS,
  ...TOWER_ROWS,
  ...CASINO_ROWS,
  ...APOTHECARY_ROWS,
  ...TUNING_ROWS,
  ...QUARRY_ROWS,
  ...OUTHOUSE_ROWS,
  ...SHACK_ROWS,
  ...MULT_ROWS,
  ...SHIELD_ROWS
]);

// and the yard is told what these rows are, so a work coming back out of a save
// knows which one it belongs to. See `registerRows`.
registerRows(UPGRADES);

// The order and the grouping on the board. A section with nothing to show in it
// is left out, so rows appear as they are unlocked.
export const SECTIONS = [
  // "you", not "your gear": you are the cursor, and the heading under this one
  // is the one about gear.
  { title: 'you', keys: ['carry', 'auto', 'speed', 'pick'] },
  // The crit rows apply to the whole yard, so the bench is their natural home.
  // "lucky swings" rather than the genre's "critical hits": a heading here is a
  // thing in the yard, not a term from another game's manual.
  { title: 'lucky swings', keys: ['critchance', 'critmult'] },
  // Everything a hauler is issued: what they carry, how fast they walk, the
  // multiplier over that, and the machine that carries without them. All of it
  // was sold at the house for a while, in two moves, and all of it has come
  // back: the house is for putting a roof up, and the bench is where kit is
  // fitted -- yours under the heading above, theirs under this one. Ladder
  // first, the thing that climbs past it last, the way the shack orders the
  // rock's. Named for the job, the way the shack's is: "the haulers" beside
  // "the miners", and "crew" left to the house, where the crew live.
  { title: 'the haulers', keys: ['haulcarry', 'haulpace', 'harness', 'boots', 'labhaul', 'belt', 'tunebelt'] },
  // "the rock" is not here any more either: the gang's ladders, the multiplier
  // over their swing and their machine are sold at the hut they work out of --
  // see shack.js. What is left under "you" above is your own gear, which has no
  // station because you are the cursor.
  // What the yard puts between itself and the sky, in the order it thinks of
  // them. The dome is the tower's and is on the tower's board.
  { title: 'the shields', keys: ['props', 'net', 'arch', 'jack', 'askwizards'] },
  // Everything the yard has not built yet, under one heading.
  //
  // These were ten headings, each carrying a single row -- "the quarry" over
  // "open the quarry", "the tower" over "raise the tower", and so on down. That
  // is roughly six hundred pixels of bench spent on a table of contents, and a
  // heading over one row was never telling you anything the row did not.
  //
  // Every row under it says "build the <place>", and the heading says "build".
  // They each had their own verb once -- "open the quarry", "break the ground",
  // "raise the tower" -- which read well one row at a time and badly as a list:
  // ten rows, ten verbs, and nothing to tell you at a glance that they were all
  // the same kind of purchase. A heading is a label, not a voice.
  //
  // They are the one group that cannot be moved to the place it belongs to,
  // which is the rule every other section on this board now follows: a decision
  // about a place is made at the place, and these cannot be, because the place
  // is what they buy. See DESIGN.md, "The bench is a catch-all".
  { title: 'build', keys: [
    'unlockquarry', 'unlockfarm', 'unlockapothecary', 'unlockcasino',
    'unlockshack', 'unlockouthouse', 'unlocktower', 'unlockschool',
    'unlockscrub'
  ] }
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
//
// ...and actually press. A row whose site is already putting something up is not
// a thing you can do anything about, and a mark on the bench promising one is
// the bench telling you to walk over for nothing.
export const canAfford = () =>
  UPGRADES.some(u => !u.job && u.show() && canPay(u) && !siteBusy(u));

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
export function take(money, n) {
  if (!n) return;
  // `spendHeld` takes the grains out of the hole first and off what the rift is
  // holding for whatever the hole did not have -- the same order paying in dust
  // keeps, and the reason it is one call rather than a subtraction here.
  if (money === 'dust') spend(n);
  else if (money === 'core') { S.cores -= n; spendHeld(n, CORE_CELL); }
  else if (money === 'shard') { S.shards -= n; spendHeld(n, SHARD_CELL); }
  else if (money === 'spore') { S.spores -= n; spendHeld(n, SPORE_CELL); }
  else if (money === 'spark') { S.sparks -= n; spendHeld(n, SPARK_CELL); }
}

// What the coins of the grounds are worth in dust.
//
// Every row in this game is priced in dust as well as in whatever else it asks
// for, and this is what makes that true rather than sixteen numbers typed into
// sixteen rows. A row says what it costs in its own coin -- shards at the
// school, spores at the quarry, red at the tower -- and the dust half is worked
// out from that here.
//
// Sixty to the spark is the line the machines were already sitting on: the
// tiller exactly, the jaw within a rounding. The rest are set against it by how
// hard the thing is to come by, and a core -- of which there are nine in the
// game -- is worth the most of anything.
//
// It is a `let` and a row in TUNABLE for the same reason the rates are: this is
// the exchange rate of the whole economy, and the way to find it is to push it
// while watching the yard rather than to reason about it.
export const DUST_PER = { spark: DUST_PER_SPARK, shard: DUST_PER_SHARD, spore: DUST_PER_SPORE, core: DUST_PER_CORE };

// What a row costs, as a currency and an amount each. Almost every row in the
// game is priced in one thing and says so with `cost` and `currency`; the tower
// is priced in all four at once and says so with `bill`.
//
// And then the dust, which every row carries.
//
// It is added here rather than written into each row because a rule sixteen
// rows have to remember is a rule the seventeenth will forget -- and it was
// forgotten: the lab, the school, the scrubbing house and the quarry sold
// fifteen rows between them and not one of them asked for a grain. Which is
// what left the pile with nowhere to go. A row that genuinely wants a different
// number says so by naming dust itself, and what it names is what it costs.
//
// `time` is on the tower's hat and is not a coin: it buys nothing here, and a
// row priced in nothing but time stays priced in nothing but time.
//
// ...and then the time, for anything past the bench. A row that has to be built
// says so in its bill under a clock, beside the coins, and reads the same way
// they do -- how long a thing takes is part of what it costs, and a note you
// have to open a second sheet to read is not a price. While it is being built
// the clock counts down what is left of it, at the rate the site is actually
// going. Appended here for the same reason the dust is: a new row past the
// bench gets its clock by saying what kind of thing it is and nothing else.
export const billOf = u => {
  let bill = u.bill ? u.bill() : [[u.currency || 'dust', u.cost()]];
  if (!bill.some(([money]) => money === 'dust')) {
    let dust = 0;
    for (const [money, n] of bill) dust += (DUST_PER[money] || 0) * n;
    if (dust > 0) bill = [...bill, ['dust', Math.round(dust)]];
  }
  if (!takesTime(u)) return bill;
  const on = workOn(u.key);
  return [...bill, ['time', on ? leftAt(u.site, u.key) : workFor(u) * 1000]];
};

// Whether the yard is in the middle of building this row, and whether the site
// it would be built at is busy with something else. The board reads both: the
// first is "this one is under way", the second is "the cut is doing something
// else first", and they are not the same row to a player.
export const building = u => takesTime(u) && !!workOn(u.key);
// A row you cannot press because the place it would be built has nothing free.
// `busyAt` was this question back when every site held one work; a lab with two
// benches has room for a second piece while the first is still going, and the
// number of benches is the lab's business rather than a rule in here.
export const siteBusy = u => takesTime(u) && fullAt(u.site);

// A price, in the words that price is said in. Coins are counted in the same
// short form as every other reading in the yard (`fmt`: 872, 1.3k, 14k); time is
// read off a clock, and a hundred and twenty thousand of anything is not a
// thing anybody says about two minutes.
export const priceText = (money, n) =>
  money !== 'time' ? fmt(n) :
  n >= 60000 ? `${Math.round(n / 60000)} min` : `${Math.ceil(n / 1000)}`;

export const canPay = u => billOf(u).every(([money, n]) => purse(money) >= n);

// True when something was actually bought, false when the press came to
// nothing -- no money, maxed out, the site already busy. The board reads it to
// decide whether to put itself away, and a press that bought nothing must
// leave it open: a sheet that shuts on a bill you cannot pay looks like it
// took the money.
export function buy(u) {
  if (u.job || u.dial) return false;   // a job row moves bodies and a dial sets a number
  // A signpost: a row with a thought on it rather than a thing for sale. It
  // costs nothing and takes nothing; pressing it only does whatever pointing
  // is worth doing -- the shields' "maybe the wizards would know?" pans out to
  // the tower. Turned away here beside job and dial, and excused from the
  // bill checks for the same reason, because the two lists say the same thing.
  if (u.sign) { if (u.show() && !u.dead?.()) u.buy(); return false; }
  // A row with a payout on it instead of a price is not a purchase: nothing is
  // taken, and what it does is its own business. The casino's two decisions are
  // the only ones in the game.
  if (u.price) {
    if (!u.show() || u.dead?.()) return false;
    u.buy(); S.dirty = true; buildShop();
    // A payout row is the casino's two decisions: it is a thing you do at the
    // table, not a thing you take away, so the board stays up for the next hand.
    return false;
  }
  // A row that is greyed out for a reason of its own -- the tower already has a
  // hat on the go -- takes nothing and does nothing. Without this the money went
  // and the row shrugged.
  if (!u.show() || u.dead?.() || maxed(u) || !canPay(u)) return false;
  // and not while the site is already putting something up. One work per site is
  // the whole of what makes the waiting a decision -- see works.js.
  if (siteBusy(u)) return false;
  // Past the bench, paying does not buy the thing: it starts the yard building
  // it, and the row's own `buy` runs when somebody has finished the work. The
  // coin is taken either way and taken now -- what you are waiting on is the
  // labour, not the bill.
  //
  // The work is started BEFORE the bill is taken, and that order is the whole
  // of what makes a building's dust fly to the right place. A yard row's
  // destination is the ground the thing is going up on, and that ground does
  // not exist until `start` reserves it (`reserve` in works.js, which re-lays
  // the yard on the spot) -- so a payment taken first had nowhere to aim and
  // fell back to the bench, which is the one place the dust is not going. A
  // start that comes to nothing returns before a coin is touched, which is the
  // same bargain as the checks above it.
  if (takesTime(u) && !start(u.site, u, u.at?.())) return false;

  // What is spent flies to where it is going, not to the bench: buy a rung of
  // the farm and the dust arcs to the farm, buy a brew rung and it arcs to the
  // cauldron, buy a whole new building and it arcs to the fenced-off patch it
  // is rising on. The destination is the row's own site (`siteBox`) -- for a
  // yard row, the box of the work just started -- and it is set for the length
  // of the payment and cleared straight after, so a spend with nobody's `payTo`
  // around it -- the rift -- still falls back to the bench. A row with no site
  // at all is the bench's own and pays there, which is where it is bought.
  const box = u.site === 'yard' ? siteBox('yard', workOn(u.key))
            : u.site           ? siteBox(u.site)
            : null;
  if (box) payTo(box.x + box.w / 2, (box.y ?? S.groundY) - P * 2);
  // Nothing is taken until all of it can be: a bill you can half afford would
  // leave you with less of everything and none of the thing.
  for (const [money, n] of billOf(u)) if (money !== 'time') take(money, n);
  payTo();                                       // back to the bench for the next spend

  if (!takesTime(u)) u.buy();
  S.dirty = true;
  buildShop();
  return true;
}
