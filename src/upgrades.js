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

export const capacity = () => CAP_BASE + S.carryLevel * CAP_STEP;
export const mineMs = (lvl = S.speedLevel) => Math.max(MINE_FLOOR, Math.round(MINE_BASE * Math.pow(0.8, lvl)));
export const mineRate = (lvl = S.speedLevel) => 1000 / mineMs(lvl);
export const minerMs = (lvl = S.minerSpeedLevel) => Math.max(MINER_FLOOR, Math.round(MINER_BASE * Math.pow(0.82, lvl)));
export const minerRate = (lvl = S.minerSpeedLevel) => 1000 / minerMs(lvl);
export const drillMs = (lvl = S.drillSpeedLevel) => Math.max(DRILL_FLOOR, Math.round(DRILL_BASE * Math.pow(0.82, lvl)));
export const drillRate = (lvl = S.drillSpeedLevel) => 1000 / drillMs(lvl);
export const haulCap = (lvl = S.haulCarryLevel) => 1 + lvl;
export const haulSpeed = (lvl = S.haulPaceLevel) => HAUL_BASE * (1 + 0.3 * lvl);
export const scoopMs = (lvl = S.haulPaceLevel) => Math.max(30, Math.round(HAUL_MS * Math.pow(0.85, lvl)));
export const pickCount = () => 1 + S.pickLevel;         // pixels a single swing takes

// units are the marks themselves: a grain of dust, a grain a second
export const UNITS = {
  'px': '<i class="dust"></i>',
  'px/s': '<i class="dust"></i>/s'
};

export const num = v => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
export const rateText = lvl => num(mineRate(lvl));

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
  {
    key: 'unlockminers',
    name: 'first miner',
    cost: () => 1,
    currency: 'core',
    buy: () => { S.minersUnlocked = true; S.miners++; syncWorkers(); },
    show: () => S.seenCore && !S.minersUnlocked
  },
  {
    key: 'miner',
    name: 'miners',
    from: () => S.miners,
    to: () => S.miners + 1,
    cost: () => Math.round(60 * Math.pow(1.7, Math.max(0, S.miners - 1))),
    buy: () => { S.miners++; syncWorkers(); },
    show: () => S.minersUnlocked
  },
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
  {
    key: 'unlockhaulers',
    name: 'first worker',
    cost: () => 2,
    currency: 'core',
    buy: () => { S.haulersUnlocked = true; S.haulers++; syncWorkers(); },
    show: () => S.seenCore && !S.haulersUnlocked
  },
  {
    key: 'hauler',
    name: 'workers',
    from: () => S.haulers,
    to: () => S.haulers + 1,
    cost: () => Math.round(80 * Math.pow(1.7, Math.max(0, S.haulers - 1))),
    buy: () => { S.haulers++; syncWorkers(); },
    show: () => S.haulersUnlocked
  },
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
  {
    key: 'unlockdrillers',
    name: 'first driller',
    cost: () => 3,
    currency: 'core',
    buy: () => { S.drillersUnlocked = true; S.drillers++; syncWorkers(); },
    show: () => S.seenCore && !S.drillersUnlocked
  },
  {
    key: 'driller',
    name: 'drillers',
    from: () => S.drillers,
    to: () => S.drillers + 1,
    cost: () => Math.round(140 * Math.pow(1.6, Math.max(0, S.drillers - 1))),
    buy: () => { S.drillers++; syncWorkers(); },
    show: () => S.drillersUnlocked
  },
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
