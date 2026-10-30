// The seed basket by the forestry shack (DESIGN.md, "Act 3's grove, rebuilt",
// call 12; the owner, 2026-10-30: "a little seed basket next to the cabin
// that holds the seeds"). The acorns in it are units of the `seeds` pile
// (after/seeds.js), drawn with every other good on the ground
// (render/after/piles.js, `drawGround`), so the count is what is drawn. This
// is the basket round them, in two passes: its back before the ground's
// goods and its front after. The acorns stand four rows apart on their
// lattice, so a basket only in front of them leaves the top row up on posts
// of tips and stalks over the bottom row's caps; the inside drawn behind
// fills round those, the far rim behind the top row's tips, and the top row
// reads as heaped in the basket (AFTER_BASKET's rows). The body's weave is
// every other cell, as the voted mock's was.
import { AFTER_BASKET } from '../../config.js';
import { ctx } from '../ctx.js';
import { goodTone } from './piles.js';
import { inView } from './kit.js';
import { pileAt, pileOwner, groundOf, AP } from '../../after/place.js';
import { pileCells } from '../../after/art.js';
import { S } from '../../state.js';

const fill = (tone, x, y) => { ctx.fillStyle = tone; ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(AP), Math.ceil(AP)); };

function basket(side) {
  const key = pileOwner('seeds');
  if (!S.after || !key) return;
  const n = pileCells('seeds'), x0 = pileAt(key, 'seeds'), g = groundOf(key), { rows, tone } = AFTER_BASKET;
  if (!inView(x0 - 2 * AP, (n + 4) * AP)) return;
  rows.forEach(([lo, hi, part, at], r) => {
    if (at !== side) return;
    for (let c = lo; c < n + hi; c++) fill(goodTone('plank', part === 'body' && (c & 1) ? tone.weave : tone[part]), x0 + c * AP, g - (r + 1) * AP);
  });
}
// Behind the acorns: the basket's inside and its far rim.
export const drawBasketBack = () => basket('back');
// Over them: its near rim and body, hiding the bottom row's nuts.
export const drawBasket = () => basket('front');
