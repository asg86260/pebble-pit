// What the bench sells, and what each thing costs.
//
// One row is one object. Every field is a function of the current game, so a
// row never holds a stale number. `SECTIONS` decides the order and the grouping
// on the board.

import { P, RUNGS, LADDER, rungValue, HAUL_MS, UNDO_MS } from './config.js';
import { fmt } from './board.js';

import { craftCount } from './balloon.js';

import { S, pit, quarry, farm, apothecary, casino, scrub, tower, outhouse } from './state.js';
import { spend, spendHeld, payTo, refund } from './pit.js';
import { CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL, COMMUTE_PACE, HAUL_EMPTY, HOME_HURRY } from './config.js';
import { benches, plotCount } from './world.js';
import { machineFor, MACHINES, UNMANNED, machine, JOB_MACHINE, tuneGain } from './machines.js';
import { MACHINE_GAIN, ROCK_GANG, LIP_GANG, SPELL_DRIVE, SPELL_THRIFT, HOUSE_COST0, HOUSE_RATE, HOUSE_WORK0, HOUSE_WORK_STEP, HOUSE_WORK_MAX } from './config.js';

import { spelled } from './tower.js';

import { syncWorkers } from './crew.js';
import { buildShop } from './shop.js';
import { takesTime, workOn, workFor, leftAt, start, registerRows, busyBuilderSites, siteX, siteBox, waiting, placeOf, pullOut, abandonAt, rowFor } from './works.js';
import { now } from './clock.js';
import { nextHouseAt } from './house.js';

// A rate ladder from `base` to `floor` in a fixed number of rungs, eased so the
// first rungs are worth more than the last; the last rung lands exactly on the
// floor, so a row can say "5 of 5" instead of quietly reaching a cap.
export const swing = (base, floor, rungs) => lvl => {
  const k = Math.max(0, Math.min(1, lvl / rungs));
  return Math.round(base + (floor - base) * (1 - Math.pow(1 - k, 1.6)));
};
const perSecond = ms => lvl => 1000 / ms(lvl);

export const capacity = (lvl = S.carryLevel) => rungValue('carry', lvl);

// `rungCost` and `DUST_PER` live in upgrades/price.js, a leaf, so the ladder
// helper can price a row without importing this file.
import { rungCost, DUST_PER } from './upgrades/price.js';
export { rungCost, DUST_PER };

// A row with no `rung` is not a ladder (a building, a one-off, a job) and is
// never finished.
export const rungOf = u => (u.rung ? u.rung() : 0);
// `RUNGS` unless the row says otherwise (the kit ladders are `KIT_MAX`). Read
// through one function because the pips, the count, "done" and the fold all
// ask, and a cap only some of them know about is a row that says 3/5 and
// cannot be bought.
export const rungsOf = u => (u.rungs ? u.rungs() : RUNGS);
export const maxed = u => !!u.rung && rungOf(u) >= rungsOf(u);

// Whether a finished row may be folded off its board by "finished: hidden".
// A kit row says `keep`: it is the only place to read how many hats a station
// owns, and that fact becomes final exactly when the ladder finishes.
export const folds = u => maxed(u) && !u.keep;

// A ladder sold in more than one row shows one row at a time: a row naming
// `after` stays off every board until that row's ladder is finished. Wraps
// `show` so everything that reads it (the sheet, `canAfford`, the bench's
// mark, `__rows`) gets the chain without a second gate.
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

// The scoop is the one curve left here: it rides the haulers' pace ladder and
// no row reads it. Every other ladder reads its written list (config/rungs.js).
const scoopGap = swing(HAUL_MS, 30, LADDER);

