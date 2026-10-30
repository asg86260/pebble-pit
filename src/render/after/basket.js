// The seed basket by the forestry shack (DESIGN.md, "Act 3's grove, rebuilt",
// call 12; the owner, 2026-10-30: "a little seed basket next to the cabin
// that holds the seeds"). The acorns in it are units of the `seeds` pile
// (after/seeds.js), drawn with every other good on the ground
// (render/after/piles.js, `drawGround`), so the count is what is drawn; this
// is the basket over their feet, in timber's wood: a rim row across the
// pile's width, its palest tone, and a body row under it with the darker
// shade's weave on its odd columns, a cell in at each end. The basket's own
// foot row is the ground's: the acorns rest on the floor, so only the two rows
// the mock showed over their nuts are drawn.
import { AFTER_BASKET } from '../../config.js';
import { ctx } from '../ctx.js';
import { goodTone } from './piles.js';
import { inView } from './kit.js';
import { pileAt, pileOwner, groundOf, AP } from '../../after/place.js';
import { pileCells } from '../../after/art.js';
import { S } from '../../state.js';

const fill = (tone, x, y, w, h) => { ctx.fillStyle = tone; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

export function drawBasket() {
  const key = pileOwner('seeds');
  if (!S.after || !key) return;
  const n = pileCells('seeds'), x = pileAt(key, 'seeds');
  if (!inView(x, n * AP)) return;
  const rim = goodTone('plank', 3), body = goodTone('plank', 1), weave = goodTone('plank', 2);
  const top = groundOf(key) - AFTER_BASKET.rows * AP;
  fill(rim, x, top, n * AP, AP);
  const inset = AFTER_BASKET.inset;
  fill(body, x + inset * AP, top + AP, (n - 2 * inset) * AP, AP);
  for (let c = inset + 1; c < n - inset; c += 2) fill(weave, x + c * AP, top + AP, AP, AP);
}
