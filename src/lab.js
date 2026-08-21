// The lab: where shards and spores turn into pace.
//
// The bench sells you *more* -- another miner, another worker, another trip. The
// lab sells you *faster*, across the whole operation at once, and it is the only
// place a multiplier lives. Everything it sells is a rate: a pixel of rock is
// still worth exactly one dust wherever it came from, which is a rule the game
// keeps, so growth has to come from doing the same work sooner.
//
// It also keeps the books. Nobody can tell whether a purchase helped by watching
// a pile, so the lab reports what the operation is actually doing per minute.

import { S } from './state.js';

// Each level is a quarter again on top. Four ladders, deliberately few: three
// currencies and a wall of percentages is where cozy turns into a spreadsheet.
export const STEP = 1.25;

export const mult = k => Math.pow(STEP, S.mult[k] || 0);

export const LAB_UPGRADES = [
  {
    key: 'labswing',
    name: 'sharper picks',
    from: () => `x${mult('swing').toFixed(2)}`,
    to: () => `x${(mult('swing') * STEP).toFixed(2)}`,
    cost: () => Math.round(3 * Math.pow(1.9, S.mult.swing)),
    currency: 'shard',
    buy: () => S.mult.swing++,
    show: () => true
  },
  {
    key: 'labhaul',
    name: 'stronger backs',
    from: () => `x${mult('haul').toFixed(2)}`,
    to: () => `x${(mult('haul') * STEP).toFixed(2)}`,
    cost: () => Math.round(4 * Math.pow(1.9, S.mult.haul)),
    currency: 'shard',
    buy: () => S.mult.haul++,
    show: () => true
  },
  {
    key: 'labcave',
    name: 'deeper shafts',
    from: () => `x${mult('cave').toFixed(2)}`,
    to: () => `x${(mult('cave') * STEP).toFixed(2)}`,
    cost: () => Math.round(3 * Math.pow(1.9, S.mult.cave)),
    currency: 'spore',
    buy: () => S.mult.cave++,
    show: () => true
  },
  {
    key: 'labtend',
    name: 'richer beds',
    from: () => `x${mult('tend').toFixed(2)}`,
    to: () => `x${(mult('tend') * STEP).toFixed(2)}`,
    cost: () => Math.round(4 * Math.pow(1.9, S.mult.tend)),
    currency: 'spore',
    buy: () => S.mult.tend++,
    show: () => true
  }
];

export const LAB_SECTIONS = [
  { title: 'the work', keys: ['labswing', 'labhaul'] },
  { title: 'the ground', keys: ['labcave', 'labtend'] }
];

// --- the books --------------------------------------------------------------
// A rate nobody can see is a rate nobody can weigh a purchase against. These are
// smoothed, because a raw per-second count of something that arrives in lumps
// reads as noise.

const WATCH = ['stored', 'shards', 'spores', 'cores'];
const EASE = 0.25;                         // how fast the reading follows reality

export const rates = { stored: 0, shards: 0, spores: 0, cores: 0 };
let last = null, lastAt = 0;

// after a reset the books are meaningless: a counter going to zero is not a
// negative rate
export function resetRates() {
  last = null;
  for (const k of WATCH) rates[k] = 0;
}

export function sampleRates(now) {
  if (!last) { last = snapshot(); lastAt = now; return; }
  const dt = now - lastAt;
  if (dt < 500) return;                    // often enough to feel live, rarely enough to be steady

  const nowVals = snapshot();
  for (const k of WATCH) {
    const perMin = (nowVals[k] - last[k]) * 60000 / dt;
    rates[k] += (perMin - rates[k]) * EASE;
    if (Math.abs(rates[k]) < 0.001) rates[k] = 0;
  }
  last = nowVals;
  lastAt = now;
}

const snapshot = () => ({ stored: S.stored, shards: S.shards, spores: S.spores, cores: S.cores });

// what the stats page says, in the order it says it
export function bookRows() {
  const rows = [
    ['dust a minute', Math.round(rates.stored), 'dust'],
    ['in the hole', S.stored, 'dust']
  ];
  if (S.seenShard) rows.push(['shards a minute', rates.shards.toFixed(1), 'shard']);
  if (S.seenSpore) rows.push(['spores a minute', rates.spores.toFixed(1), 'spore']);
  if (S.seenCore) rows.push(['rocks finished', S.boulderNo - 1, 'core']);
  rows.push(['crew', S.miners + S.haulers + S.spelunkers + S.farmhands, '']);
  return rows;
}