export const mineRate = (lvl = S.speedLevel) => rungValue('speed', lvl);
export const mineMs = (lvl = S.speedLevel) => Math.max(1, Math.round(1000 / mineRate(lvl)));
export const rockhandRate = (lvl = S.rockhandSpeedLevel) => rungValue('rockhandspeed', lvl);
export const rockhandMs = (lvl = S.rockhandSpeedLevel) => Math.max(1, Math.round(1000 / rockhandRate(lvl)));
export const haulCap = (lvl = S.haulCarryLevel) => rungValue('haulcarry', lvl);
// The walk is written in px/s and stepped in px a frame.
export const haulSpeed = (lvl = S.haulPaceLevel) => rungValue('haulpace', lvl) / 60;
export const scoopMs = (lvl = S.haulPaceLevel) => Math.max(1, scoopGap(lvl));
// A trip's pace for anybody making one. One number for every commute: a
// station-private walking speed tuned for a few feet of ground gets used for
// whole commutes and a body crawls across the world.
export const commutePace = () => Math.max(COMMUTE_PACE, haulSpeed() * HAUL_EMPTY);
// The trip between the shacks and the work, a multiple of the commute so it
// climbs the pace ladder with it.
export const homePace = () => commutePace() * HOME_HURRY;
// Pixels a swing takes: yours and the rockhands' are two ladders.
export const pickCount = (lvl = S.pickLevel) => rungValue('pick', lvl);
// Whole pixels off the list; clamped to the list so a saved level past the top
// reads as the top.
export const rockhandBite = (lvl = S.rockhandPickLevel) => rungValue('rockhandpick', lvl);

// Every currency is a mark, never a word. Adding one is a line here and a line
// in the stylesheet. Time is a price like the coins and reads the same way.
export const MARK = {
  dust: '<i class="dust"></i>',
  core: '<i class="core"></i>',
  shard: '<i class="shard"></i>',
  spore: '<i class="spore"></i>',
  spark: '<i class="spark"></i>',
  time: '<i class="clock"></i>'
};

// What you have of one. You cannot be short of time, so a bill asking for it
// is never the reason a row is out of reach.
export const purse = money =>
  money === 'time' ? Infinity :
  money === 'core' ? S.cores :
  money === 'shard' ? S.shards :
  money === 'spore' ? S.spores :
  money === 'spark' ? S.sparks :
  S.stored;

// What a unit is *drawn* as, for the units the yard has a coin for. A unit not
// in here is written out in the row's own word (see `gainText`).
export const UNITS = {
  'px': '<i class="dust"></i>',
  'px/s': '<i class="dust"></i>/s',
  'trips/min': '<i class="shard"></i>/min',
  'plots/min': '<i class="spore"></i>/min',
  'shards/dig': '<i class="shard"></i>/dig',
  'spores/cut': '<i class="spore"></i>/harvest'
};

// A second is written 's' wherever it is a unit; the clock glyph is the bill's
// alone, because the same glyph meaning "per second" on the gain line and "a
// price in time" on the bill forty pixels below it read as two things.
export const unitText = unit => UNITS[unit] || unit;

export const num = v => (v < 10 ? v.toFixed(1) : String(Math.round(v)));

// --- what a row says it gives you -------------------------------------------
// A row says what buying it *changes*, never a number the game is keeping.
// Two shapes only: a count goes "a -> b" and a rate goes "+n%". The verb the
// number is about (`does`) leads the line, because "boots +45%" leaves the one
// word that matters to the player's guess; test/gain-verb.test.mjs holds
// every proportional row to having one.
export const gainText = u => {
  // A finished ladder has nothing left to give, verb included.
  if (maxed(u)) return '';
  const amount = gainAmount(u);
  // A door has no amount to print; it says what the place is for instead.
  if (!amount && u.blurb) return u.blurb;
  return amount && u.does ? `${u.does} ${amount}` : amount;
};
const gainAmount = u => {
  if (!u.to) return '';
  const b = Number(u.to());
  if (!isFinite(b)) return '';
  // The gain shares a narrow column with the bill, so the amount is glued to
  // its mark with a no-break space: the verb may wrap off, the amount never
  // breaks. A bare symbol (%, x) sits against its number like everywhere else.
  const NB = ' ';
  const mark = !u.unit ? '' : /^[%x]$/.test(u.unit) ? u.unit : NB + unitText(u.unit);
  // A `to` with no `from` is not a step up a ladder, it is what you get.
  if (!u.from) return `${Number.isInteger(b) ? b : num(b)}${mark}`;
  const a = Number(u.from());
  if (!isFinite(a)) return '';
  // A count says now and after: one to two is doubling, eleven to twelve is
  // not, and "+1" reads the same for both. Counts only; a rate is already a
  // comparison.
  if (!u.pct) {
    const say = v => (Number.isInteger(v) ? v : num(v));
    return `${say(a)}${NB}→${NB}${say(b)}${mark}`;
  }
  // A rate stepping onto its floor can gain a real amount and round to 0%,
  // which reads as broken, so the least a purchase claims is one per cent.
  // No mark after a proportion: the unit cancels out of it.
  const up = a > 0 ? Math.round((b / a - 1) * 100) : 0;
  return `+${b > a ? Math.max(1, up) : up}%`;
};


