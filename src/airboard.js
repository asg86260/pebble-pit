// The readout: one number, on the air filter's board. What the yard is
// putting into the sky less what the house is taking out, a minute; the one
// question anybody has is whether they are winning or losing. It lives on
// the air filter alone, because the one thing you do about it is put
// bodies in that house.

import { S } from './state.js';
import { airTrend } from './smog.js';
import { AIR_TREND_STEPS } from './config.js';
import { arrowsFor } from './words.js';

// An arrow, and nothing else: the sign *is* the reading. Averaged over the
// last minute (`airTrend`), or a house very nearly keeping up flips it every
// second or two. One is a drift, two is a problem, three is a yard running
// away from you, and the same three the other way once the house is winning.
export const airArrows = () => arrowsFor(airTrend() * 60, AIR_TREND_STEPS);
const arrows = airArrows;

// and the same fact in a word, for the hover
function trendWord() {
  const t = airTrend() * 60;
  if (Math.abs(t) < 1) return 'holding steady';
  return t > 0 ? 'increasing' : 'decreasing';
}

const ROWS = [{
  key: 'airrate',
  name: 'pollution',
  note: trendWord,
  price: arrows,
  // A reading, not a button: it does not light up under the pointer.
  read: true,
  dead: () => false,
  cost: () => 0,
  buy: () => {},
  show: () => S.seenAir
}];

// Handed out rather than exported as a list: the board that shows it is
// reached from files this one reads, and whichever file the ring got to first
// found the other's exports still empty.
export const airRows = () => ROWS;
export const airSection = () => ({ title: 'the sky', keys: ROWS.map(r => r.key) });
