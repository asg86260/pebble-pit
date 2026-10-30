// The seed basket by the forestry shack (DESIGN.md, "Act 3's grove, rebuilt",
// call 12; the owner, 2026-10-30: "a little seed basket next to the cabin
// that holds the seeds"). The acorns in it are units of the `seeds` pile
// (after/seeds.js), drawn with every other good on the ground
// (render/after/piles.js, `drawGround`), so the count is what is drawn. This
// is the basket over them: a woven body in timber's wood that hides the
// bottom layer up to its stalks, a lip row on top a few cells wider than the
// heap either side, and the body tapering to its foot. The top layer stands
// over the lip whole. Each cell of the weave is one of timber's tones by a
// hash of where it is, so it reads as woven, not painted.
import { AFTER_BASKET } from '../../config.js';
import { ctx } from '../ctx.js';
import { goodTone } from './piles.js';
import { inView, hash } from './kit.js';
import { pileAt, pileOwner, groundOf, AP } from '../../after/place.js';
import { pileCells } from '../../after/art.js';
import { S } from '../../state.js';

const fill = (tone, x, y) => { ctx.fillStyle = tone; ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(AP), Math.ceil(AP)); };

export function drawBasket() {
  const key = pileOwner('seeds');
  if (!S.after || !key) return;
  const n = pileCells('seeds'), w = AFTER_BASKET.wing, x0 = pileAt(key, 'seeds') - w * AP, cols = n + 2 * w;
  if (!inView(x0, cols * AP)) return;
  const top = groundOf(key) - AFTER_BASKET.rows * AP;
  for (let r = 0; r < AFTER_BASKET.rows; r++) {
    // the lip first, palest; then the body, its two tones woven; the foot a cell in each end
    const inset = r === AFTER_BASKET.rows - 1 ? 1 : 0;
    for (let c = inset; c < cols - inset; c++) {
      const tone = r === 0 ? goodTone('plank', 3) : goodTone('plank', hash((x0 / AP + c) * 7.3 + r * 3.1) < 0.5 ? 1 : 2);
      fill(tone, x0 + c * AP, top + r * AP);
    }
  }
}