// A job is a count, not a purchase: you buy a body once and move it freely.
// What a body is twice as good at is its hat, and the hat stays at the station
// (upgrades/rows-kit.js).
export const JOBS = [JOB.ROCK, JOB.QUARRY, JOB.FARM, JOB.SCHOLAR, JOB.PURIFY, JOB.STIR, JOB.JANITOR, JOB.WIZARD];

// Bodies on no job. They are the haulers. Builders are not subtracted here:
// the builder count is derived FROM the spares (`rebalance`), so subtracting
// it would take the same body off twice.
export const spareHands = () =>
  S.crew - JOBS.reduce((n, j) => n + S[j], 0);
export const idle = () => spareHands();

// --- the kit ----------------------------------------------------------------
// A hat belongs to the station, not to the head under it. Whoever stands at
// the station wears whatever is lying there; move everybody off and the hats
// stay behind. Which station owns which hats, and what job a body is doing
// from what it is, live in kit.js and are passed through here.
import { TRADE_OF, JOB_OF, stockOf, hasKit, kitSetOf } from './kit.js';
import { JOB } from './jobs.js';
import { BENCH_ROWS } from './upgrades/rows-bench.js';
import { LUCK_ROWS } from './upgrades/rows-luck.js';
import { ROCK_ROWS } from './upgrades/rows-rock.js';
import { CREW_ROWS } from './upgrades/rows-crew.js';
import { FARM_ROWS } from './upgrades/rows-farm.js';
import { KIT_ROWS } from './upgrades/rows-kit.js';
import { SCRUB_ROWS } from './upgrades/rows-scrub.js';
import { TOWER_ROWS } from './upgrades/rows-tower.js';
import { CASINO_ROWS } from './upgrades/rows-casino.js';
import { APOTHECARY_ROWS } from './upgrades/rows-apothecary.js';
import { TUNING_ROWS } from './upgrades/rows-tuning.js';
import { QUARRY_ROWS } from './upgrades/rows-quarry.js';
import { OUTHOUSE_ROWS } from './upgrades/rows-outhouse.js';
import { SHACK_ROWS } from './upgrades/rows-shack.js';
import { SHIELD_ROWS } from './upgrades/rows-shields.js';
export { TRADE_OF, JOB_OF };

// Hats the station owns. `stockOf` is the one place that knows whether they
// were bought a trade at a time or came with the shed; nothing below can tell.
export const hats = stockOf;
// Counted off `kitOf` (whose hat it is), not off the job the body is on: a
// body moved off the rock keeps the helmet on until it has walked it to the
// stand, and counting by job put a helmet out on the stand that was still on
// a head.
export const worn = job => S.workers.filter(w => w.trained && w.kitOf === job).length;
// Kit knocked off a head and lying loose is the station's but not on the
// stand: nobody else can be sent to wear it until its owner picks it up.
export const loose = job => S.workers.filter(w => w.hatOff && w.hatOff.of === job).length;
// A hat is made at its own station's stand, so a bought hat is spare from the
// frame it is bought: no shelf, no carrier to subtract.
export const spareKit = job => Math.max(0, hats(job) - worn(job) - loose(job));

// What a station's floor plan says it holds. One table, read by `capOf` and
// `handsOf` both, so the two cannot disagree.
const capOfBare = job =>
  job === JOB.QUARRY ? benches() :
  job === JOB.FARM ? plotCount() :
  // One stirrer to a pot.
  job === JOB.STIR ? S.apothPots :
  // There is no lab. Kept as a nought rather than deleted so a save with
  // scholars still reads: `rebalance` lands them in the spare pool.
  job === JOB.SCHOLAR ? 0 :
  // One body in the scrubbing house (a second pair of hands at one fan is a
  // queue) and one in each balloon it has sold (a second mouth is a place).
  job === JOB.PURIFY ? 1 + craftCount() :
  // One janitor a post, and the outhouse hangs a cap on its stand for each --
  // read off the kit table rather than `LOO_POSTS` so a post and its cap are
  // one fact.
  job === JOB.JANITOR ? hats(JOB.JANITOR) :
  // The tower's floor plan is the hats it has made: one body per hat.
  job === JOB.WIZARD ? S.wizardHats :
  // Building is derived from the spares (`rebalance`), never assigned.
  job === JOB.BUILD ? 0 :
  // The rock and the lip have no plan.
  Infinity;

