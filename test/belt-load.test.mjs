// The load on the belt is a heap, not a needle.
//
// A tuned ram lands a dozen grains a frame, and the crest of what is already
// riding the band intercepts its arc, so they all come down on the one
// column. Settled once a frame, as the floor is, that column shed a grain a
// frame and grew by the other eleven: a needle standing twenty cells over
// the load beside it. The band is settled to rest after the chips have
// landed (`settleBelt` in dust.js), so the tallest step between two columns
// is the drop the repose rule allows, and no more, on every frame.

import { group, ok, openSites, buyNow } from './helpers.mjs';
import { onBelt } from '../src/dust.js';
import { band } from '../src/state.js';
import { at } from '../src/grid.js';
import { LADDER } from '../src/config.js';

// The deepest column of the band and the biggest step between neighbors,
// read off the strip itself: what is on the scoop is not standing on it yet.
function loadShape() {
  const deep = new Array(band.cols).fill(0);
  for (let c = 0; c < band.cols; c++)
    for (let r = 0; r < band.rows; r++) if (at(band, c, r)) deep[c]++;
  let tallest = 0, step = 0, col = -1;
  for (let c = 0; c < band.cols; c++) {
    tallest = Math.max(tallest, deep[c]);
    for (const n of [c - 1, c + 1]) {
      if (n < 0 || n >= band.cols) continue;
      if (deep[c] - deep[n] > step) { step = deep[c] - deep[n]; col = c; }
    }
  }
  return { tallest, step, col };
}

group('the load on the belt stands as a heap, never a needle', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(3, 3, 5, 7);
  window.__grant({ sparks: 999999, shards: 9999, spores: 9999, dust: 9999999 });
  // The lip bought out, which the belt is gated behind.
  window.__levels({ haulCarryLevel: LADDER, haulPaceLevel: LADDER });
  window.__kit({ carters: 6 });
  const ram = buyNow('ram'), belt = buyNow('belt');
  // The ram bought up its ladder the way a player does, so it lands on the
  // band at the pace that stood the needle up.
  let tuned = 0;
  for (let i = 0; i < 8; i++) if (buyNow('tuneram')) tuned++;
  window.__jump(4);
  window.__clearFloor();
  // A frame at a time, since a needle is a fact about a frame: one that
  // stood a frame and slumped is one the player saw.
  let worst = { tallest: 0, step: 0 }, most = 0;
  for (let f = 0; f < 60 * 40; f++) {
    window.__fast(1 / 60);
    const shape = loadShape();
    if (shape.step > worst.step) worst = shape;
    most = Math.max(most, onBelt());
  }
  return [
    ok(ram && belt, 'the ram and the belt were bought', `ram ${ram}, belt ${belt}`),
    ok(tuned === 8, 'the ram climbed its ladder', `${tuned} rungs`),
    ok(most > 200, 'the band carried a real load', `${most} grains at most`),
    ok(worst.step <= 2, 'no column stood more than a drop over the one beside it',
       `worst step ${worst.step} at column ${worst.col}, the deepest column ${worst.tallest}`)
  ];
});
