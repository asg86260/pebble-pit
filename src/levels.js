// What every ladder and every station is worth now.
//
// Pure functions of `S`, the config, the kit, the machines and the world:
// the rate a body swings at, what a hauler carries, how many can stand at a
// station, what a hat is worth. This is the one file of the four that came
// out of upgrades.js that the sim may import; nothing here knows there is a
// board, a row or a price, so a station reading its pace from here does not
// drag the shop into its load order.

import { LADDER, rungValue, HAUL_SCOOP_MS } from './config.js';
import { COMMUTE_PACE, HAUL_EMPTY, HOME_HURRY } from './config.js';
import { MACHINE_GAIN, ROCK_GANG, LIP_GANG, SPELL_DRIVE } from './config.js';
import { S } from './state.js';
import { benches, plotCount } from './world.js';
import { machineFor, UNMANNED, machine, JOB_MACHINE, tuneGain } from './machines.js';
import { spelled } from './tower.js';
import { TRADE_OF, JOB_OF, stockOf, hasKit, kitSetOf } from './kit.js';
import { JOB } from './jobs.js';

export const capacity = (lvl = S.carryLevel) => rungValue('carry', lvl);

// `rungCost` and `DUST_PER` live in upgrades/price.js, a leaf, so the ladder
// helper can price a row without importing this file.
import { rungCost, DUST_PER } from './upgrades/price.js';
export { rungCost, DUST_PER };

export const mineRate = (lvl = S.speedLevel) => rungValue('speed', lvl);
export const mineMs = (lvl = S.speedLevel) => Math.max(1, Math.round(1000 / mineRate(lvl)));
// Hold to toss: how often a held hand lets a handful go, and how far it
// carries (a handful aimed past that lands short, on the ground).
export const tossRate = (lvl = S.tossSpeedLevel) => rungValue('toss', lvl);
export const tossMs = (lvl = S.tossSpeedLevel) => Math.max(1, Math.round(1000 / tossRate(lvl)));
export const tossReach = (lvl = S.tossReachLevel) => rungValue('reach', lvl);
export const rockhandRate = (lvl = S.rockhandSpeedLevel) => rungValue('rockhandspeed', lvl);
export const rockhandMs = (lvl = S.rockhandSpeedLevel) => Math.max(1, Math.round(1000 / rockhandRate(lvl)));
export const haulCap = (lvl = S.haulCarryLevel) => rungValue('haulcarry', lvl);
// The walk is written in px/s and stepped in px a frame.
export const haulSpeed = (lvl = S.haulPaceLevel) => rungValue('haulpace', lvl) / 60;
// The scoop rides the pace ladder, off its own written list; no row reads it.
export const scoopMs = (lvl = S.haulPaceLevel) =>
  Math.max(1, HAUL_SCOOP_MS[Math.max(0, Math.min(HAUL_SCOOP_MS.length - 1, lvl | 0))]);
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

// --- the kit ----------------------------------------------------------------
// A hat belongs to the station, not to the head under it. Whoever stands at
// the station wears whatever is lying there; move everybody off and the hats
// stay behind. Which station owns which hats, and what job a body is doing
// from what it is, live in kit.js and are passed through here.
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
  // One body in the air filter: a second pair of hands at one fan is a queue.
  job === JOB.PURIFY ? 1 :
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