// Where a body may be put: the floor plan, or one tender while a machine has
// the station. Reads the lever, not whether anybody is standing there -- a
// cap derived from "is it manned" would flip every time the tender walked
// off to shovel and `rebalance` would thrash the gang for ever. A machine
// that runs itself holds nobody and takes no place from the station.
export const capOf = job => { const m = machineFor(job); return m && !UNMANNED.has(JOB_MACHINE[job]) ? 1 : capOfBare(job); };

export const roomAt = job => capOf(job) - S[job];

// What the station could hold by hand -- what a machine stands in for. The
// rock has no floor plan, so its complement is `ROCK_GANG`; carrying is not a
// place, so what the belt stands in for is `LIP_GANG`. Every other plan-less
// job keeps `Infinity` rather than being handed the rock's number.
export const handsOf = job =>
  job === JOB.ROCK ? ROCK_GANG :
  job === JOB.HAUL ? LIP_GANG :
  capOfBare(job);


// A full set of a station's kit: its trade's set, or its whole complement if
// that is smaller -- the outhouse's two posts are fully kitted at two. Read
// off `kitSetOf` rather than the board's ceiling; the cart row has no ceiling
// and a set is still three.
export const kitCap = job => Math.min(handsOf(job), kitSetOf(job));

export const kitFull = job => hasKit(job) && hats(job) >= kitCap(job);

// The gang in bare pairs of hands: a hat is a flat doubling, so a hatted body
// counts twice. A sum, not a multiplier -- with kit capped below the
// complement there is no one number that describes every body. A station
// whose machine took its kit is counted at a full set, because the machine
// was gated behind a full set and then took it (`buyMachine`).
export const gangWorth = job => {
  const n = handsOf(job);
  if (!isFinite(n)) return n;
  const m = machineFor(job) || (JOB_MACHINE[job] && machine(JOB_MACHINE[job]));
  const hatted = (m && m.bought && m.tookKit) ? kitCap(job) : Math.min(hats(job), n);
  return n + hatted;
};

// A machine's rate is measured against the gang a full set of hats made
// (`gangWorth`), so the specialists are the thing you finish before the
// machine and the machine is worth `MACHINE_GAIN` over them. Every machine's
// rate runs through here, so a tuning ladder is a number in a record rather
// than four rate functions.
export const machineRate = job =>
  gangWorth(job) * MACHINE_GAIN
  * (machineFor(job)?.driven ? 2 : 1)
  * tuneGain(JOB_MACHINE[job])
  * (spelled('drive') ? SPELL_DRIVE : 1);

// Put a gang back where a machine displaced it. `rebalance` only clamps down,
// so a lever thrown off has to ask for its bodies back. It restores from
// whatever is idle and never conjures bodies. `want` of nought is the other
// direction: a machine switched on, and this only lets `rebalance` clamp.
export function restaff(job, want) {
  const room = Math.max(0, Math.min(want, capOf(job)) - S[job]);
  if (room > 0) S[job] += Math.min(room, Math.max(0, idle()));
  rebalance();
  syncWorkers();
  S.dirty = true;
}

// A station whose machine took its kit owns no hats. Zeroed here, the one
// place allowed to move counts about, and because a save can arrive with
// both a machine and a full set. `stepKit` walks any head still wearing one
// over to hand it in.
export function stripKit() {
  for (const m of MACHINES) {
    const r = machine(m.key);
    if (!r || !r.bought || !r.tookKit) continue;
    const trade = TRADE_OF[m.job];
    if (trade && S[trade] > 0) { S[trade] = 0; S.dirty = true; }
  }
}

