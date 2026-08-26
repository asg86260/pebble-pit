// The readout: one number, on the scrubbing house's board.
//
// **Pollution rate** — what the yard is putting into the sky less what the house
// is taking out, a minute. Positive and the sky is filling. Negative and it is
// emptying. That is the whole of it.
//
// It was four numbers for a while: how much is up there against the threshold,
// the fouling rate, the scrubbing rate, and a countdown to the next rain. Each of
// them was true and only one of them was a decision. How much is up there is not
// something you can act on -- you cannot spend it, move it or hold it -- and a
// countdown is worse than useless, because it invites you to wait until the
// number is small instead of dealing with the thing making it. The two rates on
// separate rows made you do the subtraction the game could do for you, and the
// answer to that subtraction is the only question anybody actually has: am I
// winning or losing.
//
// And it lives on the scrubbing house alone, not on the lab as well. The one
// thing you do about this number is put bodies in that house, and a reading you
// can act on belongs where you act on it. On two boards it was the same fact in
// two places, which is one place too many for a fact that changes every second.

import { S } from './state.js';
import { airTrend } from './smog.js';

// An arrow, and nothing else.
//
// It was a signed rate for a while and the number was never the question. Nobody
// is going to act differently on forty-two a minute than on thirty-eight; what
// anybody wants to know is whether the sky is getting worse or better, and a
// number makes you read it, compare it to the last one you remember, and work out
// the sign for yourself. The sign *is* the reading, so the sign is what it says.
//
// Averaged over the last minute, so it does not flicker. A house very nearly
// keeping up would otherwise flip the arrow every second or two, which reads as
// the game being unable to make up its mind rather than as a yard on a knife
// edge -- and a knife edge is exactly the state you most want to read calmly.
const UP = '▲', DOWN = '▼', LEVEL = '—';

// How fast, in arrows. One is a drift, two is a problem, three is a yard running
// away from you -- and the same three the other way once the house is winning.
//
// Arrows rather than the number they stand for, because the number was never the
// question: nobody acts differently on forty-two a minute than on thirty-eight.
// But there is a real difference between losing slowly and losing badly, and one
// arrow could not say it -- so the count says it, and you can read it without
// reading anything.
const STEPS = [15, 60];                 // a minute's worth, between one arrow and two

function arrows() {
  const t = airTrend() * 60;            // a minute, like every other rate here
  const size = Math.abs(t);
  if (size < 1) return LEVEL;
  const n = size < STEPS[0] ? 1 : size < STEPS[1] ? 2 : 3;
  return (t > 0 ? UP : DOWN).repeat(n);
}

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
  // Nothing happens if you press it, so it does not offer to be pressed. Every
  // other row on every board is a thing you buy and looks like one -- the cursor
  // changes, the row goes black under it -- and this one is a reading. A line
  // that lights up under the pointer and then does nothing is the board telling
  // you it is a button and then telling you it is not.
  read: true,
  dead: () => false,
  cost: () => 0,
  buy: () => {},
  show: () => S.seenAir
}];

// Handed out rather than exported as a list: the board that shows it is reached
// from files this one reads, and spliced in at load time whichever file the ring
// got to first found the other's exports still empty.
export const airRows = () => ROWS;
export const airSection = () => ({ title: 'the sky', keys: ROWS.map(r => r.key) });
