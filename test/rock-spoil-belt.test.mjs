// The rock's spoil goes over the boulder, not through it.
//
// A grain dug from the middle of the rock has the rest of the rock between
// it and its heap. Thrown on an arc sized to the distance alone it flew
// through the boulder and came down on the far flank, where the belt's tail
// lies buried under the hill and caught it: from the yard it read as the
// crew throwing dust on to the boulder.

import { group, ok, run, state, buyNow, P } from './helpers.mjs';
import { S } from '../src/state.js';
import { LADDER } from '../src/config.js';

// Tracks every grain in the air by identity, so the reload harness (which
// makes fresh ones) is kept out.
group('with the belt running, the rock\'s spoil comes down past the boulder', async () => {
  window.__reset();
  window.__crew(3, 3, 5, 7);
  window.__fullSites();
  window.__grant({ sparks: 9999, shards: 9999, spores: 9999, dust: 30000 });
  window.__levels({ haulCarryLevel: LADDER, haulPaceLevel: LADDER });
  window.__kit({ carters: 6 });
  const bought = buyNow('ram') && buyNow('belt');
  window.__jump(4);
  run(4);
  const st = state();
  const L = st.rockLeftX, R = st.rockLeftX + st.rockW;
  // Where each grain was last seen before it stopped being in the air.
  const last = new Map();
  let onRock = 0, down = 0;
  for (let fr = 0; fr < 60 * 15; fr++) {
    const live = new Set(S.chips);
    for (const [ch, [x, y]] of last) {
      if (live.has(ch)) continue;
      last.delete(ch);
      down++;
      if (x + P > L && x < R && y < S.groundY - P) onRock++;
    }
    for (const ch of S.chips) last.set(ch, [ch.x, ch.y]);
    run(1 / 60);
  }
  return [
    ok(bought, 'the ram and the belt are bought off the board'),
    ok(down > 1000, 'the rock is being worked', `${down} grains came down`),
    ok(onRock * 1000 < down, 'hardly a grain comes down on the boulder',
       `${onRock} of ${down} came down over the rock, above the ground`),
  ];
}, { reload: false });