export function rebalance() {
  // A station cannot hold more bodies than places to stand; a save from a
  // wider plot can say otherwise, and the extras go back to carrying. Over
  // `JOBS`, not a hand-kept copy: the copy once left the rock off because its
  // cap was `Infinity`, and then the ram made it finite.
  for (const job of JOBS) S[job] = Math.min(S[job], capOf(job));
  // Hats are not clamped to bodies -- the kit belongs to the place.
  for (const job of Object.keys(TRADE_OF)) S[TRADE_OF[job]] = Math.max(0, S[TRADE_OF[job]]);
  for (const k of ['carryLevel', 'speedLevel', 'pickLevel', 'rockhandPickLevel', 'critMultLevel',
                   'rockhandSpeedLevel', 'haulCarryLevel', 'haulPaceLevel'])
    S[k] = Math.max(0, Math.min(LADDER, S[k] || 0));
  // Builders are derived, one a site, never the whole yard: a build that
  // swallowed every idle body would stop the dust moving.
  const sites = busyBuilderSites();
  const gang = sites.length;
  // Nobody spare: the body standing nearest the site is *lent* -- taken off
  // its count, which makes it spare -- and given back when nothing is left to
  // build. The loan rides on the body (`lentFrom`) rather than in a list
  // beside it, so a reload cannot come back owing a debt no body carries and
  // a repayment cannot land on top of a move the player made meanwhile.
  for (let short = sites.length - Math.max(0, spareHands()); short > 0; short--) {
    const w = nearestLendable(sites);
    if (!w) break;
    const job = JOB_OF[w.type];
    w.lentFrom = job;                    // stood down first, see syncWorkers
    S[job]--;
  }
  // Given back only if there is still room there and a body spare to be the
  // one going home; a count handed back that nobody stands behind is a roster
  // that reads higher than the crew for ever.
  if (!sites.length) {
    for (const w of S.workers) {
      const job = w.lentFrom;
      if (!job) continue;
      delete w.lentFrom;
      if (roomAt(job) > 0 && spareHands() > 0) S[job]++;
    }
  }
  S.lent = S.workers.filter(w => w.lentFrom).map(w => w.lentFrom);
  S.builders = sites.length ? Math.min(gang, Math.max(0, spareHands())) : 0;
  // Carrying is what a body does when it is on nothing, less whoever is
  // building. The carts are the lip's kit and are not held out of this.
  S.haulers = Math.max(0, spareHands() - S.builders);
}

// The station body nearest any site that wants one and not already lent.
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

// A loan taken off a job the player has just re-set is forgiven, not repaid:
// the roster shows the count with the loan already off it, so repaying on top
// of the press undoes what the player just did. `rebalance` borrows again
// against the new count if the build still needs somebody.
const forgive = job => { for (const w of S.workers) if (w.lentFrom === job) delete w.lentFrom; };

// Move one body on to a job, or off it and back to carrying. The hat it was
// wearing stays at the station.
export function assign(job, d) {
  if (d > 0 && idle() < 1) return;
  if (d > 0 && roomAt(job) < 1) return;
  if (d < 0 && S[job] < 1) return;
  S[job] += d;
  forgive(job);
  rebalance();
  syncWorkers();
  S.dirty = true;
  buildShop();
}

// The one thing you hire, bought where the crew live: a hire is a room, and
// the settlement is drawn off the headcount. There is no row for the first
// body; the opening hands you one (intro.js).
export const HOUSE_ROW = {
  key: 'house',
  name: 'another house',
  kind: 'building', site: 'yard', at: () => nextHouseAt(),
  // Its own curve off how many rooms stand, because a `building` with no
  // `rung` would get one flat number from `workFor` for ever. Clamped at zero
  // so the body the intro hands you does not push the first bought house up
  // the curve.
  work: () => Math.min(HOUSE_WORK_MAX,
    HOUSE_WORK0 * Math.pow(HOUSE_WORK_STEP, Math.max(0, S.crew - 1))),
  from: () => S.crew,
  to: () => S.crew + 1,
  // Steeper than the ladders' rate on purpose: every body compounds the
  // income every ladder is priced against, so the crew is the one curve that
  // must outrun the shop's.
  cost: () => Math.round(HOUSE_COST0 * Math.pow(HOUSE_RATE, Math.max(0, S.crew - 1))
                         * (spelled('thrift') ? SPELL_THRIFT : 1)),
  buy: hire,
  show: () => S.crew > 0
};
// Not one of `UPGRADES` (it lives on the crew board), but a work coming out
// of a save still has to find its way back to this row's `buy`.
registerRows([HOUSE_ROW]);

