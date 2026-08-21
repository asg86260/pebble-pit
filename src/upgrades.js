// What the bench sells, and what each thing costs.
//
// One row is one object. Every field is a function of the current game, so a row
// never holds a stale number, and adding an upgrade is adding an object -- no
// other file has to know about it. `SECTIONS` decides the order and the grouping
// on the board.

import {
  CAP_BASE, CAP_STEP, MINE_BASE, MINE_FLOOR, MINER_BASE, MINER_FLOOR,
  HAUL_MS, HAUL_BASE, CAVE_FLOOR, TEND_FLOOR
} from './config.js';
import { S, cave, farm, lab, meteor } from './state.js';
import { spend, takeCoreCells } from './pit.js';
import { lookAt } from './world.js';
import { syncWorkers } from './crew.js';
import { caveMs, caveRate } from './cave.js';
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
export const pickCount = () => 1 + S.pickLevel;         // pixels a single swing takes

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
  money === 'spark' ? S.sparks : S.stored;

// units are the marks themselves: a grain of dust, a grain a second
export const UNITS = {
  'px': '<i class="dust"></i>',
  'px/s': '<i class="dust"></i>/s',
  'trips/min': '<i class="shard"></i>/min',
  'beds/min': '<i class="spore"></i>/min'
};

export const num = v => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
export const rateText = lvl => num(mineRate(lvl));


// Hiring is the same story three times over, and will be five when the cave and
// the farm open: a core-priced row that unlocks the type and hires the first
// one, then a dust-priced row that hires the next. The stat rows differ enough
// to be worth writing out, so they are not folded in here.
function crew({ key, unlockKey, one, many, cores, base, mult, count, unlocked, onOpen }) {
  return [
    {
      key: unlockKey,
      name: one,
      cost: () => cores,
      currency: 'core',
      buy: () => { S[unlocked] = true; S[count]++; syncWorkers(); if (onOpen) onOpen(); },
      show: () => S.seenCore && !S[unlocked]
    },
    {
      key,
      name: many,
      from: () => S[count],
      to: () => S[count] + 1,
      cost: () => Math.round(base * Math.pow(mult, Math.max(0, S[count] - 1))),
      buy: () => { S[count]++; syncWorkers(); },
      show: () => S[unlocked]
    }
  ];
}

