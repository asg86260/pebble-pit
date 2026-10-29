// Goods in the player's hand, across a save. Act 3's goods are swept off a
// pile and thrown as act 1's dust is (hands.js; DESIGN.md, "Act 3's goods
// are blocks, and bodies carry every one", rule 5), so a load in the hand is
// the yard's `S.held` and `S.motes`, which no save keeps -- and blocks taken
// off a pile are off its stock. So the act's saver writes a held load out as
// `S.after.hand`, and a save read back lays it on the floor where it was
// held, where a gatherer carries it home: nothing a player held is lost.
//
// `S.after.hand` is null, or { kind, n, x, y }: what was held, how many, and
// where (world px, the cursor's point). A save from before the sweep carries
// the retired grab's record (with `goods`, `from`, `held`, `put` beside
// these); it is laid the same way, whether it was on the cursor or still
// being set down on a pile.

import { S } from '../state.js';
import { P, AFTER_GOODS_FOOT, AFTER_LAY_GAP } from '../config.js';
import { layGood } from './grove.js';
import { afterX0, afterX1, AP } from './place.js';
import { heldGoods } from '../hands.js';

// The hand's load as the save writes it: act 3's goods in the hand, or null.
export function handRecord() {
  const g = heldGoods();
  if (!g || g.place !== 'after' || !S.mouse) return null;
  return { kind: g.kind, n: S.held, x: Math.round(S.mouse.x), y: Math.round(S.mouse.y) };
}

// A load let go onto the floor, each fallen from where the hand held it, a
// gap apart about the hand's point, kept inside the place as a body's
// landing is (bodies.js, AFTER_CREW `land`).
function lay(h) {
  const foot = AFTER_GOODS_FOOT[h.kind];
  if (!foot || !(h.n > 0)) return;
  const step = (foot + AFTER_LAY_GAP) * AP;
  const x0 = afterX0() + P, x1 = afterX1() - P * 2 - foot * AP;
  for (let k = 0; k < h.n; k++) {
    const x = h.x - foot * AP / 2 + (k - (h.n - 1) / 2) * step;
    layGood(h.kind, Math.max(x0, Math.min(x1, Math.round(x / P) * P)), h.y);
  }
}

// A save just read: whatever its hand held is laid on the floor.
export function settleHand() {
  const h = S.after && S.after.hand;
  if (h && Number.isFinite(h.x) && Number.isFinite(h.y)) lay(h);
  if (S.after) S.after.hand = null;
}
