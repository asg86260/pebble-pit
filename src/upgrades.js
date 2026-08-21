// What the bench sells, and what each thing costs.
//
// One row is one object. Every field is a function of the current game, so a row
// never holds a stale number, and adding an upgrade is adding an object -- no
// other file has to know about it. `SECTIONS` decides the order and the grouping
// on the board.

import {
  CAP_BASE, CAP_STEP, MINE_BASE, MINE_FLOOR, MINER_BASE, MINER_FLOOR,
  DRILL_BASE, DRILL_FLOOR, HAUL_MS, HAUL_BASE
} from './config.js';
import { S } from './state.js';
import { spend, takeCoreCells } from './pit.js';
import { syncWorkers } from './crew.js';
import { buildShop } from './shop.js';

// Every swing in the game is the same shape: a gap in milliseconds that shrinks
// by a fixed fraction per level and never goes below a floor. One function, five
// swings -- the next kind of worker gets its speed for a line.
const swing = (base, floor, per) => lvl => Math.max(floor, Math.round(base * Math.pow(per, lvl)));
const perSecond = ms => lvl => 1000 / ms(lvl);

export const capacity = () => CAP_BASE + S.carryLevel * CAP_STEP;

const mineGap = swing(MINE_BASE, MINE_FLOOR, 0.8);
const minerGap = swing(MINER_BASE, MINER_FLOOR, 0.82);
const drillGap = swing(DRILL_BASE, DRILL_FLOOR, 0.82);
const scoopGap = swing(HAUL_MS, 30, 0.85);

export const mineMs = (lvl = S.speedLevel) => mineGap(lvl);
export const mineRate = (lvl = S.speedLevel) => perSecond(mineGap)(lvl);
export const minerMs = (lvl = S.minerSpeedLevel) => minerGap(lvl);
export const minerRate = (lvl = S.minerSpeedLevel) => perSecond(minerGap)(lvl);
export const drillMs = (lvl = S.drillSpeedLevel) => drillGap(lvl);
export const drillRate = (lvl = S.drillSpeedLevel) => perSecond(drillGap)(lvl);
export const haulCap = (lvl = S.haulCarryLevel) => 1 + lvl;
export const haulSpeed = (lvl = S.haulPaceLevel) => HAUL_BASE * (1 + 0.3 * lvl);
export const scoopMs = (lvl = S.haulPaceLevel) => scoopGap(lvl);
export const pickCount = () => 1 + S.pickLevel;         // pixels a single swing takes

// units are the marks themselves: a grain of dust, a grain a second
export const UNITS = {
  'px': '<i class="dust"></i>',
  'px/s': '<i class="dust"></i>/s'
};

export const num = v => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
export const rateText = lvl => num(mineRate(lvl));


// Hiring is the same story three times over, and will be five when the cave and
// the farm open: a core-priced row that unlocks the type and hires the first
// one, then a dust-priced row that hires the next. The stat rows differ enough
// to be worth writing out, so they are not folded in here.
function crew({ key, unlockKey, one, many, cores, base, mult, count, unlocked }) {
  return [
    {
      key: unlockKey,
      name: one,
      cost: () => cores,
      currency: 'core',
      buy: () => { S[unlocked] = true; S[count]++; syncWorkers(); },
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
const WORKERS = crew({
  key: 'hauler', unlockKey: 'unlockhaulers', one: 'first worker', many: 'workers',
  cores: 2, base: 80, mult: 1.7, count: 'haulers', unlocked: 'haulersUnlocked'
});
const DRILLERS = crew({
  key: 'driller', unlockKey: 'unlockdrillers', one: 'first driller', many: 'drillers',
  cores: 3, base: 140, mult: 1.6, count: 'drillers', unlocked: 'drillersUnlocked'
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
  ...DRILLERS,
  {
    key: 'drillspeed',
    name: 'driller bite',
    unit: 'px/s',
    from: () => num(drillRate()),
    to: () => num(drillRate(S.drillSpeedLevel + 1)),
    cost: () => Math.round(120 * Math.pow(1.7, S.drillSpeedLevel)),
    buy: () => S.drillSpeedLevel++,
    show: () => S.drillers > 0 && drillMs() > DRILL_FLOOR
  }
];

// The order and the grouping on the board. A section with nothing to show in it
// is left out, so rows appear as they are unlocked.
export const SECTIONS = [
  { title: 'you', keys: ['carry', 'auto', 'speed', 'pick'] },
  { title: 'miners', keys: ['unlockminers', 'miner', 'minerspeed'] },
  { title: 'workers', keys: ['unlockhaulers', 'hauler', 'haulcarry', 'haulpace'] },
  { title: 'drillers', keys: ['unlockdrillers', 'driller', 'drillspeed'] }
];

// Buying is the same shape whatever the row: check you can, take the price out
// of wherever it is kept, then let the row do its one thing.
export function buy(u) {
  const cost = u.cost();
  if (!u.show()) return;
  if (u.currency === 'core') {
    if (S.cores < cost) return;
    S.cores -= cost;
    takeCoreCells(cost);
  } else {
    if (S.stored < cost) return;
    spend(cost);
  }
  u.buy();
  S.dirty = true;
  buildShop();
}