const MINERS = crew({
  key: 'miner', unlockKey: 'unlockminers', one: 'first miner', many: 'miners',
  cores: 1, base: 60, mult: 1.7, count: 'miners', unlocked: 'minersUnlocked'
});
const SPELUNKERS = crew({
  key: 'spelunker', unlockKey: 'unlockcave', one: 'open the cave', many: 'spelunkers',
  cores: 3, base: 220, mult: 1.7, count: 'spelunkers', unlocked: 'caveOpen',
  onOpen: () => lookAt(cave.x + cave.w / 2)    // show them what they just bought
});
const FARMHANDS = crew({
  key: 'farmhand', unlockKey: 'unlockfarm', one: 'break the ground', many: 'farmhands',
  cores: 5, base: 400, mult: 1.7, count: 'farmhands', unlocked: 'farmOpen',
  onOpen: () => lookAt(farm.x + farm.w / 2)
});
// One place at a time. Banking a single core used to reveal every site in the
// game at once, which spoils the whole chain: each one is a surprise that the
// last one earns.
SPELUNKERS[0].show = () => S.seenCore && !S.caveOpen;
FARMHANDS[0].show = () => S.caveOpen && !S.farmOpen;
const WORKERS = crew({
  key: 'hauler', unlockKey: 'unlockhaulers', one: 'first worker', many: 'workers',
  cores: 2, base: 80, mult: 1.7, count: 'haulers', unlocked: 'haulersUnlocked'
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
    show: () => mineMs() > MINE_FLOOR
  },
  {
    key: 'pick',
    name: 'pick',
    unit: 'px',
    from: () => pickCount(),
    to: () => pickCount() + 1,
    cost: () => 2 + S.pickLevel,
    currency: 'core',
    buy: () => S.pickLevel++,
    show: () => S.seenCore
  },
  ...MINERS,
  {
    key: 'minerspeed',
    name: 'miner swing',
    unit: 'px/s',
    from: () => num(minerRate()),
    to: () => num(minerRate(S.minerSpeedLevel + 1)),
    cost: () => Math.round(70 * Math.pow(1.8, S.minerSpeedLevel)),
    buy: () => S.minerSpeedLevel++,
    show: () => S.miners > 0 && minerMs() > MINER_FLOOR
  },
  ...WORKERS,
  {
    key: 'haulcarry',
    name: 'worker load',
    from: () => haulCap(),
    to: () => haulCap(S.haulCarryLevel + 1),
    cost: () => Math.round(50 * Math.pow(1.5, S.haulCarryLevel)),
    buy: () => S.haulCarryLevel++,
    show: () => S.haulers > 0
  },
  {
    key: 'haulpace',
    name: 'worker pace',
    unit: 'px/s',
    from: () => num(haulSpeed() * 60),
    to: () => num(haulSpeed(S.haulPaceLevel + 1) * 60),
    cost: () => Math.round(60 * Math.pow(1.7, S.haulPaceLevel)),
    buy: () => S.haulPaceLevel++,
    show: () => S.haulers > 0
  },
  ...SPELUNKERS,
  {
    key: 'cavepace',
    name: 'cave lamps',
    unit: 'trips/min',
    from: () => num(caveRate()),
    to: () => num(caveRate(S.cavePaceLevel + 1)),
    cost: () => Math.round(180 * Math.pow(1.75, S.cavePaceLevel)),
    buy: () => S.cavePaceLevel++,
    show: () => S.spelunkers > 0 && caveMs() > CAVE_FLOOR
  },
  {
    key: 'unlocklab',
    name: 'build the lab',
    cost: () => 7,
    currency: 'core',
    buy: () => { S.labOpen = true; lookAt(lab.x + lab.w / 2); },
    show: () => S.seenCore && !S.labOpen && (S.seenShard || S.seenSpore)
  },
  {
    key: 'unlockmeteor',
    name: 'call it down',
    cost: () => 9,
    currency: 'core',
    buy: () => { S.meteorOpen = true; S.meteorAt = 0; lookAt(meteor.x); },
    show: () => S.labOpen && !S.meteorOpen
  },
  ...FARMHANDS,
  {
    key: 'tend',
    name: 'tending',
    unit: 'beds/min',
    from: () => num(tendRate()),
    to: () => num(tendRate(S.tendLevel + 1)),
    cost: () => Math.round(320 * Math.pow(1.75, S.tendLevel)),
    buy: () => S.tendLevel++,
    show: () => S.farmhands > 0 && tendMs() > TEND_FLOOR
  }
];

// The order and the grouping on the board. A section with nothing to show in it
// is left out, so rows appear as they are unlocked.
export const SECTIONS = [
  { title: 'you', keys: ['carry', 'auto', 'speed', 'pick'] },
  { title: 'miners', keys: ['unlockminers', 'miner', 'minerspeed'] },
  { title: 'workers', keys: ['unlockhaulers', 'hauler', 'haulcarry', 'haulpace'] },
  { title: 'the cave', keys: ['unlockcave', 'spelunker', 'cavepace'] },
  { title: 'the farm', keys: ['unlockfarm', 'farmhand', 'tend'] },
  { title: 'the lab', keys: ['unlocklab'] },
  { title: 'the sky', keys: ['unlockmeteor'] }
];

// Buying is the same shape whatever the row and whatever it is priced in: check
// you can afford it, take the price out of wherever that currency is kept, then
// let the row do its one thing.
export function buy(u) {
  const cost = u.cost();
  const money = u.currency || 'dust';
  if (!u.show() || purse(money) < cost) return;

  if (money === 'dust') spend(cost);              // lifted back out of the pile
  else if (money === 'core') { S.cores -= cost; takeCoreCells(cost); }
  else if (money === 'shard') S.shards -= cost;
  else if (money === 'spore') S.spores -= cost;
  else if (money === 'spark') S.sparks -= cost;

  u.buy();
  S.dirty = true;
  buildShop();
}
