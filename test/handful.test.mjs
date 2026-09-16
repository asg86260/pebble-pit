// The number the whole design hangs on, held by a test rather than by a note.
//
// Every grain that goes down the board is a fair draw from the bins, so a pour
// of N grains pays the mean of N draws, and the spread of a mean shrinks with
// the square root of N. A hundred grains through a fair board pay between 0.8
// and 1.2 nearly every hand; two hundred and fifty pay one. A cascade worth
// watching and a bet worth making pull against each other, and the handful is
// the size where they meet: on this bin table one grain's pay has a standard
// deviation of about 1.9, so thirty-two of them pay with a spread of about a
// third -- a typical hand comes back at two-thirds or four-thirds of what went
// down, one hand in eight puts a grain in a x39, and the median hand loses.
//
// Two thousand seeded hands of the thousand chip, dealt off the same rng the
// cascade draws its coins from, without walking them down the pegs: the mean
// within two percent of one, the standard deviation between a quarter and a
// half. If `CASINO_HANDFUL` moves, this is where it shows.

import { group, ok } from './helpers.mjs';
import { CASINO_HANDFUL } from '../src/config.js';

group('two thousand hands of the thousand chip pay a mean of one with a spread of about a third', async () => {
  const N = 2000, stake = 1000;
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
  const first = window.__deal(stake);
  return [
    ok(first.grains === CASINO_HANDFUL, 'a hand of the thousand chip is a whole handful',
       `${first.grains} of ${CASINO_HANDFUL}`),
    ok(Math.abs(mean - 1) < 0.02, 'the mean of a hand is one, within two percent', mean.toFixed(4)),
    ok(sd > 0.25 && sd < 0.5, 'and its standard deviation is between a quarter and a half',
       sd.toFixed(4)),
    ok(median < 1, 'the median hand loses', median.toFixed(3)),
    ok(edges / N > 0.05 && edges / N < 0.2, 'about one hand in eight puts a grain in a x39',
       `${edges} of ${N}`),
    ok(lost / N > 0.5, 'and more hands lose than win', `${lost} of ${N}`)
  ];
});

// A chip smaller than a handful is one grain a coin: ten grains for the ten
// chip, each worth one, because a grain cannot carry less than a coin.
group('a chip of ten is ten grains', async () => {
  const h = window.__deal(10);
  return [
    ok(h.grains === 10, 'ten grains go down for the ten chip', `${h.grains}`),
    ok(h.bins.reduce((a, b) => a + b, 0) === 10, 'and every one lands in a bin', h.bins.join(','))
  ];
});
