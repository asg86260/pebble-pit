// The number the whole bet hangs on, held by a test rather than by a note.
//
// Every pebble that goes down the board is a fair draw from the bins, so a
// hand of N pebbles pays the mean of N draws, and the spread of a mean shrinks
// with the square root of N. The pour's table is break-even by construction
// -- the five pebble bins pay 906 in 1,024 and the six converting bins their
// 112 by worth, 1,018 in all -- and one pebble's pay has a standard deviation
// of about 0.35 on it, so sixteen pay with a spread near a tenth.
//
// Thousands of seeded hands of a thousand pebbles, dealt off the same rng the
// cascade draws its coins from, without walking them down the pegs: the mean
// at 1,018 in 1,024 within two percent, the standard deviation about what
// the handful sets. Held off the constant, never off the number:
// `CASINO_HANDFUL` is a knob, and what it trades is this spread.

import { group, ok } from './helpers.mjs';
import { CASINO_HANDFUL, CASINO_BINS } from '../src/config.js';
import { DUST_PER } from '../src/upgrades/price.js';

const PEBBLE_SD = 0.35;
const N = 4000, stake = 1000;

// the table's own sum: Pascal's row over 1,024, every bin paying by worth
const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - i + 1) / i; return r; };
const FAIR = CASINO_BINS.reduce((sum, pay, b) => sum + choose(10, b) * (typeof pay === 'number' ? pay : 1), 0) / 1024;

group('thousands of hands of a thousand pay the table\'s sum, with the spread the handful sets', async () => {
  const mults = [];
  let converted = 0;
  for (let i = 0; i < N; i++) {
    const h = window.__deal(stake);
    mults.push(h.mult);
    if (h.pays.some(p => p.kind !== 'dust' && p.n)) converted++;
  }
  const mean = mults.reduce((a, b) => a + b, 0) / N;
  const sd = Math.sqrt(mults.reduce((a, m) => a + (m - mean) * (m - mean), 0) / N);
  const want = PEBBLE_SD / Math.sqrt(CASINO_HANDFUL);
  // a pebble in one of the six converting bins: 112 in 1,024, so a hand of N
  // has one about 1 - (912/1024)^N of the time
  const convertRate = 1 - Math.pow(912 / 1024, CASINO_HANDFUL);
  const first = window.__deal(stake);
  return [
    ok(first.grains === CASINO_HANDFUL, 'a hand of a thousand is a whole handful', `${first.grains} of ${CASINO_HANDFUL}`),
    ok(Math.abs(FAIR - 1018 / 1024) < 1e-9, 'the table sums to 1,018 in 1,024 off the config', `${FAIR * 1024}`),
    ok(Math.abs(mean - FAIR) < 0.02, `the mean of a hand is ${FAIR.toFixed(3)}, within two percent`, mean.toFixed(4)),
    ok(sd > want * 0.7 && sd < want * 1.4, `and its standard deviation is about ${want.toFixed(3)}`, sd.toFixed(4)),
    ok(converted / N > convertRate * 0.7 && converted / N < convertRate * 1.3,
       `about ${Math.round(convertRate * 100)} hands in a hundred pay in another coin`, `${converted} of ${N}`)
  ];
});

// A stake smaller than a handful is one pebble a coin: ten pebbles for ten,
// each worth one, because a pebble cannot carry less than a coin.
group('a stake of ten is ten pebbles', async () => {
  const h = window.__deal(10);
  return [
    ok(h.grains === 10, 'ten pebbles go down for a stake of ten', `${h.grains}`),
    ok(h.bins.reduce((a, b) => a + b, 0) === 10, 'and every one lands in a bin', h.bins.join(','))
  ];
});

// The converting bins' floor: a bin with anything in it pays at least one
// coin, and the pebble bins round to the whole pebble.
group('a converting bin with anything in it pays at least one coin', async () => {
  const one = window.__binPay(0, 1, 1);          // one pebble worth one, in the spark bin
  const big = window.__binPay(0, 4, 62.5);       // four pebbles of a thousand-stake hand
  const half = window.__binPay(5, 1, 1);         // one pebble worth one, in the x1/2 bin
  const none = window.__binPay(0, 0, 62.5);
  return [
    ok(one.kind === 'spark' && one.n === 1, 'one pebble in the spark bin is a spark', JSON.stringify(one)),
    ok(big.kind === 'spark' && big.n === Math.round(250 / DUST_PER.spark), 'and a share is converted by worth', JSON.stringify(big)),
    ok(half.kind === 'dust' && half.n === 1, 'a half of one pebble pays one', JSON.stringify(half)),
    ok(none.n === 0, 'and an empty bin pays nothing', JSON.stringify(none))
  ];
});