// What the bench sells, in the order it is written down. A new row is a row in
// one of the `src/upgrades/rows-*.js` files; a new section is a file and a
// line here.
export const UPGRADES = chained([
  ...BENCH_ROWS,
  ...LUCK_ROWS,
  ...ROCK_ROWS,
  ...CREW_ROWS,
  ...FARM_ROWS,
  ...KIT_ROWS,
  ...SCRUB_ROWS,
  ...TOWER_ROWS,
  ...CASINO_ROWS,
  ...APOTHECARY_ROWS,
  ...TUNING_ROWS,
  ...QUARRY_ROWS,
  ...OUTHOUSE_ROWS,
  ...SHACK_ROWS,
  ...SHIELD_ROWS
]);

registerRows(UPGRADES);

// The rows on this list that another station's sheet draws (`u.board`).
export const lodgers = board => UPGRADES.filter(u => u.board === board);

// The order and grouping on the bench. A section with nothing to show is left
// out. The shield on offer is the goal card: its own frame, above everything
// for sale. Everything not yet built is under one "build" heading, because
// those are the one group that cannot be sold at the place they belong to --
// the place is what they buy.
export const SECTIONS = [
  { title: 'the sky', goal: true, keys: ['props', 'net', 'arch', 'askwizards'] },
  { title: 'you', keys: ['carry', 'auto', 'speed', 'pick'] },
  { title: 'lucky swings', keys: ['critchance', 'critmult'] },
  { title: 'the haulers', keys: ['haulcarry', 'haulpace', 'carter', 'belt', 'tunebelt'] },
  { title: 'build', keys: [
    'unlockquarry', 'unlockfarm', 'unlockapothecary', 'unlockcasino',
    'unlockshack', 'unlockouthouse', 'unlocktower',
    'unlockscrub'
  ] }
];

// What the bench has to say for itself without being opened. One place
// decides it, so the drawing and the check that reads it cannot drift.

export const openSections = () =>
  SECTIONS.filter(sect => sect.keys.some(k => {
    const u = UPGRADES.find(x => x.key === k);
    return u && u.show();
  })).map(sect => sect.title);

// Something you could buy and actually press this second: a row bought and
// waiting its turn is not one, since pressing it hands it back.
export const canAfford = () =>
  UPGRADES.some(u => !u.job && u.show() && !u.dead?.() && canPay(u) && !inLine(u));

export const unseenSection = () =>
  openSections().some(title => !S.seenSects.includes(title));

export const benchMark = () =>
  !S.seenBench ? '' : unseenSection() ? 'flag' : canAfford() ? 'dot' : '';

export function markSectionsSeen() {
  S.seenSects = openSections();
  S.dirty = true;
}

// Take one currency out of wherever it is kept. Dust is lifted out of the
// pile; every other coin is a grain in that pile, so paying lifts that many
// grains out of it. `spendHeld` takes off what the rift is holding for
// whatever the hole did not have, the same order paying in dust keeps.
export function take(money, n) {
  if (!n) return;
  if (money === 'dust') spend(n);
  else if (money === 'core') { S.cores -= n; spendHeld(n, CORE_CELL); }
  else if (money === 'shard') { S.shards -= n; spendHeld(n, SHARD_CELL); }
  else if (money === 'spore') { S.spores -= n; spendHeld(n, SPORE_CELL); }
  else if (money === 'spark') { S.sparks -= n; spendHeld(n, SPARK_CELL); }
}

// What a row costs, as [currency, amount] pairs. A row says `cost` and
// `currency` (or `bill` for several coins at once); the dust every row also
// costs is derived here from `DUST_PER`, so no row can forget it -- a row
// that wants a different dust number names dust itself. A row past the bench
// gets its time appended the same way: what is left of the build if it is on,
// else the whole of it. `time` is not a coin and buys no dust.
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

// Being built, or bought and waiting its turn; only the second can be pressed
// again to hand it back. A site takes a line, so no row is refused for what
// its neighbor is doing.
export const building = u => takesTime(u) && !!workOn(u.key);
export const inLine = u => takesTime(u) && waiting(u.site, u.key);
export const lineAt = u => placeOf(u.site, u.key);

// A price in the words it is said in: coins in the counter's short form,
// time off a clock.
export const priceText = (money, n) =>
  money !== 'time' ? fmt(n) :
  n >= 60000 ? `${Math.round(n / 60000)} min` : `${Math.ceil(n / 1000)}`;

// Time left on a build, to the second: `0:47`, `1:02:05`. Ceiling, so it
// reads 0:01 until the last blow and never 0:00 on a thing not up.
export const leftText = ms => {
  const s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60) % 60, h = Math.floor(s / 3600);
  const two = n => String(n).padStart(2, '0');
  return h ? `${h}:${two(m)}:${two(s % 60)}` : `${m}:${two(s % 60)}`;
};
export const ordinal = n =>
  n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

