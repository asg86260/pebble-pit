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

// `works` is on top of everything, which is what makes a spark worth the trip
export const mult = k =>
  Math.pow(STEP, S.mult[k] || 0) * (k === 'works' ? 1 : Math.pow(STEP, S.mult.works || 0));

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
  ,
  {
    key: 'labworks',
    name: 'the whole works',
    from: () => `x${mult('works').toFixed(2)}`,
    to: () => `x${(mult('works') * STEP).toFixed(2)}`,
    cost: () => Math.round(2 * Math.pow(2.1, S.mult.works)),
    currency: 'spark',
    buy: () => S.mult.works++,
    show: () => S.seenSpark
  }
];

export const LAB_SECTIONS = [
  { title: 'the work', keys: ['labswing', 'labhaul'] },
  { title: 'the ground', keys: ['labcave', 'labtend'] },
  { title: 'the sky', keys: ['labworks'] }
];

// --- the books --------------------------------------------------------------
// A rate nobody can see is a rate nobody can weigh a purchase against. These are
// smoothed, because a raw per-second count of something that arrives in lumps
// reads as noise.

// What the books watch. All of these only ever go up: a rate is what the
// operation *made*, and reading it off the balance meant a big purchase showed
// as forty thousand dust a minute of negative production.
const WATCH = ['banked', 'shards', 'spores', 'cores'];
const EASE = 0.25;                         // how fast the reading follows reality

export const rates = { banked: 0, shards: 0, spores: 0, cores: 0 };
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

const snapshot = () => ({ banked: S.banked, shards: S.shards, spores: S.spores, cores: S.cores });

// what the stats page says, in the order it says it
export function bookRows() {
  const rows = [
    ['dust a minute', Math.round(rates.banked), 'dust'],
    ['in the hole', S.stored, 'dust']
  ];
  if (S.seenShard) rows.push(['shards a minute', rates.shards.toFixed(1), 'shard']);
  if (S.seenSpore) rows.push(['spores a minute', rates.spores.toFixed(1), 'spore']);
  if (S.seenSpark) rows.push(['sparks', S.sparks, 'spark']);
  if (S.seenCore) rows.push(['rocks finished', S.boulderNo - 1, 'core']);
  rows.push(['crew', S.miners + S.haulers + S.spelunkers + S.farmhands, '']);
  return rows;
}
