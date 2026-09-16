// The number the whole bet hangs on, held by a test rather than by a note.
//
// Every pebble that goes down the board is a fair draw from the bins, so a
// hand of N pebbles pays the mean of N draws, and the spread of a mean shrinks
// with the square root of N. A hundred pebbles through a fair board pay
// between 0.8 and 1.2 nearly every hand; two hundred and fifty pay one. A
// cascade worth watching and a bet worth making pull against each other, and
// the handful is where they meet: one pebble's pay has a standard deviation
// of about 1.9 on this bin table, so sixteen pay with a spread near half -- a
// typical hand comes back at half to one and a half, one hand in thirty-odd
// puts a pebble in a x39, and the median hand loses.
//
// Thousands of seeded hands of the thousand chip, dealt off the same rng the
// cascade draws its coins from, without walking them down the pegs: the mean
// within two percent of one, the standard deviation about what the handful
// sets. Held off the constant, never off the number: `CASINO_HANDFUL` is a
// knob, and what it trades is this spread.

import { group, ok } from './helpers.mjs';
import { CASINO_HANDFUL } from '../src/config.js';

const PEBBLE_SD = 1.9;
const N = 4000, stake = 1000;

group('thousands of hands of the thousand chip pay a mean of one, with the spread the handful sets', async () => {
  const mults = [];
  let edges = 0, lost = 0;
  for (let i = 0; i < N; i++) {
    const h = window.__deal(stake);
    mults.push(h.mult);
    if (h.bins[0] || h.bins[h.bins.length - 1]) edges++;
    if (h.paid < stake) lost++;
  }
  const mean = mults.reduce((a, b) => a + b, 0) / N;
  const sd = Math.sqrt(mults.reduce((a, m) => a + (m - mean) * (m - mean), 0) / N);
  const sorted = [...mults].sort((a, b) => a - b);
  const median = sorted[Math.floor(N / 2)];
  const want = PEBBLE_SD / Math.sqrt(CASINO_HANDFUL);
  // a x39 on either edge: two pebbles in a thousand and twenty-four, so a hand
  // of N has one about 1 - (1022/1024)^N of the time
  const edgeRate = 1 - Math.pow(1 - 2 / 1024, CASINO_HANDFUL);
  const first = window.__deal(stake);
  return [
    ok(first.grains === CASINO_HANDFUL, 'a hand of the thousand chip is a whole handful',
       `${first.grains} of ${CASINO_HANDFUL}`),
    ok(Math.abs(mean - 1) < 0.02, 'the mean of a hand is one, within two percent', mean.toFixed(4)),
    ok(sd > want * 0.7 && sd < want * 1.4, `and its standard deviation is about ${want.toFixed(2)}`,
       sd.toFixed(4)),
    ok(median < 1, 'the median hand loses', median.toFixed(3)),
    ok(edges / N > edgeRate * 0.6 && edges / N < edgeRate * 1.5,
       `about one hand in ${Math.round(1 / edgeRate)} puts a pebble in a x39`, `${edges} of ${N}`),
    ok(lost / N > 0.5, 'and more hands lose than win', `${lost} of ${N}`)
  ];
});

// A chip smaller than a handful is one pebble a coin: ten pebbles for the ten
// chip, each worth one, because a pebble cannot carry less than a coin.
group('a chip of ten is ten pebbles', async () => {
  const h = window.__deal(10);
  return [
    ok(h.grains === 10, 'ten pebbles go down for the ten chip', `${h.grains}`),
    ok(h.bins.reduce((a, b) => a + b, 0) === 10, 'and every one lands in a bin', h.bins.join(','))
  ];
});