export const canPay = u => billOf(u).every(([money, n]) => purse(money) >= n);

// True when something was actually bought. The board reads it to decide
// whether to put itself away; a press that bought nothing must leave it open,
// or a sheet shutting on a bill you cannot pay looks like it took the money.
export function buy(u) {
  if (u.job || u.dial) return false;   // a job row moves bodies and a dial sets a number
  // A signpost costs nothing; pressing it only points somewhere.
  if (u.sign) { if (u.show() && !u.dead?.()) u.buy(); return false; }
  // A payout row (the casino's two decisions) takes nothing and is done at
  // the table, so the board stays up for the next hand.
  if (u.price) {
    if (!u.show() || u.dead?.()) return false;
    u.buy(); S.dirty = true; buildShop();
    return false;
  }
  // Pressed again within the undo's window, the last purchase is taken back
  // (DESIGN.md, "A tap buys"): a clean tap on the wrong tile is the one
  // mistake the tap gate cannot catch, so the tile offers the way back.
  if (undoable(u)) return !undoBuy();
  // Pressing a row in line hands it back: the bill comes back in full and
  // arcs from where it would have stood to the pile. Not a purchase.
  if (inLine(u)) {
    const box = siteBox(u.site, workOn(u.key));
    const bill = billOf(u);
    if (!pullOut(u.site, u.key)) return false;
    const x = box ? box.x + box.w / 2 : S.cx, y = (box?.y ?? S.groundY) - P * 2;
    for (const [money, n] of bill) if (money !== 'time') refund(money, n, x, y);
    S.dirty = true;
    buildShop();
    return false;
  }
  if (!u.show() || u.dead?.() || maxed(u) || !canPay(u)) return false;
  if (building(u)) return false;
  // Past the bench, paying starts the yard building; the row's own `buy`
  // runs when the work lands. The work is started BEFORE the bill is taken:
  // a yard row's dust flies to the ground the thing goes up on, and that
  // ground does not exist until `start` reserves it. A start that comes to
  // nothing returns before a coin is touched.
  if (takesTime(u) && !start(u.site, u, u.at?.())) return false;

  // What is spent flies to where it is going -- the row's own site, or the
  // box of the work just started -- and `payTo` is cleared straight after so
  // a spend with nobody's destination around it falls back to the bench.
  const box = u.site === 'yard' ? siteBox('yard', workOn(u.key))
            : u.site           ? siteBox(u.site)
            : null;
  if (box) payTo(box.x + box.w / 2, (box.y ?? S.groundY) - P * 2);
  // Nothing is taken until all of it can be (`canPay` above).
  const bill = billOf(u);
  for (const [money, n] of bill) if (money !== 'time') take(money, n);
  payTo();

  if (!takesTime(u)) u.buy();
  // A work in the yard's hands can be handed back for a moment; a row bought
  // and had (no work) has done its thing and cannot.
  S.undo = takesTime(u) ? { key: u.key, site: u.site, bill: bill.filter(([m]) => m !== 'time'), at: now() } : null;
  S.dirty = true;
  buildShop();
  return true;
}

// --- taking a purchase back ---------------------------------------------------------
// The last purchase, for UNDO_MS after it was made, while the yard has not
// finished it: pressing its tile (or the queue card's line) puts the work
// down unbuilt and the bill back in the pit -- the bill as it was charged,
// since a rung's next bill is dearer than the one just paid. A work that has
// landed is had, and is not offered back.
export const undoable = u =>
  !!S.undo && S.undo.key === u.key && now() - S.undo.at <= UNDO_MS && !!workOn(u.key);

export function undoBuy() {
  const last = S.undo;
  if (!last) return false;
  if (now() - last.at > UNDO_MS || !workOn(last.key)) { S.undo = null; return false; }
  const u = rowFor(last.key);
  const box = siteBox(last.site, workOn(last.key));
  if (!u || !abandonAt(last.site, last.key)) { S.undo = null; return false; }
  const x = box ? box.x + box.w / 2 : S.cx, y = (box?.y ?? S.groundY) - P * 2;
  for (const [money, n] of last.bill) refund(money, n, x, y);
  S.undo = null;
  S.dirty = true;
  buildShop();
  return true;
}
