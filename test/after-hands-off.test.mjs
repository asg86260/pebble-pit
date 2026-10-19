// Act 3 played with no hand on a station: a player who pops the pair's
// bubbles and buys, and leaves every tree, stump, saw and press to the
// members posted at them, still reaches the strike. The act is slower that
// way, but never stalled: every link of the chain from the grove to the
// wall can be run by posts alone, and each bill that opens one asks only
// what posts alone can bring in (DESIGN.md, "Acts 3 and 4", act 3).
//
// The player is act3-pace.mjs's own (tools/node/act3-player.mjs) at `hand: 0`:
// every row bought through `__buy`, every bubble popped through `__gesture`.
// The setup it is not about is the yard's coins a bill names, granted as the
// row is bought at a late yard's rate. The clock turns through `run`, so the
// whole act is reloaded every five seconds as well.
import { group, ok, run } from './helpers.mjs';
import { playAct3, mm } from '../tools/node/act3-player.mjs';

// A hands-off player strikes in about an hour; two and a half is a stall.
const BOUND_MIN = 150;

group('act 3 reaches the strike with no hand work, on posts alone', async () => {
  const r = playAct3({ hand: 0, minutes: BOUND_MIN, tick: run });
  const marks = r.marks.map(m => `${mm(m.t)} ${m.what}`).join('; ');
  return [
    ok(r.struck, `the strike lands inside ${BOUND_MIN} game minutes with no hand work`, marks),
    ok(Object.keys(r.handDid).length === 0, 'the hand worked nothing', JSON.stringify(r.handDid))
  ];
});
